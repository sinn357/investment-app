# 뉴스 & 담론 섹션 개선 계획

> **작성일**: 2025-12-09  
> **상태**: 설계 완료, 구현 대기  
> **예상 소요**: 2-3 시간  

---

## 📋 개요

### 현재 문제점
1. ❌ 사이클 보조 스코어 (수동 입력) - Master Cycle과 중복
2. ❌ 뉴스 섹션이 경제지표와 분리됨
3. ❌ 담론 작성 시 참고할 정보 부족
4. ❌ 과거 담론 검증 시스템 없음

### 목표
✅ Master Market Cycle과 통합된 스마트 뉴스 & 담론 시스템  
✅ RSS 자동 뉴스 수집  
✅ 지표 변화 자동 요약  
✅ 담론 작성 가이드 제공  
✅ 과거 담론 vs 실제 비교 시스템  

---

## 🎯 Phase 1: 사이클 보조 스코어 제거 및 UI 재구성

### 1-1. 사이클 보조 스코어 제거

**파일**: `frontend/src/app/indicators/page.tsx`

**제거할 코드** (569-627번 라인):
```tsx
{/* 사이클 보조 입력: 신용/심리 */}
<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
  <Card className="border border-primary/20 bg-card">
    <CardHeader>
      <CardTitle className="text-xl">사이클 보조 스코어 (수동)</CardTitle>
      ...
    </CardHeader>
    <CardContent className="grid gap-4 md:grid-cols-3">
      ...
    </CardContent>
  </Card>
</div>
```

**제거할 State**:
```tsx
const [cycleInputs, setCycleInputs] = useState<CycleScoreInput>({
  credit: '중립',
  sentiment: '중립',
  notes: ''
});
```

**제거할 Interface**:
```tsx
type CycleLevel = '완화' | '중립' | '긴축';
interface CycleScoreInput {
  credit: CycleLevel;
  sentiment: CycleLevel;
  notes?: string;
}
```

---

### 1-2. MMC 점수 카드 추가

**파일**: `frontend/src/components/MMCScoreCard.tsx` (신규 생성)

**구조**:
```tsx
interface MMCScoreCardProps {
  mmc_score: number;
  phase: string;
  macro: { score: number; phase: string };
  credit: { score: number; state: string };
  sentiment: { score: number; state: string };
  updated_at: string;
}

export default function MMCScoreCard({ ... }: MMCScoreCardProps) {
  return (
    <div className="bg-gradient-to-br from-primary/5 to-secondary/5 rounded-xl p-6 border-2 border-primary/20">
      <h2 className="text-xl font-semibold mb-4">📊 오늘의 시장 점수</h2>
      
      {/* MMC 종합 점수 */}
      <div className="text-center mb-6">
        <div className="text-5xl font-bold text-primary mb-2">{mmc_score}</div>
        <div className="text-lg text-muted-foreground">{phase}</div>
      </div>

      {/* 3대 사이클 요약 */}
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center p-3 bg-white/50 rounded-lg">
          <div className="text-xs text-muted-foreground">거시경제</div>
          <div className="text-2xl font-bold text-foreground">{macro.score}</div>
          <div className="text-xs text-muted-foreground">{macro.phase}</div>
        </div>
        <div className="text-center p-3 bg-white/50 rounded-lg">
          <div className="text-xs text-muted-foreground">신용/유동성</div>
          <div className="text-2xl font-bold text-foreground">{credit.score}</div>
          <div className="text-xs text-muted-foreground">{credit.state}</div>
        </div>
        <div className="text-center p-3 bg-white/50 rounded-lg">
          <div className="text-xs text-muted-foreground">심리/밸류</div>
          <div className="text-2xl font-bold text-foreground">{sentiment.score}</div>
          <div className="text-xs text-muted-foreground">{sentiment.state}</div>
        </div>
      </div>

      <div className="text-xs text-muted-foreground text-right mt-4">
        업데이트: {new Date(updated_at).toLocaleString('ko-KR')}
      </div>
    </div>
  );
}
```

