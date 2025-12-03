/**
 * EnhancedIndicatorCard 컴포넌트
 * Phase 1 리뉴얼: CompactIndicatorCard 대체
 *
 * 기능:
 * - 카테고리 태그 (색상 구분)
 * - 상태 배지 (양호/중립/주의)
 * - 현재값 + 이전값 + 변화량
 * - 미니 스파크라인 차트 (최근 6개월)
 * - "자세히 >" 버튼 (클릭 시 상세 모달)
 */

'use client';

import React, { useState } from 'react';
import { CARD_CLASSES, BADGE_CLASSES } from '@/styles/theme';
import MiniSparkline from './MiniSparkline';
import IndicatorDetailModal from './IndicatorDetailModal';

export interface EnhancedIndicatorCardProps {
  id: string;
  name: string;
  nameKo?: string;
  actual: number | string | null;
  previous: number | string;
  forecast?: number | string | null;
  surprise?: number | null;
  category: string;
  sparklineData?: number[];
  reverseColor?: boolean;
  isSelected?: boolean;
  onClick?: () => void;
}

const EnhancedIndicatorCard = React.memo(function EnhancedIndicatorCard({
  id,
  name,
  nameKo,
  actual,
  previous,
  surprise,
  category,
  sparklineData = [],
  reverseColor = false,
  isSelected = false,
  onClick,
}: EnhancedIndicatorCardProps) {
  const [showModal, setShowModal] = useState(false);

  // 변화량 계산
  const getChange = () => {
    if (actual === null || actual === undefined) return null;

    const actualNum = typeof actual === 'string'
      ? parseFloat(actual.replace('%', '').replace('K', '000'))
      : actual;
    const prevNum = typeof previous === 'string'
      ? parseFloat(previous.replace('%', '').replace('K', '000'))
      : previous;

    if (isNaN(actualNum) || isNaN(prevNum)) return null;

    return actualNum - prevNum;
  };

  const change = getChange();
  const hasIncrease = change !== null && change > 0;
  const hasDecrease = change !== null && change < 0;

  // 상태 배지 결정
  const getStatusBadge = () => {
    if (surprise === null || surprise === undefined) {
      return { text: '중립', class: BADGE_CLASSES.neutral };
    }

    const absSurprise = Math.abs(surprise);

    // 역방향 지표 (실업률, 신규실업급여신청 등)
    if (reverseColor) {
      if (absSurprise < 0.1) {
        return { text: '예상', class: BADGE_CLASSES.neutral };
      } else if (surprise < 0) {
        // 실제 < 예상 = 좋음
        return { text: '양호', class: BADGE_CLASSES.excellent };
      } else {
        // 실제 > 예상 = 나쁨
        return { text: '주의', class: BADGE_CLASSES.caution };
      }
    }

    // 정방향 지표 (기본)
    if (absSurprise < 0.1) {
      return { text: '예상', class: BADGE_CLASSES.neutral };
    } else if (surprise > 0) {
      return { text: '양호', class: BADGE_CLASSES.excellent };
    } else {
      return { text: '주의', class: BADGE_CLASSES.caution };
    }
  };

  const status = getStatusBadge();

  // 카테고리별 완전한 클래스명 (Tailwind 동적 클래스 문제 해결)
  const getCategoryClasses = () => {
    const classes: Record<string, string> = {
      'business': 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
      'employment': 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
      'interest': 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
      'trade': 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300',
      'inflation': 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
    };
    return classes[category] || 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300';
  };

  const categoryClasses = getCategoryClasses();

  // 카테고리 한글명
  const categoryNames: Record<string, string> = {
    'business': '경기',
    'employment': '고용',
    'interest': '금리',
    'trade': '무역',
    'inflation': '물가',
  };

  const handleCardClick = () => {
    if (onClick) {
      onClick();
    } else {
      setShowModal(true);
    }
  };

  return (
    <>
      <div
        className={`${CARD_CLASSES.container} cursor-pointer hover:shadow-lg transition-all duration-200 ${
          isSelected ? 'ring-2 ring-primary shadow-xl scale-105' : ''
        }`}
        onClick={handleCardClick}
      >
        {/* 헤더: 카테고리 태그 + 상태 배지 */}
        <div className="flex items-center justify-between mb-3">
          <span className={`px-2 py-1 rounded text-xs font-medium ${categoryClasses}`}>
            {categoryNames[category] || category}
          </span>
          <span className={status.class}>
            {status.text}
          </span>
        </div>

        {/* 지표명 */}
        <h3 className="text-sm font-semibold mb-2 text-gray-800 dark:text-gray-200">
          {nameKo || name}
        </h3>

        {/* 현재값 + 변화량 */}
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {actual !== null ? actual : '-'}
          </span>
          {change !== null && (
            <span className={`text-sm font-medium ${
              hasIncrease ? 'text-red-600 dark:text-red-400' :
              hasDecrease ? 'text-blue-600 dark:text-blue-400' :
              'text-gray-500 dark:text-gray-400'
            }`}>
              {hasIncrease ? '▲' : hasDecrease ? '▼' : ''}
              {Math.abs(change).toFixed(2)}
            </span>
          )}
        </div>

        {/* 이전값 */}
        <div className="text-xs text-gray-500 dark:text-gray-400 mb-3">
          이전: {previous}
        </div>

        {/* 서프라이즈 값 */}
        {surprise !== null && surprise !== undefined && (
          <div className="text-xs mb-3">
            <span className="text-gray-500 dark:text-gray-400">서프라이즈: </span>
            <span className={`font-medium ${
              Math.abs(surprise) < 0.1 ? 'text-gray-600 dark:text-gray-300' :
              (reverseColor ? surprise < 0 : surprise > 0) ? 'text-green-600 dark:text-green-400' :
              'text-red-600 dark:text-red-400'
            }`}>
              {surprise > 0 ? '+' : ''}{surprise.toFixed(2)}
            </span>
          </div>
        )}

        {/* 미니 스파크라인 */}
        {sparklineData.length > 0 && (
          <div className="mb-3">
            <MiniSparkline data={sparklineData} />
          </div>
        )}

        {/* 자세히 보기 버튼 */}
        <div className="flex justify-end">
          <button className="text-xs text-gold-600 dark:text-gold-400 hover:text-gold-700 dark:hover:text-gold-300 font-medium flex items-center gap-1">
            자세히
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* 상세 모달 */}
      {showModal && (
        <IndicatorDetailModal
          id={id}
          name={name}
          nameKo={nameKo}
          category={category}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
});

export default EnhancedIndicatorCard;
