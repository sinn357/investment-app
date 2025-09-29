import requests
from bs4 import BeautifulSoup
from datetime import datetime
from .investing_crawler import fetch_html, parse_history_table, extract_raw_data

def get_ten_year_treasury():
    """
    10년 국채수익률 (10-Year Treasury Yield) 데이터를 크롤링합니다.
    investing.com에서 10년 국채수익률 데이터를 가져와 표준 형식으로 반환합니다.
    """
    url = "https://www.investing.com/economic-calendar/10-year-treasury-auction-90"

    try:
        # 기존 표준 함수들을 사용하여 크롤링
        html_content = fetch_html(url)
        rows = parse_history_table(html_content)
        return extract_raw_data(rows)

    except Exception as e:
        print(f"10년 국채수익률 데이터 처리 중 오류 발생: {e}")
        return {"error": f"데이터 처리 실패: {str(e)}"}

if __name__ == "__main__":
    print("10년 국채수익률 데이터 테스트 중...")
    result = get_ten_year_treasury()
    print("결과:", result)