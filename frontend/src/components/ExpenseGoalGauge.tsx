'use client';

import React, { useState } from 'react';
import GlassCard from './GlassCard';
import EnhancedButton from './EnhancedButton';

interface ExpenseGoalGaugeProps {
  expenseData: Array<{
    category: string;
    subcategory: string;
    total_amount: number;
  }>;
  goals: Record<string, Record<string, number>>;
  onSaveGoals: (goals: Record<string, Record<string, number>>) => void;
}

const expenseCategories: Record<string, string[]> = {
  "생활": ["유틸리티", "생필품", "교통", "구독", "요리", "외식", "세금", "카드대금", "집", "미용"],
  "건강": ["식단", "보험", "영양제", "검진", "탈모"],
  "사회": ["대금지출", "경조사", "가족지원"],
  "여가": ["자유시간", "스포츠", "여행"],
  "쇼핑": ["의류", "전자기기", "시계", "차", "사치품"],
  "기타": ["기타"]
};

export default function ExpenseGoalGauge({ expenseData, goals, onSaveGoals }: ExpenseGoalGaugeProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [editingGoals, setEditingGoals] = useState<Record<string, Record<string, number>>>(goals);
  const [editMode, setEditMode] = useState(false);

  // 대분류별 지출 집계
  const getCategoryExpense = (category: string): number => {
    return expenseData
      .filter(item => item.category === category)
      .reduce((sum, item) => sum + Number(item.total_amount), 0);
  };

  // 소분류별 지출 집계
  const getSubcategoryExpense = (category: string, subcategory: string): number => {
    const item = expenseData.find(
      exp => exp.category === category && exp.subcategory === subcategory
    );
    return item ? Number(item.total_amount) : 0;
  };

  // 목표 대비 진행률 계산
  const getProgressRate = (current: number, goal: number): number => {
    return goal > 0 ? Math.min((current / goal) * 100, 100) : 0;
  };

  // 진행률에 따른 색상
  const getProgressColor = (rate: number): string => {
    if (rate >= 100) return 'bg-red-500';
    if (rate >= 75) return 'bg-yellow-500';
    if (rate >= 50) return 'bg-blue-500';
    return 'bg-green-500';
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
        <h2 className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">💸 목표 지출 게이지</h2>
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
        {Object.keys(expenseCategories).map(category => {
          const totalExpense = getCategoryExpense(category);
          const totalGoal = Object.values(editingGoals[category] || {}).reduce((sum, val) => sum + val, 0);
          const progressRate = getProgressRate(totalExpense, totalGoal);
          const progressColor = getProgressColor(progressRate);

          return (
            <div key={category} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold text-gray-900">{category}</h3>
                <div className="text-sm">
                  <span className="font-bold">{totalExpense.toLocaleString()}원</span>
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
                  {expenseCategories[category].map(subcategory => {
                    const subcategoryExpense = getSubcategoryExpense(category, subcategory);
                    const subcategoryGoal = (editingGoals[category]?.[subcategory] || 0);
                    const subProgressRate = getProgressRate(subcategoryExpense, subcategoryGoal);
                    const subProgressColor = getProgressColor(subProgressRate);

                    // 지출이 없고 목표도 없으면 표시하지 않음
                    if (subcategoryExpense === 0 && subcategoryGoal === 0 && !editMode) return null;

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
                              <span className="font-semibold">{subcategoryExpense.toLocaleString()}원</span>
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
