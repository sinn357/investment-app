"use client";

import React from 'react';

interface MasterCycleData {
  mmc_score: number;
  phase: string;
  macro: {
    score: number;
    phase: string;
    state?: string;
  };
  credit: {
    score: number;
    state: string;
    phase?: string;
  };
  sentiment: {
    score: number;
    state?: string;
    note?: string;
  };
  recommendation: string;
  updated_at: string;
  version?: string;
}

interface MasterCycleCardProps {
  data: MasterCycleData;
}

/**
 * Master Market Cycle Card
 * 3대 사이클(Macro, Credit, Sentiment)을 통합한 종합 투자 타이밍 점수 표시
 *
 * Phase 2 완료: Sentiment 실시간 점수 활성화 (VIX, S&P PE, CAPE, P/C Ratio, Michigan, CB)
 */
export default function MasterCycleCard({ data }: MasterCycleCardProps) {
  // MMC 점수에 따른 색상 결정
  const getMMCColor = (score: number): string => {
    if (score >= 80) return "text-emerald-600 dark:text-emerald-400";
    if (score >= 60) return "text-green-600 dark:text-green-400";
    if (score >= 40) return "text-yellow-600 dark:text-yellow-400";
    if (score >= 20) return "text-orange-600 dark:text-orange-400";
    return "text-red-600 dark:text-red-400";
  };

  const getBgColor = (score: number): string => {
    if (score >= 80) return "bg-emerald-50 dark:bg-emerald-950/20";
    if (score >= 60) return "bg-green-50 dark:bg-green-950/20";
    if (score >= 40) return "bg-yellow-50 dark:bg-yellow-950/20";
    if (score >= 20) return "bg-orange-50 dark:bg-orange-950/20";
    return "bg-red-50 dark:bg-red-950/20";
  };

  const getBorderColor = (score: number): string => {
    if (score >= 80) return "border-emerald-200 dark:border-emerald-800";
    if (score >= 60) return "border-green-200 dark:border-green-800";
    if (score >= 40) return "border-yellow-200 dark:border-yellow-800";
    if (score >= 20) return "border-orange-200 dark:border-orange-800";
    return "border-red-200 dark:border-red-800";
  };
  const getBadgeColor = (score: number): string => {
    if (score >= 80) return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200";
    if (score >= 60) return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200";
    if (score >= 40) return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200";
    if (score >= 20) return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200";
    return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200";
  };
  const macroActionMap: Record<string, string> = {
    "강한 확장기": "주식 비중 확대, 성장주/하이베타 우선",
    "확장기": "주식 코어 포지션 유지, ETF·퀄리티 비중",
    "둔화 시작": "현금·채권 소폭 확대, 디펜시브 섹터로 이동",
    "침체기": "방어주·우량채·현금 중심, 리스크 축소",
    "심각한 침체": "현금+단기채 우선, 공격적 포지션 회피",
    "데이터 부족": "데이터 재확인 후 판단",
  };

  const creditActionMap: Record<string, string> = {
    "유동성 풍부": "레버리지 축소, 고위험 익스포저 점검·헤지",
    "중립": "기본 포지션 유지, 과도한 레버리지 자제",
    "긴축 환경": "현금·채권 확대, 하이일드·고위험 노출 축소",
    "신용 경색": "현금/우량채 중심, 주식·하이일드 비중 축소",
    "데이터 부족": "데이터 재확인 후 판단",
  };

  const sentimentActionMap: Record<string, string> = {
    "극심한 공포 (바닥 근접)": "분할 매수/리스크 온 준비, 과도한 공포 활용",
    "약세 심리": "우량주·ETF 저점 분할 매수, 변동성 주의",
    "과열 경계": "익절·리밸런싱, 부분 헤지 고려",
    "극심한 탐욕 (고점 경계)": "현금 비중 확대, 보호적 헤지 강화",
    "데이터 부족": "데이터 재확인 후 판단",
  };

  const macroPhase = data.macro.phase;
  const creditPhase = data.credit.state || data.credit.phase || "중립";
  const sentimentPhase = data.sentiment.state || data.sentiment.note || "데이터 부족";

  const macroAction = macroActionMap[macroPhase] || "데이터 확인 필요";
  const creditAction = creditActionMap[creditPhase] || "데이터 확인 필요";
  const sentimentAction = sentimentActionMap[sentimentPhase] || "데이터 확인 필요";

  const [expanded, setExpanded] = React.useState(false);

  return (
    <div className={`rounded-xl border-2 ${getBorderColor(data.mmc_score)} ${getBgColor(data.mmc_score)} p-6 shadow-lg`}>
      {/* 헤더 */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            🎯 Master Market Cycle
          </h2>
          {data.version && (
            <span className="text-xs text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 px-2 py-1 rounded">
              {data.version}
            </span>
          )}
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          3대 사이클 통합 투자 타이밍 점수
        </p>
      </div>

      {/* MMC 종합 점수 */}
      <div className="flex items-center justify-between mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg">
        <div>
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            종합 점수
          </div>
          <div className={`text-5xl font-bold ${getMMCColor(data.mmc_score)}`}>
            {data.mmc_score}
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            시장 국면
          </div>
          <div className={`text-xl font-semibold ${getMMCColor(data.mmc_score)}`}>
            {data.phase}
          </div>
        </div>
      </div>

      {/* 3대 사이클 요약 (단일 카드 내 포함) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xl">🌍</span>
              <div>
                <div className="text-sm font-semibold text-gray-800 dark:text-gray-100">거시경제</div>
                <div className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${getBadgeColor(data.macro.score)}`}>
                  {Math.round(data.macro.score)}점
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500 dark:text-gray-400">현재 국면</div>
              <div className="text-sm font-bold text-gray-800 dark:text-gray-100">{macroPhase}</div>
            </div>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">투자 행동</div>
          <div className="text-sm text-gray-800 dark:text-gray-100">{macroAction}</div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xl">💧</span>
              <div>
                <div className="text-sm font-semibold text-gray-800 dark:text-gray-100">신용/유동성</div>
                <div className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${getBadgeColor(data.credit.score)}`}>
                  {Math.round(data.credit.score)}점
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500 dark:text-gray-400">현재 국면</div>
              <div className="text-sm font-bold text-gray-800 dark:text-gray-100">{creditPhase}</div>
            </div>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">투자 행동</div>
          <div className="text-sm text-gray-800 dark:text-gray-100">{creditAction}</div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xl">🧠</span>
              <div>
                <div className="text-sm font-semibold text-gray-800 dark:text-gray-100">심리/밸류</div>
                <div className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${getBadgeColor(data.sentiment.score)}`}>
                  {Math.round(data.sentiment.score)}점
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500 dark:text-gray-400">현재 국면</div>
              <div className="text-sm font-bold text-gray-800 dark:text-gray-100">{sentimentPhase}</div>
            </div>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">투자 행동</div>
          <div className="text-sm text-gray-800 dark:text-gray-100">{sentimentAction}</div>
        </div>
      </div>

      {/* 투자 추천 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border-l-4 border-blue-500">
        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
          💡 투자 추천
        </div>
        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {data.recommendation}
        </div>
      </div>

      {/* 구조/수식 설명 (펼치기) */}
      <div className="mt-4">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-3 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm font-semibold text-gray-800 dark:text-gray-100"
        >
          <span>📖 점수 구조 & 지표 설명 보기</span>
          <span className="text-xs text-gray-500 dark:text-gray-400">{expanded ? "닫기" : "펼치기"}</span>
        </button>
        {expanded && (
          <div className="mt-3 space-y-3 text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div>
              <div className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Master Market Cycle 공식</div>
              <p>MMC = 0.50 × Sentiment + 0.30 × Credit + 0.20 × Macro</p>
            </div>
            <div>
              <div className="font-semibold text-gray-900 dark:text-gray-100 mb-1">거시경제 (6개 지표)</div>
              <p>ISM 제조업(30%), ISM 서비스업(20%), 실업률(20%, 역방향), 근원 CPI(10%, 역방향), 연준 기준금리(15%, 역방향), 장단기금리차(5%).</p>
            </div>
            <div>
              <div className="font-semibold text-gray-900 dark:text-gray-100 mb-1">신용/유동성 (5개 지표)</div>
              <p>HY 스프레드(30%, 역방향), IG 스프레드(20%, 역방향), 금융여건지수 FCI(25%, 역방향), M2 YoY(15%), VIX(10%, 역방향).</p>
            </div>
            <div>
              <div className="font-semibold text-gray-900 dark:text-gray-100 mb-1">심리/밸류에이션 (6개 지표)</div>
              <p>VIX(20%, 역방향), S&P500 PER(20%, 역방향), Shiller CAPE(15%, 역방향), Put/Call Ratio(15%), Michigan 소비자심리(15%), CB 소비자신뢰(15%).</p>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              점수는 0-100 스케일의 임계값 기반 점수화이며, 각 사이클 점수는 가중 평균으로 산출됩니다.
            </div>
          </div>
        )}
      </div>

      {/* 데이터 부족 안내 제거 (Phase 2 완료: Sentiment 실시간 점수 활성화) */}

      {/* 업데이트 시각 */}
      <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 text-right">
        업데이트: {new Date(data.updated_at).toLocaleString('ko-KR')}
      </div>
    </div>
  );
}
