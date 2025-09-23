# 3단계 차트 분석 시스템 구현 가이드

## 개요

포트폴리오 자산 관리를 위한 3단계 드릴다운 차트 분석 시스템 완전 구현

### 구현일: 2025-09-23
### 상태: ✅ 완료
### 커밋: 1338d62 - feat: Implement 3-tier chart analysis system

---

## 📋 구현된 기능

### 1. 3단계 버튼 시스템
- **1단계**: 전체 → 4개 대분류별 (전체, 대체투자, 예치자산, 즉시현금, 투자자산)
- **2단계**: 대분류 → 해당 소분류들 (암호화폐, 부동산, 원자재 등)
- **3단계**: 소분류 → 개별 자산들 (비트코인, 이더리움 등)

### 2. 동적 UI 시스템
```tsx
// 대분류 버튼 (파란색)
<div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1 flex-wrap gap-1 mb-2">
  {['전체', '대체투자', '예치자산', '즉시현금', '투자자산'].map((viewType) => (
    <button
      onClick={() => {
        setChartViewType(viewType);
        setSubViewType(null); // 대분류 변경 시 소분류 초기화
      }}
      className={`px-2 py-1 text-xs rounded transition-colors ${
        chartViewType === viewType ? 'bg-blue-500 text-white' : 'text-gray-600 dark:text-gray-300'
      }`}
    >
      {viewType}
    </button>
  ))}
</div>

// 소분류 버튼 (초록색, 조건부 표시)
{chartViewType !== '전체' && subCategories[chartViewType] && (
  <div className="flex bg-gray-50 dark:bg-gray-600 rounded-lg p-1 flex-wrap gap-1">
    <button onClick={() => setSubViewType(null)}>전체</button>
    {subCategories[chartViewType].map((subCategory) => (
      <button
        onClick={() => setSubViewType(subCategory)}
        className={`px-2 py-1 text-xs rounded transition-colors ${
          subViewType === subCategory ? 'bg-green-500 text-white' : 'text-gray-600'
        }`}
      >
        {subCategory}
      </button>
    ))}
  </div>
)}
```

### 3. 중복 섹션 제거
- **제거**: 사이드 정보 모드의 도넛 차트 섹션 (48줄 코드 삭제)
- **통합**: 메인 차트 섹션에서 모든 차트 분석 기능 제공
- **효과**: UI 정리 및 사용자 혼란 방지

---

## 🏗️ 데이터 처리 아키텍처

### 소분류 매핑 구조
```typescript
const subCategories = {
  '즉시현금': ['현금', '입출금통장', '증권예수금'],
  '예치자산': ['예금', '적금', 'MMF'],
  '투자자산': ['국내주식', '해외주식', '펀드', 'ETF', '채권'],
  '대체투자': ['암호화폐', '부동산', '원자재']
};
```

### 3단계 데이터 처리 로직
```typescript
const getPieChartData = () => {
  const groupedAssets = getGroupedAssets();

  if (chartViewType === '전체') {
    // 1단계: 대분류별 데이터
    return Object.entries(portfolioData.by_category).map(([category, data]) => ({
      name: category,
      value: data.total_amount,
      percentage: data.percentage,
    }));
  } else if (subViewType) {
    // 3단계: 특정 소분류의 개별 자산별 데이터
    const subCategoryAssets = groupedAssets[chartViewType][subViewType];
    return subCategoryAssets.map((asset) => ({
      name: asset.name,
      value: asset.amount,
      percentage: (asset.amount / subTotal) * 100
    }));
  } else {
    // 2단계: 특정 대분류의 소분류별 데이터
    const categoryAssets = groupedAssets[chartViewType];
    return Object.entries(categoryAssets).map(([subCategory, assets]) => ({
      name: subCategory,
      value: totalAmount,
      percentage: (totalAmount / categoryTotal) * 100
    }));
  }
};
```

---

## 🎨 색상 시스템 설계

### 3단계 색상 전략
1. **전체 모드**: 기본 색상 팔레트
2. **대분류 모드**: 카테고리별 색상 그룹
3. **소분류 모드**: 확장된 색상 팔레트 (개별 자산 구분)

```typescript
// 차트 색상 처리
{pieChartData.map((entry, index) => {
  if (chartViewType === '전체') {
    return <Cell fill={COLORS[index % COLORS.length]} />;
  } else if (subViewType) {
    // 소분류: 확장된 색상 (더 많은 구분)
    const extendedColors = [...COLORS, '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE'];
    return <Cell fill={extendedColors[index % extendedColors.length]} />;
  } else {
    // 대분류: 카테고리별 색상 그룹
    const mainCategoryColors = MAIN_CATEGORY_COLORS[chartViewType] || COLORS;
    return <Cell fill={mainCategoryColors[index % mainCategoryColors.length]} />;
  }
})}
```

---

## 🚀 상태 관리 시스템

### React State 구조
```typescript
const [chartViewType, setChartViewType] = useState<'전체' | '대체투자' | '예치자산' | '즉시현금' | '투자자산'>('전체');
const [subViewType, setSubViewType] = useState<string | null>(null);
```

