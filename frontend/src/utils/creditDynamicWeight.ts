/**
 * creditDynamicWeight.ts
 *
 * Phase 2: Credit Δ 동적 가중치
 *
 * Credit 변화 속도(Trend)가 급변하면 가중치 상향
 * - 평상시: Level 50% + Trend 50%
 * - 급변 시: Level 30% + Trend 70%
 *
 * 2025-01-20
 */

import {
  getLevelBand,
  getTrendBand,
  type LevelBand,
  type TrendBand,
} from './cycleLabels';

// ============================================================================
// Types
// ============================================================================

export interface CreditDynamicResult {
  /** 동적 가중치 적용된 최종 점수 */
  adjustedScore: number;
  /** 원본 Level 점수 */
  levelScore: number;
  /** 원본 Trend 점수 */
  trendScore: number;
  /** 적용된 Trend 가중치 (0.5 ~ 0.7) */
  trendWeight: number;
  /** 적용된 Level 가중치 (0.3 ~ 0.5) */
  levelWeight: number;
  /** 가중치 조정 사유 */
  adjustmentReason: "normal" | "moderate" | "rapid";
  /** Trend 강도 (|trend - 50|) */
  trendStrength: number;
  /** Level×Trend 밴드 */
  levelBand: LevelBand;
  trendBand: TrendBand;
}

// ============================================================================
// 임계값 상수
// ============================================================================

/** 급변 임계값 (|trend - 50| > 25) */
const RAPID_THRESHOLD = 25;

/** 중간 임계값 (|trend - 50| > 15) */
const MODERATE_THRESHOLD = 15;

/** 급변 시 Trend 가중치 */
const RAPID_TREND_WEIGHT = 0.70;

/** 중간 시 Trend 가중치 */
const MODERATE_TREND_WEIGHT = 0.60;

/** 평상시 Trend 가중치 */
const NORMAL_TREND_WEIGHT = 0.50;

// ============================================================================
// Core Function
// ============================================================================

/**
 * Credit 동적 가중치 적용
 *
 * Trend가 급변(50에서 멀어질수록)하면 Trend 가중치 증가
 *
 * @param levelScore - Credit Level 점수 (0-100)
 * @param trendScore - Credit Trend 점수 (0-100)
 * @returns 동적 가중치 적용 결과
 *
 * @example
 * // 평상시: Level 50%, Trend 50%
 * calculateCreditWithDynamicWeight(60, 55)
 * // → adjustedScore: 57.5, trendWeight: 0.50
 *
 * @example
 * // 급변 시: Level 30%, Trend 70%
 * calculateCreditWithDynamicWeight(60, 80)
 * // → adjustedScore: 74, trendWeight: 0.70
 */
export function calculateCreditWithDynamicWeight(
  levelScore: number,
  trendScore: number
): CreditDynamicResult {
  // Trend 강도 계산 (50이 중립)
  const trendStrength = Math.abs(trendScore - 50);

  // 가중치 결정
  let trendWeight: number;
  let adjustmentReason: "normal" | "moderate" | "rapid";

  if (trendStrength > RAPID_THRESHOLD) {
    // 급변: Trend 70%
    trendWeight = RAPID_TREND_WEIGHT;
    adjustmentReason = "rapid";
  } else if (trendStrength > MODERATE_THRESHOLD) {
    // 중간: Trend 60%
    trendWeight = MODERATE_TREND_WEIGHT;
    adjustmentReason = "moderate";
  } else {
    // 평상시: Trend 50%
    trendWeight = NORMAL_TREND_WEIGHT;
    adjustmentReason = "normal";
  }

  const levelWeight = 1 - trendWeight;

  // 동적 가중치 적용된 점수
  const adjustedScore = levelWeight * levelScore + trendWeight * trendScore;

  return {
    adjustedScore,
    levelScore,
    trendScore,
    trendWeight,
    levelWeight,
    adjustmentReason,
    trendStrength,
    levelBand: getLevelBand(adjustedScore),
    trendBand: getTrendBand(trendScore),
  };
}

