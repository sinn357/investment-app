from .investing_crawler import fetch_html, parse_history_table, extract_raw_data

def get_sp_global_composite_pmi():
    """Get S&P Global Composite PMI data from investing.com"""
    try:
        url = "https://www.investing.com/economic-calendar/s-p-global-composite-pmi-1492"

        # Step 1: Fetch HTML
        html = fetch_html(url)

        # Step 2: Parse History Table
        rows = parse_history_table(html)

        # Step 3: Extract Raw Data
        raw_data = extract_raw_data(rows)

        return raw_data

    except Exception as e:
        return {"error": f"Crawling failed: {str(e)}"}