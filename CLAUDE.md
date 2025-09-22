# CLAUDE.md — Persistent Session Context (Non-Eco Projects)

> 목적: Claude Code가 세션이 달라도 동일한 규칙/맥락에서 동작하도록 하는 단일 소스(SSOT).

---

## 0) Meta
- **Project:** Investment App - Economic Indicators Dashboard
- **Repo Root:** /Users/woocheolshin/Documents/Vibecoding_1/investment-app
- **Owner:** Partner
- **Last Updated:** 2025-09-22 15:25 KST
- **Session Goal (Today):** 2단계 카테고리 시스템 구현 ⚠️ (대분류-소분류 체계 구축, 소분류 데이터 전송 문제 해결 필요)

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
- **T-054:** Vercel 빌드 오류 해결 ✅ (2025-09-22)
  - DoD: JSX 파싱 오류 수정 + 안정적인 빌드 시스템 복원 + 문서화 완료
  - Files: frontend/src/components/PortfolioDashboard.tsx, docs/VERCEL_BUILD_ERROR_RESOLUTION.md
  - Risks: 2단계 카테고리 UI는 별도 재구현 필요

### Recent Done
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

### Backlog
- **B-010:** 추가 경제지표 확장 (목표: 10개 지표)
- **B-011:** 데이터 알림 및 임계값 설정 기능
- **B-012:** 고급 차트 시각화 (비교 차트, 상관관계 분석)
- **B-013:** 사용자 대시보드 커스터마이징
- **B-014:** 데이터 내보내기 기능 (CSV, PDF)

> 원칙: **세션당 Active ≤ 2**.

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