"""AI briefing generation and cache service for indicators."""

from __future__ import annotations

import hashlib
import json
import os
import time
from datetime import datetime
from typing import Any, Dict, List, Optional

import requests

from crawlers.indicators_config import get_all_enabled_indicators, get_indicator_config

CATEGORY_LABELS = {
    "business": "경기",
    "employment": "고용",
    "interest": "금리",
    "trade": "무역",
    "inflation": "물가",
    "credit": "신용",
    "sentiment": "심리",
}

LATEST_CACHE_KEY = "indicators:briefing:v2:latest"
BY_SIGNATURE_PREFIX = "indicators:briefing:v2:sig:"
CACHE_TTL_SECONDS = 24 * 60 * 60

_IN_MEMORY_CACHE: Dict[str, Any] = {
    "latest": None,
    "signature": None,
    "ts": 0,
}


def _to_float(value: Any) -> Optional[float]:
    if value is None:
        return None
    if isinstance(value, (int, float)):
        return float(value)
    try:
        text = str(value).replace("%", "").replace("K", "000").replace(",", "").strip()
        return float(text)
    except Exception:
        return None


def _extract_output_text(response_json: Dict[str, Any]) -> Optional[str]:
    output_text = response_json.get("output_text")
    if output_text:
        return output_text

    output = response_json.get("output", [])
    for item in output:
        for content in item.get("content", []):
            if content.get("type") == "output_text" and content.get("text"):
                return content.get("text")
    return None


def _category_rate_implication(category: str, avg_surprise: Optional[float]) -> str:
    if category == "business":
        if avg_surprise is not None and avg_surprise < 0:
            return "경기 둔화 신호로 금리 인하 기대가 강화될 수 있습니다."
        return "경기 견조 흐름이면 고금리 유지 압력이 남을 수 있습니다."

    if category == "employment":
        if avg_surprise is not None and avg_surprise > 0:
            return "고용이 예상보다 강하면 인하 속도가 늦어질 수 있습니다."
        return "고용 둔화가 누적되면 금리 인하 여지가 커질 수 있습니다."

    if category == "inflation":
        if avg_surprise is not None and avg_surprise > 0:
            return "물가 상방 리스크가 남아 금리 인하 전환이 지연될 수 있습니다."
        return "물가 안정 흐름이면 금리 인하 기대가 강화될 수 있습니다."

    if category == "interest":
        return "실질금리와 커브 흐름에 따라 완화 전환 기대가 크게 변동할 수 있습니다."

    if category == "trade":
        return "달러/무역 둔화는 연준의 완화 기대를 높이는 요인이 될 수 있습니다."

    if category == "credit":
        return "신용 스프레드 확대 시 유동성 공급과 금리 인하 기대가 커질 수 있습니다."

    return "심리 악화가 확대되면 완화 기대가 커지고, 과열 시에는 긴축 경계가 강화됩니다."


def _build_indicator_rows(db_service) -> List[Dict[str, Any]]:
    enabled = get_all_enabled_indicators()
    indicator_ids = [
        indicator_id
        for indicator_id, config in enabled.items()
        if not getattr(config, "manual_check", False)
    ]

    if hasattr(db_service, "get_multiple_indicators_data"):
        all_data = db_service.get_multiple_indicators_data(indicator_ids)
    else:
        all_data = {indicator_id: db_service.get_indicator_data(indicator_id) for indicator_id in indicator_ids}

    if hasattr(db_service, "get_multiple_history_data"):
        all_history = db_service.get_multiple_history_data(indicator_ids, limit=3)
    else:
        all_history = {indicator_id: db_service.get_history_data(indicator_id, limit=3) for indicator_id in indicator_ids}

    rows: List[Dict[str, Any]] = []
    for indicator_id in indicator_ids:
        metadata = get_indicator_config(indicator_id)
        if not metadata:
            continue

        payload = all_data.get(indicator_id, {}) if isinstance(all_data, dict) else {}
        latest = payload.get("latest_release", {}) if isinstance(payload, dict) else {}
        history = all_history.get(indicator_id, []) if isinstance(all_history, dict) else []

        actual = latest.get("actual")
        forecast = latest.get("forecast")
        previous = latest.get("previous")
        actual_num = _to_float(actual)
        forecast_num = _to_float(forecast)

        surprise = None
        if actual_num is not None and forecast_num is not None:
            surprise = round(actual_num - forecast_num, 3)

        rows.append({
            "indicator_id": indicator_id,
            "name": metadata.name,
            "name_ko": metadata.name_ko,
            "category": metadata.category,
            "actual": actual,
            "forecast": forecast,
            "previous": previous,
            "release_date": latest.get("release_date"),
            "surprise": surprise,
            "history": history[:3],
        })

    return rows


