'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';

// Dynamic imports로 Oracle 차트 컴포넌트 코드 스플리팅
const OraclePieChart = dynamic(() => import('./charts/OraclePieChart'), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-64"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div></div>
});

const OracleBarChart = dynamic(() => import('./charts/OracleBarChart'), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-64"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div></div>
});

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

  // 구성 차트 뷰 상태 (지출/수입 통합)
  const [compositionMode, setCompositionMode] = useState<'지출' | '수입'>('지출');
  const [compositionCategory, setCompositionCategory] = useState<string>('전체');
  const [compositionSubCategory, setCompositionSubCategory] = useState<string | null>(null);
  const [goalMode, setGoalMode] = useState<'지출' | '수입'>('지출');

  // 시계열 차트 탭 상태
  const [timeSeriesTab, setTimeSeriesTab] = useState<'일별' | '월별' | '비율'>('일별');

  // 월별 (연간) 차트 데이터
  const [yearlyData, setYearlyData] = useState<Array<{
    month: string;
    expense: number;
    income: number;
    net: number;
  }>>([]);

  // 카드대금 제외 토글 상태
  const [excludeCardPayment, setExcludeCardPayment] = useState(false);

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

  // 금액 포맷팅 함수
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR').format(amount);
  };

  // 엑셀 추출 함수
  const exportToExcel = () => {
    if (!expenseData) {
      toast.error('가계부 데이터가 없습니다.');
      return;
    }

    const workbook = XLSX.utils.book_new();
    const worksheetData: unknown[][] = [];

    // 헤더 행
    worksheetData.push([
      '날짜',
      '거래유형',
      '금액',
      '대분류',
      '소분류',
      '세부내역',
      '결제방법',
      '메모'
    ]);

    // 거래유형별 그룹화
    const incomeData = expenses.filter(e => e.transaction_type === '수입');
    const expenseDataList = expenses.filter(e => e.transaction_type === '지출');
    const transferData = expenses.filter(e => e.transaction_type === '이체');

    // 지출 데이터
    if (expenseDataList.length > 0) {
      worksheetData.push(['=== 지출 ===', '', '', '', '', '', '', '']);
      expenseDataList.forEach((expense) => {
        worksheetData.push([
          new Date(expense.transaction_date).toLocaleDateString('ko-KR'),
          expense.transaction_type,
          formatCurrency(expense.amount),
          expense.category,
          expense.subcategory,
          expense.name,
          expense.payment_method_name || expense.payment_method,
          expense.memo || '-'
        ]);
      });
      // 지출 소계
      const totalExpense = expenseDataList.reduce((sum, e) => sum + e.amount, 0);
      worksheetData.push([
        '지출 소계',
        '',
        formatCurrency(totalExpense),
        '',
        '',
        '',
        '',
        ''
      ]);
      worksheetData.push([]);
    }

    // 수입 데이터
    if (incomeData.length > 0) {
      worksheetData.push(['=== 수입 ===', '', '', '', '', '', '', '']);
      incomeData.forEach((income) => {
        worksheetData.push([
          new Date(income.transaction_date).toLocaleDateString('ko-KR'),
          income.transaction_type,
          formatCurrency(income.amount),
          income.category,
          income.subcategory,
          income.name,
          income.payment_method_name || income.payment_method,
          income.memo || '-'
        ]);
      });
      // 수입 소계
      const totalIncome = incomeData.reduce((sum, e) => sum + e.amount, 0);
      worksheetData.push([
        '수입 소계',
        '',
        formatCurrency(totalIncome),
        '',
        '',
        '',
        '',
        ''
      ]);
      worksheetData.push([]);
    }

    // 이체 데이터
    if (transferData.length > 0) {
      worksheetData.push(['=== 이체 ===', '', '', '', '', '', '', '']);
      transferData.forEach((transfer) => {
        worksheetData.push([
          new Date(transfer.transaction_date).toLocaleDateString('ko-KR'),
          transfer.transaction_type,
          formatCurrency(transfer.amount),
          transfer.category,
          transfer.subcategory,
          transfer.name,
          transfer.payment_method_name || transfer.payment_method,
          transfer.memo || '-'
        ]);
      });
      worksheetData.push([]);
    }

    // 전체 요약
    worksheetData.push([]);
    worksheetData.push(['=== 전체 요약 ===', '', '', '', '', '', '', '']);
    worksheetData.push([
      '총 수입',
      '',
      formatCurrency(expenseData.summary.total_income),
      '',
      '',
      '',
      '',
      ''
    ]);
    worksheetData.push([
      '총 지출',
      '',
      formatCurrency(expenseData.summary.total_expense),
      '',
      '',
      '',
      '',
      ''
    ]);
    worksheetData.push([
      '순액',
      '',
      formatCurrency(expenseData.summary.net_amount),
      '',
      '',
      '',
      '',
      ''
    ]);

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

    // 컬럼 너비 설정
    worksheet['!cols'] = [
      { wch: 16 }, // 날짜
      { wch: 10 }, // 거래유형
      { wch: 14 }, // 금액
      { wch: 12 }, // 대분류
      { wch: 14 }, // 소분류
      { wch: 20 }, // 세부내역
      { wch: 12 }, // 결제방법
      { wch: 20 }  // 메모
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, '가계부');
    const fileName = `가계부_${selectedYear}년${String(selectedMonth).padStart(2, '0')}월_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
    toast.success('엑셀 파일이 다운로드되었습니다.');
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

  // 연간 월별 데이터 조회
  const fetchYearlyData = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/expenses/yearly?user_id=${user.id}&year=${selectedYear}`, {
        headers: getHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch yearly data');
      }

      const result = await response.json();
      if (result.status === 'success') {
        setYearlyData(result.data);
      }
    } catch (error) {
      console.error('Error fetching yearly data:', error);
    }
  }, [API_BASE_URL, user.id, selectedYear]);

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
      if (result.status !== 'success') {
        console.error('Failed to save budget goals:', result.message);
      }
    } catch (error) {
      console.error('Error saving budget goals:', error);
      alert('예산 목표 저장에 실패했습니다.');
    }
  };

  useEffect(() => {
    fetchExpenses();
    fetchBudgetGoals();
    fetchYearlyData();
  }, [fetchExpenses, fetchBudgetGoals, fetchYearlyData, refreshKey]);

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

  // 일별 지출/수입 데이터 준비
  // ✅ 성능 최적화: 일별 차트 데이터를 useMemo로 캐싱 (expenses 변경 시에만 재계산)
  const dailyData = useMemo(() => {
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
  }, [expenses]);

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

  // ✅ 성능 최적화: 지출/수입 비율 데이터를 useMemo로 캐싱 (expenseData 변경 시에만 재계산)
  const ratioData = useMemo(() => {
    if (!expenseData) return [];

    return [
      { name: '지출', value: Number(expenseData.summary.total_expense) },
      { name: '수입', value: Number(expenseData.summary.total_income) }
    ];
  }, [expenseData]);

  // ✅ 성능 최적화: 필터링 로직을 useMemo로 캐싱 (expenses, categoryFilter, typeFilter 변경 시에만 재계산)
  const filteredExpenses = useMemo(() => {
    return expenses.filter(expense => {
      const categoryMatch = categoryFilter === '전체' || expense.category === categoryFilter;
      const typeMatch = typeFilter === '전체' || expense.transaction_type === typeFilter;
      return categoryMatch && typeMatch;
    });
  }, [expenses, categoryFilter, typeFilter]);

  // ✅ 성능 최적화: 정렬 로직을 useMemo로 캐싱 (filteredExpenses, sortBy, sortOrder 변경 시에만 재계산)
  const sortedExpenses = useMemo(() => {
    return [...filteredExpenses].sort((a, b) => {
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
  }, [filteredExpenses, sortBy, sortOrder]);

  // ✅ 성능 최적화: 구성 분석 차트 데이터를 useMemo로 캐싱 (expenseData, compositionMode, compositionCategory, compositionSubCategory, expenses 변경 시에만 재계산)
  const compositionPieData = useMemo(() => {
    if (!expenseData) return [];

    const isExpenseMode = compositionMode === '지출';
    const categoryData = expenseData.by_category.filter(
      item => item.transaction_type === (isExpenseMode ? '지출' : '수입')
    );

    // 대분류 합계
    const categoryTotals: Record<string, number> = {};
    categoryData.forEach(item => {
      if (!categoryTotals[item.category]) categoryTotals[item.category] = 0;
      categoryTotals[item.category] += Number(item.total_amount);
    });

    let pieData: Array<{ name: string; value: number }> = [];

    if (compositionCategory === '전체') {
      pieData = Object.entries(categoryTotals).map(([category, amount]) => ({
        name: category,
        value: amount
      }));
    } else if (compositionSubCategory) {
      const filtered = expenses.filter(
        exp =>
          exp.transaction_type === (isExpenseMode ? '지출' : '수입') &&
          exp.category === compositionCategory &&
          exp.subcategory === compositionSubCategory
      );
      pieData = filtered.map(exp => ({
        name: exp.name.length > 10 ? `${exp.name.substring(0, 10)}...` : exp.name,
        value: Number(exp.amount)
      }));
    } else {
      const filtered = categoryData.filter(item => item.category === compositionCategory);
      pieData = filtered.map(item => ({
        name: item.subcategory,
        value: Number(item.total_amount)
      }));
    }

    return pieData;
  }, [expenseData, compositionMode, compositionCategory, compositionSubCategory, expenses]);
  const [goalAccordion, setGoalAccordion] = useState<Record<string, boolean>>({});

  const buildGoalTotals = (mode: '지출' | '수입') => {
    const isExpenseMode = mode === '지출';
    const totalsMap = new Map<string, number>();

    expenseData?.by_category
      .filter(item => item.transaction_type === (isExpenseMode ? '지출' : '수입'))
      .forEach(item => {
        totalsMap.set(`${item.category}::${item.subcategory}`, Number(item.total_amount));
      });

    return totalsMap;
  };

  const handleGoalChange = (
    mode: '지출' | '수입',
    category: string,
    subcategory: string,
    value: string
  ) => {
    const parsed = Math.max(0, Number(value) || 0);
    const newGoals =
      mode === '지출'
        ? {
            ...budgetGoals,
            expense_goals: {
              ...budgetGoals.expense_goals,
              [category]: {
                ...(budgetGoals.expense_goals[category] || {}),
                [subcategory]: parsed
              }
            }
          }
        : {
            ...budgetGoals,
            income_goals: {
              ...budgetGoals.income_goals,
              [category]: {
                ...(budgetGoals.income_goals[category] || {}),
                [subcategory]: parsed
              }
            }
          };
    setBudgetGoals(newGoals);
    saveBudgetGoals(newGoals);
  };

  // ✅ 성능 최적화: 이미 useMemo로 정의된 변수들 사용 (중복 계산 제거)
  const monthLabel = `${selectedYear}년 ${selectedMonth}월`;

  // 카드대금 제외 시 직접 계산
  const expenseSummary = useMemo(() => {
    if (!expenseData) {
      return { income: 0, expense: 0, net: 0, transactions: 0 };
    }

    if (!excludeCardPayment) {
      // 카드대금 포함 (기존 로직)
      return {
        income: expenseData.summary.total_income,
        expense: expenseData.summary.total_expense,
        net: expenseData.summary.net_amount,
        transactions: expenseData.summary.total_transactions,
      };
    }

    // 카드대금 제외 계산
    const cardPaymentTotal = expenseData.data
      .filter(t => t.subcategory === '카드대금' && t.transaction_type === '지출')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const expenseExcluded = expenseData.summary.total_expense - cardPaymentTotal;
    const cardPaymentCount = expenseData.data
      .filter(t => t.subcategory === '카드대금' && t.transaction_type === '지출').length;

    return {
      income: expenseData.summary.total_income,
      expense: expenseExcluded,
      net: expenseData.summary.total_income - expenseExcluded,
      transactions: expenseData.summary.total_transactions - cardPaymentCount,
    };
  }, [expenseData, excludeCardPayment]);

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
        <div className="lg:sticky top-0 z-30 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 pt-4 pb-5 bg-white/95 border-b border-gray-200 backdrop-blur">
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
                  onClick={exportToExcel}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary to-secondary text-white rounded-2xl hover:opacity-90 transition-opacity font-medium shadow-sm"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Excel 추출
                </button>

                <button
                  onClick={() => setIsFormVisible(true)}
                  className="inline-flex items-center gap-2 bg-[var(--secondary)] text-[var(--secondary-foreground)] font-semibold px-4 py-2 rounded-xl shadow-sm hover:opacity-90 transition-all"
                >
                  + 거래 추가
                </button>
              </div>
            </div>

            {expenseData && (
          <>
          {/* 카드대금 제외 토글 */}
          <div className="flex items-center justify-end mb-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <span className="text-xs text-slate-500">카드대금 제외</span>
              <button
                onClick={() => setExcludeCardPayment(!excludeCardPayment)}
                className={`relative w-10 h-5 rounded-full transition-colors ${
                  excludeCardPayment ? 'bg-primary' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                    excludeCardPayment ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </label>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
            <div className="bg-white border border-gray-200 rounded-lg p-2.5 shadow-sm">
              <p className="text-xs text-slate-500">총 수입</p>
              <p className="text-xl font-bold text-[var(--secondary)] mt-1">{expenseSummary.income.toLocaleString()}원</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-2.5 shadow-sm">
              <p className="text-xs text-slate-500">총 지출{excludeCardPayment && <span className="text-[10px] ml-1">(카드대금 제외)</span>}</p>
              <p className="text-xl font-bold text-red-600 mt-1">{expenseSummary.expense.toLocaleString()}원</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-2.5 shadow-sm">
              <p className="text-xs text-slate-500">순수입</p>
              <p className={`text-xl font-bold mt-1 ${expenseSummary.net >= 0 ? 'text-[var(--secondary)]' : 'text-[var(--destructive)]'}`}>
                {expenseSummary.net.toLocaleString()}원
              </p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-2.5 shadow-sm">
              <p className="text-xs text-slate-500">총 거래</p>
              <p className="text-xl font-bold text-slate-900 mt-1">{expenseSummary.transactions}건</p>
            </div>
          </div>
          </>
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-primary/10 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-xs text-slate-500">구성</p>
                  <h3 className="text-base font-semibold text-slate-900">{monthLabel}</h3>
                </div>
                <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
                  {(['지출', '수입'] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => {
                        setCompositionMode(mode);
                        setCompositionCategory('전체');
                        setCompositionSubCategory(null);
                      }}
                      className={`px-2.5 py-1.5 text-xs rounded-lg transition-colors ${
                        compositionMode === mode
                          ? 'bg-[var(--primary)] text-[var(--primary-foreground)] font-semibold'
                          : 'text-slate-700 hover:bg-white'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-1 mb-2">
                {(compositionMode === '지출'
                  ? ['전체', '생활', '건강', '사회', '여가', '쇼핑', '기타']
                  : ['전체', '근로소득', '사업소득', '투자소득', '기타소득']
                ).map((category) => (
                  <button
                    key={category}
                    onClick={() => {
                      setCompositionCategory(category);
                      setCompositionSubCategory(null);
                    }}
                    className={`px-2.5 py-1 text-[11px] rounded-full border ${
                      compositionCategory === category
                        ? 'bg-[var(--secondary)] text-[var(--secondary-foreground)] border-transparent'
                        : 'border-gray-200 text-slate-700 hover:bg-gray-100'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>

              {compositionCategory !== '전체' && (
                <div className="flex flex-wrap gap-1 mb-2">
                  <button
                    onClick={() => setCompositionSubCategory(null)}
                    className={`px-2.5 py-1 text-[11px] rounded-full border ${
                      !compositionSubCategory ? 'bg-[var(--primary)] text-[var(--primary-foreground)] border-transparent' : 'border-gray-200 text-slate-700 hover:bg-gray-100'
                    }`}
                  >
                    전체
                  </button>
                  {(compositionMode === '지출' ? expenseCategories : incomeCategories)[compositionCategory]?.map((sub) => (
                    <button
                      key={sub}
                      onClick={() => setCompositionSubCategory(sub)}
                      className={`px-2.5 py-1 text-[11px] rounded-full border ${
                        compositionSubCategory === sub ? 'bg-[var(--primary)] text-[var(--primary-foreground)] border-transparent' : 'border-gray-200 text-slate-700 hover:bg-gray-100'
                      }`}
                    >
                      {sub}
                    </button>
                  ))}
                </div>
              )}

              {compositionPieData.length > 0 ? (
                <OraclePieChart
                  data={compositionPieData}
                  donut
                  height={180}
                  colors={compositionMode === '지출' ? ['#EF4444', '#DC2626', '#B91C1C', '#991B1B', '#7F1D1D'] : ['#50C878', '#3CB371', '#2F9E5F', '#27864D', '#1E6E3B']}
                />
              ) : (
                <div className="h-[180px] flex items-center justify-center text-slate-400">
                  데이터가 없습니다
                </div>
              )}
            </div>

            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-primary/10 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow min-h-[240px] flex flex-col gap-2">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-xs text-slate-500">지출/수입 흐름</p>
                  <h3 className="text-base font-semibold text-slate-900">{monthLabel}</h3>
                </div>
                <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
                  {['일별', '월별', '비율'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setTimeSeriesTab(tab as '일별' | '월별' | '비율')}
                      className={`px-2.5 py-1.5 text-xs rounded-lg transition-colors ${
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

              <div className="flex-1 flex items-center justify-center">
                {timeSeriesTab === '일별' && (
                  dailyData.length > 0 ? (
                    <OracleBarChart
                      data={dailyData}
                      xKey="날짜"
                      yKeys={[
                        { key: '지출', name: '지출', color: '#EF4444' },
                        { key: '수입', name: '수입', color: '#50C878' }
                      ]}
                      height={180}
                    />
                  ) : (
                    <div className="h-[180px] flex flex-col items-center justify-center text-muted-foreground">
                      <span className="text-3xl mb-2">📊</span>
                      <span className="text-sm">데이터가 없습니다</span>
                    </div>
                  )
                )}

                {timeSeriesTab === '월별' && (
                  yearlyData.length > 0 ? (
                    <OracleBarChart
                      data={yearlyData.map(d => ({
                        월: d.month,
                        지출: d.expense,
                        수입: d.income
                      }))}
                      xKey="월"
                      yKeys={[
                        { key: '지출', name: '지출', color: '#EF4444' },
                        { key: '수입', name: '수입', color: '#50C878' }
                      ]}
                      height={180}
                    />
                  ) : (
                    <div className="h-[180px] flex flex-col items-center justify-center text-muted-foreground">
                      <span className="text-3xl mb-2">📅</span>
                      <span className="text-sm">{selectedYear}년 데이터가 없습니다</span>
                    </div>
                  )
                )}

                {timeSeriesTab === '비율' && (
                  ratioData.length > 0 && (ratioData[0].value > 0 || ratioData[1].value > 0) ? (
                    <OraclePieChart
                      data={ratioData}
                      donut
                      height={180}
                      colors={['#EF4444', '#50C878']}
                    />
                  ) : (
                    <div className="h-[180px] flex flex-col items-center justify-center text-muted-foreground">
                      <span className="text-3xl mb-2">📊</span>
                      <span className="text-sm">데이터가 없습니다</span>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        )}

        {/* 예산/목표 */}
        {expenseData && (
          <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm min-h-[280px]">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-base">🎯</span>
                <div>
                  <p className="text-[11px] text-slate-500">목표</p>
                  <h3 className="text-sm font-semibold text-slate-900">{goalMode === '지출' ? '지출 목표' : '수입 목표'}</h3>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
                  {(['지출', '수입'] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setGoalMode(mode)}
                      className={`px-2 py-1 text-[11px] rounded-lg transition-colors ${
                        goalMode === mode
                          ? 'bg-[var(--secondary)] text-[var(--secondary-foreground)] font-semibold'
                          : 'text-slate-700 hover:bg-white'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  className="px-2 py-1 text-[11px] rounded-lg border border-gray-200 text-slate-700 hover:bg-gray-50"
                  onClick={() => {
                    const baseCategories = goalMode === '지출' ? expenseCategories : incomeCategories;
                    const allOpen = Object.entries(baseCategories).every(([cat]) => goalAccordion[cat] ?? false);
                    const next: Record<string, boolean> = {};
                    Object.keys(baseCategories).forEach(cat => {
                      next[cat] = !allOpen;
                    });
                    setGoalAccordion(next);
                  }}
                >
                  모두 {(() => {
                    const baseCategories = goalMode === '지출' ? expenseCategories : incomeCategories;
                    const allOpen = Object.entries(baseCategories).every(([cat]) => goalAccordion[cat] ?? false);
                    return allOpen ? '접기' : '펼치기';
                  })()}
                </button>
              </div>
            </div>
            <div className="text-[11px] text-slate-500 mb-3">카테고리별 진행</div>
            <div className="space-y-2">
              {(() => {
                const isExpenseMode = goalMode === '지출';
                const baseCategories = isExpenseMode ? expenseCategories : incomeCategories;
                const goalsMap = isExpenseMode ? budgetGoals.expense_goals : budgetGoals.income_goals;
                const totalsMap = buildGoalTotals(goalMode);

                return Object.entries(baseCategories).map(([cat, subs]) => {
                  const open = goalAccordion[cat] ?? false;
                  return (
                    <div key={cat} className="border border-gray-200 rounded-md p-2">
                      <div className="flex items-center justify-between text-[12px] text-slate-700">
                        <button
                          type="button"
                          className="flex items-center gap-2"
                          onClick={() => setGoalAccordion(prev => ({ ...prev, [cat]: !open }))}
                        >
                          <span className="font-semibold">{cat}</span>
                          <span className="text-[10px] text-slate-500">{open ? '접기' : '펼치기'}</span>
                        </button>
                        <span className="text-[10px] text-slate-500">{subs.length} 개 소분류</span>
                      </div>
                      {open && (
                        <div className="mt-2 space-y-2">
                          {subs.map((sub, idx) => {
                            const total = totalsMap.get(`${cat}::${sub}`) || 0;
                            const goal = goalsMap[cat]?.[sub] || 0;
                            const pct = goal > 0 ? Math.min(100, Math.round((total / goal) * 100)) : 0;
                            return (
                              <div key={`${cat}-${sub}-${idx}`} className="space-y-1">
                                <div className="flex items-center justify-between text-[12px] text-slate-700">
                                  <span className="truncate">{sub}</span>
                                  <span className={`px-2 py-0.5 rounded-full text-[11px] ${
                                    pct >= 100 ? 'bg-red-100 text-red-700' : pct >= 80 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                                  }`}>
                                    {pct}%
                                  </span>
                                </div>
                                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full ${goalMode === '지출' ? 'bg-red-600' : 'bg-[var(--secondary)]'}`}
                                    style={{ width: `${goal > 0 ? Math.min(100, (total / goal) * 100) : 0}%` }}
                                  />
                                </div>
                                <div className="flex items-center justify-between text-[11px] text-slate-500">
                                  <span>누적 {total.toLocaleString()}원</span>
                                  <span className="flex items-center gap-1">
                                    목표
                                    <input
                                      type="number"
                                      min={0}
                                      className="w-20 px-2 py-1 text-[11px] border border-gray-200 rounded bg-white focus:outline-none"
                                      value={goal || ''}
                                      onChange={(e) => handleGoalChange(goalMode, cat, sub, e.target.value)}
                                    />
                                    원
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        )}

        {/* 필터 바 */}
        <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm">
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
                          : 'bg-red-100 text-red-600'
                      }`}>
                        {expense.transaction_type}
                      </span>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap font-semibold ${
                      expense.transaction_type === '수입' ? 'text-[var(--secondary)]' :
                      expense.transaction_type === '이체' ? 'text-blue-600' :
                      'text-red-600'
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
