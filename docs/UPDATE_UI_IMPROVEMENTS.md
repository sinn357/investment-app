# 업데이트 UI 개선 작업

> **작성일**: 2025-12-29
> **목적**: 업데이트 진척도 표시 및 로딩 시간 계산 개선

---

## 📊 발견된 문제점

### 1. 진척도 표시 오류 (최우선)
**현상**: 업데이트 진행 중에도 "0/0 완료"로 표시됨

**원인**:
- 백엔드: `f0b1586` 커밋에서 `total_indicators` 추가했으나 아직 Render 배포 미완료
- 프론트엔드: 캐시된 이전 응답 사용 중일 수 있음

**해결 방법**:
1. Render 배포 완료 확인 (2-3분 대기)
2. 프론트엔드 캐시 클리어 후 재테스트
3. 여전히 "0/0"이면 `/api/v2/update-status` 응답 직접 확인

**검증 방법**:
```bash
# Render 배포 완료 후
curl https://investment-app-backend-x166.onrender.com/api/v2/update-status

# 예상 응답:
{
  "status": "success",
  "update_status": {
    "total_indicators": 47,  // ✅ 이 필드가 있어야 함
    "completed_indicators": [...],
    ...
  }
}
```

---

### 2. 업데이트 시간 표시 문제 (우선)
**현상**: 업데이트 완료 후에도 "9시간 전 업데이트"로 표시됨

**원인 분석**:
1. **프론트엔드 캐시**: 페이지 새로고침 없이 업데이트만 실행
2. **백엔드 응답**: `last_updated` 필드가 업데이트되지 않음
3. **시간대 문제**: 서버(UTC) vs 로컬(KST) 시간대 불일치

**해결 방법**:

#### Option 1: 업데이트 완료 후 자동 새로고침 (권장)
```typescript
// frontend/src/app/indicators/page.tsx
useEffect(() => {
  if (updateStatus?.progress === 100 && !updateStatus.is_updating) {
    // 3초 후 자동 새로고침
    setTimeout(() => {
      window.location.reload();
    }, 3000);
  }
}, [updateStatus]);
```

#### Option 2: 업데이트 완료 시 force refresh API 호출
```typescript
const handleUpdateComplete = async () => {
  // force=1 파라미터로 캐시 무시
  const response = await fetch('API_URL/indicators?force=1');
  setIndicators(response.data.indicators);
};
```

#### Option 3: 백엔드 시간 표시 개선
```python
# backend/app.py - Line 892-895 수정
indicator_updated = data.get("last_updated")
if indicator_updated:
    # ISO 8601 → 상대 시간 변환을 프론트엔드에서 처리하도록 그대로 전달
    if not last_updated or indicator_updated > last_updated:
        last_updated = indicator_updated
```

---

### 3. 로딩 시간 표시 문제 (중요)
**현상**: 업데이트 후 "로딩 시간: 15초" 표시가 의미 없음

**요구사항**:
- **일반 로딩**: "데이터 로딩: 0.5초" (Redis 캐시 히트 시)
- **업데이트 후 로딩**: "업데이트 완료: 47개 지표 (소요 시간: 23초)"

**구현 방법**:

#### 프론트엔드 수정
```typescript
// frontend/src/app/indicators/page.tsx

const [loadingInfo, setLoadingInfo] = useState({
  type: 'loading', // 'loading' | 'update'
  duration: 0,
  count: 0
});

// 일반 로딩
const fetchIndicators = async () => {
  const startTime = performance.now();
  const response = await fetch('API_URL/indicators');
  const endTime = performance.now();

  setLoadingInfo({
    type: 'loading',
    duration: (endTime - startTime) / 1000,
    count: response.data.indicators.length
  });
};

// 업데이트 후
const handleUpdateComplete = (updateStatus) => {
  const startTime = updateStatus.start_time;
  const endTime = Date.now() / 1000;

  setLoadingInfo({
    type: 'update',
    duration: endTime - startTime,
    count: updateStatus.completed_indicators.length
  });

  // 3초 후 자동 새로고침
  setTimeout(() => window.location.reload(), 3000);
};

// 표시
{loadingInfo.type === 'loading'
  ? `데이터 로딩: ${loadingInfo.duration.toFixed(2)}초`
  : `업데이트 완료: ${loadingInfo.count}개 지표 (소요 시간: ${loadingInfo.duration.toFixed(0)}초)`
}
```

