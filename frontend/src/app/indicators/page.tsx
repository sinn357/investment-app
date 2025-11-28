'use client';

import { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import CyclePanel from '@/components/CyclePanel';
import IndicatorGrid from '@/components/IndicatorGrid';
import IndicatorChartPanel from '@/components/IndicatorChartPanel';
// import EconomicIndicatorsSection from '@/components/EconomicIndicatorsSection'; // 통합으로 비활성화
// import DataSection from '@/components/DataSection'; // 통합으로 비활성화
import NewsNarrative from '@/components/NewsNarrative';
import RiskRadar from '@/components/RiskRadar';
import CyclePanelSkeleton from '@/components/skeletons/CyclePanelSkeleton';
import IndicatorGridSkeleton from '@/components/skeletons/IndicatorGridSkeleton';
import ErrorBoundary from '@/components/ErrorBoundary';
import { CARD_CLASSES } from '@/styles/theme';
import { calculateCycleScore, RawIndicators } from '@/utils/cycleCalculator';
import { fetchJsonWithRetry } from '@/utils/fetchWithRetry';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import BigWaveSection, { BigWaveCard } from '@/components/BigWaveSection';

interface GridIndicator {
  id: string;
  name: string;
  nameKo?: string;
  actual: number | string | null;
  previous: number | string;
  forecast?: number | string | null;
  surprise?: number | null;
  category: string;
  sparklineData?: number[];
  reverseColor?: boolean;
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

interface EconomicNarrative {
  articles: Array<{ title: string; url: string; summary: string; keyword: string }>;
  myNarrative: string;
  risks: Array<{ category: string; level: number; description: string }>;
}

type RiskLevel = 'Low' | 'Medium' | 'High';
interface RiskItem {
  id: string;
  category: string;
  title: string;
  level: RiskLevel;
  note?: string;
}

interface RiskRadarData {
  structural: RiskItem[];
  cycle: RiskItem[];
  portfolio: RiskItem[];
  executionTags: string[];
}

type CycleLevel = '완화' | '중립' | '긴축';
interface CycleScoreInput {
  credit: CycleLevel;
  sentiment: CycleLevel;
  notes?: string;
}

interface BigWaveData {
  cards: BigWaveCard[];
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://investment-app-backend-x166.onrender.com';
const RISK_STORAGE_KEY = 'risk_radar_v1';
const BIGWAVE_STORAGE_KEY = 'bigwave_v1';

export default function IndicatorsPage() {
  const [userId] = useState(1); // 임시 user_id
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [cycleScore, setCycleScore] = useState<ReturnType<typeof calculateCycleScore> | null>(null);
  const [allIndicators, setAllIndicators] = useState<GridIndicator[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIndicatorId, setSelectedIndicatorId] = useState<string | null>(null);
  const [narrative, setNarrative] = useState<EconomicNarrative>({
    articles: [],
    myNarrative: '',
    risks: []
  });
  const [riskRadar, setRiskRadar] = useState<RiskRadarData>({
    structural: [],
    cycle: [],
    portfolio: [],
    executionTags: []
  });
  const [cycleInputs, setCycleInputs] = useState<CycleScoreInput>({
    credit: '중립',
    sentiment: '중립',
    notes: ''
  });
  const [bigWave, setBigWave] = useState<BigWaveData>({ cards: [] });
  const [isSavingNarrative, setIsSavingNarrative] = useState(false);
  const [savingRisk, setSavingRisk] = useState(false);

  // 리스크 레이더 로드 (로컬 스토리지)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(RISK_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as RiskRadarData;
        setRiskRadar(parsed);
      }
    } catch (error) {
      console.warn('리스크 레이더 로드 실패:', error);
    }
  }, []);

  // 빅웨이브 로드
  useEffect(() => {
    try {
      const saved = localStorage.getItem(BIGWAVE_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as BigWaveData;
        setBigWave(parsed);
      }
    } catch (error) {
      console.warn('빅웨이브 로드 실패:', error);
    }
  }, []);

  // 경제 지표 데이터 페칭 및 국면 계산
  useEffect(() => {
    async function fetchAndCalculateCycle() {
      try {
        setLoading(true);

        // v2 API: 모든 데이터 한 번에 가져오기 (히스토리 + 메타데이터 포함)
        const result = await fetchJsonWithRetry(
          'https://investment-app-backend-x166.onrender.com/api/v2/indicators',
          {},
          3,
          1000
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

          // CPI, 금리 데이터 페칭
          try {
            // CPI 데이터 페칭
            const cpiResult = await fetchJsonWithRetry(
              'https://investment-app-backend-x166.onrender.com/api/rawdata/cpi',
              {},
              3,
              1000
            );
            if (cpiResult.status === 'success' && cpiResult.data?.latest_release?.actual) {
              const cpiActual = cpiResult.data.latest_release.actual;
              indicators.cpi = typeof cpiActual === 'string'
                ? parseFloat(cpiActual.replace('%', '').replace('K', '000'))
                : cpiActual;
            } else {
              indicators.cpi = 2.8; // 폴백값
            }

            // 10년물 국채 금리 페칭
            const treasuryResult = await fetchJsonWithRetry(
              'https://investment-app-backend-x166.onrender.com/api/rawdata/ten-year-treasury',
              {},
              3,
              1000
            );
            if (treasuryResult.status === 'success' && treasuryResult.data?.latest_release?.actual) {
              const treasuryActual = treasuryResult.data.latest_release.actual;
              indicators.nominalRate = typeof treasuryActual === 'string'
                ? parseFloat(treasuryActual.replace('%', '').replace('K', '000'))
                : treasuryActual;
            } else {
              indicators.nominalRate = 4.5; // 폴백값
            }

            // 연준 기준금리 페칭
            const fedRateResult = await fetchJsonWithRetry(
              'https://investment-app-backend-x166.onrender.com/api/rawdata/federal-funds-rate',
              {},
              3,
              1000
            );
            if (fedRateResult.status === 'success' && fedRateResult.data?.latest_release?.actual) {
              const fedActual = fedRateResult.data.latest_release.actual;
              indicators.fedRate = typeof fedActual === 'string'
                ? parseFloat(fedActual.replace('%', '').replace('K', '000'))
                : fedActual;
            } else {
              indicators.fedRate = 5.25; // 폴백값
            }
          } catch (error) {
            console.error('Failed to fetch CPI/Treasury/Fed Rate data:', error);
            // 페칭 실패 시 기본값 사용
            indicators.cpi = indicators.cpi || 2.8;
            indicators.nominalRate = indicators.nominalRate || 4.5;
            indicators.fedRate = indicators.fedRate || 5.25;
          }

          // 국면 점수 계산
          const score = calculateCycleScore(indicators);
          setCycleScore(score);

          // 그리드용 지표 데이터 생성 (백엔드에서 메타데이터 포함됨)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const gridIndicators: GridIndicator[] = result.indicators.map((item: any) => {
            const latest = item.data.latest_release;

            // 히스토리 데이터에서 스파크라인 데이터 추출 (최근 6개월)
            const sparklineData = item.data.history
              ? item.data.history.slice(0, 6).reverse().map((h: { actual: string | number }) => {
                  const actualValue = typeof h.actual === 'string'
                    ? parseFloat(h.actual.replace('%', '').replace('K', '000'))
                    : h.actual;
                  return isNaN(actualValue) ? 0 : actualValue;
                })
              : [];

            return {
              id: item.indicator_id,
              name: item.name,
              nameKo: item.name_ko || item.name,
              actual: latest.actual,
              previous: latest.previous,
              forecast: latest.forecast,
              surprise: latest.surprise ?? null,
              category: item.category || mapIndicatorToCategory(item.name),
              sparklineData,
              reverseColor: item.reverse_color || false,
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

  // 경제 담론 데이터 로드
  useEffect(() => {
    const fetchNarrative = async () => {
      try {
        const response = await fetch(`${API_URL}/api/economic-narrative?user_id=${userId}&date=${selectedDate}`);
        const result = await response.json();

        if (result.status === 'success' && result.data) {
          setNarrative({
            articles: result.data.articles || [],
            myNarrative: result.data.my_narrative || '',
            risks: result.data.risks || []
          });
        } else {
          // 데이터 없으면 초기화
          setNarrative({
            articles: [],
            myNarrative: '',
            risks: []
          });
        }
      } catch (error) {
        console.error('담론 로드 실패:', error);
      }
    };

    fetchNarrative();
  }, [userId, selectedDate]);

  // 경제 담론 저장
  const handleSaveNarrative = async () => {
    setIsSavingNarrative(true);
    try {
      const response = await fetch(`${API_URL}/api/economic-narrative`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          date: selectedDate,
          articles: narrative.articles,
          my_narrative: narrative.myNarrative,
          risks: narrative.risks
        })
      });

      const result = await response.json();

      if (result.status === 'success') {
        alert('✅ 경제 담론이 저장되었습니다!');
      } else {
        alert('❌ 저장 실패: ' + result.message);
      }
    } catch (error) {
      console.error('저장 오류:', error);
      alert('❌ 저장 중 오류가 발생했습니다.');
    } finally {
      setIsSavingNarrative(false);
    }
  };

  const handleSaveRisk = () => {
    setSavingRisk(true);
    try {
      localStorage.setItem(RISK_STORAGE_KEY, JSON.stringify(riskRadar));
    } catch (error) {
      console.warn('리스크 레이더 저장 실패:', error);
    } finally {
      setTimeout(() => setSavingRisk(false), 400);
    }
  };

  const handleSaveBigWave = () => {
    try {
      localStorage.setItem(BIGWAVE_STORAGE_KEY, JSON.stringify(bigWave));
    } catch (error) {
      console.warn('빅웨이브 저장 실패:', error);
    }
  };

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
            selectedId={selectedIndicatorId}
            onIndicatorClick={(indicator) => {
              setSelectedIndicatorId(indicator.id);
              // 하단 차트 영역으로 스크롤
              setTimeout(() => {
                document.getElementById('chart-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }, 100);
            }}
          />
        ) : null}

        {/* 선택된 지표 상세 차트 */}
        {selectedIndicatorId && allIndicators.length > 0 && (
          <IndicatorChartPanel
            selectedIndicatorId={selectedIndicatorId}
            allIndicators={allIndicators}
            onSelectIndicator={setSelectedIndicatorId}
          />
        )}

        {/* 사이클 보조 입력: 신용/심리 */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
          <Card className="border border-primary/20 bg-card">
            <CardHeader>
              <CardTitle className="text-xl">사이클 보조 스코어 (수동)</CardTitle>
              <p className="text-sm text-muted-foreground">
                신용·유동성 / 심리·밸류에이션을 수동으로 선택해 국면 판단 보조에 활용하세요.
              </p>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">신용·유동성</p>
                <Select
                  value={cycleInputs.credit}
                  onValueChange={val => setCycleInputs(prev => ({ ...prev, credit: val as CycleLevel }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="완화">완화</SelectItem>
                    <SelectItem value="중립">중립</SelectItem>
                    <SelectItem value="긴축">긴축</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  하이일드/IG 스프레드, 금융여건지수, 은행대출태도, M2, QE/QT를 종합 판단
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">심리·밸류에이션</p>
                <Select
                  value={cycleInputs.sentiment}
                  onValueChange={val => setCycleInputs(prev => ({ ...prev, sentiment: val as CycleLevel }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="완화">탐욕/비싸</SelectItem>
                    <SelectItem value="중립">중립</SelectItem>
                    <SelectItem value="긴축">공포/싸다</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  VIX, AAII, PER/CAPE, ETF·연금 Flow 등 체감/밸류 지표 기반
                </p>
              </div>
              <div className="space-y-2 md:col-span-1">
                <p className="text-xs text-muted-foreground">메모</p>
                <Input
                  placeholder="근거 요약"
                  value={cycleInputs.notes ?? ''}
                  onChange={e => setCycleInputs(prev => ({ ...prev, notes: e.target.value }))}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 상세 지표 섹션 (Raw Data + History Table) - 통합으로 비활성화 */}
        {/* <EconomicIndicatorsSection /> */}
        {/* <DataSection /> */}

        {/* 날짜 선택 및 저장 버튼 */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between gap-4 mb-6 bg-card rounded-lg p-4 border border-primary/20">
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-muted-foreground">기준 날짜:</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-2 bg-background border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
              />
            </div>
            <button
              onClick={handleSaveNarrative}
              disabled={isSavingNarrative}
              className="px-6 py-2 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white font-semibold rounded-lg shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSavingNarrative ? '저장 중...' : '💾 담론 저장'}
            </button>
          </div>
        </div>

        {/* 뉴스 & 담론 섹션 */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
          <NewsNarrative
            articles={narrative.articles}
            myNarrative={narrative.myNarrative}
            onChange={(data) => setNarrative({ ...narrative, ...data })}
          />
        </div>

        {/* 리스크 레이더 섹션 */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-xl font-semibold">리스크 레이더</h3>
              <p className="text-sm text-muted-foreground">구조·정책 / 사이클 / 포트폴리오 + 실행 리스크 태그</p>
            </div>
            <button
              onClick={handleSaveRisk}
              disabled={savingRisk}
              className="px-4 py-2 bg-primary text-white rounded-md shadow-sm disabled:opacity-50"
            >
              {savingRisk ? '저장 중...' : '저장'}
            </button>
          </div>
          <RiskRadar value={riskRadar} onChange={setRiskRadar} />
        </div>

        {/* 빅웨이브 섹션 */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-xl font-semibold">빅웨이브 트래커</h3>
              <p className="text-sm text-muted-foreground">
                구조적 파동(빅웨이브)을 카테고리·단계·이벤트·포지션으로 관리하세요.
              </p>
            </div>
            <button
              onClick={handleSaveBigWave}
              className="px-4 py-2 bg-primary text-white rounded-md shadow-sm"
            >
              저장
            </button>
          </div>
          <BigWaveSection
            cards={bigWave.cards}
            onChange={(cards) => setBigWave({ cards })}
          />
        </div>
      </main>
      </div>
    </ErrorBoundary>
  );
}
