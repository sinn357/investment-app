"use client";

import React from 'react';
import {
  analyzeRegimeV2,
  getClarityLabel,
  getConflictDisplay,
  type RegimeAnalysisV2,
} from '@/utils/regimePatterns';
import {
  getCycleLabel,
  getLabelColorClass,
  getCycleHint,
  type CycleType,
} from '@/utils/cycleLabels';
import {
  calculateCreditWithDynamicWeight,
  formatWeightDisplay,
  getAdjustmentReasonLabel,
  getAdjustmentReasonColor,
} from '@/utils/creditDynamicWeight';

// Phase 5: 실질금리 정보
interface RealInterestRateData {
  real_rate: number | null;
  nominal_rate: number | null;
  inflation: number | null;
  score: number;
  regime: string; // 'stimulative' | 'neutral' | 'restrictive' | 'unknown' | 'error'
}

// Phase 5: 장단기 역전 정보
interface YieldCurveInversionData {
  current_spread: number | null;
  is_inverted: boolean;
  inversion_months: number;
  score: number;
  signal: string; // 'normal' | 'warning' | 'danger' | 'recession_risk' | 'unknown' | 'error'
}

// Phase 4: 스프레드 변화 속도 정보
interface SpreadVelocityData {
  current: number | null;
  delta_1m: number | null;
  delta_3m: number | null;
  velocity_score: number;
  alert_level: string; // 'normal' | 'warning' | 'danger' | 'unknown' | 'error'
}

// Phase 4: 급변 탐지 정보
interface RapidChangeData {
  has_rapid_change: boolean;
  rapid_indicators: string[];
  severity: string; // 'normal' | 'warning' | 'critical' | 'error'
}

interface MasterCycleData {
  mmc_score: number;
  phase: string;
  macro: {
    score: number;
    phase: string;
    state?: string;
    trend?: number; // 0-100 Trend 점수
    // Phase 5 강화 필드
    base_score?: number;
    real_interest_rate?: RealInterestRateData;
    yield_curve_inversion?: YieldCurveInversionData;
    enhancements_applied?: boolean;
  };
  credit: {
    score: number;
    state: string;
    phase?: string;
    trend?: number;
    // Phase 4 강화 필드
    base_score?: number;
    hy_velocity?: SpreadVelocityData;
    ig_velocity?: SpreadVelocityData;
    rapid_change?: RapidChangeData;
    enhancements_applied?: boolean;
  };
  sentiment: {
    score: number;
    state?: string;
    note?: string;
    trend?: number;
  };
  recommendation: string;
  updated_at: string;
  version?: string;
}

interface MasterCycleCardProps {
  data: MasterCycleData;
}

/**
 * Master Market Cycle Card
 * 3대 사이클(Macro, Credit, Sentiment)을 통합한 종합 투자 타이밍 점수 표시
 *
 * Phase 2 완료: Sentiment 실시간 점수 활성화 (VIX, S&P PE, CAPE, P/C Ratio, Michigan, CB)
 */
