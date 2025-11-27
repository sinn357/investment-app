'use client';

import React, { useState } from 'react';

interface Sector {
  sector: string;
  performance?: number;
  relative_strength?: number;
  notes?: string;
}

interface SectorHeatmapProps {
  sectors: Sector[];
  onChange: (sectors: Sector[]) => void;
}

const DEFAULT_SECTORS = [
  'Technology', 'Healthcare', 'Financials', 'Consumer Discretionary',
  'Industrials', 'Communication Services', 'Consumer Staples',
  'Energy', 'Utilities', 'Real Estate', 'Materials'
];

export default function SectorHeatmap({ sectors, onChange }: SectorHeatmapProps) {
  const [editingSector, setEditingSector] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Sector>>({});

  const getSectorData = (sectorName: string): Sector => {
    return sectors.find(s => s.sector === sectorName) || {
      sector: sectorName,
      performance: undefined,
      relative_strength: undefined,
      notes: ''
    };
  };

  const handleEdit = (sectorName: string) => {
    const data = getSectorData(sectorName);
    setEditingSector(sectorName);
    setEditData(data);
  };

  const handleSave = () => {
    if (!editingSector) return;

    const newSectors = sectors.filter(s => s.sector !== editingSector);
    newSectors.push({
      sector: editingSector,
      performance: editData.performance,
      relative_strength: editData.relative_strength,
      notes: editData.notes
    });

    onChange(newSectors);
    setEditingSector(null);
    setEditData({});
  };

  const getPerformanceColor = (performance?: number) => {
    if (!performance) return 'bg-muted';
    if (performance >= 5) return 'bg-green-600';
    if (performance >= 2) return 'bg-green-400';
    if (performance > 0) return 'bg-green-200';
    if (performance > -2) return 'bg-red-200';
    if (performance > -5) return 'bg-red-400';
    return 'bg-red-600';
  };

  const getTextColor = (performance?: number) => {
    if (!performance) return 'text-muted-foreground';
    if (Math.abs(performance) >= 2) return 'text-white';
    return 'text-foreground';
  };

  return (
    <div className="bg-card rounded-lg p-6 border-2 border-primary/20">
      <h2 className="text-xl font-semibold text-card-foreground mb-4 flex items-center">
        <span className="text-2xl mr-2">📊</span>
        섹터 히트맵
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {DEFAULT_SECTORS.map((sectorName) => {
          const data = getSectorData(sectorName);
          const isEditing = editingSector === sectorName;

          return (
            <div
              key={sectorName}
              className={`p-4 rounded-lg cursor-pointer transition-all ${
                isEditing
                  ? 'bg-primary/20 ring-2 ring-primary'
                  : `${getPerformanceColor(data.performance)} hover:opacity-80`
              }`}
              onClick={() => !isEditing && handleEdit(sectorName)}
            >
              <p className={`text-sm font-semibold mb-1 ${getTextColor(data.performance)}`}>
                {sectorName}
              </p>
              <p className={`text-xl font-bold ${getTextColor(data.performance)}`}>
                {data.performance !== undefined ? `${data.performance > 0 ? '+' : ''}${data.performance.toFixed(1)}%` : '-'}
              </p>
              {data.relative_strength !== undefined && (
                <p className={`text-xs ${getTextColor(data.performance)}`}>
                  RS: {data.relative_strength.toFixed(1)}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* 편집 모달 */}
      {editingSector && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setEditingSector(null)}>
          <div className="bg-card rounded-lg p-6 w-full max-w-md border-2 border-primary" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-foreground mb-4">{editingSector} 수정</h3>

            <div className="space-y-3">
              <div>
                <label className="text-sm text-muted-foreground block mb-1">성과 (%)</label>
                <input
                  type="number"
                  value={editData.performance || ''}
                  onChange={(e) => setEditData({ ...editData, performance: e.target.value ? Number(e.target.value) : undefined })}
                  className="w-full px-3 py-2 bg-background border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                  step="0.1"
                  placeholder="예: 5.2"
                />
              </div>

              <div>
                <label className="text-sm text-muted-foreground block mb-1">상대강도</label>
                <input
                  type="number"
                  value={editData.relative_strength || ''}
                  onChange={(e) => setEditData({ ...editData, relative_strength: e.target.value ? Number(e.target.value) : undefined })}
                  className="w-full px-3 py-2 bg-background border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                  step="0.1"
                  placeholder="예: 1.2 (시장 대비)"
                />
              </div>

              <div>
                <label className="text-sm text-muted-foreground block mb-1">메모</label>
                <textarea
                  value={editData.notes || ''}
                  onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 bg-background border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground resize-none"
                  placeholder="섹터 분석 메모..."
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleSave}
                  className="flex-1 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium transition-colors"
                >
                  저장
                </button>
                <button
                  onClick={() => setEditingSector(null)}
                  className="flex-1 px-4 py-2 bg-muted hover:bg-muted/80 text-muted-foreground rounded-lg font-medium transition-colors"
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 p-3 bg-primary/5 rounded-lg border border-primary/20">
        <p className="text-xs text-muted-foreground">
          💡 <strong>사용 가이드:</strong> 각 섹터를 클릭하여 성과(%)와 상대강도를 입력하세요.
          색상이 자동으로 변경됩니다. (초록: 상승, 빨강: 하락)
        </p>
      </div>
    </div>
  );
}
