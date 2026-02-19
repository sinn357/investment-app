export type FlowCategoryKey =
  | 'business'
  | 'employment'
  | 'inflation'
  | 'interest'
  | 'trade'
  | 'credit'
  | 'sentiment';

export interface FlowIndicatorInput {
  id: string;
  name: string;
  nameKo?: string;
  category: string;
  actual: number | string | null;
  previous: number | string;
  data?: {
    history_table?: Array<{
      release_date: string;
      actual: number | string | null;
    }>;
  };
}

export interface FlowIndicatorPoint {
  id: string;
  name: string;
  value: number | null;
  valueText: string;
  trendPercent: number | null;
}

export interface FlowCategorySummary {
  key: FlowCategoryKey;
  label: string;
  question: string;
  level: {
    score: number;
    label: string;
  };
  trend: {
    score: number;
    label: string;
    symbol: '▲▲' | '▲' | '→' | '▼' | '▼▼';
    percent: number | null;
  };
  primaryMetric: string;
  interpretation: string;
  rateImplication: string;
  indicators: FlowIndicatorPoint[];
}

const LEVEL_LABELS = ['강한수축', '수축', '중립', '확장', '강한확장'];

const CATEGORY_META: Record<FlowCategoryKey, { label: string; question: string }> = {
  business: { label: '경기', question: '경제가 뜨거워지고 있는가, 식고 있는가?' },
  employment: { label: '고용', question: '사람들이 돈 벌 기회가 늘고 있는가, 줄고 있는가?' },
  inflation: { label: '물가', question: '돈의 가치가 얼마나 빨리 떨어지고 있는가?' },
  interest: { label: '금리', question: '돈의 가격이 어떻게 되고 있는가?' },
  trade: { label: '무역', question: '미국으로 달러가 들어오고 있는가, 나가고 있는가?' },
  credit: { label: '신용', question: '돈이 잘 돌고 있는가, 막히고 있는가?' },
  sentiment: { label: '심리', question: '시장이 두려워하는가, 탐욕스러운가?' },
};

const CATEGORY_INDICATORS: Record<FlowCategoryKey, string[]> = {
  business: ['ism-manufacturing', 'ism-non-manufacturing', 'retail-sales', 'michigan-consumer-sentiment'],
  employment: ['nonfarm-payrolls', 'unemployment-rate', 'average-hourly-earnings', 'initial-jobless-claims'],
  inflation: ['core-cpi', 'pce', 'cpi', 'brent-oil', 'sp-gsci'],
  interest: ['federal-funds-rate', 'two-year-treasury', 'ten-year-treasury', 'yield-curve-10y-2y', 'real-yield-tips'],
  trade: ['usd-index', 'usd-krw', 'goods-trade-balance', 'business-inventories-trade', 'baltic-dry-index', 'trade-balance'],
  credit: ['hy-spread', 'ig-spread', 'fci', 'yield-curve-10y-2y'],
  sentiment: ['vix', 'put-call-ratio', 'aaii-bull', 'sp500-pe'],
};

function parseNumeric(raw: number | string | null | undefined): number | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === 'number') return Number.isFinite(raw) ? raw : null;

  const text = String(raw).trim();
  if (!text || text === '-' || text.toLowerCase() === 'n/a') return null;

  let normalized = text.replace(/,/g, '').replace(/\+/g, '').replace(/%/g, '').trim();
  let multiplier = 1;
  if (normalized.endsWith('K')) {
    multiplier = 1_000;
    normalized = normalized.slice(0, -1);
  } else if (normalized.endsWith('M')) {
    multiplier = 1_000_000;
    normalized = normalized.slice(0, -1);
  } else if (normalized.endsWith('B')) {
    multiplier = 1_000_000_000;
    normalized = normalized.slice(0, -1);
  }

  const value = Number.parseFloat(normalized);
  if (!Number.isFinite(value)) return null;
  return value * multiplier;
}

function classifyTrend(percent: number | null): FlowCategorySummary['trend'] {
  if (percent === null || !Number.isFinite(percent)) {
    return { score: 3, label: '유지', symbol: '→', percent: null };
  }
  if (percent >= 10) return { score: 5, label: '강한 가속', symbol: '▲▲', percent };
  if (percent >= 3) return { score: 4, label: '가속', symbol: '▲', percent };
  if (percent > -3) return { score: 3, label: '유지', symbol: '→', percent };
  if (percent > -10) return { score: 2, label: '감속', symbol: '▼', percent };
  return { score: 1, label: '강한 감속', symbol: '▼▼', percent };
}

function levelByIndicator(indicatorId: string, value: number): number {
  switch (indicatorId) {
    case 'ism-manufacturing':
    case 'ism-non-manufacturing':
      if (value < 45) return 1;
      if (value < 48) return 2;
      if (value < 52) return 3;
      if (value < 55) return 4;
      return 5;
    case 'nonfarm-payrolls':
      if (value < 0) return 1;
      if (value < 100_000) return 2;
      if (value < 150_000) return 3;
      if (value < 250_000) return 4;
      return 5;
    case 'unemployment-rate':
      if (value > 6) return 1;
      if (value > 5) return 2;
      if (value > 4) return 3;
      if (value > 3.5) return 4;
      return 5;
    case 'core-cpi':
    case 'cpi':
    case 'pce':
      if (value > 4) return 1;
      if (value > 3) return 2;
      if (value > 2.5) return 3;
      if (value > 2) return 4;
      return 5;
    case 'vix':
      if (value > 30) return 1;
      if (value > 25) return 2;
      if (value > 18) return 3;
      if (value > 12) return 4;
      return 5;
    case 'hy-spread':
      if (value > 6) return 1;
      if (value > 4) return 2;
      if (value > 2.5) return 3;
      if (value > 1.5) return 4;
      return 5;
    case 'ig-spread':
      if (value > 2.2) return 1;
      if (value > 1.5) return 2;
      if (value > 1) return 3;
      if (value > 0.5) return 4;
      return 5;
    case 'yield-curve-10y-2y':
      if (value < -0.5) return 1;
      if (value < 0) return 2;
      if (value < 0.5) return 3;
      if (value < 1) return 4;
      return 5;
    default:
      if (value < 0) return 2;
      if (value < 1) return 3;
      if (value < 3) return 4;
      return 5;
  }
}