export default function MasterCycleCard({ data }: MasterCycleCardProps) {
  // MMC 점수에 따른 색상 결정
  const getMMCColor = (score: number): string => {
    if (score >= 80) return "text-emerald-600 dark:text-emerald-400";
    if (score >= 60) return "text-green-600 dark:text-green-400";
    if (score >= 40) return "text-yellow-600 dark:text-yellow-400";
    if (score >= 20) return "text-orange-600 dark:text-orange-400";
    return "text-red-600 dark:text-red-400";
  };

  const getBgColor = (score: number): string => {
    if (score >= 80) return "bg-emerald-50 dark:bg-emerald-950/20";
    if (score >= 60) return "bg-green-50 dark:bg-green-950/20";
    if (score >= 40) return "bg-yellow-50 dark:bg-yellow-950/20";
    if (score >= 20) return "bg-orange-50 dark:bg-orange-950/20";
    return "bg-red-50 dark:bg-red-950/20";
  };

  const getBorderColor = (score: number): string => {
    if (score >= 80) return "border-emerald-200 dark:border-emerald-800";
    if (score >= 60) return "border-green-200 dark:border-green-800";
    if (score >= 40) return "border-yellow-200 dark:border-yellow-800";
    if (score >= 20) return "border-orange-200 dark:border-orange-800";
    return "border-red-200 dark:border-red-800";
  };
  const getBadgeColor = (score: number): string => {
    if (score >= 80) return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200";
    if (score >= 60) return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200";
    if (score >= 40) return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200";
    if (score >= 20) return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200";
    return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200";
  };
  // 기존 액션맵은 cycleLabels.ts의 getCycleHint로 대체됨

  // Level×Trend 기반 국면 라벨 계산
  const macroTrend = data.macro.trend ?? 50; // 기본값 50 (중립)
  const creditTrend = data.credit.trend ?? 50;
  const sentimentTrend = data.sentiment.trend ?? 50;

  const macroLabel = getCycleLabel("macro", data.macro.score, macroTrend);
  const creditLabel = getCycleLabel("credit", data.credit.score, creditTrend);
  const sentimentLabel = getCycleLabel("sentiment", data.sentiment.score, sentimentTrend);

  // 국면별 투자 힌트 (새 시스템)
  const macroHint = getCycleHint("macro", data.macro.score, macroTrend);
  const creditHint = getCycleHint("credit", data.credit.score, creditTrend);
  const sentimentHint = getCycleHint("sentiment", data.sentiment.score, sentimentTrend);

  const [expanded, setExpanded] = React.useState(false);

  // Regime Pattern 분석 (Phase 2: 라벨 기반 + threshold 폴백)
  const regimeAnalysis: RegimeAnalysisV2 = analyzeRegimeV2(
    data.macro.score,
    macroTrend,
    data.credit.score,
    creditTrend,
    data.sentiment.score,
    sentimentTrend
  );

  // Credit 동적 가중치 계산
  const creditDynamic = calculateCreditWithDynamicWeight(data.credit.score, creditTrend);

  const clarityInfo = getClarityLabel(regimeAnalysis.clarity);
  const conflictInfo = getConflictDisplay(regimeAnalysis.conflictLevel);

  // Clarity 색상 매핑
  const getClarityColorClass = (color: string): string => {
    switch (color) {
      case "green": return "text-emerald-600 dark:text-emerald-400";
      case "yellow": return "text-amber-600 dark:text-amber-400";
      case "red": return "text-red-600 dark:text-red-400";
      default: return "text-gray-600 dark:text-gray-400";
    }
  };

  // Conflict 색상 매핑
  const getConflictColorClass = (color: string): string => {
    switch (color) {
      case "green": return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200";
      case "yellow": return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200";
      case "red": return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-200";
    }
  };

  return (
    <div className={`rounded-xl border-2 ${getBorderColor(data.mmc_score)} ${getBgColor(data.mmc_score)} p-6 shadow-lg`}>
      {/* 헤더 */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              🎯 Master Market Cycle
            </h2>
          </div>
          {data.version && (
            <span className="text-xs text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 px-2 py-1 rounded">
              {data.version}
            </span>
          )}
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          3대 사이클 통합 투자 타이밍 점수
        </p>
      </div>

      {/* MMC 종합 점수 */}
      <div className="flex items-center justify-between mb-4 p-4 bg-white dark:bg-gray-800 rounded-lg">
        <div>
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            종합 점수 <span className="text-xs opacity-70">(요약 온도계)</span>
          </div>
          <div className={`text-5xl font-bold ${getMMCColor(data.mmc_score)}`}>
            {data.mmc_score}
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            시장 국면
          </div>
          <div className={`text-xl font-semibold ${getMMCColor(data.mmc_score)}`}>
            {data.phase}
          </div>
        </div>
      </div>

      {/* Regime Pattern 분석 (Phase 2: 라벨 기반 매칭) */}
      <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        {/* Regime Tag */}
        <div className="mb-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Regime Tag
            </span>
            <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200 rounded-full">
              {regimeAnalysis.pattern?.name || "Mixed"}
            </span>
            {/* 매칭 방식 표시 */}
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              regimeAnalysis.matchMethod === 'label'
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200'
                : regimeAnalysis.matchMethod === 'threshold'
                ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200'
                : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-200'
            }`}>
              {regimeAnalysis.matchMethod === 'label' ? '🏷️ Label' :
               regimeAnalysis.matchMethod === 'threshold' ? '📊 Threshold' : '⚪ Fallback'}
            </span>
          </div>
          <div className="text-sm text-gray-900 dark:text-gray-100 font-medium">
            {regimeAnalysis.pattern?.tag}
          </div>
        </div>

        {/* Conflict Flag + Clarity */}
        <div className="flex items-center gap-4 mb-3">
          {/* Conflict Flag */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">축 충돌:</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getConflictColorClass(conflictInfo.color)}`}>
              {conflictInfo.icon && <span className="mr-1">{conflictInfo.icon}</span>}
              {conflictInfo.label}
            </span>
          </div>

          {/* Clarity/Alignment */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">신호 명확도:</span>
            <span className={`text-sm font-semibold ${getClarityColorClass(clarityInfo.color)}`}>
              {regimeAnalysis.clarity}점
            </span>
            <span className={`text-xs ${getClarityColorClass(clarityInfo.color)}`}>
              ({clarityInfo.label})
            </span>
          </div>
        </div>

        {/* 투자 시사점 */}
        <div className="text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/50 rounded p-2">
          <span className="font-semibold">투자 시사점:</span> {regimeAnalysis.pattern?.implication}
        </div>

        {/* Gating Trigger 경고 (Option B) */}
        {regimeAnalysis.gatingTriggers.length > 0 && (
          <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
            <div className="text-xs font-semibold text-red-800 dark:text-red-200">
              Gating Trigger 활성화
            </div>
            <div className="text-xs text-red-700 dark:text-red-300">
              {regimeAnalysis.gatingTriggers.map(t => t.name).join(", ")}
            </div>
          </div>
        )}
      </div>

      {/* 3대 사이클 요약 (Level×Trend 국면 라벨 표시) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* 거시경제 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xl">🌍</span>
              <div>
                <div className="text-sm font-semibold text-gray-800 dark:text-gray-100">거시경제</div>
                <div className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${getBadgeColor(data.macro.score)}`}>
                  {Math.round(data.macro.score)}점
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500 dark:text-gray-400">현재 국면</div>
              <div className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold ${getLabelColorClass(macroLabel.color)}`}>
                {macroLabel.label}
              </div>
            </div>
          </div>
          {/* Trend 표시 */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">Trend:</span>
            <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${macroTrend >= 60 ? 'bg-emerald-500' : macroTrend <= 40 ? 'bg-red-500' : 'bg-amber-500'}`}
                style={{ width: `${macroTrend}%` }}
              />
            </div>
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{Math.round(macroTrend)}</span>
          </div>
          {/* Phase 5: 실질금리 & 역전 정보 */}
          {data.macro.enhancements_applied && (
            <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700 space-y-1">
              {/* 실질금리 */}
              {data.macro.real_interest_rate && data.macro.real_interest_rate.real_rate !== null && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500 dark:text-gray-400">실질금리:</span>
                  <span className={`font-medium ${
                    data.macro.real_interest_rate.regime === 'stimulative'
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : data.macro.real_interest_rate.regime === 'restrictive'
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-amber-600 dark:text-amber-400'
                  }`}>
                    {data.macro.real_interest_rate.real_rate > 0 ? '+' : ''}{data.macro.real_interest_rate.real_rate.toFixed(2)}%
                    <span className="ml-1 text-[10px] opacity-75">
                      ({data.macro.real_interest_rate.regime === 'stimulative' ? '부양적'
                        : data.macro.real_interest_rate.regime === 'restrictive' ? '억제적' : '중립'})
                    </span>
                  </span>
                </div>
              )}
              {/* 장단기 역전 */}
              {data.macro.yield_curve_inversion && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500 dark:text-gray-400">스프레드 역전:</span>
                  <span className={`font-medium ${
                    data.macro.yield_curve_inversion.signal === 'normal'
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : data.macro.yield_curve_inversion.signal === 'warning'
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {data.macro.yield_curve_inversion.is_inverted
                      ? `역전 ${data.macro.yield_curve_inversion.inversion_months}개월`
                      : '정상'}
                    {data.macro.yield_curve_inversion.current_spread !== null && (
                      <span className="ml-1 text-[10px] opacity-75">
                        ({data.macro.yield_curve_inversion.current_spread > 0 ? '+' : ''}{data.macro.yield_curve_inversion.current_spread.toFixed(2)}%)
                      </span>
                    )}
                  </span>
                </div>
              )}
            </div>
          )}
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 mt-2">투자 힌트</div>
          <div className="text-sm text-gray-800 dark:text-gray-100">{macroHint}</div>
        </div>

        {/* 신용/유동성 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xl">💧</span>
              <div>
                <div className="text-sm font-semibold text-gray-800 dark:text-gray-100">신용/유동성</div>
                <div className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${getBadgeColor(data.credit.score)}`}>
                  {Math.round(data.credit.score)}점
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500 dark:text-gray-400">현재 국면</div>
              <div className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold ${getLabelColorClass(creditLabel.color)}`}>
                {creditLabel.label}
              </div>
            </div>
          </div>
          {/* Trend 표시 */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">Trend:</span>
            <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${creditTrend >= 60 ? 'bg-emerald-500' : creditTrend <= 40 ? 'bg-red-500' : 'bg-amber-500'}`}
                style={{ width: `${creditTrend}%` }}
              />
            </div>
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{Math.round(creditTrend)}</span>
          </div>
          {/* 동적 가중치 표시 */}
          <div className="flex items-center gap-2 mb-2 text-xs">
            <span className="text-gray-500 dark:text-gray-400">가중치:</span>
            <span className={getAdjustmentReasonColor(creditDynamic.adjustmentReason)}>
              {getAdjustmentReasonLabel(creditDynamic.adjustmentReason)}
            </span>
            <span className="text-gray-400 dark:text-gray-500">
              ({formatWeightDisplay(creditDynamic)})
            </span>
          </div>
          {/* Phase 4: 스프레드 변화 속도 & 급변 탐지 */}
          {data.credit.enhancements_applied && (
            <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700 space-y-1">
              {/* HY 스프레드 변화 */}
              {data.credit.hy_velocity && data.credit.hy_velocity.delta_1m !== null && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500 dark:text-gray-400">HY Δ1M:</span>
                  <span className={`font-medium ${
                    data.credit.hy_velocity.alert_level === 'normal'
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : data.credit.hy_velocity.alert_level === 'warning'
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {data.credit.hy_velocity.delta_1m > 0 ? '+' : ''}{data.credit.hy_velocity.delta_1m}bp
                    {data.credit.hy_velocity.alert_level !== 'normal' && (
                      <span className="ml-1">⚠️</span>
                    )}
                  </span>
                </div>
              )}
              {/* IG 스프레드 변화 */}
              {data.credit.ig_velocity && data.credit.ig_velocity.delta_1m !== null && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500 dark:text-gray-400">IG Δ1M:</span>
                  <span className={`font-medium ${
                    data.credit.ig_velocity.alert_level === 'normal'
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : data.credit.ig_velocity.alert_level === 'warning'
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {data.credit.ig_velocity.delta_1m > 0 ? '+' : ''}{data.credit.ig_velocity.delta_1m}bp
                    {data.credit.ig_velocity.alert_level !== 'normal' && (
                      <span className="ml-1">⚠️</span>
                    )}
                  </span>
                </div>
              )}
              {/* 급변 경고 배지 */}
              {data.credit.rapid_change?.has_rapid_change && (
                <div className={`mt-1 px-2 py-1 rounded text-xs ${
                  data.credit.rapid_change.severity === 'critical'
                    ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200'
                }`}>
                  ⚡ {data.credit.rapid_change.rapid_indicators.slice(0, 2).join(', ')}
                </div>
              )}
            </div>
          )}
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 mt-2">투자 힌트</div>
          <div className="text-sm text-gray-800 dark:text-gray-100">{creditHint}</div>
        </div>

        {/* 심리/밸류 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xl">🧠</span>
              <div>
                <div className="text-sm font-semibold text-gray-800 dark:text-gray-100">심리/밸류</div>
                <div className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${getBadgeColor(data.sentiment.score)}`}>
                  {Math.round(data.sentiment.score)}점
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500 dark:text-gray-400">현재 국면</div>
              <div className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold ${getLabelColorClass(sentimentLabel.color)}`}>
                {sentimentLabel.label}
              </div>
            </div>
          </div>
          {/* Trend 표시 */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">Trend:</span>
            <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${sentimentTrend >= 60 ? 'bg-emerald-500' : sentimentTrend <= 40 ? 'bg-red-500' : 'bg-amber-500'}`}
                style={{ width: `${sentimentTrend}%` }}
              />
            </div>
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{Math.round(sentimentTrend)}</span>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">투자 힌트</div>
          <div className="text-sm text-gray-800 dark:text-gray-100">{sentimentHint}</div>
        </div>
      </div>

      {/* 투자 추천 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border-l-4 border-blue-500">
        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
          💡 투자 추천
        </div>
        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {data.recommendation}
        </div>
      </div>

      {/* 구조/수식 설명 (펼치기) */}
      <div className="mt-4">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-3 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm font-semibold text-gray-800 dark:text-gray-100"
        >
          <span>📖 점수 구조 & 지표 설명 보기</span>
          <span className="text-xs text-gray-500 dark:text-gray-400">{expanded ? "닫기" : "펼치기"}</span>
        </button>
        {expanded && (
          <div className="mt-3 space-y-3 text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div>
              <div className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Master Market Cycle 공식</div>
              <p>MMC = 0.50 × Sentiment + 0.30 × Credit + 0.20 × Macro</p>
            </div>
            <div>
              <div className="font-semibold text-gray-900 dark:text-gray-100 mb-1">거시경제 (6개 지표)</div>
              <p>ISM 제조업(30%), ISM 서비스업(20%), 실업률(20%, 역방향), 근원 CPI(10%, 역방향), 연준 기준금리(15%, 역방향), 장단기금리차(5%).</p>
            </div>
            <div>
              <div className="font-semibold text-gray-900 dark:text-gray-100 mb-1">신용/유동성 (5개 지표)</div>
              <p>HY 스프레드(30%, 역방향), IG 스프레드(20%, 역방향), 금융여건지수 FCI(25%, 역방향), M2 YoY(15%), VIX(10%, 역방향).</p>
            </div>
            <div>
              <div className="font-semibold text-gray-900 dark:text-gray-100 mb-1">심리/밸류에이션 (6개 지표)</div>
              <p>VIX(20%, 역방향), S&P500 PER(20%, 역방향), Shiller CAPE(15%, 역방향), Put/Call Ratio(15%), Michigan 소비자심리(15%), CB 소비자신뢰(15%).</p>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              점수는 0-100 스케일의 임계값 기반 점수화이며, 각 사이클 점수는 가중 평균으로 산출됩니다.
            </div>
          </div>
        )}
      </div>

      {/* 데이터 부족 안내 제거 (Phase 2 완료: Sentiment 실시간 점수 활성화) */}

      {/* 업데이트 시각 */}
      <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 text-right">
        업데이트: {new Date(data.updated_at).toLocaleString('ko-KR')}
      </div>
    </div>
  );
}
