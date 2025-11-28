"""
경제지표 메타데이터 및 해석 정보
각 지표별로 5가지 섹션으로 구성된 상세 해석 제공

구조:
- core_definition: 핵심 정의 (지표가 무엇인지)
- interpretation_guide: 해석법 (숫자를 어떻게 읽는지)
- context_meaning: 의미·맥락 (경제적 의미)
- market_reaction: 시장 반응·투자 적용 (투자 시사점)
- additional_info: 확인 정보 (발표 시기, 출처 등)
"""

from typing import Dict, Any, Optional


class IndicatorMetadata:
    """지표 메타데이터 클래스"""

    # 우선순위 주요 6개 지표 (먼저 작성)
    PRIORITY_INDICATORS = [
        'ism-manufacturing',
        'nonfarm-payrolls',
        'unemployment-rate',
        'cpi',
        'gdp',
        'federal-funds-rate'
    ]

    # 전체 지표 메타데이터
    METADATA: Dict[str, Dict[str, Any]] = {
        # ==========================================
        # 우선순위 1: ISM Manufacturing PMI
        # ==========================================
        'ism-manufacturing': {
            'name': 'ISM Manufacturing PMI',
            'name_ko': '제조업 구매관리자지수',
            'category': 'business',
            'reverse_color': False,

            'interpretation': {
                'core_definition': """
                    ISM(Institute for Supply Management) 제조업 PMI는 미국 제조업체 구매관리자들을 대상으로 한
                    설문조사 기반 경기 선행지표입니다. 신규 주문, 생산, 고용, 재고, 배송 속도 등 5개 항목을 종합하여
                    0~100 사이의 지수로 표현합니다.
                """,

                'interpretation_guide': """
                    • 50 이상: 제조업 경기 확장 (전월 대비 개선)
                    • 50: 중립 (변화 없음)
                    • 50 미만: 제조업 경기 위축 (전월 대비 악화)
                    • 55 이상: 강한 확장세 (경기 과열 가능성)
                    • 45 미만: 심각한 위축 (경기침체 우려)
                """,

                'context_meaning': """
                    제조업은 미국 GDP의 약 11%를 차지하지만, 고용과 설비투자에 미치는 파급효과가 커서
                    경기 판단에 매우 중요한 지표입니다. 특히 연준(Fed)의 통화정책 결정 시 핵심 참고 지표로 활용됩니다.
                    PMI는 실제 생산 데이터보다 1-2개월 앞서 움직이는 선행지표 특성이 있습니다.
                """,

                'market_reaction': """
                    • 예상보다 높을 때: 주식 상승(특히 산업재, 소재), 달러 강세, 금리 상승 압력
                    • 예상보다 낮을 때: 주식 하락(경기 둔화 우려), 채권 선호, 달러 약세
                    • 50 근처 등락: 경기 전환점 신호 → 변동성 확대 가능
                    • 투자 전략: 55 이상 시 경기민감주(산업재, 소재) 매수, 45 미만 시 방어주(필수소비재, 헬스케어) 선호
                """,

                'additional_info': """
                    • 발표 시기: 매월 첫 영업일 오전 10시 (ET)
                    • 조사 기간: 전월 말 기준
                    • 출처: Institute for Supply Management (ISM)
                    • 역사: 1948년부터 발표 시작, 70년 이상의 신뢰도
                    • 관련 지표: ISM 비제조업 PMI, S&P Global Manufacturing PMI
                """
            }
        },

        # ==========================================
        # 우선순위 2: Nonfarm Payrolls (비농업 고용)
        # ==========================================
        'nonfarm-payrolls': {
            'name': 'Nonfarm Payrolls',
            'name_ko': '비농업 고용',
            'category': 'employment',
            'reverse_color': False,

            'interpretation': {
                'core_definition': """
                    비농업 부문에서 새로 추가되거나 감소한 일자리 수를 집계한 지표입니다.
                    농업, 개인 가사 서비스, 비영리단체를 제외한 모든 산업의 고용 변화를 측정합니다.
                    미국 경제 건전성을 판단하는 가장 중요한 단일 지표로 평가받습니다.
                """,

                'interpretation_guide': """
                    • +200K 이상: 강한 고용 증가 (건강한 경제)
                    • +150K~200K: 적정 고용 증가 (안정적 성장)
                    • +100K~150K: 완만한 고용 증가 (성장 둔화 조짐)
                    • +100K 미만: 약한 고용 증가 (경기 둔화 우려)
                    • 마이너스(-): 고용 감소 (경기침체 신호)
                """,

                'context_meaning': """
                    고용은 소비(미국 GDP의 70%)와 직결되므로 경기 판단의 핵심입니다.
                    연준의 이중 책무(물가 안정 + 완전 고용) 중 하나로, 통화정책 결정에 결정적 영향을 미칩니다.
                    단, 속보성이 높은 대신 수정이 잦으므로 2-3개월 추세를 함께 봐야 합니다.
                """,

                'market_reaction': """
                    • 예상보다 강할 때: 주식 상승(소비 증가 기대), 금리 상승(연준 매파적 전환), 달러 강세
                    • 예상보다 약할 때: 주식 변동성 확대(경기 둔화 vs 금리 인하 기대), 채권 상승, 달러 약세
                    • 마이너스 전환: 주식 급락 가능, 안전자산 선호(채권, 금)
                    • 투자 전략: 강한 고용 시 소비재·서비스주 매수, 약한 고용 시 방어적 포지션
                """,

                'additional_info': """
                    • 발표 시기: 매월 첫째 주 금요일 오전 8:30 (ET) - '슈퍼 금요일'로 불림
                    • 조사 기간: 전월 12일 포함한 주
                    • 출처: U.S. Bureau of Labor Statistics (BLS)
                    • 특이사항: 발표 후 2개월 연속 수정치 발표 (속보→잠정→확정)
                    • 동시 발표: 실업률, 평균시간당임금 등 포괄적 고용지표
                """
            }
        },

        # ==========================================
        # 우선순위 3: Unemployment Rate (실업률)
        # ==========================================
        'unemployment-rate': {
            'name': 'Unemployment Rate',
            'name_ko': '실업률',
            'category': 'employment',
            'reverse_color': True,  # 낮을수록 좋음

            'interpretation': {
                'core_definition': """
                    경제활동인구(16세 이상 취업자+구직자) 중 실업자(적극적으로 구직 중인 미취업자)가
                    차지하는 비율입니다. 비농업 고용과 함께 매월 첫째 주 금요일에 동시 발표됩니다.
                """,

                'interpretation_guide': """
                    • 3.5% 이하: 완전 고용 수준 (인력 부족 가능)
                    • 3.5%~4.5%: 건강한 고용 시장 (적정 수준)
                    • 4.5%~6.0%: 고용 시장 약화 (경기 둔화)
                    • 6.0% 이상: 높은 실업률 (경기침체 가능성)
                    • 급격한 상승(+0.5%p 이상): 경기침체 진입 신호
                """,

                'context_meaning': """
                    실업률은 '후행지표'로 경기가 이미 나빠진 후 상승하는 경향이 있습니다.
                    하지만 심리적 영향이 커서 급등 시 소비 위축으로 이어져 경기를 더 악화시킬 수 있습니다.
                    주의: 구직 포기자(discouraged workers)는 제외되므로, 경제활동참가율을 함께 봐야 정확합니다.
                """,

                'market_reaction': """
                    • 예상보다 낮을 때: 주식 상승(경제 건전), 금리 상승(연준 긴축 지속), 달러 강세
                    • 예상보다 높을 때: 주식 혼조(경기 둔화 vs 금리 인하 기대), 채권 상승, 달러 약세
                    • 4% 돌파 시: 연준 금리 인하 기대감 → 성장주(테크) 상승 가능
                    • 투자 전략: 3%대 유지 시 공격적 투자, 5% 이상 시 방어적 자산 배분
                """,

                'additional_info': """
                    • 발표 시기: 매월 첫째 주 금요일 오전 8:30 (ET)
                    • 조사 기간: 전월 12일 포함한 주
                    • 출처: U.S. Bureau of Labor Statistics (BLS)
                    • 역사적 수준: 대공황(25%), 2008 금융위기(10%), COVID-19(14.7%)
                    • 보완 지표: U-6 실업률(불완전고용 포함), 경제활동참가율
                """
            }
        },

        # ==========================================
        # 우선순위 4: CPI (소비자물가지수)
        # ==========================================
        'cpi': {
            'name': 'Consumer Price Index',
            'name_ko': '소비자물가지수',
            'category': 'inflation',
            'reverse_color': False,

            'interpretation': {
                'core_definition': """
                    도시 소비자가 구매하는 상품과 서비스의 평균 가격 변화를 측정하는 지표입니다.
                    식품, 에너지, 주거, 의료, 교통 등 8개 카테고리 약 80,000개 품목을 조사합니다.
                    인플레이션을 측정하는 가장 대표적인 지표입니다.
                """,

                'interpretation_guide': """
                    • YoY 2% 이하: 낮은 인플레이션 (연준 목표 이하)
                    • YoY 2%: 연준 목표 인플레이션 (건강한 수준)
                    • YoY 2%~4%: 적정~약간 높은 인플레이션 (긴축 고려)
                    • YoY 4%~6%: 높은 인플레이션 (긴축 필수)
                    • YoY 6% 이상: 매우 높은 인플레이션 (공격적 긴축)
                    • Core CPI: 변동성 큰 식품·에너지 제외 (추세 파악에 더 중요)
                """,

                'context_meaning': """
                    CPI는 연준의 통화정책 결정에 가장 직접적인 영향을 미치는 지표입니다.
                    2% 목표를 크게 벗어나면 금리 조정이 거의 확실시됩니다.
                    단, 공급 충격(유가 급등 등) 영향을 많이 받으므로 Core CPI와 함께 봐야 정확합니다.
                """,

                'market_reaction': """
                    • 예상보다 높을 때: 주식 하락(금리 인상 우려), 채권 하락(금리↑), 달러 강세
                    • 예상보다 낮을 때: 주식 상승(금리 안정), 채권 상승(금리↓), 달러 약세
                    • 5% 이상 지속: 금 등 인플레이션 헤지 자산 선호
                    • 투자 전략: 고인플레이션 시 원자재·부동산 선호, 저인플레이션 시 성장주 선호
                """,

                'additional_info': """
                    • 발표 시기: 매월 중순 오전 8:30 (ET)
                    • 조사 기간: 전월 전체
                    • 출처: U.S. Bureau of Labor Statistics (BLS)
                    • 기준 연도: 1982-84 = 100
                    • 관련 지표: PCE Price Index (연준 선호), PPI (생산자물가지수)
                """
            }
        },

        # ==========================================
        # 우선순위 5: GDP (국내총생산)
        # ==========================================
        'gdp': {
            'name': 'Gross Domestic Product',
            'name_ko': '국내총생산',
            'category': 'business',
            'reverse_color': False,

            'interpretation': {
                'core_definition': """
                    일정 기간(분기) 동안 미국 내에서 생산된 모든 최종 재화와 서비스의 시장가치 총합입니다.
                    소비(C) + 투자(I) + 정부지출(G) + 순수출(X-M)로 구성되며,
                    경제 규모와 성장률을 나타내는 가장 포괄적인 지표입니다.
                """,

                'interpretation_guide': """
                    • 3% 이상: 강한 경제 성장 (과열 가능성)
                    • 2%~3%: 적정 성장 (건강한 경제)
                    • 1%~2%: 완만한 성장 (둔화 조짐)
                    • 0%~1%: 매우 약한 성장 (침체 위험)
                    • 마이너스(-): 경기 후퇴 (2분기 연속 시 경기침체)
                """,

                'context_meaning': """
                    GDP는 경제 전체의 건강도를 측정하는 최종 지표입니다.
                    하지만 분기별 발표로 속보성이 낮고, 3번의 수정치 발표(속보→잠정→확정)가 있어
                    실시간 경기 판단보다는 장기 추세 확인에 적합합니다.
                    연준은 GDP보다 고용·물가 같은 월별 지표를 더 중시합니다.
                """,

                'market_reaction': """
                    • 예상보다 강할 때: 주식 상승(기업 실적 개선), 금리 상승, 달러 강세
                    • 예상보다 약할 때: 주식 하락(경기 둔화), 채권 상승, 달러 약세
                    • 마이너스 전환: 경기침체 확정 시 주식 급락, 안전자산 선호
                    • 투자 전략: 3% 이상 시 경기민감주 선호, 마이너스 시 채권·금 배분 확대
                """,

                'additional_info': """
                    • 발표 시기: 분기 종료 후 1개월 뒤 (속보), 2·3개월 뒤 (잠정·확정)
                    • 조사 기간: 분기 전체 (1·4·7·10월 발표)
                    • 출처: U.S. Bureau of Economic Analysis (BEA)
                    • 표기: 연율 환산(Annualized), 실질 GDP (물가 조정)
                    • 보완 지표: GDI (국내총소득), GDP Now (애틀랜타 연은 실시간 추정)
                """
            }
        },

        # ==========================================
        # 우선순위 6: Federal Funds Rate (연방기금금리)
        # ==========================================
        'federal-funds-rate': {
            'name': 'Federal Funds Rate',
            'name_ko': '연방기금금리',
            'category': 'interest',
            'reverse_color': False,

            'interpretation': {
                'core_definition': """
                    은행들이 연준에 예치한 지급준비금을 서로 빌려줄 때 적용하는 익일물 금리입니다.
                    연준(FOMC)이 직접 설정하는 기준금리로, 미국 금융시스템 전체의 금리 수준을 좌우합니다.
                    세계 경제에서 가장 중요한 단일 금리입니다.
                """,

                'interpretation_guide': """
                    • 0%~2%: 초저금리 (경기 부양, 양적완화 가능)
                    • 2%~4%: 적정 금리 (중립적 통화정책)
                    • 4%~6%: 긴축 금리 (인플레이션 억제)
                    • 6% 이상: 고금리 (공격적 긴축)
                    • 금리 인상: 경기 과열·인플레이션 억제 목적
                    • 금리 인하: 경기 부양·고용 촉진 목적
                """,

                'context_meaning': """
                    연준은 이중 책무(물가 안정 + 완전 고용)를 위해 금리를 조정합니다.
                    금리 인상 → 대출 비용↑, 소비·투자 감소, 경기 둔화, 인플레이션 하락
                    금리 인하 → 대출 비용↓, 소비·투자 증가, 경기 부양, 인플레이션 상승
                    FOMC는 연 8회 회의에서 금리 결정, 의사록(minutes)과 점도표(dot plot) 발표로 향후 방향 제시
                """,

                'market_reaction': """
                    • 금리 인상: 주식 하락(특히 성장주·테크), 달러 강세, 채권 하락, 금 하락
                    • 금리 인하: 주식 상승(특히 성장주), 달러 약세, 채권 상승, 금 상승
                    • 서프라이즈 결정: 시장 변동성 급증
                    • 투자 전략: 금리 인상기 → 가치주·배당주 선호, 금리 인하기 → 성장주·부동산 선호
                """,

                'additional_info': """
                    • 발표 시기: 연 8회 FOMC 회의 (6주마다, 보통 수요일 오후 2시 ET)
                    • 결정 방식: FOMC 위원 투표 (의장·부의장 포함 12명)
                    • 출처: Federal Reserve (연준)
                    • 표기: 목표 범위 (예: 5.25%~5.50%)
                    • 부속 자료: FOMC 성명서, 파월 의장 기자회견, 경제 전망 요약(SEP), 점도표
                """
            }
        },

        # ==========================================
        # 나머지 지표들 (템플릿 - 향후 작성)
        # ==========================================
        'ism-non-manufacturing': {
            'name': 'ISM Non-Manufacturing PMI',
            'name_ko': '비제조업 구매관리자지수',
            'category': 'business',
            'reverse_color': False,
            'interpretation': {
                'core_definition': '작성 예정 - ISM Manufacturing과 유사한 구조로 작성',
                'interpretation_guide': '작성 예정',
                'context_meaning': '작성 예정',
                'market_reaction': '작성 예정',
                'additional_info': '작성 예정'
            }
        },

        'retail-sales': {
            'name': 'Retail Sales',
            'name_ko': '소매 판매',
            'category': 'business',
            'reverse_color': False,
            'interpretation': {
                'core_definition': '작성 예정',
                'interpretation_guide': '작성 예정',
                'context_meaning': '작성 예정',
                'market_reaction': '작성 예정',
                'additional_info': '작성 예정'
            }
        },

        'initial-jobless-claims': {
            'name': 'Initial Jobless Claims',
            'name_ko': '신규실업급여신청',
            'category': 'employment',
            'reverse_color': True,
            'interpretation': {
                'core_definition': '작성 예정',
                'interpretation_guide': '작성 예정',
                'context_meaning': '작성 예정',
                'market_reaction': '작성 예정',
                'additional_info': '작성 예정'
            }
        },

        # ... 나머지 10개 지표도 동일한 템플릿으로 추가 가능
    }

    @classmethod
    def get_interpretation(cls, indicator_id: str) -> Optional[Dict[str, str]]:
        """지표 해석 정보 조회"""
        metadata = cls.METADATA.get(indicator_id)
        if metadata:
            return metadata.get('interpretation')
        return None

    @classmethod
    def get_metadata(cls, indicator_id: str) -> Optional[Dict[str, Any]]:
        """지표 전체 메타데이터 조회"""
        return cls.METADATA.get(indicator_id)

    @classmethod
    def get_all_metadata(cls) -> Dict[str, Dict[str, Any]]:
        """모든 지표 메타데이터 조회"""
        return cls.METADATA

    @classmethod
    def is_priority_indicator(cls, indicator_id: str) -> bool:
        """우선순위 지표 여부 확인"""
        return indicator_id in cls.PRIORITY_INDICATORS
