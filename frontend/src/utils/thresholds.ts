// 경제지표 임계점 및 배지 시스템 설정

export interface ThresholdRange {
  min?: number;
  max?: number;
}

export interface ThresholdConfig {
  indicatorId: string;
  good: ThresholdRange;
  neutral?: ThresholdRange;
  warning?: ThresholdRange;
  bad: ThresholdRange;
  baseline: number; // 그래프 기준선
  secondaryBaseline?: number; // 추가 기준선 (예: PMI 42.3)
  unit: 'number' | 'percentage';
}

export interface TrendInfo {
  consecutiveMonths: number;
  direction: 'up' | 'down' | 'stable';
}

export interface BadgeResult {
  status: 'good' | 'neutral' | 'warning' | 'bad';
  icon: string;
  color: string;
  message: string;
}

// 10개 지표별 임계점 설정 (GPT 검토 반영)
export const THRESHOLD_CONFIGS: Record<string, ThresholdConfig> = {
  'ism-manufacturing': {
    indicatorId: 'ism-manufacturing',
    good: { min: 50 },
    neutral: { min: 45, max: 50 },
    warning: { min: 42.3, max: 45 },
    bad: { max: 42.3 },
    baseline: 50,
    secondaryBaseline: 42.3,
    unit: 'number'
  },
  'ism-non-manufacturing': {
    indicatorId: 'ism-non-manufacturing',
    good: { min: 50 },
    neutral: { min: 45, max: 50 },
    warning: { min: 42.3, max: 45 },
    bad: { max: 42.3 },
    baseline: 50,
    unit: 'number'
  },
  'sp-global-composite': {
    indicatorId: 'sp-global-composite',
    good: { min: 50 },
    neutral: { min: 45, max: 50 },
    warning: { min: 42.3, max: 45 },
    bad: { max: 42.3 },
    baseline: 50,
    unit: 'number'
  },
  'cb-consumer-confidence': {
    indicatorId: 'cb-consumer-confidence',
    good: { min: 80 },
    neutral: { min: 70, max: 80 },
    warning: { min: 60, max: 70 },
    bad: { max: 60 },
    baseline: 80,
    secondaryBaseline: 70,
    unit: 'number'
  },
  'michigan-consumer-sentiment': {
    indicatorId: 'michigan-consumer-sentiment',
    good: { min: 100 },
    neutral: { min: 70, max: 100 },
    warning: { min: 50, max: 70 },
    bad: { max: 50 },
    baseline: 70,
    secondaryBaseline: 100,
    unit: 'number'
  },
  'industrial-production': {
    indicatorId: 'industrial-production',
    good: { min: 0.5 },
    neutral: { min: -0.5, max: 0.5 },
    warning: { min: -1.5, max: -0.5 },
    bad: { max: -1.5 },
    baseline: 0,
    unit: 'percentage'
  },
  'industrial-production-1755': {
    indicatorId: 'industrial-production-1755',
    good: { min: 0.5 },
    neutral: { min: -0.5, max: 0.5 },
    warning: { min: -1.5, max: -0.5 },
    bad: { max: -1.5 },
    baseline: 0,
    unit: 'percentage'
  },
  'retail-sales': {
    indicatorId: 'retail-sales',
    good: { min: 0.3 },
    neutral: { min: -0.3, max: 0.3 },
    warning: { min: -1.0, max: -0.3 },
    bad: { max: -1.0 },
    baseline: 0,
    unit: 'percentage'
  },
  'retail-sales-yoy': {
    indicatorId: 'retail-sales-yoy',
    good: { min: 0.3 },
    neutral: { min: -0.3, max: 0.3 },
    warning: { min: -1.0, max: -0.3 },
    bad: { max: -1.0 },
    baseline: 0,
    unit: 'percentage'
  },
  'gdp': {
    indicatorId: 'gdp',
    good: { min: 2.0 },
    neutral: { min: 0, max: 2.0 },
    warning: { min: -1.0, max: 0 },
    bad: { max: -1.0 },
    baseline: 0,
    secondaryBaseline: 2.0,
    unit: 'percentage'
  }
};

// 배지 로직 함수 (GPT 검토 반영)
export function getThresholdBadge(
  value: number,
  config: ThresholdConfig,
  trend?: TrendInfo
): BadgeResult {
  let trendText = '';
  if (trend && trend.consecutiveMonths >= 3) {
    const direction = trend.direction === 'up' ? '상승' : '하락';
    trendText = ` (${trend.consecutiveMonths}개월 연속 ${direction})`;
  }

  // 4단계 배지 시스템
  if (config.good.min !== undefined && value >= config.good.min) {
    if (config.good.max === undefined || value <= config.good.max) {
      return {
        status: 'good',
        icon: '✅',
        color: 'text-green-600',
        message: `${value}${trendText}`
      };
    }
  }

  if (config.neutral &&
      config.neutral.min !== undefined && value >= config.neutral.min &&
      config.neutral.max !== undefined && value <= config.neutral.max) {
    return {
      status: 'neutral',
      icon: '➖',
      color: 'text-gray-600',
      message: `${value}${trendText}`
    };
  }

  if (config.warning &&
      config.warning.min !== undefined && value >= config.warning.min &&
      config.warning.max !== undefined && value <= config.warning.max) {
    return {
      status: 'warning',
      icon: '⚠️',
      color: 'text-yellow-600',
      message: `${value}${trendText}`
    };
  }

  return {
    status: 'bad',
    icon: '🔴',
    color: 'text-red-600',
    message: `${value}${trendText}`
  };
}

// 히스토리 데이터 인터페이스
interface HistoryDataItem {
  actual: string | number | null;
  release_date: string;
}

// 추세 분석 함수 (실제 히스토리 데이터 기반)
export function calculateTrend(historyData: HistoryDataItem[]): TrendInfo {
  if (!historyData || historyData.length < 3) {
    return { consecutiveMonths: 0, direction: 'stable' };
  }

  // % 데이터를 숫자로 변환하는 헬퍼 함수
  const parseValue = (value: string | number | null): number | null => {
    if (value === null) return null;
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const numStr = value.replace('%', '');
      const num = parseFloat(numStr);
      return isNaN(num) ? null : num;
    }
    return null;
  };

  // actual 값이 있는 데이터만 필터링하고 날짜순 정렬 (최신순)
  const validData = historyData
    .filter(item => item.actual !== null && item.actual !== undefined)
    .sort((a, b) => new Date(b.release_date).getTime() - new Date(a.release_date).getTime())
    .slice(0, 6); // 최근 6개월만 확인

  if (validData.length < 2) {
    return { consecutiveMonths: 0, direction: 'stable' };
  }

  let consecutiveMonths = 1;
  let currentDirection: 'up' | 'down' | 'stable' = 'stable';

  for (let i = 0; i < validData.length - 1; i++) {
    const currentValue = parseValue(validData[i].actual);
    const previousValue = parseValue(validData[i + 1].actual);

    if (currentValue === null || previousValue === null) break;

    const direction = currentValue > previousValue ? 'up' :
                     currentValue < previousValue ? 'down' : 'stable';

    if (i === 0) {
      currentDirection = direction;
    } else if (direction !== currentDirection || direction === 'stable') {
      break;
    }

    if (direction !== 'stable') {
      consecutiveMonths++;
    }
  }

  return {
    consecutiveMonths: consecutiveMonths,
    direction: currentDirection
  };
}