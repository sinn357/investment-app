'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { User } from 'lucide-react';
import {
  changePasswordSchema,
  deleteAccountSchema,
  type ChangePasswordInput,
  type DeleteAccountInput,
} from '../lib/validations/auth';
import GlassCard from './GlassCard';
import EnhancedButton from './EnhancedButton';
import { Input } from './ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from './ui/form';
import { Alert, AlertDescription } from './ui/alert';

interface UserType {
  id: number;
  username: string;
  token: string;
}

interface AccountSettingsProps {
  user: UserType;
  onLogout: () => void;
}

export default function AccountSettings({ user, onLogout }: AccountSettingsProps) {
  const [activeTab, setActiveTab] = useState<'password' | 'delete'>('password');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState(false);
  const router = useRouter();

  // 비밀번호 변경 폼
  const passwordForm = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  // 계정 삭제 폼
  const deleteForm = useForm<DeleteAccountInput>({
    resolver: zodResolver(deleteAccountSchema),
    defaultValues: {
      password: '',
      confirmDelete: '',
    },
  });

  // 비밀번호 변경 핸들러
  const onPasswordSubmit = async (data: ChangePasswordInput) => {
    setMessage(null);

    try {
      const response = await fetch('https://investment-app-backend-x166.onrender.com/api/auth/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`,
        },
        body: JSON.stringify({
          current_password: data.currentPassword,
          new_password: data.newPassword,
        }),
      });

      const result = await response.json();

      if (result.status === 'success') {
        setMessage({ type: 'success', text: '비밀번호가 성공적으로 변경되었습니다.' });
        passwordForm.reset();
        setPasswordChangeSuccess(true);
      } else {
        setMessage({ type: 'error', text: result.message || '비밀번호 변경에 실패했습니다.' });
      }
    } catch {
      setMessage({ type: 'error', text: '서버와의 연결에 실패했습니다.' });
    }
  };

  // 계정 삭제 핸들러
  const onDeleteSubmit = async (data: DeleteAccountInput) => {
    setMessage(null);

    try {
      const response = await fetch('https://investment-app-backend-x166.onrender.com/api/auth/delete-account', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`,
        },
        body: JSON.stringify({
          password: data.password,
        }),
      });

      const result = await response.json();

      if (result.status === 'success') {
        setMessage({ type: 'success', text: '계정이 성공적으로 삭제되었습니다.' });
        setTimeout(() => {
          onLogout();
        }, 3000);
      } else {
        setMessage({ type: 'error', text: result.message || '계정 삭제에 실패했습니다.' });
      }
    } catch {
      setMessage({ type: 'error', text: '서버와의 연결에 실패했습니다.' });
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Oracle 2025 그라디언트 배경 */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/5 animate-gradient" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-float-delayed" />

      <div className="relative z-10 max-w-4xl mx-auto p-6">
        {/* 헤더 */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <div className="fade-in-up">
              <h1 className="text-4xl lg:text-5xl font-bold mb-2">
                <span className="bg-gradient-to-r from-primary via-yellow-400 to-secondary bg-clip-text text-transparent">
                  ⚙️ 계정 설정
                </span>
              </h1>
              <p className="text-muted-foreground text-lg">
                Oracle 2025 Premium Member
              </p>
            </div>
            <EnhancedButton
              variant="outline"
              onClick={() => router.push('/portfolio')}
              className="fade-in-up [animation-delay:0.1s]"
            >
              포트폴리오로 돌아가기
            </EnhancedButton>
          </div>
        </div>

        {/* 프로필 카드 - 홀로그램 효과 */}
        <GlassCard className="p-8 mb-8 text-center shimmer-effect" animate animationDelay={200}>
          {/* 프로필 이미지 (홀로그램 효과) */}
          <div className="relative inline-block mb-6">
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary to-secondary p-1">
              <div className="w-full h-full rounded-full bg-background flex items-center justify-center">
                <User className="w-16 h-16 text-primary" />
              </div>
            </div>
            {/* 홀로그램 링 */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary to-secondary opacity-20 blur-xl animate-spin-slow" />
          </div>

          <h2 className="text-3xl font-bold text-foreground mb-2">{user.username}</h2>

          {/* 회원 등급 뱃지 */}
          <div className="mt-4">
            <span className="inline-block px-6 py-2 bg-gradient-to-r from-primary to-secondary text-white rounded-full text-lg font-bold shadow-lg shadow-primary/30">
              ⭐ Premium Member
            </span>
          </div>
        </GlassCard>

        {/* 탭 네비게이션 - Oracle 디자인 */}
        <div className="mb-6">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('password')}
              className={`flex-1 py-4 px-6 rounded-2xl font-semibold text-lg transition-all ${
                activeTab === 'password'
                  ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-lg shadow-primary/30 scale-105'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-primary hover:scale-[1.02]'
              }`}
            >
              🔑 비밀번호 변경
            </button>
            <button
              onClick={() => setActiveTab('delete')}
              className={`flex-1 py-4 px-6 rounded-2xl font-semibold text-lg transition-all ${
                activeTab === 'delete'
                  ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/30 scale-105'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-red-500 hover:scale-[1.02]'
              }`}
            >
              🗑️ 계정 삭제
            </button>
          </div>
        </div>

        {/* 메시지 표시 */}
        {message && (
          <Alert variant={message.type === 'success' ? 'default' : 'destructive'} className="mb-6">
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}

        {/* 비밀번호 변경 탭 */}
        {activeTab === 'password' && (
          <GlassCard className="p-8" animate animationDelay={300}>
            <h2 className="text-2xl font-bold text-foreground mb-6">🔑 비밀번호 변경</h2>
            {passwordChangeSuccess ? (
              <div className="text-center space-y-6">
                <div className="text-6xl mb-4 animate-bounce">✅</div>
                <div className="text-green-600 text-2xl font-bold mb-6">
                  비밀번호가 성공적으로 변경되었습니다!
                </div>
                <EnhancedButton
                  variant="primary"
                  onClick={() => router.push('/portfolio')}
                  className="w-full"
                  shimmer
                >
                  포트폴리오로 돌아가기
                </EnhancedButton>
              </div>
            ) : (
              <Form {...passwordForm}>
                <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-6">
                  <FormField
                    control={passwordForm.control}
                    name="currentPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-semibold">현재 비밀번호</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            {...field}
                            className="h-12 text-base border-2 focus:border-primary"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={passwordForm.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-semibold">새 비밀번호 (6자리 이상)</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            {...field}
                            className="h-12 text-base border-2 focus:border-primary"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={passwordForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-semibold">새 비밀번호 확인</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            {...field}
                            className="h-12 text-base border-2 focus:border-primary"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <EnhancedButton
                    type="submit"
                    variant="primary"
                    disabled={passwordForm.formState.isSubmitting}
                    loading={passwordForm.formState.isSubmitting}
                    className="w-full h-14 text-lg"
                    shimmer
                  >
                    {passwordForm.formState.isSubmitting ? '변경 중...' : '비밀번호 변경'}
                  </EnhancedButton>
                </form>
              </Form>
            )}
          </GlassCard>
        )}

        {/* 계정 삭제 탭 */}
        {activeTab === 'delete' && (
          <GlassCard className="p-8 border-2 border-red-200" animate animationDelay={300}>
            <h2 className="text-2xl font-bold text-red-600 mb-6">🗑️ 계정 삭제</h2>

            <Alert variant="destructive" className="mb-6">
              <AlertDescription>
                <h3 className="font-bold text-lg mb-3">⚠️ 주의사항</h3>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 font-bold">•</span>
                    <span>계정 삭제는 <strong>영구적</strong>이며 복구할 수 없습니다.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 font-bold">•</span>
                    <span>모든 포트폴리오 데이터가 <strong>완전히 삭제</strong>됩니다.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 font-bold">•</span>
                    <span>삭제된 계정으로는 다시 로그인할 수 없습니다.</span>
                  </li>
                </ul>
              </AlertDescription>
            </Alert>

            <Form {...deleteForm}>
              <form onSubmit={deleteForm.handleSubmit(onDeleteSubmit)} className="space-y-6">
                <FormField
                  control={deleteForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-semibold">현재 비밀번호</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          {...field}
                          className="h-12 text-base border-2 focus:border-red-500"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={deleteForm.control}
                  name="confirmDelete"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-semibold">
                        확인을 위해 &quot;계정 삭제&quot;라고 입력해주세요
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          placeholder="계정 삭제"
                          {...field}
                          className="h-12 text-base border-2 focus:border-red-500"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <EnhancedButton
                  type="submit"
                  variant="primary"
                  disabled={deleteForm.formState.isSubmitting}
                  loading={deleteForm.formState.isSubmitting}
                  className="w-full h-14 text-lg bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
                >
                  {deleteForm.formState.isSubmitting ? '삭제 중...' : '계정 영구 삭제'}
                </EnhancedButton>
              </form>
            </Form>
          </GlassCard>
        )}
      </div>
    </div>
  );
}
