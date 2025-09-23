# 경제지표 6개 탭 시스템 구현 계획

## 개요

현재 단일 페이지로 구성된 경제지표 대시보드를 6개 탭 시스템으로 확장하여 지표 분류별로 체계적인 정보 제공

### 구현일: 2025-09-23 (계획 수립)
### 상태: 📋 계획 단계
### 요청: "경제지표 페이지에 다른 지표 카드들과 그래프를 보여줄 수 있게 하려면 너는 새로운 싱글페이지를 만드는것보다 탭전환이 좋다고 했지"

---

## 🎯 구현 목표

### 6개 탭 구조
1. **경기지표** (현재 구현된 지표들) - 기본 탭
2. **고용지표** (신규)
3. **금리지표** (신규)
4. **무역지표** (신규)
5. **물가지표** (신규)
6. **정책지표** (신규)

### 핵심 원칙
- 기존 경기지표는 그대로 유지하되 탭으로 분리
- 탭별로 독립적인 지표 카드 + 차트 시스템
- 일관된 UI/UX 디자인 언어 유지
- 반응형 탭 네비게이션 구현

---

## 📋 단계별 구현 계획

### Phase 1: 아키텍처 설계 및 탭 구조 구현
**목표**: 기본 탭 시스템 구조 완성

#### 1.1 탭 네비게이션 UI 컴포넌트 구현
```typescript
// components/TabNavigation.tsx
interface Tab {
  id: string;
  name: string;
  icon?: string;
  indicators: EconomicIndicator[];
}

const tabs: Tab[] = [
  { id: 'business', name: '경기지표', indicators: [...currentIndicators] },
  { id: 'employment', name: '고용지표', indicators: [] },
  { id: 'interest', name: '금리지표', indicators: [] },
  { id: 'trade', name: '무역지표', indicators: [] },
  { id: 'inflation', name: '물가지표', indicators: [] },
  { id: 'policy', name: '정책지표', indicators: [] }
];
```

#### 1.2 기존 페이지 구조 수정
- `/pages/index.tsx` 수정: 탭 시스템 통합
- 현재 지표들을 "경기지표" 탭으로 이동
- 탭 상태 관리 (useState) 구현

#### 1.3 반응형 탭 디자인
- 데스크톱: 가로 탭 네비게이션
- 모바일: 스크롤 가능한 탭 또는 드롭다운

### Phase 2: 지표 분류 체계 정의
**목표**: 각 탭별 지표 카테고리 및 데이터 구조 명확화

#### 2.1 경기지표 (Business Cycle) - 기존 유지
- ISM Manufacturing PMI ✅
- ISM Non-Manufacturing PMI ✅
- S&P Global Composite PMI ✅
- Industrial Production ✅
- Industrial Production YoY ✅
- Retail Sales MoM ✅
- Retail Sales YoY ✅

#### 2.2 고용지표 (Employment)
- **핵심 지표**: Unemployment Rate, Nonfarm Payrolls, Initial Jobless Claims
- **보조 지표**: Continuing Claims, Labor Force Participation Rate
- **investing.com URL 패턴**: `/economic-calendar/unemployment-rate`, `/economic-calendar/nonfarm-payrolls`

#### 2.3 금리지표 (Interest Rates)
- **핵심 지표**: Federal Funds Rate, 10-Year Treasury Yield, 30-Year Treasury Yield
- **보조 지표**: 2-Year Treasury Yield, Mortgage Rates
- **investing.com URL 패턴**: `/economic-calendar/interest-rate-decision`

#### 2.4 무역지표 (Trade)
- **핵심 지표**: Trade Balance, Exports, Imports
- **보조 지표**: Current Account, Trade Balance with China
- **investing.com URL 패턴**: `/economic-calendar/trade-balance`

#### 2.5 물가지표 (Inflation)
- **핵심 지표**: CPI, Core CPI, PPI, Core PPI
- **보조 지표**: PCE Price Index, Core PCE
- **investing.com URL 패턴**: `/economic-calendar/cpi`, `/economic-calendar/core-cpi`

#### 2.6 정책지표 (Policy)
- **핵심 지표**: FOMC Meeting Minutes, Fed Chair Speech, GDP
- **보조 지표**: Consumer Confidence, Michigan Consumer Sentiment
- **investing.com URL 패턴**: `/economic-calendar/fomc-meeting-minutes`

### Phase 3: 백엔드 확장
**목표**: 새로운 지표들의 크롤링 및 API 구현

#### 3.1 크롤링 모듈 확장
```python
# 기존 패턴 활용
def get_unemployment_rate():
    # ISM PMI와 동일한 크롤링 로직
    # URL: https://www.investing.com/economic-calendar/unemployment-rate

def get_nonfarm_payrolls():
    # investing.com 표준 History Table 파싱

def get_cpi():
    # % 데이터 처리 (parsePercentValue 활용)
```

