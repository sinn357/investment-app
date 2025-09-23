'use client';

import { useState, useEffect } from 'react';
import EconomicIndicatorCard from '@/components/EconomicIndicatorCard';
import UpdateButton from '@/components/UpdateButton';

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

export default function EmploymentTab() {
  const [unemploymentData, setUnemploymentData] = useState<IndicatorData | null>(null);
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

  const loadAllData = async () => {
    setLoading(true);
    await fetchUnemploymentData();
    setLoading(false);
    setLastUpdated(new Date().toLocaleString('ko-KR'));
  };

  const handleUpdate = async () => {
    await loadAllData();
  };

  useEffect(() => {
    loadAllData();
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1].map((i) => (
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
        {unemploymentData && (
          <EconomicIndicatorCard
            indicator={{
              name: "실업률",
              latestDate: unemploymentData.latest_release.release_date,
              nextDate: typeof unemploymentData.next_release === 'string'
                ? unemploymentData.next_release
                : unemploymentData.next_release?.release_date || "미정",
              actual: parseFloat(unemploymentData.latest_release.actual?.replace('%', '') || '0'),
              forecast: parseFloat(unemploymentData.latest_release.forecast?.replace('%', '') || '0'),
              previous: parseFloat(unemploymentData.latest_release.previous?.replace('%', '') || '0'),
              surprise: unemploymentData.latest_release.surprise || null
            }}
          />
        )}

        {/* 준비 중인 지표 카드 */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg shadow-lg p-6 border-2 border-dashed border-gray-300 dark:border-gray-600">
          <div className="text-center">
            <div className="text-4xl mb-3">⏳</div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              추가 고용지표
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              비농업 고용, 신규 실업급여 신청 등
            </p>
            <div className="inline-flex items-center px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              준비 중
            </div>
          </div>
        </div>
      </div>

      {/* 데이터 섹션 */}
      <div className="space-y-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            고용지표 상세 데이터
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            실업률 히스토리 데이터와 차트는 향후 업데이트에서 제공될 예정입니다.
          </p>
          <div className="inline-flex items-center px-4 py-2 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-lg">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            곧 출시 예정
          </div>
        </div>
      </div>
    </div>
  );
}