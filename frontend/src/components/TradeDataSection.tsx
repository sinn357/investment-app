'use client';

import { useState, useEffect } from 'react';
import DataCharts from './DataCharts';
import StandardHistoryTable, { DataRow } from './StandardHistoryTable';


interface TabData {
  [key: string]: {
    title: string;
    data: DataRow[];
    loading: boolean;
    error?: string;
  };
}

const BACKEND_URL = 'https://investment-app-backend-x166.onrender.com';



export default function TradeDataSection({ refreshTrigger }: { refreshTrigger: number }) {
  const [activeTab, setActiveTab] = useState('trade-balance');
  const [isExpanded, setIsExpanded] = useState(false);
  const [tabData, setTabData] = useState<TabData>({
    'trade-balance': { title: '무역수지', data: [], loading: true },
    'imports': { title: '수입', data: [], loading: true },
    'exports': { title: '수출', data: [], loading: true },
    'current-account': { title: '경상수지', data: [], loading: true }
  });

  const fetchTabData = async (tabKey: string) => {
    try {
      setTabData(prev => ({
        ...prev,
        [tabKey]: { ...prev[tabKey], loading: true, error: undefined }
      }));

      const response = await fetch(`${BACKEND_URL}/api/history-table/${tabKey}`);
      const result = await response.json();

      if (result.status === 'success') {
        setTabData(prev => ({
          ...prev,
          [tabKey]: { ...prev[tabKey], data: result.data, loading: false, error: undefined }
        }));
      } else {
        setTabData(prev => ({
          ...prev,
          [tabKey]: { ...prev[tabKey], data: [], loading: false, error: result.message || 'Failed to fetch data' }
        }));
      }
    } catch (error) {
      console.error(`${tabKey} 히스토리 데이터 로드 실패:`, error);
      setTabData(prev => ({
        ...prev,
        [tabKey]: { ...prev[tabKey], data: [], loading: false, error: 'Network error' }
      }));
    }
  };

  const loadAllTabsData = async () => {
    await Promise.all([
      fetchTabData('trade-balance'),
      fetchTabData('imports'),
      fetchTabData('exports'),
      fetchTabData('current-account')
    ]);
  };

  useEffect(() => {
    loadAllTabsData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTrigger]);

  const handleTabChange = (tabKey: string) => {
    setActiveTab(tabKey);
  };


  const tabs = [
    { key: 'trade-balance', label: '무역수지', shortLabel: '무역수지' },
    { key: 'imports', label: '수입', shortLabel: '수입' },
    { key: 'exports', label: '수출', shortLabel: '수출' },
    { key: 'current-account', label: '경상수지', shortLabel: '경상수지' }
  ];

  const currentTabData = tabData[activeTab];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
      {/* 헤더 */}
      <div
        className="p-6 bg-gradient-to-r from-blue-500 to-cyan-600 text-white cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold">무역지표 데이터</h3>
            <p className="text-blue-100 mt-1">무역수지, 수입, 수출 등 대외거래 관련 데이터</p>
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
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
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
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
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
            {/* 차트 섹션 */}
            {!currentTabData.loading && !currentTabData.error && currentTabData.data.length > 0 && (
              <div className="mb-8">
                <DataCharts
                  data={currentTabData.data}
                  indicatorName={currentTabData.title}
                />
              </div>
            )}

            {/* 테이블 섹션 */}
            <StandardHistoryTable
              data={currentTabData.data}
              loading={currentTabData.loading}
              error={currentTabData.error}
              indicatorName={currentTabData.title}
              indicatorId={activeTab}
              onRetry={() => fetchTabData(activeTab)}
            />
          </div>
        </div>
      )}
    </div>
  );
}