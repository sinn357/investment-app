# 뉴스 & 담론 섹션 개선 Phase 1-4 구현 세션

> **작성일**: 2025-12-10
> **상태**: ✅ Phase 1-4 완료, Phase 5 대기
> **소요 시간**: 2시간 45분

---

## 📋 세션 목표

뉴스 & 담론 섹션을 Master Market Cycle과 통합하여 스마트한 담론 작성 시스템 구축

**문서 기반**: `docs/NEWS_NARRATIVE_IMPROVEMENT_PLAN.md`

**완료 Phase**:
- ✅ Phase 1: 사이클 보조 스코어 제거 + MMC 카드 추가 (30분)
- ✅ Phase 2: 지표 변화 추적 시스템 (45분)
- ✅ Phase 3: 담론 작성 가이드 (30분)
- ✅ Phase 4: RSS 뉴스 자동 수집 (1시간)

**대기 Phase**:
- ⏳ Phase 5: 과거 담론 리뷰 시스템 (45분) - **다음 세션**

---

## ✅ Phase 1: 사이클 보조 스코어 제거 + MMC 카드 (30분)

### 목표
- 수동 입력 사이클 스코어 제거
- Master Market Cycle 통합 점수 카드 추가

### 작업 내역

#### 1-1. 사이클 보조 스코어 제거

**파일**: `frontend/src/app/indicators/page.tsx`

**제거된 코드**:
- 타입 정의 제거 (130-135번 라인):
  ```typescript
  type CycleLevel = '완화' | '중립' | '긴축';
  interface CycleScoreInput { ... }
  ```
- State 제거 (169-173번 라인):
  ```typescript
  const [cycleInputs, setCycleInputs] = useState<CycleScoreInput>({ ... });
  ```
- UI 코드 제거 (569-627번 라인): 카드 전체 제거
- Import 정리: `Card`, `Select`, `Input` 컴포넌트 제거

#### 1-2. MMCScoreCard 컴포넌트 생성

**파일**: `frontend/src/components/MMCScoreCard.tsx` (신규 생성)

**구조**:
```typescript
interface MMCScoreCardProps {
  mmc_score: number;
  phase: string;
  macro: { score: number; phase: string };
  credit: { score: number; state: string };
  sentiment: { score: number; state: string };
  updated_at: string;
}
```

**UI 구성**:
- 그라데이션 배경 (primary/5 → secondary/5)
- MMC 종합 점수 (대형 숫자 + 국면)
- 3대 사이클 요약 (3칸 그리드)
- 업데이트 시간 표시

#### 1-3. indicators/page.tsx 통합

**위치**: 뉴스 섹션 바로 위

```typescript
{/* MMC 점수 카드 (뉴스 섹션 위) */}
<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
  {masterCycleData && <MMCScoreCard {...masterCycleData} />}
</div>
```

### 결과
- **커밋**: `83de4e4` - "refactor: remove manual cycle score, add MMC card"
- **변경**: 2 files changed, 58 insertions(+), 75 deletions(-)
- **생성**: `frontend/src/components/MMCScoreCard.tsx`

---

## ✅ Phase 2: 지표 변화 추적 시스템 (45분)

### 목표
- 전일 대비 주요 지표 변화 상위 5개 자동 추적
- 증가/감소/변화없음 분류 표시

### 작업 내역

#### 2-1. 백엔드 서비스 구현

**파일**: `backend/services/indicator_changes_service.py` (신규 생성, 263줄)

**핵심 기능**:
- `get_top_changes(limit=5)`: 전일 대비 변화율 계산 및 상위 N개 추출
- `_calculate_all_changes()`: 모든 지표의 변화율 계산
- `_calculate_indicator_change()`: 단일 지표 변화 계산
- `_parse_value()`: %, K 단위 처리
- `calculate_change_impact()`: 중요도 판별 (low/medium/high)

**지표별 중요도 가중치**:
```python
INDICATOR_WEIGHTS = {
    # 거시경제 사이클 (높음)
    'ism-manufacturing': 'high',
    'federal-funds-rate': 'high',
    'cpi': 'high',
    # 신용/유동성 (높음)
    'high-yield-spread': 'high',
    # 기타 (중간/낮음)
    'industrial-production': 'medium',
    ...
}
```

