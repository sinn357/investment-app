'use client';

import React, { useState } from 'react';

interface Principle {
  category: string;
  rule: string;
  enabled: boolean;
  note: string;
}

interface InvestmentPrinciplesProps {
  principles: Principle[];
  onChange: (principles: Principle[]) => void;
}

const CATEGORY_OPTIONS = ['리스크 관리', '매매 규칙', '심리 통제', '포트폴리오 관리', '기타'];

export default function InvestmentPrinciples({ principles, onChange }: InvestmentPrinciplesProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newPrinciple, setNewPrinciple] = useState({
    category: '리스크 관리',
    rule: '',
    enabled: true,
    note: ''
  });

  const handleAdd = () => {
    if (!newPrinciple.rule.trim()) {
      alert('원칙 내용을 입력해주세요.');
      return;
    }
    onChange([...principles, newPrinciple]);
    setNewPrinciple({ category: '리스크 관리', rule: '', enabled: true, note: '' });
    setIsAdding(false);
  };

  const handleRemove = (index: number) => {
    onChange(principles.filter((_, i) => i !== index));
  };

  const handleToggle = (index: number) => {
    const newPrinciples = [...principles];
    newPrinciples[index].enabled = !newPrinciples[index].enabled;
    onChange(newPrinciples);
  };

  const groupByCategory = () => {
    const grouped: Record<string, Principle[]> = {};
    principles.forEach(p => {
      if (!grouped[p.category]) grouped[p.category] = [];
      grouped[p.category].push(p);
    });
    return grouped;
  };

  const grouped = groupByCategory();

  return (
    <div className="bg-card rounded-lg p-6 border-2 border-primary/20">
      <h2 className="text-xl font-semibold text-card-foreground mb-4 flex items-center">
        <span className="text-2xl mr-2">⚖️</span>
        투자 원칙
      </h2>

      {/* 카테고리별 그룹 */}
      <div className="space-y-4">
        {Object.entries(grouped).map(([category, items]) => (
          <div key={category}>
            <h3 className="text-sm font-semibold text-muted-foreground mb-2">{category}</h3>
            <div className="space-y-2">
              {items.map((principle) => {
                const globalIndex = principles.findIndex(p => p === principle);
                return (
                  <div
                    key={globalIndex}
                    className={`p-3 rounded-lg border transition-all ${
                      principle.enabled
                        ? 'bg-background border-primary/20'
                        : 'bg-muted/50 border-muted opacity-60'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={principle.enabled}
                        onChange={() => handleToggle(globalIndex)}
                        className="mt-1 w-4 h-4 text-primary bg-background border-primary/30 rounded focus:ring-primary focus:ring-2"
                      />
                      <div className="flex-1">
                        <p className={`font-medium ${principle.enabled ? 'text-foreground' : 'text-muted-foreground line-through'}`}>
                          {principle.rule}
                        </p>
                        {principle.note && (
                          <p className="text-xs text-muted-foreground mt-1">{principle.note}</p>
                        )}
                      </div>
                      <button
                        onClick={() => handleRemove(globalIndex)}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {principles.length === 0 && !isAdding && (
          <p className="text-sm text-muted-foreground italic text-center py-4">
            아직 설정된 투자 원칙이 없습니다.
          </p>
        )}
      </div>

      {/* 추가 폼 */}
      {isAdding ? (
        <div className="mt-4 p-4 bg-background rounded-lg border border-primary/20 space-y-3">
          <select
            value={newPrinciple.category}
            onChange={(e) => setNewPrinciple({ ...newPrinciple, category: e.target.value })}
            className="w-full px-3 py-2 bg-card border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
          >
            {CATEGORY_OPTIONS.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="원칙 내용 (예: 손절 -10%, 익절 +20%)"
            value={newPrinciple.rule}
            onChange={(e) => setNewPrinciple({ ...newPrinciple, rule: e.target.value })}
            className="w-full px-3 py-2 bg-card border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
          />
          <input
            type="text"
            placeholder="메모 (선택사항)"
            value={newPrinciple.note}
            onChange={(e) => setNewPrinciple({ ...newPrinciple, note: e.target.value })}
            className="w-full px-3 py-2 bg-card border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
          />
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
          + 원칙 추가
        </button>
      )}
    </div>
  );
}
