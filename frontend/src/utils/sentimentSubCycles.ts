/**
 * sentimentSubCycles.ts
 *
 * Phase 2: Sentiment 서브사이클 분리
 *
 * 기존 Sentiment (6개 지표 혼합) →
 * - RiskAppetite: VIX, Put/Call Ratio (시장 공포/탐욕)
 * - Valuation: S&P500 PER, Shiller CAPE (가치 평가)
 * - Consumer: Michigan, CB (소비자 심리)
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

export interface SentimentSubCycleScore {
  score: number;       // 0-100 Level 점수
  trend: number;       // 0-100 Trend 점수
  levelBand: LevelBand;
  trendBand: TrendBand;
  label: string;
}

export interface SentimentSubCycles {
  riskAppetite: SentimentSubCycleScore;
  valuation: SentimentSubCycleScore;
  combined: SentimentSubCycleScore;
}

// ============================================================================
// 서브사이클별 지표 가중치
// ============================================================================

/**
 * RiskAppetite 지표 (시장 공포/탐욕)
 * - 높은 점수 = 공포 (역발상 매수 기회)
 * - 낮은 점수 = 탐욕 (주의 필요)
 */
export const RISK_APPETITE_WEIGHTS = {
  vix_sentiment: 0.50,      // VIX (역방향: 높으면 공포 = 점수 높음)
  put_call_ratio: 0.50,     // Put/Call Ratio (역방향)
};

/**
 * Valuation 지표 (가치 평가)
 * - 높은 점수 = 저평가 (저렴)
 * - 낮은 점수 = 고평가 (비쌈)
 */
export const VALUATION_WEIGHTS = {
  sp500_per: 0.50,          // S&P500 PER (역방향: 낮으면 저평가 = 점수 높음)
  shiller_cape: 0.50,       // Shiller CAPE (역방향)
};

/**
 * 통합 Sentiment 가중치 (서브사이클 → Combined)
 */
export const SENTIMENT_COMBINED_WEIGHTS = {
  riskAppetite: 0.50,       // 시장 심리가 절반
  valuation: 0.50,          // 밸류에이션이 절반
};

// ============================================================================
// 서브사이클별 국면 라벨
// ============================================================================

const riskAppetiteLabels: Record<LevelBand, Record<TrendBand, string>> = {
  high: {
    up: "패닉/기회",        // 극단적 공포, 악화 중 → 역발상 매수
    flat: "공포 유지",
    down: "공포 완화",
  },
  mid: {
    up: "불안 증가",
    flat: "중립",
    down: "안도 유입",
  },
  low: {
    up: "탐욕 둔화",
    flat: "탐욕 유지",
    down: "탐욕 심화",      // 버블 위험
  },
};

const valuationLabels: Record<LevelBand, Record<TrendBand, string>> = {
  high: {
    up: "저평가 심화",      // 매수 기회
    flat: "저평가 유지",
    down: "정상화 중",
  },
  mid: {
    up: "저평가 진입",
    flat: "적정 수준",
    down: "고평가 진입",
  },
  low: {
    up: "고평가 완화",
    flat: "고평가 유지",
    down: "버블 위험",      // 경계
  },
};

// ============================================================================
// 서브사이클 점수 계산
// ============================================================================

/**
 * 가중 평균 계산
 */
function weightedAverage(
  values: Record<string, number>,
  weights: Record<string, number>
): number {
  let totalScore = 0;
  let totalWeight = 0;

  for (const [key, weight] of Object.entries(weights)) {
    if (values[key] !== undefined) {
      totalScore += values[key] * weight;
      totalWeight += weight;
    }
  }

  return totalWeight > 0 ? totalScore / totalWeight : 50;
}

/**
 * RiskAppetite 점수 계산
 */
export function calculateRiskAppetite(
  indicatorScores: Record<string, number>,
  indicatorTrends: Record<string, number>
): SentimentSubCycleScore {
  const score = weightedAverage(indicatorScores, RISK_APPETITE_WEIGHTS);
  const trend = weightedAverage(indicatorTrends, RISK_APPETITE_WEIGHTS);
  const levelBand = getLevelBand(score);
  const trendBand = getTrendBand(trend);
  const label = riskAppetiteLabels[levelBand][trendBand];

  return { score, trend, levelBand, trendBand, label };
}

/**
 * Valuation 점수 계산
 */
export function calculateValuation(
  indicatorScores: Record<string, number>,
  indicatorTrends: Record<string, number>
): SentimentSubCycleScore {
  const score = weightedAverage(indicatorScores, VALUATION_WEIGHTS);
  const trend = weightedAverage(indicatorTrends, VALUATION_WEIGHTS);
  const levelBand = getLevelBand(score);
  const trendBand = getTrendBand(trend);
  const label = valuationLabels[levelBand][trendBand];

  return { score, trend, levelBand, trendBand, label };
}

/**
 * Combined Sentiment 점수 계산
 */
