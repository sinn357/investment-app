'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

interface Expense {
  id: number;
  transaction_type: '수입' | '지출' | '이체';
  amount: number;
  category: string;
  subcategory: string;
  description: string;
  payment_method: string;
  transaction_date: string;
  created_at: string;
  updated_at: string;
}

interface ExpenseFormData {
  transaction_type?: '수입' | '지출' | '이체';
  amount?: string;
  category?: string;
  subcategory?: string;
  description?: string;
  payment_method?: string;
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

export default function ExpenseManagementDashboard() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [expenseData, setExpenseData] = useState<ExpenseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // 폼 상태
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [formData, setFormData] = useState<ExpenseFormData>({
    transaction_type: '지출',
    amount: '',
    category: '',
    subcategory: '',
    description: '',
    payment_method: '현금',
    transaction_date: new Date().toISOString().split('T')[0]
  });

  // 수정 모달 상태
  const [editExpense, setEditExpense] = useState<Expense | null>(null);
  const [editFormData, setEditFormData] = useState<ExpenseFormData>({});

  // 필터 상태
  const [categoryFilter, setCategoryFilter] = useState<string>('전체');
  const [typeFilter, setTypeFilter] = useState<'전체' | '수입' | '지출' | '이체'>('전체');
  const [sortBy, setSortBy] = useState<'transaction_date' | 'amount' | 'category'>('transaction_date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

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
      const response = await fetch(`${API_BASE_URL}/api/expenses?user_id=1`);

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
  }, [API_BASE_URL]);

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
        user_id: 1, // 포트폴리오 패턴과 동일
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
        category: '',
        subcategory: '',
        description: '',
        payment_method: '현금',
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
      const response = await fetch(`${API_BASE_URL}/api/expenses/${expenseId}?user_id=1`, {
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
      category: expense.category,
      subcategory: expense.subcategory,
      description: expense.description,
      payment_method: expense.payment_method,
      transaction_date: expense.transaction_date
    });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editExpense) return;

    try {
      const submitData = {
        ...editFormData,
        user_id: 1, // 포트폴리오 패턴과 동일
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

  // 카테고리별 데이터 준비 (차트용)
  const prepareChartData = () => {
    if (!expenseData) return { pieData: [], barData: [] };

    const expenseCategories = expenseData.by_category.filter(item => item.transaction_type === '지출');
    const totalExpense = expenseData.summary.total_expense;

    const pieData = expenseCategories.map((item, index) => ({
      name: `${item.category} (${item.subcategory})`,
      value: item.total_amount,
      percentage: totalExpense > 0 ? ((item.total_amount / totalExpense) * 100).toFixed(1) : '0',
      color: COLORS[index % COLORS.length]
    }));

    const barData = expenseCategories.map((item, index) => ({
      name: item.category,
      지출: item.total_amount,
      색상: COLORS[index % COLORS.length]
    }));

    return { pieData, barData };
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

  const { pieData, barData } = prepareChartData();

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
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    transaction_type: e.target.value as '수입' | '지출' | '이체',
                    category: '', // 유형 변경 시 카테고리 초기화
                    subcategory: ''
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="지출">지출</option>
                  <option value="수입">수입</option>
                  <option value="이체">이체</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">금액</label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="금액을 입력하세요"
                  step="1"
                  min="0"
                />
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
                >
                  {paymentMethods.map(method => (
                    <option key={method} value={method}>{method}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">거래 날짜</label>
                <input
                  type="date"
                  value={formData.transaction_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, transaction_date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="md:col-span-2 lg:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">설명/메모</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="거래 내용을 입력하세요"
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

        {/* 차트 섹션 */}
        {expenseData && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">지출 분포</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    dataKey="value"
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    label={({ percentage }) => `${percentage}%`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [`${value.toLocaleString()}원`, '지출액']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">카테고리별 지출</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => [`${value.toLocaleString()}원`, '지출액']} />
                  <Bar dataKey="지출" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">설명</th>
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
                      {expense.transaction_type === '수입' ? '+' : expense.transaction_type === '이체' ? '' : '-'}{expense.amount.toLocaleString()}원
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>
                        <div className="font-medium">{expense.category}</div>
                        <div className="text-gray-500 text-xs">{expense.subcategory}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                      {expense.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {expense.payment_method}
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
                    onChange={(e) => setEditFormData(prev => ({
                      ...prev,
                      transaction_type: e.target.value as '수입' | '지출' | '이체'
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="지출">지출</option>
                    <option value="수입">수입</option>
                    <option value="이체">이체</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">금액</label>
                  <input
                    type="number"
                    value={editFormData.amount}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, amount: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    step="1"
                    min="0"
                  />
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
                  >
                    {paymentMethods.map(method => (
                      <option key={method} value={method}>{method}</option>
                    ))}
                  </select>
                </div>

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
                  <label className="block text-sm font-medium text-gray-700 mb-2">설명/메모</label>
                  <input
                    type="text"
                    value={editFormData.description}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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