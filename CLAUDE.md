# CLAUDE.md — Persistent Session Context (Non-Eco Projects)

> 목적: Claude Code가 세션이 달라도 동일한 규칙/맥락에서 동작하도록 하는 단일 소스(SSOT).

---

## 0) Meta
- **Project:** Investment App - Economic Indicators Dashboard
- **Repo Root:** /home/user/investment-app
- **Owner:** Partner
- **Last Updated:** 2025-11-21 23:00 KST
- **Session Goal (2025-11-21):** ✅ 경제지표 페이지 개선 Phase 7-9 완전 구현 (경제 국면 판별 시스템 + 그리드 전환 + 로딩/에러/성능 최적화)
  - Phase 7: cycleCalculator.ts + CyclePanel (4축 게이지, 국면 판별, 자산 추천)
  - Phase 8: IndicatorGrid + CompactIndicatorCard (탭 제거, 3단계 정보 계층)
  - Phase 9: Skeleton UI + ErrorBoundary + fetchWithRetry + React.memo
- **Previous Session (2025-11-17):** ✅ 웹 애플리케이션 효율성 향상 플레이북 Phase 1-3 (shadcn/ui + TanStack Query + ErrorBoundary + Toast + Zustand + Playwright E2E)

---

## 1) Mission / Non-Goals
- **Mission (one-liner):** 경제지표를 크롤링하여 웹사이트에 실시간 표시하는 시스템 구축
- **Non-Goals:** 브레인스토밍 금지 / 범위 밖 리팩토링 금지 / 불필요한 포맷팅 변경 금지.

---

## 2) Architecture Snapshot
- **Context:** Python Flask 백엔드 + React/Next.js 프론트엔드로 구성된 경제지표 대시보드
- **Services/Modules:** Flask API (크롤링/데이터 제공), Next.js Frontend (대시보드 UI)
- **Data Flow:** 크롤링 → Flask API → JSON 응답 → Next.js Frontend → 사용자 대시보드
- **External Deps:** 경제지표 웹사이트 (크롤링 대상), BeautifulSoup4, requests

> 상세 다이어그램은 /docs/ARCHITECTURE.md

---

## 3) Repo Map (Brief)

investment-app/
├─ backend/             # Python Flask API
│  ├─ app.py           # Flask 앱 엔트리포인트
│  ├─ requirements.txt # Python 의존성
│  └─ .env.example     # 환경변수 템플릿
├─ frontend/           # Next.js React 앱
└─ CLAUDE.md          # 프로젝트 컨텍스트


---

## 4) Runbook / Environment
- **Language/Runtime:** Python 3.11 (backend), Node 20 (frontend)
- **Package mgr:** pip (backend), npm (frontend)
- **Setup:**
  - Backend: `pip install -r requirements.txt`
  - Frontend: `npm install`
  - 환경변수: backend/.env.example 참조
- **Dev Run:** Backend: `python app.py`, Frontend: `npm run dev`
- **Test:** TBD
- **Build:** Frontend: `npm run build`
- **Lint/Format/Typecheck:** Frontend: `npm run lint`
- **Local URLs:** Backend: http://localhost:5000, Frontend: http://localhost:3000
- **Production URLs:** Backend: https://investment-app-backend-x166.onrender.com, Frontend: https://investment-app-rust-one.vercel.app
- **Secrets:** `.env` 사용. **절대** 코드/로그/PR에 노출 금지.

---

## 5) Conventions
- **Code Style:** <ESLint/Prettier | Black/isort | gofmt> (자동화 우선)
- **Commits:** Conventional Commits
  - `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`, `perf:`, `build:`, `ci:`
- **Branching:** `main` 보호 / feature 브랜치 `feat/<topic>` / hotfix는 `hotfix/<ticket>`
- **PR Rules:** 작은 단위, 스크린샷/로그 포함, TODO 금지(티켓으로 전환)
- **Versioning:** SemVer (lib) / 릴리스 태그 (app)

---

## 6) Quality Gates (DoD)
- ✅ 유닛테스트 추가/갱신, 커버리지 ≥ <N>%  
- ✅ lint/format/typecheck 통과  
- ✅ 로깅/에러 핸들링 추가 (경계/실패 경로 포함)  
- ✅ 문서 갱신(`/docs/CHANGELOG.md`, 사용법 변화 반영)  
- ✅ 보안 점검(비밀키/토큰/PII 노출 없음)

---

## 7) Testing Strategy
- **Unit:** 핵심 로직, 경계/에러 경로 우선
- **Integration:** 외부 I/O는 가짜/contract 테스트
- **E2E (선택):** 핵심 사용자 흐름 1~2개
- **Fixtures:** `tests/fixtures/` 재사용
- **Commands:** `<test commands>`

---

## 8) Observability
- **Logs:** 구조화(JSON), 레벨링(`debug|info|warn|error`)
- **Metrics:** 기본 지표(요청 수, 지연, 에러율)
- **Tracing:** (있다면) 트레이스 ID 전파
- **Feature Flags:** 토글 경로와 기본값 명시

---

## 9) Security & Privacy
- **Secrets:** 환경변수만, Secret Manager 권장
- **Deps:** 취약점 스캔(주기/커맨드)
- **AuthZ/AuthN:** 최소 권한
- **PII:** 저장/로그/전송 정책 명시 (없으면 “없음”)

---

## 10) Data & Migration
- **Schemas:** 위치/버전
- **Migrations:** 도구/실행 순서/롤백 절차
- **Backups:** 주기/복구 절차(있으면 링크)

---

## 11) Release / CI-CD
- **Pipelines:** 빌드→테스트→패키징→배포
- **Envs:** dev / staging / prod (승인 필요)
- **Rollout:** 점진 배포/헬스체크/롤백 전략

---

## 12) Tasks (Single Source of Truth)
### Active (in this session)
- 없음

### Recent Done (Current Session - 2025-11-21)
- **T-097:** Phase 8 옵셔널 IndicatorGrid 정렬 기능 완전 구현 ✅ (2025-11-21) - 3가지 정렬 옵션 추가 (기본순/가나다순/영향력순) + localeCompare 한글 정렬 + 서프라이즈 절대값 내림차순 정렬 + 정렬 UI (초록색 버튼, 아이콘) + useMemo로 필터링+정렬 최적화 + 커밋 2개 (23081d2, 3eec642 docs)
- **T-096:** Phase 7-3 실제 CPI/금리 데이터 크롤링 연동 완전 구현 ✅ (2025-11-21) - 기존 백엔드 크롤러 활용 (cpi.py, ten_year_treasury.py, federal_funds_rate.py) + API 엔드포인트 활용 (/api/rawdata/cpi, /api/rawdata/ten-year-treasury, /api/rawdata/federal-funds-rate) + indicators/page.tsx 하드코딩 제거 (CPI 2.8, nominalRate 4.5, fedRate 5.25 → 실시간 페칭) + fetchJsonWithRetry로 3번 재시도 로직 적용 + 실패 시 폴백값으로 안정성 보장 + 문자열(%) 및 숫자 타입 모두 처리 + 커밋 2개 (96dad96 rebased to c23d0fe, 89b402c docs)
- **T-095:** Phase 9 로딩/에러/성능 최적화 완전 구현 ✅ (2025-11-21) - Phase 9-1: Skeleton UI (CyclePanelSkeleton + IndicatorGridSkeleton, 로딩 중 실제 레이아웃 미리보기) + Phase 9-2: ErrorBoundary (전역 에러 캐치, 개발/프로덕션 구분, 페이지 새로고침/이전 페이지 버튼) + Phase 9-3: fetchWithRetry (최대 3번 재시도, 지수 백오프, Render cold start 복구) + Phase 9-4: React 성능 최적화 (CompactIndicatorCard/GaugeCard React.memo, IndicatorGrid useMemo/useCallback) + 커밋 5개 (ad7f6e3, ae6309c, b854e50, e6a3ec5, 2fb4864)
- **T-094:** Phase 8 그리드 시스템 및 탭 제거 완전 구현 ✅ (2025-11-21) - IndicatorGrid 컴포넌트 (7개 카테고리 필터, 반응형 1/2/3/4칸 그리드) + CompactIndicatorCard (카테고리 태그, 상태 배지, 변화량 표시, Tailwind 정적 클래스) + mapIndicatorToCategory 헬퍼 함수 + 6개 탭 네비게이션 완전 제거 + 3단계 정보 계층 (CyclePanel → IndicatorGrid → 상세 섹션) + 사용하지 않는 import/state 정리 (81줄 제거) + 커밋 4개 (d88b0c5, 8b31681, a6920f4, 07bc63e)
- **T-093:** Phase 7 경제 국면 판별 시스템 완전 구현 ✅ (2025-11-21) - cycleCalculator.ts 유틸리티 함수 (500+ 줄, 4축 점수 계산, 6가지 국면 판별, 추천 자산 맵핑, 신뢰도 계산) + CyclePanel 컴포넌트 (4개 원형 게이지, 국면 표시, 자산 추천 배지, 반응형 2x2→4칸 그리드) + indicators/page.tsx 통합 (fetchAndCalculateCycle, 임시 하드코딩 데이터 사용) + ESLint any 타입 오류 수정 + ECONOMIC_INDICATORS_ROADMAP.md 문서 작성 + 커밋 2개 (5a8e476, cea9fef, d75eec8)
- **T-092:** Phase 1-6 theme.ts 통합 완료 확인 ✅ (2025-11-21) - StandardHistoryTable, EconomicIndicatorCard, DataCharts, UpdateButton, EconomicIndicatorsSection, TabNavigation 모든 컴포넌트 theme.ts 통합 완료 (이전 세션)

### Recent Done (Previous Sessions)
- **T-088:** 웹 애플리케이션 효율성 향상 Phase 3 완전 구현 ✅ (2025-11-17) - Playwright E2E 테스트 프레임워크 설치 및 설정 + 인증 E2E 테스트 (auth.spec.ts: 로그인/회원가입/폼검증/세션관리) + 포트폴리오 E2E 테스트 (portfolio.spec.ts: 자산CRUD/필터링/키보드네비게이션/반응형) + axe-core 접근성 자동 검증 (WCAG 2.1 AA 준수) + 테스트 스크립트 4개 추가 (test:e2e, test:e2e:ui, test:e2e:headed, test:e2e:debug) + 커버리지 50% 달성 + e2e/README.md 문서화
- **T-087:** 웹 애플리케이션 효율성 향상 Phase 2 선택적 개선 완전 구현 ✅ (2025-11-17) - Zustand 상태 관리 시스템 추가 (이미 설치된 패키지 활용) + usePortfolioUIStore 구현 (필터/정렬/모달/펼치기/차트뷰/히스토리 상태 중앙 관리) + useUserSettingsStore 구현 (목표설정/UI설정 중앙 관리) + localStorage persist middleware로 설정 영구 저장 + Redux DevTools 지원 + PortfolioFilters 데모 컴포넌트 작성 (향후 마이그레이션 템플릿)
- **T-086:** 웹 애플리케이션 효율성 향상 Phase 2 완전 구현 ✅ (2025-11-17) - ErrorBoundary 컴포넌트 구현 (React 에러 캐치, 사용자 친화적 UI, 개발환경 스택 트레이스) + shadcn/ui Sonner Toast 설치 및 설정 + TanStack Query hooks에 Toast 통합 (useCreateAsset/useUpdateAsset/useDeleteAsset 성공/실패 toast) + 10개 alert() 제거 및 Toast 교체 (EnhancedPortfolioForm 2개, PortfolioDashboard 8개) + Providers에 ErrorBoundary + Toaster 전역 적용 + ESLint no-explicit-any 오류 수정
- **T-085:** 웹 애플리케이션 효율성 향상 Phase 2 시작 완전 구현 ✅ (2025-11-17) - TanStack Query 5.x + Zustand 5.x + React Query DevTools 설치 + QueryClient Provider 설정 (1분 staleTime, 5분 gcTime, retry 1회) + usePortfolio.ts custom hooks 작성 (useAssets/useCreateAsset/useUpdateAsset/useDeleteAsset) + PortfolioDashboard TanStack Query 완전 전환 (101줄 제거, 낙관적 업데이트) + EnhancedPortfolioForm useCreateAsset 통합 (26줄 제거) + 총 127줄 보일러플레이트 제거 + TypeScript 타입 안전성 100%
- **T-084:** 웹 애플리케이션 효율성 향상 Phase 1 완전 구현 ✅ (2025-11-17) - shadcn/ui 초기화 및 설정 + Zod 4.x + React Hook Form 7.x 설치 + portfolioFormSchema Zod 스키마 작성 (15개 필드 검증) + EnhancedPortfolioForm shadcn/ui 완전 전환 (Form/Input/Select/Textarea/Button 컴포넌트) + watch() + useMemo로 성능 최적화 + 모든 기본 필드 자동 검증 + TypeScript 타입 추론 완벽 지원

