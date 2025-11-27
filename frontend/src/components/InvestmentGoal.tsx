'use client';

import React from 'react';

interface InvestmentGoalProps {
  goal: {
    targetReturn: number;
    riskTolerance: {
      volatility: number;
      maxDrawdown: number;
      maxLeverage: number;
    };
    timeHorizon: {
      start: string;
      target: string;
      years: number;
    };
  };
  onChange: (goal: InvestmentGoalProps['goal']) => void;
}

export default function InvestmentGoal({ goal, onChange }: InvestmentGoalProps) {
  const handleInputChange = (field: string, value: number | string) => {
    const newGoal = { ...goal };
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      if (parent === 'riskTolerance') {
        newGoal.riskTolerance = {
          ...newGoal.riskTolerance,
          [child]: value
        };
      } else if (parent === 'timeHorizon') {
        newGoal.timeHorizon = {
          ...newGoal.timeHorizon,
          [child]: value
        };
      }
    } else if (field === 'targetReturn' && typeof value === 'number') {
      newGoal.targetReturn = value;
    }
    onChange(newGoal);
  };

  // D-Day 계산
  const calculateDDay = () => {
    const today = new Date();
    const targetDate = new Date(goal.timeHorizon.target);
    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const dDay = calculateDDay();

  return (
    <div className="bg-card rounded-lg p-6 border-2 border-primary/20">
      <h2 className="text-xl font-semibold text-card-foreground mb-4 flex items-center">
        <span className="text-2xl mr-2">🎯</span>
        투자 목표
      </h2>

      <div className="grid md:grid-cols-3 gap-6">
        {/* 목표 수익률 */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-muted-foreground">
            목표 수익률 (연%)
          </label>
          <input
            type="number"
            value={goal.targetReturn}
            onChange={(e) => handleInputChange('targetReturn', Number(e.target.value))}
            className="w-full px-3 py-2 bg-background border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
            step="0.1"
          />
          <p className="text-xs text-muted-foreground">
            {goal.targetReturn > 15 ? '⚠️ 고수익 고위험' : goal.targetReturn > 8 ? '✅ 적정 목표' : '🔵 안정적 목표'}
          </p>
        </div>

        {/* 리스크 허용도 */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-muted-foreground">
            리스크 허용도
          </label>
          <div className="space-y-2">
            <div>
              <label className="text-xs text-muted-foreground">변동성 (%) </label>
              <input
                type="number"
                value={goal.riskTolerance.volatility}
                onChange={(e) => handleInputChange('riskTolerance.volatility', Number(e.target.value))}
                className="w-full px-2 py-1 text-sm bg-background border border-primary/20 rounded focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">최대 낙폭 (%)</label>
              <input
                type="number"
                value={goal.riskTolerance.maxDrawdown}
                onChange={(e) => handleInputChange('riskTolerance.maxDrawdown', Number(e.target.value))}
                className="w-full px-2 py-1 text-sm bg-background border border-primary/20 rounded focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">최대 레버리지</label>
              <input
                type="number"
                value={goal.riskTolerance.maxLeverage}
                onChange={(e) => handleInputChange('riskTolerance.maxLeverage', Number(e.target.value))}
                className="w-full px-2 py-1 text-sm bg-background border border-primary/20 rounded focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                step="0.1"
              />
            </div>
          </div>
        </div>

        {/* 투자 기간 */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-muted-foreground">
            투자 기간
          </label>
          <div className="space-y-2">
            <div>
              <label className="text-xs text-muted-foreground">시작일</label>
              <input
                type="date"
                value={goal.timeHorizon.start}
                onChange={(e) => handleInputChange('timeHorizon.start', e.target.value)}
                className="w-full px-2 py-1 text-sm bg-background border border-primary/20 rounded focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">목표일</label>
              <input
                type="date"
                value={goal.timeHorizon.target}
                onChange={(e) => handleInputChange('timeHorizon.target', e.target.value)}
                className="w-full px-2 py-1 text-sm bg-background border border-primary/20 rounded focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
              />
            </div>
            <div className="mt-2 p-2 bg-primary/10 rounded text-center">
              <p className="text-sm font-semibold text-primary">
                {dDay > 0 ? `D-${dDay}` : dDay === 0 ? 'D-Day' : '목표 달성!'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {Math.floor(dDay / 365)}년 {Math.floor((dDay % 365) / 30)}개월
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
