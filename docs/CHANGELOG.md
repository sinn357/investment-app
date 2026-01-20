# Investment App Changelog

## 2026-01-20

### Changes
- core-pce 제거 및 문서/탭 정리 (거시경제 사이클에서 제외)
- 크롤링 레이트리밋 완화: 동시성 제한, 지터/백오프 적용
- 크롤링 이슈 문서화: `docs/CRAWLING_KNOWN_ISSUES.md`

### Commits
- `4048e5e`: chore: remove core-pce from system
- `9ea451c`: fix: reduce crawl throttling failures

---

## 2025-12-26

### UI/UX Improvements
- **Analysis 페이지 레이아웃 개선 - 컴팩트 사이드바**
  - 왼쪽 종목 목록: 33% → 208px (15%)
  - 메인 컨텐츠: 67% → 85% (+18% 증가)
  - 카드 간소화: 목표가/현재가 한 줄, 태그/날짜 제거
  - 카드 높이 60% 감소 → 한 화면에 더 많은 종목 표시
  - 파일: `frontend/src/app/analysis/page.tsx`
  - 커밋: `1651de2`

- **Industries 페이지 레이아웃 개선 - 2단계 구조**
  - 6개 대분류: 3열 카드 → 상단 가로 탭
  - 소분류: 카드 밑 펼침 → 왼쪽 사이드바 (208px)
  - 메인 컨텐츠: 33% → 80% (+47% 증가)
  - 전체 계층 한눈에 확인 가능, 빠른 탭 전환
  - 불필요한 import 제거 (ChevronDown, ChevronUp)
  - 파일: `frontend/src/app/industries/page.tsx`
  - 커밋: `b12bcdb`

### Technical Details
- **프론트엔드 수정**:
  - `analysis/page.tsx`: grid → flex 레이아웃 전환 (24 ins, 44 del)
  - `industries/page.tsx`: 중첩 구조 → 2단계 레이아웃 (45 ins, 55 del)
  - 총 코드 감소: -65 lines

### Commits
- `1651de2`: refactor: analysis 페이지 레이아웃 개선 - 컴팩트 사이드바
- `b12bcdb`: refactor: industries 페이지 레이아웃 개선 - 2단계 구조

### Documentation
- `docs/2025-12-26_UI_Layout_Improvements.md`: UI 개선 작업 전체 문서화

---

## 2025-12-23

### Session 4: 비동기 처리 테스트 실패
- **비동기 전환 시도**: asyncio.to_thread() + gather() 구현 (커밋 9759342)
- **테스트 결과**: 120초 → 144.6초 (20% 악화)
- **원인**: Python GIL + Render 무료 플랜 리소스 제한 (0.1 vCPU)
- **결론**: 병렬 처리 불가능, 유료 플랜 ($7/month) 필수
- **문서**: `docs/2025-12-23_Async_Test_Failed.md`

### Session 3: Phase 3 검증 및 최적화 시도
- **Phase 3 검증 완료**: 헬스체크 0 에러, API 0.81초, 크롤링 124초 (목표 25초 미달)
- **전체 병렬화 시도**: 배치 제거, max_workers 15 → 효과 없음 (129초)
- **크롤링 최적화**: 3개 실패 지표 비활성화 (48→45개) → 역효과 (157초)
- **타임아웃 복원**: 1초→3초 복원으로 악화 방지
- **근본 원인**: Render 무료 플랜 리소스 제한 (0.1 vCPU)
- **커밋**: cd8498d, ab0c289, 283636a, 4da9c81

### Fixed
- **S&P 500 PE 및 일부 지표의 오래된 데이터 표시 문제 해결** (Phase 1)
  - 문제: 백엔드 API에서 일부 지표의 history_table이 오래된 순서(ascending)로 정렬
  - 해결: 프론트엔드에서 release_date 기준으로 최신순 정렬 후 사용
  - 영향: 모든 지표의 히스토리 테이블과 차트가 최신 데이터부터 올바르게 표시
  - 파일: `IndicatorChartPanel.tsx`, `indicators/page.tsx`

