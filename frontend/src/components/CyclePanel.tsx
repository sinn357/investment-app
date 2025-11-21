/**
 * CyclePanel 컴포넌트
 * Phase 7-2: 경제 국면 판별 결과를 시각적으로 표시
 */

'use client';

import { CycleScore, AssetRecommendation, getPhaseEmoji, getPhaseDescription, getPhaseColor } from '@/utils/cycleCalculator';
import { CARD_CLASSES } from '@/styles/theme';

interface CyclePanelProps {
  score: CycleScore & { assets: AssetRecommendation };
}

export default function CyclePanel({ score }: CyclePanelProps) {
  const phaseColor = getPhaseColor(score.phase);

  return (
    <div className={`${CARD_CLASSES.container} mb-6 overflow-hidden`}>
      {/* 헤더 */}
      <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          🎯 경제 국면 판별
          <span className="text-xs font-normal text-gray-500 dark:text-gray-400">
            (신뢰도: {score.confidence}%)
          </span>
        </h3>
      </div>

      {/* 4축 게이지 그리드 */}
      <div className="p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <GaugeCard
            label="성장"
            value={score.growth}
            icon="📊"
            description="ISM PMI + 고용"
          />
          <GaugeCard
            label="인플레이션"
            value={score.inflation}
            icon="💰"
            description="CPI 기준"
          />
          <GaugeCard
            label="유동성"
            value={score.liquidity}
            icon="💧"
            description="실질금리 기준"
          />
          <GaugeCard
            label="정책"
            value={score.policy}
            icon="🏛️"
            description="연준 기준금리"
          />
        </div>

        {/* 국면 표시 + 추천 자산 */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          {/* 현재 국면 */}
          <div className="flex items-center gap-3">
            <span className="text-4xl">{getPhaseEmoji(score.phase)}</span>
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-xl font-bold text-${phaseColor}-600 dark:text-${phaseColor}-400`}>
                  현재 국면: {score.phase}
                </span>
                {score.confidence < 60 && (
                  <span className="text-xs px-2 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded">
                    불확실
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {getPhaseDescription(score.phase)}
              </p>
            </div>
          </div>

          {/* 추천 자산 */}
          <div className="flex-shrink-0">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">추천 자산</div>
            <div className="flex flex-wrap gap-2">
              {score.assets.favorable.map((asset) => (
                <span
                  key={asset}
                  className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-sm font-medium"
                >
                  ↑ {asset}
                </span>
              ))}
            </div>
            {score.assets.unfavorable.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {score.assets.unfavorable.map((asset) => (
                  <span
                    key={asset}
                    className="px-3 py-1 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-full text-sm font-medium"
                  >
                    ↓ {asset}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// GaugeCard 서브 컴포넌트
// ============================================================================

interface GaugeCardProps {
  label: string;
  value: number;
  icon: string;
  description: string;
}

function GaugeCard({ label, value, icon, description }: GaugeCardProps) {
  // 색상 결정 (0-100 점수 기반)
  const getColor = () => {
    if (value >= 70) return { stroke: '#10b981', text: 'text-green-600 dark:text-green-400' };
    if (value >= 40) return { stroke: '#f59e0b', text: 'text-yellow-600 dark:text-yellow-400' };
    return { stroke: '#ef4444', text: 'text-red-600 dark:text-red-400' };
  };

  const { stroke, text } = getColor();
  const circumference = 2 * Math.PI * 28; // r=28
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-center">
      {/* 아이콘 + 라벨 */}
      <div className="flex items-center justify-center gap-2 mb-2">
        <span className="text-lg">{icon}</span>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
      </div>

      {/* 원형 프로그레스 바 */}
      <div className="relative w-20 h-20 mx-auto mb-2">
        <svg className="transform -rotate-90" width="80" height="80">
          {/* 배경 원 */}
          <circle
            cx="40"
            cy="40"
            r="28"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            className="text-gray-200 dark:text-gray-700"
          />
          {/* 진행 원 */}
          <circle
            cx="40"
            cy="40"
            r="28"
            stroke={stroke}
            strokeWidth="8"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-500"
          />
        </svg>
        {/* 점수 표시 */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-xl font-bold ${text}`}>{value}</span>
        </div>
      </div>

      {/* 설명 */}
      <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
    </div>
  );
}
