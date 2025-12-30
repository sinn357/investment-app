'use client';

import { useState, useEffect } from 'react';
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

      <main>
        <ExpenseManagementDashboard user={user} />
      </main>
    </div>
  );
}