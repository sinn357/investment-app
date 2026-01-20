# 다음 세션: 3대 사이클 정교화 검토

> **작성일**: 2026-01-20
> **상태**: 구현 완료, 검토 필요

---

## 세션 시작 시 할 말

```
"3대 사이클 정교화 검토. docs/NEXT_SESSION_REVIEW.md 읽고 진행해줘."
```

---

## 1. 이번 세션에서 완료된 작업

### 커밋 목록 (6개)

| 커밋 | 내용 |
|------|------|
| `6ee79d0` | Phase 2 Step 4-5 MasterCycleCard UI 업데이트 |
| `761e374` | docs: Phase 2 완료 상태 업데이트 |
| `97fea57` | feat: Phase 1 Trend 계산 로직 추가 |
| `9b8103c` | docs: Phase 1 Trend 완료 상태 업데이트 |
| `82d634c` | feat: Phase 5 Macro 레짐 강화 |
| `0b89f08` | docs: Phase 5 완료 상태 업데이트 |

---

## 2. 완료된 Phase 요약

### Phase 1: Trend 추가 ✅
- `calculate_trend_score()`: 3개월 변화율 → 0-100 점수
- `get_value_n_months_ago()`: 히스토리에서 N개월 전 값 추출
- `calculate_cycle_with_trend()`: 0.7×Level + 0.3×Trend
- `calculate_master_cycle_v2()`: Trend 포함 API

### Phase 2: 국면 라벨 ✅ (이전 세션)
- `analyzeRegimeV2()`: 라벨 기반 + threshold 폴백 매칭
- MasterCycleCard에 matchMethod 배지 추가

### Phase 3: Sentiment 분리 ✅ (이전 세션)
- `sentimentSubCycles.ts`: RiskAppetite / Valuation 분리
- 각각 독립적인 점수/트렌드/라벨

### Phase 4: Credit Δ 동적 가중치 ✅ (이전 세션)
- `creditDynamicWeight.ts`: Trend 급변 시 가중치 조정
- 급변(70%)/중간(60%)/평상시(50%) Trend 가중치

### Phase 5: Macro 레짐 강화 ✅
- `calculate_real_interest_rate()`: 명목금리 - 인플레이션
- `calculate_yield_curve_inversion_duration()`: 역전 지속 개월 수
- `calculate_macro_with_enhancements()`: 0.6×기본 + 0.25×실질금리 + 0.15×역전
- `calculate_master_cycle_v3()`: Phase 5 완성 버전

---

## 3. 검토 필요 사항

### 3.1 백엔드 검토
- [ ] cycle_engine.py 전체 함수 동작 확인
- [ ] API `/api/v3/master-cycle` 응답 구조 확인
- [ ] 실질금리/역전 지속기간 계산 정확성 확인

### 3.2 프론트엔드 검토
- [ ] MasterCycleCard에 새 필드 표시 확인
  - `macro.real_interest_rate`
  - `macro.yield_curve_inversion`
- [ ] Trend 바 표시 확인 (0-100)
- [ ] 동적 가중치 표시 확인

### 3.3 통합 테스트
- [ ] 로컬에서 백엔드 + 프론트엔드 실행
- [ ] /indicators 페이지에서 Master Cycle 카드 확인
- [ ] 모든 사이클 점수가 정상적으로 표시되는지 확인

---

## 4. 수정된 파일 목록

### 백엔드
```
backend/services/cycle_engine.py
├── calculate_trend_score()
├── get_value_n_months_ago()
├── calculate_cycle_with_trend()
├── calculate_master_cycle_v2()
├── calculate_real_interest_rate()
├── calculate_yield_curve_inversion_duration()
├── calculate_macro_with_enhancements()
└── calculate_master_cycle_v3()

backend/app.py
└── get_master_market_cycle() → v3 사용
```

### 프론트엔드
```
frontend/src/components/MasterCycleCard.tsx
├── analyzeRegimeV2() import
├── creditDynamicWeight 함수들 import
├── matchMethod 배지 표시
└── Credit 동적 가중치 표시

frontend/src/utils/
├── regimePatterns.ts (수정: labelCondition 추가)
├── sentimentSubCycles.ts (신규)
└── creditDynamicWeight.ts (신규)
```

---

## 5. API 응답 구조 (v3)

```json
{
  "status": "success",
  "data": {
    "mmc_score": 52.3,
    "phase": "전환기 (중립, 신중)",
    "macro": {
      "score": 48.5,
      "level_score": 54.2,
      "trend_score": 42.1,
      "trend": 42.1,
      "base_score": 54.2,
      "real_interest_rate": {
        "real_rate": 1.5,
        "nominal_rate": 4.5,
        "inflation": 3.0,
        "score": 30.0,
        "regime": "neutral"
      },
      "yield_curve_inversion": {
        "current_spread": 0.25,
        "is_inverted": false,
        "inversion_months": 0,
        "score": 100.0,
        "signal": "normal"
      }
    },
    "credit": {
      "score": 65.2,
      "trend": 58.3,
      ...
    },
    "sentiment": {
      "score": 38.7,
      "trend": 45.2,
      ...
    },
    "version": "v3.0-macro-enhanced",
    "data_warnings": []
  }
}
```

---

## 6. 다음 작업 (선택적)

### Phase 4 보강 (미완료)
- [ ] Credit 스프레드 변화 속도(Δ1M, Δ3M) 추가
- [ ] 급변 탐지 로직 (상위 10% 변화 시 경고)

### UI 개선
- [ ] Macro 카드에 실질금리/역전 정보 표시
- [ ] 경고 배지 UI 추가

---

**Last Updated**: 2026-01-20
