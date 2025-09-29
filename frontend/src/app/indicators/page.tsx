'use client';

import { useState } from 'react';
import EconomicIndicatorsSection from '@/components/EconomicIndicatorsSection';
import DataSection from '@/components/DataSection';
import Navigation from '@/components/Navigation';
import TabNavigation, { TabDefinition } from '@/components/TabNavigation';
import EmploymentTab from '@/components/tabs/EmploymentTab';
import InterestRateTab from '@/components/tabs/InterestRateTab';

const indicatorTabs: TabDefinition[] = [
  {
    id: 'business',
    name: '경기지표',
    icon: '📊',
    description: 'ISM PMI, 산업생산, 소매판매 등 경기 동향 지표'
  },
  {
    id: 'employment',
    name: '고용지표',
    icon: '👷',
    description: '실업률, 비농업 고용, 신규 실업급여 신청 등 고용 관련 지표'
  },
  {
    id: 'interest',
    name: '금리지표',
    icon: '🏦',
    description: '연준 기준금리, 국채 수익률 등 금리 관련 지표'
  },
  {
    id: 'trade',
    name: '무역지표',
    icon: '🚢',
    description: '무역수지, 수출입, 경상수지 등 무역 관련 지표'
  },
  {
    id: 'inflation',
    name: '물가지표',
    icon: '💰',
    description: 'CPI, PPI, PCE 등 인플레이션 관련 지표'
  },
  {
    id: 'policy',
    name: '정책지표',
    icon: '🏛️',
    description: 'FOMC 회의록, GDP, 소비자 신뢰도 등 정책 관련 지표'
  }
];

export default function IndicatorsPage() {
  const [activeTab, setActiveTab] = useState('business');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'business':
        return (
          <>
            <EconomicIndicatorsSection />
            <DataSection />
          </>
        );
      case 'employment':
        return <EmploymentTab />;
      case 'interest':
        return <InterestRateTab />;
      case 'trade':
        return (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
              <div className="text-6xl mb-4">🚢</div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                무역지표
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                무역수지, 수출입, 경상수지 등의 지표가 준비 중입니다.
              </p>
              <div className="inline-flex items-center px-4 py-2 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-lg">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Phase 3에서 구현 예정
              </div>
            </div>
          </div>
        );
      case 'inflation':
        return (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
              <div className="text-6xl mb-4">💰</div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                물가지표
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                CPI, PPI, PCE 등의 지표가 준비 중입니다.
              </p>
              <div className="inline-flex items-center px-4 py-2 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-lg">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Phase 2에서 구현 예정
              </div>
            </div>
          </div>
        );
      case 'policy':
        return (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
              <div className="text-6xl mb-4">🏛️</div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                정책지표
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                FOMC 회의록, GDP, 소비자 신뢰도 등의 지표가 준비 중입니다.
              </p>
              <div className="inline-flex items-center px-4 py-2 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-lg">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Phase 3에서 구현 예정
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />

      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            경제지표 모니터링
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            실시간 경제지표 데이터 분석
          </p>
        </div>
      </header>

      <TabNavigation
        tabs={indicatorTabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <main>
        {renderTabContent()}
      </main>
    </div>
  );
}