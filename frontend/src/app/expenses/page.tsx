'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '../../components/Navigation';
import ExpenseManagementDashboard from '../../components/ExpenseManagementDashboard';
import AuthForm from '@/components/AuthForm';

interface User {
  id: number;
  username: string;
  token?: string;
}

export default function ExpensesPage() {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  // 로컬 스토리지에서 사용자 정보 로드
  useEffect(() => {
    const savedUser = localStorage.getItem('portfolio_user');
    const savedToken = localStorage.getItem('auth_token');

    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        if (savedToken) {
          userData.token = savedToken;
        }
        // user.id가 없으면 잘못된 데이터로 간주하고 재로그인 요구
        if (!userData.id) {
          console.warn('Invalid user data (missing id), clearing localStorage');
          localStorage.removeItem('portfolio_user');
          localStorage.removeItem('auth_token');
          localStorage.removeItem('userId'); // 레거시 키도 제거
          return;
        }
        setUser(userData);
      } catch (error) {
        console.error('Error parsing saved user data:', error);
        localStorage.removeItem('portfolio_user');
        localStorage.removeItem('auth_token');
        localStorage.removeItem('userId');
      }
    }
  }, []);

  const handleLogin = (userData: User) => {
    setUser(userData);
    localStorage.setItem('portfolio_user', JSON.stringify(userData));
    if (userData.token) {
      localStorage.setItem('auth_token', userData.token);
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('portfolio_user');
    localStorage.removeItem('auth_token');
  };

  // 로그인하지 않은 경우 인증 폼 표시
  if (!user) {
    return <AuthForm onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <header className="bg-gradient-to-r from-primary/5 to-secondary/5 shadow-sm border-b border-primary/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                가계부 관리
              </h1>
              <p className="mt-2 text-muted-foreground">
                수입과 지출을 체계적으로 관리하세요
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{user.username}</span>님
              </div>
              <button
                onClick={() => router.push('/settings')}
                className="px-4 py-2 text-sm font-medium text-secondary border border-secondary/30 rounded-md hover:bg-secondary/10 transition-colors"
              >
                계정 설정
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-primary border border-primary/30 rounded-md hover:bg-primary/10 transition-colors"
              >
                로그아웃
              </button>
            </div>
          </div>
        </div>
      </header>

      <main>
        <ExpenseManagementDashboard user={user} />
      </main>
    </div>
  );
}