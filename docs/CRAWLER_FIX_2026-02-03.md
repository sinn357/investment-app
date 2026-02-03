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

## 현재 상태

### ✅ 정상 작동 (19개)

**FRED 기반:**
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
- nfci (NFCI)
- exports (EXPGS)
- imports (IMPGS)

**기타:**
- terms-of-trade (TradingEconomics)

### ❌ 실패 - Investing.com 차단 (28개)

**FRED 전환 가능 (5개):**
| 지표 | FRED 코드 | 비고 |
|------|-----------|------|
| nonfarm-payrolls | PAYEMS | MoM 변화 계산 필요 |
| initial-jobless-claims | ICSA | 주간 데이터 |
| average-hourly-earnings | CES0500000003 | YoY 계산 필요 |
| trade-balance | BOPGSTB | 직접 사용 가능 |
| consumer-confidence | CSCICP03USM665S | OECD 버전 |

**FRED에 없음 (대안 필요):**
- ism-manufacturing (ISM 자체 유료 데이터)
- ism-non-manufacturing (ISM 자체 유료 데이터)
- sp-global-composite (S&P 유료 데이터)
- cb-consumer-confidence (Conference Board 유료 데이터)
- industrial-production (MoM 버전)
- retail-sales (MoM 버전)
- 기타 Investing.com 전용 지표들

---

## 향후 옵션

### Option A: 추가 FRED 전환 (권장)
- 비용: 무료
- 작업량: 1-2시간
- 효과: 5개 지표 추가 복구 (총 24개 정상)

### Option B: 비활성화
- 비용: 무료
- 작업량: 30분
- 효과: 에러 메시지 제거, 지표 수 감소

### Option C: 프록시 서버
- 비용: 월 $5-20
- 작업량: 2-3시간
- 효과: 모든 Investing.com 지표 복구

### Option D: 호스팅 이전
- 비용: 무료~저렴
- 작업량: 반나절
- 효과: 개인 IP로 차단 우회 가능성
- 후보: Railway, Fly.io, DigitalOcean

---

## 커밋 이력

1. `17fcd0f` - fix: 크롤러 403 차단 문제 해결 및 Federal Funds Rate FRED 전환
2. `2b9939d` - fix: Brotli 압축 인코딩 문제 해결
3. `fc8ebf1` - feat: 8개 지표 FRED API로 전환 (Investing.com 차단 우회)

---

## 기술적 세부사항

### Render 플랫폼 차단 원인
- Investing.com은 클라우드 서비스(AWS, GCP, Azure, Render 등) IP 범위를 기본 차단
- 봇/스크래핑 방지 정책
- 로컬 IP에서는 정상 작동 확인됨

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
**작성자**: Claude Opus 4.5
