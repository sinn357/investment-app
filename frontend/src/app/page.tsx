'use client';

import React from 'react';
import Navigation from '@/components/Navigation';
import Link from 'next/link';

export default function Home() {
  const quickLinks = [
    {
      href: '/philosophy',
      label: '투자철학',
      icon: '💎',
      description: '나만의 투자 나침반 설정'
    },
    {
      href: '/indicators',
      label: '경제지표',
      icon: '📊',
      description: '실시간 경제 데이터 대시보드'
    },
    {
      href: '/portfolio',
      label: '포트폴리오',
      icon: '💼',
      description: '자산 관리 및 목표 추적'
    },
    {
      href: '/expenses',
      label: '가계부',
      icon: '💰',
      description: '지출/수입 관리 및 예산 설정'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* 임시 홈 화면 */}
        <div className="text-center">
          <div className="mb-8">
            <div className="inline-block w-24 h-24 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center shadow-xl mb-4">
              <span className="text-white font-bold text-4xl">투자</span>
            </div>
            <h1 className="text-4xl font-bold text-foreground mb-4">
              투자 어시스턴트에 오신 것을 환영합니다
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              경제지표 분석부터 포트폴리오 관리, 가계부 기록까지
              <br />
              모든 투자 활동을 하나의 플랫폼에서 관리하세요.
            </p>
          </div>

          {/* 빠른 액세스 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
            {quickLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="group p-6 bg-card border border-primary/20 rounded-xl hover:border-primary/40 hover:shadow-lg transition-all"
              >
                <div className="text-5xl mb-3">{link.icon}</div>
                <h3 className="text-xl font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                  {link.label}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {link.description}
                </p>
              </Link>
            ))}
          </div>

          {/* 상태 메시지 */}
          <div className="mt-16 p-6 bg-primary/5 border border-primary/20 rounded-lg max-w-2xl mx-auto">
            <p className="text-muted-foreground">
              💡 <strong className="text-foreground">곧 새로운 홈페이지가 준비됩니다!</strong>
              <br />
              <span className="text-sm">Phase 2에서 프리미엄 랜딩페이지를 구현할 예정입니다.</span>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
