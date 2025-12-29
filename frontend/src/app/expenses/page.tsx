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

  const handleExportExcel = async () => {
    if (!user) return;

    try {
      const API_BASE_URL = 'https://investment-app-backend-x166.onrender.com';

      // 현재 연도/월 가져오기 (선택적)
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;

      const response = await fetch(
        `${API_BASE_URL}/api/expenses/export/excel?user_id=${user.id}&year=${year}&month=${month}`
      );

      if (!response.ok) {
        throw new Error('Excel 생성 실패');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `expenses_${year}_${String(month).padStart(2, '0')}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      alert('Excel 파일이 다운로드되었습니다!');
    } catch (error) {
      console.error('Excel 다운로드 실패:', error);
      alert('Excel 다운로드에 실패했습니다.');
    }
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
            <div className="flex flex-col md:flex-row items-start md:items-center space-y-2 md:space-y-0 md:space-x-4 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <div className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{user.username}</span>님
              </div>
              <div className="flex space-x-2">
                <EnhancedButton
                  variant="secondary"
                  size="sm"
                  onClick={handleExportExcel}
                  shimmer
                  className="text-xs md:text-sm py-1.5 md:py-2 px-3 md:px-4"
                >
                  📊 Excel
                </EnhancedButton>
                <EnhancedButton
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/settings')}
                  className="text-xs md:text-sm py-1.5 md:py-2 px-2 md:px-4"
                >
                  계정 설정
                </EnhancedButton>
                <EnhancedButton
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="text-xs md:text-sm py-1.5 md:py-2 px-2 md:px-4"
                >
                  로그아웃
                </EnhancedButton>
              </div>
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