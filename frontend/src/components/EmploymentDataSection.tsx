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

interface EmploymentDataSectionProps {
  refreshTrigger?: number;
}

export default function EmploymentDataSection({ refreshTrigger }: EmploymentDataSectionProps) {
  const [activeTab, setActiveTab] = useState('unemployment-rate');
  const [tabsData, setTabsData] = useState<TabData[]>([
    {
      id: 'unemployment-rate',
      name: '실업률',
      data: [],
      loading: true
    },
    {
      id: 'nonfarm-payrolls',
      name: '비농업 고용',
      data: [],
      loading: false
    },
    {
      id: 'initial-jobless-claims',
      name: '신규 실업급여 신청',
      data: [],
      loading: false
    },
    {
      id: 'average-hourly-earnings',
      name: '평균시간당임금',
      data: [],
      loading: false
    },
    {
      id: 'average-hourly-earnings-1777',
      name: '평균시간당임금 (YoY)',
      data: [],
      loading: false
    },
    {
      id: 'participation-rate',
      name: '경제활동참가율',
      data: [],
      loading: false
    }
  ]);

  // v2 API에서 히스토리 데이터 가져오기 (빠른 로딩)
  const fetchHistoryData = async (indicatorId: string) => {
    try {
      const response = await fetch(`https://investment-app-backend-x166.onrender.com/api/v2/history/${indicatorId}`);
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
            ? { ...tab, data: [], loading: false, error: result.message || 'Failed to fetch data' }
            : tab
        ));
      }
    } catch (error) {
      console.error(`Failed to fetch ${indicatorId} data:`, error);
      setTabsData(prev => prev.map(tab =>
        tab.id === indicatorId
          ? { ...tab, data: [], loading: false, error: 'Network error' }
          : tab
      ));
    }
  };

  // 실시간 크롤링 API로 업데이트 (느리지만 최신 데이터)
  const updateData = async (indicatorId: string) => {
    try {
      setTabsData(prev => prev.map(tab =>
        tab.id === indicatorId
          ? { ...tab, loading: true, error: undefined }
          : tab
      ));

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
            ? { ...tab, data: [], loading: false, error: result.message || 'Failed to update data' }
            : tab
        ));
      }
    } catch (error) {
      console.error(`Failed to update ${indicatorId} data:`, error);
      setTabsData(prev => prev.map(tab =>
        tab.id === indicatorId
          ? { ...tab, data: [], loading: false, error: 'Network error' }
          : tab
      ));
    }
  };

  // 컴포넌트 마운트 시 첫 번째 탭 데이터 로드
  useEffect(() => {
    fetchHistoryData(activeTab);
  }, []);

  // refreshTrigger 변경 시 모든 탭 데이터 업데이트
  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      // 모든 탭 데이터를 실시간 크롤링 API로 업데이트
      const updateAllTabs = async () => {
        const promises = tabsData.map(tab => updateData(tab.id));
        await Promise.all(promises);
      };
      updateAllTabs();
    }
  }, [refreshTrigger]);

  // 탭 변경 시 해당 탭 데이터 로드 (아직 로드되지 않은 경우만)
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    const targetTab = tabsData.find(tab => tab.id === tabId);
    if (targetTab && !targetTab.loading && targetTab.data.length === 0 && !targetTab.error) {
      fetchHistoryData(tabId);
    }
  };

  // 현재 활성 탭 데이터 가져오기
  const currentTabData = tabsData.find(tab => tab.id === activeTab);

  // formatValue 함수는 원본 값(% 포함)을 그대로 표시
  const formatValue = (value: string | number | null): string => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'string') return value;
    return typeof value === 'number' ? value.toFixed(2) : String(value);
  };

  const parsePercentValue = (value: string | number | null): number | null => {
    if (value === null || value === undefined) return null;
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      // Handle percentage values
      if (value.includes('%')) {
        const numericValue = parseFloat(value.replace('%', ''));
        return isNaN(numericValue) ? null : numericValue;
      }
      // Handle K (thousands) values
      if (value.includes('K')) {
        const numericValue = parseFloat(value.replace('K', ''));
        return isNaN(numericValue) ? null : numericValue;
      }
    }
    return parseFloat(String(value)) || null;
  };

  const getColorForValue = (actual: string | number | null, forecast: string | number | null): string => {
    const actualNum = parsePercentValue(actual);
    const forecastNum = parsePercentValue(forecast);

    if (actualNum === null || forecastNum === null) return 'text-gray-500 dark:text-gray-400';

    // 실업률과 신규 실업급여 신청은 낮을수록 좋음 (역방향)
    if (activeTab === 'unemployment-rate' || activeTab === 'initial-jobless-claims') {
      return actualNum < forecastNum
        ? 'text-green-600 dark:text-green-400'
        : 'text-red-600 dark:text-red-400';
    }

    // 나머지 지표들은 높을수록 좋음 (정방향)
    return actualNum > forecastNum
      ? 'text-green-600 dark:text-green-400'
      : 'text-red-600 dark:text-red-400';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">고용지표 상세 데이터</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              각 지표의 히스토리 데이터와 차트를 확인할 수 있습니다
            </p>
          </div>
        </div>

        {/* 탭 네비게이션 */}
        <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
          <nav className="-mb-px flex space-x-8 overflow-x-auto">
            {tabsData.map((tab) => (
              <button
                key={tab.id}
                className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
                onClick={() => handleTabChange(tab.id)}
              >
                {tab.name}
                {tab.loading && (
                  <span className="ml-2 inline-block w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* 탭 콘텐츠 */}
        {currentTabData && (
          <div>
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {currentTabData.name} - 히스토리 데이터
              </h3>
            </div>

            {currentTabData.error ? (
              <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-md p-4 mb-6">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                      데이터 로드 오류
                    </h3>
                    <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                      <p>{currentTabData.error}</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : currentTabData.data.length === 0 && !currentTabData.loading ? (
              <div className="text-center py-12">
                <div className="text-gray-400 dark:text-gray-600 text-4xl mb-4">📊</div>
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">데이터 없음</h4>
                <p className="text-gray-600 dark:text-gray-400">
                  {currentTabData.name}에 대한 히스토리 데이터가 아직 없습니다.
                </p>
              </div>
            ) : (
              <>
                {/* 히스토리 테이블 */}
                <div className="overflow-x-auto mb-8">
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
                          예상
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          이전
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {currentTabData.loading ? (
                        Array.from({ length: 5 }, (_, i) => (
                          <tr key={i}>
                            {Array.from({ length: 5 }, (_, j) => (
                              <td key={j} className="px-6 py-4 whitespace-nowrap">
                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                              </td>
                            ))}
                          </tr>
                        ))
                      ) : (
                        currentTabData.data.map((row, index) => (
                          <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                              {new Date(row.release_date).toLocaleDateString('ko-KR')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                              {row.time}
                            </td>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${getColorForValue(row.actual, row.forecast)}`}>
                              {formatValue(row.actual)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                              {formatValue(row.forecast)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                              {formatValue(row.previous)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* 차트 섹션 */}
                {currentTabData.data.length > 0 && !currentTabData.loading && (
                  <DataCharts data={currentTabData.data} indicatorName={currentTabData.name} />
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}