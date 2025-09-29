'use client';

import { useState, useEffect, useCallback } from 'react';
import EconomicIndicatorCard from '@/components/EconomicIndicatorCard';
import UpdateButton from '@/components/UpdateButton';
import TradeDataSection from '@/components/TradeDataSection';

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

const safeParseNumber = (value: string | number | null | undefined, suffix: string = ''): number => {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    return parseFloat(value.replace(suffix, '')) || 0;
  }
  return 0;
};

export default function TradeTab() {
  const [tradeBalanceData, setTradeBalanceData] = useState<IndicatorData | null>(null);
  const [exportsData, setExportsData] = useState<IndicatorData | null>(null);
  const [importsData, setImportsData] = useState<IndicatorData | null>(null);
  const [currentAccountData, setCurrentAccountData] = useState<IndicatorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const fetchTradeBalanceData = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/rawdata/trade-balance`);
      const result = await response.json();
      if (result.status === 'success') {
        setTradeBalanceData(result.data);
      }
    } catch (error) {
      console.error('무역수지 데이터 로드 실패:', error);
    }
  };

  const fetchExportsData = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/rawdata/exports`);
      const result = await response.json();
      if (result.status === 'success') {
        setExportsData(result.data);
      }
    } catch (error) {
      console.error('수출 데이터 로드 실패:', error);
    }
  };

  const fetchImportsData = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/rawdata/imports`);
      const result = await response.json();
      if (result.status === 'success') {
        setImportsData(result.data);
      }
    } catch (error) {
      console.error('수입 데이터 로드 실패:', error);
    }
  };

  const fetchCurrentAccountData = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/rawdata/current-account`);
      const result = await response.json();
      if (result.status === 'success') {
        setCurrentAccountData(result.data);
      }
    } catch (error) {
      console.error('경상수지 데이터 로드 실패:', error);
    }
  };

  const loadAllData = useCallback(async () => {
    setLoading(true);
    await Promise.all([
      fetchTradeBalanceData(),
      fetchExportsData(),
      fetchImportsData(),
      fetchCurrentAccountData()
    ]);
    setLoading(false);
    setLastUpdated(new Date().toLocaleString('ko-KR'));
  }, []);

  const handleUpdate = async () => {
    await loadAllData();
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
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">무역지표</h2>
          <p className="text-gray-600 dark:text-gray-400">
            무역수지, 수출입, 경상수지 등 무역 관련 주요 지표
          </p>
          {lastUpdated && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              마지막 업데이트: {lastUpdated}
            </p>
          )}
        </div>
        <UpdateButton onUpdateComplete={handleUpdate} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {tradeBalanceData && (
          <EconomicIndicatorCard
            indicator={{
              name: "무역수지",
              latestDate: tradeBalanceData.latest_release.release_date,
              nextDate: typeof tradeBalanceData.next_release === 'string'
                ? tradeBalanceData.next_release
                : tradeBalanceData.next_release?.release_date || "미정",
              actual: safeParseNumber(tradeBalanceData.latest_release.actual, 'B'),
              forecast: safeParseNumber(tradeBalanceData.latest_release.forecast, 'B'),
              previous: safeParseNumber(tradeBalanceData.latest_release.previous, 'B'),
              surprise: (() => {
                const actualNum = safeParseNumber(tradeBalanceData.latest_release.actual, 'B');
                const forecastNum = safeParseNumber(tradeBalanceData.latest_release.forecast, 'B');
                return actualNum && forecastNum ? Math.round((actualNum - forecastNum) * 100) / 100 : null;
              })()
            }}
          />
        )}

        {exportsData && (
          <EconomicIndicatorCard
            indicator={{
              name: "수출",
              latestDate: exportsData.latest_release.release_date,
              nextDate: typeof exportsData.next_release === 'string'
                ? exportsData.next_release
                : exportsData.next_release?.release_date || "미정",
              actual: safeParseNumber(exportsData.latest_release.actual, 'B'),
              forecast: safeParseNumber(exportsData.latest_release.forecast, 'B'),
              previous: safeParseNumber(exportsData.latest_release.previous, 'B'),
              surprise: (() => {
                const actualNum = safeParseNumber(exportsData.latest_release.actual, 'B');
                const forecastNum = safeParseNumber(exportsData.latest_release.forecast, 'B');
                return actualNum && forecastNum ? Math.round((actualNum - forecastNum) * 100) / 100 : null;
              })()
            }}
          />
        )}

        {importsData && (
          <EconomicIndicatorCard
            indicator={{
              name: "수입",
              latestDate: importsData.latest_release.release_date,
              nextDate: typeof importsData.next_release === 'string'
                ? importsData.next_release
                : importsData.next_release?.release_date || "미정",
              actual: safeParseNumber(importsData.latest_release.actual, 'B'),
              forecast: safeParseNumber(importsData.latest_release.forecast, 'B'),
              previous: safeParseNumber(importsData.latest_release.previous, 'B'),
              surprise: (() => {
                const actualNum = safeParseNumber(importsData.latest_release.actual, 'B');
                const forecastNum = safeParseNumber(importsData.latest_release.forecast, 'B');
                return actualNum && forecastNum ? Math.round((actualNum - forecastNum) * 100) / 100 : null;
              })()
            }}
          />
        )}

        {currentAccountData && (
          <EconomicIndicatorCard
            indicator={{
              name: "경상수지",
              latestDate: currentAccountData.latest_release.release_date,
              nextDate: typeof currentAccountData.next_release === 'string'
                ? currentAccountData.next_release
                : currentAccountData.next_release?.release_date || "미정",
              actual: safeParseNumber(currentAccountData.latest_release.actual, 'B'),
              forecast: safeParseNumber(currentAccountData.latest_release.forecast, 'B'),
              previous: safeParseNumber(currentAccountData.latest_release.previous, 'B'),
              surprise: (() => {
                const actualNum = safeParseNumber(currentAccountData.latest_release.actual, 'B');
                const forecastNum = safeParseNumber(currentAccountData.latest_release.forecast, 'B');
                return actualNum && forecastNum ? Math.round((actualNum - forecastNum) * 100) / 100 : null;
              })()
            }}
          />
        )}
      </div>

      <TradeDataSection refreshTrigger={refreshTrigger} />
    </div>
  );
}
