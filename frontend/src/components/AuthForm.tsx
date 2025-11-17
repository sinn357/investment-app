'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  loginSchema,
  registerSchema,
  type LoginInput,
  type RegisterInput,
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

interface AuthFormProps {
  onLogin: (user: { id: number; username: string; token?: string }) => void;
}

export default function AuthForm({ onLogin }: AuthFormProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState('');

  // 로그인 폼
  const loginForm = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  // 회원가입 폼
  const registerForm = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: '',
      password: '',
      confirmPassword: '',
    },
  });

  // 로그인 핸들러
  const onLoginSubmit = async (data: LoginInput) => {
    setError('');

    try {
      const response = await fetch('https://investment-app-backend-x166.onrender.com/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.status === 'success') {
        // JWT 토큰을 localStorage에 안전하게 저장
        if (result.token) {
          localStorage.setItem('auth_token', result.token);
        }

        // 로그인 성공 시 사용자 정보 전달
        onLogin({
          id: result.user_id,
          username: result.username,
          token: result.token,
        });
      } else {
        setError(result.message || '로그인에 실패했습니다.');
      }
    } catch {
      setError('서버 연결에 실패했습니다.');
    }
  };

  // 회원가입 핸들러
  const onRegisterSubmit = async (data: RegisterInput) => {
    setError('');

    try {
      const response = await fetch('https://investment-app-backend-x166.onrender.com/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: data.username,
          password: data.password,
        }),
      });

      const result = await response.json();

      if (result.status === 'success') {
        // JWT 토큰을 localStorage에 안전하게 저장
        if (result.token) {
          localStorage.setItem('auth_token', result.token);
        }

        // 회원가입 성공 시 사용자 정보 전달
        onLogin({
          id: result.user_id,
          username: result.username,
          token: result.token,
        });
      } else {
        setError(result.message || '회원가입에 실패했습니다.');
      }
    } catch {
      setError('서버 연결에 실패했습니다.');
    }
  };

  // 로그인/회원가입 전환
  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
    loginForm.reset();
    registerForm.reset();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">
            {isLogin ? '로그인' : '회원가입'}
          </CardTitle>
          <CardDescription className="text-center">
            포트폴리오 관리를 위해 {isLogin ? '로그인' : '계정을 생성'}해주세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {isLogin ? (
            <Form {...loginForm}>
              <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                <FormField
                  control={loginForm.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>사용자명</FormLabel>
                      <FormControl>
                        <Input placeholder="사용자명을 입력하세요" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={loginForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>비밀번호</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="비밀번호를 입력하세요" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  disabled={loginForm.formState.isSubmitting}
                  className="w-full"
                >
                  {loginForm.formState.isSubmitting ? '처리 중...' : '로그인'}
                </Button>
              </form>
            </Form>
          ) : (
            <Form {...registerForm}>
              <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                <FormField
                  control={registerForm.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>사용자명</FormLabel>
                      <FormControl>
                        <Input placeholder="3자 이상 (영문, 숫자, _만 가능)" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={registerForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>비밀번호</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="6자리 이상" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={registerForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>비밀번호 확인</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="비밀번호 재입력" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  disabled={registerForm.formState.isSubmitting}
                  className="w-full"
                >
                  {registerForm.formState.isSubmitting ? '처리 중...' : '회원가입'}
                </Button>
              </form>
            </Form>
          )}

          <div className="mt-4 text-center">
            <Button variant="link" onClick={toggleMode} className="text-sm">
              {isLogin ? '계정이 없으신가요? 회원가입' : '이미 계정이 있으신가요? 로그인'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
