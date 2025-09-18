# 경제지표 임계점 기반 배지 시스템 및 그래프 기준선 구현 계획

## 개요
기존 Raw Data 카드의 ⚠️ 50 형태 배지 시스템을 활용하여 경제지표별 임계점 기반 시각적 신호 시스템을 구현합니다.

## 10개 지표별 임계점 및 배지 규칙

### PMI 계열 (3개 지표) - 기준선: 50
#### 1. ISM Manufacturing PMI
- 🟢 **Good**: 50 이상 (확장)
- 🟡 **Warning**: 45-50 (수축)
- 🔴 **Bad**: 45 미만 (심각한 수축)
- **그래프 기준선**: 50 (빨간 점선)
- **배지 예시**:
  - 현재값 48.7 → ⚠️ 48.7 (노란색)
  - 현재값 52.1 → ✅ 52.1 (초록색)
  - 현재값 44.2 → 🔴 44.2 (빨간색)

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

### 2. 배지 시스템 로직
```typescript
function getThresholdBadge(value: number, config: ThresholdConfig): {
  status: 'good' | 'warning' | 'bad';
  icon: string;
  color: string;
} {
  if (config.good.min !== undefined && value >= config.good.min) {
    if (config.good.max === undefined || value <= config.good.max) {
      return { status: 'good', icon: '✅', color: 'text-green-600' };
    }
  }

  if (value >= config.warning.min && value <= config.warning.max) {
    return { status: 'warning', icon: '⚠️', color: 'text-yellow-600' };
  }

  return { status: 'bad', icon: '🔴', color: 'text-red-600' };
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

## 구현 단계

### Phase 1: 기본 배지 시스템
1. **THRESHOLD_CONFIGS 정의** (10개 지표 모두)
2. **getThresholdBadge 함수** 구현
3. **EconomicIndicatorCard 수정** (배지 표시)
4. **테스트 및 검증**

### Phase 2: 그래프 기준선 확장
1. **DataCharts.tsx 수정** (모든 지표 기준선)
2. **기준선 라벨링** 개선
3. **색상 및 스타일** 통일

### Phase 3: 고도화
1. **툴팁에 임계점 설명** 추가
2. **대시보드 전체 위험도** 표시
3. **알림 시스템** 연동 (옵션)

## 예상 시각적 효과

### Raw Data 카드 예시
```
ISM Manufacturing PMI
⚠️ 48.7  (기존: 단순 48.7)
Forecast: 49.0 | Previous: 48.0
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

**작성일**: 2025-09-18
**상태**: 계획 단계
**예상 구현 시간**: 2-3시간
**우선순위**: 높음 (사용자 경험 크게 개선)