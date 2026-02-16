'use client';

import { useState, useEffect, useMemo } from 'react';
import Navigation from '@/components/Navigation';
import EnhancedPortfolioForm from '@/components/EnhancedPortfolioForm';
import PortfolioDashboard from '@/components/PortfolioDashboard';
import AuthForm from '@/components/AuthForm';
import { useAssets } from '@/lib/hooks/usePortfolio';
import GlassCard from '@/components/GlassCard';
import AssetAllocationGoal from '@/components/AssetAllocationGoal';

interface User {
  id: number;
  username: string;
  token?: string;
}

interface CategoryData {
  total_amount: number;
  percentage: number;
}

interface PortfolioData {
  by_category: Record<string, CategoryData>;
}

export default function PortfolioPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isFormExpanded, setIsFormExpanded] = useState(false);
  const { data: assets = [] } = useAssets(user?.id ?? 0);

  // 대분류별 비중 계산
  const portfolioData = useMemo<PortfolioData | null>(() => {
    if (assets.length === 0) return null;

    const categoryMap: Record<string, { total_amount: number }> = {
      '즉시현금': { total_amount: 0 },
      '예치자산': { total_amount: 0 },
      '투자자산': { total_amount: 0 },
      '대체투자': { total_amount: 0 },
    };

    // 자산별로 대분류에 합산
    assets.forEach(asset => {
      const category = asset.asset_type || '기타';
      if (categoryMap[category]) {
        categoryMap[category].total_amount += asset.evaluation_amount || asset.amount || 0;
      }
    });

    // 총액 계산
    const totalAmount = Object.values(categoryMap).reduce((sum, cat) => sum + cat.total_amount, 0);

    // 비중 계산
    const by_category: Record<string, CategoryData> = {};
    Object.entries(categoryMap).forEach(([category, data]) => {
      by_category[category] = {
        total_amount: data.total_amount,
        percentage: totalAmount > 0 ? (data.total_amount / totalAmount) * 100 : 0,
      };
    });

    return { by_category };
  }, [assets]);

  useEffect(() => {
    const savedUser = localStorage.getItem('portfolio_user');
    const savedToken = localStorage.getItem('auth_token');

    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        if (savedToken) userData.token = savedToken;

        if (!userData.id) {
          localStorage.removeItem('portfolio_user');
          localStorage.removeItem('auth_token');
          localStorage.removeItem('userId');
          return;
        }

        setUser(userData);
      } catch {
        localStorage.removeItem('portfolio_user');
        localStorage.removeItem('auth_token');
        localStorage.removeItem('userId');
      }
    }
  }, []);

  const handleLogin = (userData: User) => {
    setUser(userData);
    localStorage.setItem('portfolio_user', JSON.stringify(userData));
    if (userData.token) localStorage.setItem('auth_token', userData.token);
  };

  if (!user) {
    return <AuthForm onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 overflow-x-hidden">
        <div className="space-y-6">
          {/* 자산 추가 폼 */}
          <GlassCard className="p-0 overflow-hidden">
            <button
              onClick={() => setIsFormExpanded(!isFormExpanded)}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-primary/5 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{isFormExpanded ? '📝' : '➕'}</span>
                <span className="text-lg font-semibold text-foreground">
                  {isFormExpanded ? '자산 추가 중...' : '새 자산 추가'}
                </span>
              </div>
              <span className={`text-muted-foreground transition-transform ${isFormExpanded ? 'rotate-180' : ''}`}>
                ▼
              </span>
            </button>
            {isFormExpanded && (
              <div className="border-t border-primary/10 p-6">
                <EnhancedPortfolioForm user={user} />
              </div>
            )}
          </GlassCard>

          {/* 포트폴리오 대시보드 */}
          <PortfolioDashboard key={String(user.id)} user={user} showSideInfo />

          {/* 자산 배분 목표 */}
          <AssetAllocationGoal portfolioData={portfolioData} userId={user.id} />
        </div>
      </main>
    </div>
  );
}
