// regimePatterns.ts
// 0-100 scale, 50 = neutral. Higher = more risk-on / healthier.
//
// Priority: lower number matches first (risk patterns first).
// Gating triggers are a small subset used for Option B (dynamic weighting / alerts).
//
// Architecture Decision:
// - Option A (3축 독립 표시) 기본
// - Option B (극단 구간 동적 가중치) 제한적 적용
// - MMC는 "요약 온도계"로 강등, Regime Tag + Conflict Flag + Clarity 추가
//
// Phase 2: Level×Trend 라벨 기반 soft match 추가 (2025-01-20)
// - 기존 hard threshold condition 유지 (호환성)
// - labelCondition 추가로 라벨 기반 매칭 지원

import {
  type LevelBand,
  type TrendBand,
  getLevelBand,
  getTrendBand,
} from './cycleLabels';

// ============================================================================
// Types
// ============================================================================

/**
 * 라벨 기반 조건 (Phase 2)
 * - levelBand/trendBand: 단일 값 또는 배열 (OR 조건)
 * - 생략된 필드는 "아무거나" 의미
 */
export interface LabelCondition {
  levelBand?: LevelBand | LevelBand[];
  trendBand?: TrendBand | TrendBand[];
}

export interface LabelBasedCondition {
  macro?: LabelCondition;
  credit?: LabelCondition;
  sentiment?: LabelCondition;
}

export type RegimePattern = {
  id: string;
  name: string;
  condition: (s: number, c: number, m: number) => boolean;
  tag: string;
  implication: string;
  priority: number; // lower = earlier match
  isGatingTrigger?: boolean;
  // Phase 2: 라벨 기반 조건 (선택적)
  labelCondition?: LabelBasedCondition;
};

export type ConflictLevel = "none" | "mild" | "hard";

export type RegimeAnalysis = {
  pattern: RegimePattern | null;
  conflictLevel: ConflictLevel;
  hasConflict: boolean;
  clarity: number;
  gatingTriggers: RegimePattern[];
};

// ============================================================================
// 10 Regime Patterns (Priority Order: Risk patterns first)
// ============================================================================

