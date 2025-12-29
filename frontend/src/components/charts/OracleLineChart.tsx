/**
 * OracleLineChart - Oracle 2025 디자인 시스템
 *
 * 골드-에메랄드 테마의 선형 차트 래퍼
 * - Recharts LineChart 기반
 * - CHART_THEME 자동 적용
 * - 반응형 디자인
 */

import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { CHART_THEME } from '@/styles/theme';

interface OracleLineChartProps {
  data: Array<Record<string, string | number>>;
  /** X축 데이터 키 */
  xKey: string;
  /** Y축 데이터 키 배열 */
  yKeys: Array<{ key: string; name: string; color?: string; strokeWidth?: number }>;
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
  /** 기준선 배열 */
  referenceLines?: Array<{ y: number; label?: string; color?: 'danger' | 'warning' | 'gold' }>;
}

export default function OracleLineChart({
  data,
  xKey,
  yKeys,
  height = 300,
  yAxisLabel,
  xAxisLabel,
  showLegend = true,
  showGrid = true,
  referenceLines = [],
}: OracleLineChartProps) {
  // 기본 색상 팔레트 (골드-에메랄드 조화)
  const defaultColors = [
    CHART_THEME.colors.line,      // 에메랄드
    CHART_THEME.colors.bar,       // 골드
    CHART_THEME.colors.area,      // 밝은 에메랄드
    CHART_THEME.colors.scatter,   // 순금색
  ];

  // 기준선 색상 매핑
  const getReferenceLineColor = (colorType?: 'danger' | 'warning' | 'gold') => {
    switch (colorType) {
      case 'danger':
        return CHART_THEME.colors.referenceLine;
      case 'warning':
        return CHART_THEME.colors.referenceLineSecondary;
      case 'gold':
        return CHART_THEME.colors.referenceLineGold;
      default:
        return CHART_THEME.colors.axis;
    }
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={CHART_THEME.margin}>
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

        {/* 기준선 */}
        {referenceLines.map((refLine, index) => (
          <ReferenceLine
            key={index}
            y={refLine.y}
            stroke={getReferenceLineColor(refLine.color)}
            strokeDasharray="5 5"
            label={refLine.label}
            strokeWidth={2}
          />
        ))}

        {/* 선형 차트 */}
        {yKeys.map((yKey, index) => (
          <Line
            key={yKey.key}
            type="monotone"
            dataKey={yKey.key}
            name={yKey.name}
            stroke={yKey.color || defaultColors[index % defaultColors.length]}
            strokeWidth={yKey.strokeWidth || 2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
            animationDuration={CHART_THEME.animation.duration}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
