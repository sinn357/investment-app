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
  const [showFormula, setShowFormula] = useState(false);

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
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden h-full flex flex-col">
      {/* 헤더 - 그라데이션 배경 (컴팩트) */}
      <div className={`bg-gradient-to-r ${gradientClass} p-4`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <span className="text-3xl">{emoji}</span>
            <div>
              <h3 className="text-lg font-bold">심리/밸류에이션 사이클</h3>
              <p className="text-xs opacity-90">Sentiment/Valuation Cycle</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowFormula(true)}
              className="w-6 h-6 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition"
              title="점수화 공식 보기"
            >
              <span className="text-sm font-bold">?</span>
            </button>
            <div className="text-right">
              <div className="text-3xl font-bold">{Math.round(data.score)}</div>
              <div className="text-xs opacity-90">/ 100점</div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-xl font-bold">
            {data.phase} ({data.phase_en})
          </div>
          <div className="text-xs opacity-90">
            신뢰도: {data.confidence}%
          </div>
        </div>
      </div>

      {/* 본문 (컴팩트) */}
      <div className="p-4 space-y-3 flex-1">
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
          <div className="grid grid-cols-1 gap-2">
            <div className="bg-gray-100 dark:bg-gray-700 rounded p-2">
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                VIX 변동성지수 (100%)
              </div>
              <div className="text-lg font-bold text-gray-800 dark:text-white">
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

      {/* 점수화 공식 모달 */}
      {showFormula && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowFormula(false)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                  😱 심리/밸류에이션 사이클 점수화 공식
                </h3>
                <button
                  onClick={() => setShowFormula(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
                <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">
                    💡 총점 계산
                  </h4>
                  <p className="font-mono text-xs">
                    총점 = VIX 변동성지수 × 100%
                  </p>
                  <p className="text-xs mt-2 text-amber-600 dark:text-amber-400">
                    ⚠️ 현재는 VIX 단일 지표만 사용 (향후 AAII, PER 등 추가 예정)
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">📊 VIX 변동성지수 (100%)</h4>
                  <ul className="space-y-1 text-xs ml-4">
                    <li>• VIX {'<'} 12: 극단적 탐욕 (컴플레이센시) → 80-100점</li>
                    <li>• VIX 12-16: 낮은 변동성 (탐욕) → 60-80점</li>
                    <li>• VIX 16-20: 정상 범위 (중립) → 40-60점</li>
                    <li>• VIX 20-30: 높은 변동성 (공포) → 20-40점</li>
                    <li>• VIX {'>'} 30: 극단적 공포 (패닉) → 0-20점</li>
                  </ul>
                  <p className="text-xs mt-2 text-gray-600 dark:text-gray-400">
                    ⚠️ 역방향 지표: VIX가 낮을수록 높은 점수 (시장 낙관적)
                  </p>
                </div>

                <div className="bg-amber-50 dark:bg-amber-900/30 p-4 rounded-lg border-l-4 border-amber-500">
                  <h4 className="font-semibold text-amber-800 dark:text-amber-300 mb-2">
                    🔍 VIX란?
                  </h4>
                  <p className="text-xs text-gray-700 dark:text-gray-300">
                    VIX(Volatility Index)는 S&P 500 옵션 가격을 기반으로 한 시장 변동성 지수입니다.
                    "공포 지수"라고도 불리며, 투자자들의 불안감을 측정합니다.
                  </p>
                  <ul className="space-y-1 text-xs ml-4 mt-2">
                    <li>• VIX ↓ = 시장 안정 = 투자자 낙관 = 탐욕</li>
                    <li>• VIX ↑ = 시장 불안 = 투자자 불안 = 공포</li>
                  </ul>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">🎯 국면 판별 (총점 기준)</h4>
                  <ul className="space-y-1 text-xs ml-4">
                    <li>• 0-33점: <span className="text-green-600 font-bold">극단적 공포</span> (Extreme Fear) - 매수 기회</li>
                    <li>• 33-66점: <span className="text-amber-600 font-bold">중립</span> (Neutral) - 관망</li>
                    <li>• 66-100점: <span className="text-red-600 font-bold">극단적 탐욕</span> (Extreme Greed) - 위험 신호</li>
                  </ul>
                  <p className="text-xs mt-3 text-gray-600 dark:text-gray-400">
                    💡 투자 전략: "남들이 두려워할 때 탐욕을, 남들이 탐욕스러울 때 두려움을" (워렌 버핏)
                  </p>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">
                    🚧 향후 추가 예정 지표
                  </h4>
                  <ul className="space-y-1 text-xs ml-4">
                    <li>• AAII 투자자 심리조사 (Bulls vs Bears)</li>
                    <li>• S&P 500 Fwd PER (밸류에이션)</li>
                    <li>• Shiller CAPE (장기 밸류에이션)</li>
                    <li>• Put/Call Ratio (옵션 시장 심리)</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
