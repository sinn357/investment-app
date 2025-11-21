# 경제지표 페이지 개선 로드맵

> 작성일: 2025-11-21
> 목적: 탑다운 거시경제 기반 사이클 투자 프로세스 자동화

---

## 📋 목차
1. [배경 및 문제점](#배경-및-문제점)
2. [Phase 1-6 완료 사항](#phase-1-6-완료-사항)
3. [Phase 7-10 실행 계획](#phase-7-10-실행-계획)
4. [데이터 요구사항](#데이터-요구사항)
5. [기술 스택](#기술-스택)

---

## 배경 및 문제점

### 사용자 투자 프로세스
1. **거시경제 파악** - 경제 국면 판별 (성장/인플레이션/유동성/정책)
2. **산업별 리스트** - 국면에 맞는 산업/종목 선정
3. **매수 결정** - 포트폴리오에 자산 추가
4. **모니터링 & 피드백** - 투자 일지, 리밸런싱, 복기

### 현재 앱의 문제점
- **0단계 비어있음**: 경제 국면을 수동으로 판단해야 함
- **2단계 비어있음**: 산업별 워치리스트 관리 기능 없음
- **3단계 비어있음**: 투자 일지 및 복기 시스템 없음
- **경제지표 페이지**: 6개 탭 전환 필요, 디자인 불일치, 로딩 느림

### 개선 목표
1. 경제 국면을 한눈에 자동 판별
2. 6개 탭 없이 핵심 지표 확인
3. 디자인 통일 + 로딩 속도 개선
4. 투자 의사결정 자동화

---

## Phase 1-6 완료 사항

### Phase 1-2: StandardHistoryTable 통합 ✅
- 6개 탭의 히스토리 테이블을 StandardHistoryTable로 통합
- theme.ts에 TABLE_CLASSES 추가
- 일관된 색상 로직 적용

### Phase 3: EconomicIndicatorCard 완전 통합 ✅
- EXPANSION_BUTTON_CLASSES, EXPANSION_SECTION_CLASSES 추가
- 700+ 줄 하드코딩 제거
- 다크 모드 일관성 확보

### Phase 4: DataCharts 차트 시스템 통합 ✅
- CHART_THEME으로 모든 차트 스타일 통합
- Tooltip, 색상, 마진 표준화

### Phase 5: UpdateButton + indicators/page.tsx ✅
- BUTTON_CLASSES, BADGE_CLASSES 적용
- 메인 페이지 레이아웃 theme.ts 통합

### Phase 6: EconomicIndicatorsSection + TabNavigation ✅
- TAB_CLASSES 추가
- 섹션 제목, 탭 네비게이션 완전 통합
- 경제지표 페이지 모든 컴포넌트 theme.ts 적용 완료

---

## Phase 7-10 실행 계획

### **Phase 7: 경제 국면 판별 시스템** ✅ (완료: 2025-11-21)

#### 목표
- 4가지 축(성장/인플레이션/유동성/정책)을 점수화
- 현재 사이클 자동 판단 (골디락스, 스태그플레이션 등)
- 추천 자산 클래스 제시

#### Phase 7-1: 경제 국면 판별 로직 ✅ (완료)
**파일**: `/frontend/src/utils/cycleCalculator.ts`

**구현 완료**:
- ✅ 4축 점수 계산 함수 (0-100 정규화)
  - growth: ISM Manufacturing/Non-Manufacturing + 실업률 가중평균
  - inflation: CPI 기반 (2% 연준 목표 중심)
  - liquidity: 실질금리 기반 (명목금리 - 인플레이션)
  - policy: 연준 기준금리 기반
- ✅ 6가지 국면 판별 알고리즘 + 전환기
  - 골디락스, 확장기, 과열기, 스태그플레이션, 수축기, 회복기, 전환기
- ✅ 추천 자산 클래스 맵핑 (favorable/neutral/unfavorable)
- ✅ 신뢰도 계산 로직 (데이터 품질 + 극단성)

**커밋**: `5a8e476` - feat: Phase 7-1 경제 국면 판별 시스템 구현

#### Phase 7-2: CyclePanel 컴포넌트 ✅ (완료)
**파일**: `/frontend/src/components/CyclePanel.tsx`

**구현 완료**:
- ✅ 4개 게이지 카드 (원형 SVG 프로그레스)
  - 성장/인플레이션/유동성/정책
  - 0-100 점수 시각화
  - 색상 동적 변경 (초록/노랑/빨강)
- ✅ 현재 국면 표시
  - 국면별 이모지 (🌟 골디락스, 📈 확장기 등)
  - 국면별 설명 텍스트
  - 신뢰도 표시
- ✅ 추천 자산 배지 (favorable/unfavorable)
- ✅ 반응형 디자인 (모바일 2x2 → 데스크톱 4칸)
- ✅ indicators/page.tsx에 통합

**커밋**: `5a8e476` - feat: Phase 7-1 경제 국면 판별 시스템 구현

#### Phase 7-3: 데이터 크롤링 추가 ⏳ (미완료 - 낮은 우선순위)
**목표**: CPI, 10년물 국채금리, 연준 기준금리 크롤링

**현재 상태**: 임시 하드코딩 데이터 사용
```typescript
indicators.cpi = 2.8; // TODO: CPI 크롤링 추가
indicators.nominalRate = 4.5; // TODO: 10년물 국채 금리 추가
indicators.fedRate = 5.25; // TODO: 연준 기준금리 추가
```

**필요 작업**:
1. CPI 크롤러 추가 (`/backend/crawlers/cpi_crawler.py`)
2. 10년물 국채금리 크롤러 (`/backend/crawlers/treasury_crawler.py`)
3. 연준 기준금리 크롤러 (`/backend/crawlers/fed_rate_crawler.py`)
4. `/api/v2/indicators` 응답에 3개 지표 추가
5. 프론트엔드 하드코딩 제거

---

### **Phase 8: 핵심 지표 그리드 시스템** ✅ (완료: 2025-11-21)

#### 목표
- 탭 없이 모든 지표를 한 화면에 그리드로 표시
- 필터링 (카테고리별)
- 컴팩트한 카드 디자인

#### Phase 8-1: IndicatorGrid 컴포넌트 ✅ (완료)
**파일**: `/frontend/src/components/IndicatorGrid.tsx`

**구현 완료**:
- ✅ 반응형 그리드 레이아웃 (1/2/3/4칸)
- ✅ 7개 카테고리 필터 (전체/경기/고용/금리/무역/물가/정책)
- ✅ 카테고리별 지표 개수 표시
- ✅ 필터 상태 관리 (useState)
- ✅ 빈 상태 처리
- ✅ 전체 보기 버튼

**커밋**: `d88b0c5` - feat: Phase 8 경제지표 그리드 시스템 완전 구현

#### Phase 8-2: CompactIndicatorCard ✅ (완료)
**파일**: `/frontend/src/components/CompactIndicatorCard.tsx`

**구현 완료**:
- ✅ 컴팩트한 카드 디자인 (지표명 + 최신값 + 변화량)
- ✅ 카테고리 태그 (아이콘 + 이름)
- ✅ 상태 배지 (양호/주의/중립)
- ✅ 변화량 화살표 표시 (↑↓)
- ✅ 이전값 표시
- ✅ 호버 효과 (scale + shadow)
- ✅ 클릭 핸들러 지원
- ✅ 카테고리별 동적 색상 (Tailwind 정적 클래스)

**커밋**: `a6920f4` - fix: CompactIndicatorCard 동적 Tailwind 클래스 문제 해결

#### Phase 8-3: 페이지 통합 및 탭 제거 ✅ (완료)
**파일**: `/frontend/src/app/indicators/page.tsx`

**구현 완료**:
- ✅ mapIndicatorToCategory() 헬퍼 함수
- ✅ allIndicators 상태 자동 생성
- ✅ 6개 탭 네비게이션 제거
- ✅ 3단계 정보 계층 구현:
  1. CyclePanel (경제 국면)
  2. IndicatorGrid (한눈에 보기)
  3. EconomicIndicatorsSection + DataSection (상세)
- ✅ 사용하지 않는 import/state 정리

**커밋**:
- `8b31681` - refactor: 탭 시스템 제거 및 그리드 전용 인터페이스로 전환
- `07bc63e` - feat: 상세 지표 섹션 복원 및 3단계 정보 계층 완성

#### Phase 8-4: 향후 개선 사항 (선택)
- ⏳ Mini 스파크라인 차트 추가
- ⏳ 상세 모달/확장 패널 (onIndicatorClick 핸들러)
- ⏳ 정렬 기능 (최신순, 중요도순, 알파벳순)

---

### **Phase 9: 로딩 최적화 및 UX 개선** (1-2일)

#### Phase 9-1: Skeleton UI (0.5일)
**파일**: `/frontend/src/components/skeletons/*`

```typescript
// 구현 내용:
- CyclePanelSkeleton
- IndicatorCardSkeleton
- ChartSkeleton
```

#### Phase 9-2: Progressive Loading (0.5일)
```typescript
// 구현 전략:
1. 캐시된 데이터 즉시 표시 (localStorage)
2. 백그라운드에서 최신 데이터 페칭
3. 데이터 도착 시 부드러운 전환
```

#### Phase 9-3: 오류 처리 강화 (0.5일)
```typescript
// 구현 내용:
- ErrorBoundary 추가
- 재시도 버튼
- 오프라인 감지
```

---

### **Phase 10: 홈페이지 대시보드** (2-3일)

#### 목표
- 경제 국면 + 내 자산 + 가계부를 한 화면에

#### Phase 10-1: 대시보드 레이아웃
**파일**: `/frontend/src/app/page.tsx`

```typescript
// 구조:
[인사말 헤더]
[3개 요약 카드: 경제/자산/지출]
[최근 업데이트 피드]
[빠른 액션 버튼]
```

#### Phase 10-2: 요약 카드 컴포넌트
```typescript
// EconomicSummaryCard: 현재 국면 + 4축 점수
// PortfolioSummaryCard: 총액 + 수익률 + 목표 진행률
// ExpenseSummaryCard: 이번 달 지출/수입 + 목표 대비
```

---

## 데이터 요구사항

### 이미 확보된 데이터 ✅
- ISM Manufacturing/Non-Manufacturing PMI
- 실업률, 비농업고용, 신규실업급여신청
- 평균시간당임금, 경제활동참가율
- 산업생산, 소매판매

### 추가 필요 데이터 (Phase 7)
1. **CPI (소비자물가지수)** - 인플레이션 축
   - 출처: Investing.com
   - 크롤링 패턴: 기존과 동일
   - 예상 시간: 2시간

2. **10년물 국채 금리** - 유동성 축
   - 출처: Investing.com
   - 크롤링 패턴: 기존과 동일
   - 예상 시간: 2시간

3. **연준 기준금리** - 정책 축
   - 출처: Investing.com 또는 FRED API
   - 예상 시간: 2-3시간

### 선택적 데이터 (Phase 7 이후)
- 신용스프레드 (FRED API)
- GDP 성장률
- PCE (개인소비지출)

---

## 기술 스택

### Frontend
- Next.js 15.5.3 (App Router)
- React 18
- TypeScript
- Recharts (차트)
- Tailwind CSS + theme.ts (디자인 시스템)

### Backend
- Python Flask
- PostgreSQL (Neon.tech)
- Investing.com 크롤링

### 배포
- Frontend: Vercel
- Backend: Render (Keep-Alive 시스템)

---

## 성공 지표

### Phase 7 완료 시
- [ ] 경제 국면이 자동으로 표시됨
- [ ] 4축 게이지가 실시간 업데이트됨
- [ ] 추천 자산 클래스가 제시됨

### Phase 8 완료 시
- [ ] 탭 전환 없이 모든 지표 확인 가능
- [ ] 지표 카드 클릭 시 상세 정보 확인
- [ ] 필터링으로 관심 지표만 볼 수 있음

### Phase 9 완료 시
- [ ] 페이지 로딩이 2초 이내
- [ ] Skeleton UI로 로딩 경험 개선
- [ ] 오류 발생 시 재시도 가능

### Phase 10 완료 시
- [ ] 홈페이지에서 모든 정보 한눈에 파악
- [ ] 빠른 액션으로 2클릭 내 주요 작업 수행

---

## 다음 단계

**현재 진행중**: Phase 7-1 (경제 국면 판별 로직 구현)

**우선순위**:
1. Phase 7 (경제 국면 시스템) - 최고 우선순위
2. Phase 8 (핵심 지표 그리드)
3. Phase 9 (로딩 최적화)
4. Phase 10 (홈페이지 대시보드)

---

## 참고 문서
- [CLAUDE.md](../CLAUDE.md) - 프로젝트 전체 컨텍스트
- [ARCHITECTURE.md](./ARCHITECTURE.md) - 시스템 아키텍처
- ADR-039: Render Keep-Alive 시스템
- ADR-009: 데이터 로딩 성능 최적화
