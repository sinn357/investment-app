'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';

interface AnalysisData {
  fundamental: {
    investment_reason: string;
    potential: string;
    basic_info: Record<string, unknown>;
    competitor_comparison: Record<string, unknown>;
    financial_analysis: Record<string, unknown>;
  };
  technical: {
    chart_analysis: Record<string, unknown>;
    quant_analysis: Record<string, unknown>;
    sentiment_analysis: Record<string, unknown>;
  };
  summary: {
    investment_considerations: Record<string, unknown>;
    risk_points: Record<string, unknown>;
    valuation: Record<string, unknown>;
    investment_point: string;
    my_thoughts: string;
  };
  updated_at: string | null;
}

type TabType = 'fundamental' | 'technical' | 'summary';

const API_URL = 'https://investment-app-backend-x166.onrender.com';

// 기본정보 아코디언 항목들
const basicInfoItems = [
  { key: 'company_overview', label: '기업 개요', placeholder: '회사의 전반적인 개요를 작성하세요...' },
  { key: 'business_type', label: '사업 종류 및 구조', placeholder: '주요 사업 분야와 조직 구조...' },
  { key: 'history', label: '연혁 & 이정표', placeholder: '주요 연혁과 이정표...' },
  { key: 'management', label: '경영진/지배구조', placeholder: 'CEO, 이사회 구성원 등...' },
  { key: 'products', label: '주요 제품/서비스', placeholder: '핵심 제품과 서비스...' },
  { key: 'customers', label: '고객군', placeholder: '주요 타겟 고객...' },
  { key: 'ownership', label: '지분구조', placeholder: '주요 주주 및 지분율...' },
  { key: 'business_model', label: '비즈니스 모델', placeholder: '수익 창출 방식...' },
  { key: 'value_chain', label: '밸류체인&원가구성', placeholder: '가치 사슬과 원가 구조...' },
  { key: 'kpi', label: '수요KPI&수요탄력성', placeholder: '핵심 성과 지표와 수요 탄력성...' },
  { key: 'lifecycle', label: '산업 생애주기(S-Curve)', placeholder: '산업의 성장 단계...' },
  { key: 'distribution', label: '유통 방식', placeholder: '직접판매, 대리점, 온라인 등...' },
  { key: 'channel', label: '채널 구조', placeholder: 'B2B, B2C, D2C 등...' },
  { key: 'ip', label: '지적재산(IP)', placeholder: '특허, 표준화, 진입장벽...' },
];

