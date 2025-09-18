# 경제지표 임계점 기반 배지 시스템 및 그래프 기준선 구현 계획 (GPT 검토 반영)

## 개요
GPT 검토를 통해 개선된 경제학적 기준치와 추세 분석을 반영한 배지 시스템을 구현합니다.
기존 Raw Data 카드의 ⚠️ 50 형태를 확장하여 **연속 추세**와 **다단계 배지**를 포함합니다.

## 10개 지표별 임계점 및 배지 규칙

### PMI 계열 (3개 지표) - 기준선: 50
#### 1. ISM Manufacturing PMI
- ✅ **Good**: 50 이상 (확장)
- ➖ **Neutral**: 45-50 (수축)
- ⚠️ **Warning**: 42.3-45 (침체 위험)
- 🔴 **Bad**: 42.3 미만 (GDP 연계 침체)
- **그래프 기준선**: 50선, 42.3선 (참고)
- **GPT 개선 배지 예시**:
  - 현재값 48.7 → ➖ 48.7 (3개월 연속 하락)
  - 현재값 52.1 → ✅ 52.1 (2개월 연속 상승)
  - 현재값 43.8 → ⚠️ 43.8 (침체 위험)
  - 현재값 41.5 → 🔴 41.5 (GDP 침체 신호)

#### 2. ISM Non-Manufacturing PMI
- 🟢 **Good**: 50 이상 (확장)
- 🟡 **Warning**: 45-50 (수축)
- 🔴 **Bad**: 45 미만 (심각한 수축)
- **그래프 기준선**: 50 (빨간 점선)

#### 3. S&P Global Composite PMI
- 🟢 **Good**: 50 이상 (확장)
- 🟡 **Warning**: 45-50 (수축)
- 🔴 **Bad**: 45 미만 (심각한 수축)
- **그래프 기준선**: 50 (빨간 점선)

### Consumer 계열 (2개 지표)
#### 4. CB Consumer Confidence
- 🟢 **Good**: 80 이상 (안정)
- 🟡 **Warning**: 70-80 (주의)
- 🔴 **Bad**: 70 미만 (침체 위험)
- **그래프 기준선**: 80 (빨간 점선)
- **배지 예시**: 현재값 97.4 → ✅ 97.4 (초록색)

#### 5. Michigan Consumer Sentiment
- 🟢 **Good**: 100 이상 (낙관)
- 🟡 **Warning**: 70-100 (중립)
- 🔴 **Bad**: 70 미만 (비관/침체)
- **그래프 기준선**: 70 (빨간 점선)
- **배지 예시**: 현재값 55.4 → 🔴 55.4 (빨간색)

### Production 계열 (2개 지표) - 기준선: 0%
#### 6. Industrial Production
- 🟢 **Good**: 양수 (성장)
- 🟡 **Warning**: -0.5% ~ +0.5% (정체)
- 🔴 **Bad**: -0.5% 미만 (수축)
- **그래프 기준선**: 0% (빨간 점선)

#### 7. Industrial Production YoY
- 🟢 **Good**: 양수 (성장)
- 🟡 **Warning**: -0.5% ~ +0.5% (정체)
- 🔴 **Bad**: -0.5% 미만 (수축)
- **그래프 기준선**: 0% (빨간 점선)

### Sales 계열 (2개 지표) - 기준선: 0%
#### 8. Retail Sales MoM
- 🟢 **Good**: 양수 (성장)
- 🟡 **Warning**: -0.3% ~ +0.3% (정체)
- 🔴 **Bad**: -0.3% 미만 (수축)
- **그래프 기준선**: 0% (빨간 점선)

#### 9. Retail Sales YoY
- 🟢 **Good**: 양수 (성장)
- 🟡 **Warning**: -0.3% ~ +0.3% (정체)
- 🔴 **Bad**: -0.3% 미만 (수축)
- **그래프 기준선**: 0% (빨간 점선)

### GDP (1개 지표) - 기준선: 0%
#### 10. GDP QoQ
- 🟢 **Good**: 2% 이상 (안정 성장)
- 🟡 **Warning**: 0-2% (둔화)
- 🔴 **Bad**: 음수 (수축)
- **그래프 기준선**: 0% (빨간 점선)

## 기술 구현 계획

### 1. 데이터 구조 설계
```typescript
interface ThresholdConfig {
  indicatorId: string;
  good: { min: number; max?: number };
  warning: { min: number; max: number };
  bad: { min?: number; max: number };
  baseline: number; // 그래프 기준선
  unit: 'number' | 'percentage';
}

const THRESHOLD_CONFIGS: Record<string, ThresholdConfig> = {
  'ism-manufacturing': {
    indicatorId: 'ism-manufacturing',
    good: { min: 50 },
    warning: { min: 45, max: 50 },
    bad: { max: 45 },
    baseline: 50,
    unit: 'number'
  },
  'michigan-consumer-sentiment': {
    indicatorId: 'michigan-consumer-sentiment',
    good: { min: 100 },
    warning: { min: 70, max: 100 },
    bad: { max: 70 },
    baseline: 70,
    unit: 'number'
  }
  // ... 나머지 8개 지표
};
```

