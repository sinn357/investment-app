# Codex 위임 작업: 모바일 UI 마무리 수정

**생성일**: 2026-01-06
**우선순위**: 높음 (모바일 UX 핵심 이슈)
**예상 소요**: 2-3시간

---

## 📋 작업 개요

이전 세션에서 완료하지 못한 모바일 UI 문제들을 해결합니다. 크게 3개 카테고리로 나뉩니다:

1. **데이터 표시 문제** (크롤링 지표 미표시)
2. **레이아웃 문제** (빈공간 스크롤, 박스 삐져나옴)
3. **디자인 개선** (포트폴리오 상세 섹션)

---

## 🎯 Task 1: 크롤링 지표 2개 미표시 해결 (최우선)

### 문제 상황
- **산업생산 (industrial-production)**과 **평균시간당임금 (average-hourly-earnings)** 2개 지표가 카드형/테이블형 어디에도 표시되지 않음
- 백엔드 크롤링 테스트는 성공 확인됨:
  ```bash
  python3 backend/crawlers/unified_crawler.py industrial-production
  # ✅ 성공: 2025-12-23, 0.2%

  python3 backend/crawlers/unified_crawler.py average-hourly-earnings
  # ✅ 성공: 2025-12-16, 0.1%
  ```

### 원인 분석

#### 가설 1: 백엔드 API 응답에서 누락
**확인 방법**:
```bash
curl https://investment-app-backend-x166.onrender.com/api/v2/indicators | jq '.indicators[] | select(.indicator_id | test("industrial-production|average-hourly-earnings"))'
```

**예상 문제**:
- `/api/v2/indicators` 엔드포인트가 해당 지표를 반환하지 않음
- `enabled=True`임에도 불구하고 필터링되고 있을 가능성

**해결 방법**:
- `backend/app.py`의 `/api/v2/indicators` 엔드포인트 로직 확인
- `indicators_config.py`의 설정 재확인
- 필요 시 수동으로 두 지표 추가

#### 가설 2: 프론트엔드 필터링 로직
**확인 위치**:
- `frontend/src/app/indicators/page.tsx:305` - `result.indicators.map()`

**예상 문제**:
- 특정 조건에서 지표를 필터링하는 로직 존재 가능
- 카테고리 매핑 오류로 제외될 가능성

**해결 방법**:
- API 응답을 콘솔에 출력하여 데이터 존재 여부 확인:
  ```typescript
  console.log('API indicators:', result.indicators.filter(i =>
    i.indicator_id.includes('industrial') || i.indicator_id.includes('hourly')
  ));
  ```

### 해결 체크리스트
- [ ] 백엔드 API 응답에 두 지표 포함 여부 확인
- [ ] 프론트엔드 `allIndicators` state에 포함 여부 확인
- [ ] IndicatorGrid 필터링 로직 확인
- [ ] 카테고리 매핑 확인 (`mapIndicatorToCategory` 함수)
- [ ] 수정 후 카드형/테이블형 양쪽에서 표시 확인

### 참고 파일
- `backend/app.py` (API 엔드포인트)
- `backend/crawlers/indicators_config.py` (지표 설정)
- `frontend/src/app/indicators/page.tsx` (데이터 페칭)
- `frontend/src/components/IndicatorGrid.tsx` (카드형 표시)
- `frontend/src/components/IndicatorTableView.tsx` (테이블형 표시)

---

## 🎯 Task 2: 직접 확인 지표 8-9개 미표시 해결

### 문제 상황
직접 확인 배지("🔗 직접 확인 필요")를 구현했지만, `manual_check=true`인 지표들이 표시되지 않음

### 직접 확인 지표 목록 (SESSION_MOBILE_UI_FIX.md 참조)
1. `business-inventories` (기업재고)
2. `leading-indicators` (경기선행지수)
3. `exports` (수출)
4. `imports` (수입)
5. `current-account-balance` (경상수지)
6. `sp-gsci` (S&P GSCI 원자재지수)
7. `fci` (금융여건지수) ⚠️ **Credit Cycle 가중치 25%, 매우 중요!**
8. `aaii-bull` (AAII 투자심리)
9. 기타 (확인 필요)

### 원인 분석

