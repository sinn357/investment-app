"""
통합 경제지표 크롤러
- indicators_config.py의 설정을 기반으로 크롤링
- investing_crawler.py의 공통 함수 재사용
- 단일 함수로 모든 지표 크롤링 가능
"""

from typing import Dict, Any, Optional

# 절대 임포트와 상대 임포트 모두 지원
try:
    from .investing_crawler import fetch_html, parse_history_table, extract_raw_data
    from .indicators_config import INDICATORS, get_indicator_config
except ImportError:
    from investing_crawler import fetch_html, parse_history_table, extract_raw_data
    from indicators_config import INDICATORS, get_indicator_config

def crawl_indicator(indicator_id: str) -> Dict[str, Any]:
    """
    지표 ID로 크롤링 실행

    Args:
        indicator_id: 지표 ID (예: "ism-manufacturing", "cpi")

    Returns:
        크롤링 결과 딕셔너리
        {
            "status": "success" | "error",
            "data": {
                "latest_release": {...},
                "next_release": {...},
                "timestamp": "..."
            },
            "indicator": {...}  # 지표 메타데이터
        }
    """
    # 1. 지표 설정 조회
    config = get_indicator_config(indicator_id)

    if not config:
        return {
            "status": "error",
            "message": f"Unknown indicator ID: {indicator_id}",
            "indicator_id": indicator_id
        }

    if not config.enabled:
        return {
            "status": "error",
            "message": f"Indicator is disabled: {indicator_id}",
            "indicator_id": indicator_id
        }

    # 2. 크롤링 실행
    try:
        html = fetch_html(config.url)
        rows = parse_history_table(html)
        raw_data = extract_raw_data(rows)

        # 에러 체크
        if "error" in raw_data:
            return {
                "status": "error",
                "message": raw_data["error"],
                "indicator_id": indicator_id,
                "url": config.url
            }

        # 3. 성공 응답
        return {
            "status": "success",
            "data": raw_data,
            "indicator": {
                "id": config.id,
                "name": config.name,
                "name_ko": config.name_ko,
                "category": config.category,
                "threshold": config.threshold,
                "reverse_color": config.reverse_color
            },
            "source": "investing.com"
        }

    except Exception as e:
        return {
            "status": "error",
            "message": f"Crawling failed: {str(e)}",
            "indicator_id": indicator_id,
            "url": config.url
        }

def crawl_all_indicators() -> Dict[str, Any]:
    """
    모든 활성 지표 크롤링 (관리자 전용, 무거움)

    Returns:
        {
            "total": 29,
            "success": 25,
            "failed": 4,
            "results": {
                "ism-manufacturing": {...},
                "cpi": {...},
                ...
            }
        }
    """
    results = {}
    success_count = 0
    failed_count = 0

    for indicator_id, config in INDICATORS.items():
        if not config.enabled:
            continue

        result = crawl_indicator(indicator_id)
        results[indicator_id] = result

        if result["status"] == "success":
            success_count += 1
        else:
            failed_count += 1

    return {
        "total": len(INDICATORS),
        "success": success_count,
        "failed": failed_count,
        "results": results
    }

def crawl_category(category: str) -> Dict[str, Any]:
    """
    특정 카테고리의 모든 지표 크롤링

    Args:
        category: "business", "employment", "interest", "trade", "inflation"

    Returns:
        카테고리별 크롤링 결과
    """
    try:
        from .indicators_config import get_indicators_by_category
    except ImportError:
        from indicators_config import get_indicators_by_category

    category_indicators = get_indicators_by_category(category)

    if not category_indicators:
        return {
            "status": "error",
            "message": f"Unknown category: {category}"
        }

    results = {}
    success_count = 0
    failed_count = 0

    for indicator_id in category_indicators.keys():
        result = crawl_indicator(indicator_id)
        results[indicator_id] = result

        if result["status"] == "success":
            success_count += 1
        else:
            failed_count += 1

    return {
        "category": category,
        "total": len(category_indicators),
        "success": success_count,
        "failed": failed_count,
        "results": results
    }

# 하위 호환성을 위한 래퍼 함수들 (기존 app.py가 사용 중인 함수명)
def get_ism_manufacturing_pmi():
    """하위 호환: ISM Manufacturing PMI"""
    return crawl_indicator("ism-manufacturing")

def get_cpi():
    """하위 호환: CPI"""
    return crawl_indicator("cpi")

def get_unemployment_rate():
    """하위 호환: 실업률"""
    return crawl_indicator("unemployment-rate")

# ... 필요 시 다른 래퍼 함수 추가

if __name__ == "__main__":
    import sys

    if len(sys.argv) < 2:
        print("사용법: python unified_crawler.py <indicator-id>")
        print("예시: python unified_crawler.py ism-manufacturing")
        print()
        print("사용 가능한 지표:")
        for id, config in INDICATORS.items():
            print(f"  - {id}: {config.name_ko}")
        sys.exit(1)

    indicator_id = sys.argv[1]

    print(f"🔍 {indicator_id} 크롤링 중...")
    result = crawl_indicator(indicator_id)

    if result["status"] == "success":
        print("✅ 성공!")
        print(f"지표: {result['indicator']['name_ko']}")
        print(f"최신 발표: {result['data']['latest_release']}")
        print(f"다음 발표: {result['data']['next_release']}")
    else:
        print("❌ 실패!")
        print(f"에러: {result['message']}")
