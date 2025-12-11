# Investment App Changelog

## 2025-12-12

### Added
- **ORACLE 브랜드 리네이밍 완료**
  - "투자 어시스턴트" → "ORACLE (Market Intelligence Platform)"
  - Ω (오메가) 심볼 로고 추가
  - Navigation 완전 재디자인 (골드 그라데이션, 모노스페이스 폰트)

- **타이핑 터미널 스타일 홈페이지 구현** (`/`)
  - 개인용 대시보드에 맞게 미니멀화
  - 타이핑 효과 애니메이션 (80ms 딜레이) + 커서 깜빡임 (530ms)
  - 터미널 윈도우 디자인 (macOS 스타일 헤더: 🔴🟡🟢)
  - 명령 프롬프트: `oracle@terminal ~ %`
  - 상태 바: SYSTEM READY + 날짜 + 버전
  - 홈 페이지 크기: 7.36 kB → 6.32 kB (14% 감소)

- **투자철학 페이지 독립화** (`/philosophy`)
  - 기존 홈 페이지에서 완전 분리
  - Navigation에 전용 메뉴 추가 (💡 아이콘)

### Changed
- **투자철학 페이지 UX/UI 완전 개선** (`/philosophy`)
  - 2단 그리드 레이아웃 (왼쪽: 목표/자산/범위, 오른쪽: 원칙/방법)
  - Glassmorphism 카드 디자인 (반투명 + backdrop-blur-md)
  - 골드/에메랄드 그라데이션 오버레이
  - 호버 효과: 테두리 강조 + 그림자 + 글로우
  - 타이포그래피 개선: text-5xl + 골드 그라데이션
  - 스페이싱 최적화: 여백 33-67% 증가

- **홈페이지 2차 재구성 (Phase 2 → Phase 5)**
  - Phase 2: Linear + Stripe 스타일 프리미엄 랜딩페이지
    * Canvas 애니메이션 (그리드 + 50개 파티클)
    * 3D 회전 Feature 카드
    * 글로우 효과 CTA 버튼
  - Phase 5: 타이핑 터미널 스타일로 완전 교체
    * Feature 카드 3개 제거
    * CTA 버튼 2개 제거
    * Canvas 파티클 제거
    * 코드: 265줄 → 107줄 (60% 감소)

### Commits
- `d483969`: feat: Phase 1 - 홈페이지와 투자철학 페이지 분리
- `2e4dac0`: feat: Phase 2 - Linear + Stripe 스타일 프리미엄 랜딩페이지
- `56e85b6`: feat: Phase 3 - 투자철학 페이지 2단 그리드 + Glassmorphism 디자인
- `f4bd85f`: feat: Phase 4 - 투자철학 페이지 타이포그래피 및 스페이싱 최적화
- `69a9e83`: feat: ORACLE 리브랜딩 + 타이핑 터미널 홈페이지

---

## 2025-12-11

### Changed
- **개별분석 페이지 textarea 입력 영역 대폭 개선** (`/analysis`)
  - 모든 textarea rows 값 2-3배 증가 (작은 필드: 2-3줄 → 6-8줄, 중간: 4줄 → 10줄, 큰: 6줄 → 15줄)
  - resize-none → resize-y (세로 방향 수동 크기 조절 허용)
  - min-height 추가 (120px~300px)로 최소 높이 보장
  - useAutoResize 커스텀 훅 생성 (향후 확장용)
  - 영향 범위: 13개 섹션 (BasicInfoAccordion 14개 항목, CompetitorComparison, FinancialAnalysis, ChartAnalysis, QuantAnalysis, SentimentAnalysis, InvestmentConsiderations, RiskPoints, Valuation, 기본적분석, 총평)

- **재무분석 섹션 9개 항목으로 확장** (`/analysis`)
  - 기존 10개 숫자 입력 필드 제거 → 9개 상세 textarea 섹션으로 교체
  - 새로운 항목: 📊 기본 현황, 📈 최근 실적 요약, 🏢 사업부문별 수익성, 💰 자본 구조 & 주요 지표, 📊 매출 구성, 💵 수익 모델, 🎯 핵심 밸류에이션, 📋 재무제표 항목별 스냅샷, 💭 코멘트
  - 각 항목별 충분한 입력 공간 제공 (rows: 8, min-h: 150px)