export const regimePatterns: RegimePattern[] = [
  {
    id: "stagflation_stress",
    name: "Stagflation Stress",
    condition: (s, c, m) => m <= 35 && c <= 45 && s <= 45,
    tag: "복합 스트레스: 거시/신용/심리 동반 약화",
    implication:
      "리스크 최소화. 현금/단기채/방어 섹터 중심. (전략에 따라) 인플레 헤지 자산은 제한적으로. 레버리지/고베타 노출 회피.",
    priority: 10,
    isGatingTrigger: true,
    labelCondition: {
      macro: { levelBand: "low", trendBand: "down" },
      credit: { levelBand: ["low", "mid"], trendBand: "down" },
      sentiment: { levelBand: ["low", "mid"] },
    },
  },
  {
    id: "liquidity_crack",
    name: "Liquidity Crack",
    condition: (s, c, m) => c <= 30 && s <= 45 && m >= 50,
    tag: "유동성 균열: 신용 급랭, 심리 약화",
    implication:
      "레버리지/고위험 익스포저 축소. 현금/단기채/퀄리티 방어. 변동성 확대 가능성 높아 헤지 검토.",
    priority: 20,
    isGatingTrigger: true,
    labelCondition: {
      macro: { levelBand: ["mid", "high"] },
      credit: { levelBand: "low", trendBand: "down" },
      sentiment: { levelBand: ["low", "mid"] },
    },
  },
  {
    id: "crisis_bottom_candidate",
    name: "Crisis Bottom Candidate",
    condition: (s, c, m) => s >= 75 && c <= 35 && m <= 50,
    tag: "위기 바닥 후보: 공포 극단, 신용 경색",
    implication:
      "분할 진입만. '신용 안정(ΔC 개선/스프레드 피크아웃)' 확인 전까지 과비중 금지. 반등은 크지만 변동성도 최대.",
    priority: 30,
    isGatingTrigger: true,
    labelCondition: {
      macro: { levelBand: ["low", "mid"] },
      credit: { levelBand: "low" },
      sentiment: { levelBand: "high", trendBand: ["flat", "up"] }, // 극단적 공포
    },
  },
  {
    id: "false_dawn_bear_rally",
    name: "False Dawn (Bear-Market Rally)",
    condition: (s, c, m) => s >= 65 && c <= 45 && m >= 45,
    tag: "반등 함정: 심리만 회복, 신용이 못 따라옴",
    implication:
      "급등 추격 금지. 반등은 트레이딩 범주로 제한. C가 50+로 회복(또는 스프레드 정상화) 전까지 방어 유지.",
    priority: 40,
    labelCondition: {
      macro: { levelBand: ["mid", "high"] },
      credit: { levelBand: ["low", "mid"], trendBand: ["down", "flat"] },
      sentiment: { levelBand: "high", trendBand: "up" }, // 심리 개선 중
    },
  },
  {
    id: "macro_slowdown_markets_ok",
    name: "Macro Slowdown, Markets OK",
    condition: (s, c, m) => m <= 40 && c >= 55 && s >= 50,
    tag: "거시 둔화: 실물 약, 금융은 버팀",
    implication:
      "퀄리티/현금흐름 중심으로 방어적 운용. 경기민감/고베타는 보수적으로. '침체'가 아니라 '감속' 대응.",
    priority: 50,
    labelCondition: {
      macro: { levelBand: "low", trendBand: ["down", "flat"] },
      credit: { levelBand: ["mid", "high"] },
      sentiment: { levelBand: ["mid", "low"] }, // 낙관 또는 중립
    },
  },
  {
    id: "policy_pivot_window",
    name: "Policy Pivot Window",
    condition: (s, c, m) => m <= 45 && c >= 50 && s >= 55,
    tag: "피벗 창: 거시 약화, 금융여건 완화, 심리 개선",
    implication:
      "금리 하락 수혜(듀레이션/성장) 재평가 구간 가능. 단, 재침체 리스크 상존 -> 포지션 사이즈/리스크 규율 필수.",
    priority: 60,
    labelCondition: {
      macro: { levelBand: ["low", "mid"], trendBand: "up" }, // 바닥/개선 또는 회복
      credit: { levelBand: ["mid", "high"], trendBand: ["flat", "up"] },
      sentiment: { levelBand: ["mid", "high"] },
    },
  },
  {
    id: "recovery_kickstart",
    name: "Recovery Kickstart",
    condition: (s, c, m) => s >= 60 && c >= 45 && m <= 50,
    tag: "회복 초기: 심리 선행, 신용 완화 시작",
    implication:
      "경기민감/중소형을 점진 확대. 아직 M이 약하므로 속도 조절. C 추세 개선이 이어지는지(ΔC) 모니터링.",
    priority: 70,
    labelCondition: {
      macro: { levelBand: ["low", "mid"], trendBand: "up" },
      credit: { levelBand: "mid", trendBand: "up" },
      sentiment: { levelBand: "high" },
    },
  },
  {
    id: "goldilocks_risk_on",
    name: "Goldilocks Risk-On",
    condition: (s, c, m) => s >= 60 && c >= 60 && m >= 55,
    tag: "정상 Risk-On: 유동성/심리/거시 정렬",
    implication:
      "주식 비중 확대, 성장/퀄리티/베타 노출 OK. 방어자산 비중 축소. 리밸런스는 규율적으로만.",
    priority: 80,
    labelCondition: {
      macro: { levelBand: ["mid", "high"], trendBand: ["flat", "up"] },
      credit: { levelBand: "high" },
      sentiment: { levelBand: "high" },
    },
  },
  {
    id: "melt_up_risk_on",
    name: "Melt-Up Risk-On",
    condition: (s, c, m) => s >= 70 && c >= 55 && m >= 50,
    tag: "멜트업: 낙관 과다, 추세는 강함",
    implication:
      "추세추종은 가능하나 손절/트레일링/헤지 필수. 포지션 사이즈 규율 강화. 변동성 급전환에 대비.",
    priority: 90,
    labelCondition: {
      macro: { levelBand: ["mid", "high"] },
      credit: { levelBand: ["mid", "high"] },
      sentiment: { levelBand: "low", trendBand: "down" }, // 버블 위험 (탐욕 심화)
    },
  },
  {
    id: "late_cycle_euphoria",
    name: "Late-Cycle Euphoria",
    condition: (s, c, m) => s <= 35 && c >= 55 && m >= 60,
    tag: "후기 과열: 밸류 과민/거시 강/신용 양호",
    implication:
      "신규 고베타 추격 자제. 리밸런스(이익실현/헤지) 강화. 품질/현금흐름 선호, 변동성 확대 가능성 대비.",
    priority: 100,
    labelCondition: {
      macro: { levelBand: "high", trendBand: ["flat", "down"] }, // 고점/감속
      credit: { levelBand: ["mid", "high"] },
      sentiment: { levelBand: "low" }, // 과도한 낙관
    },
  },
];

