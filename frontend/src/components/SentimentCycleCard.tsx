"use client";

import React, { useEffect, useState } from 'react';

interface SentimentCycleData {
  score: number;
  phase: string;
  phase_en: string;
  color: 'green' | 'amber' | 'red' | 'gray';
  description: string;
  action: string;
  confidence: number;
  indicators: {
    vix: number;
  };
  last_updated: string;
}

interface SentimentCycleResponse {
  status: string;
  data: SentimentCycleData;
}

const colorClasses = {
  green: 'from-green-500 to-green-600 text-white',
  amber: 'from-amber-500 to-amber-600 text-white',
  red: 'from-red-500 to-red-600 text-white',
  gray: 'from-gray-400 to-gray-500 text-white',
};

const phaseEmojis = {
  '극단적 공포': '😱',
  '중립': '😐',
  '극단적 탐욕': '🤑',
};

export default function SentimentCycleCard() {
  const [data, setData] = useState<SentimentCycleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCycleData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('https://investment-app-backend-x166.onrender.com/api/v2/sentiment-cycle');

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result: SentimentCycleResponse = await response.json();

      if (result.status === 'success' && result.data) {
        setData(result.data);
      } else {
        throw new Error('데이터 형식 오류');
      }
    } catch (err) {
      console.error('심리/밸류에이션 사이클 조회 실패:', err);
      setError(err instanceof Error ? err.message : '데이터 로딩 실패');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCycleData();
  }, []);

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 animate-pulse">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
        <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border-l-4 border-red-500">
        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">
          ⚠️ 심리/밸류에이션 사이클
        </h3>
        <p className="text-red-600 dark:text-red-400">
          {error || '데이터를 불러올 수 없습니다'}
        </p>
        <button
          onClick={fetchCycleData}
          className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
        >
          다시 시도
        </button>
      </div>
    );
  }

  const emoji = phaseEmojis[data.phase as keyof typeof phaseEmojis] || '📊';
  const gradientClass = colorClasses[data.color] || colorClasses.gray;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
      {/* 헤더 - 그라데이션 배경 */}
      <div className={`bg-gradient-to-r ${gradientClass} p-6`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <span className="text-4xl">{emoji}</span>
            <div>
              <h3 className="text-2xl font-bold">심리/밸류에이션 사이클</h3>
              <p className="text-sm opacity-90">Sentiment/Valuation Cycle</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-5xl font-bold">{Math.round(data.score)}</div>
            <div className="text-sm opacity-90">/ 100점</div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-2xl font-bold">
            {data.phase} ({data.phase_en})
          </div>
          <div className="text-sm opacity-90">
            신뢰도: {data.confidence}%
          </div>
        </div>
      </div>

      {/* 본문 */}
      <div className="p-6 space-y-4">
        {/* 현재 국면 설명 */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <h4 className="font-semibold text-gray-800 dark:text-white mb-2">
            📌 현재 국면
          </h4>
          <p className="text-gray-700 dark:text-gray-300">
            {data.description}
          </p>
        </div>

        {/* 투자 행동 추천 */}
        <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4 border-l-4 border-blue-500">
          <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">
            💡 투자 행동
          </h4>
          <p className="text-blue-700 dark:text-blue-200">
            {data.action}
          </p>
        </div>

        {/* 개별 지표 점수 */}
        <div>
          <h4 className="font-semibold text-gray-800 dark:text-white mb-3">
            📊 지표별 점수 (0-100)
          </h4>
          <div className="grid grid-cols-1 gap-3">
            <div className="bg-gray-100 dark:bg-gray-700 rounded p-3">
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                VIX 변동성지수 (100%)
              </div>
              <div className="text-xl font-bold text-gray-800 dark:text-white">
                {data.indicators.vix.toFixed(1)}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                역방향: 낮을수록 탐욕, 높을수록 공포
              </div>
            </div>
          </div>
        </div>

        {/* 마지막 업데이트 */}
        <div className="text-xs text-gray-500 dark:text-gray-400 text-center pt-2 border-t border-gray-200 dark:border-gray-700">
          마지막 업데이트: {new Date(data.last_updated).toLocaleString('ko-KR')}
        </div>
      </div>
    </div>
  );
}
