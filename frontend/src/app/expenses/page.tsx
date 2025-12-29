'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '../../components/Navigation';
import ExpenseManagementDashboard from '../../components/ExpenseManagementDashboard';
import AuthForm from '@/components/AuthForm';
import EnhancedButton from '@/components/EnhancedButton';

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

      <header className="relative overflow-hidden bg-gradient-to-r from-primary/10 to-secondary/10 shadow-sm border-b border-primary/20 animate-gradient">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center">
            <div className="space-y-3">
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary via-yellow-400 to-secondary bg-clip-text text-transparent animate-fade-in-down">
                💰 가계부 관리
              </h1>
              <p className="text-lg text-muted-foreground animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                수입과 지출을 체계적으로 관리하세요 · Oracle 2025
              </p>
            </div>
            <div className="flex items-center space-x-4 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <div className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{user.username}</span>님
              </div>
              <EnhancedButton
                variant="outline"
                size="sm"
                onClick={() => router.push('/settings')}
              >
                계정 설정
              </EnhancedButton>
              <EnhancedButton
                variant="outline"
                size="sm"
                onClick={handleLogout}
              >
                로그아웃
              </EnhancedButton>
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