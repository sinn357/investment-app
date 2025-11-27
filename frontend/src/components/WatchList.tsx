'use client';

import React, { useState } from 'react';

interface Stock {
  id: number;
  symbol: string;
  name: string;
  sector?: string;
  current_price?: number;
  target_price?: number;
  notes?: string;
  alert_enabled?: boolean;
  alert_price?: number;
}

interface WatchListProps {
  stocks: Stock[];
  onAdd: (stock: Omit<Stock, 'id'>) => Promise<void>;
  onUpdate: (id: number, stock: Partial<Stock>) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}

export default function WatchList({ stocks, onAdd, onUpdate, onDelete }: WatchListProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<Partial<Stock>>({
    symbol: '',
    name: '',
    sector: '',
    current_price: undefined,
    target_price: undefined,
    notes: '',
    alert_enabled: false,
    alert_price: undefined
  });

  const resetForm = () => {
    setFormData({
      symbol: '',
      name: '',
      sector: '',
      current_price: undefined,
      target_price: undefined,
      notes: '',
      alert_enabled: false,
      alert_price: undefined
    });
  };

  const handleAdd = async () => {
    if (!formData.symbol || !formData.name) {
      alert('티커 심볼과 종목명은 필수입니다.');
      return;
    }

    await onAdd(formData as Omit<Stock, 'id'>);
    resetForm();
    setIsAdding(false);
  };

  const handleEdit = (stock: Stock) => {
    setEditingId(stock.id);
    setFormData(stock);
  };

  const handleUpdate = async () => {
    if (editingId === null) return;

    await onUpdate(editingId, formData);
    setEditingId(null);
    resetForm();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('정말 이 종목을 삭제하시겠습니까?')) return;
    await onDelete(id);
  };

  const getUpside = (current?: number, target?: number) => {
    if (!current || !target) return null;
    return ((target - current) / current * 100).toFixed(1);
  };

  return (
    <div className="bg-card rounded-lg p-6 border-2 border-primary/20">
      <h2 className="text-xl font-semibold text-card-foreground mb-4 flex items-center">
        <span className="text-2xl mr-2">⭐</span>
        관심 종목 리스트
      </h2>

      {/* 종목 리스트 */}
      <div className="space-y-3 mb-4">
        {stocks.length === 0 && !isAdding && !editingId && (
          <p className="text-sm text-muted-foreground italic text-center py-8 border-2 border-dashed border-primary/20 rounded-lg">
            아직 등록된 관심 종목이 없습니다.
          </p>
        )}

        {stocks.map((stock) => {
          const upside = getUpside(stock.current_price, stock.target_price);
          const isEditing = editingId === stock.id;

          return (
            <div
              key={stock.id}
              className="p-4 bg-background rounded-lg border border-primary/20 hover:border-primary/40 transition-colors"
            >
              {isEditing ? (
                // 수정 폼
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="티커 (예: AAPL)"
                      value={formData.symbol || ''}
                      onChange={(e) => setFormData({ ...formData, symbol: e.target.value.toUpperCase() })}
                      className="px-3 py-2 bg-card border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                      disabled
                    />
                    <input
                      type="text"
                      placeholder="종목명"
                      value={formData.name || ''}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="px-3 py-2 bg-card border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="섹터 (예: Technology)"
                    value={formData.sector || ''}
                    onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
                    className="w-full px-3 py-2 bg-card border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="number"
                      placeholder="현재가"
                      value={formData.current_price || ''}
                      onChange={(e) => setFormData({ ...formData, current_price: e.target.value ? Number(e.target.value) : undefined })}
                      className="px-3 py-2 bg-card border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                      step="0.01"
                    />
                    <input
                      type="number"
                      placeholder="목표가"
                      value={formData.target_price || ''}
                      onChange={(e) => setFormData({ ...formData, target_price: e.target.value ? Number(e.target.value) : undefined })}
                      className="px-3 py-2 bg-card border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                      step="0.01"
                    />
                  </div>
                  <textarea
                    placeholder="투자 근거 / 메모"
                    value={formData.notes || ''}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 bg-card border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground resize-none"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleUpdate}
                      className="flex-1 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium transition-colors"
                    >
                      수정 완료
                    </button>
                    <button
                      onClick={() => {
                        setEditingId(null);
                        resetForm();
                      }}
                      className="flex-1 px-4 py-2 bg-muted hover:bg-muted/80 text-muted-foreground rounded-lg font-medium transition-colors"
                    >
                      취소
                    </button>
                  </div>
                </div>
              ) : (
                // 표시 모드
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg font-bold text-primary">{stock.symbol}</span>
                        <span className="text-sm text-muted-foreground">{stock.name}</span>
                        {stock.sector && (
                          <span className="px-2 py-0.5 text-xs bg-secondary/20 text-secondary rounded">
                            {stock.sector}
                          </span>
                        )}
                      </div>
                      {stock.notes && (
                        <p className="text-sm text-muted-foreground">{stock.notes}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(stock)}
                        className="text-primary hover:text-primary/80 text-sm transition-colors"
                      >
                        수정
                      </button>
                      <button
                        onClick={() => handleDelete(stock.id)}
                        className="text-red-500 hover:text-red-700 text-sm transition-colors"
                      >
                        삭제
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mt-3 pt-3 border-t border-primary/10">
                    <div>
                      <p className="text-xs text-muted-foreground">현재가</p>
                      <p className="text-sm font-semibold text-foreground">
                        {stock.current_price ? `$${stock.current_price.toFixed(2)}` : '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">목표가</p>
                      <p className="text-sm font-semibold text-foreground">
                        {stock.target_price ? `$${stock.target_price.toFixed(2)}` : '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">상승 여력</p>
                      <p className={`text-sm font-semibold ${upside && parseFloat(upside) > 0 ? 'text-green-500' : upside && parseFloat(upside) < 0 ? 'text-red-500' : 'text-muted-foreground'}`}>
                        {upside ? `${upside}%` : '-'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 추가 폼 */}
      {isAdding && (
        <div className="p-4 bg-background rounded-lg border border-primary/20 space-y-3 mb-4">
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="티커 (예: AAPL) *"
              value={formData.symbol || ''}
              onChange={(e) => setFormData({ ...formData, symbol: e.target.value.toUpperCase() })}
              className="px-3 py-2 bg-card border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
            />
            <input
              type="text"
              placeholder="종목명 *"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="px-3 py-2 bg-card border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
            />
          </div>
          <input
            type="text"
            placeholder="섹터 (예: Technology)"
            value={formData.sector || ''}
            onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
            className="w-full px-3 py-2 bg-card border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              type="number"
              placeholder="현재가"
              value={formData.current_price || ''}
              onChange={(e) => setFormData({ ...formData, current_price: e.target.value ? Number(e.target.value) : undefined })}
              className="px-3 py-2 bg-card border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
              step="0.01"
            />
            <input
              type="number"
              placeholder="목표가"
              value={formData.target_price || ''}
              onChange={(e) => setFormData({ ...formData, target_price: e.target.value ? Number(e.target.value) : undefined })}
              className="px-3 py-2 bg-card border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
              step="0.01"
            />
          </div>
          <textarea
            placeholder="투자 근거 / 메모"
            value={formData.notes || ''}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={2}
            className="w-full px-3 py-2 bg-card border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground resize-none"
          />
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              className="flex-1 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium transition-colors"
            >
              추가
            </button>
            <button
              onClick={() => {
                setIsAdding(false);
                resetForm();
              }}
              className="flex-1 px-4 py-2 bg-muted hover:bg-muted/80 text-muted-foreground rounded-lg font-medium transition-colors"
            >
              취소
            </button>
          </div>
        </div>
      )}

      {/* 추가 버튼 */}
      {!isAdding && !editingId && (
        <button
          onClick={() => setIsAdding(true)}
          className="w-full px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg font-medium transition-colors border-2 border-dashed border-primary/30"
        >
          + 관심 종목 추가
        </button>
      )}
    </div>
  );
}
