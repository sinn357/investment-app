/**
 * IndicatorChartPanel 컴포넌트
 * 선택된 경제지표의 상세 차트 및 히스토리 데이터 표시
 *
 * 기능:
 * - 선택된 지표의 Line/Bar 차트
 * - History Table (최근 6개월)
 * - 이전/다음 지표 네비게이션
 * - 탭: 차트/히스토리/해석
 */

'use client';

import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { CHART_THEME, CARD_CLASSES } from '@/styles/theme';

interface Indicator {
  id: string;
  name: string;
  nameKo?: string;
  actual: number | string | null;
  previous: number | string;
  forecast?: number | string | null;
  surprise?: number | null;
  category: string;
}

interface IndicatorChartPanelProps {
  selectedIndicatorId: string;
  allIndicators: Indicator[];
  onSelectIndicator: (id: string) => void;
}

interface HistoryData {
  date: string;
  actual: number | string;
  forecast: number | string | null;
  previous: number | string;
}

const IndicatorChartPanel: React.FC<IndicatorChartPanelProps> = ({
  selectedIndicatorId,
  allIndicators,
  onSelectIndicator,
}) => {
  const [activeTab, setActiveTab] = useState<'chart' | 'history' | 'interpretation'>('chart');
  const [historyData, setHistoryData] = useState<HistoryData[]>([]);
  const [chartData, setChartData] = useState<{ date: string; actual: number; forecast?: number }[]>([]);
  const [loading, setLoading] = useState(false);

  const selectedIndicator = allIndicators.find(ind => ind.id === selectedIndicatorId);
  const selectedIndex = allIndicators.findIndex(ind => ind.id === selectedIndicatorId);

  // 이전/다음 지표 찾기
  const handlePrevious = () => {
    if (selectedIndex > 0) {
      onSelectIndicator(allIndicators[selectedIndex - 1].id);
    }
  };

  const handleNext = () => {
    if (selectedIndex < allIndicators.length - 1) {
      onSelectIndicator(allIndicators[selectedIndex + 1].id);
    }
  };

  // 키보드 이벤트
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        handlePrevious();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIndex, allIndicators]);

  // 지표 데이터 페칭
  useEffect(() => {
    const fetchIndicatorData = async () => {
      if (!selectedIndicatorId) return;

      setLoading(true);
      try {
        const response = await fetch(
          `https://investment-app-backend-x166.onrender.com/api/history-table/${selectedIndicatorId}`
        );
        const result = await response.json();

        if (result.status === 'success' && result.data) {
          const history: HistoryData[] = result.data.map((item: { date: string; actual: string | number; forecast: string | number | null; previous: string | number }) => ({
            date: item.date,
            actual: item.actual,
            forecast: item.forecast,
            previous: item.previous,
          }));
          setHistoryData(history.slice(0, 6));

          // 차트 데이터 변환
          const chart = history.slice(0, 12).reverse().map(item => {
            const actualNum = typeof item.actual === 'string'
              ? parseFloat(item.actual.replace('%', '').replace('K', '000'))
              : item.actual;
            const forecastNum = item.forecast
              ? typeof item.forecast === 'string'
                ? parseFloat(item.forecast.replace('%', '').replace('K', '000'))
                : item.forecast
              : undefined;

            return {
              date: item.date,
              actual: isNaN(actualNum) ? 0 : actualNum,
              forecast: forecastNum !== undefined && !isNaN(forecastNum) ? forecastNum : undefined,
            };
          });
          setChartData(chart);
        }
      } catch (error) {
        console.error('Failed to fetch indicator data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchIndicatorData();
  }, [selectedIndicatorId]);

  if (!selectedIndicator) return null;

  const categoryNames: Record<string, string> = {
    'business': '경기',
    'employment': '고용',
    'interest': '금리',
    'trade': '무역',
    'inflation': '물가',
  };

  return (
    <section id="chart-panel" className="py-8 bg-gradient-to-b from-gray-50 to-transparent dark:from-gray-900/30 dark:to-transparent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm px-2 py-1 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                {categoryNames[selectedIndicator.category] || selectedIndicator.category}
              </span>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {selectedIndicator.nameKo || selectedIndicator.name}
              </h2>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              현재값: {selectedIndicator.actual} | 이전: {selectedIndicator.previous}
            </p>
          </div>

          {/* 네비게이션 */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevious}
              disabled={selectedIndex === 0}
              className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              ← 이전
            </button>
            <button
              onClick={handleNext}
              disabled={selectedIndex === allIndicators.length - 1}
              className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              다음 →
            </button>
          </div>
        </div>

        {/* 탭 */}
        <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700">
          {(['chart', 'history', 'interpretation'] as const).map((tab) => {
            const tabNames = { chart: '차트', history: '히스토리', interpretation: '해석' };
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 font-medium transition-colors border-b-2 ${
                  activeTab === tab
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                {tabNames[tab]}
              </button>
            );
          })}
        </div>

        {/* 탭 콘텐츠 */}
        <div className={CARD_CLASSES.container}>
          {loading ? (
            <div className="h-96 flex items-center justify-center">
              <div className="animate-pulse text-gray-500 dark:text-gray-400">데이터 로딩 중...</div>
            </div>
          ) : (
            <>
              {/* 차트 탭 */}
              {activeTab === 'chart' && (
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={CHART_THEME.margin}>
                      <CartesianGrid strokeDasharray="3 3" stroke={CHART_THEME.colors.grid} />
                      <XAxis
                        dataKey="date"
                        tick={{ fill: CHART_THEME.colors.axis, fontSize: 12 }}
                      />
                      <YAxis
                        tick={{ fill: CHART_THEME.colors.axis, fontSize: 12 }}
                      />
                      <Tooltip
                        contentStyle={CHART_THEME.tooltip.contentStyle}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="actual"
                        name="실제값"
                        stroke={CHART_THEME.colors.bar}
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                      {chartData.some(d => d.forecast !== undefined) && (
                        <Line
                          type="monotone"
                          dataKey="forecast"
                          name="예측값"
                          stroke={CHART_THEME.colors.line}
                          strokeWidth={2}
                          strokeDasharray="5 5"
                          dot={{ r: 4 }}
                        />
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* 히스토리 탭 */}
              {activeTab === 'history' && (
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-gray-100 dark:bg-gray-800">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">날짜</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">실제값</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">예측값</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">이전값</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {historyData.map((row, index) => (
                        <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{row.date}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{row.actual}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">{row.forecast || '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">{row.previous}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* 해석 탭 */}
              {activeTab === 'interpretation' && (
                <div className="prose dark:prose-invert max-w-none">
                  <h3>지표 개요</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {selectedIndicator.nameKo || selectedIndicator.name} 지표에 대한 상세 정보 및 투자 시사점이 여기에 표시됩니다.
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-500">
                    (향후 지표별 메타데이터 API 연동 예정)
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
};

export default IndicatorChartPanel;
