import requests
import time
import random
from bs4 import BeautifulSoup
import re
from datetime import datetime
from typing import Dict, Optional, Any, List

USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:122.0) Gecko/20100101 Firefox/122.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36 Edg/121.0.0.0',
]

def fetch_html(url: str, retries: int = 3, base_delay: float = 2.0) -> str:
    """
    Fetch HTML content from the given URL with retry/backoff and realistic browser headers.
    """
    headers = {
        'User-Agent': random.choice(USER_AGENTS),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Cache-Control': 'max-age=0',
        'Referer': 'https://www.google.com/',
    }

    last_error = None
    for attempt in range(retries + 1):
        try:
            # Add random delay between requests to avoid rate limiting
            if attempt > 0:
                time.sleep(random.uniform(1.0, 3.0))

            response = requests.get(url, headers=headers, timeout=15)
            if response.status_code == 429 and attempt < retries:
                backoff = base_delay * (2 ** attempt) + random.uniform(1.0, 3.0)
                time.sleep(backoff)
                continue
            if response.status_code == 403 and attempt < retries:
                # Try with different User-Agent on 403
                headers['User-Agent'] = random.choice(USER_AGENTS)
                backoff = base_delay * (2 ** attempt) + random.uniform(2.0, 5.0)
                time.sleep(backoff)
                continue
            response.raise_for_status()
            return response.text
        except requests.RequestException as e:
            last_error = e
            if attempt >= retries:
                break
            backoff = base_delay * (2 ** attempt) + random.uniform(1.0, 3.0)
            time.sleep(backoff)

    raise last_error

def parse_history_table(html: str) -> List[Dict[str, Any]]:
    """
    Parse History Table from HTML and extract rows with Release Date, Time, Actual, Forecast, Previous
    """
    soup = BeautifulSoup(html, 'html.parser')

    # Find the history table - look for table with economic data
    table = None
    possible_tables = soup.find_all('table')

    for t in possible_tables:
        # Check if table contains headers like "Release Date", "Actual", etc.
        headers = t.find_all(['th', 'td'])
        header_text = ' '.join([h.get_text().strip() for h in headers[:5]])
        if any(keyword in header_text.lower() for keyword in ['release', 'actual', 'forecast', 'previous']):
            table = t
            break

    if not table:
        raise ValueError("History table not found")

    # Extract table rows
    rows = table.find_all('tr')[1:]  # Skip header row
    parsed_rows = []

    for row in rows:
        cells = row.find_all(['td', 'th'])
        if len(cells) < 5:
            continue

        # Extract and parse data from cells
        release_date = parse_date(cells[0].get_text().strip())
        time = cells[1].get_text().strip()
        actual = parse_numeric_value(cells[2].get_text().strip())
        forecast = parse_numeric_value(cells[3].get_text().strip())
        previous = parse_numeric_value(cells[4].get_text().strip())

        if release_date:  # Only include rows with valid dates
            parsed_rows.append({
                "release_date": release_date,
                "time": time,
                "actual": actual,
                "forecast": forecast,
                "previous": previous
            })

    return parsed_rows

def parse_date(date_str: str) -> Optional[str]:
    """Parse date string like 'Oct 01, 2025 (Sep)' to '2025-10-01'"""
    try:
        # Extract the main date part before parentheses
        main_date = date_str.split('(')[0].strip()
        # Parse and convert to ISO format
        date_obj = datetime.strptime(main_date, '%b %d, %Y')
        return date_obj.strftime('%Y-%m-%d')
    except:
        return None

def parse_numeric_value(value_str: str):
    """Parse numeric value from string, keep % symbol if present"""
    if not value_str or value_str.strip() == '':
        return None

    value_str = value_str.strip()

    # If value contains % or K, return as string with the symbol
    if '%' in value_str or 'K' in value_str:
        return value_str

    try:
        # Remove any non-numeric characters except decimal point and minus
        cleaned = re.sub(r'[^\d.-]', '', value_str)
        return float(cleaned) if cleaned else None
    except:
        return None

def extract_raw_data(rows: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Extract latest_release and next_release from parsed table rows
    latest_release = most recent row with actual value
    next_release = most recent row without actual value
    """
    latest_release = None
    next_release = None

    for row in rows:
        # If actual value exists, this is a past release
        if row["actual"] is not None and latest_release is None:
            latest_release = row

        # If actual value is None/empty, this might be a future release
        elif row["actual"] is None and next_release is None:
            next_release = {
                "release_date": row["release_date"],
                "time": row["time"],
                "forecast": row["forecast"],
                "previous": row["previous"]
            }

        # Stop if we have both
        if latest_release and next_release:
            break

    if latest_release is None:
        return {"error": "No release data found"}

    # If no next release found, set it to "미정"
    if next_release is None:
        next_release = {
            "release_date": "미정",
            "time": "미정",
            "forecast": None,
            "previous": latest_release.get("actual")
        }

    # 히스토리 데이터 추가 (최근 12개 레코드, actual 값이 있는 것만)
    history_table = []
    for row in rows:
        if row["actual"] is not None:
            history_table.append({
                "release_date": row["release_date"],
                "time": row["time"],
                "actual": row["actual"],
                "forecast": row["forecast"],
                "previous": row["previous"]
            })
            if len(history_table) >= 12:
                break

    return {
        "latest_release": latest_release,
        "next_release": next_release,
        "history_table": history_table,
        "timestamp": datetime.now().isoformat()
    }

def get_ism_manufacturing_pmi() -> Dict[str, Any]:
    """
    Get ISM Manufacturing PMI data from investing.com
    Main function that orchestrates the crawling process
    """
    try:
        url = "https://www.investing.com/economic-calendar/ism-manufacturing-pmi-173"

        # Step 1: Fetch HTML
        html = fetch_html(url)

        # Step 2: Parse History Table
        rows = parse_history_table(html)

        # Step 3: Extract Raw Data
        raw_data = extract_raw_data(rows)

        return raw_data

    except Exception as e:
        return {"error": f"Crawling failed: {str(e)}"}
