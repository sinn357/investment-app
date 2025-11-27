'use client';

import React, { useMemo, useState } from 'react';
import Navigation from '@/components/Navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  references: ReferenceItem[];
  tags: string[];
}

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

function ConvictionDots({ level }: { level: number }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, idx) => (
        <span
          // eslint-disable-next-line react/no-array-index-key
          key={idx}
          className={`h-2.5 w-2.5 rounded-full ${idx < level ? 'bg-primary' : 'bg-muted'}`}
        />
      ))}
    </div>
  );
}

export default function AnalysisPage() {
  const [analyses, setAnalyses] = useState<AssetAnalysis[]>(sampleAnalyses);
  const [selectedId, setSelectedId] = useState<string>(sampleAnalyses[0]?.id ?? '');
  const [typeFilter, setTypeFilter] = useState<AssetType | '전체'>('전체');
  const [actionFilter, setActionFilter] = useState<ActionType | '전체'>('전체');
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'quant' | 'qual' | 'decision' | 'refs'>('quant');

  const filteredAnalyses = useMemo(() => {
    return analyses.filter(item => {
      const matchType = typeFilter === '전체' || item.type === typeFilter;
      const matchAction = actionFilter === '전체' || item.myAnalysis.decision.action === actionFilter;
      const matchSearch =
        !search ||
        item.symbol.toLowerCase().includes(search.toLowerCase()) ||
        item.name.toLowerCase().includes(search.toLowerCase());
      return matchType && matchAction && matchSearch;
    });
  }, [analyses, typeFilter, actionFilter, search]);

  const selected = analyses.find(a => a.id === selectedId) ?? filteredAnalyses[0];

  const handleAddNew = () => {
    const newItem: AssetAnalysis = {
      id: `new-${Date.now()}`,
      symbol: 'NEW',
      name: '새 자산 분석',
      type: '주식',
      analyzedAt: new Date().toISOString().split('T')[0],
      lastUpdatedAt: new Date().toISOString().split('T')[0],
      inPortfolio: false,
      inWatchlist: true,
      myAnalysis: {
        quantitative: {
          valuation: { per: 0, pbr: 0, psr: 0, targetPrice: undefined, upside: undefined },
          growth: { outlook: '핵심 가설을 작성하세요.' },
          financial: {},
          scores: { value: 0, growth: 0, quality: 0 }
        },
        qualitative: {
          businessModel: '비즈니스 모델을 요약하세요.',
          moat: 'None',
          management: '경영진/프로토콜 특성 메모',
          risks: [],
          catalysts: []
        },
        decision: {
          action: '관망',
          conviction: 1,
          prices: {},
          positionSize: '목표 비중을 정하세요.',
          thesis: '투자 논지를 작성하세요.'
        }
      },
      references: [],
      tags: ['임시']
    };
    setAnalyses(prev => [newItem, ...prev]);
    setSelectedId(newItem.id);
    setActiveTab('quant');
  };

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
        <Card className="border border-primary/20 bg-card">
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 items-end">
            <div className="space-y-2">
              <Label htmlFor="search">검색</Label>
              <Input
                id="search"
                placeholder="티커/이름 검색"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>자산 타입</Label>
              <Select value={typeFilter} onValueChange={val => setTypeFilter(val as AssetType | '전체')}>
                <SelectTrigger>
                  <SelectValue placeholder="전체" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="전체">전체</SelectItem>
                  <SelectItem value="주식">주식</SelectItem>
                  <SelectItem value="암호화폐">암호화폐</SelectItem>
                  <SelectItem value="ETF">ETF</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>투자 의견</Label>
              <Select
                value={actionFilter}
                onValueChange={val => setActionFilter(val as ActionType | '전체')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="전체" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="전체">전체</SelectItem>
                  <SelectItem value="매수">매수</SelectItem>
                  <SelectItem value="관망">관망</SelectItem>
                  <SelectItem value="매도">매도</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end">
              <Button className="w-full sm:w-auto" onClick={handleAddNew}>
                새 리포트 추가
              </Button>
            </div>
          </CardContent>
        </Card>

        <section className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-1 space-y-4">
            {filteredAnalyses.map(item => (
              <Card
                key={item.id}
                className={`cursor-pointer transition shadow-sm hover:-translate-y-0.5 ${
                  item.id === selected?.id ? 'ring-2 ring-primary/60 border-primary/50' : 'border-border'
                }`}
                onClick={() => {
                  setSelectedId(item.id);
                  setActiveTab('quant');
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
            {selected ? (
              <>
                <Card className="border border-primary/20 bg-card">
                  <CardHeader className="flex flex-col gap-2">
                    <div className="flex flex-wrap items-center gap-2 justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">{selected.type}</p>
                        <CardTitle className="text-2xl">
                          {selected.symbol} · {selected.name}
                        </CardTitle>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={actionBadgeStyle[selected.myAnalysis.decision.action]}>
                          {selected.myAnalysis.decision.action}
                        </Badge>
                        <Badge variant={selected.inPortfolio ? 'default' : 'secondary'}>
                          {selected.inPortfolio ? '포트폴리오' : '워치리스트'}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant={activeTab === 'quant' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setActiveTab('quant')}
                      >
                        정량 분석
                      </Button>
                      <Button
                        variant={activeTab === 'qual' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setActiveTab('qual')}
                      >
                        정성 분석
                      </Button>
                      <Button
                        variant={activeTab === 'decision' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setActiveTab('decision')}
                      >
                        투자 의견
                      </Button>
                      <Button
                        variant={activeTab === 'refs' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setActiveTab('refs')}
                      >
                        참고 자료
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {activeTab === 'quant' && (
                      <div className="grid gap-4 md:grid-cols-2">
                        <Card className="border-primary/20">
                          <CardHeader>
                            <CardTitle className="text-lg">밸류에이션</CardTitle>
                          </CardHeader>
                          <CardContent className="grid grid-cols-2 gap-3 text-sm">
                            <Metric label="PER" value={selected.myAnalysis.quantitative.valuation.per} suffix="x" />
                            <Metric label="PBR" value={selected.myAnalysis.quantitative.valuation.pbr} suffix="x" />
                            <Metric label="PSR" value={selected.myAnalysis.quantitative.valuation.psr} suffix="x" />
                            <Metric
                              label="목표가"
                              value={selected.myAnalysis.quantitative.valuation.targetPrice}
                              prefix="$"
                            />
                            <Metric
                              label="상승여력"
                              value={selected.myAnalysis.quantitative.valuation.upside}
                              suffix="%"
                            />
                          </CardContent>
                        </Card>
                        <Card className="border-secondary/20">
                          <CardHeader>
                            <CardTitle className="text-lg">성장/재무</CardTitle>
                          </CardHeader>
                          <CardContent className="grid grid-cols-2 gap-3 text-sm">
                            <Metric
                              label="매출 CAGR"
                              value={selected.myAnalysis.quantitative.growth.revenueCagr}
                              suffix="%"
                            />
                            <Metric
                              label="EPS CAGR"
                              value={selected.myAnalysis.quantitative.growth.epsCagr}
                              suffix="%"
                            />
                            <Metric
                              label="부채비율"
                              value={selected.myAnalysis.quantitative.financial.debtRatio}
                              suffix="%"
                            />
                            <Metric label="ROE" value={selected.myAnalysis.quantitative.financial.roe} suffix="%" />
                            <Metric
                              label="FCF 마진"
                              value={selected.myAnalysis.quantitative.financial.fcfMargin}
                              suffix="%"
                            />
                          </CardContent>
                          <p className="px-6 pb-4 text-sm text-muted-foreground">
                            전망: {selected.myAnalysis.quantitative.growth.outlook}
                          </p>
                        </Card>
                        <Card className="md:col-span-2 border-border">
                          <CardHeader>
                            <CardTitle className="text-lg">점수 (1-5)</CardTitle>
                          </CardHeader>
                          <CardContent className="grid grid-cols-3 gap-4 text-sm">
                            <ScoreBlock label="Value" value={selected.myAnalysis.quantitative.scores.value} />
                            <ScoreBlock label="Growth" value={selected.myAnalysis.quantitative.scores.growth} />
                            <ScoreBlock label="Quality" value={selected.myAnalysis.quantitative.scores.quality} />
                          </CardContent>
                        </Card>
                      </div>
                    )}

                    {activeTab === 'qual' && (
                      <div className="grid gap-4 md:grid-cols-2">
                        <Card className="border-primary/20">
                          <CardHeader>
                            <CardTitle className="text-lg">비즈니스/무형자산</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3 text-sm">
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">모델</p>
                              <p className="font-medium">{selected.myAnalysis.qualitative.businessModel}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Moat</p>
                              <Badge variant="outline">{selected.myAnalysis.qualitative.moat}</Badge>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">경영진</p>
                              <p>{selected.myAnalysis.qualitative.management}</p>
                            </div>
                          </CardContent>
                        </Card>
                        <Card className="border-secondary/20">
                          <CardHeader>
                            <CardTitle className="text-lg">리스크/촉매</CardTitle>
                          </CardHeader>
                          <CardContent className="grid gap-3">
                            <div className="space-y-2">
                              <p className="text-xs text-muted-foreground">리스크</p>
                              <div className="space-y-2">
                                {selected.myAnalysis.qualitative.risks.map(risk => (
                                  <div
                                    key={`${risk.level}-${risk.item}`}
                                    className="flex items-center justify-between rounded-md border border-dashed border-border bg-muted/30 px-3 py-2 text-sm"
                                  >
                                    <span>{risk.item}</span>
                                    <Badge
                                      variant="outline"
                                      className={
                                        risk.level === 'High'
                                          ? 'border-rose-200 text-rose-700'
                                          : risk.level === 'Medium'
                                            ? 'border-amber-200 text-amber-700'
                                            : 'border-emerald-200 text-emerald-700'
                                      }
                                    >
                                      {risk.level}
                                    </Badge>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div className="space-y-2">
                              <p className="text-xs text-muted-foreground">상승 촉매</p>
                              <div className="flex flex-wrap gap-2">
                                {selected.myAnalysis.qualitative.catalysts.map(cat => (
                                  <Badge key={cat} variant="secondary">
                                    {cat}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    )}

                    {activeTab === 'decision' && (
                      <div className="grid gap-4 md:grid-cols-2">
                        <Card className="border-primary/20">
                          <CardHeader>
                            <CardTitle className="text-lg">액션 & 가격 전략</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3 text-sm">
                            <div className="flex items-center justify-between">
                              <span>투자 의견</span>
                              <Badge className={actionBadgeStyle[selected.myAnalysis.decision.action]}>
                                {selected.myAnalysis.decision.action}
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between">
                              <span>확신도</span>
                              <ConvictionDots level={selected.myAnalysis.decision.conviction} />
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                              <PriceBlock label="목표 매수가" value={selected.myAnalysis.decision.prices.buy} />
                              <PriceBlock label="목표 매도가" value={selected.myAnalysis.decision.prices.sell} />
                              <PriceBlock label="손절가" value={selected.myAnalysis.decision.prices.stop} />
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">포지션 계획</p>
                              <p className="font-medium">{selected.myAnalysis.decision.positionSize}</p>
                            </div>
                          </CardContent>
                        </Card>
                        <Card className="border-secondary/20">
                          <CardHeader>
                            <CardTitle className="text-lg">투자 논지 & 조건</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3 text-sm">
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">핵심 논지</p>
                              <p>{selected.myAnalysis.decision.thesis}</p>
                            </div>
                            {selected.myAnalysis.decision.conditions?.length ? (
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">조건부 매수/관리</p>
                                <ul className="list-disc pl-4 space-y-1">
                                  {selected.myAnalysis.decision.conditions.map(cond => (
                                    <li key={cond}>{cond}</li>
                                  ))}
                                </ul>
                              </div>
                            ) : null}
                          </CardContent>
                        </Card>
                      </div>
                    )}

                    {activeTab === 'refs' && (
                      <div className="space-y-4">
                        <Card className="border-border">
                          <CardHeader>
                            <CardTitle className="text-lg">참고 자료</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3 text-sm">
                            {selected.references.length === 0 && (
                              <p className="text-muted-foreground">자료를 추가해 주세요.</p>
                            )}
                            {selected.references.map(ref => (
                              <div
                                key={`${ref.title}-${ref.url}`}
                                className="flex flex-col gap-1 rounded-md border border-dashed border-border bg-muted/40 p-3"
                              >
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline">{ref.type}</Badge>
                                  <a
                                    href={ref.url}
                                    className="font-medium text-primary hover:underline"
                                    target="_blank"
                                    rel="noreferrer"
                                  >
                                    {ref.title}
                                  </a>
                                </div>
                                {ref.note ? (
                                  <p className="text-xs text-muted-foreground">메모: {ref.note}</p>
                                ) : null}
                              </div>
                            ))}
                          </CardContent>
                        </Card>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
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

function Metric({
  label,
  value,
  prefix,
  suffix
}: {
  label: string;
  value?: number;
  prefix?: string;
  suffix?: string;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-md border border-border bg-muted/30 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-semibold">
        {value !== undefined && value !== null && !Number.isNaN(value)
          ? `${prefix ?? ''}${value}${suffix ?? ''}`
          : '-'}
      </p>
    </div>
  );
}

function ScoreBlock({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-dashed border-primary/30 bg-primary/5 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold">{value}/5</p>
    </div>
  );
}

function PriceBlock({ label, value }: { label: string; value?: number }) {
  return (
    <div className="rounded-md border border-border bg-muted/30 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-semibold">{value ? `$${value}` : '-'}</p>
    </div>
  );
}
