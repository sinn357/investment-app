"""
FRED (Federal Reserve Economic Data) CSV 크롤러
- Yield Curve (10Y-2Y), Real Yield (TIPS) 등 FRED 데이터 크롤링
- CSV 형식 API 활용
"""

import requests
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta

def fetch_fred_csv(series_id: str, days: int = 14) -> str:
    """FRED CSV API에서 데이터 가져오기

    Args:
        series_id: FRED 시리즈 ID (예: T10Y2Y, DFII10)
        days: 가져올 최근 일수

    Returns:
        CSV 텍스트 데이터
    """
    # 날짜 범위 계산 (최근 N일)
    end_date = datetime.now()
    start_date = end_date - timedelta(days=days)

    url = f"https://fred.stlouisfed.org/graph/fredgraph.csv"
    params = {
        'id': series_id,
        'cosd': start_date.strftime('%Y-%m-%d'),
        'coed': end_date.strftime('%Y-%m-%d')
    }

    response = requests.get(url, params=params, timeout=10)
    response.raise_for_status()
    return response.text

def parse_fred_csv(csv_text: str) -> List[Dict[str, Any]]:
    """FRED CSV 데이터 파싱

    CSV 형식:
    observation_date,T10Y2Y
    2025-11-26,0.55
    2025-11-25,0.58

    Returns:
        List of {date: str, value: float} sorted by date (newest first)
    """
    lines = csv_text.strip().split('\n')

    if len(lines) < 2:
        return []

    # 첫 줄은 헤더 (observation_date,SERIES_ID)
    header = lines[0].split(',')
    if len(header) < 2:
        return []

    result = []

    # 두 번째 줄부터 데이터
    for line in lines[1:]:
        parts = line.split(',')
        if len(parts) < 2:
            continue

        try:
            date_str = parts[0].strip()
            value_str = parts[1].strip()

            # '.' 값은 데이터 없음 표시 (FRED 관례)
            if value_str == '.':
                continue

            value = float(value_str)

            result.append({
                'date': date_str,
                'value': value
            })
        except (ValueError, IndexError):
            continue

    # 날짜 최신순 정렬
    result.sort(key=lambda x: x['date'], reverse=True)
    return result

def extract_fred_data(rows: List[Dict[str, Any]]) -> Dict[str, Any]:
    """FRED 데이터를 standard indicator format으로 변환

    Strategy (Option 1): Today vs Yesterday
    - actual: today's value
    - previous: yesterday's value
    - forecast: null (no forecast for market data)
    - surprise: today - yesterday
    """
    if not rows or len(rows) < 2:
        return {"error": "Insufficient FRED data"}

    # rows[0] = 최신 (today), rows[1] = 어제 (yesterday)
    today = rows[0]
    yesterday = rows[1]

    actual = today['value']
    previous = yesterday['value']
    surprise = round(actual - previous, 3)  # 소수점 3자리

    return {
        "latest_release": {
            "release_date": today['date'],
            "time": "N/A",  # FRED 데이터는 시간 없음
            "actual": actual,
            "forecast": None,  # FRED는 실제 관측값만 제공
            "previous": previous
        },
        "next_release": None,  # 매일 업데이트되므로 next_release 개념 없음
        "surprise": surprise,
        "history_table": [
            {
                "release_date": row['date'],
                "time": "N/A",
                "actual": row['value'],
                "forecast": None,
                "previous": None  # history에서는 previous 계산 안함
            }
            for row in rows[:12]  # 최근 12개 (약 2주치)
        ]
    }


def _find_year_ago_row(rows: List[Dict[str, Any]], index: int) -> Optional[Dict[str, Any]]:
    """주어진 인덱스의 날짜 기준으로 1년 전 데이터 찾기"""
    if index >= len(rows):
        return None

    target_date = datetime.fromisoformat(rows[index]['date']) - timedelta(days=365)
    for row in rows[index + 1:]:
        row_date = datetime.fromisoformat(row['date'])
        if row_date <= target_date:
            return row
    return None


