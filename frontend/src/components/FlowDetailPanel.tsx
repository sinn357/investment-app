'use client';

import { FlowCategorySummary } from '@/utils/flowCalculator';

interface FlowDetailPanelProps {
  summary: FlowCategorySummary;
}

export default function FlowDetailPanel({ summary }: FlowDetailPanelProps) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/60 p-4">
      <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">📊 {summary.label}</h4>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{summary.question}</p>

      <div className="space-y-2 text-sm text-gray-800 dark:text-gray-200">
        <p>
          상태: <span className="font-semibold">{summary.level.label}</span>
        </p>
        <p>
          속도: <span className="font-semibold">{summary.trend.symbol} {summary.trend.label}</span>
          {summary.trend.percent !== null ? ` (${summary.trend.percent.toFixed(1)}%)` : ''}
        </p>
        <p>{summary.interpretation}</p>
      </div>

      <div className="mt-4">
        <h5 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">핵심 지표</h5>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {summary.indicators.slice(0, 6).map((indicator) => (
            <li key={indicator.id} className="text-xs rounded-md border border-gray-200 dark:border-gray-700 px-2 py-1 text-gray-700 dark:text-gray-300">
              {indicator.name}: {indicator.valueText}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-4 rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 p-3">
        <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">💰 금리 시사점</p>
        <p className="text-sm text-amber-900 dark:text-amber-200 mt-1">{summary.rateImplication}</p>
      </div>
    </div>
  );
}
