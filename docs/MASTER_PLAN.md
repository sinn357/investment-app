# Investment App Master Plan

> **완전한 투자 루틴 지원 시스템 - 대대적 리뉴얼 마스터플랜**

---

## 📋 문서 정보

- **작성일**: 2025-11-26
- **버전**: 1.0.0
- **상태**: 설계 단계
- **목표**: 체계적 투자 루틴을 완벽히 지원하는 통합 투자 플랫폼

---

## 🎯 프로젝트 비전

### 핵심 목표
"투자자의 모든 루틴을 하나의 앱에서 - 투자 철학부터 백테스팅까지"

### 타겟 사용자
- 체계적 투자 루틴을 가진 개인 투자자
- 거시경제 → 산업 → 기업 분석을 순차적으로 수행하는 투자자
- 투자 원칙과 방법론을 가지고 데이터 기반 의사결정을 하는 투자자

### 차별점
- ❌ 단순 포트폴리오 추적 앱
- ❌ 종목 추천 앱
- ✅ **투자 루틴 전 과정을 기록하고 지원하는 지식 관리 시스템**

---

## 🗺️ 투자 루틴 맵핑

### 사용자의 투자 루틴 (5단계)

```
0. 투자 기본 정립
   ├─ 투자 철학
   ├─ 투자 목표
   ├─ 투자 원칙
   └─ 투자 방법

1. 거시경제 파악
   ├─ 경제 지표 확인
   ├─ 사이클(국면) 판별
   ├─ 기사 읽고 담론
   └─ 리스크/빅웨이브 파악

2. 산업별 기업 리스트 작성
   ├─ 산업별 현황
   ├─ 대표 대형주
   └─ 숨은 성장주

3. 개별 분석
   ├─ 기업 분석
   ├─ 암호화폐
   └─ ETF

4. 트레이드 & 모니터링
   ├─ 예산 구성
   ├─ 매수/매도 계획
   ├─ 데일리 모니터링
   ├─ 리밸런싱
   ├─ 피드백
   └─ 백테스팅
```

### 앱 페이지 구조 (6페이지)

| 루틴 단계 | 페이지 | 기능 |
|----------|--------|------|
| 0단계 | **Page 1: Home** | 투자 철학 & 원칙 시스템 |
| 1단계 | **Page 2: Macro** | 거시경제 종합 대시보드 |
| 2단계 | **Page 3: Industries** | 산업 분석 & 종목 데이터베이스 |
| 3단계 | **Page 4: Analysis** | 개별 자산 상세 분석 아카이브 |
| 4단계 | **Page 5: Portfolio** | 트레이드 & 모니터링 |
| - | **Page 6: Budget** | 가계부 (기존 유지) |

---

## 📄 페이지별 상세 설계

### **Page 1: Home (투자 철학 & 원칙)**

#### 목적
"투자의 나침반 - 모든 결정의 기준점"

#### 섹션 구성 (5개)

1. **투자 목표** (3칸 그리드)
   - 목표 수익률 (연 %, 절대 금액)
   - 리스크 허용도 (변동성, 최대 낙폭, 레버리지)
   - 투자 기간 (시작일, 목표일, D-Day)

2. **금지 자산** (태그 형태)
   - 절대 투자 금지 자산군
   - 금지 이유 메모
   - 예: 레버리지 ETF, 밈코인, 옵션

3. **운용 범위** (도넛 차트 + 슬라이더)
   - 자산군별 최소/최대 비중
   - 현재 비중 vs 목표 범위
   - 이탈 시 경고 표시

4. **투자 원칙** (체크리스트 + 메모)
   - 리스크 관리 (손절 -10%, 분산 투자)
   - 매매 규칙 (분할 매수, 익절 기준)
   - 심리 통제 (FOMO 금지, 뉴스 트레이딩 금지)

5. **투자 방법** (타임라인 형태)
   - 5단계 루틴 프로세스
   - 각 단계별 수행 주기
   - 사용 도구 및 기간

