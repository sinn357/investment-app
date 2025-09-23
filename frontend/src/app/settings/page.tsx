'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AccountSettings from '../../components/AccountSettings';

interface User {
  id: number;
  username: string;
  token: string;
}

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const savedUser = localStorage.getItem('portfolio_user');
    const savedToken = localStorage.getItem('auth_token');

    console.log('Settings page - savedUser:', savedUser);
    console.log('Settings page - savedToken:', savedToken);

    if (!savedUser || !savedToken) {
      console.log('Settings page - Redirecting to portfolio due to missing data');
      router.push('/portfolio');
      return;
    }

    try {
      const userData = JSON.parse(savedUser);
      userData.token = savedToken;
      setUser(userData);
      setIsLoading(false);
    } catch (error) {
      console.error('Error parsing saved user data:', error);
      localStorage.removeItem('portfolio_user');
      localStorage.removeItem('auth_token');
      router.push('/portfolio');
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('portfolio_user');
    localStorage.removeItem('auth_token');
    router.push('/portfolio');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-gray-600">로딩 중...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-gray-600">인증이 필요합니다.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AccountSettings user={user} onLogout={handleLogout} />
    </div>
  );
}