'use client';

import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

interface DataRow {
  release_date: string;
  time: string;
  actual: number | null;
  forecast: number | null;
  previous: number;
}

interface DataChartsProps {
  data: DataRow[];
  indicatorName: string;
}

export default function DataCharts({ data, indicatorName }: DataChartsProps) {
  // Helper function to convert value (number or string with %) to number for chart
  const parseChartValue = (value: string | number | null): number | null => {
    if (value === null || value === undefined) return null;
    if (typeof value === 'number') return value;
    if (typeof value === 'string' && value.includes('%')) {
      const numericValue = parseFloat(value.replace('%', ''));
      return isNaN(numericValue) ? null : numericValue;
    }
    return parseFloat(value) || null;
  };

  // Determine indicator group and calculate optimal Y-axis domain
  const getYAxisDomain = (chartData: any[], indicatorName: string): [number, number] | undefined => {
    if (chartData.length === 0) return undefined;

    const values = chartData.map(d => d.actual).filter(v => v !== null);
    if (values.length === 0) return undefined;

    const min = Math.min(...values);
    const max = Math.max(...values);

    // Group 1: Consumer indicators - dynamic range with padding
    if (indicatorName.includes('Consumer')) {
      const padding = (max - min) * 0.15; // 15% padding
      return [Math.max(0, min - padding), max + padding];
    }

    // Group 2: PMI indicators - meaningful economic range with 50 baseline
    if (indicatorName.includes('PMI') || indicatorName.includes('Manufacturing') || indicatorName.includes('Non-Manufacturing')) {
      const baseMin = Math.min(40, min - 2);
      const baseMax = Math.max(65, max + 2);
      return [baseMin, baseMax];
    }

    // Group 3: Percentage data - include zero baseline for positive/negative changes
    if (indicatorName.includes('Production') || indicatorName.includes('Sales') || indicatorName.includes('GDP')) {
      const absMax = Math.max(Math.abs(min), Math.abs(max));
      const padding = absMax * 0.2; // 20% padding
      return [Math.min(-padding, min - padding), Math.max(padding, max + padding)];
    }

    // Group 4: Other indicators - dynamic range
    const padding = (max - min) * 0.1; // 10% padding
    return [Math.max(0, min - padding), max + padding];
  };

  // actual 값이 있는 데이터만 필터링하고 차트 데이터로 변환
  const chartData = data
    .filter(row => row.actual !== null)
    .reverse() // 오래된 순서로 정렬 (차트에서 시간 순으로 표시)
    .map(row => ({
      date: new Date(row.release_date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }),
      actual: parseChartValue(row.actual!),
      originalValue: row.actual!, // 원본 값 (% 포함) 보관
      fullDate: row.release_date
    }))
    .filter(row => row.actual !== null); // 변환 실패한 항목 제거

  // Calculate Y-axis domain for this indicator
  const yAxisDomain = getYAxisDomain(chartData, indicatorName);

  // Check if this is a PMI indicator that needs a 50 reference line
  const shouldShow50Line = indicatorName.includes('PMI') ||
                          indicatorName.includes('Manufacturing') ||
                          indicatorName.includes('Non-Manufacturing');

  if (chartData.length === 0) {
    return (
      <div className="mt-8 bg-white dark:bg-gray-800 shadow-md rounded-lg p-8">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          {indicatorName} 차트
        </h3>
        <div className="text-center text-gray-500 dark:text-gray-400 py-8">
          차트를 표시할 데이터가 없습니다.
        </div>
      </div>
    );
  }

  const formatTooltip = (value: number, name: string, payload?: { payload?: { originalValue: string | number } }) => {
    if (name === 'actual' && payload?.payload) {
      // 원본 값(% 포함)이 있으면 그것을 표시, 없으면 숫자값으로 표시
      const originalValue = payload.payload.originalValue;
      if (typeof originalValue === 'string' && originalValue.includes('%')) {
        return [originalValue, 'Actual'];
      }
      return [value?.toFixed(1), 'Actual'];
    }
    return [value, name];
  };

  const formatLabel = (label: string) => {
    const item = chartData.find(d => d.date === label);
    return item ? `${label} (${item.fullDate})` : label;
  };

  return (
    <div className="mt-8 bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
        {indicatorName} 차트
      </h3>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 막대형 차트 */}
        <div>
          <h4 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-4">
            막대형 차트
          </h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="date"
                  stroke="#6B7280"
                  fontSize={12}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis
                  stroke="#6B7280"
                  fontSize={12}
                  domain={yAxisDomain}
                />
                <Tooltip
                  formatter={formatTooltip}
                  labelFormatter={formatLabel}
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: '1px solid #374151',
                    borderRadius: '6px',
                    color: '#F3F4F6'
                  }}
                />
                <Bar
                  dataKey="actual"
                  fill="#3B82F6"
                  radius={[2, 2, 0, 0]}
                />
                {shouldShow50Line && (
                  <ReferenceLine
                    y={50}
                    stroke="#EF4444"
                    strokeDasharray="5 5"
                    strokeWidth={2}
                    label={{ value: "50 (기준선)", position: "topRight", fill: "#EF4444" }}
                  />
                )}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 선형 차트 */}
        <div>
          <h4 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-4">
            선형 차트
          </h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="date"
                  stroke="#6B7280"
                  fontSize={12}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis
                  stroke="#6B7280"
                  fontSize={12}
                  domain={yAxisDomain}
                />
                <Tooltip
                  formatter={formatTooltip}
                  labelFormatter={formatLabel}
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: '1px solid #374151',
                    borderRadius: '6px',
                    color: '#F3F4F6'
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="actual"
                  stroke="#10B981"
                  strokeWidth={3}
                  dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#10B981', strokeWidth: 2 }}
                />
                {shouldShow50Line && (
                  <ReferenceLine
                    y={50}
                    stroke="#EF4444"
                    strokeDasharray="5 5"
                    strokeWidth={2}
                    label={{ value: "50 (기준선)", position: "topRight", fill: "#EF4444" }}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 차트 설명 */}
      <div className="mt-6 text-sm text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 pt-4">
        <p>* Actual 값만 표시됨 (과거 데이터)</p>
        <p>* 시간순으로 정렬된 데이터 ({chartData.length}개 포인트)</p>
        <p>* 막대형: 각 시점별 값, 선형: 트렌드 변화</p>
        <p>* Y축 범위: 지표 특성에 따라 최적화됨 {shouldShow50Line && '(PMI: 50 기준선 포함)'}</p>
      </div>
    </div>
  );
}