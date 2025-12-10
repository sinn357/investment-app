'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Navigation from '@/components/Navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

type AssetType = '주식' | '암호화폐' | 'ETF';
type ActionType = '매수' | '관망' | '매도';

interface QuantitativeSection {
  valuation: { per?: number; pbr?: number; psr?: number; targetPrice?: number; upside?: number };
  growth: { revenueCagr?: number; epsCagr?: number; outlook: string };
  financial: { debtRatio?: number; roe?: number; fcfMargin?: number };
  scores: { value: number; growth: number; quality: number };
}

interface QualitativeSection {
  businessModel: string;
  moat: 'Wide' | 'Narrow' | 'None';
  management: string;
  risks: { level: 'High' | 'Medium' | 'Low'; item: string }[];
  catalysts: string[];
}

interface DecisionSection {
  action: ActionType;
  conviction: number;
  prices: { buy?: number; sell?: number; stop?: number };
  positionSize: string;
  thesis: string;
  conditions?: string[];
}

interface ReferenceItem {
  type: '기사' | '리포트' | '영상' | '기타';
  title: string;
  url: string;
  note?: string;
}

interface DeepDiveData {
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

interface AssetAnalysis {
  id: string;
  symbol: string;
  name: string;
  type: AssetType;
  analyzedAt: string;
  lastUpdatedAt: string;
  inPortfolio: boolean;
  inWatchlist: boolean;
  myAnalysis: {
    quantitative: QuantitativeSection;
    qualitative: QualitativeSection;
    decision: DecisionSection;
  };
  deepDive: DeepDiveData;
  references: ReferenceItem[];
  tags: string[];
}

const createEmptyDeepDive = (): DeepDiveData => ({
  fundamental: {
    investment_reason: '',
    potential: '',
    basic_info: {},
    competitor_comparison: {},
    financial_analysis: {}
  },
  technical: {
    chart_analysis: {},
    quant_analysis: {},
    sentiment_analysis: {}
  },
  summary: {
    investment_considerations: {},
    risk_points: {},
    valuation: {},
    investment_point: '',
    my_thoughts: ''
  },
  updated_at: null
});

const sampleAnalyses: AssetAnalysis[] = [
  {
    id: 'tsla-001',
    symbol: 'TSLA',
    name: 'Tesla',
    type: '주식',
    analyzedAt: '2025-11-10',
    lastUpdatedAt: '2025-11-22',
    inPortfolio: true,
    inWatchlist: true,
    myAnalysis: {
      quantitative: {
        valuation: { per: 48, pbr: 12, psr: 8.5, targetPrice: 290, upside: 22 },
        growth: { revenueCagr: 28, epsCagr: 32, outlook: '에너지/AI 솔루션 확장으로 성장 지속' },
        financial: { debtRatio: 35, roe: 18, fcfMargin: 9 },
        scores: { value: 2, growth: 5, quality: 4 }
      },
      qualitative: {
        businessModel: '전기차 + 에너지 저장 + 풀스택 자율주행 SaaS 구독',
        moat: 'Wide',
        management: '경영진 비전은 강하지만 실행 리스크 존재',
        risks: [
          { level: 'High', item: '자율주행 규제/리콜 리스크' },
          { level: 'Medium', item: '가격 경쟁 심화로 마진 압박' }
        ],
        catalysts: ['로보택시 상용화', 'FSD 구독 전환 확대', 'Megapack 수주 확대']
      },
      decision: {
        action: '매수',
        conviction: 4,
        prices: { buy: 230, sell: 320, stop: 195 },
        positionSize: '포트폴리오 8% 목표, 3회 분할 매수',
        thesis: 'EV→에너지→자율주행 3단계 성장',
        conditions: ['FSD 매출 20%+ QoQ 유지', 'ASP 인하 시 손익분기 재검증']
      }
    },
    deepDive: createEmptyDeepDive(),
    references: [
      { type: '리포트', title: 'ARK 로보택시 TAM', url: 'https://example.com/ark-tsla', note: '보수적 시나리오 반영' },
      { type: '기사', title: 'IRA 세액공제 연장', url: 'https://example.com/ira-news' }
    ],
    tags: ['AI', 'EV', '에너지저장']
  },
  {
    id: 'btc-001',
    symbol: 'BTC',
    name: 'Bitcoin',
    type: '암호화폐',
    analyzedAt: '2025-11-05',
    lastUpdatedAt: '2025-11-20',
    inPortfolio: true,
    inWatchlist: true,
    myAnalysis: {
      quantitative: {
        valuation: { psr: 0, targetPrice: 92000, upside: 35 },
        growth: { outlook: 'ETF 자금 유입과 공급 축소로 수급 우위' },
        financial: {},
        scores: { value: 3, growth: 4, quality: 3 }
      },
      qualitative: {
        businessModel: '디지털 스토어 오브 밸류, 탈중앙 결제 레이어',
        moat: 'Wide',
        management: '프로토콜 커뮤니티 주도',
        risks: [
          { level: 'High', item: '규제/세제 변경' },
          { level: 'Medium', item: '온체인 수수료 급등에 따른 UX 저하' }
        ],
        catalysts: ['현물 ETF 추가 승인', '반감기 후 해시레이트 안정']
      },
      decision: {
        action: '관망',
        conviction: 3,
        prices: { buy: 70000, sell: 98000, stop: 62000 },
        positionSize: '포트폴리오 5% 유지',
        thesis: 'ETF 자금 + 반감기 공급 축소',
        conditions: ['해시레이트 급락 시 비중 축소']
      }
    },
    deepDive: createEmptyDeepDive(),
    references: [
      { type: '리포트', title: 'Glassnode On-chain Trends', url: 'https://example.com/glassnode' },
      { type: '기사', title: 'ETF 순유입 데이터', url: 'https://example.com/etf-flow' }
    ],
    tags: ['거시', '디지털금', 'ETF']
  }
];

const actionBadgeStyle: Record<ActionType, string> = {
  매수: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
  관망: 'bg-amber-100 text-amber-800 border border-amber-200',
  매도: 'bg-rose-100 text-rose-800 border border-rose-200'
};

const moatOptions: QualitativeSection['moat'][] = ['Wide', 'Narrow', 'None'];

function ConvictionDots({ level }: { level: number }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, idx) => (
        <span key={idx} className={`h-2.5 w-2.5 rounded-full ${idx < level ? 'bg-primary' : 'bg-muted'}`} />
      ))}
    </div>
  );
}

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
  { key: 'ip', label: '지적재산(IP)', placeholder: '특허, 표준화, 진입장벽...' }
];

