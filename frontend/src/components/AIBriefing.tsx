'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import GlassCard from '@/components/GlassCard';

interface CategoryBriefing {
  label: string;
  summary: string;
  rate_implication: string;
  risk_level: 'positive' | 'neutral' | 'caution' | 'unknown';
  signals: string[];
}

interface BriefingResponse {
  status: 'success' | 'error';
  generated_at?: string;
  source?: 'openai' | 'fallback';
  overall_summary?: string;
  category_briefings?: Record<string, CategoryBriefing>;
  cached?: boolean;
  message?: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://investment-app-backend-x166.onrender.com';

export default function AIBriefing() {
  const [briefing, setBriefing] = useState<BriefingResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBriefing = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_URL}/api/v2/briefing`);
      const result = await response.json();
      if (!response.ok || result.status !== 'success') {
        throw new Error(result.message || '브리핑 조회 실패');
      }
      setBriefing(result as BriefingResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : '브리핑 조회 실패');
    } finally {
      setLoading(false);
    }
  }, []);

  const regenerateBriefing = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_URL}/api/v2/generate-briefing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force: true }),
      });
      const result = await response.json();
      if (!response.ok || result.status !== 'success') {
        throw new Error(result.message || '브리핑 생성 실패');
      }
      setBriefing(result as BriefingResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : '브리핑 생성 실패');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBriefing();
  }, [fetchBriefing]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-4">
      <GlassCard className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground">🤖 AI 브리핑</h3>
            <p className="text-xs text-muted-foreground">카테고리별 + 종합 브리핑 (캐싱 적용)</p>
          </div>
          <Button onClick={regenerateBriefing} disabled={loading} size="sm" className="w-full sm:w-auto">
            {loading ? '처리 중...' : '브리핑 갱신'}
          </Button>
        </div>

        {error && (
          <div className="mb-3 rounded-md border border-red-300 bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        {loading && !briefing && (
          <div className="text-sm text-muted-foreground">브리핑을 불러오는 중입니다...</div>
        )}

        {briefing?.status === 'success' && (
          <div className="space-y-3">
            <div className="rounded-md border border-border bg-muted/30 p-3">
              <p className="text-sm text-foreground">{briefing.overall_summary}</p>
              <p className="text-xs text-muted-foreground mt-1">
                출처: {briefing.source === 'openai' ? 'OpenAI' : 'Fallback'}
                {briefing.generated_at ? ` · 생성시각: ${new Date(briefing.generated_at).toLocaleString('ko-KR')}` : ''}
                {typeof briefing.cached === 'boolean' ? ` · 캐시: ${briefing.cached ? 'HIT' : 'MISS'}` : ''}
              </p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
              {Object.entries(briefing.category_briefings || {}).map(([key, item]) => {
                const riskClass =
                  item.risk_level === 'positive'
                    ? 'text-green-700 bg-green-100 dark:text-green-300 dark:bg-green-900/30'
                    : item.risk_level === 'caution'
                    ? 'text-red-700 bg-red-100 dark:text-red-300 dark:bg-red-900/30'
                    : item.risk_level === 'unknown'
                    ? 'text-gray-700 bg-gray-100 dark:text-gray-300 dark:bg-gray-800'
                    : 'text-amber-700 bg-amber-100 dark:text-amber-300 dark:bg-amber-900/30';

                return (
                  <div key={key} className="rounded-md border border-border bg-card p-3">
                    <div className="flex items-center justify-between mb-2 gap-2">
                      <h4 className="text-sm font-semibold text-foreground">{item.label}</h4>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${riskClass}`}>{item.risk_level}</span>
                    </div>
                    <p className="text-sm text-foreground mb-2">{item.summary}</p>
                    <div className="rounded-md border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 p-2 mb-2">
                      <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">💰 금리 시사점</p>
                      <p className="text-sm text-amber-900 dark:text-amber-200">{item.rate_implication}</p>
                    </div>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      {(item.signals || []).map((signal, index) => (
                        <li key={`${key}-${index}`}>- {signal}</li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
