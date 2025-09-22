'use client';

import { useState } from 'react';
import Navigation from '@/components/Navigation';
import EnhancedPortfolioForm from '@/components/EnhancedPortfolioForm';
import PortfolioDashboard from '@/components/PortfolioDashboard';

export interface PortfolioItem {
  id: string;
  assetType: string;
  name: string;
  amount: number;
  quantity?: number;
  avgPrice?: number;
  principal?: number;
  evaluationAmount?: number;
  date: string;
  note?: string;
  createdAt: string;
}

export default function PortfolioPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleAssetAdded = () => {
    // 자산 추가 후 대시보드 새로고침
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />

      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            포트폴리오 관리
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            보유 자산을 체계적으로 관리하세요
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 입력 폼 섹션 - 절반 크기 */}
          <div>
            <EnhancedPortfolioForm onAddItem={handleAssetAdded} />
          </div>

          {/* 대시보드 섹션 - 절반 크기 */}
          <div className="lg:col-span-2">
            <PortfolioDashboard key={refreshKey} />
          </div>
        </div>
      </main>
    </div>
  );
}