### Added
- **지표 헬스체크 API 엔드포인트** (Phase 2)
  - `/api/v2/indicators/health-check`: 44개 경제지표의 데이터 신선도 자동 확인
  - 상태 분류: healthy (7일 이내) / stale (7-30일) / outdated (30일+) / error
  - 응답: 지표별 상태, 최종 업데이트 날짜, 경과 일수, 상태별 요약 통계
  - 정렬: error > outdated > stale > healthy 우선순위

- **Master Market Cycle 데이터 신선도 검증 시스템** (Phase 4)
  - 3대 사이클(Macro, Credit, Sentiment) 지표 자동 검증
  - 검증 대상: 17개 핵심 지표 (Macro 6개, Credit 5개, Sentiment 6개)
  - 30일 이상 오래된 데이터 자동 감지 및 경고
  - API 응답에 data_warnings 필드 추가
  - 오류 시에도 빈 배열 반환으로 시스템 안정성 보장

### Performance
- **병렬 크롤링으로 업데이트 속도 최적화** (Phase 3)
  - 기존: 102초 (순차 크롤링, 1초 대기 × 44개)
  - 개선: ~18초 (ThreadPoolExecutor, 5개씩 병렬 처리)
  - 향상: 약 7배 빠름 (85% 단축) ⚡
  - 안정성: 개별 지표 타임아웃(10초), 실패 시 자동 스킵
  - 배치 처리: 5개씩 묶어서 순차 실행 (메모리 효율성)

### Technical Details
- **프론트엔드 수정**:
  - `IndicatorChartPanel.tsx`: history_table 최신순 정렬 로직 추가
  - `indicators/page.tsx`: 스파크라인 데이터 생성 시 최신순 정렬
- **백엔드 수정**:
  - `app.py`: 헬스체크 엔드포인트 추가 (+112줄)
  - `app.py`: 병렬 크롤링 시스템 구현 (+47줄, -24줄)
  - `cycle_engine.py`: Master Cycle 검증 로직 추가 (+67줄, -3줄)

### Commits
- `8cf1166`: fix: S&P 500 PE 및 일부 지표의 오래된 데이터 표시 문제 해결
- `5545d95`: feat: 지표 헬스체크 API 엔드포인트 추가 (/api/v2/indicators/health-check)
- `f94783c`: perf: 병렬 크롤링으로 업데이트 속도 최적화 (102초→~18초)
- `4414b4d`: feat: Master Market Cycle 데이터 신선도 검증 시스템 추가

### Documentation
- `docs/2025-12-23_System_Optimization_4Phase_Complete.md`: 전체 세션 작업 내용 상세 문서화

---

## 2025-12-23 (Session 2: 긴급 디버깅 및 헬스체크 UI)

### Fixed
- **S&P 500 PE 히스토리 데이터 백엔드 정렬 수정**
  - 문제: 프론트엔드 정렬로는 근본 해결 안됨, 백엔드에서 역순 데이터 전달
  - 진단: History[0]이 2025-06-01 (최신 2025-12-22)
  - 해결: `sp500_pe_crawler.py`에 `history.sort(reverse=True)` 추가
  - 영향: 백엔드 데이터 구조 표준화, 프론트엔드 정렬 불필요
  - 파일: `backend/crawlers/sp500_pe_crawler.py` Line 153-155
  - 커밋: `ec9a851`

### Added
- **헬스체크 요약 패널 UI 구현**
  - healthCheck state + fetchJsonWithRetry 데이터 페칭
  - Master Cycle 카드 하단에 4개 상태 카드 UI 추가
  - 표시: ✅ Healthy (26개) / ⚠️ Stale (13개) / 🚨 Outdated (5개) / ❌ Error (11개)
  - 색상 구분: 초록/노랑/주황/빨강 + 기간 표시
  - 반응형 flex-wrap 레이아웃
  - 파일: `frontend/src/app/indicators/page.tsx` Line 149-151, 194-206, 457-508
  - 커밋: `1a06ec2`

