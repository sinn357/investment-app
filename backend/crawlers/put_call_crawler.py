"""
CBOE Put/Call Ratio Crawler
Source: Fallback (API 키 없이 임시 데이터)

Phase 2: 폴백 버전 (1.0 중립값 사용)
Phase 3: CBOE API 키 또는 AlphaVantage 연동 예정
"""

from datetime import datetime
from typing import Dict, Any


def crawl_put_call_ratio() -> Dict[str, Any]:
    """
    Put/Call Ratio 크롤링 (Phase 2: 폴백 버전)

    실제 Put/Call Ratio는 0.7-1.3 범위에서 움직임
    - 0.7 미만: 극단적 강세 (위험)
    - 0.7-1.0: 강세
    - 1.0: 중립
    - 1.0-1.3: 약세 (기회)
    - 1.3 이상: 극단적 약세 (바닥 근접)

    Phase 2에서는 중립값 1.0을 사용
    Phase 3에서 실제 API 연동 예정

    Returns:
        {
            "latest_release": {
                "actual": "1.00",
                "forecast": None,
                "previous": "1.02",
                "latest_release": "2025-12-05",
                "next_release": None
            },
            "history": []
        }
    """
    # Phase 2: 폴백 중립값
    # TODO Phase 3: CBOE API 연동 또는 AlphaVantage
    # https://www.alphavantage.co/documentation/#market-sentiment

    today = datetime.now().strftime('%Y-%m-%d')

    # 중립값 1.0 (강세도 약세도 아님)
    current_pcr = 1.00
    previous_pcr = 1.02

    return {
        "latest_release": {
            "actual": str(current_pcr),
            "forecast": None,
            "previous": str(previous_pcr),
            "latest_release": today,
            "next_release": None
        },
        "history": [],
        "note": "Phase 2: Fallback value (neutral). Phase 3: CBOE API integration planned."
    }


if __name__ == "__main__":
    # 테스트
    result = crawl_put_call_ratio()
    print("Put/Call Ratio:", result)

    if result.get('latest_release'):
        print(f"Current P/C: {result['latest_release']['actual']}")
        print(f"Date: {result['latest_release']['latest_release']}")
        if result.get('note'):
            print(f"Note: {result['note']}")