// ============================================================================
// UI Helper Functions
// ============================================================================

/**
 * 가중치 조정 사유를 한글로 반환
 */
export function getAdjustmentReasonLabel(
  reason: "normal" | "moderate" | "rapid"
): string {
  switch (reason) {
    case "rapid":
      return "급변";
    case "moderate":
      return "변동";
    case "normal":
      return "정상";
  }
}

/**
 * 가중치 조정 사유에 따른 색상
 */
export function getAdjustmentReasonColor(
  reason: "normal" | "moderate" | "rapid"
): string {
  switch (reason) {
    case "rapid":
      return "text-red-600 dark:text-red-400";
    case "moderate":
      return "text-amber-600 dark:text-amber-400";
    case "normal":
      return "text-gray-600 dark:text-gray-400";
  }
}

/**
 * 가중치 표시 문자열
 */
export function formatWeightDisplay(result: CreditDynamicResult): string {
  const levelPct = Math.round(result.levelWeight * 100);
  const trendPct = Math.round(result.trendWeight * 100);
  return `Level ${levelPct}% : Trend ${trendPct}%`;
}

// ============================================================================
// 확장: Macro/Sentiment에도 적용 가능한 일반화 함수
// ============================================================================

export interface DynamicWeightConfig {
  /** 급변 임계값 */
  rapidThreshold: number;
  /** 중간 임계값 */
  moderateThreshold: number;
  /** 급변 시 Trend 가중치 */
  rapidTrendWeight: number;
  /** 중간 시 Trend 가중치 */
  moderateTrendWeight: number;
  /** 평상시 Trend 가중치 */
  normalTrendWeight: number;
}

/** Credit 기본 설정 */
export const CREDIT_WEIGHT_CONFIG: DynamicWeightConfig = {
  rapidThreshold: RAPID_THRESHOLD,
  moderateThreshold: MODERATE_THRESHOLD,
  rapidTrendWeight: RAPID_TREND_WEIGHT,
  moderateTrendWeight: MODERATE_TREND_WEIGHT,
  normalTrendWeight: NORMAL_TREND_WEIGHT,
};

/** Macro 설정 (Credit보다 보수적) */
export const MACRO_WEIGHT_CONFIG: DynamicWeightConfig = {
  rapidThreshold: 30,
  moderateThreshold: 20,
  rapidTrendWeight: 0.60,
  moderateTrendWeight: 0.55,
  normalTrendWeight: 0.50,
};

/** Sentiment 설정 (급변 민감) */
export const SENTIMENT_WEIGHT_CONFIG: DynamicWeightConfig = {
  rapidThreshold: 20,
  moderateThreshold: 12,
  rapidTrendWeight: 0.75,
  moderateTrendWeight: 0.65,
  normalTrendWeight: 0.50,
};

/**
 * 일반화된 동적 가중치 계산
 */
export function calculateDynamicWeight(
  levelScore: number,
  trendScore: number,
  config: DynamicWeightConfig
): CreditDynamicResult {
  const trendStrength = Math.abs(trendScore - 50);

  let trendWeight: number;
  let adjustmentReason: "normal" | "moderate" | "rapid";

  if (trendStrength > config.rapidThreshold) {
    trendWeight = config.rapidTrendWeight;
    adjustmentReason = "rapid";
  } else if (trendStrength > config.moderateThreshold) {
    trendWeight = config.moderateTrendWeight;
    adjustmentReason = "moderate";
  } else {
    trendWeight = config.normalTrendWeight;
    adjustmentReason = "normal";
  }

  const levelWeight = 1 - trendWeight;
  const adjustedScore = levelWeight * levelScore + trendWeight * trendScore;

  return {
    adjustedScore,
    levelScore,
    trendScore,
    trendWeight,
    levelWeight,
    adjustmentReason,
    trendStrength,
    levelBand: getLevelBand(adjustedScore),
    trendBand: getTrendBand(trendScore),
  };
}
