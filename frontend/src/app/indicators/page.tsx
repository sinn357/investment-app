'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Navigation from '@/components/Navigation';
import MasterCycleCard from '@/components/MasterCycleCard';
// import CyclePanel from '@/components/CyclePanel'; // ✅ 제거: Master Cycle로 대체
import IndicatorGrid from '@/components/IndicatorGrid';
import IndicatorTableView from '@/components/IndicatorTableView';
import IndicatorChartPanel from '@/components/IndicatorChartPanel';
// import EconomicIndicatorsSection from '@/components/EconomicIndicatorsSection'; // 통합으로 비활성화
// import DataSection from '@/components/DataSection'; // 통합으로 비활성화
import NewsNarrative from '@/components/NewsNarrative';
import NarrativeReview from '@/components/NarrativeReview';
import RiskRadar from '@/components/RiskRadar';
// import CyclePanelSkeleton from '@/components/skeletons/CyclePanelSkeleton'; // ✅ 제거: Master Cycle로 대체
import IndicatorGridSkeleton from '@/components/skeletons/IndicatorGridSkeleton';
import ErrorBoundary from '@/components/ErrorBoundary';
// import { calculateCycleScore, RawIndicators } from '@/utils/cycleCalculator'; // ✅ 제거: Master Cycle로 대체
import { fetchJsonWithRetry } from '@/utils/fetchWithRetry';
import { calculateCycleTrendsFromIndicators } from '@/utils/trendCalculator';
import BigWaveSection, { BigWaveCard } from '@/components/BigWaveSection';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import GlassCard from '@/components/GlassCard';

interface Interpretation {
  core_definition: string;
  interpretation_guide: string;
  context_meaning: string;
  market_reaction: string;
  additional_info: string;
}

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
  manualCheck?: boolean;  // 직접 확인 필요 여부
  url?: string;  // 직접 확인 URL
  interpretation?: Interpretation;
  data?: {
    latest_release?: {
      actual: number | string | null;
      forecast?: number | string | null;
      previous: number | string;
    };
    history_table?: Array<{
      release_date: string;
      time?: string;
      actual: number | string | null;
      forecast?: number | string | null;
      previous: number | string;
    }>;
  };
}

// ✅ 성능 최적화: 순수 함수를 컴포넌트 외부로 이동 (매 렌더링마다 재생성 방지)
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

interface BigWaveData {
  cards: BigWaveCard[];
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://investment-app-backend-x166.onrender.com';
const RISK_STORAGE_KEY = 'risk_radar_v1';
const BIGWAVE_STORAGE_KEY = 'bigwave_v1';
const NARRATIVE_DRAFT_STORAGE_KEY = 'economic_narrative_draft_v1';

export default function IndicatorsPage() {
  const [userId] = useState(1); // 임시 user_id
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  // const [cycleScore, setCycleScore] = useState<ReturnType<typeof calculateCycleScore> | null>(null); // ✅ 제거: Master Cycle로 대체
  const [allIndicators, setAllIndicators] = useState<GridIndicator[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [indicatorsPayload, setIndicatorsPayload] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedIndicatorId, setSelectedIndicatorId] = useState<string | undefined>(undefined);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateProgress, setUpdateProgress] = useState<{ completed: number; total: number; current?: string } | null>(null);
  const [countdownSeconds, setCountdownSeconds] = useState<number | null>(null); // ✅ Phase 2: 자동 새로고침 카운트다운
  // ✅ Phase 3: 로딩/업데이트 정보 추적
  const [loadingInfo, setLoadingInfo] = useState<{
    type: 'loading' | 'update';
    duration: number;
    count: number;
  }>({ type: 'loading', duration: 0, count: 0 });
  // ✅ NEW: Master Market Cycle state (Phase 1)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [masterCycleData, setMasterCycleData] = useState<any>(null);
  // ✅ NEW: Health Check state (Phase 2)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [healthCheck, setHealthCheck] = useState<any>(null);
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
  const [bigWave, setBigWave] = useState<BigWaveData>({ cards: [] });
  const [isSavingNarrative, setIsSavingNarrative] = useState(false);
  const [savingRisk, setSavingRisk] = useState(false);
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
  // 섹션별 접기 상태
  const [collapsedSections, setCollapsedSections] = useState({
    masterCycle: false,
    healthCheck: false,
    indicators: false,
    newsNarrative: false,
    riskRadar: false,
    bigWave: false,
  });
  const [narrativeRefreshKey, setNarrativeRefreshKey] = useState(0);

