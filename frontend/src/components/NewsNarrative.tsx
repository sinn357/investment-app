'use client';

import React, { useState } from 'react';
import NarrativeGuide from './NarrativeGuide';

interface Article {
  title: string;
  url: string;
  summary: string;
  keyword: string;
}

interface NewsNarrativeProps {
  articles: Article[];
  myNarrative: string;
  onChange: (data: { articles: Article[]; myNarrative: string }) => void;
  mmcScore?: number;
  phase?: string;
  topChanges?: {
    increases: string[];
    decreases: string[];
  };
}

export default function NewsNarrative({ articles, myNarrative, onChange, mmcScore, phase, topChanges }: NewsNarrativeProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newArticle, setNewArticle] = useState({
    title: '',
    url: '',
    summary: '',
    keyword: ''
  });

  const handleAddArticle = () => {
    if (!newArticle.title.trim() || !newArticle.url.trim()) {
      alert('제목과 URL은 필수입니다.');
      return;
    }
    onChange({
      articles: [...articles, newArticle],
      myNarrative
    });
    setNewArticle({ title: '', url: '', summary: '', keyword: '' });
    setIsAdding(false);
  };

  const handleRemoveArticle = (index: number) => {
    onChange({
      articles: articles.filter((_, i) => i !== index),
      myNarrative
    });
  };

  const handleNarrativeChange = (value: string) => {
    onChange({
      articles,
      myNarrative: value
    });
  };

  return (
    <div className="bg-card rounded-lg p-6 border-2 border-primary/20">
      <h2 className="text-xl font-semibold text-card-foreground mb-4 flex items-center">
        <span className="text-2xl mr-2">📰</span>
        뉴스 & 담론
      </h2>

      {/* 기사 스크랩 섹션 */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-muted-foreground mb-3">스크랩한 기사</h3>

        {articles.length === 0 && !isAdding && (
          <p className="text-sm text-muted-foreground italic text-center py-4 border-2 border-dashed border-primary/20 rounded-lg">
            아직 스크랩한 기사가 없습니다.
          </p>
        )}

        <div className="space-y-3">
          {articles.map((article, index) => (
            <div
              key={index}
              className="p-4 bg-background rounded-lg border border-primary/20 hover:border-primary/40 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  {article.keyword && (
                    <span className="inline-block px-2 py-0.5 text-xs bg-secondary/20 text-secondary rounded mb-2">
                      #{article.keyword}
                    </span>
                  )}
                  <h4 className="font-medium text-foreground mb-1">
                    <a
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-primary transition-colors"
                    >
                      {article.title}
                    </a>
                  </h4>
                  {article.summary && (
                    <p className="text-sm text-muted-foreground">{article.summary}</p>
                  )}
                </div>
                <button
                  onClick={() => handleRemoveArticle(index)}
                  className="text-red-500 hover:text-red-700 text-sm flex-shrink-0"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* 기사 추가 폼 */}
        {isAdding ? (
          <div className="mt-3 p-4 bg-background rounded-lg border border-primary/20 space-y-3">
            <input
              type="text"
              placeholder="기사 제목 (필수)"
              value={newArticle.title}
              onChange={(e) => setNewArticle({ ...newArticle, title: e.target.value })}
              className="w-full px-3 py-2 bg-card border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
            />
            <input
              type="url"
              placeholder="URL (필수)"
              value={newArticle.url}
              onChange={(e) => setNewArticle({ ...newArticle, url: e.target.value })}
              className="w-full px-3 py-2 bg-card border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
            />
            <input
              type="text"
              placeholder="키워드 (예: 금리인하, 인플레이션)"
              value={newArticle.keyword}
              onChange={(e) => setNewArticle({ ...newArticle, keyword: e.target.value })}
              className="w-full px-3 py-2 bg-card border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
            />
            <textarea
              placeholder="요약 (선택사항)"
              value={newArticle.summary}
              onChange={(e) => setNewArticle({ ...newArticle, summary: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 bg-card border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground resize-none"
            />
            <div className="flex gap-2">
              <button
                onClick={handleAddArticle}
                className="flex-1 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium transition-colors"
              >
                추가
              </button>
              <button
                onClick={() => setIsAdding(false)}
                className="flex-1 px-4 py-2 bg-muted hover:bg-muted/80 text-muted-foreground rounded-lg font-medium transition-colors"
              >
                취소
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsAdding(true)}
            className="mt-3 w-full px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg font-medium transition-colors border-2 border-dashed border-primary/30"
          >
            + 기사 추가
          </button>
        )}
      </div>

      {/* 내 담론 섹션 */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground mb-3">내 담론 (경제 전망)</h3>

        {/* 담론 작성 가이드 (Phase 3) */}
        {mmcScore !== undefined && phase && topChanges && (
          <NarrativeGuide
            mmcScore={mmcScore}
            phase={phase}
            topChanges={topChanges}
          />
        )}

        <textarea
          value={myNarrative}
          onChange={(e) => handleNarrativeChange(e.target.value)}
          placeholder="오늘의 경제 상황을 어떻게 해석하시나요? 자신만의 시각과 전망을 기록하세요.&#10;&#10;예시:&#10;- 현재 연준의 금리 정책은...&#10;- 인플레이션 지표를 볼 때...&#10;- 향후 6개월간 시장 전망은..."
          rows={8}
          className="w-full px-4 py-3 bg-background border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground resize-none"
        />
        <p className="text-xs text-muted-foreground mt-2">
          💡 나중에 돌아봤을 때 자신의 판단을 검증할 수 있습니다.
        </p>
      </div>
    </div>
  );
}
