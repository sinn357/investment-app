"""
경제지표 통합 설정 파일
- 모든 지표의 메타데이터 중앙 관리
- 정책지표 제거 (GDP, FOMC 등)
- 7개 카테고리: business, employment, interest, trade, inflation, credit, sentiment
"""

from typing import Dict, Any, Optional

CORE_INDICATOR_IDS = {
    # Growth
    "ism-manufacturing",
    "ism-non-manufacturing",
    "retail-sales",
    "michigan-consumer-sentiment",
    # Labor
    "nonfarm-payrolls",
    "unemployment-rate",
    "average-hourly-earnings",
    "initial-jobless-claims",
    # Rates
    "federal-funds-rate",
    "two-year-treasury",
    "ten-year-treasury",
    "yield-curve-10y-2y",
    "real-yield-tips",
    # Inflation
    "core-cpi",
    "pce",
    "cpi",
    "brent-oil",
    "sp-gsci",
    # Trade
    "usd-index",
    "usd-krw",
    "goods-trade-balance",
    "business-inventories-trade",
    "baltic-dry-index",
    "trade-balance",
    # Credit
    "hy-spread",
    "ig-spread",
    "fci",
    # Sentiment
    "vix",
    "put-call-ratio",
    "aaii-bull",
    "sp500-pe",
}

class IndicatorConfig:
    """개별 지표 설정"""
    def __init__(
        self,
        id: str,
        name: str,
        name_ko: str,
        url: str,
        category: str,
        enabled: bool = True,
        threshold: Optional[Dict[str, float]] = None,
        reverse_color: bool = False,  # True면 낮을수록 좋은 지표 (실업률 등)
        manual_check: bool = False,  # True면 크롤링 불가, 직접 확인 필요
        calculate_yoy: bool = False,  # True면 FRED 데이터를 YoY% 변화율로 변환
        is_core: Optional[bool] = None,  # 핵심 지표 여부 (Phase 1)
    ):
        self.id = id
        self.name = name
        self.name_ko = name_ko
        self.url = url
        self.category = category
        self.enabled = enabled
        self.threshold = threshold or {}
        self.reverse_color = reverse_color
        self.manual_check = manual_check
        self.calculate_yoy = calculate_yoy
        self.is_core = (id in CORE_INDICATOR_IDS) if is_core is None else is_core

