'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

interface Expense {
  id: number;
  transaction_type: '수입' | '지출' | '이체';
  amount: number;
  currency: string;
  category: string;
  subcategory: string;
  name: string;
  memo: string;
  payment_method: string;
  payment_method_name: string;
  transaction_date: string;
  created_at: string;
  updated_at: string;
}

interface ExpenseFormData {
  transaction_type?: '수입' | '지출' | '이체';
  amount?: string;
  currency?: string;
  category?: string;
  subcategory?: string;
  name?: string;
  memo?: string;
  payment_method?: string;
  payment_method_name?: string;
  transaction_date?: string;
}

interface CategorySummary {
  category: string;
  subcategory: string;
  transaction_type: string;
  total_amount: number;
  transaction_count: number;
}

interface ExpenseData {
  status: string;
  data: Expense[];
  summary: {
    total_income: number;
    total_expense: number;
    net_amount: number;
    total_transactions: number;
  };
  by_category: CategorySummary[];
}

// interface Budget {
//   id: number;
//   category: string;
//   subcategory: string;
//   monthly_budget: number;
//   year: number;
//   month: number;
// }

// interface BudgetProgress {
//   category: string;
//   subcategory: string;
//   monthly_budget: number;
//   actual_expense: number;
//   progress_percentage: number;
//   remaining_budget: number;
// }

// 카테고리 정의 (포트폴리오의 자산 분류와 동일한 패턴)
const expenseCategories: Record<string, string[]> = {
  "생활": ["유틸리티", "생필품", "교통", "구독", "요리", "외식", "세금", "카드대금", "집", "미용"],
  "건강": ["식단", "보험", "영양제", "검진", "탈모"],
  "사회": ["대금지출", "경조사", "가족지원"],
  "여가": ["자유시간", "스포츠", "여행"],
  "쇼핑": ["의류", "전자기기", "시계", "차", "사치품"],
  "기타": ["기타"]
};

const incomeCategories: Record<string, string[]> = {
  "근로소득": ["급여", "보너스", "부업"],
  "사업소득": ["사업수익", "프리랜서"],
  "투자소득": ["주식", "ETF", "채권", "암호화폐", "부동산", "이자", "배당금", "기타"],
  "기타소득": ["용돈", "선물", "환급"]
};

const transferCategories: Record<string, string[]> = {
  "계좌이체": ["계좌이체"],
  "현금이체": ["현금이체"],
  "환전": ["환전"],
  "환불": ["환불"]
};

const paymentMethods = ["현금", "신용카드", "체크카드", "계좌이체", "기타"];

// 색상 팔레트 (포트폴리오와 동일)
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#8DD1E1', '#D084D0'];

// 대분류별 색상 그룹 (자산 구성 분석용)
const CATEGORY_COLORS: Record<string, string[]> = {
  '생활': ['#0088FE', '#0099FF', '#00AAFF', '#00BBFF', '#00CCFF', '#00DDFF', '#00EEFF', '#00FFFF', '#00FFEE', '#00FFDD'],
  '건강': ['#00C49F', '#00D5AF', '#00E6BF', '#00F7CF', '#10FFD0', '#20FFD5', '#30FFDA', '#40FFDF', '#50FFE4'],
  '사회': ['#FFBB28', '#FFCC38', '#FFDD48', '#FFEE58', '#FFFF68', '#FFFF78', '#FFFF88'],
  '여가': ['#FF8042', '#FF9052', '#FFA062', '#FFB072', '#FFC082', '#FFD092', '#FFE0A2'],
  '쇼핑': ['#8884D8', '#9894E8', '#A8A4F8', '#B8B4FF', '#C8C4FF', '#D8D4FF', '#E8E4FF'],
  '기타': ['#82CA9D', '#92DAAD', '#A2EABD', '#B2FACD', '#C2FFDD']
};

interface User {
  id: number;
  username: string;
  token?: string;
}

interface ExpenseManagementDashboardProps {
  user: User;
}

