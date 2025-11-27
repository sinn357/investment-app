from .investing_crawler import fetch_html, parse_history_table, extract_raw_data

def get_cb_consumer_confidence_data():
    """Get CB Consumer Confidence data from investing.com"""
    try:
        url = "https://www.investing.com/economic-calendar/cb-consumer-confidence-48"

        # Step 1: Fetch HTML
        html = fetch_html(url)

        # Step 2: Parse History Table
        rows = parse_history_table(html)

        # Step 3: Extract Raw Data
        raw_data = extract_raw_data(rows)

        return raw_data

    except Exception as e:
        return {"error": f"Crawling failed: {str(e)}"}