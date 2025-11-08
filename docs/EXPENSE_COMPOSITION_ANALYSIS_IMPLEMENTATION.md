# 가계부 지출 구성 분석 시스템 구현 가이드

## 개요
가계부 관리 시스템의 차트 섹션을 단순 파이/막대 차트에서 포트폴리오와 동일한 심층 분석 시스템으로 업그레이드. 2단계 필터링(대분류/소분류)과 이중 차트 레이아웃을 통해 3단계 분석 깊이 제공.

## 구현 날짜
2025-11-08

## 구현 목표
- 기존 지출 분포 및 카테고리별 지출 차트 제거
- 포트폴리오와 동일한 2단계 필터링 시스템 구현
- 대분류/소분류 선택에 따라 동적으로 변경되는 차트 데이터
- 대분류별 고유 색상 그룹 시스템으로 시각적 구분
- 개별 거래내역까지 드릴다운 가능한 상세 분석 기능

## 구현 상세

### 1. 기존 차트 섹션 제거

#### 1.1 제거된 코드
**파일**: `frontend/src/components/ExpenseManagementDashboard.tsx`

제거된 섹션:
- "지출 분포" 파이 차트 (라인 731-755)
- "카테고리별 지출" 막대 차트 (라인 757-770)

### 2. 색상 시스템 추가

#### 2.1 대분류별 색상 그룹 정의
**파일**: `frontend/src/components/ExpenseManagementDashboard.tsx`

```typescript
// 대분류별 색상 그룹 (자산 구성 분석용)
const CATEGORY_COLORS: Record<string, string[]> = {
  '생활': ['#0088FE', '#0099FF', '#00AAFF', '#00BBFF', '#00CCFF', '#00DDFF', '#00EEFF', '#00FFFF', '#00FFEE', '#00FFDD'],
  '건강': ['#00C49F', '#00D5AF', '#00E6BF', '#00F7CF', '#10FFD0', '#20FFD5', '#30FFDA', '#40FFDF', '#50FFE4'],
  '사회': ['#FFBB28', '#FFCC38', '#FFDD48', '#FFEE58', '#FFFF68', '#FFFF78', '#FFFF88'],
  '여가': ['#FF8042', '#FF9052', '#FFA062', '#FFB072', '#FFC082', '#FFD092', '#FFE0A2'],
  '쇼핑': ['#8884D8', '#9894E8', '#A8A4F8', '#B8B4FF', '#C8C4FF', '#D8D4FF', '#E8E4FF'],
  '기타': ['#82CA9D', '#92DAAD', '#A2EABD', '#B2FACD', '#C2FFDD']
};
```

**설명**:
- 각 대분류마다 10개 내외의 그라데이션 색상 그룹 정의
- 소분류 차트에서 여러 항목을 구분하기 위한 충분한 색상 확보
- 대분류별로 색상 톤이 다르게 설정되어 시각적 구분 명확

### 3. 차트 뷰 상태 관리

#### 3.1 상태 변수 추가
**파일**: `frontend/src/components/ExpenseManagementDashboard.tsx`

```typescript
// 자산 구성 분석 차트 뷰 상태
const [chartViewType, setChartViewType] = useState<'전체' | '생활' | '건강' | '사회' | '여가' | '쇼핑' | '기타'>('전체');
const [subViewType, setSubViewType] = useState<string | null>(null);
```

**설명**:
- `chartViewType`: 현재 선택된 대분류 (기본값: '전체')
- `subViewType`: 현재 선택된 소분류 (null이면 대분류 전체 표시)

### 4. 데이터 집계 로직 구현

#### 4.1 3단계 데이터 준비 함수
**파일**: `frontend/src/components/ExpenseManagementDashboard.tsx`