function BasicInfoAccordion({
  data,
  onChange
}: {
  data: Record<string, unknown>;
  onChange: (key: string, value: string) => void;
}) {
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const toggleItem = (key: string) => {
    setExpandedItems(prev => (prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]));
  };

  return (
    <div className="space-y-2">
      {basicInfoItems.map(item => (
        <div key={item.key} className="border border-primary/10 rounded-lg overflow-hidden">
          <button
            onClick={() => toggleItem(item.key)}
            className="w-full flex items-center justify-between p-3 bg-background hover:bg-primary/5 transition-colors"
          >
            <span className="text-sm font-medium text-foreground">{item.label}</span>
            <span className="text-sm text-primary">{expandedItems.includes(item.key) ? '▼' : '▶'}</span>
          </button>
          {expandedItems.includes(item.key) && (
            <div className="p-3 bg-card">
              <textarea
                value={(data[item.key] as string) || ''}
                onChange={e => onChange(item.key, e.target.value)}
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

function CompetitorComparison({
  data,
  onChange
}: {
  data: Record<string, unknown>;
  onChange: (data: Record<string, unknown>) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">시장 규모 및 수요</label>
        <textarea
          value={(data.market_size as string) || ''}
          onChange={e => onChange({ ...data, market_size: e.target.value })}
          rows={3}
          className="w-full p-3 bg-background border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground resize-none"
          placeholder="시장 규모, 성장률, 수요 트렌드..."
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">경쟁 포지셔닝</label>
        <textarea
          value={(data.competitive_position as string) || ''}
          onChange={e => onChange({ ...data, competitive_position: e.target.value })}
          rows={3}
          className="w-full p-3 bg-background border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground resize-none"
          placeholder="주요 경쟁사, 시장 점유율, 경쟁 우위..."
        />
      </div>
    </div>
  );
}

function FinancialAnalysis({
  data,
  onChange
}: {
  data: Record<string, unknown>;
  onChange: (data: Record<string, unknown>) => void;
}) {
  const fields = [
    { key: 'per', label: 'PER' },
    { key: 'pbr', label: 'PBR' },
    { key: 'roe', label: 'ROE (%)' },
    { key: 'eps', label: 'EPS' },
    { key: 'bps', label: 'BPS' },
    { key: 'ev_ebitda', label: 'EV/EBITDA' },
    { key: 'revenue', label: '매출액' },
    { key: 'operating_margin', label: '영업이익률 (%)' },
    { key: 'debt_ratio', label: '총부채비율 (%)' },
    { key: 'current_ratio', label: '유동비율 (%)' }
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {fields.map(field => (
          <div key={field.key}>
            <label className="block text-sm font-medium mb-1">{field.label}</label>
            <input
              type="number"
              step="0.01"
              value={(data[field.key] as number) || ''}
              onChange={e => onChange({ ...data, [field.key]: e.target.value })}
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
          onChange={e => onChange({ ...data, comment: e.target.value })}
          rows={3}
          className="w-full p-3 bg-background border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground resize-none"
          placeholder="재무 상태에 대한 종합 의견..."
        />
      </div>
    </div>
  );
}

function ChartAnalysis({ data, onChange }: { data: Record<string, unknown>; onChange: (d: Record<string, unknown>) => void }) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">볼린저밴드 (주가이동평균 20일)</label>
        <textarea
          value={(data.bollinger_bands as string) || ''}
          onChange={e => onChange({ ...data, bollinger_bands: e.target.value })}
          rows={2}
          className="w-full p-3 bg-background border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground resize-none"
          placeholder="상단밴드, 중간선, 하단밴드 위치와 해석..."
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">캔들 패턴 분석</label>
        <textarea
          value={(data.candle_pattern as string) || ''}
          onChange={e => onChange({ ...data, candle_pattern: e.target.value })}
          rows={2}
          className="w-full p-3 bg-background border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground resize-none"
          placeholder="주요 캔들 패턴과 시그널..."
        />
      </div>
    </div>
  );
}

function QuantAnalysis({ data, onChange }: { data: Record<string, unknown>; onChange: (d: Record<string, unknown>) => void }) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">팩터 기반 필터링</label>
        <textarea
          value={(data.factor_filtering as string) || ''}
          onChange={e => onChange({ ...data, factor_filtering: e.target.value })}
          rows={2}
          className="w-full p-3 bg-background border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground resize-none"
          placeholder="가치, 모멘텀, 퀄리티 팩터 점수..."
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">과거 수익률 기반 백테스트</label>
        <textarea
          value={(data.backtest as string) || ''}
          onChange={e => onChange({ ...data, backtest: e.target.value })}
          rows={2}
          className="w-full p-3 bg-background border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground resize-none"
          placeholder="과거 전략 성과, 샤프 비율 등..."
        />
      </div>
    </div>
  );
}

function SentimentAnalysis({ data, onChange }: { data: Record<string, unknown>; onChange: (d: Record<string, unknown>) => void }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">공매도 비율 (%)</label>
          <input
            type="number"
            step="0.01"
            value={(data.short_ratio as number) || ''}
            onChange={e => onChange({ ...data, short_ratio: e.target.value })}
            className="w-full p-2 bg-background border border-primary/20 rounded focus:outline-none focus:ring-2 focus:ring-primary text-foreground text-sm"
            placeholder="0.00"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">ETF 매수/매도</label>
          <input
            type="text"
            value={(data.etf_flow as string) || ''}
            onChange={e => onChange({ ...data, etf_flow: e.target.value })}
            className="w-full p-2 bg-background border border-primary/20 rounded focus:outline-none focus:ring-2 focus:ring-primary text-foreground text-sm"
            placeholder="순매수/순매도"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">옵션 시장 흐름</label>
        <textarea
          value={(data.options_flow as string) || ''}
          onChange={e => onChange({ ...data, options_flow: e.target.value })}
          rows={2}
          className="w-full p-3 bg-background border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground resize-none"
          placeholder="Put/Call 비율, 주요 옵션 거래..."
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">뉴스/이슈 분석 (긍정/부정)</label>
        <textarea
          value={(data.news_sentiment as string) || ''}
          onChange={e => onChange({ ...data, news_sentiment: e.target.value })}
          rows={3}
          className="w-full p-3 bg-background border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground resize-none"
          placeholder="최근 이슈, 이벤트 캘린더, 타임라인..."
        />
      </div>
    </div>
  );
}

function InvestmentConsiderations({ data, onChange }: { data: Record<string, unknown>; onChange: (d: Record<string, unknown>) => void }) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">우호 요인</label>
        <textarea
          value={(data.positive_factors as string) || ''}
          onChange={e => onChange({ ...data, positive_factors: e.target.value })}
          rows={2}
          className="w-full p-3 bg-background border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground resize-none"
          placeholder="매수를 지지하는 긍정적 요인들..."
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">경계 요인</label>
        <textarea
          value={(data.negative_factors as string) || ''}
          onChange={e => onChange({ ...data, negative_factors: e.target.value })}
          rows={2}
          className="w-full p-3 bg-background border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground resize-none"
          placeholder="주의해야 할 부정적 요인들..."
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">시나리오 요약</label>
        <textarea
          value={(data.scenario as string) || ''}
          onChange={e => onChange({ ...data, scenario: e.target.value })}
          rows={3}
          className="w-full p-3 bg-background border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground resize-none"
          placeholder="베스트/베이스/워스트 시나리오..."
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">BUY/WAIT 체크리스트</label>
        <textarea
          value={(data.checklist as string) || ''}
          onChange={e => onChange({ ...data, checklist: e.target.value })}
          rows={3}
          className="w-full p-3 bg-background border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground resize-none"
          placeholder="매수 전 확인사항 리스트..."
        />
      </div>
    </div>
  );
}

function RiskPoints({ data, onChange }: { data: Record<string, unknown>; onChange: (d: Record<string, unknown>) => void }) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">거시 리스크</label>
        <textarea
          value={(data.macro_risk as string) || ''}
          onChange={e => onChange({ ...data, macro_risk: e.target.value })}
          rows={2}
          className="w-full p-3 bg-background border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground resize-none"
          placeholder="경기침체, 금리, 환율, 원자재 가격..."
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">산업 리스크</label>
        <textarea
          value={(data.industry_risk as string) || ''}
          onChange={e => onChange({ ...data, industry_risk: e.target.value })}
          rows={2}
          className="w-full p-3 bg-background border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground resize-none"
          placeholder="기술 대체, 공급망 붕괴, 사이클 변동성..."
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">기업 고유 리스크</label>
        <textarea
          value={(data.company_risk as string) || ''}
          onChange={e => onChange({ ...data, company_risk: e.target.value })}
          rows={2}
          className="w-full p-3 bg-background border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground resize-none"
          placeholder="이 기업만의 특수한 리스크..."
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">대응 전략</label>
        <textarea
          value={(data.mitigation as string) || ''}
          onChange={e => onChange({ ...data, mitigation: e.target.value })}
          rows={2}
          className="w-full p-3 bg-background border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground resize-none"
          placeholder="리스크 대응 및 완화 전략..."
        />
      </div>
    </div>
  );
}

