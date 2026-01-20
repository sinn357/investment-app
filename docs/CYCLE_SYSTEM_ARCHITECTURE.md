# Master Market Cycle 시스템 아키텍처

> **작성일**: 2026-01-20
> **버전**: v4.0 (Full Enhanced)
> **목적**: Codex 토론용 시스템 설명서

---

## 1. 시스템 개요

### 1.1 목표
경제지표를 기반으로 **투자 타이밍**을 판단하는 정량적 시스템.
"지금이 매수 타이밍인가, 매도 타이밍인가?"에 대한 객관적 지표 제공.

### 1.2 설계 철학
- **Less is More**: 47개 지표 → 17개 핵심 지표로 노이즈 제거
- **3대 축 분리**: 거시경제 / 신용유동성 / 심리밸류에이션
- **Level + Trend**: 현재 수준뿐 아니라 변화 방향도 반영
- **참고 모델**: 레이 달리오(Bridgewater), 하워드 막스(Oaktree), JP모건

---

## 2. 3대 사이클 구조

```
┌─────────────────────────────────────────────────────────────────┐
│                    Master Market Cycle (MMC)                    │
│                         0-100 점수                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌───────────────┐  ┌───────────────┐  ┌───────────────┐      │
│   │   Sentiment   │  │    Credit     │  │     Macro     │      │
│   │     50%       │  │     30%       │  │     20%       │      │
│   │  (심리/밸류)  │  │ (신용/유동성) │  │  (거시경제)   │      │
│   └───────────────┘  └───────────────┘  └───────────────┘      │
│                                                                 │
│   MMC = 0.50×Sentiment + 0.30×Credit + 0.20×Macro              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.1 가중치 설계 근거

| 사이클 | 가중치 | 근거 |
|--------|--------|------|
| Sentiment | 50% | 시장은 단기적으로 심리에 의해 움직임. 밸류에이션이 투자 수익률의 가장 큰 결정 요인 (Shiller 연구) |
| Credit | 30% | 신용 경색은 시장 위기의 직접적 원인. 유동성이 자산 가격의 핵심 드라이버 |
| Macro | 20% | 거시경제는 후행 지표. 이미 시장에 반영된 경우가 많음 |

---

## 3. 지표별 상세

### 3.1 Macro (거시경제) - 6개 지표

| 지표 | 가중치 | 임계값 | 방향 | 의미 |
|------|--------|--------|------|------|
| ISM Manufacturing PMI | 30% | 45/50/55 | 정방향 | 50 이상 확장, 이하 수축 |
| ISM Services PMI | 20% | 45/50/55 | 정방향 | 서비스업 경기 |
| Unemployment Rate | 20% | 3.5/4.5/6.0 | **역방향** | 낮을수록 좋음 |
| Core CPI | 10% | 2.0/2.5/3.5 | **역방향** | 낮을수록 좋음 (인플레이션) |
| Federal Funds Rate | 15% | 2.0/3.5/5.0 | **역방향** | 낮을수록 좋음 (통화 완화) |
| Yield Curve 10Y-2Y | 5% | -0.5/0.0/0.5 | 정방향 | 양수가 정상, 음수는 역전 |

**Phase 5 강화:**
- 실질금리 = 명목금리 - 인플레이션
- 역전 지속기간 = 연속 역전 개월 수

### 3.2 Credit (신용/유동성) - 5개 지표

| 지표 | 가중치 | 임계값 | 방향 | 의미 |
|------|--------|--------|------|------|
| HY Spread | 30% | 250/400/600 bp | **역방향** | 낮을수록 리스크 선호 |
| IG Spread | 20% | 100/150/200 bp | **역방향** | 투자등급 채권 스프레드 |
| FCI (금융여건지수) | 25% | -0.5/0.0/0.5 | **역방향** | 낮을수록 완화적 |
| M2 YoY | 15% | 2.0/5.0/8.0 % | 정방향 | 높을수록 유동성 풍부 |
| VIX | 10% | 12/18/25 | **역방향** | 낮을수록 안정 |

**Phase 4 강화:**
- 스프레드 변화 속도 (Δ1M, Δ3M)
- 급변 탐지 (50bp 경계, 100bp 위험)

### 3.3 Sentiment (심리/밸류에이션) - 6개 지표

| 지표 | 가중치 | 임계값 | 방향 | 의미 |
|------|--------|--------|------|------|
| VIX | 20% | 12/18/30 | **역방향** | 공포지수 |
| S&P500 PER | 20% | 18/25/35 | **역방향** | 낮을수록 저평가 |
| Shiller CAPE | 15% | 20/30/45 | **역방향** | 장기 밸류에이션 |
| Put/Call Ratio | 15% | 0.7/1.0/1.3 | 정방향 | 높을수록 공포 (역발상 기회) |
| Michigan Sentiment | 15% | 50/75/95 | 정방향 | 소비자 심리 |
| CB Consumer Confidence | 15% | 75/95/110 | 정방향 | 소비자 신뢰 |

---

## 4. 점수 계산 수식

### 4.1 Threshold 기반 점수화

```python
def calculate_threshold_score(value, thresholds, reverse=False):
    """
    임계값 기반으로 0-100 점수 계산

    예시 (ISM PMI, 정방향):
    - 45 이하 → 0점
    - 50 → 50점
    - 55 이상 → 100점
    - 선형 보간

    예시 (실업률, 역방향):
    - 3.5% 이하 → 100점
    - 4.5% → 50점
    - 6.0% 이상 → 0점
    """
    low, mid, high = sorted(thresholds.values())

    if reverse:  # 낮을수록 좋은 지표
        if value <= low: return 100.0
        elif value >= high: return 0.0
        elif value <= mid:
            return 100 - ((value - low) / (mid - low)) * 50
        else:
            return 50 - ((value - mid) / (high - mid)) * 50
    else:  # 높을수록 좋은 지표
        if value <= low: return 0.0
        elif value >= high: return 100.0
        elif value <= mid:
            return ((value - low) / (mid - low)) * 50
        else:
            return 50 + ((value - mid) / (high - mid)) * 50