#### 가설 1: 백엔드에서 manual_check=true 지표를 응답에서 제외
**확인 방법**:
```bash
curl https://investment-app-backend-x166.onrender.com/api/v2/indicators | jq '.indicators[] | select(.manual_check == true)'
```

**예상 문제**:
- `enabled=True`이지만 `manual_check=true`인 지표를 필터링하는 로직 존재 가능
- `/api/v2/indicators` 엔드포인트가 크롤링 가능한 지표만 반환

**해결 방법**:
- `backend/app.py`의 `/api/v2/indicators` 로직 확인
- `manual_check=true` 지표도 포함하도록 수정:
  ```python
  if metadata.enabled:  # manual_check 상관없이 포함
      results.append({
          "indicator_id": indicator_id,
          "manual_check": metadata.manual_check,
          "url": metadata.url,
          # ...
      })
  ```

#### 가설 2: 프론트엔드에서 null/undefined 데이터 필터링
**확인 위치**:
- `frontend/src/app/indicators/page.tsx:305-340`

**예상 문제**:
- `latest.actual`이 null인 경우 지표를 제외하는 로직 존재 가능
- 직접 확인 지표는 크롤링 데이터가 없으므로 null일 가능성

**해결 방법**:
- `manual_check=true`인 경우 actual이 null이어도 표시하도록 수정:
  ```typescript
  if (item.manual_check || latest.actual !== null) {
    // 지표 포함
  }
  ```

### 해결 체크리스트
- [ ] 백엔드 API 응답에 `manual_check=true` 지표 포함 여부 확인
- [ ] 프론트엔드에서 null 데이터 필터링 로직 확인
- [ ] EnhancedIndicatorCard가 actual=null인 경우에도 렌더링하는지 확인
- [ ] 직접 확인 배지 클릭 시 URL이 올바르게 열리는지 확인

### 참고 파일
- `backend/app.py` (API 엔드포인트)
- `backend/crawlers/indicators_config.py` (manual_check 설정)
- `frontend/src/app/indicators/page.tsx` (필터링 로직)
- `frontend/src/components/EnhancedIndicatorCard.tsx` (배지 표시)

---

## 🎯 Task 3: 모바일 경제지표 페이지 빈공간 스크롤 제거

### 문제 상황
모바일에서 경제지표 페이지를 볼 때 오른쪽 빈공간으로 스크롤이 되며, 일부 내용이 화면 밖에 위치

### 원인 분석
- 특정 컴포넌트의 너비가 화면을 벗어남
- `min-w` 또는 고정 너비 사용으로 인한 오버플로우

### 해결 방법

#### 1. 메인 컨테이너에 overflow 제한
**파일**: `frontend/src/app/indicators/page.tsx`

**찾을 위치**: `<main>` 태그 또는 최상위 컨테이너

**수정 예시**:
```tsx
// Before
<main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

// After
<main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 overflow-x-hidden">
```

#### 2. 넓은 컴포넌트 찾기
**의심 컴포넌트**:
- IndicatorGrid (카드 그리드)
- IndicatorTableView (테이블)
- MasterCycleCard
- NewsNarrative

**확인 방법**:
```tsx
// 개발자 도구에서 각 섹션별로 너비 확인
// 또는 임시로 border 추가:
<div className="border-2 border-red-500">
```

**일반적인 문제 패턴**:
- `min-w-full` 사용
- `whitespace-nowrap` 사용
- 고정 너비 (예: `w-[500px]`)
- 그리드 컬럼 수가 모바일에 맞지 않음

### 해결 체크리스트
- [ ] 메인 컨테이너에 `overflow-x-hidden` 추가
- [ ] 각 섹션의 너비 확인 (브라우저 개발자 도구 사용)
- [ ] 테이블 컴포넌트에 `max-w-full overflow-x-auto` 적용
- [ ] 모바일 뷰포트에서 스크롤 완전 제거 확인

### 참고 파일
- `frontend/src/app/indicators/page.tsx`
- `frontend/src/components/IndicatorGrid.tsx`
- `frontend/src/components/IndicatorTableView.tsx`
- `frontend/src/components/MasterCycleCard.tsx`

---

## 🎯 Task 4: 모바일 포트폴리오 페이지 빈공간 스크롤 제거

