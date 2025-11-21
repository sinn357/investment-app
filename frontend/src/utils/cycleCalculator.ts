/**
 * 경제 국면 판별 시스템
 * Phase 7-1: 4가지 축(성장/인플레이션/유동성/정책)을 점수화하여 사이클 자동 판단
 */

// ============================================================================
// Types
// ============================================================================

export type CyclePhase =
  | '골디락스'        // 성장↑ 인플↓ 유동성↑ - 최적 환경
  | '확장기'          // 성장↑ 인플↑ 유동성↑ - 경기 과열 초입
  | '과열기'          // 성장↑ 인플↑ 유동성↓ - 긴축 시작
  | '스태그플레이션'  // 성장↓ 인플↑ 유동성↓ - 최악 환경
  | '수축기'          // 성장↓ 인플↓ 유동성↓ - 경기 침체
  | '회복기'          // 성장↓ 인플↓ 유동성↑ - 부양 시작
  | '전환기';         // 명확하지 않은 중간 상태

export interface CycleScore {
  growth: number;       // 성장 점수 (0-100)
  inflation: number;    // 인플레이션 점수 (0-100)
  liquidity: number;    // 유동성 점수 (0-100)
  policy: number;       // 정책 점수 (0-100)
  phase: CyclePhase;    // 현재 국면
  confidence: number;   // 판단 신뢰도 (0-100)
}

export interface RawIndicators {
  // 성장 지표
  ismManufacturing?: number;      // ISM 제조업 PMI
  ismNonManufacturing?: number;   // ISM 비제조업 PMI
  unemploymentRate?: number;      // 실업률 (%)
  industrialProduction?: number;  // 산업생산 (YoY %)
  retailSales?: number;           // 소매판매 (YoY %)

  // 인플레이션 지표
  cpi?: number;                   // 소비자물가지수 (YoY %)
  cpiCore?: number;               // 근원 CPI (YoY %)

  // 유동성 지표
  nominalRate?: number;           // 명목금리 (10년물 국채 %)
  realRate?: number;              // 실질금리 (명목금리 - 인플레이션)

  // 정책 지표
  fedRate?: number;               // 연준 기준금리 (%)
}

export interface AssetRecommendation {
  favorable: string[];    // 유리한 자산
  neutral: string[];      // 중립 자산
  unfavorable: string[];  // 불리한 자산
}

// ============================================================================
// 정규화 함수들 (Raw 값 → 0-100 점수)
// ============================================================================

/**
 * ISM PMI 정규화
 * 50 = 중립 (확장/수축 분기점)
 * 60+ = 매우 강함 (100점)
 * 40- = 매우 약함 (0점)
 */
function normalizeISM(value: number | undefined): number {
  if (value === undefined) return 50; // 데이터 없으면 중립

  // 40-60 범위를 0-100으로 선형 변환
  if (value >= 60) return 100;
  if (value <= 40) return 0;
  return ((value - 40) / 20) * 100;
}

/**
 * 실업률 정규화 (역방향)
 * 낮을수록 좋음: 3.5% 이하 = 100점, 6% 이상 = 0점
 */
function normalizeUnemployment(value: number | undefined): number {
  if (value === undefined) return 50;

  if (value <= 3.5) return 100;
  if (value >= 6.0) return 0;
  return ((6.0 - value) / 2.5) * 100;
}

/**
 * CPI (인플레이션) 정규화
 * 2% = 최적 (연준 목표)
 * 0% 또는 4%+ = 문제
 */
function normalizeCPI(value: number | undefined): number {
  if (value === undefined) return 50;

  // 2%를 중심으로 대칭적 점수
  const distance = Math.abs(value - 2.0);

  if (distance <= 0.5) return 100; // 1.5-2.5% = 최적
  if (distance >= 3.0) return 0;   // 0% 미만 or 5% 이상 = 최악

  return 100 - (distance / 3.0) * 100;
}

/**
 * 실질금리 정규화
 * 0-2% = 최적 (적정 유동성)
 * 마이너스 = 과도한 부양
 * 4%+ = 긴축
 */
function normalizeRealRate(value: number | undefined): number {
  if (value === undefined) return 50;

  if (value >= 0 && value <= 2) return 100;
  if (value < -2) return 30;  // 과도한 부양
  if (value > 4) return 0;    // 긴축

  if (value < 0) {
    return 30 + (value + 2) / 2 * 70; // -2 ~ 0 구간
  } else {
    return 100 - ((value - 2) / 2) * 100; // 2 ~ 4 구간
  }
}

/**
 * 연준 기준금리 정규화
 * 2-3% = 중립
 * 0% = 완화
 * 5%+ = 긴축
 */
