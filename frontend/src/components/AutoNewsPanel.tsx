'use client';

import { useState } from 'react';

interface AutoNews {
  title: string;
  url: string;
  summary: string;
  source: string;
  published: string;
  keyword: string;
}

interface AutoNewsPanelProps {
  onAddArticle: (article: { title: string; url: string; summary: string; keyword: string }) => void;
}

export default function AutoNewsPanel({ onAddArticle }: AutoNewsPanelProps) {
  const [news, setNews] = useState<AutoNews[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAutoNews = async () => {
    setLoading(true);
    try {
      const res = await fetch('https://investment-app-backend-x166.onrender.com/api/v3/news/auto-fetch?hours=24');
      const result = await res.json();
      if (result.status === 'success') {
        setNews(result.data.news);
      }
    } catch (error) {
      console.error('자동 뉴스 수집 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-6 bg-card rounded-lg p-4 border border-primary/20">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-foreground flex items-center">
          <span className="mr-2">🤖</span>
          자동 수집 뉴스 (최근 24시간)
        </h3>
        <button
          onClick={fetchAutoNews}
          disabled={loading}
          className="px-3 py-1 bg-primary text-primary-foreground text-xs rounded hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? '수집 중...' : '🔄 새로고침'}
        </button>
      </div>

      {news.length === 0 && !loading && (
        <p className="text-sm text-muted-foreground text-center py-4">
          &quot;새로고침&quot; 버튼을 눌러 최신 뉴스를 가져오세요.
        </p>
      )}

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {news.map((item, idx) => (
          <div
            key={idx}
            className="p-3 bg-background rounded border border-primary/10 hover:border-primary/30 transition-colors"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-muted-foreground">{item.source}</span>
                  <span className="text-xs bg-secondary/20 text-secondary px-2 py-0.5 rounded">
                    #{item.keyword}
                  </span>
                </div>
                <h4 className="text-sm font-medium text-foreground mb-1">
                  <a href={item.url} target="_blank" rel="noopener noreferrer" className="hover:text-primary">
                    {item.title}
                  </a>
                </h4>
                <p className="text-xs text-muted-foreground line-clamp-2">{item.summary}</p>
              </div>
              <button
                onClick={() => onAddArticle({
                  title: item.title,
                  url: item.url,
                  summary: item.summary,
                  keyword: item.keyword
                })}
                className="px-2 py-1 bg-primary/10 text-primary text-xs rounded hover:bg-primary/20"
              >
                + 추가
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