#### 2-2. API 엔드포인트 추가

**파일**: `backend/app.py`

**엔드포인트**: `/api/v3/indicators/changes`

**응답 구조**:
```json
{
  "status": "success",
  "data": {
    "increases": [
      {"indicator": "VIX", "from": 15.41, "to": 16.66, "change": 8.1, "impact": "high"},
      ...
    ],
    "decreases": [...],
    "unchanged": [...]
  },
  "timestamp": "2025-12-10T..."
}
```

#### 2-3. 프론트엔드 컴포넌트

**파일**: `frontend/src/components/IndicatorChanges.tsx` (신규 생성)

**UI 구성**:
- 📈 주요 지표 변화 (전일 대비)
- ↑ 상승 (초록색, from → to + 변화율%)
- ↓ 하락 (빨간색, from → to + 변화율%)
- → 변화 없음 (회색 배지)

#### 2-4. indicators/page.tsx 통합

**위치**: MMC 점수 카드 아래

**State 추가**:
```typescript
const [indicatorChanges, setIndicatorChanges] = useState<{
  increases: Array<{ indicator: string; from: number; to: number; change: number; impact: 'low' | 'medium' | 'high' }>;
  decreases: Array<{ ... }>;
  unchanged: Array<{ ... }>;
}>({ increases: [], decreases: [], unchanged: [] });
```

**API 호출** (useEffect 내):
```typescript
const changesResult = await fetchJsonWithRetry(
  'https://investment-app-backend-x166.onrender.com/api/v3/indicators/changes',
  {}, 3, 1000
);
```

### 결과
- **커밋**: `7738b20` - "feat: add indicator changes tracker"
- **변경**: 4 files changed, 387 insertions(+)
- **생성**:
  - `backend/services/indicator_changes_service.py`
  - `frontend/src/components/IndicatorChanges.tsx`

---

## ✅ Phase 3: 담론 작성 가이드 (30분)

### 목표
- MMC 데이터와 지표 변화를 활용한 질문 생성
- 펼치기/접기 UI로 담론 작성 도움

### 작업 내역

#### 3-1. NarrativeGuide 컴포넌트 생성

**파일**: `frontend/src/components/NarrativeGuide.tsx` (신규 생성)

**Props**:
```typescript
interface NarrativeGuideProps {
  mmcScore: number;
  phase: string;
  topChanges: {
    increases: string[];
    decreases: string[];
  };
}
```

**4개 카테고리 질문**:

1. **시장 상황**:
   - 현재 MMC {score}점 ({phase})을 어떻게 해석하나요?
   - 3대 사이클 중 가장 주목해야 할 부분은?
   - 이번 주 가장 중요한 경제 이벤트는?

2. **지표 분석**:
   - {increases} 상승의 의미는?
   - {decreases} 하락이 시사하는 바는?
   - 다음 달 주목해야 할 지표는?

3. **투자 전략**:
   - 현재 포트폴리오 리밸런싱이 필요한가?
   - 향후 1개월 투자 전략은?
   - 리스크 관리 포인트는?

4. **가설 검증**:
   - 지난달 담론의 예측이 맞았나?
   - 틀렸다면 어떤 변수를 놓쳤나?
   - 다음 달 검증할 가설은?

**UI**:
- 펼치기/접기 버튼
- 💡 Tip: 구체적인 숫자와 근거 기록 권장

#### 3-2. NewsNarrative 통합

**파일**: `frontend/src/components/NewsNarrative.tsx`

**Props 확장**:
```typescript
interface NewsNarrativeProps {
  // 기존
  articles: Article[];
  myNarrative: string;
  onChange: (data: { ... }) => void;
  // 추가 (Phase 3)
  mmcScore?: number;
  phase?: string;
  topChanges?: {
    increases: string[];
    decreases: string[];
  };
}
```

**위치**: "내 담론 (경제 전망)" 제목과 textarea 사이

