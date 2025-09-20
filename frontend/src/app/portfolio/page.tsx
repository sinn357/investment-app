'use client';

import { useState } from 'react';
import Navigation from '@/components/Navigation';
import PortfolioForm from '@/components/PortfolioForm';
import PortfolioDashboard from '@/components/PortfolioDashboard';

export interface PortfolioItem {
  id: string;
  assetType: string;
  symbol: string;
  title: string;
  createdAt: string;
}

export default function PortfolioPage() {
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);

  const addPortfolioItem = (item: Omit<PortfolioItem, 'id' | 'createdAt'>) => {
    const newItem: PortfolioItem = {
      ...item,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };
    setPortfolioItems(prev => [...prev, newItem]);
  };

  const removePortfolioItem = (id: string) => {
    setPortfolioItems(prev => prev.filter(item => item.id !== id));
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
        <div className="grid lg:grid-cols-2 gap-8">
          {/* 입력 폼 섹션 */}
          <div>
            <PortfolioForm onAddItem={addPortfolioItem} />
          </div>

          {/* 대시보드 섹션 */}
          <div>
            <PortfolioDashboard
              items={portfolioItems}
              onRemoveItem={removePortfolioItem}
            />
          </div>
        </div>
      </main>
    </div>
  );
}