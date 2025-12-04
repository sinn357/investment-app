"use client";

import React, { useEffect, useState } from 'react';

interface MacroCycleData {
  score: number;
  phase: string;
  phase_en: string;
  color: 'red' | 'green' | 'emerald' | 'amber' | 'gray';
  description: string;
  action: string;
  confidence: number;
  indicators: {
    ism_manufacturing: number;
    ism_non_manufacturing: number;
    core_cpi: number;
    core_pce: number;
    fed_funds_rate: number;
    yield_curve: number;
  };
  last_updated: string;
}

interface MacroCycleResponse {
  status: string;
  data: MacroCycleData;
}

const colorClasses = {
  red: 'from-red-500 to-red-600 text-white',
  green: 'from-green-500 to-green-600 text-white',
  emerald: 'from-emerald-500 to-emerald-600 text-white',
  amber: 'from-amber-500 to-amber-600 text-white',
  gray: 'from-gray-400 to-gray-500 text-white',
};

const phaseEmojis = {
  '침체': '📉',
  '회복': '📈',
  '확장': '🚀',
  '둔화': '⚠️',
};

interface MacroCycleCardProps {
  data?: MacroCycleData | null;  // ✅ props로 데이터를 받음
}

export default function MacroCycleCard({ data }: MacroCycleCardProps) {
  const [showFormula, setShowFormula] = useState(false);

  // ✅ API 호출 로직 제거 (부모 컴포넌트에서 통합 API로 받음)
  // const fetchCycleData = async () => { ... } 삭제

  // ✅ loading state 제거 (부모가 관리)
  if (!data) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border-l-4 border-gray-400">
        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">
          📊 거시경제 사이클
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          데이터를 불러오는 중...
        </p>
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
              <h3 className="text-lg font-bold">거시경제 사이클</h3>
              <p className="text-xs opacity-90">Macroeconomic Cycle</p>
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
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-gray-100 dark:bg-gray-700 rounded p-2">
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                ISM 제조업 (30%)
              </div>
              <div className="text-lg font-bold text-gray-800 dark:text-white">
                {data.indicators.ism_manufacturing.toFixed(1)}
              </div>
            </div>
            <div className="bg-gray-100 dark:bg-gray-700 rounded p-2">
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                ISM 비제조업 (20%)
              </div>
              <div className="text-lg font-bold text-gray-800 dark:text-white">
                {data.indicators.ism_non_manufacturing.toFixed(1)}
              </div>
            </div>
            <div className="bg-gray-100 dark:bg-gray-700 rounded p-2">
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                근원 CPI (20%)
              </div>
              <div className="text-lg font-bold text-gray-800 dark:text-white">
                {data.indicators.core_cpi.toFixed(1)}
              </div>
            </div>
            <div className="bg-gray-100 dark:bg-gray-700 rounded p-2">
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                근원 PCE (10%)
              </div>
              <div className="text-lg font-bold text-gray-800 dark:text-white">
                {data.indicators.core_pce.toFixed(1)}
              </div>
            </div>
            <div className="bg-gray-100 dark:bg-gray-700 rounded p-2">
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                연준 금리 (10%)
              </div>
              <div className="text-lg font-bold text-gray-800 dark:text-white">
                {data.indicators.fed_funds_rate.toFixed(1)}
              </div>
            </div>
            <div className="bg-gray-100 dark:bg-gray-700 rounded p-2">
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                장단기차 (10%)
              </div>
              <div className="text-lg font-bold text-gray-800 dark:text-white">
                {data.indicators.yield_curve.toFixed(1)}
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
                  📊 거시경제 사이클 점수화 공식
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
                    총점 = ISM제조업×30% + ISM비제조업×20% + 근원CPI×20% + 근원PCE×10% + 연준금리×10% + 장단기차×10%
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">📈 ISM PMI 점수화 (제조업 30%, 비제조업 20%)</h4>
                  <ul className="space-y-1 text-xs ml-4">
                    <li>• PMI {'<'} 45: 심각한 침체 → 0-20점</li>
                    <li>• PMI 45-50: 침체 → 20-40점 (예: 48.2 → <span className="font-bold">32.8점</span>)</li>
                    <li>• PMI 50-55: 회복/정상 → 40-60점</li>
                    <li>• PMI 55-60: 확장 → 60-80점</li>
                    <li>• PMI {'>'} 60: 과열 → 80-100점</li>
                  </ul>
                  <p className="text-xs mt-2 text-gray-600 dark:text-gray-400">
                    공식: 구간별 선형 보간 (예: 45-50구간 = 20 + (PMI-45)/5×20)
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">📊 인플레이션 점수화 (CPI 20%, PCE 10%)</h4>
                  <ul className="space-y-1 text-xs ml-4">
                    <li>• 디플레이션 ({'<'}0%): 위험 → 0-20점</li>
                    <li>• 저물가 (0-2%): 이상적 → 20-60점</li>
                    <li>• 목표물가 (2-3%): 정상 → 60-80점</li>
                    <li>• 고물가 (3-5%): 우려 → 80-40점 (역방향)</li>
                    <li>• 초고물가 ({'>'} 5%): 위기 → 40-0점 (역방향)</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">💵 연준 금리 점수화 (10%)</h4>
                  <ul className="space-y-1 text-xs ml-4">
                    <li>• 0-1%: 초저금리 → 20-40점</li>
                    <li>• 1-3%: 정상화 → 40-60점</li>
                    <li>• 3-5%: 긴축 → 60-80점</li>
                    <li>• {'>'} 5%: 강력 긴축 → 80-100점</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">📉 장단기 금리차 점수화 (10%)</h4>
                  <ul className="space-y-1 text-xs ml-4">
                    <li>• {'<'} -1.0%: 강력한 역전 (불황 경고) → 0-20점</li>
                    <li>• -1.0 ~ 0%: 약한 역전 → 20-40점</li>
                    <li>• 0 ~ +1.0%: 정상 → 40-60점</li>
                    <li>• {'>'} +1.0%: 확장적 → 60-100점</li>
                  </ul>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">🎯 국면 판별 (총점 기준)</h4>
                  <ul className="space-y-1 text-xs ml-4">
                    <li>• 0-25점: <span className="text-red-600 font-bold">침체</span> (Recession)</li>
                    <li>• 25-50점: <span className="text-green-600 font-bold">회복</span> (Early Expansion)</li>
                    <li>• 50-75점: <span className="text-emerald-600 font-bold">확장</span> (Late Expansion)</li>
                    <li>• 75-100점: <span className="text-amber-600 font-bold">둔화</span> (Slowdown)</li>
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