#### 데이터 구조
```typescript
interface InvestmentPhilosophy {
  goal: {
    targetReturn: number;
    riskTolerance: { volatility, maxDrawdown, maxLeverage };
    timeHorizon: { start, target, years };
  };
  forbiddenAssets: { name, reason, icon }[];
  allocationRange: { category, min, max, current, color }[];
  principles: { category, rule, enabled, note }[];
  methods: { phase, description, tools, duration }[];
}
```

#### 우선순위
🔥 **High** - 모든 페이지의 기준점이 되는 핵심 기능

---

### **Page 2: Macro (거시경제 종합)**

#### 목적
"경제의 큰 그림 파악 - 사이클 판단과 리스크 관리"

#### 섹션 구성 (5개)

1. **경제 사이클 종합** (3개 사이클)
   - 거시경제 사이클 (경기/성장/인플레/금리) ✅ 기존 CyclePanel 확장
   - 신용/유동성 사이클 (M2, 신용 스프레드, 은행 대출)
   - 심리/밸류에이션 사이클 (공포탐욕지수, VIX, P/C 비율)
   - 통합 판단: "현재 국면 + 추천 자산/주의 자산"

2. **경제지표 모니터** ✅ 기존 IndicatorGrid 유지
   - 6개 탭 (경기/고용/금리/무역/물가/정책)
   - 실시간 크롤링 vs API 하이브리드
   - 스파크라인 차트 (옵션)

3. **뉴스 & 담론** (신규)
   - 기사 스크랩 (제목, 출처, URL, 요약, 키워드)
   - 내 담론 작성 (핵심 논지, 근거, 투자 시사점)
   - 타임라인 뷰로 과거 담론 추적

4. **리스크 레이더** (신규)
   - 5가지 리스크 (지정학/금리/경기/시장/신용)
   - 레벨별 색상 구분 (🔴 Critical, 🟡 High, 🟢 Low)
   - 포트폴리오 리스크 노출도 계산

5. **빅웨이브 추적** (신규)
   - 기술혁신 트렌드 (AI, 친환경, 바이오, 우주, 메타버스)
   - 단계별 진행도 (초기/성장/성숙/쇠퇴)
   - 핵심 플레이어, 타임라인, 투자 논지

#### 데이터 구조
```typescript
interface MacroDashboard {
  cycles: { macro, credit, sentiment };
  indicators: IndicatorData[]; // 기존
  narratives: { articles, myNarrative }[];
  risks: { category, level, description, portfolioExposure }[];
  bigWaves: { category, stage, keyPlayers, timeline, thesis }[];
}
```

#### 우선순위
🔥 **High** - 투자 루틴의 첫 단계, 핵심 판단 근거

---

### **Page 3: Industries (산업 분석)**

#### 목적
"내가 분석한 산업 지식 베이스 + 관심 종목 데이터베이스"

#### 섹션 구성 (3개)

1. **산업 카드 그리드**
   - 상태별 필터 (성장/정체/쇠퇴)
   - 카드: 산업명, 상태, 목표 비중, 대형주/성장주 개수, 마지막 분석일
   - 검색 기능 (산업명)

2. **산업 분석 페이지** (모달 또는 상세 화면)
   - **산업 분석 탭**: 현황, 트렌드, 리스크, 밸류에이션, 투자 의견
   - **대표 대형주 탭**: 티커, 이름, 핵심 포인트, 장단점, 내 포지션
   - **숨은 성장주 탭**: 티커, 발굴 이유, 성장 잠재력, 워치리스트 상태

3. **검색 기능** (보조)
   - Yahoo Finance / Google 외부 링크
   - 업종 정보, 주요 종목, 최근 뉴스 표시
   - "내 분석에 복사" 버튼

#### 데이터 구조
```typescript
interface IndustryAnalysis {
  id, name, status, targetAllocation;
  myAnalysis: { overview, trends, drivers, risks, valuation, investmentView };
  bluechips: { ticker, name, whyImportant, pros, cons, inPortfolio, myRating }[];
  growthStocks: { ticker, name, discoveryNote, growthPotential, inWatchlist, myRating }[];
  createdAt, lastReviewedAt;
}
```

