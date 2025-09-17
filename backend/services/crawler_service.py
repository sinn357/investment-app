from crawlers.investing_crawler import fetch_html, parse_history_table, extract_raw_data
from typing import Dict, Any
import time

class CrawlerService:
    """크롤링 서비스 통합 클래스"""

    # 지표별 URL 매핑
    INDICATOR_URLS = {
        'ism-manufacturing': 'https://www.investing.com/economic-calendar/ism-manufacturing-pmi-173',
        'ism-non-manufacturing': 'https://www.investing.com/economic-calendar/ism-non-manufacturing-pmi-176',
        'sp-global-composite': 'https://www.investing.com/economic-calendar/s-p-global-composite-pmi-1492',
        'industrial-production': 'https://www.investing.com/economic-calendar/industrial-production-161',
        'industrial-production-1755': 'https://www.investing.com/economic-calendar/industrial-production-1755',
        'retail-sales': 'https://www.investing.com/economic-calendar/retail-sales-256',
        'retail-sales-yoy': 'https://www.investing.com/economic-calendar/retail-sales-1878'
    }

    @classmethod
    def crawl_indicator(cls, indicator_id: str) -> Dict[str, Any]:
        """단일 지표 크롤링"""
        if indicator_id not in cls.INDICATOR_URLS:
            return {"error": f"Unknown indicator: {indicator_id}"}

        url = cls.INDICATOR_URLS[indicator_id]

        try:
            # HTML 페이지 가져오기
            html = fetch_html(url)

            # History Table 파싱
            history_rows = parse_history_table(html)

            # Raw Data 추출 (latest_release, next_release)
            raw_data = extract_raw_data(history_rows)

            if "error" in raw_data:
                return raw_data

            # 통합 데이터 구조 생성
            result = {
                "latest_release": raw_data.get("latest_release"),
                "next_release": raw_data.get("next_release"),
                "history_table": history_rows,  # 전체 히스토리 데이터
                "crawl_timestamp": time.time(),
                "url": url
            }

            return result

        except Exception as e:
            return {"error": f"Crawling failed for {indicator_id}: {str(e)}"}

    @classmethod
    def crawl_all_indicators(cls) -> Dict[str, Dict[str, Any]]:
        """모든 지표 크롤링 (배치 처리용)"""
        results = {}

        for indicator_id in cls.INDICATOR_URLS.keys():
            print(f"Crawling {indicator_id}...")
            results[indicator_id] = cls.crawl_indicator(indicator_id)

            # 크롤링 간격 (과도한 요청 방지)
            time.sleep(1)

        return results

    @classmethod
    def get_indicator_name(cls, indicator_id: str) -> str:
        """지표 ID에서 표시명 반환"""
        name_mapping = {
            'ism-manufacturing': 'ISM Manufacturing PMI',
            'ism-non-manufacturing': 'ISM Non-Manufacturing PMI',
            'sp-global-composite': 'S&P Global Composite PMI',
            'industrial-production': 'Industrial Production',
            'industrial-production-1755': 'Industrial Production YoY',
            'retail-sales': 'Retail Sales MoM',
            'retail-sales-yoy': 'Retail Sales YoY'
        }
        return name_mapping.get(indicator_id, indicator_id)