# 뉴스 & 담론 섹션 개선 Phase 1-5 완전 구현

> **작성일**: 2025-12-10
> **상태**: ✅ Phase 1-5 완료
> **총 소요 시간**: 3시간 30분

---

## 📋 전체 요약

### 목표
✅ Master Market Cycle과 통합된 스마트 뉴스 & 담론 시스템
✅ RSS 자동 뉴스 수집
✅ 지표 변화 자동 요약
✅ 담론 작성 가이드 제공
✅ 과거 담론 vs 실제 비교 시스템

### 완료 Phase
- ✅ Phase 1: 사이클 보조 스코어 제거 + MMC 카드 (30분)
- ✅ Phase 2: 지표 변화 추적 시스템 (45분)
- ✅ Phase 3: 담론 작성 가이드 (30분)
- ✅ Phase 4: RSS 뉴스 자동 수집 (1시간)
- ✅ Phase 5: 과거 담론 리뷰 시스템 (45분)

---

## ✅ Phase 5: 과거 담론 리뷰 시스템 (최종 Phase)

### 목표
- 과거 담론 히스토리 조회
- 예측 vs 실제 비교 시스템

### 작업 내역

#### 5-1. 백엔드 API 구현

**파일**: `backend/services/postgres_database_service.py` (신규 메서드 추가)

**메서드**: `get_narrative_history(user_id, limit)`
```python
def get_narrative_history(self, user_id: int, limit: int = 10) -> Dict:
    """과거 담론 히스토리 조회"""
    # PostgreSQL 쿼리로 최근 N개 담론 조회
    # date, my_narrative, articles_count 반환
```

**API 엔드포인트**: `backend/app.py`
```python
@app.route('/api/economic-narrative/history', methods=['GET'])
def get_narrative_history():
    """과거 담론 히스토리 조회 API"""
    # Query Parameters: user_id, limit (기본 10)
```

#### 5-2. 프론트엔드 컴포넌트

**파일**: `frontend/src/components/NarrativeReview.tsx` (신규 생성, 131줄)

**주요 기능**:
- 과거 담론 목록 조회 (최근 10개)
- 날짜별 카드 UI (펼치기/접기)
- 담론 내용 + 기사 개수 표시
- 검증 포인트 가이드:
  - 당시 예측한 시장 방향이 맞았나요?
  - 주목한 지표가 실제로 중요했나요?
  - 놓친 변수는 무엇인가요?

#### 5-3. indicators/page.tsx 통합

**위치**: 빅웨이브 섹션 하단

```tsx
{/* 과거 담론 리뷰 섹션 (Phase 5) */}
<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
  <NarrativeReview userId={userId} />
</div>
```

### 결과
- **커밋**: `727aef3` - "feat: add past narrative review system"
- **변경**: 4 files changed, 199 insertions(+)
- **생성**: `frontend/src/components/NarrativeReview.tsx` (131줄)

---

## 📊 전체 통계 (Phase 1-5)

### 커밋 히스토리

| 커밋 | 메시지 | 변경 |
|------|--------|------|
| `83de4e4` | refactor: remove manual cycle score, add MMC card | 2 files, +58/-75 |
| `7738b20` | feat: add indicator changes tracker | 4 files, +387/0 |
| `f8ca310` | feat: add narrative writing guide | 3 files, +123/-1 |
| `33775c1` | feat: add RSS news auto-fetch | 5 files, +271/0 |
| `cd7cc05` | docs: Phase 1-4 뉴스&담론 개선 세션 문서화 | 1 file, +663/0 |
| `727aef3` | feat: add past narrative review system | 4 files, +199/0 |
| **합계** | **6개 커밋** | **19 files, +1701/-76** |

### 생성된 파일 (8개)

**백엔드** (2개):
1. `backend/services/indicator_changes_service.py` (263줄)
2. `backend/crawlers/rss_news_crawler.py` (131줄)

**프론트엔드** (5개):
3. `frontend/src/components/MMCScoreCard.tsx` (52줄)
4. `frontend/src/components/IndicatorChanges.tsx` (82줄)
5. `frontend/src/components/NarrativeGuide.tsx` (105줄)
6. `frontend/src/components/AutoNewsPanel.tsx` (98줄)
7. `frontend/src/components/NarrativeReview.tsx` (131줄)

**문서** (1개):
8. `docs/2025-12-10_News_Narrative_Complete.md` (이 문서)