### Recent Done (Previous Sessions)
- **T-083:** 가계부 목표 지출/수입 게이지 시스템 완전 구현 ✅ (2025-11-15) - 백엔드 API (/api/expense-budget-goals GET/POST) + PostgreSQL expense_budget_goals 테이블 (JSONB 구조) + ExpenseGoalGauge 컴포넌트 (대분류/소분류 목표 설정 + 진행률 게이지) + IncomeGoalGauge 컴포넌트 (4개 대분류 + 소분류별 목표) + ExpenseManagementDashboard 통합 (2열 그리드 레이아웃) + 실시간 목표 저장/로드 + 펼치기/접기 UI + 진행률 색상 시스템 (지출: 100%=빨강, 수입: 100%=초록)
- **T-082:** 가계부 차트 타입 변경 및 데이터 처리 개선 완전 구현 ✅ (2025-11-11) - 지출/수입 구성 분석 도넛형 전환 + 막대 차트 제거 + 사이드바이사이드 레이아웃 (50% 공간 절약) + 일별/비율 탭 시스템 구현 + 백엔드 문자열 타입 금액 데이터 Number() 변환 (일별/구성/비율 모든 차트) + 천단위 쉼표 포맷팅 (1,000,000원) + TypeScript 타입 에러 완전 해결 + 월별 차트 코드 주석 보존 (12월 활성화 예정) + Vercel 배포 완료
- **T-081:** 가계부 지출 구성 분석 섹션 완전 구현 ✅ (2025-11-08) - 기존 지출분포/카테고리별지출 차트 제거 + 포트폴리오와 동일한 2단계 필터링 시스템 (대분류: 전체/생활/건강/사회/여가/쇼핑/기타 + 소분류: 동적 표시) + 도넛차트(구성 비중) + 막대차트(금액 비교) 이중 레이아웃 + 대분류별 색상 그룹 시스템 (CATEGORY_COLORS) + 소분류 선택 시 개별 거래내역 상세 분석 + Vercel 배포 완료
- **T-080:** 가계부 연도/월 필터링 시스템 완전 구현 ✅ (2025-11-08) - 연도/월 선택 UI (드롭다운 + 이전/다음 버튼) + 백엔드 날짜 범위 필터링 (start_date/end_date) + 프론트엔드 useCallback 기반 데이터 페칭 + 요약 통계/차트/테이블 자동 갱신 + 전체 레이아웃 재구성 (필터 UI 최상단 배치) + Vercel/Render 배포 완료
- **T-079:** 부동산 법무사비용/중개비 필드 추가 시스템 완전 구현 ✅ (2025-10-29) - 백엔드 INSERT 문 lawyer_fee/brokerage_fee 추가 + 프론트엔드 한글/영문 소분류 매칭 호환성 확보 + 수정 모달 스크롤 및 sticky header/footer 구현 + 면적(평) 소수점 둘째자리 입력 지원 (step: 0.01) + 부동산 전용 필드 3개→7개 확장
- **T-078:** 전세 부동산 표시 오류 해결 ✅ (2025-09-30) - rent_type/jeonse_deposit 필드명 불일치 수정 + update_asset 함수 로직 추가 + 조건부 렌더링 개선
- **T-077:** Phase 1.1 부동산 월세/전세 선택 시스템 백엔드 완전 구현 ✅ (2025-09-30) - 백엔드 API에 rent_type/jeonse_deposit 필드 반환 + camelCase 변환 수정 + 프론트엔드 조건부 렌더링 로직 구현 + Vercel/Render 배포 완료 + API 테스트 성공 (ID 86: jeonse_deposit 48M, ID 88: monthly) + 프론트엔드 표시 로직 남은 이슈 확인됨
- **T-077:** 고용지표 시스템 안정성 검증 및 문제 해결 ✅ (2025-09-25) - 비농업고용 404 오류 분석 후 정상 작동 확인 + API 응답 검증 + CORS 설정 확인 + 브라우저 캐시 이슈 해결 가이드 제공
- **T-076:** 고용지표 역방향 색상 로직 완전 수정 ✅ (2025-09-25) - EconomicIndicatorCard에 고용지표 ID 매핑 추가 + getSurpriseColor 함수에 역방향 지표 처리 로직 구현 + 실업률/신규실업급여신청 올바른 색상 표시 (실제 < 예상 = 초록색)
- **T-075:** K 단위 데이터 처리 시스템 완전 구현 ✅ (2025-09-25) - 백엔드 크롤러에서 K 단위 문자열 보존 + 프론트엔드 파싱 함수 확장 + 차트 숫자 변환 + 테이블 원본 표시 + 프로덕션 배포 완료 + 비농업고용/신규실업급여신청 "22K", "218K" 정상 표시
- **T-074:** Render Keep-Alive 시스템 완전 구현 ✅ (2025-09-25) - GitHub Actions 기반 25분 주기 자동 ping + KST 시간대 최적화 (10:00-04:00 활성) + 백엔드 헬스체크 엔드포인트 + 폴백 로직으로 견고한 오류 처리 + 월 60분 사용으로 비용 효율적
- **T-073:** 가계부 시스템 API 인증 일관성 해결 ✅ (2025-09-25) - 포트폴리오 패턴과 동일하게 JWT 대신 user_id 쿼리 파라미터 사용 + 거래내역 로딩 오류 완전 해결 + ExpenseManagementDashboard 정상 작동
- **T-072:** 고용지표 시스템 TypeScript 오류 수정 완료 ✅ (2025-09-24) - safeParseNumber 함수 타입 안전성 강화 + @typescript-eslint/no-explicit-any 규칙 준수 + Vercel 빌드 성공
- **T-071:** 고용지표 JavaScript 런타임 오류 수정 ✅ (2025-09-24) - d.replace is not a function 오류 해결 + 숫자/문자열 혼합 데이터 안전 파싱 + 6개 지표 카드 표시 완료
- **T-070:** Render 배포 오류 수정 완료 ✅ (2025-09-24) - ModuleNotFoundError crawlers.common 해결 + 크롤러 import 경로 수정 (.common → .investing_crawler) + 백엔드 정상 배포
- **T-069:** 경제지표 6개 탭 시스템 Phase 3 고용지표 완전 구현 ✅ (2025-09-24) - 4개 신규 크롤러 + 12개 API 엔드포인트 + 6개 지표 카드 + 탭 데이터 섹션 완료
- **T-068:** 실제 등록일 기반 자산흐름 구현 완료 ✅ (2025-09-24) - 시뮬레이션 데이터 제거 + 실제 등록일 기준 누적 자산흐름 계산 + TypeScript 타입 오류 수정 + Vercel 빌드 성공
- **T-067:** 포트폴리오 수정 모달 소분류별 전용 필드 완전 구현 ✅ (2025-09-24) - 13개 소분류별 전용 필드 수정 지원 + 기존값 자동로드 + getEditSubCategorySpecificFields 함수 + 타입 안전성 강화
- **T-066:** 소분류별 불필요한 입력 필드 제거 시스템 구현 ✅ (2025-09-24) - 부동산/원자재에서 수량/매수평균가 필드 숨김 + showQuantityAndPrice 로직 + 소분류별 맞춤 인터페이스
- **T-065:** 소분류별 전용 필드 자산 추가 시스템 구현 ✅ (2025-09-24) - 13개 전용 필드 동적 렌더링 + getSubCategorySpecificFields 함수 + snake_case 변환 + PostgreSQL 백엔드 저장
- **T-064:** 포트폴리오 데이터 표시 정확성 개선 ✅ (2025-09-24) - 수정 모달 숫자 입력 필드 0 시작 버그 수정 + EditFormData 인터페이스 추가 + 원금/현재가치 구분 표시 + 차트 데이터 일치성 보장 + 목표 추적 정확성 개선
- **T-063:** 포트폴리오 UI 개선 및 상세 통계 시스템 구현 ✅ (2025-09-24) - 소분류 목표 펼치기/접기 + 대분류/소분류별 상세 통계(원금, 총액, 손익, 수익률) + 가시성 문제 해결 + 색상 구분 시스템
- **T-062:** 소분류별 목표 추적 시스템 완전 구현 ✅ (2025-09-24) - 14개 소분류별 개별 목표 카드 + 목표금액/날짜/게이지/D-Day 표시 + PostgreSQL 백엔드 지원 + API 테스트 완료
- **T-061:** 소분류별 목표 시스템 기반 구조 구현 ✅ (2025-09-24) - getSubCategoryGoalProgress 함수 + subCategories 객체 + 백엔드 API 확장 (sub_category_goals JSONB)

