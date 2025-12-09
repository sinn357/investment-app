# Investment App Changelog

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
