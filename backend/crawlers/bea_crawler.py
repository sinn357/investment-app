"""
BEA (Bureau of Economic Analysis) API 크롤러
- Current Account Balance 등 국제수지 데이터 크롤링
- JSON 형식 API 활용
"""

import requests
import os
from typing import List, Dict, Any
from datetime import datetime

def get_bea_api_key() -> str:
    """환경변수에서 BEA API 키 가져오기

    Returns:
        BEA API 키 문자열

    Raises:
        ValueError: API 키가 설정되지 않은 경우
    """
    api_key = os.getenv('BEA_API_KEY')
    if not api_key:
        raise ValueError("BEA_API_KEY not found in environment variables. Please sign up at https://apps.bea.gov/API/signup/")
    return api_key

def fetch_bea_data(indicator: str, frequency: str = "Q", year: str = "ALL") -> Dict[str, Any]:
    """BEA API에서 데이터 가져오기

    Args:
        indicator: BEA 지표 코드 (예: "BalCurAct" for Current Account Balance)
        frequency: 데이터 빈도 ("Q" = Quarterly, "A" = Annual)
        year: 데이터 연도 ("ALL" 또는 특정 연도)

    Returns:
        JSON 응답 데이터
    """
    api_key = get_bea_api_key()

    url = "https://apps.bea.gov/api/data"
    params = {
        'UserID': api_key,
        'method': 'GetData',
        'datasetname': 'ITA',  # International Transactions Accounts
        'Indicator': indicator,
        'AreaOrCountry': 'AllCountries',  # 전체 국가 합계
        'Frequency': frequency,
        'Year': year,
        'ResultFormat': 'JSON'
    }

    response = requests.get(url, params=params, timeout=15)
    response.raise_for_status()
    return response.json()

def parse_bea_response(json_data: Dict[str, Any]) -> List[Dict[str, Any]]:
    """BEA API JSON 응답 파싱

    BEA JSON 구조:
    {
        "BEAAPI": {
            "Results": {
                "Data": [
                    {
                        "Indicator": "BalCurAct",
                        "AreaOrCountry": "AllCountries",
                        "Frequency": "Q",
                        "TimeLabel": "2025Q2",
                        "DataValue": "-251300"
                    },
                    ...
                ]
            }
        }
    }

    Returns:
        List of {period: str, value: float} sorted by period (newest first)
    """
    try:
        results = json_data.get('BEAAPI', {}).get('Results', {})
        data_list = results.get('Data', [])

        if not data_list:
            return []

        parsed = []

        for item in data_list:
            try:
                period = item.get('TimeLabel', '')  # "2025Q2"
                value_str = item.get('DataValue', '')

                # BEA는 천 단위로 제공 (예: "-251300" = -251.3B)
                # 백만 단위로 변환 (M)
                if value_str and value_str != '...':
                    value = float(value_str)

                    parsed.append({
                        'period': period,
                        'value': value
                    })
            except (ValueError, TypeError):
                continue

        # 최신순 정렬 (2025Q2, 2025Q1, 2024Q4, ...)
        parsed.sort(key=lambda x: x['period'], reverse=True)
        return parsed

    except Exception as e:
        print(f"BEA parsing error: {e}")
        return []

def convert_period_to_date(period: str) -> str:
    """BEA 기간 표기를 날짜로 변환

    Args:
        period: "2025Q2" 형식

    Returns:
        "2025-06-30" 형식 (분기 마지막 날)
    """
    try:
        year = period[:4]
        quarter = period[-1]

        quarter_end = {
            '1': '03-31',
            '2': '06-30',
            '3': '09-30',
            '4': '12-31'
        }

        return f"{year}-{quarter_end.get(quarter, '12-31')}"
    except:
        return period

def extract_bea_data(rows: List[Dict[str, Any]]) -> Dict[str, Any]:
    """BEA 데이터를 standard indicator format으로 변환

    Strategy: Current vs Previous Quarter
    - actual: current quarter value
    - previous: previous quarter value
    - forecast: null (BEA는 실제 데이터만 제공)
    - surprise: current - previous
    """
    if not rows or len(rows) < 2:
        return {"error": "Insufficient BEA data"}

    # rows[0] = 최신 분기, rows[1] = 이전 분기
    current = rows[0]
    previous_q = rows[1]

    actual = current['value']
    previous = previous_q['value']
    surprise = round(actual - previous, 0)  # 백만 단위이므로 정수

    release_date = convert_period_to_date(current['period'])

    return {
        "latest_release": {
            "release_date": release_date,
            "time": "N/A",  # BEA 데이터는 시간 없음
            "actual": f"{actual:,.0f}M",  # 백만 단위 표시
            "forecast": None,
            "previous": f"{previous:,.0f}M"
        },
        "next_release": None,  # 분기별 발표이므로 정확한 날짜 불확실
        "surprise": f"{surprise:+,.0f}M",
        "history_table": [
            {
                "release_date": convert_period_to_date(row['period']),
                "time": "N/A",
                "actual": f"{row['value']:,.0f}M",
                "forecast": None,
                "previous": None
            }
            for row in rows[:8]  # 최근 8분기 (2년치)
        ]
    }

def crawl_bea_indicator(indicator: str, frequency: str = "Q") -> Dict[str, Any]:
    """BEA 지표 크롤링 (Main Entry Point)

    Args:
        indicator: BEA 지표 코드
            - BalCurAct: Current Account Balance (경상수지)
        frequency: "Q" (Quarterly) 또는 "A" (Annual)
    """
    try:
        json_data = fetch_bea_data(indicator, frequency=frequency)
        rows = parse_bea_response(json_data)

        if not rows:
            return {"error": "No BEA data found"}

        return extract_bea_data(rows)

    except ValueError as e:
        return {"error": str(e)}
    except requests.RequestException as e:
        return {"error": f"BEA API error: {str(e)}"}
    except Exception as e:
        return {"error": f"BEA crawling error: {str(e)}"}


if __name__ == "__main__":
    # 테스트: Current Account Balance
    print("Testing Current Account Balance...")
    result = crawl_bea_indicator("BalCurAct")

    if "error" in result:
        print(f"❌ Error: {result['error']}")
    else:
        print(f"✅ Latest: {result['latest_release']['release_date']}")
        print(f"   Actual: {result['latest_release']['actual']}")
        print(f"   Previous: {result['latest_release']['previous']}")
        print(f"   Surprise: {result['surprise']}")
        print(f"   History: {len(result['history_table'])} records")
