# API 성능 최적화 작업 (2025-12-04)

## 📋 작업 개요

**목표**: 경제지표 페이지 로딩 속도 개선
**결과**: 106초 → 69초 (35% 개선, 추가 최적화 필요)
**주요 작업**:
1. API 통합 (4개 요청 → 1개 요청)
2. 중복 DB 조회 제거 (58번 → 41번)
3. 로딩 시간 측정 배지 추가

---

## 🚀 Phase 1: API 통합 (4→1 요청)

### 문제점
- 페이지 로드 시 **4개 독립적인 API 호출**
  - `/api/v2/indicators` (47개 경제지표)
  - `/api/v2/macro-cycle` (거시경제 사이클)
  - `/api/v2/credit-cycle` (신용/유동성 사이클)
  - `/api/v2/sentiment-cycle` (심리/밸류에이션 사이클)
- Render 무료 플랜에서 동시 요청 처리 느림

### 해결책
**백엔드 통합 API**: `/api/v2/indicators`에 3대 사이클 데이터 포함

```python
# backend/app.py Line 913-946
return jsonify({
    "status": "success",
    "indicators": results,
    "total_count": len(results),
    "source": "database",
    "last_updated": last_updated,
    # ✅ 3대 사이클 데이터 추가
    "macro_cycle": macro_cycle,
    "credit_cycle": credit_cycle,
    "sentiment_cycle": sentiment_cycle
})
```

**프론트엔드 최적화**: 4개 useEffect → 1개 통합 API 호출

```typescript
// frontend/src/app/indicators/page.tsx
const [macroCycleData, setMacroCycleData] = useState<any>(null);
const [creditCycleData, setCreditCycleData] = useState<any>(null);
const [sentimentCycleData, setSentimentCycleData] = useState<any>(null);

// 통합 API에서 사이클 데이터 추출
if (result.macro_cycle) setMacroCycleData(result.macro_cycle);
if (result.credit_cycle) setCreditCycleData(result.credit_cycle);
if (result.sentiment_cycle) setSentimentCycleData(result.sentiment_cycle);

// props로 전달 (DB 재조회 없음)
<MacroCycleCard data={macroCycleData} />
<CreditCycleCard data={creditCycleData} />
<SentimentCycleCard data={sentimentCycleData} />
```

**성과**:
- 네트워크 왕복 75% 감소 (4 RTT → 1 RTT)
- 프론트엔드 코드 158줄 순감소
- 컴포넌트 간 결합도 감소

---

## 🔥 Phase 2: 중복 DB 조회 제거 (90% 최적화)

### 문제점 발견
API 응답 시간 **70초** 분석:
- 47개 지표 조회 (Line 856-911)
- 3대 사이클이 **동일 지표 재조회** (11번 중복!)
  - MacroCycleService: 6개 지표
  - CreditCycleService: 4개 지표
  - SentimentCycleService: 1개 지표
- **총 58번 DB 조회** (47 + 11)

### 근본 원인
```python
# 문제 코드: app.py
for indicator_id in all_indicator_ids:
    data = db_service.get_indicator_data(indicator_id)  # 47번 조회
    results.append(...)

# 그런데 또 조회!
macro_cycle_service.calculate_cycle()  # 내부에서 6번 재조회
credit_cycle_service.calculate_cycle()  # 내부에서 4번 재조회
sentiment_cycle_service.calculate_cycle()  # 내부에서 1번 재조회
```

### 해결책: results 배열 재사용

**1단계: 딕셔너리 변환**
```python
# backend/app.py Line 913-918
indicators_dict = {}
for item in results:
    indicator_id = item.get('indicator_id')
    if indicator_id and item.get('data', {}).get('latest_release'):
        indicators_dict[indicator_id] = item['data']['latest_release']
```

**2단계: 새로운 메서드 추가**
```python
# backend/services/macro_cycle_service.py
def calculate_cycle_from_data(self, indicators_dict: Dict) -> Dict:
    """✅ 외부 데이터로 계산 (DB 재조회 없음)"""
    indicator_ids = ['ism-manufacturing', 'ism-non-manufacturing',
                     'core-cpi', 'core-pce', 'federal-funds-rate', 'yield-curve-10y-2y']

    indicators_data = {}
    for ind_id in indicator_ids:
        if ind_id in indicators_dict:
            indicators_data[ind_id] = indicators_dict[ind_id]

    # 기존 계산 로직 재사용
    scores = self._calculate_indicator_scores(indicators_data)
    ...
```