# 전체 지표 설정 (정책지표 제외, 활성 지표만)
INDICATORS: Dict[str, IndicatorConfig] = {
    # ========== 경기지표 (Business) ==========
    "ism-manufacturing": IndicatorConfig(
        id="ism-manufacturing",
        name="ISM Manufacturing PMI",
        name_ko="ISM 제조업 PMI",
        url="https://www.investing.com/economic-calendar/ism-manufacturing-pmi-173",
        category="business",
        threshold={"expansion": 50, "strong": 55, "contraction": 45},
    ),
    "ism-non-manufacturing": IndicatorConfig(
        id="ism-non-manufacturing",
        name="ISM Non-Manufacturing PMI",
        name_ko="ISM 비제조업 PMI",
        url="https://www.investing.com/economic-calendar/ism-non-manufacturing-pmi-176",
        category="business",
        threshold={"expansion": 50, "strong": 55, "contraction": 45},
    ),
    "sp-global-composite": IndicatorConfig(
        id="sp-global-composite",
        name="S&P Global Composite PMI",
        name_ko="S&P 글로벌 종합 PMI",
        url="https://www.investing.com/economic-calendar/s-p-global-composite-pmi-1492",
        category="business",
        threshold={"expansion": 50, "strong": 55, "contraction": 45},
    ),
    "industrial-production": IndicatorConfig(
        id="industrial-production",
        name="Industrial Production MoM",
        name_ko="산업생산 (MoM)",
        url="https://www.investing.com/economic-calendar/industrial-production-161",
        category="business",
        enabled=True,  # ✅ URL 수정으로 재활성화
    ),
    "industrial-production-1755": IndicatorConfig(
        id="industrial-production-1755",
        name="Industrial Production YoY",
        name_ko="산업생산 (YoY)",
        url="https://fred.stlouisfed.org/series/INDPRO",
        category="business",
        calculate_yoy=True,
    ),
    "retail-sales": IndicatorConfig(
        id="retail-sales",
        name="Retail Sales MoM",
        name_ko="소매판매 (MoM)",
        url="https://www.investing.com/economic-calendar/retail-sales-256",
        category="business",
    ),
    "retail-sales-yoy": IndicatorConfig(
        id="retail-sales-yoy",
        name="Retail Sales YoY",
        name_ko="소매판매 (YoY)",
        url="https://fred.stlouisfed.org/series/RSAFS",
        category="business",
        calculate_yoy=True,
    ),
    "cb-consumer-confidence": IndicatorConfig(
        id="cb-consumer-confidence",
        name="CB Consumer Confidence",
        name_ko="소비자신뢰지수 (CB)",
        url="https://www.investing.com/economic-calendar/cb-consumer-confidence-48",
        category="business",
        threshold={"strong": 100, "weak": 90},
    ),
    "consumer-confidence": IndicatorConfig(
        id="consumer-confidence",
        name="Consumer Confidence",
        name_ko="소비자신뢰지수",
        url="https://www.investing.com/economic-calendar/consumer-confidence-48",
        category="business",
    ),
    "michigan-consumer-sentiment": IndicatorConfig(
        id="michigan-consumer-sentiment",
        name="Michigan Consumer Sentiment",
        name_ko="미시간 소비자심리",
        url="https://fred.stlouisfed.org/series/UMCSENT",
        category="business",
        threshold={"strong": 100, "weak": 80},
    ),
    "leading-indicators": IndicatorConfig(
        id="leading-indicators",
        name="Leading Indicators",
        name_ko="경기선행지수",
        url="https://www.oecd.org/en/data/indicators/composite-leading-indicator-cli.html",
        category="business",
        enabled=True,
        manual_check=True,  # 직접 확인 필요
    ),

    # ========== 고용지표 (Employment) ==========
    "unemployment-rate": IndicatorConfig(
        id="unemployment-rate",
        name="Unemployment Rate",
        name_ko="실업률",
        url="https://fred.stlouisfed.org/series/UNRATE",
        category="employment",
        reverse_color=True,  # 낮을수록 좋음
        threshold={"low": 4.0, "high": 6.0},
    ),
    "nonfarm-payrolls": IndicatorConfig(
        id="nonfarm-payrolls",
        name="Nonfarm Payrolls",
        name_ko="비농업 고용",
        url="https://www.investing.com/economic-calendar/nonfarm-payrolls-227",
        category="employment",
    ),
    "initial-jobless-claims": IndicatorConfig(
        id="initial-jobless-claims",
        name="Initial Jobless Claims",
        name_ko="신규 실업급여 신청",
        url="https://www.investing.com/economic-calendar/initial-jobless-claims-294",
        category="employment",
        reverse_color=True,  # 낮을수록 좋음
    ),
    "average-hourly-earnings": IndicatorConfig(
        id="average-hourly-earnings",
        name="Average Hourly Earnings MoM",
        name_ko="평균시간당임금 (MoM)",
        url="https://www.investing.com/economic-calendar/average-hourly-earnings-8",
        category="employment",
        enabled=True,  # ✅ URL 수정으로 재활성화
    ),
    "average-hourly-earnings-1777": IndicatorConfig(
        id="average-hourly-earnings-1777",
        name="Average Hourly Earnings YoY",
        name_ko="평균시간당임금 (YoY)",
        url="https://www.investing.com/economic-calendar/average-hourly-earnings-1777",
        category="employment",
    ),
    "participation-rate": IndicatorConfig(
        id="participation-rate",
        name="Participation Rate",
        name_ko="경제활동참가율",
        url="https://fred.stlouisfed.org/series/CIVPART",
        category="employment",
    ),

    # ========== 금리지표 (Interest Rate) ==========
    "federal-funds-rate": IndicatorConfig(
        id="federal-funds-rate",
        name="Federal Funds Rate",
        name_ko="연준 기준금리",
        url="https://fred.stlouisfed.org/series/FEDFUNDS",
        category="interest",
    ),
    "two-year-treasury": IndicatorConfig(
        id="two-year-treasury",
        name="2-Year Treasury Yield",
        name_ko="2년물 국채금리",
        url="https://www.investing.com/rates-bonds/u.s.-2-year-bond-yield",
        category="interest",
    ),
    "ten-year-treasury": IndicatorConfig(
        id="ten-year-treasury",
        name="10-Year Treasury Yield",
        name_ko="10년물 국채금리",
        url="https://www.investing.com/rates-bonds/u.s.-10-year-bond-yield",
        category="interest",
    ),
    "yield-curve-10y-2y": IndicatorConfig(
        id="yield-curve-10y-2y",
        name="Yield Curve (10Y-2Y)",
        name_ko="장단기금리차 (10Y-2Y)",
        url="https://fred.stlouisfed.org/series/T10Y2Y",
        category="interest",
    ),
    "real-yield-tips": IndicatorConfig(
        id="real-yield-tips",
        name="Real Yield (TIPS)",
        name_ko="실질금리 (TIPS)",
        url="https://fred.stlouisfed.org/series/DFII10",
        category="interest",
    ),

    # ========== 무역지표 (Trade) ==========
    "trade-balance": IndicatorConfig(
        id="trade-balance",
        name="Trade Balance",
        name_ko="무역수지",
        url="https://www.investing.com/economic-calendar/trade-balance-259",
        category="trade",
    ),
    "exports": IndicatorConfig(
        id="exports",
        name="Exports",
        name_ko="수출",
        url="https://fred.stlouisfed.org/series/EXPGS",
        category="trade",
        enabled=True,
        manual_check=True,  # 직접 확인 필요
    ),
    "imports": IndicatorConfig(
        id="imports",
        name="Imports",
        name_ko="수입",
        url="https://fred.stlouisfed.org/series/IMPGS",
        category="trade",
        enabled=True,
        manual_check=True,  # 직접 확인 필요
    ),
    "current-account-balance": IndicatorConfig(
        id="current-account-balance",
        name="Current Account Balance",
        name_ko="경상수지",
        url="https://fred.stlouisfed.org/series/BOPBCA",
        category="trade",
        enabled=True,
        manual_check=True,  # 직접 확인 필요 (BEA API 키 필요)
    ),

    # ========== 수출입물가 ==========
    "export-price-index-mom": IndicatorConfig(
        id="export-price-index-mom",
        name="Export Price Index MoM",
        name_ko="수출물가지수 (MoM)",
        url="https://www.investing.com/economic-calendar/export-price-index-892",
        category="trade",
    ),
    "export-price-index-yoy": IndicatorConfig(
        id="export-price-index-yoy",
        name="Export Price Index YoY",
        name_ko="수출물가지수 (YoY)",
        url="https://www.investing.com/economic-calendar/export-price-index-1748",
        category="trade",
    ),

    # ========== 재고/공급망 ==========
    "business-inventories-trade": IndicatorConfig(
        id="business-inventories-trade",
        name="Business Inventories",
        name_ko="재고순환지표",
        url="https://www.investing.com/economic-calendar/business-inventories-29",
        category="trade",
    ),

    # ========== 환율 (Historical Data) ==========
    "usd-index": IndicatorConfig(
        id="usd-index",
        name="US Dollar Index (DXY)",
        name_ko="달러 인덱스",
        url="https://www.investing.com/indices/usdollar",
        category="trade",
        enabled=True,  # ✅ 크롤러 수정 완료
    ),
    "usd-krw": IndicatorConfig(
        id="usd-krw",
        name="USD/KRW Exchange Rate",
        name_ko="원/달러 환율",
        url="https://www.investing.com/currencies/usd-krw",
        category="trade",
        enabled=True,  # ✅ 크롤러 수정 완료
    ),
    "reer": IndicatorConfig(
        id="reer",
        name="Real Effective Exchange Rate",
        name_ko="실질실효환율 (REER)",
        url="https://fred.stlouisfed.org/series/RBUSBIS",
        category="trade",
    ),
    "baltic-dry-index": IndicatorConfig(
        id="baltic-dry-index",
        name="Baltic Dry Index",
        name_ko="발틱운임지수 (BDI)",
        url="https://www.investing.com/indices/baltic-dry",
        category="trade",
    ),
    "goods-trade-balance": IndicatorConfig(
        id="goods-trade-balance",
        name="Goods Trade Balance",
        name_ko="상품 무역수지",
        url="https://www.investing.com/economic-calendar/goods-trade-balance-1650",
        category="trade",
    ),
    "services-trade-balance": IndicatorConfig(
        id="services-trade-balance",
        name="Services Trade Balance",
        name_ko="서비스 무역수지",
        url="https://fred.stlouisfed.org/series/BOPSTB",
        category="trade",
    ),
    "terms-of-trade": IndicatorConfig(
        id="terms-of-trade",
        name="Terms of Trade",
        name_ko="교역조건지수",
        url="https://tradingeconomics.com/united-states/terms-of-trade",
        category="trade",
    ),

    # 향후 추가 예정 (크롤러 개발 필요):
    # - Freightos Baltic Index (Freightos)

    # ========== 물가지표 (Inflation) ==========
    "cpi": IndicatorConfig(
        id="cpi",
        name="Consumer Price Index (CPI) YoY",
        name_ko="소비자물가지수 (YoY)",
        url="https://fred.stlouisfed.org/series/CPIAUCSL",
        category="inflation",
        threshold={"target": 2.0, "high": 3.0},
        calculate_yoy=True,
    ),
    "core-cpi": IndicatorConfig(
        id="core-cpi",
        name="Core CPI YoY",
        name_ko="근원 소비자물가지수 (YoY)",
        url="https://fred.stlouisfed.org/series/CPILFESL",
        category="inflation",
        calculate_yoy=True,
    ),
    "ppi": IndicatorConfig(
        id="ppi",
        name="Producer Price Index (PPI) YoY",
        name_ko="생산자물가지수 (YoY)",
        url="https://fred.stlouisfed.org/series/PPIACO",
        category="inflation",
        calculate_yoy=True,
    ),
    "pce": IndicatorConfig(
        id="pce",
        name="Personal Consumption Expenditures (PCE)",
        name_ko="개인소비지출",
        url="https://www.investing.com/economic-calendar/personal-spending-235",
        category="inflation",
    ),

    # ========== 기대 인플레이션 ==========
    "michigan-1y-inflation": IndicatorConfig(
        id="michigan-1y-inflation",
        name="Michigan 1-Year Inflation Expectations",
        name_ko="미시간 1년 기대 인플레",
        url="https://www.investing.com/economic-calendar/michigan-inflation-expectations-389",
        category="inflation",
        threshold={"target": 2.0, "high": 3.0},
    ),
    "michigan-5y-inflation": IndicatorConfig(
        id="michigan-5y-inflation",
        name="Michigan 5-Year Inflation Expectations",
        name_ko="미시간 5년 기대 인플레",
        url="https://www.investing.com/economic-calendar/michigan-5-year-inflation-expectations-1568",
        category="inflation",
        threshold={"target": 2.0, "high": 2.5},
    ),

    # ========== 국제유가 ==========
    "brent-oil": IndicatorConfig(
        id="brent-oil",
        name="Brent Crude Oil",
        name_ko="브렌트유",
        url="https://www.investing.com/commodities/brent-oil",
        category="inflation",
        enabled=True,  # ✅ 크롤러 수정 완료
    ),
    "wti-oil": IndicatorConfig(
        id="wti-oil",
        name="WTI Crude Oil",
        name_ko="WTI 원유",
        url="https://www.investing.com/commodities/crude-oil",
        category="inflation",
        enabled=True,  # ✅ 크롤러 수정 완료
    ),

    # ========== 원자재지수 ==========
    "sp-gsci": IndicatorConfig(
        id="sp-gsci",
        name="S&P GSCI Commodity Index",
        name_ko="S&P GSCI 원자재지수",
        url="https://www.spglobal.com/spdji/en/indices/commodities/sp-gsci/",
        category="inflation",
        enabled=True,
        manual_check=True,  # 직접 확인 필요
    ),

    # ========== 신용/유동성지표 (Credit) ==========
    "hy-spread": IndicatorConfig(
        id="hy-spread",
        name="High Yield Spread",
        name_ko="하이일드 스프레드",
        url="https://fred.stlouisfed.org/series/BAMLH0A0HYM2",
        category="credit",
        threshold={"tight": 250, "normal": 500, "wide": 700},
    ),
    "ig-spread": IndicatorConfig(
        id="ig-spread",
        name="Investment Grade Spread",
        name_ko="투자등급 스프레드",
        url="https://fred.stlouisfed.org/series/BAMLC0A0CM",
        category="credit",
        threshold={"tight": 100, "normal": 150, "wide": 200},
    ),
    "fci": IndicatorConfig(
        id="fci",
        name="Financial Conditions Index",
        name_ko="금융여건지수",
        url="https://fred.stlouisfed.org/series/NFCI",
        category="credit",
        threshold={"loose": -0.5, "neutral": 0, "tight": 0.5},
        enabled=True,
        manual_check=True,  # ⚠️ 직접 확인 필요 (Credit Cycle 가중치 25%)
    ),
    "m2-yoy": IndicatorConfig(
        id="m2-yoy",
        name="M2 Money Supply YoY",
        name_ko="통화량 M2 증가율",
        url="https://www.investing.com/economic-calendar/us-m2-money-supply-1999",
        category="credit",
        threshold={"low": 2, "normal": 5, "high": 10},
    ),

    # ========== 심리/밸류에이션지표 (Sentiment) ==========
    "vix": IndicatorConfig(
        id="vix",
        name="CBOE Volatility Index",
        name_ko="VIX 변동성지수",
        url="https://www.investing.com/indices/volatility-s-p-500",
        category="sentiment",
        threshold={"low": 15, "normal": 20, "high": 30},
    ),
    "aaii-bull": IndicatorConfig(
        id="aaii-bull",
        name="AAII Bull Sentiment",
        name_ko="AAII 강세 심리",
        url="https://www.aaii.com/sentimentsurvey",
        category="sentiment",
        threshold={"low": 25, "normal": 35, "high": 45},
        enabled=True,
        manual_check=True,  # 직접 확인 필요 (API 접근 제한)
    ),
    "sp500-pe": IndicatorConfig(
        id="sp500-pe",
        name="S&P 500 P/E Ratio",
        name_ko="S&P 500 주가수익비율",
        url="https://www.multpl.com/s-p-500-pe-ratio",  # Phase 2: Multpl.com 크롤링
        category="sentiment",
        threshold={"undervalued": 15, "fair": 20, "overvalued": 25},
        enabled=True,  # ✅ Phase 2: 활성화
    ),
    "shiller-pe": IndicatorConfig(
        id="shiller-pe",
        name="Shiller P/E Ratio (CAPE)",
        name_ko="실러 CAPE 비율",
        url="https://www.multpl.com/shiller-pe",  # Phase 2: Multpl.com 크롤링
        category="sentiment",
        threshold={"undervalued": 20, "fair": 25, "overvalued": 30},
        enabled=True,  # ✅ Phase 2: 활성화
    ),
    "put-call-ratio": IndicatorConfig(
        id="put-call-ratio",
        name="CBOE Put/Call Ratio",
        name_ko="풋/콜 비율",
        url="https://www.cboe.com",  # Phase 2: 폴백 (1.0 중립값)
        category="sentiment",
        threshold={"bullish": 0.7, "neutral": 1.0, "bearish": 1.3},
        enabled=True,  # ✅ Phase 2: 활성화 (폴백)
    ),
}

