"""
Investing.com Rates-Bonds Historical Data 크롤러
- 2Y/10Y Treasury 등 금리 데이터 크롤링
- Daily price data를 Economic Calendar 형식으로 변환
"""

from bs4 import BeautifulSoup
import requests
import time
import random
from typing import List, Dict, Any
from datetime import datetime

def fetch_historical_data(url: str, retries: int = 3, base_delay: float = 1.0) -> str:
    """Historical Data 페이지 HTML 가져오기"""
    # rates-bonds, commodities, indices, currencies 페이지를 Historical Data 페이지로 변환
    patterns = ["/rates-bonds/", "/commodities/", "/indices/", "/currencies/"]
    if any(pattern in url for pattern in patterns) and "-historical-data" not in url:
        url = url + "-historical-data"

    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }

    last_error = None
    for attempt in range(retries + 1):
        try:
            response = requests.get(url, headers=headers, timeout=10)
            if response.status_code == 429 and attempt < retries:
                backoff = base_delay * (2 ** attempt) + random.uniform(0.0, 0.5)
                time.sleep(backoff)
                continue
            response.raise_for_status()
            return response.text
        except requests.RequestException as e:
            last_error = e
            if attempt >= retries:
                break
            backoff = base_delay * (2 ** attempt) + random.uniform(0.0, 0.5)
            time.sleep(backoff)

    raise last_error

def parse_historical_table(html: str) -> List[Dict[str, Any]]:
    """Historical Data 테이블 파싱

    Returns:
        List of {date: str, price: float} sorted by date (newest first)
    """
    soup = BeautifulSoup(html, 'html.parser')

    # Historical Data 테이블 찾기 (2025년 구조: 여러 테이블 중 날짜 데이터가 있는 것)
    tables = soup.find_all('table')
    table = None

    # 각 테이블을 확인하여 날짜 형식("Dec 23, 2025")이 있는 것 찾기
    for t in tables:
        tbody = t.find('tbody')
        if tbody:
            rows = tbody.find_all('tr')
            if rows:
                cells = rows[0].find_all('td')
                if cells:
                    first_cell = cells[0].get_text().strip()
                    # "Dec 23, 2025" 형식 체크
                    if len(first_cell.split(',')) == 2 and '202' in first_cell:
                        table = t
                        break

    if not table:
        return []

    tbody = table.find('tbody')
    if not tbody:
        return []

    rows = tbody.find_all('tr')
    result = []

    for row in rows:
        cells = row.find_all('td')
        if len(cells) < 2:
            continue

        try:
            # Date 컬럼 (첫 번째) - "Dec 01, 2025" 형식
            date_text = cells[0].get_text().strip()
            date_obj = datetime.strptime(date_text, "%b %d, %Y")
            date_str = date_obj.strftime("%Y-%m-%d")

            # Price 컬럼 (두 번째) - "4.047" 형식
            price_text = cells[1].get_text().strip().replace(',', '')
            price = float(price_text)

            result.append({
                'date': date_str,
                'price': price
            })
        except (ValueError, IndexError):
            continue

    return result

def extract_rate_data(rows: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Daily rate data를 standard indicator format으로 변환

    Strategy (Option 1): Today vs Yesterday
    - actual: today's price
    - previous: yesterday's price
    - forecast: null (market-determined prices)
    - surprise: today - yesterday
    """
    if not rows or len(rows) < 2:
        return {"error": "Insufficient historical data"}

    # rows[0] = 최신 (today), rows[1] = 어제 (yesterday)
    today = rows[0]
    yesterday = rows[1]

    actual = today['price']
    previous = yesterday['price']
    surprise = round(actual - previous, 3)  # 소수점 3자리

    return {
        "latest_release": {
            "release_date": today['date'],
            "time": "N/A",  # 시장 데이터는 시간 없음
            "actual": actual,
            "forecast": None,  # 시장 금리는 forecast 없음
            "previous": previous
        },
        "next_release": None,  # 매일 업데이트되므로 next_release 개념 없음
        "surprise": surprise,
        "history_table": [
            {
                "release_date": row['date'],
                "time": "N/A",
                "actual": row['price'],
                "forecast": None,
                "previous": None  # history에서는 previous 계산 안함
            }
            for row in rows[:12]  # 최근 12개 (약 2주치)
        ]
    }

def crawl_rate_indicator(url: str) -> Dict[str, Any]:
    """단일 금리 지표 크롤링 (Main Entry Point)"""
    try:
        html = fetch_historical_data(url)
        rows = parse_historical_table(html)

        if not rows:
            return {"error": "No historical data found"}

        return extract_rate_data(rows)

    except requests.RequestException as e:
        return {"error": f"Network error: {str(e)}"}
    except Exception as e:
        return {"error": f"Parsing error: {str(e)}"}


if __name__ == "__main__":
    # 테스트: 10Y Treasury
    test_url = "https://www.investing.com/rates-bonds/u.s.-10-year-bond-yield"
    print(f"Testing: {test_url}")

    result = crawl_rate_indicator(test_url)

    if "error" in result:
        print(f"❌ Error: {result['error']}")
    else:
        print(f"✅ Latest: {result['latest_release']['release_date']}")
        print(f"   Actual: {result['latest_release']['actual']}%")
        print(f"   Previous: {result['latest_release']['previous']}%")
        print(f"   Surprise: {result['surprise']:+.3f}%")
        print(f"   History: {len(result['history_table'])} records")