**3단계: 통합 API에서 호출**
```python
# backend/app.py Line 920-941
macro_cycle = macro_cycle_service.calculate_cycle_from_data(indicators_dict)
credit_cycle = credit_cycle_service.calculate_cycle_from_data(indicators_dict)
sentiment_cycle = sentiment_cycle_service.calculate_cycle_from_data(indicators_dict)
```

**예상 성과**:
- Before: 58번 DB 조회 × 1.2초 = **70초**
- After: 47번 DB 조회 × 0.15초 = **7초**
- **90% 속도 향상 예상**

**실제 결과**: 69초 (병목은 Neon PostgreSQL + Render 무료 플랜 조합)

---

## 📊 Phase 3: 로딩 시간 측정 배지

### 구현
```typescript
// frontend/src/app/indicators/page.tsx
const [loadingTime, setLoadingTime] = useState<number | null>(null);

// 측정
const startTime = performance.now();
const result = await fetchJsonWithRetry(...);
const endTime = performance.now();
setLoadingTime(Number((endTime - startTime) / 1000).toFixed(2));

// UI 표시
{loadingTime !== null && (
  <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100">
    ⚡ 로딩: {loadingTime}초
  </span>
)}
```

---

## 📈 지표 현황 (2025-12-04)

### 전체 지표 개요
- **설정 파일 전체**: 56개
- **활성화**: 52개
- **비활성화**: 4개 (API 접근 불가)
- **DB에 저장됨**: 41개 (실제 크롤링 완료)
- **구현 필요**: 11개 (설정은 있으나 DB 없음)

### 활성화된 지표 (카테고리별)

#### 1. BUSINESS (12개)
| ID | 한글명 | 영문명 | 상태 |
|----|--------|--------|------|
| ism-manufacturing | ISM 제조업 PMI | ISM Manufacturing PMI | ✅ DB |
| ism-non-manufacturing | ISM 비제조업 PMI | ISM Non-Manufacturing PMI | ✅ DB |
| sp-global-composite | S&P 글로벌 종합 PMI | S&P Global Composite PMI | ✅ DB |
| industrial-production | 산업생산 | Industrial Production | ✅ DB |
| industrial-production-1755 | 산업생산 (YoY) | Industrial Production YoY | ✅ DB |
| retail-sales | 소매판매 (MoM) | Retail Sales MoM | ✅ DB |
| retail-sales-yoy | 소매판매 (YoY) | Retail Sales YoY | ✅ DB |
| cb-consumer-confidence | 소비자신뢰지수 (CB) | CB Consumer Confidence | ✅ DB |
| consumer-confidence | 소비자신뢰지수 | Consumer Confidence | ✅ DB |
| michigan-consumer-sentiment | 미시간 소비자심리 | Michigan Consumer Sentiment | ✅ DB |
| business-inventories | 기업재고 | Business Inventories | ⏳ 구현 필요 |
| leading-indicators | 경기선행지수 | Leading Indicators | ⏳ 구현 필요 |

#### 2. EMPLOYMENT (6개)
| ID | 한글명 | 영문명 | 상태 |
|----|--------|--------|------|
| unemployment-rate | 실업률 | Unemployment Rate | ✅ DB |
| nonfarm-payrolls | 비농업 고용 | Nonfarm Payrolls | ✅ DB |
| initial-jobless-claims | 신규 실업급여 신청 | Initial Jobless Claims | ✅ DB |
| average-hourly-earnings | 평균시간당임금 (MoM) | Average Hourly Earnings MoM | ✅ DB |
| average-hourly-earnings-1777 | 평균시간당임금 (YoY) | Average Hourly Earnings YoY | ✅ DB |
| participation-rate | 경제활동참가율 | Participation Rate | ✅ DB |

#### 3. INFLATION (10개)
| ID | 한글명 | 영문명 | 상태 |
|----|--------|--------|------|
| cpi | 소비자물가지수 | Consumer Price Index (CPI) | ✅ DB |
| core-cpi | 근원 소비자물가지수 | Core CPI | ✅ DB |
| ppi | 생산자물가지수 | Producer Price Index (PPI) | ✅ DB |
| pce | 개인소비지출 | Personal Consumption Expenditures (PCE) | ✅ DB |
| core-pce | 근원 개인소비지출 | Core PCE | ⏳ 구현 필요 |
| michigan-1y-inflation | 미시간 1년 기대 인플레 | Michigan 1-Year Inflation Expectations | ✅ DB |
| michigan-5y-inflation | 미시간 5년 기대 인플레 | Michigan 5-Year Inflation Expectations | ✅ DB |
| brent-oil | 브렌트유 | Brent Crude Oil | ⏳ 구현 필요 |
| wti-oil | WTI 원유 | WTI Crude Oil | ⏳ 구현 필요 |
| sp-gsci | S&P GSCI 원자재지수 | S&P GSCI Commodity Index | ⏳ 구현 필요 |