```typescript
// 자산 구성 분석 데이터 준비 (새로운 차트용)
const prepareAssetCompositionData = () => {
  if (!expenseData) return { pieData: [], barData: [] };

  const expenseCategories = expenseData.by_category.filter(item => item.transaction_type === '지출');

  // 대분류별 합계 계산
  const categoryTotals: Record<string, number> = {};
  expenseCategories.forEach(item => {
    if (!categoryTotals[item.category]) {
      categoryTotals[item.category] = 0;
    }
    categoryTotals[item.category] += item.total_amount;
  });

  let pieData: Array<{ name: string; value: number }> = [];
  let barData: Array<{ name: string; 금액: number }> = [];

  if (chartViewType === '전체') {
    // 전체 모드: 대분류별 합계 표시
    pieData = Object.entries(categoryTotals).map(([category, amount]) => ({
      name: category,
      value: amount
    }));
    barData = Object.entries(categoryTotals).map(([category, amount]) => ({
      name: category,
      금액: amount
    }));
  } else if (subViewType) {
    // 소분류 선택 시: 해당 소분류의 개별 거래내역 표시
    const filteredExpenses = expenses.filter(
      exp => exp.transaction_type === '지출' &&
             exp.category === chartViewType &&
             exp.subcategory === subViewType
    );
    pieData = filteredExpenses.map(exp => ({
      name: `${exp.name} (${formatDate(exp.transaction_date)})`,
      value: exp.amount
    }));
    barData = filteredExpenses.map(exp => ({
      name: `${exp.name.substring(0, 10)}...`,
      금액: exp.amount
    }));
  } else {
    // 특정 대분류 선택 시: 해당 대분류의 소분류별 합계 표시
    const filtered = expenseCategories.filter(item => item.category === chartViewType);
    pieData = filtered.map(item => ({
      name: item.subcategory,
      value: item.total_amount
    }));
    barData = filtered.map(item => ({
      name: item.subcategory,
      금액: item.total_amount
    }));
  }

  return { pieData, barData };
};
```

**설명**:
- **전체 모드**: 모든 대분류의 합계 표시 (생활, 건강, 사회, 여가, 쇼핑, 기타)
- **대분류 선택**: 선택한 대분류의 소분류별 합계 표시 (예: 생활 → 유틸리티, 생필품, 교통 등)
- **소분류 선택**: 선택한 소분류의 개별 거래내역 표시 (예: 외식 → 스타벅스, 맥도날드 등)

### 5. UI 구현

#### 5.1 2단계 필터링 버튼
**파일**: `frontend/src/components/ExpenseManagementDashboard.tsx`

