import { CARD_CLASSES } from '@/styles/theme';

export default function IndicatorGridSkeleton() {
  return (
    <section className="py-8 bg-gradient-to-b from-transparent to-gray-50 dark:to-gray-900/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 헤더 Skeleton */}
        <div className="mb-8 animate-pulse">
          <div className="h-9 bg-gray-200 dark:bg-gray-700 rounded w-64 mb-2"></div>
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-96"></div>
        </div>

        {/* 필터 버튼 Skeleton */}
        <div className="mb-6 overflow-x-auto animate-pulse">
          <div className="flex gap-2 pb-2">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div
                key={i}
                className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg w-24"
              ></div>
            ))}
          </div>
        </div>

        {/* 카드 그리드 Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div
              key={i}
              className={`${CARD_CLASSES.container} p-4 animate-pulse`}
            >
              {/* 카테고리 태그 + 배지 */}
              <div className="flex items-center justify-between mb-2">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
              </div>

              {/* 지표명 */}
              <div className="mb-3 space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              </div>

              {/* 최신값 + 변화량 */}
              <div className="mb-2 flex items-baseline gap-2">
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
              </div>

              {/* 이전값 */}
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-3"></div>

              {/* 클릭 힌트 */}
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
