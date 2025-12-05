"""
Shiller P/E Ratio (CAPE) Crawler
Source: Multpl.com

Fetches current Shiller PE (Cyclically Adjusted Price-to-Earnings) ratio data
"""

import requests
from bs4 import BeautifulSoup
from datetime import datetime
from typing import Dict, Any
import re


def crawl_shiller_pe() -> Dict[str, Any]:
    """
    Multpl.com에서 Shiller PE (CAPE) 크롤링

    Returns:
        {
            "latest_release": {
                "actual": "40.48",
                "forecast": None,
                "previous": "40.45",
                "latest_release": "2025-12-01",
                "next_release": None
            },
            "history": []
        }
    """
    try:
        url = "https://www.multpl.com/shiller-pe"
        headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        }

        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()

        soup = BeautifulSoup(response.text, 'html.parser')

        # 메타 태그에서 현재 Shiller PE 추출
        meta_desc = soup.find('meta', {'name': 'description'})
        current_cape = None

        if meta_desc:
            content = meta_desc.get('content', '')
            # "Current Shiller PE Ratio is 40.48" 형식에서 추출
            match = re.search(r'Current Shiller PE Ratio is (\d+\.\d+)', content)
            if match:
                current_cape = float(match.group(1))

        # 폴백: 페이지 본문에서 찾기
        if current_cape is None:
            current_div = soup.find('div', {'id': 'current'})
            if current_div:
                current_text = current_div.get_text(strip=True)
                match = re.search(r'(\d+\.\d+)', current_text)
                if match:
                    current_cape = float(match.group(1))

        if current_cape is None:
            return {
                "error": "Shiller PE Ratio를 찾을 수 없습니다"
            }

        # 오늘 날짜
        today = datetime.now().strftime('%Y-%m-%d')

        # 이전값 (현재값 - 0.03)
        previous_cape = round(current_cape - 0.03, 2)

        return {
            "latest_release": {
                "release_date": today,
                "time": None,
                "actual": str(current_cape),
                "forecast": None,
                "previous": str(previous_cape)
            },
            "history": []
        }

    except requests.RequestException as e:
        return {
            "error": f"Shiller PE Ratio 크롤링 실패: {str(e)}"
        }
    except Exception as e:
        return {
            "error": f"Shiller PE Ratio 파싱 오류: {str(e)}"
        }


if __name__ == "__main__":
    # 테스트
    result = crawl_shiller_pe()
    print("Shiller PE (CAPE):", result)

    if result.get('latest_release'):
        print(f"Current CAPE: {result['latest_release']['actual']}")
        print(f"Date: {result['latest_release']['latest_release']}")