### 수정된 파일 (10개)

**백엔드**:
1. `backend/requirements.txt` - feedparser 추가
2. `backend/app.py` - 3개 API 엔드포인트 추가
3. `backend/services/postgres_database_service.py` - get_narrative_history 메서드 추가

**프론트엔드**:
4. `frontend/src/app/indicators/page.tsx` - 5개 컴포넌트 통합 + 3개 API 호출
5. `frontend/src/components/NewsNarrative.tsx` - 2개 컴포넌트 통합 + props 확장

### 소요 시간
- Phase 1: 30분
- Phase 2: 45분
- Phase 3: 30분
- Phase 4: 1시간
- Phase 5: 45분
- **총 3시간 30분**

---

## 🎯 개편된 뉴스&담론 섹션 설명

### 1. MMC 점수 카드 (Phase 1)
**위치**: 뉴스 섹션 바로 위

**기능**:
- Master Market Cycle 종합 점수 표시 (0-100점)
- 현재 국면 표시 (침체/회복/확장/둔화)
- 3대 사이클 요약:
  - 거시경제 (Macro): 점수 + 국면
  - 신용/유동성 (Credit): 점수 + 상태
  - 심리/밸류 (Sentiment): 점수 + 상태
- 업데이트 시간 표시

**UI**: 그라데이션 배경 (primary/5 → secondary/5), 3칸 그리드

---

### 2. 주요 지표 변화 (Phase 2)
**위치**: MMC 점수 카드 아래

**기능**:
- 전일 대비 주요 지표 변화 상위 5개 추출
- 증가/감소/변화없음 분류
- 변화율(%) + from → to 표시
- 중요도 가중치 적용 (high/medium/low)

**백엔드 로직**:
- 최근 2개 데이터 조회
- 변화율 계산: `(new - old) / old * 100`
- MMC 공식 기준 가중치 적용
- 상위 N개 추출

**UI**:
- ↑ 상승 (초록색)
- ↓ 하락 (빨간색)
- → 변화 없음 (회색 배지)

---

### 3. 담론 작성 가이드 (Phase 3)
**위치**: NewsNarrative 컴포넌트 내부, "내 담론" 텍스트 영역 위

**기능**:
- 펼치기/접기 UI
- MMC 데이터와 지표 변화를 활용한 동적 질문 생성
- 4개 카테고리:
  1. **시장 상황**: 현재 MMC 점수 해석, 3대 사이클 주목 포인트
  2. **지표 분석**: 상승/하락 지표 의미, 다음 달 주목 지표
  3. **투자 전략**: 포트폴리오 리밸런싱, 향후 전략, 리스크 관리
  4. **가설 검증**: 지난달 예측 검증, 놓친 변수, 다음 달 가설

**Tip**: 구체적인 숫자와 근거를 함께 기록하면 나중에 검증할 때 더 유용합니다.

---

### 4. RSS 뉴스 자동 수집 (Phase 4)
**위치**: NewsNarrative 컴포넌트 내부, "스크랩한 기사" 섹션 위

**기능**:
- 🤖 자동 수집 뉴스 (최근 24시간)
- 🔄 새로고침 버튼 (로딩 상태 표시)
- 5개 경제 뉴스 소스:
  - Bloomberg
  - Reuters
  - CNBC
  - Wall Street Journal
  - Federal Reserve
- 키워드 필터링 (30개 경제 관련 키워드)
- 최대 20개 뉴스 표시

**뉴스 카드**:
- 소스 + #키워드 배지
- 제목 (링크)
- 요약 (200자, 2줄 제한)
- + 추가 버튼 → 스크랩 기사로 추가

**백엔드 크롤러**: `backend/crawlers/rss_news_crawler.py`

---

### 5. 과거 담론 리뷰 (Phase 5)
**위치**: 페이지 하단 (빅웨이브 섹션 아래)

**기능**:
- 📚 과거 담론 히스토리 조회 (최근 10개)
- 날짜별 카드 (펼치기/접기 토글)
- 담론 내용 전체 표시
- 기사 개수 표시
- 💡 검증 포인트:
  - 당시 예측한 시장 방향이 맞았나요?
  - 주목한 지표가 실제로 중요했나요?
  - 놓친 변수는 무엇인가요?

**백엔드 API**: `/api/economic-narrative/history?user_id={id}&limit={n}`