### 문제 상황
모바일에서 포트폴리오 페이지를 볼 때 오른쪽 빈공간으로 스크롤 가능

### 해결 방법
Task 3과 동일한 접근 방식:

```tsx
// frontend/src/app/portfolio/page.tsx
<main className="... overflow-x-hidden">
```

**추가 확인 대상**:
- PortfolioDashboard 컴포넌트
- 거래 계획 섹션
- 자산 배분 섹션
- 데일리 모니터링 섹션

### 해결 체크리스트
- [ ] 메인 컨테이너에 `overflow-x-hidden` 추가
- [ ] PortfolioDashboard 컴포넌트 확인
- [ ] 모든 GlassCard 컴포넌트 너비 확인
- [ ] 모바일 뷰포트에서 스크롤 완전 제거 확인

### 참고 파일
- `frontend/src/app/portfolio/page.tsx`
- `frontend/src/components/PortfolioDashboard.tsx`
- `frontend/src/components/GlassCard.tsx`

---

## 🎯 Task 5: 포트폴리오 목표날짜 박스 삐져나옴 수정

### 문제 상황
1. **전체 목표 달성률**: 목표날짜 입력 박스가 살짝 삐져나옴
2. **소분류별 목표**: 목표날짜 텍스트 박스가 살짝 삐져나옴

### 원인
그리드 레이아웃이 `grid-cols-2`로 고정되어 모바일에서 날짜 입력 필드가 좁은 공간에 억지로 들어감

### 해결 방법

#### 전체 목표 달성률 (1243줄)
**파일**: `frontend/src/components/PortfolioDashboard.tsx`

**수정 전**:
```tsx
<div className="grid grid-cols-2 gap-2">
  <div>
    <label>목표 금액</label>
    <input type="number" className="w-full ..." />
  </div>
  <div>
    <label>목표 날짜</label>
    <input type="date" className="w-full ..." />
  </div>
</div>
```

**수정 후**:
```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
  <div>
    <label className="block text-xs ...">목표 금액</label>
    <input type="number" className="w-full px-2 py-1 text-xs ..." />
  </div>
  <div>
    <label className="block text-xs ...">목표 날짜</label>
    <input type="date" className="w-full px-2 py-1 text-xs ..." />
  </div>
</div>
```

**변경 사항**:
- `grid-cols-2` → `grid-cols-1 sm:grid-cols-2` (모바일 세로 배치)
- 또는 날짜 입력 필드 폰트 크기 축소: `text-sm` → `text-xs`

#### 소분류별 목표 (1330줄 근처)
**동일한 패턴 적용**:
```tsx
<div className="space-y-2">
  <div>
    <label className="block text-xs ...">목표 금액</label>
    <input type="number" className="w-full px-2 py-1 text-xs ..." />
  </div>
  <div>
    <label className="block text-xs ...">목표 날짜</label>
    <input type="date" className="w-full px-2 py-1 text-xs ..." />
  </div>
</div>
```

**또는 세로 배치로 변경**하여 각 필드가 충분한 공간 확보

### 해결 체크리스트
- [ ] 전체 목표 달성률 그리드 수정 (1243줄)
- [ ] 소분류별 목표 레이아웃 수정 (1330줄)
- [ ] 모바일에서 삐져나옴 완전 해결 확인
- [ ] 데스크톱에서 레이아웃 정상 유지 확인

### 참고 파일
- `frontend/src/components/PortfolioDashboard.tsx:1243`
- `frontend/src/components/PortfolioDashboard.tsx:1330`

---

## 🎯 Task 6: 포트폴리오 상세 섹션 모바일 디자인 재설계 (선택적)

### 문제 상황
포트폴리오 상세 리스트 섹션이 내용이 많아 오른쪽으로 한참 스크롤 필요

### 해결 방법 (복잡, 시간 소요 예상)

#### Option 1: 중요도 낮은 컬럼 숨김
```tsx
{/* 모바일에서 메모, 등록일 등 숨김 */}
<td className="hidden md:table-cell">...</td>
```

