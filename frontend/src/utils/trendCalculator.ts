/**
 * trendCalculator.ts
 *
 * 변화량(delta)을 0-100 Trend 점수로 변환
 * - 50 = 변화 없음 (중립)
 * - 100 = 강한 개선
 * - 0 = 강한 악화
 */

import { indicatorScales, type IndicatorScale } from './indicatorScales';

/**
 * 단일 변화량을 0-100 점수로 변환
 *
 * @param delta - 변화량 (현재값 - 이전값)
 * @param scale - 해당 기간의 스케일 값
 * @param inverse - true면 감소가 개선 (역방향 지표)
 * @returns 0-100 점수 (50 = 중립)
 */
export function trendScore(
  delta: number,
  scale: number,
  inverse: boolean
): number {
  // 역방향 지표면 부호 반전 (감소 = 개선 = 양수)
  const improvement = inverse ? -delta : delta;

  // 0-100 스케일로 변환 (50 중심)
  const score = 50 + 50 * (improvement / scale);

  // 0-100 범위로 클램프
  return Math.max(0, Math.min(100, score));
}

/**
 * 1M과 3M 변화율을 합쳐서 최종 Trend 점수 계산
 *
 * @param delta1M - 1개월 변화량
 * @param delta3M - 3개월 변화량
 * @param scale1 - 1개월 스케일
 * @param scale3 - 3개월 스케일
 * @param inverse - 역방향 여부
 * @returns 0-100 최종 Trend 점수
 */
export function calculateTrend(
  delta1M: number,
  delta3M: number,
  scale1: number,
  scale3: number,
  inverse: boolean
): number {
  const trend1M = trendScore(delta1M, scale1, inverse);
  const trend3M = trendScore(delta3M, scale3, inverse);

  // 3M에 더 높은 가중치 (노이즈 필터링)
  return 0.35 * trend1M + 0.65 * trend3M;
}

/**
 * 지표 ID로 Trend 점수 계산 (편의 함수)
 *
 * @param indicatorId - 지표 ID (indicatorScales의 키)
 * @param delta1M - 1개월 변화량
 * @param delta3M - 3개월 변화량
 * @returns 0-100 Trend 점수, 지표를 찾을 수 없으면 50 (중립) 반환
 */
export function calculateTrendForIndicator(
  indicatorId: string,
  delta1M: number,
  delta3M: number
): number {
  const scale = indicatorScales[indicatorId];

  if (!scale) {
    console.warn(`Unknown indicator: ${indicatorId}, returning neutral trend`);
    return 50;
  }

  return calculateTrend(
    delta1M,
    delta3M,
    scale.scale1,
    scale.scale3,
    scale.inverse
  );
}

/**
 * Trend 점수를 밴드로 분류
 */
export type TrendBand = "down" | "flat" | "up";

export function getTrendBand(trendScore: number): TrendBand {
  if (trendScore < 40) return "down";
  if (trendScore < 60) return "flat";
  return "up";
}

/**
 * Trend 밴드에 따른 한글 라벨
 */
export function getTrendLabel(trendScore: number): string {
  const band = getTrendBand(trendScore);
  switch (band) {
    case "down":
      return "악화";
    case "flat":
      return "횡보";
    case "up":
      return "개선";
  }
}

/**
 * 복수 지표의 Trend 점수를 가중 평균
 *
 * @param trends - { indicatorId: trendScore } 형태
 * @param weights - { indicatorId: weight } 형태 (합이 1이어야 함)
 * @returns 가중 평균 Trend 점수
 */
export function weightedTrendAverage(
  trends: Record<string, number>,
  weights: Record<string, number>
): number {
  let totalScore = 0;
  let totalWeight = 0;

  for (const [id, weight] of Object.entries(weights)) {
    if (trends[id] !== undefined) {
      totalScore += trends[id] * weight;
      totalWeight += weight;
    }
  }

  return totalWeight > 0 ? totalScore / totalWeight : 50;
}

/**
 * 사이클별 Trend 점수 계산
 */
export interface CycleTrendScores {
  macro: number;
  credit: number;
  sentiment: number;
}

/**
 * 사이클별 지표 가중치 정의
 */
export const cycleTrendWeights = {
  macro: {
    ism_manufacturing_pmi: 0.30,
    ism_services_pmi: 0.20,
    unemployment_rate: 0.20,
    core_cpi_yoy: 0.10,
    fed_funds_rate: 0.15,
    yield_curve_spread: 0.05,
  },
  credit: {
    hy_spread: 0.30,
    ig_spread: 0.20,
    fci: 0.25,
    m2_yoy: 0.15,
    vix_credit: 0.10,
  },
  sentiment: {
    vix_sentiment: 0.20,
    sp500_per: 0.20,
    shiller_cape: 0.15,
    put_call_ratio: 0.15,
    michigan_sentiment: 0.15,
    cb_consumer_confidence: 0.15,
  },
};

/**
 * 모든 사이클의 Trend 점수 계산
 *
 * @param indicatorTrends - 지표별 Trend 점수 { indicatorId: trendScore }
 * @returns 사이클별 Trend 점수
 */
export function calculateAllCycleTrends(
  indicatorTrends: Record<string, number>
): CycleTrendScores {
  return {
    macro: weightedTrendAverage(indicatorTrends, cycleTrendWeights.macro),
    credit: weightedTrendAverage(indicatorTrends, cycleTrendWeights.credit),
    sentiment: weightedTrendAverage(indicatorTrends, cycleTrendWeights.sentiment),
  };
}
