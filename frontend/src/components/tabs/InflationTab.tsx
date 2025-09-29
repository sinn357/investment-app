'use client';

import { useState, useEffect, useCallback } from 'react';
import EconomicIndicatorCard from '@/components/EconomicIndicatorCard';
import UpdateButton from '@/components/UpdateButton';
import InflationDataSection from '@/components/InflationDataSection';

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

export default function InflationTab() {
  const [cpiData, setCpiData] = useState<IndicatorData | null>(null);
  const [ppiData, setPpiData] = useState<IndicatorData | null>(null);
  const [pceData, setPceData] = useState<IndicatorData | null>(null);
  const [corePceData, setCorePceData] = useState<IndicatorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const fetchCpiData = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/rawdata/cpi`);
      const result = await response.json();
      if (result.status === 'success') {
        setCpiData(result.data);
      }
    } catch (error) {
      console.error('CPI 데이터 로드 실패:', error);
    }
  };

  const fetchPpiData = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/rawdata/ppi`);
      const result = await response.json();
      if (result.status === 'success') {
        setPpiData(result.data);
      }
    } catch (error) {
      console.error('PPI 데이터 로드 실패:', error);
    }
  };

  const fetchPceData = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/rawdata/pce`);
      const result = await response.json();
      if (result.status === 'success') {
        setPceData(result.data);
      }
    } catch (error) {
      console.error('PCE 데이터 로드 실패:', error);
    }
  };

  const fetchCorePceData = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/rawdata/core-pce`);
      const result = await response.json();
      if (result.status === 'success') {
        setCorePceData(result.data);
      }
    } catch (error) {
      console.error('핵심 PCE 데이터 로드 실패:', error);
    }
  };

  const loadAllData = useCallback(async () => {
    setLoading(true);
    await Promise.all([
      fetchCpiData(),
      fetchPpiData(),
      fetchPceData(),
      fetchCorePceData()
    ]);
    setLoading(false);
    setLastUpdated(new Date().toLocaleString('ko-KR'));
  }, []);

  const handleUpdate = async () => {
    await loadAllData();
    // InflationDataSection의 데이터도 업데이트하도록 트리거
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
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">물가지표</h2>
          <p className="text-gray-600 dark:text-gray-400">
            CPI, PPI, PCE 등 인플레이션 관련 주요 지표
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
        {/* 소비자물가지수 */}
        {cpiData && (
          <EconomicIndicatorCard
            indicator={{
              name: "소비자물가지수",
              latestDate: cpiData.latest_release.release_date,
              nextDate: typeof cpiData.next_release === 'string'
                ? cpiData.next_release
                : cpiData.next_release?.release_date || "미정",
              actual: safeParseNumber(cpiData.latest_release.actual, '%'),
              forecast: safeParseNumber(cpiData.latest_release.forecast, '%'),
              previous: safeParseNumber(cpiData.latest_release.previous, '%'),
              surprise: (() => {
                const actualNum = safeParseNumber(cpiData.latest_release.actual, '%');
                const forecastNum = safeParseNumber(cpiData.latest_release.forecast, '%');
                return actualNum && forecastNum ? Math.round((actualNum - forecastNum) * 100) / 100 : null;
              })()
            }}
          />
        )}

        {/* 생산자물가지수 */}
        {ppiData && (
          <EconomicIndicatorCard
            indicator={{
              name: "생산자물가지수",
              latestDate: ppiData.latest_release.release_date,
              nextDate: typeof ppiData.next_release === 'string'
                ? ppiData.next_release
                : ppiData.next_release?.release_date || "미정",
              actual: safeParseNumber(ppiData.latest_release.actual, '%'),
              forecast: safeParseNumber(ppiData.latest_release.forecast, '%'),
              previous: safeParseNumber(ppiData.latest_release.previous, '%'),
              surprise: (() => {
                const actualNum = safeParseNumber(ppiData.latest_release.actual, '%');
                const forecastNum = safeParseNumber(ppiData.latest_release.forecast, '%');
                return actualNum && forecastNum ? Math.round((actualNum - forecastNum) * 100) / 100 : null;
              })()
            }}
          />
        )}

        {/* 개인소비지출 */}
        {pceData && (
          <EconomicIndicatorCard
            indicator={{
              name: "개인소비지출",
              latestDate: pceData.latest_release.release_date,
              nextDate: typeof pceData.next_release === 'string'
                ? pceData.next_release
                : pceData.next_release?.release_date || "미정",
              actual: safeParseNumber(pceData.latest_release.actual, '%'),
              forecast: safeParseNumber(pceData.latest_release.forecast, '%'),
              previous: safeParseNumber(pceData.latest_release.previous, '%'),
              surprise: (() => {
                const actualNum = safeParseNumber(pceData.latest_release.actual, '%');
                const forecastNum = safeParseNumber(pceData.latest_release.forecast, '%');
                return actualNum && forecastNum ? Math.round((actualNum - forecastNum) * 100) / 100 : null;
              })()
            }}
          />
        )}

        {/* 핵심 PCE */}
        {corePceData && (
          <EconomicIndicatorCard
            indicator={{
              name: "핵심 PCE",
              latestDate: corePceData.latest_release.release_date,
              nextDate: typeof corePceData.next_release === 'string'
                ? corePceData.next_release
                : corePceData.next_release?.release_date || "미정",
              actual: safeParseNumber(corePceData.latest_release.actual, '%'),
              forecast: safeParseNumber(corePceData.latest_release.forecast, '%'),
              previous: safeParseNumber(corePceData.latest_release.previous, '%'),
              surprise: (() => {
                const actualNum = safeParseNumber(corePceData.latest_release.actual, '%');
                const forecastNum = safeParseNumber(corePceData.latest_release.forecast, '%');
                return actualNum && forecastNum ? Math.round((actualNum - forecastNum) * 100) / 100 : null;
              })()
            }}
          />
        )}
      </div>

      {/* 데이터 섹션 */}
      <InflationDataSection refreshTrigger={refreshTrigger} />
    </div>
  );
}