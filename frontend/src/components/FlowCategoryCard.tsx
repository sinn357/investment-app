'use client';

import { FlowCategorySummary } from '@/utils/flowCalculator';

interface FlowCategoryCardProps {
  summary: FlowCategorySummary;
  selected?: boolean;
  onClick?: () => void;
}

export default function FlowCategoryCard({ summary, selected = false, onClick }: FlowCategoryCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'w-full text-left rounded-xl border p-3 transition-all',
        selected
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-sm'
          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/60 hover:border-blue-300',
      ].join(' ')}
    >
      <div className="flex items-center justify-between mb-1">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{summary.label}</h4>
        <span className="text-xs text-gray-600 dark:text-gray-400">{summary.trend.symbol} {summary.trend.label}</span>
      </div>
      <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{summary.level.label}</p>
      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 truncate">{summary.primaryMetric}</p>
    </button>
  );
}
