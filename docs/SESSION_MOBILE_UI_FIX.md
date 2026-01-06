# 모바일 UI 수정 세션 문서

**날짜**: 2026-01-06
**작업 목표**: 경제지표 개선 + 모바일 반응형 UI 수정

---

## ✅ 완료된 작업

### 1. 경제지표 카테고리 시스템 개선

**문제**:
- 카드형: 신용(3개), 심리(4개) 카테고리 누락 → 45개 중 38개만 표시
- 테이블형: 정책 카테고리 있지만 지표 0개

**해결**:
```typescript
// frontend/src/components/IndicatorGrid.tsx
type FilterCategory = 'all' | 'business' | 'employment' | 'interest' | 'trade' | 'inflation' | 'credit' | 'sentiment';

const CATEGORY_FILTERS = [
  { id: 'credit' as FilterCategory, name: '신용', icon: '🏛️' },
  { id: 'sentiment' as FilterCategory, name: '심리', icon: '🧠' },
];
```

```typescript
// frontend/src/components/IndicatorTableView.tsx
const CATEGORY_NAMES: Record<string, string> = {
  // 'policy': '정책',  // 삭제
  'credit': '신용',
  'sentiment': '심리',
};
```

**결과**: 45개 활성 지표 모두 표시 (경기 9, 고용 5, 금리 5, 무역 11, 물가 8, 신용 3, 심리 4)

---

### 2. 경제지표 모바일 반응형 개선

**문제**:
- 카테고리 필터 버튼이 너무 커서 가로 스크롤 필요
- 카드가 너무 크게 보임

**해결**:
```typescript
// IndicatorGrid.tsx - 카테고리 필터
<div className="overflow-x-auto mb-4">
  <div className="flex flex-nowrap gap-2 pb-2 min-w-max md:min-w-0 md:flex-wrap">
    <button className="px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm">
      {/* 모바일: 작은 버튼, 데스크톱: 원래 크기 */}
    </button>
  </div>
</div>

// 그리드 레이아웃
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4">
  {/* 모바일: 1칸, 2xl: 5칸 그리드 */}
</div>
```

---

### 3. 비활성화 지표 정리

**현황 분석**:
- 전체 지표: 56개
- 활성 크롤링: 45개
- 비활성화: 11개

**비활성화 지표 11개**:
1. ~~`industrial-production`~~ → ✅ URL 수정 후 재활성화
2. ~~`average-hourly-earnings`~~ → ✅ URL 수정 후 재활성화
3. `business-inventories` → ⚠️ 직접 확인 필요
4. `leading-indicators` → ⚠️ 직접 확인 필요
5. `exports` → ⚠️ 직접 확인 필요
6. `imports` → ⚠️ 직접 확인 필요
7. `current-account-balance` → ⚠️ 직접 확인 필요 (BEA API 키)
8. ~~`core-pce`~~ → ❌ 삭제
9. `sp-gsci` → ⚠️ 직접 확인 필요
10. `fci` → ⚠️ 직접 확인 필요 (Credit Cycle 가중치 25%, 중요!)
11. `aaii-bull` → ⚠️ 직접 확인 필요

**조치**:
```python
# backend/crawlers/indicators_config.py

# 1. URL 수정 및 재활성화
"industrial-production": IndicatorConfig(
    url="https://www.investing.com/economic-calendar/industrial-production-161",  # 175 → 161
    enabled=True,  # ✅ 재활성화
),
"average-hourly-earnings": IndicatorConfig(
    url="https://www.investing.com/economic-calendar/average-hourly-earnings-8",  # 1776 → 8
    enabled=True,  # ✅ 재활성화
),

# 2. core-pce 완전 삭제
# "core-pce": IndicatorConfig(...),  # 삭제됨

# 3. 직접 확인 지표 시스템
class IndicatorConfig:
    def __init__(
        self,
        ...
        manual_check: bool = False,  # True면 크롤링 불가, 직접 확인 필요
    ):
        ...

"fci": IndicatorConfig(
    enabled=True,
    manual_check=True,  # ⚠️ 직접 확인 필요 (Credit Cycle 가중치 25%)
),
```

---

### 4. 직접 확인 지표 시스템 (백엔드 완료)

**구현**:
```python
# backend/app.py - /api/v2/indicators
results.append({
    "indicator_id": indicator_id,
    "manual_check": metadata.manual_check if metadata else False,  # 직접 확인 필요 여부
    "url": metadata.url if metadata else None,  # 직접 확인 URL
    ...
})
```

**결과**: 백엔드에서 `manual_check: true`, `url: "..."` 필드 반환

---

## 🔄 진행 중 작업

### 5. 직접 확인 지표 프론트엔드 (미완성)

**목표**: EnhancedIndicatorCard에 "직접 확인" 배지 표시

**TODO**:
```typescript
// frontend/src/components/EnhancedIndicatorCard.tsx
interface EnhancedIndicatorCardProps {
  ...
  manualCheck?: boolean;  // 추가
  url?: string;  // 추가
}

// 카드 상단에 배지 표시
{manualCheck && (
  <a href={url} target="_blank" className="...">
    🔗 직접 확인 필요
  </a>
)}
```

### 6. 산업생산/평균시간당임금 크롤링 테스트 (미완성)

**작업**: URL 수정만 완료, 실제 크롤링 테스트 미실시

