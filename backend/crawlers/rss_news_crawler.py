"""
RSS 뉴스 자동 수집 크롤러
경제 관련 RSS 피드를 수집하여 최신 뉴스 제공
"""
import feedparser
from datetime import datetime, timedelta
from email.utils import parsedate_to_datetime
import logging

logger = logging.getLogger(__name__)

class RSSNewsCrawler:
    """경제 뉴스 RSS 피드 크롤러"""

    # RSS 피드 URL 목록
    FEEDS = {
        'bloomberg': 'https://www.bloomberg.com/feed/podcast/etf-iq.xml',
        'reuters': 'https://www.reuters.com/rssFeed/businessNews',
        'cnbc': 'https://www.cnbc.com/id/100003114/device/rss/rss.html',
        'wsj': 'https://feeds.a.dj.com/rss/WSJcomUSBusiness.xml',
        'fed': 'https://www.federalreserve.gov/feeds/press_all.xml'
    }

    # 경제 관련 키워드
    KEYWORDS = [
        'fed', 'interest rate', 'inflation', 'cpi', 'pmi', 'employment',
        'gdp', 'recession', 'economy', 'market', 'stock', 'bond',
        'federal reserve', 'monetary policy', 'fiscal policy', 'treasury',
        'yield', 'dollar', 'trade', 'tariff', 'manufacturing'
    ]

    def fetch_recent_news(self, hours: int = 24) -> list:
        """
        최근 N시간 이내 뉴스 수집

        Args:
            hours: 수집 기간 (시간)

        Returns:
            [
                {
                    'title': '기사 제목',
                    'url': 'URL',
                    'summary': '요약',
                    'source': 'Bloomberg',
                    'published': '2025-12-10T10:00:00',
                    'keyword': '금리인하'
                },
                ...
            ]
        """
        news_list = []
        cutoff_time = datetime.now() - timedelta(hours=hours)

        for source_name, feed_url in self.FEEDS.items():
            try:
                logger.info(f"RSS 피드 수집 중: {source_name}")
                feed = feedparser.parse(feed_url)

                if not feed.entries:
                    logger.warning(f"RSS 피드 비어있음: {source_name}")
                    continue

                for entry in feed.entries:
                    # 날짜 파싱
                    pub_date = self._parse_date(entry.get('published'))
                    if pub_date < cutoff_time:
                        continue

                    # 키워드 필터링
                    title = entry.get('title', '')
                    summary = entry.get('summary', entry.get('description', ''))
                    matched_keyword = self._match_keywords(title, summary)

                    if not matched_keyword:
                        continue

                    # 요약 길이 제한 (200자)
                    summary_text = summary[:200] if summary else ''

                    news_list.append({
                        'title': title,
                        'url': entry.get('link', ''),
                        'summary': summary_text,
                        'source': source_name.capitalize(),
                        'published': pub_date.isoformat(),
                        'keyword': matched_keyword
                    })

            except Exception as e:
                logger.error(f"RSS 피드 수집 실패 ({source_name}): {e}")
                continue

        # 최신순 정렬
        news_list.sort(key=lambda x: x['published'], reverse=True)
        return news_list[:20]  # 최대 20개

    def _parse_date(self, date_str: str) -> datetime:
        """RSS 날짜 문자열 파싱"""
        try:
            if not date_str:
                return datetime.now()
            return parsedate_to_datetime(date_str)
        except Exception as e:
            logger.warning(f"날짜 파싱 실패: {date_str}, {e}")
            return datetime.now()

    def _match_keywords(self, title: str, summary: str) -> str | None:
        """키워드 매칭"""
        text = (title + ' ' + summary).lower()

        # 우선순위 키워드 먼저 매칭
        priority_keywords = ['fed', 'federal reserve', 'inflation', 'gdp', 'employment']

        for keyword in priority_keywords:
            if keyword in text:
                return keyword

        # 나머지 키워드
        for keyword in self.KEYWORDS:
            if keyword in text:
                return keyword

        return None
