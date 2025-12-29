/**
 * EnhancedButton Component - Oracle 2025 디자인 시스템
 *
 * 골드-에메랄드 테마의 향상된 버튼 컴포넌트
 * - Primary(골드), Secondary(에메랄드), Outline 스타일
 * - Shimmer 효과, Ripple 애니메이션 지원
 * - 로딩 상태, 비활성화 상태
 */

import React, { ReactNode, useState, useRef, MouseEvent } from 'react';

interface EnhancedButtonProps {
  children: ReactNode;
  /** 버튼 스타일 */
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  /** 버튼 크기 */
  size?: 'sm' | 'md' | 'lg';
  /** 전체 너비 사용 */
  fullWidth?: boolean;
  /** 비활성화 상태 */
  disabled?: boolean;
  /** 로딩 상태 */
  loading?: boolean;
  /** Shimmer 효과 활성화 */
  shimmer?: boolean;
  /** Ripple 효과 활성화 (기본: true) */
  ripple?: boolean;
  /** 클릭 이벤트 핸들러 */
  onClick?: () => void;
  /** HTML button type */
  type?: 'button' | 'submit' | 'reset';
  /** 추가 CSS 클래스 */
  className?: string;
}

export default function EnhancedButton({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  loading = false,
  shimmer = false,
  ripple = true,
  onClick,
  type = 'button',
  className = '',
}: EnhancedButtonProps) {
  const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([]);
  const rippleIdRef = useRef(0);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Ripple 효과 생성
  const createRipple = (event: MouseEvent<HTMLButtonElement>) => {
    if (!ripple || disabled || loading) return;

    const button = buttonRef.current;
    if (!button) return;

    const rect = button.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const id = rippleIdRef.current++;

    setRipples((prev) => [...prev, { x, y, id }]);

    // 600ms 후 제거
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== id));
    }, 600);
  };

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    createRipple(event);
    if (onClick && !disabled && !loading) {
      onClick();
    }
  };

  // 기본 스타일
  const baseClasses =
    'relative overflow-hidden rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';

  // Variant 스타일
  const variantClasses = {
    primary:
      'bg-gradient-to-r from-[#DAA520] to-[#D4AF37] text-white hover:from-[#F4E68A] hover:to-[#DAA520] focus:ring-[#DAA520] shadow-lg hover:shadow-xl',
    secondary:
      'bg-gradient-to-r from-[#50C878] to-[#2ECC71] text-white hover:from-[#7DCEA0] hover:to-[#50C878] focus:ring-[#50C878] shadow-lg hover:shadow-xl',
    outline:
      'bg-transparent border-2 border-[#DAA520] text-[#DAA520] hover:bg-[#DAA520] hover:text-white focus:ring-[#DAA520]',
    ghost:
      'bg-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 focus:ring-gray-300',
  };

  // Size 스타일
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  // 비활성화/로딩 스타일
  const disabledClasses = disabled || loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer';

  // Shimmer 효과
  const shimmerClasses = shimmer ? 'shimmer-effect' : '';

  // 전체 너비
  const widthClasses = fullWidth ? 'w-full' : '';

  const combinedClasses = [
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    disabledClasses,
    shimmerClasses,
    widthClasses,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      ref={buttonRef}
      type={type}
      className={combinedClasses}
      onClick={handleClick}
      disabled={disabled || loading}
    >
      {/* 로딩 스피너 */}
      {loading && (
        <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
      )}

      {/* 버튼 내용 */}
      <span className="relative z-10">{children}</span>

      {/* Ripple 효과 */}
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="ripple"
          style={{
            left: ripple.x,
            top: ripple.y,
          }}
        />
      ))}
    </button>
  );
}
