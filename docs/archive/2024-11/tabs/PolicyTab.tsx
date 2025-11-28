'use client';

import { useState, useEffect, useCallback } from 'react';
import EconomicIndicatorCard from '@/components/EconomicIndicatorCard';
import UpdateButton from '@/components/UpdateButton';
import PolicyDataSection from '@/components/PolicyDataSection';

interface IndicatorData {
  latest_release: {
    actual: string;
    forecast: string;
    previous: string;
    release_date: string;
    time: string;
    surprise?: number;
  };
  next_release: {
    release_date: string;
    forecast: string;
    previous: string;
  } | string;
}

const BACKEND_URL = 'https://investment-app-backend-x166.onrender.com';

// 안전한 숫자 파싱 함수
const safeParseNumber = (value: string | number | null | undefined, suffix: string = ''): number => {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    return parseFloat(value.replace(suffix, '')) || 0;
  }
  return 0;
};

export default function PolicyTab() {
  const [fomcMinutesData, setFomcMinutesData] = useState<IndicatorData | null>(null);
  const [consumerConfidenceData, setConsumerConfidenceData] = useState<IndicatorData | null>(null);
  const [businessInventoriesData, setBusinessInventoriesData] = useState<IndicatorData | null>(null);
  const [leadingIndicatorsData, setLeadingIndicatorsData] = useState<IndicatorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const fetchFomcMinutesData = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/rawdata/fomc-minutes`);
      const result = await response.json();
      if (result.status === 'success') {
        setFomcMinutesData(result.data);
      }
    } catch (error) {
      console.error('FOMC 회의록 데이터 로드 실패:', error);
    }
  };

  const fetchConsumerConfidenceData = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/rawdata/consumer-confidence`);
      const result = await response.json();
      if (result.status === 'success') {
        setConsumerConfidenceData(result.data);
      }
    } catch (error) {
      console.error('소비자 신뢰지수 데이터 로드 실패:', error);
    }
  };

  const fetchBusinessInventoriesData = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/rawdata/business-inventories`);
      const result = await response.json();
      if (result.status === 'success') {
        setBusinessInventoriesData(result.data);
      }
    } catch (error) {
      console.error('기업재고 데이터 로드 실패:', error);
    }
  };

  const fetchLeadingIndicatorsData = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/rawdata/leading-indicators`);
      const result = await response.json();
      if (result.status === 'success') {
        setLeadingIndicatorsData(result.data);
      }
    } catch (error) {
      console.error('선행지표 데이터 로드 실패:', error);
    }
  };

  const loadAllData = useCallback(async () => {
    setLoading(true);
    await Promise.all([
      fetchFomcMinutesData(),
      fetchConsumerConfidenceData(),
      fetchBusinessInventoriesData(),
      fetchLeadingIndicatorsData()
    ]);
    setLoading(false);
    setLastUpdated(new Date().toLocaleString('ko-KR'));
  }, []);

  const handleUpdate = async () => {
    await loadAllData();
    // PolicyDataSection의 데이터도 업데이트하도록 트리거
    setRefreshTrigger(prev => prev + 1);
  };

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* 업데이트 버튼 */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">정책지표</h2>
          <p className="text-gray-600 dark:text-gray-400">
            FOMC 회의록, 소비자 신뢰도, 선행지표 등 경제정책 관련 주요 지표
          </p>
          {lastUpdated && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              마지막 업데이트: {lastUpdated}
            </p>
          )}
        </div>
        <UpdateButton onUpdateComplete={handleUpdate} />
      </div>

      {/* 지표 카드들 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* FOMC 회의록 */}
        {fomcMinutesData && fomcMinutesData.latest_release && (
          <EconomicIndicatorCard
            indicator={{
              name: "FOMC 회의록",
              latestDate: fomcMinutesData.latest_release.release_date,
              nextDate: typeof fomcMinutesData.next_release === 'string'
                ? fomcMinutesData.next_release
                : fomcMinutesData.next_release?.release_date || "미정",
              actual: safeParseNumber(fomcMinutesData.latest_release.actual),
              forecast: safeParseNumber(fomcMinutesData.latest_release.forecast),
              previous: safeParseNumber(fomcMinutesData.latest_release.previous),
              surprise: (() => {
                const actualNum = safeParseNumber(fomcMinutesData.latest_release.actual);
                const forecastNum = safeParseNumber(fomcMinutesData.latest_release.forecast);
                return actualNum && forecastNum ? Math.round((actualNum - forecastNum) * 100) / 100 : null;
              })()
            }}
          />
        )}

        {/* 소비자 신뢰지수 */}
        {consumerConfidenceData && consumerConfidenceData.latest_release && (
          <EconomicIndicatorCard
            indicator={{
              name: "소비자 신뢰지수",
              latestDate: consumerConfidenceData.latest_release.release_date,
              nextDate: typeof consumerConfidenceData.next_release === 'string'
                ? consumerConfidenceData.next_release
                : consumerConfidenceData.next_release?.release_date || "미정",
              actual: safeParseNumber(consumerConfidenceData.latest_release.actual),
              forecast: safeParseNumber(consumerConfidenceData.latest_release.forecast),
              previous: safeParseNumber(consumerConfidenceData.latest_release.previous),
              surprise: (() => {
                const actualNum = safeParseNumber(consumerConfidenceData.latest_release.actual);
                const forecastNum = safeParseNumber(consumerConfidenceData.latest_release.forecast);
                return actualNum && forecastNum ? Math.round((actualNum - forecastNum) * 100) / 100 : null;
              })()
            }}
          />
        )}

        {/* 기업재고 */}
        {businessInventoriesData && businessInventoriesData.latest_release && (
          <EconomicIndicatorCard
            indicator={{
              name: "기업재고",
              latestDate: businessInventoriesData.latest_release.release_date,
              nextDate: typeof businessInventoriesData.next_release === 'string'
                ? businessInventoriesData.next_release
                : businessInventoriesData.next_release?.release_date || "미정",
              actual: safeParseNumber(businessInventoriesData.latest_release.actual, '%'),
              forecast: safeParseNumber(businessInventoriesData.latest_release.forecast, '%'),
              previous: safeParseNumber(businessInventoriesData.latest_release.previous, '%'),
              surprise: (() => {
                const actualNum = safeParseNumber(businessInventoriesData.latest_release.actual, '%');
                const forecastNum = safeParseNumber(businessInventoriesData.latest_release.forecast, '%');
                return actualNum && forecastNum ? Math.round((actualNum - forecastNum) * 100) / 100 : null;
              })()
            }}
          />
        )}

        {/* 선행지표 */}
        {leadingIndicatorsData && leadingIndicatorsData.latest_release && (
          <EconomicIndicatorCard
            indicator={{
              name: "선행지표",
              latestDate: leadingIndicatorsData.latest_release.release_date,
              nextDate: typeof leadingIndicatorsData.next_release === 'string'
                ? leadingIndicatorsData.next_release
                : leadingIndicatorsData.next_release?.release_date || "미정",
              actual: safeParseNumber(leadingIndicatorsData.latest_release.actual, '%'),
              forecast: safeParseNumber(leadingIndicatorsData.latest_release.forecast, '%'),
              previous: safeParseNumber(leadingIndicatorsData.latest_release.previous, '%'),
              surprise: (() => {
                const actualNum = safeParseNumber(leadingIndicatorsData.latest_release.actual, '%');
                const forecastNum = safeParseNumber(leadingIndicatorsData.latest_release.forecast, '%');
                return actualNum && forecastNum ? Math.round((actualNum - forecastNum) * 100) / 100 : null;
              })()
            }}
          />
        )}
      </div>

      {/* 데이터 섹션 */}
      <PolicyDataSection refreshTrigger={refreshTrigger} />
    </div>
  );
}