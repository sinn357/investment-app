import requests
from bs4 import BeautifulSoup
from datetime import datetime
from .investing_crawler import fetch_html, parse_history_table, extract_raw_data

def get_nonfarm_payrolls():
    """
    비농업 고용 (Nonfarm Payrolls) 데이터를 크롤링합니다.
    investing.com에서 비농업 고용 데이터를 가져와 표준 형식으로 반환합니다.
    """
    url = "https://www.investing.com/economic-calendar/nonfarm-payrolls-227"

    try:
        # 기존 표준 함수들을 사용하여 크롤링
        html_content = fetch_html(url)
        rows = parse_history_table(html_content)
        return extract_raw_data(rows)

    except Exception as e:
        print(f"비농업 고용 데이터 처리 중 오류 발생: {e}")
        return {"error": f"데이터 처리 실패: {str(e)}"}

def parse_nonfarm_payrolls_data(soup):
    """
    비농업 고용 페이지의 HTML을 파싱하여 최신 데이터를 추출합니다.
    """
    try:
        # 최신 발표 데이터 찾기
        actual_elem = soup.find('span', {'data-test': 'actual-value'})
        forecast_elem = soup.find('span', {'data-test': 'forecast-value'})
        previous_elem = soup.find('span', {'data-test': 'previous-value'})

        actual = actual_elem.text.strip() if actual_elem else None
        forecast = forecast_elem.text.strip() if forecast_elem else None
        previous = previous_elem.text.strip() if previous_elem else None

        # 다음 발표일 찾기
        next_release_elem = soup.find('span', {'data-test': 'next-release'})
        next_release = next_release_elem.text.strip() if next_release_elem else "미정"

        return {
            "actual": actual,
            "forecast": forecast,
            "previous": previous,
            "next_release": next_release,
            "timestamp": datetime.now().isoformat()
        }

    except Exception as e:
        print(f"비농업 고용 데이터 파싱 중 오류: {e}")
        return {"error": f"데이터 파싱 실패: {str(e)}"}

if __name__ == "__main__":
    print("비농업 고용 데이터 테스트 중...")
    result = get_nonfarm_payrolls()
    print("결과:", result)