#### 3.2 API 엔드포인트 확장
- `/api/v2/indicators/employment/*` (고용지표)
- `/api/v2/indicators/interest/*` (금리지표)
- `/api/v2/indicators/trade/*` (무역지표)
- `/api/v2/indicators/inflation/*` (물가지표)
- `/api/v2/indicators/policy/*` (정책지표)

### Phase 4: 프론트엔드 통합
**목표**: 탭별 지표 카드 및 차트 시스템 완성

#### 4.1 탭별 컴포넌트 구조
```typescript
// components/tabs/BusinessTab.tsx (기존 지표들)
// components/tabs/EmploymentTab.tsx (신규)
// components/tabs/InterestTab.tsx (신규)
// components/tabs/TradeTab.tsx (신규)
// components/tabs/InflationTab.tsx (신규)
// components/tabs/PolicyTab.tsx (신규)
```

#### 4.2 공통 컴포넌트 재사용
- EconomicIndicatorCard: 모든 탭에서 재사용
- DataSection: History Table 표준화
- DataCharts: 차트 시각화 통합

#### 4.3 탭별 데이터 로딩
```typescript
const TabContent = ({ activeTab }: { activeTab: string }) => {
  useEffect(() => {
    // 탭 변경 시 해당 지표들만 로딩
    loadTabIndicators(activeTab);
  }, [activeTab]);
}
```

---

## 🏗️ 기술적 고려사항

### UI/UX 설계
- **탭 네비게이션**: 현재 활성 탭 시각적 강조
- **로딩 상태**: 탭 전환 시 스켈레톤 UI
- **메모리 최적화**: 비활성 탭 데이터 lazy loading
- **URL 라우팅**: `/economic-indicators?tab=employment` 형태

### 성능 최적화
- **조건부 렌더링**: 활성 탭만 DOM에 렌더링
- **데이터 캐싱**: 한 번 로드된 탭 데이터 메모리 저장
- **API 호출 최소화**: 탭 전환 시에만 새 데이터 요청

### 확장성 고려
- **모듈화**: 각 탭별 독립적 컴포넌트 구조
- **설정 기반**: 탭 정보를 JSON 설정으로 관리
- **다국어 지원**: 탭명 및 지표명 i18n 준비

---

## 📊 구현 우선순위

### Priority 1 (핵심 기능)
1. 탭 네비게이션 UI 구현
2. 경기지표 탭으로 기존 지표 이관
3. 고용지표 탭 + 2-3개 핵심 지표 구현

### Priority 2 (확장)
4. 물가지표 탭 (CPI, Core CPI)
5. 금리지표 탭 (Fed Funds Rate)

### Priority 3 (완성)
6. 무역지표 탭
7. 정책지표 탭
8. 고급 기능 (필터링, 정렬, 즐겨찾기)

---

## 🔧 개발 환경 준비

### 백엔드 작업
1. 새 지표 크롤링 테스트: `python3 app.py` 실행 후 개별 지표 확인
2. API 응답 구조 표준화: ADR-007 표준 준수
3. 데이터베이스 스키마 확장: indicators 테이블에 category 컬럼 추가 고려

### 프론트엔드 작업
1. 탭 컴포넌트 개발: `npm run dev` 환경에서 실시간 확인
2. 기존 코드 분리: RawData/DataSection을 탭별로 분리
3. 반응형 테스트: 모바일/데스크톱 화면에서 탭 동작 확인

---

## 🚀 재시작 명령어

토큰 한계로 중단된 작업을 재시작하려면:

**"경제지표 6개 탭 시스템 구현을 시작해줘"**

또는

**"Phase 1부터 시작해서 탭 네비게이션 UI를 먼저 구현해줘"**

---

## 📝 예상 결과

구현 완료 시:
1. **6개 탭 시스템**: 경기/고용/금리/무역/물가/정책 지표 분류
2. **20+ 경제지표**: 각 탭별 3-5개 핵심 지표 제공
3. **일관된 UX**: 모든 탭에서 동일한 카드 + 차트 + 테이블 구조
4. **반응형 디자인**: 모바일/데스크톱 모든 기기에서 최적화
5. **확장 가능한 구조**: 향후 새 지표 추가 시 간단한 설정 변경만 필요

---

## 🎯 성공 기준

- ✅ 기존 경기지표 기능 100% 유지
- ✅ 탭 전환이 1초 이내 완료
- ✅ 모든 탭에서 실시간 데이터 업데이트 지원
- ✅ 모바일에서도 직관적인 탭 네비게이션
- ✅ 새 지표 추가가 기존 4단계 절차로 가능

---

## 📚 관련 문서

- [경제지표 구현 표준 절차 (ADR-003)](../CLAUDE.md#adr-003)
- [API 응답 구조 표준화 (ADR-007)](../CLAUDE.md#adr-007)
- [데이터 로딩 성능 최적화 (ADR-009)](../CLAUDE.md#adr-009)