#### 우선순위
🔥 **Medium** - 중요하지만 초기에는 수동 입력으로 시작 가능

---

### **Page 4: Analysis (개별 분석)**

#### 목적
"내가 분석한 자산 상세 리포트 아카이브"

#### 섹션 구성 (4개 탭)

1. **분석 리스트**
   - 타입별 탭 (주식/암호화폐/ETF)
   - 필터 (매수/관망/매도)
   - 정렬 (최근순/확신도/상승여력)
   - 카드: 심볼, 의견, 목표가, 점수, 태그, 포트폴리오 상태

2. **정량 분석 탭**
   - 밸류에이션 (PER, PBR, PSR, 목표가, 상승여력)
   - 성장성 (매출/이익 성장률, 전망)
   - 재무 건전성 (부채비율, ROE, FCF)
   - 점수 (밸류/성장/퀄리티 각 1-5점)

3. **정성 분석 탭**
   - 비즈니스 모델
   - 경쟁 우위 (Moat: Wide/Narrow/None)
   - 경영진 평가
   - 리스크 (High/Medium/Low별 분류)
   - 상승 촉매 (타이밍, 임팩트)

4. **투자 의견 탭**
   - 액션 (매수/관망/매도), 확신도 (1-5)
   - 가격 전략 (목표 매수가, 매도가, 손절가)
   - 조건부 매수 (체크리스트)
   - 포지션 계획 (목표 비중, 분할 매수 계획)
   - 투자 논지 (Thesis 요약)

5. **참고 자료 탭**
   - 기사, 리포트, 영상, 기타
   - 링크 + 메모

#### 데이터 구조
```typescript
interface AssetAnalysis {
  id, symbol, name, type;
  analyzedAt, lastUpdatedAt, version;
  myAnalysis: {
    quantitative: { valuation, growth, financial, scores };
    qualitative: { businessModel, moat, management, risks, catalysts };
    decision: { action, conviction, prices, positionSize, thesis };
  };
  inPortfolio, inWatchlist;
  references: { type, title, url, note }[];
  tags: string[];
}
```

#### 우선순위
🔥 **High** - 투자 결정의 핵심 근거 문서

---

### **Page 5: Portfolio (트레이드 & 모니터링)**

#### 목적
"기존 포트폴리오 기능 + 실전 트레이딩 지원 도구"

#### 섹션 구성 (6개, 접기/펼치기)

1. **포트폴리오 현황** (기본 펼쳐짐)
   - ✅ 기존 기능 유지 (차트, 테이블, 목표)
   - 간소화: 차트 크기 50% 축소, 테이블은 대분류만 표시

2. **예산 구성** (기본 접힘)
   - 월별 투자 예산 설정
   - 자산군별 배분 (슬라이더)
   - 자동 제안 (현재 비중 기반)

3. **매수/매도 계획** (기본 접힘)
   - 탭: 매수 대기 / 매도 계획 / 완료
   - 조건부 매수/매도 (가격, 지표, 이벤트)
   - 분할 매수/매도 설정
   - 알림 설정

4. **리밸런싱 제안** (기본 접힘)
   - 현재 vs 목표 비중 비교
   - 자동 리밸런싱 제안
   - 시뮬레이션 (제안 수락 시 예상 결과)

5. **피드백 & 복기** (기본 접힘)
   - 월간 매매 일지
   - 성과 분석 (수익률, 승률)
   - 잘한 점 / 실수
   - 다음 달 개선 사항

6. **백테스팅** (기본 접힘)
   - 시뮬레이션 설정 (기간, 초기 자금, 전략)
   - 결과 비교 (전략 vs 실제)
   - 인사이트 도출

#### 데이터 구조
```typescript
interface PortfolioDashboard {
  portfolio: Asset[]; // 기존
  budget: { monthly, allocation: { category, amount, percentage }[] };
  tradePlans: { symbol, type, status, conditions, splits, alerts }[];
  rebalancing: { current, target, suggestions }[];
  review: { monthly: { performance, wins, mistakes, improvements } };
  backtesting: { settings, results, insights };
}
```

