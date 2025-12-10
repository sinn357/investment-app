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
  valuation: { per: number; pbr: number; psr?: number; targetPrice?: number; upside?: number };
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
      thesis: 'EV→에너지→자율주행 3단계 성장, 소프트웨어 마진 확대로 밸류에이션 방어',
      conditions: ['FSD 매출 분기 20%+ QoQ 유지 시 비중 확대', 'ASP 추가 인하 시 손익분기 재검증']
    }
  },
  deepDive: createEmptyDeepDive(),
  references: [
    { type: '리포트', title: 'ARK 로보택시 TAM', url: 'https://example.com/ark-tsla', note: '보수적 시나리오만 반영' },
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
        valuation: { per: 0, pbr: 0, psr: 0, targetPrice: 92000, upside: 35 },
        growth: { revenueCagr: undefined, epsCagr: undefined, outlook: 'ETF 자금 유입과 공급 축소로 수급 우위' },
        financial: { debtRatio: undefined, roe: undefined, fcfMargin: undefined },
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
        catalysts: ['현물 ETF 추가 승인', '반감기 후 해시레이트 안정', '기관 커스터디 확산']
      },
      decision: {
        action: '관망',
      conviction: 3,
      prices: { buy: 70000, sell: 98000, stop: 62000 },
      positionSize: '포트폴리오 5% 유지, 변동성 1.5배 고려',
      thesis: 'ETF 자금과 반감기 공급 축소가 결합된 중기 수급 장세',
      conditions: ['해시레이트 급락 시 비중 축소', 'ETF 순유입 2주 연속 음수 시 매수 보류']
    }
  },
  deepDive: createEmptyDeepDive(),
  references: [
    { type: '리포트', title: 'Glassnode On-chain Trends', url: 'https://example.com/glassnode' },
    { type: '기사', title: 'ETF 순유입 데이터', url: 'https://example.com/etf-flow' }
  ],
  tags: ['거시', '디지털금', 'ETF']
  },
  {
    id: 'soxx-001',
    symbol: 'SOXX',
    name: 'iShares Semiconductor ETF',
    type: 'ETF',
    analyzedAt: '2025-10-28',
    lastUpdatedAt: '2025-11-18',
    inPortfolio: false,
    inWatchlist: true,
    myAnalysis: {
      quantitative: {
        valuation: { per: 28, pbr: 6, targetPrice: 650, upside: 18 },
        growth: { revenueCagr: 18, epsCagr: 20, outlook: 'AI/오토/산업용 반도체 수요 확대' },
        financial: { debtRatio: 0, roe: 0, fcfMargin: 0 },
        scores: { value: 3, growth: 4, quality: 4 }
      },
      qualitative: {
        businessModel: '반도체 섹터 ETF, 대형 팹리스/파운드리/장비사 비중 높음',
        moat: 'Narrow',
        management: 'ETF 운용사 iShares',
        risks: [{ level: 'Low', item: 'AI 투자 사이클 둔화' }],
        catalysts: ['TSMC capex 상향', 'AI 서버 수요 가이던스 상향', '미국/유럽 보조금 지속']
      },
      decision: {
        action: '매수',
      conviction: 3,
      prices: { buy: 540, sell: 690, stop: 500 },
      positionSize: '포트폴리오 6% 목표, 2회 분할 매수',
      thesis: 'AI/오토 수요가 사이클 저점을 만든 이후 구조적 성장이 이어짐',
      conditions: ['메모리/파운드리 가동률 반등 확인 시 비중 확대']
    }
  },
  deepDive: createEmptyDeepDive(),
  references: [
    { type: '기사', title: 'TSMC 2025 가이던스', url: 'https://example.com/tsmc' },
    { type: '리포트', title: 'AI 서버 TAM 업데이트', url: 'https://example.com/ai-server' }
  ],
  tags: ['반도체', 'AI', 'ETF']
  }
];

const actionBadgeStyle: Record<ActionType, string> = {
  매수: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
  관망: 'bg-amber-100 text-amber-800 border border-amber-200',
  매도: 'bg-rose-100 text-rose-800 border border-rose-200'
};

const moatOptions: QualitativeSection['moat'][] = ['Wide', 'Narrow', 'None'];

const withDeepDive = (item: AssetAnalysis): AssetAnalysis => ({
  ...item,
  deepDive: item.deepDive ?? createEmptyDeepDive()
});

