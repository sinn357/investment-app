# Master Market Cycle 디버깅 세션 기록

**날짜**: 2025-12-06
**작업자**: Claude Code
**목표**: Master Market Cycle 50점 고정 문제 해결

---

## 🎯 문제 정의

### 초기 증상
- Master Market Cycle의 3대 사이클(거시경제, 신용/유동성, 심리/밸류) 모두 **50점 고정**
- 프론트엔드에 "ℹ️ Sentiment 지표 데이터 수집 중 (S&P PE, CAPE, P/C Ratio)" 안내 메시지 계속 표시
- 실제로는 크롤러가 구현되어 있었지만 작동하지 않음

---

## 🔍 근본 원인 분석

### 데이터 흐름 순차 검증
```
1. 크롤링 API 호출
   ↓
2. save_indicator_data() → DB 저장
   ↓
3. get_latest_indicator() → DB 조회
   ↓
4. calculate_sentiment_score() → 점수 계산
   ↓
5. Master Market Cycle → MMC 점수 반환
```

### 발견된 3가지 근본 문제

#### **Problem 1: 크롤러 데이터 구조 불일치** (1차 수정 → 2차 복원)
- **1차 시도 (잘못됨)**: 중첩 구조 제거 → 평탄화
  ```python
  # 잘못된 반환 구조
  return {
      "release_date": "2025-12-06",
      "actual": "31.0",
      ...
  }
  ```
- **문제**: `save_indicator_data()`가 `if 'latest_release' in crawled_data` 조건 확인
  - 조건 실패 → DB INSERT 건너뜀 → 데이터 없음

- **2차 수정 (올바름)**: 중첩 구조 복원
  ```python
  # 올바른 반환 구조 (DB 호환)
  return {
      "latest_release": {
          "release_date": "2025-12-06",
          "actual": "31.0",
          "forecast": None,
          "previous": "30.98"
      },
      "next_release": None,
      "history_table": []
  }
  ```

#### **Problem 2: API 엔드포인트 응답 구조 오류**
- API가 평탄화된 크롤러 결과를 재구성하려다 KeyError 발생
- **수정**: 크롤러가 이미 중첩 구조로 반환하므로 그대로 전달
  ```python
  # Before (에러 발생)
  "latest_release": result["latest_release"]  # KeyError!

  # After (정상)
  "latest_release": result.get("latest_release")
  ```

#### **Problem 3: DB 조회 쿼리 컬럼 불일치** ⭐ **핵심**
- `get_latest_indicator()` 쿼리가 존재하지 않는 컬럼 참조
  ```sql
  -- 잘못된 쿼리
  SELECT latest_release, next_release FROM latest_releases
  -- 오류: column "latest_release" does not exist

  -- 실제 테이블 스키마
  CREATE TABLE latest_releases (
      indicator_id TEXT,
      release_date TEXT,  -- ✅ 이것만 있음
      time TEXT,
      actual TEXT,
      forecast TEXT,
      previous TEXT
  );
  ```

- **수정**: 존재하는 컬럼으로 변경
  ```sql
  SELECT
      indicator_id,
      actual,
      forecast,
      previous,
      release_date,  -- latest_release → release_date
      time           -- next_release → time
  FROM latest_releases
  WHERE indicator_id = %s
  ORDER BY created_at DESC
  LIMIT 1
  ```

---

## ✅ 완료된 작업

### 커밋 히스토리
1. **`1b5e691`** - Sentiment 크롤러 PostgreSQL 호환성 수정 + DB 저장 로직 추가
   - 3개 크롤러 필드명 수정 (잘못된 접근 - 평탄화)
   - API 엔드포인트에 `db_service.save_indicator_data()` 추가
   - 프론트엔드 안내 메시지 제거

2. **`4a53cf5`** - API 엔드포인트 응답 구조 수정
   - 평탄화된 구조를 재구성하려다 KeyError 발생
   - 임시 해결책 시도

3. **`8e055f5`** - 크롤러 데이터 구조 복원 - DB 저장 호환성 확보 ⭐
   - 3개 크롤러 중첩 구조 복원 (`latest_release` 키 추가)
   - `history` → `history_table` 필드명 수정
   - API 엔드포인트 단순화

4. **`bece1c1`** - get_latest_indicator 쿼리 수정 ⭐ **핵심 해결**
   - `latest_release` → `release_date` 컬럼명 수정
   - `ORDER BY created_at DESC LIMIT 1` 추가
   - SQL 에러 완전 해결

### 수정된 파일 목록
**백엔드 (4개 파일)**:
- `backend/crawlers/sp500_pe_crawler.py`
- `backend/crawlers/shiller_pe_crawler.py`
- `backend/crawlers/put_call_crawler.py`
- `backend/app.py` (3개 API 엔드포인트)
- `backend/services/postgres_database_service.py` (get_latest_indicator)

