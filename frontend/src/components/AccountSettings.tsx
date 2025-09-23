'use client';

import React, { useState } from 'react';

interface User {
  id: number;
  username: string;
  token: string;
}

interface AccountSettingsProps {
  user: User;
  onLogout: () => void;
}

export default function AccountSettings({ user, onLogout }: AccountSettingsProps) {
  const [activeTab, setActiveTab] = useState<'password' | 'delete'>('password');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // 비밀번호 변경 상태
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // 계정 삭제 상태
  const [deleteForm, setDeleteForm] = useState({
    password: '',
    confirmDelete: ''
  });

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    // 클라이언트 사이드 검증
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage({ type: 'error', text: '새 비밀번호가 일치하지 않습니다.' });
      setIsLoading(false);
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setMessage({ type: 'error', text: '새 비밀번호는 6자리 이상이어야 합니다.' });
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('https://investment-app-backend-x166.onrender.com/api/auth/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({
          current_password: passwordForm.currentPassword,
          new_password: passwordForm.newPassword
        })
      });

      const data = await response.json();

      if (data.status === 'success') {
        setMessage({ type: 'success', text: '비밀번호가 성공적으로 변경되었습니다.' });
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        setMessage({ type: 'error', text: data.message || '비밀번호 변경에 실패했습니다.' });
      }
    } catch {
      setMessage({ type: 'error', text: '서버와의 연결에 실패했습니다.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccountDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    // 클라이언트 사이드 검증
    if (deleteForm.confirmDelete !== '계정 삭제') {
      setMessage({ type: 'error', text: '"계정 삭제"라고 정확히 입력해주세요.' });
      setIsLoading(false);
      return;
    }

    if (!deleteForm.password) {
      setMessage({ type: 'error', text: '비밀번호를 입력해주세요.' });
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('https://investment-app-backend-x166.onrender.com/api/auth/delete-account', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({
          password: deleteForm.password
        })
      });

      const data = await response.json();

      if (data.status === 'success') {
        setMessage({ type: 'success', text: '계정이 성공적으로 삭제되었습니다.' });
        // 3초 후 로그아웃
        setTimeout(() => {
          onLogout();
        }, 3000);
      } else {
        setMessage({ type: 'error', text: data.message || '계정 삭제에 실패했습니다.' });
      }
    } catch {
      setMessage({ type: 'error', text: '서버와의 연결에 실패했습니다.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* 헤더 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">계정 설정</h1>
        <p className="text-gray-600">사용자: <span className="font-semibold">{user.username}</span></p>
      </div>

      {/* 탭 네비게이션 */}
      <div className="border-b border-gray-200 mb-6">
        <div className="flex space-x-8">
          <button
            onClick={() => setActiveTab('password')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'password'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            비밀번호 변경
          </button>
          <button
            onClick={() => setActiveTab('delete')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'delete'
                ? 'border-red-500 text-red-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            계정 삭제
          </button>
        </div>
      </div>

      {/* 메시지 표시 */}
      {message && (
        <div className={`mb-6 p-4 rounded-md ${
          message.type === 'success'
            ? 'bg-green-50 border border-green-200 text-green-800'
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      {/* 비밀번호 변경 탭 */}
      {activeTab === 'password' && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">비밀번호 변경</h2>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                현재 비밀번호
              </label>
              <input
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                새 비밀번호 (6자리 이상)
              </label>
              <input
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                minLength={6}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                새 비밀번호 확인
              </label>
              <input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                minLength={6}
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isLoading ? '변경 중...' : '비밀번호 변경'}
            </button>
          </form>
        </div>
      )}

      {/* 계정 삭제 탭 */}
      {activeTab === 'delete' && (
        <div className="bg-red-50 rounded-lg border border-red-200 p-6">
          <h2 className="text-xl font-semibold text-red-800 mb-4">계정 삭제</h2>
          <div className="mb-4 p-4 bg-red-100 border border-red-200 rounded-md">
            <h3 className="font-medium text-red-800 mb-2">⚠️ 주의사항</h3>
            <ul className="text-sm text-red-700 space-y-1">
              <li>• 계정 삭제는 <strong>영구적</strong>이며 복구할 수 없습니다.</li>
              <li>• 모든 포트폴리오 데이터가 <strong>완전히 삭제</strong>됩니다.</li>
              <li>• 삭제된 계정으로는 다시 로그인할 수 없습니다.</li>
            </ul>
          </div>
          <form onSubmit={handleAccountDelete} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                현재 비밀번호
              </label>
              <input
                type="password"
                value={deleteForm.password}
                onChange={(e) => setDeleteForm({...deleteForm, password: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                확인을 위해 &quot;계정 삭제&quot;라고 입력해주세요
              </label>
              <input
                type="text"
                value={deleteForm.confirmDelete}
                onChange={(e) => setDeleteForm({...deleteForm, confirmDelete: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="계정 삭제"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
            >
              {isLoading ? '삭제 중...' : '계정 영구 삭제'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}