### Recent Done
- **T-060:** 로컬 개발 서버 실행 및 6개 탭 시스템 테스트 ✅ (2025-09-23) - Vercel 장애 대응으로 localhost:3000에서 탭 시스템 정상 작동 확인
- **T-059:** TypeScript 빌드 오류 수정 및 배포 최적화 ✅ (2025-09-23) - EconomicIndicatorCard, UpdateButton props 타입 수정 + GitHub 배포 완료
- **T-058:** 경제지표 6개 탭 시스템 Phase 2 구현 완료 ✅ (2025-09-23) - 고용지표 탭 + 실업률 크롤링 + EmploymentTab 컴포넌트 + API 엔드포인트 구현
- **T-057:** 엔터프라이즈 보안 시스템 구현 및 비밀번호 호환성 문제 해결 ✅ (2025-09-23) - bcrypt 12라운드 해싱 + JWT 토큰 + 브루트포스 방지 + 하이브리드 비밀번호 검증 + 계정 관리 기능 완료
- **T-056:** 사용자별 데이터 분리 로직 완전 구현 ✅ (2025-09-23) - 사용자 인증 시스템 + 포트폴리오 데이터 완전 분리 + PostgreSQL 스키마 업데이트 완료
- **T-055:** 사용자 인증 시스템 백엔드+프론트엔드 구현 ✅ (2025-09-23) - PostgreSQL users 테이블, PBKDF2 암호화, 로그인/회원가입 API, AuthForm 컴포넌트, portfolio 페이지 인증 통합 완료
- **T-054:** 2단계 카테고리 시스템 완전 구현 ✅ (2025-09-22) - 소분류 표시/입력/중첩 UI 모든 기능 완료, GitHub/Render 배포 완료
- **T-054:** Vercel 빌드 오류 해결 ✅ (2025-09-22) - JSX 파싱 오류 수정 + 안정적인 빌드 시스템 복원 + 문서화 완료
- **T-053:** 2단계 카테고리 시스템 백엔드 구현 ✅ (2025-09-22) - 백엔드 완료, 프론트엔드 빌드 오류로 일부 롤백
- **T-044:** 포트폴리오 자산 수정 기능 오류 해결 ✅ (2025-09-22)
- **T-045:** 수정 모달 필수 필드 검증 강화 ✅ (2025-09-22)
- **T-042:** 포트폴리오 자산 삭제 기능 구현 ✅ (2025-09-21)
- **T-043:** 포트폴리오 자산군별 그룹화 및 손익 계산 수정 ✅ (2025-09-21)
- **T-000:** 프로젝트 초기 구조 구축 ✅ (Flask + Next.js 기본 골격 완성)
- **T-001:** Raw Data 섹션 UI 구현 ✅ (카드형 경제지표 대시보드 완성)
- **T-002:** Flask API 엔드포인트 구현 ✅ (목업 데이터로 API 응답 구조 완성)
- **T-003:** Investing.com 크롤링 시스템 구현 ✅ (함수 기반 모듈화 완성)
- **T-004:** History Table 실시간 크롤링 검증 ✅ (ISM Manufacturing PMI 6개월 데이터 확인)
- **T-005:** 데이터 섹션 테이블 UI 구현 ✅ (탭 네비게이션 및 깔끔한 표 형식 완성)
- **T-006:** History Table 데이터 백엔드-프론트엔드 연동 ✅ (실시간 크롤링 데이터 표시)
- **T-007:** Raw Data 섹션 실제 크롤링 데이터 연동 ✅ (ISM Manufacturing PMI 카드 구현)
- **T-008:** 데이터 섹션 차트 구현 ✅ (막대형 + 선형 차트, Recharts 사용)
- **T-009:** ISM Non-Manufacturing PMI 지표 추가 ✅ (두 번째 지표 전체 4단계 구현 완료)
- **T-010:** 목업 데이터 제거 및 실제 데이터만 표시 ✅ (CPI, 실업률, GDP 카드 제거)
- **T-011:** S&P Global Composite PMI 지표 추가 ✅ (세 번째 지표 전체 4단계 구현 완료)
- **T-012:** Industrial Production 지표 추가 ✅ (네 번째 지표 전체 4단계 구현 완료)
- **T-013:** 전체 시스템 "미정" 규칙 적용 ✅ (다음 발표일 알 수 없을 때 통합 처리)
- **T-014:** Industrial Production YoY 지표 추가 ✅ (다섯 번째 지표 전체 4단계 구현 완료)
- **T-015:** % 데이터 처리 시스템 구축 ✅ (문자열 저장, 차트 숫자 변환, 원본값 표시)
- **T-016:** 서프라이즈 값 전용 반올림 규칙 ✅ (history data는 원본, surprise만 소수점 2자리)
- **T-017:** DataSection formatValue 오류 수정 ✅ (% 문자열 데이터 타입 처리)
- **T-018:** Vercel + Render 배포 시스템 구축 ✅ (프론트엔드 Vercel, 백엔드 Render 분리 배포)
- **T-019:** CORS 설정 및 502 Bad Gateway 해결 ✅ (Python 3.13 호환성 및 CORS 정책 수정)
- **T-020:** Retail Sales MoM 지표 추가 완료 ✅ (API 응답 구조 표준화로 전체 4단계 완료)
- **T-021:** Retail Sales YoY 지표 추가 완료 ✅ (7번째 지표, 전체 4단계 표준 절차 완료)
- **T-022:** 서프라이즈 값 계산 표준화 ✅ (% 데이터 parsePercentValue 처리, ADR-008 수립)
- **T-023:** 모바일 탭 레이아웃 반응형 최적화 ✅ (가로 스크롤, 축약 이름, 그라데이션 힌트)
- **T-024:** 데이터 로딩 성능 최적화 아키텍처 구현 ✅ (SQLite + v2 API + 수동 업데이트 시스템)
- **T-025:** SQLite 데이터베이스 락 및 CORS 문제 해결 ✅ (WAL 모드, 멀티스레딩 지원, 오류 복구)
- **T-026:** PostgreSQL 마이그레이션 완료 ✅ (Neon.tech 연결, psycopg2 설치, PostgresDatabaseService 구현)
- **T-027:** 로컬 PostgreSQL 테스트 검증 ✅ (데이터 저장/조회 정상, v2 API 응답 확인)
- **T-028:** Render 환경변수 설정 완료 ✅ (DATABASE_URL 추가, 자동 재배포 진행중)
- **T-029:** PostgreSQL 연결 복구 및 실시간 업데이트 검증 ✅ (psycopg2-binary 재추가, Neon DB 저장 확인, last_updated 필드 정상 작동)
- **T-030:** 4단계 배지 시스템 + 추세 분석 구현 완료 ✅ (✅➖⚠️🔴 배지, 실시간 추세 분석, 다중 기준선 차트, 접기/펼치기 설명)
- **T-031:** 실제 히스토리 데이터 기반 추세 계산 로직 구현 ✅ (Michigan Consumer Sentiment 4개월 연속 하락 정확 감지)
- **T-032:** 배지 시스템 접기/펼치기 정보 섹션 추가 ✅ (10개 지표별 상세 설명, 독립적 상태 관리)
- **T-033:** DataSection History Table 색상 로직 수정 ✅ (문자열→숫자 비교로 음수 지표 색상 정상화)
- **T-034:** 프로젝트 문서화 가이드 수립 ✅ (MD 파일 역할 분담, 작업 기록 표준 방식 정의)
- **T-035:** PostgreSQL RealDictRow 접근 오류 수정 ✅ (result[0] → result['id'] 수정, save_asset API 정상화)
- **T-036:** 포트폴리오 백엔드 API 구현 ✅ (/api/portfolio 엔드포인트, get_all_assets 메서드)
- **T-037:** 포트폴리오 프론트엔드 대시보드 구현 ✅ (요약카드, 테이블, 필터링, 정렬)
- **T-038:** 차트 시각화 시스템 구현 ✅ (도넛차트, 막대차트, Recharts 활용)
- **T-039:** 세션 작업 문서화 완료 ✅ (포트폴리오 시스템 구현 가이드 작성 + CLAUDE.md Tasks/ADR 갱신)
- **T-040:** 포트폴리오 대시보드 시스템 구현 완료 ✅ (백엔드 API + 프론트엔드 대시보드 + 차트 시각화 + 실시간 데이터 연동)
- **T-041:** 포트폴리오 수익률 계산 시스템 구현 완료 ✅ (원금/평가액 입력 + 실시간 수익률 계산 + 색상 표시 + 백엔드 저장)
- **T-042:** 포트폴리오 자산 삭제 기능 구현 ✅ (확인 다이얼로그 + DELETE API + 실시간 새로고침, 2025-09-22)
- **T-043:** 포트폴리오 자산군별 그룹화 및 손익 계산 수정 ✅ (자산군별 테이블 그룹화 + 동적 손익 계산 + 시각적 개선, 2025-09-22)
- **T-044:** 포트폴리오 입력 섹션 크기 축소 ✅ (grid 레이아웃으로 절반 크기 조정, 2025-09-22)
- **T-045:** 포트폴리오 자산 수정 기능 구현 ✅ (PUT API + 수정 모달 + 기존값 자동입력 + 실시간 새로고침, 2025-09-22)
- **T-046:** 요약 카드 크기 축소 및 레이아웃 최적화 ✅ (패딩/폰트 축소 + 4개 그래프 반응형 배치, 2025-09-22)
- **T-047:** 포트폴리오 레이아웃 재구성 ✅ (입력폼+사이드패널 3칸그리드 + 메인차트 2개로 단순화, 2025-09-22)
- **T-048:** 고급 목표 추적 시스템 구현 ✅ (목표금액/날짜 입력 + 자산군별 목표설정 + D-Day표시 + 펼치기 기능, 2025-09-22)
- **T-049:** 목표 설정 영구 저장 시스템 구현 ✅ (PostgreSQL goal_settings 테이블 + GET/POST API + 자동로드/저장, 2025-09-22)
- **T-050:** 포트폴리오 테스트 데이터 생성 ✅ (8개 자산군별 다양한 임의데이터 생성 + API 연동 검증, 2025-09-22)
- **T-051:** 자산군 유동성 기준 재분류 ✅ (4개 대분류: 즉시현금/예치자산/투자자산/대체투자 + 기존 14개 자산 재분류, 2025-09-22)
- **T-052:** 2단계 카테고리 시스템 구현 ⚠️ (대분류-소분류 구조 설계 + 프론트엔드 폼 + 백엔드 스키마 완료, 데이터 전송 문제 남음, 2025-09-22)

### Backlog (다음 세션에서 진행)

**권장 다음 작업 순서**:
1. **Phase 10 홈페이지 대시보드** (사용자에게 가장 눈에 띄는 개선)
2. **Phase 7-3 크롤링 추가** (임시 하드코딩 제거)
3. **Phase 8 선택적 개선** (스파크라인, 상세 모달)

**최우선 순위 (Phase 7-3 또는 Phase 10)**:
- **B-015:** Phase 7-3: CPI/금리 크롤링 추가 (낮은 우선순위)
  - CPI 크롤러 추가 (`/backend/crawlers/cpi_crawler.py`)
  - 10년물 국채금리 크롤러 (`/backend/crawlers/treasury_crawler.py`)
  - 연준 기준금리 크롤러 (`/backend/crawlers/fed_rate_crawler.py`)
  - `/api/v2/indicators` 응답에 3개 지표 추가
  - 프론트엔드 하드코딩 제거 (indicators.cpi, nominalRate, fedRate)

- **B-016:** Phase 10: 홈페이지 대시보드 구현 (높은 우선순위)
  - `/frontend/src/app/page.tsx` 대시보드 레이아웃
  - 3개 요약 카드: 경제 국면/내 자산/가계부 지출
  - 최근 업데이트 피드 컴포넌트
  - 빠른 액션 버튼 (자산 추가, 지출 기록, 지표 업데이트)

**Phase 8 선택적 개선**:
- **B-017:** Mini 스파크라인 차트 (CompactIndicatorCard에 추가)
- **B-018:** 상세 모달/패널 (onIndicatorClick 핸들러 구현)
- **B-019:** 정렬 기능 (최신순, 중요도순, 알파벳순)

**장기 Backlog**:
- **B-010:** 추가 경제지표 확장 (목표: 20개 지표, 6개 탭 각각 3-5개)
- **B-011:** 데이터 알림 및 임계값 설정 기능
- **B-012:** 고급 차트 시각화 (비교 차트, 상관관계 분석)
- **B-013:** 사용자 대시보드 커스터마이징
- **B-014:** 데이터 내보내기 기능 (CSV, PDF)

> 원칙: **세션당 Active ≤ 2**.

---

## 12.1) Session Summary (2025-11-21)

### 세션 목표
경제지표 페이지 개선 Phase 7-9 완전 구현

### 완료된 작업 (커밋 13개)

**Phase 7: 경제 국면 판별 시스템**
- `5a8e476` - feat: Phase 7-1 경제 국면 판별 시스템 구현
- `cea9fef` - fix: ESLint any 타입 에러 수정
- `d75eec8` - docs: Phase 7-8 완료 상태 로드맵 업데이트

**Phase 8: 그리드 시스템 및 탭 제거**
- `d88b0c5` - feat: Phase 8 경제지표 그리드 시스템 완전 구현
- `8b31681` - refactor: 탭 시스템 제거 및 그리드 전용 인터페이스로 전환
- `a6920f4` - fix: CompactIndicatorCard 동적 Tailwind 클래스 문제 해결
- `07bc63e` - feat: 상세 지표 섹션 복원 및 3단계 정보 계층 완성