# 정책지표 제거됨 (GDP, FOMC 등)
# - gdp: 정책지표로 분류되어 제거
# - fomc-minutes: 정책지표로 분류되어 제거

# 카테고리별 지표 조회 헬퍼 함수
def get_indicators_by_category(category: str) -> Dict[str, IndicatorConfig]:
    """특정 카테고리의 활성 지표만 반환"""
    return {
        id: config
        for id, config in INDICATORS.items()
        if config.category == category and config.enabled
    }

def get_all_enabled_indicators() -> Dict[str, IndicatorConfig]:
    """모든 활성 지표 반환"""
    return {id: config for id, config in INDICATORS.items() if config.enabled}

def get_indicator_config(indicator_id: str) -> Optional[IndicatorConfig]:
    """ID로 지표 설정 조회"""
    return INDICATORS.get(indicator_id)

# 카테고리 목록
CATEGORIES = {
    "business": "경기지표",
    "employment": "고용지표",
    "interest": "금리지표",
    "trade": "무역지표",
    "inflation": "물가지표",
    "credit": "신용지표",
    "sentiment": "심리지표",
}

# 통계
TOTAL_INDICATORS = len(INDICATORS)
ENABLED_INDICATORS = len(get_all_enabled_indicators())

if __name__ == "__main__":
    print(f"📊 경제지표 설정 요약")
    print(f"전체 지표: {TOTAL_INDICATORS}개")
    print(f"활성 지표: {ENABLED_INDICATORS}개")
    print()

    for category_id, category_name in CATEGORIES.items():
        indicators = get_indicators_by_category(category_id)
        print(f"{category_name}: {len(indicators)}개")
        for id, config in indicators.items():
            print(f"  - {config.name_ko} ({config.id})")
