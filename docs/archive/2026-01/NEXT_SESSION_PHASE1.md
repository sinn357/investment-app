# 다음 세션: Phase 1 구현 가이드

> 이 문서를 읽고 바로 구현 시작하면 됩니다.
> 작성일: 2025-01-19

---

## 다음 세션 시작 시 할 말

```
"Phase 1 구현 시작. docs/NEXT_SESSION_PHASE1.md 읽고 진행해줘."
```

---

## 1. 목표

S/C/M 각 사이클을 **Level + Trend** 기반으로 정교화하고, **국면 라벨**을 표시한다.

**현재 문제**: Level만 사용 → 전환점 못 잡음
**해결**: Trend(변화율) 추가 → 전환점 포착

---

## 2. 구현 순서

### Step 1: indicatorScales.ts 생성

```typescript
// frontend/src/utils/indicatorScales.ts

export type IndicatorScale = {
  scale1: number;
  scale3: number;
  inverse: boolean;
  unit?: "pct_point" | "bp" | "index" | "ratio";
};

export const indicatorScales: Record<string, IndicatorScale> = {
  // ======================
  // Macro
  // ======================
  ism_manufacturing_pmi: {
    scale1: 1.75,
    scale3: 4.25,
    inverse: false,
    unit: "index",
  },
  ism_services_pmi: {
    scale1: 1.75,
    scale3: 4.25,
    inverse: false,
    unit: "index",
  },
  unemployment_rate: {
    scale1: 0.25, // capped
    scale3: 1.06,
    inverse: true,
    unit: "pct_point",
  },
  core_cpi_yoy: {
    scale1: 0.26,
    scale3: 0.64,
    inverse: true,
    unit: "pct_point",
  },
  fed_funds_rate: {
    scale1: 0.25, // capped
    scale3: 1.28,
    inverse: true,
    unit: "pct_point",
  },
  yield_curve_spread: {
    scale1: 0.18,
    scale3: 0.43,
    inverse: false,
    unit: "pct_point",
  },

  // ======================
  // Credit
  // ======================
  hy_spread: {
    scale1: 61.25,
    scale3: 148.75,
    inverse: true,
    unit: "bp",
  },
  ig_spread: {
    scale1: 17.5,
    scale3: 42.5,
    inverse: true,
    unit: "bp",
  },
  fci: {
    scale1: 0.18,
    scale3: 0.43,
    inverse: true,
    unit: "index",
  },
  m2_yoy: {
    scale1: 1.05,
    scale3: 2.55,
    inverse: false,
    unit: "pct_point",
  },
  vix_credit: {
    scale1: 2.28,
    scale3: 7.0, // floor applied
    inverse: true,
    unit: "index",
  },

  // ======================
  // Sentiment
  // ======================
  vix_sentiment: {
    scale1: 3.15,
    scale3: 7.65,
    inverse: true,
    unit: "index",
  },
  sp500_per: {
    scale1: 2.98,
    scale3: 7.23,
    inverse: true,
    unit: "ratio",
  },
  shiller_cape: {
    scale1: 4.38,
    scale3: 10.63,
    inverse: true,
    unit: "ratio",
  },
  put_call_ratio: {
    scale1: 0.11,
    scale3: 0.26,
    inverse: false,
    unit: "ratio",
  },
  michigan_sentiment: {
    scale1: 7.88,
    scale3: 19.13,
    inverse: false,
    unit: "index",
  },
  cb_consumer_confidence: {
    scale1: 6.13,
    scale3: 14.88,
    inverse: false,
    unit: "index",
  },
};
```

### Step 2: trendScore 함수 구현

```typescript
// frontend/src/utils/trendCalculator.ts

import { indicatorScales } from './indicatorScales';

/**
 * 변화량을 0-100 점수로 변환
 * - 50 = 변화 없음 (중립)
 * - 100 = 강한 개선
 * - 0 = 강한 악화
 */
export function trendScore(
  delta: number,
  scale: number,
  inverse: boolean
): number {
  const imp = inverse ? -delta : delta;
  return Math.max(0, Math.min(100, 50 + 50 * (imp / scale)));
}

/**
 * 1M과 3M 변화율을 합쳐서 최종 Trend 점수 계산
 */
export function calculateTrend(
  delta1M: number,
  delta3M: number,
  scale1: number,
  scale3: number,
  inverse: boolean
): number {
  const trend1M = trendScore(delta1M, scale1, inverse);
  const trend3M = trendScore(delta3M, scale3, inverse);
  return 0.35 * trend1M + 0.65 * trend3M;
}
```

