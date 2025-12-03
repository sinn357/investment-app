/**
 * IndicatorDetailModal 컴포넌트
 * EnhancedIndicatorCard 클릭 시 표시되는 상세 정보 모달
 *
 * 3개 탭:
 * 1. 수치 탭: 현재/이전/예측/서프라이즈/발표일
 * 2. 차트 탭: 6개월 추세 + 히스토리 테이블
 * 3. 해석 탭: 지표 개요 + 투자 시사점
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { CHART_THEME } from '@/styles/theme';

interface IndicatorDetailModalProps {
  id: string;
  name: string;
  nameKo?: string;
  category: string;
  onClose: () => void;
}

interface IndicatorData {
  latest_release: {
    date: string;
    actual: number | string;
    forecast: number | string | null;
    previous: number | string;
  };
  next_release: {
    date: string;
    forecast: number | string | null;
  };
  history: Array<{
    date: string;
    actual: number | string;
    forecast: number | string | null;
    previous: number | string;
  }>;
}

const IndicatorDetailModal = React.memo(function IndicatorDetailModal({
  id,
  name,
  nameKo,
  category,
  onClose,
}: IndicatorDetailModalProps) {
  const [activeTab, setActiveTab] = useState('data');
  const [data, setData] = useState<IndicatorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchIndicatorData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://investment-app-backend-x166.onrender.com';
      const response = await fetch(`${API_URL}/api/v3/indicators/${id}`);
      const result = await response.json();

      if (result.status === 'error') {
        throw new Error(result.message);
      }

      setData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchIndicatorData();
  }, [fetchIndicatorData]);

  // 서프라이즈 계산
  const calculateSurprise = () => {
    if (!data?.latest_release) return null;

    const { actual, forecast } = data.latest_release;
    if (forecast === null || forecast === undefined) return null;

    const actualNum = typeof actual === 'string' ? parseFloat(actual.replace('%', '')) : actual;
    const forecastNum = typeof forecast === 'string' ? parseFloat(forecast.replace('%', '')) : forecast;

    if (isNaN(actualNum) || isNaN(forecastNum)) return null;

    return (actualNum - forecastNum).toFixed(2);
  };

  // 차트 데이터 준비 (최근 6개월)
  const prepareChartData = () => {
    if (!data?.history) return [];

    return data.history.slice(0, 6).reverse().map(item => {
      const actualNum = typeof item.actual === 'string' ? parseFloat(item.actual.replace('%', '').replace('K', '000')) : item.actual;
      const forecastNum = item.forecast && typeof item.forecast === 'string' ? parseFloat(item.forecast.replace('%', '').replace('K', '000')) : item.forecast;

      return {
        date: new Date(item.date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }),
        actual: actualNum,
        forecast: forecastNum,
      };
    });
  };

  const chartData = prepareChartData();
  const surprise = calculateSurprise();

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{nameKo || name}</DialogTitle>
        </DialogHeader>

        {loading && (
          <div className="py-12 text-center text-gray-500">
            데이터 로딩 중...
          </div>
        )}

        {error && (
          <div className="py-12 text-center text-red-600">
            {error}
          </div>
        )}

        {!loading && !error && data && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="data">수치</TabsTrigger>
              <TabsTrigger value="chart">차트</TabsTrigger>
              <TabsTrigger value="insight">해석</TabsTrigger>
            </TabsList>

            {/* 수치 탭 */}
            <TabsContent value="data" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">현재값</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {data.latest_release.actual}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {new Date(data.latest_release.date).toLocaleDateString('ko-KR')}
                  </div>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">이전값</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {data.latest_release.previous}
                  </div>
                </div>

                {data.latest_release.forecast && (
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">예측값</div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {data.latest_release.forecast}
                    </div>
                  </div>
                )}

                {surprise && (
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">서프라이즈</div>
                    <div className={`text-2xl font-bold ${
                      parseFloat(surprise) > 0 ? 'text-green-600' :
                      parseFloat(surprise) < 0 ? 'text-red-600' :
                      'text-gray-600'
                    }`}>
                      {parseFloat(surprise) > 0 ? '+' : ''}{surprise}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {parseFloat(surprise) > 0 ? '예상 상회' : parseFloat(surprise) < 0 ? '예상 하회' : '예상 일치'}
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-1">
                  다음 발표일
                </div>
                <div className="text-lg text-blue-700 dark:text-blue-400">
                  {data.next_release.date}
                </div>
              </div>
            </TabsContent>

            {/* 차트 탭 */}
            <TabsContent value="chart" className="space-y-6 mt-4">
              <div className="h-64">
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
                    {chartData.some(d => d.forecast !== null) && (
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

              {/* 히스토리 테이블 */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-4 py-2 text-left">날짜</th>
                      <th className="px-4 py-2 text-right">실제</th>
                      <th className="px-4 py-2 text-right">예측</th>
                      <th className="px-4 py-2 text-right">이전</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.history.slice(0, 6).map((item, idx) => (
                      <tr key={idx} className="border-b dark:border-gray-700">
                        <td className="px-4 py-2">
                          {new Date(item.date).toLocaleDateString('ko-KR')}
                        </td>
                        <td className="px-4 py-2 text-right font-medium">{item.actual}</td>
                        <td className="px-4 py-2 text-right text-gray-500">{item.forecast || '-'}</td>
                        <td className="px-4 py-2 text-right text-gray-500">{item.previous}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            {/* 해석 탭 */}
            <TabsContent value="insight" className="space-y-4 mt-4">
              <div className="prose dark:prose-invert max-w-none">
                <h3 className="text-lg font-semibold">지표 개요</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {nameKo || name}는 {category === 'business' ? '경기' :
                   category === 'employment' ? '고용' :
                   category === 'interest' ? '금리' :
                   category === 'trade' ? '무역' :
                   category === 'inflation' ? '물가' : ''} 상황을 나타내는 주요 지표입니다.
                </p>

                <h3 className="text-lg font-semibold mt-6">투자 시사점</h3>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                  <li>• 지표의 변화 추이를 관찰하여 경제 국면을 판단합니다</li>
                  <li>• 예상치 대비 실적의 차이(서프라이즈)가 시장에 영향을 줍니다</li>
                  <li>• 다른 경제지표와 함께 종합적으로 분석하는 것이 중요합니다</li>
                </ul>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
});

export default IndicatorDetailModal;
