# CLAUDE.md — Persistent Session Context (Non-Eco Projects)

> 목적: Claude Code가 세션이 달라도 동일한 규칙/맥락에서 동작하도록 하는 단일 소스(SSOT).

---

## 0) Meta
- **Project:** Investment App - Economic Indicators Dashboard
- **Repo Root:** /Users/woocheolshin/Documents/Vibecoding_1/investment-app
- **Owner:** Partner
- **Last Updated:** 2025-09-17 22:35 KST
- **Session Goal (Today):** 데이터 로딩 성능 최적화 완료 ✅ (10-15초 → 1-2초, SQLite + 수동 업데이트 시스템)

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
- **T-001:** 크롤링 대상 웹사이트 조사 및 분석
  - DoD: 주요 경제지표 사이트 URL 및 크롤링 방식 결정
  - Files: backend/crawlers/ 모듈 생성 예정
  - Risks: 웹사이트 구조 변경 가능성

### Recent Done
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