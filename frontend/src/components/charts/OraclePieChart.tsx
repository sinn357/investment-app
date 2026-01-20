/**
 * OraclePieChart - Oracle 2025 디자인 시스템
 *
 * 골드-에메랄드 테마의 파이/도넛 차트 래퍼
 * - Recharts PieChart 기반
 * - CHART_THEME 자동 적용
 * - 반응형 디자인
 */

import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, PieLabelRenderProps } from 'recharts';
import { CHART_THEME, ORACLE_COLORS } from '@/styles/theme';

const RADIAN = Math.PI / 180;

// 커스텀 라벨 렌더러 - 작은 섹터(5% 미만) 숨김 + 바깥쪽 배치
const renderCustomLabel = (props: PieLabelRenderProps): React.ReactElement | null => {
  const { cx, cy, midAngle, outerRadius, percent, name } = props;

  // 타입 가드
  if (typeof cx !== 'number' || typeof cy !== 'number' ||
      typeof midAngle !== 'number' || typeof outerRadius !== 'number' ||
      typeof percent !== 'number') {
    return null;
  }

  // 5% 미만 섹터는 라벨 숨김
  if (percent < 0.05) return null;

  // 라벨 위치를 바깥쪽으로 (outerRadius * 1.15)
  const radius = outerRadius * 1.15;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="currentColor"
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      className="text-xs fill-muted-foreground"
    >
      {`${name} ${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

interface OraclePieChartProps {
  data: Array<{ name: string; value: number }>;
  /** 차트 높이 (기본: 300) */
  height?: number;
  /** 도넛 차트 사용 (기본: false) */
  donut?: boolean;
  /** 도넛 내부 반지름 비율 (기본: 60) */
  innerRadius?: number;
  /** 외부 반지름 비율 (기본: 80) */
  outerRadius?: number;
  /** 범례 표시 여부 (기본: true) */
  showLegend?: boolean;
  /** 레이블 표시 여부 (기본: true) */
  showLabel?: boolean;
  /** 커스텀 색상 배열 (없으면 기본 팔레트 사용) */
  colors?: string[];
  /** 추가 CSS 클래스 */
  className?: string;
}

export default function OraclePieChart({
  data,
  height = 300,
  donut = false,
  innerRadius = 60,
  outerRadius = 80,
  showLegend = true,
  showLabel = true,
  colors,
}: OraclePieChartProps) {
  // 기본 색상 팔레트 (골드-에메랄드 조화 + 추가 색상)
  const defaultColors = colors || [
    CHART_THEME.colors.bar,          // 골드
    CHART_THEME.colors.line,          // 에메랄드
    CHART_THEME.colors.area,          // 밝은 에메랄드
    CHART_THEME.colors.scatter,       // 순금색
    ORACLE_COLORS.gold.dark,          // 다크 골드
    ORACLE_COLORS.emerald.dark,       // 다크 에메랄드
    ORACLE_COLORS.gold.shine,         // 빛나는 골드
    ORACLE_COLORS.emerald.shine,      // 빛나는 에메랄드
  ];

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={donut ? innerRadius : 0}
          outerRadius={outerRadius}
          fill="#8884d8"
          dataKey="value"
          label={showLabel ? renderCustomLabel : false}
          animationDuration={CHART_THEME.animation.duration}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={defaultColors[index % defaultColors.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={CHART_THEME.tooltip.contentStyle}
          animationDuration={CHART_THEME.animation.duration}
        />
        {showLegend && (
          <Legend
            wrapperStyle={{ fontSize: '12px' }}
            iconSize={10}
          />
        )}
      </PieChart>
    </ResponsiveContainer>
  );
}
