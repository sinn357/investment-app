'use client';

import { useState, useEffect } from 'react';
import DataCharts from './DataCharts';

interface DataRow {
  release_date: string;
  time: string;
  actual: number | null;
  forecast: number | null;
  previous: number;
}

interface TabData {
  id: string;
  name: string;
  data: DataRow[];
  loading?: boolean;
  error?: string;
}

export default function DataSection() {
  const [activeTab, setActiveTab] = useState('ism-manufacturing');
  const [tabsData, setTabsData] = useState<TabData[]>([
    {
      id: 'ism-manufacturing',
      name: 'ISM Manufacturing PMI',
      data: [],
      loading: true
    },
    {
      id: 'ism-non-manufacturing',
      name: 'ISM Non-Manufacturing PMI',
      data: [],
      loading: false
    },
    {
      id: 'sp-global-composite',
      name: 'S&P Global Composite PMI',
      data: [],
      loading: false
    },
    {
      id: 'industrial-production',
      name: 'Industrial Production',
      data: [],
      loading: false
    },
    {
      id: 'industrial-production-1755',
      name: 'Industrial Production YoY',
      data: [],
      loading: false
    }
  ]);

  // API에서 데이터 가져오기
  const fetchHistoryData = async (indicatorId: string) => {
    try {
      const response = await fetch(`https://investment-app-backend-x166.onrender.com/api/history-table/${indicatorId}`);
      const result = await response.json();

      if (result.status === 'success') {
        setTabsData(prev => prev.map(tab =>
          tab.id === indicatorId
            ? { ...tab, data: result.data, loading: false, error: undefined }
            : tab
        ));
      } else {
        setTabsData(prev => prev.map(tab =>
          tab.id === indicatorId
            ? { ...tab, loading: false, error: result.message }
            : tab
        ));
      }
    } catch {
      setTabsData(prev => prev.map(tab =>
        tab.id === indicatorId
          ? { ...tab, loading: false, error: 'Failed to fetch data' }
          : tab
      ));
    }
  };

  useEffect(() => {
    // 컴포넌트 마운트 시 활성 탭 데이터 가져오기
    fetchHistoryData(activeTab);
  }, [activeTab]);

  useEffect(() => {
    // 탭 변경 시 해당 탭 데이터 가져오기
    const currentTab = tabsData.find(tab => tab.id === activeTab);
    if (currentTab && currentTab.data.length === 0 && !currentTab.loading) {
      fetchHistoryData(activeTab);
    }
  }, [activeTab, tabsData]);

  const currentTabData = tabsData.find(tab => tab.id === activeTab);

  const formatValue = (value: string | number | null) => {
    if (value === null) return '-';
    // If value is string (like "0.87%"), return as is
    if (typeof value === 'string') return value;
    // If value is number, format with 1 decimal place
    if (typeof value === 'number') return value.toFixed(1);
    return value;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  return (
    <section className="py-8 bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 섹션 헤더 */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            경제지표 데이터
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            상세 릴리즈 히스토리 및 예정 발표 일정
          </p>
        </div>

        {/* 탭 네비게이션 */}
        <div className="mb-6">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              {tabsData.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* 데이터 테이블 */}
        {currentTabData && (
          <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
            {/* 로딩 상태 */}
            {currentTabData.loading && (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600 dark:text-gray-400">데이터를 가져오는 중...</span>
              </div>
            )}

            {/* 에러 상태 */}
            {currentTabData.error && (
              <div className="p-8 text-center">
                <div className="text-red-600 dark:text-red-400 mb-2">
                  ⚠️ 데이터를 가져올 수 없습니다
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">{currentTabData.error}</p>
                <button
                  onClick={() => fetchHistoryData(activeTab)}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  다시 시도
                </button>
              </div>
            )}

            {/* 데이터 테이블 */}
            {!currentTabData.loading && !currentTabData.error && currentTabData.data.length > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    >
                      Release Date
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    >
                      Time
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    >
                      Actual
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    >
                      Forecast
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    >
                      Previous
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {currentTabData.data.map((row, index) => (
                    <tr
                      key={index}
                      className={`${
                        index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700'
                      } hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {formatDate(row.release_date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        {row.time}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        <span
                          className={`font-medium ${
                            row.actual === null
                              ? 'text-gray-400'
                              : row.forecast && row.actual > row.forecast
                              ? 'text-green-600 dark:text-green-400'
                              : row.forecast && row.actual < row.forecast
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-gray-900 dark:text-white'
                          }`}
                        >
                          {formatValue(row.actual)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        {formatValue(row.forecast)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        {formatValue(row.previous)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            )}

            {/* 데이터 없음 */}
            {!currentTabData.loading && !currentTabData.error && currentTabData.data.length === 0 && (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                표시할 데이터가 없습니다.
              </div>
            )}
          </div>
        )}

        {/* 테이블 하단 정보 */}
        {currentTabData && !currentTabData.loading && !currentTabData.error && currentTabData.data.length > 0 && (
          <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            <p>* 최신 날짜순으로 정렬됨 (총 {currentTabData.data.length}개 데이터)</p>
            <p>* 초록색: 예측치 초과, 빨간색: 예측치 미달</p>
            <p>* 데이터 출처: investing.com</p>
          </div>
        )}

        {/* 차트 섹션 */}
        {currentTabData && !currentTabData.loading && !currentTabData.error && currentTabData.data.length > 0 && (
          <DataCharts
            data={currentTabData.data}
            indicatorName={currentTabData.name}
          />
        )}

      </div>
    </section>
  );
}