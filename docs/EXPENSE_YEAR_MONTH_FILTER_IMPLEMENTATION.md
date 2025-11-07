# 가계부 연도/월 필터링 시스템 구현 가이드

## 개요
가계부 관리 시스템에 연도/월별 데이터 필터링 기능을 추가하여 사용자가 특정 기간의 거래내역을 선택적으로 조회할 수 있도록 구현.

## 구현 날짜
2025-11-08

## 구현 목표
- 사용자가 연도와 월을 선택하여 해당 기간의 거래내역만 조회
- 이전 달/다음 달 네비게이션 버튼으로 빠른 이동
- 선택한 기간에 따라 요약 통계, 차트, 거래내역 테이블 자동 업데이트
- 전체 레이아웃 재구성으로 필터링 UI 강조

## 구현 상세

### 1. 백엔드 API 수정

#### 1.1 날짜 범위 필터링 파라미터 추가
**파일**: `backend/app.py`

```python
@app.route('/api/expenses', methods=['GET'])
def get_expenses():
    user_id = request.args.get('user_id', type=int)
    start_date = request.args.get('start_date')  # 추가: YYYY-MM-DD 형식
    end_date = request.args.get('end_date')      # 추가: YYYY-MM-DD 형식

    if not user_id:
        return jsonify({"error": "user_id is required"}), 400

    try:
        result = db_service.get_all_expenses(user_id, start_date, end_date)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
```

#### 1.2 데이터베이스 쿼리 수정
**파일**: `backend/services/postgres_database_service.py`

```python
def get_all_expenses(self, user_id, start_date=None, end_date=None):
    """
    사용자의 모든 거래내역 조회 (날짜 범위 필터링 지원)
    """
    conn = self.get_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    try:
        # 기본 쿼리
        base_query = """
            SELECT id, user_id, transaction_type, amount, currency,
                   category, subcategory, description, payment_method,
                   transaction_date, created_at, updated_at
            FROM expenses
            WHERE user_id = %s
        """

        params = [user_id]

        # 날짜 범위 필터링 추가
        if start_date:
            base_query += " AND transaction_date >= %s"
            params.append(start_date)

        if end_date:
            base_query += " AND transaction_date <= %s"
            params.append(end_date)

        base_query += " ORDER BY transaction_date DESC"

        cur.execute(base_query, params)
        expenses = cur.fetchall()

        # 나머지 로직 (카테고리별 집계, 월간 요약 등)은 동일
        # ...
    finally:
        cur.close()
        conn.close()
```

### 2. 프론트엔드 UI 구현

#### 2.1 상태 관리
**파일**: `frontend/src/components/ExpenseManagementDashboard.tsx`

```typescript
// 연도/월 상태 관리
const today = new Date();
const [selectedYear, setSelectedYear] = useState(today.getFullYear());
const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1);
```

#### 2.2 데이터 페칭 로직 수정
```typescript
const fetchExpenses = useCallback(async () => {
  if (loading) return;

  setLoading(true);
  setError(null);

  try {
    // 선택한 월의 시작일과 종료일 계산
    const startDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;
    const lastDay = new Date(selectedYear, selectedMonth, 0).getDate();
    const endDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    // API 호출 시 날짜 범위 파라미터 포함
    const response = await fetch(
      `${API_BASE_URL}/api/expenses?user_id=1&start_date=${startDate}&end_date=${endDate}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    setExpenses(data.expenses || []);
    setByCategory(data.by_category || []);
    setMonthlySummary(data.monthly_summary || {});
  } catch (err) {
    setError('거래내역을 불러오는데 실패했습니다.');
    console.error('Error fetching expenses:', err);
  } finally {
    setLoading(false);
  }
}, [API_BASE_URL, selectedYear, selectedMonth, loading]);
```

#### 2.3 연도/월 선택 UI 컴포넌트
```typescript
{/* 연도/월 선택 섹션 */}
<div className="bg-white rounded-xl shadow-sm p-6 mb-6">
  <div className="flex items-center justify-between">
    {/* 이전 달 버튼 */}
    <button
      onClick={handlePrevMonth}
      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 font-medium transition-colors"
    >
      ← 이전 달
    </button>

    {/* 연도/월 선택 드롭다운 */}
    <div className="flex items-center gap-4">
      {/* 연도 선택 */}
      <select
        value={selectedYear}
        onChange={(e) => setSelectedYear(Number(e.target.value))}
        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg font-semibold"
      >
        {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i).map(year => (
          <option key={year} value={year}>{year}년</option>
        ))}
      </select>

      {/* 월 선택 */}
      <select
        value={selectedMonth}
        onChange={(e) => setSelectedMonth(Number(e.target.value))}
        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg font-semibold"
      >
        {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
          <option key={month} value={month}>{month}월</option>
        ))}
      </select>
    </div>

    {/* 다음 달 버튼 */}
    <button
      onClick={handleNextMonth}
      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 font-medium transition-colors"
    >
      다음 달 →
    </button>
  </div>
</div>
```

#### 2.4 이전/다음 달 네비게이션 함수
```typescript
const handlePrevMonth = () => {
  if (selectedMonth === 1) {
    setSelectedMonth(12);
    setSelectedYear(selectedYear - 1);
  } else {
    setSelectedMonth(selectedMonth - 1);
  }
};

