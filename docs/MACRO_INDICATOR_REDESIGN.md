# 경제지표 페이지 완전 리뉴얼 계획

> **작성일**: 2025-11-28
> **목적**: EnhancedIndicatorCard 기반 통합 경제지표 시스템 구축
> **현황**: 27일 EnhancedIndicatorCard 완성, 통합 작업 필요

---

## 📊 현재 상황 (2025-11-28)

### 구현된 컴포넌트 (27일 작업)
✅ **EnhancedIndicatorCard** (완성도 높음)
- 카테고리 태그 + 상태 배지
- 현재값 + 변화량 + 이전값 + 서프라이즈
- 미니 스파크라인 차트
- "자세히 >" 버튼 (모달 연동)

✅ **IndicatorDetailModal** (완성도 높음)
- 3개 탭: 수치/차트/해석
- Line Chart + History Table
- 완전한 상세 정보

✅ **IndicatorGrid** (21일 작업)
- 반응형 그리드 레이아웃
- 7개 카테고리 필터
- 현재 CompactIndicatorCard 사용 중

### 중복/정리 필요
❌ **CompactIndicatorCard** (21일) → 제거 예정
❌ **EconomicIndicatorCard** (기존) → 제거 예정
❌ **EconomicIndicatorsSection** (Raw Data, 경기만) → 제거 예정
❌ **DataSection** (6개 탭) → 제거 예정

---

## 🎯 최종 목표 UI

```
┌─────────────────────────────────────────┐
│ 경제 국면 판별 패널                      │ ← 유지
│ [성장 75] [인플레 45] [유동성 60] ...   │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ 경제지표 한눈에보기                      │
│ [전체] [경기] [고용] [금리] [무역] ...   │ ← 카테고리 필터
│                                          │
│ ┌──────┬──────┬──────┬──────┐          │
│ │ 📊   │ 💼   │ 💰   │ 🌐   │          │
│ │ ISM  │ 실업률│ 연준금│ 무역수│          │
│ │ 52.3 │ 3.7% │ 5.25%│ -65B │          │ ← EnhancedIndicatorCard
│ │ ▲+1.2│ ▼-0.1│ → 0.0│ ▼-2B │          │
│ │▁▂▃▅▆│▃▃▂▂▁│▆▆▆▆▆│▂▃▄▃▂│          │
│ │[선택]│      │      │      │          │
│ └──┬───┴──────┴──────┴──────┘          │
│    └─ 클릭 시 하단 확장                 │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ 📊 ISM Manufacturing PMI 상세 차트       │ ← 신규: IndicatorChartPanel
│ ← 이전  |  [수치|차트|해석]  |  다음 →  │
├─────────────────────────────────────────┤
│ [Line Chart - 12개월 추세]              │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                          │
│ [History Table - 최근 6개월]            │
│ 2025-01  52.3  51.0  51.1               │
│ 2024-12  51.1  50.5  50.3               │
└─────────────────────────────────────────┘
```

---

## 💡 핵심 설계 결정

### 1. 모달 vs 하단 영역
**선택**: 하단 차트 영역 (IndicatorChartPanel)

**이유**:
- ✅ 탭 전환 불필요 (카드 클릭만)
- ✅ 여러 지표 빠르게 비교 가능
- ✅ 키보드 네비게이션 (← → 키)
- ✅ 모바일 최적화 (선택된 지표만 하단)
- ✅ 공간 효율 (카드는 작게, 차트는 크게)

### 2. 컴포넌트 구조
```typescript
// 최종 컴포넌트 트리:
indicators/page.tsx
├── CyclePanel (유지)
├── IndicatorGrid (유지, EnhancedIndicatorCard로 전환)
│   └── EnhancedIndicatorCard[] (27일 완성)
└── IndicatorChartPanel (신규)
    ├── 차트 영역 (Line/Bar)
    ├── History Table
    └── 이전/다음 네비게이션
```

### 3. 데이터 흐름
```typescript
// 통합 API 구조:
GET /api/indicators/all
→ [
  {
    id: "ism-manufacturing",
    name: "ISM Manufacturing PMI",
    nameKo: "제조업 구매관리자지수",
    category: "business",
    actual: 52.3,
    previous: 51.1,
    forecast: 51.0,
    surprise: 1.3,
    sparklineData: [50.1, 50.3, 51.1, 52.3, ...],
    history: [
      { date: "2025-01", actual: 52.3, forecast: 51.0, previous: 51.1 },
      ...
    ]
  },
  ...
]
```

