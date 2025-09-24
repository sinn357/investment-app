"""
Participation Rate 크롤링 모듈

investing.com에서 Participation Rate 데이터를 크롤링하는 함수들을 포함합니다.
"""

from .investing_crawler import fetch_html, parse_history_table, extract_raw_data

def get_participation_rate():
    """
    Participation Rate 데이터를 크롤링합니다.
    investing.com에서 Participation Rate 데이터를 가져와 표준 형식으로 반환합니다.
    """
    url = "https://www.investing.com/economic-calendar/participation-rate-1581"

    try:
        # 기존 표준 함수들을 사용하여 크롤링
        html_content = fetch_html(url)
        rows = parse_history_table(html_content)
        return extract_raw_data(rows)

    except Exception as e:
        print(f"Participation Rate 데이터 처리 중 오류 발생: {e}")
        return {"error": f"데이터 처리 실패: {str(e)}"}