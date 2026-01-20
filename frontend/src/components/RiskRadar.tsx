'use client';

import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import GlassCard from './GlassCard';

type RiskLevel = 'Low' | 'Medium' | 'High';

interface RiskItem {
  id: string;
  category: string;
  title: string;
  level: RiskLevel;
  note?: string;
}

interface RiskRadarData {
  structural: RiskItem[];
  cycle: RiskItem[];
  portfolio: RiskItem[];
  executionTags: string[];
}

interface RiskRadarProps {
  value: RiskRadarData;
  onChange: (next: RiskRadarData) => void;
}

const LEVEL_OPTIONS: RiskLevel[] = ['Low', 'Medium', 'High'];
const LEVEL_COLOR: Record<RiskLevel, string> = {
  Low: 'text-emerald-700 border-emerald-200 bg-emerald-50 dark:text-emerald-400 dark:border-emerald-800 dark:bg-emerald-950/50',
  Medium: 'text-amber-700 border-amber-200 bg-amber-50 dark:text-amber-400 dark:border-amber-800 dark:bg-amber-950/50',
  High: 'text-rose-700 border-rose-200 bg-rose-50 dark:text-rose-400 dark:border-rose-800 dark:bg-rose-950/50'
};

// 카드 테두리 색상 (High일 때 강조)
const CARD_BORDER_COLOR: Record<RiskLevel, string> = {
  Low: 'border-border',
  Medium: 'border-amber-300 dark:border-amber-700',
  High: 'border-rose-400 dark:border-rose-600 shadow-rose-100 dark:shadow-rose-900/20 shadow-md'
};

// 실행 리스크 태그 색상
const TAG_COLORS: Record<string, string> = {
  '감정': 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300',
  '판단': 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
  '루틴': 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
  '피로': 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300',
  '과신': 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300',
  '손실회피': 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300',
  '확증편향': 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300',
  'FOMO': 'bg-pink-100 text-pink-700 dark:bg-pink-900/50 dark:text-pink-300',
};

// 추천 태그 목록
const SUGGESTED_TAGS = ['감정', '판단', '루틴', '피로', '과신', '손실회피', '확증편향', 'FOMO'];

const DEFAULT_STRUCTURAL = [
  '정책/규제 전환',
  '지정학·안보',
  '기술 패러다임(빅웨이브)',
  '인구·사회 구조'
];
const DEFAULT_CYCLE = ['경기', '신용·유동성', '심리·밸류에이션'];
const DEFAULT_PORTFOLIO = ['편중', '상관/변동성', '듀레이션', '리밸런싱 지연'];

function ensureDefaults(items: RiskItem[], defaults: string[], category: string): RiskItem[] {
  const map = new Map(items.map(i => [i.title, i]));
  defaults.forEach(title => {
    if (!map.has(title)) {
      map.set(title, {
        id: `${category}-${title}`,
        category,
        title,
        level: 'Medium',
        note: ''
      });
    }
  });
  return Array.from(map.values());
}

