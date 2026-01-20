# 세션 문서: 지표 상태 요약/직접확인 분리 및 URL 정리

**일자**: 2026-01-07
**목표**: 건강 요약에서 직접확인/최근업데이트 분리, 직접확인 URL 정리, 중복 지표 정리

---

## ✅ 완료 작업

### 1) 지표 상태 요약 분리
- `manual_check` 지표를 **Error**에서 분리해 별도 카운트로 표시
- **최근 24시간 업데이트(Updated 24h)** 카운트 추가
- Error는 크롤링 실패/데이터 오류 중심으로 유지

**백엔드**:
- `/api/v2/indicators/health-check` 요약에 `manual_check`, `updated_recent` 추가
- manual_check는 DB 조회 전 분기 처리
- crawl_info 기준 24시간 이내 성공한 지표 수 집계

**프론트**:
- Health summary 카드에 `Direct Check`, `Updated 24h` 타일 추가

---

### 2) 직접확인 URL 갱신
- `leading-indicators` → OECD CLI 공식 페이지
- `business-inventories` → Investing 재고순환 지표 링크
- `exports`, `imports`, `current-account-balance` → FRED 시리즈 링크
- `sp-gsci` → S&P Global Index 페이지

---

### 3) 중복 지표 제거
- `business-inventories`(기업재고) 삭제
- `business-inventories-trade`(재고순환지표)만 유지
- 총 지표 수 54개로 정리

---

## 변경 파일
- `backend/app.py`
- `frontend/src/app/indicators/page.tsx`
- `backend/crawlers/indicators_config.py`

---

## 커밋 내역
- `e37a2c3` fix: split manual-check status and add 24h updates
- `d6091ac` chore: remove duplicate business inventories

---

## 메모
- stale/outdated는 `release_date` 기준으로 7~30일/30일+ 분류
- 업데이트 실행 여부는 `crawl_info.last_crawl_time` 기준으로 `Updated 24h` 표시
- direct-check는 상태 요약에서 error와 분리됨

