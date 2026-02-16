'use client';

import React, { useState, useEffect, useMemo } from 'react';
import GlassCard from './GlassCard';

interface CategoryData {
  total_amount: number;
  percentage: number;
}

interface PortfolioData {
  by_category: Record<string, CategoryData>;
}

interface AllocationGoal {
  category: string;
  targetPercent: number;
  currentPercent: number;
  color: string;
}

interface AssetAllocationGoalProps {
  portfolioData: PortfolioData | null;
  userId?: number;
}

const CATEGORY_CONFIG = [
  { key: '즉시현금', label: '즉시현금', color: '#10b981', defaultTarget: 20 },
  { key: '예치자산', label: '예치자산', color: '#3b82f6', defaultTarget: 30 },
  { key: '투자자산', label: '투자자산', color: '#f59e0b', defaultTarget: 40 },
  { key: '대체투자', label: '대체투자', color: '#ef4444', defaultTarget: 10 },
];

function AssetAllocationGoal({ portfolioData, userId }: AssetAllocationGoalProps) {
  const [goals, setGoals] = useState<AllocationGoal[]>(() =>
    CATEGORY_CONFIG.map(config => ({
      category: config.key,
      targetPercent: config.defaultTarget,
      currentPercent: 0,
      color: config.color,
    }))
  );

  // localStorage에서 목표 불러오기
  useEffect(() => {
    if (!userId) return;
    const saved = localStorage.getItem(`allocation_goals_${userId}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setGoals(prev => prev.map(goal => {
          const savedGoal = parsed.find((g: AllocationGoal) => g.category === goal.category);
          return savedGoal ? { ...goal, targetPercent: savedGoal.targetPercent } : goal;
        }));
      } catch {}
    }
  }, [userId]);

  // 현재 비중 자동 계산
  useEffect(() => {
    if (!portfolioData?.by_category) return;

    setGoals(prev => prev.map(goal => {
      const categoryData = portfolioData.by_category[goal.category];
      return {
        ...goal,
        currentPercent: categoryData?.percentage || 0,
      };
    }));
  }, [portfolioData]);

  // 목표 변경 시 저장
  const handleTargetChange = (category: string, value: number) => {
    const newGoals = goals.map(goal =>
      goal.category === category ? { ...goal, targetPercent: value } : goal
    );
    setGoals(newGoals);

    if (userId) {
      localStorage.setItem(`allocation_goals_${userId}`, JSON.stringify(newGoals));
    }
  };

  // 상태 판별 로직
  const getStatus = (goal: AllocationGoal) => {
    const diff = goal.currentPercent - goal.targetPercent;
    const tolerance = goal.targetPercent * 0.1; // 10% 허용 범위

    if (goal.currentPercent < goal.targetPercent - tolerance) {
      return {
        text: `미달 (${diff.toFixed(1)}%)`,
        emoji: '⚠️',
        barColor: '#eab308' // 노랑
      };
    }
    if (goal.currentPercent > goal.targetPercent + tolerance) {
      return {
        text: `초과 (+${diff.toFixed(1)}%)`,
        emoji: '🔴',
        barColor: '#ef4444' // 빨강
      };
    }
    return {
      text: `정상 (${diff >= 0 ? '+' : ''}${diff.toFixed(1)}%)`,
      emoji: '✅',
      barColor: '#22c55e' // 초록
    };
  };

  const totalTarget = useMemo(() =>
    goals.reduce((sum, g) => sum + g.targetPercent, 0),
    [goals]
  );

  const totalCurrent = useMemo(() =>
    goals.reduce((sum, g) => sum + g.currentPercent, 0),
    [goals]
  );

  return (
    <GlassCard className="p-6" animate animationDelay={80}>
      <div className="mb-5">
        <h2 className="text-2xl font-bold text-foreground mb-2 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <span className="text-3xl">📊</span> 자산 배분 목표
          </span>
          <span className="text-sm font-normal text-muted-foreground">
            목표 합계: <span className={totalTarget === 100 ? 'text-green-500 font-semibold' : 'text-yellow-500 font-semibold'}>
              {totalTarget}%
            </span>
            {' / '}
            현재: <span className="font-semibold">{totalCurrent.toFixed(1)}%</span>
          </span>
        </h2>
        <p className="text-sm text-muted-foreground">
          대분류별 목표 비중을 설정하면 자동으로 현재 비중과 비교합니다.
        </p>
      </div>

      <div className="space-y-4">
        {goals.map((goal) => {
          const status = getStatus(goal);
          const barWidth = goal.targetPercent > 0
            ? Math.min(100, (goal.currentPercent / goal.targetPercent) * 100)
            : 0;

          return (
            <div
              key={goal.category}
              className="p-4 bg-background rounded-lg border border-primary/20"
            >
              {/* 헤더 */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: goal.color }}
                  />
                  <span className="font-semibold text-foreground">{goal.category}</span>
                </div>
                <span className="text-sm">
                  {status.emoji} {status.text}
                </span>
              </div>

              {/* 입력 및 현재값 */}
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">목표 비중</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={goal.targetPercent}
                      onChange={(e) => handleTargetChange(goal.category, Number(e.target.value))}
                      className="w-20 px-2 py-1 text-sm bg-card border border-primary/20 rounded focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                      min="0"
                      max="100"
                    />
                    <span className="text-sm text-muted-foreground">%</span>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">현재 비중</label>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-foreground">
                      {goal.currentPercent.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* 진행 바 */}
              <div className="relative h-3 bg-muted rounded-full overflow-hidden">
                {/* 목표 라인 (100% 위치) */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-foreground/50 z-10"
                  style={{ left: '100%', transform: 'translateX(-100%)' }}
                />
                {/* 현재 비중 바 */}
                <div
                  className="h-full transition-all duration-500 rounded-full"
                  style={{
                    width: `${barWidth}%`,
                    backgroundColor: status.barColor
                  }}
                />
              </div>

              {/* 바 아래 라벨 */}
              <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                <span>0%</span>
                <span>목표 {goal.targetPercent}%</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 범례 */}
      <div className="mt-6 flex flex-wrap gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-yellow-500"></span> 미달 (목표의 90% 미만)
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-green-500"></span> 정상 (목표 ±10%)
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-red-500"></span> 초과 (목표의 110% 초과)
        </span>
      </div>
    </GlassCard>
  );
}

export default React.memo(AssetAllocationGoal);
