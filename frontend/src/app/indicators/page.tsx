'use client';

import { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import CyclePanel from '@/components/CyclePanel';
import IndicatorGrid from '@/components/IndicatorGrid';
import EconomicIndicatorsSection from '@/components/EconomicIndicatorsSection';
import DataSection from '@/components/DataSection';
import CyclePanelSkeleton from '@/components/skeletons/CyclePanelSkeleton';
import IndicatorGridSkeleton from '@/components/skeletons/IndicatorGridSkeleton';
import ErrorBoundary from '@/components/ErrorBoundary';
import { CARD_CLASSES } from '@/styles/theme';
import { calculateCycleScore, RawIndicators } from '@/utils/cycleCalculator';
import { fetchJsonWithRetry } from '@/utils/fetchWithRetry';

interface GridIndicator {
  name: string;
  actual: number | string | null;
  previous: number | string;
  surprise?: number | null;
  category: string;
}

// 지표명을 카테고리로 매핑하는 헬퍼 함수
function mapIndicatorToCategory(name: string): string {
  const lowerName = name.toLowerCase();

  // 경기지표
  if (lowerName.includes('ism') || lowerName.includes('pmi') ||
      lowerName.includes('production') || lowerName.includes('sales') ||
      lowerName.includes('manufacturing') || lowerName.includes('sentiment')) {
    return 'business';
  }

  // 고용지표
  if (lowerName.includes('unemployment') || lowerName.includes('employment') ||
      lowerName.includes('payroll') || lowerName.includes('jobless') ||
      lowerName.includes('claims') || lowerName.includes('wage')) {
    return 'employment';
  }

  // 금리지표
  if (lowerName.includes('rate') && !lowerName.includes('unemployment') ||
      lowerName.includes('treasury') || lowerName.includes('yield') ||
      lowerName.includes('fed funds')) {
    return 'interest';
  }

  // 무역지표
  if (lowerName.includes('trade') || lowerName.includes('export') ||
      lowerName.includes('import') || lowerName.includes('balance')) {
    return 'trade';
  }

  // 물가지표
  if (lowerName.includes('cpi') || lowerName.includes('ppi') ||
      lowerName.includes('pce') || lowerName.includes('inflation') ||
      lowerName.includes('price')) {
    return 'inflation';
  }

  // 정책지표
  if (lowerName.includes('gdp') || lowerName.includes('fomc') ||
      lowerName.includes('confidence') || lowerName.includes('policy')) {
    return 'policy';
  }

  return 'business'; // 기본값
}

export default function IndicatorsPage() {
  const [cycleScore, setCycleScore] = useState<ReturnType<typeof calculateCycleScore> | null>(null);
  const [allIndicators, setAllIndicators] = useState<GridIndicator[]>([]);
  const [loading, setLoading] = useState(true);

  // 경제 지표 데이터 페칭 및 국면 계산
  useEffect(() => {
    async function fetchAndCalculateCycle() {
      try {
        setLoading(true);
        const result = await fetchJsonWithRetry(
          'https://investment-app-backend-x166.onrender.com/api/v2/indicators',
          {},
          3, // 최대 3번 재시도
          1000 // 1초 간격 (지수 백오프)
        );

        if (result.status === 'success' && result.indicators) {
          // 필요한 지표 추출
          const indicators: RawIndicators = {};

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

          // 그리드용 지표 데이터 생성
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const gridIndicators: GridIndicator[] = result.indicators.map((item: any) => {
            const latest = item.data.latest_release;
            return {
              name: item.name,
              actual: latest.actual,
              previous: latest.previous,
              surprise: latest.surprise ?? null,
              category: mapIndicatorToCategory(item.name)
            };
          });
          setAllIndicators(gridIndicators);
        }
      } catch (error) {
        console.error('Failed to fetch cycle data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchAndCalculateCycle();
  }, []);

  return (
    <ErrorBoundary>
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

      {/* 탭 네비게이션 임시 숨김 - 그리드가 대체 */}
      {/* <TabNavigation
        tabs={indicatorTabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      /> */}

      <main>
        {/* 경제 국면 판별 패널 */}
        {loading ? (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <CyclePanelSkeleton />
          </div>
        ) : cycleScore ? (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <CyclePanel score={cycleScore} />
          </div>
        ) : (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <p className="text-yellow-800 dark:text-yellow-200">
                경제 국면 데이터를 불러올 수 없습니다. 나중에 다시 시도해주세요.
              </p>
            </div>
          </div>
        )}

        {/* 경제지표 그리드 (Phase 8 - 한눈에 보기) */}
        {loading ? (
          <IndicatorGridSkeleton />
        ) : allIndicators.length > 0 ? (
          <IndicatorGrid
            indicators={allIndicators}
            onIndicatorClick={(indicator) => {
              console.log('지표 클릭:', indicator);
              // TODO: 상세 모달/패널 표시
            }}
          />
        ) : null}

        {/* 상세 지표 섹션 (Raw Data + History Table) */}
        <EconomicIndicatorsSection />
        <DataSection />
      </main>
      </div>
    </ErrorBoundary>
  );
}