function normalizeFedRate(value: number | undefined): number {
  if (value === undefined) return 50;

  if (value >= 2 && value <= 3) return 50; // 중립
  if (value <= 1) return 100; // 완화
  if (value >= 5) return 0;   // 긴축

  if (value < 2) {
    return 50 + (2 - value) / 2 * 50; // 1 ~ 2 구간
  } else {
    return 50 - ((value - 3) / 2) * 50; // 3 ~ 5 구간
  }
}

// ============================================================================
// 4축 점수 계산
// ============================================================================

/**
 * 성장 점수 계산
 * 가중평균: ISM(40%) + 실업률(30%) + 산업생산(15%) + 소매판매(15%)
 */
function calculateGrowthScore(indicators: RawIndicators): number {
  const ism1 = normalizeISM(indicators.ismManufacturing);
  const ism2 = normalizeISM(indicators.ismNonManufacturing);
  const unemp = normalizeUnemployment(indicators.unemploymentRate);

  // 가중평균 (데이터 없으면 제외)
  let total = 0;
  let weight = 0;

  if (indicators.ismManufacturing !== undefined) {
    total += ism1 * 0.4;
    weight += 0.4;
  }
  if (indicators.ismNonManufacturing !== undefined) {
    total += ism2 * 0.3;
    weight += 0.3;
  }
  if (indicators.unemploymentRate !== undefined) {
    total += unemp * 0.3;
    weight += 0.3;
  }

  return weight > 0 ? total / weight : 50;
}

/**
 * 인플레이션 점수 계산
 * CPI 기반 (코어 CPI가 있으면 가중평균)
 */
function calculateInflationScore(indicators: RawIndicators): number {
  const cpi = normalizeCPI(indicators.cpi);
  const cpiCore = normalizeCPI(indicators.cpiCore);

  if (indicators.cpi !== undefined && indicators.cpiCore !== undefined) {
    return cpi * 0.6 + cpiCore * 0.4;
  } else if (indicators.cpi !== undefined) {
    return cpi;
  } else if (indicators.cpiCore !== undefined) {
    return cpiCore;
  }

  return 50; // 데이터 없으면 중립
}

/**
 * 유동성 점수 계산
 * 실질금리 기반
 */
function calculateLiquidityScore(indicators: RawIndicators): number {
  // 실질금리가 직접 제공되면 사용
  if (indicators.realRate !== undefined) {
    return normalizeRealRate(indicators.realRate);
  }

  // 명목금리 - 인플레이션으로 계산
  if (indicators.nominalRate !== undefined && indicators.cpi !== undefined) {
    const realRate = indicators.nominalRate - indicators.cpi;
    return normalizeRealRate(realRate);
  }

  return 50;
}

/**
 * 정책 점수 계산
 * 연준 기준금리 기반
 */
function calculatePolicyScore(indicators: RawIndicators): number {
  return normalizeFedRate(indicators.fedRate);
}

// ============================================================================
// 국면 판별
// ============================================================================

/**
 * 4축 점수를 바탕으로 경제 국면 판별
 */
function determinePhase(
  growth: number,
  inflation: number,
  liquidity: number,
  policy: number
): { phase: CyclePhase; confidence: number } {
  // 신뢰도 계산 (데이터가 많을수록, 극단적일수록 높음)
  const dataQuality = [growth, inflation, liquidity, policy]
    .filter(v => v !== 50) // 중립이 아닌 값만
    .length / 4;

  const extremeness = Math.abs(growth - 50) + Math.abs(inflation - 50) +
                      Math.abs(liquidity - 50) + Math.abs(policy - 50);

  const confidence = Math.min(100, dataQuality * 50 + extremeness / 2);

  // 국면 판별 로직
  const isGrowthHigh = growth > 60;
  const isGrowthLow = growth < 40;
  const isInflationHigh = inflation < 40; // 주의: inflation 점수는 낮을수록 인플레이션 높음
  const isInflationLow = inflation > 60;
  const isLiquidityHigh = liquidity > 60;
  const isLiquidityLow = liquidity < 40;

  // 6가지 명확한 국면
  if (isGrowthHigh && isInflationLow && isLiquidityHigh) {
    return { phase: '골디락스', confidence };
  }
  if (isGrowthHigh && isInflationHigh && isLiquidityHigh) {
    return { phase: '확장기', confidence };
  }
  if (isGrowthHigh && isInflationHigh && isLiquidityLow) {
    return { phase: '과열기', confidence };
  }
  if (isGrowthLow && isInflationHigh && isLiquidityLow) {
    return { phase: '스태그플레이션', confidence };
  }
  if (isGrowthLow && isInflationLow && isLiquidityLow) {
    return { phase: '수축기', confidence };
  }
  if (isGrowthLow && isInflationLow && isLiquidityHigh) {
    return { phase: '회복기', confidence };
  }

  // 명확하지 않으면 전환기
  return { phase: '전환기', confidence: confidence * 0.6 };
}

