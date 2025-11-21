/**
 * CompactIndicatorCard 컴포넌트
 * Phase 8: 간결한 지표 카드 (그리드용)
 */

'use client';

import { CARD_CLASSES, BADGE_CLASSES } from '@/styles/theme';

interface CompactIndicatorCardProps {
  name: string;
  actual: number | string | null;
  previous: number | string;
  surprise?: number | null;
  category: string;
  onClick?: () => void;
}

export default function CompactIndicatorCard({
  name,
  actual,
  previous,
  surprise,
  category,
  onClick,
}: CompactIndicatorCardProps) {
  // 변화량 계산
  const getChange = () => {
    if (actual === null || actual === undefined) return null;

    const actualNum = typeof actual === 'string'
      ? parseFloat(actual.replace('%', '').replace('K', '000'))
      : actual;
    const prevNum = typeof previous === 'string'
      ? parseFloat(previous.replace('%', '').replace('K', '000'))
      : previous;

    if (isNaN(actualNum) || isNaN(prevNum)) return null;

    return actualNum - prevNum;
  };

  const change = getChange();
  const hasIncrease = change !== null && change > 0;
  const hasDecrease = change !== null && change < 0;

  // 상태 배지 결정
  const getStatusBadge = () => {
    if (surprise === null || surprise === undefined) {
      return { text: '중립', class: BADGE_CLASSES.neutral };
    }

    if (Math.abs(surprise) < 0.1) {
      return { text: '예상', class: BADGE_CLASSES.neutral };
    } else if (surprise > 0) {
      return { text: '양호', class: BADGE_CLASSES.excellent };
    } else {
      return { text: '주의', class: BADGE_CLASSES.caution };
    }
  };

  const status = getStatusBadge();

  // 카테고리별 완전한 클래스명 (Tailwind 동적 클래스 문제 해결)
  const getCategoryClasses = () => {
    const classes: Record<string, string> = {
      'business': 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
      'employment': 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
      'interest': 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
      'trade': 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300',
      'inflation': 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
      'policy': 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300',
    };
    return classes[category] || 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300';
  };

  const categoryClasses = getCategoryClasses();

  return (
    <button
      onClick={onClick}
      className={`${CARD_CLASSES.container} p-4 text-left hover:shadow-lg transition-all duration-200 hover:scale-[1.02] cursor-pointer group`}
    >
      {/* 카테고리 태그 */}
      <div className="flex items-center justify-between mb-2">
        <span className={`text-xs px-2 py-1 rounded ${categoryClasses}`}>
          {category === 'business' && '📊 경기'}
          {category === 'employment' && '👷 고용'}
          {category === 'interest' && '🏦 금리'}
          {category === 'trade' && '🚢 무역'}
          {category === 'inflation' && '💰 물가'}
          {category === 'policy' && '🏛️ 정책'}
        </span>
        <span className={`text-xs ${status.class}`}>
          {status.text}
        </span>
      </div>

      {/* 지표명 */}
      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
        {name}
      </h3>

      {/* 최신값 + 변화 */}
      <div className="flex items-baseline gap-2 mb-3">
        <span className="text-2xl font-bold text-gray-900 dark:text-white">
          {actual !== null ? actual : 'N/A'}
        </span>
        {change !== null && (
          <span className={`text-sm font-medium ${
            hasIncrease
              ? 'text-green-600 dark:text-green-400'
              : hasDecrease
              ? 'text-red-600 dark:text-red-400'
              : 'text-gray-500'
          }`}>
            {hasIncrease && '↑'}
            {hasDecrease && '↓'}
            {' '}
            {Math.abs(change).toFixed(2)}
          </span>
        )}
      </div>

      {/* 이전값 표시 */}
      <div className="text-xs text-gray-500 dark:text-gray-400">
        이전: {previous}
      </div>

      {/* 상세보기 힌트 */}
      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <span className="text-xs text-gray-400 dark:text-gray-500">
          클릭하여 상세보기
        </span>
        <span className="text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          →
        </span>
      </div>
    </button>
  );
}