// ============================================================================
// Fallback Pattern (매칭 실패 시)
// ============================================================================

export const fallbackPattern: RegimePattern = {
  id: "mixed_unclassified",
  name: "Mixed / Unclassified",
  condition: () => true, // always matches
  tag: "혼재/미분류: 명확한 국면 패턴 없음",
  implication:
    "신호가 명확하지 않음. 기존 포지션 유지 또는 중립 비중으로 관망. 추가 데이터 확인 후 판단.",
  priority: 999,
  isGatingTrigger: false,
};

// ============================================================================
// Conflict Detection (3단계: none / mild / hard)
// ============================================================================

export function detectConflictLevel(s: number, c: number, m: number): ConflictLevel {
  const threshold = 15; // strong if |x-50| >= 15

  const dirs = [
    { dir: s > 50 ? 1 : s < 50 ? -1 : 0, strong: Math.abs(s - 50) >= threshold },
    { dir: c > 50 ? 1 : c < 50 ? -1 : 0, strong: Math.abs(c - 50) >= threshold },
    { dir: m > 50 ? 1 : m < 50 ? -1 : 0, strong: Math.abs(m - 50) >= threshold },
  ].filter((x) => x.strong && x.dir !== 0);

  if (dirs.length < 2) return "none";

  const hasPos = dirs.some((x) => x.dir > 0);
  const hasNeg = dirs.some((x) => x.dir < 0);
  if (!(hasPos && hasNeg)) return "none";

  // hard conflict if at least 2 strong signals exist AND average strength is high
  const strengths = [Math.abs(s - 50), Math.abs(c - 50), Math.abs(m - 50)].sort(
    (a, b) => b - a
  );
  const avgTop2 = (strengths[0] + strengths[1]) / 2;

  return avgTop2 >= 25 ? "hard" : "mild";
}

export function detectConflict(s: number, c: number, m: number): boolean {
  return detectConflictLevel(s, c, m) !== "none";
}

// ============================================================================
// Clarity / Alignment Score (0-100)
// ============================================================================

export function calculateClarity(s: number, c: number, m: number): number {
  // Direction alignment: count how many are >=50 vs <50
  const signs = [
    s - 50 >= 0 ? 1 : -1,
    c - 50 >= 0 ? 1 : -1,
    m - 50 >= 0 ? 1 : -1,
  ];
  const posCount = signs.filter((x) => x === 1).length;
  const negCount = 3 - posCount;
  const alignment = Math.max(posCount, negCount) / 3; // 1.0 (all aligned) .. 0.67 (2 vs 1)

  // Strength: average distance from 50, scaled
  const avgDist = (Math.abs(s - 50) + Math.abs(c - 50) + Math.abs(m - 50)) / 3; // 0..50
  const strength = Math.min(1, avgDist / 25); // 0..1 (25 이상이면 충분히 강한 신호)

  // Base clarity emphasizes alignment first, then strength.
  const clarity = 100 * (0.7 * alignment + 0.3 * strength);

  // Penalize conflict a bit (keeps clarity intuitive)
  const conflict = detectConflictLevel(s, c, m);
  const penalty = conflict === "hard" ? 20 : conflict === "mild" ? 10 : 0;

  return Math.max(0, Math.min(100, Math.round(clarity - penalty)));
}

// ============================================================================
// Clarity Label (UI용)
// ============================================================================

export function getClarityLabel(clarity: number): { label: string; color: string } {
  if (clarity >= 80) return { label: "명확", color: "green" };
  if (clarity >= 60) return { label: "보통", color: "yellow" };
  return { label: "혼재/주의", color: "red" };
}

