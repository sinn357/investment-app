from crawlers.investing_crawler import fetch_html, parse_history_table, extract_raw_data
from crawlers.rates_bonds_crawler import crawl_rate_indicator
from crawlers.fred_crawler import crawl_fred_indicator
from crawlers.indicators_config import INDICATORS, get_all_enabled_indicators
from typing import Dict, Any
import time

class CrawlerService:
    """크롤링 서비스 통합 클래스 - indicators_config.py 기반"""

    # indicators_config.py의 설정을 사용
    @classmethod
    def get_indicator_urls(cls) -> Dict[str, str]:
        """활성화된 모든 지표의 URL 딕셔너리 반환"""
        return {id: config.url for id, config in get_all_enabled_indicators().items()}

    # 레거시 호환성을 위한 속성
    @classmethod
    @property
    def INDICATOR_URLS(cls) -> Dict[str, str]:
        """레거시 코드 호환성을 위한 속성"""
        return cls.get_indicator_urls()

    @classmethod
    def crawl_indicator(cls, indicator_id: str) -> Dict[str, Any]:
        """단일 지표 크롤링 (URL 유형에 따라 적절한 크롤러 자동 선택)"""
        config = INDICATORS.get(indicator_id)
        if not config or not config.enabled:
            return {"error": f"Unknown or disabled indicator: {indicator_id}"}

        url = config.url

        try:
            # URL 유형에 따라 크롤러 선택
            if "fred.stlouisfed.org" in url:
                # FRED CSV API 크롤러
                series_id = url.split('/')[-1]  # URL에서 시리즈 ID 추출 (예: T10Y2Y, DFII10)
                result = crawl_fred_indicator(series_id)

                if "error" in result:
                    return result

                # 통합 데이터 구조에 메타데이터 추가
                result["crawl_timestamp"] = time.time()
                result["url"] = url
                return result

            elif "rates-bonds" in url:
                # Investing.com Rates-Bonds Historical Data 크롤러
                result = crawl_rate_indicator(url)

                if "error" in result:
                    return result

                # 통합 데이터 구조에 메타데이터 추가
                result["crawl_timestamp"] = time.time()
                result["url"] = url
                return result

            else:
                # Investing.com Economic Calendar 크롤러 (기존 방식)
                html = fetch_html(url)
                history_rows = parse_history_table(html)
                raw_data = extract_raw_data(history_rows)

                if "error" in raw_data:
                    return raw_data

                result = {
                    "latest_release": raw_data.get("latest_release"),
                    "next_release": raw_data.get("next_release"),
                    "history_table": history_rows,
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

        for indicator_id in get_all_enabled_indicators().keys():
            print(f"Crawling {indicator_id}...")
            results[indicator_id] = cls.crawl_indicator(indicator_id)

            # 크롤링 간격 (과도한 요청 방지)
            time.sleep(1)

        return results

    @classmethod
    def get_indicator_name(cls, indicator_id: str) -> str:
        """지표 ID에서 표시명 반환 (indicators_config.py 사용)"""
        config = INDICATORS.get(indicator_id)
        return config.name if config else indicator_id