// 기본정보 아코디언 컴포넌트
function BasicInfoAccordion({ data, onChange }: { data: Record<string, unknown>, onChange: (key: string, value: string) => void }) {
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const toggleItem = (key: string) => {
    setExpandedItems(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  return (
    <div className="space-y-2">
      {basicInfoItems.map((item) => (
        <div key={item.key} className="border border-primary/10 rounded-lg overflow-hidden">
          <button
            onClick={() => toggleItem(item.key)}
            className="w-full flex items-center justify-between p-3 bg-background hover:bg-primary/5 transition-colors"
          >
            <span className="text-sm font-medium text-foreground">{item.label}</span>
            <span className="text-sm text-primary">
              {expandedItems.includes(item.key) ? '▼' : '▶'}
            </span>
          </button>
          {expandedItems.includes(item.key) && (
            <div className="p-3 bg-card">
              <textarea
                value={(data[item.key] as string) || ''}
                onChange={(e) => onChange(item.key, e.target.value)}
                rows={3}
                className="w-full p-2 bg-background border border-primary/20 rounded focus:outline-none focus:ring-2 focus:ring-primary text-foreground text-sm resize-none"
                placeholder={item.placeholder}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// 경쟁사 비교 컴포넌트
function CompetitorComparison({ data, onChange }: { data: Record<string, unknown>, onChange: (data: Record<string, unknown>) => void }) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">시장 규모 및 수요</label>
        <textarea
          value={(data.market_size as string) || ''}
          onChange={(e) => onChange({ ...data, market_size: e.target.value })}
          rows={3}
          className="w-full p-3 bg-background border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground resize-none"
          placeholder="시장 규모, 성장률, 수요 트렌드..."
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">경쟁 포지셔닝</label>
        <textarea
          value={(data.competitive_position as string) || ''}
          onChange={(e) => onChange({ ...data, competitive_position: e.target.value })}
          rows={3}
          className="w-full p-3 bg-background border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground resize-none"
          placeholder="주요 경쟁사, 시장 점유율, 경쟁 우위..."
        />
      </div>
    </div>
  );
}

// 재무분석 컴포넌트
function FinancialAnalysis({ data, onChange }: { data: Record<string, unknown>, onChange: (data: Record<string, unknown>) => void }) {
  const financialFields = [
    { key: 'per', label: 'PER', type: 'number' },
    { key: 'pbr', label: 'PBR', type: 'number' },
    { key: 'roe', label: 'ROE (%)', type: 'number' },
    { key: 'eps', label: 'EPS', type: 'number' },
    { key: 'bps', label: 'BPS', type: 'number' },
    { key: 'ev_ebitda', label: 'EV/EBITDA', type: 'number' },
    { key: 'revenue', label: '매출액', type: 'number' },
    { key: 'operating_margin', label: '영업이익률 (%)', type: 'number' },
    { key: 'debt_ratio', label: '총부채비율 (%)', type: 'number' },
    { key: 'current_ratio', label: '유동비율 (%)', type: 'number' },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {financialFields.map((field) => (
          <div key={field.key}>
            <label className="block text-sm font-medium mb-1">{field.label}</label>
            <input
              type="number"
              step="0.01"
              value={(data[field.key] as number) || ''}
              onChange={(e) => onChange({ ...data, [field.key]: e.target.value })}
              className="w-full p-2 bg-background border border-primary/20 rounded focus:outline-none focus:ring-2 focus:ring-primary text-foreground text-sm"
              placeholder="0.00"
            />
          </div>
        ))}
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">재무 코멘트</label>
        <textarea
          value={(data.comment as string) || ''}
          onChange={(e) => onChange({ ...data, comment: e.target.value })}
          rows={3}
          className="w-full p-3 bg-background border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground resize-none"
          placeholder="재무 상태에 대한 종합 의견..."
        />
      </div>
    </div>
  );
}

// 기술적분석 - 차트 분석 컴포넌트
function ChartAnalysis({ data, onChange }: { data: Record<string, unknown>, onChange: (data: Record<string, unknown>) => void }) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">볼린저밴드 (주가이동평균 20일)</label>
        <textarea
          value={(data.bollinger_bands as string) || ''}
          onChange={(e) => onChange({ ...data, bollinger_bands: e.target.value })}
          rows={2}
          className="w-full p-3 bg-background border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground resize-none"
          placeholder="상단밴드, 중간선, 하단밴드 위치와 해석..."
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">캔들 패턴 분석</label>
        <textarea
          value={(data.candle_pattern as string) || ''}
          onChange={(e) => onChange({ ...data, candle_pattern: e.target.value })}
          rows={2}
          className="w-full p-3 bg-background border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground resize-none"
          placeholder="주요 캔들 패턴과 시그널..."
        />
      </div>
    </div>
  );
}

// 기술적분석 - 퀀트 분석 컴포넌트
function QuantAnalysis({ data, onChange }: { data: Record<string, unknown>, onChange: (data: Record<string, unknown>) => void }) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">팩터 기반 필터링</label>
        <textarea
          value={(data.factor_filtering as string) || ''}
          onChange={(e) => onChange({ ...data, factor_filtering: e.target.value })}
          rows={2}
          className="w-full p-3 bg-background border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground resize-none"
          placeholder="가치, 모멘텀, 퀄리티 팩터 점수..."
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">과거 수익률 기반 백테스트</label>
        <textarea
          value={(data.backtest as string) || ''}
          onChange={(e) => onChange({ ...data, backtest: e.target.value })}
          rows={2}
          className="w-full p-3 bg-background border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground resize-none"
          placeholder="과거 전략 성과, 샤프 비율 등..."
        />
      </div>
    </div>
  );
}

// 기술적분석 - 심리/수급 분석 컴포넌트
function SentimentAnalysis({ data, onChange }: { data: Record<string, unknown>, onChange: (data: Record<string, unknown>) => void }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">공매도 비율 (%)</label>
          <input
            type="number"
            step="0.01"
            value={(data.short_ratio as number) || ''}
            onChange={(e) => onChange({ ...data, short_ratio: e.target.value })}
            className="w-full p-2 bg-background border border-primary/20 rounded focus:outline-none focus:ring-2 focus:ring-primary text-foreground text-sm"
            placeholder="0.00"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">ETF 매수/매도</label>
          <input
            type="text"
            value={(data.etf_flow as string) || ''}
            onChange={(e) => onChange({ ...data, etf_flow: e.target.value })}
            className="w-full p-2 bg-background border border-primary/20 rounded focus:outline-none focus:ring-2 focus:ring-primary text-foreground text-sm"
            placeholder="순매수/순매도"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">옵션 시장 흐름</label>
        <textarea
          value={(data.options_flow as string) || ''}
          onChange={(e) => onChange({ ...data, options_flow: e.target.value })}
          rows={2}
          className="w-full p-3 bg-background border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground resize-none"
          placeholder="Put/Call 비율, 주요 옵션 거래..."
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">뉴스/이슈 분석 (긍정/부정)</label>
        <textarea
          value={(data.news_sentiment as string) || ''}
          onChange={(e) => onChange({ ...data, news_sentiment: e.target.value })}
          rows={3}
          className="w-full p-3 bg-background border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground resize-none"
          placeholder="최근 이슈, 이벤트 캘린더, 타임라인..."
        />
      </div>
    </div>
  );
}

// 총평 - 투자고려사항 컴포넌트
function InvestmentConsiderations({ data, onChange }: { data: Record<string, unknown>, onChange: (data: Record<string, unknown>) => void }) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">우호 요인</label>
        <textarea
          value={(data.positive_factors as string) || ''}
          onChange={(e) => onChange({ ...data, positive_factors: e.target.value })}
          rows={2}
          className="w-full p-3 bg-background border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground resize-none"
          placeholder="매수를 지지하는 긍정적 요인들..."
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">경계 요인</label>
        <textarea
          value={(data.negative_factors as string) || ''}
          onChange={(e) => onChange({ ...data, negative_factors: e.target.value })}
          rows={2}
          className="w-full p-3 bg-background border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground resize-none"
          placeholder="주의해야 할 부정적 요인들..."
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">시나리오 요약</label>
        <textarea
          value={(data.scenario as string) || ''}
          onChange={(e) => onChange({ ...data, scenario: e.target.value })}
          rows={3}
          className="w-full p-3 bg-background border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground resize-none"
          placeholder="베스트/베이스/워스트 시나리오..."
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">BUY/WAIT 체크리스트</label>
        <textarea
          value={(data.checklist as string) || ''}
          onChange={(e) => onChange({ ...data, checklist: e.target.value })}
          rows={3}
          className="w-full p-3 bg-background border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground resize-none"
          placeholder="매수 전 확인사항 리스트..."
        />
      </div>
    </div>
  );
}

