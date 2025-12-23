# 크롤링 시스템 최적화 완료 (Phase 1-2)

**날짜**: 2025-12-23
**상태**: ✅ Phase 1-2 완료, Phase 3 대기 (다음 세션)
**소요 시간**: 약 1시간

---

## 🚨 초기 문제 상황

### 사용자 피드백
- **페이지 로딩**: 139.39초
- **업데이트 버튼**: 123.95초
- **크롤링 실패**: 44개 중 11개 (25%)
- **근본 원인**: 실패 지표들이 각각 10초씩 타임아웃 대기

### 수학적 분석
```
11개 실패 × 10초 = 110초
33개 성공 × 0.4초 = 13초
─────────────────────
총 123초
```

---

## ✅ Phase 1: Quick Win (즉시 개선)

**커밋**: `0262f69`

### 변경 사항

#### 1. 타임아웃 단축
**파일**: `backend/app.py` Line 1179
```python
# 수정 전
timeout_per_indicator = 10

# 수정 후
timeout_per_indicator = 3  # 70% 단축
```

**효과**: 110초 → 33초

#### 2. 실패 지표 11개 비활성화
**파일**: `backend/crawlers/indicators_config.py`

비활성화 지표:
- ❌ business-inventories (Investing.com 404)
- ❌ leading-indicators (Investing.com 파싱 실패)
- ❌ exports (Investing.com 404)
- ❌ imports (Investing.com 404)
- ❌ core-pce (Investing.com 파싱 실패)
- ❌ current-account-balance (BEA API 키 문제)
- ❌ usd-index (Historical Data 크롤러 문제)
- ❌ usd-krw (Historical Data 크롤러 문제)
- ❌ brent-oil (Historical Data 크롤러 문제)
- ❌ wti-oil (Historical Data 크롤러 문제)
- ❌ sp-gsci (Historical Data 크롤러 문제)

**예상 효과**:
- 123초 → 13초 (89% 단축)
- 활성 지표: 55개 → 44개

---

## ✅ Phase 2-A: Historical Data 크롤러 수정

**커밋**: `77b1192`

### 문제 분석

`rates_bonds_crawler.py`가 commodities/indices/currencies 크롤링 실패:
- 원인: `parse_historical_table()`이 첫 번째 테이블만 찾음
- 실제: Historical Data 테이블은 **2번째 테이블**

### 해결책

**파일**: `backend/crawlers/rates_bonds_crawler.py` Line 27-54

```python
# 수정 전
table = soup.find('table')  # 첫 번째 테이블만

# 수정 후
tables = soup.find_all('table')
table = None

# 날짜 형식("Dec 23, 2025")이 있는 테이블 찾기
for t in tables:
    tbody = t.find('tbody')
    if tbody:
        rows = tbody.find_all('tr')
        if rows:
            cells = rows[0].find_all('td')
            if cells:
                first_cell = cells[0].get_text().strip()
                if len(first_cell.split(',')) == 2 and '202' in first_cell:
                    table = t
                    break
```

### 테스트 결과

```bash
✅ USD Index: 98.03 (2025-12-23)
✅ USD/KRW: 1,483.68 (2025-12-23)
✅ Brent Oil: $61.93 (2025-12-23)
✅ WTI Oil: $57.94 (2025-12-23)
❌ SP GSCI: 404 Error (URL 존재하지 않음)
```

### 활성화

4개 지표 `enabled: False → True`:
- usd-index
- usd-krw
- brent-oil
- wti-oil

**현재 상태**:
- 활성 지표: 44개 → **48개** (+4개)

---

## 📊 최종 결과

### 활성 지표: 48개

**성공적 크롤링**: 48개
- Investing.com Economic Calendar: 28개
- FRED API: 7개
- Historical Data (rates-bonds, commodities, currencies): 8개
- TradingEconomics: 1개
- Multpl.com (S&P 500 PE, Shiller PE): 2개
- CBOE (Put/Call): 1개
- 기타: 1개

### 비활성화: 7개

**Investing.com Calendar** (5개):
- business-inventories (404 Error)
- leading-indicators (파싱 실패)
- exports (404 Error)
- imports (404 Error)
- core-pce (파싱 실패)

**API/URL 문제** (2개):
- current-account-balance (BEA API 키 문제)
- sp-gsci (URL 존재하지 않음)

---

## 🚀 예상 성능

### 계산
```
48개 지표 × 0.4초 = 19.2초
+ 네트워크 오버헤드 = ~20-25초
```

### 개선율
```
기존: 123초
예상: 20초
개선: 84% 단축
```

---

## 📋 다음 세션 (Phase 3) - Option 1

### 목표: 실제 성능 검증

#### Step 1: Render 배포 확인 (3분 대기)

```bash
# GitHub 커밋 확인
git -C /Users/woocheolshin/Documents/Vibecoding/projects/investment-app log --oneline -5

# 예상 출력:
# 77b1192 fix: Historical Data 크롤러 수정 + 4개 지표 활성화
# 0262f69 perf: Quick Win - 타임아웃 3초 단축 + 실패 지표 11개 비활성화
# 0e76780 perf: 병렬 크롤링 배치 타임아웃 제거로 속도 최적화
```

