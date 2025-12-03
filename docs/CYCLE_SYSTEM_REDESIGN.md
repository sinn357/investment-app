# 경제 사이클 판별 시스템 재설계 계획서

> **목적**: 기존 4개 게이지 시스템을 3대 메타 사이클 + 세부 지표로 재구성하여 투자 의사결정 정확도 향상

**작성일**: 2025-12-03
**상태**: 계획 단계
**예상 소요**: 3-4 세션

---

## 📋 목차

1. [현황 분석](#1-현황-분석)
2. [목표 시스템 설계](#2-목표-시스템-설계)
3. [지표 선정 전략](#3-지표-선정-전략)
4. [계산 로직](#4-계산-로직)
5. [구현 계획](#5-구현-계획)
6. [참고 자료](#6-참고-자료)

---

## 1. 현황 분석

### 1.1 현재 시스템 (As-Is)

**UI 구조**: `/frontend/src/app/indicators/page.tsx`

```
┌─────────────────────────────────────┐
│   CyclePanel (4개 원형 게이지)      │
│  성장 │ 인플레 │ 금리 │ 유동성      │
└─────────────────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│   IndicatorGrid (47개 지표 카드)    │
└─────────────────────────────────────┘
```

**보유 경제지표**: 총 47개

| 카테고리 | 개수 | 주요 지표 |
|---------|------|----------|
| BUSINESS | 12개 | ISM PMI, 소매판매, 산업생산 |
| EMPLOYMENT | 6개 | 실업률, 비농업고용, 신규실업급여 |
| INFLATION | 10개 | CPI, PPI, PCE, 원유, 원자재 |
| INTEREST | 5개 | Fed 금리, 2Y/10Y 국채, 장단기차, TIPS |
| TRADE | 14개 | 무역수지, 환율, REER, BDI, 교역조건 |

**크롤러**: 5개
- investing_crawler (Investing.com Economic Calendar)
- rates_bonds_crawler (Investing.com Historical Data)
- fred_crawler (FRED CSV API)
- tradingeconomics_crawler (TradingEconomics 표준 테이블)
- bea_crawler (BEA JSON API)

---

### 1.2 문제점 분석

#### ❌ 정보 과부하
- 47개 지표를 모두 추적하기 어려움
- 중복 지표 다수 (소매판매 MoM/YoY, 산업생산/YoY)
- 사용자가 "어떤 지표가 중요한지" 모름

#### ❌ 투자 의사결정 연결 부족
- 4개 게이지가 "무엇을 의미하는지" 불명확
- "지금 사야 하나? 팔아야 하나?" 판단 어려움
- 경기 국면만 보여주고 투자 행동 제안 없음

#### ❌ 노이즈 vs 시그널
- 노이즈가 큰 지표 포함 (소비자신뢰 3종, 기업재고)
- 후행 지표 혼재 (실업률, GDP)
- 검증되지 않은 지표 사용

---

## 2. 목표 시스템 설계 (To-Be)

### 2.1 핵심 철학

**"Less is More" 원칙**:
- 47개 전체 사용 ❌
- 검증된 핵심 지표만 ✅
- 반복성 높은 패턴만 ✅

**투자 대가들의 접근**:
- 레이 달리오: 4개 팩터 (성장, 인플레, 금리, 리스크프리미엄)
- 하워드 막스: 3개 축 (신용, 밸류, 심리)
- JP모건: 핵심 5~7개만 추적

---

### 2.2 시스템 구조

**Option 1: 계층적 구조 (선택됨 ⭐)**

```
┌─────────────────────────────────────────────────────┐
│          3대 메타 사이클 (상단 패널)                │
│   거시경제 사이클 │ 신용/유동성 사이클 │ 심리/밸류 사이클 │
│   ●●●○○ 회복     │ ●●○○○ 정상화     │ ●●●●○ 공포     │
│   📈 리스크온     │ ⚠️ 관찰          │ ✅ 매수기회     │
└─────────────────────────────────────────────────────┘
                    ↓ 세부 구성요소
┌─────────────────────────────────────────────────────┐
│          4개 세부 게이지 (하단 패널)                │
│     성장 │ 인플레 │ 금리 │ 유동성                  │
│     52.3 │  2.8%  │ 4.5% │  낮음                   │
└─────────────────────────────────────────────────────┘
```

**장점**:
- 메타 사이클 → 세부 지표로 자연스러운 흐름
- 투자 의사결정 단계와 일치 (큰 그림 → 상세 분석)
- 각 메타 사이클이 하위 게이지의 조합임을 명확히 표시

---

### 2.3 3대 메타 사이클 정의

#### 1️⃣ 거시경제 사이클

**정의**:
> 성장률·물가·금리·유동성의 상호작용으로 경제가 3~10년 단위의 침체 ↔ 회복 ↔ 확장 ↔ 둔화 단계를 반복하며 자산군 전체의 방향을 결정하는 중기적 파동

**4단계**:
- **침체** (Recession): PMI < 50, 장단기 역전, CPI 하락, 금리 인하 시작
- **회복** (Early Expansion): PMI 반등, CPI 둔화, 금리 인하 지속
- **확장** (Late Expansion): PMI 강세(>55), 물가 재반등, 금리 인상 압력
- **둔화** (Slowdown): PMI 하락(~50), 인플레 높음, 금리 인상 종료

**투자 행동**:
- 침체 → 주식·장기채 매수
- 회복 → 주식 최대 비중, 베타 극대화
- 확장 → 일부 축소, 방어주 로테이션
- 둔화 → 현금·단기채 확대

---

#### 2️⃣ 신용/유동성 사이클

**정의**:
> 신용공급과 자금유동성이 확대 ↔ 축소됨에 따라 리스크프리미엄(신용스프레드)이 2~7년 주기로 팽창 ↔ 수축하며 자산가격을 크게 왜곡시키는 중기적 파동

**3단계**:
- **신용 경색**: HY 스프레드 700~1000bp+, 대출기준 강화, FCI 악화
- **정상화**: 스프레드 축소 시작, 대출 완화, FCI 안정
- **신용 과잉**: 스프레드 <250bp, 신용 발행 활발, 레버리지 증가

**투자 행동**:
- 경색 → 하이일드채·폭락주 공격적 매수
- 정상화 → 주식 ETF·기업채 유지
- 과잉 → 고위험채 매도, 현금 증가

---

#### 3️⃣ 심리/밸류에이션 사이클

**정의**:
> 투자자들의 공포 ↔ 탐욕이 반복되며 자산가격이 본질가치 하단 ↔ 상단을 1~5년 주기로 왕복하는 파동

**3단계 (색상 시스템)**:
- **초록불 (공포)**: VIX >25, Bear>>Bull, PER <14, CAPE <16, ETF 유출
- **노란불 (중립)**: VIX 15~25, AAII 중립, PER 15~20, CAPE 20~25
- **빨간불 (과열)**: VIX <13, Bull 극단, PER >22, CAPE >28, ETF 유입

**투자 행동**:
- 초록 → 주식 비중 확대, 성장주 일부
- 노랑 → 핵심 ETF 유지, 구조적 섹터만
- 빨강 → 주식 축소, 단기채·현금·금 증가

---

## 3. 지표 선정 전략

### 3.1 선정 기준

#### ✅ 포함 기준
1. **반복성**: 최소 3번 이상 경기 사이클에서 검증
2. **예측력**: 선행 또는 동행 지표 (후행 제외)
3. **전문가 사용**: 월가·Fed·ECB가 공식 추적
4. **독립성**: 다른 지표와 중복되지 않음

#### ❌ 제외 기준
1. **노이즈 큼**: 변동성이 크고 패턴 불분명
2. **후행성**: 경기 변화 후 반응 (실업률, GDP)
3. **중복성**: 동일 정보를 다른 형태로 표시 (MoM/YoY)
4. **섹터별**: 전체 경제보다 특정 섹터 (원유, 원자재)

---

### 3.2 사이클별 핵심 지표

#### 1️⃣ 거시경제 사이클 (6개)

| 요소 | 지표 | 현재 보유 | 가중치 | 비고 |
|------|------|----------|--------|------|
| **성장** | ISM 제조업 PMI | ✅ | 30% | 최강 선행지표 |
| | ISM 비제조업 PMI | ✅ | 20% | 서비스업 보완 |
| **인플레** | 근원 CPI | ✅ | 20% | Fed 정책 기준 |
| | 근원 PCE | ✅ | 10% | Fed 공식 타겟 |
| **금리** | 연준 기준금리 | ✅ | 10% | 정책 방향 |
| | 장단기금리차 | ✅ | 10% | 침체 예고 |

**제외 지표 (26개)**:
- ❌ S&P 글로벌 PMI (ISM과 중복)
- ❌ 산업생산 2종 (PMI 후행)
- ❌ 소매판매 2종 (중복, 노이즈)
- ❌ 기업재고 (후행, 노이즈)
- ❌ 소비자신뢰 3종 (노이즈 큼)
- ❌ 경기선행지수 (우리가 만들 것)
- ❌ 실업률 (후행)
- ❌ 비농업고용 (후행)
- ❌ 신규실업급여 (노이즈)
- ❌ 평균시간당임금 2종 (임금 인플레는 CPI에 반영)
- ❌ 경제활동참가율 (후행)
- ❌ CPI/PPI/PCE (근원만 사용)
- ❌ 미시간 기대인플레 2종 (노이즈)
- ❌ 원유 2종 (섹터별)
- ❌ 원자재지수 (섹터별)
- ❌ 2Y/10Y 국채금리 (장단기차로 통합)
- ❌ TIPS (실질금리는 금리-인플레로 계산)
- ❌ 무역수지 3종 (거시 사이클과 무관)
- ❌ 환율 3종 (무역 사이클)
- ❌ 무역지표 6종 (별도 추적)

---

#### 2️⃣ 신용/유동성 사이클 (5개)

| 요소 | 지표 | 현재 보유 | 신규 크롤러 |
|------|------|----------|------------|
| **신용** | HY Spread | ❌ | FRED: BAMLH0A0HYM2 |
| | IG Spread | ❌ | FRED: BAMLC0A0CM |
| **금융여건** | FCI (Chicago Fed) | ❌ | FRED: NFCI |
| **통화량** | M2 YoY | ⚠️ | FRED: M2SL |
| **신용태도** | Loan Officer Survey | ❌ | Fed 분기별 |

**중요도**:
1. HY Spread ⭐⭐⭐ (최강 신용 신호)
2. FCI ⭐⭐⭐ (유동성 총합)
3. Loan Survey ⭐⭐ (신용 공급)
4. M2 YoY ⭐⭐ (통화량 변화)
5. IG Spread ⭐ (보조)

---

#### 3️⃣ 심리/밸류에이션 사이클 (6개)

| 요소 | 지표 | 현재 보유 | 신규 크롤러 |
|------|------|----------|------------|
| **심리** | VIX | ❌ | CBOE API |
| | AAII Bull-Bear | ❌ | AAII 웹사이트 |
| **밸류** | S&P 500 Forward PER | ❌ | Bloomberg/FactSet |
| | Shiller CAPE | ❌ | Yale/FRED |
| **수급** | ETF Flow (주간) | ❌ | ICI 발표 |
| | Put/Call Ratio | ❌ | CBOE |

**중요도**:
1. VIX ⭐⭐⭐ (최강 심리 신호)
2. Forward PER ⭐⭐⭐ (밸류 핵심)
3. ETF Flow ⭐⭐⭐ (수급 핵심)
4. AAII Spread ⭐⭐ (심리 보완)
5. CAPE ⭐⭐ (밸류 보완)
6. Put/Call ⭐ (단기 조정)

---

### 3.3 최종 지표 요약

**총 17개 지표**:
- 현재 보유: 6개 (거시경제 사이클)
- 신규 필요: 11개 (신용 5개 + 심리 6개)

**제외 지표**: 30개
- 중복/후행/노이즈/섹터별 지표

---

## 4. 계산 로직

### 4.1 거시경제 사이클

#### 입력 데이터
```python
pmi_mfg: float        # ISM 제조업 PMI (45~60)
pmi_svc: float        # ISM 비제조업 PMI (45~60)
core_cpi: float       # 근원 CPI YoY% (0~6)
core_pce: float       # 근원 PCE YoY% (0~6)
fed_rate: float       # 연준 기준금리% (0~8)
yield_curve: float    # 장단기금리차% (-2~+3)
```

#### 계산 수식
```python
def calc_macro_cycle(pmi_mfg, pmi_svc, core_cpi, core_pce, fed_rate, yield_curve):
    """
    거시경제 사이클 점수 계산 (0~100)

    Returns:
        macro_score: 0~100 (높을수록 확장, 낮을수록 침체)
        phase: "침체" | "회복" | "확장" | "둔화"
    """

    # 1. 성장 점수 (0~100)
    # PMI 50 = 중립, 45 = 0점, 55 = 100점
    growth_score = (
        (pmi_mfg - 50) * 2 * 0.6 +    # 제조업 60%
        (pmi_svc - 50) * 2 * 0.4      # 서비스업 40%
    ) * 10 + 50
    growth_score = max(0, min(100, growth_score))

    # 2. 인플레 압박 점수 (0~100, 높을수록 압박 낮음)
    # 2% 인플레 = 100점, 4% = 60점, 0% = 100점
    inflation_score = 100 - (
        max(0, core_cpi - 2.0) * 20 * 0.7 +
        max(0, core_pce - 2.0) * 20 * 0.3
    )
    inflation_score = max(0, min(100, inflation_score))

    # 3. 금리 긴축도 점수 (0~100, 높을수록 완화적)
    # 0% 금리 = 100점, 5% = 50점
    rate_score = 100 - (fed_rate * 10)
    rate_score = max(0, min(100, rate_score))

    # 4. 침체 신호 점수 (0~100, 높을수록 건강)
    # 역전(-2%) = 0점, 정상(0%) = 50점, 급경사(+2%) = 100점
    curve_score = (yield_curve + 2) * 25
    curve_score = max(0, min(100, curve_score))

    # 최종 점수 (가중평균)
    macro_score = (
        growth_score * 0.35 +      # 성장 35%
        inflation_score * 0.25 +   # 인플레 25%
        rate_score * 0.20 +        # 금리 20%
        curve_score * 0.20         # 장단기차 20%
    )

    # 국면 판별
    if macro_score < 30:
        phase = "침체"
        recommendation = "매수 준비 (주식·장기채)"
    elif macro_score < 50:
        phase = "회복"
        recommendation = "적극 매수 (주식 최대 비중)"
    elif macro_score < 70:
        phase = "확장"
        recommendation = "일부 축소 (방어주 로테이션)"
    else:
        phase = "둔화"
        recommendation = "방어 (현금·단기채)"

    return {
        "score": macro_score,
        "phase": phase,
        "recommendation": recommendation,
        "components": {
            "growth": growth_score,
            "inflation": inflation_score,
            "rates": rate_score,
            "curve": curve_score
        }
    }
```

#### 예시
```python
# 현재 상황 (2025-12-03 가정)
pmi_mfg = 52.3        # 확장
pmi_svc = 54.1        # 확장
core_cpi = 2.8        # 목표 근처
core_pce = 2.5        # 목표 근처
fed_rate = 4.5        # 긴축
yield_curve = 0.55    # 정상화

result = calc_macro_cycle(52.3, 54.1, 2.8, 2.5, 4.5, 0.55)
# {
#   "score": 58.5,
#   "phase": "확장",
#   "recommendation": "일부 축소 (방어주 로테이션)",
#   "components": {...}
# }
```

---

### 4.2 신용/유동성 사이클

#### 입력 데이터
```python
hy_spread: float         # HY OAS (bp, 200~1500)
ig_spread: float         # IG OAS (bp, 80~500)
fci: float              # Chicago Fed NFCI (-2~+2)
m2_yoy: float           # M2 YoY% (-5~+15)
loan_tightening: float  # 대출기준 강화% (0~100)
```

#### 계산 수식
```python
def calc_credit_cycle(hy_spread, ig_spread, fci, m2_yoy, loan_tightening):
    """
    신용/유동성 사이클 점수 계산 (0~100)

    Returns:
        credit_score: 0~100 (높을수록 유동성 풍부, 낮을수록 경색)
        phase: "신용 경색" | "정상화" | "신용 과잉"
    """

    # 1. 신용 스프레드 점수 (0~100, 낮을수록 좋음)
    # HY: 300bp = 100점, 1000bp = 0점
    hy_score = 100 - ((hy_spread - 300) / 7)
    hy_score = max(0, min(100, hy_score))

    # IG: 100bp = 100점, 400bp = 0점
    ig_score = 100 - ((ig_spread - 100) / 3)
    ig_score = max(0, min(100, ig_score))

    spread_score = hy_score * 0.7 + ig_score * 0.3

    # 2. 금융여건 점수 (0~100)
    # FCI: 0 = 50점, -2 = 100점(완화), +2 = 0점(긴축)
    fci_score = 50 - (fci * 25)
    fci_score = max(0, min(100, fci_score))

    # 3. 유동성 점수 (0~100)
    # M2: 5% YoY = 50점, 10% = 100점, 0% = 0점
    m2_score = m2_yoy * 10
    m2_score = max(0, min(100, m2_score))

    # Loan: 타이팅 0% = 100점, 80% = 20점
    loan_score = 100 - loan_tightening
    loan_score = max(0, min(100, loan_score))

    liquidity_score = m2_score * 0.5 + loan_score * 0.5

    # 최종 점수
    credit_score = (
        spread_score * 0.5 +      # 스프레드 50%
        fci_score * 0.3 +         # FCI 30%
        liquidity_score * 0.2     # 유동성 20%
    )

    # 국면 판별
    if credit_score < 30:
        phase = "신용 경색"
        recommendation = "공격적 매수 (하이일드·폭락주)"
    elif credit_score < 60:
        phase = "정상화"
        recommendation = "유지·확대 (주식 ETF·기업채)"
    else:
        phase = "신용 과잉"
        recommendation = "축소·방어 (고위험채 매도)"

    return {
        "score": credit_score,
        "phase": phase,
        "recommendation": recommendation,
        "components": {
            "hy_spread": hy_score,
            "ig_spread": ig_score,
            "fci": fci_score,
            "m2": m2_score,
            "loan": loan_score
        }
    }
```

---

### 4.3 심리/밸류에이션 사이클

#### 입력 데이터
```python
vix: float              # VIX (10~60)
aaii_spread: float      # Bull% - Bear% (-40~+40)
fwd_per: float          # S&P 500 Forward PER (10~30)
cape: float             # Shiller CAPE (10~40)
etf_flow_4wk: float     # 4주 ETF 유입/유출 ($B, -100~+100)
put_call: float         # Put/Call Ratio (0.4~1.5)
```

#### 계산 수식
```python
def calc_sentiment_cycle(vix, aaii_spread, fwd_per, cape, etf_flow_4wk, put_call):
    """
    심리/밸류에이션 사이클 점수 계산 (0~100)

    Returns:
        sentiment_score: 0~100 (높을수록 공포=매수기회, 낮을수록 과열=매도)
        phase: "공포 (매수)" | "중립" | "과열 (축소)"
        color: "green" | "yellow" | "red"
    """

    # 1. 공포 점수 (0~100, 높을수록 공포)
    # VIX: 12 = 0점, 30 = 60점, 50 = 100점
    vix_fear = (vix - 12) * 2.5
    vix_fear = max(0, min(100, vix_fear))

    # AAII: Bull우위 30 = 0점, Bear우위 30 = 100점
    aaii_fear = (-aaii_spread + 30) * 1.67
    aaii_fear = max(0, min(100, aaii_fear))

    # Put/Call: 0.6 = 0점, 1.2 = 60점
    pc_fear = (put_call - 0.6) * 100
    pc_fear = max(0, min(100, pc_fear))

    fear_score = (
        vix_fear * 0.5 +
        aaii_fear * 0.3 +
        pc_fear * 0.2
    )

    # 2. 밸류 점수 (0~100, 높을수록 저평가)
    # Forward PER: 14 = 100점, 22 = 0점
    per_value = (22 - fwd_per) * 12.5
    per_value = max(0, min(100, per_value))

    # CAPE: 15 = 100점, 30 = 0점
    cape_value = (30 - cape) * 6.67
    cape_value = max(0, min(100, cape_value))

    value_score = (
        per_value * 0.6 +
        cape_value * 0.4
    )

    # 3. 수급 점수 (0~100, 높을수록 유출=공포)
    # ETF Flow: +50B 유입 = 0점, -50B 유출 = 100점
    flow_score = 50 - (etf_flow_4wk / 2)
    flow_score = max(0, min(100, flow_score))

    # 최종 점수
    sentiment_score = (
        fear_score * 0.4 +
        value_score * 0.4 +
        flow_score * 0.2
    )

    # 국면 판별
    if sentiment_score > 70:
        phase = "공포 (매수)"
        color = "green"
        recommendation = "주식 비중 확대, 성장주 일부"
    elif sentiment_score > 40:
        phase = "중립"
        color = "yellow"
        recommendation = "핵심 ETF 유지, 관망"
    else:
        phase = "과열 (축소)"
        color = "red"
        recommendation = "주식 축소, 단기채·현금 증가"

    return {
        "score": sentiment_score,
        "phase": phase,
        "color": color,
        "recommendation": recommendation,
        "components": {
            "fear": fear_score,
            "value": value_score,
            "flow": flow_score
        }
    }
```

---

## 5. 구현 계획

### 5.1 Phase 1: 거시경제 사이클 (기존 활용)

**목표**: 현재 보유한 6개 지표로 거시경제 사이클 완성

**작업**:
1. ✅ 기존 4개 게이지 데이터 확인
2. ❌ calc_macro_cycle() 함수 작성
3. ❌ MacroCycleCard 컴포넌트 작성
4. ❌ 상단 패널 UI 구현
5. ❌ 국면별 투자 추천 로직

**소요**: 1 세션

**완료 조건**:
- 거시경제 사이클 점수 표시
- 4단계 국면 판별 (침체/회복/확장/둔화)
- 투자 행동 제안 표시

---

### 5.2 Phase 2: 신용/유동성 사이클 (신규 크롤러)

**목표**: 5개 신규 지표 크롤링 + 계산 로직 구현

**필요 크롤러**:

| 지표 | 데이터 소스 | 크롤러 | 난이도 |
|------|------------|--------|--------|
| HY Spread | FRED: BAMLH0A0HYM2 | FRED API | 쉬움 ✅ |
| IG Spread | FRED: BAMLC0A0CM | FRED API | 쉬움 ✅ |
| FCI | FRED: NFCI | FRED API | 쉬움 ✅ |
| M2 YoY | FRED: M2SL | FRED API | 쉬움 ✅ |
| Loan Survey | Fed 분기별 발표 | 수동 입력 또는 PDF 파싱 | 어려움 ⚠️ |

**작업**:
1. ❌ FRED 크롤러 확장 (4개 시리즈 추가)
2. ❌ Loan Survey 데이터 수집 방법 결정
3. ❌ calc_credit_cycle() 함수 작성
4. ❌ CreditCycleCard 컴포넌트 작성
5. ❌ API 엔드포인트 추가

**소요**: 1-2 세션

**완료 조건**:
- 신용/유동성 사이클 점수 표시
- 3단계 국면 판별 (경색/정상화/과잉)
- HY Spread, FCI 실시간 데이터

---

### 5.3 Phase 3: 심리/밸류에이션 사이클 (외부 API)

**목표**: 6개 심리/밸류 지표 크롤링

**필요 크롤러**:

| 지표 | 데이터 소스 | 크롤러 | 난이도 |
|------|------------|--------|--------|
| VIX | CBOE API | 외부 API | 중간 ⚠️ |
| AAII Bull-Bear | AAII 웹사이트 | 웹 스크래핑 | 중간 ⚠️ |
| Forward PER | Bloomberg/FactSet | 유료 또는 대안 | 어려움 ❌ |
| CAPE | Yale/FRED | FRED API | 쉬움 ✅ |
| ETF Flow | ICI 주간 발표 | 웹 스크래핑 | 중간 ⚠️ |
| Put/Call | CBOE | 외부 API | 중간 ⚠️ |

**대안 전략**:
- Forward PER → Trailing PER로 대체 (Yahoo Finance API)
- AAII → CNN Fear & Greed Index로 대체
- ETF Flow → SPY/QQQ 거래량 변화로 근사

**작업**:
1. ❌ VIX 크롤러 (CBOE API)
2. ❌ CAPE 크롤러 (FRED)
3. ❌ PER 크롤러 (Yahoo Finance 또는 대안)
4. ❌ AAII 크롤러 (웹 스크래핑 또는 대안)
5. ❌ calc_sentiment_cycle() 함수 작성
6. ❌ SentimentCycleCard 컴포넌트 작성

**소요**: 2 세션

**완료 조건**:
- 심리/밸류 사이클 점수 표시
- 3단계 국면 판별 (공포/중립/과열)
- 색상 시스템 (초록/노랑/빨강)

---

### 5.4 Phase 4: 통합 및 최적화

**목표**: 3대 사이클 통합 UI + 성능 최적화

**작업**:
1. ❌ 상단 3대 메타 사이클 패널 완성
2. ❌ 하단 4개 세부 게이지 연동
3. ❌ 클릭 시 상세 정보 확장 UI
4. ❌ 투자 추천 종합 로직
5. ❌ 캐싱 및 성능 최적화
6. ❌ 모바일 반응형

**소요**: 1 세션

**완료 조건**:
- 3대 사이클 동시 표시
- 통합 투자 추천 (3개 사이클 종합)
- 빠른 로딩 (<2초)

---

### 5.5 전체 타임라인

```
Week 1 (현재):
- Session 1: ✅ BEA 크롤러 완성 + Freightos 조사 + 계획 수립
- Session 2: Phase 1 (거시경제 사이클)

Week 2:
- Session 3: Phase 2 (신용/유동성 사이클)
- Session 4: Phase 3-1 (심리/밸류 크롤러 조사)

Week 3:
- Session 5: Phase 3-2 (심리/밸류 크롤러 구현)
- Session 6: Phase 4 (통합 및 최적화)
```

**총 예상**: 3주, 6 세션

---

## 6. 참고 자료

### 6.1 핵심 개념 출처

**거시경제 사이클**:
- Ray Dalio, "Principles for Navigating Big Debt Crises"
- NBER Business Cycle Dating
- Fed Economic Projections (SEP)

**신용/유동성 사이클**:
- Howard Marks, "Mastering the Market Cycle"
- Hyman Minsky, "The Financial Instability Hypothesis"
- BIS Credit-to-GDP Gap

**심리/밸류에이션 사이클**:
- Robert Shiller, "Irrational Exuberance"
- AAII Sentiment Survey (since 1987)
- Warren Buffett Indicator (Market Cap / GDP)

---

### 6.2 데이터 소스

**FRED (Federal Reserve Economic Data)**:
- HY Spread: BAMLH0A0HYM2
- IG Spread: BAMLC0A0CM
- FCI: NFCI
- M2: M2SL
- CAPE: (간접 제공)

**CBOE (Chicago Board Options Exchange)**:
- VIX Index
- Put/Call Ratio

**Fed 공식 발표**:
- Senior Loan Officer Survey (분기별)
- FOMC Minutes

**기타**:
- AAII: Investor Sentiment Survey
- ICI: Investment Company Institute (ETF Flow)
- Yale Economics: Shiller CAPE

---

### 6.3 기술 스택

**Backend**:
- Python 3.11
- FRED API (fredapi 라이브러리)
- BeautifulSoup4 (웹 스크래핑)
- PostgreSQL (데이터 저장)

**Frontend**:
- Next.js 14 (React)
- Recharts (차트)
- Tailwind CSS (스타일링)

**Deployment**:
- Backend: Render
- Frontend: Vercel
- Database: Neon.tech PostgreSQL

---

## 📌 다음 세션 TODO

### Session 2 목표: Phase 1 거시경제 사이클 구현

1. **백엔드**:
   - [ ] calc_macro_cycle() 함수 작성
   - [ ] /api/v2/macro-cycle 엔드포인트 추가
   - [ ] 기존 4개 게이지 데이터 통합

2. **프론트엔드**:
   - [ ] MacroCycleCard 컴포넌트
   - [ ] 상단 패널 레이아웃
   - [ ] 국면별 색상/아이콘 시스템
   - [ ] 투자 추천 UI

3. **테스트**:
   - [ ] 계산 로직 검증
   - [ ] UI 반응형 확인
   - [ ] 데이터 로딩 성능

**예상 소요**: 1 세션 (2-3시간)

---

**문서 끝**