// ============================================================================
// Pattern Selection (First Match by Priority)
// ============================================================================

export function selectRegimePattern(
  s: number,
  c: number,
  m: number,
  patterns: RegimePattern[] = regimePatterns
): RegimePattern | null {
  const sorted = [...patterns].sort((a, b) => a.priority - b.priority);
  return sorted.find((p) => p.condition(s, c, m)) ?? null;
}

// ============================================================================
// Gating Triggers (Option B)
// ============================================================================

export function getGatingTriggers(
  s: number,
  c: number,
  m: number,
  patterns: RegimePattern[] = regimePatterns
): RegimePattern[] {
  return patterns
    .filter((p) => p.isGatingTrigger)
    .sort((a, b) => a.priority - b.priority)
    .filter((p) => p.condition(s, c, m));
}

// ============================================================================
// Full Regime Analysis (통합 분석 함수)
// ============================================================================

export function analyzeRegime(s: number, c: number, m: number): RegimeAnalysis {
  const pattern = selectRegimePattern(s, c, m) ?? fallbackPattern;
  const conflictLevel = detectConflictLevel(s, c, m);
  const clarity = calculateClarity(s, c, m);
  const gatingTriggers = getGatingTriggers(s, c, m);

  return {
    pattern,
    conflictLevel,
    hasConflict: conflictLevel !== "none",
    clarity,
    gatingTriggers,
  };
}

// ============================================================================
// Conflict Flag UI Helper
// ============================================================================

export function getConflictDisplay(level: ConflictLevel): {
  label: string;
  color: string;
  icon: string;
} {
  switch (level) {
    case "hard":
      return { label: "강한 충돌", color: "red", icon: "!!" };
    case "mild":
      return { label: "약한 충돌", color: "yellow", icon: "!" };
    default:
      return { label: "충돌 없음", color: "green", icon: "" };
  }
}

// ============================================================================
// Phase 2: Label-Based Regime Matching
// ============================================================================

/**
 * 단일 축의 라벨 조건 검사
 */
function matchesLabelCondition(
  actualLevel: LevelBand,
  actualTrend: TrendBand,
  condition?: LabelCondition
): boolean {
  if (!condition) return true; // 조건 없으면 통과

  // Level 검사
  if (condition.levelBand) {
    const allowedLevels = Array.isArray(condition.levelBand)
      ? condition.levelBand
      : [condition.levelBand];
    if (!allowedLevels.includes(actualLevel)) return false;
  }

  // Trend 검사
  if (condition.trendBand) {
    const allowedTrends = Array.isArray(condition.trendBand)
      ? condition.trendBand
      : [condition.trendBand];
    if (!allowedTrends.includes(actualTrend)) return false;
  }

  return true;
}

/**
 * 라벨 기반 패턴 매칭 검사
 *
 * @param pattern - 검사할 패턴
 * @param labels - 현재 3축의 Level×Trend 라벨
 * @returns 매칭 여부
 */
export function matchesLabelBasedPattern(
  pattern: RegimePattern,
  labels: {
    macro: { levelBand: LevelBand; trendBand: TrendBand };
    credit: { levelBand: LevelBand; trendBand: TrendBand };
    sentiment: { levelBand: LevelBand; trendBand: TrendBand };
  }
): boolean {
  if (!pattern.labelCondition) return false;

  const { macro, credit, sentiment } = pattern.labelCondition;

  return (
    matchesLabelCondition(labels.macro.levelBand, labels.macro.trendBand, macro) &&
    matchesLabelCondition(labels.credit.levelBand, labels.credit.trendBand, credit) &&
    matchesLabelCondition(labels.sentiment.levelBand, labels.sentiment.trendBand, sentiment)
  );
}

/**
 * 라벨 기반 패턴 선택 (Level×Trend 기반)
 *
 * @param macroLevel - 거시경제 Level 점수 (0-100)
 * @param macroTrend - 거시경제 Trend 점수 (0-100)
 * @param creditLevel - 신용 Level 점수 (0-100)
 * @param creditTrend - 신용 Trend 점수 (0-100)
 * @param sentimentLevel - 심리 Level 점수 (0-100)
 * @param sentimentTrend - 심리 Trend 점수 (0-100)
 * @returns 매칭된 패턴 또는 null
 */
