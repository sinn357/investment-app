'use client';

import React from 'react';
import { usePortfolioUIStore } from '../lib/stores/usePortfolioUIStore';

/**
 * Zustand Store 사용 데모 컴포넌트
 * 포트폴리오 필터 및 정렬 상태를 Zustand로 관리
 */
export default function PortfolioFilters() {
  const {
    selectedCategory,
    setSelectedCategory,
    sortBy,
    setSortBy,
    sortOrder,
    toggleSortOrder,
    resetFilters,
  } = usePortfolioUIStore();

  const categories = ['전체', '즉시현금', '예치자산', '투자자산', '대체투자'];
  const sortOptions: Array<{ value: 'amount' | 'profit_rate' | 'name'; label: string }> = [
    { value: 'amount', label: '금액순' },
    { value: 'profit_rate', label: '수익률순' },
    { value: 'name', label: '이름순' },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          포트폴리오 필터 (Zustand 데모)
        </h2>
        <button
          onClick={resetFilters}
          className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
        >
          필터 초기화
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 카테고리 필터 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            자산군
          </label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        {/* 정렬 기준 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            정렬 기준
          </label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'amount' | 'profit_rate' | 'name')}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* 정렬 순서 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            정렬 순서
          </label>
          <button
            onClick={toggleSortOrder}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
          >
            {sortOrder === 'asc' ? '오름차순 ↑' : '내림차순 ↓'}
          </button>
        </div>
      </div>

      {/* 현재 상태 표시 */}
      <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-md">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          <strong>현재 설정:</strong> {selectedCategory} | {sortOptions.find(o => o.value === sortBy)?.label} | {sortOrder === 'asc' ? '오름차순' : '내림차순'}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
          💡 이 설정은 localStorage에 자동 저장되어 새로고침 후에도 유지됩니다 (Zustand persist)
        </p>
      </div>
    </div>
  );
}
