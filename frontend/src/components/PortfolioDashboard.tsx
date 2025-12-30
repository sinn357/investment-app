'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { LineChart, Line, ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import { useAssets, useDeleteAsset, useUpdateAsset } from '../lib/hooks/usePortfolio';
import { toast } from 'sonner';
import GlassCard from './GlassCard';
import * as XLSX from 'xlsx';

// Dynamic imports로 Oracle 차트 컴포넌트 코드 스플리팅
const OraclePieChart = dynamic(() => import('./charts/OraclePieChart'), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-64"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div></div>
});

const OracleBarChart = dynamic(() => import('./charts/OracleBarChart'), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-64"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div></div>
});

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

  // 부동산 전용 필드
  area_pyeong?: number;
  acquisition_tax?: number;
  rent_type?: string;
  rental_income?: number;
  jeonse_deposit?: number;
  lawyer_fee?: number;
  brokerage_fee?: number;

  // 예금/적금 전용 필드
  maturity_date?: string;
  interest_rate?: number;
  early_withdrawal_fee?: number;

  // MMF/CMA 전용 필드
  current_yield?: number;
  annual_yield?: number;
  minimum_balance?: number;
  withdrawal_fee?: number;

  // 주식/ETF 전용 필드
  dividend_rate?: number;

  // 펀드 전용 필드
  nav?: number;
  management_fee?: number;
}

interface EditFormData {
  asset_type?: string;
  sub_category?: string | null;
  name?: string;
  amount?: string | null;
  quantity?: string | null;
  avg_price?: string | null;
  eval_amount?: string | null;
  principal?: string | null;
  date?: string;
  note?: string;

  // 부동산 전용 필드
  area_pyeong?: string | null;
  acquisition_tax?: string | null;
  rent_type?: string | null;
  rental_income?: string | null;
  jeonse_deposit?: string | null;
  lawyer_fee?: string | null;
  brokerage_fee?: string | null;

  // 예금/적금 전용 필드
  maturity_date?: string | null;
  interest_rate?: string | null;
  early_withdrawal_fee?: string | null;

  // MMF/CMA 전용 필드
  current_yield?: string | null;
  annual_yield?: string | null;
  minimum_balance?: string | null;
  withdrawal_fee?: string | null;

  // 주식/ETF 전용 필드
  dividend_rate?: string | null;