### 상태 전환 로직
- **대분류 변경**: `setSubViewType(null)` 자동 실행
- **소분류 선택**: 해당 소분류의 개별 자산 표시
- **전체 버튼**: 소분류 초기화하여 대분류 레벨로 복귀

---

## 📊 UI/UX 개선사항

### 1. 시각적 계층 구조
- **1단계**: 파란색 버튼 (bg-blue-500)
- **2단계**: 초록색 버튼 (bg-green-500)
- **배경**: 회색 톤으로 레벨별 구분

### 2. 동적 제목 시스템
```typescript
<h3 className="text-lg font-semibold text-gray-900 dark:text-white">
  {chartViewType === '전체' ? '자산 구성 분석' :
   subViewType ? `${subViewType} 상세 분석` :
   `${chartViewType} 세부 분석`}
</h3>
```

### 3. 반응형 레이아웃
- **차트 배치**: MD 이상에서 2열 (도넛 + 막대), 그 이하에서 1열
- **버튼 래핑**: flex-wrap으로 작은 화면에서 자동 줄바꿈
- **다크모드**: 모든 UI 요소에서 완전 지원

---

## 🔧 백엔드 호환성

### 기존 API 구조 활용
- **포트폴리오 데이터**: 기존 `/api/portfolio` 엔드포인트 사용
- **그룹화 로직**: 프론트엔드 `getGroupedAssets()` 함수 활용
- **2단계 카테고리**: 기존 `asset_type`, `sub_category` 필드 활용

### 데이터 변환 없음
- 백엔드 수정 불필요
- 기존 데이터베이스 스키마 그대로 활용
- 클라이언트 사이드 처리로 성능 최적화

---

## 📝 주요 변경 파일

### 수정된 파일
1. **frontend/src/components/PortfolioDashboard.tsx**
   - 사이드 정보 모드 도넛 차트 섹션 제거 (48줄)
   - 3단계 버튼 시스템 추가 (47줄)
   - 소분류 상태 관리 추가 (2줄)
   - 데이터 처리 로직 확장 (41줄)
   - 색상 시스템 업데이트 (16줄)
   - **총 변경**: +103줄, -62줄

---

## 🎯 사용 시나리오

### 예시 1: 암호화폐 분석
1. **대체투자** 클릭 → 암호화폐, 부동산, 원자재 버튼 표시
2. **암호화폐** 클릭 → 비트코인, 이더리움 등 개별 코인 차트
3. **도넛 차트**: 코인별 보유 비중, **막대 차트**: 코인별 투자 금액

### 예시 2: 주식 포트폴리오 분석
1. **투자자산** 클릭 → 국내주식, 해외주식, 펀드, ETF, 채권 버튼
2. **국내주식** 클릭 → 삼성전자, SK하이닉스 등 개별 종목 차트
3. **비중 분석**: 종목별 포트폴리오 구성, **금액 분석**: 종목별 투자 규모

---

## 🔮 향후 확장 방향

### 1. 4단계 확장 가능성
- **개별 자산** → **매수 이력별** 분석
- 같은 종목의 여러 매수 건별 수익률 분석

### 2. 추가 분석 기능
- [ ] 드릴다운별 수익률 분석
- [ ] 소분류별 목표 설정 기능
- [ ] 리밸런싱 추천 (소분류 레벨)

### 3. UX 개선
- [ ] 브레드크럼 네비게이션 추가
- [ ] 뒤로가기 버튼 추가
- [ ] 키보드 네비게이션 지원

---

## 📊 성능 최적화

### 렌더링 최적화
- **조건부 렌더링**: 소분류 버튼은 필요할 때만 표시
- **상태 최소화**: 2개 상태로 3단계 관리
- **메모이제이션**: 색상 배열은 컴포넌트 레벨에서 재사용

### 메모리 효율성
- **기존 데이터 활용**: 새로운 API 호출 없음
- **클라이언트 사이드 처리**: 서버 부하 없음
- **즉시 반응**: 버튼 클릭 시 즉시 차트 업데이트

---

## 📚 관련 문서

- [CLAUDE.md - Tasks 및 ADR](../CLAUDE.md)
- [2단계 카테고리 시스템 구현](./2TIER_CATEGORY_COMPLETE_IMPLEMENTATION.md)
- [차트 통합 구현](./CHART_INTEGRATION_IMPLEMENTATION.md)
- [포트폴리오 관리 구현 가이드](./PORTFOLIO_MANAGEMENT_IMPLEMENTATION.md)

---

## 🏆 결과 요약

**구현 성과:**
✅ 3단계 드릴다운 차트 분석 시스템 완전 구현
✅ 사이드 정보 모드 중복 섹션 제거로 UI 정리
✅ 동적 소분류 버튼 시스템으로 직관적 네비게이션
✅ 확장된 색상 시스템으로 개별 자산 구분
✅ 기존 백엔드 호환성 유지하며 클라이언트 사이드 최적화

**배포 정보:**
- **GitHub**: 커밋 1338d62
- **프로덕션**: https://investment-app-rust-one.vercel.app/portfolio
- **로컬 테스트**: http://localhost:3002/portfolio