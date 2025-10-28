'use client';

import { useState, useEffect } from 'react';

interface Trade {
  date: string;
  volume: number;
  price: number;
  total: number;
  fee: number;
  side: string;
  count?: number;
}

interface Round {
  buys: Trade[];
  sell: Trade;
  buy_total: number;
  sell_total: number;
  profit: number;
  profit_rate: number;
}

interface CoinAnalysis {
  rounds: Round[];
  total_profit: number;
  total_rounds: number;
}

interface AnalysisData {
  [coin: string]: CoinAnalysis;
}

export default function CryptoTradesPage() {
  const [data, setData] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalysis();
  }, []);

  const fetchAnalysis = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5001/api/crypto/analysis');
      const result = await response.json();

      if (result.status === 'success') {
        setData(result.data);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류');
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString('ko-KR', { maximumFractionDigits: 0 });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
        <div className="text-white text-center text-xl">거래 내역 분석 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
        <div className="text-red-400 text-center text-xl">오류: {error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">코인 거래 분석</h1>
          <p className="text-gray-300">업비트 거래 내역을 라운드별로 분석합니다</p>
        </div>

        {/* 전체 통계 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-6">
            <div className="text-gray-300 text-sm mb-1">총 코인 종류</div>
            <div className="text-white text-3xl font-bold">
              {data ? Object.keys(data).length : 0}개
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-6">
            <div className="text-gray-300 text-sm mb-1">총 라운드</div>
            <div className="text-white text-3xl font-bold">
              {data
                ? Object.values(data).reduce((sum, coin) => sum + coin.total_rounds, 0)
                : 0}
              개
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-6">
            <div className="text-gray-300 text-sm mb-1">전체 수익</div>
            <div
              className={`text-3xl font-bold ${
                data && Object.values(data).reduce((sum, coin) => sum + coin.total_profit, 0) >= 0
                  ? 'text-green-400'
                  : 'text-red-400'
              }`}
            >
              {data
                ? formatNumber(Object.values(data).reduce((sum, coin) => sum + coin.total_profit, 0))
                : 0}
              원
            </div>
          </div>
        </div>

        {/* 코인별 라운드 */}
        {data && Object.entries(data).map(([coin, analysis]) => (
          <div key={coin} className="mb-8 bg-white/5 backdrop-blur-md rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-white">{coin}</h2>
              <div className="text-right">
                <div className="text-sm text-gray-300">총 {analysis.total_rounds}라운드</div>
                <div
                  className={`text-lg font-bold ${
                    analysis.total_profit >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}
                >
                  {formatNumber(analysis.total_profit)}원
                </div>
              </div>
            </div>

            {/* 라운드별 상세 */}
            {analysis.rounds.map((round, idx) => (
              <div
                key={idx}
                className="mb-4 bg-white/10 rounded-lg p-4 border border-white/20"
              >
                <div className="text-yellow-400 font-semibold mb-2">라운드 {idx + 1}</div>

                {/* 매수 내역 */}
                {round.buys.map((buy, buyIdx) => (
                  <div key={buyIdx} className="text-gray-200 mb-1">
                    {buy.date} {formatNumber(buy.price)}원에 {formatNumber(buy.total)}원 매수
                    {buy.count && buy.count > 1 && (
                      <span className="text-yellow-300 text-sm ml-2">({buy.count}건 합산)</span>
                    )}
                  </div>
                ))}

                {/* 매도 내역 */}
                <div className="text-gray-200 mb-2">
                  {round.sell.date} {formatNumber(round.sell.price)}원에{' '}
                  {formatNumber(round.sell.total)}원 매도
                  {round.sell.count && round.sell.count > 1 && (
                    <span className="text-yellow-300 text-sm ml-2">
                      ({round.sell.count}건 합산)
                    </span>
                  )}
                </div>

                {/* 수익 */}
                <div
                  className={`font-bold ${
                    round.profit >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}
                >
                  {formatNumber(round.profit)}원 {round.profit >= 0 ? '수익' : '손실'} (
                  {round.profit_rate.toFixed(2)}%)
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
