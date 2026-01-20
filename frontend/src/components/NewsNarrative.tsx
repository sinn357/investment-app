'use client';

import React, { useState } from 'react';
import NarrativeGuide from './NarrativeGuide';
import GlassCard from './GlassCard';

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
  selectedDate: string;
  onDateChange: (date: string) => void;
}

export default function NewsNarrative({ articles, myNarrative, onChange, mmcScore, phase, selectedDate, onDateChange }: NewsNarrativeProps) {
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
    <GlassCard className="p-6" animate animationDelay={100}>
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-primary/10">
        <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
          <span className="text-2xl">📰</span>
          뉴스 & 담론
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">기준일</span>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => onDateChange(e.target.value)}
            className="px-3 py-1.5 text-sm bg-background border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
          />
        </div>
      </div>

      {/* 2단 레이아웃 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 좌측: 담론 작성 */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-lg">✍️</span>
            <h3 className="text-sm font-semibold text-foreground">담론 작성</h3>
          </div>

          {/* 담론 작성 가이드 (Phase 3) */}
          {mmcScore !== undefined && phase && (
            <NarrativeGuide
              mmcScore={mmcScore}
              phase={phase}
            />
          )}

          <textarea
            value={myNarrative}
            onChange={(e) => handleNarrativeChange(e.target.value)}
            placeholder="오늘의 경제 상황을 어떻게 해석하시나요?&#10;&#10;• 현재 연준의 금리 정책은...&#10;• 인플레이션 지표를 볼 때...&#10;• 향후 6개월간 시장 전망은..."
            rows={10}
            className="w-full px-4 py-3 bg-background/50 border border-primary/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground resize-none placeholder:text-muted-foreground/60"
          />
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <span>💡</span>
            <span>나중에 돌아봤을 때 자신의 판단을 검증할 수 있습니다.</span>
          </p>
        </div>

        {/* 우측: 뉴스 목록 */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">📎</span>
              <h3 className="text-sm font-semibold text-foreground">참고 뉴스</h3>
              {articles.length > 0 && (
                <span className="px-2 py-0.5 text-xs bg-primary/10 text-primary rounded-full">
                  {articles.length}
                </span>
              )}
            </div>
          </div>

          {/* 뉴스 목록 */}
          <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
            {articles.length === 0 && !isAdding && (
              <div className="text-center py-8 border-2 border-dashed border-primary/20 rounded-xl bg-muted/30">
                <span className="text-3xl mb-2 block">📰</span>
                <p className="text-sm text-muted-foreground">
                  참고할 뉴스를 추가해보세요
                </p>
              </div>
            )}

            {articles.map((article, index) => (
              <div
                key={index}
                className="group p-3 bg-background/50 rounded-xl border border-primary/10 hover:border-primary/30 hover:shadow-sm transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {article.keyword && (
                        <span className="inline-flex items-center px-2 py-0.5 text-xs bg-secondary/20 text-secondary rounded-full">
                          #{article.keyword}
                        </span>
                      )}
                    </div>
                    <a
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-foreground hover:text-primary transition-colors line-clamp-2"
                    >
                      {article.title}
                    </a>
                    {article.summary && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{article.summary}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleRemoveArticle(index)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                    title="삭제"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* 뉴스 추가 폼 */}
          {isAdding ? (
            <div className="p-4 bg-background/50 rounded-xl border border-primary/20 space-y-3">
              <input
                type="text"
                placeholder="뉴스 제목 *"
                value={newArticle.title}
                onChange={(e) => setNewArticle({ ...newArticle, title: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-card border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
              />
              <input
                type="url"
                placeholder="URL *"
                value={newArticle.url}
                onChange={(e) => setNewArticle({ ...newArticle, url: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-card border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="키워드"
                  value={newArticle.keyword}
                  onChange={(e) => setNewArticle({ ...newArticle, keyword: e.target.value })}
                  className="px-3 py-2 text-sm bg-card border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
                />
                <input
                  type="text"
                  placeholder="요약 (선택)"
                  value={newArticle.summary}
                  onChange={(e) => setNewArticle({ ...newArticle, summary: e.target.value })}
                  className="px-3 py-2 text-sm bg-card border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleAddArticle}
                  className="flex-1 px-4 py-2 text-sm bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium transition-colors"
                >
                  추가
                </button>
                <button
                  onClick={() => setIsAdding(false)}
                  className="px-4 py-2 text-sm bg-muted hover:bg-muted/80 text-muted-foreground rounded-lg font-medium transition-colors"
                >
                  취소
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsAdding(true)}
              className="w-full px-4 py-3 bg-primary/5 hover:bg-primary/10 text-primary rounded-xl font-medium transition-colors border border-dashed border-primary/30 flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              뉴스 추가
            </button>
          )}
        </div>
      </div>
    </GlassCard>
  );
}
