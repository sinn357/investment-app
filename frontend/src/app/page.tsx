'use client';

import React, { useEffect, useState } from 'react';
import Navigation from '@/components/Navigation';

export default function Home() {
  const [displayedText, setDisplayedText] = useState('');
  const [currentLine, setCurrentLine] = useState(0);
  const [showCursor, setShowCursor] = useState(true);

  const lines = [
    '> ORACLE_',
    '  Market Intelligence Platform',
    '',
    '  Connecting data. Empowering decisions.',
  ];

  // 타이핑 효과
  useEffect(() => {
    if (currentLine >= lines.length) return;

    const currentText = lines[currentLine];
    let charIndex = 0;

    const typingInterval = setInterval(() => {
      if (charIndex < currentText.length) {
        setDisplayedText(prev => prev + currentText[charIndex]);
        charIndex++;
      } else {
        clearInterval(typingInterval);
        setDisplayedText(prev => prev + '\n');
        setTimeout(() => {
          setCurrentLine(prev => prev + 1);
        }, 500);
      }
    }, 80);

    return () => clearInterval(typingInterval);
  }, [currentLine]);

  // 커서 깜빡임
  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 530);

    return () => clearInterval(cursorInterval);
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-gray-950">
      {/* 터미널 그리드 배경 */}
      <div className="fixed inset-0 bg-[linear-gradient(rgba(218,165,32,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(218,165,32,0.03)_1px,transparent_1px)] bg-[size:50px_50px]" />

      {/* 미묘한 그라데이션 글로우 */}
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />

      {/* 컨텐츠 */}
      <div className="relative z-10">
        <Navigation />

        {/* 터미널 화면 */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="w-full max-w-4xl">
            {/* 터미널 윈도우 */}
            <div className="bg-gray-900/50 backdrop-blur-md rounded-2xl border border-primary/20 shadow-2xl overflow-hidden">
              {/* 터미널 헤더 */}
              <div className="flex items-center gap-2 px-4 py-3 bg-gray-800/50 border-b border-primary/10">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
                <span className="ml-2 text-xs text-gray-400 font-mono">oracle@terminal ~ %</span>
              </div>

              {/* 터미널 본문 */}
              <div className="p-8 md:p-12 lg:p-16 font-mono text-lg md:text-2xl leading-relaxed">
                <pre className="text-primary whitespace-pre-wrap">
{displayedText}
{currentLine < lines.length && showCursor && (
  <span className="inline-block w-3 h-6 md:h-8 bg-primary ml-1 animate-pulse" />
)}
                </pre>
              </div>
            </div>

            {/* 하단 상태 바 */}
            <div className="mt-6 flex items-center justify-between text-sm text-gray-500 font-mono">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  SYSTEM READY
                </span>
                <span>|</span>
                <span>{new Date().toLocaleDateString('ko-KR')}</span>
              </div>
              <div>
                v1.0.0
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