**프론트엔드 (1개 파일)**:
- `frontend/src/components/MasterCycleCard.tsx` (안내 메시지 제거)

---

## 📊 Master Market Cycle 전체 구조

### 3대 사이클 구성 (cycle_engine.py)

#### 1. Macro Cycle (거시경제) - 6개 지표
```python
MACRO_INDICATORS = {
    'ism-manufacturing': {weight: 0.30, name: 'ISM 제조업 PMI'},
    'ism-non-manufacturing': {weight: 0.20, name: 'ISM 서비스업 PMI'},
    'unemployment-rate': {weight: 0.20, name: '실업률'},
    'core-cpi': {weight: 0.10, name: '근원 CPI'},
    'federal-funds-rate': {weight: 0.15, name: '연준 기준금리'},
    'yield-curve-10y-2y': {weight: 0.05, name: '장단기금리차'}
}
```

#### 2. Credit Cycle (신용/유동성) - 5개 지표
```python
CREDIT_INDICATORS = {
    'hy-spread': {weight: 0.30, name: 'HY 스프레드'},
    'ig-spread': {weight: 0.20, name: 'IG 스프레드'},
    'fci': {weight: 0.25, name: '금융여건지수'},
    'm2-yoy': {weight: 0.15, name: 'M2 증가율'},
    'vix': {weight: 0.10, name: 'VIX'}
}
```

#### 3. Sentiment Cycle (심리/밸류) - 6개 지표
```python
SENTIMENT_INDICATORS = {
    'vix': {weight: 0.20, name: 'VIX'},
    'sp500-pe': {weight: 0.20, name: 'S&P500 PER'},       # ✅ 크롤러 있음
    'shiller-pe': {weight: 0.15, name: 'Shiller CAPE'},    # ✅ 크롤러 있음
    'put-call-ratio': {weight: 0.15, name: 'Put/Call'},    # ✅ 크롤러 있음 (폴백)
    'michigan-consumer-sentiment': {weight: 0.15, name: '미시간'},
    'cb-consumer-confidence': {weight: 0.15, name: 'CB 신뢰'}
}
```

### MMC 계산 공식
```python
mmc_score = (
    0.50 * sentiment['score'] +  # Sentiment 50%
    0.30 * credit['score'] +     # Credit 30%
    0.20 * macro['score']        # Macro 20%
)
```

---

## ❌ 남은 문제점

### 1. 지표 데이터 부족 (가장 중요!)

#### Sentiment Cycle (6개 필요 → 4개만 DB 보유)
- ✅ `vix`: 기존 보유
- ✅ `sp500-pe`: 크롤러 구현, API 성공 (31.06)
- ✅ `shiller-pe`: 크롤러 구현
- ✅ `put-call-ratio`: 크롤러 구현 (폴백 1.0)
- ❌ `michigan-consumer-sentiment`: **DB 없음** (크롤러 미구현)
- ❌ `cb-consumer-confidence`: **DB 없음** (크롤러 미구현)

**예상 결과**: Sentiment 점수는 VIX + S&P PE + CAPE + P/C 4개 지표로만 계산 → 정확도 낮음

#### Macro Cycle (6개 필요 → 대부분 DB 없음)
- ❌ `ism-manufacturing`: DB 확인 필요
- ❌ `ism-non-manufacturing`: DB 확인 필요
- ❌ `unemployment-rate`: DB 확인 필요
- ❌ `core-cpi`: DB 확인 필요
- ❌ `federal-funds-rate`: DB 확인 필요
- ❌ `yield-curve-10y-2y`: DB 확인 필요

**예상 결과**: Macro 점수 50점 고정 (데이터 없음)

#### Credit Cycle (5개 필요 → 대부분 DB 없음)
- ❌ `hy-spread`: DB 확인 필요
- ❌ `ig-spread`: DB 확인 필요
- ❌ `fci`: DB 확인 필요
- ❌ `m2-yoy`: DB 확인 필요
- ❌ `vix`: 기존 보유 (유일)

**예상 결과**: Credit 점수 50점 고정 (VIX만으로는 계산 불가)

### 2. 크롤러 실행 메커니즘 부재
- API 엔드포인트는 있지만 **자동 실행 안 됨**
- 사용자가 수동으로 `/api/rawdata/{indicator}` 호출해야 DB 저장됨
- 또는 indicators 페이지에서 "업데이트" 버튼 클릭 필요

### 3. indicators_config.py 불일치
- `SENTIMENT_INDICATORS`에서 참조하는 지표 ID와 실제 크롤러 상태 불일치
- 예: `cb-consumer-confidence` 설정은 있지만 크롤러 없음