def _signature_from_rows(rows: List[Dict[str, Any]]) -> str:
    compact = []
    for row in rows:
        compact.append({
            "id": row.get("indicator_id"),
            "actual": row.get("actual"),
            "forecast": row.get("forecast"),
            "previous": row.get("previous"),
            "release_date": row.get("release_date"),
        })
    compact = sorted(compact, key=lambda x: x.get("id") or "")
    payload = json.dumps(compact, ensure_ascii=False, sort_keys=True)
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


def _build_category_summary(rows: List[Dict[str, Any]]) -> Dict[str, Dict[str, Any]]:
    grouped: Dict[str, List[Dict[str, Any]]] = {key: [] for key in CATEGORY_LABELS.keys()}
    for row in rows:
        category = row.get("category")
        if category in grouped:
            grouped[category].append(row)

    summary: Dict[str, Dict[str, Any]] = {}
    for category, category_rows in grouped.items():
        surprises = [r["surprise"] for r in category_rows if r.get("surprise") is not None]
        missing = sum(1 for r in category_rows if r.get("actual") in (None, "", "-"))
        avg_surprise = round(sum(surprises) / len(surprises), 3) if surprises else None

        if avg_surprise is None:
            one_liner = f"{CATEGORY_LABELS[category]} 지표는 방향 신호가 제한적입니다."
        elif avg_surprise > 0:
            one_liner = f"{CATEGORY_LABELS[category]} 지표는 예상 대비 개선 흐름입니다."
        elif avg_surprise < 0:
            one_liner = f"{CATEGORY_LABELS[category]} 지표는 예상 대비 둔화 신호입니다."
        else:
            one_liner = f"{CATEGORY_LABELS[category]} 지표는 예상과 유사한 흐름입니다."

        summary[category] = {
            "label": CATEGORY_LABELS[category],
            "count": len(category_rows),
            "missing_count": missing,
            "avg_surprise": avg_surprise,
            "one_liner": one_liner,
            "rate_implication": _category_rate_implication(category, avg_surprise),
            "indicators": category_rows[:8],
        }

    return summary


def _fallback_briefing(category_summary: Dict[str, Dict[str, Any]]) -> Dict[str, Any]:
    category_briefings = {}
    caution_labels = []

    for category, payload in category_summary.items():
        risk = "neutral"
        avg_surprise = payload.get("avg_surprise")
        if isinstance(avg_surprise, (int, float)) and avg_surprise < 0:
            risk = "caution"
            caution_labels.append(payload["label"])
        elif isinstance(avg_surprise, (int, float)) and avg_surprise > 0:
            risk = "positive"

        category_briefings[category] = {
            "label": payload["label"],
            "summary": payload["one_liner"],
            "rate_implication": payload["rate_implication"],
            "risk_level": risk,
            "signals": [
                f"유효 지표 {payload['count']}개",
                f"누락 지표 {payload['missing_count']}개",
            ],
        }

    if caution_labels:
        overall = f"둔화/경계 신호는 {', '.join(caution_labels[:3])}에서 우세합니다."
    else:
        overall = "카테고리 전반은 중립~개선 흐름이며 급격한 악화 신호는 제한적입니다."

    return {
        "source": "fallback",
        "overall_summary": overall,
        "category_briefings": category_briefings,
    }


