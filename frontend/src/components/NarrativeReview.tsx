'use client';

import { useState, useEffect } from 'react';

interface PastNarrative {
  date: string;
  narrative: string;
  articles_count: number;
}

interface NarrativeReviewProps {
  userId: number;
}

export default function NarrativeReview({ userId }: NarrativeReviewProps) {
  const [history, setHistory] = useState<PastNarrative[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userId) {
      fetchHistory();
    }
  }, [userId]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `https://investment-app-backend-x166.onrender.com/api/economic-narrative/history?user_id=${userId}&limit=10`
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