```tsx
{/* 자산 구성 분석 섹션 */}
{expenseData && (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
    <div className="mb-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {chartViewType === '전체' ? '지출 구성 분석' :
           subViewType ? `${subViewType} 상세 분석` :
           `${chartViewType} 세부 분석`}
        </h3>
      </div>

      {/* 1단계: 대분류 버튼 */}
      <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1 flex-wrap gap-1 mb-2">
        {['전체', '생활', '건강', '사회', '여가', '쇼핑', '기타'].map((viewType) => (
          <button
            key={viewType}
            onClick={() => {
              setChartViewType(viewType as '전체' | '생활' | '건강' | '사회' | '여가' | '쇼핑' | '기타');
              setSubViewType(null);
            }}
            className={`px-2 py-1 text-xs rounded transition-colors ${
              chartViewType === viewType
                ? 'bg-blue-500 text-white'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {viewType}
          </button>
        ))}
      </div>

      {/* 2단계: 소분류 버튼 (대분류 선택 시에만 표시) */}
      {chartViewType !== '전체' && expenseCategories[chartViewType] && (
        <div className="flex bg-gray-50 dark:bg-gray-600 rounded-lg p-1 flex-wrap gap-1">
          <button
            onClick={() => setSubViewType(null)}
            className={`px-2 py-1 text-xs rounded transition-colors ${
              !subViewType
                ? 'bg-green-500 text-white'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-500'
            }`}
          >
            전체
          </button>
          {expenseCategories[chartViewType].map((subCategory) => (
            <button
              key={subCategory}
              onClick={() => setSubViewType(subCategory)}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                subViewType === subCategory
                  ? 'bg-green-500 text-white'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-500'
              }`}
            >
              {subCategory}
            </button>
          ))}
        </div>
      )}
    </div>

    {/* 차트 섹션은 다음 섹션에서 계속 */}
  </div>
)}
```

**설명**:
- **동적 제목**: 선택 수준에 따라 자동 변경
  - 전체: "지출 구성 분석"
  - 대분류: "생활 세부 분석"
  - 소분류: "외식 상세 분석"
- **1단계 버튼**: 파란색 배경으로 선택 상태 표시
- **2단계 버튼**: 초록색 배경으로 선택 상태 표시, 대분류 선택 시에만 표시

#### 5.2 이중 차트 레이아웃
**파일**: `frontend/src/components/ExpenseManagementDashboard.tsx`

```tsx
{/* 도넛 차트와 막대 차트를 나란히 배치 */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  {/* 도넛 차트 - 비중 */}
  <div>
    <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 text-center">구성 비중</h4>
    <ResponsiveContainer width="100%" height={250}>
      <PieChart>
        <Pie
          data={compositionPieData}
          cx="50%"
          cy="50%"
          innerRadius={40}
          outerRadius={80}
          paddingAngle={5}
          dataKey="value"
        >
          {compositionPieData.map((entry, index) => {
            if (chartViewType === '전체') {
              return <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />;
            } else if (subViewType) {
              const extendedColors = [...COLORS, '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE'];
              return <Cell key={`cell-${index}`} fill={extendedColors[index % extendedColors.length]} />;
            } else {
              const categoryColors = CATEGORY_COLORS[chartViewType as keyof typeof CATEGORY_COLORS] || COLORS;
              return <Cell key={`cell-${index}`} fill={categoryColors[index % categoryColors.length]} />;
            }
          })}
        </Pie>
        <Tooltip formatter={(value: number) => [`${value.toLocaleString()}원`, '금액']} />
        <Legend wrapperStyle={{ fontSize: '10px' }} />
      </PieChart>
    </ResponsiveContainer>
  </div>

  {/* 막대 차트 - 금액 */}
  <div>
    <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 text-center">금액 비교</h4>
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={compositionBarData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" tick={{ fontSize: 10 }} />
        <YAxis tick={{ fontSize: 10 }} />
        <Tooltip formatter={(value: number) => [`${value.toLocaleString()}원`, '금액']} />
        <Bar dataKey="금액" fill="#8884d8">
          {compositionBarData.map((entry, index) => {
            if (chartViewType === '전체') {
              return <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />;
            } else if (subViewType) {
              const extendedColors = [...COLORS, '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE'];
              return <Cell key={`cell-${index}`} fill={extendedColors[index % extendedColors.length]} />;
            } else {
              const categoryColors = CATEGORY_COLORS[chartViewType as keyof typeof CATEGORY_COLORS] || COLORS;
              return <Cell key={`cell-${index}`} fill={categoryColors[index % categoryColors.length]} />;
            }
          })}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  </div>
</div>
```

**설명**:
- **도넛 차트**: 비중 시각화 (innerRadius로 도넛 모양 구현)
- **막대 차트**: 절대 금액 비교
- **색상 로직**:
  - 전체 모드: 기본 COLORS 배열 사용
  - 소분류 선택: extendedColors로 다양한 색상 제공
  - 대분류 선택: CATEGORY_COLORS에서 대분류별 색상 그룹 사용

## 빌드 및 배포

### 1. 로컬 빌드 테스트
```bash
cd frontend
npm run build
```

**결과**:
- ✅ 빌드 성공 (3.0s)
- ✅ ESLint 경고만 있음 (비차단)
- ✅ 타입 오류 없음

### 2. Git 커밋 및 푸시
```bash
git add -A
git commit -m "feat: 가계부 자산 구성 분석 섹션 구현"
git push
```

**커밋 해시**: 239311a

### 3. Vercel 자동 배포
- GitHub 푸시 후 Vercel 자동 배포 트리거
- 프로덕션 URL: https://investment-app-rust-one.vercel.app/expenses

## 주요 특징

### 1. 포트폴리오 패턴 일관성
- 포트폴리오 자산 구성 분석과 동일한 UI/UX 패턴 사용
- 사용자가 두 페이지 간 학습 곡선 없이 직관적으로 사용 가능

### 2. 3단계 분석 깊이
1. **전체 모드**: 모든 대분류 합계 개요
2. **대분류 모드**: 특정 대분류의 소분류별 분포
3. **소분류 모드**: 개별 거래내역 상세 분석

### 3. 시각적 구분 강화
- 대분류별 고유 색상 그룹으로 카테고리 구분 명확
- 도넛 차트와 막대 차트 동일한 색상 사용으로 일관성 유지

### 4. 반응형 레이아웃
- 모바일: 차트 세로 배치 (grid-cols-1)
- 데스크톱: 차트 가로 배치 (md:grid-cols-2)

## 향후 확장 가능성

### 1. 수입 구성 분석
- 동일한 패턴으로 수입 카테고리 분석 추가 가능
- 근로소득/사업소득/투자소득/기타소득 대분류
- 각 대분류별 소분류 상세 분석

### 2. 이체 패턴 분석
- 계좌이체/현금이체/환전/환불 대분류
- 이체 빈도 및 금액 추세 분석

### 3. 시계열 분석
- 월별/분기별/연도별 추세 차트 추가
- 전년 동기 대비 증감률 분석

### 4. 예산 대비 분석
- 카테고리별 예산 설정 기능
- 실제 지출 vs 예산 비교 차트

## 참고 문서
- 포트폴리오 자산 구성 분석: `frontend/src/components/PortfolioDashboard.tsx` (라인 1431-1529)
- 가계부 카테고리 정의: `frontend/src/components/ExpenseManagementDashboard.tsx` (라인 74-81)
- ADR-041: 가계부 지출 구성 분석 시스템 아키텍처 (CLAUDE.md)
