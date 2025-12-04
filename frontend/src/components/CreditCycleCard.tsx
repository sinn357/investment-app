"use client";

import React, { useState } from 'react';

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

interface CreditCycleCardProps {
  data?: CreditCycleData | null;  // ✅ props로 데이터를 받음
}

export default function CreditCycleCard({ data }: CreditCycleCardProps) {
  const [showFormula, setShowFormula] = useState(false);

  // ✅ API 호출 로직 제거 (부모 컴포넌트에서 통합 API로 받음)

  if (!data) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border-l-4 border-gray-400">
        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">
          💧 신용/유동성 사이클
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          데이터를 불러오는 중...
        </p>
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

        {/* 지표별 점수 */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <h4 className="font-semibold text-gray-800 dark:text-white mb-3">
            📊 개별 지표 점수
          </h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center justify-between px-3 py-2 bg-white dark:bg-gray-800 rounded">
              <span className="text-gray-700 dark:text-gray-300">HY Spread (40%)</span>
              <span className="font-bold text-gray-900 dark:text-white">{data.indicators.hy_spread.toFixed(1)}점</span>
            </div>
            <div className="flex items-center justify-between px-3 py-2 bg-white dark:bg-gray-800 rounded">
              <span className="text-gray-700 dark:text-gray-300">IG Spread (20%)</span>
              <span className="font-bold text-gray-900 dark:text-white">{data.indicators.ig_spread.toFixed(1)}점</span>
            </div>
            <div className="flex items-center justify-between px-3 py-2 bg-white dark:bg-gray-800 rounded">
              <span className="text-gray-700 dark:text-gray-300">FCI (30%)</span>
              <span className="font-bold text-gray-900 dark:text-white">{data.indicators.fci.toFixed(1)}점</span>
            </div>
            <div className="flex items-center justify-between px-3 py-2 bg-white dark:bg-gray-800 rounded">
              <span className="text-gray-700 dark:text-gray-300">M2 YoY (10%)</span>
              <span className="font-bold text-gray-900 dark:text-white">{data.indicators.m2_yoy.toFixed(1)}점</span>
            </div>
          </div>
        </div>

        {/* 업데이트 시간 */}
        <div className="text-xs text-gray-500 dark:text-gray-400 text-right">
          마지막 업데이트: {new Date(data.last_updated).toLocaleString('ko-KR')}
        </div>
      </div>

      {/* 점수화 공식 모달 */}
      {showFormula && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowFormula(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                신용/유동성 사이클 점수화 공식
              </h3>
              <button
                onClick={() => setShowFormula(false)}
                className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-gray-700 dark:text-gray-300">
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">📐 총점 계산</h4>
                <code className="block bg-gray-100 dark:bg-gray-900 p-3 rounded text-sm">
                  총점 = HY Spread × 40% + FCI × 30% + IG Spread × 20% + M2 YoY × 10%
                </code>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">🎯 개별 지표 점수화</h4>
                <ul className="space-y-2 text-sm">
                  <li><strong>HY Spread (하이일드 스프레드):</strong> 역방향 (낮을수록 좋음)<br />
                    ≤3.0% = 100점, 3-5% = 80-50점, 5-10% = 50-0점, &gt;10% = 0점
                  </li>
                  <li><strong>IG Spread (투자등급 스프레드):</strong> 역방향<br />
                    ≤1.0% = 100점, 1-2% = 80-50점, 2-4% = 50-0점, &gt;4% = 0점
                  </li>
                  <li><strong>FCI (금융여건지수):</strong> 역방향<br />
                    ≤-1 = 100점, -1~0 = 80-50점, 0~1 = 50-20점, &gt;1 = 0점
                  </li>
                  <li><strong>M2 YoY (통화량 증가율):</strong> 정방향<br />
                    ≥10% = 100점, 5-10% = 50-100점, 0-5% = 0-50점, &lt;0% = 0점
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">🔄 국면 판별</h4>
                <ul className="space-y-2 text-sm">
                  <li><strong>신용 경색 (0-33점):</strong> 스프레드 극대, 긴축<br />
                    → 방어적 포지션, 현금·채권 비중 확대
                  </li>
                  <li><strong>정상화 (33-66점):</strong> 중립적 신용 여건<br />
                    → 균형 잡힌 포트폴리오
                  </li>
                  <li><strong>신용 과잉 (66-100점):</strong> 스프레드 최소, 완화<br />
                    → 레버리지 확대, 리스크 자산 비중 확대
                  </li>
                </ul>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border-l-4 border-yellow-500">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  <strong>💡 핵심:</strong> 스프레드가 낮고(기업 차입 비용↓) M2가 증가(유동성 풍부)하면 신용 과잉 국면 → 공격적 투자 유리
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
