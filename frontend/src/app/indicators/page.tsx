'use client';

import { useState, useEffect } from 'react';
import EconomicIndicatorsSection from '@/components/EconomicIndicatorsSection';
import DataSection from '@/components/DataSection';
import Navigation from '@/components/Navigation';
import TabNavigation, { TabDefinition } from '@/components/TabNavigation';
import EmploymentTab from '@/components/tabs/EmploymentTab';
import InterestRateTab from '@/components/tabs/InterestRateTab';
import TradeTab from '@/components/tabs/TradeTab';
import InflationTab from '@/components/tabs/InflationTab';
import PolicyTab from '@/components/tabs/PolicyTab';
import CyclePanel from '@/components/CyclePanel';
import { CARD_CLASSES } from '@/styles/theme';
import { calculateCycleScore, RawIndicators } from '@/utils/cycleCalculator';

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
  const [cycleScore, setCycleScore] = useState<ReturnType<typeof calculateCycleScore> | null>(null);
  const [loading, setLoading] = useState(true);

  // 경제 지표 데이터 페칭 및 국면 계산
  useEffect(() => {
    async function fetchAndCalculateCycle() {
      try {
        setLoading(true);
        const response = await fetch('https://investment-app-backend-x166.onrender.com/api/v2/indicators');
        const result = await response.json();

        if (result.status === 'success' && result.indicators) {
          // 필요한 지표 추출
          const indicators: RawIndicators = {};

          result.indicators.forEach((item: any) => {
            const latest = item.data.latest_release;
            const actualValue = typeof latest.actual === 'string'
              ? parseFloat(latest.actual.replace('%', '').replace('K', '000'))
              : latest.actual;

            // 지표별 매핑
            if (item.name === 'ISM Manufacturing PMI') {
              indicators.ismManufacturing = actualValue;
            } else if (item.name === 'ISM Non-Manufacturing PMI') {
              indicators.ismNonManufacturing = actualValue;
            } else if (item.name === 'Unemployment Rate') {
              indicators.unemploymentRate = actualValue;
            } else if (item.name === 'Industrial Production YoY') {
              indicators.industrialProduction = actualValue;
            } else if (item.name === 'Retail Sales YoY') {
              indicators.retailSales = actualValue;
            }
          });

          // 임시 CPI, 금리 데이터 (추후 크롤링으로 교체)
          indicators.cpi = 2.8; // TODO: CPI 크롤링 추가
          indicators.nominalRate = 4.5; // TODO: 10년물 국채 금리 추가
          indicators.fedRate = 5.25; // TODO: 연준 기준금리 추가

          // 국면 점수 계산
          const score = calculateCycleScore(indicators);
          setCycleScore(score);
        }
      } catch (error) {
        console.error('Failed to fetch cycle data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchAndCalculateCycle();
  }, []);

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
        {/* 경제 국면 판별 패널 */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
            </div>
          ) : cycleScore ? (
            <CyclePanel score={cycleScore} />
          ) : (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <p className="text-yellow-800 dark:text-yellow-200">
                경제 국면 데이터를 불러올 수 없습니다. 나중에 다시 시도해주세요.
              </p>
            </div>
          )}
        </div>

        {/* 탭 콘텐츠 */}
        {renderTabContent()}
      </main>
    </div>
  );
}