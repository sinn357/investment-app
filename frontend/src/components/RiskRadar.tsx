'use client';

import React, { useState } from 'react';

interface Risk {
  category: string;
  level: number; // 1-5
  description: string;
}

interface RiskRadarProps {
  risks: Risk[];
  onChange: (risks: Risk[]) => void;
}

const RISK_CATEGORIES = ['지정학적', '금융시장', '경기침체', '인플레이션', '정책'];

const RISK_LEVELS = [
  { value: 1, label: '매우 낮음', color: 'bg-green-500' },
  { value: 2, label: '낮음', color: 'bg-green-400' },
  { value: 3, label: '보통', color: 'bg-yellow-500' },
  { value: 4, label: '높음', color: 'bg-orange-500' },
  { value: 5, label: '매우 높음', color: 'bg-red-500' }
];

export default function RiskRadar({ risks, onChange }: RiskRadarProps) {
  const [editingCategory, setEditingCategory] = useState<string | null>(null);

  const getRiskForCategory = (category: string): Risk => {
    return (
      risks.find((r) => r.category === category) || {
        category,
        level: 3,
        description: ''
      }
    );
  };

  const handleUpdateRisk = (category: string, updates: Partial<Risk>) => {
    const existingIndex = risks.findIndex((r) => r.category === category);
    const newRisks = [...risks];

    if (existingIndex >= 0) {
      newRisks[existingIndex] = { ...newRisks[existingIndex], ...updates };
    } else {
      newRisks.push({
        category,
        level: updates.level || 3,
        description: updates.description || ''
      });
    }

    onChange(newRisks);
  };

  const getLevelInfo = (level: number) => {
    return RISK_LEVELS.find((l) => l.value === level) || RISK_LEVELS[2];
  };

  return (
    <div className="bg-card rounded-lg p-6 border-2 border-primary/20">
      <h2 className="text-xl font-semibold text-card-foreground mb-4 flex items-center">
        <span className="text-2xl mr-2">⚠️</span>
        리스크 레이더
      </h2>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {RISK_CATEGORIES.map((category) => {
          const risk = getRiskForCategory(category);
          const levelInfo = getLevelInfo(risk.level);
          const isEditing = editingCategory === category;

          return (
            <div
              key={category}
              className="p-4 bg-background rounded-lg border border-primary/20 hover:border-primary/40 transition-colors"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-foreground">{category}</h3>
                <button
                  onClick={() => setEditingCategory(isEditing ? null : category)}
                  className="text-xs text-primary hover:text-primary/80 transition-colors"
                >
                  {isEditing ? '완료' : '수정'}
                </button>
              </div>

              {isEditing ? (
                <div className="space-y-3">
                  {/* 레벨 선택 */}
                  <div>
                    <label className="text-xs text-muted-foreground block mb-2">위험 수준</label>
                    <div className="flex gap-1">
                      {RISK_LEVELS.map((level) => (
                        <button
                          key={level.value}
                          onClick={() => handleUpdateRisk(category, { level: level.value })}
                          className={`flex-1 h-8 rounded ${level.color} ${
                            risk.level === level.value
                              ? 'opacity-100 ring-2 ring-foreground'
                              : 'opacity-40 hover:opacity-70'
                          } transition-all`}
                          title={level.label}
                        />
                      ))}
                    </div>
                  </div>

                  {/* 설명 입력 */}
                  <textarea
                    value={risk.description}
                    onChange={(e) => handleUpdateRisk(category, { description: e.target.value })}
                    placeholder="리스크 상세 설명..."
                    rows={3}
                    className="w-full px-3 py-2 text-sm bg-card border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground resize-none"
                  />
                </div>
              ) : (
                <div>
                  {/* 레벨 표시 바 */}
                  <div className="mb-2">
                    <div className="flex gap-1 mb-1">
                      {RISK_LEVELS.map((level) => (
                        <div
                          key={level.value}
                          className={`flex-1 h-2 rounded ${level.color} ${
                            risk.level >= level.value ? 'opacity-100' : 'opacity-20'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-sm font-medium" style={{ color: levelInfo.color.replace('bg-', '') }}>
                      {levelInfo.label} ({risk.level}/5)
                    </p>
                  </div>

                  {/* 설명 표시 */}
                  {risk.description ? (
                    <p className="text-sm text-muted-foreground">{risk.description}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground/50 italic">설명 없음</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4 p-3 bg-primary/5 rounded-lg border border-primary/20">
        <p className="text-xs text-muted-foreground">
          💡 <strong>사용 가이드:</strong> 각 리스크 카테고리별로 현재 위험 수준을 평가하고, 근거를 기록하세요.
          나중에 돌아보면 자신의 리스크 인식 변화를 추적할 수 있습니다.
        </p>
      </div>
    </div>
  );
}
