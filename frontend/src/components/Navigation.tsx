'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useDarkMode } from '@/hooks/useDarkMode';

interface User {
  id: number;
  username: string;
  token?: string;
}

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const { isDarkMode, toggleDarkMode } = useDarkMode();

  // localStorage에서 사용자 정보 로드
  useEffect(() => {
    const savedUser = localStorage.getItem('portfolio_user');
    const savedToken = localStorage.getItem('auth_token');

    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        if (savedToken) {
          userData.token = savedToken;
        }
        setUser(userData);
      } catch (error) {
        console.error('Error parsing saved user data:', error);
        localStorage.removeItem('portfolio_user');
        localStorage.removeItem('auth_token');
      }
    }
  }, []);

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('portfolio_user');
    localStorage.removeItem('auth_token');
    // 홈페이지로 이동
    router.push('/');
  };

  const navItems = [
    { href: '/', label: '홈', icon: 'home' },
    { href: '/indicators', label: '경제지표', icon: 'chart' },
    { href: '/portfolio', label: '포트폴리오', icon: 'portfolio' },
    { href: '/expenses', label: '가계부', icon: 'expenses' }
  ];

  const getIcon = (iconType: string) => {
    switch (iconType) {
      case 'home':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        );
      case 'chart':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        );
      case 'portfolio':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        );
      case 'expenses':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <nav className="bg-gradient-to-r from-primary via-primary/90 to-secondary/20 shadow-lg border-b border-primary/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* 로고 */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center shadow-md">
                <span className="text-white font-bold text-sm">투자</span>
              </div>
              <span className="ml-2 text-xl font-semibold text-white drop-shadow-sm">
                어시스턴트
              </span>
            </Link>
          </div>

          {/* 중앙 네비게이션 메뉴 */}
          <div className="flex space-x-4">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive
                      ? 'text-white bg-secondary shadow-md'
                      : 'text-white/90 hover:text-white hover:bg-white/10 backdrop-blur-sm'
                  }`}
                >
                  {getIcon(item.icon)}
                  <span className="ml-2">{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* 우측 인증 UI */}
          <div className="flex items-center space-x-3">
            {/* 다크모드 토글 */}
            <button
              onClick={toggleDarkMode}
              className="p-2 text-white/90 hover:text-white hover:bg-white/10 rounded-md transition-colors"
              aria-label="다크모드 토글"
            >
              {isDarkMode ? (
                // 해 아이콘 (라이트모드로 전환)
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                // 달 아이콘 (다크모드로 전환)
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            {user ? (
              <>
                <div className="text-sm text-white/80">
                  <span className="font-medium text-white">{user.username}</span>님
                </div>
                <button
                  onClick={() => router.push('/settings')}
                  className="px-3 py-1.5 text-sm font-medium text-white border border-white/30 rounded-md hover:bg-white/10 backdrop-blur-sm transition-colors"
                >
                  계정설정
                </button>
                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 text-sm font-medium text-white border border-white/30 rounded-md hover:bg-white/10 backdrop-blur-sm transition-colors"
                >
                  로그아웃
                </button>
              </>
            ) : (
              <button
                onClick={() => router.push('/portfolio')}
                className="px-4 py-2 text-sm font-medium text-white bg-secondary hover:bg-secondary/80 rounded-md shadow-md transition-colors"
              >
                로그인
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}