**UI**: 날짜 클릭 시 담론 내용 펼침, 재클릭 시 접힘

---

## 🔄 데이터 흐름

### 1. MMC 점수 카드
```
Master Cycle API → indicators/page.tsx → MMCScoreCard 컴포넌트
```

### 2. 지표 변화 추적
```
PostgreSQL (latest 2 data) → indicator_changes_service.py → /api/v3/indicators/changes → IndicatorChanges 컴포넌트
```

### 3. 담론 가이드
```
indicators/page.tsx (MMC data + 지표 변화) → NewsNarrative → NarrativeGuide 컴포넌트
```

### 4. RSS 뉴스 수집
```
5개 RSS Feeds → rss_news_crawler.py → /api/v3/news/auto-fetch → AutoNewsPanel 컴포넌트
```

### 5. 과거 담론 리뷰
```
PostgreSQL (economic_narrative 테이블) → /api/economic-narrative/history → NarrativeReview 컴포넌트
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
- **결정**: MMC 카드 → 지표 변화 → 뉴스 & 담론 → 과거 담론 리뷰
- **근거**: 정보 계층 (종합 → 세부 → 실행 → 검증)
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
- 히스토리 데이터 최근 10개만 조회

### PostgreSQL 쿼리 최적화
- ORDER BY date DESC + LIMIT N
- JSONB 필드 파싱 (articles)
- date.isoformat() 자동 변환

---

## 📝 사용자 워크플로우

### 1. 오늘의 시장 상황 파악
1. **MMC 점수 카드**: 현재 시장 상태 (점수 + 국면) 확인
2. **지표 변화**: 전일 대비 주요 변화 확인 (무엇이 움직였나?)

### 2. 뉴스 수집 및 담론 작성
1. **RSS 자동 뉴스**: 🔄 새로고침으로 최신 뉴스 가져오기
2. **뉴스 추가**: 관련 뉴스 + 추가 버튼으로 스크랩
3. **담론 가이드**: 💡 펼쳐서 질문 참고
4. **담론 작성**: MMC 데이터 + 지표 변화 + 뉴스 종합하여 작성
5. **저장**: 담론 저장 버튼 클릭

### 3. 과거 담론 검증 (주말 또는 월말)
1. **과거 담론 리뷰**: 스크롤 다운하여 리뷰 섹션 이동
2. **날짜 선택**: 클릭하여 과거 담론 펼치기
3. **검증 포인트**: 3가지 질문으로 자기 검증
   - 예측한 시장 방향이 맞았나?
   - 주목한 지표가 중요했나?
   - 놓친 변수는 무엇인가?
4. **학습**: 성공/실패 패턴 파악, 다음 달 전략 수립

---

## 🚀 배포 상태

### 프론트엔드
- **Vercel**: 자동 배포 완료
- **빌드**: Next.js 15.5.7 Turbopack 빌드 성공
- **경고**: useEffect 의존성 경고 (기능에 영향 없음)

### 백엔드
- **Render**: 수동 재배포 필요
- **API 엔드포인트**: 3개 추가
  - `/api/v3/indicators/changes`
  - `/api/v3/news/auto-fetch`
  - `/api/economic-narrative/history`

---

## ✅ 완료 체크리스트

- [x] Phase 1: 사이클 보조 스코어 제거 + MMC 카드
- [x] Phase 2: 지표 변화 추적 시스템
- [x] Phase 3: 담론 작성 가이드
- [x] Phase 4: RSS 뉴스 자동 수집
- [x] Phase 5: 과거 담론 리뷰 시스템
- [x] 프론트엔드 빌드 테스트
- [x] Git 커밋 (6개)
- [x] Git 푸시
- [x] 최종 문서화

---

## 📚 참고 문서

- `docs/NEWS_NARRATIVE_IMPROVEMENT_PLAN.md` - 원본 계획서
- `docs/2025-12-10_News_Narrative_Phase1-4.md` - Phase 1-4 세션 기록
- `docs/2025-12-09_Master_Cycle_Verification_and_Docs.md` - 이전 세션
- `backend/services/cycle_engine.py` - Master Cycle 로직
- `frontend/src/app/indicators/page.tsx` - 메인 페이지

---

**작성자**: Claude Code
**최종 수정**: 2025-12-10
**상태**: ✅ Phase 1-5 완전 구현 완료
