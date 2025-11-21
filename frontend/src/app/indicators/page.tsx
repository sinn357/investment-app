'use client';

import { useState } from 'react';
import EconomicIndicatorsSection from '@/components/EconomicIndicatorsSection';
import DataSection from '@/components/DataSection';
import Navigation from '@/components/Navigation';
import TabNavigation, { TabDefinition } from '@/components/TabNavigation';
import EmploymentTab from '@/components/tabs/EmploymentTab';
import InterestRateTab from '@/components/tabs/InterestRateTab';
import TradeTab from '@/components/tabs/TradeTab';
import InflationTab from '@/components/tabs/InflationTab';
import PolicyTab from '@/components/tabs/PolicyTab';
import { CARD_CLASSES } from '@/styles/theme';

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
        return <TradeTab />;
      case 'inflation':
        return <InflationTab />;
      case 'policy':
        return <PolicyTab />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <header className="bg-gradient-to-r from-primary/5 to-secondary/5 shadow-sm border-b border-primary/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className={`${CARD_CLASSES.title} text-3xl`}>
            경제지표 모니터링
          </h1>
          <p className={`mt-2 ${CARD_CLASSES.subtitle}`}>
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