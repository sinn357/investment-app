"""
FRED (Federal Reserve Economic Data) CSV 크롤러
- Yield Curve (10Y-2Y), Real Yield (TIPS) 등 FRED 데이터 크롤링
- CSV 형식 API 활용
"""

import requests
from typing import List, Dict, Any
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

def crawl_fred_indicator(series_id: str) -> Dict[str, Any]:
    """FRED 지표 크롤링 (Main Entry Point)

    Args:
        series_id: FRED 시리즈 ID
            - T10Y2Y: 10년물-2년물 장단기금리차
            - DFII10: 10년물 TIPS 실질금리
    """
    try:
        csv_text = fetch_fred_csv(series_id, days=14)
        rows = parse_fred_csv(csv_text)

        if not rows:
            return {"error": "No FRED data found"}

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
