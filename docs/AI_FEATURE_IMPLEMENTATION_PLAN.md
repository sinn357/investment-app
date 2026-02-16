# AI 기능 구현 및 데이터 소스 전환 계획

> **목적**: 경제지표 페이지에 OpenAI API 기반 AI 분석 기능 추가 및 크롤링 안정화
> **작성일**: 2026-02-09
> **담당**: X (Codex) - 구현 / Arch (Claude) - 설계

---

## 1. 현재 상황 분석

### 1.1 데이터 소스 현황

| 상태 | 지표 수 | 소스 | 비고 |
|------|---------|------|------|
| ✅ 정상 | 19개 | FRED API, BEA API, TradingEconomics | 안정적 |
| ❌ 실패 | 28개 | Investing.com | 403 차단 (Render IP 차단) |

### 1.2 정상 작동 지표 목록 (19개)

**FRED API 기반 (8개)**:
- `cpi` → CPIAUCSL (YoY 계산)
- `core-cpi` → CPILFESL (YoY 계산)
- `ppi` → PPIACO (YoY 계산)
- `unemployment-rate` → UNRATE
- `participation-rate` → CIVPART
- `michigan-sentiment` → UMCSENT
- `industrial-production-yoy` → INDPRO (YoY 계산)
- `retail-sales-yoy` → RSAFS (YoY 계산)

**BEA API 기반 (1개)**:
- `current-account-balance` → ITA 데이터셋

**TradingEconomics 기반 (1개)**:
- `terms-of-trade` → 표준 테이블 파싱

**기타 안정적 소스 (9개)**:
- ISM Manufacturing/Non-Manufacturing PMI
- GDP 관련 지표
- 금리 관련 지표 (rates-bonds 크롤러)

### 1.3 문제 있는 지표 (Investing.com 차단)

**고용 관련**:
- Nonfarm Payrolls
- Initial Jobless Claims
- Average Hourly Earnings (MoM, YoY)

**물가 관련**:
- Core PCE Price Index

**무역 관련**:
- Trade Balance

**기타**:
- Consumer Confidence
- 다수의 Investing.com economic-calendar 지표들

---

## 2. Phase 1: FRED API 추가 전환 (5개 지표)

### 2.1 전환 대상 지표

| 현재 지표 ID | FRED Series ID | 설명 | 처리 방식 |
|-------------|----------------|------|-----------|
| `nonfarm-payrolls` | `PAYEMS` | 비농업 고용자 수 (천명) | MoM 변화 계산 |
| `initial-jobless-claims` | `ICSA` | 신규 실업수당 청구 | 그대로 사용 |
| `avg-hourly-earnings` | `CES0500000003` | 평균 시간당 임금 | MoM 변화 계산 |
| `trade-balance` | `BOPGSTB` | 상품+서비스 무역수지 | 그대로 사용 (백만$) |
| `consumer-confidence` | `UMCSENT` | 미시간 소비자심리 | 이미 완료 (중복 확인) |

### 2.2 백엔드 수정 사항

**파일**: `backend/crawlers/indicators_config.py`

```python
# 추가할 설정
{
    'id': 'nonfarm-payrolls',
    'name': 'Nonfarm Payrolls',
    'url': 'https://fred.stlouisfed.org/series/PAYEMS',
    'source': 'fred',
    'fred_series': 'PAYEMS',
    'calculate_mom': True,  # MoM 변화 계산 필요
    'unit': 'K',  # 천명 단위
    'category': 'employment',
    'reverse_color': False,  # 높을수록 좋음
},
{
    'id': 'initial-jobless-claims',
    'name': 'Initial Jobless Claims',
    'url': 'https://fred.stlouisfed.org/series/ICSA',
    'source': 'fred',
    'fred_series': 'ICSA',
    'calculate_mom': False,
    'unit': 'K',
    'category': 'employment',
    'reverse_color': True,  # 낮을수록 좋음
},
{
    'id': 'avg-hourly-earnings',
    'name': 'Average Hourly Earnings MoM',
    'url': 'https://fred.stlouisfed.org/series/CES0500000003',
    'source': 'fred',
    'fred_series': 'CES0500000003',
    'calculate_mom': True,
    'unit': '%',
    'category': 'employment',
    'reverse_color': False,
},
{
    'id': 'trade-balance',
    'name': 'Trade Balance',
    'url': 'https://fred.stlouisfed.org/series/BOPGSTB',
    'source': 'fred',
    'fred_series': 'BOPGSTB',
    'calculate_mom': False,
    'unit': 'M',  # 백만$ 단위
    'category': 'trade',
    'reverse_color': False,  # 흑자가 좋음 (양수)
},
```