```typescript
{mmcScore !== undefined && phase && topChanges && (
  <NarrativeGuide
    mmcScore={mmcScore}
    phase={phase}
    topChanges={topChanges}
  />
)}
```

#### 3-3. indicators/page.tsx에서 props 전달

```typescript
<NewsNarrative
  articles={narrative.articles}
  myNarrative={narrative.myNarrative}
  onChange={(data) => setNarrative({ ...narrative, ...data })}
  mmcScore={masterCycleData?.mmc_score}
  phase={masterCycleData?.phase}
  topChanges={{
    increases: indicatorChanges.increases.map(item => item.indicator),
    decreases: indicatorChanges.decreases.map(item => item.indicator)
  }}
/>
```

### 결과
- **커밋**: `f8ca310` - "feat: add narrative writing guide"
- **변경**: 3 files changed, 123 insertions(+), 1 deletion(-)
- **생성**: `frontend/src/components/NarrativeGuide.tsx`

---

## ✅ Phase 4: RSS 뉴스 자동 수집 (1시간)

### 목표
- RSS 피드에서 경제 뉴스 자동 수집
- 키워드 필터링 + 스크랩 기능

### 작업 내역

#### 4-1. feedparser 라이브러리 설치

**파일**: `backend/requirements.txt`

```
feedparser==6.0.10
```

#### 4-2. RSSNewsCrawler 구현

**파일**: `backend/crawlers/rss_news_crawler.py` (신규 생성, 131줄)

**5개 경제 뉴스 소스**:
```python
FEEDS = {
    'bloomberg': 'https://www.bloomberg.com/feed/podcast/etf-iq.xml',
    'reuters': 'https://www.reuters.com/rssFeed/businessNews',
    'cnbc': 'https://www.cnbc.com/id/100003114/device/rss/rss.html',
    'wsj': 'https://feeds.a.dj.com/rss/WSJcomUSBusiness.xml',
    'fed': 'https://www.federalreserve.gov/feeds/press_all.xml'
}
```

**경제 관련 키워드** (30개):
```python
KEYWORDS = [
    'fed', 'interest rate', 'inflation', 'cpi', 'pmi', 'employment',
    'gdp', 'recession', 'economy', 'market', 'stock', 'bond',
    'federal reserve', 'monetary policy', 'fiscal policy', 'treasury',
    'yield', 'dollar', 'trade', 'tariff', 'manufacturing'
]
```

**핵심 기능**:
- `fetch_recent_news(hours=24)`: 최근 N시간 뉴스 수집
- `_parse_date()`: RSS 날짜 파싱 (email.utils.parsedate_to_datetime)
- `_match_keywords()`: 키워드 매칭 (우선순위 처리)
- 최신순 정렬 + 최대 20개 제한

#### 4-3. API 엔드포인트 추가

**파일**: `backend/app.py`

**엔드포인트**: `/api/v3/news/auto-fetch`

**Query Parameters**:
- `hours`: 수집 기간 (기본값: 24)

**응답 구조**:
```json
{
  "status": "success",
  "data": {
    "news": [
      {
        "title": "기사 제목",
        "url": "URL",
        "summary": "요약 (200자)",
        "source": "Bloomberg",
        "published": "2025-12-10T10:00:00",
        "keyword": "fed"
      },
      ...
    ],
    "count": 10
  },
  "timestamp": "2025-12-10T..."
}
```

#### 4-4. AutoNewsPanel 컴포넌트

**파일**: `frontend/src/components/AutoNewsPanel.tsx` (신규 생성)

**UI 구성**:
- 🤖 자동 수집 뉴스 (최근 24시간)
- 🔄 새로고침 버튼 (로딩 상태 표시)
- 뉴스 카드:
  - 소스 + #키워드 배지
  - 제목 (링크)
  - 요약 (2줄 제한)
  - + 추가 버튼 (스크랩)
- 최대 높이 96 (overflow-y-auto)

**Props**:
```typescript
interface AutoNewsPanelProps {
  onAddArticle: (article: {
    title: string;
    url: string;
    summary: string;
    keyword: string
  }) => void;
}
```

#### 4-5. NewsNarrative 통합

**위치**: "스크랩한 기사" 섹션 위

