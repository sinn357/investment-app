'use client';

import { useState, useEffect, useCallback } from 'react';
import EconomicIndicatorCard from '@/components/EconomicIndicatorCard';
import UpdateButton from '@/components/UpdateButton';
import InterestRateDataSection from '@/components/InterestRateDataSection';

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

export default function InterestRateTab() {
  const [federalFundsRateData, setFederalFundsRateData] = useState<IndicatorData | null>(null);
  const [coreCPIData, setCoreCPIData] = useState<IndicatorData | null>(null);
  const [tenYearTreasuryData, setTenYearTreasuryData] = useState<IndicatorData | null>(null);
  const [twoYearTreasuryData, setTwoYearTreasuryData] = useState<IndicatorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const fetchFederalFundsRateData = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/rawdata/federal-funds-rate`);
      const result = await response.json();
      if (result.status === 'success') {
        setFederalFundsRateData(result.data);
      }
    } catch (error) {
      console.error('연방기금금리 데이터 로드 실패:', error);
    }
  };

  const fetchCoreCPIData = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/rawdata/core-cpi`);
      const result = await response.json();
      if (result.status === 'success') {
        setCoreCPIData(result.data);
      }
    } catch (error) {
      console.error('핵심 CPI 데이터 로드 실패:', error);
    }
  };

  const fetchTenYearTreasuryData = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/rawdata/ten-year-treasury`);
      const result = await response.json();
      if (result.status === 'success') {
        setTenYearTreasuryData(result.data);
      }
    } catch (error) {
      console.error('10년 국채수익률 데이터 로드 실패:', error);
    }
  };

  const fetchTwoYearTreasuryData = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/rawdata/two-year-treasury`);
      const result = await response.json();
      if (result.status === 'success') {
        setTwoYearTreasuryData(result.data);
      }
    } catch (error) {
      console.error('2년 국채수익률 데이터 로드 실패:', error);
    }
  };

  const loadAllData = useCallback(async () => {
    setLoading(true);
    await Promise.all([
      fetchFederalFundsRateData(),
      fetchCoreCPIData(),
      fetchTenYearTreasuryData(),
      fetchTwoYearTreasuryData()
    ]);
    setLoading(false);
    setLastUpdated(new Date().toLocaleString('ko-KR'));
  }, []);

  const handleUpdate = async () => {
    await loadAllData();
    // InterestRateDataSection의 데이터도 업데이트하도록 트리거
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
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">금리지표</h2>
          <p className="text-gray-600 dark:text-gray-400">
            연방기금금리, CPI, 국채수익률 등 금리 및 물가 관련 주요 지표
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
        {/* 연방기금금리 */}
        {federalFundsRateData && (
          <EconomicIndicatorCard
            indicator={{
              name: "연방기금금리",
              latestDate: federalFundsRateData.latest_release.release_date,
              nextDate: typeof federalFundsRateData.next_release === 'string'
                ? federalFundsRateData.next_release
                : federalFundsRateData.next_release?.release_date || "미정",
              actual: safeParseNumber(federalFundsRateData.latest_release.actual, '%'),
              forecast: safeParseNumber(federalFundsRateData.latest_release.forecast, '%'),
              previous: safeParseNumber(federalFundsRateData.latest_release.previous, '%'),
              surprise: (() => {
                const actualNum = safeParseNumber(federalFundsRateData.latest_release.actual, '%');
                const forecastNum = safeParseNumber(federalFundsRateData.latest_release.forecast, '%');
                return actualNum && forecastNum ? Math.round((actualNum - forecastNum) * 100) / 100 : null;
              })()
            }}
          />
        )}

        {/* 핵심 CPI */}
        {coreCPIData && (
          <EconomicIndicatorCard
            indicator={{
              name: "핵심 CPI",
              latestDate: coreCPIData.latest_release.release_date,
              nextDate: typeof coreCPIData.next_release === 'string'
                ? coreCPIData.next_release
                : coreCPIData.next_release?.release_date || "미정",
              actual: safeParseNumber(coreCPIData.latest_release.actual, '%'),
              forecast: safeParseNumber(coreCPIData.latest_release.forecast, '%'),
              previous: safeParseNumber(coreCPIData.latest_release.previous, '%'),
              surprise: (() => {
                const actualNum = safeParseNumber(coreCPIData.latest_release.actual, '%');
                const forecastNum = safeParseNumber(coreCPIData.latest_release.forecast, '%');
                return actualNum && forecastNum ? Math.round((actualNum - forecastNum) * 100) / 100 : null;
              })()
            }}
          />
        )}

        {/* 10년 국채수익률 */}
        {tenYearTreasuryData && (
          <EconomicIndicatorCard
            indicator={{
              name: "10년 국채수익률",
              latestDate: tenYearTreasuryData.latest_release.release_date,
              nextDate: typeof tenYearTreasuryData.next_release === 'string'
                ? tenYearTreasuryData.next_release
                : tenYearTreasuryData.next_release?.release_date || "미정",
              actual: safeParseNumber(tenYearTreasuryData.latest_release.actual, '%'),
              forecast: safeParseNumber(tenYearTreasuryData.latest_release.forecast, '%'),
              previous: safeParseNumber(tenYearTreasuryData.latest_release.previous, '%'),
              surprise: (() => {
                const actualNum = safeParseNumber(tenYearTreasuryData.latest_release.actual, '%');
                const forecastNum = safeParseNumber(tenYearTreasuryData.latest_release.forecast, '%');
                return actualNum && forecastNum ? Math.round((actualNum - forecastNum) * 100) / 100 : null;
              })()
            }}
          />
        )}

        {/* 2년 국채수익률 */}
        {twoYearTreasuryData && (
          <EconomicIndicatorCard
            indicator={{
              name: "2년 국채수익률",
              latestDate: twoYearTreasuryData.latest_release.release_date,
              nextDate: typeof twoYearTreasuryData.next_release === 'string'
                ? twoYearTreasuryData.next_release
                : twoYearTreasuryData.next_release?.release_date || "미정",
              actual: safeParseNumber(twoYearTreasuryData.latest_release.actual, '%'),
              forecast: safeParseNumber(twoYearTreasuryData.latest_release.forecast, '%'),
              previous: safeParseNumber(twoYearTreasuryData.latest_release.previous, '%'),
              surprise: (() => {
                const actualNum = safeParseNumber(twoYearTreasuryData.latest_release.actual, '%');
                const forecastNum = safeParseNumber(twoYearTreasuryData.latest_release.forecast, '%');
                return actualNum && forecastNum ? Math.round((actualNum - forecastNum) * 100) / 100 : null;
              })()
            }}
          />
        )}
      </div>

      {/* 데이터 섹션 */}
      <InterestRateDataSection refreshTrigger={refreshTrigger} />
    </div>
  );
}