'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line } from 'recharts';

interface Asset {
  id: number;
  asset_type: string;
  sub_category: string | null;
  name: string;
  amount: number;
  quantity: number | null;
  avg_price: number | null;
  eval_amount: number | null;
  principal: number | null;
  date: string;
  note: string;
  created_at: string;
  profit_loss: number;
  profit_rate: number;
}

interface EditFormData {
  asset_type?: string;
  sub_category?: string | null;
  name?: string;
  quantity?: string | null;
  avg_price?: string | null;
  eval_amount?: string | null;
  principal?: string | null;
  date?: string;
  note?: string;
}

interface CategorySummary {
  total_amount: number;
  total_principal?: number;
  total_eval_amount?: number;
  count: number;
  percentage: number;
  principal_percentage?: number;
  eval_percentage?: number;
}

interface PortfolioData {
  status: string;
  data: Asset[];
  summary: {
    total_assets: number;
    total_principal: number;
    total_profit_loss: number;
    profit_rate: number;
  };
  by_category: { [key: string]: CategorySummary };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF7C7C', '#8DD1E1'];

// 대분류별 색상 그룹 (소분류 차트용)
const MAIN_CATEGORY_COLORS = {
  '즉시현금': ['#0088FE', '#1D93FF', '#3A9FFF', '#58ABFF'],
  '예치자산': ['#00C49F', '#1DD0AB', '#3ADBB7', '#58E6C3'],
  '투자자산': ['#FFBB28', '#FFC53A', '#FFCF4D', '#FFD960'],
  '대체투자': ['#FF8042', '#FF8F58', '#FF9E6E', '#FFAD84']
};

interface User {
  id: number;
  username: string;
  token?: string;
}

interface PortfolioDashboardProps {
  showSideInfo?: boolean;
  user: User;
}

export default function PortfolioDashboard({ showSideInfo = false, user }: PortfolioDashboardProps) {
  const [portfolioData, setPortfolioData] = useState<PortfolioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('전체');
  const [sortBy, setSortBy] = useState<'amount' | 'profit_rate' | 'name'>('amount');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [editForm, setEditForm] = useState<EditFormData>({});
  const [showSubcategoryGoals, setShowSubcategoryGoals] = useState(false);
  const [goalSettings, setGoalSettings] = useState({
    totalGoal: 50000000,
    targetDate: '2024-12-31',
    categoryGoals: {} as Record<string, number>,
    subCategoryGoals: {} as Record<string, { amount: number; targetDate: string }>
  });
  const [chartViewType, setChartViewType] = useState<'전체' | '대체투자' | '예치자산' | '즉시현금' | '투자자산'>('전체');
  const [subViewType, setSubViewType] = useState<string | null>(null);

  // 소분류 매핑
  const subCategories = {
    '즉시현금': ['현금', '입출금통장', '증권예수금'],
    '예치자산': ['예금', '적금', 'MMF'],
    '투자자산': ['국내주식', '해외주식', '펀드', 'ETF', '채권'],
    '대체투자': ['암호화폐', '부동산', '원자재']
  };

  const fetchPortfolioData = useCallback(async () => {
    try {
      setLoading(true);
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      };

      // JWT 토큰이 있으면 Authorization 헤더에 추가
      if (user.token) {
        headers['Authorization'] = `Bearer ${user.token}`;
      }

      const response = await fetch(`https://investment-app-backend-x166.onrender.com/api/portfolio?user_id=${user.id}`, {
        headers
      });
      const data = await response.json();

      if (data.status === 'success') {
        setPortfolioData(data);
        setError(null);
      } else {
        setError(data.message || '포트폴리오 데이터를 불러올 수 없습니다.');
      }
    } catch (err) {
      setError('서버 연결에 실패했습니다.');
      console.error('Portfolio fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  const handleDeleteAsset = async (assetId: number, assetName: string) => {
    if (!window.confirm(`정말로 '${assetName}' 자산을 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`)) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`https://investment-app-backend-x166.onrender.com/api/delete-asset/${assetId}?user_id=${user.id}`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (result.status === 'success') {
        alert(result.message);
        // 포트폴리오 데이터 새로고침
        await fetchPortfolioData();
      } else {
        alert(`삭제 실패: ${result.message}`);
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('삭제 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditAsset = (asset: Asset) => {
    setEditingAsset(asset);
    // 날짜를 YYYY-MM-DD 형식으로 변환
    const formattedDate = new Date(asset.date).toISOString().split('T')[0];
    setEditForm({
      asset_type: asset.asset_type,
      sub_category: asset.sub_category,
      name: asset.name,
      quantity: asset.quantity?.toString() || '',
      avg_price: asset.avg_price?.toString() || '',
      principal: asset.principal?.toString() || '',
      eval_amount: asset.eval_amount?.toString() || '',
      date: formattedDate,
      note: asset.note
    });
  };

  const handleUpdateAsset = async () => {
    if (!editingAsset) return;

    // 필수 필드 검증
    if (!editForm.name || !editForm.name.trim()) {
      alert('자산명을 입력해주세요.');
      return;
    }

    if (!editForm.date) {
      alert('날짜를 기입해주세요.');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`https://investment-app-backend-x166.onrender.com/api/update-asset/${editingAsset.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          asset_type: editForm.asset_type,
          sub_category: editForm.sub_category || null,
          name: editForm.name,
          quantity: editForm.quantity ? parseFloat(editForm.quantity as string) : null,
          avg_price: editForm.avg_price ? parseFloat(editForm.avg_price as string) : null,
          principal: editForm.principal ? parseFloat(editForm.principal as string) : null,
          eval_amount: editForm.eval_amount ? parseFloat(editForm.eval_amount as string) : null,
          date: editForm.date,
          note: editForm.note || '',
          user_id: user.id
        }),
      });

      const result = await response.json();

      if (result.status === 'success') {
        alert(result.message);
        setEditingAsset(null);
        setEditForm({});
        // 포트폴리오 데이터 새로고침
        await fetchPortfolioData();
      } else {
        alert(`수정 실패: ${result.message}`);
      }
    } catch (error) {
      console.error('Update error:', error);
      alert('수정 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingAsset(null);
    setEditForm({});
  };

  const fetchGoalSettings = useCallback(async () => {
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      };

      // JWT 토큰이 있으면 Authorization 헤더에 추가
      if (user.token) {
        headers['Authorization'] = `Bearer ${user.token}`;
      }

      const response = await fetch(`https://investment-app-backend-x166.onrender.com/api/goal-settings?user_id=${user.id}`, {
        headers
      });
      const data = await response.json();

      if (data.status === 'success') {
        setGoalSettings({
          totalGoal: data.data.total_goal,
          targetDate: data.data.target_date,
          categoryGoals: data.data.category_goals || {},
          subCategoryGoals: data.data.sub_category_goals || {}
        });
      }
    } catch (error) {
      console.error('Error fetching goal settings:', error);
      // 오류 시 기본값 유지
    }
  }, [user.id]);

  useEffect(() => {
    fetchPortfolioData();
    fetchGoalSettings();
  }, [fetchPortfolioData, fetchGoalSettings]); // 함수들과 user.id 변경 시 데이터 새로고침

  const saveGoalSettings = async (newSettings: typeof goalSettings) => {
    try {
      const response = await fetch('https://investment-app-backend-x166.onrender.com/api/goal-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
          total_goal: newSettings.totalGoal,
          target_date: newSettings.targetDate,
          category_goals: newSettings.categoryGoals,
          sub_category_goals: newSettings.subCategoryGoals
        }),
      });

      const result = await response.json();
      if (result.status === 'success') {
        console.log('Goal settings saved successfully');
      } else {
        console.error('Failed to save goal settings:', result.message);
      }
    } catch (error) {
      console.error('Error saving goal settings:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('ko-KR').format(num);
  };

  const getFilteredAssets = () => {
    if (!portfolioData) return [];

    let filtered = portfolioData.data;

    if (selectedCategory !== '전체') {
      filtered = filtered.filter(asset => asset.asset_type === selectedCategory);
    }

    // 정렬
    filtered.sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case 'amount':
          aValue = a.amount;
          bValue = b.amount;
          break;
        case 'profit_rate':
          aValue = a.profit_rate;
          bValue = b.profit_rate;
          break;
        case 'name':
          aValue = a.name;
          bValue = b.name;
          break;
        default:
          aValue = a.amount;
          bValue = b.amount;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      }

      return sortOrder === 'asc' ? (aValue as number) - (bValue as number) : (bValue as number) - (aValue as number);
    });

    return filtered;
  };

  const getGroupedAssets = () => {
    if (!portfolioData) return {};

    const filtered = getFilteredAssets();
    const grouped: Record<string, Record<string, typeof filtered>> = {};

    filtered.forEach(asset => {
      const category = asset.asset_type;
      const subCategory = asset.sub_category || '기타';

      if (!grouped[category]) {
        grouped[category] = {};
      }
      if (!grouped[category][subCategory]) {
        grouped[category][subCategory] = [];
      }
      grouped[category][subCategory].push(asset);
    });

    return grouped;
  };

  const getPieChartData = () => {
    if (!portfolioData) return [];
    const groupedAssets = getGroupedAssets();

    if (chartViewType === '전체') {
      // 대분류별 데이터
      return Object.entries(portfolioData.by_category).map(([category, data]) => ({
        name: category,
        value: data.total_principal || data.total_amount,
        percentage: data.principal_percentage || data.percentage,
      }));
    } else if (subViewType) {
      // 특정 소분류의 개별 자산별 데이터
      const targetCategory = chartViewType;
      if (!groupedAssets[targetCategory] || !groupedAssets[targetCategory][subViewType]) return [];

      const subCategoryAssets = groupedAssets[targetCategory][subViewType];
      const subTotal = subCategoryAssets.reduce((sum, asset) => sum + (asset.principal || asset.amount), 0);

      return subCategoryAssets.map((asset) => {
        const principal = asset.principal || asset.amount;
        const percentage = subTotal > 0 ? (principal / subTotal) * 100 : 0;
        return {
          name: asset.name,
          value: principal,
          percentage: percentage
        };
      });
    } else {
      // 특정 대분류의 소분류별 데이터
      const targetCategory = chartViewType;
      if (!groupedAssets[targetCategory]) return [];

      const categoryAssets = groupedAssets[targetCategory];
      const categoryTotal = Object.values(categoryAssets).flat().reduce((sum, asset) => sum + (asset.principal || asset.amount), 0);

      return Object.entries(categoryAssets).map(([subCategory, assets]) => {
        const totalAmount = assets.reduce((sum, asset) => sum + (asset.principal || asset.amount), 0);
        const percentage = categoryTotal > 0 ? (totalAmount / categoryTotal) * 100 : 0;

        return {
          name: subCategory,
          value: totalAmount,
          percentage: percentage,
          assets: assets // 개별 자산 정보도 포함
        };
      });
    }
  };

  const getBarChartData = () => {
    if (!portfolioData) return [];
    const groupedAssets = getGroupedAssets();

    if (chartViewType === '전체') {
      // 대분류별 데이터
      return Object.entries(portfolioData.by_category).map(([category, data]) => ({
        name: category,
        amount: data.total_principal || data.total_amount,
        count: data.count,
        percentage: data.principal_percentage || data.percentage,
      }));
    } else if (subViewType) {
      // 특정 소분류의 개별 자산별 데이터
      const targetCategory = chartViewType;
      if (!groupedAssets[targetCategory] || !groupedAssets[targetCategory][subViewType]) return [];

      const subCategoryAssets = groupedAssets[targetCategory][subViewType];
      const subTotal = subCategoryAssets.reduce((sum, asset) => sum + (asset.principal || asset.amount), 0);

      return subCategoryAssets.map((asset) => {
        const principal = asset.principal || asset.amount;
        const percentage = subTotal > 0 ? (principal / subTotal) * 100 : 0;
        return {
          name: asset.name,
          amount: principal,
          count: 1,
          percentage: percentage
        };
      });
    } else {
      // 특정 대분류의 소분류별 데이터
      const targetCategory = chartViewType;
      if (!groupedAssets[targetCategory]) return [];

      const categoryAssets = groupedAssets[targetCategory];
      const categoryTotal = Object.values(categoryAssets).flat().reduce((sum, asset) => sum + (asset.principal || asset.amount), 0);

      return Object.entries(categoryAssets).map(([subCategory, assets]) => {
        const totalAmount = assets.reduce((sum, asset) => sum + (asset.principal || asset.amount), 0);
        const percentage = categoryTotal > 0 ? (totalAmount / categoryTotal) * 100 : 0;

        return {
          name: subCategory,
          amount: totalAmount,
          count: assets.length,
          percentage: percentage
        };
      });
    }
  };

  const getAssetFlowData = () => {
    // 더미 데이터 - 실제로는 백엔드에서 시계열 데이터를 받아와야 함
    const now = new Date();
    const data = [];
    for (let i = 23; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 60 * 60 * 1000);
      const baseAmount = portfolioData?.summary.total_assets || 10000000;
      const variation = Math.sin(i * 0.5) * 500000 + Math.random() * 200000 - 100000;
      data.push({
        time: time.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit' }),
        amount: Math.max(0, baseAmount + variation),
      });
    }
    return data;
  };


  const getCategoryGoalProgress = () => {
    if (!portfolioData) return [];

    return Object.entries(portfolioData.by_category).map(([category, data]) => {
      const categoryGoal = goalSettings.categoryGoals[category] || 0;
      const progressRate = categoryGoal > 0 ? Math.min((data.total_amount / categoryGoal) * 100, 100) : 0;
      const progressColor = progressRate >= 100 ? 'bg-green-500' : progressRate >= 75 ? 'bg-blue-500' : progressRate >= 50 ? 'bg-yellow-500' : 'bg-red-500';

      return {
        category,
        current: data.total_amount,
        goal: categoryGoal,
        progressRate,
        progressColor
      };
    });
  };

  const getSubCategoryGoalProgress = () => {
    if (!portfolioData) return [];

    const subCategoryProgress: Array<{
      mainCategory: string;
      subCategory: string;
      current: number;
      goal: number;
      targetDate: string;
      progressRate: number;
      progressColor: string;
      daysUntilTarget: number;
    }> = [];

    // 모든 대분류별로 소분류 진행률 계산
    Object.keys(subCategories).forEach(mainCategory => {
      subCategories[mainCategory as keyof typeof subCategories].forEach(subCategory => {
        // 해당 소분류의 자산들 필터링
        const subCategoryAssets = portfolioData.data.filter(asset =>
          asset.asset_type === mainCategory &&
          (asset.sub_category === subCategory || (!asset.sub_category && subCategory === '기타'))
        );

        const current = subCategoryAssets.reduce((sum, asset) => sum + (asset.eval_amount || asset.amount), 0);
        const goalData = goalSettings.subCategoryGoals[subCategory];
        const goal = goalData?.amount || 0;
        const targetDate = goalData?.targetDate || goalSettings.targetDate;

        const progressRate = goal > 0 ? Math.min((current / goal) * 100, 100) : 0;
        const progressColor = progressRate >= 100 ? 'bg-green-500' : progressRate >= 75 ? 'bg-blue-500' : progressRate >= 50 ? 'bg-yellow-500' : 'bg-red-500';

        // D-Day 계산
        const today = new Date();
        const target = new Date(targetDate);
        const diffTime = target.getTime() - today.getTime();
        const daysUntilTarget = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        subCategoryProgress.push({
          mainCategory,
          subCategory,
          current,
          goal,
          targetDate,
          progressRate,
          progressColor,
          daysUntilTarget
        });
      });
    });

    // 현재 금액이 있는 소분류만 필터링하거나 목표가 설정된 소분류 표시
    return subCategoryProgress.filter(item => item.current > 0 || item.goal > 0);
  };

  const getDaysUntilTarget = () => {
    const today = new Date();
    const targetDate = new Date(goalSettings.targetDate);
    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="text-center">
          <div className="text-red-500 text-lg font-medium mb-2">오류 발생</div>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={fetchPortfolioData}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  if (!portfolioData || portfolioData.data.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="text-center">
          <div className="text-gray-500 text-lg font-medium mb-2">포트폴리오가 비어있습니다</div>
          <p className="text-gray-600 dark:text-gray-400">자산을 추가하여 포트폴리오를 시작하세요.</p>
        </div>
      </div>
    );
  }

  const filteredAssets = getFilteredAssets();
  const groupedAssets = getGroupedAssets();
  const pieChartData = getPieChartData();
  const barChartData = getBarChartData();
  const assetFlowData = getAssetFlowData();
  const categories = ['전체', ...Object.keys(portfolioData.by_category)];

  // 사이드 정보 렌더링 (입력 폼 오른편)
  if (showSideInfo) {
    const currentAmount = portfolioData?.summary.total_assets || 0;
    const progressRate = Math.min((currentAmount / goalSettings.totalGoal) * 100, 100);
    const progressColor = progressRate >= 100 ? 'bg-green-500' : progressRate >= 75 ? 'bg-blue-500' : progressRate >= 50 ? 'bg-yellow-500' : 'bg-red-500';
    const subCategoryGoalProgress = getSubCategoryGoalProgress();
    const daysUntilTarget = getDaysUntilTarget();

    // 투자자산과 대체투자만 계산 (즉시현금, 예치자산 제외)
    const investmentAssets = portfolioData?.data.filter(asset =>
      asset.asset_type === '투자자산' || asset.asset_type === '대체투자'
    ) || [];

    const totalInvestmentPrincipal = investmentAssets.reduce((sum, asset) =>
      sum + (asset.principal || asset.amount), 0
    );

    const totalInvestmentCash = investmentAssets.reduce((sum, asset) =>
      sum + (asset.eval_amount || asset.amount), 0
    );

    return (
      <div className="space-y-6">
        {/* 요약 카드 - 5개 블록 */}
        <div className="grid grid-cols-1 gap-3">
          {/* 첫 번째 줄: 총 자산, 총 투자원금 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg p-3">
              <h3 className="text-xs font-medium opacity-90">총 자산</h3>
              <p className="text-sm font-bold">{formatCurrency(portfolioData.summary.total_assets)}</p>
            </div>

            <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg p-3">
              <h3 className="text-xs font-medium opacity-90">총 투자원금</h3>
              <p className="text-sm font-bold">{formatCurrency(totalInvestmentPrincipal)}</p>
            </div>
          </div>

          {/* 두 번째 줄: 투자현금, 총 손익, 수익률 */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gradient-to-r from-cyan-500 to-cyan-600 text-white rounded-lg p-3">
              <h3 className="text-xs font-medium opacity-90">투자현금</h3>
              <p className="text-sm font-bold">{formatCurrency(totalInvestmentCash)}</p>
            </div>

            <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg p-3">
              <h3 className="text-xs font-medium opacity-90">총 손익</h3>
              <p className="text-sm font-bold">{formatCurrency(portfolioData.summary.total_profit_loss)}</p>
            </div>

            <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg p-3">
              <h3 className="text-xs font-medium opacity-90">수익률</h3>
              <p className="text-sm font-bold">{portfolioData.summary.profit_rate.toFixed(2)}%</p>
            </div>
          </div>
        </div>

        {/* 전체 목표 달성률 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">전체 목표 달성률</h3>

          {/* 목표 설정 */}
          <div className="space-y-2 mb-4">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">목표 금액</label>
                <input
                  type="number"
                  value={goalSettings.totalGoal}
                  onChange={(e) => {
                    const newSettings = {...goalSettings, totalGoal: parseInt(e.target.value) || 0};
                    setGoalSettings(newSettings);
                    saveGoalSettings(newSettings);
                  }}
                  className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">목표 날짜</label>
                <input
                  type="date"
                  value={goalSettings.targetDate}
                  onChange={(e) => {
                    const newSettings = {...goalSettings, targetDate: e.target.value};
                    setGoalSettings(newSettings);
                    saveGoalSettings(newSettings);
                  }}
                  className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* 전체 달성률 */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
              <span>현재: {formatCurrency(currentAmount)}</span>
              <span>목표: {formatCurrency(goalSettings.totalGoal)}</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
              <div
                className={`h-4 rounded-full ${progressColor} transition-all duration-500 flex items-center justify-center`}
                style={{ width: `${Math.max(progressRate, 5)}%` }}
              >
                <span className="text-xs font-semibold text-white">
                  {progressRate.toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="text-center">
              <span className="text-xs text-gray-600 dark:text-gray-400">
                {daysUntilTarget > 0 ? `D-${daysUntilTarget}일` : daysUntilTarget === 0 ? 'D-Day' : `${Math.abs(daysUntilTarget)}일 경과`}
              </span>
            </div>
          </div>
        </div>

        {/* 전체 목표 달성률 하단에 펼치기 버튼 */}
        <div className="text-center">
          <button
            onClick={() => setShowSubcategoryGoals(!showSubcategoryGoals)}
            className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex items-center mx-auto gap-2"
          >
            <span>{showSubcategoryGoals ? '소분류별 목표 접기' : '소분류별 목표 보기'}</span>
            <svg
              className={`w-4 h-4 transition-transform ${showSubcategoryGoals ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {/* 소분류별 목표 카드들 */}
        {showSubcategoryGoals && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">소분류별 목표 추적</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subCategoryGoalProgress.map(({ mainCategory, subCategory, current, goal, targetDate, progressRate, progressColor, daysUntilTarget }) => {
              const goalKey = subCategory;
              return (
                <div key={`${mainCategory}-${subCategory}`} className="border border-gray-200 dark:border-gray-600 rounded-lg p-3 space-y-3">
                  {/* 소분류 제목 */}
                  <div className="text-center">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">{subCategory}</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{mainCategory}</p>
                  </div>

                  {/* 목표 입력 */}
                  <div className="space-y-2">
                    <div>
                      <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">목표 금액</label>
                      <input
                        type="number"
                        value={goalSettings.subCategoryGoals[goalKey]?.amount || 0}
                        onChange={(e) => {
                          const newSettings = {
                            ...goalSettings,
                            subCategoryGoals: {
                              ...goalSettings.subCategoryGoals,
                              [goalKey]: {
                                amount: parseInt(e.target.value) || 0,
                                targetDate: goalSettings.subCategoryGoals[goalKey]?.targetDate || goalSettings.targetDate
                              }
                            }
                          };
                          setGoalSettings(newSettings);
                          saveGoalSettings(newSettings);
                        }}
                        className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="목표액"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">목표 날짜</label>
                      <input
                        type="date"
                        value={goalSettings.subCategoryGoals[goalKey]?.targetDate || goalSettings.targetDate}
                        onChange={(e) => {
                          const newSettings = {
                            ...goalSettings,
                            subCategoryGoals: {
                              ...goalSettings.subCategoryGoals,
                              [goalKey]: {
                                amount: goalSettings.subCategoryGoals[goalKey]?.amount || 0,
                                targetDate: e.target.value
                              }
                            }
                          };
                          setGoalSettings(newSettings);
                          saveGoalSettings(newSettings);
                        }}
                        className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* 현재 상태 */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                      <span>현재: {formatCurrency(current)}</span>
                      <span>{goal > 0 ? `${progressRate.toFixed(1)}%` : '-'}</span>
                    </div>
                    <div className="text-center text-xs text-gray-600 dark:text-gray-400">
                      목표: {formatCurrency(goal)}
                    </div>
                  </div>

                  {/* 진행률 게이지 */}
                  {goal > 0 && (
                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full ${progressColor} transition-all duration-500 flex items-center justify-center`}
                        style={{ width: `${Math.max(progressRate, 5)}%` }}
                      >
                        <span className="text-xs font-semibold text-white">
                          {progressRate.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  )}

                  {/* D-Day */}
                  <div className="text-center">
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      {daysUntilTarget > 0 ? `D-${daysUntilTarget}` : daysUntilTarget === 0 ? 'D-Day' : `+${Math.abs(daysUntilTarget)}`}
                    </span>
                  </div>
                </div>
              );
            })}
            </div>
          </div>
        )}

      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* 차트 영역 - 2개 그래프 배치 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 자산 흐름 선형 차트 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">24시간 자산 흐름</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={assetFlowData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`} />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Line
                type="monotone"
                dataKey="amount"
                stroke="#3B82F6"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* 자산 구성 분석 - 도넛 차트 + 막대 차트 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="mb-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {chartViewType === '전체' ? '자산 구성 분석' :
                 subViewType ? `${subViewType} 상세 분석` :
                 `${chartViewType} 세부 분석`}
              </h3>
            </div>

            {/* 1단계: 대분류 버튼 */}
            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1 flex-wrap gap-1 mb-2">
              {['전체', '대체투자', '예치자산', '즉시현금', '투자자산'].map((viewType) => (
                <button
                  key={viewType}
                  onClick={() => {
                    setChartViewType(viewType as '전체' | '대체투자' | '예치자산' | '즉시현금' | '투자자산');
                    setSubViewType(null); // 대분류 변경 시 소분류 초기화
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
            {chartViewType !== '전체' && subCategories[chartViewType] && (
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
                {subCategories[chartViewType].map((subCategory) => (
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

          {/* 도넛 차트와 막대 차트를 나란히 배치 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 도넛 차트 - 비중 */}
            <div>
              <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 text-center">구성 비중</h4>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieChartData.map((entry, index) => {
                      if (chartViewType === '전체') {
                        // 전체 모드: 기본 색상 사용
                        return <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />;
                      } else if (subViewType) {
                        // 소분류 선택 시: 개별 자산용 색상 (더 다양한 색상)
                        const extendedColors = [...COLORS, '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE'];
                        return <Cell key={`cell-${index}`} fill={extendedColors[index % extendedColors.length]} />;
                      } else {
                        // 특정 대분류 모드: 해당 대분류 색상 그룹 사용
                        const mainCategoryColors = MAIN_CATEGORY_COLORS[chartViewType as keyof typeof MAIN_CATEGORY_COLORS] || COLORS;
                        return <Cell key={`cell-${index}`} fill={mainCategoryColors[index % mainCategoryColors.length]} />;
                      }
                    })}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend wrapperStyle={{ fontSize: '10px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* 막대 차트 - 원금 */}
            <div>
              <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 text-center">투자 원금</h4>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={barChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Bar dataKey="amount">
                    {barChartData.map((entry, index) => {
                      if (chartViewType === '전체') {
                        return <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />;
                      } else if (subViewType) {
                        // 소분류 선택 시: 개별 자산용 색상 (더 다양한 색상)
                        const extendedColors = [...COLORS, '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE'];
                        return <Cell key={`cell-${index}`} fill={extendedColors[index % extendedColors.length]} />;
                      } else {
                        // 특정 대분류 모드: 해당 대분류 색상 그룹 사용
                        const mainCategoryColors = MAIN_CATEGORY_COLORS[chartViewType as keyof typeof MAIN_CATEGORY_COLORS] || COLORS;
                        return <Cell key={`cell-${index}`} fill={mainCategoryColors[index % mainCategoryColors.length]} />;
                      }
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* 필터 및 정렬 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">포트폴리오 상세</h3>
            <button
              onClick={fetchPortfolioData}
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
              title="새로고침"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            {/* 자산군 필터 */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>

            {/* 정렬 */}
            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'amount' | 'profit_rate' | 'name')}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="amount">금액순</option>
                <option value="profit_rate">수익률순</option>
                <option value="name">이름순</option>
              </select>

              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          </div>
        </div>

        {/* 자산군별 그룹화된 테이블 */}
        {Object.entries(groupedAssets).map(([category, subCategories]) => {
          const allAssets = Object.values(subCategories).flat();
          // 대분류별 상세 통계 계산
          const totalPrincipal = allAssets.reduce((sum, asset) => sum + (asset.principal || asset.amount), 0);
          const totalEvalAmount = allAssets.reduce((sum, asset) => sum + (asset.eval_amount || asset.amount), 0);
          const totalProfitLoss = totalEvalAmount - totalPrincipal;
          const profitRate = totalPrincipal > 0 ? (totalProfitLoss / totalPrincipal) * 100 : 0;

          return (
            <div key={category} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
              {/* 자산군 헤더 */}
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-white">{category}</h3>
                  <div className="text-white text-sm">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="bg-blue-600 bg-opacity-30 px-3 py-2 rounded">
                        <div className="text-xs opacity-80">자산 수</div>
                        <div className="font-medium">{allAssets.length}개</div>
                      </div>
                      <div className="bg-blue-600 bg-opacity-30 px-3 py-2 rounded">
                        <div className="text-xs opacity-80">현재가치</div>
                        <div className="font-medium">{formatCurrency(totalEvalAmount)}</div>
                      </div>
                      <div className="bg-blue-600 bg-opacity-30 px-3 py-2 rounded">
                        <div className="text-xs opacity-80">원금</div>
                        <div className="font-medium">{formatCurrency(totalPrincipal)}</div>
                      </div>
                      <div className="bg-blue-600 bg-opacity-30 px-3 py-2 rounded">
                        <div className="text-xs opacity-80">손익</div>
                        <div className={`font-medium ${totalProfitLoss >= 0 ? 'text-green-200' : 'text-red-200'}`}>
                          {formatCurrency(totalProfitLoss)} ({profitRate.toFixed(2)}%)
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 소분류별 섹션 */}
              {Object.entries(subCategories).map(([subCategory, assets]) => {
                // 소분류별 상세 통계 계산
                const subTotalPrincipal = assets.reduce((sum, asset) => sum + (asset.principal || asset.amount), 0);
                const subTotalEvalAmount = assets.reduce((sum, asset) => sum + (asset.eval_amount || asset.amount), 0);
                const subTotalProfitLoss = subTotalEvalAmount - subTotalPrincipal;
                const subProfitRate = subTotalPrincipal > 0 ? (subTotalProfitLoss / subTotalPrincipal) * 100 : 0;

                return (
                <div key={`${category}-${subCategory}`}>
                  {/* 소분류 헤더 */}
                  <div className="bg-gray-100 dark:bg-gray-700 px-6 py-3 border-t border-gray-200 dark:border-gray-600">
                    <div className="flex justify-between items-center">
                      <h4 className="text-md font-medium text-gray-800 dark:text-gray-200">{subCategory}</h4>
                      <div className="text-gray-600 dark:text-gray-400 text-sm">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          <div className="bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded text-center">
                            <div className="text-xs opacity-80">종목 수</div>
                            <div className="font-medium">{assets.length}개</div>
                          </div>
                          <div className="bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded text-center">
                            <div className="text-xs opacity-80">현재가치</div>
                            <div className="font-medium">{formatCurrency(subTotalEvalAmount)}</div>
                          </div>
                          <div className="bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded text-center">
                            <div className="text-xs opacity-80">원금</div>
                            <div className="font-medium">{formatCurrency(subTotalPrincipal)}</div>
                          </div>
                          <div className="bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded text-center">
                            <div className="text-xs opacity-80">손익</div>
                            <div className={`font-medium ${subTotalProfitLoss >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                              {formatCurrency(subTotalProfitLoss)} ({subProfitRate.toFixed(2)}%)
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

            {/* 테이블 */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">종목명</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">소분류</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">수량</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">평균가</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">원금</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">평가금액</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">손익</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">수익률</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">등록일</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">메모</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">관리</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {assets.map((asset) => (
                    <tr key={asset.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {asset.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 rounded-full">
                          {asset.sub_category || '기타'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300 text-right">
                        {asset.quantity ? formatNumber(asset.quantity) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300 text-right">
                        {asset.avg_price ? formatCurrency(asset.avg_price) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300 text-right">
                        {formatCurrency(asset.principal || asset.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white text-right font-medium">
                        {formatCurrency(asset.eval_amount || asset.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                        <span className={`${asset.profit_loss >= 0 ? 'text-green-600' : 'text-red-600'} font-medium`}>
                          {formatCurrency(asset.profit_loss)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                        <span className={`${asset.profit_rate >= 0 ? 'text-green-600' : 'text-red-600'} font-medium`}>
                          {asset.profit_rate ? asset.profit_rate.toFixed(2) : '0.00'}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        {new Date(asset.date).toLocaleDateString('ko-KR')}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300 max-w-xs truncate">
                        {asset.note || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => handleEditAsset(asset)}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 transition-colors duration-200"
                            title={`${asset.name} 수정`}
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteAsset(asset.id, asset.name)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 transition-colors duration-200"
                            title={`${asset.name} 삭제`}
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
                </div>
                );
              })}
            </div>
          );
        })}

        {filteredAssets.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">선택한 필터에 해당하는 자산이 없습니다.</p>
          </div>
        )}
      </div>

      {/* 수정 모달 */}
      {editingAsset && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              자산 수정: {editingAsset.name}
            </h3>

            <div className="space-y-4">
              {/* 자산군 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  자산군 *
                </label>
                <select
                  value={editForm.asset_type || ''}
                  onChange={(e) => setEditForm({...editForm, asset_type: e.target.value, sub_category: null})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                >
                  <option value="">자산군 선택</option>
                  <option value="즉시현금">즉시현금</option>
                  <option value="예치자산">예치자산</option>
                  <option value="투자자산">투자자산</option>
                  <option value="대체투자">대체투자</option>
                </select>
              </div>

              {/* 소분류 */}
              {editForm.asset_type && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    소분류
                  </label>
                  <select
                    value={editForm.sub_category || ''}
                    onChange={(e) => setEditForm({...editForm, sub_category: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">소분류 선택</option>
                    {editForm.asset_type === '즉시현금' && (
                      <>
                        <option value="현금">현금</option>
                        <option value="입출금통장">입출금통장</option>
                        <option value="증권예수금">증권예수금</option>
                      </>
                    )}
                    {editForm.asset_type === '예치자산' && (
                      <>
                        <option value="예금">예금</option>
                        <option value="적금">적금</option>
                        <option value="MMF">MMF</option>
                      </>
                    )}
                    {editForm.asset_type === '투자자산' && (
                      <>
                        <option value="국내주식">국내주식</option>
                        <option value="해외주식">해외주식</option>
                        <option value="펀드">펀드</option>
                        <option value="ETF">ETF</option>
                        <option value="채권">채권</option>
                      </>
                    )}
                    {editForm.asset_type === '대체투자' && (
                      <>
                        <option value="암호화폐">암호화폐</option>
                        <option value="부동산">부동산</option>
                        <option value="원자재">원자재</option>
                      </>
                    )}
                  </select>
                </div>
              )}

              {/* 종목명 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  종목명 *
                </label>
                <input
                  type="text"
                  value={editForm.name || ''}
                  onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>

              {/* 수량 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  수량
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={editForm.quantity || ''}
                  onChange={(e) => setEditForm({...editForm, quantity: e.target.value === '' ? null : e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              {/* 평균가 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  평균가
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={editForm.avg_price || ''}
                  onChange={(e) => setEditForm({...editForm, avg_price: e.target.value === '' ? null : e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              {/* 원금 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  원금
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={editForm.principal || ''}
                  onChange={(e) => setEditForm({...editForm, principal: e.target.value === '' ? null : e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              {/* 평가금액 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  평가금액
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={editForm.eval_amount || ''}
                  onChange={(e) => setEditForm({...editForm, eval_amount: e.target.value === '' ? null : e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              {/* 매수일 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  매수일 *
                </label>
                <input
                  type="date"
                  value={editForm.date || ''}
                  onChange={(e) => setEditForm({...editForm, date: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>

              {/* 메모 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  메모
                </label>
                <textarea
                  value={editForm.note || ''}
                  onChange={(e) => setEditForm({...editForm, note: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  rows={3}
                />
              </div>
            </div>

            {/* 버튼 */}
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={handleCancelEdit}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleUpdateAsset}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
              >
                수정 완료
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}