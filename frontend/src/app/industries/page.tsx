'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import GlassCard from '@/components/GlassCard';
import EnhancedButton from '@/components/EnhancedButton';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://investment-app-backend-x166.onrender.com';

const handleTextareaTab = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
  if (event.key !== 'Tab') return;
  event.preventDefault();
  const target = event.currentTarget;
  const start = target.selectionStart ?? 0;
  const end = target.selectionEnd ?? 0;
  const value = target.value ?? '';
  const updated = `${value.slice(0, start)}\t${value.slice(end)}`;
  target.value = updated;
  const nextPosition = start + 1;
  target.selectionStart = nextPosition;
  target.selectionEnd = nextPosition;
  target.dispatchEvent(new Event('input', { bubbles: true }));
};

// 6대 산업군 정의
const MAJOR_CATEGORIES = [
  {
    id: 'tech',
    name: '기술·데이터·인프라',
    
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
  const [userId] = useState(1);
  const [expandedMajor, setExpandedMajor] = useState<string | null>(null);
  const [selectedSubIndustry, setSelectedSubIndustry] = useState<{major: string; sub: string} | null>(null);
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [leadingStocks, setLeadingStocks] = useState<string[]>([]);
  const [emergingStocks, setEmergingStocks] = useState<string[]>([]);
  const [newLeadingStock, setNewLeadingStock] = useState('');
  const [newEmergingStock, setNewEmergingStock] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  // 산업 분석 데이터 로드
  const loadAnalysisData = useCallback(async (major: string, sub: string) => {
    try {
      const response = await fetch(
        `${API_URL}/api/industry-analysis?user_id=${userId}&major_category=${encodeURIComponent(major)}&sub_industry=${encodeURIComponent(sub)}`
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
  }, [userId]);

  useEffect(() => {
    if (selectedSubIndustry) {
      loadAnalysisData(selectedSubIndustry.major, selectedSubIndustry.sub);
    }
  }, [selectedSubIndustry, loadAnalysisData]);

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

  const handleMajorClick = (categoryName: string) => {
    if (expandedMajor === categoryName) {
      setExpandedMajor(null);
      setSelectedSubIndustry(null);
    } else {
      setExpandedMajor(categoryName);
      setSelectedSubIndustry(null);
    }
  };

  const handleSubIndustryClick = (majorName: string, subName: string) => {
    if (selectedSubIndustry?.major === majorName && selectedSubIndustry?.sub === subName) {
      setSelectedSubIndustry(null);
      setAnalysisData(null);
    } else {
      setSelectedSubIndustry({ major: majorName, sub: subName });
      setAnalysisData(getEmptyAnalysisData());
    }
  };

  const handleSave = async () => {
    if (!selectedSubIndustry || !analysisData) return;

    setIsSaving(true);
    setSaveMessage('');

    try {
      const response = await fetch(`${API_URL}/api/industry-analysis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          major_category: selectedSubIndustry.major,
          sub_industry: selectedSubIndustry.sub,
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

  const updateAnalysis = (
    section: keyof AnalysisData,
    field: string,
    value: string
  ) => {
    if (!analysisData) return;
    const currentSection = analysisData[section];
    if (typeof currentSection === 'string' || currentSection === undefined) {
      setAnalysisData({
        ...analysisData,
        [section]: value
      });
    } else {
      setAnalysisData({
        ...analysisData,
        [section]: {
          ...(currentSection as object),
          [field]: value
        }
      });
    }
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
        {/* 상단: 6대 산업군 탭 */}
        <div className="pb-4 border-b border-border/50">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
            {MAJOR_CATEGORIES.map((category) => (
              <button
                key={category.id}
                className={`px-3 py-2 rounded-lg text-xs md:text-sm font-medium transition-all ${
                  expandedMajor === category.name
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'bg-muted/50 hover:bg-muted text-foreground'
                }`}
                onClick={() => handleMajorClick(category.name)}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* 하단: 사이드바 + 메인 */}
        {expandedMajor && (
          <div className="space-y-4 md:space-y-0 md:flex md:gap-4">
            {/* 모바일: 소분류 드롭다운 */}
            <div className="md:hidden">
              <Select
                value={selectedSubIndustry?.sub || ''}
                onValueChange={(value) => handleSubIndustryClick(expandedMajor, value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="하위 산업 선택" />
                </SelectTrigger>
                <SelectContent>
                  {MAJOR_CATEGORIES.find(c => c.name === expandedMajor)?.subIndustries.map((subIndustry, index) => (
                    <SelectItem key={index} value={subIndustry}>
                      {subIndustry}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 데스크톱: 소분류 사이드바 */}
            <aside className="hidden md:block w-52 shrink-0 space-y-1">
              {MAJOR_CATEGORIES.find(c => c.name === expandedMajor)?.subIndustries.map((subIndustry, index) => (
                <button
                  key={index}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-all ${
                    selectedSubIndustry?.major === expandedMajor && selectedSubIndustry?.sub === subIndustry
                      ? 'bg-primary/10 text-primary font-medium border-l-2 border-primary'
                      : 'hover:bg-muted text-muted-foreground'
                  }`}
                  onClick={() => handleSubIndustryClick(expandedMajor, subIndustry)}
                >
                  {subIndustry}
                </button>
              ))}
            </aside>

            {/* 오른쪽: 분석 폼 메인 */}
            {selectedSubIndustry && analysisData && (
              <div className="flex-1 space-y-4">
                            {/* 저장 버튼 */}
                            <div className="flex items-center gap-3 justify-end sticky top-0 bg-background/95 backdrop-blur-sm z-10 py-2 border-b">
                              {saveMessage && <span className="text-sm font-medium text-primary animate-fade-in-up">{saveMessage}</span>}
                              <EnhancedButton
                                variant="primary"
                                size="md"
                                onClick={handleSave}
                                loading={isSaving}
                                shimmer
                              >
                                {isSaving ? '저장 중...' : '저장'}
                              </EnhancedButton>
                            </div>

                            {/* 🔬 핵심기술 */}
                            <GlassCard className="p-6 border-l-4 border-blue-500" animationDelay={0}>
                              <h3 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent mb-4 flex items-center gap-2">
                                핵심기술
                              </h3>
                              <div className="space-y-3">
                                <div>
                                  <Label className="text-sm">정의</Label>
                                  <Textarea onKeyDown={handleTextareaTab}
                                    value={analysisData.core_technology.definition}
                                    onChange={(e) => updateAnalysis('core_technology', 'definition', e.target.value)}
                                    rows={4}
                                    className="resize-y min-h-[80px] text-sm"
                                    placeholder="현재 경쟁력을 뒷받침하는 핵심 기술..."
                                  />
                                </div>
                                <div>
                                  <Label className="text-sm">기술 단계</Label>
                                  <Select
                                    value={analysisData.core_technology.stage}
                                    onValueChange={(value) => updateAnalysis('core_technology', 'stage', value)}
                                  >
                                    <SelectTrigger className="text-sm">
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
                                  <Label className="text-sm">혁신 경로</Label>
                                  <Textarea onKeyDown={handleTextareaTab}
                                    value={analysisData.core_technology.innovation_path}
                                    onChange={(e) => updateAnalysis('core_technology', 'innovation_path', e.target.value)}
                                    rows={4}
                                    className="resize-y min-h-[80px] text-sm"
                                    placeholder="다음 세대 기술 및 패러다임 전환 시점..."
                                  />
                                </div>
                              </div>
                            </GlassCard>

                            {/* 💰 거시경제 영향 */}
                            <GlassCard className="p-6 border-l-4 border-green-500" animationDelay={100}>
                              <h3 className="text-lg font-bold bg-gradient-to-r from-green-600 to-emerald-400 bg-clip-text text-transparent mb-4 flex items-center gap-2">
                                거시경제 영향
                              </h3>
                              <div className="space-y-3">
                                <div>
                                  <Label className="text-sm">금리/유동성</Label>
                                  <Textarea onKeyDown={handleTextareaTab}
                                    value={analysisData.macro_impact.interest_rate}
                                    onChange={(e) => updateAnalysis('macro_impact', 'interest_rate', e.target.value)}
                                    rows={4}
                                    className="resize-y min-h-[80px] text-sm"
                                    placeholder="Capex 의존도, 밸류에이션 민감도..."
                                  />
                                </div>
                                <div>
                                  <Label className="text-sm">환율</Label>
                                  <Textarea onKeyDown={handleTextareaTab}
                                    value={analysisData.macro_impact.exchange_rate}
                                    onChange={(e) => updateAnalysis('macro_impact', 'exchange_rate', e.target.value)}
                                    rows={4}
                                    className="resize-y min-h-[80px] text-sm"
                                    placeholder="수출입 기업, 원재료 비용..."
                                  />
                                </div>
                                <div>
                                  <Label className="text-sm">원자재</Label>
                                  <Textarea onKeyDown={handleTextareaTab}
                                    value={analysisData.macro_impact.commodities}
                                    onChange={(e) => updateAnalysis('macro_impact', 'commodities', e.target.value)}
                                    rows={4}
                                    className="resize-y min-h-[80px] text-sm"
                                    placeholder="가격 변동이 원가·마진에 미치는 영향..."
                                  />
                                </div>
                                <div>
                                  <Label className="text-sm">정책/규제</Label>
                                  <Textarea onKeyDown={handleTextareaTab}
                                    value={analysisData.macro_impact.policy}
                                    onChange={(e) => updateAnalysis('macro_impact', 'policy', e.target.value)}
                                    rows={4}
                                    className="resize-y min-h-[80px] text-sm"
                                    placeholder="정부 보조금, 규제 강화, 무역정책..."
                                  />
                                </div>
                              </div>
                            </GlassCard>

                            {/* 성장동력/KPI */}
                            <GlassCard className="p-6 border-l-4 border-purple-500" animationDelay={200}>
                              <h3 className="text-lg font-bold bg-gradient-to-r from-purple-600 to-violet-400 bg-clip-text text-transparent mb-4 flex items-center gap-2">
                                성장동력/KPI
                              </h3>
                              <div className="space-y-3">
                                <div>
                                  <Label className="text-sm">내부 요인</Label>
                                  <Textarea onKeyDown={handleTextareaTab}
                                    value={analysisData.growth_drivers.internal}
                                    onChange={(e) => updateAnalysis('growth_drivers', 'internal', e.target.value)}
                                    rows={4}
                                    className="resize-y min-h-[80px] text-sm"
                                    placeholder="기술 혁신, 생산성 향상, 고객 락인, 네트워크 효과..."
                                  />
                                </div>
                                <div>
                                  <Label className="text-sm">외부 요인</Label>
                                  <Textarea onKeyDown={handleTextareaTab}
                                    value={analysisData.growth_drivers.external}
                                    onChange={(e) => updateAnalysis('growth_drivers', 'external', e.target.value)}
                                    rows={4}
                                    className="resize-y min-h-[80px] text-sm"
                                    placeholder="규제 완화, 정부 지원, 글로벌 수요, 소비 트렌드, 신흥시장..."
                                  />
                                </div>
                                <div>
                                  <Label className="text-sm">핵심 KPI</Label>
                                  <Textarea onKeyDown={handleTextareaTab}
                                    value={analysisData.growth_drivers.kpi}
                                    onChange={(e) => updateAnalysis('growth_drivers', 'kpi', e.target.value)}
                                    rows={4}
                                    className="resize-y min-h-[80px] text-sm"
                                    placeholder="생산량, ASP, 가동률, 점유율, ARR/NRR, Take Rate 등..."
                                  />
                                </div>
                              </div>
                            </GlassCard>

                            {/* 🔗 가치사슬 */}
                            <GlassCard className="p-6 border-l-4 border-orange-500" animationDelay={300}>
                              <h3 className="text-lg font-bold bg-gradient-to-r from-orange-600 to-amber-400 bg-clip-text text-transparent mb-4 flex items-center gap-2">
                                <span className="text-2xl">🔗</span> 가치사슬
                              </h3>
                              <div className="space-y-3">
                                <div>
                                  <Label className="text-sm">단계별 흐름</Label>
                                  <Textarea onKeyDown={handleTextareaTab}
                                    value={analysisData.value_chain.flow}
                                    onChange={(e) => updateAnalysis('value_chain', 'flow', e.target.value)}
                                    rows={4}
                                    className="resize-y min-h-[80px] text-sm"
                                    placeholder="원재료 → 중간재 → 장비/설비 → 완제품 → 유통 → 최종 수요..."
                                  />
                                </div>
                                <div>
                                  <Label className="text-sm">이익풀 분석</Label>
                                  <Textarea onKeyDown={handleTextareaTab}
                                    value={analysisData.value_chain.profit_pool}
                                    onChange={(e) => updateAnalysis('value_chain', 'profit_pool', e.target.value)}
                                    rows={4}
                                    className="resize-y min-h-[80px] text-sm"
                                    placeholder="어느 단계에서 마진이 가장 큰가..."
                                  />
                                </div>
                                <div>
                                  <Label className="text-sm">병목 파악</Label>
                                  <Textarea onKeyDown={handleTextareaTab}
                                    value={analysisData.value_chain.bottleneck}
                                    onChange={(e) => updateAnalysis('value_chain', 'bottleneck', e.target.value)}
                                    rows={4}
                                    className="resize-y min-h-[80px] text-sm"
                                    placeholder="공급이 제한된 단계, 필수 기술·소재..."
                                  />
                                </div>
                              </div>
                            </GlassCard>

                            {/* 📊 공급/수요 요인 */}
                            <GlassCard className="p-6 border-l-4 border-red-500" animationDelay={400}>
                              <h3 className="text-lg font-bold bg-gradient-to-r from-red-600 to-rose-400 bg-clip-text text-transparent mb-4 flex items-center gap-2">
                                공급/수요 요인
                              </h3>
                              <div className="space-y-4">
                                <div className="space-y-3">
                                  <h3 className="font-semibold">수요</h3>
                                  <div>
                                    <Label className="text-sm">최종 수요처</Label>
                                    <Textarea onKeyDown={handleTextareaTab}
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
                                      rows={4}
                                      className="resize-y min-h-[80px] text-sm"
                                      placeholder="소비자/기업/정부..."
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-sm">장기 성장 동력</Label>
                                    <Textarea onKeyDown={handleTextareaTab}
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
                                      rows={4}
                                      className="resize-y min-h-[80px] text-sm"
                                      placeholder="인구, 소득, 기술, 정책..."
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-sm">수요 민감도</Label>
                                    <Textarea onKeyDown={handleTextareaTab}
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
                                      rows={4}
                                      className="resize-y min-h-[80px] text-sm"
                                      placeholder="경기순환형 vs 구조적 성장형..."
                                    />
                                  </div>
                                </div>

                                <div className="space-y-3">
                                  <h3 className="font-semibold">공급</h3>
                                  <div>
                                    <Label className="text-sm">주요 플레이어</Label>
                                    <Textarea onKeyDown={handleTextareaTab}
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
                                      rows={4}
                                      className="resize-y min-h-[80px] text-sm"
                                      placeholder="국가, 기업, 집중도..."
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-sm">생산능력</Label>
                                    <Textarea onKeyDown={handleTextareaTab}
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
                                      rows={4}
                                      className="resize-y min-h-[80px] text-sm"
                                      placeholder="증설 계획, 리드타임..."
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-sm">진입장벽</Label>
                                    <Textarea onKeyDown={handleTextareaTab}
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
                                      rows={4}
                                      className="resize-y min-h-[80px] text-sm"
                                      placeholder="자본·기술·규제..."
                                    />
                                  </div>
                                </div>

                                <div>
                                  <Label className="text-sm">투자 촉발 요인</Label>
                                  <Textarea onKeyDown={handleTextareaTab}
                                    value={analysisData.supply_demand.catalysts}
                                    onChange={(e) => updateAnalysis('supply_demand', 'catalysts', e.target.value)}
                                    rows={4}
                                    className="resize-y min-h-[80px] text-sm"
                                    placeholder="기술, 정책/규제, 수요 이벤트, 거시 변수..."
                                  />
                                </div>
                              </div>
                            </GlassCard>

                            {/* 🗺️ 시장 지도 */}
                            <GlassCard className="p-6 border-l-4 border-teal-500" animationDelay={500}>
                              <h3 className="text-lg font-bold bg-gradient-to-r from-teal-600 to-cyan-400 bg-clip-text text-transparent mb-4 flex items-center gap-2">
                                시장 지도
                              </h3>
                              <div className="space-y-3">
                                <div>
                                  <Label className="text-sm">시장 구조</Label>
                                  <Textarea onKeyDown={handleTextareaTab}
                                    value={analysisData.market_map.structure}
                                    onChange={(e) => updateAnalysis('market_map', 'structure', e.target.value)}
                                    rows={4}
                                    className="resize-y min-h-[80px] text-sm"
                                    placeholder="점유율 상위 기업, 집중도(HHI)..."
                                  />
                                </div>
                                <div>
                                  <Label className="text-sm">경쟁 방식</Label>
                                  <Textarea onKeyDown={handleTextareaTab}
                                    value={analysisData.market_map.competition}
                                    onChange={(e) => updateAnalysis('market_map', 'competition', e.target.value)}
                                    rows={4}
                                    className="resize-y min-h-[80px] text-sm"
                                    placeholder="가격, 기술, 브랜드, 서비스..."
                                  />
                                </div>
                                <div>
                                  <Label className="text-sm">경제적 해자</Label>
                                  <Textarea onKeyDown={handleTextareaTab}
                                    value={analysisData.market_map.moat}
                                    onChange={(e) => updateAnalysis('market_map', 'moat', e.target.value)}
                                    rows={4}
                                    className="resize-y min-h-[80px] text-sm"
                                    placeholder="특허, 규모의 경제, 네트워크 효과, 전환비용..."
                                  />
                                </div>
                                <div>
                                  <Label className="text-sm">산업 생애주기</Label>
                                  <Textarea onKeyDown={handleTextareaTab}
                                    value={analysisData.market_map.lifecycle}
                                    onChange={(e) => updateAnalysis('market_map', 'lifecycle', e.target.value)}
                                    rows={4}
                                    className="resize-y min-h-[80px] text-sm"
                                    placeholder="도입기/성장기/성숙기/쇠퇴기 중 현재 단계..."
                                  />
                                </div>
                              </div>
                            </GlassCard>

                            {/* 🏢 대표 대형주 */}
                            <GlassCard className="p-6 border-l-4 border-indigo-500" animationDelay={600}>
                              <h3 className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-blue-400 bg-clip-text text-transparent mb-4 flex items-center gap-2">
                                대표 대형주
                              </h3>
                              <div className="space-y-3">
                                <div className="flex gap-2">
                                  <Input
                                    value={newLeadingStock}
                                    onChange={(e) => setNewLeadingStock(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && addLeadingStock()}
                                    placeholder="종목명 입력 후 Enter"
                                    className="text-sm"
                                  />
                                  <Button onClick={addLeadingStock} size="sm">추가</Button>
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
                              </div>
                            </GlassCard>

                            {/* 🌟 중소형 유망주 */}
                            <GlassCard className="p-6 border-l-4 border-yellow-500" animationDelay={700}>
                              <h3 className="text-lg font-bold bg-gradient-to-r from-yellow-600 to-amber-400 bg-clip-text text-transparent mb-4 flex items-center gap-2">
                                <span className="text-2xl">🌟</span> 중소형 유망주
                              </h3>
                              <div className="space-y-3">
                                <div className="flex gap-2">
                                  <Input
                                    value={newEmergingStock}
                                    onChange={(e) => setNewEmergingStock(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && addEmergingStock()}
                                    placeholder="종목명 입력 후 Enter"
                                    className="text-sm"
                                  />
                                  <Button onClick={addEmergingStock} size="sm">추가</Button>
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
                              </div>
                            </GlassCard>

                            {/* 하단 저장 버튼 */}
                            <div className="flex justify-end sticky bottom-0 bg-background/95 backdrop-blur-sm py-2 border-t">
                              <Button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90"
                              >
                                {isSaving ? '저장 중...' : '저장'}
                              </Button>
                            </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