### Verified
- **Master Market Cycle 시스템 정상 작동 확인**
  - MMC Score: 53.4점 (전환기, 중립)
  - Macro: 57.1점 (확장기), Credit: 87.5점 (유동성 풍부), Sentiment: 31.5점 (과열 경계)
  - 17개 핵심 지표 모두 최신 데이터로 반영됨
  - 업데이트 시간: 2025-12-11 09:16:35

### Commits
- `c2731e9`: feat: 개별분석 페이지 textarea 입력 영역 대폭 개선
- `2ade37b`: feat: 재무분석 섹션 9개 항목으로 확장

---

## 2025-12-10

### Changed
- **개별분석 UX 재구성** (`/analysis`)
  - 탭 단순화: 기본적/기술적/총평/참고자료 4개만 유지, 정량/정성/투자의견 섹션 제거
  - Deep Dive 섹션(기본/기술/총평) 폼을 통합해 한 카드 내에서 작성/저장하도록 재배치
  - 참고자료 인라인 에디터(타입/제목/URL/메모)로 교체, 스티키 저장 툴바 추가
- **포트폴리오 분석 라우트 정리**
  - `/portfolio/[id]/analysis`를 `/analysis`로 안내/리다이렉트
  - 포트폴리오 테이블의 잘못된 분석 버튼 제거

### Fixed
- `NarrativeReview` 의존성 경고 해소: `fetchHistory`를 `useCallback`으로 래핑
- 가계부 대시보드 미사용 Gauge import 제거

### Commits
- `65f23be`: fix: rebuild analysis page layout and lint warnings
- `0228abe`: fix: clean analysis layout and lint warnings
- `fd63feb`: feat: simplify analysis tabs and add inline references
- `aa07ca0`: feat: integrate deep dive analysis into analysis page
- `2c87f47`: feat: 포트폴리오에 자산 개별분석 버튼 추가 (이후 제거됨)

---

## 2025-12-10

### Changed
- **가계부 대시보드 리디자인** (expenses)
  - 구성/흐름 섹션 압축: 지출/수입 탭 통합, 높이 축소, 범례 하단 배치로 차트 잘림 방지
  - 목표 카드 재구성: 대분류(생활/건강 등) 아코디언 기본 접힘, 지출/수입 탭 전환, 소분류별 목표 입력 필드/진행도 표시, 전체 카테고리 노출
  - 요약/차트/흐름/목표 모두 골드-에메랄드 라이트 팔레트 유지, 컴팩트 패딩/폰트 적용

### Commits
- `f37ae7d`: fix: balance flow chart layout and slightly enlarge goals list
- `b98133b`: fix: show all goal categories and recenter flow chart
- `6f0a3a5`: feat: group goals by category with inline inputs and stabilize flow chart
- `2f07a2a`: feat: add accordion toggle for goals and default collapsed
- `68b0a3e`: fix: prevent chart clipping and add compact goals list

---

## 2025-12-09

### Fixed
- **Sentiment 사이클 임계값 재조정** - 4개 지표(S&P500 PER, Shiller CAPE, Michigan, CB 신뢰)가 0점 처리되던 문제 해결
  - S&P500 PER: 18/25/35 (역사적 35배까지 도달)
  - Shiller CAPE: 20/30/45 (닷컴버블 45, 2021년 40)
  - Michigan 소비자심리: 50/75/95 (2022년 저점 50, 평균 85-90)
  - CB 소비자신뢰: 75/95/110 (역사적 평균 100)
  - **결과**: Sentiment 21.8점 → 34.3점 (+57%), MMC 48.7점 → 53.6점 (+10%)

### Verified
- **Master Market Cycle 실전 검증 완료**
  - 거시경제 사이클: 95% 일치 (2025년 12월 현재)
  - 신용/유동성 사이클: 99% 일치
  - 심리/밸류 사이클: 90% 일치 (임계값 수정 후)
  - **MMC 종합**: 95% 실제 경제 상황 일치 ✅
- **React2Shell 보안 점검** - Next.js 15.5.7 (CVE-2025-66478 패치 완료) ✅

