/**
 * cycleLabels.ts
 *
 * Level×Trend 2차원 매트릭스 기반 국면 라벨 시스템
 *
 * Level (점수):
 *   - high: 60+ (양호/강세)
 *   - mid: 40-60 (중립)
 *   - low: 40- (악화/약세)
 *
 * Trend (변화율):
 *   - up: 60+ (개선 중)
 *   - flat: 40-60 (횡보)
 *   - down: 40- (악화 중)
 */

export type LevelBand = "low" | "mid" | "high";
export type TrendBand = "down" | "flat" | "up";
export type CycleType = "macro" | "credit" | "sentiment";

/**
 * Level 점수를 밴드로 분류
 */
export function getLevelBand(score: number): LevelBand {
  if (score < 40) return "low";
  if (score < 60) return "mid";
  return "high";
}

/**
 * Trend 점수를 밴드로 분류
 */
export function getTrendBand(score: number): TrendBand {
  if (score < 40) return "down";
  if (score < 60) return "flat";
  return "up";
}

// ======================
// Macro 국면 라벨 (9개)
// ======================
const macroLabels: Record<LevelBand, Record<TrendBand, string>> = {
  high: {
    up: "확장 가속",
    flat: "확장 유지",
    down: "고점/감속",
  },
  mid: {
    up: "회복",
    flat: "중립",
    down: "감속",
  },
  low: {
    up: "바닥/개선",
    flat: "수축 유지",
    down: "수축 악화",
  },
};

// ======================
// Credit 국면 라벨 (9개)
// ======================
const creditLabels: Record<LevelBand, Record<TrendBand, string>> = {
  high: {
    up: "완화",
    flat: "완화 유지",
    down: "긴축 시작",
  },
  mid: {
    up: "치유",
    flat: "중립",
    down: "스트레스",
  },
  low: {
    up: "위기 개선",
    flat: "경색",
    down: "경색 악화",
  },
};

// ======================
// Sentiment 국면 라벨 (9개)
// ======================
const sentimentLabels: Record<LevelBand, Record<TrendBand, string>> = {
  high: {
    up: "패닉/기회",
    flat: "공포",
    down: "안도 반등 위험",
  },
  mid: {
    up: "리스크온 개선",
    flat: "중립",
    down: "리스크오프 누적",
  },
  low: {
    up: "도취 위험",
    flat: "낙관",
    down: "버블 위험",
  },
};

// ======================
// 국면 라벨 색상 매핑
// ======================
type LabelColor = "green" | "yellow" | "orange" | "red" | "blue" | "gray";

const macroColors: Record<LevelBand, Record<TrendBand, LabelColor>> = {
  high: { up: "green", flat: "green", down: "yellow" },
  mid: { up: "blue", flat: "gray", down: "yellow" },
  low: { up: "blue", flat: "orange", down: "red" },
};

const creditColors: Record<LevelBand, Record<TrendBand, LabelColor>> = {
  high: { up: "green", flat: "green", down: "yellow" },
  mid: { up: "blue", flat: "gray", down: "yellow" },
  low: { up: "blue", flat: "orange", down: "red" },
};

const sentimentColors: Record<LevelBand, Record<TrendBand, LabelColor>> = {
  // Sentiment는 역방향: high=공포(역발상 매수), low=탐욕(매도)
  high: { up: "green", flat: "blue", down: "yellow" },
  mid: { up: "blue", flat: "gray", down: "yellow" },
  low: { up: "yellow", flat: "orange", down: "red" },
};

// ======================
// 통합 함수
// ======================

export interface CycleLabelResult {
  label: string;
  color: LabelColor;
  levelBand: LevelBand;
  trendBand: TrendBand;
}

/**
 * 사이클별 국면 라벨 가져오기
 *
 * @param cycle - 사이클 유형 (macro, credit, sentiment)
 * @param levelScore - Level 점수 (0-100)
 * @param trendScore - Trend 점수 (0-100)
 * @returns 국면 라벨 및 색상 정보
 */
export function getCycleLabel(
  cycle: CycleType,
  levelScore: number,
  trendScore: number
): CycleLabelResult {
  const levelBand = getLevelBand(levelScore);
  const trendBand = getTrendBand(trendScore);

  let label: string;
  let color: LabelColor;

  switch (cycle) {
    case "macro":
      label = macroLabels[levelBand][trendBand];
      color = macroColors[levelBand][trendBand];
      break;
    case "credit":
      label = creditLabels[levelBand][trendBand];
      color = creditColors[levelBand][trendBand];
      break;
    case "sentiment":
      label = sentimentLabels[levelBand][trendBand];
      color = sentimentColors[levelBand][trendBand];
      break;
  }

  return { label, color, levelBand, trendBand };
}

/**
 * 국면 라벨 색상을 Tailwind 클래스로 변환
 */
export function getLabelColorClass(color: LabelColor): string {
  const colorMap: Record<LabelColor, string> = {
    green: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200",
    yellow: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200",
    orange: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200",
    red: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200",
    blue: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200",
    gray: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-200",
  };
  return colorMap[color];
}

