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
  },
  // 고용지표
  'unemployment-rate': {
    indicatorId: 'unemployment-rate',
    good: { max: 4.0 }, // 실업률은 낮을수록 좋음 (역방향)
    neutral: { min: 4.0, max: 6.0 },
    warning: { min: 6.0, max: 8.0 },
    bad: { min: 8.0 },
    baseline: 5.0,
    secondaryBaseline: 4.0,
    unit: 'percentage'
  },
  'nonfarm-payrolls': {
    indicatorId: 'nonfarm-payrolls',
    good: { min: 200 }, // 20만명 이상
    neutral: { min: 100, max: 200 }, // 10-20만명
    warning: { min: 0, max: 100 }, // 0-10만명
    bad: { max: 0 }, // 0명 미만 (일자리 감소)
    baseline: 150,
    secondaryBaseline: 200,
    unit: 'number'
  },
  'initial-jobless-claims': {
    indicatorId: 'initial-jobless-claims',
    good: { max: 350 }, // 35만명 미만 (낮을수록 좋음)
    neutral: { min: 350, max: 450 }, // 35-45만명
    warning: { min: 450, max: 600 }, // 45-60만명
    bad: { min: 600 }, // 60만명 이상
    baseline: 400,
    secondaryBaseline: 350,
    unit: 'number'
  },
  'average-hourly-earnings': {
    indicatorId: 'average-hourly-earnings',
    good: { min: 0.3 }, // 0.3% 이상
    neutral: { min: 0.1, max: 0.3 }, // 0.1-0.3%
    warning: { min: 0, max: 0.1 }, // 0-0.1%
    bad: { max: 0 }, // 0% 미만
    baseline: 0.2,
    unit: 'percentage'
  },
  'average-hourly-earnings-1777': {
    indicatorId: 'average-hourly-earnings-1777',
    good: { min: 3.0 }, // 연간 3% 이상
    neutral: { min: 2.0, max: 3.0 }, // 연간 2-3%
    warning: { min: 1.0, max: 2.0 }, // 연간 1-2%
    bad: { max: 1.0 }, // 연간 1% 미만
    baseline: 2.5,
    secondaryBaseline: 3.0,
    unit: 'percentage'
  },
  'participation-rate': {
    indicatorId: 'participation-rate',
    good: { min: 63.5 }, // 63.5% 이상
    neutral: { min: 62.5, max: 63.5 }, // 62.5-63.5%
    warning: { min: 61.5, max: 62.5 }, // 61.5-62.5%
    bad: { max: 61.5 }, // 61.5% 미만
    baseline: 63.0,
    secondaryBaseline: 63.5,
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
// 지표별 설명 정보 인터페이스
export interface IndicatorInfo {
  description: string;
  category: string;
  thresholds: {
    good: string;
    neutral: string;
    warning: string;
    bad: string;
  };
  referenceLines: string[];
  economicMeaning: string;
}

// 지표별 상세 정보 설정
export const INDICATOR_INFO: Record<string, IndicatorInfo> = {
  'ism-manufacturing': {
    description: '미국 제조업 구매관리자 지수 - 제조업 경기 선행지표',
    category: 'PMI 계열 (확장/수축)',
    thresholds: {
      good: '50 이상 - 제조업 확장',
      neutral: '45~50 - 수축 초기',
      warning: '42.3~45 - 침체 위험',
      bad: '42.3 미만 - GDP 연계 침체'
    },
    referenceLines: ['50선: 확장/수축 분기점', '42.3선: GDP 침체 신호선'],
    economicMeaning: '50 이상이면 제조업이 확장 국면, 42.3 미만이면 GDP 침체 가능성 높음'
  },
  'ism-non-manufacturing': {
    description: '미국 서비스업 구매관리자 지수 - 서비스업 경기 선행지표',
    category: 'PMI 계열 (확장/수축)',
    thresholds: {
      good: '50 이상 - 서비스업 확장',
      neutral: '45~50 - 수축',
      warning: '42.3~45 - 침체 위험',
      bad: '42.3 미만 - 심각한 수축'
    },
    referenceLines: ['50선: 확장/수축 분기점'],
    economicMeaning: '서비스업은 미국 GDP의 70% 이상을 차지하는 핵심 섹터'
  },
  'sp-global-composite': {
    description: 'S&P 글로벌 종합 PMI - 제조업과 서비스업 통합 지표',
    category: 'PMI 계열 (확장/수축)',
    thresholds: {
      good: '50 이상 - 전체 경기 확장',
      neutral: '45~50 - 수축',
      warning: '42.3~45 - 침체 위험',
      bad: '42.3 미만 - 심각한 수축'
    },
    referenceLines: ['50선: 확장/수축 분기점'],
    economicMeaning: '제조업과 서비스업을 종합한 전체 경기 상황 파악'
  },
  'cb-consumer-confidence': {
    description: 'CB 소비자 신뢰지수 - 소비자 심리 측정',
    category: 'Consumer 계열 (심리/신뢰도)',
    thresholds: {
      good: '80 이상 - 소비자 신뢰 안정',
      neutral: '70~80 - 보통',
      warning: '60~70 - 주의',
      bad: '60 미만 - 신뢰도 급락'
    },
    referenceLines: ['80선: 안정 기준점', '70선: 위험 신호선'],
    economicMeaning: '소비자 지출 의향과 직결되는 중요 심리지표'
  },
  'michigan-consumer-sentiment': {
    description: '미시간대 소비자 심리지수 - 소비자 기대심리 측정',
    category: 'Consumer 계열 (심리/신뢰도)',
    thresholds: {
      good: '100 이상 - 낙관적',
      neutral: '70~100 - 중립',
      warning: '50~70 - 비관',
      bad: '50 미만 - 극도 비관'
    },
    referenceLines: ['70선: 중립/비관 경계', '100선: 낙관 기준점'],
    economicMeaning: '소비자의 현재 상황 인식과 미래 기대 종합 측정'
  },
  'industrial-production': {
    description: '산업생산지수 (월간) - 제조업 생산활동 측정',
    category: 'Production 계열 (성장/수축)',
    thresholds: {
      good: '0.5% 이상 - 강한 성장',
      neutral: '-0.5%~0.5% - 정체',
      warning: '-1.5%~-0.5% - 수축',
      bad: '-1.5% 미만 - 급격한 수축'
    },
    referenceLines: ['0%선: 성장/수축 분기점'],
    economicMeaning: '실물경제 생산활동의 직접적 측정치'
  },
  'industrial-production-1755': {
    description: '산업생산지수 (연간) - 제조업 생산활동 연간 변화율',
    category: 'Production 계열 (성장/수축)',
    thresholds: {
      good: '0.5% 이상 - 강한 성장',
      neutral: '-0.5%~0.5% - 정체',
      warning: '-1.5%~-0.5% - 수축',
      bad: '-1.5% 미만 - 급격한 수축'
    },
    referenceLines: ['0%선: 성장/수축 분기점'],
    economicMeaning: '장기 생산 트렌드 파악에 유용한 연간 기준 지표'
  },
  'retail-sales': {
    description: '소매판매 (월간) - 소비자 지출활동 측정',
    category: 'Sales 계열 (소비활동)',
    thresholds: {
      good: '0.3% 이상 - 소비 증가',
      neutral: '-0.3%~0.3% - 정체',
      warning: '-1.0%~-0.3% - 소비 감소',
      bad: '-1.0% 미만 - 소비 급락'
    },
    referenceLines: ['0%선: 증가/감소 분기점'],
    economicMeaning: 'GDP의 70%를 차지하는 소비 부문의 핵심 지표'
  },
  'retail-sales-yoy': {
    description: '소매판매 (연간) - 소비자 지출활동 연간 변화율',
    category: 'Sales 계열 (소비활동)',
    thresholds: {
      good: '0.3% 이상 - 소비 증가',
      neutral: '-0.3%~0.3% - 정체',
      warning: '-1.0%~-0.3% - 소비 감소',
      bad: '-1.0% 미만 - 소비 급락'
    },
    referenceLines: ['0%선: 증가/감소 분기점'],
    economicMeaning: '장기 소비 트렌드와 인플레이션 조정된 실질 소비력 측정'
  },
  'gdp': {
    description: 'GDP 분기별 성장률 - 전체 경제 성장률 측정',
    category: 'GDP (전체 경제)',
    thresholds: {
      good: '2.0% 이상 - 안정 성장',
      neutral: '0~2.0% - 둔화',
      warning: '-1.0%~0% - 침체 위험',
      bad: '-1.0% 미만 - 경기 침체'
    },
    referenceLines: ['0%선: 침체/성장 분기점', '2.0%선: 안정 성장 기준'],
    economicMeaning: '경제 전체의 최종 성과 측정, 모든 지표의 종합 결과'
  },
  // 고용지표
  'unemployment-rate': {
    description: '실업률 - 경제활동인구 대비 실업자 비율 (역방향 지표)',
    category: '고용 계열 (노동시장)',
    thresholds: {
      good: '4.0% 미만 - 완전고용 수준',
      neutral: '4.0%~6.0% - 보통',
      warning: '6.0%~8.0% - 높은 실업',
      bad: '8.0% 이상 - 심각한 실업'
    },
    referenceLines: ['5.0%선: 자연실업률', '4.0%선: 완전고용 기준'],
    economicMeaning: '낮을수록 좋은 지표, 4% 미만이면 완전고용 달성'
  },
  'nonfarm-payrolls': {
    description: '비농업 고용 증가 - 월간 일자리 창출 수 (천명)',
    category: '고용 계열 (노동시장)',
    thresholds: {
      good: '200천명 이상 - 강한 고용 증가',
      neutral: '100~200천명 - 보통 증가',
      warning: '0~100천명 - 약한 증가',
      bad: '0천명 미만 - 일자리 감소'
    },
    referenceLines: ['150천명선: 평균 기준', '200천명선: 강한 증가 기준'],
    economicMeaning: '매월 새로 창출되는 일자리 수, 경기 판단의 핵심 지표'
  },
  'initial-jobless-claims': {
    description: '신규 실업급여 신청 - 주간 신규 실업자 수 (천명, 역방향)',
    category: '고용 계열 (노동시장)',
    thresholds: {
      good: '350천명 미만 - 안정적 고용',
      neutral: '350~450천명 - 보통',
      warning: '450~600천명 - 고용 불안',
      bad: '600천명 이상 - 심각한 실업'
    },
    referenceLines: ['400천명선: 평균 기준', '350천명선: 안정 기준'],
    economicMeaning: '낮을수록 좋은 지표, 고용시장 안정성의 실시간 측정'
  },
  'average-hourly-earnings': {
    description: '평균시간당임금 (월간) - 임금 인상률 측정',
    category: '고용 계열 (임금/인플레이션)',
    thresholds: {
      good: '0.3% 이상 - 강한 임금 상승',
      neutral: '0.1%~0.3% - 보통 상승',
      warning: '0%~0.1% - 약한 상승',
      bad: '0% 미만 - 임금 하락'
    },
    referenceLines: ['0.2%선: 평균 임금 증가율'],
    economicMeaning: '소비력 증대와 인플레이션 압력을 동시에 측정'
  },
  'average-hourly-earnings-1777': {
    description: '평균시간당임금 (연간) - 임금 인상률 연간 변화율',
    category: '고용 계열 (임금/인플레이션)',
    thresholds: {
      good: '3.0% 이상 - 강한 연간 임금 상승',
      neutral: '2.0%~3.0% - 보통 상승',
      warning: '1.0%~2.0% - 약한 상승',
      bad: '1.0% 미만 - 실질임금 감소'
    },
    referenceLines: ['2.5%선: 평균 기준', '3.0%선: 강한 상승 기준'],
    economicMeaning: '인플레이션 대비 실질 임금 증가 여부 판단'
  },
  'participation-rate': {
    description: '경제활동참가율 - 생산가능인구 대비 경제활동인구 비율',
    category: '고용 계열 (노동시장)',
    thresholds: {
      good: '63.5% 이상 - 높은 참여도',
      neutral: '62.5%~63.5% - 보통',
      warning: '61.5%~62.5% - 낮은 참여도',
      bad: '61.5% 미만 - 매우 낮은 참여도'
    },
    referenceLines: ['63.0%선: 평균 기준', '63.5%선: 높은 참여 기준'],
    economicMeaning: '노동시장 활력도 측정, 구직포기자 증가 시 하락'
  }
};

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

  let consecutiveMonths = 0;
  let currentDirection: 'up' | 'down' | 'stable' = 'stable';

  // 첫 번째 비교에서 방향 결정
  const firstValue = parseValue(validData[0].actual);
  const secondValue = parseValue(validData[1].actual);

  if (firstValue === null || secondValue === null) {
    return { consecutiveMonths: 0, direction: 'stable' };
  }

  const initialDirection = firstValue > secondValue ? 'up' :
                          firstValue < secondValue ? 'down' : 'stable';

  if (initialDirection === 'stable') {
    return { consecutiveMonths: 0, direction: 'stable' };
  }

  currentDirection = initialDirection;
  consecutiveMonths = 1; // 첫 번째 변화를 1개월로 시작

  // 나머지 데이터에서 연속성 확인 (i=1부터 시작하여 다음 비교 수행)
  for (let i = 1; i < validData.length - 1; i++) {
    const currentValue = parseValue(validData[i].actual);
    const previousValue = parseValue(validData[i + 1].actual);

    if (currentValue === null || previousValue === null) break;

    const direction = currentValue > previousValue ? 'up' :
                     currentValue < previousValue ? 'down' : 'stable';

    // 방향이 바뀌거나 stable이면 연속성 중단
    if (direction !== currentDirection) {
      break;
    }

    // 연속성이 유지되면 카운트 증가
    consecutiveMonths++;
  }



  return {
    consecutiveMonths: consecutiveMonths,
    direction: currentDirection
  };
}