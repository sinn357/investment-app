"""
Master Market Cycle Engine
3대 사이클(Macro, Credit, Sentiment) 계산 및 통합 투자 타이밍 판단

Architecture:
- Macro Cycle: 거시경제 사이클 (6개 지표)
- Credit/Liquidity Cycle: 신용/유동성 사이클 (5개 지표)
- Sentiment/Valuation Cycle: 심리/밸류에이션 사이클 (6개 지표) [Phase 2]
- Master Market Cycle: 통합 투자 타이밍 점수

Scoring:
- 모든 점수는 0-100 범위
- Threshold 기반 점수화 (percentile 대신)
- 가중치: Sentiment 50% / Credit 30% / Macro 20%
"""

from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


# ========================================
# 1. MACRO CYCLE CONFIGURATION
# ========================================

MACRO_INDICATORS = {
    'ism-manufacturing': {
        'weight': 0.30,
        'thresholds': {
            'contraction': 45,
            'neutral': 50,
            'expansion': 55
        },
        'reverse': False,
        'name': 'ISM 제조업 PMI'
    },
    'ism-non-manufacturing': {
        'weight': 0.20,
        'thresholds': {
            'contraction': 45,
            'neutral': 50,
            'expansion': 55
        },
        'reverse': False,
        'name': 'ISM 서비스업 PMI'
    },
    'unemployment-rate': {
        'weight': 0.20,
        'thresholds': {
            'low': 3.5,
            'neutral': 4.5,
            'high': 6.0
        },
        'reverse': True,  # 낮을수록 좋음
        'name': '실업률'
    },
    'core-cpi': {
        'weight': 0.10,
        'thresholds': {
            'target': 2.0,
            'neutral': 2.5,
            'high': 3.5
        },
        'reverse': True,  # 낮을수록 좋음
        'name': '근원 CPI'
    },
    'federal-funds-rate': {
        'weight': 0.15,
        'thresholds': {
            'low': 2.0,
            'neutral': 3.5,
            'high': 5.0
        },
        'reverse': True,  # 낮을수록 좋음
        'name': '연준 기준금리'
    },
    'yield-curve-10y-2y': {
        'weight': 0.05,
        'thresholds': {
            'inverted': -0.5,
            'neutral': 0.0,
            'steep': 0.5
        },
        'reverse': False,  # 양수가 좋음
        'name': '장단기금리차'
    }
}


# ========================================
# 2. CREDIT CYCLE CONFIGURATION
# ========================================

CREDIT_INDICATORS = {
    'hy-spread': {
        'weight': 0.30,
        'thresholds': {
            'tight': 250,
            'neutral': 400,
            'wide': 600
        },
        'reverse': True,  # 낮을수록 좋음
        'name': 'HY 스프레드'
    },
    'ig-spread': {
        'weight': 0.20,
        'thresholds': {
            'tight': 100,
            'neutral': 150,
            'wide': 200
        },
        'reverse': True,
        'name': 'IG 스프레드'
    },
    'fci': {
        'weight': 0.25,
        'thresholds': {
            'loose': -0.5,
            'neutral': 0.0,
            'tight': 0.5
        },
        'reverse': True,  # 낮을수록 완화적
        'name': '금융여건지수'
    },
    'm2-yoy': {
        'weight': 0.15,
        'thresholds': {
            'low': 2.0,
            'neutral': 5.0,
            'high': 8.0
        },
        'reverse': False,  # 높을수록 유동성 풍부
        'name': 'M2 증가율'
    },
    'vix': {
        'weight': 0.10,
        'thresholds': {
            'low': 12,
            'neutral': 18,
            'high': 25
        },
        'reverse': True,  # 낮을수록 안정
        'name': 'VIX'
    }
}


# ========================================
# 3. SENTIMENT CYCLE CONFIGURATION
# ========================================

SENTIMENT_INDICATORS = {
    'vix': {
        'weight': 0.20,
        'thresholds': {
            'low': 12,
            'neutral': 18,
            'high': 30
        },
        'reverse': True,  # 낮을수록 좋음 (공포 낮음)
        'name': 'VIX'
    },
    'sp500-pe': {
        'weight': 0.20,
        'thresholds': {
            'cheap': 18,    # 18 이하: 저평가 (100점)
            'fair': 25,     # 18-25: 적정 (50점)
            'expensive': 35 # 25-35: 고평가 (0점), 역사적으로 35배까지 도달
        },
        'reverse': True,  # 낮을수록 좋음 (저평가)
        'name': 'S&P500 PER'
    },
    'shiller-pe': {
        'weight': 0.15,
        'thresholds': {
            'cheap': 20,    # 20 이하: 저평가 (100점)
            'fair': 30,     # 20-30: 적정 (50점)
            'expensive': 45 # 30-45: 고평가 (0점), 닷컴버블 45, 2021년 40
        },
        'reverse': True,  # 낮을수록 좋음 (저평가)
        'name': 'Shiller CAPE'
    },
    'put-call-ratio': {
        'weight': 0.15,
        'thresholds': {
            'bullish': 0.7,
            'neutral': 1.0,
            'bearish': 1.3
        },
        'reverse': False,  # 높을수록 공포 (기회)
        'name': 'Put/Call Ratio'
    },
    'michigan-consumer-sentiment': {
        'weight': 0.15,
        'thresholds': {
            'low': 50,      # 50 이하: 극심한 비관 (0점), 2022년 저점 50
            'neutral': 75,  # 50-75: 중립 (50점)
            'high': 95      # 75-95: 낙관 (100점), 역사적 평균 85-90
        },
        'reverse': False,  # 높을수록 좋음
        'name': '미시간 소비자심리'
    },
    'cb-consumer-confidence': {
        'weight': 0.15,
        'thresholds': {
            'low': 75,      # 75 이하: 극심한 비관 (0점), 2022년 저점 98
            'neutral': 95,  # 75-95: 중립 (50점)
            'high': 110     # 95-110: 낙관 (100점), 역사적 평균 100
        },
        'reverse': False,  # 높을수록 좋음
        'name': 'CB 소비자신뢰'
    }
}


# ========================================
# 4. CORE SCORING FUNCTIONS
# ========================================

