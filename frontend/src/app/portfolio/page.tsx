'use client';

import { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import EnhancedPortfolioForm from '@/components/EnhancedPortfolioForm';
import PortfolioDashboard from '@/components/PortfolioDashboard';
import AuthForm from '@/components/AuthForm';

export interface PortfolioItem {
  id: string;
  assetType: string;
  name: string;
  amount: number;
  quantity?: number;
  avgPrice?: number;
  principal?: number;
  evaluationAmount?: number;
  date: string;
  note?: string;
  createdAt: string;
}

interface User {
  id: number;
  username: string;
  token?: string;
}

export default function PortfolioPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [user, setUser] = useState<User | null>(null);

  // 로컬 스토리지에서 사용자 정보 로드 (토큰 포함)
  useEffect(() => {
    const savedUser = localStorage.getItem('portfolio_user');
    const savedToken = localStorage.getItem('auth_token');

    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        // 저장된 토큰이 있으면 추가
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

  const handleLogin = (userData: User) => {
    setUser(userData);
    // 로컬 스토리지에 사용자 정보 저장
    localStorage.setItem('portfolio_user', JSON.stringify(userData));
    // 토큰이 있으면 별도 저장
    if (userData.token) {
      localStorage.setItem('auth_token', userData.token);
    }
  };

  const handleLogout = () => {
    setUser(null);
    // 모든 인증 관련 데이터 삭제
    localStorage.removeItem('portfolio_user');
    localStorage.removeItem('auth_token');
    setRefreshKey(prev => prev + 1); // 대시보드 초기화
  };

  const handleAssetAdded = () => {
    // 자산 추가 후 대시보드 새로고침
    setRefreshKey(prev => prev + 1);
  };

  // 로그인하지 않은 경우 인증 폼 표시
  if (!user) {
    return <AuthForm onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />

      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                포트폴리오 관리
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                보유 자산을 체계적으로 관리하세요
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <span className="font-medium text-gray-900 dark:text-white">{user.username}</span>님
              </div>
              <a
                href="/settings"
                className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                계정 설정
              </a>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                로그아웃
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* 상단 섹션: 입력 폼 + 우측 정보 영역 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 입력 폼 섹션 */}
            <div className="lg:col-span-1">
              <EnhancedPortfolioForm user={user} onAddItem={handleAssetAdded} />
            </div>

            {/* 우측 정보 영역 */}
            <div className="lg:col-span-2">
              <PortfolioDashboard key={`${refreshKey}-${user.id}`} user={user} showSideInfo={true} />
            </div>
          </div>

          {/* 하단 섹션: 전체 대시보드 */}
          <div>
            <PortfolioDashboard key={`${refreshKey}-${user.id}`} user={user} showSideInfo={false} />
          </div>
        </div>
      </main>
    </div>
  );
}