```typescript
{/* 자동 수집 뉴스 섹션 (Phase 4) */}
<AutoNewsPanel
  onAddArticle={(article) => {
    onChange({
      articles: [...articles, article],
      myNarrative
    });
  }}
/>
```

### 결과
- **커밋**: `33775c1` - "feat: add RSS news auto-fetch"
- **변경**: 5 files changed, 271 insertions(+)
- **생성**:
  - `backend/crawlers/rss_news_crawler.py`
  - `frontend/src/components/AutoNewsPanel.tsx`

---

## 📊 전체 통계

### 커밋 히스토리

| 커밋 | 메시지 | 파일 변경 |
|------|--------|----------|
| `83de4e4` | refactor: remove manual cycle score, add MMC card | 2 files, +58/-75 |
| `7738b20` | feat: add indicator changes tracker | 4 files, +387/0 |
| `f8ca310` | feat: add narrative writing guide | 3 files, +123/-1 |
| `33775c1` | feat: add RSS news auto-fetch | 5 files, +271/0 |
| **합계** | **4개 커밋** | **14 files, +839/-76** |

### 생성된 파일 (7개)

**백엔드**:
1. `backend/services/indicator_changes_service.py` (263줄)
2. `backend/crawlers/rss_news_crawler.py` (131줄)

**프론트엔드**:
3. `frontend/src/components/MMCScoreCard.tsx` (52줄)
4. `frontend/src/components/IndicatorChanges.tsx` (82줄)
5. `frontend/src/components/NarrativeGuide.tsx` (105줄)
6. `frontend/src/components/AutoNewsPanel.tsx` (98줄)

**문서**:
7. `docs/2025-12-10_News_Narrative_Phase1-4.md` (이 문서)

### 수정된 파일 (7개)

**백엔드**:
1. `backend/requirements.txt` - feedparser 추가
2. `backend/app.py` - 2개 API 엔드포인트 추가

**프론트엔드**:
3. `frontend/src/app/indicators/page.tsx` - 3개 컴포넌트 통합 + API 호출
4. `frontend/src/components/NewsNarrative.tsx` - 2개 컴포넌트 통합 + props 확장

### 소요 시간

- Phase 1: 30분
- Phase 2: 45분
- Phase 3: 30분
- Phase 4: 1시간
- **총 2시간 45분**

---

## ⏳ Phase 5: 과거 담론 리뷰 시스템 (다음 세션)

### 목표
- 과거 담론 히스토리 조회
- 예측 vs 실제 비교 시스템

### 계획된 작업

#### 5-1. 담론 히스토리 조회 API

**파일**: `backend/app.py`

**엔드포인트**: `/api/economic-narrative/history`

**Query Parameters**:
- `user_id`: 사용자 ID
- `limit`: 조회 개수 (기본 10)

**응답 구조**:
```json
{
  "status": "success",
  "data": [
    {
      "date": "2025-12-01",
      "narrative": "담론 내용...",
      "articles_count": 5
    },
    ...
  ]
}
```

**PostgreSQL 쿼리**:
```sql
SELECT date, my_narrative, articles
FROM economic_narratives
WHERE user_id = %s
ORDER BY date DESC
LIMIT %s
```

#### 5-2. NarrativeReview 컴포넌트

**파일**: `frontend/src/components/NarrativeReview.tsx` (신규 생성 예정)

**UI 구성**:
- 📚 과거 담론 리뷰
- 날짜별 카드 (펼치기/접기)
- 담론 내용 + 기사 개수
- 💡 검증 포인트:
  - 당시 예측한 시장 방향이 맞았나요?
  - 주목한 지표가 실제로 중요했나요?
  - 놓친 변수는 무엇인가요?

#### 5-3. indicators/page.tsx 통합

**위치**: 페이지 하단 (빅웨이브 섹션 아래)

```typescript
{/* 과거 담론 리뷰 (Phase 5) */}
<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
  <NarrativeReview userId={userId} />
</div>
```

### 예상 소요 시간
45분

---

## 🎯 다음 세션 시작 방법