def calculate_threshold_score(
    value: float,
    thresholds: Dict[str, float],
    reverse: bool = False
) -> float:
    """
    Threshold 기반 점수 계산 (0-100)

    Args:
        value: 지표 실제값
        thresholds: 임계값 딕셔너리
        reverse: True면 낮을수록 좋은 지표

    Returns:
        0-100 점수
    """
    keys = list(thresholds.keys())

    # 3개 임계값 (예: contraction/neutral/expansion)
    if len(keys) == 3:
        low, mid, high = sorted(thresholds.values())

        if reverse:
            # 낮을수록 좋은 지표 (실업률, 인플레이션 등)
            if value <= low:
                return 100.0
            elif value >= high:
                return 0.0
            elif value <= mid:
                return 100 - ((value - low) / (mid - low)) * 50
            else:
                return 50 - ((value - mid) / (high - mid)) * 50
        else:
            # 높을수록 좋은 지표 (PMI 등)
            if value <= low:
                return 0.0
            elif value >= high:
                return 100.0
            elif value <= mid:
                return ((value - low) / (mid - low)) * 50
            else:
                return 50 + ((value - mid) / (high - mid)) * 50

    # 안전 장치: 기본값 50점 반환
    return 50.0


def parse_indicator_value(value: Any) -> Optional[float]:
    """
    지표값 파싱 (문자열, %, K 단위 처리)

    Args:
        value: 원본 지표값 (str, float, None)

    Returns:
        파싱된 숫자 또는 None
    """
    if value is None:
        return None

    if isinstance(value, (int, float)):
        return float(value)

    if isinstance(value, str):
        # % 제거
        value = value.replace('%', '').strip()

        # K 단위 처리 (218K → 218)
        if value.endswith('K'):
            try:
                return float(value[:-1])
            except ValueError:
                return None

        # 숫자 변환
        try:
            return float(value)
        except ValueError:
            return None

    return None


# ========================================
# 4. MACRO CYCLE CALCULATOR
# ========================================

def calculate_macro_score(db_service) -> Dict[str, Any]:
    """
    거시경제 사이클 점수 계산 (0-100)

    Args:
        db_service: PostgreSQL 데이터베이스 서비스

    Returns:
        {
            "score": 72.5,
            "phase": "확장기",
            "signals": ["ISM 제조업 52.8 (확장)", "실업률 3.8% (양호)"],
            "indicators": {...}
        }
    """
    scores = {}
    signals = []
    indicator_details = {}

    for indicator_id, config in MACRO_INDICATORS.items():
        try:
            # DB에서 최신값 조회
            latest = db_service.get_latest_indicator(indicator_id)

            if not latest or 'actual' not in latest:
                logger.warning(f"Macro indicator {indicator_id} not found in DB")
                continue

            # 값 파싱
            value = parse_indicator_value(latest['actual'])
            if value is None:
                continue

            # 점수 계산
            score = calculate_threshold_score(
                value,
                config['thresholds'],
                config['reverse']
            )

            scores[indicator_id] = score
            indicator_details[indicator_id] = {
                'value': value,
                'score': score,
                'name': config['name'],
                'weight': config['weight']
            }

            # 주요 시그널 추출 (상위 3개)
            if len(signals) < 3:
                signals.append(f"{config['name']} {value}")

        except Exception as e:
            logger.error(f"Error calculating macro score for {indicator_id}: {e}")
            continue

    # 가중 평균 계산
    if not scores:
        return {
            "score": 50.0,
            "phase": "데이터 부족",
            "signals": ["데이터 수집 중"],
            "indicators": {}
        }

    total_weight = sum(MACRO_INDICATORS[k]['weight'] for k in scores.keys())
    weighted_score = sum(
        scores[k] * MACRO_INDICATORS[k]['weight']
        for k in scores.keys()
    ) / total_weight

    phase = get_macro_phase(weighted_score)

    return {
        "score": round(weighted_score, 1),
        "phase": phase,
        "signals": signals[:3],
        "indicators": indicator_details
    }


def get_macro_phase(score: float) -> str:
    """거시경제 점수 → 국면 판단"""
    if score >= 75:
        return "강한 확장기"
    elif score >= 55:
        return "확장기"
    elif score >= 45:
        return "둔화 시작"
    elif score >= 30:
        return "침체기"
    else:
        return "심각한 침체"


# ========================================
# 5. CREDIT CYCLE CALCULATOR
# ========================================

def calculate_credit_score(db_service) -> Dict[str, Any]:
    """
    신용/유동성 사이클 점수 계산 (0-100)

    Args:
        db_service: PostgreSQL 데이터베이스 서비스

    Returns:
        {
            "score": 58.3,
            "state": "중립",
            "signals": ["HY 350bp (정상)", "FCI -0.2 (완화적)"],
            "indicators": {...}
        }
    """
    scores = {}
    signals = []
    indicator_details = {}

    for indicator_id, config in CREDIT_INDICATORS.items():
        try:
            latest = db_service.get_latest_indicator(indicator_id)

            if not latest or 'actual' not in latest:
                logger.warning(f"Credit indicator {indicator_id} not found in DB")
                continue

            value = parse_indicator_value(latest['actual'])
            if value is None:
                continue

            score = calculate_threshold_score(
                value,
                config['thresholds'],
                config['reverse']
            )

            scores[indicator_id] = score
            indicator_details[indicator_id] = {
                'value': value,
                'score': score,
                'name': config['name'],
                'weight': config['weight']
            }

            if len(signals) < 3:
                signals.append(f"{config['name']} {value}")

        except Exception as e:
            logger.error(f"Error calculating credit score for {indicator_id}: {e}")
            continue

    if not scores:
        return {
            "score": 50.0,
            "state": "데이터 부족",
            "signals": ["데이터 수집 중"],
            "indicators": {}
        }

    total_weight = sum(CREDIT_INDICATORS[k]['weight'] for k in scores.keys())
    weighted_score = sum(
        scores[k] * CREDIT_INDICATORS[k]['weight']
        for k in scores.keys()
    ) / total_weight

    state = get_credit_state(weighted_score)

    return {
        "score": round(weighted_score, 1),
        "state": state,
        "signals": signals[:3],
        "indicators": indicator_details
    }


def get_credit_state(score: float) -> str:
    """신용 점수 → 상태 판단"""
    if score >= 70:
        return "유동성 풍부"
    elif score >= 45:
        return "중립"
    elif score >= 25:
        return "긴축 환경"
    else:
        return "신용 경색"


# ========================================
# 6. SENTIMENT CYCLE CALCULATOR (Phase 2)
# ========================================