**파일**: `backend/crawlers/fred_crawler.py`

```python
# calculate_mom 옵션 처리 추가 필요
def fetch_fred_data(series_id: str, config: dict) -> dict:
    """FRED API에서 데이터 가져오기"""
    api_key = os.getenv('FRED_API_KEY')
    url = f"https://api.stlouisfed.org/fred/series/observations"

    params = {
        'series_id': series_id,
        'api_key': api_key,
        'file_type': 'json',
        'sort_order': 'desc',
        'limit': 14  # 최근 14개 데이터
    }

    response = requests.get(url, params=params)
    data = response.json()

    observations = data.get('observations', [])

    if config.get('calculate_mom'):
        # MoM 변화율 계산
        return calculate_mom_change(observations)
    elif config.get('calculate_yoy'):
        # YoY 변화율 계산 (기존)
        return calculate_yoy_change(observations)
    else:
        # 원본 값 그대로
        return format_raw_data(observations)
```

### 2.3 작업 체크리스트

- [ ] `indicators_config.py`에 4개 지표 설정 추가
- [ ] `fred_crawler.py`에 `calculate_mom` 로직 추가
- [ ] `crawler_service.py`에서 새 지표 라우팅 확인
- [ ] 로컬 테스트 실행
- [ ] Render 환경변수 확인 (FRED_API_KEY)
- [ ] 배포 및 프로덕션 테스트
- [ ] 기존 Investing.com 설정 주석 처리 또는 제거

### 2.4 예상 소요 시간

- 설정 추가: 30분
- 크롤러 로직 수정: 1시간
- 테스트 및 디버깅: 1시간
- **총 예상: 2.5시간**

---

## 3. Phase 2: OpenAI API 통합 기반 구축

### 3.1 환경 설정

**파일**: `backend/.env`
```bash
# 기존
FRED_API_KEY=your_fred_api_key
BEA_API_KEY=your_bea_api_key
DATABASE_URL=postgresql://...

# 추가
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxx
```

**파일**: `backend/requirements.txt`
```
# 추가
openai>=1.0.0
```

### 3.2 OpenAI 서비스 모듈 생성

**파일**: `backend/services/openai_service.py`