function Valuation({ data, onChange }: { data: Record<string, unknown>; onChange: (d: Record<string, unknown>) => void }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">현재 주가</label>
          <input
            type="number"
            step="0.01"
            value={(data.current_price as number) || ''}
            onChange={e => onChange({ ...data, current_price: e.target.value })}
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
            onChange={e => onChange({ ...data, target_price: e.target.value })}
            className="w-full p-2 bg-background border border-primary/20 rounded focus:outline-none focus:ring-2 focus:ring-primary text-foreground text-sm"
            placeholder="0.00"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">현재 주가의 이유</label>
        <textarea
          value={(data.price_reason as string) || ''}
          onChange={e => onChange({ ...data, price_reason: e.target.value })}
          rows={2}
          className="w-full p-3 bg-background border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground resize-none"
          placeholder="현재 주가 수준의 원인 분석..."
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">내재가치보다 싼가?</label>
        <textarea
          value={(data.intrinsic_value as string) || ''}
          onChange={e => onChange({ ...data, intrinsic_value: e.target.value })}
          rows={2}
          className="w-full p-3 bg-background border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground resize-none"
          placeholder="내재가치 대비 저평가/고평가 판단..."
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">배당 정책</label>
        <textarea
          value={(data.dividend as string) || ''}
          onChange={e => onChange({ ...data, dividend: e.target.value })}
          rows={2}
          className="w-full p-3 bg-background border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground resize-none"
          placeholder="배당 수익률, 배당 성향..."
        />
      </div>
    </div>
  );
}