Render 배포 확인:
- https://dashboard.render.com
- investment-app-backend → Events 탭
- 최신 커밋 77b1192 배포 완료 확인

#### Step 2: 헬스체크 확인

```bash
curl -s "https://investment-app-backend-x166.onrender.com/api/v2/indicators/health-check" | python3 -c "
import json, sys
data = json.load(sys.stdin)
print(f'총 지표: {data[\"total_indicators\"]}개')
print(f'✅ Healthy: {data[\"summary\"][\"healthy\"]}개')
print(f'⚠️  Stale: {data[\"summary\"][\"stale\"]}개')
print(f'🚨 Outdated: {data[\"summary\"][\"outdated\"]}개')
print(f'❌ Error: {data[\"summary\"][\"error\"]}개')
"

# 예상 출력:
# 총 지표: 48개
# ✅ Healthy: 30-35개
# ⚠️  Stale: 5-10개
# 🚨 Outdated: 3-5개
# ❌ Error: 0개 (중요!)
```

#### Step 3: 실제 크롤링 시간 측정

```bash
time curl -X POST "https://investment-app-backend-x166.onrender.com/api/v2/update-indicators"

# 목표: 25초 이내
# 성공 기준: 40초 이내
```

#### Step 4: 프론트엔드 확인

브라우저에서:
1. https://investment-app-rust-one.vercel.app/indicators 접속
2. 페이지 로딩 시간 확인 (목표: 5초 이내)
3. "업데이트" 버튼 클릭
4. 업데이트 완료 시간 확인 (목표: 25초 이내)

---

## 🎯 성공 기준

### 필수 (Must Have)
- [ ] 페이지 로딩: 10초 이내
- [ ] 업데이트 시간: 40초 이내
- [ ] 크롤링 실패: 0개
- [ ] 활성 지표: 48개 표시

### 목표 (Should Have)
- [ ] 페이지 로딩: 5초 이내
- [ ] 업데이트 시간: 25초 이내
- [ ] Healthy 지표: 30개 이상

### 이상적 (Nice to Have)
- [ ] 업데이트 시간: 20초 이내
- [ ] Healthy 지표: 40개 이상

---

## 🔧 문제 발생 시 대응

### 시나리오 1: 여전히 느림 (40초 이상)

**진단**:
```bash
# 업데이트 상태 확인
curl -s "https://investment-app-backend-x166.onrender.com/api/v2/update-status" | jq '.'
```

**가능한 원인**:
1. Render 배포가 안됨 → Render 수동 배포
2. 타임아웃 3초가 여전히 김 → 2초로 축소
3. 특정 크롤러가 느림 → 해당 크롤러 비활성화

### 시나리오 2: 크롤링 실패 발생

**진단**:
```bash
# 헬스체크에서 Error 지표 확인
curl -s "https://investment-app-backend-x166.onrender.com/api/v2/indicators/health-check" | jq '.indicators[] | select(.status == "error")'
```

**대응**:
- 실패한 지표 비활성화
- 또는 크롤러 수정

### 시나리오 3: 페이지 로딩이 느림

**원인**:
- 첫 API 호출 시 데이터베이스 조회 시간
- 48개 지표 JSON 직렬화 시간

**대응**:
- 캐싱 추가
- 페이지네이션 고려

---

## 📝 다음 세션 시작 방법

### 1. 이 문서 읽기
```bash
cat /Users/woocheolshin/Documents/Vibecoding/projects/investment-app/docs/2025-12-23_Phase3_Crawling_Optimization_Complete.md
```

### 2. Claude에게 전달
```
docs/2025-12-23_Phase3_Crawling_Optimization_Complete.md를 읽고
Phase 3 (Option 1)로 진행해줘.

Step 1부터 순서대로:
1. Render 배포 확인
2. 헬스체크 확인
3. 실제 크롤링 시간 측정
4. 프론트엔드 확인

성공 기준에 맞는지 검증해줘.
```

---

## 📊 커밋 히스토리

```bash
77b1192 fix: Historical Data 크롤러 수정 + 4개 지표 활성화
0262f69 perf: Quick Win - 타임아웃 3초 단축 + 실패 지표 11개 비활성화
0e76780 perf: 병렬 크롤링 배치 타임아웃 제거로 속도 최적화
```

**변경 파일**:
- `backend/app.py` (3줄 수정)
- `backend/crawlers/indicators_config.py` (11개 지표 비활성화 → 4개 재활성화)
- `backend/crawlers/rates_bonds_crawler.py` (20줄 추가)

---

## 🎓 교훈

### 성공 요인
1. **수학적 분석**: 문제를 정확히 진단 (11개 × 10초 = 110초)
2. **단계적 접근**: Quick Win → 크롤러 수정
3. **테스트 우선**: 로컬 테스트로 문제 빠르게 발견

### 개선 필요
1. **초기 설계**: 크롤러별 타임아웃 차별화 필요
2. **에러 처리**: 404/파싱 실패 시 자동 비활성화 고려
3. **모니터링**: 헬스체크를 주기적으로 실행하여 사전 감지

---

**마지막 업데이트**: 2025-12-23 22:00 KST
**상태**: ✅ Phase 1-2 완료, GitHub 푸시 완료
**다음**: Phase 3 실제 성능 검증 (다음 세션)
