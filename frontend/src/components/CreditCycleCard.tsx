"use client";

import React, { useEffect, useState } from 'react';

interface CreditCycleData {
  score: number;
  phase: string;
  phase_en: string;
  color: 'red' | 'amber' | 'green' | 'gray';
  description: string;
  action: string;
  confidence: number;
  indicators: {
    hy_spread: number;
    ig_spread: number;
    fci: number;
    m2_yoy: number;
  };
  last_updated: string;
}

interface CreditCycleResponse {
  status: string;
  data: CreditCycleData;
}

const colorClasses = {
  red: 'from-red-500 to-red-600 text-white',
  amber: 'from-amber-500 to-amber-600 text-white',
  green: 'from-green-500 to-green-600 text-white',
  gray: 'from-gray-400 to-gray-500 text-white',
};

const phaseEmojis = {
  '신용 경색': '🔴',
  '정상화': '⚠️',
  '신용 과잉': '🟢',
};

export default function CreditCycleCard() {
  const [data, setData] = useState<CreditCycleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFormula, setShowFormula] = useState(false);

  const fetchCycleData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('https://investment-app-backend-x166.onrender.com/api/v2/credit-cycle');

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result: CreditCycleResponse = await response.json();

      if (result.status === 'success' && result.data) {
        setData(result.data);
      } else {
        throw new Error('데이터 형식 오류');
      }
    } catch (err) {
      console.error('신용/유동성 사이클 조회 실패:', err);
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
          ⚠️ 신용/유동성 사이클
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

  const emoji = phaseEmojis[data.phase as keyof typeof phaseEmojis] || '💧';
  const gradientClass = colorClasses[data.color] || colorClasses.gray;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden h-full flex flex-col">
      {/* 헤더 - 그라데이션 배경 (컴팩트) */}
      <div className={`bg-gradient-to-r ${gradientClass} p-4`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <span className="text-3xl">{emoji}</span>
            <div>
              <h3 className="text-lg font-bold">신용/유동성 사이클</h3>
              <p className="text-xs opacity-90">Credit/Liquidity Cycle</p>
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
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-gray-100 dark:bg-gray-700 rounded p-2">
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                HY Spread (40%)
              </div>
              <div className="text-lg font-bold text-gray-800 dark:text-white">
                {data.indicators.hy_spread.toFixed(1)}
              </div>
            </div>
            <div className="bg-gray-100 dark:bg-gray-700 rounded p-2">
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                FCI (30%)
              </div>
              <div className="text-lg font-bold text-gray-800 dark:text-white">
                {data.indicators.fci.toFixed(1)}
              </div>
            </div>
            <div className="bg-gray-100 dark:bg-gray-700 rounded p-2">
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                IG Spread (20%)
              </div>
              <div className="text-lg font-bold text-gray-800 dark:text-white">
                {data.indicators.ig_spread.toFixed(1)}
              </div>
            </div>
            <div className="bg-gray-100 dark:bg-gray-700 rounded p-2">
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                M2 YoY (10%)
              </div>
              <div className="text-lg font-bold text-gray-800 dark:text-white">
                {data.indicators.m2_yoy.toFixed(1)}
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
                  💧 신용/유동성 사이클 점수화 공식
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
                    총점 = HY Spread×40% + FCI×30% + IG Spread×20% + M2 YoY×10%
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">📊 HY Spread (하이일드 스프레드) 40%</h4>
                  <ul className="space-y-1 text-xs ml-4">
                    <li>• {'<'} 3%: 신용 과잉 (위험) → 80-100점</li>
                    <li>• 3-5%: 정상 → 60-80점</li>
                    <li>• 5-8%: 정상화 → 40-60점</li>
                    <li>• 8-12%: 긴축 시작 → 20-40점</li>
                    <li>• {'>'} 12%: 신용 경색 → 0-20점</li>
                  </ul>
                  <p className="text-xs mt-2 text-gray-600 dark:text-gray-400">
                    ⚠️ 역방향 지표: 스프레드가 낮을수록 높은 점수 (신용 환경 좋음)
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">💵 FCI (금융여건지수) 30%</h4>
                  <ul className="space-y-1 text-xs ml-4">
                    <li>• {'<'} -1.5: 매우 완화적 → 80-100점</li>
                    <li>• -1.5 ~ -0.5: 완화적 → 60-80점</li>
                    <li>• -0.5 ~ +0.5: 중립 → 40-60점</li>
                    <li>• +0.5 ~ +1.5: 긴축적 → 20-40점</li>
                    <li>• {'>'} +1.5: 매우 긴축적 → 0-20점</li>
                  </ul>
                  <p className="text-xs mt-2 text-gray-600 dark:text-gray-400">
                    ⚠️ 역방향 지표: 낮을수록 금융 여건이 좋음
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">🏢 IG Spread (투자등급 스프레드) 20%</h4>
                  <ul className="space-y-1 text-xs ml-4">
                    <li>• {'<'} 1%: 신용 과잉 → 80-100점</li>
                    <li>• 1-1.5%: 정상 → 60-80점</li>
                    <li>• 1.5-2.5%: 정상화 → 40-60점</li>
                    <li>• 2.5-4%: 긴축 → 20-40점</li>
                    <li>• {'>'} 4%: 경색 → 0-20점</li>
                  </ul>
                  <p className="text-xs mt-2 text-gray-600 dark:text-gray-400">
                    ⚠️ 역방향 지표: 스프레드가 낮을수록 높은 점수
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">💰 M2 YoY (통화량 증가율) 10%</h4>
                  <ul className="space-y-1 text-xs ml-4">
                    <li>• {'<'} 0%: 통화 긴축 → 0-20점</li>
                    <li>• 0-3%: 저성장 → 20-40점</li>
                    <li>• 3-7%: 정상 성장 → 40-80점</li>
                    <li>• 7-12%: 확장적 → 80-100점</li>
                    <li>• {'>'} 12%: 과도한 유동성 (인플레 위험) → 60-80점</li>
                  </ul>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">🎯 국면 판별 (총점 기준)</h4>
                  <ul className="space-y-1 text-xs ml-4">
                    <li>• 0-33점: <span className="text-red-600 font-bold">신용 경색</span> (Credit Crunch)</li>
                    <li>• 33-66점: <span className="text-amber-600 font-bold">정상화</span> (Normalizing)</li>
                    <li>• 66-100점: <span className="text-green-600 font-bold">신용 과잉</span> (Credit Excess)</li>
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
