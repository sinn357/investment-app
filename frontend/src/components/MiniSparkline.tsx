/**
 * MiniSparkline 컴포넌트
 * EnhancedIndicatorCard 내부에 표시되는 작은 추세 차트
 *
 * 특징:
 * - 최근 6개월 데이터만 표시
 * - 축/라벨 없음 (미니멀)
 * - 30-40px 높이
 * - Recharts LineChart 사용
 */

'use client';

import React, { useMemo } from 'react';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';

interface MiniSparklineProps {
  data: number[];
  color?: string;
}

const MiniSparkline = React.memo(function MiniSparkline({
  data,
  color = '#10b981', // emerald-500
}: MiniSparklineProps) {
  if (data.length === 0) return null;

  // ✅ 성능 최적화: 차트 데이터 변환을 useMemo로 캐싱 (data 변경 시에만 재계산)
  const chartData = useMemo(() => {
    return data.map((value, index) => ({
      index,
      value,
    }));
  }, [data]);

  // ✅ 성능 최적화: Y축 범위 계산을 useMemo로 캐싱 (data 변경 시에만 재계산)
  const { minValue, maxValue, padding } = useMemo(() => {
    const values = data.filter(v => !isNaN(v) && v !== null);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const pad = (max - min) * 0.1 || 1;
    return { minValue: min, maxValue: max, padding: pad };
  }, [data]);

  return (
    <div className="w-full h-10">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
          <YAxis
            domain={[minValue - padding, maxValue + padding]}
            hide
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
});

export default MiniSparkline;
