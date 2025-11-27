# 가계부 차트 타입 변경 및 데이터 처리 개선 구현 가이드

## 개요
가계부 관리 시스템의 차트 타입을 변경하고, 백엔드에서 문자열로 전달되는 금액 데이터의 타입 변환 문제를 해결. 도넛 차트와 막대 차트로 전환하고, 천단위 쉼표 포맷팅을 추가하여 가독성 개선.

## 구현 날짜
2025-11-11

## 구현 목표
- 카테고리별 지출/수입 비율 차트를 도넛형으로 변경
- 일별 지출/수입 차트를 막대형으로 변경
- 지출/수입 비율 차트를 도넛형으로 변경
- 지출/수입 구성 분석 섹션 사이드바이사이드 레이아웃 구현
- 문자열 타입 금액 데이터의 숫자 변환 처리
- 차트 금액 표시에 천단위 쉼표 추가
- 월별 차트 코드 보존 (12월 활성화 예정)

## 문제 상황

### 1. 초기 요청
사용자가 가계부 페이지의 차트들을 다음과 같이 변경 요청:
- 지출 구성 분석 → 도넛형 차트만 표시 (막대형 제거)
- 수입 구성 분석 → 도넛형 차트만 표시 (막대형 제거)
- 일별/월별 지출수입 → 막대형
- 지출/수입 비율 → 도넛형
- 탭 시스템으로 통합

### 2. 타입 변환 문제 발견
차트 구현 후 도넛 차트가 렌더링되지 않는 문제 발견:
- **원인**: 백엔드에서 `expense.amount`, `total_amount`, `summary` 값이 **문자열**로 전달됨
- **영향**: JavaScript의 `+` 연산자가 문자열 연결로 작동하여 `"0" + "10000" = "010000"` (잘못된 결과)
- **증상**:
  - 도넛 차트 완전히 비표시
  - 일별 차트에서 특정 날짜만 표시
  - 수입 막대 미표시

### 3. TypeScript 타입 에러
Vercel 빌드 시 `entry.value`가 `unknown` 타입으로 인식되어 `toLocaleString()` 호출 불가

## 구현 상세

### 1. 차트 타입 변경

#### 1.1 지출/수입 구성 분석 레이아웃 변경
**파일**: `frontend/src/components/ExpenseManagementDashboard.tsx`

**변경 전**:
```tsx
{/* 지출 구성 분석 */}
<div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
  {/* 도넛 차트 */}
  <ResponsiveContainer width="100%" height={300}>
    <PieChart>...</PieChart>
  </ResponsiveContainer>
  {/* 막대 차트 */}
  <ResponsiveContainer width="100%" height={300}>
    <BarChart>...</BarChart>
  </ResponsiveContainer>
</div>

{/* 수입 구성 분석 - 동일한 구조 */}
```

**변경 후**:
```tsx
{/* 지출/수입 구성 분석 섹션 (나란히 배치) */}
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
  {/* 지출 구성 분석 */}
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
    {/* 도넛 차트만 표시 */}
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={compositionPieData}
          cx="50%"
          cy="50%"
          innerRadius={50}
          outerRadius={100}
          paddingAngle={5}
          dataKey="value"
          label={(entry) => `${Number(entry.value).toLocaleString()}원`}
        >
          {/* Cell 색상 로직 */}
        </Pie>
        <Tooltip formatter={(value: number) => [`${value.toLocaleString()}원`, '금액']} />
        <Legend wrapperStyle={{ fontSize: '11px' }} />
      </PieChart>
    </ResponsiveContainer>
  </div>

  {/* 수입 구성 분석 - 동일한 구조 */}
</div>
```

**변경 사항**:
- 막대 차트 완전 제거
- 도넛 차트 크기 증가 (innerRadius: 40→50, outerRadius: 80→100)
- 그리드 레이아웃으로 지출/수입 나란히 배치 (`grid-cols-1 lg:grid-cols-2`)
- 페이지 공간 효율성 50% 향상

#### 1.2 탭 시스템 구현
**파일**: `frontend/src/components/ExpenseManagementDashboard.tsx`

