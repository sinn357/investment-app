'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import ExpenseGoalGauge from './ExpenseGoalGauge';
import IncomeGoalGauge from './IncomeGoalGauge';

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

const PALETTE = {
  gold: '#d6a740',
  paleGold: '#f4d06f',
  emerald: '#1fbf8f',
  mint: '#8ce0c3',
  sand: '#f8f4ec',
  light: '#f5f7fb',
  coral: '#f47264',
  slate: '#334155',
};

const COLORS = [PALETTE.gold, PALETTE.emerald, PALETTE.paleGold, PALETTE.mint, '#5cc7af', '#fbbf24', '#38bdf8', '#94a3b8', '#a855f7'];

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

  // 게이지 섹션 상태
  const [budgetGoals, setBudgetGoals] = useState<{
    expense_goals: Record<string, Record<string, number>>;
    income_goals: Record<string, Record<string, number>>;
  }>({
    expense_goals: {},
    income_goals: {}
  });

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

  // 예산 목표 가져오기
  const fetchBudgetGoals = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/expense-budget-goals?user_id=${user.id}`, {
        headers: getHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch budget goals');
      }

      const result = await response.json();
      if (result.status === 'success') {
        setBudgetGoals(result.data);
      }
    } catch (error) {
      console.error('Error fetching budget goals:', error);
    }
  }, [API_BASE_URL, user.id]);

  // 예산 목표 저장하기
  const saveBudgetGoals = async (newGoals: typeof budgetGoals) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/expense-budget-goals`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          user_id: user.id,
          expense_goals: newGoals.expense_goals,
          income_goals: newGoals.income_goals
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save budget goals');
      }

      const result = await response.json();
      if (result.status === 'success') {
        console.log('Budget goals saved successfully');
      }
    } catch (error) {
      console.error('Error saving budget goals:', error);
      alert('예산 목표 저장에 실패했습니다.');
    }
  };

  useEffect(() => {
    fetchExpenses();
    fetchBudgetGoals();
  }, [fetchExpenses, fetchBudgetGoals, refreshKey]);

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
      categoryTotals[item.category] += Number(item.total_amount);
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
        value: Number(exp.amount)
      }));
      barData = filteredExpenses.map(exp => ({
        name: `${exp.name.substring(0, 10)}...`,
        금액: Number(exp.amount)
      }));
    } else {
      // 특정 대분류 선택 시: 해당 대분류의 소분류별 합계 표시
      const filtered = expenseCategories.filter(item => item.category === chartViewType);
      pieData = filtered.map(item => ({
        name: item.subcategory,
        value: Number(item.total_amount)
      }));
      barData = filtered.map(item => ({
        name: item.subcategory,
        금액: Number(item.total_amount)
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
      categoryTotals[item.category] += Number(item.total_amount);
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
        value: Number(exp.amount)
      }));
      barData = filteredIncomes.map(exp => ({
        name: `${exp.name.substring(0, 10)}...`,
        금액: Number(exp.amount)
      }));
    } else {
      // 특정 대분류 선택 시: 해당 대분류의 소분류별 합계 표시
      const filtered = incomeData.filter(item => item.category === incomeChartViewType);
      pieData = filtered.map(item => ({
        name: item.subcategory,
        value: Number(item.total_amount)
      }));
      barData = filtered.map(item => ({
        name: item.subcategory,
        금액: Number(item.total_amount)
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
        dailyMap[date].지출 += Number(expense.amount);
      } else if (expense.transaction_type === '수입') {
        dailyMap[date].수입 += Number(expense.amount);
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

  // 지출/수입 비율 데이터 준비
  const prepareExpenseIncomeRatioData = () => {
    if (!expenseData) return [];

    return [
      { name: '지출', value: Number(expenseData.summary.total_expense) },
      { name: '수입', value: Number(expenseData.summary.total_income) }
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

  const { pieData: compositionPieData } = prepareAssetCompositionData();
  const { pieData: incomePieData } = prepareIncomeCompositionData();
  const dailyData = prepareDailyData();
  const ratioData = prepareExpenseIncomeRatioData();
  const monthLabel = `${selectedYear}년 ${selectedMonth}월`;
  const expenseSummary = expenseData ? {
    income: expenseData.summary.total_income,
    expense: expenseData.summary.total_expense,
    net: expenseData.summary.net_amount,
    transactions: expenseData.summary.total_transactions,
  } : {
    income: 0,
    expense: 0,
    net: 0,
    transactions: 0,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 text-slate-900 p-6">
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div key={idx} className="h-24 rounded-2xl bg-white border border-gray-200 shadow-sm animate-pulse" />
            ))}
          </div>
          <div className="h-56 rounded-2xl bg-white border border-gray-200 shadow-sm animate-pulse" />
          <div className="h-72 rounded-2xl bg-white border border-gray-200 shadow-sm animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* 히어로 + 기간/필터 스위치 */}
        <div className="sticky top-0 z-30 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 pt-4 pb-5 bg-white/95 border-b border-gray-200 backdrop-blur">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
              <div>
                <p className="text-sm text-slate-500">가계부</p>
                <h1 className="text-3xl font-bold text-slate-900">이번 달 현황</h1>
                <p className="text-slate-500 text-sm mt-1">골드 & 에메랄드 톤으로 한눈에 정리합니다.</p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 bg-white border border-gray-200 px-3 py-2 rounded-2xl shadow-sm">
                  <button
                    onClick={handlePrevMonth}
                    className="px-2 py-1 rounded-full text-slate-600 hover:bg-gray-100 transition-colors"
                  >
                    ←
                  </button>
                  <div className="flex items-center gap-2">
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(Number(e.target.value))}
                      className="bg-transparent text-slate-900 text-sm focus:outline-none"
                    >
                      {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i).map(year => (
                        <option key={year} value={year}>{year}년</option>
                      ))}
                    </select>
                    <select
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(Number(e.target.value))}
                      className="bg-transparent text-slate-900 text-sm focus:outline-none"
                    >
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                        <option key={month} value={month}>{month}월</option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={handleNextMonth}
                    className="px-2 py-1 rounded-full text-slate-600 hover:bg-gray-100 transition-colors"
                  >
                    →
                  </button>
                </div>

                <div className="flex bg-gray-100 border border-gray-200 rounded-2xl p-1">
                  {(['전체', '수입', '지출', '이체'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setTypeFilter(tab)}
                      className={`px-3 py-2 text-sm rounded-xl transition-all ${
                        typeFilter === tab
                          ? 'bg-[var(--primary)] text-[var(--primary-foreground)] font-semibold'
                          : 'text-slate-700 hover:bg-white'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setIsFormVisible(true)}
                  className="inline-flex items-center gap-2 bg-[var(--secondary)] text-[var(--secondary-foreground)] font-semibold px-4 py-2 rounded-xl shadow-sm hover:opacity-90 transition-all"
                >
                  + 거래 추가
                </button>
              </div>
            </div>

            {expenseData && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
                  <p className="text-sm text-slate-500">총 수입</p>
                  <p className="text-2xl font-bold text-[var(--secondary)] mt-2">{expenseSummary.income.toLocaleString()}원</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
                  <p className="text-sm text-slate-500">총 지출</p>
                  <p className="text-2xl font-bold text-[var(--primary)] mt-2">{expenseSummary.expense.toLocaleString()}원</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
                  <p className="text-sm text-slate-500">순수입</p>
                  <p className={`text-2xl font-bold mt-2 ${expenseSummary.net >= 0 ? 'text-[var(--secondary)]' : 'text-[var(--destructive)]'}`}>
                    {expenseSummary.net.toLocaleString()}원
                  </p>
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
                  <p className="text-sm text-slate-500">총 거래</p>
                  <p className="text-2xl font-bold text-slate-900 mt-2">{expenseSummary.transactions}건</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 거래 추가 슬라이드 패널 */}
        {isFormVisible && (
          <div className="fixed inset-0 z-40">
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setIsFormVisible(false)}
            />
            <div className="absolute right-0 top-0 h-full w-full sm:w-[480px] bg-white text-slate-900 border-l border-gray-200 shadow-2xl overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-5 py-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500">새 거래 추가</p>
                  <h3 className="text-lg font-semibold text-slate-900">입력 패널</h3>
                </div>
                <button
                  onClick={() => setIsFormVisible(false)}
                  className="text-slate-600 hover:text-slate-900"
                >
                  닫기
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm text-slate-700">거래 유형</label>
                    <div className="flex bg-gray-100 rounded-xl p-1">
                      {(['지출', '수입', '이체'] as const).map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setFormData(prev => ({
                            ...prev,
                            transaction_type: type,
                            category: '',
                            subcategory: '',
                            payment_method: type === '지출' ? '현금' : ''
                          }))}
                          className={`flex-1 px-3 py-2 rounded-lg text-sm ${
                            formData.transaction_type === type
                              ? 'bg-[var(--primary)] text-[var(--primary-foreground)] font-semibold'
                              : 'text-slate-700 hover:bg-white'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-sm text-slate-700">금액</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={formData.amount}
                        onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                        className="flex-1 px-3 py-2 rounded-lg bg-white border border-gray-200 focus:outline-none"
                        placeholder="금액"
                        step="1"
                        min="0"
                      />
                      <select
                        value={formData.currency}
                        onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
                        className="w-24 px-3 py-2 rounded-lg bg-white border border-gray-200 focus:outline-none"
                      >
                        <option value="KRW">원</option>
                        <option value="USD">달러</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-sm text-slate-700">대분류</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        category: e.target.value,
                        subcategory: ''
                      }))}
                      className="w-full px-3 py-2 rounded-lg bg-white border border-gray-200 focus:outline-none"
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

                  <div className="flex flex-col gap-2">
                    <label className="text-sm text-slate-700">소분류</label>
                    <select
                      value={formData.subcategory}
                      onChange={(e) => setFormData(prev => ({ ...prev, subcategory: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg bg-white border border-gray-200 focus:outline-none"
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

                  <div className="flex flex-col gap-2">
                    <label className="text-sm text-slate-700">결제 수단</label>
                    <select
                      value={formData.payment_method}
                      onChange={(e) => setFormData(prev => ({ ...prev, payment_method: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg bg-white border border-gray-200 focus:outline-none disabled:opacity-40"
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
                    <div className="flex flex-col gap-2">
                      <label className="text-sm text-slate-700">결제수단 이름</label>
                      <input
                        type="text"
                        value={formData.payment_method_name}
                        onChange={(e) => setFormData(prev => ({ ...prev, payment_method_name: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg bg-white border border-gray-200 focus:outline-none"
                        placeholder="예: KB카드, 신한은행"
                      />
                    </div>
                  )}

                  <div className="flex flex-col gap-2">
                    <label className="text-sm text-slate-700">거래 날짜</label>
                    <div className="flex gap-2">
                      <input
                        type="date"
                        value={formData.transaction_date}
                        onChange={(e) => setFormData(prev => ({ ...prev, transaction_date: e.target.value }))}
                        className="flex-1 px-3 py-2 rounded-lg bg-white border border-gray-200 focus:outline-none"
                      />
                      <div className="flex flex-col gap-1">
                        {[
                          { label: '오늘', value: new Date().toISOString().split('T')[0] },
                          { label: '어제', value: new Date(Date.now() - 86400000).toISOString().split('T')[0] }
                        ].map((item) => (
                          <button
                            key={item.label}
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, transaction_date: item.value }))}
                            className="px-2 py-1 text-xs rounded-lg bg-gray-100 border border-gray-200 hover:bg-white"
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm text-slate-700">이름 *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-gray-200 focus:outline-none"
                    placeholder="거래내역 이름"
                    required
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm text-slate-700">메모</label>
                  <input
                    type="text"
                    value={formData.memo}
                    onChange={(e) => setFormData(prev => ({ ...prev, memo: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-gray-200 focus:outline-none"
                    placeholder="추가 메모 (선택사항)"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    className="flex-1 bg-[var(--primary)] text-[var(--primary-foreground)] font-semibold py-3 rounded-xl shadow-sm hover:opacity-90 transition-all"
                  >
                    거래내역 저장
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsFormVisible(false)}
                    className="px-4 py-3 rounded-xl bg-gray-100 border border-gray-200 text-slate-700 hover:bg-white"
                  >
                    취소
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 차트 섹션 */}
        {expenseData && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm text-slate-500">{chartViewType === '전체' ? '지출 구성' : `${chartViewType} 상세`}</p>
                  <h3 className="text-lg font-semibold text-slate-900">{monthLabel}</h3>
                </div>
                <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
                  {['전체', '생활', '건강', '사회', '여가', '쇼핑', '기타'].map((viewType) => (
                    <button
                      key={viewType}
                      onClick={() => {
                        setChartViewType(viewType as '전체' | '생활' | '건강' | '사회' | '여가' | '쇼핑' | '기타');
                        setSubViewType(null);
                      }}
                      className={`px-2.5 py-1.5 text-xs rounded-lg transition-colors ${
                        chartViewType === viewType
                          ? 'bg-[var(--primary)] text-[var(--primary-foreground)] font-semibold'
                          : 'text-slate-700 hover:bg-white'
                      }`}
                    >
                      {viewType}
                    </button>
                  ))}
                </div>
              </div>

              {chartViewType !== '전체' && expenseCategories[chartViewType] && (
                <div className="flex flex-wrap gap-1 mb-3">
                  <button
                    onClick={() => setSubViewType(null)}
                    className={`px-2.5 py-1 text-xs rounded-full border ${
                      !subViewType ? 'bg-[var(--secondary)] text-[var(--secondary-foreground)] border-transparent' : 'border-gray-200 text-slate-700 hover:bg-gray-100'
                    }`}
                  >
                    전체
                  </button>
                  {expenseCategories[chartViewType].map((subCategory) => (
                    <button
                      key={subCategory}
                      onClick={() => setSubViewType(subCategory)}
                      className={`px-2.5 py-1 text-xs rounded-full border ${
                        subViewType === subCategory ? 'bg-[var(--secondary)] text-[var(--secondary-foreground)] border-transparent' : 'border-gray-200 text-slate-700 hover:bg-gray-100'
                      }`}
                    >
                      {subCategory}
                    </button>
                  ))}
                </div>
              )}

              {compositionPieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={compositionPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={95}
                      paddingAngle={5}
                      dataKey="value"
                      label={(entry) => `${Number(entry.value).toLocaleString()}원`}
                    >
                      {compositionPieData.map((_entry, index) => {
                        if (chartViewType === '전체') {
                          return <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />;
                        } else if (subViewType) {
                          const extendedColors = [...COLORS, PALETTE.coral, '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F'];
                          return <Cell key={`cell-${index}`} fill={extendedColors[index % extendedColors.length]} />;
                        } else {
                          const categoryColors = CATEGORY_COLORS[chartViewType as keyof typeof CATEGORY_COLORS] || COLORS;
                          return <Cell key={`cell-${index}`} fill={categoryColors[index % categoryColors.length]} />;
                        }
                      })}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#ffffff', borderRadius: 12, border: '1px solid #e2e8f0', color: '#0f172a' }}
                      formatter={(value: number) => [`${value.toLocaleString()}원`, '금액']}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px', color: '#475569' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[260px] flex items-center justify-center text-slate-400">
                  데이터가 없습니다
                </div>
              )}
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm text-slate-500">{incomeChartViewType === '전체' ? '수입 구성' : `${incomeChartViewType} 상세`}</p>
                  <h3 className="text-lg font-semibold text-slate-900">{monthLabel}</h3>
                </div>
                <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
                  {['전체', '근로소득', '사업소득', '투자소득', '기타소득'].map((viewType) => (
                    <button
                      key={viewType}
                      onClick={() => {
                        setIncomeChartViewType(viewType as '전체' | '근로소득' | '사업소득' | '투자소득' | '기타소득');
                        setIncomeSubViewType(null);
                      }}
                      className={`px-2.5 py-1.5 text-xs rounded-lg transition-colors ${
                        incomeChartViewType === viewType
                          ? 'bg-[var(--secondary)] text-[var(--secondary-foreground)] font-semibold'
                          : 'text-slate-700 hover:bg-white'
                      }`}
                    >
                      {viewType}
                    </button>
                  ))}
                </div>
              </div>

              {incomeChartViewType !== '전체' && incomeCategories[incomeChartViewType] && (
                <div className="flex flex-wrap gap-1 mb-3">
                  <button
                    onClick={() => setIncomeSubViewType(null)}
                    className={`px-2.5 py-1 text-xs rounded-full border ${
                      !incomeSubViewType ? 'bg-[var(--primary)] text-[var(--primary-foreground)] border-transparent' : 'border-gray-200 text-slate-700 hover:bg-gray-100'
                    }`}
                  >
                    전체
                  </button>
                  {incomeCategories[incomeChartViewType].map((subCategory) => (
                    <button
                      key={subCategory}
                      onClick={() => setIncomeSubViewType(subCategory)}
                      className={`px-2.5 py-1 text-xs rounded-full border ${
                        incomeSubViewType === subCategory ? 'bg-[var(--primary)] text-[var(--primary-foreground)] border-transparent' : 'border-gray-200 text-slate-700 hover:bg-gray-100'
                      }`}
                    >
                      {subCategory}
                    </button>
                  ))}
                </div>
              )}

              {incomePieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={incomePieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={95}
                      paddingAngle={5}
                      dataKey="value"
                      label={(entry) => `${Number(entry.value).toLocaleString()}원`}
                    >
                      {incomePieData.map((_entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#ffffff', borderRadius: 12, border: '1px solid #e2e8f0', color: '#0f172a' }}
                      formatter={(value: number) => [`${value.toLocaleString()}원`, '금액']}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px', color: '#475569' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[260px] flex items-center justify-center text-slate-400">
                  데이터가 없습니다
                </div>
              )}
            </div>
          </div>
        )}

        {/* 시계열 + 비율 */}
        {expenseData && (
          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-slate-500">지출/수입 흐름</p>
                <h3 className="text-lg font-semibold text-slate-900">{monthLabel}</h3>
              </div>
              <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
                {['일별', '비율'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setTimeSeriesTab(tab as '일별' | '비율')}
                    className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                      timeSeriesTab === tab
                        ? 'bg-[var(--primary)] text-[var(--primary-foreground)] font-semibold'
                        : 'text-slate-700 hover:bg-white'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {timeSeriesTab === '일별' && (
              dailyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={dailyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="날짜" tick={{ fontSize: 11, fill: '#475569' }} />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#475569' }}
                      tickFormatter={(value) => {
                        if (value >= 1000000) return `${(value / 1000000).toFixed(0)}M`;
                        if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
                        return value.toString();
                      }}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#ffffff', borderRadius: 12, border: '1px solid #e2e8f0', color: '#0f172a' }}
                      formatter={(value: number) => [`${value.toLocaleString()}원`]}
                    />
                    <Legend wrapperStyle={{ color: '#475569', fontSize: 12 }} />
                    <Bar dataKey="지출" fill={PALETTE.coral} radius={[6, 6, 0, 0]} />
                    <Bar dataKey="수입" fill={PALETTE.emerald} radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[260px] flex items-center justify-center text-slate-400">데이터가 없습니다</div>
              )
            )}

            {timeSeriesTab === '비율' && (
              ratioData.length > 0 && (ratioData[0].value > 0 || ratioData[1].value > 0) ? (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={ratioData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={95}
                      paddingAngle={5}
                      dataKey="value"
                      label={(entry) => `${Number(entry.value).toLocaleString()}원`}
                    >
                      <Cell fill={PALETTE.coral} />
                      <Cell fill={PALETTE.emerald} />
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#ffffff', borderRadius: 12, border: '1px solid #e2e8f0', color: '#0f172a' }}
                      formatter={(value: number) => [`${value.toLocaleString()}원`, '금액']}
                    />
                    <Legend wrapperStyle={{ color: '#475569', fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[260px] flex items-center justify-center text-slate-400">데이터가 없습니다</div>
              )
            )}
          </div>
        )}

        {/* 예산/목표 */}
        {expenseData && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm text-slate-500">예산 진행도</p>
                  <h3 className="text-lg font-semibold text-slate-900">지출 목표</h3>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-slate-700">카테고리별</span>
              </div>
              <ExpenseGoalGauge
                expenseData={expenseData.by_category.filter(item => item.transaction_type === '지출')}
                goals={budgetGoals.expense_goals}
                onSaveGoals={(goals) => {
                  const newGoals = { ...budgetGoals, expense_goals: goals };
                  setBudgetGoals(newGoals);
                  saveBudgetGoals(newGoals);
                }}
              />
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm text-slate-500">목표 달성률</p>
                  <h3 className="text-lg font-semibold text-slate-900">수입 목표</h3>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-slate-700">카테고리별</span>
              </div>
              <IncomeGoalGauge
                incomeData={expenseData.by_category.filter(item => item.transaction_type === '수입')}
                goals={budgetGoals.income_goals}
                onSaveGoals={(goals) => {
                  const newGoals = { ...budgetGoals, income_goals: goals };
                  setBudgetGoals(newGoals);
                  saveBudgetGoals(newGoals);
                }}
              />
            </div>
          </div>
        )}

        {/* 필터 바 */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex flex-col">
              <span className="text-xs text-slate-400 mb-1">카테고리</span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-sm text-slate-900 focus:outline-none"
              >
                <option value="전체">전체</option>
                {Array.from(new Set(expenses.map(e => e.category))).map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col">
              <span className="text-xs text-slate-400 mb-1">정렬 기준</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'transaction_date' | 'amount' | 'category')}
                className="px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-sm text-slate-900 focus:outline-none"
              >
                <option value="transaction_date">날짜</option>
                <option value="amount">금액</option>
                <option value="category">카테고리</option>
              </select>
            </div>

            <div className="flex flex-col">
              <span className="text-xs text-slate-400 mb-1">정렬</span>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                className="px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-sm text-slate-900 focus:outline-none"
              >
                <option value="desc">내림차순</option>
                <option value="asc">오름차순</option>
              </select>
            </div>
          </div>
        </div>

        {/* 거래내역 테이블 */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-slate-900">거래내역</h3>
              <p className="text-slate-500 text-sm">{sortedExpenses.length}건</p>
            </div>
            <button
              onClick={() => setIsFormVisible(true)}
              className="text-sm px-3 py-2 rounded-lg border border-gray-200 text-slate-700 hover:bg-gray-50 transition-colors"
            >
              + 추가
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-slate-900">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left font-medium uppercase tracking-wider text-xs text-slate-500 sticky left-0 bg-gray-50 backdrop-blur z-10">날짜</th>
                  <th className="px-6 py-3 text-left font-medium uppercase tracking-wider text-xs text-slate-500">구분</th>
                  <th className="px-6 py-3 text-left font-medium uppercase tracking-wider text-xs text-slate-500">금액</th>
                  <th className="px-6 py-3 text-left font-medium uppercase tracking-wider text-xs text-slate-500">카테고리</th>
                  <th className="px-6 py-3 text-left font-medium uppercase tracking-wider text-xs text-slate-500">이름</th>
                  <th className="px-6 py-3 text-left font-medium uppercase tracking-wider text-xs text-slate-500">메모</th>
                  <th className="px-6 py-3 text-left font-medium uppercase tracking-wider text-xs text-slate-500">결제수단</th>
                  <th className="px-6 py-3 text-left font-medium uppercase tracking-wider text-xs text-slate-500">작업</th>
                </tr>
              </thead>
              <tbody>
                {sortedExpenses.map((expense) => (
                  <tr key={expense.id} className="group hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap sticky left-0 bg-white z-10">
                      <div className="text-slate-900 font-medium">{formatDate(expense.transaction_date)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        expense.transaction_type === '수입'
                          ? 'bg-[var(--secondary)]/10 text-[var(--secondary)]'
                          : expense.transaction_type === '이체'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-[var(--primary)]/15 text-[var(--primary)]'
                      }`}>
                        {expense.transaction_type}
                      </span>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap font-semibold ${
                      expense.transaction_type === '수입' ? 'text-[var(--secondary)]' :
                      expense.transaction_type === '이체' ? 'text-blue-600' :
                      'text-[var(--primary)]'
                    }`}>
                      {expense.transaction_type === '수입' ? '+' : expense.transaction_type === '이체' ? '' : '-'}{Number(expense.amount).toLocaleString()}{expense.currency === 'USD' ? '$' : '원'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <span className="inline-flex w-fit px-2 py-1 text-xs rounded-full bg-gray-100 text-slate-900">{expense.category}</span>
                        <span className="text-xs text-slate-500">{expense.subcategory}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 max-w-xs">
                      <div className="text-slate-900 truncate">{expense.name}</div>
                    </td>
                    <td className="px-6 py-4 max-w-xs">
                      <div className="text-slate-500 truncate">{expense.memo || '-'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-800">
                        <div>{expense.payment_method || '-'}</div>
                        {expense.payment_method_name && (
                          <div className="text-xs text-slate-500">({expense.payment_method_name})</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-3 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEdit(expense)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          수정
                        </button>
                        <button
                          onClick={() => handleDelete(expense.id)}
                          className="text-[var(--destructive)] hover:text-red-700"
                        >
                          삭제
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {sortedExpenses.length === 0 && (
            <div className="text-center py-10 text-slate-500">
              거래내역이 없습니다.
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