### 2. GPT 개선 배지 시스템 로직
```typescript
interface TrendInfo {
  consecutiveMonths: number;
  direction: 'up' | 'down' | 'stable';
}

function getThresholdBadge(
  value: number,
  config: ThresholdConfig,
  trend?: TrendInfo
): {
  status: 'good' | 'neutral' | 'warning' | 'bad';
  icon: string;
  color: string;
  message: string;
} {
  let trendText = '';
  if (trend && trend.consecutiveMonths >= 3) {
    const direction = trend.direction === 'up' ? '상승' : '하락';
    trendText = ` (${trend.consecutiveMonths}개월 연속 ${direction})`;
  }

  // 4단계 배지 시스템
  if (config.good.min !== undefined && value >= config.good.min) {
    return {
      status: 'good',
      icon: '✅',
      color: 'text-green-600',
      message: `${value}${trendText}`
    };
  }

  if (config.neutral && value >= config.neutral.min && value <= config.neutral.max) {
    return {
      status: 'neutral',
      icon: '➖',
      color: 'text-gray-600',
      message: `${value}${trendText}`
    };
  }

  if (config.warning && value >= config.warning.min && value <= config.warning.max) {
    return {
      status: 'warning',
      icon: '⚠️',
      color: 'text-yellow-600',
      message: `${value}${trendText}`
    };
  }

  return {
    status: 'bad',
    icon: '🔴',
    color: 'text-red-600',
    message: `${value}${trendText}`
  };
}
```

### 3. Raw Data 카드 배지 표시
```typescript
// EconomicIndicatorCard.tsx 수정
const badge = getThresholdBadge(actualValue, THRESHOLD_CONFIGS[indicatorId]);

<span className={`${badge.color} font-bold`}>
  {badge.icon} {actualValue}
</span>
```

### 4. 그래프 기준선 확장
```typescript
// DataCharts.tsx 수정 - 기존 PMI 50선 외에 추가
const shouldShowBaseline = (indicatorName: string): number | null => {
  const config = THRESHOLD_CONFIGS[indicatorId];
  return config?.baseline || null;
};

{shouldShowBaseline && (
  <ReferenceLine
    y={baselineValue}
    stroke="#EF4444"
    strokeDasharray="5 5"
    strokeWidth={2}
    label={`${baselineValue} (기준선)`}
  />
)}
```

## GPT 검토 반영 구현 단계

### Phase 1: 4단계 배지 시스템 + 추세 분석
1. **ThresholdConfig 확장** (good/neutral/warning/bad + 42.3선 등)
2. **TrendInfo 인터페이스** 추가 (연속 추세 분석)
3. **getThresholdBadge 함수** 개선 (4단계 + 추세 메시지)
4. **EconomicIndicatorCard 수정** (➖ 48.7 (3개월 연속 하락) 형태)

### Phase 2: 다중 기준선 그래프
1. **DataCharts.tsx 수정** (PMI 42.3선, Consumer 70/80선, 0%선 등)
2. **기준선 색상 차별화** (주요/참고 기준선)
3. **범례 추가** (기준선 의미 설명)

### Phase 3: 히트맵 확장 준비
1. **전체 대시보드 위험도** 매트릭스
2. **연속 추세 강조** 시각화
3. **경제학적 의미** 툴팁 추가

### Phase 4: 실시간 경고 시스템
1. **침체 신호 종합 판단** (3개월 연속 하락 등)
2. **다중 지표 교차 분석** (PMI+Consumer+Growth 종합)
3. **사용자 알림** 시스템 (선택사항)

## 예상 시각적 효과

### GPT 개선 Raw Data 카드 예시
```
ISM Manufacturing PMI
➖ 48.7 (3개월 연속 하락)  (기존: 단순 48.7)
Forecast: 49.0 | Previous: 48.0

Michigan Consumer Sentiment
🔴 55.4 (5개월 연속 하락)  (침체 위험)
Forecast: - | Previous: 58.2

CB Consumer Confidence
✅ 97.4 (2개월 연속 상승)  (안정)
Forecast: 96.4 | Previous: 98.7
```

### 그래프 예시
- PMI 차트: 50선 기준선 (기존 유지)
- Consumer Confidence: 80선 기준선 (신규)
- Michigan Sentiment: 70선 기준선 (신규)
- % 지표들: 0%선 기준선 (신규)

## 파일 수정 목록

1. **새 파일**: `/docs/THRESHOLD_BADGE_SYSTEM.md` (이 문서)
2. **수정**: `/frontend/src/utils/thresholds.ts` (신규 생성)
3. **수정**: `/frontend/src/components/EconomicIndicatorCard.tsx`
4. **수정**: `/frontend/src/components/DataCharts.tsx`
5. **업데이트**: `/docs/ECONOMIC_INDICATOR_GUIDE.md` (이 기능 추가)

---

## GPT 검토 요약
- ✅ **4단계 배지 시스템**: Good/Neutral/Warning/Bad
- ✅ **연속 추세 분석**: 3개월 이상 연속 변화 표시
- ✅ **다중 기준선**: PMI 42.3선, Consumer 70/80선 추가
- ✅ **경제학적 정확성**: ISM 42.3, CB 80, Michigan 70 임계점 확인
- ✅ **직관적 UI**: ➖ 48.7 (3개월 연속 하락) 형태로 즉시 위험도 파악

**작성일**: 2025-09-18
**GPT 검토**: 2025-09-18 (경제학적 기준치 및 UI/UX 개선)
**상태**: GPT 검토 완료, 구현 준비
**예상 구현 시간**: 3-4시간 (추세 분석 추가로 증가)
**우선순위**: 높음 (경제학적 정확성 + 사용자 경험 대폭 개선)