#### 우선순위
🔥 **High** - 실제 매매와 직결되는 핵심 기능

---

### **Page 6: Budget (가계부)**

#### 상태
✅ 기존 기능 잘 작동 중

#### 개선 계획
- 디자인 통일 (다른 페이지와 일관성)
- 선택적 기능 추가 (추후 Phase)
- **현재는 유지보수 모드**

#### 우선순위
🟢 **Low** - 안정적 운영 중, 다른 페이지 우선

---

## 🛠️ 기술 스택

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Charts**: Recharts (기존 유지)
- **State**: TanStack Query + Zustand (기존 유지)
- **Forms**: React Hook Form + Zod (기존 유지)

### Backend
- **Framework**: Flask (기존 유지) 또는 Next.js API Routes (통합 고려)
- **Database**: PostgreSQL (Neon)
- **ORM**: Prisma (프론트엔드만 사용 중)

### 외부 서비스
- **경제지표**: FRED API + 크롤링 하이브리드
- **주식 데이터**: Yahoo Finance API (비공식) 또는 Alpha Vantage
- **암호화폐**: CoinGecko API
- **배포**: Vercel (프론트) + Render (백엔드)

---

## 🚨 우려사항 & 리스크

### 1. 기술적 우려

#### A. 검색/데이터 연동 (최대 우려)
- ❌ **문제**: 무료 API 제한, 크롤링 불안정성, 유료 API 비용
- 💡 **해결책**:
  - **MVP**: 수동 입력 중심 + 외부 링크 (Google/Yahoo)
  - **Phase 2**: 심볼 검색만 구현 (티커 → 이름 매칭)
  - **Phase 3**: 재무 데이터 API 연동 (안정화 후)

#### B. 백테스팅
- ❌ **문제**: 과거 가격 데이터 확보 어려움
- 💡 **해결책**:
  - Phase 1: 간단한 시뮬레이션 (현재 포트폴리오 스냅샷 비교)
  - Phase 2: Yahoo Finance 일봉 크롤링
  - Phase 3: 정교한 백테스팅 엔진

#### C. 알림 시스템
- ❌ **문제**: 실시간 가격 모니터링 → 서버 부하
- 💡 **해결책**:
  - Phase 1: 수동 체크 (페이지 방문 시)
  - Phase 2: 일 1회 배치 알림
  - Phase 3: 실시간 푸시 (WebSocket)

### 2. 디자인/UX 우려

#### A. 정보 과부하
- ❌ **문제**: 너무 많은 섹션 (Macro 5개, Portfolio 6개)
- 💡 **해결책**: 접기/펼치기, 간편/전문가 모드 토글

#### B. 데이터 입력 피로
- ❌ **문제**: 기업 분석 20개 이상 필드
- 💡 **해결책**: 필수/선택 구분, 자동 저장, 템플릿 제공

#### C. 모바일 반응형
- ⚠️ **문제**: 복잡한 차트/테이블 모바일 최적화
- 💡 **해결책**: 모바일은 요약 뷰만, 상세는 데스크톱 권장

### 3. 데이터 관리 우려

#### A. 데이터 일관성
- ❌ **문제**: NVDA가 Industries/Analysis/Portfolio 3곳에 중복
- 💡 **해결책**: SSOT 원칙, `assets` 마스터 테이블 + 외래키

#### B. 데이터 마이그레이션
- ⚠️ **문제**: MVP → Phase 2/3로 진화 시 스키마 변경
- 💡 **해결책**: Prisma migrations, 백업 자동화, version 필드

### 4. 성능 우려

#### A. 페이지 로딩 속도
- ❌ **문제**: 대량 데이터 (Portfolio 100+ 자산, Analysis 50+ 리포트)
- 💡 **해결책**: 페이지네이션, 무한 스크롤, react-window

