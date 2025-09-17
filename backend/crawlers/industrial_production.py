from .investing_crawler import fetch_html, parse_history_table, extract_raw_data
from datetime import datetime

def get_industrial_production():
    """Get Industrial Production data from investing.com"""
    try:
        url = "https://www.investing.com/economic-calendar/industrial-production-161"

        # Step 1: Fetch HTML
        html = fetch_html(url)

        # Step 2: Parse History Table
        rows = parse_history_table(html)

        # Step 3: Extract Raw Data with custom next release calculation
        if not rows:
            return {"error": "No data found"}

        # 가장 최신 데이터
        latest = rows[0]

        # 다음 발표일이 없는 경우 "미정"으로 표시
        next_release = {
            "release_date": "미정",
            "time": "미정",
            "forecast": None,
            "previous": latest.get('actual')
        }

        raw_data = {
            "latest_release": latest,
            "next_release": next_release,
            "timestamp": datetime.now().isoformat()
        }

        return raw_data

    except Exception as e:
        return {"error": f"Crawling failed: {str(e)}"}