### Step 3: Level×Trend 국면 라벨 매핑

```typescript
// frontend/src/utils/cycleLabels.ts

type LevelBand = "low" | "mid" | "high";
type TrendBand = "down" | "flat" | "up";

function getLevelBand(score: number): LevelBand {
  if (score < 40) return "low";
  if (score < 60) return "mid";
  return "high";
}

function getTrendBand(score: number): TrendBand {
  if (score < 40) return "down";
  if (score < 60) return "flat";
  return "up";
}

// ======================
// Macro 국면 라벨 (6개)
// ======================
const macroLabels: Record<LevelBand, Record<TrendBand, string>> = {
  high: {
    up: "확장 가속",
    flat: "확장 유지",
    down: "고점/감속",
  },
  mid: {
    up: "회복",
    flat: "중립",
    down: "감속",
  },
  low: {
    up: "바닥/개선",
    flat: "수축 유지",
    down: "수축 악화",
  },
};

// ======================
// Credit 국면 라벨 (5개)
// ======================
const creditLabels: Record<LevelBand, Record<TrendBand, string>> = {
  high: {
    up: "완화",
    flat: "완화 유지",
    down: "긴축 시작",
  },
  mid: {
    up: "치유",
    flat: "중립",
    down: "스트레스",
  },
  low: {
    up: "위기 개선",
    flat: "경색",
    down: "경색 악화",
  },
};

// ======================
// Sentiment 국면 라벨 (6개)
// ======================
const sentimentLabels: Record<LevelBand, Record<TrendBand, string>> = {
  high: {
    up: "패닉/기회",
    flat: "공포",
    down: "안도 반등 위험",
  },
  mid: {
    up: "리스크온 개선",
    flat: "중립",
    down: "리스크오프 누적",
  },
  low: {
    up: "도취 위험",
    flat: "낙관",
    down: "버블 위험",
  },
};

// ======================
// 통합 함수
// ======================
export function getCycleLabel(
  cycle: "macro" | "credit" | "sentiment",
  levelScore: number,
  trendScore: number
): string {
  const levelBand = getLevelBand(levelScore);
  const trendBand = getTrendBand(trendScore);

  switch (cycle) {
    case "macro":
      return macroLabels[levelBand][trendBand];
    case "credit":
      return creditLabels[levelBand][trendBand];
    case "sentiment":
      return sentimentLabels[levelBand][trendBand];
  }
}
```

### Step 4: UI 표시 (MasterCycleCard 수정)

각 사이클 카드에 **숫자 + 국면 라벨** 표시:

```
거시경제: 54점 - 감속
신용/유동성: 94점 - 완화
심리/밸류: 29점 - 패닉/기회
```

---

## 3. 주의사항

### 역방향 지표 (inverse: true)
- 실업률, CPI, 금리, 스프레드, VIX, FCI
- `imp = -Δ` (감소가 개선)

### 정방향 지표 (inverse: false)
- PMI, M2, Michigan, CB Confidence, Put/Call, 장단기 스프레드
- `imp = +Δ` (증가가 개선)

### VIX 이중 사용
- Credit용: `vix_credit` (12/18/25 기준)
- Sentiment용: `vix_sentiment` (12/18/30 기준)

### 단위
- `pct_point`: 실업률 4.1→4.3이면 Δ=+0.2
- `bp`: 스프레드 400→450이면 Δ=+50
- `index`: PMI 50→52이면 Δ=+2

---

## 4. 데이터 확인 필요

Phase 1 구현 전에 확인할 것:
1. 각 지표의 히스토리 데이터가 3개월 이상 저장되어 있는지
2. Δ1M, Δ3M 계산 가능한지

---

## 5. 화면 구조 (최종)

```
┌─────────────────────────────────────────┐
│ MMC 종합점수: 53.6 (요약 온도계)         │
├─────────────────────────────────────────┤
│ Regime Tag: [패턴명] - 행동 힌트         │
│ Conflict: 없음/약함/강함 | Clarity: 55점 │
├─────────────────────────────────────────┤
│ 거시경제    │ 54점  │ 감속        │     │
│ 신용/유동성 │ 94점  │ 완화        │     │
│ 심리/밸류   │ 29점  │ 패닉/기회   │     │
└─────────────────────────────────────────┘
```

---

## 6. Phase 2 예고 (나중에)

Phase 1 완료 후:
- Regime Pattern 재정의 (hard threshold → soft match/라벨 기반)
- Sentiment 내부 분리 (RiskAppetite vs Valuation)
- Credit Δ(변화 속도) 가중치 강화

---

**Last Updated**: 2025-01-19