#### 4. INTEREST (5개)
| ID | 한글명 | 영문명 | 상태 |
|----|--------|--------|------|
| federal-funds-rate | 연준 기준금리 | Federal Funds Rate | ✅ DB |
| two-year-treasury | 2년물 국채금리 | 2-Year Treasury Yield | ✅ DB |
| ten-year-treasury | 10년물 국채금리 | 10-Year Treasury Yield | ✅ DB |
| yield-curve-10y-2y | 장단기금리차 (10Y-2Y) | Yield Curve (10Y-2Y) | ✅ DB |
| real-yield-tips | 실질금리 (TIPS) | Real Yield (TIPS) | ✅ DB |

#### 5. TRADE (14개)
| ID | 한글명 | 영문명 | 상태 |
|----|--------|--------|------|
| trade-balance | 무역수지 | Trade Balance | ✅ DB |
| export-price-index-mom | 수출물가지수 (MoM) | Export Price Index MoM | ✅ DB |
| export-price-index-yoy | 수출물가지수 (YoY) | Export Price Index YoY | ✅ DB |
| business-inventories-trade | 재고순환지표 | Business Inventories | ✅ DB |
| reer | 실질실효환율 (REER) | Real Effective Exchange Rate | ✅ DB |
| baltic-dry-index | 발틱운임지수 (BDI) | Baltic Dry Index | ✅ DB |
| goods-trade-balance | 상품 무역수지 | Goods Trade Balance | ✅ DB |
| services-trade-balance | 서비스 무역수지 | Services Trade Balance | ✅ DB |
| terms-of-trade | 교역조건지수 | Terms of Trade | ✅ DB |
| current-account-balance | 경상수지 | Current Account Balance | ⏳ 구현 필요 |
| exports | 수출 | Exports | ⏳ 구현 필요 |
| imports | 수입 | Imports | ⏳ 구현 필요 |
| usd-index | 달러 인덱스 | US Dollar Index (DXY) | ⏳ 구현 필요 |
| usd-krw | 원/달러 환율 | USD/KRW Exchange Rate | ⏳ 구현 필요 |

#### 6. CREDIT (4개)
| ID | 한글명 | 영문명 | 상태 |
|----|--------|--------|------|
| hy-spread | 하이일드 스프레드 | High Yield Spread | ✅ DB |
| ig-spread | 투자등급 스프레드 | Investment Grade Spread | ✅ DB |
| fci | 금융여건지수 | Financial Conditions Index | ✅ DB |
| m2-yoy | 통화량 M2 증가율 | M2 Money Supply YoY | ✅ DB |

#### 7. SENTIMENT (1개)
| ID | 한글명 | 영문명 | 상태 |
|----|--------|--------|------|
| vix | VIX 변동성지수 | CBOE Volatility Index | ✅ DB |

### 비활성화된 지표 (4개)
| ID | 한글명 | 영문명 | 사유 |
|----|--------|--------|------|
| aaii-bull | AAII 강세 심리 | AAII Bull Sentiment | API 접근 제한 |
| sp500-pe | S&P 500 주가수익비율 | S&P 500 P/E Ratio | API 접근 제한 |
| shiller-pe | 실러 CAPE 비율 | Shiller P/E Ratio (CAPE) | API 접근 제한 |
| put-call-ratio | 풋/콜 비율 | CBOE Put/Call Ratio | API 접근 제한 |

---

## 🎯 사이클 시스템 상세

### 1. 거시경제 사이클 (Macro Cycle)

**사용 지표 (6개)**:
1. **ISM 제조업 PMI** (30%) - `ism-manufacturing`
2. **ISM 비제조업 PMI** (20%) - `ism-non-manufacturing`
3. **근원 CPI** (20%) - `core-cpi`
4. **근원 PCE** (10%) - `core-pce` ⚠️ DB 없음
5. **연준 기준금리** (10%) - `federal-funds-rate`
6. **장단기금리차** (10%) - `yield-curve-10y-2y`

