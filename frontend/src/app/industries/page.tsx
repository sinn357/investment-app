'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://investment-app-backend-x166.onrender.com';

// 6대 산업군 정의
const MAJOR_CATEGORIES = [
  {
    id: 'tech',
    name: '기술·데이터·인프라',
    icon: '💻',
    color: 'from-blue-500/10 to-indigo-500/10 border-blue-500/30',
    subIndustries: [
      '반도체 & 반도체 장비',
      '클라우드 & 데이터센터',
      '소프트웨어 & SaaS',
      '사이버보안',
      'AI & 머신러닝 & 딥러닝',
      '통신 & 5G & 네트워크 인프라',
      '전자상거래 & 전자상거래 인프라',
      '스마트팩토리 & 로보틱스'
    ]
  },
  {
    id: 'industrial',
    name: '산업·제조·공공 인프라',
    icon: '🏗️',
    color: 'from-slate-500/10 to-gray-500/10 border-slate-500/30',
    subIndustries: [
      '중장비 & 건설기계',
      '철강 & 소재',
      '자동차 & 부품',
      '자율주행 & 전장',
      '스마트시티 & 무인화',
      '운송 & 물류',
      '건설 & 인프라',
      '원자력 & 전통 발전소',
      '공공 기반 서비스'
    ]
  },
  {
    id: 'consumer',
    name: '소비·문화·라이프스타일',
    icon: '🛍️',
    color: 'from-pink-500/10 to-rose-500/10 border-pink-500/30',
    subIndustries: [
      '리테일 & 쇼핑',
      '패션 & 명품',
      '뷰티 & 헬스케어 소비재',
      '음식 & 외식',
      '여행 & 호텔 & 항공',
      '미디어 & 콘텐츠',
      '게임 & e스포츠',
      '교육 & 에듀테크',
      '반려동물 & 취미'
    ]
  },
  {
    id: 'healthcare',
    name: '건강·생명과학·바이오',
    icon: '🏥',
    color: 'from-green-500/10 to-emerald-500/10 border-green-500/30',
    subIndustries: [
      '제약 & 바이오테크',
      '의료기기 & 정밀진단',
      '헬스케어 서비스',
      '유전체/AI 치료/신약개발',
      '디지털 헬스 & 원격의료'
    ]
  },
  {
    id: 'energy',
    name: '에너지·자원·환경',
    icon: '⚡',
    color: 'from-amber-500/10 to-yellow-500/10 border-amber-500/30',
    subIndustries: [
      '석유 & 가스',
      '태양광 & 풍력',
      '원자력 & SMR',
      '수소 & 연료전지',
      '탄소 포집 & 탄소권',
      '재활용 & 폐기물 처리',
      '광물 & 원자재',
      'ESS & 에너지 저장'
    ]
  },
  {
    id: 'finance',
    name: '금융·자산·부동산',
    icon: '💰',
    color: 'from-emerald-500/10 to-teal-500/10 border-emerald-500/30',
    subIndustries: [
      '상업은행 & 투자은행',
      '보험',
      '카드 & 결제 네트워크',
      '자산운용 & 사모펀드',
      '핀테크 & 디지털금융',
      '부동산 개발 & 프롭테크',
      '리츠 & 부동산 수익 투자'
    ]
  }
];

interface AnalysisData {
  core_technology: {
    definition: string;
    stage: string;
    innovation_path: string;
  };
  macro_impact: {
    interest_rate: string;
    exchange_rate: string;
    commodities: string;
    policy: string;
  };
  growth_drivers: {
    internal: string;
    external: string;
    kpi: string;
  };
  value_chain: {
    flow: string;
    profit_pool: string;
    bottleneck: string;
  };
  supply_demand: {
    demand: {
      end_user: string;
      long_term: string;
      sensitivity: string;
    };
    supply: {
      players: string;
      capacity: string;
      barriers: string;
    };
    catalysts: string;
  };
  market_map: {
    structure: string;
    competition: string;
    moat: string;
    lifecycle: string;
  };
}