### 1. 문서 확인
```bash
# 이 문서 읽기
cat docs/2025-12-10_News_Narrative_Phase1-4.md

# 원본 계획서 확인
cat docs/NEWS_NARRATIVE_IMPROVEMENT_PLAN.md
```

### 2. 현재 상태 확인
```bash
cd /Users/woocheolshin/Documents/Vibecoding/projects/investment-app

# 최근 커밋 확인
git log --oneline -5

# Phase 1-4 커밋 확인
git show 83de4e4  # Phase 1
git show 7738b20  # Phase 2
git show f8ca310  # Phase 3
git show 33775c1  # Phase 4
```

### 3. Phase 5 작업 시작

**Step 1**: 백엔드 API 엔드포인트 추가
- 파일: `backend/app.py`
- 엔드포인트: `/api/economic-narrative/history`
- PostgreSQL 쿼리 작성

**Step 2**: NarrativeReview 컴포넌트 생성
- 파일: `frontend/src/components/NarrativeReview.tsx`
- 히스토리 조회 + 펼치기/접기 UI

**Step 3**: indicators/page.tsx 통합
- 페이지 하단에 컴포넌트 추가
- userId props 전달

**Step 4**: 테스트 및 커밋
```bash
# 빌드 테스트
npm run build --prefix frontend

# 커밋
git add .
git commit -m "feat: add past narrative review system

Phase 5 완료:
- /api/economic-narrative/history 엔드포인트
- NarrativeReview 컴포넌트 생성
- indicators/page.tsx 하단 통합
- 과거 담론 검증 시스템 완성

🤖 Generated with Claude Code
Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

### 4. 최종 문서화
```bash
# Phase 5 완료 후 최종 문서 작성
docs/2025-12-10_News_Narrative_Complete.md
```

---

## 💡 주요 의사결정

### 1. MMC 데이터 통합 방식
- **결정**: 기존 Master Cycle API 재활용
- **근거**: Phase 1에서 이미 구현된 `/api/v3/cycles/master` 활용
- **장점**: 중복 코드 제거, 일관된 데이터 소스

### 2. 지표 변화 추적 알고리즘
- **결정**: 변화율(%) 기반 정렬 + 중요도 가중치
- **근거**: 절대값보다 상대 변화가 더 의미 있음
- **장점**: 지표 크기에 무관하게 공정한 비교

### 3. RSS 크롤러 키워드 전략
- **결정**: 우선순위 키워드 + 일반 키워드 분리
- **근거**: 'fed', 'inflation' 등 핵심 키워드 먼저 매칭
- **장점**: 관련성 높은 뉴스 우선 수집

### 4. 컴포넌트 배치 순서
- **결정**: MMC 카드 → 지표 변화 → 뉴스 & 담론
- **근거**: 정보 계층 (종합 → 세부 → 실행)
- **장점**: 사용자 인지 흐름에 맞는 배치

---

## 🔍 기술적 세부사항

### 타입 안전성
- 모든 컴포넌트에 TypeScript interface 정의
- API 응답 타입 검증 (impact: 'low' | 'medium' | 'high')
- Props 옵셔널 처리 (mmcScore?, phase?, topChanges?)

### 에러 처리
- API 호출 실패 시 console.warn (사용자에게 오류 노출 안 함)
- 빈 데이터 대응: "데이터를 불러오는 중..." 메시지
- Fallback UI: 데이터 없을 때 기본 메시지 표시

### 성능 최적화
- fetchJsonWithRetry: 3번 재시도 + 1초 간격
- 뉴스 최대 20개 제한 (overflow-y-auto)
- 히스토리 데이터 최근 2개만 조회 (변화율 계산)

---

## 📝 참고 문서

- `docs/NEWS_NARRATIVE_IMPROVEMENT_PLAN.md` - 원본 계획서
- `docs/2025-12-09_Master_Cycle_Verification_and_Docs.md` - 이전 세션
- `backend/services/cycle_engine.py` - Master Cycle 로직
- `frontend/src/app/indicators/page.tsx` - 메인 페이지

---

**작성자**: Claude Code
**최종 수정**: 2025-12-10
**다음 세션**: Phase 5 과거 담론 리뷰 시스템 (45분)
