"use client";

import React from 'react';

interface MasterCycleData {
  mmc_score: number;
  phase: string;
  macro: {
    score: number;
    phase: string;
  };
  credit: {
    score: number;
    state: string;
  };
  sentiment: {
    score: number;
    state?: string;
    note?: string;
  };
  recommendation: string;
  updated_at: string;
  version?: string;
}

interface MasterCycleCardProps {
  data: MasterCycleData;
}

/**
 * Master Market Cycle Card
 * 3대 사이클(Macro, Credit, Sentiment)을 통합한 종합 투자 타이밍 점수 표시
 *
 * Phase 1: Sentiment는 50점 고정 (Phase 2에서 활성화)
 */
export default function MasterCycleCard({ data }: MasterCycleCardProps) {
  // MMC 점수에 따른 색상 결정
  const getMMCColor = (score: number): string => {
    if (score >= 80) return "text-emerald-600 dark:text-emerald-400";
    if (score >= 60) return "text-green-600 dark:text-green-400";
    if (score >= 40) return "text-yellow-600 dark:text-yellow-400";
    if (score >= 20) return "text-orange-600 dark:text-orange-400";
    return "text-red-600 dark:text-red-400";
  };

  const getBgColor = (score: number): string => {
    if (score >= 80) return "bg-emerald-50 dark:bg-emerald-950/20";
    if (score >= 60) return "bg-green-50 dark:bg-green-950/20";
    if (score >= 40) return "bg-yellow-50 dark:bg-yellow-950/20";
    if (score >= 20) return "bg-orange-50 dark:bg-orange-950/20";
    return "bg-red-50 dark:bg-red-950/20";
  };

  const getBorderColor = (score: number): string => {
    if (score >= 80) return "border-emerald-200 dark:border-emerald-800";
    if (score >= 60) return "border-green-200 dark:border-green-800";
    if (score >= 40) return "border-yellow-200 dark:border-yellow-800";
    if (score >= 20) return "border-orange-200 dark:border-orange-800";
    return "border-red-200 dark:border-red-800";
  };

  // 원형 프로그레스 SVG 생성
  const CircularProgress = ({ score, label }: { score: number; label: string }) => {
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (score / 100) * circumference;

    return (
      <div className="flex flex-col items-center">
        <div className="relative w-28 h-28">
          <svg className="w-full h-full -rotate-90">
            {/* 배경 원 */}
            <circle
              cx="56"
              cy="56"
              r={radius}
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className="text-gray-200 dark:text-gray-700"
            />
            {/* 진행 원 */}
            <circle
              cx="56"
              cy="56"
              r={radius}
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className={getMMCColor(score)}
              strokeLinecap="round"
            />
          </svg>
          {/* 중앙 점수 */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-2xl font-bold ${getMMCColor(score)}`}>
              {score}
            </span>
          </div>
        </div>
        <span className="text-sm text-gray-600 dark:text-gray-400 mt-2">
          {label}
        </span>
      </div>
    );
  };

  return (
    <div className={`rounded-xl border-2 ${getBorderColor(data.mmc_score)} ${getBgColor(data.mmc_score)} p-6 shadow-lg`}>
      {/* 헤더 */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            🎯 Master Market Cycle
          </h2>
          {data.version && (
            <span className="text-xs text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 px-2 py-1 rounded">
              {data.version}
            </span>
          )}
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          3대 사이클 통합 투자 타이밍 점수
        </p>
      </div>

      {/* MMC 종합 점수 */}
      <div className="flex items-center justify-between mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg">
        <div>
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            종합 점수
          </div>
          <div className={`text-5xl font-bold ${getMMCColor(data.mmc_score)}`}>
            {data.mmc_score}
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            시장 국면
          </div>
          <div className={`text-xl font-semibold ${getMMCColor(data.mmc_score)}`}>
            {data.phase}
          </div>
        </div>
      </div>

      {/* 3대 사이클 원형 게이지 */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <CircularProgress score={data.macro.score} label="거시경제" />
        <CircularProgress score={data.credit.score} label="신용/유동성" />
        <CircularProgress score={data.sentiment.score} label="심리/밸류" />
      </div>

      {/* 상세 정보 */}
      <div className="grid grid-cols-3 gap-4 mb-6 text-center">
        <div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
            Macro
          </div>
          <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            {data.macro.phase}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
            Credit
          </div>
          <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            {data.credit.state}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
            Sentiment
          </div>
          <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            {data.sentiment.state || data.sentiment.note || "중립"}
          </div>
        </div>
      </div>

      {/* 투자 추천 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border-l-4 border-blue-500">
        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
          💡 투자 추천
        </div>
        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {data.recommendation}
        </div>
      </div>

      {/* Phase 1 안내 (Sentiment 비활성 시) */}
      {data.sentiment.score === 50 && data.sentiment.note && (
        <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 text-center bg-gray-100 dark:bg-gray-700 p-2 rounded">
          ⚠️ Sentiment 사이클은 Phase 2에서 활성화됩니다
        </div>
      )}

      {/* 업데이트 시각 */}
      <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 text-right">
        업데이트: {new Date(data.updated_at).toLocaleString('ko-KR')}
      </div>
    </div>
  );
}
