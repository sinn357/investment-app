# Regime Patterns System

> 경제 사이클 국면 판별 시스템 v2.0
> 작성일: 2025-01-19
> Claude + Codex 협업 토론 결과 구현

---

## 1. 아키텍처 결정

### 토론 배경
기존 MMC(Master Market Cycle) 시스템의 한계:
- Sentiment(초단기), Credit(중기), Macro(장기)를 단일 점수로 합산하면 시간축 불일치
- 축 간 충돌 시 평균값이 중립이 되어 신호 손실

### 최종 합의
| 항목 | 결정 |
|------|------|
| 기본 구조 | **Option A** - 3축 독립 표시 |
| 극단 구간 | **Option B** - Gating/동적 가중치 제한적 적용 |
| MMC | 유지, 단 **"요약 온도계"로 강등** |
| 추가 표시 | Regime Tag + Conflict Flag + Clarity |
| 패턴 DB | 원형 10개 하드코딩 + Fallback |

---

## 2. 10개 원형 패턴

우선순위 순서 (위험 패턴 먼저 매칭):

| Priority | ID | 패턴명 | 조건 | Gating |
|----------|-----|--------|------|--------|
| 10 | `stagflation_stress` | Stagflation Stress | M≤35, C≤45, S≤45 | ✅ |
| 20 | `liquidity_crack` | Liquidity Crack | C≤30, S≤45, M≥50 | ✅ |
| 30 | `crisis_bottom_candidate` | Crisis Bottom Candidate | S≥75, C≤35, M≤50 | ✅ |
| 40 | `false_dawn_bear_rally` | False Dawn | S≥65, C≤45, M≥45 | |
| 50 | `macro_slowdown_markets_ok` | Macro Slowdown | M≤40, C≥55, S≥50 | |
| 60 | `policy_pivot_window` | Policy Pivot Window | M≤45, C≥50, S≥55 | |
| 70 | `recovery_kickstart` | Recovery Kickstart | S≥60, C≥45, M≤50 | |
| 80 | `goldilocks_risk_on` | Goldilocks Risk-On | S≥60, C≥60, M≥55 | |
| 90 | `melt_up_risk_on` | Melt-Up Risk-On | S≥70, C≥55, M≥50 | |
| 100 | `late_cycle_euphoria` | Late-Cycle Euphoria | S≤35, C≥55, M≥60 | |

- **S**: Sentiment (0-100, 50=중립)
- **C**: Credit (0-100, 50=중립)
- **M**: Macro (0-100, 50=중립)
- 높을수록 Risk-On / 건강한 상태

---

## 3. Conflict Detection (3단계)

```typescript
type ConflictLevel = "none" | "mild" | "hard";
```

**판단 기준**:
1. 각 축이 50에서 15 이상 떨어져 있으면 "강한 신호"
2. 2개 이상 강한 신호가 방향이 반대면 충돌
3. 상위 2개 강도 평균이 25 이상이면 "hard", 미만이면 "mild"

**UI 표시**:
- `hard`: 빨간색 "강한 충돌 !!"
- `mild`: 노란색 "약한 충돌 !"
- `none`: 초록색 "충돌 없음"

---

## 4. Clarity Score (0-100)

**계산 공식**:
```
clarity = 100 × (0.7 × alignment + 0.3 × strength) - penalty
```

- **alignment**: 방향 일치 비율 (3축 모두 같은 방향 = 1.0, 2:1 = 0.67)
- **strength**: 평균 강도 / 25 (최대 1.0)
- **penalty**: hard conflict = 20, mild = 10

**라벨**:
- 80+: "명확" (초록)
- 60-79: "보통" (노랑)
- <60: "혼재/주의" (빨강)

---

## 5. Gating Triggers (Option B)

극단 구간에서만 활성화되는 경고:

1. **Stagflation Stress**: M≤35 && C≤45
2. **Liquidity Crack**: C≤30
3. **Crisis Bottom Candidate**: S≥75 && C≤35

활성화 시 UI에 빨간색 경고 박스 표시.

---

## 6. Fallback Pattern

10개 패턴에 모두 매칭되지 않을 때:

```typescript
{
  id: "mixed_unclassified",
  name: "Mixed / Unclassified",
  tag: "혼재/미분류: 명확한 국면 패턴 없음",
  implication: "신호가 명확하지 않음. 기존 포지션 유지 또는 중립 비중으로 관망..."
}
```

---

## 7. 파일 구조

```
frontend/src/
├── utils/
│   └── regimePatterns.ts    # 패턴 정의 + 헬퍼 함수
└── components/
    └── MasterCycleCard.tsx  # UI 통합 (수정됨)
```

---

## 8. 사용 예시

```typescript
import { analyzeRegime, getClarityLabel, getConflictDisplay } from '@/utils/regimePatterns';

// S=70, C=40, M=55 예시
const result = analyzeRegime(70, 40, 55);

console.log(result.pattern?.name);     // "False Dawn (Bear-Market Rally)"
console.log(result.conflictLevel);      // "mild"
console.log(result.clarity);            // 62
console.log(result.gatingTriggers);     // []
```

---

## 9. 향후 확장

- [ ] 사용자 정의 패턴 레이어 (Tier 2)
- [ ] 역사적 패턴 매칭 (2008년, 2020년 등)
- [ ] ΔC, ΔM 변화율 기반 조건 추가
- [ ] 알림 시스템 연동

---

## 10. 참고

- Claude + Codex 토론: 2025-01-19
- 레이 달리오, 하워드 막스, JP모건 접근법 참고
- 시장 주도 모델: Sentiment 가중치 50% 유지 정당