```tsx
const [timeSeriesTab, setTimeSeriesTab] = useState<'일별' | '비율'>('일별');

{/* 탭 버튼 */}
<div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1 gap-1">
  {['일별', '비율'].map((tab) => (
    <button
      key={tab}
      onClick={() => setTimeSeriesTab(tab as '일별' | '비율')}
      className={`flex-1 px-4 py-2 text-sm rounded transition-colors ${
        timeSeriesTab === tab
          ? 'bg-blue-500 text-white font-medium'
          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
      }`}
    >
      {tab}
    </button>
  ))}
</div>

{/* 일별 차트 */}
{timeSeriesTab === '일별' && (
  <ResponsiveContainer width="100%" height={300}>
    <BarChart data={dailyData}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="날짜" tick={{ fontSize: 10 }} />
      <YAxis
        tick={{ fontSize: 10 }}
        tickFormatter={(value) => {
          if (value >= 1000000) return `${(value / 1000000).toFixed(0)}M`;
          if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
          return value.toString();
        }}
      />
      <Tooltip formatter={(value: number) => [`${value.toLocaleString()}원`]} />
      <Legend />
      <Bar dataKey="지출" fill="#ef4444" />
      <Bar dataKey="수입" fill="#10b981" />
    </BarChart>
  </ResponsiveContainer>
)}

{/* 비율 차트 */}
{timeSeriesTab === '비율' && (
  <ResponsiveContainer width="100%" height={300}>
    <PieChart>
      <Pie
        data={ratioData}
        cx="50%"
        cy="50%"
        innerRadius={60}
        outerRadius={100}
        paddingAngle={5}
        dataKey="value"
        label={(entry) => `${Number(entry.value).toLocaleString()}원`}
      >
        <Cell fill="#ef4444" />
        <Cell fill="#10b981" />
      </Pie>
      <Tooltip formatter={(value: number) => [`${value.toLocaleString()}원`, '금액']} />
      <Legend />
    </PieChart>
  </ResponsiveContainer>
)}
```

**변경 사항**:
- 일별/월별/비율 3개 탭 → 일별/비율 2개 탭으로 단순화
- 월별 차트 제거 이유: 현재 API가 선택한 월(11월)만 가져와서 월별 비교 불가
- 탭 전환으로 화면 공간 효율성 극대화

### 2. 타입 변환 문제 해결

#### 2.1 일별 데이터 준비 함수 수정
**파일**: `frontend/src/components/ExpenseManagementDashboard.tsx` (라인 507-511)

**변경 전**:
```typescript
if (expense.transaction_type === '지출') {
  dailyMap[date].지출 += expense.amount;  // 문자열 연결 발생!
} else if (expense.transaction_type === '수입') {
  dailyMap[date].수입 += expense.amount;  // 문자열 연결 발생!
}
```

**변경 후**:
```typescript
if (expense.transaction_type === '지출') {
  dailyMap[date].지출 += Number(expense.amount);  // 숫자 덧셈
} else if (expense.transaction_type === '수입') {
  dailyMap[date].수입 += Number(expense.amount);  // 숫자 덧셈
}
```

**커밋**: `7d059fc` - "fix: 타입 변환 문제 해결 - expense.amount를 Number로 명시적 변환"

#### 2.2 구성 분석 데이터 준비 함수 수정
**파일**: `frontend/src/components/ExpenseManagementDashboard.tsx`

**수정된 함수들**:

1. **prepareAssetCompositionData()** (지출 구성 분석)
```typescript
// 대분류별 합계 계산
categoryTotals[item.category] += Number(item.total_amount);  // Number() 추가

// 소분류 선택 시
value: Number(exp.amount)  // Number() 추가

// 대분류 선택 시
value: Number(item.total_amount)  // Number() 추가
```

2. **prepareIncomeCompositionData()** (수입 구성 분석)
```typescript
// 동일한 패턴으로 Number() 변환 추가
categoryTotals[item.category] += Number(item.total_amount);
value: Number(exp.amount)
value: Number(item.total_amount)
```

3. **prepareExpenseIncomeRatioData()** (지출/수입 비율)
```typescript
return [
  { name: '지출', value: Number(expenseData.summary.total_expense) },
  { name: '수입', value: Number(expenseData.summary.total_income) }
];
```

**커밋**: `1f8fd87` - "fix: 지출/수입 구성 분석 차트 타입 변환 문제 해결"

### 3. 천단위 쉼표 포맷팅 추가

#### 3.1 도넛 차트 label 포맷팅
**파일**: `frontend/src/components/ExpenseManagementDashboard.tsx`

**변경 전**:
```tsx
<Pie
  data={compositionPieData}
  ...
  label
>
```

**변경 후**:
```tsx
<Pie
  data={compositionPieData}
  ...
  label={(entry) => `${Number(entry.value).toLocaleString()}원`}
>
```