export default function AnalysisPage() {
  const STORAGE_KEY = 'analysis_reports_v1';
  const [analyses, setAnalyses] = useState<AssetAnalysis[]>(sampleAnalyses.map(item => ({ ...item, deepDive: item.deepDive ?? createEmptyDeepDive() })));
  const [selectedId, setSelectedId] = useState<string>(sampleAnalyses[0]?.id ?? '');
  const [activeTab, setActiveTab] = useState<'fundamental' | 'technical' | 'summary' | 'refs'>('fundamental');
  const [draft, setDraft] = useState<AssetAnalysis | null>(null);
  const [saveState, setSaveState] = useState<'idle' | 'saved'>('idle');

  const updateDeepDive = useCallback((updater: (prev: DeepDiveData) => DeepDiveData) => {
    setDraft(prev => (prev ? { ...prev, deepDive: updater(prev.deepDive ?? createEmptyDeepDive()) } : prev));
  }, []);

  const selected = analyses.find(a => a.id === selectedId) ?? analyses[0];
  const detail = draft ?? selected;
  const deepDive = detail?.deepDive ?? createEmptyDeepDive();

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as AssetAnalysis[];
        if (parsed.length > 0) {
          const normalized = parsed.map(item => ({ ...item, deepDive: item.deepDive ?? createEmptyDeepDive() }));
          setAnalyses(normalized);
          setSelectedId(normalized[0].id);
        }
      }
    } catch (error) {
      console.warn('로컬 저장소 로드 실패:', error);
    }
  }, []);

  useEffect(() => {
    if (selected) {
      setDraft(JSON.parse(JSON.stringify(selected)) as AssetAnalysis);
      setSaveState('idle');
    }
  }, [selected]);

  const persistAnalyses = (updated: AssetAnalysis[]) => {
    const normalized = updated.map(item => ({ ...item, deepDive: item.deepDive ?? createEmptyDeepDive() }));
    setAnalyses(normalized);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    } catch (error) {
      console.warn('로컬 저장소 저장 실패:', error);
    }
  };

  const handleSave = () => {
    if (!draft) return;
    const updated = analyses.map(item => (item.id === draft.id ? draft : item));
    persistAnalyses(updated);
    setSelectedId(draft.id);
    setSaveState('saved');
    setTimeout(() => setSaveState('idle'), 1500);
  };

  const handleDelete = () => {
    if (!detail) return;
    const updated = analyses.filter(item => item.id !== detail.id);
    persistAnalyses(updated);
    setDraft(null);
    if (updated.length > 0) {
      setSelectedId(updated[0].id);
    } else {
      setSelectedId('');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <header className="bg-gradient-to-r from-primary/5 to-secondary/5 shadow-sm border-b border-primary/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-foreground">🔎 개별 자산 분석</h1>
          <p className="mt-2 text-muted-foreground">기본적/기술적/총평/참고 자료를 한 곳에서 관리하는 리포트</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <section className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-1 space-y-4">
            {analyses.map(item => (
              <Card
                key={item.id}
                className={`cursor-pointer transition shadow-sm hover:-translate-y-0.5 ${
                  item.id === selected?.id ? 'ring-2 ring-primary/60 border-primary/50' : 'border-border'
                }`}
                onClick={() => {
                  setSelectedId(item.id);
                  setActiveTab('fundamental');
                }}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <div>
                    <p className="text-xs text-muted-foreground">{item.type}</p>
                    <CardTitle className="text-lg">
                      {item.symbol} · {item.name}
                    </CardTitle>
                  </div>
                  <Badge className={actionBadgeStyle[item.myAnalysis.decision.action]}>
                    {item.myAnalysis.decision.action}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>확신도</span>
                    <ConvictionDots level={item.myAnalysis.decision.conviction} />
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="rounded-md border border-dashed border-primary/20 bg-primary/5 p-3">
                      <p className="text-xs text-muted-foreground">목표가</p>
                      <p className="font-semibold">
                        {item.myAnalysis.quantitative.valuation.targetPrice
                          ? `$${item.myAnalysis.quantitative.valuation.targetPrice}`
                          : '-'}
                      </p>
                    </div>
                    <div className="rounded-md border border-dashed border-secondary/30 bg-secondary/5 p-3">
                      <p className="text-xs text-muted-foreground">상승여력</p>
                      <p className="font-semibold">
                        {item.myAnalysis.quantitative.valuation.upside
                          ? `${item.myAnalysis.quantitative.valuation.upside}%`
                          : '-'}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {item.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    업데이트: {item.lastUpdatedAt} · 분석일: {item.analyzedAt}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="lg:col-span-2 space-y-4">
            {detail ? (
              <Card className="border border-primary/20 bg-card">
                <CardHeader className="flex flex-col gap-2">
                  <div className="flex flex-wrap items-center gap-2 justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="w-24">
                          <Label className="text-xs text-muted-foreground">자산 타입</Label>
                          <Select
                            value={detail.type}
                            onValueChange={val => setDraft(prev => (prev ? { ...prev, type: val as AssetType } : prev))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="주식">주식</SelectItem>
                              <SelectItem value="암호화폐">암호화폐</SelectItem>
                              <SelectItem value="ETF">ETF</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-end gap-3">
                          <div>
                            <Label className="text-xs text-muted-foreground">심볼</Label>
                            <Input value={detail.symbol} onChange={e => setDraft(prev => (prev ? { ...prev, symbol: e.target.value } : prev))} className="w-28" />
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">이름</Label>
                            <Input value={detail.name} onChange={e => setDraft(prev => (prev ? { ...prev, name: e.target.value } : prev))} className="min-w-[200px]" />
                          </div>
                        </div>
                      </div>
                      <CardTitle className="text-2xl">
                        {detail.symbol} · {detail.name}
                      </CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={actionBadgeStyle[detail.myAnalysis.decision.action]}>
                        {detail.myAnalysis.decision.action}
                      </Badge>
                      <Badge variant={detail.inPortfolio ? 'default' : 'secondary'}>
                        {detail.inPortfolio ? '포트폴리오' : '워치리스트'}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3 items-center justify-between">
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 text-sm text-muted-foreground">
                        <input
                          type="checkbox"
                          checked={detail.inPortfolio}
                          onChange={e => setDraft(prev => (prev ? { ...prev, inPortfolio: e.target.checked } : prev))}
                        />
                        포트폴리오 보유
                      </label>
                      <label className="flex items-center gap-2 text-sm text-muted-foreground">
                        <input
                          type="checkbox"
                          checked={detail.inWatchlist}
                          onChange={e => setDraft(prev => (prev ? { ...prev, inWatchlist: e.target.checked } : prev))}
                        />
                        워치리스트
                      </label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        placeholder="태그를 콤마로 구분해 입력"
                        value={detail.tags.join(', ')}
                        onChange={e =>
                          setDraft(prev =>
                            prev ? { ...prev, tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean) } : prev
                          )
                        }
                        className="w-64"
                      />
                      <Button variant="ghost" onClick={() => setDraft(selected ?? null)}>
                        되돌리기
                      </Button>
                      <Button variant="destructive" onClick={handleDelete}>
                        삭제
                      </Button>
                      <Button onClick={handleSave} disabled={saveState === 'saved'}>
                        {saveState === 'saved' ? '저장됨' : '저장'}
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="sticky top-0 z-10 bg-card pb-3 border-b border-border flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>기본적분석</span>
                      <span>· 기술적분석</span>
                      <span>· 총평</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setDraft(selected ?? null)}>
                        되돌리기
                      </Button>
                      <Button variant="destructive" size="sm" onClick={handleDelete}>
                        삭제
                      </Button>
                      <Button size="sm" onClick={handleSave} disabled={saveState === 'saved'}>
                        {saveState === 'saved' ? '저장됨' : '저장'}
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button variant={activeTab === 'fundamental' ? 'default' : 'outline'} size="sm" onClick={() => setActiveTab('fundamental')}>
                      기본적분석
                    </Button>
                    <Button variant={activeTab === 'technical' ? 'default' : 'outline'} size="sm" onClick={() => setActiveTab('technical')}>
                      기술적분석
                    </Button>
                    <Button variant={activeTab === 'summary' ? 'default' : 'outline'} size="sm" onClick={() => setActiveTab('summary')}>
                      총평
                    </Button>
                    <Button variant={activeTab === 'refs' ? 'default' : 'outline'} size="sm" onClick={() => setActiveTab('refs')}>
                      참고 자료
                    </Button>
                  </div>

                  {activeTab === 'fundamental' && (
                    <div className="space-y-6">
                      <h2 className="text-2xl font-bold mb-4">기본적분석</h2>
                      <section>
                        <h3 className="text-lg font-semibold mb-3">💡 가장 큰 투자이유</h3>
                        <Textarea
                          value={deepDive.fundamental.investment_reason}
                          onChange={e =>
                            updateDeepDive(prev => ({
                              ...prev,
                              fundamental: { ...prev.fundamental, investment_reason: e.target.value }
                            }))
                          }
                          rows={4}
                          className="w-full"
                          placeholder="이 자산에 투자하는 핵심 이유를 적어주세요..."
                        />
                      </section>
                      <section>
                        <h3 className="text-lg font-semibold mb-3">🌟 미래 잠재력</h3>
                        <Textarea
                          value={deepDive.fundamental.potential}
                          onChange={e =>
                            updateDeepDive(prev => ({
                              ...prev,
                              fundamental: { ...prev.fundamental, potential: e.target.value }
                            }))
                          }
                          rows={4}
                          className="w-full"
                          placeholder="회사가 보유한 잠재력 (연구기술, 내부문화, 직원 등)..."
                        />
                      </section>
                      <section className="border border-primary/20 rounded-lg p-4">
                        <h3 className="text-lg font-semibold mb-4">📋 기본정보</h3>
                        <BasicInfoAccordion
                          data={deepDive.fundamental.basic_info}
                          onChange={(key, value) =>
                            updateDeepDive(prev => ({
                              ...prev,
                              fundamental: { ...prev.fundamental, basic_info: { ...prev.fundamental.basic_info, [key]: value } }
                            }))
                          }
                        />
                      </section>
                      <section className="border border-primary/20 rounded-lg p-4">
                        <h3 className="text-lg font-semibold mb-4">⚔️ 경쟁사 비교</h3>
                        <CompetitorComparison
                          data={deepDive.fundamental.competitor_comparison}
                          onChange={data =>
                            updateDeepDive(prev => ({
                              ...prev,
                              fundamental: { ...prev.fundamental, competitor_comparison: data }
                            }))
                          }
                        />
                      </section>
                      <section className="border border-primary/20 rounded-lg p-4">
                        <h3 className="text-lg font-semibold mb-4">💰 재무분석</h3>
                        <FinancialAnalysis
                          data={deepDive.fundamental.financial_analysis}
                          onChange={data =>
                            updateDeepDive(prev => ({
                              ...prev,
                              fundamental: { ...prev.fundamental, financial_analysis: data }
                            }))
                          }
                        />
                      </section>
                    </div>
                  )}

                  {activeTab === 'technical' && (
                    <div className="space-y-6">
                      <h2 className="text-2xl font-bold mb-4">기술적분석</h2>
                      <section className="border border-primary/20 rounded-lg p-4">
                        <h3 className="text-lg font-semibold mb-4">📈 차트 분석</h3>
                        <ChartAnalysis
                          data={deepDive.technical.chart_analysis}
                          onChange={data =>
                            updateDeepDive(prev => ({
                              ...prev,
                              technical: { ...prev.technical, chart_analysis: data }
                            }))
                          }
                        />
                      </section>
                      <section className="border border-primary/20 rounded-lg p-4">
                        <h3 className="text-lg font-semibold mb-4">🔢 퀀트 분석</h3>
                        <QuantAnalysis
                          data={deepDive.technical.quant_analysis}
                          onChange={data =>
                            updateDeepDive(prev => ({
                              ...prev,
                              technical: { ...prev.technical, quant_analysis: data }
                            }))
                          }
                        />
                      </section>
                      <section className="border border-primary/20 rounded-lg p-4">
                        <h3 className="text-lg font-semibold mb-4">💭 심리/수급 분석</h3>
                        <SentimentAnalysis
                          data={deepDive.technical.sentiment_analysis}
                          onChange={data =>
                            updateDeepDive(prev => ({
                              ...prev,
                              technical: { ...prev.technical, sentiment_analysis: data }
                            }))
                          }
                        />
                      </section>
                    </div>
                  )}

                  {activeTab === 'summary' && (
                    <div className="space-y-6">
                      <h2 className="text-2xl font-bold mb-4">총평</h2>
                      <section className="border border-primary/20 rounded-lg p-4">
                        <h3 className="text-lg font-semibold mb-4">🎯 투자고려사항</h3>
                        <InvestmentConsiderations
                          data={deepDive.summary.investment_considerations}
                          onChange={data =>
                            updateDeepDive(prev => ({
                              ...prev,
                              summary: { ...prev.summary, investment_considerations: data }
                            }))
                          }
                        />
                      </section>
                      <section className="border border-primary/20 rounded-lg p-4">
                        <h3 className="text-lg font-semibold mb-4">⚠️ 리스크포인트</h3>
                        <RiskPoints
                          data={deepDive.summary.risk_points}
                          onChange={data =>
                            updateDeepDive(prev => ({
                              ...prev,
                              summary: { ...prev.summary, risk_points: data }
                            }))
                          }
                        />
                      </section>
                      <section className="border border-primary/20 rounded-lg p-4">
                        <h3 className="text-lg font-semibold mb-4">💵 밸류에이션</h3>
                        <Valuation
                          data={deepDive.summary.valuation}
                          onChange={data =>
                            updateDeepDive(prev => ({
                              ...prev,
                              summary: { ...prev.summary, valuation: data }
                            }))
                          }
                        />
                      </section>
                      <section>
                        <h3 className="text-lg font-semibold mb-3">📝 투자 포인트 (2분 요약)</h3>
                        <Textarea
                          value={deepDive.summary.investment_point}
                          onChange={e =>
                            updateDeepDive(prev => ({
                              ...prev,
                              summary: { ...prev.summary, investment_point: e.target.value }
                            }))
                          }
                          rows={3}
                          className="w-full"
                          placeholder="2분 만에 설명할 수 있는 핵심 매수 이유..."
                        />
                      </section>
                      <section>
                        <h3 className="text-lg font-semibold mb-3">💭 나의 현재 생각 정리</h3>
                        <Textarea
                          value={deepDive.summary.my_thoughts}
                          onChange={e =>
                            updateDeepDive(prev => ({
                              ...prev,
                              summary: { ...prev.summary, my_thoughts: e.target.value }
                            }))
                          }
                          rows={6}
                          className="w-full"
                          placeholder="이 자산에 대한 나의 생각을 자유롭게 정리하세요..."
                        />
                      </section>
                    </div>
                  )}

                  {activeTab === 'refs' && (
                    <div className="space-y-4">
                      <Card className="border-border">
                        <CardHeader>
                          <CardTitle className="text-lg">참고 자료</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                          {detail.references.map((ref, idx) => (
                            <div key={`${ref.title}-${idx}`} className="grid grid-cols-4 gap-2 items-center">
                              <Select
                                value={ref.type}
                                onValueChange={val =>
                                  setDraft(prev =>
                                    prev
                                      ? {
                                          ...prev,
                                          references: prev.references.map((r, i) =>
                                            i === idx ? { ...r, type: val as ReferenceItem['type'] } : r
                                          )
                                        }
                                      : prev
                                  )
                                }
                              >
                                <SelectTrigger className="h-9">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="기사">기사</SelectItem>
                                  <SelectItem value="리포트">리포트</SelectItem>
                                  <SelectItem value="영상">영상</SelectItem>
                                  <SelectItem value="기타">기타</SelectItem>
                                </SelectContent>
                              </Select>
                              <Input
                                placeholder="제목"
                                value={ref.title}
                                onChange={e =>
                                  setDraft(prev =>
                                    prev
                                      ? {
                                          ...prev,
                                          references: prev.references.map((r, i) =>
                                            i === idx ? { ...r, title: e.target.value } : r
                                          )
                                        }
                                      : prev
                                  )
                                }
                              />
                              <Input
                                placeholder="URL"
                                value={ref.url}
                                onChange={e =>
                                  setDraft(prev =>
                                    prev
                                      ? {
                                          ...prev,
                                          references: prev.references.map((r, i) =>
                                            i === idx ? { ...r, url: e.target.value } : r
                                          )
                                        }
                                      : prev
                                  )
                                }
                              />
                              <div className="flex items-center gap-2">
                                <Input
                                  placeholder="메모"
                                  value={ref.note ?? ''}
                                  onChange={e =>
                                    setDraft(prev =>
                                      prev
                                        ? {
                                            ...prev,
                                            references: prev.references.map((r, i) =>
                                              i === idx ? { ...r, note: e.target.value } : r
                                            )
                                          }
                                        : prev
                                    )
                                  }
                                />
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() =>
                                    setDraft(prev =>
                                      prev
                                        ? {
                                            ...prev,
                                            references: prev.references.filter((_, i) => i !== idx)
                                          }
                                        : prev
                                    )
                                  }
                                >
                                  ✕
                                </Button>
                              </div>
                            </div>
                          ))}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setDraft(prev =>
                                prev
                                  ? {
                                      ...prev,
                                      references: [
                                        ...prev.references,
                                        { type: '기사', title: '새 자료', url: '#', note: '' }
                                      ]
                                    }
                                  : prev
                              )
                            }
                          >
                            참고 자료 추가
                          </Button>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-10 text-center text-muted-foreground">
                  필터 조건에 맞는 분석이 없습니다. 새 리포트를 추가해 주세요.
                </CardContent>
              </Card>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