---

## 📋 작업 단계

### **Phase 1: 컴포넌트 정리** (1시간)

#### Step 1-1: IndicatorGrid 개선
- [ ] CompactIndicatorCard → EnhancedIndicatorCard 교체
- [ ] onClick 핸들러 → 선택된 지표 ID 저장
- [ ] 선택된 카드 시각적 표시 (border/shadow)

#### Step 1-2: 중복 컴포넌트 제거
- [ ] CompactIndicatorCard.tsx 삭제
- [ ] EconomicIndicatorCard.tsx 삭제 (또는 아카이브)
- [ ] EconomicIndicatorsSection 사용 중단
- [ ] DataSection 사용 중단

---

### **Phase 2: IndicatorChartPanel 구현** (2시간)

#### Step 2-1: 컴포넌트 생성
```typescript
// /frontend/src/components/IndicatorChartPanel.tsx

interface IndicatorChartPanelProps {
  selectedIndicatorId: string | null;
  allIndicators: GridIndicator[];
  onSelectIndicator: (id: string) => void;
}

// 구조:
// 1. 헤더 (지표명 + 이전/다음 버튼)
// 2. 탭 (수치/차트/해석)
// 3. 차트 영역 (Line/Bar)
// 4. History Table
```

#### Step 2-2: 네비게이션 로직
- [ ] ← → 키보드 이벤트
- [ ] 이전/다음 버튼 (카테고리 내에서 순환)
- [ ] 선택된 지표 데이터 페칭

#### Step 2-3: 차트 통합
- [ ] 기존 DataSection 차트 로직 재사용
- [ ] CHART_THEME 적용
- [ ] 반응형 레이아웃

---

### **Phase 3: indicators/page.tsx 통합** (1시간)

#### Step 3-1: 상태 관리
```typescript
const [selectedIndicatorId, setSelectedIndicatorId] = useState<string | null>(null);
const [allIndicators, setAllIndicators] = useState<GridIndicator[]>([]);
```

#### Step 3-2: 레이아웃 재구성
```typescript
return (
  <main>
    <CyclePanel />
    <IndicatorGrid
      indicators={allIndicators}
      selectedId={selectedIndicatorId}
      onSelectIndicator={setSelectedIndicatorId}
    />
    {selectedIndicatorId && (
      <IndicatorChartPanel
        selectedIndicatorId={selectedIndicatorId}
        allIndicators={allIndicators}
        onSelectIndicator={setSelectedIndicatorId}
      />
    )}
    {/* 나머지 섹션: NewsNarrative, RiskRadar, BigWave */}
  </main>
);
```

#### Step 3-3: 제거
- [ ] `<EconomicIndicatorsSection />` 삭제
- [ ] `<DataSection />` 삭제
- [ ] 관련 import 정리

---

### **Phase 4: 데이터 통합 & 최적화** (1시간)

#### Step 4-1: 백엔드 확인
- [ ] 27일 작업으로 크롤러 코드 개선 여부 확인
- [ ] 모든 지표 데이터 한 번에 로드하는 API 확인
- [ ] 필요 시 `/api/indicators/all` 엔드포인트 생성

#### Step 4-2: 프론트엔드 최적화
- [ ] React.memo 적용 확인
- [ ] useMemo로 필터링 최적화
- [ ] 차트 데이터 캐싱

---

## 🎨 UI 상세 스펙

### EnhancedIndicatorCard (이미 완성)
```
┌──────────────────────────────┐
│ [경기] 태그     [양호] 배지   │ ← 카테고리 + 상태
├──────────────────────────────┤
│ ISM Manufacturing PMI        │ ← 지표명 (nameKo 우선)
├──────────────────────────────┤
│ 52.3  ▲ +1.20                │ ← 현재값 + 변화량
│ 이전: 51.1                    │ ← 이전값
│ 서프라이즈: +1.3              │ ← 예측 대비
├──────────────────────────────┤
│ [미니 스파크라인 ▁▂▃▅▆]     │ ← 최근 6개월
├──────────────────────────────┤
│              자세히 >         │ ← onClick 핸들러
└──────────────────────────────┘

// 선택 시:
border: 2px solid gold
shadow: shadow-xl
```