**통합 위치**: `indicators/page.tsx` 뉴스 섹션 바로 위

```tsx
{/* MMC 점수 카드 (뉴스 섹션 위) */}
<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
  {masterCycleData && <MMCScoreCard {...masterCycleData} />}
</div>

{/* 뉴스 & 담론 섹션 */}
<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
  <NewsNarrative ... />
</div>
```

---

## 🎯 Phase 2: 주요 지표 변화 요약

### 2-1. 지표 변화 추적 백엔드 API

**파일**: `backend/services/indicator_changes_service.py` (신규 생성)

**기능**:
- 전일 대비 지표 변화 계산
- 주요 변화 상위 5개 추출
- 변화율, 절대값 변화 계산

**구조**:
```python
class IndicatorChangesService:
    def __init__(self, db_service):
        self.db = db_service
    
    def get_top_changes(self, limit=5):
        """
        전일 대비 주요 지표 변화 반환
        
        Returns:
            {
                'increases': [
                    {'indicator': 'VIX', 'from': 15.41, 'to': 16.66, 'change': 8.1, 'impact': 'high'},
                    ...
                ],
                'decreases': [...],
                'unchanged': [...]
            }
        """
        # 1. 모든 지표의 최근 2개 데이터 조회
        # 2. 변화율 계산
        # 3. 중요도 가중치 적용 (가중치는 MMC 공식 기준)
        # 4. 상위 N개 추출
        pass
    
    def calculate_change_impact(self, indicator_id, change_pct):
        """지표 변화의 시장 영향도 계산 (low/medium/high)"""
        # VIX, Fed 금리 등 핵심 지표는 high
        # PMI, 소비자 심리 등은 medium
        pass
```

**API 엔드포인트**: `backend/app.py`

```python
@app.route('/api/v3/indicators/changes', methods=['GET'])
def get_indicator_changes():
    """주요 지표 변화 요약"""
    try:
        service = IndicatorChangesService(db)
        changes = service.get_top_changes(limit=5)
        
        return jsonify({
            'status': 'success',
            'data': changes,
            'timestamp': datetime.utcnow().isoformat()
        })
    except Exception as e:
        logger.error(f"지표 변화 조회 실패: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500
```

---

### 2-2. 지표 변화 카드 컴포넌트

**파일**: `frontend/src/components/IndicatorChanges.tsx` (신규 생성)

**구조**:
```tsx
interface IndicatorChange {
  indicator: string;
  from: number;
  to: number;
  change: number; // 변화율 (%)
  impact: 'low' | 'medium' | 'high';
}

interface IndicatorChangesProps {
  increases: IndicatorChange[];
  decreases: IndicatorChange[];
  unchanged: IndicatorChange[];
}

export default function IndicatorChanges({ increases, decreases, unchanged }: IndicatorChangesProps) {
  return (
    <div className="bg-card rounded-lg p-4 border border-primary/20">
      <h3 className="text-lg font-semibold mb-3 flex items-center">
        <span className="mr-2">📈</span>
        주요 지표 변화 (전일 대비)
      </h3>

      {/* 증가 */}
      {increases.length > 0 && (
        <div className="mb-3">
          <h4 className="text-sm font-medium text-green-600 mb-2">↑ 상승</h4>
          <div className="space-y-2">
            {increases.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-sm">
                <span className="text-foreground">{item.indicator}</span>
                <span className="text-green-600 font-medium">
                  {item.from} → {item.to} (+{item.change.toFixed(1)}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 감소 */}
      {decreases.length > 0 && (
        <div className="mb-3">
          <h4 className="text-sm font-medium text-red-600 mb-2">↓ 하락</h4>
          <div className="space-y-2">
            {decreases.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-sm">
                <span className="text-foreground">{item.indicator}</span>
                <span className="text-red-600 font-medium">
                  {item.from} → {item.to} ({item.change.toFixed(1)}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 변화 없음 */}
      {unchanged.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-2">→ 변화 없음</h4>
          <div className="flex flex-wrap gap-2">
            {unchanged.map((item, idx) => (
              <span key={idx} className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded">
                {item.indicator}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

**통합 위치**: MMC 점수 카드 아래

---

## 🎯 Phase 3: 담론 작성 가이드

### 3-1. 담론 템플릿 시스템

**파일**: `frontend/src/components/NarrativeGuide.tsx` (신규 생성)

**구조**:
```tsx
interface NarrativeGuideProps {
  mmcScore: number;
  phase: string;
  topChanges: {
    increases: string[];
    decreases: string[];
  };
}