#### Option 2: 전체 카드형 변환
거래 계획/자산 배분과 동일한 패턴:
```tsx
{/* 데스크톱: 테이블 */}
<div className="hidden md:block overflow-x-auto">
  <table>...</table>
</div>

{/* 모바일: 카드 */}
<div className="block md:hidden space-y-3">
  {assets.map(asset => (
    <div className="border rounded-lg p-4">
      {/* 자산 정보를 카드 형태로 표시 */}
    </div>
  ))}
</div>
```

### 우선순위
- ⚠️ **낮음** (다른 Task들을 먼저 완료 후 시간이 남을 경우)
- 복잡도가 높아 별도 세션으로 진행 권장

### 참고 파일
- `frontend/src/components/PortfolioDashboard.tsx` (자산 목록 섹션)

---

## 📝 작업 순서 권장

1. **Task 1** (30분) - 크롤링 지표 미표시 해결 (최우선)
2. **Task 2** (30분) - 직접 확인 지표 미표시 해결
3. **Task 3** (10분) - 경제지표 페이지 빈공간 스크롤
4. **Task 4** (10분) - 포트폴리오 페이지 빈공간 스크롤
5. **Task 5** (20분) - 목표날짜 박스 삐져나옴
6. **Task 6** (1시간, 선택적) - 포트폴리오 상세 섹션 재설계

**총 예상 시간**: 1시간 40분 (Task 6 제외)

---

## ✅ 완료 기준

### Task 1 & 2
- [ ] 산업생산/평균시간당임금 카드형에 표시
- [ ] 산업생산/평균시간당임금 테이블형에 표시
- [ ] 직접 확인 지표 8-9개 카드형에 표시 (노란색 배지 포함)
- [ ] 직접 확인 지표 8-9개 테이블형에 표시

### Task 3 & 4
- [ ] 모바일 경제지표 페이지에서 가로 스크롤 완전 제거
- [ ] 모바일 포트폴리오 페이지에서 가로 스크롤 완전 제거
- [ ] 모든 내용이 화면 내에 표시됨

### Task 5
- [ ] 전체 목표 달성률의 날짜 박스 삐져나옴 해결
- [ ] 소분류별 목표의 날짜 박스 삐져나옴 해결
- [ ] 모바일/데스크톱 양쪽에서 정상 표시

---

## 🔧 테스트 방법

### 로컬 테스트
```bash
# 프론트엔드
cd frontend
npm run dev
# http://localhost:3000

# 백엔드 (필요 시)
cd backend
python3 app.py
# http://localhost:5000
```

### 모바일 뷰 테스트
1. Chrome 개발자 도구 열기 (F12)
2. Device Toolbar 활성화 (Ctrl+Shift+M)
3. iPhone SE (375px), iPhone 12 Pro (390px), Pixel 5 (393px) 테스트
4. 가로 스크롤 완전 제거 확인

### API 테스트
```bash
# 백엔드 API 응답 확인
curl https://investment-app-backend-x166.onrender.com/api/v2/indicators | jq '.indicators | length'

# 특정 지표 검색
curl https://investment-app-backend-x166.onrender.com/api/v2/indicators | jq '.indicators[] | select(.indicator_id == "industrial-production")'
```

---

## 📚 참고 자료

### 이전 세션 문서
- `docs/SESSION_MOBILE_UI_FIX.md` - 이전 세션 작업 내역
- `docs/SESSION_2026-01-06_MOBILE_UI.md` - 오늘 완료 작업

### 주요 파일 위치
**백엔드**:
- `backend/app.py` - API 엔드포인트
- `backend/crawlers/indicators_config.py` - 지표 설정
- `backend/crawlers/unified_crawler.py` - 크롤러

**프론트엔드**:
- `frontend/src/app/indicators/page.tsx` - 경제지표 페이지
- `frontend/src/app/portfolio/page.tsx` - 포트폴리오 페이지
- `frontend/src/components/EnhancedIndicatorCard.tsx` - 지표 카드
- `frontend/src/components/IndicatorGrid.tsx` - 카드 그리드
- `frontend/src/components/IndicatorTableView.tsx` - 테이블 뷰
- `frontend/src/components/PortfolioDashboard.tsx` - 포트폴리오 대시보드

---

**작성일**: 2026-01-06
**예상 난이도**: 중 (Task 1-5), 상 (Task 6)
**다음 작업자**: Codex
