'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import ParticlesBackground from '@/components/ParticlesBackground';
import { TrendingUp, BarChart3, Briefcase, Wallet, Target, Settings } from 'lucide-react';

export default function Home() {
  const [displayedText, setDisplayedText] = useState('');
  const [currentChar, setCurrentChar] = useState(0);
  const fullText = 'Connecting data. Empowering decisions.';

  // 타이핑 효과
  useEffect(() => {
    if (currentChar < fullText.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(prev => prev + fullText[currentChar]);
        setCurrentChar(prev => prev + 1);
      }, 80);
      return () => clearTimeout(timeout);
    }
  }, [currentChar]);

  const features = [
    {
      icon: Target,
      title: '투자철학',
      description: '나만의 투자 원칙 설정',
      path: '/philosophy',
      color: 'from-primary/20 to-primary/5',
      iconColor: 'text-primary'
    },
    {
      icon: BarChart3,
      title: '경제지표',
      description: '실시간 경제 데이터',
      path: '/indicators',
      color: 'from-secondary/20 to-secondary/5',
      iconColor: 'text-secondary'
    },
    {
      icon: TrendingUp,
      title: '섹터분석',
      description: '6대 산업군 분석',
      path: '/industries',
      color: 'from-primary/20 to-primary/5',
      iconColor: 'text-primary'
    },
    {
      icon: Briefcase,
      title: '포트폴리오',
      description: '자산 관리 대시보드',
      path: '/portfolio',
      color: 'from-secondary/20 to-secondary/5',
      iconColor: 'text-secondary'
    },
    {
      icon: Wallet,
      title: '가계부',
      description: '수입 지출 추적',
      path: '/expenses',
      color: 'from-primary/20 to-primary/5',
      iconColor: 'text-primary'
    },
    {
      icon: Settings,
      title: '계정설정',
      description: '프로필 및 환경설정',
      path: '/settings',
      color: 'from-secondary/20 to-secondary/5',
      iconColor: 'text-secondary'
    }
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* 그라디언트 메쉬 배경 */}
      <div className="fixed inset-0 bg-gradient-to-br from-primary/10 via-background to-secondary/10 animate-gradient" />

      {/* 떠다니는 빛 구체 */}
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-float" />
      <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-3xl animate-float-delayed" />

      {/* 파티클 배경 */}
      <ParticlesBackground />

      {/* 컨텐츠 */}
      <div className="relative z-10">
        <Navigation />

        {/* 히어로 섹션 */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center min-h-[calc(100vh-4rem)] py-12">
          <div className="w-full max-w-5xl">
            {/* 글래스모피즘 히어로 카드 */}
            <div className="glass-card rounded-3xl p-12 md:p-16 lg:p-20 text-center shimmer-effect mb-12 fade-in-up">
              {/* 로고 & 타이틀 */}
              <div className="mb-12">
                <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold mb-6">
                  <span className="bg-gradient-to-r from-primary via-yellow-400 to-secondary bg-clip-text text-transparent animate-gradient">
                    ORACLE
                  </span>
                </h1>
                <p className="text-2xl md:text-3xl text-muted-foreground font-medium mb-8">
                  Market Intelligence Platform
                </p>

                {/* 타이핑 효과 */}
                <div className="font-mono text-lg md:text-xl text-foreground/80 min-h-[2rem]">
                  {displayedText}
                  <span className="inline-block w-0.5 h-6 bg-primary ml-1 animate-pulse" />
                </div>
              </div>

              {/* CTA 버튼 */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link href="/indicators">
                  <button className="group relative px-8 py-4 bg-gradient-to-r from-primary to-secondary text-white rounded-xl font-semibold text-lg hover:scale-105 transition-all glow-effect shadow-lg">
                    <span className="relative z-10 flex items-center gap-2">
                      <BarChart3 className="w-5 h-5" />
                      시작하기
                    </span>
                  </button>
                </Link>
                <Link href="/philosophy">
                  <button className="px-8 py-4 glass-card rounded-xl font-semibold text-lg hover:scale-105 transition-all">
                    더 알아보기
                  </button>
                </Link>
              </div>
            </div>

            {/* 퀵 네비게이션 카드 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, i) => {
                const Icon = feature.icon;
                return (
                  <Link href={feature.path} key={i}>
                    <div
                      className={`glass-card p-8 rounded-2xl group hover:scale-105 transition-all cursor-pointer fade-in-up`}
                      style={{ animationDelay: `${i * 0.1}s` }}
                    >
                      {/* 아이콘 */}
                      <div className={`mb-4 p-4 rounded-full bg-gradient-to-br ${feature.color} inline-block group-hover:animate-bounce`}>
                        <Icon className={`w-8 h-8 ${feature.iconColor}`} />
                      </div>

                      {/* 타이틀 */}
                      <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                        {feature.title}
                      </h3>

                      {/* 설명 */}
                      <p className="text-sm text-muted-foreground">
                        {feature.description}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* 하단 상태 바 */}
            <div className="mt-12 flex items-center justify-between text-sm text-muted-foreground font-mono px-4 fade-in-up" style={{ animationDelay: '0.6s' }}>
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  SYSTEM READY
                </span>
                <span className="hidden sm:inline">|</span>
                <span className="hidden sm:inline">{new Date().toLocaleDateString('ko-KR')}</span>
              </div>
              <div className="text-xs sm:text-sm">
                v2.0.0
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