export function calculateCombinedSentiment(
  riskAppetite: SentimentSubCycleScore,
  valuation: SentimentSubCycleScore
): SentimentSubCycleScore {
  const score =
    SENTIMENT_COMBINED_WEIGHTS.riskAppetite * riskAppetite.score +
    SENTIMENT_COMBINED_WEIGHTS.valuation * valuation.score;
  const trend =
    SENTIMENT_COMBINED_WEIGHTS.riskAppetite * riskAppetite.trend +
    SENTIMENT_COMBINED_WEIGHTS.valuation * valuation.trend;
  const levelBand = getLevelBand(score);
  const trendBand = getTrendBand(trend);

  // Combined 라벨은 기존 sentiment 라벨 사용 (cycleLabels.ts)
  const combinedLabels: Record<LevelBand, Record<TrendBand, string>> = {
    high: { up: "패닉/기회", flat: "공포", down: "안도 반등 위험" },
    mid: { up: "리스크온 개선", flat: "중립", down: "리스크오프 누적" },
    low: { up: "도취 위험", flat: "낙관", down: "버블 위험" },
  };

  return {
    score,
    trend,
    levelBand,
    trendBand,
    label: combinedLabels[levelBand][trendBand],
  };
}

// ============================================================================
// 통합 함수
// ============================================================================

/**
 * 전체 Sentiment 서브사이클 계산
 *
 * @param indicatorScores - 지표별 Level 점수 { vix_sentiment: 65, ... }
 * @param indicatorTrends - 지표별 Trend 점수 { vix_sentiment: 58, ... }
 * @returns 3개 서브사이클 (riskAppetite, valuation, combined)
 */
export function calculateSentimentSubCycles(
  indicatorScores: Record<string, number>,
  indicatorTrends: Record<string, number>
): SentimentSubCycles {
  const riskAppetite = calculateRiskAppetite(indicatorScores, indicatorTrends);
  const valuation = calculateValuation(indicatorScores, indicatorTrends);
  const combined = calculateCombinedSentiment(riskAppetite, valuation);

  return { riskAppetite, valuation, combined };
}

// ============================================================================
// 서브사이클별 투자 힌트
// ============================================================================

export function getRiskAppetiteHint(
  levelBand: LevelBand,
  trendBand: TrendBand
): string {
  const hints: Record<LevelBand, Record<TrendBand, string>> = {
    high: {
      up: "극단적 공포. 역발상 매수 기회지만 변동성 주의.",
      flat: "공포 지속. 분할 진입 또는 관망.",
      down: "공포 완화 중. 추세 확인 후 진입 검토.",
    },
    mid: {
      up: "불안 증가 중. 방어적 자세 유지.",
      flat: "중립적 심리. 다른 지표 참고.",
      down: "리스크온 분위기. 점진적 확대 가능.",
    },
    low: {
      up: "탐욕 둔화. 이익실현 기회.",
      flat: "낙관 지속. 헤지 검토.",
      down: "탐욕 심화. 버블 경계, 리스크 축소.",
    },
  };
  return hints[levelBand][trendBand];
}

export function getValuationHint(
  levelBand: LevelBand,
  trendBand: TrendBand
): string {
  const hints: Record<LevelBand, Record<TrendBand, string>> = {
    high: {
      up: "저평가 심화. 장기 관점 매수 기회.",
      flat: "저평가 유지. 유지 또는 확대.",
      down: "밸류에이션 정상화 중. 추세 확인.",
    },
    mid: {
      up: "저평가 진입 중. 관심 종목 모니터링.",
      flat: "적정 수준. 선별적 투자.",
      down: "고평가 진입 중. 신규 매수 신중.",
    },
    low: {
      up: "고평가 완화. 압력 감소 관찰.",
      flat: "고평가 지속. 품질주 중심.",
      down: "버블 위험. 익스포저 축소 고려.",
    },
  };
  return hints[levelBand][trendBand];
}

// ============================================================================
// 서브사이클 색상 매핑
// ============================================================================

type LabelColor = "green" | "yellow" | "orange" | "red" | "blue" | "gray";

export function getRiskAppetiteColor(
  levelBand: LevelBand,
  trendBand: TrendBand
): LabelColor {
  // high = 공포 (역발상 기회 = 긍정적)
  const colors: Record<LevelBand, Record<TrendBand, LabelColor>> = {
    high: { up: "green", flat: "blue", down: "yellow" },
    mid: { up: "yellow", flat: "gray", down: "blue" },
    low: { up: "yellow", flat: "orange", down: "red" },
  };
  return colors[levelBand][trendBand];
}

export function getValuationColor(
  levelBand: LevelBand,
  trendBand: TrendBand
): LabelColor {
  // high = 저평가 (긍정적)
  const colors: Record<LevelBand, Record<TrendBand, LabelColor>> = {
    high: { up: "green", flat: "green", down: "blue" },
    mid: { up: "blue", flat: "gray", down: "yellow" },
    low: { up: "yellow", flat: "orange", down: "red" },
  };
  return colors[levelBand][trendBand];
}