```python
"""
OpenAI API 서비스 모듈
경제지표 분석 및 해석 기능 제공
"""

import os
from openai import OpenAI
from typing import Optional, Dict, Any

client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

# 모델 설정 (비용 최적화)
MODELS = {
    'fast': 'gpt-4o-mini',      # 빠르고 저렴 ($0.15/1M input, $0.60/1M output)
    'standard': 'gpt-4o',        # 표준 ($5/1M input, $15/1M output)
    'reasoning': 'o1-mini',      # 복잡한 분석용
}

def analyze_indicator(
    indicator_id: str,
    name: str,
    actual: float,
    previous: float,
    forecast: Optional[float] = None,
    surprise: Optional[float] = None,
    category: str = 'business',
    history: Optional[list] = None
) -> Dict[str, Any]:
    """
    단일 경제지표 분석

    Args:
        indicator_id: 지표 ID
        name: 지표명
        actual: 실제값
        previous: 이전값
        forecast: 예상치 (optional)
        surprise: 서프라이즈 (optional)
        category: 카테고리 (business/employment/inflation/interest/trade/policy)
        history: 최근 히스토리 데이터 (optional)

    Returns:
        분석 결과 딕셔너리
    """

    # 프롬프트 구성
    prompt = f"""당신은 전문 경제 애널리스트입니다. 다음 경제지표를 분석해주세요.

## 지표 정보
- **지표명**: {name}
- **카테고리**: {category}
- **최신값**: {actual}
- **이전값**: {previous}
- **예상치**: {forecast if forecast else '없음'}
- **서프라이즈**: {surprise if surprise else '해당없음'}

## 분석 요청
다음 형식으로 분석해주세요:

### 1. 핵심 해석 (2-3문장)
이 수치가 경제적으로 의미하는 바를 설명하세요.

### 2. 시장 영향
- 주식시장:
- 채권시장:
- 환율:

### 3. 투자자 주목 포인트
이 지표를 보고 투자자가 고려해야 할 점을 설명하세요.

### 4. 향후 전망
다음 발표 때 주목해야 할 요소를 설명하세요.

간결하고 실용적으로 작성해주세요. 한국어로 답변하세요.
"""

    try:
        response = client.chat.completions.create(
            model=MODELS['fast'],  # gpt-4o-mini 사용 (비용 효율)
            messages=[
                {
                    "role": "system",
                    "content": "당신은 월스트리트 경험 20년의 수석 이코노미스트입니다. 복잡한 경제지표를 일반 투자자도 이해할 수 있게 설명합니다."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            max_tokens=800,
            temperature=0.7
        )

        return {
            'status': 'success',
            'analysis': response.choices[0].message.content,
            'model': MODELS['fast'],
            'usage': {
                'prompt_tokens': response.usage.prompt_tokens,
                'completion_tokens': response.usage.completion_tokens,
                'total_tokens': response.usage.total_tokens
            }
        }

    except Exception as e:
        return {
            'status': 'error',
            'message': str(e)
        }


def analyze_market_cycle(indicators: list) -> Dict[str, Any]:
    """
    전체 시장 사이클 종합 분석

    Args:
        indicators: 주요 지표 목록 (최소 5개 이상 권장)

    Returns:
        종합 분석 결과
    """

    # 지표 요약 문자열 생성
    indicator_summary = "\n".join([
        f"- {ind['name']}: {ind['actual']} (이전: {ind['previous']}, 변화: {ind.get('change', 'N/A')})"
        for ind in indicators
    ])

    prompt = f"""당신은 글로벌 매크로 전략가입니다. 현재 경제 상황을 종합 분석해주세요.

## 현재 주요 지표
{indicator_summary}

## 분석 요청

### 1. 현재 경제 국면 판단
- 확장기 / 정점 / 수축기 / 저점 중 어디인가요?
- 판단 근거를 설명하세요.

### 2. 3대 사이클 분석
- **거시경제 사이클**: (0-100점)
- **신용/유동성 사이클**: (0-100점)
- **심리/밸류에이션 사이클**: (0-100점)

### 3. 자산배분 권고
현재 국면에서 유리한 자산군과 불리한 자산군을 설명하세요.

### 4. 주요 리스크 요인
향후 3-6개월 내 주목해야 할 리스크를 나열하세요.

### 5. 핵심 모니터링 지표
다음 달 가장 주목해야 할 지표 3개를 선정하고 이유를 설명하세요.

한국어로 답변하세요.
"""

    try:
        response = client.chat.completions.create(
            model=MODELS['standard'],  # 종합 분석은 gpt-4o 사용
            messages=[
                {
                    "role": "system",
                    "content": "당신은 글로벌 투자은행의 수석 매크로 전략가입니다. 데이터에 기반한 객관적 분석을 제공합니다."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            max_tokens=1500,
            temperature=0.7
        )

        return {
            'status': 'success',
            'analysis': response.choices[0].message.content,
            'model': MODELS['standard'],
            'usage': {
                'prompt_tokens': response.usage.prompt_tokens,
                'completion_tokens': response.usage.completion_tokens,
                'total_tokens': response.usage.total_tokens
            }
        }

    except Exception as e:
        return {
            'status': 'error',
            'message': str(e)
        }


def get_portfolio_recommendation(
    cycle_phase: str,
    current_allocation: dict,
    risk_tolerance: str = 'moderate'
) -> Dict[str, Any]:
    """
    현재 경제 국면 기반 포트폴리오 추천

    Args:
        cycle_phase: 현재 경제 국면 (expansion/peak/contraction/trough)
        current_allocation: 현재 자산배분 {'stocks': 60, 'bonds': 30, 'cash': 10}
        risk_tolerance: 위험 성향 (conservative/moderate/aggressive)

    Returns:
        포트폴리오 조정 추천
    """

    prompt = f"""당신은 자산배분 전문가입니다.

## 현재 상황
- 경제 국면: {cycle_phase}
- 현재 배분: {current_allocation}
- 위험 성향: {risk_tolerance}

## 요청
1. 현재 배분의 문제점 (있다면)
2. 권장 배분 비율
3. 구체적인 조정 액션
4. 리밸런싱 우선순위

간결하게 한국어로 답변하세요.
"""

    try:
        response = client.chat.completions.create(
            model=MODELS['fast'],
            messages=[
                {"role": "system", "content": "CFA 자격을 가진 자산배분 전문가입니다."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=600,
            temperature=0.7
        )

        return {
            'status': 'success',
            'recommendation': response.choices[0].message.content,
            'model': MODELS['fast']
        }

    except Exception as e:
        return {
            'status': 'error',
            'message': str(e)
        }
```

