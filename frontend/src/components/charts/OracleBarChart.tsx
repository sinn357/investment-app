/**
 * OracleBarChart - Oracle 2025 디자인 시스템
 *
 * 골드-에메랄드 테마의 막대 차트 래퍼
 * - Recharts BarChart 기반
 * - CHART_THEME 자동 적용
 * - 반응형 디자인
 */

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { CHART_THEME } from '@/styles/theme';

interface OracleBarChartProps {
  data: Array<Record<string, string | number>>;
  /** X축 데이터 키 */
  xKey: string;
  /** Y축 데이터 키 배열 */
  yKeys: Array<{ key: string; name: string; color?: string }>;
  /** 차트 높이 (기본: 300) */
  height?: number;
  /** Y축 레이블 */
  yAxisLabel?: string;
  /** X축 레이블 */
  xAxisLabel?: string;
  /** 범례 표시 여부 (기본: true) */
  showLegend?: boolean;
  /** 그리드 표시 여부 (기본: true) */
  showGrid?: boolean;
}

export default function OracleBarChart({
  data,
  xKey,
  yKeys,
  height = 300,
  yAxisLabel,
  xAxisLabel,
  showLegend = true,
  showGrid = true,
}: OracleBarChartProps) {
  // 기본 색상 팔레트 (골드-에메랄드 조화)
  const defaultColors = [
    CHART_THEME.colors.bar,      // 골드
    CHART_THEME.colors.line,      // 에메랄드
    CHART_THEME.colors.area,      // 밝은 에메랄드
    CHART_THEME.colors.scatter,   // 순금색
  ];

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={CHART_THEME.margin}>
        {showGrid && (
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_THEME.colors.grid} opacity={0.3} />
        )}
        <XAxis
          dataKey={xKey}
          stroke={CHART_THEME.colors.axis}
          fontSize={CHART_THEME.fontSize.axis}
          label={xAxisLabel ? { value: xAxisLabel, position: 'insideBottom', offset: -5 } : undefined}
        />
        <YAxis
          stroke={CHART_THEME.colors.axis}
          fontSize={CHART_THEME.fontSize.axis}
          label={yAxisLabel ? { value: yAxisLabel, angle: -90, position: 'insideLeft' } : undefined}
        />
        <Tooltip
          contentStyle={CHART_THEME.tooltip.contentStyle}
          animationDuration={CHART_THEME.animation.duration}
        />
        {showLegend && <Legend />}
        {yKeys.map((yKey, index) => (
          <Bar
            key={yKey.key}
            dataKey={yKey.key}
            name={yKey.name}
            fill={yKey.color || defaultColors[index % defaultColors.length]}
            animationDuration={CHART_THEME.animation.duration}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
