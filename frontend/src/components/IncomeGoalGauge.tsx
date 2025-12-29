'use client';

import React, { useState } from 'react';
import GlassCard from './GlassCard';
import EnhancedButton from './EnhancedButton';

interface IncomeGoalGaugeProps {
  incomeData: Array<{
    category: string;
    subcategory: string;
    total_amount: number;
  }>;
  goals: Record<string, Record<string, number>>;
  onSaveGoals: (goals: Record<string, Record<string, number>>) => void;
}

const incomeCategories: Record<string, string[]> = {
  "근로소득": ["급여", "보너스", "부업"],
  "사업소득": ["사업수익", "프리랜서"],
  "투자소득": ["주식", "ETF", "채권", "암호화폐", "부동산", "이자", "배당금", "기타"],
  "기타소득": ["용돈", "선물", "환급"]
};

export default function IncomeGoalGauge({ incomeData, goals, onSaveGoals }: IncomeGoalGaugeProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [editingGoals, setEditingGoals] = useState<Record<string, Record<string, number>>>(goals);
  const [editMode, setEditMode] = useState(false);

  // 대분류별 수입 집계
  const getCategoryIncome = (category: string): number => {
    return incomeData
      .filter(item => item.category === category)
      .reduce((sum, item) => sum + Number(item.total_amount), 0);
  };

  // 소분류별 수입 집계
  const getSubcategoryIncome = (category: string, subcategory: string): number => {
    const item = incomeData.find(
      inc => inc.category === category && inc.subcategory === subcategory
    );
    return item ? Number(item.total_amount) : 0;
  };

  // 목표 대비 진행률 계산
  const getProgressRate = (current: number, goal: number): number => {
    return goal > 0 ? Math.min((current / goal) * 100, 100) : 0;
  };

  // 진행률에 따른 색상
  const getProgressColor = (rate: number): string => {
    if (rate >= 100) return 'bg-green-500';
    if (rate >= 75) return 'bg-blue-500';
    if (rate >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  // 목표 저장
  const handleSaveGoals = () => {
    onSaveGoals(editingGoals);
    setEditMode(false);
  };

  // 목표 입력 핸들러
  const handleGoalChange = (category: string, subcategory: string, value: string) => {
    const numValue = value === '' ? 0 : parseInt(value);
    setEditingGoals(prev => ({
      ...prev,
      [category]: {
        ...(prev[category] || {}),
        [subcategory]: numValue
      }
    }));
  };

  return (
    <GlassCard className="p-6" glow>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent">💰 목표 수입 게이지</h2>
        <div className="flex gap-2">
          {editMode ? (
            <>
              <EnhancedButton
                variant="primary"
                size="sm"
                onClick={handleSaveGoals}
                shimmer
              >
                저장
              </EnhancedButton>
              <EnhancedButton
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditMode(false);
                  setEditingGoals(goals);
                }}
              >
                취소
              </EnhancedButton>
            </>
          ) : (
            <EnhancedButton
              variant="secondary"
              size="sm"
              onClick={() => setEditMode(true)}
            >
              목표 설정
            </EnhancedButton>
          )}
          <EnhancedButton
            variant="outline"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? '접기' : '펼치기'}
          </EnhancedButton>
        </div>
      </div>

      {/* 대분류 게이지 */}
      <div className="space-y-4">
        {Object.keys(incomeCategories).map(category => {
          const totalIncome = getCategoryIncome(category);
          const totalGoal = Object.values(editingGoals[category] || {}).reduce((sum, val) => sum + val, 0);
          const progressRate = getProgressRate(totalIncome, totalGoal);
          const progressColor = getProgressColor(progressRate);

          return (
            <div key={category} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold text-gray-900">{category}</h3>
                <div className="text-sm">
                  <span className="font-bold">{totalIncome.toLocaleString()}원</span>
                  <span className="text-gray-500"> / {totalGoal.toLocaleString()}원</span>
                </div>
              </div>

              {/* 진행률 게이지 */}
              <div className="w-full bg-gray-200 rounded-full h-6 mb-3">
                <div
                  className={`h-6 rounded-full ${progressColor} transition-all duration-500 flex items-center justify-center`}
                  style={{ width: `${Math.max(progressRate, 5)}%` }}
                >
                  <span className="text-xs font-bold text-white">
                    {progressRate.toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* 소분류 상세 */}
              {showDetails && (
                <div className="mt-4 space-y-2 pl-4 border-l-2 border-gray-200">
                  {incomeCategories[category].map(subcategory => {
                    const subcategoryIncome = getSubcategoryIncome(category, subcategory);
                    const subcategoryGoal = (editingGoals[category]?.[subcategory] || 0);
                    const subProgressRate = getProgressRate(subcategoryIncome, subcategoryGoal);
                    const subProgressColor = getProgressColor(subProgressRate);

                    // 수입이 없고 목표도 없으면 표시하지 않음
                    if (subcategoryIncome === 0 && subcategoryGoal === 0 && !editMode) return null;

                    return (
                      <div key={subcategory} className="text-sm">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-gray-700">{subcategory}</span>
                          {editMode ? (
                            <input
                              type="number"
                              value={subcategoryGoal || ''}
                              onChange={(e) => handleGoalChange(category, subcategory, e.target.value)}
                              placeholder="목표 금액"
                              className="w-32 px-2 py-1 border border-gray-300 rounded text-right"
                            />
                          ) : (
                            <div>
                              <span className="font-semibold">{subcategoryIncome.toLocaleString()}원</span>
                              <span className="text-gray-500"> / {subcategoryGoal.toLocaleString()}원</span>
                            </div>
                          )}
                        </div>
                        {!editMode && subcategoryGoal > 0 && (
                          <div className="w-full bg-gray-200 rounded-full h-4">
                            <div
                              className={`h-4 rounded-full ${subProgressColor} transition-all duration-500`}
                              style={{ width: `${Math.max(subProgressRate, 3)}%` }}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
}
