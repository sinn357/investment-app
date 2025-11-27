'use client';

import React, { useState } from 'react';

interface Method {
  phase: string;
  description: string;
  tools: string;
  duration: string;
}

interface InvestmentMethodsProps {
  methods: Method[];
  onChange: (methods: Method[]) => void;
}

const DEFAULT_PHASES = [
  '0. 투자 철학 정립',
  '1. 거시경제 파악',
  '2. 산업별 리스트 작성',
  '3. 개별 분석',
  '4. 트레이드 & 모니터링'
];

export default function InvestmentMethods({ methods, onChange }: InvestmentMethodsProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newMethod, setNewMethod] = useState({
    phase: '0. 투자 철학 정립',
    description: '',
    tools: '',
    duration: ''
  });

  const handleAdd = () => {
    if (!newMethod.description.trim()) {
      alert('설명을 입력해주세요.');
      return;
    }
    onChange([...methods, newMethod]);
    setNewMethod({ phase: '0. 투자 철학 정립', description: '', tools: '', duration: '' });
    setIsAdding(false);
  };

  const handleRemove = (index: number) => {
    onChange(methods.filter((_, i) => i !== index));
  };

  return (
    <div className="bg-card rounded-lg p-6 border-2 border-secondary/20">
      <h2 className="text-xl font-semibold text-card-foreground mb-4 flex items-center">
        <span className="text-2xl mr-2">🗺️</span>
        투자 방법 (프로세스)
      </h2>

      {/* 타임라인 */}
      <div className="relative">
        {methods.length > 0 && (
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary via-secondary to-primary/30"></div>
        )}

        <div className="space-y-4">
          {methods.map((method, index) => (
            <div key={index} className="relative pl-16">
              {/* 타임라인 포인트 */}
              <div className="absolute left-4 top-3 w-5 h-5 rounded-full bg-primary border-4 border-background"></div>

              <div className="p-4 bg-background rounded-lg border border-primary/20 hover:border-primary/40 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-primary">{method.phase}</h3>
                    <p className="text-sm text-foreground mt-1">{method.description}</p>
                  </div>
                  <button
                    onClick={() => handleRemove(index)}
                    className="ml-4 text-red-500 hover:text-red-700 text-sm"
                  >
                    ✕
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-3">
                  {method.tools && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">🛠️ 도구:</span>
                      <span className="text-xs text-foreground">{method.tools}</span>
                    </div>
                  )}
                  {method.duration && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">⏱️ 주기:</span>
                      <span className="text-xs text-foreground">{method.duration}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {methods.length === 0 && !isAdding && (
          <p className="text-sm text-muted-foreground italic text-center py-8">
            투자 프로세스를 단계별로 정의해보세요.
          </p>
        )}
      </div>

      {/* 추가 폼 */}
      {isAdding ? (
        <div className="mt-4 p-4 bg-background rounded-lg border border-primary/20 space-y-3">
          <select
            value={newMethod.phase}
            onChange={(e) => setNewMethod({ ...newMethod, phase: e.target.value })}
            className="w-full px-3 py-2 bg-card border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
          >
            {DEFAULT_PHASES.map(phase => (
              <option key={phase} value={phase}>{phase}</option>
            ))}
          </select>
          <textarea
            placeholder="단계별 설명 (예: 경제 사이클 판단, 주요 지표 확인, 리스크 파악)"
            value={newMethod.description}
            onChange={(e) => setNewMethod({ ...newMethod, description: e.target.value })}
            className="w-full px-3 py-2 bg-card border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground resize-none"
            rows={2}
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="사용 도구 (예: Investment App)"
              value={newMethod.tools}
              onChange={(e) => setNewMethod({ ...newMethod, tools: e.target.value })}
              className="px-3 py-2 bg-card border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
            />
            <input
              type="text"
              placeholder="수행 주기 (예: 매일, 매주, 매월)"
              value={newMethod.duration}
              onChange={(e) => setNewMethod({ ...newMethod, duration: e.target.value })}
              className="px-3 py-2 bg-card border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              className="flex-1 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium transition-colors"
            >
              추가
            </button>
            <button
              onClick={() => setIsAdding(false)}
              className="flex-1 px-4 py-2 bg-muted hover:bg-muted/80 text-muted-foreground rounded-lg font-medium transition-colors"
            >
              취소
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsAdding(true)}
          className="mt-4 w-full px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg font-medium transition-colors border-2 border-dashed border-primary/30"
        >
          + 프로세스 단계 추가
        </button>
      )}
    </div>
  );
}
