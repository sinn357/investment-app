'use client';

import React, { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import InvestmentGoal from '@/components/InvestmentGoal';
import ForbiddenAssets from '@/components/ForbiddenAssets';
import AllocationRange from '@/components/AllocationRange';
import InvestmentPrinciples from '@/components/InvestmentPrinciples';
import InvestmentMethods from '@/components/InvestmentMethods';

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
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">투자 철학 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* 헤더 */}
      <header className="bg-gradient-to-r from-primary/5 to-secondary/5 shadow-sm border-b border-primary/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-foreground">
            💎 투자 철학 & 원칙
          </h1>
          <p className="mt-2 text-muted-foreground">
            모든 투자 결정의 기준점 - 나만의 투자 나침반을 설정하세요
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* 섹션 1: 투자 목표 */}
          <InvestmentGoal
            goal={philosophy.goal}
            onChange={(goal) => setPhilosophy({ ...philosophy, goal })}
          />

          {/* 섹션 2: 금지 자산 */}
          <ForbiddenAssets
            forbiddenAssets={philosophy.forbiddenAssets}
            onChange={(forbiddenAssets) => setPhilosophy({ ...philosophy, forbiddenAssets })}
          />

          {/* 섹션 3: 운용 범위 */}
          <AllocationRange
            allocationRange={philosophy.allocationRange}
            onChange={(allocationRange) => setPhilosophy({ ...philosophy, allocationRange })}
          />

          {/* 섹션 4: 투자 원칙 */}
          <InvestmentPrinciples
            principles={philosophy.principles}
            onChange={(principles) => setPhilosophy({ ...philosophy, principles })}
          />

          {/* 섹션 5: 투자 방법 */}
          <InvestmentMethods
            methods={philosophy.methods}
            onChange={(methods) => setPhilosophy({ ...philosophy, methods })}
          />

          {/* 저장 버튼 */}
          <div className="flex justify-center pt-4">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-8 py-3 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white font-semibold rounded-lg shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? '저장 중...' : '💾 투자 철학 저장'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
