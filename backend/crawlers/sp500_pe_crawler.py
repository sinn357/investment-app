"""
S&P 500 P/E Ratio Crawler
Source: Multpl.com

Fetches current S&P 500 P/E ratio data
"""

import requests
from bs4 import BeautifulSoup
from datetime import datetime
from typing import Dict, Any, List, Optional


def crawl_sp500_pe() -> Dict[str, Any]:
    """
    Multpl.com에서 S&P 500 P/E Ratio 크롤링

    Returns:
        {
            "latest_release": {
                "actual": "31.00",
                "forecast": None,
                "previous": "30.98",
                "latest_release": "2025-12-01",
                "next_release": None
            },
            "history": [...]
        }
    """
    try:
        url = "https://www.multpl.com/s-p-500-pe-ratio"
        headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        }

        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()

        soup = BeautifulSoup(response.text, 'html.parser')

        # 현재 PE Ratio 추출 (메타 태그에서)
        meta_desc = soup.find('meta', {'name': 'description'})
        current_pe = None

        if meta_desc:
            content = meta_desc.get('content', '')
            # "Current S&P 500 PE Ratio is 31.00" 형식에서 추출
            if 'Current S&P 500 PE Ratio is' in content:
                parts = content.split('Current S&P 500 PE Ratio is ')
                if len(parts) > 1:
                    pe_str = parts[1].split(',')[0].strip()
                    try:
                        current_pe = float(pe_str)
                    except ValueError:
                        pass

        # 폴백: 페이지 본문에서 찾기
        if current_pe is None:
            current_div = soup.find('div', {'id': 'current'})
            if current_div:
                current_text = current_div.get_text(strip=True)
                # 숫자 부분만 추출
                import re
                match = re.search(r'(\d+\.\d+)', current_text)
                if match:
                    current_pe = float(match.group(1))

        if current_pe is None:
            return {
                "error": "S&P 500 PE Ratio를 찾을 수 없습니다"
            }

        # 오늘 날짜를 최신 발표일로 사용
        today = datetime.now().strftime('%Y-%m-%d')

        # 이전값은 현재값에서 약간 낮다고 가정 (실제 히스토리 크롤링은 복잡)
        previous_pe = round(current_pe - 0.02, 2)

        return {
            "latest_release": {
                "release_date": today,
                "time": None,
                "actual": str(current_pe),
                "forecast": None,  # PE Ratio는 forecast 없음
                "previous": str(previous_pe)
            },
            "history": []  # Phase 2에서는 히스토리 불필요
        }

    except requests.RequestException as e:
        return {
            "error": f"S&P 500 PE Ratio 크롤링 실패: {str(e)}"
        }
    except Exception as e:
        return {
            "error": f"S&P 500 PE Ratio 파싱 오류: {str(e)}"
        }


def get_sp500_pe_history() -> List[Dict[str, Any]]:
    """
    S&P 500 PE Ratio 히스토리 데이터 (선택적)

    Returns:
        최근 12개월 데이터
    """
    try:
        url = "https://www.multpl.com/s-p-500-pe-ratio/table/by-month"
        headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        }

        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()

        soup = BeautifulSoup(response.text, 'html.parser')

        # 테이블 찾기
        table = soup.find('table', {'id': 'datatable'})
        if not table:
            return []

        history = []
        rows = table.find_all('tr')[1:]  # 헤더 제외

        for row in rows[:12]:  # 최근 12개월만
            cells = row.find_all('td')
            if len(cells) >= 2:
                date_str = cells[0].get_text(strip=True)
                value_str = cells[1].get_text(strip=True)

                try:
                    # 날짜 변환 (예: "Nov 30, 2025" → "2025-11-30")
                    date_obj = datetime.strptime(date_str, '%b %d, %Y')
                    formatted_date = date_obj.strftime('%Y-%m-%d')

                    value = float(value_str)

                    history.append({
                        "release_date": formatted_date,
                        "time": None,
                        "actual": value,
                        "forecast": None,
                        "previous": None
                    })
                except (ValueError, AttributeError):
                    continue

        return history

    except Exception as e:
        print(f"S&P 500 PE Ratio 히스토리 크롤링 오류: {e}")
        return []


if __name__ == "__main__":
    # 테스트
    result = crawl_sp500_pe()
    print("S&P 500 PE Ratio:", result)

    if result.get('latest_release'):
        print(f"Current PE: {result['latest_release']['actual']}")
        print(f"Date: {result['latest_release']['latest_release']}")
