/**
 * 경제지표 대시보드 통합 테마 시스템
 * Phase 1: 디자인 통일 작업
 */

// 지표 색상 시스템
export const INDICATOR_COLORS = {
  // 긍정/부정 색상
  excellent: '#10b981',  // 초록 - 매우 좋음
  good: '#84cc16',       // 연두 - 좋음
  caution: '#f59e0b',    // 주황 - 주의
  warning: '#ef4444',    // 빨강 - 경고
  neutral: '#6b7280',    // 회색 - 중립

  // 차트 색상
  primary: '#3b82f6',    // 파랑 - 막대 차트
  secondary: '#10b981',  // 초록 - 선형 차트
  tertiary: '#8b5cf6',   // 보라 - 보조 데이터

  // 배경 색상
  cardBg: '#ffffff',
  cardBgDark: '#1f2937',
  tableBg: '#f9fafb',
  tableBgDark: '#374151',

  // 텍스트 색상
  textPrimary: '#111827',
  textPrimaryDark: '#f3f4f6',
  textSecondary: '#6b7280',
  textSecondaryDark: '#9ca3af',

  // 테두리 색상
  border: '#e5e7eb',
  borderDark: '#374151',
};

// Recharts 공통 테마
export const CHART_THEME = {
  // 차트 색상
  colors: {
    bar: INDICATOR_COLORS.primary,
    line: INDICATOR_COLORS.secondary,
    grid: '#374151',
    axis: '#6b7280',
    referenceLine: '#ef4444',
    referenceLineSecondary: '#f59e0b',
  },

  // Tooltip 스타일
  tooltip: {
    contentStyle: {
      backgroundColor: '#1f2937',
      border: '1px solid #374151',
      borderRadius: '6px',
      color: '#f3f4f6',
    },
  },

  // 애니메이션
  animation: {
    duration: 500,
    easing: 'ease-in-out',
  },

  // 차트 여백
  margin: {
    top: 20,
    right: 30,
    left: 20,
    bottom: 5,
  },

  // 폰트 크기
  fontSize: {
    axis: 12,
    label: 14,
    title: 16,
  },
};

// 테이블 스타일 클래스
export const TABLE_CLASSES = {
  // 테이블 컨테이너
  container: 'bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden',

  // 테이블
  table: 'min-w-full divide-y divide-gray-200 dark:divide-gray-700',

  // 테이블 헤더
  thead: 'bg-gray-50 dark:bg-gray-700',
  th: 'px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider',

  // 테이블 바디
  tbody: 'bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700',
  trEven: 'bg-white dark:bg-gray-800',
  trOdd: 'bg-gray-50 dark:bg-gray-700',
  trHover: 'hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors',
  td: 'px-6 py-4 whitespace-nowrap text-sm',
  tdPrimary: 'text-gray-900 dark:text-white font-medium',
  tdSecondary: 'text-gray-500 dark:text-gray-300',

  // 색상 강조
  positive: 'text-green-600 dark:text-green-400 font-medium',
  negative: 'text-red-600 dark:text-red-400 font-medium',
  neutral: 'text-gray-400',
};

// 카드 스타일 클래스
export const CARD_CLASSES = {
  container: 'bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow',
  title: 'font-semibold text-lg text-gray-900 dark:text-white',
  subtitle: 'text-gray-500 dark:text-gray-400',
  value: 'font-medium text-gray-900 dark:text-white',
};

// 로딩 스켈레톤 클래스
export const SKELETON_CLASSES = {
  card: 'bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 animate-pulse',
  bar: 'h-4 bg-gray-200 dark:bg-gray-700 rounded',
};

// 버튼 스타일 클래스
export const BUTTON_CLASSES = {
  primary: 'px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors',
  secondary: 'px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors',
  danger: 'px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors',
};

// 배지 스타일 클래스
export const BADGE_CLASSES = {
  excellent: 'px-3 py-1 rounded-full text-sm font-bold bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  good: 'px-3 py-1 rounded-full text-sm font-bold bg-lime-100 text-lime-800 dark:bg-lime-900 dark:text-lime-200',
  caution: 'px-3 py-1 rounded-full text-sm font-bold bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  warning: 'px-3 py-1 rounded-full text-sm font-bold bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  neutral: 'px-3 py-1 rounded-full text-sm font-bold bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
};