---

## 🎯 구현 체크리스트

### Phase 1: 진척도 표시 수정 (즉시)
- [x] 백엔드 `total_indicators` 추가 (`f0b1586`)
- [ ] Render 배포 완료 확인
- [ ] 프론트엔드 테스트 (하드 리프레시 Cmd+Shift+R)
- [ ] `/api/v2/update-status` 응답 검증

### Phase 2: 업데이트 완료 후 자동 새로고침 (권장)
- [ ] `useEffect`로 `progress === 100` 감지
- [ ] 3초 카운트다운 표시 ("3초 후 자동 새로고침...")
- [ ] `window.location.reload()` 실행
- [ ] 업데이트 시간 정상 표시 확인

### Phase 3: 로딩 시간 표시 개선
- [ ] `loadingInfo` 상태 추가 (type, duration, count)
- [ ] 일반 로딩 시: "데이터 로딩: N초"
- [ ] 업데이트 후: "업데이트 완료: N개 지표 (소요 시간: N초)"
- [ ] 업데이트 시작/종료 시간 계산 로직 추가

### Phase 4: 추가 개선 (선택)
- [ ] 업데이트 진행 중 개별 지표 성공/실패 표시
- [ ] 실패한 지표 재시도 버튼
- [ ] 업데이트 히스토리 로그 (마지막 10회)
- [ ] 업데이트 주기 설정 (자동 업데이트)

---

## 🔍 디버깅 가이드

### 문제: "0/0 완료" 여전히 표시됨

**Step 1**: Render 배포 확인
```bash
# 최신 커밋 확인
curl https://investment-app-backend-x166.onrender.com/api/health

# 업데이트 상태 확인
curl https://investment-app-backend-x166.onrender.com/api/v2/update-status
```

**Step 2**: 프론트엔드 캐시 클리어
- Chrome: Cmd+Shift+R (하드 리프레시)
- 개발자 도구 > Network > Disable cache

**Step 3**: 백엔드 로그 확인 (Render Dashboard)
- "✅ Redis connected successfully" 확인
- 업데이트 시작 시 "total_indicators: 47" 로그 확인

---

### 문제: 업데이트 시간 갱신 안됨

**원인**:
1. 페이지 새로고침 없음
2. 프론트엔드가 캐시된 데이터 표시

**해결**:
```typescript
// 업데이트 완료 후 force refresh
const refreshData = async () => {
  const response = await fetch(
    `${API_URL}/api/v2/indicators?force=1`,
    { cache: 'no-store' }
  );
  setIndicators(response.data.indicators);
  setLastUpdated(response.data.last_updated);
};
```

---

### 문제: 로딩 시간이 부정확함

**원인**:
- 백엔드 응답 시간만 측정 (Redis 캐시 히트 시 0.5초)
- 업데이트 실제 소요 시간(20-30초) 반영 안됨

**해결**:
```typescript
// 업데이트 시작/종료 시간 추적
const [updateTiming, setUpdateTiming] = useState({
  startTime: null,
  endTime: null
});

// 업데이트 시작
const handleUpdate = async () => {
  setUpdateTiming({ startTime: Date.now(), endTime: null });
  await fetch('API_URL/update-indicators', { method: 'POST' });
};

// 업데이트 완료 감지
useEffect(() => {
  if (updateStatus?.progress === 100) {
    setUpdateTiming(prev => ({ ...prev, endTime: Date.now() }));
    const duration = (Date.now() - updateTiming.startTime) / 1000;
    console.log(`업데이트 완료: ${duration}초`);
  }
}, [updateStatus]);
```

---

## 📝 다음 세션 시작 시

```
"docs/UPDATE_UI_IMPROVEMENTS.md 읽고 Phase 2부터 시작해줘"
```

**우선순위**:
1. Phase 2 (자동 새로고침) - 업데이트 시간 표시 문제 해결
2. Phase 3 (로딩 시간 개선) - UX 개선
3. Phase 1 검증 (진척도 표시) - Render 배포 후 확인

---

**Last Updated**: 2025-12-29
**Status**: Phase 1 백엔드 완료, 프론트엔드 대기 중