  // 섹션 접기/펼치기 토글 함수
  const toggleSection = useCallback((section: keyof typeof collapsedSections) => {
    setCollapsedSections(prev => ({ ...prev, [section]: !prev[section] }));
  }, []);

  // 전체 접기/펼치기
  const toggleAllSections = useCallback((collapsed: boolean) => {
    setCollapsedSections({
      masterCycle: collapsed,
      healthCheck: collapsed,
      indicators: collapsed,
      newsNarrative: collapsed,
      riskRadar: collapsed,
      bigWave: collapsed,
    });
  }, []);

  const getNarrativeDraftKey = useCallback((date: string) => {
    return `${NARRATIVE_DRAFT_STORAGE_KEY}_${userId}_${date}`;
  }, [userId]);

  const handleSelectNarrativeDate = useCallback((date: string) => {
    setSelectedDate(date);
  }, []);

  const handleDeleteNarrativeDate = useCallback((date: string) => {
    try {
      const draftKey = getNarrativeDraftKey(date);
      localStorage.removeItem(draftKey);
    } catch (error) {
      console.warn('담론 임시저장 삭제 실패:', error);
    }

    if (date === selectedDate) {
      setNarrative({
        articles: [],
        myNarrative: '',
        risks: []
      });
    }
  }, [getNarrativeDraftKey, selectedDate]);

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

  const fetchHealthCheck = useCallback(async () => {
    const cacheKey = 'health_check_cache_v1';
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        setHealthCheck(JSON.parse(cached));
      }
    } catch (error) {
      console.warn('헬스체크 캐시 로드 실패:', error);
    }