// ============================================================================
// 추천 자산
// ============================================================================

/**
 * 국면별 추천 자산 클래스
 */
function getAssetRecommendation(phase: CyclePhase): AssetRecommendation {
  const recommendations: Record<CyclePhase, AssetRecommendation> = {
    '골디락스': {
      favorable: ['주식', '회사채', '부동산'],
      neutral: ['국채'],
      unfavorable: ['금', '현금'],
    },
    '확장기': {
      favorable: ['주식', '원자재', '부동산'],
      neutral: ['회사채'],
      unfavorable: ['국채', '금'],
    },
    '과열기': {
      favorable: ['원자재', '금', '가치주'],
      neutral: ['주식'],
      unfavorable: ['국채', '성장주'],
    },
    '스태그플레이션': {
      favorable: ['금', '원자재', '현금'],
      neutral: ['가치주'],
      unfavorable: ['주식', '국채', '부동산'],
    },
    '수축기': {
      favorable: ['국채', '현금', '금'],
      neutral: ['가치주'],
      unfavorable: ['주식', '회사채', '부동산'],
    },
    '회복기': {
      favorable: ['주식', '회사채', '성장주'],
      neutral: ['국채', '부동산'],
      unfavorable: ['금', '원자재'],
    },
    '전환기': {
      favorable: ['균형 포트폴리오'],
      neutral: ['주식', '국채', '금'],
      unfavorable: [],
    },
  };

  return recommendations[phase];
}

// ============================================================================
// Main Export Function
// ============================================================================

/**
 * 경제 국면 점수 계산 (메인 함수)
 *
 * @param indicators - 경제 지표 원시 데이터
 * @returns 4축 점수 + 국면 + 추천 자산
 */
export function calculateCycleScore(indicators: RawIndicators): CycleScore & { assets: AssetRecommendation } {
  // 1. 4축 점수 계산
  const growth = calculateGrowthScore(indicators);
  const inflation = calculateInflationScore(indicators);
  const liquidity = calculateLiquidityScore(indicators);
  const policy = calculatePolicyScore(indicators);

  // 2. 국면 판별
  const { phase, confidence } = determinePhase(growth, inflation, liquidity, policy);

  // 3. 추천 자산
  const assets = getAssetRecommendation(phase);

  return {
    growth: Math.round(growth),
    inflation: Math.round(inflation),
    liquidity: Math.round(liquidity),
    policy: Math.round(policy),
    phase,
    confidence: Math.round(confidence),
    assets,
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * 국면별 이모지
 */
export function getPhaseEmoji(phase: CyclePhase): string {
  const emojis: Record<CyclePhase, string> = {
    '골디락스': '🌟',
    '확장기': '📈',
    '과열기': '🔥',
    '스태그플레이션': '⚠️',
    '수축기': '📉',
    '회복기': '🌱',
    '전환기': '🔄',
  };
  return emojis[phase];
}

/**
 * 국면별 설명
 */
export function getPhaseDescription(phase: CyclePhase): string {
  const descriptions: Record<CyclePhase, string> = {
    '골디락스': '성장은 강하고 인플레이션은 안정적인 최적의 투자 환경입니다.',
    '확장기': '경기가 확장되고 있지만 인플레이션 압력이 높아지고 있습니다.',
    '과열기': '경기 과열로 중앙은행이 긴축 정책을 시행하고 있습니다.',
    '스태그플레이션': '경기 침체와 높은 인플레이션이 동시에 발생하는 어려운 환경입니다.',
    '수축기': '경기가 수축하고 있어 방어적 자산 배분이 필요합니다.',
    '회복기': '경기가 바닥을 지나 회복 조짐을 보이고 있습니다.',
    '전환기': '경제 상황이 명확하지 않아 균형 잡힌 포트폴리오가 필요합니다.',
  };
  return descriptions[phase];
}

/**
 * 국면별 색상 (Tailwind)
 */
export function getPhaseColor(phase: CyclePhase): string {
  const colors: Record<CyclePhase, string> = {
    '골디락스': 'green',
    '확장기': 'blue',
    '과열기': 'orange',
    '스태그플레이션': 'red',
    '수축기': 'purple',
    '회복기': 'cyan',
    '전환기': 'gray',
  };
  return colors[phase];
}
