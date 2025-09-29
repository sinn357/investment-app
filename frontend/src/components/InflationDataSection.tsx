'use client';

import { useState, useEffect } from 'react';
import DataCharts from './DataCharts';

interface HistoryItem {
  release_date: string;
  time: string;
  actual: string | number | null;
  forecast: string | number | null;
  previous: string | number;
}

interface TabData {
  [key: string]: {
    title: string;
    data: HistoryItem[];
    loading: boolean;
  };
}

const BACKEND_URL = 'https://investment-app-backend-x166.onrender.com';

// % 데이터를 숫자로 변환하는 헬퍼 함수
const parsePercentValue = (value: string | number | null): number | null => {
  if (value === null) return null;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    // % 처리
    const numStr = value.replace('%', '');
    const num = parseFloat(numStr);
    return isNaN(num) ? null : num;
  }
  return null;
};

// 색상 결정 함수 (물가지표는 높을수록 나쁨)
const getColorForValue = (actual: string | number | null, forecast: string | number | null): string => {
  if (actual === null || forecast === null) return 'text-gray-600 dark:text-gray-400';

  const actualNum = parsePercentValue(actual);
  const forecastNum = parsePercentValue(forecast);

  if (actualNum === null || forecastNum === null) return 'text-gray-600 dark:text-gray-400';

  // 물가지표는 예측보다 높으면 빨간색(나쁨), 낮으면 초록색(좋음)
  if (actualNum > forecastNum) {
    return 'text-red-600 dark:text-red-400';
  } else if (actualNum < forecastNum) {
    return 'text-green-600 dark:text-green-400';
  }
  return 'text-gray-600 dark:text-gray-400';
};

export default function InflationDataSection({ refreshTrigger }: { refreshTrigger: number }) {
  const [activeTab, setActiveTab] = useState('cpi');
  const [isExpanded, setIsExpanded] = useState(false);
  const [tabData, setTabData] = useState<TabData>({
    'cpi': { title: '소비자물가지수', data: [], loading: true },
    'ppi': { title: '생산자물가지수', data: [], loading: true },
    'pce': { title: '개인소비지출', data: [], loading: true },
    'core-pce': { title: '핵심 PCE', data: [], loading: true }
  });

  const fetchTabData = async (tabKey: string) => {
    try {
      setTabData(prev => ({
        ...prev,
        [tabKey]: { ...prev[tabKey], loading: true }
      }));

      const response = await fetch(`${BACKEND_URL}/api/history-table/${tabKey}`);
      const result = await response.json();

      if (result.status === 'success') {
        setTabData(prev => ({
          ...prev,
          [tabKey]: { ...prev[tabKey], data: result.data, loading: false }
        }));
      } else {
        setTabData(prev => ({
          ...prev,
          [tabKey]: { ...prev[tabKey], data: [], loading: false }
        }));
      }
    } catch (error) {
      console.error(`${tabKey} 히스토리 데이터 로드 실패:`, error);
      setTabData(prev => ({
        ...prev,
        [tabKey]: { ...prev[tabKey], data: [], loading: false }
      }));
    }
  };

  const loadAllTabsData = async () => {
    await Promise.all([
      fetchTabData('cpi'),
      fetchTabData('ppi'),
      fetchTabData('pce'),
      fetchTabData('core-pce')
    ]);
  };

  useEffect(() => {
    loadAllTabsData();
  }, [refreshTrigger]);

  const handleTabChange = (tabKey: string) => {
    setActiveTab(tabKey);
  };

  const formatValue = (value: string | number | null): string => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return value.toString();
    return '-';
  };

  const tabs = [
    { key: 'cpi', label: '소비자물가지수', shortLabel: 'CPI' },
    { key: 'ppi', label: '생산자물가지수', shortLabel: 'PPI' },
    { key: 'pce', label: '개인소비지출', shortLabel: 'PCE' },
    { key: 'core-pce', label: '핵심 PCE', shortLabel: '핵심PCE' }
  ];

  const currentTabData = tabData[activeTab];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
      {/* 헤더 */}
      <div
        className="p-6 bg-gradient-to-r from-red-500 to-pink-600 text-white cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold">물가지표 데이터</h3>
            <p className="text-red-100 mt-1">과거 발표 데이터와 차트 분석</p>
          </div>
          {isExpanded ? (
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          ) : (
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </div>
      </div>

      {/* 확장 가능한 콘텐츠 */}
      {isExpanded && (
        <div className="border-t border-gray-200 dark:border-gray-700">
          {/* 탭 네비게이션 */}
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {/* 데스크톱 화면에서는 풀 라벨, 모바일에서는 축약 라벨 */}
              <div className="hidden sm:flex space-x-8">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => handleTabChange(tab.key)}
                    className={`${
                      activeTab === tab.key
                        ? 'border-red-500 text-red-600 dark:text-red-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                    } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm`}
                  >
                    {tab.label}
                    {tabData[tab.key].loading && (
                      <span className="ml-2 inline-block w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                    )}
                  </button>
                ))}
              </div>

              {/* 모바일 화면 */}
              <div className="flex sm:hidden space-x-4 overflow-x-auto">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => handleTabChange(tab.key)}
                    className={`${
                      activeTab === tab.key
                        ? 'border-red-500 text-red-600 dark:text-red-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                    } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-xs flex-shrink-0`}
                  >
                    {tab.shortLabel}
                    {tabData[tab.key].loading && (
                      <span className="ml-1 inline-block w-2 h-2 border border-current border-t-transparent rounded-full animate-spin" />
                    )}
                  </button>
                ))}
              </div>
            </nav>
          </div>

          {/* 탭 콘텐츠 */}
          <div className="p-6">
            {currentTabData.loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
              </div>
            ) : (
              <>
                {/* 차트 섹션 */}
                <div className="mb-8">
                  <DataCharts
                    data={currentTabData.data.map(item => ({
                      ...item,
                      actual: parsePercentValue(item.actual),
                      forecast: parsePercentValue(item.forecast),
                      previous: typeof item.previous === 'number' ? item.previous : parsePercentValue(item.previous) || 0
                    }))}
                    indicatorName={currentTabData.title}
                  />
                </div>

                {/* 테이블 섹션 */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          발표일
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          시간
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          실제
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          예측
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          이전
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {currentTabData.data.length > 0 ? (
                        currentTabData.data.map((item, index) => (
                          <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                              {item.release_date}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              {item.time}
                            </td>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${getColorForValue(item.actual, item.forecast)}`}>
                              {formatValue(item.actual)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              {formatValue(item.forecast)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              {formatValue(item.previous)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                            데이터가 없습니다.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}