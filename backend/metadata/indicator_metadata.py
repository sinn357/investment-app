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
        # 금리지표 추가: 10년물 국채금리
        # ==========================================
        'ten-year-treasury': {
            'name': '10-Year Treasury Yield',
            'name_ko': '10년물 국채금리',
            'category': 'interest',
            'reverse_color': False,
            'interpretation': {
                'core_definition': """
                    미국 금융시장의 장기 기준 금리로, 기업가치 평가·주택담보대출·국가 리스크 프리미엄에 모두 영향을 미칩니다.
                    "오늘 시장이 경기와 물가를 어떻게 전망하는가"를 보여주는 대표 지표입니다.
                """,

                'interpretation_guide': """
                    • 10Y = 물가 기대(Inflation Expectations) + 실질금리
                    • 주택시장과 주식의 할인율을 결정
                    • 3.5~4% 부근은 장기 중립 범위로 간주
                    • 장기 자금조달 비용이 어떻게 변하는지 확인
                    • 상승세인지 하락세인지 → 경기 기대가 개선되는지 둔화되는지
                    • 금리 상승 시 인플레이션 우려 또는 경기 회복 기대
                    • 금리 하락 시 경기 둔화 또는 위험 회피 수요 증가
                """,

                'context_meaning': """
                    미국 정부가 발행하는 10년 만기 국채의 시장 수익률입니다.
                    전 세계 장기 대출, 기업채, 주택담보대출 등 '세상의 기준금리'입니다.
                    장기 성장률·물가·재정 상황 등을 종합 반영하며, 글로벌 자금 흐름의 방향성까지 담고 있습니다.
                    안전자산 선호(위기 시 국채 매입) 때문에 갑자기 떨어질 수도 있습니다.
                """,

                'market_reaction': """
                    • 10Y 상승: 성장주 하락, 가치주 상승, 부동산 하락
                    • 10Y 하락: 성장주 상승, 고배당주 상승, 채권 상승, 금 상승
                    • 10Y 급등: 긴축적 금융환경, 달러 강세
                    • 투자 전략: 10Y 고점 시 채권 매수 기회, 저점 시 주식 선호
                """,

                'additional_info': """
                    • 발표: 실시간 시장 거래 가격 (24시간)
                    • 출처: Investing.com, FRED (연준 데이터)
                    • 링크: https://www.investing.com/rates-bonds/u.s.-10-year-bond-yield
                    • 특이사항: 경제지표 발표, 연준 발언에 민감 반응
                """
            }
        },

        # ==========================================
        # 금리지표 추가: 2년물 국채금리
        # ==========================================
        'two-year-treasury': {
            'name': '2-Year Treasury Yield',
            'name_ko': '2년물 국채금리',
            'category': 'interest',
            'reverse_color': False,
            'interpretation': {
                'core_definition': """
                    향후 1~2년 내 연준 정책 방향과 경기 전망을 가장 직접 반영하는 단기 기준금리입니다.
                    연준 기준금리(Federal Funds Rate)와 거의 1:1로 움직이며, 시장의 금리 기대를 실시간 반영합니다.
                """,

                'interpretation_guide': """
                    • 2Y > FFR: 시장이 금리 인상을 예상
                    • 2Y < FFR: 시장이 금리 인하를 예상
                    • 2Y ≈ FFR: 중립적 금리 전망
                    • 급등(+0.5%p 이상): 매파적 연준 정책 기대
                    • 급락(-0.5%p 이상): 비둘기파적 연준 정책 기대
                    • 인플레 지표 발표 후 가장 민감하게 반응
                """,

                'context_meaning': """
                    2년물은 연준의 정책 금리 경로를 시장이 어떻게 평가하는지 보여주는 '금리 기대값'입니다.
                    단기적으로 경제 흐름(6~18개월)을 읽는 핵심 지표이며, 변동성이 크지만 방향성은 명확합니다.
                    연준이 금리 인하를 말해도 2년물이 버티면 시장은 '안 믿는다'는 뜻입니다.
                """,

                'market_reaction': """
                    • 2Y 상승: 금리 예상↑ → 성장주 하락, 달러 강세
                    • 2Y 하락: 금리 완화 기대↑ → 주식 상승
                    • 단기 자산가격 변동의 주된 촉매
                    • 투자 전략: 2Y 급등 시 가치주 선호, 2Y 급락 시 성장주·부동산 선호
                """,

                'additional_info': """
                    • 발표: 실시간 시장 거래 가격 (24시간)
                    • 출처: Investing.com, FRED (연준 데이터)
                    • 링크: https://www.investing.com/rates-bonds/u.s.-2-year-bond-yield
                    • 특이사항: FOMC 결과 발표 직후 급변동
                """
            }
        },

        # ==========================================
        # 금리지표 추가: 장단기금리차 (10Y-2Y)
        # ==========================================
        'yield-curve-10y-2y': {
            'name': 'Yield Curve (10Y-2Y)',
            'name_ko': '장단기금리차 (10Y-2Y)',
            'category': 'interest',
            'reverse_color': False,
            'interpretation': {
                'core_definition': """
                    10년물 국채금리와 2년물 국채금리의 차이로, 경기침체 가능성을 가장 정확하게 경고하는 지표입니다.
                    일반적으로 장기금리 > 단기금리 정상 구간이지만, 역전 시 침체 위험이 높아집니다.
                """,

                'interpretation_guide': """
                    • 정상 구간 (+0.5% 이상): 장기금리 > 단기금리 → 정상적 성장 환경
                    • 평탄화 (0% ~ +0.5%): 경기 전환점 신호
                    • 역전 구간 (0% 이하): 장기금리 < 단기금리 → 침체 위험 높음
                    • 역사적으로 역전 후 6~18개월 내 경기침체 확률 높음
                    • 얼마나 오랫동안 역전 유지되었는지가 중요
                """,

                'context_meaning': """
                    단기금리(정책) > 장기금리(성장 기대)일 때 침체 경고입니다.
                    채권시장이 연준보다 빠르게 경기 하강을 예측하는 구조입니다.
                    장기금리가 낮아진다는 건 미래에 대한 불신, 안전자산 선호 심리 강화를 의미합니다.
                """,

                'market_reaction': """
                    • 역전 확대: 방어주 상승, 채권 상승, 성장주 하락
                    • 역전 축소(스티프닝): 경기 회복 기대 → 금융·산업·에너지 상승
                    • 정상화 시(단기금리 급락): 침체 본격화 → 채권 수익 기회
                    • 투자 전략: 역전 시 채권·금 배분 확대, 정상화 시 경기민감주 진입
                """,

                'additional_info': """
                    • 발표: 실시간 계산 (10Y - 2Y)
                    • 출처: FRED (세인트루이스 연은)
                    • 링크: https://fred.stlouisfed.org/series/T10Y2Y
                    • 역사: 미국 경기침체를 거의 다 맞췄지만 타이밍은 다름
                """
            }
        },

        # ==========================================
        # 금리지표 추가: 실질금리 (TIPS)
        # ==========================================
        'real-yield-tips': {
            'name': 'Real Yield (TIPS)',
            'name_ko': '실질금리 (TIPS)',
            'category': 'interest',
            'reverse_color': False,
            'interpretation': {
                'core_definition': """
                    실질금리 = 명목금리 - 기대 인플레이션.
                    인플레이션을 제거한 진짜 자금 비용으로, 성장주 가치평가에 가장 결정적인 금리입니다.
                    10년물 TIPS(물가연동채권) 금리를 사용합니다.
                """,

                'interpretation_guide': """
                    • 실질금리 상승: 할인율 상승 → 성장주 하락
                    • 실질금리 하락: 할인율 하락 → 성장주 상승
                    • 기대 인플레이션이 변해도 실질금리는 장기 성장성과 글로벌 투자심리 반영
                    • 명목금리보다 주식 밸류에이션에 더 큰 영향
                """,

                'context_meaning': """
                    "돈의 진짜 가격"이라고 할 수 있습니다.
                    경제 주체가 느끼는 돈의 무게감을 보여줍니다.
                    명목금리보다 체감은 덜 되지만, 주식의 밸류에이션을 사실상 더 영향을 주어 결정하는 코어 금리입니다.
                """,

                'market_reaction': """
                    • Real Yield 상승: 성장주 하락, 가치주 상승, 달러 강세
                    • Real Yield 하락: 성장주 상승, 위험자산 상승, 부동산 상승, 금 상승
                    • 금·비트코인 등 무이자 자산은 실질금리에 매우 민감
                    • 투자 전략: 실질금리 고점 시 성장주 매수 기회, 저점 시 가치주 선호
                """,

                'additional_info': """
                    • 발표: 실시간 시장 거래 가격
                    • 출처: FRED (10년 TIPS 금리)
                    • 링크: https://fred.stlouisfed.org/series/DFII10
                    • 계산: 10Y Treasury Yield - 10Y Breakeven Inflation Rate
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
