# 3대 사이클 정교화 계획

> 작성일: 2025-01-19
> 상태: 다음 세션에서 구현 예정
> 참여: Claude + Codex 협업 토론

---

## 0. 문제 인식

### 현재 상태
- Regime Pattern 레이어는 구현됨 (종합 해석용)
- 하지만 **S/C/M 각각의 계산 로직이 단순함** (Level만 사용)
- 결과: 점수가 나와도 "왜 이 점수인지", "지금이 어떤 국면인지" 설명 부족

### 예시 (2025-01-19 기준)
- Macro: 54점 → 둔화? 회복? 불명확
- Credit: 94점 → 완화? 과열? 불명확
- Sentiment: 29점 → 공포? 패닉? 불명확

---

## 1. Codex 제안 요약

### 핵심 원칙: "Level + Trend + Stress" 3요소

```
최종 점수 = 0.6×Level + 0.3×Trend + 0.1×Stress
```

| 요소 | 설명 | 현재 | 개선 |
|------|------|------|------|
| Level | 현재 수준 | ✅ 있음 | 유지 |
| Trend | 변화 방향 (MoM/3M) | ❌ 없음 | **추가 필요** |
| Stress | 불안정성/급변 | ❌ 없음 | **추가 필요** |

---

## 2. Claude 의견

### 동의하는 부분

1. **Trend 추가는 필수**
   - 현재 Level만으로는 "전환점"을 못 잡음
   - PMI 50 위/아래보다 "3개월 연속 상승/하락"이 더 선행적
   - 이 한 가지로 체감 정교도가 크게 오를 것

2. **국면 라벨이 UX에 핵심**
   - 숫자만 보여주면 초보자가 해석 못 함
   - "Macro 54점 - 둔화 진행 중" 이렇게 표시해야 의미 있음

3. **Sentiment 내부 분리 (RiskAppetite vs Valuation)**
   - VIX(공포)와 PER(비싸다)은 다른 신호
   - 섞으면 노이즈, 분리하면 명확

4. **Credit Δ(변화 속도) 중요**
   - HY 400bp 자체보다 "3개월에 150bp 확 벌어짐"이 위기 신호
   - 현재 구현에 없음

### 우려되는 부분

1. **데이터 가용성**
   - Trend 계산하려면 히스토리 데이터 필요
   - 현재 크롤러가 히스토리를 얼마나 저장하고 있는지 확인 필요

2. **복잡도 증가**
   - Level → Level+Trend+Stress로 가면 계산 로직 3배
   - 점진적 구현 필요 (한 번에 다 하면 버그 위험)

3. **퍼센타일화 구현**
   - "과거 분포에서 몇 %인지" 계산하려면 장기 히스토리 필요
   - 당장은 임계값 기반으로 시작하고, 나중에 퍼센타일로 전환

---

## 3. 구현 로드맵 (Codex 제안 기반)

### Phase 1: Trend 추가 ✅ (2026-01-20 완료)
- [x] 각 지표의 3개월 변화(Δ3M) 계산 로직 추가
- [x] 점수 공식: `0.7×Level + 0.3×Trend`
- [x] calculate_master_cycle_v2() 함수 추가
- 커밋: 97fea57

### Phase 2: 국면 라벨 추가
- [ ] Macro 6단계: Expansion/Peak/Slowdown/Contraction/Trough/Recovery
- [ ] Credit 5단계: Easy/Tightening/Stress/Crisis/Healing
- [ ] Sentiment 6단계: Panic/Fear/Neutral/Optimism/Euphoria/Bubble
- [ ] UI에 라벨 표시 (점수 옆에)

### Phase 3: Sentiment 내부 분리
- [ ] RiskAppetite: VIX, Put/Call, 서베이
- [ ] Valuation: PER, CAPE
- [ ] 합산: `Sentiment = 0.6×RiskAppetite + 0.4×Valuation`

### Phase 4: Credit Δ 강화
- [ ] 스프레드 변화 속도(Δ1M, Δ3M) 추가
- [ ] 급변 탐지 로직 (상위 10% 변화 시 경고)

### Phase 5: Macro 레짐 대응
- [ ] 금리 레벨 → 실질금리 또는 12개월 변화폭
- [ ] 장단기 스프레드 역전 지속기간 반영

---

## 4. 다음 세션 준비물

### 확인 필요 사항
1. 현재 히스토리 데이터 저장 기간 (3개월 이상?)
2. 각 지표별 Δ 계산 가능 여부
3. cycleCalculator.ts 현재 구조 분석

### Codex에게 요청할 것
- 각 지표의 Level→점수화 공식 (구간 선형 vs S-curve)
- Trend 점수(Δ1m, Δ3m) 정의
- Macro/Credit/Sentiment 국면 라벨 규칙표

---

## 5. 현재 구현 상태 정리

### 완료된 것
- [x] regimePatterns.ts: 10개 원형 패턴 + fallback
- [x] Conflict Detection (3단계)
- [x] Clarity Score (0-100)
- [x] MasterCycleCard UI 통합

### 미완료 (다음 세션)
- [ ] S/C/M 각 사이클 계산 로직 정교화
- [ ] Trend 반영
- [ ] 국면 라벨 표시
- [ ] Sentiment 내부 분리

---

## 6. 핵심 인사이트 (Codex)

> "이건 '미래를 맞추는 모델'이 아니라,
> 현재 국면을 더 정확히 분해해서
> 판단 실수(특히 위기/가짜반등/과열 추격)를 줄이는 시스템이다."

정교화 완료 시 기대 효과:
1. 각 사이클만 봐도 국면이 설명됨 (왜 54점인지, 둔화인지 회복인지)
2. 전환구간을 더 빨리 포착 (레벨이 아니라 추세로)
3. 노이즈에 덜 흔들림 (스무딩 + 분리)

---

**Last Updated**: 2025-01-19
**Status**: 다음 세션에서 Phase 1부터 구현 시작
