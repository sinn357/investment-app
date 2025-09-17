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
  const getSurpriseColor = (surprise: number | null) => {
    if (surprise === null) return 'text-gray-500';
    if (surprise > 0) return 'text-green-600';
    if (surprise < 0) return 'text-red-600';
    return 'text-gray-500';
  };

  const getThresholdBadge = (threshold?: { value: number; type: 'warning' | 'critical' }) => {
    if (!threshold) return null;

    const baseClasses = "px-2 py-1 rounded-full text-xs font-medium";
    const colorClasses = threshold.type === 'critical'
      ? "bg-red-100 text-red-800"
      : "bg-yellow-100 text-yellow-800";

    return (
      <span className={`${baseClasses} ${colorClasses}`}>
        {threshold.type === 'critical' ? '🚨' : '⚠️'} {threshold.value}
      </span>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <h3 className="font-semibold text-lg text-gray-900 dark:text-white">{indicator.name}</h3>
        {getThresholdBadge(indicator.threshold)}
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