def _openai_briefing(category_summary: Dict[str, Dict[str, Any]]) -> Dict[str, Any]:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return _fallback_briefing(category_summary)

    schema = {
        "type": "object",
        "properties": {
            "overall_summary": {"type": "string"},
            "category_briefings": {
                "type": "object",
                "properties": {
                    key: {
                        "type": "object",
                        "properties": {
                            "label": {"type": "string"},
                            "summary": {"type": "string"},
                            "rate_implication": {"type": "string"},
                            "risk_level": {"type": "string", "enum": ["positive", "neutral", "caution", "unknown"]},
                            "signals": {"type": "array", "items": {"type": "string"}},
                        },
                        "required": ["label", "summary", "rate_implication", "risk_level", "signals"],
                        "additionalProperties": False,
                    }
                    for key in CATEGORY_LABELS.keys()
                },
                "required": list(CATEGORY_LABELS.keys()),
                "additionalProperties": False,
            },
        },
        "required": ["overall_summary", "category_briefings"],
        "additionalProperties": False,
    }

    prompt = (
        "당신은 매크로 브리핑 애널리스트입니다."
        "다음 카테고리 요약을 바탕으로 카테고리별 브리핑과 종합 브리핑을 한국어로 작성하세요."
        "모든 카테고리에 금리 시사점을 반드시 포함하세요."
        f"\n입력:\n{json.dumps(category_summary, ensure_ascii=False)}"
    )

    request_payload = {
        "model": "gpt-4o-mini",
        "input": prompt,
        "text": {
            "format": {
                "type": "json_schema",
                "name": "indicator_briefing",
                "strict": True,
                "schema": schema,
            }
        },
        "temperature": 0.2,
        "max_output_tokens": 1200,
    }

    try:
        resp = requests.post(
            "https://api.openai.com/v1/responses",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json=request_payload,
            timeout=75,
        )
        if not resp.ok:
            return _fallback_briefing(category_summary)

        data = resp.json()
        output_text = _extract_output_text(data)
        if not output_text:
            return _fallback_briefing(category_summary)

        parsed = json.loads(output_text)
        parsed["source"] = "openai"
        return parsed
    except Exception:
        return _fallback_briefing(category_summary)


def _cache_get(redis_client, key: str) -> Optional[Dict[str, Any]]:
    if redis_client:
        try:
            raw = redis_client.get(key)
            if raw:
                return json.loads(raw)
        except Exception:
            pass
    return None


def _cache_set(redis_client, key: str, value: Dict[str, Any], ttl: int = CACHE_TTL_SECONDS) -> None:
    if redis_client:
        try:
            redis_client.setex(key, ttl, json.dumps(value, ensure_ascii=False))
        except Exception:
            pass


def get_latest_briefing(redis_client=None) -> Optional[Dict[str, Any]]:
    cached = _cache_get(redis_client, LATEST_CACHE_KEY)
    if cached:
        return cached
    return _IN_MEMORY_CACHE.get("latest")


def generate_briefing(db_service, redis_client=None, force: bool = False) -> Dict[str, Any]:
    rows = _build_indicator_rows(db_service)
    signature = _signature_from_rows(rows)

    latest_cached = get_latest_briefing(redis_client)
    if not force and latest_cached and latest_cached.get("data_signature") == signature:
        latest_cached["cached"] = True
        return latest_cached

    by_sig_key = f"{BY_SIGNATURE_PREFIX}{signature}"
    if not force:
        cached_by_sig = _cache_get(redis_client, by_sig_key)
        if cached_by_sig:
            _cache_set(redis_client, LATEST_CACHE_KEY, cached_by_sig)
            _IN_MEMORY_CACHE["latest"] = cached_by_sig
            _IN_MEMORY_CACHE["signature"] = signature
            _IN_MEMORY_CACHE["ts"] = time.time()
            cached_by_sig["cached"] = True
            return cached_by_sig

    category_summary = _build_category_summary(rows)
    generated = _openai_briefing(category_summary)
    result = {
        "status": "success",
        "generated_at": datetime.now().isoformat(),
        "data_signature": signature,
        "source": generated.get("source", "fallback"),
        "overall_summary": generated.get("overall_summary"),
        "category_briefings": generated.get("category_briefings", {}),
        "category_summary": category_summary,
        "cached": False,
    }

    _cache_set(redis_client, LATEST_CACHE_KEY, result)
    _cache_set(redis_client, by_sig_key, result)
    _IN_MEMORY_CACHE["latest"] = result
    _IN_MEMORY_CACHE["signature"] = signature
    _IN_MEMORY_CACHE["ts"] = time.time()

    return result
