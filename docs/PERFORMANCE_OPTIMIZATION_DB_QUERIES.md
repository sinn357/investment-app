# 경제지표 페이지 DB 조회 성능 최적화

> **작성일**: 2025-12-29
> **문제**: `/api/v2/indicators` 엔드포인트 응답 시간 117.85초
> **목표**: 10초 이내로 단축 (90% 개선)

---

## 📊 문제 분석 결과

### 현재 성능

- **응답 시간**: 117.85초
- **원인**: 중복 DB 쿼리 약 120-130회

### 쿼리 횟수 상세 분석

#### 1. 메인 루프 (`app.py` Line 873-928)

```python
for indicator_id in all_indicator_ids:  # 47개 지표
    data = db_service.get_indicator_data(indicator_id)  # 1번 쿼리
    history_data = db_service.get_history_data(indicator_id, limit=12)  # 1번 쿼리
```

- **47개 지표 × 2번 쿼리 = 94회**

#### 2. Master Cycle 검증 (`cycle_engine.py` Line 625-669)

```python
# Macro 지표 검증
for indicator_id in MACRO_INDICATORS.keys():  # 6개
    data = db_service.get_indicator_data(indicator_id)  # 중복 조회!

# Credit 지표 검증
for indicator_id in CREDIT_INDICATORS.keys():  # 5개
    data = db_service.get_indicator_data(indicator_id)  # 중복 조회!

# Sentiment 지표 검증
for indicator_id in SENTIMENT_INDICATORS.keys():  # 6개
    data = db_service.get_indicator_data(indicator_id)  # 중복 조회!
```

- **17개 지표 재조회 = 17회 (이미 조회한 데이터!)**

#### 3. 사이클 계산 내부

- Macro/Credit/Sentiment 계산에서 추가 조회
- **추정 10-20회**

### 성능 병목 원인

```
총 쿼리: 120-130회
네트워크 지연: Render (미국) ↔ Neon PostgreSQL (미국)
각 쿼리당: 약 0.9-1초 (cold start + 네트워크)
총 시간: 120회 × 1초 = 120초 ≈ 117.85초 ✅
```

---

## 🎯 해결 방법 (우선순위별)

### ⭐ Priority 1: 중복 쿼리 제거 (즉시)

**파일**: `backend/app.py` Line 964

**현재 코드**:
```python
# ✅ Master Market Cycle 계산 (3대 사이클 통합)
master_cycle = None
try:
    from services.cycle_engine import calculate_master_cycle_v1
    master_cycle = calculate_master_cycle_v1(db_service)  # ❌ DB 재조회!
except Exception as e:
    print(f"Master cycle calculation error: {e}")
    master_cycle = None
```

**수정 방법 1**: 데이터 전달 방식으로 변경

```python
# ✅ Master Market Cycle 계산 (3대 사이클 통합)
master_cycle = None
try:
    from services.cycle_engine import calculate_master_cycle_v1_from_data
    master_cycle = calculate_master_cycle_v1_from_data(indicators_dict)  # ✅ 데이터 재사용
except Exception as e:
    print(f"Master cycle calculation error: {e}")
    master_cycle = None
```

**수정 방법 2**: `cycle_engine.py`에 새 함수 추가

```python
def calculate_master_cycle_v1_from_data(indicators_data: Dict[str, Any]):
    """
    이미 조회한 데이터로 Master Cycle 계산 (DB 재조회 없음)

    Args:
        indicators_data: {indicator_id: latest_release_data} 형태
    """
    # 기존 calculate_master_cycle_v1 로직에서
    # db_service.get_indicator_data() 호출을 제거하고
    # indicators_data[indicator_id]로 직접 접근
    pass
```

**예상 효과**:
- **제거 쿼리**: 17-30회
- **시간 단축**: 117초 → 90초 (23% 개선)

---

### ⭐⭐ Priority 2: 배치 쿼리 (중기)

**파일**: `backend/services/postgres_database_service.py`

**새 함수 추가**:

```python
def get_multiple_indicators_data(self, indicator_ids: List[str]) -> Dict[str, Any]:
    """
    여러 지표 데이터를 한 번에 조회 (배치 쿼리)

    Args:
        indicator_ids: 조회할 지표 ID 리스트

    Returns:
        {indicator_id: {latest_release, next_release, last_updated}} 형태
    """
    try:
        with self.get_connection() as conn:
            with conn.cursor() as cur:
                # IN 절로 한 번에 조회
                cur.execute("""
                    SELECT
                        indicator_id,
                        release_date,
                        time,
                        actual,
                        forecast,
                        previous
                    FROM latest_releases
                    WHERE indicator_id = ANY(%s)
                """, (indicator_ids,))

                latest_releases = cur.fetchall()

                # indicator_id별로 그룹화
                result = {}
                for row in latest_releases:
                    result[row['indicator_id']] = {
                        'latest_release': {
                            'release_date': row['release_date'],
                            'time': row['time'],
                            'actual': row['actual'],
                            'forecast': row['forecast'],
                            'previous': row['previous']
                        }
                    }

                return result
    except Exception as e:
        print(f"Batch query error: {e}")
        return {}
```