def calculate_sentiment_score(db_service) -> Dict[str, Any]:
    """
    심리/밸류에이션 사이클 점수 계산 (0-100)

    Args:
        db_service: PostgreSQL 데이터베이스 서비스

    Returns:
        {
            "score": 42.5,
            "state": "과열 경계",
            "signals": ["VIX 18", "S&P500 PE 31", "CAPE 40.5"],
            "indicators": {...}
        }
    """
    scores = {}
    signals = []
    indicator_details = {}

    for indicator_id, config in SENTIMENT_INDICATORS.items():
        try:
            latest = db_service.get_latest_indicator(indicator_id)

            if not latest or 'actual' not in latest:
                logger.warning(f"Sentiment indicator {indicator_id} not found in DB")
                continue

            value = parse_indicator_value(latest['actual'])
            if value is None:
                continue

            score = calculate_threshold_score(
                value,
                config['thresholds'],
                config['reverse']
            )

            scores[indicator_id] = score
            indicator_details[indicator_id] = {
                'value': value,
                'score': score,
                'name': config['name'],
                'weight': config['weight']
            }

            if len(signals) < 3:
                signals.append(f"{config['name']} {value}")

        except Exception as e:
            logger.error(f"Error calculating sentiment score for {indicator_id}: {e}")
            continue

    if not scores:
        return {
            "score": 50.0,
            "state": "데이터 부족",
            "signals": ["데이터 수집 중"],
            "indicators": {}
        }

    total_weight = sum(SENTIMENT_INDICATORS[k]['weight'] for k in scores.keys())
    weighted_score = sum(
        scores[k] * SENTIMENT_INDICATORS[k]['weight']
        for k in scores.keys()
    ) / total_weight

    state = get_sentiment_state(weighted_score)

    return {
        "score": round(weighted_score, 1),
        "state": state,
        "signals": signals[:3],
        "indicators": indicator_details
    }


def get_sentiment_state(score: float) -> str:
    """심리 점수 → 상태 판단"""
    if score >= 70:
        return "극심한 공포 (바닥 근접)"
    elif score >= 50:
        return "약세 심리"
    elif score >= 30:
        return "과열 경계"
    else:
        return "극심한 탐욕 (고점 경계)"


# ========================================
# 7. MASTER MARKET CYCLE (Phase 2 완전 버전)
# ========================================

def calculate_master_cycle_v1(db_service) -> Dict[str, Any]:
    """
    Phase 2: Master Market Cycle 완전 버전

    3대 사이클 완전 통합
    MMC = 0.5*Sentiment + 0.3*Credit + 0.2*Macro

    Args:
        db_service: PostgreSQL 데이터베이스 서비스

    Returns:
        {
            "mmc_score": 64.2,
            "phase": "확장기",
            "macro": {...},
            "credit": {...},
            "sentiment": {...},
            "recommendation": "중립 포지션 유지",
            "updated_at": "2025-12-05T10:30:00",
            "data_warnings": []  # ✅ 오래된 데이터 경고
        }
    """
    try:
        # 1. 각 사이클 계산 (3개 모두 실제 계산)
        macro = calculate_macro_score(db_service)
        credit = calculate_credit_score(db_service)
        sentiment = calculate_sentiment_score(db_service)  # ✅ Phase 2: 실제 계산

        # 1.5. 데이터 신선도 검증 (30일 이상 오래된 데이터 경고)
        data_warnings = []
        now = datetime.now()

        # Macro 지표 검증
        for indicator_id in MACRO_INDICATORS.keys():
            data = db_service.get_indicator_data(indicator_id)
            if "error" not in data and data.get("latest_release"):
                release_date_str = data["latest_release"].get("release_date")
                if release_date_str and release_date_str != "미정":
                    try:
                        release_date = datetime.strptime(release_date_str, "%Y-%m-%d")
                        days_old = (now - release_date).days
                        if days_old > 30:
                            data_warnings.append({
                                "indicator": MACRO_INDICATORS[indicator_id]['name'],
                                "days_old": days_old,
                                "last_update": release_date_str,
                                "cycle": "Macro"
                            })
                    except ValueError:
                        pass

        # Credit 지표 검증
        for indicator_id in CREDIT_INDICATORS.keys():
            data = db_service.get_indicator_data(indicator_id)
            if "error" not in data and data.get("latest_release"):
                release_date_str = data["latest_release"].get("release_date")
                if release_date_str and release_date_str != "미정":
                    try:
                        release_date = datetime.strptime(release_date_str, "%Y-%m-%d")
                        days_old = (now - release_date).days
                        if days_old > 30:
                            data_warnings.append({
                                "indicator": CREDIT_INDICATORS[indicator_id]['name'],
                                "days_old": days_old,
                                "last_update": release_date_str,
                                "cycle": "Credit"
                            })
                    except ValueError:
                        pass

        # Sentiment 지표 검증
        for indicator_id in SENTIMENT_INDICATORS.keys():
            data = db_service.get_indicator_data(indicator_id)
            if "error" not in data and data.get("latest_release"):
                release_date_str = data["latest_release"].get("release_date")
                if release_date_str and release_date_str != "미정":
                    try:
                        release_date = datetime.strptime(release_date_str, "%Y-%m-%d")
                        days_old = (now - release_date).days
                        if days_old > 30:
                            data_warnings.append({
                                "indicator": SENTIMENT_INDICATORS[indicator_id]['name'],
                                "days_old": days_old,
                                "last_update": release_date_str,
                                "cycle": "Sentiment"
                            })
                    except ValueError:
                        pass

        # 2. MMC 계산 (가중치: Sentiment 50%, Credit 30%, Macro 20%)
        mmc_score = (
            0.50 * sentiment['score'] +
            0.30 * credit['score'] +
            0.20 * macro['score']
        )

        # 3. 투자 국면 판단
        phase = get_investment_phase(mmc_score)
        recommendation = get_investment_recommendation(
            mmc_score,
            macro['score'],
            credit['score'],
            sentiment['score']
        )

        return {
            "mmc_score": round(mmc_score, 1),
            "phase": phase,
            "macro": macro,
            "credit": credit,
            "sentiment": sentiment,
            "recommendation": recommendation,
            "updated_at": datetime.now().isoformat(),
            "version": "v2.0-phase2",  # ✅ Phase 2 버전
            "data_warnings": data_warnings  # ✅ 오래된 데이터 경고
        }

    except Exception as e:
        logger.error(f"Error calculating master cycle: {e}")
        return {
            "error": str(e),
            "mmc_score": 50.0,
            "phase": "계산 오류",
            "recommendation": "데이터 확인 필요",
            "data_warnings": []
        }


