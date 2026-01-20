# Crawling Known Issues (2026-01-20)

## 목적
현재 크롤링 시스템에서 발생하는 실패 원인과 영향 범위를 명확히 기록한다.

## 요약
- 실패의 대부분은 investing.com 레이트리밋(HTTP 429)이다.
- 일부 지표는 소스 차단(HTTP 403) 또는 파싱 실패로 고정 실패가 발생한다.
- 직접확인(manual_check) 지표는 크롤링 대상에서 제외되어야 한다.

## 주요 원인별 정리

### 1) 레이트리밋 (HTTP 429)
- 원인: 요청 동시성/빈도 과다로 investing.com에서 제한
- 영향: 다수 경제지표에서 크롤링 실패
- 대응: 동시성 제한, 지터 적용, 백오프 적용 (코드 반영됨)

### 2) 차단/접근 제한 (HTTP 403)
- leading-indicators (OECD)
- sp-gsci (S&P Global)
- 대응: 직접확인 전환 또는 대체 소스 필요

### 3) 파싱 실패 / 데이터 없음
- sp-global-composite: 최신/다음 릴리즈가 비어 있음 (No release data found)
- 대응: 파서 보강 또는 소스 교체 필요

## 참고 URL
- sp-global-composite: https://www.investing.com/economic-calendar/s-p-global-composite-pmi-1492

## 현재 조치 상태
- 수동확인(manual_check) 지표는 배치 크롤링에서 제외
- investing/rates-bonds 크롤러에 재시도 + 백오프 적용
- 크롤링 동시성 제한(환경변수 `CRAWL_MAX_CONCURRENCY`로 제어)

## 후속 액션 (미완료)
1. 레이트리밋 완화 효과 재측정 (동시성 추가 감소 옵션 검토)
2. sp-global-composite 파서 보강 또는 대체 소스 도입
3. 403 대상 지표의 대체 소스 검토
