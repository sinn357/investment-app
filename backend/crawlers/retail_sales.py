from .investing_crawler import fetch_html, parse_history_table, extract_raw_data

def get_retail_sales_data():
    """
    Retail Sales MoM 데이터를 크롤링합니다.
    URL: https://www.investing.com/economic-calendar/retail-sales-256
    """
    url = "https://www.investing.com/economic-calendar/retail-sales-256"

    try:
        # HTML 가져오기
        html_content = fetch_html(url)
        if not html_content:
            return None

        # History Table 파싱
        history_data = parse_history_table(html_content)
        if not history_data:
            return None

        # Raw Data 추출 (latest_release, next_release)
        raw_data = extract_raw_data(history_data, "Retail Sales MoM")

        return raw_data

    except Exception as e:
        print(f"Error fetching Retail Sales MoM data: {e}")
        return None