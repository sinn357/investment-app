'use client';

import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
  Low: 'text-emerald-700 border-emerald-200 bg-emerald-50',
  Medium: 'text-amber-700 border-amber-200 bg-amber-50',
  High: 'text-rose-700 border-rose-200 bg-rose-50'
};

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

  const renderGroup = (label: string, key: 'structural' | 'cycle' | 'portfolio') => {
    const items = data[key];
    return (
      <Card className="border border-primary/20 bg-card">
        <CardHeader>
          <CardTitle className="text-lg">{label}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {items.map(item => (
            <div
              key={item.id}
              className="rounded-md border border-border bg-muted/30 p-3 flex flex-col gap-2"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{item.title}</span>
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
                  <SelectTrigger className="w-28">
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
              />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">리스크 레이더</h2>
          <p className="text-sm text-muted-foreground">
            구조·정책 / 사이클 / 포트폴리오 리스크 레벨과 메모를 기록하세요. 실행 리스크는 태그로 관리합니다.
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {renderGroup('구조·정책 리스크', 'structural')}
        {renderGroup('사이클 리스크', 'cycle')}
        {renderGroup('포트폴리오 구조 리스크', 'portfolio')}
      </div>

      <Card className="border border-secondary/30 bg-card">
        <CardHeader>
          <CardTitle className="text-lg">실행/행동 리스크 태그</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            placeholder="콤마로 구분해 입력 (예: 감정, 판단, 루틴, 피로)"
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
          />
          <div className="flex flex-wrap gap-2">
            {data.executionTags.map(tag => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
