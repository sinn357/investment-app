"use client";

import React, { useState } from 'react';

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

interface SentimentCycleCardProps {
  data?: SentimentCycleData | null;  // ✅ props로 데이터를 받음
}

export default function SentimentCycleCard({ data }: SentimentCycleCardProps) {
  const [showFormula, setShowFormula] = useState(false);

  // ✅ API 호출 로직 제거 (부모 컴포넌트에서 통합 API로 받음)

  if (!data) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border-l-4 border-gray-400">
        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">
          🎭 심리/밸류에이션 사이클
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          데이터를 불러오는 중...
        </p>
      </div>
    );
  }

  const emoji = phaseEmojis[data.phase as keyof typeof phaseEmojis] || '😐';
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

        {/* 지표별 점수 */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <h4 className="font-semibold text-gray-800 dark:text-white mb-3">
            📊 개별 지표 점수
          </h4>
          <div className="grid grid-cols-1 gap-2 text-sm">
            <div className="flex items-center justify-between px-3 py-2 bg-white dark:bg-gray-800 rounded">
              <span className="text-gray-700 dark:text-gray-300">VIX (100%)</span>
              <span className="font-bold text-gray-900 dark:text-white">{data.indicators.vix.toFixed(1)}점</span>
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            ⚠️ VIX는 역방향 지표입니다 (높을수록 공포 = 낮은 점수)
          </p>
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
                심리/밸류에이션 사이클 점수화 공식
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
                  총점 = VIX × 100%
                </code>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  (현재는 VIX만 활성화. AAII, PER, CAPE 등은 향후 추가 예정)
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">🎯 VIX 점수화 (역방향)</h4>
                <ul className="space-y-2 text-sm">
                  <li><strong>≥40 (극단적 공포):</strong> 100점<br />
                    시장 패닉 상태 → 저가 매수 기회
                  </li>
                  <li><strong>30-40 (높은 공포):</strong> 80-100점<br />
                    불확실성 증가 → 기회 탐색
                  </li>
                  <li><strong>20-30 (보통):</strong> 50-80점<br />
                    정상 변동성 → 관망
                  </li>
                  <li><strong>15-20 (낮은 공포):</strong> 20-50점<br />
                    안정적 → 주의 필요
                  </li>
                  <li><strong>&lt;15 (극단적 낙관):</strong> 0-20점<br />
                    과도한 낙관 → 고점 경계, 차익실현
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">🔄 국면 판별</h4>
                <ul className="space-y-2 text-sm">
                  <li><strong>극단적 공포 (66-100점):</strong> VIX &gt;30<br />
                    → 공격적 매수 (역발상 투자)
                  </li>
                  <li><strong>중립 (33-66점):</strong> VIX 15-30<br />
                    → 관망 또는 포지션 유지
                  </li>
                  <li><strong>극단적 탐욕 (0-33점):</strong> VIX &lt;15<br />
                    → 차익 실현, 현금 비중 확대
                  </li>
                </ul>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border-l-4 border-yellow-500">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  <strong>💡 워렌 버핏 명언:</strong> "남들이 탐욕스러울 때 두려워하고, 남들이 두려워할 때 탐욕스러워라"<br />
                  → VIX 높을 때(공포) = 매수, VIX 낮을 때(탐욕) = 매도
                </p>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border-l-4 border-blue-500">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>🔮 향후 추가 예정 지표:</strong> AAII 투자자 심리, S&P 500 PER, Shiller CAPE, ETF Flow, Put/Call Ratio 등
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