  // 펀드 전용 필드
  nav?: string | null;
  management_fee?: string | null;
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
    total_eval_amount?: number;
    total_profit_loss: number;
    profit_rate: number;
  };
  by_category: { [key: string]: CategorySummary };
}

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
  // TanStack Query로 자산 데이터 조회
  const { data: assets, isLoading: loading, error, refetch: refetchAssets } = useAssets(user.id);
  const deleteAssetMutation = useDeleteAsset(user.id);
  const updateAssetMutation = useUpdateAsset(user.id);

  const [portfolioData, setPortfolioData] = useState<PortfolioData | null>(null);
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

  // TanStack Query로 교체: assets 데이터가 변경되면 portfolioData 계산
  useEffect(() => {
    if (assets) {
      // 백엔드 응답 구조를 기존 portfolioData 형식으로 변환
      // 대분류별 데이터 집계
      const categoryMap: Record<string, { total_principal: number; total_amount: number; count: number; assets: unknown[] }> = {};

      assets.forEach(asset => {
        const category = asset.asset_type || '기타';
        if (!categoryMap[category]) {
          categoryMap[category] = { total_principal: 0, total_amount: 0, count: 0, assets: [] };
        }
        categoryMap[category].total_principal += asset.principal || 0;
        categoryMap[category].total_amount += asset.evaluation_amount || asset.amount || 0;
        categoryMap[category].count += 1;
        categoryMap[category].assets.push(asset);
      });

      // 백분율 계산
      const totalPrincipal = Object.values(categoryMap).reduce((sum, cat) => sum + cat.total_principal, 0);
      const totalAmount = Object.values(categoryMap).reduce((sum, cat) => sum + cat.total_amount, 0);

      const by_category: Record<string, {
        total_principal: number;
        total_amount: number;
        count: number;
        principal_percentage: number;
        percentage: number;
        assets: unknown[];
      }> = {};

      Object.entries(categoryMap).forEach(([category, data]) => {
        by_category[category] = {
          ...data,
          principal_percentage: totalPrincipal > 0 ? (data.total_principal / totalPrincipal) * 100 : 0,
          percentage: totalAmount > 0 ? (data.total_amount / totalAmount) * 100 : 0
        };
      });

      const transformedData: PortfolioData = {
        status: 'success',
        data: assets.map(a => ({
          ...a,
          eval_amount: a.evaluation_amount || null,
          created_at: a.date // date를 created_at으로 매핑
        }) as Asset),
        summary: {
          total_assets: assets.reduce((sum, a) => sum + (a.evaluation_amount || a.amount), 0),
          total_principal: assets.reduce((sum, a) => sum + (a.principal || 0), 0),
          total_profit_loss: assets.reduce((sum, a) => sum + (a.profit_loss || 0), 0),
          profit_rate: 0 // 필요시 계산
        },
        by_category
      };
      setPortfolioData(transformedData);
    }
  }, [assets]);

  const handleDeleteAsset = async (assetId: number, assetName: string) => {
    if (!window.confirm(`정말로 '${assetName}' 자산을 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`)) {
      return;
    }

    try {
      await deleteAssetMutation.mutateAsync(assetId);
      // 성공 시 hooks에서 toast 자동 표시
    } catch (error) {
      // 에러 시 hooks에서 toast 자동 표시
      console.error('Delete error:', error);
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
      amount: asset.amount?.toString() || '',
      quantity: asset.quantity?.toString() || '',
      avg_price: asset.avg_price?.toString() || '',
      principal: asset.principal?.toString() || '',
      eval_amount: asset.eval_amount?.toString() || '',
      date: formattedDate,
      note: asset.note,
      // 소분류별 전용 필드
      area_pyeong: asset.area_pyeong?.toString() || '',
      acquisition_tax: asset.acquisition_tax?.toString() || '',
      rental_income: asset.rental_income?.toString() || '',
      lawyer_fee: asset.lawyer_fee?.toString() || '',
      brokerage_fee: asset.brokerage_fee?.toString() || '',
      maturity_date: asset.maturity_date || '',
      interest_rate: asset.interest_rate?.toString() || '',
      early_withdrawal_fee: asset.early_withdrawal_fee?.toString() || '',
      current_yield: asset.current_yield?.toString() || '',
      annual_yield: asset.annual_yield?.toString() || '',
      minimum_balance: asset.minimum_balance?.toString() || '',
      withdrawal_fee: asset.withdrawal_fee?.toString() || '',
      dividend_rate: asset.dividend_rate?.toString() || '',
      nav: asset.nav?.toString() || '',
      management_fee: asset.management_fee?.toString() || ''
    });
  };

  const handleUpdateAsset = async () => {
    if (!editingAsset) return;

    // 공통 필수 필드 검증
    if (!editForm.asset_type || !editForm.name || !editForm.name.trim() || !editForm.date) {
      toast.error('자산군, 자산명, 날짜는 필수 입력 항목입니다.');
      return;
    }

    // 자산군별 필수 필드 검증
    if (editForm.asset_type === '즉시현금' || editForm.asset_type === '예치자산') {
      if (!editForm.amount) {
        toast.error('보유금액을 입력해주세요.');
        return;
      }
    }

    // 수량/평균가 검증 - 부동산, 원자재는 제외
    const needsQuantityPrice = editForm.asset_type === '투자자산' ||
      (editForm.asset_type === '대체투자' && !['부동산', '원자재'].includes(editForm.sub_category || ''));

    if (needsQuantityPrice && (!editForm.quantity || !editForm.avg_price)) {
      toast.error('보유수량과 매수평균가를 입력해주세요.');
      return;
    }

    // 원금/평가금액 검증 - 투자자산과 대체투자는 모두 필요
    const needsPrincipalEval = editForm.asset_type === '투자자산' || editForm.asset_type === '대체투자';

    if (needsPrincipalEval && (!editForm.principal || !editForm.eval_amount)) {
      toast.error('원금과 평가금액을 입력해주세요.');
      return;
    }

    try {
      await updateAssetMutation.mutateAsync({
        id: editingAsset.id,
        asset_type: editForm.asset_type,
        sub_category: editForm.sub_category || undefined,
        name: editForm.name,
        amount: editForm.amount ? parseFloat(editForm.amount as string) : undefined,
        quantity: editForm.quantity ? parseFloat(editForm.quantity as string) : undefined,
        avg_price: editForm.avg_price ? parseFloat(editForm.avg_price as string) : undefined,
        principal: editForm.principal ? parseFloat(editForm.principal as string) : undefined,
        evaluation_amount: editForm.eval_amount ? parseFloat(editForm.eval_amount as string) : undefined,
        date: editForm.date,
        note: editForm.note || '',
        // 소분류별 전용 필드
        area_pyeong: editForm.area_pyeong ? parseFloat(editForm.area_pyeong as string) : undefined,
        acquisition_tax: editForm.acquisition_tax ? parseFloat(editForm.acquisition_tax as string) : undefined,
        rent_type: editForm.rent_type || 'monthly',
        rental_income: editForm.rental_income ? parseFloat(editForm.rental_income as string) : undefined,
        jeonse_deposit: editForm.jeonse_deposit ? parseFloat(editForm.jeonse_deposit as string) : undefined,
        lawyer_fee: editForm.lawyer_fee ? parseFloat(editForm.lawyer_fee as string) : undefined,
        brokerage_fee: editForm.brokerage_fee ? parseFloat(editForm.brokerage_fee as string) : undefined,
        maturity_date: editForm.maturity_date || undefined,
        interest_rate: editForm.interest_rate ? parseFloat(editForm.interest_rate as string) : undefined,
        early_withdrawal_fee: editForm.early_withdrawal_fee ? parseFloat(editForm.early_withdrawal_fee as string) : undefined,
        current_yield: editForm.current_yield ? parseFloat(editForm.current_yield as string) : undefined,
        annual_yield: editForm.annual_yield ? parseFloat(editForm.annual_yield as string) : undefined,
        minimum_balance: editForm.minimum_balance ? parseFloat(editForm.minimum_balance as string) : undefined,
        withdrawal_fee: editForm.withdrawal_fee ? parseFloat(editForm.withdrawal_fee as string) : undefined,
        dividend_rate: editForm.dividend_rate ? parseFloat(editForm.dividend_rate as string) : undefined,
        nav: editForm.nav ? parseFloat(editForm.nav as string) : undefined,
        management_fee: editForm.management_fee ? parseFloat(editForm.management_fee as string) : undefined
      });

      // 성공 시 hooks에서 toast 자동 표시
      setEditingAsset(null);
      setEditForm({});
    } catch (error) {
      // 에러 시 hooks에서 toast 자동 표시
      console.error('Update error:', error);
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
  }, [user.id, user.token]);

  useEffect(() => {
    // useAssets hook이 자동으로 데이터 페칭하므로 fetchPortfolioData 제거
    fetchGoalSettings();
  }, [fetchGoalSettings]); // user.id 변경 시 목표 설정 새로고침

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
      if (result.status !== 'success') {
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

  // 엑셀 추출 함수
  const exportToExcel = () => {
    if (!portfolioData) {
      toast.error('포트폴리오 데이터가 없습니다.');
      return;
    }

    const workbook = XLSX.utils.book_new();
    const worksheetData: unknown[][] = [];

    // 헤더 행
    worksheetData.push([
      '자산명',
      '대분류',
      '소분류',
      '보유수량',
      '매수평균가',
      '투자원금',
      '현재가치',
      '손익',
      '수익률(%)',
      '등록일',
      '메모'
    ]);

    // 대분류별 데이터 및 소계
    const categories = Object.keys(portfolioData.by_category).sort();
    categories.forEach((category) => {
      const categoryAssets = portfolioData.data.filter(a => a.asset_type === category);
      const categoryData = portfolioData.by_category[category];

      // 자산 데이터
      categoryAssets.forEach((asset) => {
        worksheetData.push([
          asset.name,
          asset.asset_type,
          asset.sub_category || '-',
          asset.quantity ? formatNumber(asset.quantity) : '-',
          asset.avg_price ? formatNumber(asset.avg_price) : '-',
          formatNumber(asset.principal || 0),
          formatNumber(asset.eval_amount || asset.amount),
          formatNumber(asset.profit_loss),
          asset.profit_rate.toFixed(2),
          new Date(asset.date).toLocaleDateString('ko-KR'),
          asset.note || '-'
        ]);
      });

      // 소계 행
      worksheetData.push([
        `${category} 소계`,
        '',
        '',
        '',
        '',
        formatNumber(categoryData.total_principal || 0),
        formatNumber(categoryData.total_eval_amount || categoryData.total_amount),
        '',
        '',
        '',
        ''
      ]);
    });

    // 빈 행
    worksheetData.push([]);

    // 전체 합계 행
    worksheetData.push([
      '전체 합계',
      '',
      '',
      '',
      '',
      formatNumber(portfolioData.summary.total_principal),
      formatNumber(portfolioData.summary.total_assets),
      formatNumber(portfolioData.summary.total_profit_loss),
      portfolioData.summary.profit_rate.toFixed(2),
      '',
      ''
    ]);

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

    // 컬럼 너비 설정
    worksheet['!cols'] = [
      { wch: 20 }, // 자산명
      { wch: 12 }, // 대분류
      { wch: 12 }, // 소분류
      { wch: 12 }, // 보유수량
      { wch: 14 }, // 매수평균가
      { wch: 16 }, // 투자원금
      { wch: 16 }, // 현재가치
      { wch: 16 }, // 손익
      { wch: 12 }, // 수익률
      { wch: 14 }, // 등록일
      { wch: 20 }  // 메모
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, '포트폴리오');
    XLSX.writeFile(workbook, `포트폴리오_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('엑셀 파일이 다운로드되었습니다.');
  };

  // 소분류별 맞춤 컬럼 정의
  const getSubCategoryColumns = (subCategory: string | null): Array<{
    key: string;
    label: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    format: (val: any) => string;
  }> => {
    const subCat = subCategory?.toLowerCase();

    switch (subCat) {
      case '부동산':
      case 'real-estate':
        return [
          { key: 'area_pyeong', label: '면적(평)', format: (val: number) => `${formatNumber(val)}평` },
          { key: 'acquisition_tax', label: '취득세', format: formatCurrency },
          { key: 'lawyer_fee', label: '법무사비용', format: formatCurrency },
          { key: 'brokerage_fee', label: '중개비', format: formatCurrency },
          { key: 'rent_type', label: '임대형태', format: (val: string) => val === 'jeonse' ? '전세' : '월세' },
          { key: 'rental_income', label: '임대수익', format: formatCurrency },
          { key: 'jeonse_deposit', label: '전세보증금', format: formatCurrency }
        ];
      case '예금':
      case 'savings':
      case '적금':
      case 'installment-savings':
        return [
          { key: 'maturity_date', label: '만기일', format: (val: string) => new Date(val).toLocaleDateString('ko-KR') },
          { key: 'interest_rate', label: '연이율', format: (val: number) => `${val}%` },
          { key: 'early_withdrawal_fee', label: '중도해지수수료', format: formatCurrency }
        ];
      case 'mmf':
        return [
          { key: 'current_yield', label: '현재수익률', format: (val: number) => `${val}%` },
          { key: 'annual_yield', label: '연환산수익률', format: (val: number) => `${val}%` },
          { key: 'minimum_balance', label: '최소유지잔고', format: formatCurrency },
          { key: 'withdrawal_fee', label: '출금수수료', format: formatCurrency }
        ];
      case '국내주식':
      case 'domestic-stock':
      case '해외주식':
      case 'foreign-stock':
      case 'etf':
        return [
          { key: 'dividend_rate', label: '배당율', format: (val: number) => `${val}%` }
        ];
      case '펀드':
      case 'fund':
        return [
          { key: 'nav', label: '기준가격', format: formatCurrency },
          { key: 'management_fee', label: '운용보수', format: (val: number) => `${val}%` }
        ];
      case '현금':
      case 'cash':
      case '입출금통장':
      case 'checking-account':
      case '증권예수금':
      case 'securities-deposit':
        return [
          { key: 'interest_rate', label: '연이율', format: (val: number) => `${val}%` }
        ];
      case '암호화폐':
      case 'cryptocurrency':
      case '원자재':
      case 'commodity':
      default:
        return [];
    }
  };

  // 소분류별로 수량×평균가 표시 여부 결정
  const shouldShowQuantityPrice = (subCategory: string | null) => {
    const subCat = subCategory?.toLowerCase();
    return ['국내주식', 'domestic-stock', '해외주식', 'foreign-stock', 'etf', '펀드', 'fund', '암호화폐', 'cryptocurrency'].includes(subCat || '');
  };

  // 날짜 컬럼 라벨 결정
  const getDateLabel = (subCategory: string | null) => {
    const subCat = subCategory?.toLowerCase();
    if (['예금', '적금', 'mmf', 'cma', '현금', '입출금통장', '증권예수금', '부동산'].includes(subCat || '')) {
      return '개설일자';
    }
    return '매수일자';
  };

  // 소분류별 전용 필드 반환
  const getEditSubCategorySpecificFields = (subCategory: string | null) => {
    const subCat = subCategory?.toLowerCase();
    switch (subCat) {
      // 부동산
      case '부동산':
      case 'real-estate':
        return ['area_pyeong', 'acquisition_tax', 'lawyer_fee', 'brokerage_fee', 'rent_type', 'rental_income', 'jeonse_deposit'];
      // 예금/적금
      case '예금':
      case 'savings':
      case '적금':
      case 'installment-savings':
        return ['maturity_date', 'interest_rate', 'early_withdrawal_fee'];
      // MMF
      case 'mmf':
        return ['current_yield', 'annual_yield', 'minimum_balance', 'withdrawal_fee'];
      // 입출금통장, 증권예수금 - 연이율만
      case '입출금통장':
      case 'checking-account':
      case '증권예수금':
      case 'securities-deposit':
        return ['interest_rate'];
      // 주식/ETF - 배당율
      case '국내주식':
      case 'domestic-stock':
      case '해외주식':
      case 'foreign-stock':
      case 'etf':
        return ['dividend_rate'];
      // 펀드 - 기준가격, 운용보수
      case '펀드':
      case 'fund':
        return ['nav', 'management_fee'];
      // 암호화폐, 원자재, 채권, 현금 등은 전용 필드 없음
      default:
        return [];
    }
  };

  // 필드 설정 정보 반환
  const getEditFieldConfig = (fieldName: string) => {
    const configs: Record<string, { label: string; placeholder: string; step?: string; type?: string }> = {
      area_pyeong: { label: '면적(평)', placeholder: '25.5', step: '0.1' },
      acquisition_tax: { label: '취득세', placeholder: '15000000' },
      lawyer_fee: { label: '법무사 비용', placeholder: '1500000' },
      brokerage_fee: { label: '중개비', placeholder: '3000000' },
      rent_type: { label: '임대형태', placeholder: '', type: 'select' },
      rental_income: { label: '월 임대수익', placeholder: '2000000' },
      jeonse_deposit: { label: '전세보증금', placeholder: '500000000' },
      maturity_date: { label: '만기일', placeholder: '', type: 'date' },
      interest_rate: { label: '연이율(%)', placeholder: '3.5', step: '0.01' },
      early_withdrawal_fee: { label: '중도해지수수료', placeholder: '50000' },
      current_yield: { label: '현재수익률(%)', placeholder: '2.8', step: '0.01' },
      annual_yield: { label: '연환산수익률(%)', placeholder: '3.2', step: '0.01' },
      minimum_balance: { label: '최소유지잔고', placeholder: '1000000' },
      withdrawal_fee: { label: '출금수수료', placeholder: '1000' },
      dividend_rate: { label: '배당율(%)', placeholder: '2.5', step: '0.01' },
      nav: { label: '기준가격', placeholder: '10500' },
      management_fee: { label: '운용보수(%)', placeholder: '0.8', step: '0.01' }
    };
    return configs[fieldName] || { label: fieldName, placeholder: '' };
  };

  // ✅ 성능 최적화: useCallback → useMemo (값을 반환하므로 캐싱이 더 효율적)
  const filteredAssets = useMemo(() => {
    if (!portfolioData) return [];

    let filtered = [...portfolioData.data];

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
  }, [portfolioData, selectedCategory, sortBy, sortOrder]);

  // ✅ 성능 최적화: useCallback → useMemo (값을 반환하므로 캐싱이 더 효율적)
  const groupedAssets = useMemo(() => {
    const grouped: Record<string, Record<string, typeof filteredAssets>> = {};

    filteredAssets.forEach(asset => {
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
  }, [filteredAssets]);

  // ✅ 성능 최적화: useMemo로 차트 데이터 캐싱 (chartViewType, subViewType, portfolioData, groupedAssets 변경 시에만 재계산)
  const pieChartData = useMemo(() => {
    if (!portfolioData) return [];

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
  }, [portfolioData, chartViewType, subViewType, groupedAssets]);

  // ✅ 성능 최적화: useMemo로 차트 데이터 캐싱
  const barChartData = useMemo(() => {
    if (!portfolioData) return [];

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
  }, [portfolioData, chartViewType, subViewType, groupedAssets]);

  // 포트폴리오 히스토리 상태 및 함수들
  const [historyData, setHistoryData] = useState<Array<{
    timestamp: string;
    total_assets: number;
    total_principal: number;
    total_eval_amount: number;
    change_type: string;
    change_amount: number;
    asset_name?: string;
    notes?: string;
  }>>([]);
  const [timeRange, setTimeRange] = useState<'annual' | 'monthly' | 'daily'>('daily');
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());

  // 접기/펼치기 상태 관리 (디폴트는 모두 펼쳐짐)
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [expandedSubCategories, setExpandedSubCategories] = useState<Record<string, boolean>>({});

  const fetchPortfolioHistory = async (range: 'annual' | 'monthly' | 'daily', start?: string, end?: string) => {
    if (!localStorage.getItem('userId')) return;

    setIsLoadingHistory(true);
    try {
      const userId = localStorage.getItem('userId');
      let url = `https://investment-app-backend-x166.onrender.com/api/portfolio-history?user_id=${userId}&time_range=${range}`;

      if (start) url += `&start_date=${start}`;
      if (end) url += `&end_date=${end}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'success') {
        setHistoryData(data.data || []);
      } else {
        console.error('Failed to fetch portfolio history:', data.message);
        setHistoryData([]);
      }
    } catch (error) {
      console.error('Error fetching portfolio history:', error);
      setHistoryData([]);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // 컴포넌트 마운트 시 및 timeRange 변경 시 데이터 가져오기
  useEffect(() => {
    fetchPortfolioHistory(timeRange);
  }, [timeRange]);

  // 포트폴리오 데이터 로드 시 모든 항목을 펼친 상태로 초기화
  useEffect(() => {
    if (portfolioData) {
      const categoryExpanded: Record<string, boolean> = {};
      const subCategoryExpanded: Record<string, boolean> = {};

      Object.keys(groupedAssets).forEach(category => {
        categoryExpanded[category] = true; // 대분류 모두 펼침
        Object.keys(groupedAssets[category]).forEach(subCategory => {
          subCategoryExpanded[`${category}-${subCategory}`] = true; // 소분류 모두 펼침
        });
      });

      setExpandedCategories(categoryExpanded);
      setExpandedSubCategories(subCategoryExpanded);
    }
  }, [portfolioData, groupedAssets]);

  // 대분류 접기/펼치기 토글
  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  // 소분류 접기/펼치기 토글
  const toggleSubCategory = (category: string, subCategory: string) => {
    const key = `${category}-${subCategory}`;
    setExpandedSubCategories(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // 모든 항목 펼치기/접기
  const toggleAllExpanded = useCallback(() => {
    const allExpanded = Object.keys(expandedCategories).every(key => expandedCategories[key]);

    const categoryExpanded: Record<string, boolean> = {};
    const subCategoryExpanded: Record<string, boolean> = {};

    Object.keys(groupedAssets).forEach(category => {
      categoryExpanded[category] = !allExpanded; // 전체 상태 반전
      Object.keys(groupedAssets[category]).forEach(subCategory => {
        subCategoryExpanded[`${category}-${subCategory}`] = !allExpanded;
      });
    });

    setExpandedCategories(categoryExpanded);
    setExpandedSubCategories(subCategoryExpanded);
  }, [expandedCategories, groupedAssets]);

  const getAssetFlowData = () => {
    // 포트폴리오 자산들을 등록일 기준으로 정렬하여 실제 자산흐름 생성
    if (!portfolioData?.data || portfolioData.data.length === 0) {
      return [];
    }

    // 자산들을 등록일 기준으로 정렬
    const sortedAssets = [...portfolioData.data].sort((a, b) =>
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const data: Array<{
      time: string;
      amount: number;
      total_principal: number;
      total_eval_amount: number;
      asset_name: string;
      change_type: string;
    }> = [];
    let cumulativePrincipal = 0;
    let cumulativeEvalAmount = 0;

    // 각 자산의 등록일을 기준으로 누적 자산흐름 생성
    sortedAssets.forEach((asset) => {
      const assetDate = new Date(asset.date);
      cumulativePrincipal += asset.principal || asset.amount || 0;
      cumulativeEvalAmount += asset.eval_amount || asset.amount || 0;

      data.push({
        time: timeRange === 'annual'
          ? assetDate.toLocaleDateString('ko-KR', { year: 'numeric', month: 'short' })
          : timeRange === 'monthly'
          ? assetDate.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
          : assetDate.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }),
        amount: cumulativeEvalAmount,
        total_principal: cumulativePrincipal,
        total_eval_amount: cumulativeEvalAmount,
        asset_name: asset.name,
        change_type: 'add'
      });
    });

    // 히스토리 데이터가 있으면 추가로 반영
    if (historyData.length > 0) {
      const historyItems = historyData.map(entry => ({
        time: new Date(entry.timestamp).toLocaleDateString('ko-KR',
          timeRange === 'annual'
            ? { year: 'numeric', month: 'short' }
            : timeRange === 'monthly'
            ? { month: 'short', day: 'numeric' }
            : { month: 'short', day: 'numeric', hour: '2-digit' }
        ),
        amount: entry.total_eval_amount || entry.total_assets,
        total_principal: entry.total_principal,
        total_eval_amount: entry.total_eval_amount,
        change_type: entry.change_type,
        asset_name: entry.asset_name,
        notes: entry.notes,
      }));

      // 자산 등록 데이터와 히스토리 데이터 합치기
      return [...data, ...historyItems].sort((a, b) =>
        new Date(a.time).getTime() - new Date(b.time).getTime()
      );
    }

    return data;
  };

  const navigateTime = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (timeRange === 'annual') {
      newDate.setFullYear(newDate.getFullYear() + (direction === 'next' ? 1 : -1));
    } else if (timeRange === 'monthly') {
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    } else {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    }
    setCurrentDate(newDate);

    // 날짜 범위 설정하여 새로운 데이터 가져오기
    if (timeRange !== 'daily') {
      const start = timeRange === 'annual'
        ? `${newDate.getFullYear()}-01-01`
        : `${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, '0')}-01`;

      const end = timeRange === 'annual'
        ? `${newDate.getFullYear()}-12-31`
        : `${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, '0')}-${new Date(newDate.getFullYear(), newDate.getMonth() + 1, 0).getDate()}`;

      fetchPortfolioHistory(timeRange, start, end);
    }
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
    console.error('[PortfolioDashboard] Error state:', { error, userId: user?.id });
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="text-center">
          <div className="text-red-500 text-lg font-medium mb-2">오류 발생</div>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error.message}</p>
          <p className="text-xs text-gray-500 dark:text-gray-600 mb-4">User ID: {user?.id || 'undefined'}</p>
          <button
            onClick={() => refetchAssets()}
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

  // ✅ 성능 최적화: 이미 useMemo로 정의된 변수들 사용 (중복 계산 제거)
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
        {/* 헤더 + 엑셀 추출 버튼 */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            💼 포트폴리오 요약
          </h2>
          <button
            onClick={exportToExcel}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary to-secondary text-white rounded-lg hover:opacity-90 transition-opacity font-medium"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Excel 추출
          </button>
        </div>

        {/* 요약 카드 - 5개 블록 */}
        <div className="grid grid-cols-2 md:grid-cols-2 xl:grid-cols-5 gap-3">
          <GlassCard className="p-3 md:p-4" animate animationDelay={0}>
            <h3 className="text-xs font-medium text-muted-foreground">총 자산</h3>
            <p className="text-lg md:text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              {formatCurrency(portfolioData.summary.total_assets)}
            </p>
          </GlassCard>

          <GlassCard className="p-3 md:p-4" animate animationDelay={100}>
            <h3 className="text-xs font-medium text-muted-foreground">총 투자원금</h3>
            <p className="text-lg md:text-xl font-bold text-foreground">
              {formatCurrency(totalInvestmentPrincipal)}
            </p>
          </GlassCard>

          <GlassCard className="p-3 md:p-4" animate animationDelay={200}>
            <h3 className="text-xs font-medium text-muted-foreground">투자현금</h3>
            <p className="text-lg md:text-xl font-bold text-foreground">
              {formatCurrency(totalInvestmentCash)}
            </p>
          </GlassCard>

          <GlassCard className="p-3 md:p-4" animate animationDelay={300} glow={portfolioData.summary.total_profit_loss > 0}>
            <h3 className="text-xs font-medium text-muted-foreground">총 손익</h3>
            <p className={`text-lg md:text-xl font-bold ${portfolioData.summary.total_profit_loss >= 0 ? 'text-secondary' : 'text-red-500'}`}>
              {formatCurrency(portfolioData.summary.total_profit_loss)}
            </p>
          </GlassCard>

          <GlassCard className="p-3 md:p-4" animate animationDelay={400} glow={portfolioData.summary.profit_rate > 0}>
            <h3 className="text-xs font-medium text-muted-foreground">수익률</h3>
            <p className={`text-lg md:text-xl font-bold ${portfolioData.summary.profit_rate >= 0 ? 'text-secondary' : 'text-red-500'}`}>
              {portfolioData.summary.profit_rate.toFixed(2)}%
            </p>
          </GlassCard>
        </div>

        {/* 전체 목표 달성률 */}
        <GlassCard className="p-5" animate animationDelay={500} glow={progressRate >= 100}>
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <span className="text-2xl">🎯</span> 전체 목표 달성률
          </h3>

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
        </GlassCard>

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
            {subCategoryGoalProgress.map(({ mainCategory, subCategory, current, goal, progressRate, progressColor, daysUntilTarget }) => {
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
        {/* 실시간 자산 흐름 추적 차트 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          {/* 헤더: 제목 + 설명 아이콘 */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                포트폴리오 자산 흐름
              </h3>
              <div className="group relative">
                <svg className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
                {/* 설명 툴팁 */}
                <div className="invisible group-hover:visible absolute z-10 w-64 px-3 py-2 text-sm text-white bg-gray-900 rounded-lg shadow-lg -top-2 left-6">
                  <div className="mb-1 font-medium">자산 흐름 추적</div>
                  <div className="text-xs text-gray-300">
                    • <span className="font-medium">연간</span>: 월별 마지막 일 데이터<br/>
                    • <span className="font-medium">월간</span>: 일별 마지막 데이터<br/>
                    • <span className="font-medium">일간</span>: 실시간 변경사항<br/>
                    자산 추가/수정/삭제 시 자동 추적됩니다.
                  </div>
                  <div className="absolute w-2 h-2 bg-gray-900 transform rotate-45 -left-1 top-4"></div>
                </div>
              </div>
            </div>
            {isLoadingHistory && (
              <div className="text-sm text-gray-500">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-500 inline" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                데이터 로딩 중...
              </div>
            )}
          </div>

          {/* 시간 범위 탭 */}
          <div className="mb-4">
            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              {(['annual', 'monthly', 'daily'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`flex-1 px-3 py-1.5 text-sm rounded transition-colors ${
                    timeRange === range
                      ? 'bg-blue-500 text-white'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {range === 'annual' ? '연간' : range === 'monthly' ? '월간' : '일간'}
                </button>
              ))}
            </div>
          </div>

          {/* 히스토리 네비게이션 (월간/일간에서만 표시) */}
          {timeRange !== 'daily' && (
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => navigateTime('prev')}
                className="flex items-center px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
                이전
              </button>
              <div className="font-medium text-gray-900 dark:text-white">
                {timeRange === 'annual'
                  ? `${currentDate.getFullYear()}년`
                  : `${currentDate.getFullYear()}년 ${currentDate.getMonth() + 1}월`}
              </div>
              <button
                onClick={() => navigateTime('next')}
                className="flex items-center px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                다음
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}

          {/* 차트 */}
          <ResponsiveContainer width="100%" height={250} className="md:h-[300px]">
            <LineChart data={assetFlowData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`} />
              <Tooltip
                formatter={(value: number, name: string) => [
                  formatCurrency(value),
                  name === 'amount' ? '현재가치' : name === 'total_principal' ? '원금' : name
                ]}
                labelFormatter={(label) => `시점: ${label}`}
              />
              <Line
                type="step"
                dataKey="amount"
                stroke="#3B82F6"
                strokeWidth={2}
                dot={timeRange === 'daily'}
                name="현재가치"
              />
              {historyData.length > 0 && (
                <Line
                  type="step"
                  dataKey="total_principal"
                  stroke="#10B981"
                  strokeWidth={1}
                  strokeDasharray="5 5"
                  dot={false}
                  name="원금"
                />
              )}
            </LineChart>
          </ResponsiveContainer>

          {/* 데이터 요약 정보 */}
          <div className="mt-4 flex justify-between text-sm text-gray-600 dark:text-gray-400">
            <div>
              {assetFlowData.length > 0 ? `총 ${assetFlowData.length}건의 자산 등록/변경` : '자산 데이터가 없습니다'}
            </div>
            <div>
              {timeRange === 'annual' ? '연간 추이' : timeRange === 'monthly' ? '월간 추이' : '실시간 추적'}
            </div>
          </div>
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
              <h4 className="text-sm font-medium text-muted-foreground mb-2 text-center">구성 비중</h4>
              <OraclePieChart
                data={pieChartData.map(item => ({ name: item.name, value: item.value }))}
                donut
                height={200}
              />
            </div>

            {/* 막대 차트 - 원금 */}
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2 text-center">투자 원금</h4>
              <OracleBarChart
                data={barChartData}
                xKey="name"
                yKeys={[{ key: 'amount', name: '투자 원금' }]}
                height={200}
              />
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
              onClick={() => refetchAssets()}
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
              title="새로고침"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            <button
              onClick={toggleAllExpanded}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md transition-colors"
              title="전체 접기/펼치기"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l4 4m8-4v4m0-4h-4m4 0l-4 4M4 16v4m0 0h4m-4 0l4-4m8 4l-4-4m4 0v-4m0 4h-4" />
              </svg>
              {Object.keys(expandedCategories).every(key => expandedCategories[key]) ? '모두 접기' : '모두 펼치기'}
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
                  <div className="flex items-center space-x-3">
                    <h3 className="text-lg font-semibold text-white">{category}</h3>
                    <button
                      onClick={() => toggleCategory(category)}
                      className="text-white hover:text-blue-200 transition-colors p-1"
                    >
                      <svg
                        className={`w-5 h-5 transform transition-transform ${expandedCategories[category] ? 'rotate-180' : ''}`}
                        fill="none" stroke="currentColor" viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
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

              {/* 대분류 내용 (접기/펼치기) */}
              {expandedCategories[category] && (
                <div>
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
                      <div className="flex items-center space-x-2">
                        <h4 className="text-md font-medium text-gray-800 dark:text-gray-200">{subCategory}</h4>
                        <button
                          onClick={() => toggleSubCategory(category, subCategory)}
                          className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors p-1"
                        >
                          <svg
                            className={`w-4 h-4 transform transition-transform ${expandedSubCategories[`${category}-${subCategory}`] ? 'rotate-180' : ''}`}
                            fill="none" stroke="currentColor" viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </div>
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

                  {/* 소분류 테이블 (접기/펼치기) */}
                  {expandedSubCategories[`${category}-${subCategory}`] && (
                    <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">종목명</th>
                    {/* 수량×평균가는 투자자산만 표시 */}
                    {shouldShowQuantityPrice(subCategory) && (
                      <>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">수량</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">평균가</th>
                      </>
                    )}
                    {/* 소분류별 맞춤 컬럼들 */}
                    {getSubCategoryColumns(subCategory).map((col) => (
                      <th key={col.key} className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        {col.label}
                      </th>
                    ))}
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">평가금액</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">원금</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">손익</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">수익률</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{getDateLabel(subCategory)}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">메모</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">관리</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {assets.map((asset) => (
                    <tr key={asset.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        <div className="flex items-center gap-2">
                          {/* 등록일 툴팁 아이콘 */}
                          <div className="group relative">
                            <svg className="w-4 h-4 text-gray-400 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            <div className="invisible group-hover:visible absolute bottom-full left-0 mb-2 px-2 py-1 text-xs bg-gray-800 text-white rounded shadow-lg whitespace-nowrap z-10">
                              등록일: {new Date(asset.created_at).toLocaleDateString('ko-KR')}
                            </div>
                          </div>
                          {asset.name}
                        </div>
                      </td>

                      {/* 수량×평균가는 투자자산만 표시 */}
                      {shouldShowQuantityPrice(asset.sub_category) && (
                        <>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300 text-right">
                            {asset.quantity ? formatNumber(asset.quantity) : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300 text-right">
                            {asset.avg_price ? formatCurrency(asset.avg_price) : '-'}
                          </td>
                        </>
                      )}

                      {/* 소분류별 맞춤 컬럼들 */}
                      {getSubCategoryColumns(asset.sub_category).map((col) => (
                        <td key={col.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300 text-right">
                          {(() => {
                            const value = asset[col.key as keyof Asset];

                            // 부동산 임대형태별 조건부 렌더링
                            if (asset.sub_category === '부동산') {
                              // 월세인 경우 전세보증금 숨김
                              if (col.key === 'jeonse_deposit' && asset.rent_type === 'monthly') {
                                return '-';
                              }
                              // 전세인 경우 임대수익 숨김
                              if (col.key === 'rental_income' && asset.rent_type === 'jeonse') {
                                return '-';
                              }
                              // 전세인 경우 전세보증금이 있으면 표시
                              if (col.key === 'jeonse_deposit' && asset.rent_type === 'jeonse' && asset.jeonse_deposit) {
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                return col.format(asset.jeonse_deposit as any);
                              }
                            }

                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            return value !== null && value !== undefined ? col.format(value as any) : '-';
                          })()}
                        </td>
                      ))}

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white text-right font-medium">
                        {formatCurrency(asset.eval_amount || asset.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300 text-right">
                        {formatCurrency(asset.principal || asset.amount)}
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
                  )}
                </div>
                );
              })}
                </div>
              )}
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 p-6 pb-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                자산 수정: {editingAsset.name}
              </h3>
            </div>

            <div className="p-6 pt-4">

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

              {/* 자산명/종목명 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  자산명/종목명 *
                </label>
                <input
                  type="text"
                  value={editForm.name || ''}
                  onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>

              {/* 즉시현금/예치자산: 보유금액만 */}
              {(editForm.asset_type === '즉시현금' || editForm.asset_type === '예치자산') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    보유금액 *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editForm.amount || ''}
                    onChange={(e) => setEditForm({...editForm, amount: e.target.value === '' ? null : e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  />
                </div>
              )}

              {/* 투자자산/대체투자: 수량+평균가 (부동산, 원자재 제외) */}
              {(editForm.asset_type === '투자자산' ||
                (editForm.asset_type === '대체투자' && !['부동산', '원자재'].includes(editForm.sub_category || ''))) && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        보유수량 *
                      </label>
                      <input
                        type="number"
                        step="0.001"
                        value={editForm.quantity || ''}
                        onChange={(e) => setEditForm({...editForm, quantity: e.target.value === '' ? null : e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        매수평균가 *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={editForm.avg_price || ''}
                        onChange={(e) => setEditForm({...editForm, avg_price: e.target.value === '' ? null : e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        required
                      />
                    </div>
                  </div>

                </>
              )}

              {/* 원금/평가금액 - 투자자산과 대체투자 */}
              {(editForm.asset_type === '투자자산' || editForm.asset_type === '대체투자') && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        원금 *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={editForm.principal || ''}
                        onChange={(e) => setEditForm({...editForm, principal: e.target.value === '' ? null : e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        평가금액 *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={editForm.eval_amount || ''}
                        onChange={(e) => setEditForm({...editForm, eval_amount: e.target.value === '' ? null : e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        required
                      />
                    </div>
                  </div>

                  {/* 실시간 수익률 표시 */}
                  {(editForm.principal && editForm.eval_amount) && (
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-300">수익/손실:</span>
                          <span className={`font-semibold ${(parseFloat(editForm.eval_amount as string) - parseFloat(editForm.principal as string)) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {(parseFloat(editForm.eval_amount as string) - parseFloat(editForm.principal as string)) >= 0 ? '+' : ''}
                            {(parseFloat(editForm.eval_amount as string) - parseFloat(editForm.principal as string)).toLocaleString()}원
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-300">수익률:</span>
                          <span className={`font-semibold ${((parseFloat(editForm.eval_amount as string) - parseFloat(editForm.principal as string)) / parseFloat(editForm.principal as string) * 100) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {((parseFloat(editForm.eval_amount as string) - parseFloat(editForm.principal as string)) / parseFloat(editForm.principal as string) * 100) >= 0 ? '+' : ''}
                            {((parseFloat(editForm.eval_amount as string) - parseFloat(editForm.principal as string)) / parseFloat(editForm.principal as string) * 100).toFixed(2)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* 날짜 입력 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {(editForm.asset_type === '투자자산' || editForm.asset_type === '대체투자') ? '매수일' : '등록일'} *
                </label>
                <input
                  type="date"
                  value={editForm.date || ''}
                  onChange={(e) => setEditForm({...editForm, date: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>

              {/* 소분류별 전용 필드 */}
              {editForm.sub_category && getEditSubCategorySpecificFields(editForm.sub_category).length > 0 && (
                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    {editForm.sub_category} 전용 정보
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {getEditSubCategorySpecificFields(editForm.sub_category).map((fieldName) => {
                      const config = getEditFieldConfig(fieldName);
                      return (
                        <div key={fieldName}>
                          <label htmlFor={fieldName} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {config.label}
                          </label>
                          {fieldName === 'rent_type' ? (
                            <select
                              id={fieldName}
                              name={fieldName}
                              value={editForm[fieldName as keyof typeof editForm] || 'monthly'}
                              onChange={(e) => setEditForm({...editForm, [fieldName]: e.target.value} as typeof editForm)}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            >
                              <option value="monthly">월세</option>
                              <option value="jeonse">전세</option>
                            </select>
                          ) : (
                            <input
                              type={config.type || "number"}
                              id={fieldName}
                              name={fieldName}
                              value={editForm[fieldName as keyof typeof editForm] || ''}
                              onChange={(e) => setEditForm({...editForm, [fieldName]: e.target.value === '' ? null : e.target.value})}
                              placeholder={config.placeholder}
                              step={config.step}
                              min="0"
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

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
            </div>

            {/* 하단 버튼 - Sticky Footer */}
            <div className="sticky bottom-0 bg-white dark:bg-gray-800 p-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex justify-end gap-3">
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
        </div>
      )}
    </div>
  );
}
