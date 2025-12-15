'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Navigation from '@/components/Navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
type AssetType = '주식' | '암호화폐' | 'ETF';

// ============================================
// 새로운 5개 탭 구조 인터페이스
// ============================================

interface ReferenceItem {
  type: '기사' | '리포트' | '영상' | '기타';
  title: string;
  url: string;
  note?: string;
}

interface DeepDiveData {
  // ① 투자 가설 (Investment Thesis)
  thesis: {
    main_reason: string;           // 가장 큰 투자이유
    company_selection: string;     // 기업 선택사유 (연구기술, 내부문화, 직원/인재)
    industry_lifecycle: string;    // 산업 생애주기(S-Curve)
    market_size: string;          // 시장 규모 및 수요 (TAM/SAM)
    customer_base: string;        // 고객군
    main_products: string;        // 주요 제품/서비스 (요약)
    one_line_thesis: string;      // 한 줄 투자 가설
    alpha_type: string;           // 노리는 알파의 종류 (성장/리레이팅/사이클/이벤트)
  };

  // ② 검증: 펀더멘털이 맞는가
  validation: {
    // 기본정보 / 사업 구조
    basic: {
      company_overview: string;
      business_type: string;
      history: string;
      business_model: string;
      revenue_structure: string;
      value_chain: string;
      demand_kpi: string;
      customer_concentration: string;
    };
    // 경쟁 / 방어력
    competition: {
      competitor_comparison: string;
      competitive_positioning: string;
      ip_patents: string;
      future_potential: string;
      pricing_power: string;
      capex_rnd: string;
    };
    // 유통 / 채널
    distribution: {
      distribution_method: string;
      channel_structure: string;
      channel_changes: string;
    };
    // 재무 (검증 관점)
    financials: {
      recent_performance: string;
      business_profitability: string;
      working_capital: string;
      income_statement: string;
      cash_flow: string;
      balance_sheet: string;
    };
    hypothesis_breakpoints: string; // 가설이 깨지는 조건 3가지
  };

  // ③ 가격과 기대치 (Price & Expectation)
  pricing: {
    stock_price: number;
    market_cap: string;
    valuation_metrics: {
      per?: number;
      pbr?: number;
      ev_ebitda?: number;
      roe?: number;
      eps?: number;
      bps?: number;
      eps_per_share?: number;
      fcf_per_share?: number;
    };
    market_expectation: string;     // 시장 기대 해석
    intrinsic_value: string;        // 내재가치 관점 평가
    dividend_policy: string;
    scenarios: {
      base: string;
      bull: string;
      bear: string;
    };
    expectation_gap: string;        // 시장 기대 vs 내 가설의 차이
  };

  // ④ 타이밍 & 리스크
  timing: {
    // 기술적
    technical: {
      chart_analysis: string;
      bollinger_bands: string;
      candle_patterns: string;
      expected_price_action: string;
    };
    // 퀀트
    quant: {
      factor_filtering: string;
      backtest: string;
    };
    // 심리/수급
    sentiment: {
      short_interest: string;
      etf_flow: string;
      options_flow: string;
      news_sentiment: string;
    };
    // 외부 변수
    external: {
      macro_variables: string;
      news_analysis: string;
      recent_issues: string;
      event_calendar: string;
    };
    entry_conditions: string;       // 진입 조건
    invalidation_signals: string;   // 무효화 조건 (가설 붕괴 신호)
  };

