import { useEffect, useState } from 'react';
import { THRESHOLD_CONFIGS, getThresholdBadge, calculateTrend, TrendInfo } from '../utils/thresholds';

interface EconomicIndicator {
  name: string;
  latestDate: string;
  nextDate: string;
  actual: number | null;
  forecast: number | null;
  previous: number;
  surprise: number | null;
  threshold?: {
    value: number;
    type: 'warning' | 'critical';
  };
}

interface EconomicIndicatorCardProps {
  indicator: EconomicIndicator;
}

export default function EconomicIndicatorCard({ indicator }: EconomicIndicatorCardProps) {
  const [trend, setTrend] = useState<TrendInfo | null>(null);

  // 지표 ID 매핑 함수 (name에서 indicator ID 추출)
  const getIndicatorId = (name: string): string => {
    if (name.includes('ISM Manufacturing PMI')) return 'ism-manufacturing';
    if (name.includes('ISM Non-Manufacturing PMI')) return 'ism-non-manufacturing';
    if (name.includes('S&P Global Composite PMI')) return 'sp-global-composite';
    if (name.includes('CB Consumer Confidence')) return 'cb-consumer-confidence';
    if (name.includes('Michigan Consumer Sentiment')) return 'michigan-consumer-sentiment';
    if (name.includes('Industrial Production YoY')) return 'industrial-production-1755';
    if (name.includes('Industrial Production')) return 'industrial-production';
    if (name.includes('Retail Sales YoY')) return 'retail-sales-yoy';
    if (name.includes('Retail Sales')) return 'retail-sales';
    if (name.includes('GDP')) return 'gdp';
    return 'unknown';
  };

  // 히스토리 데이터 가져와서 추세 계산
  useEffect(() => {
    const fetchTrendData = async () => {
      const indicatorId = getIndicatorId(indicator.name);
      if (indicatorId === 'unknown') return;

      try {
        const response = await fetch(`https://investment-app-backend-x166.onrender.com/api/v2/history/${indicatorId}`);
        const result = await response.json();

        if (result.status === 'success' && result.data) {
          const calculatedTrend = calculateTrend(result.data);
          setTrend(calculatedTrend);
        }
      } catch (error) {
        console.error('Error fetching trend data:', error);
      }
    };

    fetchTrendData();
  }, [indicator.name]);

  // % 데이터를 숫자로 변환하는 헬퍼 함수
  const parseActualValue = (actual: number | string | null): number | null => {
    if (actual === null) return null;
    if (typeof actual === 'number') return actual;
    if (typeof actual === 'string') {
      const numStr = actual.replace('%', '');
      const num = parseFloat(numStr);
      return isNaN(num) ? null : num;
    }
    return null;
  };

  const getSurpriseColor = (surprise: number | null) => {
    if (surprise === null) return 'text-gray-500';
    if (surprise > 0) return 'text-green-600';
    if (surprise < 0) return 'text-red-600';
    return 'text-gray-500';
  };

  // 새로운 4단계 배지 시스템
  const getNewThresholdBadge = () => {
    const indicatorId = getIndicatorId(indicator.name);
    const config = THRESHOLD_CONFIGS[indicatorId];

    if (!config) return null;

    const actualValue = parseActualValue(indicator.actual);
    if (actualValue === null) return null;

    const badge = getThresholdBadge(actualValue, config, trend);

    return (
      <span className={`px-3 py-1 rounded-full text-sm font-bold ${badge.color}`}>
        {badge.icon} {badge.message}
      </span>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <h3 className="font-semibold text-lg text-gray-900 dark:text-white">{indicator.name}</h3>
        {getNewThresholdBadge()}
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-gray-500 dark:text-gray-400">최신 발표일</p>
          <p className="font-medium text-gray-900 dark:text-white">{indicator.latestDate}</p>
        </div>

        <div>
          <p className="text-gray-500 dark:text-gray-400">다음 발표일</p>
          <p className="font-medium text-gray-900 dark:text-white">{indicator.nextDate}</p>
        </div>

        <div>
          <p className="text-gray-500 dark:text-gray-400">실제치</p>
          <p className="font-medium text-gray-900 dark:text-white">
            {indicator.actual !== null ? indicator.actual : 'N/A'}
          </p>
        </div>

        <div>
          <p className="text-gray-500 dark:text-gray-400">예측치</p>
          <p className="font-medium text-gray-900 dark:text-white">
            {indicator.forecast !== null ? indicator.forecast : 'N/A'}
          </p>
        </div>

        <div>
          <p className="text-gray-500 dark:text-gray-400">이전치</p>
          <p className="font-medium text-gray-900 dark:text-white">{indicator.previous}</p>
        </div>

        <div>
          <p className="text-gray-500 dark:text-gray-400">서프라이즈</p>
          <p className={`font-medium ${getSurpriseColor(indicator.surprise)}`}>
            {indicator.surprise !== null
              ? `${indicator.surprise > 0 ? '+' : ''}${indicator.surprise.toFixed(2)}`
              : 'N/A'
            }
          </p>
        </div>
      </div>
    </div>
  );
}