**적용 위치**:
1. 지출 구성 분석 도넛 차트 (라인 959)
2. 수입 구성 분석 도넛 차트 (라인 1055)
3. 지출/수입 비율 도넛 차트 (라인 1139)

**결과**:
- `1000000` → `1,000,000원`
- `500000` → `500,000원`
- Tooltip에는 이미 쉼표 적용되어 있었음 (`toLocaleString()` 사용)

**커밋**:
- `af66afa` - "feat: 차트 금액 표시에 천단위 쉼표 추가"
- `16a28e2` - "fix: TypeScript 타입 에러 및 warning 해결"

### 4. TypeScript 타입 안전성 강화

#### 4.1 타입 에러 해결
**파일**: `frontend/src/components/ExpenseManagementDashboard.tsx`

**Vercel 빌드 에러**:
```
Type error: 'entry.value' is of type 'unknown'.
label={(entry) => `${entry.value.toLocaleString()}원`}
                      ^
```

**해결책**:
```tsx
label={(entry) => `${Number(entry.value).toLocaleString()}원`}
```

`Number()` 변환으로 타입을 명시적으로 지정하여 TypeScript가 `toLocaleString()` 메서드 존재 확인 가능.

#### 4.2 사용하지 않는 코드 제거

**제거된 항목**:
1. `prepareMonthlyData()` 함수 (월별 차트 미사용)
2. `compositionBarData` 변수 (막대 차트 제거)
3. `incomeBarData` 변수 (막대 차트 제거)
4. 디버깅 콘솔 로그 (프로덕션 불필요)

**결과**:
- ESLint warning 완전 해결
- 코드 정리로 가독성 향상
- 빌드 크기 최소화

### 5. 월별 차트 코드 보존

#### 5.1 더미 데이터로 코드 보존
**파일**: `frontend/src/components/ExpenseManagementDashboard.tsx` (라인 527-564)

```typescript
// 월별 지출/수입 데이터 준비 (2025년 12월부터 활성화 예정)
// 현재는 선택한 월의 데이터만 가져오므로 월별 차트가 의미 없음
// 다음 달(12월)에 2개월 데이터가 쌓이면 '월별' 탭 추가 및 이 함수 활성화
/*
const prepareMonthlyData = () => {
  if (!expenses || expenses.length === 0) return [];

  // 월별로 지출과 수입을 그룹화
  const monthlyMap: Record<string, { 지출: number; 수입: number }> = {};

  expenses.forEach(expense => {
    const date = new Date(expense.transaction_date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    if (!monthlyMap[monthKey]) {
      monthlyMap[monthKey] = { 지출: 0, 수입: 0 };
    }

    if (expense.transaction_type === '지출') {
      monthlyMap[monthKey].지출 += Number(expense.amount);
    } else if (expense.transaction_type === '수입') {
      monthlyMap[monthKey].수입 += Number(expense.amount);
    }
  });

  // 월 순으로 정렬하여 배열로 변환
  const sortedData = Object.entries(monthlyMap)
    .map(([month, amounts]) => ({
      월: `${month.split('-')[1]}월`,
      fullMonth: month,
      지출: amounts.지출,
      수입: amounts.수입
    }))
    .sort((a, b) => a.fullMonth.localeCompare(b.fullMonth));

  return sortedData;
};
*/
```

**활성화 시점**: 2025년 12월
**활성화 방법**:
1. 주석 제거 (`/* */` 삭제)
2. 탭 배열에 '월별' 추가: `['일별', '월별', '비율']`
3. 월별 차트 섹션 조건부 렌더링 추가

**커밋**: `d2724f7` - "refactor: 월별 차트 코드 보존 (12월 활성화 예정)"

## 빌드 및 배포

### 1. 로컬 테스트
```bash
cd frontend
npm run dev
# http://localhost:3000/expenses 접속하여 차트 동작 확인
```

### 2. Git 커밋 히스토리
```bash
7d059fc - fix: 타입 변환 문제 해결 - expense.amount를 Number로 명시적 변환
1f8fd87 - fix: 지출/수입 구성 분석 차트 타입 변환 문제 해결
af66afa - feat: 차트 금액 표시에 천단위 쉼표 추가
16a28e2 - fix: TypeScript 타입 에러 및 warning 해결
d2724f7 - refactor: 월별 차트 코드 보존 (12월 활성화 예정)
```