---

## 🚀 다음 세션 작업 계획

### Phase 1: 배포 검증 (5분)
1. Render 배포 완료 대기
2. API 테스트:
   ```bash
   curl https://investment-app-backend-x166.onrender.com/api/v3/cycles/master
   ```
3. **예상 결과**:
   - `sentiment.score`: 50 → **30-60 범위** (4개 지표로 계산)
   - `sentiment.indicators`: VIX, sp500-pe, shiller-pe, put-call-ratio 데이터 표시
   - `macro.score`: 여전히 50 (데이터 없음)
   - `credit.score`: 여전히 50 (데이터 없음)

### Phase 2: 지표 크롤러 상태 전수조사
1. **기존 보유 지표 확인**:
   ```bash
   # Macro 6개
   curl /api/rawdata/ism-manufacturing
   curl /api/rawdata/ism-non-manufacturing
   curl /api/rawdata/unemployment-rate
   curl /api/rawdata/core-cpi
   curl /api/rawdata/federal-funds-rate
   curl /api/rawdata/yield-curve-10y-2y

   # Credit 5개
   curl /api/rawdata/hy-spread
   curl /api/rawdata/ig-spread
   curl /api/rawdata/fci
   curl /api/rawdata/m2-yoy
   curl /api/rawdata/vix

   # Sentiment 6개
   curl /api/rawdata/vix
   curl /api/rawdata/sp500-pe           # ✅
   curl /api/rawdata/shiller-pe         # ✅
   curl /api/rawdata/put-call-ratio     # ✅
   curl /api/rawdata/michigan-consumer-sentiment
   curl /api/rawdata/cb-consumer-confidence
   ```

2. **결과 정리**:
   - ✅ 크롤러 있음 + DB 저장됨: 정상
   - ⚠️ 크롤러 있음 + DB 없음: DB 저장 로직 확인
   - ❌ 크롤러 없음: 신규 크롤러 개발 필요

### Phase 3: 누락된 크롤러 개발 (우선순위)
1. **Sentiment 완성** (2개 크롤러):
   - `michigan-consumer-sentiment`: Investing.com 크롤러
   - `cb-consumer-confidence`: Investing.com 크롤러

2. **Credit 완성** (4개 크롤러):
   - `hy-spread`: FRED API
   - `ig-spread`: FRED API
   - `fci`: FRED API
   - `m2-yoy`: FRED API

3. **Macro 확인** (기존 크롤러 활용 가능성):
   - 대부분 Investing.com 또는 FRED에서 이미 크롤링 중일 가능성
   - DB 저장만 추가하면 될 수도 있음

### Phase 4: 자동 크롤링 스케줄러 구현
- **옵션 1**: 페이지 로드 시 자동 크롤링 (30분마다)
- **옵션 2**: 백엔드 cron job (매일 1회)
- **옵션 3**: GitHub Actions Keep-Alive에 통합

### Phase 5: 프론트엔드 개선
- Master Market Cycle Card에 "마지막 업데이트" 시간 표시
- 데이터 없는 지표 명시 (투명성)
- "데이터 업데이트" 버튼 추가

---

## 📝 참고 파일 위치

### 핵심 파일
- **Cycle Engine**: `backend/services/cycle_engine.py` (592줄)
- **DB Service**: `backend/services/postgres_database_service.py` (get_latest_indicator: Line 2597)
- **API 엔드포인트**: `backend/app.py` (Line 2707-2850)
- **Sentiment 크롤러**:
  - `backend/crawlers/sp500_pe_crawler.py`
  - `backend/crawlers/shiller_pe_crawler.py`
  - `backend/crawlers/put_call_crawler.py`
- **지표 설정**: `backend/crawlers/indicators_config.py`

### 문서
- **Phase 1-3 완료**: `docs/2025-12-05_Master_Market_Cycle_Complete.md`
- **사이클 재설계**: `docs/CYCLE_SYSTEM_REDESIGN.md`

---

## 🎯 성공 기준

### 최소 목표 (Sentiment만)
- [ ] Sentiment 점수: 50 → **실제 계산값** (30-70 범위)
- [ ] 4-6개 지표 데이터 표시
- [ ] Master Market Cycle 정상 작동

### 완전 목표 (3대 사이클 모두)
- [ ] Macro 점수: 실제 계산값
- [ ] Credit 점수: 실제 계산값
- [ ] Sentiment 점수: 실제 계산값
- [ ] MMC 점수: 가중 평균 정확 반영
- [ ] 17개 지표 모두 DB 저장
- [ ] 자동 크롤링 시스템 구축

---

**마지막 커밋**: `bece1c1` (2025-12-06)
**다음 세션 시작**: DB 조회 쿼리 수정 배포 검증부터
