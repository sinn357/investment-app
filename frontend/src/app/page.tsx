import EconomicIndicatorsSection from '@/components/EconomicIndicatorsSection';
import DataSection from '@/components/DataSection';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            투자 대시보드
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            실시간 경제지표 모니터링
          </p>
        </div>
      </header>

      <main>
        <EconomicIndicatorsSection />
        <DataSection />
      </main>
    </div>
  );
}
