"""
신용/유동성 사이클 계산 서비스

4개 핵심 지표로 신용 사이클 국면 판별:
- HY Spread (하이일드 스프레드) (40%)
- IG Spread (투자등급 스프레드) (20%)
- FCI (금융여건지수) (30%)
- M2 YoY (통화량 증가율) (10%)

총점: 0~100점
국면: 경색(0-33), 정상화(33-66), 과잉(66-100)
"""

from typing import Dict, Optional
from datetime import datetime


class CreditCycleService:
    """신용/유동성 사이클 계산 서비스"""

    # 지표별 가중치
    WEIGHTS = {
        'hy_spread': 0.40,      # 가장 중요한 신용 신호
        'ig_spread': 0.20,
        'fci': 0.30,            # 금융여건 총합
        'm2_yoy': 0.10,
    }

    # 국면 정의
    PHASES = [
        {'name': '신용 경색', 'name_en': 'Credit Crunch', 'range': (0, 33), 'color': 'red',
         'description': 'HY 스프레드 700bp+, 대출기준 강화, FCI 악화',
         'action': '하이일드채·폭락주 공격적 매수'},
        {'name': '정상화', 'name_en': 'Normalizing', 'range': (33, 66), 'color': 'amber',
         'description': '스프레드 축소 시작, 대출 완화, FCI 안정',
         'action': '주식 ETF·기업채 유지'},
        {'name': '신용 과잉', 'name_en': 'Credit Excess', 'range': (66, 100), 'color': 'green',
         'description': '스프레드 <250bp, 신용 발행 활발, 레버리지 증가',
         'action': '고위험채 매도, 현금 증가'},
    ]

    def __init__(self, db_service):
        """
        Args:
            db_service: PostgresDatabaseService 인스턴스
        """
        self.db = db_service

    def calculate_cycle(self) -> Dict:
        """
        신용/유동성 사이클 점수 및 국면 계산

        Returns:
            {
                'score': 0-100,
                'phase': '신용 경색|정상화|신용 과잉',
                'phase_en': 'Credit Crunch|Normalizing|Credit Excess',
                'color': 'red|amber|green',
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
        """최신 신용지표 데이터 조회"""
        indicator_ids = [
            'hy-spread',
            'ig-spread',
            'fci',
            'm2-yoy'
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

        # HY Spread (역방향: 낮을수록 좋음 → 높은 점수)
        if 'hy-spread' in data:
            spread = self._parse_value(data['hy-spread'].get('actual'))
            scores['hy_spread'] = self._score_hy_spread(spread)
        else:
            scores['hy_spread'] = 50.0

        # IG Spread (역방향: 낮을수록 좋음 → 높은 점수)
        if 'ig-spread' in data:
            spread = self._parse_value(data['ig-spread'].get('actual'))
            scores['ig_spread'] = self._score_ig_spread(spread)
        else:
            scores['ig_spread'] = 50.0

        # FCI (역방향: 낮을수록 좋음 → 높은 점수)
        if 'fci' in data:
            fci = self._parse_value(data['fci'].get('actual'))
            scores['fci'] = self._score_fci(fci)
        else:
            scores['fci'] = 50.0

        # M2 YoY (정방향: 높을수록 좋음)
        if 'm2-yoy' in data:
            m2 = self._parse_value(data['m2-yoy'].get('actual'))
            scores['m2_yoy'] = self._score_m2_yoy(m2)
        else:
            scores['m2_yoy'] = 50.0

        return scores

    def _score_hy_spread(self, spread: float) -> float:
        """
        HY Spread 점수화 (0-100, 역방향)
        - >1000bp: 극심한 경색 (0-20점) → 매수 기회
        - 700-1000bp: 경색 (20-40점)
        - 500-700bp: 경계 (40-60점)
        - 250-500bp: 정상 (60-80점)
        - <250bp: 과열 (80-100점) → 위험 신호
        """
        if spread > 1000:
            return max(0, 20 - (spread - 1000) / 100)  # 1000+ → 0-20
        elif spread > 700:
            return 20 + (1000 - spread) / 300 * 20  # 700-1000 → 20-40
        elif spread > 500:
            return 40 + (700 - spread) / 200 * 20  # 500-700 → 40-60
        elif spread > 250:
            return 60 + (500 - spread) / 250 * 20  # 250-500 → 60-80
        else:
            return min(100, 80 + (250 - spread) / 250 * 20)  # 0-250 → 80-100

    def _score_ig_spread(self, spread: float) -> float:
        """
        IG Spread 점수화 (0-100, 역방향)
        - >300bp: 경색 (0-30점)
        - 200-300bp: 경계 (30-50점)
        - 150-200bp: 정상 (50-70점)
        - 100-150bp: 완화 (70-85점)
        - <100bp: 과열 (85-100점)
        """
        if spread > 300:
            return max(0, 30 - (spread - 300) / 50)
        elif spread > 200:
            return 30 + (300 - spread) / 100 * 20
        elif spread > 150:
            return 50 + (200 - spread) / 50 * 20
        elif spread > 100:
            return 70 + (150 - spread) / 50 * 15
        else:
            return min(100, 85 + (100 - spread) / 100 * 15)

    def _score_fci(self, fci: float) -> float:
        """
        FCI 점수화 (0-100, 역방향)
        - >1.0: 극심한 긴축 (0-20점)
        - 0.5~1.0: 긴축 (20-40점)
        - 0~0.5: 경계 (40-60점)
        - -0.5~0: 완화 (60-80점)
        - <-0.5: 극도 완화 (80-100점)
        """
        if fci > 1.0:
            return max(0, 20 - (fci - 1.0) * 20)
        elif fci > 0.5:
            return 20 + (1.0 - fci) * 40
        elif fci > 0:
            return 40 + (0.5 - fci) * 40
        elif fci > -0.5:
            return 60 + (0 - fci) * 40
        else:
            return min(100, 80 + (-0.5 - fci) * 40)

    def _score_m2_yoy(self, m2_yoy: float) -> float:
        """
        M2 YoY 점수화 (0-100, 정방향)
        - <0%: 축소 (0-20점)
        - 0-2%: 매우 낮음 (20-40점)
        - 2-5%: 정상 (40-60점)
        - 5-10%: 확장 (60-80점)
        - >10%: 과열 (80-100점)
        """
        if m2_yoy < 0:
            return max(0, 20 + m2_yoy * 10)
        elif m2_yoy < 2:
            return 20 + m2_yoy * 10
        elif m2_yoy < 5:
            return 40 + (m2_yoy - 2) * 6.67
        elif m2_yoy < 10:
            return 60 + (m2_yoy - 5) * 4
        else:
            return min(100, 80 + (m2_yoy - 10) * 2)

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
        if count >= 4:
            return 100
        elif count == 3:
            return 75
        elif count == 2:
            return 50
        else:
            return 25

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
