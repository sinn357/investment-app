'use client';

import { useState, useEffect, useCallback } from 'react';
import EconomicIndicatorCard from '@/components/EconomicIndicatorCard';
import UpdateButton from '@/components/UpdateButton';
import EmploymentDataSection from '@/components/EmploymentDataSection';

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

export default function EmploymentTab() {
  const [unemploymentData, setUnemploymentData] = useState<IndicatorData | null>(null);
  const [nonfarmPayrollsData, setNonfarmPayrollsData] = useState<IndicatorData | null>(null);
  const [initialJoblessClaimsData, setInitialJoblessClaimsData] = useState<IndicatorData | null>(null);
  const [averageHourlyEarningsData, setAverageHourlyEarningsData] = useState<IndicatorData | null>(null);
  const [averageHourlyEarnings1777Data, setAverageHourlyEarnings1777Data] = useState<IndicatorData | null>(null);
  const [participationRateData, setParticipationRateData] = useState<IndicatorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  const fetchUnemploymentData = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/rawdata/unemployment-rate`);
      const result = await response.json();
      if (result.status === 'success') {
        setUnemploymentData(result.data);
      }
    } catch (error) {
      console.error('실업률 데이터 로드 실패:', error);
    }
  };

  const fetchNonfarmPayrollsData = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/rawdata/nonfarm-payrolls`);
      const result = await response.json();
      if (result.status === 'success') {
        setNonfarmPayrollsData(result.data);
      }
    } catch (error) {
      console.error('비농업 고용 데이터 로드 실패:', error);
    }
  };

  const fetchInitialJoblessClaimsData = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/rawdata/initial-jobless-claims`);
      const result = await response.json();
      if (result.status === 'success') {
        setInitialJoblessClaimsData(result.data);
      }
    } catch (error) {
      console.error('신규 실업급여 신청 데이터 로드 실패:', error);
    }
  };

  const fetchAverageHourlyEarningsData = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/rawdata/average-hourly-earnings`);
      const result = await response.json();
      if (result.status === 'success') {
        setAverageHourlyEarningsData(result.data);
      }
    } catch (error) {
      console.error('평균시간당임금 데이터 로드 실패:', error);
    }
  };

  const fetchAverageHourlyEarnings1777Data = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/rawdata/average-hourly-earnings-1777`);
      const result = await response.json();
      if (result.status === 'success') {
        setAverageHourlyEarnings1777Data(result.data);
      }
    } catch (error) {
      console.error('평균시간당임금(YoY) 데이터 로드 실패:', error);
    }
  };

  const fetchParticipationRateData = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/rawdata/participation-rate`);
      const result = await response.json();
      if (result.status === 'success') {
        setParticipationRateData(result.data);
      }
    } catch (error) {
      console.error('경제활동참가율 데이터 로드 실패:', error);
    }
  };

  const loadAllData = useCallback(async () => {
    setLoading(true);
    await Promise.all([
      fetchUnemploymentData(),
      fetchNonfarmPayrollsData(),
      fetchInitialJoblessClaimsData(),
      fetchAverageHourlyEarningsData(),
      fetchAverageHourlyEarnings1777Data(),
      fetchParticipationRateData()
    ]);
    setLoading(false);
    setLastUpdated(new Date().toLocaleString('ko-KR'));
  }, []);

  const handleUpdate = async () => {
    await loadAllData();
  };

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
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
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">고용지표</h2>
          <p className="text-gray-600 dark:text-gray-400">
            실업률, 비농업 고용 등 고용 시장 관련 주요 지표
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
        {/* 실업률 */}
        {unemploymentData && (
          <EconomicIndicatorCard
            indicator={{
              name: "실업률",
              latestDate: unemploymentData.latest_release.release_date,
              nextDate: typeof unemploymentData.next_release === 'string'
                ? unemploymentData.next_release
                : unemploymentData.next_release?.release_date || "미정",
              actual: safeParseNumber(unemploymentData.latest_release.actual, '%'),
              forecast: safeParseNumber(unemploymentData.latest_release.forecast, '%'),
              previous: safeParseNumber(unemploymentData.latest_release.previous, '%'),
              surprise: unemploymentData.latest_release.surprise || null
            }}
          />
        )}

        {/* 비농업 고용 */}
        {nonfarmPayrollsData && (
          <EconomicIndicatorCard
            indicator={{
              name: "비농업 고용",
              latestDate: nonfarmPayrollsData.latest_release.release_date,
              nextDate: typeof nonfarmPayrollsData.next_release === 'string'
                ? nonfarmPayrollsData.next_release
                : nonfarmPayrollsData.next_release?.release_date || "미정",
              actual: safeParseNumber(nonfarmPayrollsData.latest_release.actual, 'K'),
              forecast: safeParseNumber(nonfarmPayrollsData.latest_release.forecast, 'K'),
              previous: safeParseNumber(nonfarmPayrollsData.latest_release.previous, 'K'),
              surprise: nonfarmPayrollsData.latest_release.surprise || null
            }}
          />
        )}

        {/* 신규 실업급여 신청 */}
        {initialJoblessClaimsData && (
          <EconomicIndicatorCard
            indicator={{
              name: "신규 실업급여 신청",
              latestDate: initialJoblessClaimsData.latest_release.release_date,
              nextDate: typeof initialJoblessClaimsData.next_release === 'string'
                ? initialJoblessClaimsData.next_release
                : initialJoblessClaimsData.next_release?.release_date || "미정",
              actual: safeParseNumber(initialJoblessClaimsData.latest_release.actual, 'K'),
              forecast: safeParseNumber(initialJoblessClaimsData.latest_release.forecast, 'K'),
              previous: safeParseNumber(initialJoblessClaimsData.latest_release.previous, 'K'),
              surprise: initialJoblessClaimsData.latest_release.surprise || null
            }}
          />
        )}

        {/* 평균시간당임금 */}
        {averageHourlyEarningsData && (
          <EconomicIndicatorCard
            indicator={{
              name: "평균시간당임금",
              latestDate: averageHourlyEarningsData.latest_release.release_date,
              nextDate: typeof averageHourlyEarningsData.next_release === 'string'
                ? averageHourlyEarningsData.next_release
                : averageHourlyEarningsData.next_release?.release_date || "미정",
              actual: safeParseNumber(averageHourlyEarningsData.latest_release.actual, '$'),
              forecast: safeParseNumber(averageHourlyEarningsData.latest_release.forecast, '$'),
              previous: safeParseNumber(averageHourlyEarningsData.latest_release.previous, '$'),
              surprise: averageHourlyEarningsData.latest_release.surprise || null
            }}
          />
        )}

        {/* 평균시간당임금 (YoY) */}
        {averageHourlyEarnings1777Data && (
          <EconomicIndicatorCard
            indicator={{
              name: "평균시간당임금 (YoY)",
              latestDate: averageHourlyEarnings1777Data.latest_release.release_date,
              nextDate: typeof averageHourlyEarnings1777Data.next_release === 'string'
                ? averageHourlyEarnings1777Data.next_release
                : averageHourlyEarnings1777Data.next_release?.release_date || "미정",
              actual: safeParseNumber(averageHourlyEarnings1777Data.latest_release.actual, '%'),
              forecast: safeParseNumber(averageHourlyEarnings1777Data.latest_release.forecast, '%'),
              previous: safeParseNumber(averageHourlyEarnings1777Data.latest_release.previous, '%'),
              surprise: averageHourlyEarnings1777Data.latest_release.surprise || null
            }}
          />
        )}

        {/* 경제활동참가율 */}
        {participationRateData && (
          <EconomicIndicatorCard
            indicator={{
              name: "경제활동참가율",
              latestDate: participationRateData.latest_release.release_date,
              nextDate: typeof participationRateData.next_release === 'string'
                ? participationRateData.next_release
                : participationRateData.next_release?.release_date || "미정",
              actual: safeParseNumber(participationRateData.latest_release.actual, '%'),
              forecast: safeParseNumber(participationRateData.latest_release.forecast, '%'),
              previous: safeParseNumber(participationRateData.latest_release.previous, '%'),
              surprise: participationRateData.latest_release.surprise || null
            }}
          />
        )}
      </div>

      {/* 데이터 섹션 */}
      <EmploymentDataSection />
    </div>
  );
}