function ConvictionDots({ level }: { level: number }) {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <header className="bg-gradient-to-r from-primary/5 to-secondary/5 shadow-sm border-b border-primary/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-foreground">🔎 개별 자산 분석</h1>
          <p className="mt-2 text-muted-foreground">
            정량/정성/의견/참고 자료를 한 곳에서 관리하는 리포트 아카이브 (MVP: 수동 입력)
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <section className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-1 space-y-4">
            {filteredAnalyses.map(item => (
              <Card
                key={item.id}
                className={`cursor-pointer transition shadow-sm hover:-translate-y-0.5 ${item.id === selected?.id ? 'ring-2 ring-primary/60 border-primary/50' : 'border-border'}`}
                onClick={() => {
                  setSelectedId(item.id);
                  setActiveTab('fundamental');
                }}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <div>
                    <p className="text-xs text-muted-foreground">{item.type}</p>
                    <CardTitle className="text-lg">{item.symbol} · {item.name}</CardTitle>
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
                        {item.myAnalysis.quantitative.valuation.targetPrice ? `$${item.myAnalysis.quantitative.valuation.targetPrice}` : '-'}
                      </p>
                    </div>
                    <div className="rounded-md border border-dashed border-secondary/30 bg-secondary/5 p-3">
                      <p className="text-xs text-muted-foreground">상승여력</p>
                      <p className="font-semibold">
                        {item.myAnalysis.quantitative.valuation.upside ? `${item.myAnalysis.quantitative.valuation.upside}%` : '-'}
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
                  <p className="text-xs text-muted-foreground">업데이트: {item.lastUpdatedAt} · 분석일: {item.analyzedAt}</p>
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
                          <Select value={detail.type} onValueChange={val => setDraft(prev => (prev ? { ...prev, type: val as AssetType } : prev))}>
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
                      <CardTitle className="text-2xl">{detail.symbol} · {detail.name}</CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={actionBadgeStyle[detail.myAnalysis.decision.action]}>{detail.myAnalysis.decision.action}</Badge>
                      <Badge variant={detail.inPortfolio ? 'default' : 'secondary'}>{detail.inPortfolio ? '포트폴리오' : '워치리스트'}</Badge>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3 items-center justify-between">
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 text-sm text-muted-foreground">
                        <input type="checkbox" checked={detail.inPortfolio} onChange={e => setDraft(prev => (prev ? { ...prev, inPortfolio: e.target.checked } : prev))} />
                        포트폴리오 보유
                      </label>
                      <label className="flex items-center gap-2 text-sm text-muted-foreground">
                        <input type="checkbox" checked={detail.inWatchlist} onChange={e => setDraft(prev => (prev ? { ...prev, inWatchlist: e.target.checked } : prev))} />
                        워치리스트
                      </label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        placeholder="태그를 콤마로 구분해 입력"
                        value={detail.tags.join(', ')}
                        onChange={e => setDraft(prev => (prev ? { ...prev, tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean) } : prev))}
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
                          onChange={e => updateDeepDive(prev => ({ ...prev, fundamental: { ...prev.fundamental, investment_reason: e.target.value } }))}
                          rows={4}
                          className="w-full"
                          placeholder="이 자산에 투자하는 핵심 이유를 적어주세요..."
                        />
                      </section>
                      <section>
                        <h3 className="text-lg font-semibold mb-3">🌟 미래 잠재력</h3>
                        <Textarea
                          value={deepDive.fundamental.potential}
                          onChange={e => updateDeepDive(prev => ({ ...prev, fundamental: { ...prev.fundamental, potential: e.target.value } }))}
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
                          onChange={data => updateDeepDive(prev => ({ ...prev, fundamental: { ...prev.fundamental, competitor_comparison: data } }))}
                        />
                      </section>
                      <section className="border border-primary/20 rounded-lg p-4">
                        <h3 className="text-lg font-semibold mb-4">💰 재무분석</h3>
                        <FinancialAnalysis
                          data={deepDive.fundamental.financial_analysis}
                          onChange={data => updateDeepDive(prev => ({ ...prev, fundamental: { ...prev.fundamental, financial_analysis: data } }))}
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
                          onChange={data => updateDeepDive(prev => ({ ...prev, technical: { ...prev.technical, chart_analysis: data } }))}
                        />
                      </section>
                      <section className="border border-primary/20 rounded-lg p-4">
                        <h3 className="text-lg font-semibold mb-4">🔢 퀀트 분석</h3>
                        <QuantAnalysis
                          data={deepDive.technical.quant_analysis}
                          onChange={data => updateDeepDive(prev => ({ ...prev, technical: { ...prev.technical, quant_analysis: data } }))}
                        />
                      </section>
                      <section className="border border-primary/20 rounded-lg p-4">
                        <h3 className="text-lg font-semibold mb-4">💭 심리/수급 분석</h3>
                        <SentimentAnalysis
                          data={deepDive.technical.sentiment_analysis}
                          onChange={data => updateDeepDive(prev => ({ ...prev, technical: { ...prev.technical, sentiment_analysis: data } }))}
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
                          onChange={data => updateDeepDive(prev => ({ ...prev, summary: { ...prev.summary, investment_considerations: data } }))}
                        />
                      </section>
                      <section className="border border-primary/20 rounded-lg p-4">
                        <h3 className="text-lg font-semibold mb-4">⚠️ 리스크포인트</h3>
                        <RiskPoints
                          data={deepDive.summary.risk_points}
                          onChange={data => updateDeepDive(prev => ({ ...prev, summary: { ...prev.summary, risk_points: data } }))}
                        />
                      </section>
                      <section className="border border-primary/20 rounded-lg p-4">
                        <h3 className="text-lg font-semibold mb-4">💵 밸류에이션</h3>
                        <Valuation
                          data={deepDive.summary.valuation}
                          onChange={data => updateDeepDive(prev => ({ ...prev, summary: { ...prev.summary, valuation: data } }))}
                        />
                      </section>
                      <section>
                        <h3 className="text-lg font-semibold mb-3">📝 투자 포인트 (2분 요약)</h3>
                        <Textarea
                          value={deepDive.summary.investment_point}
                          onChange={e => updateDeepDive(prev => ({ ...prev, summary: { ...prev.summary, investment_point: e.target.value } }))}
                          rows={3}
                          className="w-full"
                          placeholder="2분 만에 설명할 수 있는 핵심 매수 이유..."
                        />
                      </section>
                      <section>
                        <h3 className="text-lg font-semibold mb-3">💭 나의 현재 생각 정리</h3>
                        <Textarea
                          value={deepDive.summary.my_thoughts}
                          onChange={e => updateDeepDive(prev => ({ ...prev, summary: { ...prev.summary, my_thoughts: e.target.value } }))}
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