**Phase 9: 로딩/에러/성능 최적화**
- `ad7f6e3` - feat: Phase 9-1 Skeleton UI 로딩 상태 구현
- `ae6309c` - feat: Phase 9-2 Error Boundary 전역 에러 처리 구현
- `b854e50` - feat: Phase 9-3 API 재시도 로직 구현
- `e6a3ec5` - perf: Phase 9-4 React 성능 최적화 (memo, useMemo, useCallback)
- `2fb4864` - docs: Phase 9 완료 상태 로드맵 업데이트

### 생성된 파일 (9개)
- `/frontend/src/utils/cycleCalculator.ts` (500+ 줄) - 4축 점수 계산, 국면 판별 알고리즘
- `/frontend/src/components/CyclePanel.tsx` (180+ 줄) - 경제 국면 판별 패널
- `/frontend/src/components/IndicatorGrid.tsx` (120+ 줄) - 그리드 레이아웃 + 필터
- `/frontend/src/components/CompactIndicatorCard.tsx` (150+ 줄) - 간결한 지표 카드
- `/frontend/src/components/skeletons/CyclePanelSkeleton.tsx` (80+ 줄)
- `/frontend/src/components/skeletons/IndicatorGridSkeleton.tsx` (60+ 줄)
- `/frontend/src/components/ErrorBoundary.tsx` (100+ 줄)
- `/frontend/src/utils/fetchWithRetry.ts` (70+ 줄)
- `/docs/ECONOMIC_INDICATORS_ROADMAP.md` (300+ 줄) - 전체 Phase 로드맵

### 수정된 파일 (3개)
- `/frontend/src/app/indicators/page.tsx` - CyclePanel + IndicatorGrid 통합, 탭 제거, Skeleton/ErrorBoundary 적용
- `/frontend/src/components/CyclePanel.tsx` - React.memo 최적화
- `/frontend/src/components/IndicatorGrid.tsx` - useMemo/useCallback 최적화

### 성과
- 6개 탭 네비게이션 → 단일 그리드 전환 (81줄 제거)
- 경제 국면 자동 판별 시스템 완성
- 로딩 체감 속도 향상 (스켈레톤 UI)
- 안정성 강화 (에러 복구 + 재시도)
- 렌더링 성능 최적화 (메모이제이션)

### 남은 작업
- Phase 7-3: CPI/금리 크롤링 추가 (임시 하드코딩 제거)
- Phase 10: 홈페이지 대시보드 구현
- Phase 8 선택적 개선: 스파크라인, 상세 모달, 정렬 기능

### 브랜치
- **작업 브랜치**: `claude/investment-app-features-01UrF1igfrrHc3WD2SQZy6L2`
- **메인 브랜치**: (수동 머지 필요 - Claude Code는 main 브랜치 푸시 불가)

---

## 13) ADR (Architecture Decision Records)
### ADR-001: Investing.com 크롤링 아키텍처 결정
- Date: 2025-09-17
- Context: 경제지표 실시간 데이터 수집을 위한 크롤링 시스템 필요
- Options: 직접 크롤링 vs API 연동 vs 데이터 제공업체 이용
- Decision: Investing.com History Table 직접 크롤링 (함수 기반 모듈화)
- Consequences:
  - 장점: 무료, 실시간성, 다양한 지표 접근 가능
  - 단점: 웹사이트 구조 변경 리스크, 안정성 이슈 가능성
  - 대응: 함수 기반 모듈화로 유지보수성 확보

### ADR-002: 크롤링 데이터 구조 표준화
- Date: 2025-09-17
- Context: https://www.investing.com/economic-calendar/(지표) 형태 URL들의 일관된 처리 필요
- Options: 지표별 개별 파서 vs 통합 파서
- Decision: 통합 History Table 파서 구조 사용
- Consequences:
  - 모든 investing.com 경제지표 페이지는 동일한 History Table 구조 사용
  - Release Date, Time, Actual, Forecast, Previous 컬럼 표준화
  - 확장성: 새로운 지표 추가 시 URL만 변경하면 됨

### ADR-003: 경제지표 구현 표준 절차 수립
- Date: 2025-09-17
- Context: 10개 지표 확장을 위한 일관된 구현 프로세스 필요
- Options: 지표별 개별 구현 vs 표준 절차 수립
- Decision: 4단계 표준 절차 수립
- Consequences:
  - **1단계:** 백엔드 크롤링 모듈 구현 (ADR-007 표준 API 응답 구조 준수)
  - **2단계:** Raw Data 카드 연동 (fetchXXXData 함수 추가, surprise 계산)
  - **3단계:** 데이터 섹션 테이블 연동 (탭 추가, History Table 표시)
  - **4단계:** 차트 구현 (기존 DataCharts 컴포넌트 자동 처리)
  - **핵심:** ADR-007의 표준 API 구조를 반드시 준수해야 프론트엔드 연동 성공
  - **필수 체크:** 서프라이즈 값 계산 검증 (% 데이터는 parsePercentValue 사용)

### ADR-004: 다음 발표일 "미정" 표시 규칙
- Date: 2025-09-17
- Context: 일부 지표는 다음 발표 예정일이 크롤링 데이터에 없어 불확실한 추정값 표시 문제
- Options: 자동 날짜 추정 vs 미정 표시 vs 빈값 처리
- Decision: 다음 발표일 알 수 없으면 "미정" 표시
- Consequences:
  - 사용자에게 정확한 정보 상태 전달 (추정값으로 혼동 방지)
  - extract_raw_data() 함수에 통합 적용으로 모든 크롤러 일관성 확보
  - Industrial Production: "미정", PMI 지표들: 실제 발표일 표시
  - 향후 모든 신규 지표도 동일 규칙 자동 적용

### ADR-005: % 데이터 처리 시스템 설계
- Date: 2025-09-17
- Context: Industrial Production YoY 같은 지표는 % 단위 데이터로 제공되며 별도 처리 필요
- Options: % 제거 후 숫자 변환 vs % 포함 문자열 저장 vs 별도 단위 필드 추가
- Decision: % 포함 문자열로 저장하되 차트에서만 숫자 변환
- Consequences:
  - Raw Data/History Table: "0.87%" 문자열 그대로 표시
  - 차트 데이터: parseChartValue()로 0.87 숫자 변환
  - 차트 Tooltip: 원본 "0.87%" 값 표시 (originalValue 필드 활용)
  - formatValue() 함수에서 문자열/숫자 타입 모두 처리
  - 데이터 원본성 보장하면서 시각화 호환성 확보

### ADR-006: 데이터 반올림 정책 세분화
- Date: 2025-09-17
- Context: History data 정확성과 UI 가독성 균형 필요
- Options: 전체 반올림 vs 전체 원본 vs 선택적 반올림
- Decision: 서프라이즈 값만 반올림(소수점 2자리), 나머지는 원본 유지
- Consequences:
  - History data: 크롤링 원본 그대로 저장/표시
  - Surprise 계산: Math.round((actual - forecast) * 100) / 100
  - Surprise 표시: .toFixed(2)로 일관된 포맷
  - 데이터 무결성과 사용자 경험 모두 확보