#### B. N+1 쿼리
- ⚠️ **문제**: Industries → Bluechips → Analysis 중첩 조회
- 💡 **해결책**: Prisma `include` 최적화, 필드 선택, 인덱싱

### 5. 유지보수 우려

#### A. 코드 복잡도
- ❌ **문제**: 6페이지 × 5섹션 = 30개 컴포넌트
- 💡 **해결책**: 공통 컴포넌트 라이브러리, Storybook, 체계적 폴더 구조

#### B. 문서화
- ⚠️ **문제**: 기능 추가 시 문서 업데이트 필수
- 💡 **해결책**: CHANGELOG.md, CLAUDE.md ADR, 사용자 가이드

---

## 📅 개발 로드맵

### Phase 1: Foundation (MVP) - 4주
**목표**: 핵심 기능만으로 동작하는 최소 제품

#### Week 1-2: Home + Macro
- [ ] Page 1: Home (투자 철학 5개 섹션)
  - 투자 목표, 금지 자산, 운용 범위, 원칙, 방법
  - PostgreSQL 스키마 설계
  - CRUD API

- [ ] Page 2: Macro (기존 활용 + 신규 2개)
  - ✅ 경제 사이클 (기존 CyclePanel 확장)
  - ✅ 경제지표 모니터 (기존 유지)
  - 🆕 뉴스 & 담론 (간단 버전: 텍스트 입력만)
  - 🆕 리스크 레이더 (수동 입력)

#### Week 3: Industries + Analysis (수동 입력 버전)
- [ ] Page 3: Industries
  - 산업 카드 그리드
  - 산업 분석 CRUD
  - 대형주/성장주 리스트 CRUD
  - **검색 기능 제외** (외부 링크만)

- [ ] Page 4: Analysis
  - 분석 리스트 뷰
  - 정량/정성/의견 탭 CRUD
  - **데이터 연동 제외** (수동 입력만)

#### Week 4: Portfolio 개편
- [ ] Page 5: Portfolio
  - 기존 포트폴리오 간소화 (접기/펼치기)
  - 예산 구성 (간단 버전)
  - 매수/매도 계획 (간단 버전)
  - **리밸런싱/백테스팅 제외**

**Deliverable**: 6개 페이지 모두 기본 작동 (수동 입력 중심)

---

### Phase 2: Enhanced Features - 3주
**목표**: 자동화 및 고급 기능 추가

#### Week 5: 데이터 연동 1
- [ ] Macro 고도화
  - 신용/심리 사이클 데이터 연동
  - FRED API 통합
  - 빅웨이브 추적 섹션

#### Week 6: 데이터 연동 2
- [ ] Industries 검색 기능
  - Yahoo Finance 심볼 검색
  - 업종 정보 표시
  - "내 분석에 복사" 기능

- [ ] Analysis 검색 기능
  - 심볼 → 기본 정보 자동 채우기
  - CoinGecko API (암호화폐)

#### Week 7: Portfolio 고급 기능
- [ ] 리밸런싱 제안 엔진
- [ ] 피드백 & 복기 시스템
- [ ] 간단 백테스팅 (포트폴리오 스냅샷 비교)

**Deliverable**: 데이터 연동 및 자동화 기능 추가

---

### Phase 3: Polish & Optimization - 2주
**목표**: 성능 최적화 및 UX 개선

#### Week 8: 성능 최적화
- [ ] 페이지네이션 / 무한 스크롤
- [ ] Prisma 쿼리 최적화
- [ ] 이미지 최적화 (차트 캐싱)
- [ ] 로딩 스켈레톤 UI

#### Week 9: UX 개선
- [ ] 모바일 반응형 개선
- [ ] 접근성 (a11y)
- [ ] 에러 처리 강화
- [ ] 사용자 온보딩 튜토리얼

**Deliverable**: 프로덕션 레디 상태

---

### Phase 4: Advanced Features (장기) - 4주+
**목표**: 차별화 기능 추가

