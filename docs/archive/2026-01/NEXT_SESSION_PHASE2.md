# 다음 세션: Phase 2 구현 가이드

> 이 문서를 읽고 바로 구현 시작하면 됩니다.
> 작성일: 2025-01-20

---

## 다음 세션 시작 시 할 말

```
"Phase 2 구현 시작. docs/NEXT_SESSION_PHASE2.md 읽고 진행해줘."
```

---

## 1. Phase 1 완료 상태

### 커밋 이력
- `bde43a2` - Level×Trend 국면 라벨 시스템
- `bbdabaa` - Trend 데이터 연동 (히스토리 기반 실시간 계산)

### 생성된 파일
```
frontend/src/utils/
├── indicatorScales.ts    # 17개 지표 1M/3M 스케일
├── trendCalculator.ts    # Trend 점수 계산 + 히스토리 연동
└── cycleLabels.ts        # Level×Trend 9개 국면 라벨
```

### 수정된 파일
- `MasterCycleCard.tsx` - 국면 라벨 + Trend 진행바 UI
- `indicators/page.tsx` - Trend 계산 및 전달 로직

---

## 2. Phase 2 목표

### 2-1. Regime Pattern 재정의
**현재 문제**: regimePatterns.ts가 hard threshold 기반 (S<=35, C>=55 등)
**해결**: Level×Trend 라벨 기반 soft match로 전환

```typescript
// AS-IS (hard threshold)
condition: (s, c, m) => m <= 35 && c <= 45 && s <= 45

// TO-BE (라벨 기반)
condition: (labels) =>
  labels.macro.label === "수축 악화" &&
  labels.credit.label === "경색" &&
  labels.sentiment.levelBand === "high"
```

### 2-2. Sentiment 내부 분리
**현재 문제**: Sentiment가 RiskAppetite(VIX, P/C)와 Valuation(PER, CAPE) 혼재
**해결**: 2개 서브사이클로 분리

```typescript
// Sentiment 분리
sentiment: {
  riskAppetite: {
    score: 65,
    trend: 58,
    indicators: ['vix', 'put_call_ratio']
  },
  valuation: {
    score: 28,
    trend: 42,
    indicators: ['sp500_per', 'shiller_cape']
  }
}
```

### 2-3. Credit Δ 가중치 강화
**현재 문제**: Credit 변화 속도(Δ)가 Level과 동일 가중치
**해결**: Trend가 급변하면 가중치 상향

```typescript
// Δ 기반 동적 가중치
if (Math.abs(creditTrend - 50) > 25) {
  // 급변 시 Trend 가중치 70%
  adjustedScore = 0.30 * level + 0.70 * trend;
} else {
  // 평상시 50:50
  adjustedScore = 0.50 * level + 0.50 * trend;
}
```

---

## 3. 구현 순서

### Step 1: regimePatterns.ts 리팩토링

```typescript
// frontend/src/utils/regimePatterns.ts

import { CycleLabelResult } from './cycleLabels';

export interface LabelBasedCondition {
  macro?: {
    levelBand?: LevelBand | LevelBand[];
    trendBand?: TrendBand | TrendBand[];
    label?: string | string[];
  };
  credit?: {
    levelBand?: LevelBand | LevelBand[];
    trendBand?: TrendBand | TrendBand[];
    label?: string | string[];
  };
  sentiment?: {
    levelBand?: LevelBand | LevelBand[];
    trendBand?: TrendBand | TrendBand[];
    label?: string | string[];
  };
}

// 새로운 패턴 정의
export const labelBasedPatterns: RegimePattern[] = [
  {
    id: "stagflation_stress",
    name: "Stagflation Stress",
    labelCondition: {
      macro: { levelBand: "low", trendBand: "down" },
      credit: { levelBand: ["low", "mid"], trendBand: "down" },
      sentiment: { levelBand: "high" } // 공포 상태
    },
    tag: "복합 스트레스: 거시/신용/심리 동반 약화",
    implication: "리스크 최소화...",
    priority: 10,
  },
  // ... 나머지 패턴
];
```

### Step 2: Sentiment 서브사이클 분리

```typescript
// frontend/src/utils/sentimentSubCycles.ts

export interface SentimentSubCycles {
  riskAppetite: {
    score: number;
    trend: number;
    label: string;
  };
  valuation: {
    score: number;
    trend: number;
    label: string;
  };
  combined: {
    score: number;
    trend: number;
    label: string;
  };
}

// Risk Appetite 지표 (시장 공포/탐욕)
const RISK_APPETITE_INDICATORS = {
  vix_sentiment: { weight: 0.50 },
  put_call_ratio: { weight: 0.50 },
};

// Valuation 지표 (가치 평가)
const VALUATION_INDICATORS = {
  sp500_per: { weight: 0.40 },
  shiller_cape: { weight: 0.30 },
  michigan_sentiment: { weight: 0.15 },
  cb_consumer_confidence: { weight: 0.15 },
};
```

### Step 3: Credit Δ 동적 가중치

```typescript
// frontend/src/utils/creditDynamicWeight.ts

export function calculateCreditWithDynamicWeight(
  levelScore: number,
  trendScore: number
): { score: number; trendWeight: number } {
  const trendStrength = Math.abs(trendScore - 50);

  let trendWeight: number;
  if (trendStrength > 25) {
    // 급변: Trend 70%
    trendWeight = 0.70;
  } else if (trendStrength > 15) {
    // 중간: Trend 60%
    trendWeight = 0.60;
  } else {
    // 평상시: 50:50
    trendWeight = 0.50;
  }

  const levelWeight = 1 - trendWeight;
  const adjustedScore = levelWeight * levelScore + trendWeight * trendScore;

  return { score: adjustedScore, trendWeight };
}
```

### Step 4: MasterCycleCard UI 업데이트

- Sentiment 카드를 2개로 분리 (RiskAppetite / Valuation)
- Credit 카드에 Δ 가중치 표시
- Regime Pattern 라벨 기반 매칭 표시

---

## 4. 예상 작업량

| Step | 내용 | 예상 시간 |
|------|------|----------|
| 1 | regimePatterns.ts 리팩토링 | 30분 |
| 2 | Sentiment 서브사이클 분리 | 45분 |
| 3 | Credit Δ 동적 가중치 | 20분 |
| 4 | UI 업데이트 | 30분 |
| 5 | 테스트 및 빌드 | 15분 |
| **Total** | | **~2시간** |

---

## 5. 주의사항

### 호환성
- Phase 1 구조 유지 (기존 cycleLabels.ts, trendCalculator.ts 활용)
- MasterCycleCard 인터페이스 확장 (기존 필드 유지)

### 테스트 시나리오
1. Sentiment 분리 후에도 기존 combined 점수와 유사한지 확인
2. Credit Δ 가중치 적용 시 급변 상황에서 점수 변화 검증
3. Regime Pattern 라벨 매칭이 기존 threshold 매칭과 유사한지 비교

### 롤백 계획
- 문제 발생 시 Phase 1 커밋(bbdabaa)으로 복구 가능

---

## 6. 참고 파일

- `frontend/src/utils/regimePatterns.ts` - 현재 Regime Pattern
- `frontend/src/utils/cycleLabels.ts` - Phase 1 국면 라벨
- `frontend/src/utils/trendCalculator.ts` - Phase 1 Trend 계산
- `frontend/src/components/MasterCycleCard.tsx` - UI 컴포넌트
- `docs/CYCLE_SYSTEM_REDESIGN.md` - 전체 설계 문서

---

**Last Updated**: 2025-01-20
