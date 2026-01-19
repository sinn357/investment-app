/**
 * indicatorScales.ts
 *
 * 각 지표의 1M/3M 변화량 스케일 정의
 * - scale1: 1개월 변화량 기준 (더 민감)
 * - scale3: 3개월 변화량 기준 (더 안정적)
 * - inverse: true면 감소가 개선 (실업률, 스프레드 등)
 * - unit: 변화량 단위
 */

export type IndicatorScale = {
  scale1: number;
  scale3: number;
  inverse: boolean;
  unit?: "pct_point" | "bp" | "index" | "ratio";
};

export const indicatorScales: Record<string, IndicatorScale> = {
  // ======================
  // Macro (거시경제)
  // ======================
  ism_manufacturing_pmi: {
    scale1: 1.75,
    scale3: 4.25,
    inverse: false,
    unit: "index",
  },
  ism_services_pmi: {
    scale1: 1.75,
    scale3: 4.25,
    inverse: false,
    unit: "index",
  },
  unemployment_rate: {
    scale1: 0.25, // capped
    scale3: 1.06,
    inverse: true,
    unit: "pct_point",
  },
  core_cpi_yoy: {
    scale1: 0.26,
    scale3: 0.64,
    inverse: true,
    unit: "pct_point",
  },
  fed_funds_rate: {
    scale1: 0.25, // capped
    scale3: 1.28,
    inverse: true,
    unit: "pct_point",
  },
  yield_curve_spread: {
    scale1: 0.18,
    scale3: 0.43,
    inverse: false,
    unit: "pct_point",
  },

  // ======================
  // Credit (신용/유동성)
  // ======================
  hy_spread: {
    scale1: 61.25,
    scale3: 148.75,
    inverse: true,
    unit: "bp",
  },
  ig_spread: {
    scale1: 17.5,
    scale3: 42.5,
    inverse: true,
    unit: "bp",
  },
  fci: {
    scale1: 0.18,
    scale3: 0.43,
    inverse: true,
    unit: "index",
  },
  m2_yoy: {
    scale1: 1.05,
    scale3: 2.55,
    inverse: false,
    unit: "pct_point",
  },
  vix_credit: {
    scale1: 2.28,
    scale3: 7.0, // floor applied
    inverse: true,
    unit: "index",
  },

  // ======================
  // Sentiment (심리/밸류)
  // ======================
  vix_sentiment: {
    scale1: 3.15,
    scale3: 7.65,
    inverse: true,
    unit: "index",
  },
  sp500_per: {
    scale1: 2.98,
    scale3: 7.23,
    inverse: true,
    unit: "ratio",
  },
  shiller_cape: {
    scale1: 4.38,
    scale3: 10.63,
    inverse: true,
    unit: "ratio",
  },
  put_call_ratio: {
    scale1: 0.11,
    scale3: 0.26,
    inverse: false,
    unit: "ratio",
  },
  michigan_sentiment: {
    scale1: 7.88,
    scale3: 19.13,
    inverse: false,
    unit: "index",
  },
  cb_consumer_confidence: {
    scale1: 6.13,
    scale3: 14.88,
    inverse: false,
    unit: "index",
  },
};

/**
 * 지표 ID로 스케일 정보 가져오기
 */
export function getIndicatorScale(indicatorId: string): IndicatorScale | null {
  return indicatorScales[indicatorId] || null;
}

/**
 * 지표가 역방향인지 확인
 */
export function isInverseIndicator(indicatorId: string): boolean {
  const scale = indicatorScales[indicatorId];
  return scale?.inverse ?? false;
}