/**
 * 국면 라벨 텍스트 색상 클래스
 */
export function getLabelTextColorClass(color: LabelColor): string {
  const colorMap: Record<LabelColor, string> = {
    green: "text-emerald-600 dark:text-emerald-400",
    yellow: "text-amber-600 dark:text-amber-400",
    orange: "text-orange-600 dark:text-orange-400",
    red: "text-red-600 dark:text-red-400",
    blue: "text-blue-600 dark:text-blue-400",
    gray: "text-gray-600 dark:text-gray-400",
  };
  return colorMap[color];
}

// ======================
// 국면별 투자 힌트
// ======================

const macroHints: Record<LevelBand, Record<TrendBand, string>> = {
  high: {
    up: "성장주/하이베타 확대, 채권 비중 축소",
    flat: "현 포지션 유지, 리밸런싱 대기",
    down: "이익실현 준비, 방어 섹터 고려",
  },
  mid: {
    up: "점진적 리스크온, 퀄리티 중심",
    flat: "균형 포트폴리오 유지",
    down: "방어적 자산 확대, 현금 비중 증가",
  },
  low: {
    up: "분할 매수 시작, 경기민감주 주목",
    flat: "방어 유지, 추세 확인 대기",
    down: "현금/채권 우선, 리스크 최소화",
  },
};

const creditHints: Record<LevelBand, Record<TrendBand, string>> = {
  high: {
    up: "레버리지 활용 가능, 하이일드 고려",
    flat: "현 익스포저 유지",
    down: "레버리지 축소 시작, 퀄리티 이동",
  },
  mid: {
    up: "신용 회복 수혜주 관심",
    flat: "기본 포지션 유지",
    down: "고위험 익스포저 축소",
  },
  low: {
    up: "위기 탈출 시그널, 분할 진입",
    flat: "현금/단기채 유지, 관망",
    down: "리스크 오프, 안전자산 우선",
  },
};

const sentimentHints: Record<LevelBand, Record<TrendBand, string>> = {
  high: {
    up: "역발상 매수 기회, 공포에 매수",
    flat: "점진적 진입, 변동성 주의",
    down: "급반등 주의, 청산 압력 존재",
  },
  mid: {
    up: "리스크온 전환 중, 추세 확인",
    flat: "중립 유지, 방향성 대기",
    down: "방어적 포지션 강화",
  },
  low: {
    up: "과열 경계, 추격 매수 자제",
    flat: "이익실현/헤지 검토",
    down: "버블 붕괴 위험, 리스크 축소",
  },
};

/**
 * 사이클별 투자 힌트 가져오기
 */
export function getCycleHint(
  cycle: CycleType,
  levelScore: number,
  trendScore: number
): string {
  const levelBand = getLevelBand(levelScore);
  const trendBand = getTrendBand(trendScore);

  switch (cycle) {
    case "macro":
      return macroHints[levelBand][trendBand];
    case "credit":
      return creditHints[levelBand][trendBand];
    case "sentiment":
      return sentimentHints[levelBand][trendBand];
  }
}

// ======================
// 복합 국면 분석
// ======================

export interface CompositeCycleAnalysis {
  macro: CycleLabelResult;
  credit: CycleLabelResult;
  sentiment: CycleLabelResult;
  overallBias: "risk-on" | "neutral" | "risk-off";
  conflictLevel: "none" | "mild" | "strong";
}

/**
 * 3대 사이클 복합 분석
 */
export function analyzeCompositeCycle(
  macroLevel: number,
  macroTrend: number,
  creditLevel: number,
  creditTrend: number,
  sentimentLevel: number,
  sentimentTrend: number
): CompositeCycleAnalysis {
  const macro = getCycleLabel("macro", macroLevel, macroTrend);
  const credit = getCycleLabel("credit", creditLevel, creditTrend);
  const sentiment = getCycleLabel("sentiment", sentimentLevel, sentimentTrend);

  // Overall bias 계산
  const avgLevel = (macroLevel + creditLevel + sentimentLevel) / 3;
  const avgTrend = (macroTrend + creditTrend + sentimentTrend) / 3;

  let overallBias: "risk-on" | "neutral" | "risk-off";
  if (avgLevel >= 55 && avgTrend >= 50) {
    overallBias = "risk-on";
  } else if (avgLevel <= 45 || avgTrend <= 40) {
    overallBias = "risk-off";
  } else {
    overallBias = "neutral";
  }

  // Conflict level 계산
  const levels = [macroLevel, creditLevel, sentimentLevel];
  const maxLevel = Math.max(...levels);
  const minLevel = Math.min(...levels);
  const levelSpread = maxLevel - minLevel;

  let conflictLevel: "none" | "mild" | "strong";
  if (levelSpread >= 40) {
    conflictLevel = "strong";
  } else if (levelSpread >= 25) {
    conflictLevel = "mild";
  } else {
    conflictLevel = "none";
  }

  return {
    macro,
    credit,
    sentiment,
    overallBias,
    conflictLevel,
  };
}