// 총평 - 리스크포인트 컴포넌트
function RiskPoints({ data, onChange }: { data: Record<string, unknown>, onChange: (data: Record<string, unknown>) => void }) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">거시 리스크</label>
        <textarea
          value={(data.macro_risk as string) || ''}
          onChange={(e) => onChange({ ...data, macro_risk: e.target.value })}
          rows={2}
          className="w-full p-3 bg-background border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground resize-none"
          placeholder="경기침체, 금리, 환율, 원자재 가격..."
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">산업 리스크</label>
        <textarea
          value={(data.industry_risk as string) || ''}
          onChange={(e) => onChange({ ...data, industry_risk: e.target.value })}
          rows={2}
          className="w-full p-3 bg-background border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground resize-none"
          placeholder="기술 대체, 공급망 붕괴, 사이클 변동성..."
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">기업 고유 리스크</label>
        <textarea
          value={(data.company_risk as string) || ''}
          onChange={(e) => onChange({ ...data, company_risk: e.target.value })}
          rows={2}
          className="w-full p-3 bg-background border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground resize-none"
          placeholder="이 기업만의 특수한 리스크..."
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">대응 전략</label>
        <textarea
          value={(data.mitigation as string) || ''}
          onChange={(e) => onChange({ ...data, mitigation: e.target.value })}
          rows={2}
          className="w-full p-3 bg-background border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground resize-none"
          placeholder="리스크 대응 및 완화 전략..."
        />
      </div>
    </div>
  );
}