def _extract_yoy_data(rows: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    FRED 데이터에서 전년동기 대비(%)를 계산하여 반환
    - latest_release.actual: YoY %
    - history_table.actual: 각 포인트의 YoY %
    """
    if not rows:
        return {"error": "No FRED data found"}

    # 최신 관측값 기준 YoY 계산
    year_ago_row = _find_year_ago_row(rows, 0)
    if not year_ago_row:
        return {"error": "Insufficient FRED data for YoY calculation"}

    latest = rows[0]
    try:
        yoy = round((latest['value'] - year_ago_row['value']) / year_ago_row['value'] * 100, 2)
    except ZeroDivisionError:
        return {"error": "Year-ago value is zero, cannot compute YoY"}

    # 직전 관측치 기준 YoY (previous)
    previous_yoy = None
    if len(rows) > 1:
        prev_year_ago = _find_year_ago_row(rows, 1)
        if prev_year_ago:
            try:
                previous_yoy = round((rows[1]['value'] - prev_year_ago['value']) / prev_year_ago['value'] * 100, 2)
            except ZeroDivisionError:
                previous_yoy = None

    history = []
    # 최근 12개 관측치에 대해 YoY 변환
    for i, row in enumerate(rows[:12]):
        year_ago = _find_year_ago_row(rows, i)
        if not year_ago or year_ago['value'] == 0:
            continue
        yoy_value = round((row['value'] - year_ago['value']) / year_ago['value'] * 100, 2)
        history.append({
            "release_date": row['date'],
            "time": "N/A",
            "actual": yoy_value,
            "forecast": None,
            "previous": None
        })

    return {
        "latest_release": {
            "release_date": latest['date'],
            "time": "N/A",
            "actual": yoy,
            "forecast": None,
            "previous": previous_yoy
        },
        "next_release": None,
        "surprise": None,
        "history_table": history
    }


def crawl_fred_indicator(series_id: str, calculate_yoy: bool = False) -> Dict[str, Any]:
    """FRED 지표 크롤링 (Main Entry Point)

    Args:
        series_id: FRED 시리즈 ID
            - T10Y2Y: 10년물-2년물 장단기금리차
            - DFII10: 10년물 TIPS 실질금리
        calculate_yoy: True면 전년동기 대비 %로 변환 (M2 등 레벨 데이터용)
    """
    try:
        days = 500 if calculate_yoy else 14  # YoY 계산 시 최소 1년치 이상 확보
        csv_text = fetch_fred_csv(series_id, days=days)
        rows = parse_fred_csv(csv_text)

        if not rows:
            return {"error": "No FRED data found"}

        if calculate_yoy:
            return _extract_yoy_data(rows)

        return extract_fred_data(rows)

    except requests.RequestException as e:
        return {"error": f"FRED API error: {str(e)}"}
    except Exception as e:
        return {"error": f"FRED parsing error: {str(e)}"}


if __name__ == "__main__":
    # 테스트: Yield Curve (10Y-2Y)
    print("Testing Yield Curve (10Y-2Y)...")
    result = crawl_fred_indicator("T10Y2Y")

    if "error" in result:
        print(f"❌ Error: {result['error']}")
    else:
        print(f"✅ Latest: {result['latest_release']['release_date']}")
        print(f"   Actual: {result['latest_release']['actual']:.3f}%")
        print(f"   Previous: {result['latest_release']['previous']:.3f}%")
        print(f"   Surprise: {result['surprise']:+.3f}%")
        print(f"   History: {len(result['history_table'])} records")

    print("\n" + "="*50 + "\n")

    # 테스트: Real Yield (TIPS)
    print("Testing Real Yield (TIPS)...")
    result = crawl_fred_indicator("DFII10")

    if "error" in result:
        print(f"❌ Error: {result['error']}")
    else:
        print(f"✅ Latest: {result['latest_release']['release_date']}")
        print(f"   Actual: {result['latest_release']['actual']:.3f}%")
        print(f"   Previous: {result['latest_release']['previous']:.3f}%")
        print(f"   Surprise: {result['surprise']:+.3f}%")
        print(f"   History: {len(result['history_table'])} records")