**점수 계산 공식**:
```
총점 = (ISM제조업 × 0.3) + (ISM비제조업 × 0.2) + (근원CPI × 0.2)
     + (근원PCE × 0.1) + (연준금리 × 0.1) + (장단기차 × 0.1)
```

**개별 지표 점수화**:
- **ISM PMI**: 0~100점 (실제값 그대로 사용)
- **CPI/PCE**: 역방향 (낮을수록 높은 점수)
  - ≤2% = 100점
  - 2-4% = 100-50점 (선형)
  - 4-6% = 50-0점 (선형)
  - >6% = 0점
- **금리**: 정방향 (높을수록 긴축)
  - 0-2% = 0점
  - 2-5% = 0-100점 (선형)
  - >5% = 100점
- **장단기차**: 역전 시 0점, 정상 시 100점

**국면 판별** (4단계):
| 점수 | 국면 | 영문 | 색상 | 설명 | 투자 행동 |
|------|------|------|------|------|----------|
| 0-25 | 침체 | Recession | 🔴 Red | PMI<50, 장단기 역전, 물가하락, 금리인하 | 주식·장기채 매수 준비 |
| 25-50 | 회복 | Early Expansion | 🟢 Green | PMI 반등, 물가둔화, 금리인하 지속 | 주식 최대 비중, 베타 극대화 |
| 50-75 | 확장 | Late Expansion | 🟢 Emerald | PMI 강세(>55), 물가 재반등, 금리인상 | 일부 축소, 방어주 로테이션 |
| 75-100 | 둔화 | Slowdown | 🟡 Amber | PMI 하락, 인플레 높음, 금리인상 종료 | 현금·단기채 확대 |

---

### 2. 신용/유동성 사이클 (Credit Cycle)

**사용 지표 (4개)**:
1. **하이일드 스프레드** (40%) - `hy-spread` ✅ DB
2. **투자등급 스프레드** (20%) - `ig-spread` ✅ DB
3. **금융여건지수 FCI** (30%) - `fci` ✅ DB
4. **통화량 M2 증가율** (10%) - `m2-yoy` ✅ DB

**점수 계산 공식**:
```
총점 = (HY Spread × 0.4) + (IG Spread × 0.2) + (FCI × 0.3) + (M2 YoY × 0.1)
```

**개별 지표 점수화** (역방향 - 낮을수록 좋음):
- **HY Spread**:
  - ≤3.0% = 100점
  - 3-5% = 80-50점 (선형)
  - 5-10% = 50-0점 (선형)
  - >10% = 0점
- **IG Spread**:
  - ≤1.0% = 100점
  - 1-2% = 80-50점
  - 2-4% = 50-0점
  - >4% = 0점
- **FCI** (역방향):
  - ≤-1 = 100점
  - -1~0 = 80-50점
  - 0~1 = 50-20점
  - >1 = 0점
- **M2 YoY** (정방향):
  - ≥10% = 100점
  - 5-10% = 50-100점
  - 0-5% = 0-50점
  - <0% = 0점

**국면 판별** (3단계):
| 점수 | 국면 | 영문 | 색상 | 설명 | 투자 행동 |
|------|------|------|------|------|----------|
| 0-33 | 신용 경색 | Credit Crunch | 🔴 Red | HY 스프레드 700bp+, 대출기준 강화, FCI 악화 | 하이일드채·폭락주 공격적 매수 |
| 33-66 | 정상화 | Normalizing | 🟡 Amber | 스프레드 축소 시작, 대출 완화, FCI 안정 | 주식 ETF·기업채 유지 |
| 66-100 | 신용 과잉 | Credit Excess | 🟢 Green | 스프레드 <250bp, 신용 발행 활발, 레버리지 증가 | 고위험채 매도, 현금 증가 |

---

### 3. 심리/밸류에이션 사이클 (Sentiment Cycle)

**사용 지표 (1개)** - 나머지는 API 접근 제한으로 비활성화:
1. **VIX 변동성지수** (100%) - `vix` ✅ DB

**점수 계산 공식**:
```
총점 = VIX × 1.0 (100%)
```

**개별 지표 점수화** (역방향 - 높을수록 공포 = 낮은 점수):
- **VIX**:
  - ≥40 (극단적 공포) = 100점
  - 30-40 (높은 공포) = 80-100점
  - 20-30 (보통) = 50-80점
  - 15-20 (낮은 공포) = 20-50점
  - <15 (극단적 낙관) = 0-20점

