'use client';

import { useEffect, useState } from 'react';
import EconomicIndicatorCard from './EconomicIndicatorCard';
import UpdateButton from './UpdateButton';

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

export default function EconomicIndicatorsSection() {
  const [indicators, setIndicators] = useState<EconomicIndicator[]>([]);
  const [loading, setLoading] = useState(true);

  // % 데이터를 숫자로 변환하는 헬퍼 함수
  const parsePercentValue = (value: string | number | null): number | null => {
    if (value === null) return null;
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const numStr = value.replace('%', '');
      const num = parseFloat(numStr);
      return isNaN(num) ? null : num;
    }
    return null;
  };

  // v2 API에서 모든 지표 데이터 가져오기 (빠른 로딩)
  const fetchAllIndicatorsFromDB = async () => {
    try {
      const response = await fetch('https://investment-app-backend-x166.onrender.com/api/v2/indicators');
      const result = await response.json();

      if (result.status === 'success' && result.indicators) {
        const indicators: EconomicIndicator[] = result.indicators.map((item: any) => {
          const latest = item.data.latest_release;
          const next = item.data.next_release;

          // % 데이터를 숫자로 변환하여 서프라이즈 계산
          const actualNum = parsePercentValue(latest.actual);
          const forecastNum = parsePercentValue(latest.forecast);
          const surprise = actualNum !== null && forecastNum !== null
            ? Math.round((actualNum - forecastNum) * 100) / 100
            : null;

          // 지표별 threshold 설정
          let threshold;
          if (item.name.includes('PMI')) {
            threshold = { value: 50.0, type: 'warning' as const }; // PMI 50이 확장/수축 분기점
          } else if (item.name.includes('Production') || item.name.includes('Sales')) {
            threshold = { value: 0.0, type: 'warning' as const }; // 0% 기준점
          }

          return {
            name: item.name,
            latestDate: latest.release_date,
            nextDate: next.release_date,
            actual: latest.actual,
            forecast: latest.forecast,
            previous: latest.previous,
            surprise: surprise,
            threshold: threshold
          };
        });

        return indicators;
      }
      return [];
    } catch (error) {
      console.error('Error fetching indicators from database:', error);
      return [];
    }
  };

  // 데이터 새로고침 함수
  const refreshData = async () => {
    setLoading(true);
    const data = await fetchAllIndicatorsFromDB();
    setIndicators(data);
    setLoading(false);
  };

  useEffect(() => {
    // 컴포넌트 마운트 시 데이터베이스에서 즉시 로딩
    refreshData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <section className="py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            경제지표 Raw Data
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            주요 경제지표의 최신 데이터를 확인하세요
          </p>
        </div>

        {/* 업데이트 버튼 */}
        <UpdateButton onUpdateComplete={refreshData} />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {indicators.map((indicator, index) => (
            <EconomicIndicatorCard key={index} indicator={indicator} />
          ))}
        </div>

        {/* 데이터 소스 표시 */}
        <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>* 데이터 소스: 데이터베이스 (investing.com 크롤링)</p>
          <p>* 실시간 업데이트를 원하시면 위의 '실시간 업데이트' 버튼을 클릭하세요</p>
        </div>
      </div>
    </section>
  );
}