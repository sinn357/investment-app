/**
 * IndicatorGrid 컴포넌트
 * Phase 8: 모든 경제지표를 그리드로 표시 (탭 제거)
 * Phase 9: useMemo, useCallback으로 성능 최적화
 */

'use client';

import { useState, useMemo, useCallback } from 'react';
import CompactIndicatorCard from './CompactIndicatorCard';
import { CARD_CLASSES } from '@/styles/theme';

interface Indicator {
  name: string;
  actual: number | string | null;
  previous: number | string;
  surprise?: number | null;
  category: string;
}

interface IndicatorGridProps {
  indicators: Indicator[];
  onIndicatorClick?: (indicator: Indicator) => void;
}

type FilterCategory = 'all' | 'business' | 'employment' | 'interest' | 'trade' | 'inflation' | 'policy';

const CATEGORY_FILTERS = [
  { id: 'all' as FilterCategory, name: '전체', icon: '🌐' },
  { id: 'business' as FilterCategory, name: '경기', icon: '📊' },
  { id: 'employment' as FilterCategory, name: '고용', icon: '👷' },
  { id: 'interest' as FilterCategory, name: '금리', icon: '🏦' },
  { id: 'trade' as FilterCategory, name: '무역', icon: '🚢' },
  { id: 'inflation' as FilterCategory, name: '물가', icon: '💰' },
  { id: 'policy' as FilterCategory, name: '정책', icon: '🏛️' },
];

export default function IndicatorGrid({ indicators, onIndicatorClick }: IndicatorGridProps) {
  const [activeFilter, setActiveFilter] = useState<FilterCategory>('all');

  // 필터링된 지표 (useMemo로 최적화)
  const filteredIndicators = useMemo(() => {
    return activeFilter === 'all'
      ? indicators
      : indicators.filter(ind => ind.category === activeFilter);
  }, [activeFilter, indicators]);

  // 카테고리별 지표 개수 (useCallback으로 최적화)
  const getCategoryCount = useCallback((category: FilterCategory) => {
    if (category === 'all') return indicators.length;
    return indicators.filter(ind => ind.category === category).length;
  }, [indicators]);

  return (
    <section className="py-8 bg-gradient-to-b from-transparent to-gray-50 dark:to-gray-900/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 헤더 */}
        <div className="mb-8">
          <h2 className={`${CARD_CLASSES.title} text-3xl mb-2`}>
            경제지표 한눈에 보기
          </h2>
          <p className={CARD_CLASSES.subtitle}>
            전체 지표를 카테고리별로 필터링하여 확인하세요 • 클릭하면 상세 정보 표시
          </p>
        </div>

        {/* 카테고리 필터 */}
        <div className="mb-6 overflow-x-auto">
          <div className="flex gap-2 pb-2">
            {CATEGORY_FILTERS.map((filter) => {
              const count = getCategoryCount(filter.id);
              const isActive = activeFilter === filter.id;

              return (
                <button
                  key={filter.id}
                  onClick={() => setActiveFilter(filter.id)}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all whitespace-nowrap
                    ${isActive
                      ? 'bg-blue-600 text-white shadow-md scale-105'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }
                  `}
                >
                  <span>{filter.icon}</span>
                  <span>{filter.name}</span>
                  <span className={`
                    px-2 py-0.5 rounded-full text-xs
                    ${isActive
                      ? 'bg-blue-700'
                      : 'bg-gray-200 dark:bg-gray-700'
                    }
                  `}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 지표 그리드 */}
        {filteredIndicators.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredIndicators.map((indicator, index) => (
              <CompactIndicatorCard
                key={`${indicator.name}-${index}`}
                name={indicator.name}
                actual={indicator.actual}
                previous={indicator.previous}
                surprise={indicator.surprise}
                category={indicator.category}
                onClick={() => onIndicatorClick?.(indicator)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">
              이 카테고리에 표시할 지표가 없습니다.
            </p>
          </div>
        )}

        {/* 통계 */}
        <div className="mt-6 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          <span>
            총 {indicators.length}개 지표 중 {filteredIndicators.length}개 표시
          </span>
          {activeFilter !== 'all' && (
            <button
              onClick={() => setActiveFilter('all')}
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              전체 보기
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
