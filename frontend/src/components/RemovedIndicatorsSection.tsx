'use client';

import { useMemo, useState } from 'react';

interface RemovedIndicator {
  id: string;
  name: string;
  nameKo?: string;
  category: string;
  url?: string;
  isCore?: boolean;
}

interface RemovedIndicatorsSectionProps {
  indicators: RemovedIndicator[];
}

const CATEGORY_LABELS: Record<string, string> = {
  business: '경기',
  employment: '고용',
  inflation: '물가',
  interest: '금리',
  trade: '무역',
  credit: '신용',
  sentiment: '심리',
};

const CATEGORY_ORDER = ['business', 'employment', 'inflation', 'interest', 'trade', 'credit', 'sentiment'];

export default function RemovedIndicatorsSection({ indicators }: RemovedIndicatorsSectionProps) {
  const [collapsed, setCollapsed] = useState(true);

  const removedByCategory = useMemo(() => {
    const rows = indicators
      .filter((indicator) => indicator.isCore === false)
      .sort((a, b) => (a.nameKo || a.name).localeCompare(b.nameKo || b.name, 'ko'));

    const grouped = rows.reduce<Record<string, RemovedIndicator[]>>((acc, indicator) => {
      const category = indicator.category || 'business';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(indicator);
      return acc;
    }, {});

    return grouped;
  }, [indicators]);

  const visibleCategories = CATEGORY_ORDER.filter(
    (category) => (removedByCategory[category] || []).length > 0
  );

  const totalCount = visibleCategories.reduce(
    (sum, category) => sum + (removedByCategory[category]?.length || 0),
    0
  );

  if (totalCount === 0) {
    return null;
  }

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/60">
        <button
          type="button"
          onClick={() => setCollapsed((prev) => !prev)}
          className="w-full px-4 py-3 text-left flex items-center justify-between"
        >
          <div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">📋 추가 지표 링크</h3>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              핵심 카드에서 제외된 지표 {totalCount}개
            </p>
          </div>
          <span className="text-sm text-gray-600 dark:text-gray-400">{collapsed ? '펼치기 ▼' : '접기 ▲'}</span>
        </button>

        {!collapsed && (
          <div className="px-4 pb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {visibleCategories.map((category) => (
              <div key={category} className="rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                <div className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
                  {CATEGORY_LABELS[category] || category}
                </div>
                <ul className="space-y-1">
                  {(removedByCategory[category] || []).map((indicator) => (
                    <li key={indicator.id} className="text-sm">
                      {indicator.url ? (
                        <a
                          href={indicator.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          {indicator.nameKo || indicator.name}
                        </a>
                      ) : (
                        <span className="text-gray-700 dark:text-gray-300">{indicator.nameKo || indicator.name}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
