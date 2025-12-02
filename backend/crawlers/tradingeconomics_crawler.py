"""
TradingEconomics 크롤러
- Terms of Trade 등 TradingEconomics 독점 지표 크롤링
- 표준 테이블 구조 파싱
"""

from bs4 import BeautifulSoup
import requests
from typing import Dict, Any, List
from datetime import datetime

def fetch_tradingeconomics_page(url: str) -> str:
    """TradingEconomics 페이지 HTML 가져오기"""
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
    }

    response = requests.get(url, headers=headers, timeout=10)
    response.raise_for_status()
    return response.text

def parse_main_table(html: str) -> Dict[str, Any]:
    """메인 통계 테이블 파싱

    테이블 구조:
    ['', 'Actual', 'Previous', 'Highest', 'Lowest', 'Dates', 'Unit', 'Frequency', '']
    ['', '109.04', '108.60', '165.48', '89.99', '1967 - 2025', 'points', 'Quarterly', 'Constant Prices, SA']

    Returns:
        Dict with latest_release data
    """
    soup = BeautifulSoup(html, 'html.parser')

    # 메인 통계 테이블 찾기 (보통 두 번째 테이블)
    tables = soup.find_all('table')

    if len(tables) < 2:
        return {"error": "Main statistics table not found"}

    main_table = tables[1]  # 두 번째 테이블이 메인 통계
    rows = main_table.find_all('tr')

    if len(rows) < 2:
        return {"error": "Insufficient table rows"}

    # 헤더 파싱
    header_cells = rows[0].find_all(['th', 'td'])
    headers = [cell.get_text().strip() for cell in header_cells]

    # 데이터 파싱
    data_cells = rows[1].find_all(['th', 'td'])
    data = [cell.get_text().strip() for cell in data_cells]

    # 데이터 매핑
    try:
        actual_idx = headers.index('Actual')
        previous_idx = headers.index('Previous')
        unit_idx = headers.index('Unit')
        frequency_idx = headers.index('Frequency')

        actual_str = data[actual_idx]
        previous_str = data[previous_idx]
        unit = data[unit_idx]
        frequency = data[frequency_idx]

        # 숫자 파싱
        actual = float(actual_str.replace(',', ''))
        previous = float(previous_str.replace(',', ''))

        return {
            "actual": actual,
            "previous": previous,
            "unit": unit,
            "frequency": frequency
        }
    except (ValueError, IndexError) as e:
        return {"error": f"Parsing error: {str(e)}"}

def extract_tradingeconomics_data(html: str) -> Dict[str, Any]:
    """TradingEconomics 데이터를 standard indicator format으로 변환

    Strategy: Latest vs Previous
    - actual: latest value
    - previous: previous period value
    - forecast: null (TradingEconomics는 forecast 제공 안함)
    - surprise: actual - previous
    """
    main_data = parse_main_table(html)

    if "error" in main_data:
        return main_data

    actual = main_data['actual']
    previous = main_data['previous']
    surprise = round(actual - previous, 2)

    # 현재 날짜를 release_date로 사용 (TradingEconomics는 정확한 날짜 제공 안함)
    today = datetime.now().strftime("%Y-%m-%d")

    return {
        "latest_release": {
            "release_date": today,
            "time": "N/A",
            "actual": actual,
            "forecast": None,
            "previous": previous
        },
        "next_release": None,
        "surprise": surprise,
        "unit": main_data['unit'],
        "frequency": main_data['frequency'],
        "history_table": []  # TradingEconomics는 별도 historical data API 필요
    }

def crawl_tradingeconomics_indicator(url: str) -> Dict[str, Any]:
    """단일 TradingEconomics 지표 크롤링 (Main Entry Point)"""
    try:
        html = fetch_tradingeconomics_page(url)
        return extract_tradingeconomics_data(html)

    except requests.RequestException as e:
        return {"error": f"Network error: {str(e)}"}
    except Exception as e:
        return {"error": f"Parsing error: {str(e)}"}


if __name__ == "__main__":
    # 테스트: Terms of Trade
    test_url = "https://tradingeconomics.com/united-states/terms-of-trade"
    print(f"Testing: {test_url}")

    result = crawl_tradingeconomics_indicator(test_url)

    if "error" in result:
        print(f"❌ Error: {result['error']}")
    else:
        print(f"✅ Success!")
        print(f"   Actual: {result['latest_release']['actual']} {result.get('unit', '')}")
        print(f"   Previous: {result['latest_release']['previous']}")
        print(f"   Surprise: {result['surprise']:+.2f}")
        print(f"   Frequency: {result.get('frequency', 'N/A')}")
