'use client';

import { useState, useEffect } from 'react';
import { CARD_CLASSES, BUTTON_CLASSES, BADGE_CLASSES } from '../styles/theme';

interface UpdateStatus {
  is_updating: boolean;
  progress: number;
  current_indicator: string;
  completed_indicators: string[];
  failed_indicators: Array<{
    indicator_id: string;
    error: string;
  }>;
  start_time: number | null;
}

interface UpdateButtonProps {
  onUpdateComplete?: () => void;
}

export default function UpdateButton({ onUpdateComplete }: UpdateButtonProps) {
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // 업데이트 상태 폴링
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    if (updateStatus?.is_updating) {
      intervalId = setInterval(async () => {
        try {
          const response = await fetch('https://investment-app-backend-x166.onrender.com/api/v2/update-status');
          const result = await response.json();

          if (result.status === 'success') {
            setUpdateStatus(result.update_status);

            // 업데이트 완료 시
            if (!result.update_status.is_updating && result.update_status.progress === 100) {
              setIsLoading(false);
              onUpdateComplete?.();
            }
          }
        } catch (error) {
          console.error('Error fetching update status:', error);
        }
      }, 1000); // 1초마다 상태 확인
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [updateStatus?.is_updating, onUpdateComplete]);

  const handleUpdate = async () => {
    if (updateStatus?.is_updating) return;

    setIsLoading(true);

    try {
      const response = await fetch('https://investment-app-backend-x166.onrender.com/api/v2/update-indicators', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (result.status === 'success') {
        // 즉시 상태 확인 시작
        const statusResponse = await fetch('https://investment-app-backend-x166.onrender.com/api/v2/update-status');
        const statusResult = await statusResponse.json();

        if (statusResult.status === 'success') {
          setUpdateStatus(statusResult.update_status);
        }
      } else {
        console.error('Update failed:', result.message);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error starting update:', error);
      setIsLoading(false);
    }
  };

  const formatIndicatorName = (indicatorId: string) => {
    const names: { [key: string]: string } = {
      'ism-manufacturing': 'ISM Manufacturing',
      'ism-non-manufacturing': 'ISM Non-Manufacturing',
      'sp-global-composite': 'S&P Global Composite',
      'industrial-production': 'Industrial Production',
      'industrial-production-1755': 'Industrial Production YoY',
      'retail-sales': 'Retail Sales MoM',
      'retail-sales-yoy': 'Retail Sales YoY'
    };
    return names[indicatorId] || indicatorId;
  };

  const isUpdating = updateStatus?.is_updating || isLoading;

  return (
    <div className={`${CARD_CLASSES.container} p-6 mb-6`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className={`${CARD_CLASSES.title} text-lg`}>
            데이터 업데이트
          </h3>
          <p className={`text-sm ${CARD_CLASSES.subtitle}`}>
            최신 경제지표 데이터를 크롤링하여 업데이트합니다
          </p>
        </div>

        <button
          onClick={handleUpdate}
          disabled={isUpdating}
          className={isUpdating ? BUTTON_CLASSES.secondary : BUTTON_CLASSES.primary}
        >
          {isUpdating ? '업데이트 중...' : '실시간 업데이트'}
        </button>
      </div>

      {/* 업데이트 진행 상황 */}
      {updateStatus && (
        <div className="space-y-4">
          {/* 진행률 바 */}
          <div>
            <div className={`flex justify-between text-sm ${CARD_CLASSES.subtitle} mb-2`}>
              <span>진행률</span>
              <span>{updateStatus.progress}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${updateStatus.progress}%` }}
              ></div>
            </div>
          </div>

          {/* 현재 처리 중인 지표 */}
          {updateStatus.current_indicator && (
            <div className={`text-sm ${CARD_CLASSES.subtitle}`}>
              현재 업데이트 중: <span className="font-medium text-blue-600 dark:text-blue-400">
                {formatIndicatorName(updateStatus.current_indicator)}
              </span>
            </div>
          )}

          {/* 완료된 지표들 */}
          {updateStatus.completed_indicators.length > 0 && (
            <div>
              <div className="text-sm font-medium text-green-600 dark:text-green-400 mb-2">
                완료된 지표 ({updateStatus.completed_indicators.length}개)
              </div>
              <div className="flex flex-wrap gap-2">
                {updateStatus.completed_indicators.map((indicator) => (
                  <span
                    key={indicator}
                    className={`${BADGE_CLASSES.excellent} text-xs`}
                  >
                    {formatIndicatorName(indicator)}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 실패한 지표들 */}
          {updateStatus.failed_indicators.length > 0 && (
            <div>
              <div className="text-sm font-medium text-red-600 dark:text-red-400 mb-2">
                실패한 지표 ({updateStatus.failed_indicators.length}개)
              </div>
              <div className="space-y-1">
                {updateStatus.failed_indicators.map((failed, index) => (
                  <div
                    key={index}
                    className={`${BADGE_CLASSES.warning} text-xs`}
                  >
                    {formatIndicatorName(failed.indicator_id)}: {failed.error}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 완료 메시지 */}
          {!updateStatus.is_updating && updateStatus.progress === 100 && (
            <div className={`${BADGE_CLASSES.excellent} text-sm`}>
              ✅ 모든 데이터 업데이트가 완료되었습니다!
            </div>
          )}
        </div>
      )}
    </div>
  );
}