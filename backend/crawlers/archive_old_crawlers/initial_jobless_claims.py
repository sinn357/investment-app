"""
Initial Jobless Claims 크롤링 모듈

investing.com에서 Initial Jobless Claims 데이터를 크롤링하는 함수들을 포함합니다.
"""

from .investing_crawler import fetch_html, parse_history_table, extract_raw_data

def get_initial_jobless_claims():
    """
    Initial Jobless Claims 데이터를 크롤링합니다.
    investing.com에서 Initial Jobless Claims 데이터를 가져와 표준 형식으로 반환합니다.
    """
    url = "https://www.investing.com/economic-calendar/initial-jobless-claims-294"

    try:
        # 기존 표준 함수들을 사용하여 크롤링
        html_content = fetch_html(url)
        rows = parse_history_table(html_content)
        return extract_raw_data(rows)

    except Exception as e:
        print(f"Initial Jobless Claims 데이터 처리 중 오류 발생: {e}")
        return {"error": f"데이터 처리 실패: {str(e)}"}