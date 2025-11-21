import { CARD_CLASSES } from '@/styles/theme';

export default function CyclePanelSkeleton() {
  return (
    <div className={CARD_CLASSES.container}>
      {/* 제목 Skeleton */}
      <div className="mb-6">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-2 animate-pulse"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-96 animate-pulse"></div>
      </div>

      {/* 4개 게이지 카드 Skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 animate-pulse"
          >
            {/* 아이콘 */}
            <div className="flex items-center justify-between mb-3">
              <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>

            {/* 원형 게이지 */}
            <div className="flex justify-center mb-3">
              <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
            </div>

            {/* 레이블 */}
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 mx-auto"></div>
          </div>
        ))}
      </div>

      {/* 국면 표시 Skeleton */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* 현재 국면 */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 animate-pulse">
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-4"></div>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          </div>
        </div>

        {/* 추천 자산 */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 animate-pulse">
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-4"></div>
          <div className="space-y-3">
            <div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-2"></div>
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-7 bg-gray-200 dark:bg-gray-700 rounded w-16"
                  ></div>
                ))}
              </div>
            </div>
            <div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-2"></div>
              <div className="flex flex-wrap gap-2">
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-7 bg-gray-200 dark:bg-gray-700 rounded w-16"
                  ></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
