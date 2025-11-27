'use client';

import React, { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import SectorHeatmap from '@/components/SectorHeatmap';
import WatchList from '@/components/WatchList';

interface Sector {
  sector: string;
  performance?: number;
  relative_strength?: number;
  notes?: string;
}

interface Stock {
  id: number;
  symbol: string;
  name: string;
  sector?: string;
  current_price?: number;
  target_price?: number;
  notes?: string;
  alert_enabled?: boolean;
  alert_price?: number;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://investment-app-backend-x166.onrender.com';

export default function IndustriesPage() {
  const [userId] = useState(1); // 임시 user_id
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // 섹터 성과 로드
  useEffect(() => {
    const fetchSectors = async () => {
      try {
        const response = await fetch(`${API_URL}/api/sector-performance?user_id=${userId}&date=${selectedDate}`);
        const result = await response.json();

        if (result.status === 'success') {
          setSectors(result.data || []);
        }
      } catch (error) {
        console.error('섹터 성과 로드 실패:', error);
      }
    };

    fetchSectors();
  }, [userId, selectedDate]);

  // 관심 종목 로드
  useEffect(() => {
    const fetchWatchlist = async () => {
      try {
        const response = await fetch(`${API_URL}/api/watchlist?user_id=${userId}`);
        const result = await response.json();

        if (result.status === 'success') {
          setStocks(result.data || []);
        }
      } catch (error) {
        console.error('관심 종목 로드 실패:', error);
      }
    };

    fetchWatchlist();
  }, [userId]);

  // 섹터 성과 저장
  const handleSaveSectors = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`${API_URL}/api/sector-performance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          date: selectedDate,
          sectors: sectors
        })
      });

      const result = await response.json();

      if (result.status === 'success') {
        alert('✅ 섹터 성과가 저장되었습니다!');
      } else {
        alert('❌ 저장 실패: ' + result.message);
      }
    } catch (error) {
      console.error('저장 오류:', error);
      alert('❌ 저장 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  // 관심 종목 추가
  const handleAddStock = async (stock: Omit<Stock, 'id'>) => {
    try {
      const response = await fetch(`${API_URL}/api/watchlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          ...stock
        })
      });

      const result = await response.json();

      if (result.status === 'success') {
        // 관심 종목 다시 로드
        const listResponse = await fetch(`${API_URL}/api/watchlist?user_id=${userId}`);
        const listResult = await listResponse.json();
        if (listResult.status === 'success') {
          setStocks(listResult.data || []);
        }
      } else {
        alert('❌ 추가 실패: ' + result.message);
      }
    } catch (error) {
      console.error('추가 오류:', error);
      alert('❌ 추가 중 오류가 발생했습니다.');
    }
  };

  // 관심 종목 수정
  const handleUpdateStock = async (id: number, stock: Partial<Stock>) => {
    try {
      const response = await fetch(`${API_URL}/api/watchlist/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          ...stock
        })
      });

      const result = await response.json();

      if (result.status === 'success') {
        // 관심 종목 다시 로드
        const listResponse = await fetch(`${API_URL}/api/watchlist?user_id=${userId}`);
        const listResult = await listResponse.json();
        if (listResult.status === 'success') {
          setStocks(listResult.data || []);
        }
      } else {
        alert('❌ 수정 실패: ' + result.message);
      }
    } catch (error) {
      console.error('수정 오류:', error);
      alert('❌ 수정 중 오류가 발생했습니다.');
    }
  };

  // 관심 종목 삭제
  const handleDeleteStock = async (id: number) => {
    try {
      const response = await fetch(`${API_URL}/api/watchlist/${id}?user_id=${userId}`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (result.status === 'success') {
        setStocks(stocks.filter(s => s.id !== id));
      } else {
        alert('❌ 삭제 실패: ' + result.message);
      }
    } catch (error) {
      console.error('삭제 오류:', error);
      alert('❌ 삭제 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* 헤더 */}
      <header className="bg-gradient-to-r from-primary/5 to-secondary/5 shadow-sm border-b border-primary/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-foreground">
            📈 섹터 & 종목 분석
          </h1>
          <p className="mt-2 text-muted-foreground">
            산업별 현황과 관심 종목을 관리하세요
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 날짜 선택 및 저장 버튼 */}
        <div className="flex items-center justify-between gap-4 mb-6 bg-card rounded-lg p-4 border border-primary/20">
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-muted-foreground">기준 날짜:</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 bg-background border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
            />
          </div>
          <button
            onClick={handleSaveSectors}
            disabled={isSaving}
            className="px-6 py-2 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white font-semibold rounded-lg shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? '저장 중...' : '💾 섹터 저장'}
          </button>
        </div>

        {/* 섹터 히트맵 */}
        <div className="mb-6">
          <SectorHeatmap
            sectors={sectors}
            onChange={setSectors}
          />
        </div>

        {/* 관심 종목 리스트 */}
        <div>
          <WatchList
            stocks={stocks}
            onAdd={handleAddStock}
            onUpdate={handleUpdateStock}
            onDelete={handleDeleteStock}
          />
        </div>
      </main>
    </div>
  );
}