### Added
- **뉴스 & 담론 섹션 개선 계획 문서** - `docs/NEWS_NARRATIVE_IMPROVEMENT_PLAN.md`
  - Phase 1-5 상세 구현 계획 (AI 기능 제외)
  - RSS 뉴스 자동 수집, 담론 작성 가이드, 과거 담론 검증 시스템
  - 체크리스트 포함, 예상 소요 3-4시간
- **문서 가이드** - `docs/README.md`
  - 전체 문서 인덱스 및 빠른 참조
  - 기능별 문서 분류 (Master Cycle, 경제지표, 성능 최적화, UI/UX)

### Commits
- `fc47803`: fix: Sentiment 사이클 임계값 재조정 - 역사적 데이터 기반
- `52b3fce`: chore: trigger Render redeploy for sentiment threshold fix

### Documentation
- `2025-12-09_Master_Cycle_Verification_and_Docs.md` - 세션 전체 작업 내역
- `NEWS_NARRATIVE_IMPROVEMENT_PLAN.md` - 뉴스 담론 개선 상세 계획 (35KB)
- `docs/README.md` - 문서 가이드 및 인덱스

---

## 2025-12-03

### Fixed
- Render 배포 타임아웃으로 `/api/v2/macro-cycle`, `/api/v2/credit-cycle`, `/api/v2/sentiment-cycle`가 404를 반환하던 문제를 재배포 가능하도록 조치: Flask가 `$PORT`로 리슨하도록 수정 + `gunicorn` 의존성 추가
- 신용/유동성·심리 사이클 API가 데이터 미존재 시 503을 반환하던 문제를 기본 중립 점수(50점)로 응답하도록 변경

### Notes
- Render 설정 가이드: Workdir `projects/investment-app/backend`, Start command `gunicorn app:app --bind 0.0.0.0:$PORT --workers 2 --timeout 120`
- 배포 후 헬스체크: `curl https://investment-app-backend-x166.onrender.com/api/v2/macro-cycle` (credit/sentiment 동일)

## 2025-11-27

### Added
- Page 4 분석(Analysis) MVP: 리스트/필터 + 정량/정성/투자 의견/참고 자료 탭, 로컬 저장/삭제 지원
- 포트폴리오 확장 섹션: 매수·매도 계획, 데일리 모니터링, 리밸런싱 제안(목표 vs 현재 비중 Δ), 월간 피드백(수익률/승률/회고) – 로컬 저장 기반
- 리스크 레이더 리뉴얼: 구조·정책/사이클/포트폴리오 3축 + 실행 리스크 태그, 로컬 저장
- 빅웨이브 트래커: 카테고리/단계/포지션/플레이어/이벤트/논지 카드 관리, 로컬 저장
- 사이클 보조 스코어 입력: 신용·유동성, 심리·밸류에이션 수동 스코어 + 메모

### Fixed
- 리스크 태그 입력 시 콤마 입력/편집 안 되던 문제 해결
- Select 값 공란으로 인한 포트폴리오 페이지 런타임 오류 수정

### Commits
- `5c9d14f`: feat: add analysis page mvp
- `2d82540`: feat: make analysis page editable
- `857ee2c`: feat: persist analysis edits and add delete
- `8aee318`: feat: add portfolio planning sections
- `4f5695a`: fix: avoid empty select values in portfolio sections
- `fada972`: feat: redesign risk radar with structured categories
- `c981c2a`: fix: persist risk radar and allow tag input
- `63edf78`: fix: keep risk tag input editable
- `ab41c61`: feat: add manual credit/sentiment cycle inputs
- `136310d`: feat: add big wave tracker and cycle manual inputs

## 2025-11-18

### Changed
- Dark mode 테마: gold-emerald 적용
- main 브랜치 최신화 (브랜치 병합)

### Commits
- `d7d6b2e`: feat: implement dark mode with premium gold-emerald theme
- `09f3beb`: feat: apply gold-emerald theme across all pages
- `9382c3a`: feat: update color scheme to gold-emerald theme

---

## 2025-11-17

### Added
- Playwright E2E 테스트
- 접근성 검증

### Fixed
- 가계부 차트 타입 변경 구현

---

## Earlier

### Phase 3: UI/UX
- TanStack Query 전환
- Zustand 상태 관리
- ErrorBoundary 구현
- shadcn/ui 변환

### Phase 2: 가계부
- 지출 관리 시스템
- 차트 & 분석

---

**Last Updated**: 2025-12-03
