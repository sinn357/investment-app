'use client';

import { useState, useEffect, useCallback } from 'react';
import type { MouseEvent } from 'react';

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
      <div className="bg-card rounded-lg p-6 border border-primary/20 mt-6">
        <p className="text-sm text-muted-foreground text-center">담론 히스토리를 불러오는 중...</p>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="bg-card rounded-lg p-6 border border-primary/20 mt-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <span className="mr-2">📚</span>
          과거 담론 리뷰
        </h2>
        <p className="text-sm text-muted-foreground text-center py-4">
          아직 저장된 담론이 없습니다. 담론을 작성하고 저장하면 여기에 표시됩니다.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg p-6 border border-primary/20 mt-6">
      <h2 className="text-xl font-semibold mb-4 flex items-center">
        <span className="mr-2">📚</span>
        과거 담론 리뷰
      </h2>

      <div className="space-y-3">
        {history.map((item, idx) => (
          <div
            key={idx}
            className="p-4 bg-background rounded border border-primary/10 hover:border-primary/30 transition-colors cursor-pointer"
            onClick={() => setSelectedDate(selectedDate === item.date ? null : item.date)}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-foreground">
                {new Date(item.date).toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </h3>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">
                  기사 {item.articles_count}개
                </span>
                <button
                  onClick={(event) => handleEdit(event, item.date)}
                  className="text-xs text-primary hover:text-primary/80"
                >
                  불러오기
                </button>
                <button
                  onClick={(event) => handleDelete(event, item.date)}
                  disabled={deletingDate === item.date}
                  className="text-xs text-red-500 hover:text-red-600 disabled:opacity-50"
                >
                  {deletingDate === item.date ? '삭제 중...' : '삭제'}
                </button>
                <span className="text-xs text-primary">
                  {selectedDate === item.date ? '▼ 접기' : '▶ 펼치기'}
                </span>
              </div>
            </div>

            {selectedDate === item.date && (
              <div className="mt-3 pt-3 border-t border-primary/10">
                {item.narrative ? (
                  <p className="text-sm text-foreground whitespace-pre-wrap">
                    {item.narrative}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    작성된 담론이 없습니다.
                  </p>
                )}

                {item.articles && item.articles.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-xs font-semibold text-muted-foreground mb-2">
                      📰 담론에 포함된 뉴스
                    </h4>
                    <div className="space-y-2">
                      {item.articles.map((article, articleIndex) => (
                        <div
                          key={`${item.date}-article-${articleIndex}`}
                          className="p-3 bg-background rounded border border-primary/10"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              {article.keyword && (
                                <span className="inline-block px-2 py-0.5 text-xs bg-secondary/20 text-secondary rounded mb-2">
                                  #{article.keyword}
                                </span>
                              )}
                              <h5 className="text-sm font-medium text-foreground">
                                <a
                                  href={article.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="hover:text-primary transition-colors"
                                >
                                  {article.title}
                                </a>
                              </h5>
                              {article.summary && (
                                <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap">
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

                <div className="mt-4 p-3 bg-primary/5 rounded">
                  <h4 className="text-xs font-semibold text-primary mb-2">
                    💡 검증 포인트
                  </h4>
                  <ul className="space-y-1 text-xs text-muted-foreground">
                    <li>• 당시 예측한 시장 방향이 맞았나요?</li>
                    <li>• 주목한 지표가 실제로 중요했나요?</li>
                    <li>• 놓친 변수는 무엇인가요?</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