### 3.3 API 엔드포인트 추가

**파일**: `backend/app.py`

```python
from services.openai_service import (
    analyze_indicator,
    analyze_market_cycle,
    get_portfolio_recommendation
)

# ============================================
# AI 분석 API 엔드포인트
# ============================================

@app.route('/api/ai/analyze-indicator', methods=['POST'])
def api_analyze_indicator():
    """단일 지표 AI 분석"""
    try:
        data = request.get_json()

        result = analyze_indicator(
            indicator_id=data.get('indicator_id'),
            name=data.get('name'),
            actual=data.get('actual'),
            previous=data.get('previous'),
            forecast=data.get('forecast'),
            surprise=data.get('surprise'),
            category=data.get('category', 'business'),
            history=data.get('history')
        )

        return jsonify(result)

    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500


@app.route('/api/ai/analyze-cycle', methods=['POST'])
def api_analyze_cycle():
    """시장 사이클 종합 분석"""
    try:
        data = request.get_json()
        indicators = data.get('indicators', [])

        if len(indicators) < 3:
            return jsonify({
                'status': 'error',
                'message': '최소 3개 이상의 지표가 필요합니다.'
            }), 400

        result = analyze_market_cycle(indicators)
        return jsonify(result)

    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500


@app.route('/api/ai/portfolio-recommendation', methods=['POST'])
def api_portfolio_recommendation():
    """포트폴리오 추천"""
    try:
        data = request.get_json()

        result = get_portfolio_recommendation(
            cycle_phase=data.get('cycle_phase', 'expansion'),
            current_allocation=data.get('current_allocation', {}),
            risk_tolerance=data.get('risk_tolerance', 'moderate')
        )

        return jsonify(result)

    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500
```

### 3.4 작업 체크리스트

- [ ] `.env`에 OPENAI_API_KEY 추가
- [ ] `requirements.txt`에 openai 패키지 추가
- [ ] `services/openai_service.py` 생성
- [ ] `app.py`에 AI 엔드포인트 추가
- [ ] 로컬 테스트
- [ ] Render 환경변수에 OPENAI_API_KEY 추가
- [ ] 배포 및 테스트

### 3.5 예상 소요 시간

- 환경 설정: 15분
- 서비스 모듈 작성: 1시간
- API 엔드포인트 추가: 30분
- 테스트 및 디버깅: 1시간
- **총 예상: 3시간**

---

## 4. Phase 3: 프론트엔드 AI 기능 통합

### 4.1 AI 분석 훅 생성

**파일**: `frontend/src/hooks/useAIAnalysis.ts`

```typescript
import { useState, useCallback } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://investment-app-backend-x166.onrender.com';

interface IndicatorAnalysis {
  status: 'success' | 'error';
  analysis?: string;
  model?: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  message?: string;
}

interface CycleAnalysis {
  status: 'success' | 'error';
  analysis?: string;
  model?: string;
  message?: string;
}

export function useAIAnalysis() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 단일 지표 분석
  const analyzeIndicator = useCallback(async (indicator: {
    indicator_id: string;
    name: string;
    actual: number | string;
    previous: number | string;
    forecast?: number | string | null;
    surprise?: number | null;
    category?: string;
  }): Promise<IndicatorAnalysis> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/api/ai/analyze-indicator`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(indicator)
      });

      const result = await response.json();
      setLoading(false);
      return result;

    } catch (err) {
      const message = err instanceof Error ? err.message : '분석 중 오류 발생';
      setError(message);
      setLoading(false);
      return { status: 'error', message };
    }
  }, []);

  // 시장 사이클 종합 분석
  const analyzeCycle = useCallback(async (indicators: Array<{
    name: string;
    actual: number | string;
    previous: number | string;
    change?: string;
  }>): Promise<CycleAnalysis> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/api/ai/analyze-cycle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ indicators })
      });

      const result = await response.json();
      setLoading(false);
      return result;

    } catch (err) {
      const message = err instanceof Error ? err.message : '분석 중 오류 발생';
      setError(message);
      setLoading(false);
      return { status: 'error', message };
    }
  }, []);

  return {
    analyzeIndicator,
    analyzeCycle,
    loading,
    error
  };
}
```

### 4.2 AI 분석 모달 컴포넌트

**파일**: `frontend/src/components/AIAnalysisModal.tsx`

```tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAIAnalysis } from '@/hooks/useAIAnalysis';
import { Loader2, Sparkles, RefreshCw } from 'lucide-react';