export default function IndustriesPage() {
  const [userId] = useState(1); // 임시 user_id
  const [selectedMajor, setSelectedMajor] = useState<string | null>(null);
  const [selectedSubIndustry, setSelectedSubIndustry] = useState<string | null>(null);
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [leadingStocks, setLeadingStocks] = useState<string[]>([]);
  const [emergingStocks, setEmergingStocks] = useState<string[]>([]);
  const [newLeadingStock, setNewLeadingStock] = useState('');
  const [newEmergingStock, setNewEmergingStock] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const selectedCategory = MAJOR_CATEGORIES.find(cat => cat.name === selectedMajor);

  // 산업 분석 데이터 로드
  const loadAnalysisData = useCallback(async () => {
    if (!selectedMajor || !selectedSubIndustry) return;

    try {
      const response = await fetch(
        `${API_URL}/api/industry-analysis?user_id=${userId}&major_category=${encodeURIComponent(selectedMajor)}&sub_industry=${encodeURIComponent(selectedSubIndustry)}`
      );
      const result = await response.json();

      if (result.status === 'success' && result.data) {
        setAnalysisData(result.data.analysis_data || getEmptyAnalysisData());
        setLeadingStocks(result.data.leading_stocks || []);
        setEmergingStocks(result.data.emerging_stocks || []);
      }
    } catch (error) {
      console.error('데이터 로드 실패:', error);
    }
  }, [selectedMajor, selectedSubIndustry, userId]);

  useEffect(() => {
    loadAnalysisData();
  }, [loadAnalysisData]);

  const getEmptyAnalysisData = (): AnalysisData => ({
    core_technology: { definition: '', stage: '상용화', innovation_path: '' },
    macro_impact: { interest_rate: '', exchange_rate: '', commodities: '', policy: '' },
    growth_drivers: { internal: '', external: '', kpi: '' },
    value_chain: { flow: '', profit_pool: '', bottleneck: '' },
    supply_demand: {
      demand: { end_user: '', long_term: '', sensitivity: '' },
      supply: { players: '', capacity: '', barriers: '' },
      catalysts: ''
    },
    market_map: { structure: '', competition: '', moat: '', lifecycle: '' }
  });

  const handleSave = async () => {
    if (!selectedMajor || !selectedSubIndustry || !analysisData) return;

    setIsSaving(true);
    setSaveMessage('');

    try {
      const response = await fetch(`${API_URL}/api/industry-analysis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          major_category: selectedMajor,
          sub_industry: selectedSubIndustry,
          analysis_data: analysisData,
          leading_stocks: leadingStocks,
          emerging_stocks: emergingStocks
        })
      });

      const result = await response.json();

      if (result.status === 'success') {
        setSaveMessage('✅ 저장되었습니다!');
        setTimeout(() => setSaveMessage(''), 2000);
      } else {
        setSaveMessage('❌ 저장 실패');
      }
    } catch (error) {
      console.error('저장 오류:', error);
      setSaveMessage('❌ 저장 중 오류 발생');
    } finally {
      setIsSaving(false);
    }
  };

  const updateAnalysis = <K extends keyof AnalysisData>(
    section: K,
    field: keyof AnalysisData[K],
    value: string
  ) => {
    if (!analysisData) return;
    setAnalysisData({
      ...analysisData,
      [section]: {
        ...analysisData[section],
        [field]: value
      }
    });
  };

  const addLeadingStock = () => {
    if (newLeadingStock.trim() && !leadingStocks.includes(newLeadingStock.trim())) {
      setLeadingStocks([...leadingStocks, newLeadingStock.trim()]);
      setNewLeadingStock('');
    }
  };

  const removeLeadingStock = (stock: string) => {
    setLeadingStocks(leadingStocks.filter(s => s !== stock));
  };

  const addEmergingStock = () => {
    if (newEmergingStock.trim() && !emergingStocks.includes(newEmergingStock.trim())) {
      setEmergingStocks([...emergingStocks, newEmergingStock.trim()]);
      setNewEmergingStock('');
    }
  };

  const removeEmergingStock = (stock: string) => {
    setEmergingStocks(emergingStocks.filter(s => s !== stock));
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <header className="bg-gradient-to-r from-primary/5 to-secondary/5 shadow-sm border-b border-primary/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-foreground">🏭 산업군 & 종목 분석</h1>
          <p className="mt-2 text-muted-foreground">6대 산업군별 하위 산업 분석 시스템</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* 1단계: 6대 산업군 카드 선택 */}
        {!selectedMajor && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {MAJOR_CATEGORIES.map(category => (
              <Card
                key={category.id}
                className={`cursor-pointer hover:-translate-y-1 transition-all shadow-md hover:shadow-xl bg-gradient-to-br ${category.color}`}
                onClick={() => setSelectedMajor(category.name)}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <span className="text-4xl">{category.icon}</span>
                    <div>
                      <div className="text-xl font-bold">{category.name}</div>
                      <div className="text-sm text-muted-foreground font-normal">
                        {category.subIndustries.length}개 하위 산업
                      </div>
                    </div>
                  </CardTitle>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}

        {/* 2단계: 하위 산업 탭 선택 */}
        {selectedMajor && !selectedSubIndustry && selectedCategory && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => setSelectedMajor(null)}
              >
                ← 뒤로
              </Button>
              <div className="flex items-center gap-2">
                <span className="text-2xl">{selectedCategory.icon}</span>
                <h2 className="text-2xl font-bold">{selectedMajor}</h2>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {selectedCategory.subIndustries.map((subIndustry, index) => (
                <Button
                  key={index}
                  onClick={() => {
                    setSelectedSubIndustry(subIndustry);
                    setAnalysisData(getEmptyAnalysisData());
                  }}
                  className="h-auto py-4 text-left justify-start bg-gradient-to-r from-primary/10 to-secondary/10 hover:from-primary/20 hover:to-secondary/20 border border-primary/20"
                  variant="outline"
                >
                  <span className="font-semibold">{subIndustry}</span>
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* 3단계: 분석 요소 폼 */}
        {selectedMajor && selectedSubIndustry && analysisData && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedSubIndustry(null);
                    setAnalysisData(null);
                  }}
                >
                  ← 뒤로
                </Button>
                <div>
                  <div className="text-sm text-muted-foreground">{selectedMajor}</div>
                  <h2 className="text-2xl font-bold">{selectedSubIndustry}</h2>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {saveMessage && <span className="text-sm font-medium">{saveMessage}</span>}
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90"
                >
                  {isSaving ? '저장 중...' : '💾 저장'}
                </Button>
              </div>
            </div>

            {/* 🔬 핵심기술 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-primary">🔬 핵심기술</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>정의</Label>
                  <Textarea
                    value={analysisData.core_technology.definition}
                    onChange={(e) => updateAnalysis('core_technology', 'definition', e.target.value)}
                    rows={6}
                    className="resize-y min-h-[120px]"
                    placeholder="현재 경쟁력을 뒷받침하는 핵심 기술..."
                  />
                </div>
                <div>
                  <Label>기술 단계</Label>
                  <Select
                    value={analysisData.core_technology.stage}
                    onValueChange={(value) => updateAnalysis('core_technology', 'stage', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="상용화">상용화</SelectItem>
                      <SelectItem value="성장기">성장기</SelectItem>
                      <SelectItem value="R&D">연구개발 단계</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>혁신 경로</Label>
                  <Textarea
                    value={analysisData.core_technology.innovation_path}
                    onChange={(e) => updateAnalysis('core_technology', 'innovation_path', e.target.value)}
                    rows={6}
                    className="resize-y min-h-[120px]"
                    placeholder="다음 세대 기술 및 패러다임 전환 시점..."
                  />
                </div>
              </CardContent>
            </Card>

            {/* 💰 거시경제 영향 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-primary">💰 거시경제 영향</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>금리/유동성</Label>
                  <Textarea
                    value={analysisData.macro_impact.interest_rate}
                    onChange={(e) => updateAnalysis('macro_impact', 'interest_rate', e.target.value)}
                    rows={6}
                    className="resize-y min-h-[120px]"
                    placeholder="Capex 의존도, 밸류에이션 민감도..."
                  />
                </div>
                <div>
                  <Label>환율</Label>
                  <Textarea
                    value={analysisData.macro_impact.exchange_rate}
                    onChange={(e) => updateAnalysis('macro_impact', 'exchange_rate', e.target.value)}
                    rows={6}
                    className="resize-y min-h-[120px]"
                    placeholder="수출입 기업, 원재료 비용..."
                  />
                </div>
                <div>
                  <Label>원자재</Label>
                  <Textarea
                    value={analysisData.macro_impact.commodities}
                    onChange={(e) => updateAnalysis('macro_impact', 'commodities', e.target.value)}
                    rows={6}
                    className="resize-y min-h-[120px]"
                    placeholder="가격 변동이 원가·마진에 미치는 영향..."
                  />
                </div>
                <div>
                  <Label>정책/규제</Label>
                  <Textarea
                    value={analysisData.macro_impact.policy}
                    onChange={(e) => updateAnalysis('macro_impact', 'policy', e.target.value)}
                    rows={6}
                    className="resize-y min-h-[120px]"
                    placeholder="정부 보조금, 규제 강화, 무역정책..."
                  />
                </div>
              </CardContent>
            </Card>

            {/* 📈 성장동력/KPI */}
            <Card>
              <CardHeader>
                <CardTitle className="text-primary">📈 성장동력/KPI</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>내부 요인</Label>
                  <Textarea
                    value={analysisData.growth_drivers.internal}
                    onChange={(e) => updateAnalysis('growth_drivers', 'internal', e.target.value)}
                    rows={6}
                    className="resize-y min-h-[120px]"
                    placeholder="기술 혁신, 생산성 향상, 고객 락인, 네트워크 효과..."
                  />
                </div>
                <div>
                  <Label>외부 요인</Label>
                  <Textarea
                    value={analysisData.growth_drivers.external}
                    onChange={(e) => updateAnalysis('growth_drivers', 'external', e.target.value)}
                    rows={6}
                    className="resize-y min-h-[120px]"
                    placeholder="규제 완화, 정부 지원, 글로벌 수요, 소비 트렌드, 신흥시장..."
                  />
                </div>
                <div>
                  <Label>핵심 KPI</Label>
                  <Textarea
                    value={analysisData.growth_drivers.kpi}
                    onChange={(e) => updateAnalysis('growth_drivers', 'kpi', e.target.value)}
                    rows={6}
                    className="resize-y min-h-[120px]"
                    placeholder="생산량, ASP, 가동률, 점유율, ARR/NRR, Take Rate 등..."
                  />
                </div>
              </CardContent>
            </Card>

            {/* 🔗 가치사슬 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-primary">🔗 가치사슬</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>단계별 흐름</Label>
                  <Textarea
                    value={analysisData.value_chain.flow}
                    onChange={(e) => updateAnalysis('value_chain', 'flow', e.target.value)}
                    rows={6}
                    className="resize-y min-h-[120px]"
                    placeholder="원재료 → 중간재 → 장비/설비 → 완제품 → 유통 → 최종 수요..."
                  />
                </div>
                <div>
                  <Label>이익풀 분석</Label>
                  <Textarea
                    value={analysisData.value_chain.profit_pool}
                    onChange={(e) => updateAnalysis('value_chain', 'profit_pool', e.target.value)}
                    rows={6}
                    className="resize-y min-h-[120px]"
                    placeholder="어느 단계에서 마진이 가장 큰가..."
                  />
                </div>
                <div>
                  <Label>병목 파악</Label>
                  <Textarea
                    value={analysisData.value_chain.bottleneck}
                    onChange={(e) => updateAnalysis('value_chain', 'bottleneck', e.target.value)}
                    rows={6}
                    className="resize-y min-h-[120px]"
                    placeholder="공급이 제한된 단계, 필수 기술·소재..."
                  />
                </div>
              </CardContent>
            </Card>

            {/* 📊 공급/수요 요인 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-primary">📊 공급/수요 요인</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">수요</h3>
                  <div>
                    <Label>최종 수요처</Label>
                    <Textarea
                      value={analysisData.supply_demand.demand.end_user}
                      onChange={(e) => {
                        setAnalysisData({
                          ...analysisData,
                          supply_demand: {
                            ...analysisData.supply_demand,
                            demand: { ...analysisData.supply_demand.demand, end_user: e.target.value }
                          }
                        });
                      }}
                      rows={6}
                      className="resize-y min-h-[120px]"
                      placeholder="소비자/기업/정부..."
                    />
                  </div>
                  <div>
                    <Label>장기 성장 동력</Label>
                    <Textarea
                      value={analysisData.supply_demand.demand.long_term}
                      onChange={(e) => {
                        setAnalysisData({
                          ...analysisData,
                          supply_demand: {
                            ...analysisData.supply_demand,
                            demand: { ...analysisData.supply_demand.demand, long_term: e.target.value }
                          }
                        });
                      }}
                      rows={6}
                      className="resize-y min-h-[120px]"
                      placeholder="인구, 소득, 기술, 정책..."
                    />
                  </div>
                  <div>
                    <Label>수요 민감도</Label>
                    <Textarea
                      value={analysisData.supply_demand.demand.sensitivity}
                      onChange={(e) => {
                        setAnalysisData({
                          ...analysisData,
                          supply_demand: {
                            ...analysisData.supply_demand,
                            demand: { ...analysisData.supply_demand.demand, sensitivity: e.target.value }
                          }
                        });
                      }}
                      rows={6}
                      className="resize-y min-h-[120px]"
                      placeholder="경기순환형 vs 구조적 성장형..."
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">공급</h3>
                  <div>
                    <Label>주요 플레이어</Label>
                    <Textarea
                      value={analysisData.supply_demand.supply.players}
                      onChange={(e) => {
                        setAnalysisData({
                          ...analysisData,
                          supply_demand: {
                            ...analysisData.supply_demand,
                            supply: { ...analysisData.supply_demand.supply, players: e.target.value }
                          }
                        });
                      }}
                      rows={6}
                      className="resize-y min-h-[120px]"
                      placeholder="국가, 기업, 집중도..."
                    />
                  </div>
                  <div>
                    <Label>생산능력</Label>
                    <Textarea
                      value={analysisData.supply_demand.supply.capacity}
                      onChange={(e) => {
                        setAnalysisData({
                          ...analysisData,
                          supply_demand: {
                            ...analysisData.supply_demand,
                            supply: { ...analysisData.supply_demand.supply, capacity: e.target.value }
                          }
                        });
                      }}
                      rows={6}
                      className="resize-y min-h-[120px]"
                      placeholder="증설 계획, 리드타임..."
                    />
                  </div>
                  <div>
                    <Label>진입장벽</Label>
                    <Textarea
                      value={analysisData.supply_demand.supply.barriers}
                      onChange={(e) => {
                        setAnalysisData({
                          ...analysisData,
                          supply_demand: {
                            ...analysisData.supply_demand,
                            supply: { ...analysisData.supply_demand.supply, barriers: e.target.value }
                          }
                        });
                      }}
                      rows={6}
                      className="resize-y min-h-[120px]"
                      placeholder="자본·기술·규제..."
                    />
                  </div>
                </div>

                <div>
                  <Label>투자 촉발 요인</Label>
                  <Textarea
                    value={analysisData.supply_demand.catalysts}
                    onChange={(e) => updateAnalysis('supply_demand', 'catalysts', e.target.value)}
                    rows={6}
                    className="resize-y min-h-[120px]"
                    placeholder="기술, 정책/규제, 수요 이벤트, 거시 변수..."
                  />
                </div>
              </CardContent>
            </Card>

            {/* 🗺️ 시장 지도 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-primary">🗺️ 시장 지도</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>시장 구조</Label>
                  <Textarea
                    value={analysisData.market_map.structure}
                    onChange={(e) => updateAnalysis('market_map', 'structure', e.target.value)}
                    rows={6}
                    className="resize-y min-h-[120px]"
                    placeholder="점유율 상위 기업, 집중도(HHI)..."
                  />
                </div>
                <div>
                  <Label>경쟁 방식</Label>
                  <Textarea
                    value={analysisData.market_map.competition}
                    onChange={(e) => updateAnalysis('market_map', 'competition', e.target.value)}
                    rows={6}
                    className="resize-y min-h-[120px]"
                    placeholder="가격, 기술, 브랜드, 서비스..."
                  />
                </div>
                <div>
                  <Label>경제적 해자</Label>
                  <Textarea
                    value={analysisData.market_map.moat}
                    onChange={(e) => updateAnalysis('market_map', 'moat', e.target.value)}
                    rows={6}
                    className="resize-y min-h-[120px]"
                    placeholder="특허, 규모의 경제, 네트워크 효과, 전환비용..."
                  />
                </div>
                <div>
                  <Label>산업 생애주기</Label>
                  <Textarea
                    value={analysisData.market_map.lifecycle}
                    onChange={(e) => updateAnalysis('market_map', 'lifecycle', e.target.value)}
                    rows={6}
                    className="resize-y min-h-[120px]"
                    placeholder="도입기/성장기/성숙기/쇠퇴기 중 현재 단계..."
                  />
                </div>
              </CardContent>
            </Card>

            {/* 🏢 대표 대형주 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-primary">🏢 대표 대형주</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={newLeadingStock}
                    onChange={(e) => setNewLeadingStock(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addLeadingStock()}
                    placeholder="종목명 입력 후 Enter"
                  />
                  <Button onClick={addLeadingStock}>추가</Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {leadingStocks.map((stock, index) => (
                    <Badge key={index} variant="secondary" className="text-sm px-3 py-1">
                      {stock}
                      <button
                        onClick={() => removeLeadingStock(stock)}
                        className="ml-2 text-red-500 hover:text-red-700"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 🌟 중소형 유망주 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-primary">🌟 중소형 유망주</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={newEmergingStock}
                    onChange={(e) => setNewEmergingStock(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addEmergingStock()}
                    placeholder="종목명 입력 후 Enter"
                  />
                  <Button onClick={addEmergingStock}>추가</Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {emergingStocks.map((stock, index) => (
                    <Badge key={index} variant="secondary" className="text-sm px-3 py-1">
                      {stock}
                      <button
                        onClick={() => removeEmergingStock(stock)}
                        className="ml-2 text-red-500 hover:text-red-700"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 하단 저장 버튼 */}
            <div className="flex justify-end">
              <Button
                onClick={handleSave}
                disabled={isSaving}
                size="lg"
                className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90"
              >
                {isSaving ? '저장 중...' : '💾 저장'}
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
