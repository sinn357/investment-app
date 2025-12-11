'use client';

import React, { useEffect, useRef } from 'react';
import Navigation from '@/components/Navigation';
import Link from 'next/link';

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mousePosition, setMousePosition] = React.useState({ x: 0, y: 0 });

  // 마우스 위치 추적
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // 움직이는 그리드 + 파티클 애니메이션
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 캔버스 크기 설정
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    let animationId: number;
    let offset = 0;

    // 파티클 생성
    interface Particle {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      opacity: number;
      fadeSpeed: number;
    }

    const particles: Particle[] = [];
    const particleCount = 50;

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2 + 1,
        speedX: (Math.random() - 0.5) * 0.5,
        speedY: (Math.random() - 0.5) * 0.5,
        opacity: Math.random(),
        fadeSpeed: Math.random() * 0.02 + 0.01
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 그리드 그리기
      const gridSize = 40;
      ctx.strokeStyle = 'rgba(218, 165, 32, 0.15)'; // 골드 그리드
      ctx.lineWidth = 0.5;

      // 세로선
      for (let x = (offset % gridSize) - gridSize; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }

      // 가로선
      for (let y = (offset % gridSize) - gridSize; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // 파티클 그리기 및 업데이트
      particles.forEach((particle) => {
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(218, 165, 32, ${particle.opacity})`;
        ctx.fill();

        // 파티클 이동
        particle.x += particle.speedX;
        particle.y += particle.speedY;

        // 반짝이는 효과
        particle.opacity += particle.fadeSpeed;
        if (particle.opacity >= 1 || particle.opacity <= 0) {
          particle.fadeSpeed *= -1;
        }

        // 경계 처리
        if (particle.x < 0 || particle.x > canvas.width) particle.speedX *= -1;
        if (particle.y < 0 || particle.y > canvas.height) particle.speedY *= -1;
      });

      offset += 0.3; // 그리드 이동 속도
      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationId);
    };
  }, []);

  const features = [
    {
      icon: '📊',
      title: '경제지표 분석',
      description: '실시간 경제 데이터로 시장의 흐름을 읽으세요',
      href: '/indicators'
    },
    {
      icon: '💎',
      title: '투자 철학',
      description: '당신만의 투자 원칙과 전략을 정립하세요',
      href: '/philosophy'
    },
    {
      icon: '💼',
      title: '포트폴리오 관리',
      description: '자산을 체계적으로 관리하고 목표를 추적하세요',
      href: '/portfolio'
    }
  ];

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* 배경 그라데이션 */}
      <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900" />

      {/* 움직이는 그리드 */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none"
      />

      {/* 골드 글로우 효과 */}
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
      <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-3xl" />

      {/* 컨텐츠 */}
      <div className="relative z-10">
        <Navigation />

        {/* Hero Section */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="pt-32 pb-20 text-center">
            {/* 메인 타이틀 */}
            <h1 className="text-7xl md:text-8xl font-bold mb-6 leading-tight">
              <span className="bg-gradient-to-r from-primary via-yellow-400 to-secondary bg-clip-text text-transparent animate-gradient-x">
                투자의 새로운 기준
              </span>
            </h1>

            {/* 서브 타이틀 */}
            <p className="text-xl md:text-2xl text-gray-300 mb-4 max-w-3xl mx-auto leading-relaxed">
              경제지표부터 포트폴리오 관리까지, 모든 투자 활동을 한 곳에서
            </p>
            <p className="text-lg text-gray-400 mb-12 max-w-2xl mx-auto">
              데이터 기반 의사결정으로 더 나은 투자 성과를 만들어보세요
            </p>

            {/* CTA 버튼들 */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-20">
              <Link
                href="/portfolio"
                className="group relative px-8 py-4 bg-gradient-to-r from-primary to-secondary rounded-lg font-semibold text-white shadow-2xl overflow-hidden transition-all hover:scale-105 hover:shadow-primary/50"
              >
                <span className="relative z-10">포트폴리오 시작하기</span>
                {/* 글로우 효과 */}
                <div className="absolute inset-0 bg-gradient-to-r from-primary to-secondary opacity-0 group-hover:opacity-100 blur-xl transition-opacity" />
              </Link>

              <Link
                href="/indicators"
                className="group px-8 py-4 border-2 border-primary/50 rounded-lg font-semibold text-white hover:border-primary hover:bg-primary/10 transition-all backdrop-blur-sm"
              >
                경제지표 둘러보기
              </Link>
            </div>

            {/* Feature Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {features.map((feature, index) => {
                // 플로팅 애니메이션을 위한 오프셋
                const floatOffset = Math.sin(Date.now() / 1000 + index) * 5;

                return (
                  <Link
                    key={index}
                    href={feature.href}
                    className="group relative p-8 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md hover:bg-white/10 hover:border-primary/50 transition-all duration-300 animate-float"
                    style={{
                      animationDelay: `${index * 100}ms`,
                      transform: `translateY(${floatOffset}px)`,
                    }}
                    onMouseMove={(e) => {
                      const card = e.currentTarget;
                      const rect = card.getBoundingClientRect();
                      const x = e.clientX - rect.left;
                      const y = e.clientY - rect.top;
                      const centerX = rect.width / 2;
                      const centerY = rect.height / 2;
                      const rotateX = (y - centerY) / 10;
                      const rotateY = (centerX - x) / 10;
                      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(${floatOffset}px)`;
                    }}
                    onMouseLeave={(e) => {
                      const card = e.currentTarget;
                      card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(${floatOffset}px)`;
                    }}
                  >
                    {/* Glassmorphism 효과 */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-2xl pointer-events-none" />

                    <div className="relative">
                      <div className="text-5xl mb-4 transform group-hover:scale-110 transition-transform">
                        {feature.icon}
                      </div>
                      <h3 className="text-xl font-bold text-white mb-3 group-hover:text-primary transition-colors">
                        {feature.title}
                      </h3>
                      <p className="text-gray-400 group-hover:text-gray-300 transition-colors">
                        {feature.description}
                      </p>
                    </div>

                    {/* 호버 시 테두리 글로우 */}
                    <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-r from-primary/20 to-secondary/20 blur-xl -z-10 pointer-events-none" />
                  </Link>
                );
              })}
            </div>

            {/* 스크롤 힌트 */}
            <div className="mt-20 animate-bounce">
              <svg className="w-6 h-6 mx-auto text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
