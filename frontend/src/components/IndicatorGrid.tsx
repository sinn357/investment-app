/**
 * IndicatorGrid 컴포넌트
 * Phase 8: 모든 경제지표를 그리드로 표시 (탭 제거)
 * Phase 9: useMemo, useCallback으로 성능 최적화
 * Phase 10: EnhancedIndicatorCard로 업그레이드 (스파크라인 + 상세 모달)
 */

'use client';

import { useState, useMemo, useCallback } from 'react';
import EnhancedIndicatorCard from './EnhancedIndicatorCard';
import { CARD_CLASSES } from '@/styles/theme';

interface Indicator {
  id: string;
  name: string;
  nameKo?: string;
  actual: number | string | null;
  previous: number | string;
  forecast?: number | string | null;
  surprise?: number | null;
  category: string;
  sparklineData?: number[];
  reverseColor?: boolean;
}

interface IndicatorGridProps {
  indicators: Indicator[];
  selectedId?: string | null;
  onIndicatorClick?: (indicator: Indicator) => void;
}

type FilterCategory = 'all' | 'business' | 'employment' | 'interest' | 'trade' | 'inflation';
type SortOption = 'default' | 'alphabetical' | 'impact';

const CATEGORY_FILTERS = [
  { id: 'all' as FilterCategory, name: '전체', icon: '🌐' },
  { id: 'business' as FilterCategory, name: '경기', icon: '📊' },
  { id: 'employment' as FilterCategory, name: '고용', icon: '👷' },
  { id: 'interest' as FilterCategory, name: '금리', icon: '🏦' },
  { id: 'trade' as FilterCategory, name: '무역', icon: '🚢' },
  { id: 'inflation' as FilterCategory, name: '물가', icon: '💰' },
];

const SORT_OPTIONS = [
  { id: 'default' as SortOption, name: '기본 순서', icon: '📋' },
  { id: 'alphabetical' as SortOption, name: '가나다순', icon: '🔤' },
  { id: 'impact' as SortOption, name: '영향력순', icon: '⚡' },
];

export default function IndicatorGrid({ indicators, selectedId, onIndicatorClick }: IndicatorGridProps) {
  const [activeFilter, setActiveFilter] = useState<FilterCategory>('all');
  const [sortOption, setSortOption] = useState<SortOption>('default');

  // 필터링 및 정렬된 지표 (useMemo로 최적화)
  const filteredIndicators = useMemo(() => {
    // 1. 필터링
    let result = activeFilter === 'all'
      ? indicators
      : indicators.filter(ind => ind.category === activeFilter);

    // 2. 정렬
    if (sortOption === 'alphabetical') {
      result = [...result].sort((a, b) => a.name.localeCompare(b.name, 'ko'));
    } else if (sortOption === 'impact') {
      result = [...result].sort((a, b) => {
        const aSurprise = Math.abs(a.surprise ?? 0);
        const bSurprise = Math.abs(b.surprise ?? 0);
        return bSurprise - aSurprise; // 내림차순 (높은 영향력 우선)
      });
    }
    // 'default'는 원본 순서 유지

    return result;
  }, [activeFilter, sortOption, indicators]);

  // ✅ 성능 최적화: 카테고리별 지표 개수를 useMemo로 미리 계산 (매번 필터링 방지)
  const categoryCounts = useMemo(() => {
    const counts: Record<FilterCategory, number> = {
      all: indicators.length,
      business: 0,
      employment: 0,
      interest: 0,
      trade: 0,
      inflation: 0,
    };

    indicators.forEach(ind => {
      const cat = ind.category as FilterCategory;
      if (cat in counts && cat !== 'all') {
        counts[cat]++;
      }
    });

    return counts;
  }, [indicators]);

  // 카테고리별 지표 개수 조회 함수 (useMemo로 계산된 값 반환)
  const getCategoryCount = useCallback((category: FilterCategory) => {
    return categoryCounts[category] || 0;
  }, [categoryCounts]);

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

        {/* 카테고리 필터 및 정렬 */}
        <div className="mb-6">
          {/* 카테고리 필터 */}
          <div className="overflow-x-auto md:overflow-x-visible mb-4">
            <div className="flex md:flex-wrap gap-2 pb-2">
              {CATEGORY_FILTERS.map((filter) => {
                const count = getCategoryCount(filter.id);
                const isActive = activeFilter === filter.id;

                return (
                  <button
                    key={filter.id}
                    onClick={() => setActiveFilter(filter.id)}
                    className={`
                      flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all whitespace-nowrap flex-shrink-0 md:flex-shrink
                      ${isActive
                        ? 'bg-gradient-to-r from-[#DAA520] to-[#D4AF37] text-white shadow-lg shadow-[#DAA520]/30 scale-105 shimmer-effect'
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-[#DAA520] hover:shadow-md hover:scale-105'
                      }
                    `}
                  >
                    <span>{filter.icon}</span>
                    <span>{filter.name}</span>
                    <span className={`
                      px-2 py-0.5 rounded-full text-xs font-semibold
                      ${isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                      }
                    `}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 정렬 옵션 */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">정렬:</span>
            <div className="flex flex-wrap gap-2">
              {SORT_OPTIONS.map((option) => {
                const isActive = sortOption === option.id;
                return (
                  <button
                    key={option.id}
                    onClick={() => setSortOption(option.id)}
                    className={`
                      flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap
                      ${isActive
                        ? 'bg-gradient-to-r from-[#50C878] to-[#2ECC71] text-white shadow-md shadow-[#50C878]/30 scale-105'
                        : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:border-[#50C878] hover:shadow-sm hover:scale-105'
                      }
                    `}
                  >
                    <span>{option.icon}</span>
                    <span>{option.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 지표 그리드 */}
        {filteredIndicators.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredIndicators.map((indicator, index) => (
              <EnhancedIndicatorCard
                key={`${indicator.id}-${index}`}
                id={indicator.id}
                name={indicator.name}
                nameKo={indicator.nameKo}
                actual={indicator.actual}
                previous={indicator.previous}
                forecast={indicator.forecast}
                surprise={indicator.surprise}
                category={indicator.category}
                sparklineData={indicator.sparklineData}
                reverseColor={indicator.reverseColor}
                isSelected={selectedId === indicator.id}
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
    </section>
  );
}
