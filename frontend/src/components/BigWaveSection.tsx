'use client';

import React, { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
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
    <Card className="border border-primary/20 bg-card">
      <CardHeader>
        <CardTitle className="text-xl">빅웨이브 트래커</CardTitle>
        <p className="text-sm text-muted-foreground">
          카테고리·단계·핵심 플레이어·최근 이벤트·포지션을 기록하여 구조적 파동을 추적하세요.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">카테고리</p>
            <Input
              placeholder="예: AI/에너지전환/바이오/우주/로보틱스"
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
          <Button onClick={handleAdd}>웨이브 추가</Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {cards.length === 0 && (
            <p className="text-sm text-muted-foreground">등록된 빅웨이브가 없습니다. 추가해 주세요.</p>
          )}
          {cards.map(card => (
            <Card key={card.id} className="border border-border bg-muted/20">
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold">{card.category}</h3>
                    <Badge className={STAGE_COLOR[card.stage]}>{card.stage}</Badge>
                    <Badge className={POSITION_COLOR[card.position]}>{card.position}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">플레이어: {card.keyPlayers || '-'}</p>
                  <p className="text-xs text-muted-foreground">최근 이벤트: {card.recentEvent || '-'}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(card.id)}>
                  삭제
                </Button>
              </CardHeader>
              <CardContent className="space-y-2">
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
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
