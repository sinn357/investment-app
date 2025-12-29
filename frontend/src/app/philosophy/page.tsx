'use client';

import React, { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import InvestmentGoal from '@/components/InvestmentGoal';
import ForbiddenAssets from '@/components/ForbiddenAssets';
import AllocationRange from '@/components/AllocationRange';
import InvestmentPrinciples from '@/components/InvestmentPrinciples';
import InvestmentMethods from '@/components/InvestmentMethods';
import GlassCard from '@/components/GlassCard';
import EnhancedButton from '@/components/EnhancedButton';

// TypeScript interfaces
interface InvestmentPhilosophy {
  goal: {
    targetReturn: number;
    riskTolerance: { volatility: number; maxDrawdown: number; maxLeverage: number };
    timeHorizon: { start: string; target: string; years: number };
  };
  forbiddenAssets: { name: string; reason: string; icon: string }[];
  allocationRange: { category: string; min: number; max: number; current: number; color: string }[];
  principles: { category: string; rule: string; enabled: boolean; note: string }[];
  methods: { phase: string; description: string; tools: string; duration: string }[];
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://investment-app-backend-x166.onrender.com';

export default function Philosophy() {
  const [userId] = useState(1); // 임시 user_id (실제는 인증 시스템 연동)
  const [philosophy, setPhilosophy] = useState<InvestmentPhilosophy>({
    goal: {
      targetReturn: 10,
      riskTolerance: { volatility: 15, maxDrawdown: 20, maxLeverage: 1 },
      timeHorizon: { start: '2025-01-01', target: '2030-12-31', years: 5 }
    },
    forbiddenAssets: [],
    allocationRange: [],
    principles: [],
    methods: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // 데이터 로드
  useEffect(() => {
    const fetchPhilosophy = async () => {
      try {
        const response = await fetch(`${API_URL}/api/investment-philosophy?user_id=${userId}`);
        const result = await response.json();

        if (result.status === 'success' && result.data) {
          setPhilosophy({
            goal: result.data.goal || philosophy.goal,
            forbiddenAssets: result.data.forbidden_assets || [],
            allocationRange: result.data.allocation_range || [],
            principles: result.data.principles || [],
            methods: result.data.methods || []
          });
        }
      } catch (error) {
        console.error('투자 철학 로드 실패:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPhilosophy();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // 저장 함수
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`${API_URL}/api/investment-philosophy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          goal: philosophy.goal,
          forbiddenAssets: philosophy.forbiddenAssets,
          allocationRange: philosophy.allocationRange,
          principles: philosophy.principles,
          methods: philosophy.methods
        })
      });

      const result = await response.json();

      if (result.status === 'success') {
        alert('✅ 투자 철학이 저장되었습니다!');
      } else {
        alert('❌ 저장 실패: ' + result.message);
      }
    } catch (error) {
      console.error('저장 오류:', error);
      alert('❌ 저장 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <GlassCard className="p-8 text-center" animate glow>
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="mt-6 text-lg font-medium text-foreground">투자 철학 불러오는 중...</p>
          <p className="mt-2 text-sm text-muted-foreground">잠시만 기다려주세요</p>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* 헤더 */}
      <header className="relative bg-gradient-to-r from-primary/10 to-secondary/10 shadow-sm border-b border-primary/20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 animate-gradient"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary via-yellow-400 to-secondary bg-clip-text text-transparent mb-4 fade-in-down">
            💎 투자 철학 & 원칙
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-3xl fade-in-up">
            모든 투자 결정의 기준점 - 나만의 투자 나침반을 설정하세요
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* 2단 그리드 레이아웃 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
          {/* 왼쪽 컬럼 */}
          <div className="space-y-8">
            {/* 섹션 1: 투자 목표 */}
            <GlassCard className="p-6" animationDelay={0}>
              <InvestmentGoal
                goal={philosophy.goal}
                onChange={(goal) => setPhilosophy({ ...philosophy, goal })}
              />
            </GlassCard>

            {/* 섹션 2: 금지 자산 */}
            <GlassCard className="p-6" animationDelay={100}>
              <ForbiddenAssets
                forbiddenAssets={philosophy.forbiddenAssets}
                onChange={(forbiddenAssets) => setPhilosophy({ ...philosophy, forbiddenAssets })}
              />
            </GlassCard>

            {/* 섹션 3: 운용 범위 */}
            <GlassCard className="p-6" animationDelay={200}>
              <AllocationRange
                allocationRange={philosophy.allocationRange}
                onChange={(allocationRange) => setPhilosophy({ ...philosophy, allocationRange })}
              />
            </GlassCard>
          </div>

          {/* 오른쪽 컬럼 */}
          <div className="space-y-8">
            {/* 섹션 4: 투자 원칙 */}
            <GlassCard className="p-6" animationDelay={300}>
              <InvestmentPrinciples
                principles={philosophy.principles}
                onChange={(principles) => setPhilosophy({ ...philosophy, principles })}
              />
            </GlassCard>

            {/* 섹션 5: 투자 방법 */}
            <GlassCard className="p-6" animationDelay={400}>
              <InvestmentMethods
                methods={philosophy.methods}
                onChange={(methods) => setPhilosophy({ ...philosophy, methods })}
              />
            </GlassCard>
          </div>
        </div>

        {/* 저장 버튼 */}
        <div className="flex justify-center fade-in-up" style={{ animationDelay: '500ms' }}>
          <EnhancedButton
            variant="primary"
            size="lg"
            onClick={handleSave}
            disabled={isSaving}
            loading={isSaving}
            shimmer
          >
            {isSaving ? '저장 중...' : '💾 투자 철학 저장'}
          </EnhancedButton>
        </div>
      </main>
    </div>
  );
}
