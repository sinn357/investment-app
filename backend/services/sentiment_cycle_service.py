"""
심리/밸류에이션 사이클 계산 서비스

현재는 VIX만 활성화 (다른 지표는 API 접근 제한)
- VIX (100%)

총점: 0~100점
국면: 공포(0-33), 중립(33-66), 탐욕(66-100)
"""

from typing import Dict, Optional
from datetime import datetime


class SentimentCycleService:
    """심리/밸류에이션 사이클 계산 서비스"""

    # 지표별 가중치 (현재는 VIX만 활성화)
    WEIGHTS = {
        'vix': 1.00,  # 100%
    }

    # 국면 정의
    PHASES = [
        {'name': '극단적 공포', 'name_en': 'Extreme Fear', 'range': (0, 33), 'color': 'green',
         'description': 'VIX 40+, 시장 패닉, 극심한 공포',
         'action': '공격적 매수 (저가 매수 기회)'},
        {'name': '중립', 'name_en': 'Neutral', 'range': (33, 66), 'color': 'amber',
         'description': 'VIX 15-30, 정상 변동성',
         'action': '관망 또는 포지션 유지'},
        {'name': '극단적 탐욕', 'name_en': 'Extreme Greed', 'range': (66, 100), 'color': 'red',
         'description': 'VIX <12, 과도한 낙관, 고점 경계',
         'action': '차익 실현, 현금 비중 확대'},
    ]

    def __init__(self, db_service):
        """
        Args:
            db_service: PostgresDatabaseService 인스턴스
        """
        self.db = db_service

    def calculate_cycle(self) -> Dict:
        """
        심리/밸류에이션 사이클 점수 및 국면 계산

        Returns:
            {
                'score': 0-100,
                'phase': '극단적 공포|중립|극단적 탐욕',
                'phase_en': 'Extreme Fear|Neutral|Extreme Greed',
                'color': 'green|amber|red',
                'description': '현재 국면 설명',
                'action': '투자 행동 추천',
                'confidence': 0-100,
                'indicators': {...},
                'last_updated': 'ISO timestamp'
            }
        """
        # 1. 최신 데이터 조회
        indicators_data = self._fetch_latest_indicators()

        # 2. 개별 지표 점수 계산
        scores = self._calculate_indicator_scores(indicators_data)

        # 3. 가중평균 총점 계산
        total_score = sum(
            scores[key] * self.WEIGHTS[key]
            for key in self.WEIGHTS.keys()
            if key in scores
        )

        # 4. 국면 판별
        phase_info = self._determine_phase(total_score)

        # 5. 신뢰도 계산
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
        """최신 심리지표 데이터 조회"""
        indicator_ids = [
            'vix',
        ]

        data = {}
        for ind_id in indicator_ids:
            result = self.db.get_indicator_data(ind_id)
            if result and 'error' not in result:
                latest = result.get('latest_release', {})
                if latest:
                    data[ind_id] = latest

        return data

    def _calculate_indicator_scores(self, data: Dict) -> Dict:
        """개별 지표를 0-100 점수로 변환"""
        scores = {}

        # VIX (역방향: 높을수록 공포 → 낮은 점수, 낮을수록 탐욕 → 높은 점수)
        if 'vix' in data:
            vix = self._parse_value(data['vix'].get('actual'))
            scores['vix'] = self._score_vix(vix)
        else:
            scores['vix'] = 50.0

        return scores

    def _score_vix(self, vix: float) -> float:
        """
        VIX 점수화 (0-100, 역방향)
        - >40: 극심한 공포 (0-10점) → 매수 기회
        - 30-40: 높은 공포 (10-25점)
        - 20-30: 경계/불안 (25-45점)
        - 15-20: 정상 (45-60점)
        - 12-15: 낮은 변동성 (60-80점)
        - <12: 극단적 낙관 (80-100점) → 위험 신호
        """
        if vix > 40:
            return max(0, 10 - (vix - 40) / 10)  # 40+ → 0-10
        elif vix > 30:
            return 10 + (40 - vix) / 10 * 15  # 30-40 → 10-25
        elif vix > 20:
            return 25 + (30 - vix) / 10 * 20  # 20-30 → 25-45
        elif vix > 15:
            return 45 + (20 - vix) / 5 * 15  # 15-20 → 45-60
        elif vix > 12:
            return 60 + (15 - vix) / 3 * 20  # 12-15 → 60-80
        else:
            return min(100, 80 + (12 - vix) / 12 * 20)  # 0-12 → 80-100

    def _determine_phase(self, score: float) -> Dict:
        """점수를 기반으로 국면 판별"""
        for phase in self.PHASES:
            min_score, max_score = phase['range']
            if min_score <= score < max_score:
                return phase

        # 100점인 경우 마지막 국면
        return self.PHASES[-1]

    def _calculate_confidence(self, data: Dict) -> int:
        """신뢰도 계산 (데이터 완전성)"""
        count = len(data)
        if count >= 1:
            return 100  # VIX만 있어도 100%
        else:
            return 0

    def _parse_value(self, value) -> float:
        """지표 값 파싱"""
        if value is None:
            return 0.0

        if isinstance(value, (int, float)):
            return float(value)

        value_str = str(value).strip()

        if value_str.endswith('%'):
            value_str = value_str[:-1]

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
