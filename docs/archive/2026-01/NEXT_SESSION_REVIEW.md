# 다음 세션: 사이클 시스템 검증 및 최적화

> **작성일**: 2026-01-20
> **상태**: Phase 4+5 구현 완료, 검증 필요

---

## 세션 시작 시 할 말

```
"사이클 시스템 검증. docs/NEXT_SESSION_REVIEW.md 읽고 진행해줘."
```

---

## 1. 이번 세션에서 완료된 작업

### 커밋 목록 (2개)

| 커밋 | 내용 |
|------|------|
| `0c52e19` | Phase 5 Macro 강화 UI 표시 추가 |
| `b7dca55` | Phase 4 Credit 스프레드 변화 속도 및 급변 탐지 구현 |

---

## 2. 현재 구현 상태

### API 버전별 기능

| 버전 | 엔드포인트 | 기능 |
|------|-----------|------|
| v1 | - | 기본 3대 사이클 (Level만) |
| v2 | - | Level + Trend 통합 |
| v3 | `/api/v3/master-cycle` | Macro 강화 (실질금리 + 역전) |
| v4 | `/api/v4/master-cycle` | **전체 강화** (Macro + Credit) |

### 백엔드 함수 (cycle_engine.py)

```
├── Phase 1: Trend
│   ├── calculate_trend_score()
│   ├── get_value_n_months_ago()
│   ├── calculate_cycle_with_trend()
│   └── calculate_master_cycle_v2()
│
├── Phase 5: Macro 강화
│   ├── calculate_real_interest_rate()
│   ├── calculate_yield_curve_inversion_duration()
│   ├── calculate_macro_with_enhancements()
│   └── calculate_master_cycle_v3()
│
└── Phase 4: Credit 강화
    ├── calculate_spread_velocity()
    ├── detect_rapid_change()
    ├── calculate_credit_with_enhancements()
    └── calculate_master_cycle_v4()
```

---

## 3. 검증 필요 사항

### 3.1 로컬 테스트
- [ ] 백엔드 실행: `python app.py`
- [ ] v4 API 호출: `curl http://localhost:5000/api/v4/master-cycle`
- [ ] 응답 구조 확인:
  - `macro.real_interest_rate`
  - `macro.yield_curve_inversion`
  - `credit.hy_velocity`
  - `credit.ig_velocity`
  - `credit.rapid_change`

### 3.2 프론트엔드 확인
- [ ] /indicators 페이지 Master Cycle 카드
- [ ] Macro 카드: 실질금리, 역전 정보 표시
- [ ] Credit 카드: HY/IG Δ1M, 급변 경고 배지

### 3.3 데이터 정확성
- [ ] 실질금리 = 명목금리 - 인플레이션 검증
- [ ] 스프레드 Δ1M 계산 정확성
- [ ] 급변 탐지 임계값 적정성 (50bp/100bp)

---

## 4. 다음 작업 (선택적)

### 즉시 가능
- [ ] 프로덕션 배포 후 v4 API 테스트
- [ ] 사이클 시스템 설명 문서 작성 (Codex 토론용)

### 향후 개선
- [ ] Sentiment 강화 (AAII, ETF Flow 등)
- [ ] 히스토리 기반 백테스트
- [ ] 알림 시스템 (급변 탐지 시)

---

## 5. 참고 문서

- `docs/CYCLE_SYSTEM_ARCHITECTURE.md` - 사이클 시스템 전체 구조 (이번 세션 작성)
- `docs/CYCLE_SYSTEM_REDESIGN.md` - 초기 설계 계획서
- `backend/services/cycle_engine.py` - 백엔드 구현

---

**Last Updated**: 2026-01-20