**app.py 수정**:

```python
# 현재: 순차 조회
for indicator_id in all_indicator_ids:
    data = db_service.get_indicator_data(indicator_id)

# 수정: 배치 조회
all_data = db_service.get_multiple_indicators_data(all_indicator_ids)
for indicator_id in all_indicator_ids:
    data = all_data.get(indicator_id, {})
```

**예상 효과**:
- **제거 쿼리**: 47회 → 1회 (latest), 47회 → 1회 (history)
- **시간 단축**: 90초 → 10-15초 (87% 개선)

---

### ⭐⭐⭐ Priority 3: Redis 캐싱 (장기)

**요구사항**:
- Redis 서버 설치
- `redis-py` 패키지 추가

**구현**:

```python
import redis
import json

redis_client = redis.Redis(
    host=os.getenv('REDIS_HOST', 'localhost'),
    port=6379,
    decode_responses=True
)

@app.route('/api/v2/indicators')
def get_all_indicators_from_db():
    # Redis 캐시 확인
    cache_key = 'indicators:all:v2'
    cached = redis_client.get(cache_key)

    if cached and not force_refresh:
        return jsonify(json.loads(cached))

    # DB 조회 (기존 로직)
    # ...

    # Redis 캐시 저장 (5분)
    redis_client.setex(cache_key, 300, json.dumps(response_data))

    return jsonify(response_data)
```

**예상 효과**:
- **캐시 히트**: 0.5초
- **시간 단축**: 10초 → 0.5초 (95% 개선)

---

## 📋 구현 체크리스트

### Phase 1: 중복 쿼리 제거 (1-2시간)

- [ ] `cycle_engine.py`에 `calculate_master_cycle_v1_from_data()` 함수 추가
- [ ] 기존 검증 로직에서 DB 조회 제거, `indicators_data` 파라미터 사용
- [ ] `app.py` Line 964 수정 (`indicators_dict` 전달)
- [ ] 로컬 테스트 (응답 시간 측정)
- [ ] Render 배포 및 검증

### Phase 2: 배치 쿼리 (3-4시간)

- [ ] `postgres_database_service.py`에 배치 쿼리 함수 추가
  - [ ] `get_multiple_indicators_data()`
  - [ ] `get_multiple_history_data()`
- [ ] `app.py` 메인 루프 리팩토링
- [ ] 단위 테스트 작성
- [ ] 로컬 테스트
- [ ] Render 배포 및 검증

### Phase 3: Redis 캐싱 (4-6시간)

- [ ] Render Redis 애드온 추가 (또는 Upstash Redis)
- [ ] `requirements.txt`에 `redis` 추가
- [ ] 캐시 레이어 구현
- [ ] 캐시 무효화 로직 (`/api/v2/update-indicators` POST 시)
- [ ] 환경변수 설정
- [ ] 배포 및 검증

---

## 📈 예상 성능 개선

| Phase | 쿼리 횟수 | 응답 시간 | 개선율 |
|-------|----------|----------|--------|
| **현재** | 120-130회 | 117.85초 | - |
| **Phase 1** | 90-100회 | 90초 | 23% ⬇️ |
| **Phase 2** | 10-15회 | 10-15초 | 87% ⬇️ |
| **Phase 3** | 0회 (캐시) | 0.5초 | 99.6% ⬇️ |

---

## 🔍 모니터링 방법

### 백엔드 로깅 추가

```python
import time

@app.route('/api/v2/indicators')
def get_all_indicators_from_db():
    start_time = time.time()

    # ... 기존 로직 ...

    db_query_time = time.time() - start_time
    print(f"⏱️ DB Query Time: {db_query_time:.2f}s")

    return jsonify(response_data)
```

### 프론트엔드 측정 (이미 구현됨)

`frontend/src/app/indicators/page.tsx` Line 258, 316-318:

```typescript
const startTime = performance.now();
// ... API 호출 ...
const endTime = performance.now();
const loadTime = (endTime - startTime) / 1000;
setLoadingTime(Number(loadTime.toFixed(2)));
```

---

## 📝 참고 자료

- **파일 위치**:
  - `backend/app.py` Line 851-995
  - `backend/services/cycle_engine.py` Line 620-670
  - `backend/services/postgres_database_service.py`

- **관련 이슈**:
  - 중복 DB 조회로 인한 성능 저하
  - Neon PostgreSQL 네트워크 지연
  - 순차 처리로 인한 병목

---

**다음 세션에서 Phase 1부터 시작하세요!**
