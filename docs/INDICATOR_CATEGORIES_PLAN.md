# 지표 카테고리 시스템 구현 계획

## 개요
현재 경기지표만 있는 시스템에 고용지표, 금리지표 등 다양한 카테고리를 추가하는 계획

## 아키텍처 설계

### 1. 탭 기반 UI 구조
```
투자 어시스턴트
├─ 탭 네비게이션
│  ├─ 경기지표 (현재)
│  ├─ 고용지표
│  ├─ 금리지표
│  └─ [추가 카테고리]
└─ 콘텐츠 영역 (기존 구조 재사용)
   ├─ Raw Data 섹션
   └─ Data 섹션
```

### 2. URL 구조
- 기본: `/` (경기지표)
- 카테고리: `/?category=employment`, `/?category=interest`
- 브라우저 히스토리 지원

## 구현 단계

### Phase 1: 탭 네비게이션 시스템
1. **TabNavigation 컴포넌트 생성**
   - 카테고리 목록 정의
   - 활성 탭 상태 관리
   - URL 쿼리 파라미터 연동

2. **EconomicIndicatorsSection 리팩토링**
   - 카테고리별 지표 필터링 로직 추가
   - props로 category 받기
   - 조건부 렌더링 구현

### Phase 2: 백엔드 API 확장
1. **카테고리 엔드포인트 추가**
   ```
   /api/v2/categories           # 카테고리 목록
   /api/v2/indicators/economic  # 경기지표
   /api/v2/indicators/employment # 고용지표
   /api/v2/indicators/interest  # 금리지표
   ```

2. **데이터베이스 스키마 확장**
   - indicators 테이블에 category 컬럼 추가
   - 카테고리별 데이터 분리

### Phase 3: 새 지표 추가
각 카테고리별로 ADR-003 표준 절차 적용:
1. 백엔드 크롤링 모듈 구현
2. Raw Data 카드 연동
3. 데이터 섹션 테이블 연동
4. 차트 구현

## 기술 상세

### 컴포넌트 구조
```tsx
// components/TabNavigation.tsx
interface TabNavigationProps {
  activeCategory: string;
  onCategoryChange: (category: string) => void;
}

// app/page.tsx
const [activeCategory, setActiveCategory] = useState('economic');
<TabNavigation activeCategory={activeCategory} onCategoryChange={setActiveCategory} />
<EconomicIndicatorsSection category={activeCategory} />
```

### 데이터 구조
```typescript
interface IndicatorCategory {
  id: string;           // 'economic', 'employment', 'interest'
  name: string;         // '경기지표', '고용지표', '금리지표'
  description: string;  // 카테고리 설명
  indicators: string[]; // 해당 카테고리의 지표 ID 목록
}
```

### API 응답 예시
```json
{
  "status": "success",
  "data": {
    "categories": [
      {
        "id": "economic",
        "name": "경기지표",
        "description": "경제 활동 및 성장률 관련 지표",
        "indicators": ["ism-manufacturing", "ism-non-manufacturing", ...]
      }
    ]
  }
}
```

## 고려사항

### 장점
- 기존 컴포넌트 재사용 가능
- 한 페이지에서 모든 지표 접근
- 빠른 카테고리 전환
- 향후 지표 간 비교 기능 확장 용이

### 주의사항
- 초기 로딩 시 모든 카테고리 데이터 필요 여부 검토
- 카테고리별 데이터 양이 많아질 경우 지연 로딩 고려
- 모바일에서 탭 네비게이션 반응형 처리

## 다음 세션 작업 우선순위
1. TabNavigation 컴포넌트 구현
2. EconomicIndicatorsSection 카테고리 필터링 추가
3. URL 쿼리 파라미터 연동
4. 백엔드 카테고리 API 설계

## 관련 ADR
- ADR-003: 경제지표 구현 표준 절차 (기존 구조 재사용)
- ADR-007: API 응답 구조 표준화 (카테고리 API도 동일 적용)