'use client';

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import GlassCard from './GlassCard';

type WaveStage = '초기' | '성장' | '성숙';
type Position = '관망' | '리서치' | '소액' | '핵심';

export interface BigWaveCard {
  id: string;
  category: string;
  stage: WaveStage;
  thesis: string;
  keyPlayers: string;
  recentEvent: string;
  riskNote?: string;
  position: Position;
}

interface BigWaveSectionProps {
  cards: BigWaveCard[];
  onChange: (cards: BigWaveCard[]) => void;
}

// 추천 카테고리 목록
const SUGGESTED_CATEGORIES = [
  { label: 'AI', icon: '🤖', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300' },
  { label: '에너지전환', icon: '⚡', color: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300' },
  { label: '바이오', icon: '🧬', color: 'bg-pink-100 text-pink-700 dark:bg-pink-900/50 dark:text-pink-300' },
  { label: '우주', icon: '🚀', color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300' },
  { label: '로보틱스', icon: '🦾', color: 'bg-slate-100 text-slate-700 dark:bg-slate-800/50 dark:text-slate-300' },
  { label: '반도체', icon: '💾', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' },
  { label: '퀀텀', icon: '⚛️', color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-300' },
  { label: '핀테크', icon: '💳', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300' },
];

const STAGE_COLOR: Record<WaveStage, string> = {
  초기: 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700',
  성장: 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700',
  성숙: 'bg-slate-50 text-slate-700 border border-slate-200 dark:bg-slate-800/30 dark:text-slate-300 dark:border-slate-600'
};

const POSITION_COLOR: Record<Position, string> = {
  관망: 'bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800/50 dark:text-slate-300 dark:border-slate-600',
  리서치: 'bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-900/50 dark:text-amber-300 dark:border-amber-700',
  소액: 'bg-blue-100 text-blue-800 border border-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-700',
  핵심: 'bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-900/50 dark:text-emerald-300 dark:border-emerald-700'
};

export default function BigWaveSection({ cards, onChange }: BigWaveSectionProps) {
  const [draft, setDraft] = useState<BigWaveCard>({
    id: `wave-${Date.now()}`,
    category: '',
    stage: '초기',
    thesis: '',
    keyPlayers: '',
    recentEvent: '',
    riskNote: '',
    position: '관망'
  });

  const handleAdd = () => {
    if (!draft.category.trim()) return;
    const next: BigWaveCard = { ...draft, id: `wave-${Date.now()}` };
    onChange([next, ...cards]);
    setDraft({
      id: `wave-${Date.now() + 1}`,
      category: '',
      stage: '초기',
      thesis: '',
      keyPlayers: '',
      recentEvent: '',
      riskNote: '',
      position: '관망'
    });
  };

  const handleUpdate = (id: string, updates: Partial<BigWaveCard>) => {
    onChange(cards.map(c => (c.id === id ? { ...c, ...updates } : c)));
  };

  const handleDelete = (id: string) => {
    onChange(cards.filter(c => c.id !== id));
  };

  return (
    <GlassCard className="p-0">
      <div className="p-6 border-b border-primary/10">
        <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
          🌊 빅웨이브 트래커
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          카테고리·단계·핵심 플레이어·최근 이벤트·포지션을 기록하여 구조적 파동을 추적하세요.
        </p>
      </div>
      <div className="p-6 space-y-4">
        {/* 추천 카테고리 버튼 */}
        <div className="flex flex-wrap gap-2">
          {SUGGESTED_CATEGORIES.map(cat => (
            <button
              key={cat.label}
              type="button"
              onClick={() => setDraft(prev => ({ ...prev, category: cat.label }))}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all hover:scale-105 ${cat.color} ${draft.category === cat.label ? 'ring-2 ring-offset-2 ring-primary' : ''}`}
            >
              {cat.icon} {cat.label}
            </button>
          ))}
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">카테고리</p>
            <Input
              placeholder="직접 입력 또는 위에서 선택"
              value={draft.category}
              onChange={e => setDraft(prev => ({ ...prev, category: e.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">단계</p>
            <Select
              value={draft.stage}
              onValueChange={val => setDraft(prev => ({ ...prev, stage: val as WaveStage }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="초기">초기</SelectItem>
                <SelectItem value="성장">성장</SelectItem>
                <SelectItem value="성숙">성숙</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">포지션</p>
            <Select
              value={draft.position}
              onValueChange={val => setDraft(prev => ({ ...prev, position: val as Position }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="관망">관망</SelectItem>
                <SelectItem value="리서치">리서치</SelectItem>
                <SelectItem value="소액">소액</SelectItem>
                <SelectItem value="핵심">핵심</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">최근 촉발 이벤트</p>
            <Input
              placeholder="예: Sora 출시, IRA 세액공제 연장"
              value={draft.recentEvent}
              onChange={e => setDraft(prev => ({ ...prev, recentEvent: e.target.value }))}
            />
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">핵심 플레이어</p>
            <Input
              placeholder="콤마로 구분 (예: NVIDIA,TSMC,OpenAI)"
              value={draft.keyPlayers}
              onChange={e => setDraft(prev => ({ ...prev, keyPlayers: e.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">리스크/규제 메모</p>
            <Input
              placeholder="예: 수출규제, 반독점, 안전 규제"
              value={draft.riskNote}
              onChange={e => setDraft(prev => ({ ...prev, riskNote: e.target.value }))}
            />
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">논지 요약</p>
          <Textarea
            rows={3}
            placeholder="왜 중요한 빅웨이브인지, 생산성/패러다임 변화 포인트를 요약"
            value={draft.thesis}
            onChange={e => setDraft(prev => ({ ...prev, thesis: e.target.value }))}
          />
        </div>

        <div className="flex justify-end">
          <Button onClick={handleAdd} className="bg-primary hover:bg-primary/90">
            🌊 웨이브 추가
          </Button>
        </div>

        {/* 카드 목록 */}
        <div className="grid gap-4 md:grid-cols-2">
          {cards.length === 0 && (
            <div className="col-span-2 text-center py-8 text-muted-foreground">
              <p className="text-4xl mb-2">🌊</p>
              <p>등록된 빅웨이브가 없습니다.</p>
              <p className="text-sm">위에서 카테고리를 선택하고 추가해 주세요.</p>
            </div>
          )}
          {cards.map(card => {
            const categoryInfo = SUGGESTED_CATEGORIES.find(c => c.label === card.category);
            return (
            <GlassCard key={card.id} className="p-0 overflow-hidden">
              {/* 카드 헤더 */}
              <div className="p-4 border-b border-primary/10 flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-lg">{categoryInfo?.icon || '📊'}</span>
                    <h3 className="text-lg font-semibold">{card.category}</h3>
                    <Badge className={STAGE_COLOR[card.stage]}>{card.stage}</Badge>
                    <Badge className={POSITION_COLOR[card.position]}>{card.position}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">🎯 플레이어: {card.keyPlayers || '-'}</p>
                  <p className="text-xs text-muted-foreground">⚡ 최근 이벤트: {card.recentEvent || '-'}</p>
                  {card.riskNote && (
                    <p className="text-xs text-red-500 dark:text-red-400">⚠️ 리스크: {card.riskNote}</p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(card.id)}
                  className="text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  삭제
                </Button>
              </div>
              {/* 카드 본문 */}
              <div className="p-4 space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">논지</p>
                  <Textarea
                    rows={3}
                    value={card.thesis}
                    onChange={e => handleUpdate(card.id, { thesis: e.target.value })}
                  />
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">핵심 플레이어</p>
                    <Input
                      value={card.keyPlayers}
                      onChange={e => handleUpdate(card.id, { keyPlayers: e.target.value })}
                    />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">리스크/규제</p>
                    <Input
                      value={card.riskNote}
                      onChange={e => handleUpdate(card.id, { riskNote: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">단계</p>
                    <Select
                      value={card.stage}
                      onValueChange={val => handleUpdate(card.id, { stage: val as WaveStage })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="초기">초기</SelectItem>
                        <SelectItem value="성장">성장</SelectItem>
                        <SelectItem value="성숙">성숙</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">포지션</p>
                    <Select
                      value={card.position}
                      onValueChange={val => handleUpdate(card.id, { position: val as Position })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="관망">관망</SelectItem>
                        <SelectItem value="리서치">리서치</SelectItem>
                        <SelectItem value="소액">소액</SelectItem>
                        <SelectItem value="핵심">핵심</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </GlassCard>
          );
          })}
        </div>
      </div>
    </GlassCard>
  );
}
