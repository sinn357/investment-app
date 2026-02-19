'use client';

import { useMemo, useState } from 'react';
import FlowCategoryCard from './FlowCategoryCard';
import FlowDetailPanel from './FlowDetailPanel';
import { calculateFlowSummaries, FlowIndicatorInput } from '@/utils/flowCalculator';

interface FlowDashboardProps {
  indicators: FlowIndicatorInput[];
}

export default function FlowDashboard({ indicators }: FlowDashboardProps) {
  const summaries = useMemo(() => calculateFlowSummaries(indicators), [indicators]);
  const [selected, setSelected] = useState<string>('business');

  const selectedSummary = summaries.find((summary) => summary.key === selected) || summaries[0];

  if (!selectedSummary) {
    return null;
  }

  return (
    <section>
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gradient-to-b from-white to-gray-50 dark:from-gray-900/70 dark:to-gray-900/40 p-4">
        <div className="mb-3">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">🌊 지표 흐름 대시보드</h3>
          <p className="text-xs text-gray-600 dark:text-gray-400">7개 카테고리의 흐름을 컴팩트 카드로 보고, 선택한 카테고리 상세 해석을 확인합니다.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-2 mb-4">
          {summaries.map((summary) => (
            <FlowCategoryCard
              key={summary.key}
              summary={summary}
              selected={selectedSummary.key === summary.key}
              onClick={() => setSelected(summary.key)}
            />
          ))}
        </div>

        <FlowDetailPanel summary={selectedSummary} />
      </div>
    </section>
  );
}