- [ ] 알림 시스템 (일 1회 배치)
- [ ] 정교한 백테스팅 엔진
- [ ] 데이터 내보내기 (CSV, PDF)
- [ ] 소셜 기능 (투자 아이디어 공유) - 선택사항
- [ ] AI 기반 분석 보조 (GPT 연동) - 선택사항

---

## 📊 데이터베이스 스키마 (개요)

### 핵심 테이블

```prisma
// 투자 철학
model InvestmentPhilosophy {
  id                String   @id @default(cuid())
  userId            String   @unique
  goal              Json     // { targetReturn, riskTolerance, timeHorizon }
  forbiddenAssets   Json     // [{ name, reason, icon }]
  allocationRange   Json     // [{ category, min, max, current }]
  principles        Json     // [{ category, rule, enabled, note }]
  methods           Json     // [{ phase, description, tools }]
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}

// 거시경제 담론
model EconomicNarrative {
  id          String   @id @default(cuid())
  userId      String
  date        DateTime
  cycle       String   // '호황' | '침체' | '회복' | '둔화'
  keyPoints   String[]
  risks       Json     // [{ type, level, description }]
  bigWaves    Json     // [{ event, date, impact }]
  articles    Json     // [{ title, url, summary }]
  myThoughts  String   @db.Text
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

// 산업 분석
model IndustryAnalysis {
  id              String   @id @default(cuid())
  userId          String
  name            String
  status          String   // '성장' | '정체' | '쇠퇴'
  overview        String   @db.Text
  trends          String[]
  drivers         String[]
  risks           String[]
  valuation       String
  investmentView  String
  targetAllocation Float
  bluechips       Json     // [{ ticker, name, whyImportant, pros, cons }]
  growthStocks    Json     // [{ ticker, name, discoveryNote, growthPotential }]
  createdAt       DateTime @default(now())
  lastReviewedAt  DateTime @updatedAt

  @@unique([userId, name])
}

// 개별 분석
model AssetAnalysis {
  id            String   @id @default(cuid())
  userId        String
  symbol        String
  name          String
  type          String   // '주식' | '암호화폐' | 'ETF'
  version       Int      @default(1)
  quantitative  Json     // { valuation, growth, financial, scores }
  qualitative   Json     // { businessModel, moat, management, risks, catalysts }
  decision      Json     // { action, conviction, prices, positionSize, thesis }
  inPortfolio   Boolean  @default(false)
  inWatchlist   Boolean  @default(false)
  references    Json     // [{ type, title, url, note }]
  tags          String[]
  analyzedAt    DateTime
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@unique([userId, symbol])
}

// 매수/매도 계획
model TradePlan {
  id          String   @id @default(cuid())
  userId      String
  symbol      String
  type        String   // '매수' | '매도'
  status      String   // '대기' | '부분체결' | '완료' | '취소'
  targetPrice Float
  quantity    Float
  budget      Float
  conditions  Json     // { priceCondition, timeCondition, economicCondition }
  splits      Json     // [{ price, percentage, executed }]
  alerts      Json     // [{ type, condition, sent }]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

// 월간 복기
model MonthlyReview {
  id          String   @id @default(cuid())
  userId      String
  month       DateTime
  performance Json     // { totalReturn, trades, winRate }
  wins        String[] // 잘한 점
  mistakes    String[] // 실수
  improvements String[] // 개선 사항
  createdAt   DateTime @default(now())

  @@unique([userId, month])
}

// 기존 테이블 유지
model Asset { ... } // 포트폴리오
model GoalSettings { ... }
model ExpenseBudgetGoals { ... } // 가계부
model Transaction { ... }
```

---

## 🎨 디자인 시스템

### 색상 테마
- **Primary**: Gold (oklch 0.68 0.17 88) - 번영, 재산
- **Secondary**: Emerald (oklch 0.65 0.16 158) - 성장, 성공
- **배경**: Cream/Ivory (라이트), Gold-tinted Dark (다크)

### 타이포그래피
- **Font**: Fira Code Nerd Font (아이콘 지원)
- **Heading**: 24-32px Bold
- **Body**: 14-16px Regular
- **Caption**: 12px Light