### 3. Vercel 배포
- GitHub 푸시 후 자동 배포 트리거
- 프로덕션 URL: https://investment-app-rust-one.vercel.app/expenses
- 빌드 성공 확인
- TypeScript 타입 체크 통과

## 문제 해결 과정

### 1. 초기 문제: 도넛 차트 미표시
**증상**:
- 지출/수입 구성 분석 도넛 차트 완전히 비표시
- 일별 차트에서 11월 5일만 표시 (다른 날짜 누락)
- 수입 막대 미표시

**디버깅 과정**:
```javascript
console.log('지출 구성 pieData:', compositionPieData);
// 첫 렌더: []
// 두 번째 렌더: [{name: "생활", value: "010000020000"}, ...]  // 문자열 연결!
```

**원인 파악**:
- `expense.amount`가 문자열 타입
- `0 + "10000" + "20000" = "010000020000"` (문자열 연결)
- Recharts가 문자열 값을 렌더링하지 못함

### 2. 해결 시도 1: 데이터 검증 추가
```tsx
{compositionPieData.length > 0 ? (
  <PieChart>...</PieChart>
) : (
  <div>데이터가 없습니다</div>
)}
```

**결과**: 실패 (데이터는 있지만 타입 문제)

### 3. 해결 시도 2: Number() 변환 추가
```typescript
dailyMap[date].지출 += Number(expense.amount);
```

**결과**: 일별 차트는 성공, 구성 분석 차트는 여전히 실패

### 4. 최종 해결: 모든 금액 데이터 Number() 변환
```typescript
// prepareAssetCompositionData()
categoryTotals[item.category] += Number(item.total_amount);
value: Number(exp.amount)
value: Number(item.total_amount)

// prepareIncomeCompositionData()
// 동일한 패턴

// prepareExpenseIncomeRatioData()
value: Number(expenseData.summary.total_expense)
value: Number(expenseData.summary.total_income)
```

**결과**: 모든 차트 정상 렌더링

### 5. TypeScript 빌드 에러 해결
**에러**:
```
'entry.value' is of type 'unknown'.
```

**해결**:
```tsx
label={(entry) => `${Number(entry.value).toLocaleString()}원`}
```

TypeScript가 `entry.value`의 타입을 추론하지 못하므로 `Number()` 변환으로 타입 명시.

## 주요 특징

### 1. 타입 안전성 강화
- 모든 금액 데이터에 `Number()` 명시적 변환 적용
- TypeScript 컴파일 에러 완전 해결
- 런타임 타입 에러 방지

### 2. 사용자 경험 개선
- 천단위 쉼표로 금액 가독성 향상 (1,000,000원)
- 도넛 차트 크기 증가로 시각적 명확성 향상
- 탭 시스템으로 화면 공간 효율성 극대화

### 3. 코드 품질 향상
- 사용하지 않는 코드 제거
- 디버깅 로그 제거
- ESLint warning 완전 해결

### 4. 유지보수성 확보
- 월별 차트 코드 주석으로 보존
- 명확한 활성화 시점 및 방법 문서화
- 향후 확장 가능성 유지

## 향후 작업

### 1. 월별 차트 활성화 (2025년 12월)
**조건**: 11월과 12월 데이터가 모두 존재할 때
**작업 내용**:
1. `prepareMonthlyData()` 함수 주석 제거
2. 탭 배열에 '월별' 추가
3. 월별 차트 섹션 렌더링 추가
4. 2개월 데이터 비교 테스트

### 2. 백엔드 타입 개선 (선택)
**현재**: 금액 데이터를 문자열로 반환
**제안**: 숫자 타입으로 반환하도록 백엔드 수정
**장점**: 프론트엔드에서 타입 변환 불필요
**단점**: 기존 API 호환성 문제 가능

### 3. 차트 인터랙션 강화
- 도넛 차트 클릭 시 상세 데이터 모달 표시
- 막대 차트 호버 시 추가 정보 툴팁
- 드릴다운 기능으로 3단계 이상 분석

## 참고 문서
- 포트폴리오 자산 구성 분석: `frontend/src/components/PortfolioDashboard.tsx`
- 가계부 지출 구성 분석: `docs/EXPENSE_COMPOSITION_ANALYSIS_IMPLEMENTATION.md`
- 문서화 가이드: `docs/DOCUMENTATION_GUIDE.md`
- CLAUDE.md Tasks 섹션: T-082 (2025-11-11)