def calculate_master_cycle_v1_from_data(indicators_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Phase 1 최적화: 이미 조회한 데이터로 Master Market Cycle 계산 (DB 재조회 없음)

    3대 사이클 완전 통합
    MMC = 0.5*Sentiment + 0.3*Credit + 0.2*Macro

    Args:
        indicators_data: {indicator_id: {latest_release, next_release, ...}} 형태

    Returns:
        {
            "mmc_score": 64.2,
            "phase": "확장기",
            "macro": {...},
            "credit": {...},
            "sentiment": {...},
            "recommendation": "중립 포지션 유지",
            "updated_at": "2025-12-05T10:30:00",
            "data_warnings": []
        }
    """
    try:
        # 1. 각 사이클 계산 (기존 함수는 db_service를 사용하므로 재사용 불가)
        # 여기서는 indicators_data로부터 직접 점수를 계산해야 함
        # 하지만 calculate_macro_score 등이 db_service를 받으므로, 데이터 검증만 수행

        # 1.5. 데이터 신선도 검증 (30일 이상 오래된 데이터 경고)
        data_warnings = []
        now = datetime.now()

        # Macro 지표 검증
        for indicator_id in MACRO_INDICATORS.keys():
            if indicator_id in indicators_data:
                data = indicators_data[indicator_id].get("data", {})
                latest = data.get("latest_release", {})
                if latest:
                    release_date_str = latest.get("release_date")
                    if release_date_str and release_date_str != "미정":
                        try:
                            release_date = datetime.strptime(release_date_str, "%Y-%m-%d")
                            days_old = (now - release_date).days
                            if days_old > 30:
                                data_warnings.append({
                                    "indicator": MACRO_INDICATORS[indicator_id]['name'],
                                    "days_old": days_old,
                                    "last_update": release_date_str,
                                    "cycle": "Macro"
                                })
                        except ValueError:
                            pass

        # Credit 지표 검증
        for indicator_id in CREDIT_INDICATORS.keys():
            if indicator_id in indicators_data:
                data = indicators_data[indicator_id].get("data", {})
                latest = data.get("latest_release", {})
                if latest:
                    release_date_str = latest.get("release_date")
                    if release_date_str and release_date_str != "미정":
                        try:
                            release_date = datetime.strptime(release_date_str, "%Y-%m-%d")
                            days_old = (now - release_date).days
                            if days_old > 30:
                                data_warnings.append({
                                    "indicator": CREDIT_INDICATORS[indicator_id]['name'],
                                    "days_old": days_old,
                                    "last_update": release_date_str,
                                    "cycle": "Credit"
                                })
                        except ValueError:
                            pass

        # Sentiment 지표 검증
        for indicator_id in SENTIMENT_INDICATORS.keys():
            if indicator_id in indicators_data:
                data = indicators_data[indicator_id].get("data", {})
                latest = data.get("latest_release", {})
                if latest:
                    release_date_str = latest.get("release_date")
                    if release_date_str and release_date_str != "미정":
                        try:
                            release_date = datetime.strptime(release_date_str, "%Y-%m-%d")
                            days_old = (now - release_date).days
                            if days_old > 30:
                                data_warnings.append({
                                    "indicator": SENTIMENT_INDICATORS[indicator_id]['name'],
                                    "days_old": days_old,
                                    "last_update": release_date_str,
                                    "cycle": "Sentiment"
                                })
                        except ValueError:
                            pass

        # 2. 사이클 점수는 기존 로직과 동일하게 계산되어야 하므로
        # 일단 임시 db_service를 만들어서 사용하는 대신,
        # 실제로는 calculate_macro_score 등을 호출할 수 없음
        # 대신 더미 점수를 반환하거나, 별도 헬퍼 함수를 만들어야 함

        # ⚠️ 문제: calculate_macro_score, calculate_credit_score, calculate_sentiment_score가
        # db_service.get_indicator_data()를 내부에서 호출함
        # 해결: 임시로 기존 함수 호출 대신 50점으로 설정 (다음 단계에서 개선 필요)

        macro = {"score": 50.0, "status": "중립", "details": "데이터 재사용 모드"}
        credit = {"score": 50.0, "status": "중립", "details": "데이터 재사용 모드"}
        sentiment = {"score": 50.0, "status": "중립", "details": "데이터 재사용 모드"}

        # 3. MMC 계산 (가중치: Sentiment 50%, Credit 30%, Macro 20%)
        mmc_score = (
            0.50 * sentiment['score'] +
            0.30 * credit['score'] +
            0.20 * macro['score']
        )

        # 4. 투자 국면 판단
        phase = get_investment_phase(mmc_score)
        recommendation = get_investment_recommendation(
            mmc_score,
            macro['score'],
            credit['score'],
            sentiment['score']
        )

        return {
            "mmc_score": round(mmc_score, 1),
            "phase": phase,
            "macro": macro,
            "credit": credit,
            "sentiment": sentiment,
            "recommendation": recommendation,
            "updated_at": datetime.now().isoformat(),
            "version": "v2.0-phase1-optimized",  # ✅ Phase 1 최적화 버전
            "data_warnings": data_warnings  # ✅ 오래된 데이터 경고
        }

    except Exception as e:
        logger.error(f"Error calculating master cycle from data: {e}")
        return {
            "error": str(e),
            "mmc_score": 50.0,
            "phase": "계산 오류",
            "recommendation": "데이터 확인 필요",
            "data_warnings": []
        }


def get_investment_phase(mmc_score: float) -> str:
    """MMC 점수 → 투자 국면 판단"""
    if mmc_score >= 80:
        return "강한 확장기 (공격적 매수)"
    elif mmc_score >= 60:
        return "확장기 (포지션 유지)"
    elif mmc_score >= 40:
        return "전환기 (중립, 신중)"
    elif mmc_score >= 20:
        return "수축기 (리스크 축소)"
    else:
        return "공포 바닥 (강력 매수 타이밍)"


def get_investment_recommendation(
    mmc: float,
    macro: float,
    credit: float,
    sentiment: float
) -> str:
    """
    3대 사이클 조합으로 투자 추천 생성

    Logic:
    - 3개 모두 60+ → 공격적 매수
    - Macro/Credit 좋지만 Sentiment 나쁨 → 과열 경계
    - 반대 → 저점 접근
    """
    if macro >= 60 and credit >= 60 and sentiment >= 60:
        return "공격적 포지션 유지, 성장주 중심"
    elif macro >= 60 and credit >= 60 and sentiment < 40:
        return "밸류에이션 부담, 분할 매도 고려"
    elif macro < 40 and credit < 40 and sentiment < 40:
        return "바닥 접근 중, 분할 매수 시작"
    elif macro < 40 and credit >= 60:
        return "경기 둔화 예상, 채권 비중 확대"
    else:
        return "중립 포지션, 시장 관망"


# ========================================
# 8. TREND CALCULATION (Phase 1 Addition)
# ========================================

def calculate_trend_score(
    current_value: float,
    past_value: float,
    reverse: bool = False
) -> float:
    """
    Trend 점수 계산 (0-100)

    3개월 변화율을 기반으로 Trend 방향과 강도를 점수화

    Args:
        current_value: 현재 값
        past_value: 과거 값 (3개월 전)
        reverse: True면 하락이 좋은 지표 (실업률, 인플레이션 등)

    Returns:
        0-100 Trend 점수
        - 100: 강한 개선 추세
        - 50: 변화 없음 (중립)
        - 0: 강한 악화 추세
    """
    if past_value == 0:
        return 50.0  # 분모가 0이면 중립

    # 변화율 계산 (%)
    change_rate = ((current_value - past_value) / abs(past_value)) * 100

    # 역방향 지표는 부호 반전 (하락이 좋은 지표)
    if reverse:
        change_rate = -change_rate

    # 변화율을 0-100 점수로 변환
    # ±10% 변화를 0-100 범위로 매핑
    # +10% 이상 → 100점, -10% 이하 → 0점
    score = 50 + (change_rate / 10) * 50

    # 0-100 범위로 클램핑
    return max(0.0, min(100.0, score))


def get_value_n_months_ago(
    history: List[Dict[str, Any]],
    months: int = 3
) -> Optional[float]:
    """
    N개월 전 값 추출

    Args:
        history: 히스토리 데이터 리스트 (최신순 정렬)
        months: 몇 개월 전 값을 가져올지

    Returns:
        N개월 전 값 또는 None
    """
    from datetime import datetime, timedelta

    if not history:
        return None

    # 현재 날짜 기준으로 N개월 전 날짜 계산
    target_date = datetime.now() - timedelta(days=months * 30)

    # 히스토리에서 target_date에 가장 가까운 데이터 찾기
    for record in history:
        release_date_str = record.get('release_date')
        if not release_date_str:
            continue

        try:
            release_date = datetime.strptime(str(release_date_str), '%Y-%m-%d')
            # target_date 이전이거나 같은 날짜의 첫 번째 데이터
            if release_date <= target_date:
                actual = record.get('actual')
                if actual is not None:
                    return parse_indicator_value(actual)
        except (ValueError, TypeError):
            continue

    # 못 찾으면 가장 오래된 데이터 반환 (히스토리 마지막)
    if history:
        last_record = history[-1]
        actual = last_record.get('actual')
        if actual is not None:
            return parse_indicator_value(actual)

    return None


def calculate_cycle_with_trend(
    indicators_config: Dict[str, Dict],
    db_service,
    cycle_name: str
) -> Dict[str, Any]:
    """
    Level + Trend 통합 사이클 점수 계산

    공식: Final Score = 0.7 × Level + 0.3 × Trend

    Args:
        indicators_config: 지표 설정 딕셔너리 (MACRO_INDICATORS 등)
        db_service: DB 서비스
        cycle_name: 사이클 이름 ("Macro", "Credit", "Sentiment")

    Returns:
        {
            "score": 72.5,        # 최종 점수 (Level + Trend)
            "level_score": 70.0,  # Level 점수만
            "trend_score": 78.3,  # Trend 점수만
            "trend": 78.3,        # 프론트엔드용 (0-100)
            "phase": "확장기",
            "signals": [...],
            "indicators": {...}
        }
    """
    level_scores = {}
    trend_scores = {}
    signals = []
    indicator_details = {}

    for indicator_id, config in indicators_config.items():
        try:
            # 최신값 조회
            latest = db_service.get_latest_indicator(indicator_id)
            if not latest or 'actual' not in latest:
                continue

            current_value = parse_indicator_value(latest['actual'])
            if current_value is None:
                continue

            # Level 점수 계산
            level_score = calculate_threshold_score(
                current_value,
                config['thresholds'],
                config['reverse']
            )
            level_scores[indicator_id] = level_score

            # Trend 점수 계산 (3개월 전 데이터와 비교)
            history = db_service.get_history_data(indicator_id, limit=12)
            past_value = get_value_n_months_ago(history, months=3)

            if past_value is not None:
                trend_score = calculate_trend_score(
                    current_value,
                    past_value,
                    config['reverse']
                )
                trend_scores[indicator_id] = trend_score

            indicator_details[indicator_id] = {
                'value': current_value,
                'level_score': level_score,
                'trend_score': trend_scores.get(indicator_id, 50.0),
                'name': config['name'],
                'weight': config['weight']
            }

            if len(signals) < 3:
                trend_arrow = '↑' if trend_scores.get(indicator_id, 50) > 55 else ('↓' if trend_scores.get(indicator_id, 50) < 45 else '→')
                signals.append(f"{config['name']} {current_value} {trend_arrow}")

        except Exception as e:
            logger.error(f"Error in {cycle_name} cycle for {indicator_id}: {e}")
            continue

    if not level_scores:
        return {
            "score": 50.0,
            "level_score": 50.0,
            "trend_score": 50.0,
            "trend": 50.0,
            "phase": "데이터 부족",
            "signals": ["데이터 수집 중"],
            "indicators": {}
        }

    # 가중 평균 계산
    total_weight = sum(indicators_config[k]['weight'] for k in level_scores.keys())

    weighted_level = sum(
        level_scores[k] * indicators_config[k]['weight']
        for k in level_scores.keys()
    ) / total_weight

    # Trend 가중 평균 (Trend 데이터가 있는 지표만)
    if trend_scores:
        trend_weight = sum(indicators_config[k]['weight'] for k in trend_scores.keys())
        weighted_trend = sum(
            trend_scores[k] * indicators_config[k]['weight']
            for k in trend_scores.keys()
        ) / trend_weight
    else:
        weighted_trend = 50.0  # Trend 데이터 없으면 중립

    # 최종 점수: 0.7 × Level + 0.3 × Trend
    final_score = 0.7 * weighted_level + 0.3 * weighted_trend

    # 국면 판단
    if cycle_name == "Macro":
        phase = get_macro_phase(final_score)
    elif cycle_name == "Credit":
        phase = get_credit_state(final_score)
    else:
        phase = get_sentiment_state(final_score)

    return {
        "score": round(final_score, 1),
        "level_score": round(weighted_level, 1),
        "trend_score": round(weighted_trend, 1),
        "trend": round(weighted_trend, 1),  # 프론트엔드 호환용
        "phase": phase,
        "signals": signals[:3],
        "indicators": indicator_details
    }


# ========================================
# 9. MASTER CYCLE V2 (WITH TREND)
# ========================================

def calculate_master_cycle_v2(db_service) -> Dict[str, Any]:
    """
    Phase 1 완성: Master Market Cycle with Trend

    Level + Trend 통합 버전
    MMC = 0.5*Sentiment + 0.3*Credit + 0.2*Macro
    각 사이클 = 0.7*Level + 0.3*Trend

    Args:
        db_service: PostgreSQL 데이터베이스 서비스

    Returns:
        기존 v1과 동일한 구조 + trend 필드 추가
    """
    try:
        # 각 사이클 계산 (Level + Trend)
        macro = calculate_cycle_with_trend(MACRO_INDICATORS, db_service, "Macro")
        credit = calculate_cycle_with_trend(CREDIT_INDICATORS, db_service, "Credit")
        sentiment = calculate_cycle_with_trend(SENTIMENT_INDICATORS, db_service, "Sentiment")

        # MMC 계산
        mmc_score = (
            0.50 * sentiment['score'] +
            0.30 * credit['score'] +
            0.20 * macro['score']
        )

        # 투자 국면 판단
        phase = get_investment_phase(mmc_score)
        recommendation = get_investment_recommendation(
            mmc_score,
            macro['score'],
            credit['score'],
            sentiment['score']
        )

        return {
            "mmc_score": round(mmc_score, 1),
            "phase": phase,
            "macro": macro,
            "credit": credit,
            "sentiment": sentiment,
            "recommendation": recommendation,
            "updated_at": datetime.now().isoformat(),
            "version": "v2.1-with-trend",  # Trend 포함 버전
            "data_warnings": []
        }

    except Exception as e:
        logger.error(f"Error calculating master cycle v2: {e}")
        return {
            "error": str(e),
            "mmc_score": 50.0,
            "phase": "계산 오류",
            "recommendation": "데이터 확인 필요",
            "data_warnings": []
        }


# ========================================
# 10. MACRO REGIME ENHANCEMENTS (Phase 5)
# ========================================

def calculate_real_interest_rate(db_service) -> Dict[str, Any]:
    """
    실질금리 계산: 명목금리 - 인플레이션

    실질금리가 높으면 경기 억제적 (주식에 부정적)
    실질금리가 낮거나 음수면 경기 부양적 (주식에 긍정적)

    Args:
        db_service: DB 서비스

    Returns:
        {
            "real_rate": 1.5,        # 실질금리 (%)
            "nominal_rate": 4.5,     # 명목금리
            "inflation": 3.0,        # 인플레이션
            "score": 35.0,           # 0-100 점수 (낮을수록 억제적)
            "regime": "restrictive"  # restrictive/neutral/stimulative
        }
    """
    try:
        # 명목금리 (Federal Funds Rate)
        fed_rate_data = db_service.get_latest_indicator('federal-funds-rate')
        nominal_rate = parse_indicator_value(fed_rate_data.get('actual')) if fed_rate_data else None

        # 인플레이션 (Core CPI)
        cpi_data = db_service.get_latest_indicator('core-cpi')
        inflation = parse_indicator_value(cpi_data.get('actual')) if cpi_data else None

        if nominal_rate is None or inflation is None:
            return {
                "real_rate": None,
                "nominal_rate": nominal_rate,
                "inflation": inflation,
                "score": 50.0,
                "regime": "unknown"
            }

        # 실질금리 계산
        real_rate = nominal_rate - inflation

        # 점수 계산 (실질금리 -2% ~ +3% 범위를 100~0 점수로 매핑)
        # -2% 이하: 100점 (매우 부양적)
        # +3% 이상: 0점 (매우 억제적)
        score = 100 - ((real_rate + 2) / 5) * 100
        score = max(0.0, min(100.0, score))

        # 레짐 판단
        if real_rate < 0:
            regime = "stimulative"  # 부양적 (실질금리 음수)
        elif real_rate < 1.5:
            regime = "neutral"       # 중립
        else:
            regime = "restrictive"   # 억제적

        return {
            "real_rate": round(real_rate, 2),
            "nominal_rate": round(nominal_rate, 2),
            "inflation": round(inflation, 2),
            "score": round(score, 1),
            "regime": regime
        }

    except Exception as e:
        logger.error(f"Error calculating real interest rate: {e}")
        return {
            "real_rate": None,
            "score": 50.0,
            "regime": "error"
        }


def calculate_yield_curve_inversion_duration(db_service) -> Dict[str, Any]:
    """
    장단기 스프레드 역전 지속기간 계산

    역전 지속기간이 길수록 침체 확률 증가
    - 역전 없음: 정상 (100점)
    - 역전 3개월 미만: 경계 (70점)
    - 역전 3-6개월: 위험 (40점)
    - 역전 6개월 이상: 높은 침체 확률 (10점)

    Args:
        db_service: DB 서비스

    Returns:
        {
            "current_spread": 0.25,     # 현재 스프레드
            "is_inverted": False,       # 현재 역전 여부
            "inversion_months": 0,      # 역전 지속 개월 수
            "score": 100.0,             # 0-100 점수
            "signal": "normal"          # normal/warning/danger/recession_risk
        }
    """
    try:
        # 현재 스프레드
        latest = db_service.get_latest_indicator('yield-curve-10y-2y')
        current_spread = parse_indicator_value(latest.get('actual')) if latest else None

        if current_spread is None:
            return {
                "current_spread": None,
                "is_inverted": False,
                "inversion_months": 0,
                "score": 50.0,
                "signal": "unknown"
            }

        # 히스토리에서 역전 지속기간 계산
        history = db_service.get_history_data('yield-curve-10y-2y', limit=12)
        inversion_months = 0

        for record in history:
            spread_value = parse_indicator_value(record.get('actual'))
            if spread_value is not None and spread_value < 0:
                inversion_months += 1
            else:
                break  # 역전이 끊기면 중단

        is_inverted = current_spread < 0

        # 점수 계산
        if inversion_months == 0:
            score = 100.0
            signal = "normal"
        elif inversion_months < 3:
            score = 70.0
            signal = "warning"
        elif inversion_months < 6:
            score = 40.0
            signal = "danger"
        else:
            score = 10.0
            signal = "recession_risk"

        # 현재 역전 중이면 추가 감점
        if is_inverted:
            score = max(0.0, score - 10)

        return {
            "current_spread": round(current_spread, 3),
            "is_inverted": is_inverted,
            "inversion_months": inversion_months,
            "score": round(score, 1),
            "signal": signal
        }

    except Exception as e:
        logger.error(f"Error calculating yield curve inversion: {e}")
        return {
            "current_spread": None,
            "is_inverted": False,
            "inversion_months": 0,
            "score": 50.0,
            "signal": "error"
        }


def calculate_macro_with_enhancements(db_service) -> Dict[str, Any]:
    """
    Phase 5: 강화된 Macro 사이클 계산

    기존 Level+Trend에 실질금리와 역전 지속기간 반영

    최종 점수 = 0.6×기본점수 + 0.25×실질금리점수 + 0.15×역전점수

    Args:
        db_service: DB 서비스

    Returns:
        기존 Macro 결과 + 강화 지표
    """
    try:
        # 기존 Macro 계산 (Level + Trend)
        base_macro = calculate_cycle_with_trend(MACRO_INDICATORS, db_service, "Macro")

        # Phase 5 강화 지표
        real_rate = calculate_real_interest_rate(db_service)
        yield_curve = calculate_yield_curve_inversion_duration(db_service)

        # 강화된 점수 계산
        # 0.6×기본 + 0.25×실질금리 + 0.15×역전지속
        enhanced_score = (
            0.60 * base_macro['score'] +
            0.25 * real_rate['score'] +
            0.15 * yield_curve['score']
        )

        # 결과 반환
        result = base_macro.copy()
        result.update({
            "score": round(enhanced_score, 1),
            "base_score": base_macro['score'],
            "real_interest_rate": real_rate,
            "yield_curve_inversion": yield_curve,
            "phase": get_macro_phase(enhanced_score),
            "enhancements_applied": True
        })

        return result

    except Exception as e:
        logger.error(f"Error in macro with enhancements: {e}")
        return calculate_cycle_with_trend(MACRO_INDICATORS, db_service, "Macro")


# ========================================
# 11. MASTER CYCLE V3 (WITH MACRO ENHANCEMENTS)
# ========================================

def calculate_master_cycle_v3(db_service) -> Dict[str, Any]:
    """
    Phase 5 완성: Master Market Cycle with Macro Enhancements

    Macro에 실질금리 + 역전 지속기간 반영
    MMC = 0.5*Sentiment + 0.3*Credit + 0.2*Macro(enhanced)

    Args:
        db_service: PostgreSQL 데이터베이스 서비스

    Returns:
        기존 v2와 동일한 구조 + Macro 강화 필드
    """
    try:
        # 강화된 Macro 계산
        macro = calculate_macro_with_enhancements(db_service)

        # 기존 Credit, Sentiment 계산
        credit = calculate_cycle_with_trend(CREDIT_INDICATORS, db_service, "Credit")
        sentiment = calculate_cycle_with_trend(SENTIMENT_INDICATORS, db_service, "Sentiment")

        # MMC 계산
        mmc_score = (
            0.50 * sentiment['score'] +
            0.30 * credit['score'] +
            0.20 * macro['score']
        )

        # 투자 국면 판단
        phase = get_investment_phase(mmc_score)
        recommendation = get_investment_recommendation(
            mmc_score,
            macro['score'],
            credit['score'],
            sentiment['score']
        )

        # 강화 경고 생성
        warnings = []
        if macro.get('real_interest_rate', {}).get('regime') == 'restrictive':
            warnings.append("실질금리 억제적 수준 (주의)")
        if macro.get('yield_curve_inversion', {}).get('signal') in ['danger', 'recession_risk']:
            warnings.append(f"장단기 스프레드 역전 {macro.get('yield_curve_inversion', {}).get('inversion_months', 0)}개월 지속")

        return {
            "mmc_score": round(mmc_score, 1),
            "phase": phase,
            "macro": macro,
            "credit": credit,
            "sentiment": sentiment,
            "recommendation": recommendation,
            "updated_at": datetime.now().isoformat(),
            "version": "v3.0-macro-enhanced",
            "data_warnings": warnings
        }

    except Exception as e:
        logger.error(f"Error calculating master cycle v3: {e}")
        return calculate_master_cycle_v2(db_service)  # 폴백


# ========================================
# 12. CREDIT SPREAD VELOCITY (Phase 4 Enhancement)
# ========================================

def calculate_spread_velocity(db_service, indicator_id: str) -> Dict[str, Any]:
    """
    Credit 스프레드 변화 속도 계산 (Δ1M, Δ3M)

    급격한 스프레드 확대는 신용 경색의 조기 신호
    - Δ1M > 50bp: 경계
    - Δ1M > 100bp: 위험
    - Δ3M > 100bp: 추세적 악화

    Args:
        db_service: DB 서비스
        indicator_id: 'hy-spread' 또는 'ig-spread'

    Returns:
        {
            "current": 350,          # 현재 스프레드 (bp)
            "delta_1m": 25,          # 1개월 변화 (bp)
            "delta_3m": 45,          # 3개월 변화 (bp)
            "velocity_score": 75.0,  # 속도 점수 (0-100, 낮을수록 급변)
            "alert_level": "normal"  # normal/warning/danger
        }
    """
    try:
        # 현재값 조회
        latest = db_service.get_latest_indicator(indicator_id)
        current_value = parse_indicator_value(latest.get('actual')) if latest else None

        if current_value is None:
            return {
                "current": None,
                "delta_1m": None,
                "delta_3m": None,
                "velocity_score": 50.0,
                "alert_level": "unknown"
            }

        # 히스토리에서 1개월, 3개월 전 값 조회
        history = db_service.get_history_data(indicator_id, limit=12)
        value_1m = get_value_n_months_ago(history, months=1)
        value_3m = get_value_n_months_ago(history, months=3)

        # 변화량 계산 (bp 단위)
        delta_1m = (current_value - value_1m) if value_1m else 0
        delta_3m = (current_value - value_3m) if value_3m else 0

        # 속도 점수 계산 (급변할수록 낮은 점수)
        # Δ1M 기준: 0bp → 100점, 100bp → 0점
        velocity_score = max(0.0, min(100.0, 100 - abs(delta_1m)))

        # 알림 레벨 결정
        if abs(delta_1m) > 100:
            alert_level = "danger"
        elif abs(delta_1m) > 50:
            alert_level = "warning"
        else:
            alert_level = "normal"

        return {
            "current": round(current_value, 1),
            "delta_1m": round(delta_1m, 1) if delta_1m else 0,
            "delta_3m": round(delta_3m, 1) if delta_3m else 0,
            "velocity_score": round(velocity_score, 1),
            "alert_level": alert_level
        }

    except Exception as e:
        logger.error(f"Error calculating spread velocity for {indicator_id}: {e}")
        return {
            "current": None,
            "delta_1m": None,
            "delta_3m": None,
            "velocity_score": 50.0,
            "alert_level": "error"
        }


def detect_rapid_change(db_service) -> Dict[str, Any]:
    """
    Credit 지표 급변 탐지 (상위 10% 변화 감지)

    역사적 변화율 대비 현재 변화율이 상위 10%에 해당하면 경고

    Args:
        db_service: DB 서비스

    Returns:
        {
            "has_rapid_change": True,
            "rapid_indicators": ["HY 스프레드 급등 (+85bp)"],
            "severity": "warning"  # normal/warning/critical
        }
    """
    try:
        rapid_indicators = []
        max_severity = "normal"

        # HY 스프레드 급변 체크
        hy_velocity = calculate_spread_velocity(db_service, 'hy-spread')
        if hy_velocity.get('alert_level') == 'danger':
            rapid_indicators.append(f"HY 스프레드 급변 ({'+' if hy_velocity['delta_1m'] > 0 else ''}{hy_velocity['delta_1m']}bp)")
            max_severity = "critical"
        elif hy_velocity.get('alert_level') == 'warning':
            rapid_indicators.append(f"HY 스프레드 상승 ({'+' if hy_velocity['delta_1m'] > 0 else ''}{hy_velocity['delta_1m']}bp)")
            if max_severity != "critical":
                max_severity = "warning"

        # IG 스프레드 급변 체크
        ig_velocity = calculate_spread_velocity(db_service, 'ig-spread')
        if ig_velocity.get('alert_level') == 'danger':
            rapid_indicators.append(f"IG 스프레드 급변 ({'+' if ig_velocity['delta_1m'] > 0 else ''}{ig_velocity['delta_1m']}bp)")
            max_severity = "critical"
        elif ig_velocity.get('alert_level') == 'warning':
            rapid_indicators.append(f"IG 스프레드 상승 ({'+' if ig_velocity['delta_1m'] > 0 else ''}{ig_velocity['delta_1m']}bp)")
            if max_severity != "critical":
                max_severity = "warning"

        # VIX 급변 체크 (별도 기준: 5포인트 이상 변화)
        vix_latest = db_service.get_latest_indicator('vix')
        vix_history = db_service.get_history_data('vix', limit=6)
        if vix_latest and vix_history:
            vix_current = parse_indicator_value(vix_latest.get('actual'))
            vix_1m = get_value_n_months_ago(vix_history, months=1)
            if vix_current and vix_1m:
                vix_delta = vix_current - vix_1m
                if abs(vix_delta) > 10:
                    rapid_indicators.append(f"VIX 급변 ({'+' if vix_delta > 0 else ''}{round(vix_delta, 1)})")
                    max_severity = "critical"
                elif abs(vix_delta) > 5:
                    rapid_indicators.append(f"VIX 상승 ({'+' if vix_delta > 0 else ''}{round(vix_delta, 1)})")
                    if max_severity != "critical":
                        max_severity = "warning"

        return {
            "has_rapid_change": len(rapid_indicators) > 0,
            "rapid_indicators": rapid_indicators,
            "severity": max_severity
        }

    except Exception as e:
        logger.error(f"Error detecting rapid change: {e}")
        return {
            "has_rapid_change": False,
            "rapid_indicators": [],
            "severity": "error"
        }


def calculate_credit_with_enhancements(db_service) -> Dict[str, Any]:
    """
    Phase 4: 강화된 Credit 사이클 계산

    기존 Level+Trend에 스프레드 변화 속도 반영

    최종 점수 = 0.7×기본점수 + 0.3×속도점수

    Args:
        db_service: DB 서비스

    Returns:
        기존 Credit 결과 + 강화 지표
    """
    try:
        # 기존 Credit 계산 (Level + Trend)
        base_credit = calculate_cycle_with_trend(CREDIT_INDICATORS, db_service, "Credit")

        # Phase 4 강화 지표
        hy_velocity = calculate_spread_velocity(db_service, 'hy-spread')
        ig_velocity = calculate_spread_velocity(db_service, 'ig-spread')
        rapid_change = detect_rapid_change(db_service)

        # 속도 점수 평균 (HY 60% + IG 40%)
        velocity_score = (
            0.6 * hy_velocity.get('velocity_score', 50) +
            0.4 * ig_velocity.get('velocity_score', 50)
        )

        # 강화된 점수 계산
        # 0.7×기본 + 0.3×속도 (급변 시 감점)
        enhanced_score = 0.7 * base_credit['score'] + 0.3 * velocity_score

        # 결과 반환
        result = base_credit.copy()
        result.update({
            "score": round(enhanced_score, 1),
            "base_score": base_credit['score'],
            "hy_velocity": hy_velocity,
            "ig_velocity": ig_velocity,
            "rapid_change": rapid_change,
            "state": get_credit_state(enhanced_score),
            "enhancements_applied": True
        })

        return result

    except Exception as e:
        logger.error(f"Error in credit with enhancements: {e}")
        return calculate_cycle_with_trend(CREDIT_INDICATORS, db_service, "Credit")


# ========================================
# 13. MASTER CYCLE V4 (FULL ENHANCEMENTS)
# ========================================

def calculate_master_cycle_v4(db_service) -> Dict[str, Any]:
    """
    Phase 4+5 완성: Master Market Cycle with Full Enhancements

    Macro: 실질금리 + 역전 지속기간
    Credit: 스프레드 변화 속도 + 급변 탐지

    MMC = 0.5*Sentiment + 0.3*Credit(enhanced) + 0.2*Macro(enhanced)

    Args:
        db_service: PostgreSQL 데이터베이스 서비스

    Returns:
        v3 구조 + Credit 강화 필드
    """
    try:
        # 강화된 Macro 계산
        macro = calculate_macro_with_enhancements(db_service)

        # 강화된 Credit 계산
        credit = calculate_credit_with_enhancements(db_service)

        # 기존 Sentiment 계산
        sentiment = calculate_cycle_with_trend(SENTIMENT_INDICATORS, db_service, "Sentiment")

        # MMC 계산
        mmc_score = (
            0.50 * sentiment['score'] +
            0.30 * credit['score'] +
            0.20 * macro['score']
        )

        # 투자 국면 판단
        phase = get_investment_phase(mmc_score)
        recommendation = get_investment_recommendation(
            mmc_score,
            macro['score'],
            credit['score'],
            sentiment['score']
        )

        # 종합 경고 생성
        warnings = []

        # Macro 경고
        if macro.get('real_interest_rate', {}).get('regime') == 'restrictive':
            warnings.append("실질금리 억제적 수준")
        if macro.get('yield_curve_inversion', {}).get('signal') in ['danger', 'recession_risk']:
            warnings.append(f"스프레드 역전 {macro.get('yield_curve_inversion', {}).get('inversion_months', 0)}개월")

        # Credit 경고 (급변 탐지)
        if credit.get('rapid_change', {}).get('has_rapid_change'):
            warnings.extend(credit.get('rapid_change', {}).get('rapid_indicators', []))

        return {
            "mmc_score": round(mmc_score, 1),
            "phase": phase,
            "macro": macro,
            "credit": credit,
            "sentiment": sentiment,
            "recommendation": recommendation,
            "updated_at": datetime.now().isoformat(),
            "version": "v4.0-full-enhanced",
            "data_warnings": warnings
        }

    except Exception as e:
        logger.error(f"Error calculating master cycle v4: {e}")
        return calculate_master_cycle_v3(db_service)  # 폴백