```

### 4.2 Trend 점수 계산

```python
def calculate_trend_score(current, past_3m, reverse=False):
    """
    3개월 변화율 기반 Trend 점수 (0-100)

    - +10% 이상 개선 → 100점
    - 변화 없음 → 50점
    - -10% 이상 악화 → 0점
    """
    change_rate = ((current - past_3m) / abs(past_3m)) * 100

    if reverse:
        change_rate = -change_rate  # 역방향 지표는 부호 반전

    score = 50 + (change_rate / 10) * 50
    return max(0.0, min(100.0, score))
```

### 4.3 최종 사이클 점수

```python
# 각 사이클의 최종 점수
Cycle_Score = 0.7 × Level_Score + 0.3 × Trend_Score

# Macro 강화 버전 (Phase 5)
Macro_Enhanced = 0.60 × Base_Macro + 0.25 × RealRate_Score + 0.15 × Inversion_Score

# Credit 강화 버전 (Phase 4)
Credit_Enhanced = 0.70 × Base_Credit + 0.30 × Velocity_Score

# Master Market Cycle
MMC = 0.50 × Sentiment + 0.30 × Credit + 0.20 × Macro
```

---

## 5. 국면 판별 기준

### 5.1 MMC 종합 국면

| 점수 범위 | 국면 | 투자 행동 |
|-----------|------|----------|
| 80-100 | 강한 확장기 | 공격적 매수 |
| 60-80 | 확장기 | 포지션 유지 |
| 40-60 | 전환기 | 중립, 신중 |
| 20-40 | 수축기 | 리스크 축소 |
| 0-20 | 공포 바닥 | **강력 매수 타이밍** |

### 5.2 개별 사이클 국면

**Macro:**
- 75+ : 강한 확장기
- 55-75 : 확장기
- 45-55 : 둔화 시작
- 30-45 : 침체기
- 0-30 : 심각한 침체

**Credit:**
- 70+ : 유동성 풍부
- 45-70 : 중립
- 25-45 : 긴축 환경
- 0-25 : 신용 경색

**Sentiment:**
- 70+ : 극심한 공포 (바닥 근접)
- 50-70 : 약세 심리
- 30-50 : 과열 경계
- 0-30 : 극심한 탐욕 (고점 경계)

---

## 6. 투자 추천 로직

```python
def get_recommendation(mmc, macro, credit, sentiment):
    """
    3대 사이클 조합으로 투자 추천 생성
    """
    # 모두 60+ → 공격적
    if macro >= 60 and credit >= 60 and sentiment >= 60:
        return "공격적 포지션 유지, 성장주 중심"

    # 거시/신용 좋지만 심리 나쁨 → 밸류에이션 부담
    if macro >= 60 and credit >= 60 and sentiment < 40:
        return "밸류에이션 부담, 분할 매도 고려"

    # 모두 나쁨 → 바닥 접근
    if macro < 40 and credit < 40 and sentiment < 40:
        return "바닥 접근 중, 분할 매수 시작"

    # 거시 나쁘지만 신용 좋음 → 채권 비중
    if macro < 40 and credit >= 60:
        return "경기 둔화 예상, 채권 비중 확대"

    return "중립 포지션, 시장 관망"
```

---

## 7. Phase 4+5 강화 기능

### 7.1 실질금리 점수 (Phase 5)

```
실질금리 = 명목금리(Fed Rate) - 인플레이션(Core CPI)

