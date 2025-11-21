'use client';

import React, { Component, ReactNode } from 'react';
import { CARD_CLASSES, BUTTON_CLASSES } from '@/styles/theme';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className={`${CARD_CLASSES.container} max-w-2xl w-full p-8`}>
            {/* 에러 아이콘 */}
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">⚠️</div>
              <h1 className={`${CARD_CLASSES.title} text-2xl mb-2`}>
                문제가 발생했습니다
              </h1>
              <p className={CARD_CLASSES.subtitle}>
                페이지를 불러오는 중 오류가 발생했습니다.
              </p>
            </div>

            {/* 에러 상세 (개발 환경에서만 표시) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <h2 className="text-sm font-semibold text-red-800 dark:text-red-200 mb-2">
                  에러 상세:
                </h2>
                <pre className="text-xs text-red-700 dark:text-red-300 overflow-x-auto">
                  {this.state.error.message}
                </pre>
                {this.state.error.stack && (
                  <details className="mt-2">
                    <summary className="text-xs text-red-600 dark:text-red-400 cursor-pointer hover:underline">
                      스택 트레이스 보기
                    </summary>
                    <pre className="text-xs text-red-700 dark:text-red-300 mt-2 overflow-x-auto">
                      {this.state.error.stack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            {/* 액션 버튼 */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className={`${BUTTON_CLASSES.primary} px-6 py-3`}
              >
                페이지 새로고침
              </button>
              <button
                onClick={() => window.history.back()}
                className={`${BUTTON_CLASSES.secondary} px-6 py-3`}
              >
                이전 페이지로
              </button>
            </div>

            {/* 도움말 */}
            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                문제가 계속되면 페이지를 새로고침하거나 잠시 후 다시 시도해주세요.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