### ADR-007: API 응답 구조 표준화
- Date: 2025-09-17
- Context: Retail Sales MoM 추가 시 API 응답 구조 불일치로 프론트엔드 연동 실패
- Options: 프론트엔드 수정 vs 백엔드 표준화 vs 개별 처리
- Decision: 모든 /api/rawdata/* 엔드포인트를 표준 구조로 통일
- Consequences:
  - **표준 응답 구조**: `{status: "success", data: {latest_release, next_release}, source: "investing.com", indicator: "지표명"}`
  - **오류 응답 구조**: `{status: "error", message: "오류메시지"}` (500 상태 코드)
  - **크롤링 함수 표준**: `extract_raw_data(rows)` 호출, `{"error": "메시지"}` 반환 시 오류 처리
  - **프론트엔드 호환성**: 모든 지표가 `result.data.latest_release` 접근 패턴 사용

### ADR-008: 서프라이즈 값 계산 표준화
- Date: 2025-09-17
- Context: 일부 지표의 서프라이즈 값이 표시되지 않는 문제 발견
- Options: 전체 지표 서프라이즈 제거 vs 계산 가능한 지표만 표시 vs 통합 처리 로직
- Decision: 데이터 타입별 서프라이즈 계산 로직 표준화
- Consequences:
  - **숫자 데이터**: 기존 로직 유지 `(actual - forecast)`
  - **% 문자열 데이터**: `parsePercentValue()` 함수로 변환 후 계산
  - **forecast 없는 지표**: surprise = null (Industrial Production YoY, Retail Sales YoY)
  - **표시 규칙**: surprise가 null이면 "-" 표시, 숫자면 소수점 2자리 반올림
  - **신규 지표 체크리스트**: 2단계에서 반드시 서프라이즈 계산 검증 필수
  - 신규 지표 추가 시 이 구조를 반드시 준수해야 함

### ADR-009: 데이터 로딩 성능 최적화 아키텍처
- Date: 2025-09-17
- Context: 실시간 크롤링으로 인한 초기 로딩 시간 문제 (10-15초)
- Options: 캐싱 vs 데이터베이스 저장 vs 백그라운드 스케줄링
- Decision: SQLite 데이터베이스 + 수동 업데이트 시스템
- Consequences:
  - **성능 개선**: 페이지 로딩 10-15초 → 1-2초 (85% 단축)
  - **사용자 경험**: 즉시 데이터 확인 + 선택적 실시간 업데이트
  - **아키텍처**: 실시간 크롤링 → 데이터베이스 조회 + 수동 크롤링
  - **기술 스택**: SQLite WAL 모드, v2 API 엔드포인트, React 업데이트 버튼
  - **데이터 신선도**: 마지막 크롤링 시점 표시, 업데이트 버튼으로 최신화

### ADR-010: SQLite 멀티스레딩 및 락 해결
- Date: 2025-09-17
- Context: 동시 크롤링 시 "database is locked" 오류 발생
- Options: MySQL 전환 vs SQLite 최적화 vs 락 제어 로직
- Decision: SQLite WAL 모드 + 연결 최적화
- Consequences:
  - **WAL 모드**: Write-Ahead Logging으로 동시 읽기/쓰기 지원
  - **연결 설정**: timeout=30초, check_same_thread=False
  - **PRAGMA 최적화**: cache_size=1000, synchronous=NORMAL
  - **오류 복구**: try-catch 포괄, 기본값 반환, 상세 로깅
  - **확장성**: 7개 지표 동시 크롤링 지원

### ADR-011: PostgreSQL 데이터 지속성 복구
- Date: 2025-09-18
- Context: Render 컨테이너 재시작으로 SQLite 데이터 손실, PostgreSQL 연결 끊김 문제
- Options: SQLite 유지 vs PostgreSQL 복구 vs 하이브리드 접근
- Decision: Neon.tech PostgreSQL 완전 복구 + 실시간 업데이트 검증
- Consequences:
  - **데이터 지속성**: 컨테이너 재시작 후에도 데이터 영구 보존
  - **성능 유지**: 기존 v2 API + 데이터베이스 조회 속도 1-2초
  - **실시간 검증**: last_updated 필드로 업데이트 시점 추적 가능
  - **장기 안정성**: 30분 비활성화 후에도 데이터 손실 없음
  - **검증 완료**: 실시간 업데이트 시 Neon DB 저장 확인 (2025-09-17T15:30→15:44 갱신)

### ADR-012: DataSection 색상 로직 표준화
- Date: 2025-09-18
- Context: History Table에서 음수 경제지표 색상이 반대로 표시되는 문제 발견
- Options: 문자열 비교 유지 vs parsePercentValue 도입 vs 새로운 비교 함수
- Decision: parsePercentValue 함수를 DataSection에 도입하여 숫자 비교로 변경
- Consequences:
  - **정확성**: 음수 지표에서 올바른 예측 초과/미달 색상 표시
  - **일관성**: EconomicIndicatorCard와 동일한 로직 사용
  - **확장성**: 향후 모든 퍼센트 데이터 비교에 표준 적용 가능
  - **검증**: GDP, Retail Sales, Industrial Production 모든 음수 케이스 정상화
  - **유지보수**: JavaScript 문자열 vs 숫자 비교 함정 예방

### ADR-013: 프로젝트 문서화 표준 수립
- Date: 2025-09-18
- Context: 프로젝트 문서가 분산되어 일관성 부족, 작업 기록 방식 표준화 필요
- Options: 단일 문서 vs 역할별 분리 vs 자동화 도구
- Decision: MD 파일 역할별 분리 + 표준 작업 기록 방식 수립
- Consequences:
  - **CLAUDE.md**: 세션 관리 (Tasks/ADR) 전용
  - **docs/**: 기술 구현 가이드 전용
  - **루트 분석 파일**: 복잡한 이슈 해결 기록 전용
  - **표준화**: 네이밍 컨벤션 및 템플릿 제공
  - **효율성**: 향후 유지보수 및 온보딩 개선

### ADR-014: 포트폴리오 대시보드 아키텍처 설계
- Date: 2025-09-20
- Context: 포트폴리오 자산 관리를 위한 통합 대시보드 시스템 필요
- Options: 단순 리스트 vs 대시보드 vs 외부 서비스 연동
- Decision: 백엔드 API + 프론트엔드 대시보드 + 차트 시각화 통합 시스템
- Consequences:
  - **백엔드**: `/api/portfolio` 엔드포인트, get_all_assets 메서드로 PostgreSQL 연동
  - **프론트엔드**: 요약카드 + 테이블 + 차트로 구성된 종합 대시보드
  - **차트**: Recharts 라이브러리로 도넛차트(비중) + 막대차트(금액) 시각화
  - **필터링**: 자산군별 필터 + 금액/수익률/이름 정렬 기능
  - **실시간성**: 자산 추가 후 즉시 대시보드 새로고침

### ADR-015: PostgreSQL RealDictRow 데이터 접근 표준화
- Date: 2025-09-20
- Context: PostgreSQL save_asset 메서드에서 "Error saving asset: 0" 발생
- Options: SQLite 전환 vs PostgreSQL 수정 vs 하이브리드 유지
- Decision: RealDictRow 객체의 올바른 딕셔너리 접근 방식 적용
- Consequences:
  - **수정 내용**: `result[0]` → `result['id']`로 변경
  - **원인**: RealDictRow는 딕셔너리 형태 접근 필요, 인덱스 접근 시 오류
  - **영향**: save_asset API 정상화, 포트폴리오 자산 저장 완전 복구
  - **예방**: 향후 PostgreSQL 쿼리 결과는 컬럼명으로 접근 필수
  - **검증**: 실제 Neon PostgreSQL에 자산 데이터 영구 저장 확인


### ADR-016: 동적 폼 필드 시스템 설계
- Date: 2025-09-20
- Context: 자산군별로 필요한 입력 필드가 다름 (주식 vs 부동산 vs 현금)
- Options: 모든 필드 노출 vs 조건부 렌더링 vs 단계별 입력
- Decision: React 조건부 렌더링 기반 동적 필드 시스템
- Consequences:
  - **UX 향상**: 자산군 선택 시 관련 필드만 표시
  - **데이터 정확성**: 자산군별 필수 필드 강제 검증
  - **실시간 계산**: 수량×평균가 자동 총액 계산
  - **유지보수성**: 새 자산군 추가 시 간단한 배열 수정만 필요
  - **확장성**: 향후 복잡한 자산 계산 로직 추가 가능

### ADR-017: 수익률 계산 시스템 아키텍처
- Date: 2025-09-21
- Context: 포트폴리오 수익률 추적을 위한 원금/평가액 분리 입력 및 실시간 계산 필요
- Options: 자동 시세 API 연동 vs 수동 입력 vs 하이브리드 접근
- Decision: 원금/평가액 수동 입력 + 실시간 계산 + 백엔드 저장 시스템
- Consequences:
  - **정확성**: 실제 매수가격과 현재가격을 정확히 구분하여 수익률 계산
  - **유연성**: 수량×평균가와 다른 실제 매수금액(수수료 등 포함) 입력 가능
  - **실시간성**: 폼에서 입력과 동시에 수익/손실, 수익률 % 즉시 표시
  - **색상 구분**: 수익(초록)/손실(빨강) 시각적 구분으로 직관적 이해
  - **데이터 지속성**: PostgreSQL에 principal, profit_loss, profit_rate 저장
  - **확장성**: 향후 실시간 시세 API 연동 시 평가액 자동 업데이트 가능
  - **제한사항**: 현재 시세는 수동 입력이므로 실시간 추적에 한계

### ADR-018: 포트폴리오 자산 삭제 시스템 설계
- Date: 2025-09-21
- Context: 포트폴리오에서 불필요한 자산을 제거할 수 있는 삭제 기능 필요
- Options: 소프트 삭제(휴지통) vs 하드 삭제 vs 아카이브 시스템
- Decision: 확인 다이얼로그를 통한 하드 삭제 시스템
- Consequences:
  - **안전장치**: "정말로 삭제하시겠습니까?" 확인 다이얼로그로 실수 방지
  - **시각적 피드백**: 빨간색 휴지통 아이콘으로 직관적 UI
  - **백엔드 검증**: 자산 존재 여부 확인 후 삭제 진행
  - **실시간 업데이트**: 삭제 후 포트폴리오 자동 새로고침
  - **CORS 해결**: DELETE 메서드를 CORS 허용 목록에 추가
  - **제한사항**: 삭제된 데이터 복구 불가 (향후 휴지통 기능 검토 필요)

### ADR-019: 포트폴리오 자산군별 그룹화 UI 설계
- Date: 2025-09-21
- Context: 다양한 자산군(주식, 현금, 펀드 등)을 체계적으로 관리하기 위한 UI 개선 필요
- Options: 단일 테이블 유지 vs 자산군별 그룹화 vs 탭 기반 분리
- Decision: 자산군별 그룹화된 테이블 + 그라데이션 헤더 시스템
- Consequences:
  - **시각적 구분**: 자산군마다 그라데이션 헤더로 명확한 구분
  - **통계 표시**: 각 그룹의 자산 개수와 총액을 헤더에 표시
  - **독립적 관리**: 자산군별로 독립된 테이블로 관리 편의성 향상
  - **원금/평가액 분리**: 별도 컬럼으로 투자 성과 명확히 표시
  - **동적 계산**: principal이 null인 기존 데이터는 amount로 폴백
  - **확장성**: 새로운 자산군 추가 시 자동으로 그룹 생성
  - **반응형 디자인**: 모바일에서도 그룹별로 깔끔한 표시

### ADR-020: 동적 손익 계산 로직 표준화
- Date: 2025-09-21
- Context: 기존 저장된 profit_loss, profit_rate 데이터가 0 또는 null로 부정확한 문제
- Options: 데이터 마이그레이션 vs 동적 계산 vs 하이브리드 접근
- Decision: 백엔드에서 실시간 동적 계산 + 폴백 로직 적용
- Consequences:
  - **데이터 정확성**: 실시간으로 (평가액-원금)/원금×100 계산
  - **폴백 로직**: principal이 null이면 amount를 원금으로 사용
  - **기존 호환성**: 저장된 profit 값 무시하고 동적 계산 우선
  - **성능 최적화**: 조회 시점에만 계산하므로 저장 용량 절약
  - **일관성 보장**: 모든 자산이 동일한 계산 로직 적용
  - **확장성**: 향후 복잡한 수익률 계산 로직 추가 용이

### ADR-021: 2단계 카테고리 시스템 설계
- Date: 2025-09-22
- Context: 기존 단일 자산군 분류로는 세분화된 자산 관리가 어려움, 소분류 필요성 대두
- Options: 기존 구조 유지 vs 대분류-소분류 2단계 vs 다층 구조
- Decision: 유동성 기준 대분류 + 세부 소분류 2단계 시스템 구축
- Consequences:
  - **대분류 체계**: 즉시현금/예치자산/투자자산/대체투자 (유동성 순)
  - **소분류 세분화**: 즉시현금(현금/입출금통장/증권예수금), 예치자산(예금/적금/MMF), 투자자산(국내주식/해외주식/펀드/ETF/채권), 대체투자(암호화폐/부동산/원자재)
  - **프론트엔드**: 대분류 선택 시 소분류 동적 표시, 필수 입력 검증
  - **백엔드**: sub_category 컬럼 추가, save/update/get 모든 API 지원
  - **데이터 호환성**: 기존 자산들은 새 분류 체계로 수동 재분류 완료
  - **미완성 이슈**: 소분류 데이터 전송 시 null로 저장되는 문제 발견, 추가 디버깅 필요

### ADR-022: 포트폴리오 자산 CRUD 시스템 설계
- Date: 2025-09-22
- Context: 포트폴리오 관리를 위한 완전한 자산 관리 시스템 필요
- Options: 단순 추가만 vs 완전한 CRUD vs 외부 서비스 연동
- Decision: 확인 다이얼로그 + 모달 기반 완전한 CRUD 시스템 구현
- Consequences:
  - **삭제 기능**: 확인 다이얼로그로 실수 방지, DELETE API로 안전한 삭제
  - **수정 기능**: 기존값 자동입력 모달로 UX 개선, PUT API로 부분 업데이트
  - **실시간 동기화**: CRUD 작업 후 즉시 포트폴리오 새로고침
  - **데이터 무결성**: PostgreSQL 트랜잭션으로 일관성 보장
  - **확장성**: 향후 일괄 편집, 히스토리 추적 등 고급 기능 추가 가능

### ADR-022: 포트폴리오 UI 레이아웃 최적화 전략
- Date: 2025-09-22
- Context: 정보 밀도가 높아지면서 화면 공간 효율성 문제 발생
- Options: 단일 세로 레이아웃 vs 다중 컬럼 vs 탭 기반 분리
- Decision: 3칸 그리드 + 사이드 패널 + 메인 차트 영역 분리 구조
- Consequences:
  - **공간 효율성**: 입력폼 1칸 + 사이드 정보 2칸으로 화면 활용도 극대화
  - **정보 계층화**: 요약정보(사이드) + 상세분석(메인) 역할 분담
  - **반응형 지원**: LG 이하에서 세로 스택, XL 이상에서 4칸 그리드
  - **UX 개선**: 입력과 동시에 실시간 피드백 확인 가능
  - **확장성**: 새로운 차트나 위젯 추가 시 유연한 배치 가능

### ADR-023: 고급 목표 추적 시스템 아키텍처
- Date: 2025-09-22
- Context: 단순한 고정 목표에서 개인화된 다차원 목표 추적 필요
- Options: 고정 목표 유지 vs 설정 가능한 목표 vs 외부 목표 서비스
- Decision: 로컬 상태 기반 다차원 목표 설정 + 펼치기 UI 시스템
- Consequences:
  - **개인화**: 사용자별 목표 금액, 기한, 자산군별 세부 목표 설정
  - **시각화**: 전체 진행바 + 자산군별 개별 진행바로 상세 추적
  - **동기부여**: D-Day 카운트다운으로 시간 압박감 제공
  - **확장성**: 향후 목표 히스토리, 달성 알림, 목표 공유 기능 추가 가능
  - **제한사항**: 현재 로컬 상태만 사용, 새로고침 시 초기화 (향후 백엔드 저장 필요)

### ADR-024: 목표 설정 데이터 영구 저장 아키텍처
- Date: 2025-09-22
- Context: 사용자 목표 설정이 새로고침 시 초기화되어 사용성 저하 문제
- Options: 로컬스토리지 vs 세션스토리지 vs 데이터베이스 저장
- Decision: PostgreSQL JSONB 기반 목표 설정 저장 + 실시간 동기화
- Consequences:
  - **데이터 지속성**: 새로고침, 재접속 후에도 목표 설정 유지
  - **유연성**: JSONB로 자산군별 목표를 동적으로 저장
  - **실시간 동기화**: 설정 변경 시 즉시 DB 저장, 컴포넌트 마운트 시 자동 로드
  - **사용자 분리**: user_id 기반으로 향후 다중 사용자 지원 가능
  - **확장성**: 목표 히스토리, 알림 설정 등 추가 기능 연동 용이
  - **성능**: UPSERT 패턴으로 중복 데이터 방지 및 빠른 업데이트

### ADR-025: 포트폴리오 테스트 데이터 생성 전략
- Date: 2025-09-22
- Context: 포트폴리오 기능 검증을 위한 체계적인 테스트 데이터 필요
- Options: 하드코딩된 데이터 vs API 기반 생성 vs 랜덤 생성
- Decision: 실제 시장 기반 API 호출로 다양한 자산군 테스트 데이터 생성
- Consequences:
  - **현실성**: 실제 투자 포트폴리오와 유사한 구성으로 테스트
  - **다양성**: 8개 자산군(주식, ETF, 펀드, 현금, 채권, 부동산, 원자재, 기타) 모두 포함
  - **수익률 다양화**: 손실/이익 케이스를 모두 포함하여 UI 검증
  - **스케일 테스트**: 소액(150만원)부터 대액(4억8천만원)까지 다양한 규모
  - **기능 검증**: 그룹화, 수정/삭제, 목표 달성률 등 모든 기능 테스트 가능
  - **시각화 검증**: 차트에서 극값과 평균값 모두 적절히 표현되는지 확인

### ADR-026: 자산 수정 오류 해결 및 데이터베이스 스키마 동기화
- Date: 2025-09-22
- Context: 포트폴리오 자산 수정 시 날짜 형식 오류와 데이터베이스 스키마 불일치 문제 발생
- Options: 프론트엔드 날짜 변환 vs 백엔드 파싱 vs 스키마 수정
- Decision: 프론트엔드 ISO 날짜 변환 + 데이터베이스 updated_at 컬럼 추가
- Consequences:
  - **날짜 호환성**: toISOString().split('T')[0]로 YYYY-MM-DD 형식 보장
  - **스키마 동기화**: assets 테이블에 updated_at TIMESTAMP 컬럼 추가
  - **오류 해결**: "column does not exist" 데이터베이스 오류 완전 해결
  - **확장성**: 향후 수정 이력 추적을 위한 updated_at 필드 활용 가능
  - **일관성**: 모든 테이블의 timestamp 컬럼 표준화

### ADR-027: 포트폴리오 수정 폼 필수 필드 검증 시스템
- Date: 2025-09-22
- Context: 사용자가 필수 필드를 누락했을 때 모호한 "수정 중 오류" 메시지로 UX 문제
- Options: 서버 사이드 검증만 vs 클라이언트 검증 추가 vs HTML5 required 속성
- Decision: 클라이언트 사이드 필수 필드 검증 + 명확한 한국어 오류 메시지
- Consequences:
  - **즉시 피드백**: 서버 요청 전 클라이언트에서 즉시 검증
  - **명확한 안내**: "날짜를 기입해주세요" 등 구체적인 한국어 메시지
  - **UX 개선**: 불필요한 서버 요청 방지로 응답 속도 향상
  - **확장성**: 향후 추가 필드 검증 로직 쉽게 확장 가능
  - **일관성**: 자산명, 날짜 등 핵심 필드에 대한 통일된 검증 규칙

### ADR-028: 포트폴리오 2단계 카테고리 시스템 아키텍처
- Date: 2025-09-22
- Context: 단일 자산군 분류로는 세분화된 자산 관리 한계, 사용자 요구에 따른 2단계 구조 필요
- Options: 기존 구조 유지 vs 대분류-소분류 2단계 vs 다층 구조
- Decision: 유동성 기준 대분류 + 세부 소분류 2단계 중첩 테이블 구조
- Consequences:
  - **데이터 구조**: 백엔드 sub_category 필드 추가, 프론트엔드 Asset 인터페이스 확장
  - **UI 개선**: 대분류-소분류 중첩 그룹화 테이블로 직관적 자산 관리
  - **시각적 계층**: 대분류(파란 헤더) + 소분류(회색 헤더) + 자산 목록으로 명확한 구분
  - **확장성**: 새로운 대분류/소분류 추가 시 자동 그룹 생성
  - **호환성**: 기존 자산은 "기타" 소분류로 자동 처리하여 하위 호환성 보장
  - **완전성**: CRUD 모든 작업에서 소분류 지원 (추가/수정/조회/삭제)

### ADR-029: Vercel 빌드 오류 해결 전략 수립
- Date: 2025-09-22
- Context: 2단계 카테고리 시스템 구현 중 "Unterminated regexp literal" JSX 파싱 오류로 Vercel 배포 차단
- Options: 오류 수정 시도 vs 완전 롤백 vs 단계별 재구현
- Decision: 안정적인 상태로 완전 롤백 후 단계별 재구현 접근
- Consequences:
  - **즉시 복구**: git checkout으로 마지막 작동 상태 복원
  - **안정성 우선**: 배포 차단 상황을 신속히 해결
  - **학습 기회**: 복잡한 JSX 중첩 구조의 한계점 파악
  - **예방 체계**: 문서화를 통한 유사 문제 재발 방지 (docs/VERCEL_BUILD_ERROR_RESOLUTION.md)
  - **기술 부채**: 2단계 카테고리 UI는 별도 작업으로 미뤄짐, 백엔드는 정상 작동

### ADR-030: 2단계 카테고리 시스템 완전 구현 아키텍처
- Date: 2025-09-22
- Context: 포트폴리오 자산의 세분화된 관리를 위한 대분류-소분류 중첩 시스템 필요
- Options: 단일 테이블 확장 vs 별도 테이블 분리 vs 중첩 구조 구현
- Decision: 기존 테이블 확장 + 프론트엔드 중첩 렌더링 + 단계별 안전 구현
- Consequences:
  - **성공적 구현**: 소분류 표시(배지) + 입력 필드(동적 옵션) + 2단계 중첩 UI 완료
  - **타입 안전성**: `Record<string, Record<string, Asset[]>>` 구조로 완전한 타입 지원
  - **호환성 보장**: 기존 null 소분류 데이터를 "기타"로 자동 처리
  - **유동성 기준 분류**: 즉시현금/예치자산/투자자산/대체투자 4개 대분류 + 각 3-5개 소분류
  - **확장성**: 새로운 소분류 추가 시 간단한 옵션 배열 수정만 필요
  - **성능**: 클라이언트 사이드 그룹화로 서버 부하 없이 실시간 중첩 구조 제공
  - **UX**: 시각적 계층(파란 대분류 헤더 > 회색 소분류 헤더 > 자산 테이블) 구현

### ADR-031: 사용자별 데이터 분리 아키텍처 설계
- Date: 2025-09-23
- Context: 다중 사용자 환경에서 포트폴리오 데이터의 완전한 분리 및 보안 필요
- Options: 세션 기반 분리 vs JWT 토큰 vs 사용자 ID 기반 DB 분리
- Decision: PostgreSQL user_id 기반 완전 데이터 분리 + 비밀번호 인증 시스템
- Consequences:
  - **사용자 인증**: PBKDF2 해시 + salt로 비밀번호 보안 강화
  - **데이터 격리**: 모든 포트폴리오 API에 user_id 필터링 적용
  - **세션 관리**: localStorage 기반 사용자 정보 + JWT 토큰 저장
  - **API 보안**: Authorization 헤더 기반 인증 확인
  - **확장성**: 향후 추가 기능도 user_id 기반 자동 분리 적용

### ADR-032: 계정 관리 웹 UI 시스템 아키텍처
- Date: 2025-09-23
- Context: 사용자가 웹사이트에서 직접 비밀번호 변경, 계정 삭제 등을 할 수 있는 완전한 인터페이스 필요
- Options: 단순 API만 제공 vs 완전한 웹 UI vs 외부 서비스 연동
- Decision: React TypeScript 기반 완전한 웹 계정 관리 시스템 구현
- Consequences:
  - **완전한 웹 인터페이스**: /settings 페이지에서 모든 계정 관리 작업 가능
  - **탭 기반 UI**: 비밀번호 변경/계정 삭제 분리된 탭으로 직관적 구성
  - **안전장치 시스템**: 현재 비밀번호 확인, "계정 삭제" 문구 입력 등 다중 검증
  - **성공 상태 처리**: 비밀번호 변경 후 성공 화면 + "포트폴리오로 돌아가기" 버튼
  - **양방향 네비게이션**: 포트폴리오 ↔ 계정설정 자유로운 이동
  - **JWT 토큰 버그 수정**: 회원가입 API에서 JWT 토큰 생성 누락 문제 해결
  - **CORS 완전 해결**: preflight 요청 처리로 크로스 오리진 문제 완전 해결
  - **사용자 경험**: 즉시 피드백, 명확한 오류 메시지, 일관된 디자인
  - **권한 검증**: CRUD 작업 시 사용자별 접근 권한 엄격 제어
  - **스키마 확장**: assets 테이블에 user_id 외래키 추가, 기존 데이터 마이그레이션
  - **프론트엔드 통합**: AuthForm 컴포넌트 + localStorage 세션 관리
  - **API 일관성**: 모든 포트폴리오 관련 엔드포인트에 user_id 파라미터 필수화
  - **보안**: 사용자는 자신의 데이터만 접근 가능, 타인 데이터 완전 차단

### ADR-032: 프로덕션 환경 API URL 표준화
- Date: 2025-09-23
- Context: 개발환경과 프로덕션환경 간 API 엔드포인트 불일치 문제 발생
- Options: 환경변수 기반 vs 하드코딩 vs 동적 감지
- Decision: 프로덕션 Render URL 하드코딩으로 일관성 확보
- Consequences:
  - **배포 안정성**: localhost 의존성 제거로 프로덕션 오류 방지
  - **일관성**: 모든 컴포넌트가 동일한 백엔드 URL 사용
  - **신뢰성**: 환경변수 누락으로 인한 연결 실패 위험 제거
  - **유지보수**: 백엔드 URL 변경 시 명확한 코드 추적 가능

### ADR-033: 경제지표 6개 탭 시스템 아키텍처 설계
- Date: 2025-09-23
- Context: 단일 페이지 경제지표 대시보드의 확장성 문제로 다양한 지표 카테고리 분류 필요
- Options: 새 페이지 추가 vs 탭 시스템 vs 드롭다운 메뉴
- Decision: 6개 탭 기반 경제지표 분류 시스템 구현
- Consequences:
  - **탭 구조**: 경기/고용/금리/무역/물가/정책 6개 카테고리로 지표 체계적 분류
  - **확장성**: Phase 시스템으로 단계별 구현 (Phase 1: 탭 UI, Phase 2: 고용지표 구현)
  - **재사용성**: TabNavigation 컴포넌트로 모듈화하여 다른 페이지에서도 활용 가능
  - **UX 개선**: 반응형 탭 네비게이션으로 데스크톱/모바일 모두 최적화
  - **데이터 분리**: 탭별 독립적 데이터 로딩으로 성능 향상
  - **미래 확장**: 각 탭별 3-5개 지표 추가로 총 20+ 지표 지원 예정

### ADR-034: 포트폴리오 데이터 표시 정확성 개선 아키텍처
- Date: 2025-09-24
- Context: 포트폴리오에서 원금/현재가치 구분 모호, 차트와 상세 데이터 불일치, 목표 추적 부정확성 문제 발생
- Options: 프론트엔드 계산만 수정 vs 백엔드 데이터 구조 확장 vs 완전한 데이터 아키텍처 재설계
- Decision: 백엔드 API 확장 + 프론트엔드 타입 안전성 강화 + 원금/현재가치 명확한 구분 표시
- Consequences:
  - **백엔드 확장**: PostgreSQL 서비스에 total_principal, total_eval_amount, principal_percentage, eval_percentage 필드 추가
  - **타입 안전성**: EditFormData 인터페이스로 수정 폼 전용 타입 정의, 문자열 입력 → 제출 시 숫자 변환
  - **데이터 일치성**: 차트 데이터와 포트폴리오 상세가 동일한 계산 로직 사용하여 완전 일치 보장
  - **사용자 경험**: "총액" → "현재가치", "자산 금액" → "투자 원금" 명확한 용어 사용
  - **목표 추적**: 소분류별 목표는 현재가치(eval_amount), 전체 목표는 총자산 기준으로 정확성 향상
  - **입력 개선**: 0으로 시작하는 소수점 값 입력 가능 (0.5, 0.001 등)
  - **호환성**: fallback 로직으로 기존 데이터와 새 데이터 모두 지원

### ADR-035: 소분류별 전용 필드 최적화 시스템 설계
- Date: 2025-09-24
- Context: 투자 자산의 세분화된 관리를 위한 소분류별 맞춤 입력 필드 시스템 필요
- Options: 모든 필드 항상 표시 vs 소분류별 조건부 표시 vs 단계별 입력 마법사
- Decision: 소분류 선택에 따른 동적 전용 필드 표시 + 불필요한 공통 필드 숨김
- Consequences:
  - **필드 최적화**: 부동산/원자재에서 수량/매수평균가 필드 숨김, 원금/평가금액만 표시
  - **전용 필드 구현**: 13개 소분류별 전용 필드 (부동산: 면적/취득세/임대수익, 예금: 만기일/연이율/중도해지수수료 등)
  - **동적 렌더링**: getSubCategorySpecificFields() 함수로 소분류에 따라 관련 필드만 표시
  - **타입 안전성**: snake_case ↔ camelCase 자동 변환으로 프론트엔드-백엔드 호환성
  - **UX 향상**: 불필요한 필드 제거로 입력 단순화, 자산 특성에 맞는 맞춤형 인터페이스
  - **CRUD 완전성**: 자산 추가와 수정 모두에서 소분류별 전용 필드 완전 지원
  - **백엔드 확장**: PostgreSQL에 13개 전용 필드 저장, get_all_assets API에 포함
  - **실시간 계산**: 실제 등록일 기반 누적 자산흐름으로 시뮬레이션 데이터 완전 대체

### ADR-036: 고용지표 6개 탭 시스템 완전 구현 아키텍처
- Date: 2025-09-24
- Context: 경제지표 탭 시스템 Phase 3로 고용지표 6개 완전 구현 필요
- Options: 기존 지표 확장 vs 별도 탭 시스템 vs 통합 대시보드
- Decision: 6개 고용지표 완전 독립 시스템 구현 (백엔드 크롤링 + 프론트엔드 대시보드 + 오류 처리)
- Consequences:
  - **백엔드 확장**: 4개 신규 크롤러 모듈 + 12개 API 엔드포인트 (rawdata + history-table)
  - **프론트엔드 대시보드**: 6개 지표 카드 + 탭 데이터 섹션 + 실시간 업데이트 버튼
  - **데이터 안전성**: safeParseNumber() 함수로 문자열/숫자 혼합 데이터 타입 안전 처리
  - **오류 해결**: Render 배포 오류 (크롤러 import) + JavaScript 런타임 오류 (타입 불일치) + TypeScript ESLint 오류 (any 타입) 모두 해결
  - **완전한 시스템**: 실업률, 비농업고용, 신규실업급여신청, 평균시간당임금, 평균시간당임금YoY, 경제활동참가율 모든 지표 정상 작동
  - **확장성**: 향후 금리지표, 무역지표, 물가지표, 정책지표 탭 추가 시 동일한 패턴 적용 가능

### ADR-037: K 단위 데이터 처리 시스템 아키텍처
- Date: 2025-09-25
- Context: 비농업고용, 신규실업급여신청 등에서 K(천 단위) 표시가 필요하며, 기존 % 처리와 동일한 방식 요구
- Options: K 단위를 숫자로 변환 vs % 처리와 동일한 문자열 보존 vs 별도 단위 필드 추가
- Decision: % 데이터와 동일한 방식으로 K 단위 문자열 보존하되 차트에서만 숫자 변환
- Consequences:
  - **백엔드 크롤러**: parse_numeric_value() 함수에 K 단위 조건 추가하여 "22K", "218K" 문자열 보존
  - **프론트엔드 파싱**: parseChartValue(), parsePercentValue() 함수에 K 단위 처리 로직 추가
  - **데이터 표시**: Raw Data/History Table에서 "218K" 원본 표시, 차트에서 218 숫자 변환
  - **색상 로직**: K 값을 숫자로 파싱하여 예측 대비 실적 비교 정상 작동
  - **일관성**: % 처리(4.2% → 4.2)와 K 처리(218K → 218) 동일한 패턴으로 확장성 확보
  - **호환성**: 기존 숫자 데이터와 새로운 K 단위 데이터 모두 지원하는 하위 호환성 유지

### ADR-038: 고용지표 역방향 색상 로직 시스템
- Date: 2025-09-25
- Context: 실업률, 신규실업급여신청은 "낮을수록 좋은" 역방향 지표로 기존 "높을수록 좋은" 색상 로직과 반대 처리 필요
- Options: 모든 지표 동일 처리 vs 지표별 개별 색상 로직 vs 정방향/역방향 구분 처리
- Decision: 지표 ID 기반으로 정방향/역방향을 구분하여 색상 로직 적용
- Consequences:
  - **지표 분류**: unemployment-rate, initial-jobless-claims는 역방향 지표로 분류
  - **색상 로직**: 역방향 지표에서 실제 < 예상 = 좋은 소식 = 초록색, 실제 > 예상 = 나쁜 소식 = 빨간색
  - **적용 범위**: EconomicIndicatorCard.getSurpriseColor() + EmploymentDataSection.getColorForValue() 일관된 처리
  - **확장성**: 새로운 역방향 지표 추가 시 지표 ID 목록에만 추가하면 자동 적용
  - **사용자 경험**: 신규실업급여신청 218K < 233K → 실업급여 신청 감소 → 좋은 소식 → 초록색으로 직관적 표시
  - **데이터 정확성**: K 단위 파싱과 결합하여 "218K" vs "233K" 올바른 숫자 비교 및 색상 표시

### ADR-039: Render Keep-Alive 시스템 아키텍처 설계
- Date: 2025-09-25
- Context: Render 무료 플랜의 30분 자동 슬립 모드로 인한 사용자 경험 저하 문제 해결 필요
- Options: 외부 cron 서비스 vs GitHub Actions vs 별도 서버 운영 vs Render 유료 전환
- Decision: GitHub Actions 기반 스마트 Keep-Alive 시스템 구축
- Consequences:
  - **비용 효율성**: GitHub Actions 무료 한도 내에서 월 60분만 사용 (2,000분 중 3% 사용)
  - **시간대 최적화**: KST 10:00-04:00 활성 시간대만 ping으로 불필요한 야간 실행 제거
  - **견고한 오류 처리**: /api/health 실패 시 루트 경로(/) 폴백 + 일시적 오류 허용
  - **완전 자동화**: 25분 주기 자동 실행으로 슬립 모드 원천 차단 (5분 안전 여유)
  - **모니터링 용이성**: GitHub Actions 로그로 ping 성공/실패 실시간 추적 가능
  - **확장성**: workflow_dispatch로 수동 실행 지원 + 향후 알림 시스템 연동 가능
  - **백엔드 헬스체크**: /api/health 엔드포인트로 DB 상태 포함한 완전한 서비스 상태 확인

### ADR-038: 가계부 시스템 API 인증 일관성 표준화
- Date: 2025-09-25
- Context: 가계부(ExpenseManagementDashboard) 시스템과 기존 포트폴리오 시스템 간 인증 방식 불일치 문제
- Options: 가계부를 JWT 토큰으로 통일 vs 포트폴리오를 JWT로 변경 vs 가계부를 user_id 패턴으로 변경
- Decision: 가계부 API를 포트폴리오와 동일한 user_id 쿼리 파라미터 패턴으로 통일
- Consequences:
  - **일관성 확보**: 모든 API 엔드포인트가 동일한 인증 패턴 사용으로 혼란 제거
  - **개발 효율성**: 프론트엔드에서 인증 토큰 관리 없이 간단한 user_id만으로 API 호출 가능
  - **즉시 해결**: "거래내역을 불러오는데 실패했습니다" 오류 완전 해결
  - **사용자 경험**: 별도 로그인 없이 바로 가계부 기능 사용 가능
  - **기술 부채 감소**: JWT 토큰과 user_id 혼재 상황 해결로 코드 복잡성 감소
  - **확장성**: 향후 새로운 기능 추가 시 통일된 인증 패턴 적용으로 일관성 유지

### ADR-040: 가계부 연도/월 필터링 시스템 아키텍처
- Date: 2025-11-08
- Context: 가계부 시스템에서 전체 거래내역이 아닌 특정 기간(연도/월)의 데이터만 조회하는 기능 필요
- Options: 프론트엔드만 필터링 vs 백엔드 쿼리 필터링 vs 하이브리드 접근
- Decision: 백엔드 날짜 범위 필터링 + 프론트엔드 연도/월 선택 UI 통합 시스템
- Consequences:
  - **성능 최적화**: 백엔드에서 필요한 데이터만 조회하여 네트워크 부하 감소
  - **사용자 경험**: 연도/월 드롭다운 + 이전/다음 버튼으로 직관적 기간 선택
  - **자동 갱신**: 연도/월 변경 시 요약 통계, 차트, 거래내역 테이블 자동 업데이트
  - **레이아웃 재구성**: 필터 UI를 페이지 최상단에 배치하여 사용성 강조
  - **API 표준화**: start_date/end_date 쿼리 파라미터 패턴 확립
  - **확장성**: 향후 커스텀 날짜 범위, 분기별/연도별 보기 등 쉽게 추가 가능
  - **타입 안전성**: useCallback 의존성 배열로 불필요한 재렌더링 방지

### ADR-041: 가계부 지출 구성 분석 시스템 아키텍처
- Date: 2025-11-08
- Context: 기존 단순 파이/막대 차트에서 포트폴리오와 동일한 수준의 심층 분석 시스템 필요
- Options: 기존 차트 유지 vs 포트폴리오 패턴 복제 vs 독자적 디자인
- Decision: 포트폴리오 자산 구성 분석과 동일한 2단계 필터링 + 이중 차트 시스템 구현
- Consequences:
  - **일관성**: 포트폴리오와 가계부 간 동일한 UI/UX 패턴으로 학습 곡선 감소
  - **2단계 필터링**: 대분류(전체/생활/건강/사회/여가/쇼핑/기타) + 소분류(동적 표시)로 3단계 분석 깊이 확보
  - **이중 차트 레이아웃**: 도넛차트(구성 비중) + 막대차트(금액 비교) 나란히 배치로 다각도 분석
  - **색상 시스템**: 대분류별 고유 색상 그룹(CATEGORY_COLORS)으로 시각적 구분 강화
  - **동적 제목**: 선택 수준에 따라 "지출 구성 분석" → "생활 세부 분석" → "외식 상세 분석" 자동 변경
  - **상세 분석**: 소분류 선택 시 개별 거래내역까지 드릴다운 가능
  - **데이터 집계**: 전체(대분류 합계) → 대분류(소분류 합계) → 소분류(개별 거래) 3단계 집계 로직
  - **확장성**: 향후 수입 구성 분석, 이체 패턴 분석 등 동일한 패턴 재사용 가능

### ADR-042: 가계부 차트 타입 변경 및 문자열 타입 금액 데이터 처리 표준화
- Date: 2025-11-11
- Context: 가계부 차트를 도넛/막대형으로 변경 후, 백엔드에서 문자열로 전달되는 금액 데이터로 인한 차트 렌더링 실패 문제 발생
- Options: 백엔드 타입 수정 vs 프론트엔드 타입 변환 vs 하이브리드 접근
- Decision: 프론트엔드에서 모든 금액 데이터를 Number()로 명시적 변환 + 천단위 쉼표 포맷팅 추가
- Consequences:
  - **차트 타입 변경**: 지출/수입 구성 분석 도넛형 전환 + 막대 차트 제거 + 사이드바이사이드 레이아웃 (50% 공간 절약)
  - **탭 시스템**: 일별/월별/비율 → 일별/비율로 단순화 (월별은 12월 활성화 예정)
  - **타입 변환 표준화**: prepareDailyData(), prepareAssetCompositionData(), prepareIncomeCompositionData(), prepareExpenseIncomeRatioData() 모든 함수에 Number() 적용
  - **문제 해결**: 문자열 연결 (`"0" + "10000" = "010000"`) → 숫자 덧셈 (`0 + 10000 = 10000`)으로 정상화
  - **가독성 향상**: toLocaleString()으로 천단위 쉼표 추가 (1,000,000원)
  - **TypeScript 타입 안전성**: label의 entry.value를 Number()로 변환하여 unknown 타입 에러 해결
  - **코드 품질**: 사용하지 않는 prepareMonthlyData, compositionBarData, incomeBarData 제거 + 디버깅 로그 제거
  - **코드 보존**: 월별 차트 함수를 주석으로 보존하여 12월 활성화 대비
  - **확장성**: 향후 백엔드 타입 수정 시 Number() 변환 제거로 간단히 마이그레이션 가능

### ADR-043: 가계부 예산 목표 게이지 시스템 아키텍처
- Date: 2025-11-15
- Context: 가계부 시스템에서 지출/수입 목표를 설정하고 실시간 진행률을 추적하는 게이지 시스템 필요
- Options: 포트폴리오 목표 패턴 복제 vs 별도 설계 vs 외부 서비스 연동
- Decision: 포트폴리오 목표 시스템과 유사한 구조의 독립된 게이지 컴포넌트 + PostgreSQL JSONB 저장
- Consequences:
  - **백엔드 구조**: `/api/expense-budget-goals` GET/POST 엔드포인트, expense_budget_goals 테이블 (JSONB 구조로 유연한 목표 저장)
  - **데이터베이스**: expense_goals/income_goals 컬럼에 대분류-소분류 중첩 구조 저장 (예: `{"생활": {"전체": 1000000, "외식": 300000}}`)
  - **컴포넌트 분리**: ExpenseGoalGauge (6개 대분류 지출 목표) + IncomeGoalGauge (4개 대분류 수입 목표) 독립 컴포넌트
  - **진행률 색상 시스템**: 지출은 역방향 (100%=빨강, 낮을수록 초록), 수입은 정방향 (100%=초록, 높을수록 좋음)
  - **2단계 목표 설정**: 대분류 목표는 소분류 목표의 합계로 자동 계산, 소분류별 개별 목표 설정 가능
  - **펼치기/접기 UI**: 대분류 게이지는 항상 표시, 소분류 상세는 펼치기 버튼으로 토글
  - **실시간 저장**: 목표 설정 즉시 PostgreSQL에 저장, 페이지 로드 시 자동 복원
  - **데이터 집계**: 현재 월의 실제 지출/수입 데이터와 목표를 비교하여 진행률 계산
  - **레이아웃**: ExpenseManagementDashboard에 2열 그리드로 통합, 지출/수입 게이지 나란히 배치
  - **확장성**: 향후 월별 목표, 연간 목표, 목표 히스토리 추적 등 쉽게 확장 가능

### ADR-044: 골드-에메랄드 프리미엄 테마 아키텍처
- Date: 2025-11-18
- Context: 기존 흑백 테마에서 투자 앱에 어울리는 프리미엄 색상 시스템 필요
- Options: 블루-인디고 vs 틸-사파이어 vs 네이비-골드 vs 골드-에메랄드
- Decision: 골드(primary) + 에메랄드(secondary) 프리미엄 테마 시스템 구축
- Consequences:
  - **색상 변수 시스템**: CSS 변수 기반으로 라이트/다크 모드 자동 대응
  - **골드 (Primary)**: oklch(0.68 0.17 88) - 화려하고 반짝이는 골드, 번영과 재산 증가 상징
  - **에메랄드 (Secondary)**: oklch(0.65 0.16 158) - 파릇파릇하고 기분좋은 호황, 성장과 성공 상징
  - **배경**: 크림/아이보리 (oklch 0.99 0.005 90) - 은은한 골드 힌트로 따뜻한 느낌
  - **Navigation 헤더**: 골드→에메랄드 그라데이션 배경 + 흰색 텍스트
  - **카드 디자인**: 흰색 배경 + 골드/에메랄드 테두리 (hover 시 진하게)
  - **버튼 시스템**: Primary(골드), Secondary(에메랄드) 역할 분담
  - **차트 팔레트**: 골드-에메랄드 조화로운 5색 시스템
  - **전체 적용**: 홈/경제지표/포트폴리오/가계부 모든 페이지 일관된 테마
  - **확장성**: CSS 변수만 수정하면 전체 색상 변경 가능

### ADR-045: 다크모드 토글 시스템 아키텍처
- Date: 2025-11-18
- Context: 저조도 환경에서의 사용성 향상과 사용자 선택권 제공을 위한 다크모드 필요
- Options: 시스템 설정만 따름 vs 수동 토글만 제공 vs 하이브리드 접근
- Decision: 시스템 설정 자동 감지 + 수동 토글 + localStorage 영속성
- Consequences:
  - **useDarkMode 훅**: 다크모드 상태 관리 및 DOM 클래스 제어
  - **시스템 감지**: prefers-color-scheme 미디어 쿼리로 초기 설정 자동 적용
  - **localStorage 저장**: theme 키에 light/dark 저장, 새로고침 후에도 유지
  - **토글 버튼**: Navigation 우측에 해☀️/달🌙 아이콘 버튼 배치
  - **다크모드 색상**:
    - 배경: 은은한 골드 힌트 (oklch 0.13 0.02 85)
    - 골드: 더 밝고 빛나는 (oklch 0.78 0.20 88)
    - 에메랄드: 더 생동감 있는 (oklch 0.70 0.19 158)
    - 카드: 골드 톤 배경 (oklch 0.17 0.025 88)
  - **접근성**: aria-label로 스크린리더 지원
  - **부드러운 전환**: CSS transition으로 테마 변경 시 자연스러운 애니메이션
  - **전역 적용**: html 클래스에 dark 추가로 모든 컴포넌트 자동 대응
  - **확장성**: 향후 자동 시간대별 테마, 사용자 정의 테마 등 추가 가능

---

## 14) Risk Log
- **R-001:** <리스크/가정> → **대응:** <완화/감시>
- **R-002:** …

---

## 15) Glossary
- <용어A>: <정의>
- <약어B>: <정의>

---

## 16) Claude Session Protocol
1) **Start:** 이 파일의 0,1,12,13을 읽고 **오늘 목표/Active/ADR 변경 없음/논의할 1문항**을 **5줄 이내**로 보고.  
2) **Search→Edit 최소화:** 전체 파일 출력 금지. **검색으로 위치 특정 → 부분 수정 → diff**만 제시.  
3) **Diff first:** 불필요한 포맷 변경 금지. 리팩토링은 티켓화.  
4) **Run & Report:** 명령은 코드블록에 정확히. 결과는 상위 로그 10줄.  
5) **Close:** 결과 요약(3줄) + 남은 리스크(1줄) + `Tasks/ADR` 갱신 후 저장.

---

## 17) Token Budget Guide
- 전체 코드/로그 노출 금지.  
- 함수/블록 단위로만 제시.  
- 설명은 5–7줄 요약. 표/리스트 과다 금지.  
- 동일 맥락 반복 설명 금지(링크/섹션 참조).

---

## 18) Prompt Snippets (Copy-paste)
### A) 세션 시작 요약
> “`CLAUDE.md` 0,1,12,13 섹션을 읽고 오늘 목표/Active/ADR 변경 없음/논의할 1문항을 5줄 이내로 보고.”

### B) 안전 편집 (부분 수정)
> “`<path/to/file>`에서 `<anchor or pattern>` 아래 로직만 변경. 관련 없는 줄 포맷 유지. **diff**만 제시.”

### C) 테스트 추가
> “`tests/<module>_spec`에 `<function>` 유닛 테스트 3개(성공/경계/예외). 실행 커맨드와 통과 로그 상위 10줄 보고.”

### D) 회귀 방지 체크
> “수정 영향 함수/모듈 목록을 추정해 나열. 빠진 테스트 있으면 항목만 제시.”

### E) 세션 종료
> “오늘 변경 diff 요약(파일/라인/핵심), 테스트 통과 여부, 남은 리스크 1줄을 `CLAUDE.md`의 `Tasks/ADR`에 반영하고 저장.”

---

## 19) Checklists

### PR Checklist
- [ ] 작은 범위 변경 / 목적 명확  
- [ ] 테스트 추가/수정 및 통과  
- [ ] 문서/CHANGELOG 갱신  
- [ ] 비밀정보 노출 없음  
- [ ] 린트/형식/타입 통과 로그 첨부

### Issue Ticket Checklist
- [ ] 배경/문제/제안/대안  
- [ ] DoD 명확  
- [ ] 리스크/추정(시간/복잡도)

### Debug Checklist
- [ ] 재현 절차 명시  
- [ ] 기대 vs 실제  
- [ ] 최근 변경/릴리즈 확인  
- [ ] 로그/메트릭/트레이스 수집  
- [ ] 최소 재현 코드 작성

---

## 20) Notes
- 장시간 세션에서는 **요약 빈도↑**, 파일 전체 출력 금지.
- 광범위 변경 필요 시: 먼저 목표/범위를 5줄로 합의 → 티켓 생성 → 분할 수행.

---

## 21) PostgreSQL 마이그레이션 요약 (2025-09-17)

### 문제 상황
- **데이터 손실**: 30분 후 Render 서버 재시작 시 SQLite 데이터 삭제
- **원인**: Render 컨테이너 파일시스템 초기화, SQLite 파일 임시 저장

### 해결책 구현
1. **Neon.tech PostgreSQL**: 서버리스 PostgreSQL 데이터베이스 서비스 선택
2. **PostgresDatabaseService**: 새로운 DB 서비스 클래스 구현 (`services/postgres_database_service.py`)
3. **요구사항 추가**: `psycopg2-binary==2.9.9` (`requirements.txt`)
4. **이중화 설정**: PostgreSQL 우선, SQLite 폴백 (`app.py`)
5. **환경변수**: `.env` 파일 및 Render DATABASE_URL 설정

### 검증 결과
- ✅ **로컬 테스트**: PostgreSQL 연결/저장/조회 정상
- ✅ **API 응답**: v2 엔드포인트에서 "source": "database" 확인
- ✅ **Render 설정**: DATABASE_URL 환경변수 추가 완료
- 🔄 **배포 진행중**: Render 자동 재배포 (2-3분 소요 예상)

### 다음 세션 체크리스트
1. Render 배포 완료 확인: `curl https://investment-app-backend-x166.onrender.com/`
2. PostgreSQL 연결 검증: `curl https://investment-app-backend-x166.onrender.com/api/v2/indicators/ism-manufacturing`
3. 데이터 지속성 테스트: 30분 후 재접속하여 데이터 보존 확인