export default function NarrativeGuide({ mmcScore, phase, topChanges }: NarrativeGuideProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const questions = [
    {
      category: "시장 상황",
      items: [
        `현재 MMC ${mmcScore}점 (${phase})을 어떻게 해석하나요?`,
        "3대 사이클 중 가장 주목해야 할 부분은?",
        "이번 주 가장 중요한 경제 이벤트는?"
      ]
    },
    {
      category: "지표 분석",
      items: [
        topChanges.increases.length > 0 
          ? `${topChanges.increases.join(', ')} 상승의 의미는?` 
          : "주요 지표 변화가 없는 이유는?",
        topChanges.decreases.length > 0 
          ? `${topChanges.decreases.join(', ')} 하락이 시사하는 바는?` 
          : null,
        "다음 달 주목해야 할 지표는?"
      ].filter(Boolean)
    },
    {
      category: "투자 전략",
      items: [
        "현재 포트폴리오 리밸런싱이 필요한가?",
        "향후 1개월 투자 전략은?",
        "리스크 관리 포인트는?"
      ]
    },
    {
      category: "가설 검증",
      items: [
        "지난달 담론의 예측이 맞았나?",
        "틀렸다면 어떤 변수를 놓쳤나?",
        "다음 달 검증할 가설은?"
      ]
    }
  ];

  return (
    <div className="mb-4 bg-primary/5 rounded-lg p-4 border border-primary/20">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full text-left"
      >
        <h4 className="text-sm font-semibold text-primary flex items-center">
          <span className="mr-2">💡</span>
          담론 작성 가이드
        </h4>
        <span className="text-xs text-muted-foreground">
          {isExpanded ? '접기' : '펼치기'}
        </span>
      </button>

      {isExpanded && (
        <div className="mt-4 space-y-4">
          {questions.map((section, idx) => (
            <div key={idx}>
              <h5 className="text-xs font-semibold text-muted-foreground mb-2">
                {section.category}
              </h5>
              <ul className="space-y-1">
                {section.items.map((q, qIdx) => (
                  <li key={qIdx} className="text-sm text-foreground pl-4 relative">
                    <span className="absolute left-0 text-primary">•</span>
                    {q}
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="mt-4 p-3 bg-white/50 rounded border border-primary/20">
            <p className="text-xs text-muted-foreground">
              💡 <strong>Tip:</strong> 구체적인 숫자와 근거를 함께 기록하면 
              나중에 검증할 때 더 유용합니다.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
```

**통합 위치**: NewsNarrative 컴포넌트 내부, "내 담론" 텍스트 영역 위

---

## 🎯 Phase 4: RSS 뉴스 자동 수집

### 4-1. RSS 크롤러 구현

**파일**: `backend/crawlers/rss_news_crawler.py` (신규 생성)

**의존성**:
```bash
pip install feedparser
```

**구조**:
```python
import feedparser
from datetime import datetime, timedelta

class RSSNewsCrawler:
    """경제 뉴스 RSS 피드 크롤러"""
    
    FEEDS = {
        'bloomberg': 'https://www.bloomberg.com/feed/podcast/etf-iq.xml',
        'reuters': 'https://www.reuters.com/rssFeed/businessNews',
        'cnbc': 'https://www.cnbc.com/id/100003114/device/rss/rss.html',
        'wsj': 'https://feeds.a.dj.com/rss/WSJcomUSBusiness.xml',
        'fed': 'https://www.federalreserve.gov/feeds/press_all.xml'
    }
    
    KEYWORDS = [
        'fed', 'interest rate', 'inflation', 'cpi', 'pmi', 'employment',
        'gdp', 'recession', 'economy', 'market', 'stock', 'bond'
    ]
    
    def fetch_recent_news(self, hours=24):
        """
        최근 N시간 이내 뉴스 수집
        
        Args:
            hours: 수집 기간 (시간)
            
        Returns:
            [
                {
                    'title': '기사 제목',
                    'url': 'URL',
                    'summary': '요약',
                    'source': 'Bloomberg',
                    'published': '2025-12-09T10:00:00',
                    'keyword': '금리인하'
                },
                ...
            ]
        """
        news_list = []
        cutoff_time = datetime.now() - timedelta(hours=hours)
        
        for source_name, feed_url in self.FEEDS.items():
            try:
                feed = feedparser.parse(feed_url)
                
                for entry in feed.entries:
                    # 날짜 파싱
                    pub_date = self._parse_date(entry.get('published'))
                    if pub_date < cutoff_time:
                        continue
                    
                    # 키워드 필터링
                    matched_keyword = self._match_keywords(entry.title, entry.summary)
                    if not matched_keyword:
                        continue
                    
                    news_list.append({
                        'title': entry.title,
                        'url': entry.link,
                        'summary': entry.summary[:200],  # 200자 제한
                        'source': source_name.capitalize(),
                        'published': pub_date.isoformat(),
                        'keyword': matched_keyword
                    })
                    
            except Exception as e:
                logger.error(f"RSS 피드 수집 실패 ({source_name}): {e}")
                continue
        
        # 최신순 정렬
        news_list.sort(key=lambda x: x['published'], reverse=True)
        return news_list[:20]  # 최대 20개
    
    def _parse_date(self, date_str):
        """RSS 날짜 문자열 파싱"""
        from email.utils import parsedate_to_datetime
        try:
            return parsedate_to_datetime(date_str)
        except:
            return datetime.now()
    
    def _match_keywords(self, title, summary):
        """키워드 매칭"""
        text = (title + ' ' + summary).lower()
        for keyword in self.KEYWORDS:
            if keyword in text:
                return keyword
        return None
```

---

### 4-2. 뉴스 자동 수집 API

**파일**: `backend/app.py`

```python
@app.route('/api/v3/news/auto-fetch', methods=['GET'])
def auto_fetch_news():
    """RSS 피드에서 최근 뉴스 자동 수집"""
    try:
        hours = request.args.get('hours', 24, type=int)
        
        crawler = RSSNewsCrawler()
        news = crawler.fetch_recent_news(hours=hours)
        
        return jsonify({
            'status': 'success',
            'data': {
                'news': news,
                'count': len(news)
            },
            'timestamp': datetime.utcnow().isoformat()
        })
    except Exception as e:
        logger.error(f"뉴스 자동 수집 실패: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500
```

---

### 4-3. 자동 뉴스 수집 UI

**파일**: `frontend/src/components/AutoNewsPanel.tsx` (신규 생성)

**구조**:
```tsx
interface AutoNews {
  title: string;
  url: string;
  summary: string;
  source: string;
  published: string;
  keyword: string;
}

interface AutoNewsPanelProps {
  onAddArticle: (article: { title: string; url: string; summary: string; keyword: string }) => void;
}

export default function AutoNewsPanel({ onAddArticle }: AutoNewsPanelProps) {
  const [news, setNews] = useState<AutoNews[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAutoNews = async () => {
    setLoading(true);
    try {
      const res = await fetch('https://investment-app-backend-x166.onrender.com/api/v3/news/auto-fetch?hours=24');
      const result = await res.json();
      if (result.status === 'success') {
        setNews(result.data.news);
      }
    } catch (error) {
      console.error('자동 뉴스 수집 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-6 bg-card rounded-lg p-4 border border-primary/20">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-foreground flex items-center">
          <span className="mr-2">🤖</span>
          자동 수집 뉴스 (최근 24시간)
        </h3>
        <button
          onClick={fetchAutoNews}
          disabled={loading}
          className="px-3 py-1 bg-primary text-primary-foreground text-xs rounded hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? '수집 중...' : '🔄 새로고침'}
        </button>
      </div>

      {news.length === 0 && !loading && (
        <p className="text-sm text-muted-foreground text-center py-4">
          "새로고침" 버튼을 눌러 최신 뉴스를 가져오세요.
        </p>
      )}

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {news.map((item, idx) => (
          <div
            key={idx}
            className="p-3 bg-background rounded border border-primary/10 hover:border-primary/30 transition-colors"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-muted-foreground">{item.source}</span>
                  <span className="text-xs bg-secondary/20 text-secondary px-2 py-0.5 rounded">
                    #{item.keyword}
                  </span>
                </div>
                <h4 className="text-sm font-medium text-foreground mb-1">
                  <a href={item.url} target="_blank" rel="noopener noreferrer" className="hover:text-primary">
                    {item.title}
                  </a>
                </h4>
                <p className="text-xs text-muted-foreground line-clamp-2">{item.summary}</p>
              </div>
              <button
                onClick={() => onAddArticle({
                  title: item.title,
                  url: item.url,
                  summary: item.summary,
                  keyword: item.keyword
                })}
                className="px-2 py-1 bg-primary/10 text-primary text-xs rounded hover:bg-primary/20"
              >
                + 추가
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

**통합 위치**: NewsNarrative 컴포넌트 내부, "스크랩한 기사" 섹션 위

---

## 🎯 Phase 5: 과거 담론 vs 실제 비교

### 5-1. 담론 히스토리 조회 API

**파일**: `backend/app.py`

```python
@app.route('/api/economic-narrative/history', methods=['GET'])
def get_narrative_history():
    """과거 담론 히스토리 조회"""
    try:
        user_id = request.args.get('user_id', type=int)
        limit = request.args.get('limit', 10, type=int)
        
        query = """
            SELECT date, my_narrative, articles
            FROM economic_narratives
            WHERE user_id = %s
            ORDER BY date DESC
            LIMIT %s
        """
        
        results = db.execute_query(query, (user_id, limit))
        
        history = []
        for row in results:
            history.append({
                'date': row['date'].isoformat(),
                'narrative': row['my_narrative'],
                'articles_count': len(row['articles']) if row['articles'] else 0
            })
        
        return jsonify({
            'status': 'success',
            'data': history
        })
    except Exception as e:
        logger.error(f"담론 히스토리 조회 실패: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500
```

---

### 5-2. 담론 검증 시스템

**파일**: `frontend/src/components/NarrativeReview.tsx` (신규 생성)

**구조**:
```tsx
interface PastNarrative {
  date: string;
  narrative: string;
  articles_count: number;
}

interface NarrativeReviewProps {
  userId: number;
}

export default function NarrativeReview({ userId }: NarrativeReviewProps) {
  const [history, setHistory] = useState<PastNarrative[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    fetchHistory();
  }, [userId]);

  const fetchHistory = async () => {
    const res = await fetch(`${API_URL}/api/economic-narrative/history?user_id=${userId}&limit=10`);
    const result = await res.json();
    if (result.status === 'success') {
      setHistory(result.data);
    }
  };

  return (
    <div className="bg-card rounded-lg p-6 border border-primary/20 mt-6">
      <h2 className="text-xl font-semibold mb-4 flex items-center">
        <span className="mr-2">📚</span>
        과거 담론 리뷰
      </h2>

      <div className="space-y-3">
        {history.map((item, idx) => (
          <div
            key={idx}
            className="p-4 bg-background rounded border border-primary/10 hover:border-primary/30 transition-colors cursor-pointer"
            onClick={() => setSelectedDate(selectedDate === item.date ? null : item.date)}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-foreground">{item.date}</h3>
              <span className="text-xs text-muted-foreground">
                기사 {item.articles_count}개
              </span>
            </div>

            {selectedDate === item.date && (
              <div className="mt-3 pt-3 border-t border-primary/10">
                <p className="text-sm text-foreground whitespace-pre-wrap">
                  {item.narrative}
                </p>

                <div className="mt-4 p-3 bg-primary/5 rounded">
                  <h4 className="text-xs font-semibold text-primary mb-2">
                    💡 검증 포인트
                  </h4>
                  <ul className="space-y-1 text-xs text-muted-foreground">
                    <li>• 당시 예측한 시장 방향이 맞았나요?</li>
                    <li>• 주목한 지표가 실제로 중요했나요?</li>
                    <li>• 놓친 변수는 무엇인가요?</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
```

**통합 위치**: 페이지 하단 (빅웨이브 섹션 아래)

---

## 📦 구현 체크리스트

### Phase 1: 기본 UI 재구성 (30분)
- [ ] 사이클 보조 스코어 제거
- [ ] MMCScoreCard 컴포넌트 생성
- [ ] indicators/page.tsx 통합
- [ ] 로컬 테스트
- [ ] 커밋: `refactor: remove manual cycle score, add MMC card`

### Phase 2: 지표 변화 추적 (45분)
- [ ] IndicatorChangesService 백엔드 구현
- [ ] /api/v3/indicators/changes 엔드포인트
- [ ] IndicatorChanges 컴포넌트 생성
- [ ] indicators/page.tsx 통합
- [ ] 로컬 테스트
- [ ] 커밋: `feat: add indicator changes tracker`

### Phase 3: 담론 가이드 (30분)
- [ ] NarrativeGuide 컴포넌트 생성
- [ ] NewsNarrative에 통합
- [ ] MMC 데이터 props 전달
- [ ] 로컬 테스트
- [ ] 커밋: `feat: add narrative writing guide`

### Phase 4: RSS 뉴스 수집 (1시간)
- [ ] feedparser 설치
- [ ] RSSNewsCrawler 구현
- [ ] /api/v3/news/auto-fetch 엔드포인트
- [ ] AutoNewsPanel 컴포넌트 생성
- [ ] NewsNarrative에 통합
- [ ] RSS 피드 테스트 (실제 뉴스 수집 확인)
- [ ] 커밋: `feat: add RSS news auto-fetch`

### Phase 5: 과거 담론 리뷰 (45분)
- [ ] /api/economic-narrative/history 엔드포인트
- [ ] NarrativeReview 컴포넌트 생성
- [ ] indicators/page.tsx 하단 통합
- [ ] 로컬 테스트
- [ ] 커밋: `feat: add past narrative review system`

### 최종 배포
- [ ] 프론트엔드 빌드 테스트
- [ ] Vercel 배포
- [ ] Render 재배포
- [ ] 프로덕션 최종 테스트
- [ ] 커밋: `docs: update news narrative improvement completion`

---

## 🚀 시작하는 방법

```bash
# 1. 프로젝트 이동
cd /Users/woocheolshin/Documents/Vibecoding/projects/investment-app

# 2. 브랜치 생성
git checkout -b feature/news-narrative-improvement

# 3. Phase 1부터 순서대로 구현
# (이 문서의 Phase 1 → Phase 2 → ... 순서대로)

# 4. 각 Phase 완료 시 커밋
git add .
git commit -m "feat: [Phase 설명]"

# 5. 전체 완료 후 메인 브랜치 병합
git checkout main
git merge feature/news-narrative-improvement
git push origin main
```

---

## 📝 참고사항

### 의존성 추가
```bash
# 백엔드
cd backend
pip install feedparser
pip freeze > requirements.txt

# 프론트엔드 (추가 의존성 없음)
```

### 테스트 데이터
- RSS 크롤러: 실제 피드 URL로 테스트
- 지표 변화: PostgreSQL에 2일치 데이터 필요
- 담론 히스토리: 기존 저장된 담론 활용

### 주의사항
- ⚠️ RSS 크롤러는 속도가 느릴 수 있음 (10-20초)
- ⚠️ 프론트엔드에서 loading 상태 필수
- ⚠️ CORS 설정 확인 (Render 백엔드)

---

**작성자**: Claude Code  
**최종 수정**: 2025-12-09  
**예상 완료 시간**: 3-4시간  
