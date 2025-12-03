"use client";

import React, { useState, useMemo } from 'react';

interface GridIndicator {
  id: string;
  name: string;
  nameKo?: string;
  actual: number | string | null;
  previous: number | string;
  forecast?: number | string | null;
  surprise?: number | null;
  category: string;
  reverseColor?: boolean;
}

interface IndicatorTableViewProps {
  indicators: GridIndicator[];
  selectedId?: string;
  onIndicatorClick: (indicator: GridIndicator) => void;
}

const CATEGORY_NAMES: Record<string, string> = {
  business: '경기',
  employment: '고용',
  interest: '금리',
  trade: '무역',
  inflation: '물가',
  policy: '정책',
  credit: '신용',
};

export default function IndicatorTableView({ indicators, selectedId, onIndicatorClick }: IndicatorTableViewProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'surprise' | 'category'>('category');

  // 필터링 및 정렬
  const filteredAndSortedIndicators = useMemo(() => {
    const filtered = selectedCategory === 'all'
      ? indicators
      : indicators.filter(ind => ind.category === selectedCategory);

    // 정렬
    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === 'name') {
        return (a.nameKo || a.name).localeCompare(b.nameKo || b.name, 'ko');
      } else if (sortBy === 'surprise') {
        const aSurprise = Math.abs(a.surprise || 0);
        const bSurprise = Math.abs(b.surprise || 0);
        return bSurprise - aSurprise;
      } else {
        // category
        return a.category.localeCompare(b.category);
      }
    });

    return sorted;
  }, [indicators, selectedCategory, sortBy]);

  // 서프라이즈 색상
  const getSurpriseColor = (surprise: number | null, reverseColor?: boolean) => {
    if (surprise === null || surprise === undefined) return 'text-gray-500';

    const isPositive = surprise > 0;
    const shouldBeGreen = reverseColor ? !isPositive : isPositive;

    if (Math.abs(surprise) < 0.1) return 'text-gray-500';
    return shouldBeGreen ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
  };

  const categories = [
    { value: 'all', label: '전체' },
    ...Object.entries(CATEGORY_NAMES).map(([value, label]) => ({ value, label }))
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* 필터 및 정렬 */}
      <div className="mb-4 flex flex-wrap gap-3 items-center">
        {/* 카테고리 필터 */}
        <div className="flex gap-2">
          {categories.map(cat => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                selectedCategory === cat.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* 정렬 */}
        <div className="ml-auto flex items-center gap-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">정렬:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'name' | 'surprise' | 'category')}
            className="px-3 py-1.5 rounded-lg text-sm bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300"
          >
            <option value="category">카테고리</option>
            <option value="name">이름</option>
            <option value="surprise">서프라이즈</option>
          </select>
        </div>
      </div>

      {/* 테이블 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  카테고리
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  지표명
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  실제값
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  예측값
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  이전값
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  서프라이즈
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredAndSortedIndicators.map((indicator) => (
                <tr
                  key={indicator.id}
                  onClick={() => onIndicatorClick(indicator)}
                  className={`cursor-pointer transition ${
                    selectedId === indicator.id
                      ? 'bg-blue-50 dark:bg-blue-900/20'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                      {CATEGORY_NAMES[indicator.category] || indicator.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                    <div className="flex flex-col">
                      <span>{indicator.nameKo || indicator.name}</span>
                      {indicator.nameKo && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">{indicator.name}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {indicator.actual ?? '-'}
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-gray-600 dark:text-gray-400">
                    {indicator.forecast ?? '-'}
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-gray-600 dark:text-gray-400">
                    {indicator.previous}
                  </td>
                  <td className={`px-4 py-3 text-right text-sm font-semibold ${getSurpriseColor(indicator.surprise, indicator.reverseColor)}`}>
                    {indicator.surprise !== null && indicator.surprise !== undefined
                      ? `${indicator.surprise > 0 ? '+' : ''}${indicator.surprise.toFixed(2)}`
                      : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 총 개수 표시 */}
        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            총 <span className="font-semibold text-gray-900 dark:text-gray-100">{filteredAndSortedIndicators.length}</span>개 지표
          </p>
        </div>
      </div>
    </div>
  );
}