function getPreviousValue(indicator: FlowIndicatorInput): number | null {
  const prev = parseNumeric(indicator.previous);
  if (prev !== null) return prev;

  const history = indicator.data?.history_table;
  if (!history || history.length < 2) return null;

  const sorted = [...history].sort(
    (a, b) => new Date(b.release_date).getTime() - new Date(a.release_date).getTime()
  );

  return parseNumeric(sorted[1]?.actual);
}

function buildRateImplication(category: FlowCategoryKey, levelScore: number, trendScore: number): string {
  if (category === 'business') {
    return levelScore <= 2 || trendScore <= 2
      ? '경기 둔화 신호로 금리 인하 기대가 커질 수 있습니다.'
      : '경기 강세가 이어지면 금리 인상/고금리 유지 압력이 남습니다.';
  }
  if (category === 'employment') {
    return levelScore >= 4
      ? '고용이 강하면 연준의 금리 인하 속도는 늦어질 수 있습니다.'
      : '고용 둔화가 확인되면 금리 인하 기대가 강화될 수 있습니다.';
  }
  if (category === 'inflation') {
    return levelScore <= 2
      ? '물가 압력이 높아 금리 인하 전환이 지연될 가능성이 큽니다.'
      : '물가 안정 신호가 쌓이면 금리 인하 여지가 확대됩니다.';
  }
  if (category === 'interest') {
    return levelScore <= 2
      ? '실질 긴축 구간이면 성장주 부담이 커질 수 있습니다.'
      : '금리 부담이 완화되면 위험자산 선호가 회복될 수 있습니다.';
  }
  if (category === 'trade') {
    return levelScore <= 2
      ? '달러 강세/무역 둔화는 연준의 완화 전환 기대를 키울 수 있습니다.'
      : '무역 흐름이 안정적이면 급격한 금리 전환 압력은 제한됩니다.';
  }
  if (category === 'credit') {
    return levelScore <= 2
      ? '신용 경색 조짐은 유동성 공급 및 금리 인하 기대를 자극할 수 있습니다.'
      : '신용이 안정적이면 금리 유지 기조가 이어질 가능성이 높습니다.';
  }
  return levelScore <= 2
    ? '공포 심리 확대는 연준 완화 기대를 키울 수 있습니다.'
    : '탐욕 심리 과열은 연준의 긴축 경계 신호가 될 수 있습니다.';
}

export function calculateFlowSummaries(indicators: FlowIndicatorInput[]): FlowCategorySummary[] {
  const byId = new Map(indicators.map((indicator) => [indicator.id, indicator]));

  return (Object.keys(CATEGORY_META) as FlowCategoryKey[]).map((key) => {
    const indicatorIds = CATEGORY_INDICATORS[key];
    const points: FlowIndicatorPoint[] = [];
    const levelScores: number[] = [];
    const trendScores: number[] = [];

    indicatorIds.forEach((indicatorId) => {
      const indicator = byId.get(indicatorId);
      if (!indicator) return;

      const value = parseNumeric(indicator.actual);
      const previous = getPreviousValue(indicator);
      const trendPercent =
        value !== null && previous !== null && Math.abs(previous) > 0
          ? ((value - previous) / Math.abs(previous)) * 100
          : null;

      if (value !== null) {
        levelScores.push(levelByIndicator(indicator.id, value));
      }
      if (trendPercent !== null) {
        trendScores.push(classifyTrend(trendPercent).score);
      }

      points.push({
        id: indicator.id,
        name: indicator.nameKo || indicator.name,
        value,
        valueText: indicator.actual === null || indicator.actual === undefined ? '-' : String(indicator.actual),
        trendPercent,
      });
    });

    const levelScore = levelScores.length
      ? Math.min(5, Math.max(1, Math.round(levelScores.reduce((a, b) => a + b, 0) / levelScores.length)))
      : 3;

    const avgTrendPercent = points
      .map((point) => point.trendPercent)
      .filter((value): value is number => value !== null)
      .reduce((sum, value, _, arr) => sum + value / arr.length, 0);

    const trend = classifyTrend(Number.isFinite(avgTrendPercent) ? avgTrendPercent : null);

    const primary = points[0];
    const primaryMetric = primary
      ? `${primary.name} ${primary.valueText}`
      : '핵심 지표 데이터 없음';

    const meta = CATEGORY_META[key];
    const interpretation = `${meta.question} 현재 ${LEVEL_LABELS[levelScore - 1]} 상태이며 속도는 ${trend.label}입니다.`;

    return {
      key,
      label: meta.label,
      question: meta.question,
      level: {
        score: levelScore,
        label: LEVEL_LABELS[levelScore - 1],
      },
      trend,
      primaryMetric,
      interpretation,
      rateImplication: buildRateImplication(key, levelScore, trend.score),
      indicators: points,
    };
  });
}