interface AIAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  indicator: {
    id: string;
    name: string;
    actual: number | string | null;
    previous: number | string;
    forecast?: number | string | null;
    surprise?: number | null;
    category?: string;
  } | null;
}

export default function AIAnalysisModal({ isOpen, onClose, indicator }: AIAnalysisModalProps) {
  const { analyzeIndicator, loading, error } = useAIAnalysis();
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [tokenUsage, setTokenUsage] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen && indicator && !analysis) {
      handleAnalyze();
    }
  }, [isOpen, indicator]);

  const handleAnalyze = async () => {
    if (!indicator) return;

    setAnalysis(null);
    const result = await analyzeIndicator({
      indicator_id: indicator.id,
      name: indicator.name,
      actual: indicator.actual ?? 0,
      previous: indicator.previous,
      forecast: indicator.forecast,
      surprise: indicator.surprise,
      category: indicator.category
    });

    if (result.status === 'success') {
      setAnalysis(result.analysis || null);
      setTokenUsage(result.usage?.total_tokens || null);
    }
  };

  const handleClose = () => {
    setAnalysis(null);
    setTokenUsage(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            AI 분석: {indicator?.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* 지표 요약 */}
          {indicator && (
            <div className="flex flex-wrap gap-2 p-3 bg-muted/50 rounded-lg">
              <Badge variant="outline">현재: {indicator.actual}</Badge>
              <Badge variant="outline">이전: {indicator.previous}</Badge>
              {indicator.forecast && (
                <Badge variant="outline">예상: {indicator.forecast}</Badge>
              )}
              {indicator.surprise !== null && indicator.surprise !== undefined && (
                <Badge variant={indicator.surprise > 0 ? 'default' : 'destructive'}>
                  서프라이즈: {indicator.surprise > 0 ? '+' : ''}{indicator.surprise}
                </Badge>
              )}
            </div>
          )}

          {/* 로딩 상태 */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">AI가 분석 중입니다...</p>
            </div>
          )}

          {/* 에러 상태 */}
          {error && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-destructive">{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAnalyze}
                className="mt-2"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                다시 시도
              </Button>
            </div>
          )}

          {/* 분석 결과 */}
          {analysis && (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <div
                className="whitespace-pre-wrap text-sm leading-relaxed"
                dangerouslySetInnerHTML={{
                  __html: analysis
                    .replace(/### /g, '<h3 class="text-lg font-semibold mt-4 mb-2">')
                    .replace(/## /g, '<h2 class="text-xl font-bold mt-6 mb-3">')
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    .replace(/- /g, '• ')
                }}
              />
            </div>
          )}

          {/* 토큰 사용량 */}
          {tokenUsage && (
            <div className="text-xs text-muted-foreground text-right">
              토큰 사용: {tokenUsage.toLocaleString()}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

### 4.3 IndicatorGrid에 AI 버튼 추가

**파일**: `frontend/src/components/IndicatorGrid.tsx` (수정)

```tsx
// 기존 import에 추가
import AIAnalysisModal from './AIAnalysisModal';
import { Sparkles } from 'lucide-react';

// 컴포넌트 내부에 추가
const [aiModalOpen, setAiModalOpen] = useState(false);
const [selectedForAI, setSelectedForAI] = useState<GridIndicator | null>(null);

const handleAIAnalysis = (indicator: GridIndicator) => {
  setSelectedForAI(indicator);
  setAiModalOpen(true);
};

// 카드 렌더링 부분에 AI 버튼 추가
<Button
  variant="ghost"
  size="sm"
  onClick={(e) => {
    e.stopPropagation();
    handleAIAnalysis(indicator);
  }}
  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
>
  <Sparkles className="w-4 h-4" />
</Button>

// 컴포넌트 return 마지막에 모달 추가
<AIAnalysisModal
  isOpen={aiModalOpen}
  onClose={() => setAiModalOpen(false)}
  indicator={selectedForAI}
/>
```

### 4.4 작업 체크리스트

- [ ] `hooks/useAIAnalysis.ts` 생성
- [ ] `components/AIAnalysisModal.tsx` 생성
- [ ] `IndicatorGrid.tsx`에 AI 버튼 및 모달 통합
- [ ] 스타일링 조정
- [ ] 로컬 테스트
- [ ] 배포

### 4.5 예상 소요 시간

- 훅 및 모달 컴포넌트: 2시간
- IndicatorGrid 통합: 1시간
- 스타일링 및 테스트: 1시간
- **총 예상: 4시간**

---

## 5. Phase 4: 고급 AI 기능 (선택적)

### 5.1 사이클 종합 분석 버튼

경제지표 페이지 상단에 "AI 종합 분석" 버튼 추가

**트리거**: 버튼 클릭
**입력**: 현재 표시된 주요 지표들
**출력**: 시장 사이클 종합 분석 결과

### 5.2 포트폴리오 연결 추천

투자철학 페이지나 포트폴리오 페이지에서:
- 현재 경제 국면 + 사용자 포트폴리오 = 리밸런싱 추천

### 5.3 알림 시스템

- 주요 지표 발표 시 AI 요약 알림
- 이상 신호 감지 시 경고

---

## 6. 비용 추정

### 6.1 OpenAI API 비용 (월간 추정)

| 기능 | 모델 | 요청당 비용 | 월 예상 사용 | 월 비용 |
|------|------|------------|-------------|---------|
| 지표 분석 | gpt-4o-mini | ~$0.001 | 500회 | $0.50 |
| 사이클 분석 | gpt-4o | ~$0.02 | 50회 | $1.00 |
| 포트폴리오 추천 | gpt-4o-mini | ~$0.001 | 100회 | $0.10 |
| **총계** | | | | **~$1.60/월** |

### 6.2 비용 최적화 전략

1. **캐싱**: 동일 지표 분석 결과 24시간 캐싱
2. **Rate Limiting**: 사용자당 일일 분석 횟수 제한 (예: 50회)
3. **모델 선택**: 단순 작업은 gpt-4o-mini, 복잡한 분석만 gpt-4o

---

## 7. 전체 일정 요약

| Phase | 작업 | 예상 시간 | 우선순위 |
|-------|------|----------|----------|
| 1 | FRED API 추가 전환 (5개) | 2.5시간 | 🔴 높음 |
| 2 | OpenAI 백엔드 통합 | 3시간 | 🔴 높음 |
| 3 | 프론트엔드 AI 기능 | 4시간 | 🟡 중간 |
| 4 | 고급 기능 (선택적) | 4시간+ | 🟢 낮음 |

**총 예상 시간: 9.5시간 (Phase 1-3)**

---

## 8. 테스트 시나리오

### 8.1 FRED 전환 테스트

```bash
# 로컬 테스트
curl http://localhost:5000/api/v2/indicators/nonfarm-payrolls
curl http://localhost:5000/api/v2/indicators/initial-jobless-claims

# 프로덕션 테스트
curl https://investment-app-backend-x166.onrender.com/api/v2/indicators/nonfarm-payrolls
```

### 8.2 AI 분석 테스트

```bash
# 단일 지표 분석
curl -X POST http://localhost:5000/api/ai/analyze-indicator \
  -H "Content-Type: application/json" \
  -d '{
    "indicator_id": "unemployment-rate",
    "name": "Unemployment Rate",
    "actual": 4.1,
    "previous": 4.2,
    "forecast": 4.1,
    "surprise": 0,
    "category": "employment"
  }'

# 사이클 분석
curl -X POST http://localhost:5000/api/ai/analyze-cycle \
  -H "Content-Type: application/json" \
  -d '{
    "indicators": [
      {"name": "ISM Manufacturing PMI", "actual": 52.1, "previous": 51.5},
      {"name": "Unemployment Rate", "actual": 4.1, "previous": 4.2},
      {"name": "CPI YoY", "actual": 2.8, "previous": 2.9}
    ]
  }'
```

---

## 9. 주의사항

### 9.1 보안
- OPENAI_API_KEY는 절대 프론트엔드에 노출하지 않음
- 모든 AI 호출은 백엔드를 통해서만 수행

### 9.2 에러 처리
- API 실패 시 사용자에게 명확한 피드백
- Rate limit 도달 시 재시도 로직 구현

### 9.3 사용자 경험
- AI 분석 중 로딩 상태 명확히 표시
- 분석 결과는 마크다운 형식으로 깔끔하게 렌더링

---

**문서 작성**: Arch (Claude)
**구현 담당**: X (Codex)
**최종 검토**: Partner
