/**
 * GlassCard Component - Oracle 2025 디자인 시스템
 *
 * 글래스모피즘 스타일의 재사용 가능한 카드 컴포넌트
 * - 반투명 배경 + 블러 효과
 * - 골드 테두리 + 호버 효과
 * - fade-in-up 애니메이션 지원
 */

import React, { ReactNode } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  /** 애니메이션 활성화 (기본: true) */
  animate?: boolean;
  /** 애니메이션 지연 (ms) */
  animationDelay?: number;
  /** 호버 효과 활성화 (기본: true) */
  hover?: boolean;
  /** 발광 효과 활성화 (기본: false) */
  glow?: boolean;
  /** 클릭 이벤트 핸들러 */
  onClick?: () => void;
}

export default function GlassCard({
  children,
  className = '',
  animate = true,
  animationDelay = 0,
  hover = true,
  glow = false,
  onClick,
}: GlassCardProps) {
  const baseClasses = 'glass-card';
  const animationClasses = animate ? 'fade-in-up' : '';
  const glowClasses = glow ? 'glow-effect' : '';
  const hoverClasses = hover ? '' : 'hover:transform-none hover:shadow-none';
  const cursorClass = onClick ? 'cursor-pointer' : '';

  const combinedClasses = [
    baseClasses,
    animationClasses,
    glowClasses,
    hoverClasses,
    cursorClass,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const style = animationDelay > 0 ? { animationDelay: `${animationDelay}ms` } : undefined;

  return (
    <div className={combinedClasses} style={style} onClick={onClick}>
      {children}
    </div>
  );
}