const handleNextMonth = () => {
  if (selectedMonth === 12) {
    setSelectedMonth(1);
    setSelectedYear(selectedYear + 1);
  } else {
    setSelectedMonth(selectedMonth + 1);
  }
};
```

### 3. 레이아웃 재구성

#### 3.1 연도/월 선택 UI를 최상단에 배치
- 기존: 페이지 중간에 필터 요소 산재
- 개선: 페이지 최상단에 독립된 섹션으로 연도/월 선택 UI 배치
- 장점: 사용자가 즉시 기간을 선택할 수 있어 직관적

#### 3.2 요약 카드 배치
- 연도/월 선택 UI 바로 아래에 요약 통계 카드 배치
- 선택한 기간의 수입/지출/순액이 즉시 표시됨

#### 3.3 반응형 디자인
```typescript
<div className="flex items-center justify-between">
  {/* 데스크톱: 가로 정렬, 모바일: 세로 정렬 */}
  <div className="flex flex-col sm:flex-row items-center gap-4">
    {/* ... */}
  </div>
</div>
```

## 주요 기능

### 1. 연도 선택
- 현재 연도 기준 ±5년 범위 (총 10년)
- 드롭다운 형식으로 직관적 선택

### 2. 월 선택
- 1월 ~ 12월 전체 월 선택 가능
- 드롭다운 형식으로 직관적 선택

### 3. 빠른 네비게이션
- "이전 달" 버튼: 이전 달로 이동 (연도 자동 조정)
- "다음 달" 버튼: 다음 달로 이동 (연도 자동 조정)

### 4. 자동 데이터 갱신
- 연도 또는 월 변경 시 자동으로 데이터 재조회
- `useCallback`과 `useEffect`를 활용한 효율적 상태 관리

```typescript
useEffect(() => {
  fetchExpenses();
}, [selectedYear, selectedMonth]); // 연도나 월이 변경되면 자동 재조회
```

## 데이터 흐름

```
[사용자] 연도/월 선택
    ↓
[React State] selectedYear, selectedMonth 업데이트
    ↓
[useEffect] 변경 감지 → fetchExpenses() 호출
    ↓
[API 요청] GET /api/expenses?user_id=1&start_date=2025-11-01&end_date=2025-11-30
    ↓
[백엔드] PostgreSQL 쿼리 (WHERE transaction_date BETWEEN start_date AND end_date)
    ↓
[응답] 필터링된 거래내역 + 카테고리별 집계 + 월간 요약
    ↓
[React State] expenses, byCategory, monthlySummary 업데이트
    ↓
[UI 렌더링] 요약 카드, 차트, 거래내역 테이블 자동 갱신
```

## 성능 최적화

### 1. useCallback 활용
```typescript
const fetchExpenses = useCallback(async () => {
  // ...
}, [API_BASE_URL, selectedYear, selectedMonth, loading]);
```
- 의존성 배열에 필요한 값만 포함
- 불필요한 함수 재생성 방지

### 2. 조건부 렌더링
```typescript
{loading ? (
  <div className="text-center py-8 text-gray-500">
    거래내역을 불러오는 중...
  </div>
) : expenses.length === 0 ? (
  <div className="text-center py-8 text-gray-500">
    거래내역이 없습니다. 새로운 거래를 추가해보세요.
  </div>
) : (
  <ExpenseTable />
)}
```

### 3. 중복 요청 방지
```typescript
if (loading) return; // 이미 로딩 중이면 추가 요청 차단
```

## 사용자 경험 개선

### 1. 명확한 시각적 피드백
- 선택된 연도/월이 큰 폰트와 테두리로 강조
- 이전/다음 버튼에 호버 효과

### 2. 직관적인 인터페이스
- 한글 레이블 (2025년 11월)
- 버튼에 방향 화살표 (←, →)

### 3. 반응형 디자인
- 모바일에서도 터치하기 쉬운 크기
- 작은 화면에서는 세로 정렬로 전환

## 향후 확장 가능성

### 1. 커스텀 날짜 범위 선택
```typescript
const [customDateRange, setCustomDateRange] = useState({
  start: null,
  end: null
});
```

### 2. 분기별/연도별 보기
```typescript
const [viewMode, setViewMode] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');
```

### 3. 날짜 범위 프리셋
```typescript
const presets = {
  '이번 달': getCurrentMonth(),
  '지난 3개월': getLast3Months(),
  '올해': getCurrentYear()
};
```

## 테스트 체크리스트

- [x] 연도 선택 시 데이터 정상 조회
- [x] 월 선택 시 데이터 정상 조회
- [x] 이전 달 버튼 클릭 시 12월→1월 연도 자동 변경
- [x] 다음 달 버튼 클릭 시 1월→12월 연도 자동 변경
- [x] 요약 통계가 선택한 기간으로 정확히 계산됨
- [x] 차트 데이터가 선택한 기간으로 필터링됨
- [x] 거래내역 테이블이 선택한 기간의 데이터만 표시
- [x] 프로덕션 환경에서 정상 작동 확인

## 배포 정보

- **프론트엔드**: Vercel 자동 배포 완료
- **백엔드**: Render 자동 배포 완료
- **배포 URL**: https://investment-app-rust-one.vercel.app/expenses
- **배포 일시**: 2025-11-08

## 관련 파일

### 백엔드
- `backend/app.py`: GET /api/expenses 엔드포인트 수정
- `backend/services/postgres_database_service.py`: get_all_expenses 메서드 날짜 필터링 추가

### 프론트엔드
- `frontend/src/components/ExpenseManagementDashboard.tsx`: 연도/월 선택 UI + 필터링 로직 구현

## 참고 자료
- React useState 공식 문서: https://react.dev/reference/react/useState
- React useCallback 공식 문서: https://react.dev/reference/react/useCallback
- PostgreSQL DATE 타입: https://www.postgresql.org/docs/current/datatype-datetime.html
