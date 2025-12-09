"""
지표 변화 추적 서비스
전일 대비 주요 지표 변화를 계산하고 상위 N개 추출
"""
from datetime import datetime
from typing import List, Dict, Any
import logging

logger = logging.getLogger(__name__)

class IndicatorChangesService:
    """경제지표 변화 추적 및 분석 서비스"""

    # 지표별 중요도 가중치 (MMC 공식 기준)
    INDICATOR_WEIGHTS = {
        # 거시경제 사이클 (높음)
        'ism-manufacturing': 'high',
        'ism-non-manufacturing': 'high',
        'federal-funds-rate': 'high',
        'yield-curve-10y-2y': 'high',
        'cpi': 'high',
        'core-pce': 'high',

        # 신용/유동성 (높음)
        'high-yield-spread': 'high',
        'investment-grade-spread': 'high',
        'financial-conditions-index': 'high',

        # 심리/밸류 (높음)
        'vix': 'high',
        'sp500-per': 'high',
        'shiller-cape': 'high',

        # 기타 경기지표 (중간)
        'industrial-production': 'medium',
        'retail-sales-mom': 'medium',
        'michigan-consumer-sentiment': 'medium',

        # 고용지표 (중간)
        'nonfarm-payrolls': 'medium',
        'unemployment-rate': 'medium',
        'initial-jobless-claims': 'medium',

        # 기타 (낮음)
        'default': 'low'
    }

    def __init__(self, db_service):
        """
        Args:
            db_service: PostgresDatabaseService 인스턴스
        """
        self.db = db_service

    def get_top_changes(self, limit: int = 5) -> Dict[str, List[Dict[str, Any]]]:
        """
        전일 대비 주요 지표 변화 반환

        Args:
            limit: 반환할 최대 지표 개수

        Returns:
            {
                'increases': [
                    {'indicator': 'VIX', 'from': 15.41, 'to': 16.66, 'change': 8.1, 'impact': 'high'},
                    ...
                ],
                'decreases': [...],
                'unchanged': [...]
            }
        """
        try:
            # 1. 모든 지표의 최근 2개 데이터 조회
            all_changes = self._calculate_all_changes()

            if not all_changes:
                return {
                    'increases': [],
                    'decreases': [],
                    'unchanged': []
                }

            # 2. 변화율 기준 정렬 (절대값)
            sorted_changes = sorted(
                all_changes,
                key=lambda x: abs(x['change']) if x['change'] is not None else 0,
                reverse=True
            )

            # 3. 증가/감소/변화없음 분류
            increases = [c for c in sorted_changes if c['change'] and c['change'] > 0][:limit]
            decreases = [c for c in sorted_changes if c['change'] and c['change'] < 0][:limit]
            unchanged = [c for c in sorted_changes if c['change'] == 0 or c['change'] is None][:limit]

            return {
                'increases': increases,
                'decreases': decreases,
                'unchanged': unchanged
            }

        except Exception as e:
            logger.error(f"지표 변화 조회 실패: {e}")
            return {
                'increases': [],
                'decreases': [],
                'unchanged': []
            }

    def _calculate_all_changes(self) -> List[Dict[str, Any]]:
        """모든 지표의 변화율 계산"""
        try:
            # PostgreSQL에서 모든 지표 ID 조회
            query = """
                SELECT DISTINCT indicator_id
                FROM latest_releases
                WHERE latest_release IS NOT NULL
            """
            results = self.db.execute_query(query)

            if not results:
                return []

            all_changes = []

            for row in results:
                indicator_id = row['indicator_id']
                change_info = self._calculate_indicator_change(indicator_id)

                if change_info:
                    all_changes.append(change_info)

            return all_changes

        except Exception as e:
            logger.error(f"전체 지표 변화 계산 실패: {e}")
            return []

    def _calculate_indicator_change(self, indicator_id: str) -> Dict[str, Any] | None:
        """단일 지표의 변화 계산"""
        try:
            # 최근 2개 데이터 조회
            query = """
                SELECT actual, release_date
                FROM latest_releases
                WHERE indicator_id = %s
                  AND actual IS NOT NULL
                ORDER BY release_date DESC
                LIMIT 2
            """
            results = self.db.execute_query(query, (indicator_id,))

            if not results or len(results) < 2:
                return None

            current = self._parse_value(results[0]['actual'])
            previous = self._parse_value(results[1]['actual'])

            if current is None or previous is None or previous == 0:
                return None

            # 변화율 계산 (%)
            change_pct = ((current - previous) / abs(previous)) * 100

            # 중요도 판별
            impact = self.calculate_change_impact(indicator_id, change_pct)

            return {
                'indicator': self._format_indicator_name(indicator_id),
                'from': previous,
                'to': current,
                'change': round(change_pct, 1),
                'impact': impact
            }

        except Exception as e:
            logger.error(f"지표 {indicator_id} 변화 계산 실패: {e}")
            return None

    def _parse_value(self, value: Any) -> float | None:
        """값을 float로 파싱 (%, K 단위 처리)"""
        try:
            if value is None:
                return None

            if isinstance(value, (int, float)):
                return float(value)

            # 문자열 처리
            value_str = str(value).strip()

            # % 제거
            if '%' in value_str:
                value_str = value_str.replace('%', '')

            # K 단위 처리
            if 'K' in value_str:
                value_str = value_str.replace('K', '')
                return float(value_str) * 1000

            return float(value_str)

        except (ValueError, TypeError):
            return None

    def _format_indicator_name(self, indicator_id: str) -> str:
        """지표 ID를 사람이 읽기 쉬운 이름으로 변환"""
        # 간단한 변환 (추후 확장 가능)
        name_map = {
            'ism-manufacturing': 'ISM Manufacturing PMI',
            'ism-non-manufacturing': 'ISM Services PMI',
            'cpi': 'CPI',
            'core-pce': 'Core PCE',
            'federal-funds-rate': 'Fed Funds Rate',
            'yield-curve-10y-2y': '10Y-2Y Yield Curve',
            'vix': 'VIX',
            'sp500-per': 'S&P 500 P/E',
            'nonfarm-payrolls': 'Nonfarm Payrolls',
            'unemployment-rate': 'Unemployment Rate'
        }

        return name_map.get(indicator_id, indicator_id.replace('-', ' ').title())

    def calculate_change_impact(self, indicator_id: str, change_pct: float) -> str:
        """
        지표 변화의 시장 영향도 계산

        Args:
            indicator_id: 지표 ID
            change_pct: 변화율 (%)

        Returns:
            'low' | 'medium' | 'high'
        """
        # 기본 중요도
        base_impact = self.INDICATOR_WEIGHTS.get(indicator_id, 'low')

        # 변화율이 클수록 영향도 상승
        abs_change = abs(change_pct)

        if base_impact == 'high' or abs_change > 5:
            return 'high'
        elif base_impact == 'medium' or abs_change > 2:
            return 'medium'
        else:
            return 'low'
