import Link from 'next/link';
import Navigation from '@/components/Navigation';

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <header className="bg-gradient-to-r from-primary/5 to-secondary/5 shadow-sm border-b border-primary/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-foreground">
            투자 어시스턴트
          </h1>
          <p className="mt-2 text-muted-foreground">
            투자 관리 시스템
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-2 gap-8">
          {/* 경제지표 섹션 */}
          <div className="bg-card rounded-lg shadow-lg p-6 border-2 border-primary/20 hover:border-primary/40 transition-colors">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-card-foreground ml-3">
                경제지표 모니터링
              </h2>
            </div>
            <p className="text-muted-foreground mb-6">
              실시간 경제지표 데이터를 확인하고 투자 의사결정에 활용하세요.
            </p>
            <Link
              href="/indicators"
              className="inline-flex items-center px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg shadow-md transition-colors"
            >
              지표 확인하기
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {/* 포트폴리오 섹션 */}
          <div className="bg-card rounded-lg shadow-lg p-6 border-2 border-secondary/20 hover:border-secondary/40 transition-colors">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-card-foreground ml-3">
                포트폴리오 관리
              </h2>
            </div>
            <p className="text-muted-foreground mb-6">
              보유 자산을 체계적으로 관리하고 투자 포트폴리오를 추적하세요.
            </p>
            <Link
              href="/portfolio"
              className="inline-flex items-center px-4 py-2 bg-secondary hover:bg-secondary/90 text-secondary-foreground rounded-lg shadow-md transition-colors"
            >
              포트폴리오 관리
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>

        {/* 추가 정보 섹션 */}
        <div className="mt-12 text-center">
          <h3 className="text-lg font-medium text-foreground mb-4">
            통합 투자 관리 플랫폼
          </h3>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            경제지표 분석부터 포트폴리오 관리까지 투자에 필요한 모든 도구를 한 곳에서 이용하세요.
          </p>
        </div>
      </main>
    </div>
  );
}