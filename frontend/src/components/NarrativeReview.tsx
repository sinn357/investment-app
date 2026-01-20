'use client';

import { useState, useEffect, useCallback } from 'react';
import type { MouseEvent } from 'react';
import GlassCard from './GlassCard';

interface Article {
  title: string;
  url: string;
  summary?: string;
  keyword?: string;
}

interface PastNarrative {
  date: string;
  narrative: string;
  articles_count: number;
  articles?: Article[];
}

interface NarrativeReviewProps {
  userId: number;
  refreshKey?: number;
  onSelectDate?: (date: string) => void;
  onDeleteDate?: (date: string) => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://investment-app-backend-x166.onrender.com';

export default function NarrativeReview({ userId, refreshKey, onSelectDate, onDeleteDate }: NarrativeReviewProps) {
  const [history, setHistory] = useState<PastNarrative[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [deletingDate, setDeletingDate] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${API_URL}/api/economic-narrative/history?user_id=${userId}&limit=10`
      );
      const result = await res.json();
      if (result.status === 'success') {
        setHistory(result.data);
      }
    } catch (error) {
      console.error('담론 히스토리 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchHistory();
    }
  }, [userId, refreshKey, fetchHistory]);

  const handleEdit = (event: MouseEvent<HTMLButtonElement>, date: string) => {
    event.stopPropagation();
    onSelectDate?.(date);
  };

  const handleDelete = async (event: MouseEvent<HTMLButtonElement>, date: string) => {
    event.stopPropagation();

    const confirmed = window.confirm('이 날짜의 담론을 삭제할까요? 삭제하면 복구할 수 없습니다.');
    if (!confirmed) return;

    setDeletingDate(date);
    try {
      const res = await fetch(
        `${API_URL}/api/economic-narrative?user_id=${userId}&date=${date}`,
        {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' }
        }
      );
      const rawText = await res.text();
      let result: { status?: string; message?: string } = {};
      try {
        result = JSON.parse(rawText);
      } catch (error) {
        console.warn('담론 삭제 응답 파싱 실패:', error);
      }

      if (res.ok && result.status === 'success') {
        onDeleteDate?.(date);
        setSelectedDate((prev) => (prev === date ? null : prev));
        fetchHistory();
      } else {
        const fallbackMessage = result.message || `삭제 실패 (HTTP ${res.status})`;
        alert(fallbackMessage);
      }
    } catch (error) {
      console.error('담론 삭제 실패:', error);
      alert('담론 삭제 중 오류가 발생했습니다.');
    } finally {
      setDeletingDate(null);
    }
  };

  if (loading) {
    return (
      <GlassCard className="p-6 mt-6" animate animationDelay={150}>
        <div className="flex items-center justify-center gap-3 py-4">
          <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">담론 히스토리를 불러오는 중...</p>
        </div>
      </GlassCard>
    );
  }

  if (history.length === 0) {
    return (
      <GlassCard className="p-6 mt-6" animate animationDelay={150}>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span className="text-xl">📚</span>
          과거 담론 리뷰
        </h2>
        <div className="text-center py-8 border-2 border-dashed border-primary/20 rounded-xl bg-muted/30">
          <span className="text-4xl mb-3 block">📝</span>
          <p className="text-sm text-muted-foreground">
            아직 저장된 담론이 없습니다
          </p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            담론을 작성하고 저장하면 여기에 표시됩니다
          </p>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="p-6 mt-6" animate animationDelay={150}>
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <span className="text-xl">📚</span>
        과거 담론 리뷰
        <span className="px-2 py-0.5 text-xs bg-primary/10 text-primary rounded-full">
          {history.length}
        </span>
      </h2>

      <div className="space-y-3">
        {history.map((item, idx) => (
          <div
            key={idx}
            className="group p-4 bg-background/50 rounded-xl border border-primary/10 hover:border-primary/30 hover:shadow-sm transition-all cursor-pointer"
            onClick={() => setSelectedDate(selectedDate === item.date ? null : item.date)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-lg">
                  📅
                </div>
                <div>
                  <h3 className="font-medium text-foreground">
                    {new Date(item.date).toLocaleDateString('ko-KR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    기사 {item.articles_count}개 첨부
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={(event) => handleEdit(event, item.date)}
                  className="px-3 py-1.5 text-xs bg-primary/10 text-primary hover:bg-primary/20 rounded-lg transition-colors"
                >
                  불러오기
                </button>
                <button
                  onClick={(event) => handleDelete(event, item.date)}
                  disabled={deletingDate === item.date}
                  className="px-3 py-1.5 text-xs text-red-500 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                >
                  {deletingDate === item.date ? '삭제 중...' : '삭제'}
                </button>
                <span className="w-6 h-6 flex items-center justify-center text-xs text-primary">
                  {selectedDate === item.date ? '▲' : '▼'}
                </span>
              </div>
            </div>

            {selectedDate === item.date && (
              <div className="mt-4 pt-4 border-t border-primary/10 space-y-4">
                {/* 담론 내용 */}
                <div className="p-4 bg-muted/30 rounded-xl">
                  {item.narrative ? (
                    <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                      {item.narrative}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground italic text-center py-2">
                      작성된 담론이 없습니다.
                    </p>
                  )}
                </div>

                {/* 첨부 뉴스 */}
                {item.articles && item.articles.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                      <span>📰</span> 첨부된 뉴스
                    </h4>
                    <div className="space-y-2">
                      {item.articles.map((article, articleIndex) => (
                        <div
                          key={`${item.date}-article-${articleIndex}`}
                          className="p-3 bg-background/50 rounded-lg border border-primary/10"
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-1 min-w-0">
                              {article.keyword && (
                                <span className="inline-flex items-center px-2 py-0.5 text-xs bg-secondary/20 text-secondary rounded-full mb-1">
                                  #{article.keyword}
                                </span>
                              )}
                              <a
                                href={article.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm font-medium text-foreground hover:text-primary transition-colors line-clamp-2 block"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {article.title}
                              </a>
                              {article.summary && (
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                  {article.summary}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 검증 포인트 */}
                <div className="p-4 bg-primary/5 rounded-xl border border-primary/10">
                  <h4 className="text-xs font-semibold text-primary mb-2 flex items-center gap-1">
                    <span>💡</span> 검증 포인트
                  </h4>
                  <ul className="space-y-1.5 text-xs text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      당시 예측한 시장 방향이 맞았나요?
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      주목한 지표가 실제로 중요했나요?
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      놓친 변수는 무엇인가요?
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </GlassCard>
  );
}