  // ⑤ 결정 & 관리
  decision: {
    summary: string;                // 총평
    considerations: {
      positive_factors: string;     // 우호 요인
      negative_factors: string;     // 경계 요인 (리스크)
    };
    risks: {
      macro_risk: string;
      industry_risk: string;
      company_risk: string;
    };
    invalidation_condition: string; // 내가 틀렸다고 인정하는 조건
    scenarios: {
      summary: string;
      sensitivity: string;
    };
    checklist: {
      buy: string;
      wait: string;
    };
    mitigation: string;             // 대응 전략
    target_price: number;
    investment_point: string;       // 투자포인트 (2분 요약)
    my_thoughts: string;            // 나의 현재 생각 정리
    action: 'BUY' | 'WAIT' | 'PASS';
    position_size: string;          // 비중
    review_conditions: string;      // 재검토 조건
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
  deepDive: DeepDiveData;
  references: ReferenceItem[];
  tags: string[];
}

const createEmptyDeepDive = (): DeepDiveData => ({
  // ① 투자 가설
  thesis: {
    main_reason: '',
    company_selection: '',
    industry_lifecycle: '',
    market_size: '',
    customer_base: '',
    main_products: '',
    one_line_thesis: '',
    alpha_type: '성장'
  },
  // ② 검증: 펀더멘털
  validation: {
    basic: {
      company_overview: '',
      business_type: '',
      history: '',
      business_model: '',
      revenue_structure: '',
      value_chain: '',
      demand_kpi: '',
      customer_concentration: ''
    },
    competition: {
      competitor_comparison: '',
      competitive_positioning: '',
      ip_patents: '',
      future_potential: '',
      pricing_power: '',
      capex_rnd: ''
    },
    distribution: {
      distribution_method: '',
      channel_structure: '',
      channel_changes: ''
    },
    financials: {
      recent_performance: '',
      business_profitability: '',
      working_capital: '',
      income_statement: '',
      cash_flow: '',
      balance_sheet: ''
    },
    hypothesis_breakpoints: ''
  },
  // ③ 가격과 기대치
  pricing: {
    stock_price: 0,
    market_cap: '',
    valuation_metrics: {},
    market_expectation: '',
    intrinsic_value: '',
    dividend_policy: '',
    scenarios: {
      base: '',
      bull: '',
      bear: ''
    },
    expectation_gap: ''
  },
  // ④ 타이밍 & 리스크
  timing: {
    technical: {
      chart_analysis: '',
      bollinger_bands: '',
      candle_patterns: '',
      expected_price_action: ''
    },
    quant: {
      factor_filtering: '',
      backtest: ''
    },
    sentiment: {
      short_interest: '',
      etf_flow: '',
      options_flow: '',
      news_sentiment: ''
    },
    external: {
      macro_variables: '',
      news_analysis: '',
      recent_issues: '',
      event_calendar: ''
    },
    entry_conditions: '',
    invalidation_signals: ''
  },
  // ⑤ 결정 & 관리
  decision: {
    summary: '',
    considerations: {
      positive_factors: '',
      negative_factors: ''
    },
    risks: {
      macro_risk: '',
      industry_risk: '',
      company_risk: ''
    },
    invalidation_condition: '',
    scenarios: {
      summary: '',
      sensitivity: ''
    },
    checklist: {
      buy: '',
      wait: ''
    },
    mitigation: '',
    target_price: 0,
    investment_point: '',
    my_thoughts: '',
    action: 'WAIT',
    position_size: '',
    review_conditions: ''
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
    deepDive: createEmptyDeepDive(),
    references: [
      { type: '리포트', title: 'Glassnode On-chain Trends', url: 'https://example.com/glassnode' },
      { type: '기사', title: 'ETF 순유입 데이터', url: 'https://example.com/etf-flow' }
    ],
    tags: ['거시', '디지털금', 'ETF']
  }
];

const actionBadgeStyle: Record<'BUY' | 'WAIT' | 'PASS', string> = {
  BUY: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
  WAIT: 'bg-amber-100 text-amber-800 border border-amber-200',
  PASS: 'bg-rose-100 text-rose-800 border border-rose-200'
};

export default function AnalysisPage() {
  const STORAGE_KEY = 'analysis_reports_v1';
  const [analyses, setAnalyses] = useState<AssetAnalysis[]>(sampleAnalyses.map(item => ({ ...item, deepDive: item.deepDive ?? createEmptyDeepDive() })));
  const [selectedId, setSelectedId] = useState<string>(sampleAnalyses[0]?.id ?? '');
  const [activeTab, setActiveTab] = useState<'thesis' | 'validation' | 'pricing' | 'timing' | 'decision'>('thesis');
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
          const normalized = parsed.map(item => {
            const emptyDeepDive = createEmptyDeepDive();
            const deepDive = item.deepDive ?? emptyDeepDive;

            // 깊은 병합: 각 섹션이 존재하는지 확인하고 기본값 제공
            return {
              ...item,
              deepDive: {
                ...emptyDeepDive,
                ...deepDive,
                decision: {
                  ...emptyDeepDive.decision,
                  ...(deepDive.decision ?? {})
                },
                pricing: {
                  ...emptyDeepDive.pricing,
                  ...(deepDive.pricing ?? {})
                }
              }
            };
          });
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
                  setActiveTab('thesis');
                }}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <div>
                    <p className="text-xs text-muted-foreground">{item.type}</p>
                    <CardTitle className="text-lg">
                      {item.symbol} · {item.name}
                    </CardTitle>
                  </div>
                  <Badge className={actionBadgeStyle[item.deepDive?.decision?.action ?? 'WAIT']}>
                    {item.deepDive?.decision?.action ?? 'WAIT'}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="rounded-md border border-dashed border-primary/20 bg-primary/5 p-3">
                      <p className="text-xs text-muted-foreground">목표가</p>
                      <p className="font-semibold">
                        {(item.deepDive?.decision?.target_price ?? 0) > 0
                          ? `$${item.deepDive.decision.target_price}`
                          : '-'}
                      </p>
                    </div>
                    <div className="rounded-md border border-dashed border-secondary/30 bg-secondary/5 p-3">
                      <p className="text-xs text-muted-foreground">현재가</p>
                      <p className="font-semibold">
                        {(item.deepDive?.pricing?.stock_price ?? 0) > 0
                          ? `$${item.deepDive.pricing.stock_price}`
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
                      <Badge className={actionBadgeStyle[detail.deepDive?.decision?.action ?? 'WAIT']}>
                        {detail.deepDive?.decision?.action ?? 'WAIT'}
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
                    <Button variant={activeTab === 'thesis' ? 'default' : 'outline'} size="sm" onClick={() => setActiveTab('thesis')}>
                      ① 투자 가설
                    </Button>
                    <Button variant={activeTab === 'validation' ? 'default' : 'outline'} size="sm" onClick={() => setActiveTab('validation')}>
                      ② 검증: 펀더멘털
                    </Button>
                    <Button variant={activeTab === 'pricing' ? 'default' : 'outline'} size="sm" onClick={() => setActiveTab('pricing')}>
                      ③ 가격과 기대치
                    </Button>
                    <Button variant={activeTab === 'timing' ? 'default' : 'outline'} size="sm" onClick={() => setActiveTab('timing')}>
                      ④ 타이밍 & 리스크
                    </Button>
                    <Button variant={activeTab === 'decision' ? 'default' : 'outline'} size="sm" onClick={() => setActiveTab('decision')}>
                      ⑤ 결정 & 관리
                    </Button>
                  </div>

                  {/* ① 투자 가설 탭 */}
                  {activeTab === 'thesis' && (
                    <div className="space-y-6">
                      <h2 className="text-2xl font-bold mb-4">① 투자 가설 (Investment Thesis)</h2>

                      <Alert className="bg-primary/5 border-primary/20">
                        <AlertDescription>
                          <strong>👉 원칙:</strong> 디테일 금지. 이 기업이 이길 것 같다는 이야기까지만
                        </AlertDescription>
                      </Alert>

                      <section>
                        <Label className="text-lg font-semibold mb-3 block">💡 가장 큰 투자이유</Label>
                        <Textarea
                          value={deepDive.thesis.main_reason}
                          onChange={e =>
                            updateDeepDive(prev => ({
                              ...prev,
                              thesis: { ...prev.thesis, main_reason: e.target.value }
                            }))
                          }
                          rows={10}
                          className="w-full resize-y min-h-[200px]"
                          placeholder="이 자산에 투자하는 핵심 이유를 간결하게 적어주세요..."
                        />
                      </section>

                      <section>
                        <Label className="text-lg font-semibold mb-3 block">🏢 기업 선택사유 (연구기술, 내부문화, 직원/인재)</Label>
                        <Textarea
                          value={deepDive.thesis.company_selection}
                          onChange={e =>
                            updateDeepDive(prev => ({
                              ...prev,
                              thesis: { ...prev.thesis, company_selection: e.target.value }
                            }))
                          }
                          rows={8}
                          className="w-full resize-y min-h-[150px]"
                          placeholder="왜 이 기업인가? 어떤 강점이 있는가?"
                        />
                      </section>

                      <section>
                        <Label className="text-lg font-semibold mb-3 block">📈 산업 생애주기 (S-Curve)</Label>
                        <Textarea
                          value={deepDive.thesis.industry_lifecycle}
                          onChange={e =>
                            updateDeepDive(prev => ({
                              ...prev,
                              thesis: { ...prev.thesis, industry_lifecycle: e.target.value }
                            }))
                          }
                          rows={8}
                          className="w-full resize-y min-h-[150px]"
                          placeholder="산업의 현재 성장 단계는? (도입기/성장기/성숙기/쇠퇴기)"
                        />
                      </section>

                      <section>
                        <Label className="text-lg font-semibold mb-3 block">🌍 시장 규모 및 수요 (TAM/SAM)</Label>
                        <Textarea
                          value={deepDive.thesis.market_size}
                          onChange={e =>
                            updateDeepDive(prev => ({
                              ...prev,
                              thesis: { ...prev.thesis, market_size: e.target.value }
                            }))
                          }
                          rows={8}
                          className="w-full resize-y min-h-[150px]"
                          placeholder="시장 규모와 성장 가능성은?"
                        />
                      </section>

                      <section>
                        <Label className="text-lg font-semibold mb-3 block">👥 고객군</Label>
                        <Textarea
                          value={deepDive.thesis.customer_base}
                          onChange={e =>
                            updateDeepDive(prev => ({
                              ...prev,
                              thesis: { ...prev.thesis, customer_base: e.target.value }
                            }))
                          }
                          rows={6}
                          className="w-full resize-y min-h-[120px]"
                          placeholder="주요 타겟 고객층은?"
                        />
                      </section>

                      <section>
                        <Label className="text-lg font-semibold mb-3 block">🎯 주요 제품/서비스 (요약)</Label>
                        <Textarea
                          value={deepDive.thesis.main_products}
                          onChange={e =>
                            updateDeepDive(prev => ({
                              ...prev,
                              thesis: { ...prev.thesis, main_products: e.target.value }
                            }))
                          }
                          rows={6}
                          className="w-full resize-y min-h-[120px]"
                          placeholder="핵심 제품/서비스를 간략히 요약"
                        />
                      </section>

                      <Card className="bg-secondary/5 border-secondary/30">
                        <CardHeader>
                          <CardTitle className="text-lg">✨ 산출물</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <Label className="text-sm font-medium mb-2 block">한 줄 투자 가설</Label>
                            <Input
                              value={deepDive.thesis.one_line_thesis}
                              onChange={e =>
                                updateDeepDive(prev => ({
                                  ...prev,
                                  thesis: { ...prev.thesis, one_line_thesis: e.target.value }
                                }))
                              }
                              placeholder="이 투자를 한 줄로 요약하면?"
                              className="w-full"
                            />
                          </div>
                          <div>
                            <Label className="text-sm font-medium mb-2 block">노리는 알파의 종류</Label>
                            <Select
                              value={deepDive.thesis.alpha_type}
                              onValueChange={val =>
                                updateDeepDive(prev => ({
                                  ...prev,
                                  thesis: { ...prev.thesis, alpha_type: val }
                                }))
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="성장">성장 (Growth)</SelectItem>
                                <SelectItem value="리레이팅">리레이팅 (Re-rating)</SelectItem>
                                <SelectItem value="사이클">사이클 (Cyclical)</SelectItem>
                                <SelectItem value="이벤트">이벤트 (Event-driven)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {/* ② 검증: 펀더멘털 탭 */}
                  {activeTab === 'validation' && (
                    <div className="space-y-6">
                      <h2 className="text-2xl font-bold mb-4">② 검증: 펀더멘털이 맞는가</h2>

                      <Alert className="bg-primary/5 border-primary/20">
                        <AlertDescription>
                          <strong>👉 원칙:</strong> 투자 가설이 실제 비즈니스 구조와 재무로 뒷받침되는지 검증
                        </AlertDescription>
                      </Alert>

                      {/* 기본정보 / 사업 구조 */}
                      <Card className="border-primary/20">
                        <CardHeader>
                          <CardTitle>📋 기본정보 / 사업 구조</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <Label className="text-sm font-medium mb-2 block">기업 개요</Label>
                            <Textarea
                              value={deepDive.validation.basic.company_overview}
                              onChange={e =>
                                updateDeepDive(prev => ({
                                  ...prev,
                                  validation: {
                                    ...prev.validation,
                                    basic: { ...prev.validation.basic, company_overview: e.target.value }
                                  }
                                }))
                              }
                              rows={6}
                              className="w-full resize-y min-h-[120px]"
                              placeholder="회사의 전반적인 개요..."
                            />
                          </div>
                          <div>
                            <Label className="text-sm font-medium mb-2 block">사업 종류 및 구조</Label>
                            <Textarea
                              value={deepDive.validation.basic.business_type}
                              onChange={e =>
                                updateDeepDive(prev => ({
                                  ...prev,
                                  validation: {
                                    ...prev.validation,
                                    basic: { ...prev.validation.basic, business_type: e.target.value }
                                  }
                                }))
                              }
                              rows={6}
                              className="w-full resize-y min-h-[120px]"
                              placeholder="주요 사업 분야와 조직 구조..."
                            />
                          </div>
                          <div>
                            <Label className="text-sm font-medium mb-2 block">연혁 & 이정표</Label>
                            <Textarea
                              value={deepDive.validation.basic.history}
                              onChange={e =>
                                updateDeepDive(prev => ({
                                  ...prev,
                                  validation: {
                                    ...prev.validation,
                                    basic: { ...prev.validation.basic, history: e.target.value }
                                  }
                                }))
                              }
                              rows={6}
                              className="w-full resize-y min-h-[120px]"
                              placeholder="주요 연혁과 이정표..."
                            />
                          </div>
                          <div>
                            <Label className="text-sm font-medium mb-2 block">비즈니스 모델</Label>
                            <Textarea
                              value={deepDive.validation.basic.business_model}
                              onChange={e =>
                                updateDeepDive(prev => ({
                                  ...prev,
                                  validation: {
                                    ...prev.validation,
                                    basic: { ...prev.validation.basic, business_model: e.target.value }
                                  }
                                }))
                              }
                              rows={6}
                              className="w-full resize-y min-h-[120px]"
                              placeholder="수익 창출 방식..."
                            />
                          </div>
                          <div>
                            <Label className="text-sm font-medium mb-2 block">매출 구조</Label>
                            <Textarea
                              value={deepDive.validation.basic.revenue_structure}
                              onChange={e =>
                                updateDeepDive(prev => ({
                                  ...prev,
                                  validation: {
                                    ...prev.validation,
                                    basic: { ...prev.validation.basic, revenue_structure: e.target.value }
                                  }
                                }))
                              }
                              rows={6}
                              className="w-full resize-y min-h-[120px]"
                              placeholder="제품/서비스별, 지역별 매출 비중..."
                            />
                          </div>
                          <div>
                            <Label className="text-sm font-medium mb-2 block">밸류체인 & 원가구성</Label>
                            <Textarea
                              value={deepDive.validation.basic.value_chain}
                              onChange={e =>
                                updateDeepDive(prev => ({
                                  ...prev,
                                  validation: {
                                    ...prev.validation,
                                    basic: { ...prev.validation.basic, value_chain: e.target.value }
                                  }
                                }))
                              }
                              rows={6}
                              className="w-full resize-y min-h-[120px]"
                              placeholder="가치 사슬과 원가 구조..."
                            />
                          </div>
                          <div>
                            <Label className="text-sm font-medium mb-2 block">수요 KPI & 수요탄력성</Label>
                            <Textarea
                              value={deepDive.validation.basic.demand_kpi}
                              onChange={e =>
                                updateDeepDive(prev => ({
                                  ...prev,
                                  validation: {
                                    ...prev.validation,
                                    basic: { ...prev.validation.basic, demand_kpi: e.target.value }
                                  }
                                }))
                              }
                              rows={6}
                              className="w-full resize-y min-h-[120px]"
                              placeholder="핵심 성과 지표와 수요 탄력성..."
                            />
                          </div>
                          <div>
                            <Label className="text-sm font-medium mb-2 block">고객 집중도</Label>
                            <Textarea
                              value={deepDive.validation.basic.customer_concentration}
                              onChange={e =>
                                updateDeepDive(prev => ({
                                  ...prev,
                                  validation: {
                                    ...prev.validation,
                                    basic: { ...prev.validation.basic, customer_concentration: e.target.value }
                                  }
                                }))
                              }
                              rows={6}
                              className="w-full resize-y min-h-[120px]"
                              placeholder="주요 고객 의존도, 리스크..."
                            />
                          </div>
                        </CardContent>
                      </Card>

                      {/* 경쟁 / 방어력 */}
                      <Card className="border-primary/20">
                        <CardHeader>
                          <CardTitle>⚔️ 경쟁 / 방어력</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <Label className="text-sm font-medium mb-2 block">경쟁사 비교</Label>
                            <Textarea
                              value={deepDive.validation.competition.competitor_comparison}
                              onChange={e =>
                                updateDeepDive(prev => ({
                                  ...prev,
                                  validation: {
                                    ...prev.validation,
                                    competition: { ...prev.validation.competition, competitor_comparison: e.target.value }
                                  }
                                }))
                              }
                              rows={6}
                              className="w-full resize-y min-h-[120px]"
                              placeholder="주요 경쟁사와의 비교..."
                            />
                          </div>
                          <div>
                            <Label className="text-sm font-medium mb-2 block">경쟁 포지셔닝</Label>
                            <Textarea
                              value={deepDive.validation.competition.competitive_positioning}
                              onChange={e =>
                                updateDeepDive(prev => ({
                                  ...prev,
                                  validation: {
                                    ...prev.validation,
                                    competition: { ...prev.validation.competition, competitive_positioning: e.target.value }
                                  }
                                }))
                              }
                              rows={6}
                              className="w-full resize-y min-h-[120px]"
                              placeholder="시장 점유율, 경쟁 우위..."
                            />
                          </div>
                          <div>
                            <Label className="text-sm font-medium mb-2 block">지적재산 (IP) & 특허</Label>
                            <Textarea
                              value={deepDive.validation.competition.ip_patents}
                              onChange={e =>
                                updateDeepDive(prev => ({
                                  ...prev,
                                  validation: {
                                    ...prev.validation,
                                    competition: { ...prev.validation.competition, ip_patents: e.target.value }
                                  }
                                }))
                              }
                              rows={6}
                              className="w-full resize-y min-h-[120px]"
                              placeholder="특허, 표준화, 진입장벽..."
                            />
                          </div>
                          <div>
                            <Label className="text-sm font-medium mb-2 block">미래 잠재력</Label>
                            <Textarea
                              value={deepDive.validation.competition.future_potential}
                              onChange={e =>
                                updateDeepDive(prev => ({
                                  ...prev,
                                  validation: {
                                    ...prev.validation,
                                    competition: { ...prev.validation.competition, future_potential: e.target.value }
                                  }
                                }))
                              }
                              rows={6}
                              className="w-full resize-y min-h-[120px]"
                              placeholder="연구기술, 내부문화, 직원..."
                            />
                          </div>
                          <div>
                            <Label className="text-sm font-medium mb-2 block">가격 결정력 (Pricing Power)</Label>
                            <Textarea
                              value={deepDive.validation.competition.pricing_power}
                              onChange={e =>
                                updateDeepDive(prev => ({
                                  ...prev,
                                  validation: {
                                    ...prev.validation,
                                    competition: { ...prev.validation.competition, pricing_power: e.target.value }
                                  }
                                }))
                              }
                              rows={6}
                              className="w-full resize-y min-h-[120px]"
                              placeholder="가격 인상 능력, 마진 유지 능력..."
                            />
                          </div>
                          <div>
                            <Label className="text-sm font-medium mb-2 block">CAPEX & R&D 투자</Label>
                            <Textarea
                              value={deepDive.validation.competition.capex_rnd}
                              onChange={e =>
                                updateDeepDive(prev => ({
                                  ...prev,
                                  validation: {
                                    ...prev.validation,
                                    competition: { ...prev.validation.competition, capex_rnd: e.target.value }
                                  }
                                }))
                              }
                              rows={6}
                              className="w-full resize-y min-h-[120px]"
                              placeholder="설비투자, 연구개발 지출..."
                            />
                          </div>
                        </CardContent>
                      </Card>

                      {/* 유통 / 채널 */}
                      <Card className="border-primary/20">
                        <CardHeader>
                          <CardTitle>🚚 유통 / 채널</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <Label className="text-sm font-medium mb-2 block">유통 방식</Label>
                            <Textarea
                              value={deepDive.validation.distribution.distribution_method}
                              onChange={e =>
                                updateDeepDive(prev => ({
                                  ...prev,
                                  validation: {
                                    ...prev.validation,
                                    distribution: { ...prev.validation.distribution, distribution_method: e.target.value }
                                  }
                                }))
                              }
                              rows={6}
                              className="w-full resize-y min-h-[120px]"
                              placeholder="직접판매, 대리점, 온라인 등..."
                            />
                          </div>
                          <div>
                            <Label className="text-sm font-medium mb-2 block">채널 구조</Label>
                            <Textarea
                              value={deepDive.validation.distribution.channel_structure}
                              onChange={e =>
                                updateDeepDive(prev => ({
                                  ...prev,
                                  validation: {
                                    ...prev.validation,
                                    distribution: { ...prev.validation.distribution, channel_structure: e.target.value }
                                  }
                                }))
                              }
                              rows={6}
                              className="w-full resize-y min-h-[120px]"
                              placeholder="B2B, B2C, D2C 등..."
                            />
                          </div>
                          <div>
                            <Label className="text-sm font-medium mb-2 block">채널 변화 & 트렌드</Label>
                            <Textarea
                              value={deepDive.validation.distribution.channel_changes}
                              onChange={e =>
                                updateDeepDive(prev => ({
                                  ...prev,
                                  validation: {
                                    ...prev.validation,
                                    distribution: { ...prev.validation.distribution, channel_changes: e.target.value }
                                  }
                                }))
                              }
                              rows={6}
                              className="w-full resize-y min-h-[120px]"
                              placeholder="채널 전환, 디지털 전환 등..."
                            />
                          </div>
                        </CardContent>
                      </Card>

                      {/* 재무 (검증 관점) */}
                      <Card className="border-primary/20">
                        <CardHeader>
                          <CardTitle>💰 재무 (검증 관점)</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <Label className="text-sm font-medium mb-2 block">최근 실적</Label>
                            <Textarea
                              value={deepDive.validation.financials.recent_performance}
                              onChange={e =>
                                updateDeepDive(prev => ({
                                  ...prev,
                                  validation: {
                                    ...prev.validation,
                                    financials: { ...prev.validation.financials, recent_performance: e.target.value }
                                  }
                                }))
                              }
                              rows={6}
                              className="w-full resize-y min-h-[120px]"
                              placeholder="최근 분기/연간 실적 요약..."
                            />
                          </div>
                          <div>
                            <Label className="text-sm font-medium mb-2 block">사업 수익성</Label>
                            <Textarea
                              value={deepDive.validation.financials.business_profitability}
                              onChange={e =>
                                updateDeepDive(prev => ({
                                  ...prev,
                                  validation: {
                                    ...prev.validation,
                                    financials: { ...prev.validation.financials, business_profitability: e.target.value }
                                  }
                                }))
                              }
                              rows={6}
                              className="w-full resize-y min-h-[120px]"
                              placeholder="영업이익률, 순이익률, ROE, ROA..."
                            />
                          </div>
                          <div>
                            <Label className="text-sm font-medium mb-2 block">운전자본</Label>
                            <Textarea
                              value={deepDive.validation.financials.working_capital}
                              onChange={e =>
                                updateDeepDive(prev => ({
                                  ...prev,
                                  validation: {
                                    ...prev.validation,
                                    financials: { ...prev.validation.financials, working_capital: e.target.value }
                                  }
                                }))
                              }
                              rows={6}
                              className="w-full resize-y min-h-[120px]"
                              placeholder="현금 전환 주기, 재고회전율..."
                            />
                          </div>
                          <div>
                            <Label className="text-sm font-medium mb-2 block">손익계산서 (P&L)</Label>
                            <Textarea
                              value={deepDive.validation.financials.income_statement}
                              onChange={e =>
                                updateDeepDive(prev => ({
                                  ...prev,
                                  validation: {
                                    ...prev.validation,
                                    financials: { ...prev.validation.financials, income_statement: e.target.value }
                                  }
                                }))
                              }
                              rows={6}
                              className="w-full resize-y min-h-[120px]"
                              placeholder="매출, 영업이익, 순이익 추이..."
                            />
                          </div>
                          <div>
                            <Label className="text-sm font-medium mb-2 block">현금흐름 (Cash Flow)</Label>
                            <Textarea
                              value={deepDive.validation.financials.cash_flow}
                              onChange={e =>
                                updateDeepDive(prev => ({
                                  ...prev,
                                  validation: {
                                    ...prev.validation,
                                    financials: { ...prev.validation.financials, cash_flow: e.target.value }
                                  }
                                }))
                              }
                              rows={6}
                              className="w-full resize-y min-h-[120px]"
                              placeholder="영업CF, 투자CF, 재무CF..."
                            />
                          </div>
                          <div>
                            <Label className="text-sm font-medium mb-2 block">재무상태표 (Balance Sheet)</Label>
                            <Textarea
                              value={deepDive.validation.financials.balance_sheet}
                              onChange={e =>
                                updateDeepDive(prev => ({
                                  ...prev,
                                  validation: {
                                    ...prev.validation,
                                    financials: { ...prev.validation.financials, balance_sheet: e.target.value }
                                  }
                                }))
                              }
                              rows={6}
                              className="w-full resize-y min-h-[120px]"
                              placeholder="자산, 부채, 자본 구조..."
                            />
                          </div>
                        </CardContent>
                      </Card>

                      {/* 가설이 깨지는 조건 */}
                      <section>
                        <Label className="text-lg font-semibold mb-3 block text-rose-600">⚠️ 가설이 깨지는 조건 3가지</Label>
                        <Textarea
                          value={deepDive.validation.hypothesis_breakpoints}
                          onChange={e =>
                            updateDeepDive(prev => ({
                              ...prev,
                              validation: {
                                ...prev.validation,
                                hypothesis_breakpoints: e.target.value
                              }
                            }))
                          }
                          rows={8}
                          className="w-full resize-y min-h-[150px] border-rose-300 focus:ring-rose-500"
                          placeholder="이 투자 가설이 틀렸다고 판단할 수 있는 구체적인 조건 3가지..."
                        />
                      </section>
                    </div>
                  )}

                  {/* ③ 가격과 기대치 탭 */}
                  {activeTab === 'pricing' && (
                    <div className="space-y-6">
                      <h2 className="text-2xl font-bold mb-4">③ 가격과 기대치 (Price & Expectation)</h2>

                      <Alert className="bg-primary/5 border-primary/20">
                        <AlertDescription>
                          <strong>👉 원칙:</strong> 시장은 이미 무엇을 믿고 있나? 내 가설과의 차이는?
                        </AlertDescription>
                      </Alert>

                      {/* 기본 가격 정보 */}
                      <Card className="border-primary/20">
                        <CardHeader>
                          <CardTitle>📊 기본 가격 정보</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label className="text-sm font-medium mb-2 block">현재 주가</Label>
                              <Input
                                type="number"
                                step="0.01"
                                value={deepDive.pricing.stock_price || ''}
                                onChange={e =>
                                  updateDeepDive(prev => ({
                                    ...prev,
                                    pricing: { ...prev.pricing, stock_price: parseFloat(e.target.value) || 0 }
                                  }))
                                }
                                placeholder="0.00"
                              />
                            </div>
                            <div>
                              <Label className="text-sm font-medium mb-2 block">시가총액</Label>
                              <Input
                                value={deepDive.pricing.market_cap}
                                onChange={e =>
                                  updateDeepDive(prev => ({
                                    ...prev,
                                    pricing: { ...prev.pricing, market_cap: e.target.value }
                                  }))
                                }
                                placeholder="예: $100B"
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* 밸류에이션 지표 */}
                      <Card className="border-primary/20">
                        <CardHeader>
                          <CardTitle>📈 밸류에이션 지표</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label className="text-sm font-medium mb-2 block">PER</Label>
                              <Input
                                type="number"
                                step="0.01"
                                value={deepDive.pricing.valuation_metrics.per || ''}
                                onChange={e =>
                                  updateDeepDive(prev => ({
                                    ...prev,
                                    pricing: {
                                      ...prev.pricing,
                                      valuation_metrics: { ...prev.pricing.valuation_metrics, per: parseFloat(e.target.value) || undefined }
                                    }
                                  }))
                                }
                                placeholder="0.00"
                              />
                            </div>
                            <div>
                              <Label className="text-sm font-medium mb-2 block">PBR</Label>
                              <Input
                                type="number"
                                step="0.01"
                                value={deepDive.pricing.valuation_metrics.pbr || ''}
                                onChange={e =>
                                  updateDeepDive(prev => ({
                                    ...prev,
                                    pricing: {
                                      ...prev.pricing,
                                      valuation_metrics: { ...prev.pricing.valuation_metrics, pbr: parseFloat(e.target.value) || undefined }
                                    }
                                  }))
                                }
                                placeholder="0.00"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label className="text-sm font-medium mb-2 block">EV/EBITDA</Label>
                              <Input
                                type="number"
                                step="0.01"
                                value={deepDive.pricing.valuation_metrics.ev_ebitda || ''}
                                onChange={e =>
                                  updateDeepDive(prev => ({
                                    ...prev,
                                    pricing: {
                                      ...prev.pricing,
                                      valuation_metrics: { ...prev.pricing.valuation_metrics, ev_ebitda: parseFloat(e.target.value) || undefined }
                                    }
                                  }))
                                }
                                placeholder="0.00"
                              />
                            </div>
                            <div>
                              <Label className="text-sm font-medium mb-2 block">ROE</Label>
                              <Input
                                type="number"
                                step="0.01"
                                value={deepDive.pricing.valuation_metrics.roe || ''}
                                onChange={e =>
                                  updateDeepDive(prev => ({
                                    ...prev,
                                    pricing: {
                                      ...prev.pricing,
                                      valuation_metrics: { ...prev.pricing.valuation_metrics, roe: parseFloat(e.target.value) || undefined }
                                    }
                                  }))
                                }
                                placeholder="0.00"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label className="text-sm font-medium mb-2 block">EPS</Label>
                              <Input
                                type="number"
                                step="0.01"
                                value={deepDive.pricing.valuation_metrics.eps || ''}
                                onChange={e =>
                                  updateDeepDive(prev => ({
                                    ...prev,
                                    pricing: {
                                      ...prev.pricing,
                                      valuation_metrics: { ...prev.pricing.valuation_metrics, eps: parseFloat(e.target.value) || undefined }
                                    }
                                  }))
                                }
                                placeholder="0.00"
                              />
                            </div>
                            <div>
                              <Label className="text-sm font-medium mb-2 block">BPS</Label>
                              <Input
                                type="number"
                                step="0.01"
                                value={deepDive.pricing.valuation_metrics.bps || ''}
                                onChange={e =>
                                  updateDeepDive(prev => ({
                                    ...prev,
                                    pricing: {
                                      ...prev.pricing,
                                      valuation_metrics: { ...prev.pricing.valuation_metrics, bps: parseFloat(e.target.value) || undefined }
                                    }
                                  }))
                                }
                                placeholder="0.00"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label className="text-sm font-medium mb-2 block">주당 EPS</Label>
                              <Input
                                type="number"
                                step="0.01"
                                value={deepDive.pricing.valuation_metrics.eps_per_share || ''}
                                onChange={e =>
                                  updateDeepDive(prev => ({
                                    ...prev,
                                    pricing: {
                                      ...prev.pricing,
                                      valuation_metrics: { ...prev.pricing.valuation_metrics, eps_per_share: parseFloat(e.target.value) || undefined }
                                    }
                                  }))
                                }
                                placeholder="0.00"
                              />
                            </div>
                            <div>
                              <Label className="text-sm font-medium mb-2 block">주당 FCF</Label>
                              <Input
                                type="number"
                                step="0.01"
                                value={deepDive.pricing.valuation_metrics.fcf_per_share || ''}
                                onChange={e =>
                                  updateDeepDive(prev => ({
                                    ...prev,
                                    pricing: {
                                      ...prev.pricing,
                                      valuation_metrics: { ...prev.pricing.valuation_metrics, fcf_per_share: parseFloat(e.target.value) || undefined }
                                    }
                                  }))
                                }
                                placeholder="0.00"
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* 시장 해석 */}
                      <Card className="border-primary/20">
                        <CardHeader>
                          <CardTitle>🔍 시장 해석</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <Label className="text-sm font-medium mb-2 block">시장 기대 해석</Label>
                            <Textarea
                              value={deepDive.pricing.market_expectation}
                              onChange={e =>
                                updateDeepDive(prev => ({
                                  ...prev,
                                  pricing: { ...prev.pricing, market_expectation: e.target.value }
                                }))
                              }
                              rows={6}
                              className="w-full resize-y min-h-[120px]"
                              placeholder="시장은 이 자산에 대해 무엇을 믿고 있나? 밸류에이션에 반영된 기대는?"
                            />
                          </div>
                          <div>
                            <Label className="text-sm font-medium mb-2 block">내재가치 관점 평가</Label>
                            <Textarea
                              value={deepDive.pricing.intrinsic_value}
                              onChange={e =>
                                updateDeepDive(prev => ({
                                  ...prev,
                                  pricing: { ...prev.pricing, intrinsic_value: e.target.value }
                                }))
                              }
                              rows={6}
                              className="w-full resize-y min-h-[120px]"
                              placeholder="내재가치 기준으로 볼 때 현재 가격은? DCF, 자산가치, 동종업계 비교 등..."
                            />
                          </div>
                          <div>
                            <Label className="text-sm font-medium mb-2 block">배당 정책</Label>
                            <Textarea
                              value={deepDive.pricing.dividend_policy}
                              onChange={e =>
                                updateDeepDive(prev => ({
                                  ...prev,
                                  pricing: { ...prev.pricing, dividend_policy: e.target.value }
                                }))
                              }
                              rows={4}
                              className="w-full resize-y min-h-[80px]"
                              placeholder="배당 정책, 배당 성향, 배당 성장률..."
                            />
                          </div>
                        </CardContent>
                      </Card>

                      {/* 시나리오 분석 */}
                      <Card className="border-primary/20">
                        <CardHeader>
                          <CardTitle>📊 시나리오 분석</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <Label className="text-sm font-medium mb-2 block">베이스 시나리오 (Base Case)</Label>
                            <Textarea
                              value={deepDive.pricing.scenarios.base}
                              onChange={e =>
                                updateDeepDive(prev => ({
                                  ...prev,
                                  pricing: {
                                    ...prev.pricing,
                                    scenarios: { ...prev.pricing.scenarios, base: e.target.value }
                                  }
                                }))
                              }
                              rows={6}
                              className="w-full resize-y min-h-[120px]"
                              placeholder="가장 가능성 높은 시나리오 + 목표가..."
                            />
                          </div>
                          <div>
                            <Label className="text-sm font-medium mb-2 block">강세 시나리오 (Bull Case)</Label>
                            <Textarea
                              value={deepDive.pricing.scenarios.bull}
                              onChange={e =>
                                updateDeepDive(prev => ({
                                  ...prev,
                                  pricing: {
                                    ...prev.pricing,
                                    scenarios: { ...prev.pricing.scenarios, bull: e.target.value }
                                  }
                                }))
                              }
                              rows={6}
                              className="w-full resize-y min-h-[120px]"
                              placeholder="모든 것이 잘 풀리는 경우 + 최고 목표가..."
                            />
                          </div>
                          <div>
                            <Label className="text-sm font-medium mb-2 block">약세 시나리오 (Bear Case)</Label>
                            <Textarea
                              value={deepDive.pricing.scenarios.bear}
                              onChange={e =>
                                updateDeepDive(prev => ({
                                  ...prev,
                                  pricing: {
                                    ...prev.pricing,
                                    scenarios: { ...prev.pricing.scenarios, bear: e.target.value }
                                  }
                                }))
                              }
                              rows={6}
                              className="w-full resize-y min-h-[120px]"
                              placeholder="최악의 경우 + 최저 목표가..."
                            />
                          </div>
                        </CardContent>
                      </Card>

                      {/* 시장 기대 vs 내 가설의 차이 */}
                      <section>
                        <Label className="text-lg font-semibold mb-3 block text-primary">⚡ 시장 기대 vs 내 가설의 차이</Label>
                        <Textarea
                          value={deepDive.pricing.expectation_gap}
                          onChange={e =>
                            updateDeepDive(prev => ({
                              ...prev,
                              pricing: { ...prev.pricing, expectation_gap: e.target.value }
                            }))
                          }
                          rows={8}
                          className="w-full resize-y min-h-[150px] border-primary/30 focus:ring-primary"
                          placeholder="시장은 무엇을 놓치고 있나? 나의 가설이 맞다면 어떤 가격 변화가 올 것인가?"
                        />
                      </section>
                    </div>
                  )}

                  {/* ④ 타이밍 & 리스크 탭 */}
                  {activeTab === 'timing' && (
                    <div className="space-y-6">
                      <h2 className="text-2xl font-bold mb-4">④ 타이밍 & 리스크 (Timing & Risk)</h2>

                      <Alert className="bg-primary/5 border-primary/20">
                        <AlertDescription>
                          <strong>👉 원칙:</strong> 언제 들어가며, 어떻게 실패를 관리할 것인가?
                        </AlertDescription>
                      </Alert>

                      {/* 기술적 분석 */}
                      <Card className="border-primary/20">
                        <CardHeader>
                          <CardTitle>📈 기술적 분석</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <Label className="text-sm font-medium mb-2 block">차트 분석</Label>
                            <Textarea
                              value={deepDive.timing.technical.chart_analysis}
                              onChange={e =>
                                updateDeepDive(prev => ({
                                  ...prev,
                                  timing: {
                                    ...prev.timing,
                                    technical: { ...prev.timing.technical, chart_analysis: e.target.value }
                                  }
                                }))
                              }
                              rows={6}
                              className="w-full resize-y min-h-[120px]"
                              placeholder="추세선, 지지/저항선, 패턴 분석..."
                            />
                          </div>
                          <div>
                            <Label className="text-sm font-medium mb-2 block">볼린저밴드</Label>
                            <Textarea
                              value={deepDive.timing.technical.bollinger_bands}
                              onChange={e =>
                                updateDeepDive(prev => ({
                                  ...prev,
                                  timing: {
                                    ...prev.timing,
                                    technical: { ...prev.timing.technical, bollinger_bands: e.target.value }
                                  }
                                }))
                              }
                              rows={4}
                              className="w-full resize-y min-h-[80px]"
                              placeholder="밴드 위치, 확장/수축 상태..."
                            />
                          </div>
                          <div>
                            <Label className="text-sm font-medium mb-2 block">캔들 패턴</Label>
                            <Textarea
                              value={deepDive.timing.technical.candle_patterns}
                              onChange={e =>
                                updateDeepDive(prev => ({
                                  ...prev,
                                  timing: {
                                    ...prev.timing,
                                    technical: { ...prev.timing.technical, candle_patterns: e.target.value }
                                  }
                                }))
                              }
                              rows={4}
                              className="w-full resize-y min-h-[80px]"
                              placeholder="반전/지속 패턴, 도지, 망치형..."
                            />
                          </div>
                          <div>
                            <Label className="text-sm font-medium mb-2 block">예상 가격 움직임</Label>
                            <Textarea
                              value={deepDive.timing.technical.expected_price_action}
                              onChange={e =>
                                updateDeepDive(prev => ({
                                  ...prev,
                                  timing: {
                                    ...prev.timing,
                                    technical: { ...prev.timing.technical, expected_price_action: e.target.value }
                                  }
                                }))
                              }
                              rows={4}
                              className="w-full resize-y min-h-[80px]"
                              placeholder="단기/중기 전망, 목표가 구간..."
                            />
                          </div>
                        </CardContent>
                      </Card>

                      {/* 퀀트 분석 */}
                      <Card className="border-primary/20">
                        <CardHeader>
                          <CardTitle>🔢 퀀트 분석</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <Label className="text-sm font-medium mb-2 block">팩터 필터링</Label>
                            <Textarea
                              value={deepDive.timing.quant.factor_filtering}
                              onChange={e =>
                                updateDeepDive(prev => ({
                                  ...prev,
                                  timing: {
                                    ...prev.timing,
                                    quant: { ...prev.timing.quant, factor_filtering: e.target.value }
                                  }
                                }))
                              }
                              rows={6}
                              className="w-full resize-y min-h-[120px]"
                              placeholder="모멘텀, 밸류, 퀄리티 팩터 점수..."
                            />
                          </div>
                          <div>
                            <Label className="text-sm font-medium mb-2 block">백테스트</Label>
                            <Textarea
                              value={deepDive.timing.quant.backtest}
                              onChange={e =>
                                updateDeepDive(prev => ({
                                  ...prev,
                                  timing: {
                                    ...prev.timing,
                                    quant: { ...prev.timing.quant, backtest: e.target.value }
                                  }
                                }))
                              }
                              rows={6}
                              className="w-full resize-y min-h-[120px]"
                              placeholder="전략 백테스트 결과, 샤프비율..."
                            />
                          </div>
                        </CardContent>
                      </Card>

                      {/* 심리/수급 분석 */}
                      <Card className="border-primary/20">
                        <CardHeader>
                          <CardTitle>💭 심리/수급 분석</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <Label className="text-sm font-medium mb-2 block">공매도 비율</Label>
                            <Textarea
                              value={deepDive.timing.sentiment.short_interest}
                              onChange={e =>
                                updateDeepDive(prev => ({
                                  ...prev,
                                  timing: {
                                    ...prev.timing,
                                    sentiment: { ...prev.timing.sentiment, short_interest: e.target.value }
                                  }
                                }))
                              }
                              rows={4}
                              className="w-full resize-y min-h-[80px]"
                              placeholder="공매도 잔고, 변화 추이..."
                            />
                          </div>
                          <div>
                            <Label className="text-sm font-medium mb-2 block">ETF 자금 흐름</Label>
                            <Textarea
                              value={deepDive.timing.sentiment.etf_flow}
                              onChange={e =>
                                updateDeepDive(prev => ({
                                  ...prev,
                                  timing: {
                                    ...prev.timing,
                                    sentiment: { ...prev.timing.sentiment, etf_flow: e.target.value }
                                  }
                                }))
                              }
                              rows={4}
                              className="w-full resize-y min-h-[80px]"
                              placeholder="ETF 자금 유입/유출 현황..."
                            />
                          </div>
                          <div>
                            <Label className="text-sm font-medium mb-2 block">옵션 흐름</Label>
                            <Textarea
                              value={deepDive.timing.sentiment.options_flow}
                              onChange={e =>
                                updateDeepDive(prev => ({
                                  ...prev,
                                  timing: {
                                    ...prev.timing,
                                    sentiment: { ...prev.timing.sentiment, options_flow: e.target.value }
                                  }
                                }))
                              }
                              rows={4}
                              className="w-full resize-y min-h-[80px]"
                              placeholder="Put/Call 비율, 옵션 포지션..."
                            />
                          </div>
                          <div>
                            <Label className="text-sm font-medium mb-2 block">뉴스 센티먼트</Label>
                            <Textarea
                              value={deepDive.timing.sentiment.news_sentiment}
                              onChange={e =>
                                updateDeepDive(prev => ({
                                  ...prev,
                                  timing: {
                                    ...prev.timing,
                                    sentiment: { ...prev.timing.sentiment, news_sentiment: e.target.value }
                                  }
                                }))
                              }
                              rows={4}
                              className="w-full resize-y min-h-[80px]"
                              placeholder="뉴스 톤, 소셜미디어 분위기..."
                            />
                          </div>
                        </CardContent>
                      </Card>

                      {/* 외부 변수 */}
                      <Card className="border-primary/20">
                        <CardHeader>
                          <CardTitle>🌍 외부 변수</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <Label className="text-sm font-medium mb-2 block">거시 변수</Label>
                            <Textarea
                              value={deepDive.timing.external.macro_variables}
                              onChange={e =>
                                updateDeepDive(prev => ({
                                  ...prev,
                                  timing: {
                                    ...prev.timing,
                                    external: { ...prev.timing.external, macro_variables: e.target.value }
                                  }
                                }))
                              }
                              rows={6}
                              className="w-full resize-y min-h-[120px]"
                              placeholder="금리, 환율, 원자재 가격 등 매크로 환경..."
                            />
                          </div>
                          <div>
                            <Label className="text-sm font-medium mb-2 block">뉴스 분석</Label>
                            <Textarea
                              value={deepDive.timing.external.news_analysis}
                              onChange={e =>
                                updateDeepDive(prev => ({
                                  ...prev,
                                  timing: {
                                    ...prev.timing,
                                    external: { ...prev.timing.external, news_analysis: e.target.value }
                                  }
                                }))
                              }
                              rows={6}
                              className="w-full resize-y min-h-[120px]"
                              placeholder="최근 주요 뉴스, 기사 해석..."
                            />
                          </div>
                          <div>
                            <Label className="text-sm font-medium mb-2 block">최근 이슈</Label>
                            <Textarea
                              value={deepDive.timing.external.recent_issues}
                              onChange={e =>
                                updateDeepDive(prev => ({
                                  ...prev,
                                  timing: {
                                    ...prev.timing,
                                    external: { ...prev.timing.external, recent_issues: e.target.value }
                                  }
                                }))
                              }
                              rows={6}
                              className="w-full resize-y min-h-[120px]"
                              placeholder="산업/기업 주요 이슈..."
                            />
                          </div>
                          <div>
                            <Label className="text-sm font-medium mb-2 block">이벤트 캘린더</Label>
                            <Textarea
                              value={deepDive.timing.external.event_calendar}
                              onChange={e =>
                                updateDeepDive(prev => ({
                                  ...prev,
                                  timing: {
                                    ...prev.timing,
                                    external: { ...prev.timing.external, event_calendar: e.target.value }
                                  }
                                }))
                              }
                              rows={6}
                              className="w-full resize-y min-h-[120px]"
                              placeholder="실적 발표, FOMC, 배당 기준일 등..."
                            />
                          </div>
                        </CardContent>
                      </Card>

                      {/* 진입 조건 */}
                      <section>
                        <Label className="text-lg font-semibold mb-3 block text-emerald-600">✅ 진입 조건</Label>
                        <Textarea
                          value={deepDive.timing.entry_conditions}
                          onChange={e =>
                            updateDeepDive(prev => ({
                              ...prev,
                              timing: { ...prev.timing, entry_conditions: e.target.value }
                            }))
                          }
                          rows={8}
                          className="w-full resize-y min-h-[150px] border-emerald-300 focus:ring-emerald-500"
                          placeholder="어떤 신호가 나오면 매수할 것인가? 구체적인 진입 조건 3가지..."
                        />
                      </section>

                      {/* 무효화 신호 */}
                      <section>
                        <Label className="text-lg font-semibold mb-3 block text-rose-600">⚠️ 무효화 신호 (가설 붕괴 신호)</Label>
                        <Textarea
                          value={deepDive.timing.invalidation_signals}
                          onChange={e =>
                            updateDeepDive(prev => ({
                              ...prev,
                              timing: { ...prev.timing, invalidation_signals: e.target.value }
                            }))
                          }
                          rows={8}
                          className="w-full resize-y min-h-[150px] border-rose-300 focus:ring-rose-500"
                          placeholder="어떤 신호가 나오면 즉시 청산할 것인가? 손절 조건, 가설 붕괴 신호..."
                        />
                      </section>
                    </div>
                  )}

                  {/* ⑤ 결정 & 관리 탭 */}
                  {activeTab === 'decision' && (
                    <div className="space-y-6">
                      <h2 className="text-2xl font-bold mb-4">⑤ 결정 & 관리 (Decision & Management)</h2>

                      <Alert className="bg-primary/5 border-primary/20">
                        <AlertDescription>
                          <strong>👉 원칙:</strong> 그래서 나는 무엇을 할 것인가?
                        </AlertDescription>
                      </Alert>

                      {/* 총평 */}
                      <section>
                        <Label className="text-lg font-semibold mb-3 block">📝 총평</Label>
                        <Textarea
                          value={deepDive.decision.summary}
                          onChange={e =>
                            updateDeepDive(prev => ({
                              ...prev,
                              decision: { ...prev.decision, summary: e.target.value }
                            }))
                          }
                          rows={8}
                          className="w-full resize-y min-h-[150px]"
                          placeholder="이 투자에 대한 종합적인 평가..."
                        />
                      </section>

                      {/* 투자 고려사항 */}
                      <Card className="border-primary/20">
                        <CardHeader>
                          <CardTitle>⚖️ 투자 고려사항</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <Label className="text-sm font-medium mb-2 block">우호 요인</Label>
                            <Textarea
                              value={deepDive.decision.considerations.positive_factors}
                              onChange={e =>
                                updateDeepDive(prev => ({
                                  ...prev,
                                  decision: {
                                    ...prev.decision,
                                    considerations: { ...prev.decision.considerations, positive_factors: e.target.value }
                                  }
                                }))
                              }
                              rows={6}
                              className="w-full resize-y min-h-[120px]"
                              placeholder="투자에 유리한 요인들..."
                            />
                          </div>
                          <div>
                            <Label className="text-sm font-medium mb-2 block">경계 요인 (리스크)</Label>
                            <Textarea
                              value={deepDive.decision.considerations.negative_factors}
                              onChange={e =>
                                updateDeepDive(prev => ({
                                  ...prev,
                                  decision: {
                                    ...prev.decision,
                                    considerations: { ...prev.decision.considerations, negative_factors: e.target.value }
                                  }
                                }))
                              }
                              rows={6}
                              className="w-full resize-y min-h-[120px]"
                              placeholder="주의해야 할 요인들..."
                            />
                          </div>
                        </CardContent>
                      </Card>

                      {/* 리스크 분석 */}
                      <Card className="border-rose-300">
                        <CardHeader>
                          <CardTitle className="text-rose-600">⚠️ 리스크 분석</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <Label className="text-sm font-medium mb-2 block">거시 리스크</Label>
                            <Textarea
                              value={deepDive.decision.risks.macro_risk}
                              onChange={e =>
                                updateDeepDive(prev => ({
                                  ...prev,
                                  decision: {
                                    ...prev.decision,
                                    risks: { ...prev.decision.risks, macro_risk: e.target.value }
                                  }
                                }))
                              }
                              rows={6}
                              className="w-full resize-y min-h-[120px]"
                              placeholder="금리, 경기침체, 지정학적 리스크 등..."
                            />
                          </div>
                          <div>
                            <Label className="text-sm font-medium mb-2 block">산업 리스크</Label>
                            <Textarea
                              value={deepDive.decision.risks.industry_risk}
                              onChange={e =>
                                updateDeepDive(prev => ({
                                  ...prev,
                                  decision: {
                                    ...prev.decision,
                                    risks: { ...prev.decision.risks, industry_risk: e.target.value }
                                  }
                                }))
                              }
                              rows={6}
                              className="w-full resize-y min-h-[120px]"
                              placeholder="산업 구조 변화, 경쟁 심화, 규제 리스크 등..."
                            />
                          </div>
                          <div>
                            <Label className="text-sm font-medium mb-2 block">기업 리스크</Label>
                            <Textarea
                              value={deepDive.decision.risks.company_risk}
                              onChange={e =>
                                updateDeepDive(prev => ({
                                  ...prev,
                                  decision: {
                                    ...prev.decision,
                                    risks: { ...prev.decision.risks, company_risk: e.target.value }
                                  }
                                }))
                              }
                              rows={6}
                              className="w-full resize-y min-h-[120px]"
                              placeholder="경영진 교체, 회계 이슈, 소송 리스크 등..."
                            />
                          </div>
                        </CardContent>
                      </Card>

                      {/* 시나리오 & 민감도 */}
                      <Card className="border-primary/20">
                        <CardHeader>
                          <CardTitle>📊 시나리오 & 민감도</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <Label className="text-sm font-medium mb-2 block">시나리오 요약</Label>
                            <Textarea
                              value={deepDive.decision.scenarios.summary}
                              onChange={e =>
                                updateDeepDive(prev => ({
                                  ...prev,
                                  decision: {
                                    ...prev.decision,
                                    scenarios: { ...prev.decision.scenarios, summary: e.target.value }
                                  }
                                }))
                              }
                              rows={6}
                              className="w-full resize-y min-h-[120px]"
                              placeholder="베이스/강세/약세 시나리오의 확률과 영향..."
                            />
                          </div>
                          <div>
                            <Label className="text-sm font-medium mb-2 block">민감도 분석</Label>
                            <Textarea
                              value={deepDive.decision.scenarios.sensitivity}
                              onChange={e =>
                                updateDeepDive(prev => ({
                                  ...prev,
                                  decision: {
                                    ...prev.decision,
                                    scenarios: { ...prev.decision.scenarios, sensitivity: e.target.value }
                                  }
                                }))
                              }
                              rows={6}
                              className="w-full resize-y min-h-[120px]"
                              placeholder="주요 변수 변화에 따른 가격 민감도..."
                            />
                          </div>
                        </CardContent>
                      </Card>

                      {/* 체크리스트 */}
                      <Card className="border-primary/20">
                        <CardHeader>
                          <CardTitle>✅ 체크리스트</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <Label className="text-sm font-medium mb-2 block">매수 조건 체크리스트</Label>
                            <Textarea
                              value={deepDive.decision.checklist.buy}
                              onChange={e =>
                                updateDeepDive(prev => ({
                                  ...prev,
                                  decision: {
                                    ...prev.decision,
                                    checklist: { ...prev.decision.checklist, buy: e.target.value }
                                  }
                                }))
                              }
                              rows={6}
                              className="w-full resize-y min-h-[120px]"
                              placeholder="매수 전에 반드시 확인할 사항들..."
                            />
                          </div>
                          <div>
                            <Label className="text-sm font-medium mb-2 block">대기 조건 체크리스트</Label>
                            <Textarea
                              value={deepDive.decision.checklist.wait}
                              onChange={e =>
                                updateDeepDive(prev => ({
                                  ...prev,
                                  decision: {
                                    ...prev.decision,
                                    checklist: { ...prev.decision.checklist, wait: e.target.value }
                                  }
                                }))
                              }
                              rows={6}
                              className="w-full resize-y min-h-[120px]"
                              placeholder="더 기다려야 하는 조건들..."
                            />
                          </div>
                        </CardContent>
                      </Card>

                      {/* 대응 전략 */}
                      <section>
                        <Label className="text-lg font-semibold mb-3 block">🛡️ 대응 전략</Label>
                        <Textarea
                          value={deepDive.decision.mitigation}
                          onChange={e =>
                            updateDeepDive(prev => ({
                              ...prev,
                              decision: { ...prev.decision, mitigation: e.target.value }
                            }))
                          }
                          rows={8}
                          className="w-full resize-y min-h-[150px]"
                          placeholder="리스크 대응 방안, 헤지 전략..."
                        />
                      </section>

                      {/* 최종 결정 */}
                      <Card className="border-primary/30 bg-primary/5">
                        <CardHeader>
                          <CardTitle className="text-primary">🎯 최종 결정</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label className="text-sm font-medium mb-2 block">목표가</Label>
                              <Input
                                type="number"
                                step="0.01"
                                value={deepDive.decision.target_price || ''}
                                onChange={e =>
                                  updateDeepDive(prev => ({
                                    ...prev,
                                    decision: { ...prev.decision, target_price: parseFloat(e.target.value) || 0 }
                                  }))
                                }
                                placeholder="0.00"
                              />
                            </div>
                            <div>
                              <Label className="text-sm font-medium mb-2 block">포지션 크기</Label>
                              <Input
                                value={deepDive.decision.position_size}
                                onChange={e =>
                                  updateDeepDive(prev => ({
                                    ...prev,
                                    decision: { ...prev.decision, position_size: e.target.value }
                                  }))
                                }
                                placeholder="예: 5%"
                              />
                            </div>
                          </div>
                          <div>
                            <Label className="text-sm font-medium mb-2 block">투자포인트 (2분 요약)</Label>
                            <Textarea
                              value={deepDive.decision.investment_point}
                              onChange={e =>
                                updateDeepDive(prev => ({
                                  ...prev,
                                  decision: { ...prev.decision, investment_point: e.target.value }
                                }))
                              }
                              rows={6}
                              className="w-full resize-y min-h-[120px]"
                              placeholder="핵심 투자 포인트를 2분 안에 설명할 수 있도록..."
                            />
                          </div>
                          <div>
                            <Label className="text-sm font-medium mb-2 block">최종 행동</Label>
                            <Select
                              value={deepDive.decision.action}
                              onValueChange={value =>
                                updateDeepDive(prev => ({
                                  ...prev,
                                  decision: { ...prev.decision, action: value as 'BUY' | 'WAIT' | 'PASS' }
                                }))
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="행동 선택" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="BUY">BUY (매수)</SelectItem>
                                <SelectItem value="WAIT">WAIT (관망)</SelectItem>
                                <SelectItem value="PASS">PASS (패스)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </CardContent>
                      </Card>

                      {/* 나의 현재 생각 */}
                      <section>
                        <Label className="text-lg font-semibold mb-3 block">💭 나의 현재 생각 정리</Label>
                        <Textarea
                          value={deepDive.decision.my_thoughts}
                          onChange={e =>
                            updateDeepDive(prev => ({
                              ...prev,
                              decision: { ...prev.decision, my_thoughts: e.target.value }
                            }))
                          }
                          rows={8}
                          className="w-full resize-y min-h-[150px]"
                          placeholder="지금 시점에서의 솔직한 생각, 고민, 확신..."
                        />
                      </section>

                      {/* 무효화 조건 */}
                      <section>
                        <Label className="text-lg font-semibold mb-3 block text-rose-600">⚠️ 내가 틀렸다고 인정하는 조건</Label>
                        <Textarea
                          value={deepDive.decision.invalidation_condition}
                          onChange={e =>
                            updateDeepDive(prev => ({
                              ...prev,
                              decision: { ...prev.decision, invalidation_condition: e.target.value }
                            }))
                          }
                          rows={8}
                          className="w-full resize-y min-h-[150px] border-rose-300 focus:ring-rose-500"
                          placeholder="어떤 상황이 오면 투자 가설이 틀렸다고 인정할 것인가?"
                        />
                      </section>

                      {/* 재검토 조건 */}
                      <section>
                        <Label className="text-lg font-semibold mb-3 block">🔄 재검토 조건</Label>
                        <Textarea
                          value={deepDive.decision.review_conditions}
                          onChange={e =>
                            updateDeepDive(prev => ({
                              ...prev,
                              decision: { ...prev.decision, review_conditions: e.target.value }
                            }))
                          }
                          rows={6}
                          className="w-full resize-y min-h-[120px]"
                          placeholder="언제 이 분석을 다시 검토할 것인가? (실적 발표, 주요 이벤트 등)"
                        />
                      </section>
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
