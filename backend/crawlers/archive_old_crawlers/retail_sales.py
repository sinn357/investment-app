from .investing_crawler import fetch_html, parse_history_table, extract_raw_data

def get_retail_sales_data():
    """Get Retail Sales MoM data from investing.com"""
    try:
        url = "https://www.investing.com/economic-calendar/retail-sales-256"

        # Step 1: Fetch HTML
        html = fetch_html(url)

        # Step 2: Parse History Table
        rows = parse_history_table(html)

        # Step 3: Extract Raw Data
        raw_data = extract_raw_data(rows)

        return raw_data

    except Exception as e:
        return {"error": f"Crawling failed: {str(e)}"}