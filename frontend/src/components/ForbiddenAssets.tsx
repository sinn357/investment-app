'use client';

import React, { useState } from 'react';

interface ForbiddenAsset {
  name: string;
  reason: string;
  icon: string;
}

interface ForbiddenAssetsProps {
  forbiddenAssets: ForbiddenAsset[];
  onChange: (assets: ForbiddenAsset[]) => void;
}

function ForbiddenAssets({ forbiddenAssets, onChange }: ForbiddenAssetsProps) {
  const [newAsset, setNewAsset] = useState({ name: '', reason: '', icon: '🚫' });
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = () => {
    if (!newAsset.name.trim() || !newAsset.reason.trim()) {
      alert('자산명과 금지 이유를 모두 입력해주세요.');
      return;
    }
    onChange([...forbiddenAssets, newAsset]);
    setNewAsset({ name: '', reason: '', icon: '🚫' });
    setIsAdding(false);
  };

  const handleRemove = (index: number) => {
    onChange(forbiddenAssets.filter((_, i) => i !== index));
  };

  return (
    <div className="bg-card rounded-lg p-6 border-2 border-red-500/20">
      <h2 className="text-xl font-semibold text-card-foreground mb-4 flex items-center">
        <span className="text-2xl mr-2">🚫</span>
        금지 자산
      </h2>

      {/* 금지 자산 리스트 */}
      <div className="flex flex-wrap gap-2 mb-4">
        {forbiddenAssets.map((asset, index) => (
          <div
            key={index}
            className="inline-flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-lg group hover:bg-red-500/20 transition-colors"
          >
            <span className="text-lg">{asset.icon}</span>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-foreground">{asset.name}</span>
              <span className="text-xs text-muted-foreground">{asset.reason}</span>
            </div>
            <button
              onClick={() => handleRemove(index)}
              className="ml-2 text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              ✕
            </button>
          </div>
        ))}

        {forbiddenAssets.length === 0 && !isAdding && (
          <p className="text-sm text-muted-foreground italic">
            금지 자산이 없습니다. 투자하지 않을 자산군을 추가하세요.
          </p>
        )}
      </div>

      {/* 추가 폼 */}
      {isAdding ? (
        <div className="p-4 bg-background rounded-lg border border-primary/20 space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <input
              type="text"
              placeholder="아이콘 (예: 🚫)"
              value={newAsset.icon}
              onChange={(e) => setNewAsset({ ...newAsset, icon: e.target.value })}
              className="px-3 py-2 bg-card border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground text-center"
              maxLength={2}
            />
            <input
              type="text"
              placeholder="자산명 (예: 레버리지 ETF)"
              value={newAsset.name}
              onChange={(e) => setNewAsset({ ...newAsset, name: e.target.value })}
              className="col-span-2 px-3 py-2 bg-card border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
            />
          </div>
          <input
            type="text"
            placeholder="금지 이유 (예: 변동성이 너무 높음)"
            value={newAsset.reason}
            onChange={(e) => setNewAsset({ ...newAsset, reason: e.target.value })}
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
          className="w-full px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg font-medium transition-colors border-2 border-dashed border-primary/30"
        >
          + 금지 자산 추가
        </button>
      )}
    </div>
  );
}

export default React.memo(ForbiddenAssets);