// 총평 - 밸류에이션 컴포넌트
function Valuation({ data, onChange }: { data: Record<string, unknown>, onChange: (data: Record<string, unknown>) => void }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">현재 주가</label>
          <input
            type="number"
            step="0.01"
            value={(data.current_price as number) || ''}
            onChange={(e) => onChange({ ...data, current_price: e.target.value })}
            className="w-full p-2 bg-background border border-primary/20 rounded focus:outline-none focus:ring-2 focus:ring-primary text-foreground text-sm"
            placeholder="0.00"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">목표 주가</label>
          <input
            type="number"
            step="0.01"
            value={(data.target_price as number) || ''}
            onChange={(e) => onChange({ ...data, target_price: e.target.value })}
            className="w-full p-2 bg-background border border-primary/20 rounded focus:outline-none focus:ring-2 focus:ring-primary text-foreground text-sm"
            placeholder="0.00"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">현재 주가의 이유</label>
        <textarea
          value={(data.price_reason as string) || ''}
          onChange={(e) => onChange({ ...data, price_reason: e.target.value })}
          rows={2}
          className="w-full p-3 bg-background border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground resize-none"
          placeholder="현재 주가 수준의 원인 분석..."
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">내재가치보다 싼가?</label>
        <textarea
          value={(data.intrinsic_value as string) || ''}
          onChange={(e) => onChange({ ...data, intrinsic_value: e.target.value })}
          rows={2}
          className="w-full p-3 bg-background border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground resize-none"
          placeholder="내재가치 대비 저평가/고평가 판단..."
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">배당 정책</label>
        <textarea
          value={(data.dividend as string) || ''}
          onChange={(e) => onChange({ ...data, dividend: e.target.value })}
          rows={2}
          className="w-full p-3 bg-background border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground resize-none"
          placeholder="배당 수익률, 배당 성향..."
        />
      </div>
    </div>
  );
}

