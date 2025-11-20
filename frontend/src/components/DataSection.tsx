'use client';

import { useState, useEffect } from 'react';
import DataCharts from './DataCharts';
import StandardHistoryTable, { DataRow } from './StandardHistoryTable';

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
    },
    {
      id: 'retail-sales',
      name: 'Retail Sales MoM',
      data: [],
      loading: false
    },
    {
      id: 'retail-sales-yoy',
      name: 'Retail Sales YoY',
      data: [],
      loading: false
    },
    {
      id: 'gdp',
      name: 'GDP QoQ',
      data: [],
      loading: false
    },
    {
      id: 'cb-consumer-confidence',
      name: 'CB Consumer Confidence',
      data: [],
      loading: false
    },
    {
      id: 'michigan-consumer-sentiment',
      name: 'Michigan Consumer Sentiment',
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
            <div className="relative">
              <div className="overflow-x-auto scrollbar-hide">
                <nav className="-mb-px flex space-x-4 sm:space-x-6 min-w-max px-1" aria-label="Tabs">
                {tabsData.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`whitespace-nowrap py-2 px-3 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                    }`}
                  >
                    <span className="block sm:hidden">
                      {/* 모바일용 축약 이름 */}
                      {tab.name === 'ISM Manufacturing PMI' && 'ISM Mfg'}
                      {tab.name === 'ISM Non-Manufacturing PMI' && 'ISM Non-Mfg'}
                      {tab.name === 'S&P Global Composite PMI' && 'S&P Composite'}
                      {tab.name === 'Industrial Production' && 'Ind. Production'}
                      {tab.name === 'Industrial Production YoY' && 'Ind. Prod. YoY'}
                      {tab.name === 'Retail Sales MoM' && 'Retail MoM'}
                      {tab.name === 'Retail Sales YoY' && 'Retail YoY'}
                      {tab.name === 'GDP QoQ' && 'GDP'}
                      {tab.name === 'CB Consumer Confidence' && 'CB Confidence'}
                      {tab.name === 'Michigan Consumer Sentiment' && 'MI Sentiment'}
                    </span>
                    <span className="hidden sm:block">
                      {/* 데스크톱용 전체 이름 */}
                      {tab.name}
                    </span>
                  </button>
                ))}
                </nav>
              </div>
              {/* 모바일 스크롤 힌트 */}
              <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white dark:from-gray-900 to-transparent pointer-events-none sm:hidden"></div>
            </div>
          </div>
        </div>

        {/* 데이터 테이블 */}
        {currentTabData && (
          <StandardHistoryTable
            data={currentTabData.data}
            loading={currentTabData.loading}
            error={currentTabData.error}
            indicatorName={currentTabData.name}
            onRetry={() => fetchHistoryData(activeTab)}
          />
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