    try {
      const response = await fetchJsonWithRetry(`${API_URL}/api/v2/indicators/health-check`);
      setHealthCheck(response);
      try {
        localStorage.setItem(cacheKey, JSON.stringify(response));
      } catch (error) {
        console.warn('헬스체크 캐시 저장 실패:', error);
      }
    } catch (error) {
      console.error('헬스체크 데이터 로드 실패:', error);
    }
  }, []);

  // ✅ Phase 2: 헬스체크 데이터 페칭
  useEffect(() => {
    fetchHealthCheck();
  }, [fetchHealthCheck]); // 페이지 로드 시 한 번만 실행

  // 수동 업데이트 함수
  const handleManualUpdate = async () => {
    try {
      setIsUpdating(true);
      // ✅ 수정 1: 업데이트 시작 시간을 localStorage에 저장 (새로고침 후에도 유지)
      localStorage.setItem('updateStartTime', Date.now().toString());

      const response = await fetch(`${API_URL}/api/v2/update-indicators`, {
        method: 'POST',
      });

      const result = await response.json();

      if (result.status === 'success') {
        // 업데이트 시작 성공, 상태 폴링 시작
        const pollInterval = setInterval(async () => {
          const statusResponse = await fetch(`${API_URL}/api/v2/update-status`);
          const statusResult = await statusResponse.json();

          if (statusResult.status === 'success' && statusResult.update_status) {
            const status = statusResult.update_status;

            // ✅ 수정: 백엔드 필드명에 맞게 변경 (total_indicators, completed_indicators)
            setUpdateProgress({
              completed: status.completed_indicators?.length || 0,
              total: status.total_indicators || 0,
              current: status.current_indicator
            });

            if (!status.is_updating) {
              // ✅ Phase 2: 업데이트 완료 - 3초 카운트다운 시작
              clearInterval(pollInterval);
              setIsUpdating(false);
              setUpdateProgress(null);
              fetchHealthCheck();

              // ✅ 수정: localStorage 저장은 새로고침 후 데이터 로딩 완료 시점에 처리
              // (updateStartTime은 localStorage에 저장되어 있으므로 여기서는 저장하지 않음)

              // 3초 카운트다운 시작 (window.location.reload는 useEffect에서 처리)
              setCountdownSeconds(3);
            }
          }
        }, 2000); // 2초마다 폴링

        // 최대 5분 후 타임아웃
        setTimeout(() => {
          clearInterval(pollInterval);
          setIsUpdating(false);
        }, 300000);
      } else {
        setIsUpdating(false);
        alert('업데이트 시작에 실패했습니다.');
      }
    } catch (error) {
      console.error('Manual update error:', error);
      setIsUpdating(false);
      alert('업데이트 중 오류가 발생했습니다.');
    }
  };

  // 경제 지표 데이터 페칭 및 국면 계산 (✅ 통합 API - 4개 요청 → 1개 요청)
  useEffect(() => {
    async function fetchAndCalculateCycle() {
      try {
        setLoading(true);
        const startTime = performance.now(); // ✅ 로딩 시작 시간 측정

        // v2 API: 모든 데이터 한 번에 가져오기 (47개 지표 + 3대 사이클)
        const result = await fetchJsonWithRetry(
          `${API_URL}/api/v2/indicators`,
          {},
          3,
          1000
        );

        if (result.status === 'success' && result.indicators) {
          // 최신 업데이트 시간 저장
          if (result.last_updated) {
            setLastUpdated(result.last_updated);
          }
          setIndicatorsPayload(result.indicators);

          // ✅ 제거: cycleCalculator 로직 - Master Cycle로 대체

          // 그리드용 지표 데이터 생성 (백엔드에서 메타데이터 포함됨)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const gridIndicators: GridIndicator[] = result.indicators.map((item: any) => {
            const latest = item.data?.latest_release ?? {};

            // 히스토리 데이터에서 스파크라인 데이터 추출 (최근 6개월)
            // release_date 기준으로 최신순 정렬 후 사용 (일부 지표는 역순 정렬되어 있음)
            const sparklineData = item.data.history_table
              ? [...item.data.history_table]
                  .sort((a: { release_date: string }, b: { release_date: string }) =>
                    new Date(b.release_date).getTime() - new Date(a.release_date).getTime()
                  )
                  .slice(0, 6)
                  .reverse()
                  .map((h: { actual: string | number }) => {
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
              actual: latest.actual ?? null,
              previous: latest.previous ?? '-',
              forecast: latest.forecast ?? null,
              surprise: item.surprise ?? null,  // 최상위 레벨에서 가져옴
              category: item.category || mapIndicatorToCategory(item.name),
              sparklineData,
              reverseColor: item.reverse_color || false,
              manualCheck: item.manual_check || false,  // 직접 확인 필요 여부
              url: item.url || undefined,  // 직접 확인 URL
              interpretation: item.interpretation,  // 해석 데이터 전달
              data: item.data,  // 히스토리 포함한 전체 데이터 전달
            };
          });
          setAllIndicators(gridIndicators);

          // ✅ 수정 2: 페이지 로드 시 분기 처리 (Case 1,2,3)
          const endTime = performance.now();
          const loadTime = (endTime - startTime) / 1000; // 밀리초 → 초

          // localStorage에 updateStartTime이 있는지 확인 (업데이트 후 새로고침인지)
          const savedUpdateStartTime = localStorage.getItem('updateStartTime');

          if (savedUpdateStartTime) {
            // Case 3: 업데이트 버튼 클릭 후 → 전체 시간 계산
            const totalDuration = (Date.now() - parseInt(savedUpdateStartTime)) / 1000;
            const updateInfo = {
              type: 'update' as const,
              duration: Number(totalDuration.toFixed(1)),
              count: gridIndicators.length,
              timestamp: Date.now()
            };
            setLoadingInfo(updateInfo);

            // 영구 저장 (5분간 유지)
            localStorage.setItem('lastUpdateInfo', JSON.stringify(updateInfo));
            // 일회용 시작 시간 삭제
            localStorage.removeItem('updateStartTime');

            // ✅ 수정 3: 실제 업데이트 시간 저장
            localStorage.setItem('actualLastUpdate', new Date().toISOString());
          } else {
            // Case 1, 2: 페이지 첫 진입 또는 새로고침 → 일반 로딩 시간
            // 최근 업데이트 정보가 있으면 우선 표시
            const saved = localStorage.getItem('lastUpdateInfo');
            if (saved) {
              try {
                const info = JSON.parse(saved);
                // 5분 이내면 업데이트 정보 유지
                if (Date.now() - info.timestamp < 5 * 60 * 1000) {
                  setLoadingInfo({
                    type: info.type,
                    duration: info.duration,
                    count: info.count
                  });
                  return; // 업데이트 정보 유지, 로딩 정보로 덮어쓰지 않음
                }
              } catch (error) {
                console.warn('lastUpdateInfo 파싱 실패:', error);
              }
            }

            // 업데이트 정보가 없거나 오래되면 일반 로딩 정보 표시
            setLoadingInfo({
              type: 'loading',
              duration: Number(loadTime.toFixed(2)),
              count: gridIndicators.length
            });
          }
        }

      } catch (error) {
        console.error('Failed to fetch cycle data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchAndCalculateCycle();
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function fetchMasterCycle() {
      try {
        const masterResult = await fetchJsonWithRetry(
          `${API_URL}/api/v4/master-cycle`,
          {},
          3,
          1000
        );

        if (cancelled) return;

        if (masterResult.status === 'success' && masterResult.data) {
          const needsTrendFallback =
            masterResult.data.macro?.trend == null ||
            masterResult.data.credit?.trend == null ||
            masterResult.data.sentiment?.trend == null;

          let trendFallback = null;
          if (needsTrendFallback && indicatorsPayload) {
            // ✅ Fallback: 히스토리 기반 Trend 계산 (API 미제공 시)
            const indicatorsMap: Record<string, { data?: { latest_release?: { actual?: number | string | null }; history_table?: Array<{ release_date: string; actual: number | string | null }> } }> = {};
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            indicatorsPayload.forEach((item: any) => {
              if (item?.indicator_id) {
                indicatorsMap[item.indicator_id] = { data: item.data };
              }
            });
            trendFallback = calculateCycleTrendsFromIndicators(indicatorsMap);
          }

          // masterResult.data에 trend 보강 (API 우선, 없으면 fallback)
          const enrichedData = {
            ...masterResult.data,
            macro: {
              ...masterResult.data.macro,
              trend: masterResult.data.macro?.trend ?? trendFallback?.macro,
            },
            credit: {
              ...masterResult.data.credit,
              trend: masterResult.data.credit?.trend ?? trendFallback?.credit,
            },
            sentiment: {
              ...masterResult.data.sentiment,
              trend: masterResult.data.sentiment?.trend ?? trendFallback?.sentiment,
            },
          };

          setMasterCycleData(enrichedData);
        }
      } catch (error) {
        if (!cancelled) {
          console.warn('Master Cycle API 호출 실패 (v4):', error);
        }
      }
    }

    fetchMasterCycle();
    return () => {
      cancelled = true;
    };
  }, [indicatorsPayload]);

  // ✅ Phase 2: 카운트다운 감소 로직
  useEffect(() => {
    if (countdownSeconds !== null && countdownSeconds > 0) {
      const timer = setTimeout(() => {
        setCountdownSeconds(countdownSeconds - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (countdownSeconds === 0) {
      // 0초 도달 시 자동 새로고침
      window.location.reload();
    }
  }, [countdownSeconds]);

  // 경제 담론 데이터 로드
  useEffect(() => {
    const fetchNarrative = async () => {
      let hasDraft = false;
      try {
        const draftKey = getNarrativeDraftKey(selectedDate);
        const draftRaw = localStorage.getItem(draftKey);
        if (draftRaw) {
          const draft = JSON.parse(draftRaw) as EconomicNarrative;
          setNarrative({
            articles: draft.articles || [],
            myNarrative: draft.myNarrative || '',
            risks: draft.risks || []
          });
          hasDraft = true;
        }
      } catch (error) {
        console.warn('담론 임시저장 로드 실패:', error);
      }

      try {
        const response = await fetch(`${API_URL}/api/economic-narrative?user_id=${userId}&date=${selectedDate}`);
        const result = await response.json();

        if (result.status === 'success' && result.data) {
          if (!hasDraft) {
            setNarrative({
              articles: result.data.articles || [],
              myNarrative: result.data.my_narrative || '',
              risks: result.data.risks || []
            });
          }
        } else {
          // 데이터 없으면 초기화
          if (!hasDraft) {
            setNarrative({
              articles: [],
              myNarrative: '',
              risks: []
            });
          }
        }
      } catch (error) {
        console.error('담론 로드 실패:', error);
      }
    };

    fetchNarrative();
  }, [userId, selectedDate, getNarrativeDraftKey]);

  useEffect(() => {
    if (!userId || !selectedDate) return;

    const hasContent = Boolean(
      narrative.myNarrative.trim() ||
      narrative.articles.length > 0 ||
      narrative.risks.length > 0
    );
    const draftKey = getNarrativeDraftKey(selectedDate);

    const timer = setTimeout(() => {
      try {
        if (!hasContent) {
          localStorage.removeItem(draftKey);
          return;
        }
        localStorage.setItem(draftKey, JSON.stringify({
          articles: narrative.articles,
          myNarrative: narrative.myNarrative,
          risks: narrative.risks
        }));
      } catch (error) {
        console.warn('담론 임시저장 실패:', error);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [userId, selectedDate, narrative, getNarrativeDraftKey]);

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
        try {
          const draftKey = getNarrativeDraftKey(selectedDate);
          localStorage.removeItem(draftKey);
        } catch (error) {
          console.warn('담론 임시저장 삭제 실패:', error);
        }
        setNarrative({
          articles: [],
          myNarrative: '',
          risks: []
        });
        setNarrativeRefreshKey((prev) => prev + 1);
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

      {/* 탭 네비게이션 임시 숨김 - 그리드가 대체 */}
      {/* <TabNavigation
        tabs={indicatorTabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      /> */}

      <main className="overflow-x-hidden">
        {/* 전체 접기/펼치기 버튼 */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-4">
          <div className="flex justify-end gap-2">
            <button
              onClick={() => toggleAllSections(true)}
              className="px-3 py-1.5 text-xs bg-muted hover:bg-muted/80 text-muted-foreground rounded-md"
            >
              모두 접기
            </button>
            <button
              onClick={() => toggleAllSections(false)}
              className="px-3 py-1.5 text-xs bg-muted hover:bg-muted/80 text-muted-foreground rounded-md"
            >
              모두 펼치기
            </button>
          </div>
        </div>

        {/* ✅ NEW: Master Market Cycle (Phase 1) */}
        {!loading && masterCycleData && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-4">
            <div
              onClick={() => toggleSection('masterCycle')}
              className="flex items-center justify-between p-3 bg-card rounded-t-lg border border-b-0 border-primary/20 cursor-pointer hover:bg-muted/50"
            >
              <h3 className="text-lg font-semibold text-foreground">🎯 Master Market Cycle</h3>
              <span className="text-sm text-muted-foreground">{collapsedSections.masterCycle ? '펼치기 ▼' : '접기 ▲'}</span>
            </div>
            {!collapsedSections.masterCycle && <MasterCycleCard data={masterCycleData} />}
          </div>
        )}

        {/* ✅ NEW: Health Check Summary (Phase 2) */}
        {!loading && healthCheck && healthCheck.summary && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-4">
            <div
              onClick={() => toggleSection('healthCheck')}
              className="flex items-center justify-between p-3 bg-card rounded-t-lg border border-b-0 border-primary/20 cursor-pointer hover:bg-muted/50"
            >
              <h3 className="text-lg font-semibold text-foreground">📊 지표 상태 요약</h3>
              <span className="text-sm text-muted-foreground">{collapsedSections.healthCheck ? '펼치기 ▼' : '접기 ▲'}</span>
            </div>
            {!collapsedSections.healthCheck && (
            <GlassCard className="p-4 rounded-t-none" animate animationDelay={50}>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">✅</span>
                  <div>
                    <span className="text-sm text-muted-foreground">Healthy</span>
                    <p className="text-xl font-bold text-green-600 dark:text-green-400">
                      {healthCheck.summary.healthy}개
                    </p>
                    <span className="text-xs text-muted-foreground">(7일 이내)</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">⚠️</span>
                  <div>
                    <span className="text-sm text-muted-foreground">Stale</span>
                    <p className="text-xl font-bold text-yellow-600 dark:text-yellow-400">
                      {healthCheck.summary.stale}개
                    </p>
                    <span className="text-xs text-muted-foreground">(7-30일)</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🔗</span>
                  <div>
                    <span className="text-sm text-muted-foreground">Direct Check</span>
                    <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                      {healthCheck.summary.manual_check ?? 0}개
                    </p>
                    <span className="text-xs text-muted-foreground">(직접 확인)</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🚨</span>
                  <div>
                    <span className="text-sm text-muted-foreground">Outdated</span>
                    <p className="text-xl font-bold text-orange-600 dark:text-orange-400">
                      {healthCheck.summary.outdated}개
                    </p>
                    <span className="text-xs text-muted-foreground">(30일+)</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🆕</span>
                  <div>
                    <span className="text-sm text-muted-foreground">Updated 24h</span>
                    <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                      {healthCheck.summary.updated_recent ?? 0}개
                    </p>
                    <span className="text-xs text-muted-foreground">(최근 업데이트)</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">❌</span>
                  <div>
                    <span className="text-sm text-muted-foreground">Error</span>
                    <p className="text-xl font-bold text-red-600 dark:text-red-400">
                      {healthCheck.summary.error}개
                    </p>
                    <span className="text-xs text-muted-foreground">(크롤링 실패)</span>
                  </div>
                </div>
              </div>
            </GlassCard>
            )}
          </div>
        )}

        {/* 경제지표 한눈에 보기 */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-4">
          <div
            onClick={() => toggleSection('indicators')}
            className="flex items-center justify-between p-3 bg-card rounded-lg border border-primary/20 cursor-pointer hover:bg-muted/50"
          >
            <div>
              <h3 className="text-lg font-semibold text-foreground">📈 경제지표 한눈에 보기</h3>
              <p className="text-xs text-muted-foreground">
                클릭하여 펼치거나 접을 수 있습니다.
              </p>
            </div>
            <span className="text-sm text-muted-foreground">{collapsedSections.indicators ? '펼치기 ▼' : '접기 ▲'}</span>
          </div>
        </div>

        {!collapsedSections.indicators && (
          <>
            {/* 경제지표 그리드 (Phase 8 - 한눈에 보기) */}
            {loading ? (
              <IndicatorGridSkeleton />
            ) : allIndicators.length > 0 ? (
              <>
                {/* 업데이트 정보 및 뷰 토글 - 모바일 반응형 */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-4">
                  <div className="flex flex-col gap-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                    {/* 첫 번째 줄: 업데이트 버튼 + 뷰 토글 (모바일에서 가장 중요) */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      {/* 업데이트 버튼 - 모바일에서 먼저 표시 */}
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={handleManualUpdate}
                          disabled={isUpdating}
                          size="sm"
                          className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isUpdating ? (
                            <>
                              <svg className="animate-spin h-4 w-4 mr-1" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                              <span className="hidden sm:inline">업데이트 중...</span>
                              <span className="sm:hidden">진행중</span>
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4 sm:mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                              <span className="hidden sm:inline">지표 업데이트</span>
                            </>
                          )}
                        </Button>
                        {/* 업데이트 시간 배지 */}
                        {(() => {
                          const actualUpdate = localStorage.getItem('actualLastUpdate');
                          const displayTime = actualUpdate && new Date(actualUpdate) > new Date(lastUpdated || 0)
                            ? actualUpdate
                            : lastUpdated;

                          if (!displayTime) return null;

                          const totalMinutes = (Date.now() - new Date(displayTime).getTime()) / (1000 * 60);
                          const hours = Math.floor(totalMinutes / 60);
                          const isStale = hours >= 24;

                          return (
                            <Badge
                              variant={isStale ? "destructive" : "default"}
                              className="text-xs font-medium hidden sm:inline-flex"
                            >
                              {isStale ? '🔴 크롤링 권장' : `🟢 ${hours}h전`}
                            </Badge>
                          );
                        })()}
                      </div>

                      {/* 뷰 토글 버튼 */}
                      <div className="flex items-center gap-1 bg-white dark:bg-gray-700 rounded-lg p-1 border border-gray-300 dark:border-gray-600">
                        <button
                          onClick={() => setViewMode('card')}
                          className={`flex items-center gap-1 px-2 py-1 sm:px-3 sm:py-1.5 rounded-md text-sm font-medium transition-colors ${
                            viewMode === 'card'
                              ? 'bg-blue-600 text-white'
                              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                          }`}
                          title="카드 뷰"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                          </svg>
                          <span className="hidden sm:inline">카드</span>
                        </button>
                        <button
                          onClick={() => setViewMode('table')}
                          className={`flex items-center gap-1 px-2 py-1 sm:px-3 sm:py-1.5 rounded-md text-sm font-medium transition-colors ${
                            viewMode === 'table'
                              ? 'bg-blue-600 text-white'
                              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                          }`}
                          title="테이블 뷰"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          <span className="hidden sm:inline">테이블</span>
                        </button>
                      </div>
                    </div>

                    {/* 두 번째 줄: 업데이트 진행 상태 (있을 때만) */}
                    {isUpdating && updateProgress && (
                      <div className="text-xs text-muted-foreground text-center sm:text-left">
                        {updateProgress.completed} / {updateProgress.total} 완료
                        {updateProgress.current && ` (${updateProgress.current})`}
                      </div>
                    )}

                    {/* 카운트다운 메시지 */}
                    {countdownSeconds !== null && countdownSeconds > 0 && (
                      <div className="flex items-center justify-center gap-2 px-3 py-2 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-sm font-semibold rounded-lg border border-green-300 dark:border-green-700 animate-pulse">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {countdownSeconds}초 후 자동 새로고침...
                      </div>
                    )}

                    {/* 세 번째 줄: 마지막 업데이트 시간 + 로딩 정보 (데스크톱에서만 전체 표시) */}
                    <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                      <span>
                        {(() => {
                          const actualUpdate = localStorage.getItem('actualLastUpdate');
                          const displayTime = actualUpdate && new Date(actualUpdate) > new Date(lastUpdated || 0)
                            ? actualUpdate
                            : lastUpdated;

                          return displayTime ? (
                            <>
                              <span className="hidden sm:inline">마지막 업데이트: </span>
                              <span className="font-medium text-gray-900 dark:text-gray-100">
                                {new Date(displayTime).toLocaleString('ko-KR', {
                                  timeZone: 'Asia/Seoul',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </>
                          ) : (
                            '업데이트 정보 없음'
                          );
                        })()}
                      </span>
                      {/* 로딩/업데이트 정보 배지 */}
                      {loadingInfo.duration > 0 && (
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full border ${
                          loadingInfo.type === 'loading'
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-300 dark:border-green-700'
                            : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-700'
                        }`}>
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          <span className="hidden sm:inline">
                            {loadingInfo.type === 'loading'
                              ? `로딩: ${loadingInfo.duration}초`
                              : `완료: ${loadingInfo.count}개 (${Math.floor(loadingInfo.duration)}초)`
                            }
                          </span>
                          <span className="sm:hidden">
                            {Math.floor(loadingInfo.duration)}초
                          </span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* 조건부 렌더링: 카드 뷰 vs 테이블 뷰 */}
                {viewMode === 'card' ? (
                  <IndicatorGrid
                    indicators={allIndicators}
                    selectedId={selectedIndicatorId}
                    onIndicatorClick={(indicator) => {
                      setSelectedIndicatorId(indicator.id);
                      setTimeout(() => {
                        document.getElementById('chart-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }, 100);
                    }}
                  />
                ) : (
                  <IndicatorTableView
                    indicators={allIndicators}
                    selectedId={selectedIndicatorId}
                    onIndicatorClick={(indicator) => {
                      setSelectedIndicatorId(indicator.id);
                      setTimeout(() => {
                        document.getElementById('chart-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }, 100);
                    }}
                  />
                )}
              </>
            ) : null}

            {/* 선택된 지표 상세 차트 */}
            {selectedIndicatorId && allIndicators.length > 0 && (
              <IndicatorChartPanel
                selectedIndicatorId={selectedIndicatorId}
                allIndicators={allIndicators}
                onSelectIndicator={setSelectedIndicatorId}
              />
            )}
          </>
        )}

        {/* 상세 지표 섹션 (Raw Data + History Table) - 통합으로 비활성화 */}
        {/* <EconomicIndicatorsSection /> */}
        {/* <DataSection /> */}

        {/* 뉴스 & 담론 섹션 */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div
            onClick={() => toggleSection('newsNarrative')}
            className="flex items-center justify-between p-3 bg-card rounded-lg border border-primary/20 cursor-pointer hover:bg-muted/50 mb-4"
          >
            <div>
              <h3 className="text-lg font-semibold text-foreground">📰 뉴스 & 담론</h3>
              <p className="text-xs text-muted-foreground">뉴스 기반 시장 담론 기록</p>
            </div>
            <span className="text-sm text-muted-foreground">{collapsedSections.newsNarrative ? '펼치기 ▼' : '접기 ▲'}</span>
          </div>

          {!collapsedSections.newsNarrative && (
            <>
              <NewsNarrative
                articles={narrative.articles}
                myNarrative={narrative.myNarrative}
                onChange={(data) => setNarrative({ ...narrative, ...data })}
                mmcScore={masterCycleData?.mmc_score}
                phase={masterCycleData?.phase}
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
              />

              {/* 담론 저장 버튼 */}
              <div className="mt-4 flex justify-end">
                <button
                  onClick={handleSaveNarrative}
                  disabled={isSavingNarrative}
                  className="px-6 py-2 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white font-semibold rounded-lg shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSavingNarrative ? '저장 중...' : '💾 담론 저장'}
                </button>
              </div>

              {/* 과거 담론 리뷰 섹션 */}
              <NarrativeReview
                userId={userId}
                refreshKey={narrativeRefreshKey}
                onSelectDate={handleSelectNarrativeDate}
                onDeleteDate={handleDeleteNarrativeDate}
              />
            </>
          )}
        </div>

        {/* 리스크 레이더 섹션 */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-4">
          <div
            onClick={() => toggleSection('riskRadar')}
            className="flex items-center justify-between p-3 bg-card rounded-lg border border-primary/20 cursor-pointer hover:bg-muted/50 mb-4"
          >
            <div>
              <h3 className="text-lg font-semibold text-foreground">🎯 리스크 레이더</h3>
              <p className="text-xs text-muted-foreground">구조·정책 / 사이클 / 포트폴리오 + 실행 리스크 태그</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={(e) => { e.stopPropagation(); handleSaveRisk(); }}
                disabled={savingRisk}
                className="px-3 py-1.5 text-xs bg-primary text-white rounded-md shadow-sm disabled:opacity-50"
              >
                {savingRisk ? '저장 중...' : '저장'}
              </button>
              <span className="text-sm text-muted-foreground">{collapsedSections.riskRadar ? '펼치기 ▼' : '접기 ▲'}</span>
            </div>
          </div>
          {!collapsedSections.riskRadar && <RiskRadar value={riskRadar} onChange={setRiskRadar} />}
        </div>

        {/* 빅웨이브 섹션 */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
          <div
            onClick={() => toggleSection('bigWave')}
            className="flex items-center justify-between p-3 bg-card rounded-lg border border-primary/20 cursor-pointer hover:bg-muted/50 mb-4"
          >
            <div>
              <h3 className="text-lg font-semibold text-foreground">🌊 빅웨이브 트래커</h3>
              <p className="text-xs text-muted-foreground">
                구조적 파동(빅웨이브)을 카테고리·단계·이벤트·포지션으로 관리하세요.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={(e) => { e.stopPropagation(); handleSaveBigWave(); }}
                className="px-3 py-1.5 text-xs bg-primary text-white rounded-md shadow-sm"
              >
                저장
              </button>
              <span className="text-sm text-muted-foreground">{collapsedSections.bigWave ? '펼치기 ▼' : '접기 ▲'}</span>
            </div>
          </div>
          {!collapsedSections.bigWave && (
            <BigWaveSection
              cards={bigWave.cards}
              onChange={(cards) => setBigWave({ cards })}
            />
          )}
        </div>
      </main>
      </div>
    </ErrorBoundary>
  );
}
