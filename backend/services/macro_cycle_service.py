"""
거시경제 사이클 계산 서비스

5개 핵심 지표로 경제 사이클 국면 판별:
- ISM 제조업 PMI (30%)
- ISM 비제조업 PMI (20%)
- 근원 CPI (20%)
- 연준 기준금리 (15%)
- 장단기금리차 (15%)

총점: 0~100점
국면: 침체(0-25), 회복(25-50), 확장(50-75), 둔화(75-100)
"""

from typing import Dict, Optional, List, Tuple
from datetime import datetime


class MacroCycleService:
    """거시경제 사이클 계산 서비스"""

    # 지표별 가중치
    WEIGHTS = {
        'ism_manufacturing': 0.30,
        'ism_non_manufacturing': 0.20,
        'core_cpi': 0.20,
        'fed_funds_rate': 0.15,
        'yield_curve': 0.15,
    }

    # 국면 정의
    PHASES = [
        {'name': '침체', 'name_en': 'Recession', 'range': (0, 25), 'color': 'red',
         'description': 'PMI<50, 장단기 역전, 물가하락, 금리인하',
         'action': '주식·장기채 매수 준비'},
        {'name': '회복', 'name_en': 'Early Expansion', 'range': (25, 50), 'color': 'green',
         'description': 'PMI 반등, 물가둔화, 금리인하 지속',
         'action': '주식 최대 비중, 베타 극대화'},
        {'name': '확장', 'name_en': 'Late Expansion', 'range': (50, 75), 'color': 'emerald',
         'description': 'PMI 강세(>55), 물가 재반등, 금리인상',
         'action': '일부 축소, 방어주 로테이션'},
        {'name': '둔화', 'name_en': 'Slowdown', 'range': (75, 100), 'color': 'amber',
         'description': 'PMI 하락, 인플레 높음, 금리인상 종료',
         'action': '현금·단기채 확대'},
    ]

    def __init__(self, db_service):
        """
        Args:
            db_service: PostgresDatabaseService 인스턴스
        """
        self.db = db_service

    def calculate_cycle_from_data(self, indicators_dict: Dict) -> Dict:
        """
        ✅ 외부에서 전달받은 데이터로 사이클 계산 (DB 재조회 없음)

        Args:
            indicators_dict: {indicator_id: latest_release_data} 딕셔너리
        """
        # 필요한 지표 추출
        indicator_ids = [
            'ism-manufacturing',
            'ism-non-manufacturing',
            'core-cpi',
            'federal-funds-rate',
            'yield-curve-10y-2y'
        ]

        indicators_data = {}
        for ind_id in indicator_ids:
            if ind_id in indicators_dict:
                indicators_data[ind_id] = indicators_dict[ind_id]

        if not indicators_data:
            return self._error_response("지표 데이터를 불러올 수 없습니다")

        # 기존 계산 로직 재사용
        scores = self._calculate_indicator_scores(indicators_data)
        total_score = sum(scores[key] * self.WEIGHTS[key] for key in self.WEIGHTS.keys() if key in scores)
        phase_info = self._determine_phase(total_score)
        confidence = self._calculate_confidence(indicators_data)

        return {
            'score': total_score,
            'phase': phase_info['name'],
            'phase_en': phase_info['name_en'],
            'color': phase_info['color'],
            'description': phase_info['description'],
            'action': phase_info['action'],
            'confidence': confidence,
            'indicators': scores,
            'last_updated': datetime.now().isoformat()
        }

    def calculate_cycle(self) -> Dict:
        """
        거시경제 사이클 점수 및 국면 계산

        Returns:
            {
                'score': 0-100,
                'phase': '침체|회복|확장|둔화',
                'phase_en': 'Recession|Early Expansion|...',
                'color': 'red|green|emerald|amber',
                'description': '현재 국면 설명',
                'action': '투자 행동 추천',
                'confidence': 0-100 (신뢰도),
                'indicators': {...},  # 개별 지표 점수
                'last_updated': 'ISO timestamp'
            }
        """
        # 1. 최신 데이터 조회
        indicators_data = self._fetch_latest_indicators()

        if not indicators_data:
            return self._error_response("지표 데이터를 불러올 수 없습니다")

        # 2. 개별 지표 점수 계산
        scores = self._calculate_indicator_scores(indicators_data)

        # 3. 가중평균 총점 계산
        total_score = sum(
            scores[key] * self.WEIGHTS[key]
            for key in self.WEIGHTS.keys()
        )

        # 4. 국면 판별
        phase_info = self._determine_phase(total_score)

        # 5. 신뢰도 계산 (데이터 완전성)
        confidence = self._calculate_confidence(indicators_data)

        return {
            'score': round(total_score, 1),
            'phase': phase_info['name'],
            'phase_en': phase_info['name_en'],
            'color': phase_info['color'],
            'description': phase_info['description'],
            'action': phase_info['action'],
            'confidence': confidence,
            'indicators': scores,
            'raw_data': indicators_data,
            'last_updated': datetime.utcnow().isoformat()
        }

    def _fetch_latest_indicators(self) -> Dict:
        """최신 경제지표 데이터 조회"""
        indicator_ids = [
            'ism-manufacturing',
            'ism-non-manufacturing',
            'core-cpi',
            'federal-funds-rate',
            'yield-curve-10y-2y'
        ]

        data = {}
        for ind_id in indicator_ids:
            result = self.db.get_indicator_data(ind_id)
            if result and 'error' not in result:
                # latest_release 데이터 추출
                latest = result.get('latest_release', {})
                if latest:
                    data[ind_id] = latest

        return data

    def _calculate_indicator_scores(self, data: Dict) -> Dict:
        """개별 지표를 0-100 점수로 변환"""
        scores = {}

        # ISM 제조업 PMI (30점 만점)
        if 'ism-manufacturing' in data:
            pmi = self._parse_value(data['ism-manufacturing'].get('actual'))
            scores['ism_manufacturing'] = self._score_pmi(pmi)
        else:
            scores['ism_manufacturing'] = 50.0  # 중립

        # ISM 비제조업 PMI (20점 만점)
        if 'ism-non-manufacturing' in data:
            pmi = self._parse_value(data['ism-non-manufacturing'].get('actual'))
            scores['ism_non_manufacturing'] = self._score_pmi(pmi)
        else:
            scores['ism_non_manufacturing'] = 50.0

        # 근원 CPI (20점 만점)
        if 'core-cpi' in data:
            cpi = self._parse_value(data['core-cpi'].get('actual'))
            scores['core_cpi'] = self._score_inflation(cpi)
        else:
            scores['core_cpi'] = 50.0

        # 연준 기준금리 (15점 만점)
        if 'federal-funds-rate' in data:
            rate = self._parse_value(data['federal-funds-rate'].get('actual'))
            scores['fed_funds_rate'] = self._score_interest_rate(rate)
        else:
            scores['fed_funds_rate'] = 50.0

        # 장단기금리차 (15점 만점)
        if 'yield-curve-10y-2y' in data:
            curve = self._parse_value(data['yield-curve-10y-2y'].get('actual'))
            scores['yield_curve'] = self._score_yield_curve(curve)
        else:
            scores['yield_curve'] = 50.0

        return scores

    def _score_pmi(self, pmi: float) -> float:
        """
        PMI 점수화 (0-100)
        - <45: 심각한 침체 (0-20점)
        - 45-50: 침체 (20-40점)
        - 50-55: 회복/정상 (40-60점)
        - 55-60: 확장 (60-80점)
        - >60: 과열 (80-100점)
        """
        if pmi < 45:
            return (pmi - 30) / 15 * 20  # 30-45 → 0-20
        elif pmi < 50:
            return 20 + (pmi - 45) / 5 * 20  # 45-50 → 20-40
        elif pmi < 55:
            return 40 + (pmi - 50) / 5 * 20  # 50-55 → 40-60
        elif pmi < 60:
            return 60 + (pmi - 55) / 5 * 20  # 55-60 → 60-80
        else:
            return min(100, 80 + (pmi - 60) / 5 * 20)  # 60-65 → 80-100

    def _score_inflation(self, inflation: float) -> float:
        """
        인플레이션 점수화 (0-100, 역방향)
        - <1%: 디플레 우려 (20점)
        - 1-2%: 이상적 (40점)
        - 2-3%: 목표치 (60점)
        - 3-5%: 높음 (80점)
        - >5%: 매우 높음 (100점)
        """
        if inflation < 1.0:
            return 20
        elif inflation < 2.0:
            return 20 + (inflation - 1.0) * 20  # 1-2 → 20-40
        elif inflation < 3.0:
            return 40 + (inflation - 2.0) * 20  # 2-3 → 40-60
        elif inflation < 5.0:
            return 60 + (inflation - 3.0) * 10  # 3-5 → 60-80
        else:
            return min(100, 80 + (inflation - 5.0) * 10)  # >5 → 80-100

    def _score_interest_rate(self, rate: float) -> float:
        """
        금리 점수화 (0-100)
        - 0-1%: 극도 완화 (20점)
        - 1-2%: 완화 (40점)
        - 2-4%: 중립 (60점)
        - 4-6%: 긴축 (80점)
        - >6%: 극도 긴축 (100점)
        """
        if rate < 1.0:
            return 20
        elif rate < 2.0:
            return 20 + (rate - 1.0) * 20  # 1-2 → 20-40
        elif rate < 4.0:
            return 40 + (rate - 2.0) * 10  # 2-4 → 40-60
        elif rate < 6.0:
            return 60 + (rate - 4.0) * 10  # 4-6 → 60-80
        else:
            return min(100, 80 + (rate - 6.0) * 10)  # >6 → 80-100

    def _score_yield_curve(self, curve: float) -> float:
        """
        장단기금리차 점수화 (0-100)
        - <-1.0: 심각한 역전 (0점)
        - -1.0~-0.5: 역전 (20점)
        - -0.5~0: 평탄화 (40점)
        - 0~1.0: 정상 (60점)
        - 1.0~2.0: 가파름 (80점)
        - >2.0: 매우 가파름 (100점)
        """
        if curve < -1.0:
            return 0
        elif curve < -0.5:
            return (curve + 1.0) / 0.5 * 20  # -1~-0.5 → 0-20
        elif curve < 0:
            return 20 + (curve + 0.5) / 0.5 * 20  # -0.5~0 → 20-40
        elif curve < 1.0:
            return 40 + curve * 20  # 0-1 → 40-60
        elif curve < 2.0:
            return 60 + (curve - 1.0) * 20  # 1-2 → 60-80
        else:
            return min(100, 80 + (curve - 2.0) * 10)  # >2 → 80-100

    def _determine_phase(self, score: float) -> Dict:
        """점수를 기반으로 국면 판별"""
        for phase in self.PHASES:
            min_score, max_score = phase['range']
            if min_score <= score < max_score:
                return phase

        # 100점인 경우 둔화
        return self.PHASES[-1]

    def _calculate_confidence(self, data: Dict) -> int:
        """
        신뢰도 계산 (데이터 완전성)
        - 6개 지표 모두 있음: 100%
        - 5개: 80%
        - 4개: 60%
        - 3개 이하: 40%
        """
        count = len(data)
        if count >= 6:
            return 100
        elif count == 5:
            return 80
        elif count == 4:
            return 60
        else:
            return 40

    def _parse_value(self, value) -> float:
        """지표 값 파싱 (%, K 단위 처리)"""
        if value is None:
            return 0.0

        if isinstance(value, (int, float)):
            return float(value)

        # 문자열 처리
        value_str = str(value).strip()

        # % 제거
        if value_str.endswith('%'):
            value_str = value_str[:-1]

        # K 단위 처리 (예: "218K" → 218)
        if value_str.endswith('K'):
            value_str = value_str[:-1]

        try:
            return float(value_str)
        except ValueError:
            return 0.0

    def _error_response(self, message: str) -> Dict:
        """에러 응답"""
        return {
            'score': None,
            'phase': None,
            'phase_en': None,
            'color': 'gray',
            'description': message,
            'action': '데이터를 업데이트해주세요',
            'confidence': 0,
            'indicators': {},
            'raw_data': {},
            'last_updated': datetime.utcnow().isoformat()
        }
