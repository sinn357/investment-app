'use client';

import { useEffect, useState } from 'react';
import EconomicIndicatorCard from './EconomicIndicatorCard';

interface EconomicIndicator {
  name: string;
  latestDate: string;
  nextDate: string;
  actual: number | null;
  forecast: number | null;
  previous: number;
  surprise: number | null;
  threshold?: {
    value: number;
    type: 'warning' | 'critical';
  };
}

export default function EconomicIndicatorsSection() {
  const [indicators, setIndicators] = useState<EconomicIndicator[]>([]);
  const [loading, setLoading] = useState(true);

  // ISM Manufacturing PMI 데이터를 API에서 가져와서 카드 형식으로 변환
  const fetchISMManufacturingData = async (): Promise<EconomicIndicator | null> => {
    try {
      const response = await fetch('http://localhost:5001/api/rawdata/latest');
      const result = await response.json();

      if (result.status === 'success' && result.data.latest_release && result.data.next_release) {
        const latest = result.data.latest_release;
        const next = result.data.next_release;

        // 서프라이즈 계산 (actual - forecast) - 소수점 2자리 반올림
        const surprise = latest.actual !== null && latest.forecast !== null
          ? Math.round((latest.actual - latest.forecast) * 100) / 100
          : null;

        return {
          name: "ISM Manufacturing PMI",
          latestDate: latest.release_date,
          nextDate: next.release_date,
          actual: latest.actual,
          forecast: latest.forecast,
          previous: latest.previous,
          surprise: surprise,
          threshold: { value: 50.0, type: 'warning' } // PMI 50이 확장/수축 분기점
        };
      }
      return null;
    } catch (error) {
      console.error('Error fetching ISM data:', error);
      return null;
    }
  };

  // ISM Non-Manufacturing PMI 데이터를 API에서 가져와서 카드 형식으로 변환
  const fetchISMNonManufacturingData = async (): Promise<EconomicIndicator | null> => {
    try {
      const response = await fetch('http://localhost:5001/api/rawdata/ism-non-manufacturing');
      const result = await response.json();

      if (result.status === 'success' && result.data.latest_release && result.data.next_release) {
        const latest = result.data.latest_release;
        const next = result.data.next_release;

        // 서프라이즈 계산 (actual - forecast) - 소수점 2자리 반올림
        const surprise = latest.actual !== null && latest.forecast !== null
          ? Math.round((latest.actual - latest.forecast) * 100) / 100
          : null;

        return {
          name: "ISM Non-Manufacturing PMI",
          latestDate: latest.release_date,
          nextDate: next.release_date,
          actual: latest.actual,
          forecast: latest.forecast,
          previous: latest.previous,
          surprise: surprise,
          threshold: { value: 50.0, type: 'warning' } // PMI 50이 확장/수축 분기점
        };
      }
      return null;
    } catch (error) {
      console.error('Error fetching ISM Non-Manufacturing data:', error);
      return null;
    }
  };

  // S&P Global Composite PMI 데이터를 API에서 가져와서 카드 형식으로 변환
  const fetchSPGlobalCompositeData = async (): Promise<EconomicIndicator | null> => {
    try {
      const response = await fetch('http://localhost:5001/api/rawdata/sp-global-composite');
      const result = await response.json();

      if (result.status === 'success' && result.data.latest_release && result.data.next_release) {
        const latest = result.data.latest_release;
        const next = result.data.next_release;

        // 서프라이즈 계산 (actual - forecast) - 소수점 2자리 반올림
        const surprise = latest.actual !== null && latest.forecast !== null
          ? Math.round((latest.actual - latest.forecast) * 100) / 100
          : null;

        return {
          name: "S&P Global Composite PMI",
          latestDate: latest.release_date,
          nextDate: next.release_date,
          actual: latest.actual,
          forecast: latest.forecast,
          previous: latest.previous,
          surprise: surprise,
          threshold: { value: 50.0, type: 'warning' } // PMI 50이 확장/수축 분기점
        };
      }
      return null;
    } catch (error) {
      console.error('Error fetching S&P Global Composite data:', error);
      return null;
    }
  };

  // Industrial Production 데이터를 API에서 가져와서 카드 형식으로 변환
  const fetchIndustrialProductionData = async (): Promise<EconomicIndicator | null> => {
    try {
      const response = await fetch('http://localhost:5001/api/rawdata/industrial-production');
      const result = await response.json();

      if (result.status === 'success' && result.data.latest_release && result.data.next_release) {
        const latest = result.data.latest_release;
        const next = result.data.next_release;

        // 서프라이즈 계산 (actual - forecast) - 소수점 2자리 반올림
        const surprise = latest.actual !== null && latest.forecast !== null
          ? Math.round((latest.actual - latest.forecast) * 100) / 100
          : null;

        return {
          name: "Industrial Production",
          latestDate: latest.release_date,
          nextDate: next.release_date,
          actual: latest.actual,
          forecast: latest.forecast,
          previous: latest.previous,
          surprise: surprise,
          threshold: { value: 0.0, type: 'warning' } // 0% 기준점
        };
      }
      return null;
    } catch (error) {
      console.error('Error fetching Industrial Production data:', error);
      return null;
    }
  };

  // Industrial Production (1755) 데이터를 API에서 가져와서 카드 형식으로 변환
  const fetchIndustrialProduction1755Data = async (): Promise<EconomicIndicator | null> => {
    try {
      const response = await fetch('http://localhost:5001/api/rawdata/industrial-production-1755');
      const result = await response.json();

      if (result.status === 'success' && result.data.latest_release && result.data.next_release) {
        const latest = result.data.latest_release;
        const next = result.data.next_release;

        // 서프라이즈 계산 (actual - forecast) - 소수점 2자리 반올림
        const surprise = latest.actual !== null && latest.forecast !== null
          ? Math.round((latest.actual - latest.forecast) * 100) / 100
          : null;

        return {
          name: "Industrial Production YoY",
          latestDate: latest.release_date,
          nextDate: next.release_date,
          actual: latest.actual,
          forecast: latest.forecast,
          previous: latest.previous,
          surprise: surprise,
          threshold: { value: 0.0, type: 'warning' } // 0% 기준점
        };
      }
      return null;
    } catch (error) {
      console.error('Error fetching Industrial Production (1755) data:', error);
      return null;
    }
  };

  // 목업 데이터는 제거 - 실제 크롤링 데이터만 사용
  const mockData: EconomicIndicator[] = [];

  useEffect(() => {
    // 실제 API 데이터와 목업 데이터 결합
    const fetchData = async () => {
      try {
        // 실제 데이터 가져오기
        const [ismManufacturingData, ismNonManufacturingData, spGlobalCompositeData, industrialProductionData, industrialProduction1755Data] = await Promise.all([
          fetchISMManufacturingData(),
          fetchISMNonManufacturingData(),
          fetchSPGlobalCompositeData(),
          fetchIndustrialProductionData(),
          fetchIndustrialProduction1755Data()
        ]);

        // 실제 데이터들을 첫 번째로, 목업 데이터를 나머지로 설정
        const realData = [ismManufacturingData, ismNonManufacturingData, spGlobalCompositeData, industrialProductionData, industrialProduction1755Data].filter(Boolean);
        const allIndicators = [...realData, ...mockData];

        setIndicators(allIndicators);
      } catch (error) {
        console.error('Error fetching indicators:', error);
        // 에러 시 목업 데이터만 표시
        setIndicators(mockData);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [mockData]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <section className="py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            경제지표 Raw Data
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            주요 경제지표의 최신 데이터를 확인하세요
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {indicators.map((indicator, index) => (
            <EconomicIndicatorCard key={index} indicator={indicator} />
          ))}
        </div>
      </div>
    </section>
  );
}