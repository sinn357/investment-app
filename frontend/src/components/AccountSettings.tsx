'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  changePasswordSchema,
  deleteAccountSchema,
  type ChangePasswordInput,
  type DeleteAccountInput,
} from '../lib/validations/auth';
import { Button } from './ui/button';
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
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

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
    <div className="max-w-4xl mx-auto p-6">
      {/* 헤더 */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">계정 설정</h1>
            <p className="text-gray-600">
              사용자: <span className="font-semibold">{user.username}</span>
            </p>
          </div>
          <Button variant="outline" onClick={() => router.push('/portfolio')}>
            포트폴리오로 돌아가기
          </Button>
        </div>
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
        <Alert variant={message.type === 'success' ? 'default' : 'destructive'} className="mb-6">
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {/* 비밀번호 변경 탭 */}
      {activeTab === 'password' && (
        <Card>
          <CardHeader>
            <CardTitle>비밀번호 변경</CardTitle>
          </CardHeader>
          <CardContent>
            {passwordChangeSuccess ? (
              <div className="text-center space-y-4">
                <div className="text-green-600 text-lg font-medium mb-4">
                  ✅ 비밀번호가 성공적으로 변경되었습니다!
                </div>
                <Button onClick={() => router.push('/portfolio')} className="w-full">
                  포트폴리오로 돌아가기
                </Button>
              </div>
            ) : (
              <Form {...passwordForm}>
                <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                  <FormField
                    control={passwordForm.control}
                    name="currentPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>현재 비밀번호</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
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
                        <FormLabel>새 비밀번호 (6자리 이상)</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
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
                        <FormLabel>새 비밀번호 확인</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" disabled={passwordForm.formState.isSubmitting} className="w-full">
                    {passwordForm.formState.isSubmitting ? '변경 중...' : '비밀번호 변경'}
                  </Button>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>
      )}

      {/* 계정 삭제 탭 */}
      {activeTab === 'delete' && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800">계정 삭제</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>
                <h3 className="font-medium mb-2">⚠️ 주의사항</h3>
                <ul className="text-sm space-y-1">
                  <li>• 계정 삭제는 <strong>영구적</strong>이며 복구할 수 없습니다.</li>
                  <li>• 모든 포트폴리오 데이터가 <strong>완전히 삭제</strong>됩니다.</li>
                  <li>• 삭제된 계정으로는 다시 로그인할 수 없습니다.</li>
                </ul>
              </AlertDescription>
            </Alert>

            <Form {...deleteForm}>
              <form onSubmit={deleteForm.handleSubmit(onDeleteSubmit)} className="space-y-4">
                <FormField
                  control={deleteForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>현재 비밀번호</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
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
                      <FormLabel>확인을 위해 &quot;계정 삭제&quot;라고 입력해주세요</FormLabel>
                      <FormControl>
                        <Input type="text" placeholder="계정 삭제" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  variant="destructive"
                  disabled={deleteForm.formState.isSubmitting}
                  className="w-full"
                >
                  {deleteForm.formState.isSubmitting ? '삭제 중...' : '계정 영구 삭제'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
