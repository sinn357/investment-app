import { useEffect, useState } from 'react';
import { THRESHOLD_CONFIGS, getThresholdBadge, calculateTrend, TrendInfo, INDICATOR_INFO } from '../utils/thresholds';

interface EconomicIndicator {
  name: string;
  latestDate: string;
  nextDate: string;
  actual: number | null;
  forecast: number | null;
  previous: number;
  surprise: number | null;
  threshold?: {
    value: number;
    type: 'warning' | 'critical';
  };
}

interface EconomicIndicatorCardProps {
  indicator: EconomicIndicator;
}

export default function EconomicIndicatorCard({ indicator }: EconomicIndicatorCardProps) {
  const [trend, setTrend] = useState<TrendInfo | null>(null);
  const [expandedSections, setExpandedSections] = useState({
    top: false,    // 지표 개요
    left: false,   // 해석 포인트
    right: false,  // 경제·투자 적용
    bottom: false  // 배지 시스템 설명 (기존)
  });

  // 섹션 토글 함수
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // 지표 ID 매핑 함수 (name에서 indicator ID 추출)
  const getIndicatorId = (name: string): string => {
    if (name.includes('ISM Manufacturing PMI')) return 'ism-manufacturing';
    if (name.includes('ISM Non-Manufacturing PMI')) return 'ism-non-manufacturing';
    if (name.includes('S&P Global Composite PMI')) return 'sp-global-composite';
    if (name.includes('CB Consumer Confidence')) return 'cb-consumer-confidence';
    if (name.includes('Michigan Consumer Sentiment')) return 'michigan-consumer-sentiment';
    if (name.includes('Industrial Production YoY')) return 'industrial-production-1755';
    if (name.includes('Industrial Production')) return 'industrial-production';
    if (name.includes('Retail Sales YoY')) return 'retail-sales-yoy';
    if (name.includes('Retail Sales')) return 'retail-sales';
    if (name.includes('GDP')) return 'gdp';
    return 'unknown';
  };

  // 지표별 상세 콘텐츠 매핑
  const getIndicatorContent = (indicatorId: string) => {
    const contentMap: { [key: string]: { overview: string; interpretation: string; investment: string } } = {
      'ism-manufacturing': {
        overview: `**발표 기관**: ISM (Institute for Supply Management)

**발표 일정**: 매월 1~3일, 전월 자료 발표

**종합지수 (Headline PMI)**
• 50 이상 → 경기 확장
• 50 이하 → 경기 위축
• 45 이하 → 침체 시그널 강화

**세부 항목 (중요 체크 포인트)**
• 신규주문 (New Orders) → 내수+수출 수요 반영, 선행성 가장 강함
• 생산 (Production) → 실제 생산활동
• 고용 (Employment) → NFP·실업률보다 선행 신호
• 공급업체 납기 (Supplier Deliveries) → 공급망 병목·수요 강도
• 재고 (Inventories) → 기업의 미래 수요 전망 반영
• 투입가격 (Input Prices) → 원자재·부품 가격 변동, 인플레 압력`,
        interpretation: `**알 수 있는 것**
• 경기 사이클 방향: 산업생산·GDP보다 1~2분기 선행
• 기업 체감 경기: 구매담당자의 발주 변화 → 가장 빠른 경기 시그널
• 인플레이션 신호: Input Prices → CPI·PCE 이전 단계 확인 가능
• 고용·공급망 신호: Employment + Supplier Deliveries → 경기순환 & 병목 동시 반영

**알아야 하는 것**
• 심리지표 특성: 실제 생산·소비와 괴리 발생 가능
• 50선 근처(48~52): 방향 불확실 → 3개월 평균 추세 확인 필요
• 서비스업 중심 경제: 미국 GDP의 70% 이상이 서비스업 → 제조업 PMI 단독으로 경기 전체 해석엔 한계
• ISM PMI vs S&P Global PMI: ISM은 대기업 중심, 역사성·시장 충격력 큼`,
        investment: `**거시경제 기여**
• 선행 경기 지표: 산업생산·고용·GDP보다 먼저 방향성 제시
• 인플레이션 조기 탐지: Input Prices + 납기 지연 → CPI/PCE 반영 전에 확인 가능
• 통화정책 참고: Fed가 기업 체감 경기 반영할 때 주요 지표
• 글로벌 연계성: 미국 PMI 하락 → 글로벌 교역 둔화 → 한국·중국 PMI 동반 하락

**투자 적용 방법**
• 주식시장:
– PMI > 50 + 신규주문↑ → 경기 회복 기대 → 주식 강세
– PMI < 50, 생산·고용 둔화 → 침체 우려 → 주식 약세
– 업종별: 제조업 PMI↑ → 소재·산업재·운송 강세
• 채권시장:
– PMI 강세 → 경기 과열 기대 → 금리 상승(채권 약세)
– PMI 약세 → 경기 둔화 기대 → 장기금리 하락(채권 강세)
• 환율: PMI 강세 → 달러 강세 / PMI 약세 → 달러 약세
• 원자재: PMI↑ → 구리·원유 등 산업용 금속 수요↑ / PMI↓ → 수요 감소
• 시나리오 예시:
– 제조업 PMI < 45 → 침체 경고 → 채권 매수, 주식 축소
– Input Prices↑ + PMI > 50 → 성장 + 인플레 압력 → 채권 약세, 가치주 강세`
      },
      'ism-non-manufacturing': {
        overview: `**지표명**: ISM Non-Manufacturing PMI (Services PMI)
**발표기관**: 미국 공급관리협회 (ISM)
**발표주기**: 매월 3일 (전월 데이터)
**중요도**: ★★★★☆ (서비스업 = GDP의 70%)

**측정 대상**: 미국 서비스업 구매담당자 대상 설문
- 비즈니스 활동, 신규주문, 고용, 공급업체 배송 등`,
        interpretation: `**핵심 임계점**:
- **50 이상**: 서비스업 확장
- **50 미만**: 서비스업 수축

**Manufacturing PMI와 차이점**:
- 서비스업이 GDP에서 차지하는 비중이 더 높음
- 소비자 심리와 더 밀접한 관련
- 고용 창출 효과가 더 큼

**분석 포인트**:
- 제조업 PMI와의 격차 주목
- 고용 지수의 트렌드 변화
- 가격 지수로 인플레이션 압력 측정`,
        investment: `**투자 전략**:
- **강세**: 소비재, 금융, 부동산 업종
- **약세**: 경기방어주 선호

**소비 관련 지표**:
- 소매판매와 높은 상관관계
- 소비자신뢰지수 선행지표
- 고용시장 동향 예측 가능`
      },
      'sp-global-composite': {
        overview: `**지표명**: S&P Global US Composite PMI
**발표기관**: S&P Global (구 IHS Markit)
**발표주기**: 매월 말 (플래시), 다음 달 초 (확정)
**중요도**: ★★★☆☆ (글로벌 비교 가능)

**측정 대상**: 제조업 + 서비스업 종합 지수
- 전 세계 40개국 동일한 방법론`,
        interpretation: `**ISM PMI와 차이점**:
- 표본 크기가 상대적으로 작음
- 플래시 데이터로 조기 신호 제공
- 글로벌 PMI와 직접 비교 가능

**활용법**:
- ISM PMI 발표 전 미리보기 역할
- 글로벌 경기 동조화 분석
- 신흥국 PMI와 비교 분석`,
        investment: `**글로벌 투자 관점**:
- 미국 vs 유럽 vs 아시아 PMI 비교
- 글로벌 공급망 분석
- 신흥국 투자 타이밍 판단

**통화 영향**:
- 달러 강세/약세 판단 재료
- 글로벌 리스크 온/오프 신호`
      },
      'industrial-production': {
        overview: `**지표명**: Industrial Production Index
**발표기관**: 연방준비제도 (Fed)
**발표주기**: 매월 15일경 (전월 데이터)
**중요도**: ★★★★☆ (실물경기 핵심지표)

**측정 대상**: 제조업, 광업, 유틸리티 생산량
- 2017년=100 기준 지수`,
        interpretation: `**GDP와의 관계**:
- GDP의 약 20% 차지
- 경기 전환점 조기 감지
- 고용 증감과 밀접한 관련

**분석 주의점**:
- 계절 조정 필수
- 날씨, 파업 등 일회성 요인 제거
- 장기 트렌드와 단기 변동 구분

**용도별 분류**:
- Consumer Goods (소비재)
- Business Equipment (설비투자재)
- Defense & Space (국방/우주)`,
        investment: `**섹터별 투자**:
- **증가 시**: 제조업, 에너지, 원자재
- **감소 시**: 서비스업, 기술주 상대적 선호

**경기사이클 투자**:
- 생산 증가 → 설비투자 → 고용 증가 순서
- 조기 경기회복 신호로 활용
- 인플레이션 압력 예측`
      },
      'retail-sales': {
        overview: `**지표명**: Advance Monthly Sales for Retail Trade
**발표기관**: 미국 센서스국 (Census Bureau)
**발표주기**: 매월 중순 (전월 데이터)
**중요도**: ★★★★★ (소비지출 = GDP 70%)

**측정 대상**: 소매업체 매출액
- 자동차, 가솔린, 음식점 등 13개 카테고리`,
        interpretation: `**핵심 지표**:
- **Headline**: 전체 소매판매
- **Ex-Auto**: 자동차 제외 (변동성 제거)
- **Control Group**: 가장 정확한 소비 추세

**계절성 고려**:
- 12월 홀리데이 시즌 급증
- 1월 기저효과로 급감
- 3개월 이동평균으로 트렌드 파악

**인플레이션 조정**:
- 명목 vs 실질 구분 필요
- 가격 상승분 제외한 실제 소비량 중요`,
        investment: `**소비 섹터 투자**:
- **강세**: 소매, 레저, 소비재
- **약세**: 할인점, 필수소비재 선호

**연준 정책 영향**:
- 강한 소비 → 인플레이션 압력 → 금리 상승
- 약한 소비 → 경기 둔화 → 금리 하락

**개별 카테고리 분석**:
- 자동차: 내구재 소비 선행지표
- 음식점: 서비스 소비 트렌드
- 온라인: 소비 패턴 변화`
      },
      'gdp': {
        overview: `**지표명**: Gross Domestic Product (Quarter-over-Quarter)
**발표기관**: 미국 경제분석국 (BEA)
**발표주기**: 분기별 (속보→잠정→확정)
**중요도**: ★★★★★ (경제성장률 최종 지표)

**측정 대상**: 미국 내 생산된 모든 재화와 서비스
- 개인소비 + 투자 + 정부지출 + 순수출`,
        interpretation: `**성장률 해석**:
- **연율화**: 분기 성장률 × 4
- **2분기 연속 마이너스**: 기술적 경기침체
- **잠재성장률 대비**: 약 2.5% 기준

**구성요소별 기여도**:
- 개인소비 (70%): 가장 중요
- 기업투자 (18%): 변동성 높음
- 정부지출 (17%): 정책 영향
- 순수출 (음수): 무역적자 반영

**선행지표와 비교**:
- PMI, 고용지표 등과 정합성 확인
- 분기 내 월별 지표들의 평균과 비교`,
        investment: `**성장률별 투자 전략**:
- **3%↑**: 성장주, 소형주, 원자재
- **2-3%**: 균형 포트폴리오
- **1-2%**: 대형주, 배당주 선호
- **1%↓**: 방어주, 채권 비중 확대

**연준 정책 연관성**:
- 높은 성장 → 인플레이션 우려 → 긴축
- 낮은 성장 → 경기 둔화 → 완화

**글로벌 영향**:
- 미국 GDP = 세계 GDP 25%
- 달러, 원자재 가격에 직접 영향
- 신흥국 수출에 미치는 파급효과`
      },
      'cb-consumer-confidence': {
        overview: `**CB Consumer Confidence**: Conference Board 발표 (매월 말)
**Michigan Consumer Sentiment**: 미시간대 발표 (매월 중순)

**측정 대상**: 소비자 설문조사
- 현재 상황 + 6개월 후 기대감`,
        interpretation: `**두 지표 차이점**:
- **CB**: 고용에 더 민감
- **Michigan**: 인플레이션 기대에 더 민감

**구성요소**:
- Present Situation (현재 상황)
- Expectations (기대감)
- 기대감이 더 중요 (미래 소비 예측)`,
        investment: `**소비 예측**:
- 높은 신뢰도 → 소비 증가 → 소비재주 상승
- 낮은 신뢰도 → 저축 증가 → 금융주 수혜

**선행지표 특성**:
- 실제 소비 2-3개월 선행
- 고용지표와 높은 상관관계
- 주식시장 심리와 연동`
      },
      'michigan-consumer-sentiment': {
        overview: `**CB Consumer Confidence**: Conference Board 발표 (매월 말)
**Michigan Consumer Sentiment**: 미시간대 발표 (매월 중순)

**측정 대상**: 소비자 설문조사
- 현재 상황 + 6개월 후 기대감`,
        interpretation: `**두 지표 차이점**:
- **CB**: 고용에 더 민감
- **Michigan**: 인플레이션 기대에 더 민감

**구성요소**:
- Present Situation (현재 상황)
- Expectations (기대감)
- 기대감이 더 중요 (미래 소비 예측)`,
        investment: `**소비 예측**:
- 높은 신뢰도 → 소비 증가 → 소비재주 상승
- 낮은 신뢰도 → 저축 증가 → 금융주 수혜

**선행지표 특성**:
- 실제 소비 2-3개월 선행
- 고용지표와 높은 상관관계
- 주식시장 심리와 연동`
      }
    };

    return contentMap[indicatorId] || {
      overview: '이 지표에 대한 상세 정보를 준비 중입니다.',
      interpretation: '해석 가이드를 준비 중입니다.',
      investment: '투자 활용 방법을 준비 중입니다.'
    };
  };

  // 히스토리 데이터 가져와서 추세 계산
  useEffect(() => {
    const fetchTrendData = async () => {
      const indicatorId = getIndicatorId(indicator.name);

      if (indicatorId === 'unknown') return;

      try {
        const response = await fetch(`https://investment-app-backend-x166.onrender.com/api/v2/history/${indicatorId}`);
        const result = await response.json();

        if (result.status === 'success' && result.data) {
          const calculatedTrend = calculateTrend(result.data);
          setTrend(calculatedTrend);
        }
      } catch (error) {
        console.error('Error fetching trend data:', error);
      }
    };

    fetchTrendData();
  }, [indicator.name]);

  // % 데이터를 숫자로 변환하는 헬퍼 함수
  const parseActualValue = (actual: number | string | null): number | null => {
    if (actual === null) return null;
    if (typeof actual === 'number') return actual;
    if (typeof actual === 'string') {
      const numStr = actual.replace('%', '');
      const num = parseFloat(numStr);
      return isNaN(num) ? null : num;
    }
    return null;
  };

  const getSurpriseColor = (surprise: number | null) => {
    if (surprise === null) return 'text-gray-500';
    if (surprise > 0) return 'text-green-600'; // Positive surprise = actual better than forecast = GREEN
    if (surprise < 0) return 'text-red-600';   // Negative surprise = actual worse than forecast = RED
    return 'text-gray-500';
  };

  // 새로운 4단계 배지 시스템
  const getNewThresholdBadge = () => {
    const indicatorId = getIndicatorId(indicator.name);
    const config = THRESHOLD_CONFIGS[indicatorId];

    if (!config) return null;

    const actualValue = parseActualValue(indicator.actual);
    if (actualValue === null) return null;

    const badge = getThresholdBadge(actualValue, config, trend || undefined);

    return (
      <span className={`px-3 py-1 rounded-full text-sm font-bold ${badge.color}`}>
        {badge.icon} {badge.message}
      </span>
    );
  };

  return (
    <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
      {/* 위쪽 버튼 - 지표 개요 */}
      <button
        onClick={() => toggleSection('top')}
        className="absolute -top-2 left-1/2 transform -translate-x-1/2 text-blue-500 hover:text-blue-700 transition-colors opacity-60 hover:opacity-100"
        title="지표 개요"
      >
        <svg className={`w-4 h-4 transition-transform ${expandedSections.top ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
      </button>

      {/* 왼쪽 버튼 - 해석 포인트 */}
      <button
        onClick={() => toggleSection('left')}
        className="absolute top-1/2 -left-2 transform -translate-y-1/2 text-green-500 hover:text-green-700 transition-colors opacity-60 hover:opacity-100"
        title="해석 포인트"
      >
        <svg className={`w-4 h-4 transition-transform ${expandedSections.left ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* 오른쪽 버튼 - 경제·투자 적용 */}
      <button
        onClick={() => toggleSection('right')}
        className="absolute top-1/2 -right-2 transform -translate-y-1/2 text-purple-500 hover:text-purple-700 transition-colors opacity-60 hover:opacity-100"
        title="경제·투자 적용"
      >
        <svg className={`w-4 h-4 transition-transform ${expandedSections.right ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* 위쪽 확장 섹션 - 지표 개요 */}
      {expandedSections.top && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-500">
          <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">📊 지표 개요</h4>
          <div className="text-sm text-blue-800 dark:text-blue-200 whitespace-pre-line">
            {getIndicatorContent(getIndicatorId(indicator.name)).overview}
          </div>
        </div>
      )}

      <div className="flex justify-between items-start mb-3">
        <h3 className="font-semibold text-lg text-gray-900 dark:text-white">{indicator.name}</h3>
        {getNewThresholdBadge()}
      </div>

      {/* 메인 콘텐츠 영역 - flex로 변경하여 좌우 확장 지원 */}
      <div className="flex">
        {/* 왼쪽 확장 섹션 - 해석 포인트 */}
        {expandedSections.left && (
          <div className="mr-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border-l-4 border-green-500 min-w-[200px]">
            <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">💡 해석 포인트</h4>
            <div className="text-sm text-green-800 dark:text-green-200 whitespace-pre-line">
              {getIndicatorContent(getIndicatorId(indicator.name)).interpretation}
            </div>
          </div>
        )}

        {/* 중앙 메인 콘텐츠 */}
        <div className="flex-1">
          <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-gray-500 dark:text-gray-400">최신 발표일</p>
          <p className="font-medium text-gray-900 dark:text-white">{indicator.latestDate}</p>
        </div>

        <div>
          <p className="text-gray-500 dark:text-gray-400">다음 발표일</p>
          <p className="font-medium text-gray-900 dark:text-white">{indicator.nextDate}</p>
        </div>

        <div>
          <p className="text-gray-500 dark:text-gray-400">실제치</p>
          <p className="font-medium text-gray-900 dark:text-white">
            {indicator.actual !== null ? indicator.actual : 'N/A'}
          </p>
        </div>

        <div>
          <p className="text-gray-500 dark:text-gray-400">예측치</p>
          <p className="font-medium text-gray-900 dark:text-white">
            {indicator.forecast !== null ? indicator.forecast : 'N/A'}
          </p>
        </div>

        <div>
          <p className="text-gray-500 dark:text-gray-400">이전치</p>
          <p className="font-medium text-gray-900 dark:text-white">{indicator.previous}</p>
        </div>

        <div>
          <p className="text-gray-500 dark:text-gray-400">서프라이즈</p>
          <p className={`font-medium ${getSurpriseColor(indicator.surprise)}`}>
            {indicator.surprise !== null
              ? `${indicator.surprise > 0 ? '+' : ''}${indicator.surprise.toFixed(2)}`
              : 'N/A'
            }
          </p>
        </div>
          </div>
        </div>

        {/* 오른쪽 확장 섹션 - 경제·투자 적용 */}
        {expandedSections.right && (
          <div className="ml-4 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border-l-4 border-purple-500 min-w-[200px]">
            <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">📈 경제·투자 적용</h4>
            <div className="text-sm text-purple-800 dark:text-purple-200 whitespace-pre-line">
              {getIndicatorContent(getIndicatorId(indicator.name)).investment}
            </div>
          </div>
        )}
      </div>

      {/* 접기/펼치기 버튼 */}
      <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-3">
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleSection('bottom');
          }}
          className="w-full flex items-center justify-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          data-indicator-button={indicator.name}
        >
          <span className="mr-2">배지 시스템 설명</span>
          <svg
            className={`w-4 h-4 transition-transform ${expandedSections.bottom ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* 아래쪽 확장 섹션 - 배지 시스템 설명 */}
      {expandedSections.bottom && (
        <div
          className="mt-3 px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-sm transition-all duration-300 ease-in-out"
          data-indicator={indicator.name}
        >
          {(() => {
            const indicatorId = getIndicatorId(indicator.name);
            const info = INDICATOR_INFO[indicatorId];

            if (!info) {
              return (
                <p className="text-gray-500 dark:text-gray-400">
                  이 지표에 대한 상세 정보가 없습니다.
                </p>
              );
            }

            return (
              <div className="space-y-3">
                {/* 지표 설명 */}
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-1">지표 설명</h4>
                  <p className="text-gray-600 dark:text-gray-300">{info.description}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">카테고리: {info.category}</p>
                </div>

                {/* 배지 임계점 */}
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">배지 시스템</h4>
                  <div className="space-y-1">
                    <div className="flex items-center">
                      <span className="text-green-600 mr-2">✅</span>
                      <span className="text-gray-600 dark:text-gray-300">{info.thresholds.good}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-gray-600 mr-2">➖</span>
                      <span className="text-gray-600 dark:text-gray-300">{info.thresholds.neutral}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-yellow-600 mr-2">⚠️</span>
                      <span className="text-gray-600 dark:text-gray-300">{info.thresholds.warning}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-red-600 mr-2">🔴</span>
                      <span className="text-gray-600 dark:text-gray-300">{info.thresholds.bad}</span>
                    </div>
                  </div>
                </div>

                {/* 차트 기준선 */}
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">차트 기준선</h4>
                  <div className="space-y-1">
                    {info.referenceLines.map((line, index) => (
                      <div key={index} className="flex items-center">
                        <div className={`w-4 h-0.5 mr-2 ${index === 0 ? 'bg-red-500' : 'bg-orange-400'}`}
                             style={{ backgroundImage: 'repeating-linear-gradient(to right, transparent, transparent 2px, currentColor 2px, currentColor 4px)' }}></div>
                        <span className="text-gray-600 dark:text-gray-300 text-xs">{line}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 경제적 의미 */}
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-1">경제적 의미</h4>
                  <p className="text-gray-600 dark:text-gray-300">{info.economicMeaning}</p>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}