export default function AssetAnalysisPage() {
  const params = useParams();
  const router = useRouter();
  const assetId = params?.id as string;
  const userId = 1; // 임시 user_id

  const [activeTab, setActiveTab] = useState<TabType>('fundamental');
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 데이터 로드
  useEffect(() => {
    if (assetId) {
      fetchAnalysisData();
    }
  }, [assetId]);

  const fetchAnalysisData = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${API_URL}/api/asset-analysis?asset_id=${assetId}&user_id=${userId}`
      );
      const result = await response.json();

      if (result.status === 'success') {
        setAnalysisData(result.data);
      }
    } catch (error) {
      console.error('분석 데이터 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!analysisData) return;

    try {
      setSaving(true);
      const response = await fetch(`${API_URL}/api/asset-analysis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          asset_id: assetId,
          user_id: userId,
          ...analysisData
        })
      });

      const result = await response.json();

      if (result.status === 'success') {
        alert('✅ 분석 데이터가 저장되었습니다!');
      } else {
        alert('❌ 저장 실패: ' + result.message);
      }
    } catch (error) {
      console.error('저장 오류:', error);
      alert('❌ 저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const updateField = (path: string, value: string) => {
    if (!analysisData) return;

    const keys = path.split('.');
    const newData = JSON.parse(JSON.stringify(analysisData));
    let current: Record<string, unknown> = newData;

    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]] as Record<string, unknown>;
    }

    current[keys[keys.length - 1]] = value;
    setAnalysisData(newData);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-center text-muted-foreground">분석 데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!analysisData) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-center text-red-500">데이터를 불러올 수 없습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <header className="bg-gradient-to-r from-primary/5 to-secondary/5 shadow-sm border-b border-primary/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                자산 개별분석
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                자산 ID: {assetId}
              </p>
            </div>
            <button
              onClick={() => router.push('/portfolio')}
              className="px-4 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-lg transition-colors"
            >
              ← 포트폴리오로 돌아가기
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 탭 네비게이션 */}
        <div className="flex gap-2 mb-6 border-b border-primary/20">
          <button
            onClick={() => setActiveTab('fundamental')}
            className={`px-6 py-3 font-semibold transition-all border-b-2 ${
              activeTab === 'fundamental'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            📈 기본적분석
          </button>
          <button
            onClick={() => setActiveTab('technical')}
            className={`px-6 py-3 font-semibold transition-all border-b-2 ${
              activeTab === 'technical'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            📊 기술적분석
          </button>
          <button
            onClick={() => setActiveTab('summary')}
            className={`px-6 py-3 font-semibold transition-all border-b-2 ${
              activeTab === 'summary'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            ✍️ 총평
          </button>
        </div>

        {/* 탭 컨텐츠 */}
        <div className="bg-card rounded-lg p-6 border border-primary/20">
          {activeTab === 'fundamental' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold mb-4">기본적분석</h2>

              {/* 1. 투자 이유 */}
              <section>
                <h3 className="text-lg font-semibold mb-3">💡 가장 큰 투자이유</h3>
                <textarea
                  value={analysisData.fundamental.investment_reason}
                  onChange={(e) => updateField('fundamental.investment_reason', e.target.value)}
                  rows={4}
                  className="w-full p-3 bg-background border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground resize-none"
                  placeholder="이 자산에 투자하는 핵심 이유를 적어주세요..."
                />
              </section>

              {/* 2. 미래 잠재력 */}
              <section>
                <h3 className="text-lg font-semibold mb-3">🌟 미래 잠재력</h3>
                <textarea
                  value={analysisData.fundamental.potential}
                  onChange={(e) => updateField('fundamental.potential', e.target.value)}
                  rows={4}
                  className="w-full p-3 bg-background border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground resize-none"
                  placeholder="회사가 보유한 잠재력 (연구기술, 내부문화, 직원 등)..."
                />
              </section>

              {/* 3. 기본정보 아코디언 */}
              <section className="border border-primary/20 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-4">📋 기본정보</h3>
                <BasicInfoAccordion
                  data={analysisData.fundamental.basic_info}
                  onChange={(key, value) => {
                    const newBasicInfo = { ...analysisData.fundamental.basic_info, [key]: value };
                    setAnalysisData({
                      ...analysisData,
                      fundamental: { ...analysisData.fundamental, basic_info: newBasicInfo }
                    });
                  }}
                />
              </section>

              {/* 4. 경쟁사 비교 */}
              <section className="border border-primary/20 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-4">⚔️ 경쟁사 비교</h3>
                <CompetitorComparison
                  data={analysisData.fundamental.competitor_comparison}
                  onChange={(data) => {
                    setAnalysisData({
                      ...analysisData,
                      fundamental: { ...analysisData.fundamental, competitor_comparison: data }
                    });
                  }}
                />
              </section>

              {/* 5. 재무분석 */}
              <section className="border border-primary/20 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-4">💰 재무분석</h3>
                <FinancialAnalysis
                  data={analysisData.fundamental.financial_analysis}
                  onChange={(data) => {
                    setAnalysisData({
                      ...analysisData,
                      fundamental: { ...analysisData.fundamental, financial_analysis: data }
                    });
                  }}
                />
              </section>
            </div>
          )}

          {activeTab === 'technical' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold mb-4">기술적분석</h2>

              {/* 1. 차트 분석 */}
              <section className="border border-primary/20 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-4">📈 차트 분석</h3>
                <ChartAnalysis
                  data={analysisData.technical.chart_analysis}
                  onChange={(data) => {
                    setAnalysisData({
                      ...analysisData,
                      technical: { ...analysisData.technical, chart_analysis: data }
                    });
                  }}
                />
              </section>

              {/* 2. 퀀트 분석 */}
              <section className="border border-primary/20 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-4">🔢 퀀트 분석</h3>
                <QuantAnalysis
                  data={analysisData.technical.quant_analysis}
                  onChange={(data) => {
                    setAnalysisData({
                      ...analysisData,
                      technical: { ...analysisData.technical, quant_analysis: data }
                    });
                  }}
                />
              </section>

              {/* 3. 심리/수급 분석 */}
              <section className="border border-primary/20 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-4">💭 심리/수급 분석</h3>
                <SentimentAnalysis
                  data={analysisData.technical.sentiment_analysis}
                  onChange={(data) => {
                    setAnalysisData({
                      ...analysisData,
                      technical: { ...analysisData.technical, sentiment_analysis: data }
                    });
                  }}
                />
              </section>
            </div>
          )}

          {activeTab === 'summary' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold mb-4">총평</h2>

              {/* 1. 투자고려사항 */}
              <section className="border border-primary/20 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-4">🎯 투자고려사항</h3>
                <InvestmentConsiderations
                  data={analysisData.summary.investment_considerations}
                  onChange={(data) => {
                    setAnalysisData({
                      ...analysisData,
                      summary: { ...analysisData.summary, investment_considerations: data }
                    });
                  }}
                />
              </section>

              {/* 2. 리스크포인트 */}
              <section className="border border-primary/20 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-4">⚠️ 리스크포인트</h3>
                <RiskPoints
                  data={analysisData.summary.risk_points}
                  onChange={(data) => {
                    setAnalysisData({
                      ...analysisData,
                      summary: { ...analysisData.summary, risk_points: data }
                    });
                  }}
                />
              </section>

              {/* 3. 밸류에이션 */}
              <section className="border border-primary/20 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-4">💵 밸류에이션</h3>
                <Valuation
                  data={analysisData.summary.valuation}
                  onChange={(data) => {
                    setAnalysisData({
                      ...analysisData,
                      summary: { ...analysisData.summary, valuation: data }
                    });
                  }}
                />
              </section>

              {/* 4. 투자 포인트 */}
              <section>
                <h3 className="text-lg font-semibold mb-3">📝 투자 포인트 (2분 요약)</h3>
                <textarea
                  value={analysisData.summary.investment_point}
                  onChange={(e) => updateField('summary.investment_point', e.target.value)}
                  rows={3}
                  className="w-full p-3 bg-background border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground resize-none"
                  placeholder="2분 만에 설명할 수 있는 핵심 매수 이유..."
                />
              </section>

              {/* 5. 나의 현재 생각 정리 */}
              <section>
                <h3 className="text-lg font-semibold mb-3">💭 나의 현재 생각 정리</h3>
                <textarea
                  value={analysisData.summary.my_thoughts}
                  onChange={(e) => updateField('summary.my_thoughts', e.target.value)}
                  rows={6}
                  className="w-full p-3 bg-background border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground resize-none"
                  placeholder="이 자산에 대한 나의 생각을 자유롭게 정리하세요..."
                />
              </section>
            </div>
          )}
        </div>

        {/* 저장 버튼 */}
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={() => router.push('/portfolio')}
            className="px-6 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-lg transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white font-semibold rounded-lg shadow-lg transition-all disabled:opacity-50"
          >
            {saving ? '저장 중...' : '💾 저장'}
          </button>
        </div>

        {analysisData.updated_at && (
          <p className="mt-4 text-sm text-muted-foreground text-right">
            마지막 수정: {new Date(analysisData.updated_at).toLocaleString('ko-KR')}
          </p>
        )}
      </main>
    </div>
  );
}