export default function ExpenseManagementDashboard({ user }: ExpenseManagementDashboardProps) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [expenseData, setExpenseData] = useState<ExpenseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // 폼 상태
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [formData, setFormData] = useState<ExpenseFormData>({
    transaction_type: '지출',
    amount: '',
    currency: 'KRW',
    category: '',
    subcategory: '',
    name: '',
    memo: '',
    payment_method: '현금',
    payment_method_name: '',
    transaction_date: new Date().toISOString().split('T')[0]
  });

  // 수정 모달 상태
  const [editExpense, setEditExpense] = useState<Expense | null>(null);
  const [editFormData, setEditFormData] = useState<ExpenseFormData>({});

  // 연도/월 필터 상태
  const today = new Date();
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1); // 1-12

  // 필터 상태
  const [categoryFilter, setCategoryFilter] = useState<string>('전체');
  const [typeFilter, setTypeFilter] = useState<'전체' | '수입' | '지출' | '이체'>('전체');
  const [sortBy, setSortBy] = useState<'transaction_date' | 'amount' | 'category'>('transaction_date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // 자산 구성 분석 차트 뷰 상태
  const [chartViewType, setChartViewType] = useState<'전체' | '생활' | '건강' | '사회' | '여가' | '쇼핑' | '기타'>('전체');
  const [subViewType, setSubViewType] = useState<string | null>(null);

  // 수입 구성 분석 차트 뷰 상태
  const [incomeChartViewType, setIncomeChartViewType] = useState<'전체' | '근로소득' | '사업소득' | '투자소득' | '기타소득'>('전체');
  const [incomeSubViewType, setIncomeSubViewType] = useState<string | null>(null);

  // 시계열 차트 탭 상태
  const [timeSeriesTab, setTimeSeriesTab] = useState<'일별' | '비율'>('일별');

  // API URL 설정
  const API_BASE_URL = 'https://investment-app-backend-x166.onrender.com';

  // 간단한 헤더 (포트폴리오 패턴과 동일)
  const getHeaders = () => {
    return {
      'Content-Type': 'application/json',
    };
  };

  // 날짜 포맷팅 함수 (2025년 11월 4일 (화) 형식)
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
    const dayOfWeek = dayNames[date.getDay()];

    return `${year}년 ${month}월 ${day}일 (${dayOfWeek})`;
  };

  // 거래내역 조회
  const fetchExpenses = useCallback(async () => {
    try {
      setLoading(true);

      // 선택한 연도/월의 시작일과 종료일 계산
      const startDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;
      const lastDay = new Date(selectedYear, selectedMonth, 0).getDate();
      const endDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

      const response = await fetch(`${API_BASE_URL}/api/expenses?user_id=${user.id}&start_date=${startDate}&end_date=${endDate}`);

      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = '/';
          return;
        }
        throw new Error('거래내역 조회 실패');
      }

      const result: ExpenseData = await response.json();
      setExpenseData(result);
      setExpenses(result.data || []);
    } catch (error) {
      console.error('Error fetching expenses:', error);
      alert('거래내역을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL, selectedYear, selectedMonth, user.id]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses, refreshKey]);

  // 폼 제출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 유효성 검사
    if (!formData.amount || !formData.category || !formData.subcategory || !formData.transaction_date) {
      alert('필수 필드를 모두 입력해주세요.');
      return;
    }

    try {
      const submitData = {
        ...formData,
        user_id: user.id,
        amount: parseFloat(formData.amount!)
      };

      const response = await fetch(`${API_BASE_URL}/api/expenses`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '거래내역 저장 실패');
      }

      const result = await response.json();
      alert(result.message || '거래내역이 저장되었습니다!');

      // 폼 초기화
      setFormData({
        transaction_type: '지출',
        amount: '',
        currency: 'KRW',
        category: '',
        subcategory: '',
        name: '',
        memo: '',
        payment_method: '현금',
        payment_method_name: '',
        transaction_date: new Date().toISOString().split('T')[0]
      });

      // 대시보드 새로고침
      setRefreshKey(prev => prev + 1);
      setIsFormVisible(false);
    } catch (error: unknown) {
      console.error('Error submitting expense:', error);
      alert(error instanceof Error ? error.message : '거래내역 저장에 실패했습니다.');
    }
  };

  // 거래내역 삭제
  const handleDelete = async (expenseId: number) => {
    if (!confirm('정말로 이 거래내역을 삭제하시겠습니까?')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/expenses/${expenseId}?user_id=${user.id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '거래내역 삭제 실패');
      }

      const result = await response.json();
      alert(result.message || '거래내역이 삭제되었습니다.');
      setRefreshKey(prev => prev + 1);
    } catch (error: unknown) {
      console.error('Error deleting expense:', error);
      alert(error instanceof Error ? error.message : '거래내역 삭제에 실패했습니다.');
    }
  };

  // 거래내역 수정
  const handleEdit = (expense: Expense) => {
    setEditExpense(expense);
    setEditFormData({
      transaction_type: expense.transaction_type,
      amount: expense.amount.toString(),
      currency: expense.currency || 'KRW',
      category: expense.category,
      subcategory: expense.subcategory,
      name: expense.name,
      memo: expense.memo,
      payment_method: expense.payment_method,
      payment_method_name: expense.payment_method_name,
      transaction_date: expense.transaction_date
    });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editExpense) return;

    try {
      const submitData = {
        ...editFormData,
        user_id: user.id,
        amount: editFormData.amount ? parseFloat(editFormData.amount) : undefined
      };

      const response = await fetch(`${API_BASE_URL}/api/expenses/${editExpense.id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '거래내역 수정 실패');
      }

      const result = await response.json();
      alert(result.message || '거래내역이 수정되었습니다.');
      setEditExpense(null);
      setEditFormData({});
      setRefreshKey(prev => prev + 1);
    } catch (error: unknown) {
      console.error('Error updating expense:', error);
      alert(error instanceof Error ? error.message : '거래내역 수정에 실패했습니다.');
    }
  };

  // 연도/월 변경 함수들
  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedYear(prev => prev - 1);
      setSelectedMonth(12);
    } else {
      setSelectedMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedYear(prev => prev + 1);
      setSelectedMonth(1);
    } else {
      setSelectedMonth(prev => prev + 1);
    }
  };

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

  // 수입 구성 분석 데이터 준비
  const prepareIncomeCompositionData = () => {
    if (!expenseData) return { pieData: [], barData: [] };

    const incomeData = expenseData.by_category.filter(item => item.transaction_type === '수입');

    // 대분류별 합계 계산
    const categoryTotals: Record<string, number> = {};
    incomeData.forEach(item => {
      if (!categoryTotals[item.category]) {
        categoryTotals[item.category] = 0;
      }
      categoryTotals[item.category] += item.total_amount;
    });

    let pieData: Array<{ name: string; value: number }> = [];
    let barData: Array<{ name: string; 금액: number }> = [];

    if (incomeChartViewType === '전체') {
      // 전체 모드: 대분류별 합계 표시
      pieData = Object.entries(categoryTotals).map(([category, amount]) => ({
        name: category,
        value: amount
      }));
      barData = Object.entries(categoryTotals).map(([category, amount]) => ({
        name: category,
        금액: amount
      }));
    } else if (incomeSubViewType) {
      // 소분류 선택 시: 해당 소분류의 개별 거래내역 표시
      const filteredIncomes = expenses.filter(
        exp => exp.transaction_type === '수입' &&
               exp.category === incomeChartViewType &&
               exp.subcategory === incomeSubViewType
      );
      pieData = filteredIncomes.map(exp => ({
        name: `${exp.name} (${formatDate(exp.transaction_date)})`,
        value: exp.amount
      }));
      barData = filteredIncomes.map(exp => ({
        name: `${exp.name.substring(0, 10)}...`,
        금액: exp.amount
      }));
    } else {
      // 특정 대분류 선택 시: 해당 대분류의 소분류별 합계 표시
      const filtered = incomeData.filter(item => item.category === incomeChartViewType);
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

  // 일별 지출/수입 데이터 준비
  const prepareDailyData = () => {
    if (!expenses || expenses.length === 0) return [];

    // 날짜별로 지출과 수입을 그룹화
    const dailyMap: Record<string, { 지출: number; 수입: number }> = {};

    expenses.forEach(expense => {
      const date = expense.transaction_date;
      if (!dailyMap[date]) {
        dailyMap[date] = { 지출: 0, 수입: 0 };
      }

      if (expense.transaction_type === '지출') {
        dailyMap[date].지출 += expense.amount;
      } else if (expense.transaction_type === '수입') {
        dailyMap[date].수입 += expense.amount;
      }
    });

    // 날짜 순으로 정렬하여 배열로 변환
    const sortedData = Object.entries(dailyMap)
      .map(([date, amounts]) => ({
        날짜: new Date(date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }),
        fullDate: date,
        지출: amounts.지출,
        수입: amounts.수입
      }))
      .sort((a, b) => new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime());

    return sortedData;
  };

  // 월별 지출/수입 데이터 준비
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
        monthlyMap[monthKey].지출 += expense.amount;
      } else if (expense.transaction_type === '수입') {
        monthlyMap[monthKey].수입 += expense.amount;
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

  // 지출/수입 비율 데이터 준비
  const prepareExpenseIncomeRatioData = () => {
    if (!expenseData) return [];

    return [
      { name: '지출', value: expenseData.summary.total_expense },
      { name: '수입', value: expenseData.summary.total_income }
    ];
  };

  // 필터링된 거래내역
  const filteredExpenses = expenses.filter(expense => {
    const categoryMatch = categoryFilter === '전체' || expense.category === categoryFilter;
    const typeMatch = typeFilter === '전체' || expense.transaction_type === typeFilter;
    return categoryMatch && typeMatch;
  });

  // 정렬된 거래내역
  const sortedExpenses = [...filteredExpenses].sort((a, b) => {
    let aValue: string | number, bValue: string | number;

    switch (sortBy) {
      case 'amount':
        aValue = a.amount;
        bValue = b.amount;
        break;
      case 'category':
        aValue = a.category;
        bValue = b.category;
        break;
      default:
        aValue = new Date(a.transaction_date).getTime();
        bValue = new Date(b.transaction_date).getTime();
    }

    if (sortOrder === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });

  const { pieData: compositionPieData, barData: compositionBarData } = prepareAssetCompositionData();
  const { pieData: incomePieData, barData: incomeBarData } = prepareIncomeCompositionData();
  const dailyData = prepareDailyData();
  const ratioData = prepareExpenseIncomeRatioData();

  // 디버깅용 콘솔 로그
  console.log('=== 차트 데이터 디버깅 ===');
  console.log('지출 구성 pieData:', JSON.stringify(compositionPieData, null, 2));
  console.log('수입 구성 pieData:', JSON.stringify(incomePieData, null, 2));
  console.log('일별 데이터:', JSON.stringify(dailyData, null, 2));
  console.log('expenseData.by_category:', JSON.stringify(expenseData?.by_category, null, 2));

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">거래내역을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">가계부 관리</h1>
            <p className="text-gray-600 mt-1">수입과 지출을 체계적으로 관리하세요</p>
          </div>
          <button
            onClick={() => setIsFormVisible(!isFormVisible)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            {isFormVisible ? '폼 닫기' : '거래내역 추가'}
          </button>
        </div>

        {/* 연도/월 선택기 */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <button
              onClick={handlePrevMonth}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              ← 이전 달
            </button>

            <div className="flex items-center gap-4">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i).map(year => (
                  <option key={year} value={year}>{year}년</option>
                ))}
              </select>

              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                  <option key={month} value={month}>{month}월</option>
                ))}
              </select>
            </div>

            <button
              onClick={handleNextMonth}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              다음 달 →
            </button>
          </div>
        </div>

        {/* 요약 카드 */}
        {expenseData && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-green-500">
              <h3 className="text-sm font-medium text-gray-600 mb-2">총 수입</h3>
              <p className="text-2xl font-bold text-green-600">
                {expenseData.summary.total_income.toLocaleString()}원
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-red-500">
              <h3 className="text-sm font-medium text-gray-600 mb-2">총 지출</h3>
              <p className="text-2xl font-bold text-red-600">
                {expenseData.summary.total_expense.toLocaleString()}원
              </p>
            </div>
            <div className={`bg-white rounded-xl shadow-sm p-6 border-l-4 ${
              expenseData.summary.net_amount >= 0 ? 'border-blue-500' : 'border-orange-500'
            }`}>
              <h3 className="text-sm font-medium text-gray-600 mb-2">순수입</h3>
              <p className={`text-2xl font-bold ${
                expenseData.summary.net_amount >= 0 ? 'text-blue-600' : 'text-orange-600'
              }`}>
                {expenseData.summary.net_amount.toLocaleString()}원
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-purple-500">
              <h3 className="text-sm font-medium text-gray-600 mb-2">총 거래 건수</h3>
              <p className="text-2xl font-bold text-purple-600">
                {expenseData.summary.total_transactions}건
              </p>
            </div>
          </div>
        )}

        {/* 거래내역 입력 폼 */}
        {isFormVisible && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">새 거래내역 추가</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">거래 유형</label>
                <select
                  value={formData.transaction_type}
                  onChange={(e) => {
                    const newType = e.target.value as '수입' | '지출' | '이체';
                    setFormData(prev => ({
                      ...prev,
                      transaction_type: newType,
                      category: '', // 유형 변경 시 카테고리 초기화
                      subcategory: '',
                      payment_method: newType === '지출' ? '현금' : '' // 수입/이체는 결제수단 빈칸
                    }));
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="지출">지출</option>
                  <option value="수입">수입</option>
                  <option value="이체">이체</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">금액</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="금액을 입력하세요"
                    step="1"
                    min="0"
                  />
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
                    className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="KRW">원</option>
                    <option value="USD">달러</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">대분류</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    category: e.target.value,
                    subcategory: '' // 대분류 변경 시 소분류 초기화
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">대분류 선택</option>
                  {Object.keys(
                    formData.transaction_type === '수입' ? incomeCategories :
                    formData.transaction_type === '이체' ? transferCategories :
                    expenseCategories
                  ).map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">소분류</label>
                <select
                  value={formData.subcategory}
                  onChange={(e) => setFormData(prev => ({ ...prev, subcategory: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={!formData.category}
                >
                  <option value="">소분류 선택</option>
                  {formData.category && (
                    formData.transaction_type === '수입' ? incomeCategories :
                    formData.transaction_type === '이체' ? transferCategories :
                    expenseCategories
                  )[formData.category]?.map(subcategory => (
                    <option key={subcategory} value={subcategory}>{subcategory}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">결제 수단</label>
                <select
                  value={formData.payment_method}
                  onChange={(e) => setFormData(prev => ({ ...prev, payment_method: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={formData.transaction_type === '수입' || formData.transaction_type === '이체'}
                >
                  {(formData.transaction_type === '수입' || formData.transaction_type === '이체') && (
                    <option value="">-</option>
                  )}
                  {paymentMethods.map(method => (
                    <option key={method} value={method}>{method}</option>
                  ))}
                </select>
              </div>

              {formData.transaction_type === '지출' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">결제수단 이름</label>
                  <input
                    type="text"
                    value={formData.payment_method_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, payment_method_name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="예: KB카드, 신한은행"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">거래 날짜</label>
                <input
                  type="date"
                  value={formData.transaction_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, transaction_date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">이름 *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="거래내역 이름"
                  required
                />
              </div>

              <div className="md:col-span-2 lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">메모</label>
                <input
                  type="text"
                  value={formData.memo}
                  onChange={(e) => setFormData(prev => ({ ...prev, memo: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="추가 메모 (선택사항)"
                />
              </div>

              <div className="md:col-span-2 lg:col-span-3">
                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition-colors"
                >
                  거래내역 저장
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 지출/수입 구성 분석 섹션 (나란히 배치) */}
        {expenseData && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* 지출 구성 분석 */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  {chartViewType === '전체' ? '지출 구성 분석' :
                   subViewType ? `${subViewType} 상세 분석` :
                   `${chartViewType} 세부 분석`}
                </h3>

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

              {/* 도넛 차트만 표시 */}
              {compositionPieData.length > 0 ? (
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
                      label
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
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-500">
                  데이터가 없습니다
                </div>
              )}
            </div>

            {/* 수입 구성 분석 */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  {incomeChartViewType === '전체' ? '수입 구성 분석' :
                   incomeSubViewType ? `${incomeSubViewType} 상세 분석` :
                   `${incomeChartViewType} 세부 분석`}
                </h3>

                {/* 1단계: 대분류 버튼 */}
                <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1 flex-wrap gap-1 mb-2">
                  {['전체', '근로소득', '사업소득', '투자소득', '기타소득'].map((viewType) => (
                    <button
                      key={viewType}
                      onClick={() => {
                        setIncomeChartViewType(viewType as '전체' | '근로소득' | '사업소득' | '투자소득' | '기타소득');
                        setIncomeSubViewType(null);
                      }}
                      className={`px-2 py-1 text-xs rounded transition-colors ${
                        incomeChartViewType === viewType
                          ? 'bg-green-500 text-white'
                          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {viewType}
                    </button>
                  ))}
                </div>

                {/* 2단계: 소분류 버튼 (대분류 선택 시에만 표시) */}
                {incomeChartViewType !== '전체' && incomeCategories[incomeChartViewType] && (
                  <div className="flex bg-gray-50 dark:bg-gray-600 rounded-lg p-1 flex-wrap gap-1">
                    <button
                      onClick={() => setIncomeSubViewType(null)}
                      className={`px-2 py-1 text-xs rounded transition-colors ${
                        !incomeSubViewType
                          ? 'bg-purple-500 text-white'
                          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-500'
                      }`}
                    >
                      전체
                    </button>
                    {incomeCategories[incomeChartViewType].map((subCategory) => (
                      <button
                        key={subCategory}
                        onClick={() => setIncomeSubViewType(subCategory)}
                        className={`px-2 py-1 text-xs rounded transition-colors ${
                          incomeSubViewType === subCategory
                            ? 'bg-purple-500 text-white'
                            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-500'
                        }`}
                      >
                        {subCategory}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* 도넛 차트만 표시 */}
              {incomePieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={incomePieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      label
                    >
                      {incomePieData.map((_entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => [`${value.toLocaleString()}원`, '금액']} />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-500">
                  데이터가 없습니다
                </div>
              )}
            </div>
          </div>
        )}

        {/* 시계열 차트 (일별/월별/비율 탭) */}
        {expenseData && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">지출/수입 분석</h3>

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
            </div>

            {/* 일별 차트 */}
            {timeSeriesTab === '일별' && (
              dailyData.length > 0 ? (
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
              ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-500">
                  데이터가 없습니다
                </div>
              )
            )}

            {/* 비율 차트 */}
            {timeSeriesTab === '비율' && (
              ratioData.length > 0 && (ratioData[0].value > 0 || ratioData[1].value > 0) ? (
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
                      label
                    >
                      <Cell fill="#ef4444" />
                      <Cell fill="#10b981" />
                    </Pie>
                    <Tooltip formatter={(value: number) => [`${value.toLocaleString()}원`, '금액']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-500">
                  데이터가 없습니다
                </div>
              )
            )}
          </div>
        )}

        {/* 필터링 및 정렬 */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">카테고리 필터</label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="전체">전체</option>
                {Array.from(new Set(expenses.map(e => e.category))).map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">거래 유형</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as '전체' | '수입' | '지출' | '이체')}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="전체">전체</option>
                <option value="수입">수입</option>
                <option value="지출">지출</option>
                <option value="이체">이체</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">정렬 기준</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'transaction_date' | 'amount' | 'category')}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="transaction_date">날짜</option>
                <option value="amount">금액</option>
                <option value="category">카테고리</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">정렬 순서</label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="desc">내림차순</option>
                <option value="asc">오름차순</option>
              </select>
            </div>
          </div>
        </div>

        {/* 거래내역 테이블 */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-xl font-bold text-gray-900">거래내역</h3>
            <p className="text-gray-600 mt-1">{sortedExpenses.length}건의 거래내역</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">날짜</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">구분</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">금액</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">카테고리</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">이름</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">메모</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">결제수단</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">작업</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedExpenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(expense.transaction_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        expense.transaction_type === '수입'
                          ? 'bg-green-100 text-green-800'
                          : expense.transaction_type === '이체'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {expense.transaction_type}
                      </span>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                      expense.transaction_type === '수입' ? 'text-green-600' :
                      expense.transaction_type === '이체' ? 'text-blue-600' :
                      'text-red-600'
                    }`}>
                      {expense.transaction_type === '수입' ? '+' : expense.transaction_type === '이체' ? '' : '-'}{Number(expense.amount).toLocaleString()}{expense.currency === 'USD' ? '$' : '원'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>
                        <div className="font-medium">{expense.category}</div>
                        <div className="text-gray-500 text-xs">{expense.subcategory}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                      {expense.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {expense.memo || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div>
                        <div>{expense.payment_method || '-'}</div>
                        {expense.payment_method_name && (
                          <div className="text-xs text-gray-400">({expense.payment_method_name})</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleEdit(expense)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        수정
                      </button>
                      <button
                        onClick={() => handleDelete(expense.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        삭제
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {sortedExpenses.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">거래내역이 없습니다.</p>
            </div>
          )}
        </div>

        {/* 수정 모달 */}
        {editExpense && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-lg w-full p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">거래내역 수정</h3>
              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">거래 유형</label>
                  <select
                    value={editFormData.transaction_type}
                    onChange={(e) => {
                      const newType = e.target.value as '수입' | '지출' | '이체';
                      setEditFormData(prev => ({
                        ...prev,
                        transaction_type: newType,
                        payment_method: newType === '지출' ? (prev.payment_method || '현금') : '' // 수입/이체는 결제수단 빈칸
                      }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="지출">지출</option>
                    <option value="수입">수입</option>
                    <option value="이체">이체</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">금액</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={editFormData.amount}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, amount: e.target.value }))}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      step="1"
                      min="0"
                    />
                    <select
                      value={editFormData.currency}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, currency: e.target.value }))}
                      className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="KRW">원</option>
                      <option value="USD">달러</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">대분류</label>
                  <select
                    value={editFormData.category}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">대분류 선택</option>
                    {Object.keys(editFormData.transaction_type === '수입' ? incomeCategories : expenseCategories).map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">소분류</label>
                  <select
                    value={editFormData.subcategory}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, subcategory: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={!editFormData.category}
                  >
                    <option value="">소분류 선택</option>
                    {editFormData.category && (editFormData.transaction_type === '수입' ? incomeCategories : expenseCategories)[editFormData.category]?.map(subcategory => (
                      <option key={subcategory} value={subcategory}>{subcategory}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">결제 수단</label>
                  <select
                    value={editFormData.payment_method}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, payment_method: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={editFormData.transaction_type === '수입' || editFormData.transaction_type === '이체'}
                  >
                    {(editFormData.transaction_type === '수입' || editFormData.transaction_type === '이체') && (
                      <option value="">-</option>
                    )}
                    {paymentMethods.map(method => (
                      <option key={method} value={method}>{method}</option>
                    ))}
                  </select>
                </div>

                {editFormData.transaction_type === '지출' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">결제수단 이름</label>
                    <input
                      type="text"
                      value={editFormData.payment_method_name}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, payment_method_name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="예: KB카드, 신한은행"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">거래 날짜</label>
                  <input
                    type="date"
                    value={editFormData.transaction_date}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, transaction_date: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">이름 *</label>
                  <input
                    type="text"
                    value={editFormData.name}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="거래내역 이름"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">메모</label>
                  <input
                    type="text"
                    value={editFormData.memo}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, memo: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="추가 메모 (선택사항)"
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                  >
                    수정 완료
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditExpense(null)}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-lg font-medium transition-colors"
                  >
                    취소
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}