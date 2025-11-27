'use client';

import React, { useState } from 'react';

interface AllocationItem {
  category: string;
  min: number;
  max: number;
  current: number;
  color: string;
}

interface AllocationRangeProps {
  allocationRange: AllocationItem[];
  onChange: (ranges: AllocationItem[]) => void;
}

const CATEGORY_OPTIONS = [
  { name: '즉시현금', color: '#10b981' },
  { name: '예치자산', color: '#3b82f6' },
  { name: '투자자산', color: '#f59e0b' },
  { name: '대체투자', color: '#ef4444' },
];

export default function AllocationRange({ allocationRange, onChange }: AllocationRangeProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newItem, setNewItem] = useState({
    category: '',
    min: 0,
    max: 100,
    current: 0,
    color: '#10b981'
  });

  const handleAdd = () => {
    if (!newItem.category.trim()) {
      alert('카테고리를 선택해주세요.');
      return;
    }
    if (newItem.min < 0 || newItem.max > 100 || newItem.min > newItem.max) {
      alert('최소/최대 비중이 올바르지 않습니다 (0-100%).');
      return;
    }
    onChange([...allocationRange, newItem]);
    setNewItem({ category: '', min: 0, max: 100, current: 0, color: '#10b981' });
    setIsAdding(false);
  };

  const handleRemove = (index: number) => {
    onChange(allocationRange.filter((_, i) => i !== index));
  };

  const handleUpdate = (index: number, field: keyof AllocationItem, value: number | string) => {
    const newRanges = [...allocationRange];
    if (typeof value === 'number' && (field === 'min' || field === 'max' || field === 'current')) {
      newRanges[index][field] = value;
    } else if (typeof value === 'string' && (field === 'category' || field === 'color')) {
      newRanges[index][field] = value;
    }
    onChange(newRanges);
  };

  const getTotalCurrent = () => {
    return allocationRange.reduce((sum, item) => sum + item.current, 0);
  };

  const getStatus = (item: AllocationItem) => {
    if (item.current < item.min) return { text: '⚠️ 최소 비중 미달', color: 'text-yellow-500' };
    if (item.current > item.max) return { text: '🔴 최대 비중 초과', color: 'text-red-500' };
    return { text: '✅ 정상 범위', color: 'text-green-500' };
  };

  return (
    <div className="bg-card rounded-lg p-6 border-2 border-secondary/20">
      <h2 className="text-xl font-semibold text-card-foreground mb-4 flex items-center justify-between">
        <span className="flex items-center">
          <span className="text-2xl mr-2">📊</span>
          운용 범위
        </span>
        <span className="text-sm font-normal text-muted-foreground">
          총 비중: <span className={getTotalCurrent() === 100 ? 'text-green-500 font-semibold' : 'text-yellow-500 font-semibold'}>
            {getTotalCurrent().toFixed(1)}%
          </span>
        </span>
      </h2>

      <div className="space-y-3">
        {allocationRange.map((item, index) => {
          const status = getStatus(item);
          return (
            <div key={index} className="p-4 bg-background rounded-lg border border-primary/20">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: item.color }}></div>
                  <span className="font-medium text-foreground">{item.category}</span>
                  <span className={`text-xs ${status.color}`}>{status.text}</span>
                </div>
                <button
                  onClick={() => handleRemove(index)}
                  className="text-red-500 hover:text-red-700 text-sm"
                >
                  삭제
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">최소 비중 (%)</label>
                  <input
                    type="number"
                    value={item.min}
                    onChange={(e) => handleUpdate(index, 'min', Number(e.target.value))}
                    className="w-full px-2 py-1 text-sm bg-card border border-primary/20 rounded focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                    min="0"
                    max="100"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">최대 비중 (%)</label>
                  <input
                    type="number"
                    value={item.max}
                    onChange={(e) => handleUpdate(index, 'max', Number(e.target.value))}
                    className="w-full px-2 py-1 text-sm bg-card border border-primary/20 rounded focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                    min="0"
                    max="100"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">현재 비중 (%)</label>
                  <input
                    type="number"
                    value={item.current}
                    onChange={(e) => handleUpdate(index, 'current', Number(e.target.value))}
                    className="w-full px-2 py-1 text-sm bg-card border border-primary/20 rounded focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                    min="0"
                    max="100"
                    step="0.1"
                  />
                </div>
              </div>

              {/* 진행바 */}
              <div className="mt-3">
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full transition-all duration-300"
                    style={{
                      width: `${Math.min(100, (item.current / item.max) * 100)}%`,
                      backgroundColor: item.color
                    }}
                  ></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 추가 폼 */}
      {isAdding ? (
        <div className="mt-4 p-4 bg-background rounded-lg border border-primary/20 space-y-3">
          <select
            value={newItem.category}
            onChange={(e) => {
              const selected = CATEGORY_OPTIONS.find(opt => opt.name === e.target.value);
              setNewItem({ ...newItem, category: e.target.value, color: selected?.color || '#10b981' });
            }}
            className="w-full px-3 py-2 bg-card border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
          >
            <option value="">카테고리 선택</option>
            {CATEGORY_OPTIONS.map(opt => (
              <option key={opt.name} value={opt.name}>{opt.name}</option>
            ))}
          </select>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground">최소 비중 (%)</label>
              <input
                type="number"
                value={newItem.min}
                onChange={(e) => setNewItem({ ...newItem, min: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-card border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                min="0"
                max="100"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">최대 비중 (%)</label>
              <input
                type="number"
                value={newItem.max}
                onChange={(e) => setNewItem({ ...newItem, max: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-card border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                min="0"
                max="100"
              />
            </div>
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
          + 자산군 추가
        </button>
      )}
    </div>
  );
}