점수 = 100 - ((실질금리 + 2) / 5) × 100
  - 실질금리 -2% 이하 → 100점 (부양적)
  - 실질금리 +3% 이상 → 0점 (억제적)

레짐:
  - < 0% : stimulative (부양적)
  - 0-1.5% : neutral (중립)
  - > 1.5% : restrictive (억제적)
```

### 7.2 역전 지속기간 점수 (Phase 5)

```
역전 지속 = 연속으로 스프레드가 음수인 개월 수

점수:
  - 0개월 (정상) → 100점
  - 1-2개월 → 70점 (경계)
  - 3-5개월 → 40점 (위험)
  - 6개월+ → 10점 (침체 확률 높음)

현재 역전 중이면 추가 -10점
```

### 7.3 스프레드 변화 속도 (Phase 4)

```
Δ1M = 현재 스프레드 - 1개월 전 스프레드

속도 점수 = max(0, 100 - |Δ1M|)
  - Δ1M = 0bp → 100점 (안정)
  - |Δ1M| = 50bp → 50점 (경계)
  - |Δ1M| = 100bp+ → 0점 (급변)

알림 레벨:
  - |Δ1M| < 50bp : normal
  - 50bp ≤ |Δ1M| < 100bp : warning
  - |Δ1M| ≥ 100bp : danger
```

### 7.4 급변 탐지 (Phase 4)

```
탐지 대상:
  - HY Spread Δ1M > 50bp : 경고
  - HY Spread Δ1M > 100bp : 위험
  - IG Spread Δ1M > 50bp : 경고
  - VIX Δ1M > 5 : 경고
  - VIX Δ1M > 10 : 위험

severity:
  - normal : 급변 없음
  - warning : 일부 지표 경계
  - critical : 다수 지표 위험
```

---

## 8. 한계점 및 개선 방향

### 8.1 현재 한계

1. **데이터 지연**: 일부 지표는 월간 발표 (최신 데이터 부족)
2. **백테스트 미완**: 과거 데이터로 검증 안 됨
3. **단일 시장**: 미국 시장 중심 (글로벌 확장 필요)
4. **정적 가중치**: 시장 상황에 따른 동적 조정 없음

### 8.2 향후 개선

1. **Sentiment 강화**: AAII 투자자 심리, ETF Flow 추가
2. **백테스트 시스템**: 2008, 2020 위기 시 성과 검증
3. **알림 시스템**: 급변 탐지 시 푸시 알림
4. **AI 예측**: 다음 달 MMC 예측 모델

---

## 9. API 사용 예시

### v4 API 호출

```bash
curl https://api.example.com/api/v4/master-cycle
```

### 응답 구조

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
      "phase": "둔화 시작",
      "real_interest_rate": {
        "real_rate": 1.5,
        "score": 30.0,
        "regime": "neutral"
      },
      "yield_curve_inversion": {
        "is_inverted": false,
        "inversion_months": 0,
        "score": 100.0,
        "signal": "normal"
      }
    },
    "credit": {
      "score": 65.2,
      "level_score": 68.0,
      "trend_score": 58.3,
      "state": "중립",
      "hy_velocity": {
        "current": 350,
        "delta_1m": 25,
        "alert_level": "normal"
      },
      "ig_velocity": {
        "current": 120,
        "delta_1m": 10,
        "alert_level": "normal"
      },
      "rapid_change": {
        "has_rapid_change": false,
        "severity": "normal"
      }
    },
    "sentiment": {
      "score": 38.7,
      "level_score": 35.2,
      "trend_score": 45.2,
      "state": "과열 경계"
    },
    "recommendation": "중립 포지션, 시장 관망",
    "version": "v4.0-full-enhanced",
    "data_warnings": []
  }
}
```

---

## 10. 토론 포인트 (Codex용)

### Q1. 가중치 적정성
- Sentiment 50%가 너무 높은가?
- 경기 침체 시 Macro 가중치를 높여야 하는가?

### Q2. 임계값 설정
- ISM PMI 45/50/55가 적절한가?
- HY 스프레드 250/400/600bp가 현재 시장에 맞는가?

### Q3. 역발상 투자
- Sentiment 낮을수록 (탐욕) 점수가 낮아지는 로직이 맞는가?
- "공포에 사고, 탐욕에 팔아라" 원칙이 제대로 반영되었는가?

### Q4. 급변 탐지 임계값
- 50bp/100bp 기준이 너무 보수적인가, 공격적인가?
- 역사적 데이터 기반 임계값 조정 필요?

### Q5. 실제 투자 적용
- 이 점수로 실제 포트폴리오 리밸런싱을 할 수 있는가?
- 백테스트 없이 실전 적용이 가능한가?

---

**Last Updated**: 2026-01-20
**Author**: Claude Opus 4.5