export default function RiskRadar({ value, onChange }: RiskRadarProps) {
  const data: RiskRadarData = {
    structural: ensureDefaults(value.structural || [], DEFAULT_STRUCTURAL, 'structural'),
    cycle: ensureDefaults(value.cycle || [], DEFAULT_CYCLE, 'cycle'),
    portfolio: ensureDefaults(value.portfolio || [], DEFAULT_PORTFOLIO, 'portfolio'),
    executionTags: value.executionTags || []
  };

  const [tagInput, setTagInput] = useState(() => (value.executionTags || []).join(', '));

  const updateItems = (key: keyof RiskRadarData, items: RiskItem[]) => {
    onChange({ ...data, [key]: items });
  };

  const updateTag = (tags: string[]) => {
    onChange({ ...data, executionTags: tags });
  };

  // 전체 High 개수 계산
  const highCount = [...data.structural, ...data.cycle, ...data.portfolio].filter(i => i.level === 'High').length;
  const totalCount = data.structural.length + data.cycle.length + data.portfolio.length;

  // 리스크 점수 계산 (High=3, Medium=2, Low=1)
  const calculateScore = (items: RiskItem[]) => {
    const score = items.reduce((acc, item) => {
      if (item.level === 'High') return acc + 3;
      if (item.level === 'Medium') return acc + 2;
      return acc + 1;
    }, 0);
    const maxScore = items.length * 3;
    return Math.round((score / maxScore) * 100);
  };

  const overallScore = calculateScore([...data.structural, ...data.cycle, ...data.portfolio]);

  const renderGroup = (label: string, key: 'structural' | 'cycle' | 'portfolio', icon: string) => {
    const items = data[key];
    const groupHighCount = items.filter(i => i.level === 'High').length;
    const groupScore = calculateScore(items);

    return (
      <GlassCard className="p-4" animate animationDelay={50}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
            <span>{icon}</span>
            {label}
          </h3>
          <div className="flex items-center gap-2">
            {groupHighCount > 0 && (
              <span className="px-2 py-0.5 text-xs bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300 rounded-full font-medium">
                🚨 {groupHighCount}
              </span>
            )}
            <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
              groupScore >= 70 ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300' :
              groupScore >= 50 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300' :
              'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300'
            }`}>
              {groupScore}점
            </span>
          </div>
        </div>
        <div className="space-y-2">
          {items.map(item => (
            <div
              key={item.id}
              className={`rounded-xl border ${CARD_BORDER_COLOR[item.level]} bg-muted/30 p-3 flex flex-col gap-2 transition-all ${
                item.level === 'High' ? 'bg-rose-50/50 dark:bg-rose-950/20' : ''
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {item.level === 'High' && <span className="text-rose-500">⚠️</span>}
                  <span className={`font-medium text-sm ${item.level === 'High' ? 'text-rose-700 dark:text-rose-300' : ''}`}>
                    {item.title}
                  </span>
                  <Badge className={`${LEVEL_COLOR[item.level]} border text-xs`}>
                    {item.level}
                  </Badge>
                </div>
                <Select
                  value={item.level}
                  onValueChange={val => {
                    updateItems(
                      key,
                      items.map(i => (i.id === item.id ? { ...i, level: val as RiskLevel } : i))
                    );
                  }}
                >
                  <SelectTrigger className="w-24 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LEVEL_OPTIONS.map(lvl => (
                      <SelectItem key={lvl} value={lvl}>
                        {lvl}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Textarea
                placeholder="근거/메모를 작성하세요"
                value={item.note ?? ''}
                onChange={e =>
                  updateItems(
                    key,
                    items.map(i => (i.id === item.id ? { ...i, note: e.target.value } : i))
                  )
                }
                rows={2}
                className="text-sm resize-none"
              />
            </div>
          ))}
        </div>
      </GlassCard>
    );
  };

  // 추천 태그 추가/제거
  const toggleTag = (tag: string) => {
    const tags = data.executionTags;
    if (tags.includes(tag)) {
      const newTags = tags.filter(t => t !== tag);
      setTagInput(newTags.join(', '));
      updateTag(newTags);
    } else {
      const newTags = [...tags, tag];
      setTagInput(newTags.join(', '));
      updateTag(newTags);
    }
  };

  return (
    <div className="space-y-4">
      {/* 상단 요약 */}
      <GlassCard className="p-4" animate animationDelay={0}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🎯</span>
              <div>
                <h2 className="text-lg font-semibold">리스크 레이더</h2>
                <p className="text-xs text-muted-foreground">
                  {totalCount}개 항목 모니터링 중
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* High 경고 */}
            {highCount > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-100 dark:bg-rose-900/30 rounded-lg border border-rose-200 dark:border-rose-800">
                <span className="text-lg">🚨</span>
                <div>
                  <span className="text-sm font-bold text-rose-700 dark:text-rose-300">{highCount}</span>
                  <span className="text-xs text-rose-600 dark:text-rose-400 ml-1">High</span>
                </div>
              </div>
            )}
            {/* 전체 점수 */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${
              overallScore >= 70
                ? 'bg-rose-100 dark:bg-rose-900/30 border-rose-200 dark:border-rose-800'
                : overallScore >= 50
                ? 'bg-amber-100 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800'
                : 'bg-emerald-100 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800'
            }`}>
              <span className="text-lg">{overallScore >= 70 ? '⚠️' : overallScore >= 50 ? '⚡' : '✅'}</span>
              <div>
                <span className={`text-sm font-bold ${
                  overallScore >= 70 ? 'text-rose-700 dark:text-rose-300' :
                  overallScore >= 50 ? 'text-amber-700 dark:text-amber-300' :
                  'text-emerald-700 dark:text-emerald-300'
                }`}>{overallScore}점</span>
                <span className="text-xs text-muted-foreground ml-1">종합</span>
              </div>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* 3단 그리드 */}
      <div className="grid gap-4 lg:grid-cols-3">
        {renderGroup('구조·정책', 'structural', '🏛️')}
        {renderGroup('사이클', 'cycle', '📊')}
        {renderGroup('포트폴리오', 'portfolio', '💼')}
      </div>

      {/* 실행/행동 리스크 태그 */}
      <GlassCard className="p-4" animate animationDelay={100}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
            <span>🧠</span>
            실행/행동 리스크 태그
          </h3>
          {data.executionTags.length > 0 && (
            <span className="px-2 py-0.5 text-xs bg-primary/10 text-primary rounded-full">
              {data.executionTags.length}
            </span>
          )}
        </div>

        {/* 추천 태그 버튼 */}
        <div className="mb-3">
          <p className="text-xs text-muted-foreground mb-2">추천 태그 (클릭하여 추가/제거)</p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_TAGS.map(tag => {
              const isSelected = data.executionTags.includes(tag);
              return (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1.5 text-xs rounded-full font-medium transition-all ${
                    isSelected
                      ? `${TAG_COLORS[tag] || 'bg-primary/20 text-primary'} ring-2 ring-offset-1 ring-primary/50`
                      : 'bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {isSelected && '✓ '}{tag}
                </button>
              );
            })}
          </div>
        </div>

        {/* 커스텀 입력 */}
        <div className="space-y-3">
          <Input
            placeholder="직접 입력 (콤마로 구분)"
            value={tagInput}
            onChange={e => {
              const next = e.target.value;
              setTagInput(next);
              const parsed = next
                .split(',')
                .map(v => v.trim())
                .filter(Boolean);
              updateTag(parsed);
            }}
            className="text-sm"
          />

          {/* 선택된 태그 표시 */}
          {data.executionTags.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
              {data.executionTags.map(tag => (
                <Badge
                  key={tag}
                  className={`${TAG_COLORS[tag] || 'bg-secondary text-secondary-foreground'} cursor-pointer hover:opacity-80`}
                  onClick={() => toggleTag(tag)}
                >
                  {tag}
                  <span className="ml-1 opacity-60">×</span>
                </Badge>
              ))}
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  );
}
