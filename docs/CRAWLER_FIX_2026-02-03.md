# 크롤러 문제 해결 보고서 (2026-02-03)

## 문제 상황

경제지표 페이지의 크롤러가 최신 데이터를 가져오지 못하는 문제 발생.

### 발견된 문제들

1. **Federal Funds Rate 크롤링 실패**
   - 원인: Investing.com 페이지가 과거 데이터 없이 미래 FOMC 일정만 표시
   - 증상: "No release data found" 에러

2. **Brotli 압축 인코딩 문제**
   - 원인: `Accept-Encoding: br` 헤더로 Brotli 압축 응답 수신
   - 증상: HTML 파싱 실패 (깨진 바이너리 데이터)

3. **Render 플랫폼 IP 차단**
   - 원인: Investing.com이 클라우드 서비스(Render) IP 범위를 차단
   - 증상: 403 Forbidden 에러 (로컬에서는 정상 작동)

---

## 해결 완료

### 1. Federal Funds Rate → FRED 전환
```
URL: investing.com/economic-calendar/interest-rate-decision-168
  → fred.stlouisfed.org/series/FEDFUNDS
```

### 2. Brotli 인코딩 문제 해결
```python
# 변경 전
'Accept-Encoding': 'gzip, deflate, br'

# 변경 후
'Accept-Encoding': 'gzip, deflate'
```

적용 파일:
- `backend/crawlers/investing_crawler.py`
- `backend/crawlers/rates_bonds_crawler.py`
- `backend/crawlers/tradingeconomics_crawler.py`

### 3. 주요 지표 FRED API 전환 (8개)

| 지표 | 기존 소스 | FRED 코드 | YoY 계산 |
|------|----------|-----------|----------|
| CPI YoY | Investing.com | CPIAUCSL | ✅ |
| Core CPI YoY | Investing.com | CPILFESL | ✅ |
| PPI YoY | Investing.com | PPIACO | ✅ |
| Unemployment Rate | Investing.com | UNRATE | - |
| Participation Rate | Investing.com | CIVPART | - |
| Michigan Consumer Sentiment | Investing.com | UMCSENT | - |
| Industrial Production YoY | Investing.com | INDPRO | ✅ |
| Retail Sales YoY | Investing.com | RSAFS | ✅ |

### 4. IndicatorConfig에 calculate_yoy 옵션 추가

```python
class IndicatorConfig:
    def __init__(
        self,
        ...
        calculate_yoy: bool = False,  # FRED 데이터를 YoY% 변화율로 변환
    ):
```

### 5. CrawlerService FRED YoY 자동 처리

```python
if "fred.stlouisfed.org" in url:
    calculate_yoy = getattr(config, 'calculate_yoy', False)
    days = 500 if calculate_yoy else 60
    result = crawl_fred_indicator(series_id, calculate_yoy=calculate_yoy, days=days)
```

---

## 현재 상태 (2026-02-06 재점검)

> **2026-02-06 업데이트**: Investing.com Render IP 차단이 해제됨.
> 기존 28개 실패 지표가 모두 정상 복구되어 **51개 정상, 3개 실패** 상태.

### ✅ 정상 작동 (51개)

**FRED 기반 (18개):**
- federal-funds-rate (FEDFUNDS)
- yield-curve-10y-2y (T10Y2Y)
- real-yield-tips (DFII10)
- cpi (CPIAUCSL + YoY)
- core-cpi (CPILFESL + YoY)
- ppi (PPIACO + YoY)
- unemployment-rate (UNRATE)
- participation-rate (CIVPART)
- michigan-consumer-sentiment (UMCSENT)
- industrial-production-1755 (INDPRO + YoY)
- retail-sales-yoy (RSAFS + YoY)
- reer (RBUSBIS)
- services-trade-balance (BOPSTB)
- hy-spread (BAMLH0A0HYM2)
- ig-spread (BAMLC0A0CM)
- fci / nfci (NFCI)
- exports (EXPGS)
- imports (IMPGS)

**Investing.com Economic Calendar (17개) — 차단 해제됨:**
- ism-manufacturing, ism-non-manufacturing, sp-global-composite
- industrial-production (MoM), retail-sales (MoM)
- cb-consumer-confidence, consumer-confidence
- nonfarm-payrolls, initial-jobless-claims
- average-hourly-earnings (MoM), average-hourly-earnings-1777 (YoY)
- trade-balance, export-price-index-mom, export-price-index-yoy
- business-inventories-trade, pce, m2-yoy

