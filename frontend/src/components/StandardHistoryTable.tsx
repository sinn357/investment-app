'use client';

import { TABLE_CLASSES } from '@/styles/theme';

export interface DataRow {
  release_date: string;
  time: string;
  actual: number | string | null;
  forecast: number | string | null;
  previous: number | string;
}

interface StandardHistoryTableProps {
  data: DataRow[];
  loading?: boolean;
  error?: string;
  indicatorName: string;
  indicatorId?: string; // 역방향 지표 판별용
  onRetry?: () => void;
}

// 역방향 지표 (낮을수록 좋은 지표)
const REVERSE_INDICATORS = [
  'unemployment-rate',
  'initial-jobless-claims',
];

export default function StandardHistoryTable({
  data,
  loading,
  error,
  indicatorId,
  onRetry,
}: StandardHistoryTableProps) {
  const isReverseIndicator = indicatorId && REVERSE_INDICATORS.includes(indicatorId);
  // % 및 K 데이터를 숫자로 변환하는 헬퍼 함수 (색상 비교용)
  const parsePercentValue = (value: string | number | null): number | null => {
    if (value === null) return null;
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      // % 제거
      let numStr = value.replace('%', '');
      // K 제거 (천 단위)
      numStr = numStr.replace('K', '');
      const num = parseFloat(numStr);
      return isNaN(num) ? null : num;
    }
    return null;
  };

  const formatValue = (value: string | number | null) => {
    if (value === null) return '-';
    // 문자열 (예: "0.87%", "218K")은 그대로 반환
    if (typeof value === 'string') return value;
    // 숫자는 소수점 1자리로 포맷
    if (typeof value === 'number') return value.toFixed(1);
    return value;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  // 로딩 상태
  if (loading) {
    return (
      <div className={TABLE_CLASSES.container}>
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600 dark:text-gray-400">
            데이터를 가져오는 중...
          </span>
        </div>
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className={TABLE_CLASSES.container}>
        <div className="p-8 text-center">
          <div className="text-red-600 dark:text-red-400 mb-2">
            ⚠️ 데이터를 가져올 수 없습니다
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-sm">{error}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              다시 시도
            </button>
          )}
        </div>
      </div>
    );
  }

  // 데이터 없음
  if (data.length === 0) {
    return (
      <div className={TABLE_CLASSES.container}>
        <div className="p-8 text-center text-gray-500 dark:text-gray-400">
          표시할 데이터가 없습니다.
        </div>
      </div>
    );
  }

  return (
    <div className={TABLE_CLASSES.container}>
      <div className="overflow-x-auto">
        <table className={TABLE_CLASSES.table}>
          <thead className={TABLE_CLASSES.thead}>
            <tr>
              <th scope="col" className={TABLE_CLASSES.th}>
                Release Date
              </th>
              <th scope="col" className={TABLE_CLASSES.th}>
                Time
              </th>
              <th scope="col" className={TABLE_CLASSES.th}>
                Actual
              </th>
              <th scope="col" className={TABLE_CLASSES.th}>
                Forecast
              </th>
              <th scope="col" className={TABLE_CLASSES.th}>
                Previous
              </th>
            </tr>
          </thead>
          <tbody className={TABLE_CLASSES.tbody}>
            {data.map((row, index) => (
              <tr
                key={index}
                className={`${
                  index % 2 === 0 ? TABLE_CLASSES.trEven : TABLE_CLASSES.trOdd
                } ${TABLE_CLASSES.trHover}`}
              >
                <td className={`${TABLE_CLASSES.td} ${TABLE_CLASSES.tdPrimary}`}>
                  {formatDate(row.release_date)}
                </td>
                <td className={`${TABLE_CLASSES.td} ${TABLE_CLASSES.tdSecondary}`}>
                  {row.time}
                </td>
                <td className={TABLE_CLASSES.td}>
                  <span
                    className={`${(() => {
                      if (row.actual === null) return TABLE_CLASSES.neutral;

                      const actualNum = parsePercentValue(row.actual);
                      const forecastNum = parsePercentValue(row.forecast);

                      if (actualNum !== null && forecastNum !== null) {
                        // 역방향 지표 (실업률, 신규실업급여신청 등 - 낮을수록 좋음)
                        if (isReverseIndicator) {
                          if (actualNum < forecastNum) return TABLE_CLASSES.positive; // 낮으면 좋음 (초록)
                          if (actualNum > forecastNum) return TABLE_CLASSES.negative; // 높으면 나쁨 (빨강)
                        } else {
                          // 정방향 지표 (높을수록 좋음)
                          if (actualNum > forecastNum) return TABLE_CLASSES.positive; // 높으면 좋음 (초록)
                          if (actualNum < forecastNum) return TABLE_CLASSES.negative; // 낮으면 나쁨 (빨강)
                        }
                      }

                      return TABLE_CLASSES.tdPrimary;
                    })()}`}
                  >
                    {formatValue(row.actual)}
                  </span>
                </td>
                <td className={`${TABLE_CLASSES.td} ${TABLE_CLASSES.tdSecondary}`}>
                  {formatValue(row.forecast)}
                </td>
                <td className={`${TABLE_CLASSES.td} ${TABLE_CLASSES.tdSecondary}`}>
                  {formatValue(row.previous)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 테이블 하단 정보 */}
      <div className="mt-4 px-6 pb-4 text-sm text-gray-500 dark:text-gray-400">
        <p>* 최신 날짜순으로 정렬됨 (총 {data.length}개 데이터)</p>
        <p>* 초록색: 예측치 초과, 빨간색: 예측치 미달</p>
        <p>* 데이터 출처: investing.com</p>
      </div>
    </div>
  );
}
