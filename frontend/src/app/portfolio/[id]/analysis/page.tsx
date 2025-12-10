'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';

export default function PortfolioAnalysisRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/analysis');
  }, [router]);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center space-y-4">
        <h1 className="text-3xl font-bold text-foreground">개별 자산 분석 페이지가 이동했습니다</h1>
        <p className="text-muted-foreground">
          포트폴리오 내 개별 자산 분석은 이제 `/analysis` 페이지에서 통합 관리합니다. 자산을 추가하고 기본적/기술적/총평을 모두
          기록하세요.
        </p>
        <div className="flex justify-center gap-3">
          <Button onClick={() => router.replace('/analysis')}>/analysis로 이동</Button>
          <Button variant="outline" onClick={() => router.replace('/portfolio')}>
            포트폴리오로 돌아가기
          </Button>
        </div>
      </div>
    </div>
  );
}