### IndicatorChartPanel (신규)
```
┌─────────────────────────────────────┐
│ 📊 ISM Manufacturing PMI            │
│ ← 이전 지표  |  다음 지표 →         │
├─────────────────────────────────────┤
│ [수치] [차트] [해석]                │ ← 탭
├─────────────────────────────────────┤
│ [차트 탭]                           │
│ ┌─────────────────────────────────┐ │
│ │ Line Chart (12개월)             │ │
│ │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │ │
│ │                                 │ │
│ └─────────────────────────────────┘ │
│                                     │
│ History Table (최근 6개월):         │
│ ┌────┬──────┬──────┬──────┐       │
│ │날짜│실제값│예측값│이전값│       │
│ ├────┼──────┼──────┼──────┤       │
│ │01월│ 52.3 │ 51.0 │ 51.1 │       │
│ │12월│ 51.1 │ 50.5 │ 50.3 │       │
│ └────┴──────┴──────┴──────┘       │
└─────────────────────────────────────┘
```

---

## 🔍 검증 체크리스트

### Phase 1 완료 시
- [x] IndicatorGrid에서 EnhancedIndicatorCard 정상 표시
- [x] 카드 클릭 시 선택 상태 표시
- [x] 중복 컴포넌트 제거 완료 (아카이브: docs/archive/2024-11/)

### Phase 2 완료 시
- [x] IndicatorChartPanel 정상 렌더링
- [x] 차트 데이터 정상 표시
- [x] 이전/다음 네비게이션 작동
- [x] 키보드 단축키 작동

### Phase 3 완료 시
- [x] indicators/page.tsx 레이아웃 정상
- [x] 카드 클릭 → 하단 차트 표시
- [x] 스크롤 동작 자연스러움
- [x] 모바일 반응형 확인

### Phase 4 완료 시
- [x] 모든 경제지표 데이터 로드
- [x] /api/v2/indicators 통합 API 구현 (히스토리 + 메타데이터)
- [x] 성능 최적화 완료 (API 호출 5회 → 1회, 80% 감소)

---

## 📚 참고 문서

- [MASTER_PLAN.md](./MASTER_PLAN.md) - Phase 1 Week 1-2: Macro 섹션
- [ECONOMIC_INDICATORS_ROADMAP.md](./archive/2024-09/ECONOMIC_INDICATORS_ROADMAP.md) - Phase 7-9 완료 기록
- [CHANGELOG.md](./CHANGELOG.md) - 2025-11-27 작업 내역

---

## 🚨 주의사항

1. **EnhancedIndicatorCard 보존**: 27일 작업한 완성도 높은 컴포넌트, 절대 삭제 금지
2. **모달 제거 안 함**: IndicatorDetailModal은 유지 (추후 활용 가능)
3. **데이터 구조 변경 최소화**: 백엔드 크롤러는 이미 27일 개선됨
4. **점진적 마이그레이션**: 기존 EconomicIndicatorsSection/DataSection은 주석 처리 후 단계적 제거

---

**Last Updated**: 2025-11-28
**Status**: ✅ Phase 1-4 완료 (2025-11-28)
**Completed**:
- Phase 1: EnhancedIndicatorCard 통합 + 중복 컴포넌트 아카이브 완료
- Phase 2: IndicatorChartPanel 구현 완료 (338줄, 3탭, 키보드 네비게이션)
- Phase 3: indicators/page.tsx 통합 완료 (카드→차트 연동, 자동 스크롤)
- Phase 4: 데이터 통합 API 구현 완료 (API 호출 80% 감소, 성능 대폭 향상)

**🎉 경제지표 페이지 리뉴얼 완전 완료!**

## Phase 4 성과
- **백엔드**: /api/v2/indicators에 히스토리(12개월) + 메타데이터 통합
- **프론트엔드**: 5개 API 호출 → 1개로 축소
- **성능**: 초기 로딩 예상 3-5초 → 1-2초 단축
- **코드 품질**: 불필요한 API 호출 제거, 코드 간소화