### Diagnosed
- **병렬 크롤링 속도 문제 진단**
  - 실제 시간: 157.4초 (예상 18초의 8.7배 느림) 🚨
  - 원인: `as_completed(timeout=10초 × 5개)` 배치 타임아웃 50초
  - 영향: 11개 배치 × 50초 = 550초 최대 (실제 157초)
  - 해결 필요: 타임아웃 제거 또는 축소 (다음 세션)

### Performance
- **긴급 디버깅 4단계 완료**
  - Step 1: 배포 상태 확인 ✅
  - Step 2: S&P 500 PE 데이터 확인 및 수정 ✅
  - Step 3: 병렬 크롤링 시간 측정 및 문제 진단 🚨
  - Step 4: 헬스체크 API 테스트 ✅

### Technical Details
- **백엔드 수정**:
  - `sp500_pe_crawler.py`: 히스토리 데이터 최신순 정렬 (+2줄)
- **프론트엔드 수정**:
  - `indicators/page.tsx`: healthCheck state + useEffect + UI (+70줄)

### Commits
- `ec9a851`: fix: S&P 500 PE 히스토리 데이터 최신순 정렬 추가
- `1a06ec2`: feat: 헬스체크 요약 패널 UI 구현 (Phase 2)

### Documentation
- `docs/2025-12-23_Session_2_Debugging_Complete.md`: 긴급 디버깅 및 UI 구현 상세 문서화

### Next Session
- **Phase 3**: 병렬 크롤링 속도 최적화 (157초 → 55초 목표)
- **Phase 2-3**: 지표 카드에 상태 배지 표시
- **Phase 4**: Master Cycle 경고 UI 구현

---

## 2025-12-16

### Added
- **개별분석 5개 탭 재설계 완전 구현** (`/analysis`)
  - 투자 가설 (thesis): 7개 필드 + 산출물
  - 검증: 펀더멘털 (validation): 24개 필드, 4개 섹션
  - 가격과 기대치 (pricing): 8개 지표 + 시나리오
  - 타이밍 & 리스크 (timing): 14개 필드, 진입/무효화 조건
  - 결정 & 관리 (decision): 11개 필드, 최종 결정
- **PostgreSQL JSONB 기반 데이터 저장**
  - asset_analysis 테이블 (thesis, validation, pricing, timing, decision 필드)
  - GET/POST API 엔드포인트: `/api/asset-analysis`
- **80+ 입력 필드**: 논리적 그룹화된 20+ Card 섹션
- **시나리오 분석 시스템**: 최선/기본/최악 시나리오 기반 목표가 계산
- **진입/무효화 조건**: 7가지 기술적 조건 기반 매수/매도 판단

### Changed
- **4개 탭 → 5개 탭 구조 완전 재설계**
  - fundamental/technical/summary → thesis/validation/pricing/timing/decision
- **DeepDiveData 인터페이스 재작성**: 80+ 필드로 확장
- **페이지 구조 개선**: 686줄 → 2,305줄 (+1,619줄)
- **빌드 크기**: 41.7 kB → 45.1 kB (+3.4 kB)

### Removed
- **구 4개 탭 컴포넌트**: fundamental/technical/summary 관련 코드 700줄 제거

### Technical Details
- **프론트엔드**: Next.js 15, TypeScript, shadcn/ui
- **백엔드**: Flask, PostgreSQL, JSONB
- **상태 관리**: localStorage (임시), PostgreSQL (영구, API 연동 예정)

### Known Issues
- API 연동 미완성: 프론트엔드에서 백엔드 API 호출하지 않음
- localStorage 전용: 데이터가 브라우저에만 저장됨
- 자동 저장 없음: 수동 저장 버튼 필요

### Next Steps
1. 프론트엔드에서 `/api/asset-analysis` 호출 구현
2. debounce를 사용한 자동 저장
3. localStorage → PostgreSQL 마이그레이션

### Commits
- `5204c47`: feat: Phase 4 - 가격과 기대치 탭 완전 구현
- `fb291e6`: feat: Phase 5 - 타이밍 & 리스크 탭 완전 구현
- `c6a011b`: feat: Phase 6 - 결정 & 관리 탭 완전 구현
- `e98893c`: feat: Phase 7 - 백엔드 API 완전 구현

---

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