**수정 내역**:
```python
# backend/crawlers/indicators_config.py
"industrial-production": IndicatorConfig(
    url="https://www.investing.com/economic-calendar/industrial-production-161",  # ✅ URL 변경
    enabled=True,
),
"average-hourly-earnings": IndicatorConfig(
    url="https://www.investing.com/economic-calendar/average-hourly-earnings-8",  # ✅ URL 변경
    enabled=True,
),
```

**TODO**:
- [ ] 백엔드 서버 재시작
- [ ] 수동 크롤링 테스트 실행
- [ ] API 응답 확인 (`/api/v2/indicators/industrial-production`)
- [ ] 프론트엔드에서 카드 정상 표시 확인
- [ ] 실패 시 URL 재확인 또는 크롤러 로직 디버깅

**테스트 명령어**:
```bash
# 백엔드 로컬 테스트
cd backend
python3 -c "
from crawlers.unified_crawler import UnifiedCrawler
from crawlers.indicators_config import get_indicator_config

crawler = UnifiedCrawler()
config = get_indicator_config('industrial-production')
result = crawler.crawl_indicator(config)
print(result)
"

# API 테스트
curl http://localhost:5000/api/v2/indicators/industrial-production
```

---

## 📋 남은 작업 (다음 세션)

### 1. 산업생산/평균시간당임금 크롤링 검증 (최우선)
- [ ] 두 지표 크롤링 테스트
- [ ] 성공: 카드 정상 표시 확인
- [ ] 실패: URL 재확인 또는 `manual_check=true`로 변경

### 2. 직접 확인 지표 프론트엔드 완성
- [ ] EnhancedIndicatorCard에 `manualCheck`, `url` props 추가
- [ ] "직접 확인" 배지 UI 구현
- [ ] 클릭 시 새 탭에서 URL 열기
- [ ] 스타일: 노란색 배지 + 링크 아이콘

### 2. 모바일 가계부 페이지
**문제**: 상단 요소(이번달 현황, 총수입, ..., 총거래)가 sticky해서 스크롤 시 내용 가림

**파일**: `frontend/src/app/expenses/page.tsx`

**TODO**:
- [ ] sticky 헤더 제거 또는 높이 조정
- [ ] 스크롤 시 컨텐츠와 겹치지 않도록 수정

### 3. 모바일 포트폴리오 페이지
**문제**:
- 포트폴리오 상세 리스트 디자인 불완전
- 항목이 많아서 옆으로 스크롤 많이 필요
- "대체투자", "부동산", "암호화폐" 제목들이 가로로 텍스트 나열됨

**파일**: `frontend/src/app/portfolio/page.tsx`

**TODO**:
- [ ] 테이블 레이아웃을 모바일에서 카드형으로 변경
- [ ] 가로 스크롤 제거
- [ ] 세로 텍스트를 가로 텍스트로 수정

### 4. 모바일 섹터/종목 페이지
**문제**: 6개 대분류 버튼이 너무 커서 왼쪽으로 스크롤 필요

**파일**: `frontend/src/app/industries/page.tsx`

**TODO**:
- [ ] 버튼 크기 축소 (px-3 py-1.5, text-xs)
- [ ] 2열 또는 3열 그리드 레이아웃
- [ ] 아이콘 크기 축소

---

## 📊 최종 현황

**경제지표**:
- 전체: 56개 → 55개 (core-pce 삭제)
- 활성: 45개 → 47개 (산업생산, 평균시간당임금 재활성화)
- 크롤링: 40개 (자동)
- 직접 확인: 7개 (manual_check=true)

**모바일 UI**:
- ✅ 경제지표 페이지
- ⏸️ 가계부 페이지
- ⏸️ 포트폴리오 페이지
- ⏸️ 섹터/종목 페이지

---

## 🚀 다음 세션 시작 방법

```bash
# 1. README.md 읽고 시작
"README.md 읽고 시작해줘"

# 2. 이 문서 읽기
"docs/SESSION_MOBILE_UI_FIX.md 읽고 남은 작업 계속해줘"

# 3. 우선순위
1순위: 산업생산/평균시간당임금 크롤링 검증 (⚠️ 최우선)
2순위: 직접 확인 지표 프론트엔드 완성
3순위: 모바일 가계부 페이지 sticky 헤더 수정
4순위: 모바일 포트폴리오 페이지 디자인 수정
5순위: 모바일 섹터/종목 페이지 버튼 크기 수정
```

---

## ⚠️ 중요 참고사항

**크롤링 URL 변경 후 검증 필수**:
- `industrial-production`: 175 → 161 변경
- `average-hourly-earnings`: 1776 → 8 변경
- 실제 크롤링 성공 여부 미확인 상태
- 실패 시 대체 URL 찾거나 `manual_check=true`로 전환

**직접 확인 지표 7개**:
1. `business-inventories` (기업재고)
2. `leading-indicators` (경기선행지수)
3. `exports` (수출)
4. `imports` (수입)
5. `current-account-balance` (경상수지)
6. `sp-gsci` (S&P GSCI 원자재지수)
7. `fci` (금융여건지수) ← **Credit Cycle 가중치 25%, 매우 중요!**

**프론트엔드 작업 대기 중**:
- EnhancedIndicatorCard에 "직접 확인" 배지 표시
- `manualCheck`, `url` props 전달 및 렌더링
- 노란색 배지 + 링크 아이콘 스타일링

---

**작성일**: 2026-01-06
**다음 세션 예상 시간**: 1-2시간
