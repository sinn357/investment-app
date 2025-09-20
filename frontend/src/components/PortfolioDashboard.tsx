'use client';

import { PortfolioItem } from '@/app/portfolio/page';

interface PortfolioDashboardProps {
  items: PortfolioItem[];
  onRemoveItem: (id: string) => void;
}

export default function PortfolioDashboard({ items, onRemoveItem }: PortfolioDashboardProps) {
  const getAssetTypeLabel = (assetType: string) => {
    const types: { [key: string]: string } = {
      'stock': '주식',
      'bond': '채권',
      'crypto': '암호화폐',
      'etf': 'ETF',
      'real-estate': '부동산',
      'commodity': '원자재',
      'cash': '현금',
      'other': '기타'
    };
    return types[assetType] || assetType;
  };

  const getAssetTypeColor = (assetType: string) => {
    const colors: { [key: string]: string } = {
      'stock': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      'bond': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      'crypto': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
      'etf': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      'real-estate': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      'commodity': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      'cash': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
      'other': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300'
    };
    return colors[assetType] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (items.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          포트폴리오 현황
        </h2>
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">포트폴리오가 비어있습니다</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            새 자산을 추가하여 포트폴리오를 시작하세요.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
        포트폴리오 현황 ({items.length}개)
      </h2>

      <div className="space-y-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${getAssetTypeColor(item.assetType)}`}
                  >
                    {getAssetTypeLabel(item.assetType)}
                  </span>
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    {item.symbol}
                  </h3>
                </div>

                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  {item.title}
                </p>

                <p className="text-xs text-gray-500 dark:text-gray-500">
                  추가일: {formatDate(item.createdAt)}
                </p>
              </div>

              <button
                onClick={() => onRemoveItem(item.id)}
                className="ml-4 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                title="삭제"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}