### 컴포넌트 재사용
- **Card**: 모든 섹션의 기본 컨테이너
- **Modal**: 상세 화면 (산업, 분석)
- **Accordion**: 접기/펼치기 (Portfolio)
- **Badge**: 태그, 상태 표시
- **Chart**: Recharts (도넛, 막대, 선, 레이더)

---

## 📝 문서화 전략

### 개발 중 문서
- **CHANGELOG.md**: Phase별 완료 작업 기록
- **CLAUDE.md**: ADR (Architecture Decision Records)
- **FIXES.md**: 버그 수정 이력

### 사용자 문서 (Phase 3 이후)
- **USER_GUIDE.md**: 기능별 사용법
- **FAQ.md**: 자주 묻는 질문
- **TUTORIAL.md**: 온보딩 튜토리얼

---

## 🚀 배포 전략

### 환경
- **개발**: `localhost:3000` (프론트) + `localhost:5000` (백엔드)
- **스테이징**: Vercel Preview (각 PR마다)
- **프로덕션**: Vercel (프론트) + Render (백엔드)

### CI/CD
- **GitHub Actions**: 자동 빌드 + 테스트
- **Vercel**: main 브랜치 푸시 시 자동 배포
- **Render**: 백엔드 수동 배포 (안정화 후 자동화)

### 모니터링
- **Vercel Analytics**: 페이지 성능
- **Sentry**: 에러 추적 (선택사항)
- **PostHog**: 사용자 행동 분석 (선택사항)

---

## ✅ 성공 지표 (KPI)

### Phase 1 (MVP)
- [ ] 6개 페이지 모두 기본 작동
- [ ] 투자 철학 → 포트폴리오까지 전체 루틴 커버
- [ ] 모바일 반응형 80% 이상

### Phase 2 (Enhanced)
- [ ] 데이터 연동 3개 이상 (FRED, Yahoo, CoinGecko)
- [ ] 검색 기능 작동률 90% 이상
- [ ] 페이지 로딩 속도 2초 이내

### Phase 3 (Production)
- [ ] 백테스팅 기능 정상 작동
- [ ] 사용자 온보딩 튜토리얼 완료
- [ ] 버그 0개 (크리티컬)

---

## 🔗 참고 자료

### 기술 문서
- [Vibecoding README.md](../../README.md)
- [CLAUDE.md](../../CLAUDE.md)
- [ERROR_PATTERNS.md](../../ERROR_PATTERNS.md)

### 프로젝트 문서
- [investment-app.md](../docs/projects/investment-app.md)
- [ROADMAP.md](./ROADMAP.md) (기존)
- [CHANGELOG.md](./CHANGELOG.md)

### 외부 API
- [FRED API](https://fred.stlouisfed.org/docs/api/fred/)
- [Yahoo Finance API](https://finance.yahoo.com/)
- [CoinGecko API](https://www.coingecko.com/en/api)
- [Alpha Vantage](https://www.alphavantage.co/)

---

## 🤝 컨트리뷰션

### 개발 워크플로우
1. **세션 시작**: README.md + CLAUDE.md 읽기
2. **작업 브랜치**: `feature/page-{번호}-{기능명}`
3. **커밋 메시지**: Conventional Commits
4. **PR**: Phase별로 제출
5. **문서 업데이트**: CHANGELOG.md 필수

### 코드 리뷰 체크리스트
- [ ] TypeScript 타입 안전성
- [ ] ESLint/Prettier 통과
- [ ] 모바일 반응형 확인
- [ ] 접근성 (a11y) 기본 준수
- [ ] 문서 업데이트

---

## 📞 Contact & Support

- **GitHub Issues**: 버그 리포트 및 기능 제안
- **Discussions**: 아이디어 토론
- **Maintainer**: Partner & Claude Code

---

**Last Updated**: 2025-11-26
**Version**: 1.0.0
**Status**: 🟡 설계 단계 (Phase 1 준비 중)