export function selectRegimePatternByLabels(
  macroLevel: number,
  macroTrend: number,
  creditLevel: number,
  creditTrend: number,
  sentimentLevel: number,
  sentimentTrend: number,
  patterns: RegimePattern[] = regimePatterns
): RegimePattern | null {
  const labels = {
    macro: {
      levelBand: getLevelBand(macroLevel),
      trendBand: getTrendBand(macroTrend),
    },
    credit: {
      levelBand: getLevelBand(creditLevel),
      trendBand: getTrendBand(creditTrend),
    },
    sentiment: {
      levelBand: getLevelBand(sentimentLevel),
      trendBand: getTrendBand(sentimentTrend),
    },
  };

  const sorted = [...patterns]
    .filter((p) => p.labelCondition) // labelCondition이 있는 패턴만
    .sort((a, b) => a.priority - b.priority);

  return sorted.find((p) => matchesLabelBasedPattern(p, labels)) ?? null;
}

/**
 * 하이브리드 패턴 선택 (라벨 우선, hard threshold 폴백)
 *
 * Phase 2 기본 전략:
 * 1. 라벨 기반 매칭 시도
 * 2. 실패 시 기존 hard threshold 폴백
 */
export function selectRegimePatternHybrid(
  macroLevel: number,
  macroTrend: number,
  creditLevel: number,
  creditTrend: number,
  sentimentLevel: number,
  sentimentTrend: number,
  patterns: RegimePattern[] = regimePatterns
): { pattern: RegimePattern; matchMethod: "label" | "threshold" | "fallback" } {
  // 1. 라벨 기반 시도
  const labelMatch = selectRegimePatternByLabels(
    macroLevel,
    macroTrend,
    creditLevel,
    creditTrend,
    sentimentLevel,
    sentimentTrend,
    patterns
  );

  if (labelMatch) {
    return { pattern: labelMatch, matchMethod: "label" };
  }

  // 2. 기존 threshold 기반 폴백
  const thresholdMatch = selectRegimePattern(
    sentimentLevel,
    creditLevel,
    macroLevel,
    patterns
  );

  if (thresholdMatch) {
    return { pattern: thresholdMatch, matchMethod: "threshold" };
  }

  // 3. 완전 폴백
  return { pattern: fallbackPattern, matchMethod: "fallback" };
}

/**
 * 확장된 Regime Analysis (Phase 2: Level×Trend 포함)
 */
export interface RegimeAnalysisV2 extends RegimeAnalysis {
  matchMethod: "label" | "threshold" | "fallback";
  labels: {
    macro: { levelBand: LevelBand; trendBand: TrendBand };
    credit: { levelBand: LevelBand; trendBand: TrendBand };
    sentiment: { levelBand: LevelBand; trendBand: TrendBand };
  };
}

/**
 * Phase 2 통합 분석 함수
 */
export function analyzeRegimeV2(
  macroLevel: number,
  macroTrend: number,
  creditLevel: number,
  creditTrend: number,
  sentimentLevel: number,
  sentimentTrend: number
): RegimeAnalysisV2 {
  const { pattern, matchMethod } = selectRegimePatternHybrid(
    macroLevel,
    macroTrend,
    creditLevel,
    creditTrend,
    sentimentLevel,
    sentimentTrend
  );

  const conflictLevel = detectConflictLevel(sentimentLevel, creditLevel, macroLevel);
  const clarity = calculateClarity(sentimentLevel, creditLevel, macroLevel);
  const gatingTriggers = getGatingTriggers(sentimentLevel, creditLevel, macroLevel);

  const labels = {
    macro: {
      levelBand: getLevelBand(macroLevel),
      trendBand: getTrendBand(macroTrend),
    },
    credit: {
      levelBand: getLevelBand(creditLevel),
      trendBand: getTrendBand(creditTrend),
    },
    sentiment: {
      levelBand: getLevelBand(sentimentLevel),
      trendBand: getTrendBand(sentimentTrend),
    },
  };

  return {
    pattern,
    conflictLevel,
    hasConflict: conflictLevel !== "none",
    clarity,
    gatingTriggers,
    matchMethod,
    labels,
  };
}