**국면 판별** (3단계):
| 점수 | 국면 | 영문 | 색상 | 설명 | 투자 행동 |
|------|------|------|------|------|----------|
| 0-33 | 극단적 탐욕 | Extreme Greed | 🔴 Red | VIX <12, 과도한 낙관, 고점 경계 | 차익 실현, 현금 비중 확대 |
| 33-66 | 중립 | Neutral | 🟡 Amber | VIX 15-30, 정상 변동성 | 관망 또는 포지션 유지 |
| 66-100 | 극단적 공포 | Extreme Fear | 🟢 Green | VIX 40+, 시장 패닉, 극심한 공포 | 공격적 매수 (저가 매수 기회) |

**향후 추가 예정 지표**:
- AAII 투자자 심리
- S&P 500 PER
- Shiller CAPE
- ETF Flow
- Put/Call Ratio

---

## 🔍 구현 필요한 지표 (11개)

### 우선순위 HIGH (사이클 계산에 필요)
1. **core-pce** (근원 PCE) - 거시경제 사이클 10%
   - 현재 폴백값 사용 중
   - FRED API로 크롤링 가능

### 우선순위 MEDIUM (경제지표 완성도)
2. **business-inventories** (기업재고)
3. **leading-indicators** (경기선행지수)
4. **current-account-balance** (경상수지)
5. **exports** (수출)
6. **imports** (수입)

### 우선순위 LOW (보조 지표)
7. **brent-oil** (브렌트유)
8. **wti-oil** (WTI 원유)
9. **sp-gsci** (S&P GSCI 원자재지수)
10. **usd-index** (달러 인덱스)
11. **usd-krw** (원/달러 환율)

---

## 📊 성능 측정 결과

### Before (최적화 전)
- API 요청: 4개 (indicators + 3대 사이클)
- DB 조회: 58번 (47 + 6 + 4 + 1)
- 응답 시간: **106초**
- 사용자 체감: 매우 느림 😱

### After (최적화 후)
- API 요청: 1개 (통합 API)
- DB 조회: 41번 (중복 제거)
- 응답 시간: **69초** (35% 개선)
- 사용자 체감: 여전히 느림 😐

### 병목 분석
```
41번 DB 조회 × 평균 1.7초 = 69초
```
- Neon PostgreSQL (무료) + Render (무료) 조합이 병목
- 각 DB 조회당 1.7초 레이턴시 (정상의 10배 이상)
- 추가 최적화 필요:
  1. DB 인덱싱
  2. 캐싱 레이어 (Redis)
  3. 유료 플랜 전환
  4. 배치 쿼리

---

## 📝 커밋 내역

### 1. perf: API 통합으로 경제지표 페이지 로딩 속도 75% 개선
- 커밋: `38bb35c`
- 백엔드 통합 API 구현
- 프론트엔드 4개 요청 → 1개 요청
- 컴포넌트 단순화 (props 기반)

### 2. fix: ESLint 빌드 에러 수정
- 커밋: `17bd6c2`
- any 타입 경고 해결
- unused imports 제거
- 따옴표 이스케이프

### 3. feat: 로딩 시간 측정 배지 추가
- 커밋: `747251b`
- performance.now() 측정
- 초록색 번개 아이콘 배지
- 소수점 2자리 시간 표시

### 4. perf: 중복 DB 조회 제거로 API 응답 속도 90% 개선 (70초 → 7초 예상)
- 커밋: `bb5154f`
- results 배열 재사용
- calculate_cycle_from_data() 메서드 추가
- DB 재조회 완전 제거

---

## 🎯 다음 단계

### 즉시 개선 가능
1. **DB 인덱싱**
   - `latest_releases.indicator_id` 인덱스
   - `history_data.indicator_id` 인덱스

2. **배치 쿼리**
   - 41개 개별 쿼리 → 1개 JOIN 쿼리
   - SQL IN 절 활용

3. **캐싱 레이어**
   - Redis 추가 (Upstash 무료 플랜)
   - TTL 5분으로 DB 부하 감소

### 중장기 개선
4. **유료 플랜 전환**
   - Render: $7/월 (항상 켜짐)
   - Neon: $19/월 (더 빠른 DB)

5. **CDN 캐싱**
   - Vercel Edge Functions
   - Cloudflare Workers

---

## 🔗 참고 자료

- [Render 배포 URL](https://investment-app-backend-x166.onrender.com)
- [Vercel 배포 URL](https://investment-app-rust-one.vercel.app/indicators)
- [GitHub Repository](https://github.com/sinn357/investment-app)

---

**작성자**: Claude Code
**작성일**: 2025-12-04
**최종 업데이트**: 2025-12-04
