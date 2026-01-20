# 경제지표 시스템 리뉴얼 계획

> 작성일: 2025-11-28
> 목표: 경제지표 UI/크롤러 단순화 및 통일화

---

## 📋 목차
1. [현재 문제점](#현재-문제점)
2. [개선 방향](#개선-방향)
3. [구현 계획](#구현-계획)
4. [데이터 구조](#데이터-구조)

---

## 현재 문제점

### 1. UI 문제
- **중복 카드 시스템**: EconomicIndicatorCard + CompactIndicatorCard
- **Raw Data 섹션**: 너무 크고 무거움, 정보 중복
- **데이터 섹션**: 경기지표만 차트 표시, 탭 전환 없음
- **정책지표**: 불필요한 카테고리

### 2. 크롤러 문제
- **파일 분산**: 20+ 개 크롤러 파일
- **중복 코드**: 일부 파일에 사용하지 않는 함수 (parse_unemployment_rate_data)
- **설정 혼재**: URL이 각 파일에 하드코딩

---

## 개선 방향

### 1. UI 통합: 3단계 정보 계층

```
┌─────────────────────────────────────┐
│ 경제지표 한눈에 보기 (그리드)        │
│ - EnhancedIndicatorCard             │
│ - 미니 스파크라인 차트               │
│ - 클릭 → 상세 모달                  │
└─────────────────────────────────────┘
         ↓ (클릭)
┌─────────────────────────────────────┐
│ 상세 정보 모달                       │
│ [수치] [차트] [해석] 탭              │
│ - 히스토리 테이블                    │
│ - 6개월 추세 차트                    │
│ - 투자 시사점                        │
└─────────────────────────────────────┘
```

### 2. 크롤러 통합: 설정 기반 시스템

```python
# indicators_config.py
INDICATORS = {
    "ism-manufacturing": {
        "name": "ISM Manufacturing PMI",
        "url": "https://www.investing.com/economic-calendar/ism-manufacturing-pmi-173",
        "category": "business",
        "enabled": True
    },
    "cpi": {
        "name": "Consumer Price Index",
        "url": "https://www.investing.com/economic-calendar/cpi-69",
        "category": "inflation",
        "enabled": True
    },
    # ... 나머지 지표
}

# crawler.py (단일 파일)
def crawl_indicator(indicator_id: str):
    config = INDICATORS[indicator_id]
    html = fetch_html(config["url"])
    rows = parse_history_table(html)
    return extract_raw_data(rows)
```

---

## 구현 계획

### Phase 1: 크롤러 통일화 (2일)

#### 1.1 indicators_config.py 생성
- [ ] 모든 지표의 메타데이터 통합
- [ ] 정책지표 제거 (GDP, FOMC 등)
- [ ] 카테고리 5개로 축소 (경기/고용/금리/무역/물가)

#### 1.2 unified_crawler.py 생성
- [ ] 단일 `crawl_indicator(id)` 함수
- [ ] investing_crawler.py 공통 함수 재사용
- [ ] 에러 핸들링 통일

#### 1.3 기존 크롤러 파일 정리
- [ ] 20+ 개 파일 → archive/ 폴더 이동
- [ ] app.py에서 새 크롤러 사용

### Phase 2: EnhancedIndicatorCard (3일)

#### 2.1 기본 카드 컴포넌트
```tsx
<EnhancedIndicatorCard
  name="ISM Manufacturing PMI"
  category="business"
  actual={48.8}
  previous={49.2}
  forecast={50.0}
  surprise={-1.2}
  sparklineData={[48, 49, 50, 49.5, 49.2, 48.8]}
  onClick={() => openModal()}
/>
```

**표시 요소:**
- 카테고리 태그 (색상 구분)
- 상태 배지 (양호/중립/주의)
- 현재값 + 이전값 + 변화량
- 미니 스파크라인 (recharts LineChart)
- "자세히 >" 버튼

#### 2.2 상세 모달 (shadcn Dialog)
- [ ] 3개 탭: 수치/차트/해석
- [ ] 수치 탭: 현재/이전/예측/서프라이즈
- [ ] 차트 탭: 6개월 추세 + 히스토리 테이블
- [ ] 해석 탭: 지표 개요 + 투자 시사점 (기존 EconomicIndicatorCard 콘텐츠 축약)

### Phase 3: Raw Data 섹션 제거 (1일)

- [ ] EconomicIndicatorCard.tsx 삭제
- [ ] EconomicIndicatorsSection.tsx 제거
- [ ] indicators/page.tsx 정리
- [ ] 임포트 및 사용하지 않는 코드 제거

### Phase 4: 동적 데이터 섹션 (2일)

#### 4.1 선택 상태 관리
```tsx
const [selectedIndicator, setSelectedIndicator] = useState("ism-manufacturing");
```

#### 4.2 동적 렌더링
- [ ] 그리드 카드 클릭 → setSelectedIndicator
- [ ] 선택된 지표의 히스토리 데이터 페칭
- [ ] DataSection에 선택된 지표 데이터 전달
- [ ] 차트/테이블 동적 업데이트

### Phase 5: 정책지표 제거 (1일)

- [ ] indicators_config.py에서 정책지표 삭제
- [ ] mapIndicatorToCategory 함수 정리
- [ ] 탭 UI에서 "정책" 제거
- [ ] GDP, FOMC 크롤러 비활성화

---

## 데이터 구조

### 통합 지표 설정
```typescript
interface IndicatorConfig {
  id: string;
  name: string;
  nameKo: string;
  url: string;
  category: 'business' | 'employment' | 'interest' | 'trade' | 'inflation';
  enabled: boolean;
  threshold?: {
    expansion: number;  // > 이 값이면 경기 확장
    contraction: number; // < 이 값이면 경기 위축
  };
  interpretation?: {
    overview: string;
    howToRead: string;
    investment: string;
  };
}
```

### API 응답 표준
```typescript
interface IndicatorData {
  id: string;
  name: string;
  category: string;
  latest_release: {
    date: string;
    actual: number | string;
    forecast: number | string;
    previous: number | string;
  };
  next_release: {
    date: string;
    forecast: number | string | null;
  };
  history: Array<{
    date: string;
    actual: number | string;
    forecast: number | string;
    previous: number | string;
  }>;
  sparkline: number[]; // 최근 6개월 actual 값
}
```

---

## 제거 대상

### 크롤러 파일 (archive 이동)
- average_hourly_earnings.py
- business_inventories.py
- cb_consumer_confidence.py
- consumer_confidence.py
- core_cpi.py
- cpi.py
- current_account.py
- exports.py
- federal_funds_rate.py
- fomc_minutes.py (정책지표 제거)
- gdp.py (정책지표 제거)
- imports.py
- industrial_production.py
- industrial_production_1755.py
- initial_jobless_claims.py
- (... 총 20+ 개)

### 컴포넌트
- EconomicIndicatorCard.tsx → 삭제
- EconomicIndicatorsSection.tsx → 삭제
- CompactIndicatorCard.tsx → EnhancedIndicatorCard로 대체

---

## 우선순위

### 🔥 High (먼저 작업)
1. Phase 1: 크롤러 통일화
2. Phase 2: EnhancedIndicatorCard
3. Phase 3: Raw Data 섹션 제거

### 🟡 Medium
4. Phase 4: 동적 데이터 섹션
5. Phase 5: 정책지표 제거

---

## 예상 효과

### 코드 감소
- 크롤러: 20개 파일 → 2개 파일 (config + crawler)
- 컴포넌트: 3개 → 1개
- 총 라인 수: ~3,000줄 → ~800줄 (73% 감소)

### 성능 개선
- 페이지 로딩: Raw Data 섹션 제거로 초기 렌더링 50% 단축
- 유지보수: 설정 파일만 수정하면 새 지표 추가

### 사용자 경험
- 정보 계층 명확: 그리드 → 상세 모달
- 탭 전환 불필요: 한 화면에 모든 지표
- 스파크라인: 추세를 한눈에 파악

---

**Last Updated**: 2025-11-28
**Status**: 🟢 계획 수립 완료, 구현 준비 중