**Investing.com Rates/Bonds/Commodities/Indices (10개) — 차단 해제됨:**
- two-year-treasury, ten-year-treasury
- brent-oil, wti-oil
- usd-index, usd-krw
- baltic-dry-index, vix
- michigan-1y-inflation, michigan-5y-inflation

**기타 (6개):**
- terms-of-trade (TradingEconomics)
- current-account-balance (BEA → FRED BOPBCA)
- goods-trade-balance (Investing.com)
- sp500-pe (Multpl.com)
- shiller-pe (Multpl.com)
- put-call-ratio (CBOE fallback)

### ❌ 실패 (3개) — 전용 크롤러 없음

| 지표 | 현재 URL | 실패 원인 | 대안 |
|------|---------|----------|------|
| `leading-indicators` | oecd.org HTML | 전용 크롤러 없음, 기본 investing_crawler로 파싱 불가 | **FRED `USALOLITONOSTSAM`** (기존 fred_crawler 재사용) 또는 OECD SDMX API (키 불필요) |
| `sp-gsci` | spglobal.com HTML | 전용 크롤러 없음, manual_check=True | **yfinance `^SPGSCI`** (무료, 키 불필요) 또는 FRED `PALLFNFINDEXM` (IMF 프록시) |
| `aaii-bull` | aaii.com HTML | 전용 크롤러 없음 | **Nasdaq Data Link `AAII/AAII_SENTIMENT`** (무료 키) 또는 aaii.com 스크래핑 |

---

## ~~향후 옵션~~ (2026-02-03 작성, 대부분 해소됨)

> Investing.com 차단이 해제되어 Option A~D는 더 이상 긴급하지 않음.
> **현재 우선 과제**: 실패 3개 지표 전용 크롤러 개발.

### 실패 3개 복구 계획

**1단계: leading-indicators → FRED 전환 (가장 쉬움)**
- `indicators_config.py`에서 URL을 `https://fred.stlouisfed.org/series/USALOLITONOSTSAM`으로 변경
- 기존 fred_crawler 그대로 활용, 코드 변경 1줄

**2단계: sp-gsci → yfinance 크롤러 신규 개발**
- `yfinance_crawler.py` 생성
- `yfinance.download("^SPGSCI")` 활용
- pip 의존성 추가: `yfinance`

**3단계: aaii-bull → Nasdaq Data Link 또는 스크래핑**
- Option A: Nasdaq Data Link API (`AAII/AAII_SENTIMENT`) — 무료 키 발급 필요
- Option B: aaii.com/sentimentsurvey/sent_results 스크래핑 (Playwright 필요할 수 있음)

---

## 커밋 이력

1. `17fcd0f` - fix: 크롤러 403 차단 문제 해결 및 Federal Funds Rate FRED 전환
2. `2b9939d` - fix: Brotli 압축 인코딩 문제 해결
3. `fc8ebf1` - feat: 8개 지표 FRED API로 전환 (Investing.com 차단 우회)

---

## 기술적 세부사항

### Render 플랫폼 차단 원인 (2026-02-03 확인, 2026-02-06 해제 확인)
- Investing.com은 클라우드 서비스(AWS, GCP, Azure, Render 등) IP 범위를 기본 차단
- 봇/스크래핑 방지 정책
- 로컬 IP에서는 정상 작동 확인됨
- **2026-02-06**: 프로덕션 API 재점검 결과 Investing.com 지표 모두 정상 응답 (차단 해제 또는 IP 변경)

### FRED YoY 계산 로직
```python
def _extract_yoy_data(rows):
    # 최신 값과 12개월 전 값 비교
    yoy = (current - year_ago) / year_ago * 100
    return yoy  # 예: 2.65%
```

### 크롤러 헤더 개선
```python
headers = {
    'User-Agent': random.choice(USER_AGENTS),  # 랜덤 User-Agent
    'Accept-Encoding': 'gzip, deflate',  # Brotli 제외
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Referer': 'https://www.google.com/',
}
```

---

**작성일**: 2026-02-03
**최종 업데이트**: 2026-02-06
**작성자**: Claude Opus 4.5
