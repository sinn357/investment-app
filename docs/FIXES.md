# Investment App - Error Fixes

## Recent Fixes

### Indicators AI Interpretation Fallback / Truncated JSON
**Status**: Resolved (stabilized with degraded fallback path)
**Symptoms**:
- `AI 해석 생성` 시 `fallback_reason: openai_call_failed`
- `openai_error: ... Unterminated string ...`
- 일부 배포 시점에 `404 /api/v2/indicators/ai-interpretation`

**Root Causes**:
1. 대형 JSON schema 응답이 timeout 또는 output truncation으로 실패.
2. 카테고리별 경량 호출의 토큰 한도가 낮아 JSON 문자열이 중간에서 잘림.
3. 초기 배포 타이밍에서 백엔드 라우트 미반영 상태 존재.

**Fixes**:
- `/api/v2/indicators/ai-interpretation` 라우트 추가 및 배포 반영.
- OpenAI 호출 재시도/백오프 + timeout 상향.
- 일괄 호출 실패 시 카테고리별 경량 OpenAI 호출로 강등.
- `Unterminated string` 감지 시 토큰 상향 재시도.
- `fallback_reason`, `openai_error` 응답/화면 노출로 진단 가능화.
- `confidence/freshness_score` 0~1 출력 자동 정규화(0~100).

**Verification**:
- 프론트에서 `AI 해석 생성` 버튼 클릭 시 on-demand 호출 동작.
- 실패 시 원인 문자열 확인 가능.
- 성공 시 카테고리별 섹션/시그널/요약 구조 정상 표시.

### Render Deploy Timeout (Missing retail_sales crawler)
**Status**: Resolved
**Symptoms**:
- Render deploy timed out with `ModuleNotFoundError: crawlers.retail_sales`.
- Service restarted repeatedly during boot.

**Root Cause**:
- `crawlers.retail_sales` module was missing in the runtime image.

**Fixes**:
- Added safe import fallback to archived crawler or stub response.
- Prevented startup crash when crawler is unavailable.

**Verification**:
- Render deploy completes and service stays up.
- Retail sales endpoints return explicit error if crawler missing.

### Market Snapshot Volume Chart Empty
**Status**: Resolved
**Symptoms**:
- 거래량 차트가 "거래량 데이터가 없습니다."로 표시됨.

**Root Cause**:
- Yahoo 캔들 응답에 volume이 비어있는 경우가 발생.

**Fixes**:
- 캔들 volume이 비어있을 때 Yahoo quote 평균 거래량으로 보정.
- 프론트에서 fallback volume을 차트 전 구간에 적용.

**Verification**:
- 거래량 차트가 비어있지 않음.

### Portfolio Edit Not Reflected (Cash Assets)
**Status**: Resolved
**Symptoms**:
- Editing cash assets (즉시현금/예치자산) showed success, but UI still displayed old value.
- Even after refresh, amount remained unchanged (e.g., 5,071,958).

**Root Causes**:
1. **Payload vs DB overwrite**: update request carried `amount`, but backend overwrote `amount` using `eval_amount` when present.
2. **Display precedence**: UI uses `principal` and `eval_amount` before `amount`, so unchanged `principal` kept old value visible.
3. **Deployment gate**: Vercel build failed due to TypeScript mismatch, so frontend changes were not deployed.

**Failure Investigation**:
- Captured update payload and Render SQL logs.
- SQL `Values` showed `amount` being overwritten by `eval_amount`.
- Added update response payload to verify persisted values.
- Confirmed UI reads `principal` for cash asset totals and rows.

**Fixes**:
- Frontend: For cash assets, stop sending `principal`/`eval_amount` in update payload.
- Backend: When `asset_type` is cash, force `principal` and `eval_amount` to equal `amount` and ensure these fields are included in SQL updates.
- Frontend build: Align payload type to resolve TS compile error.

**Verification**:
- Update request response returns `amount`, `principal`, `eval_amount` aligned.
- `GET /api/portfolio` shows updated values.
- UI reflects new amount without logout.

**Notes**:
- Backend redeploy required.
- Previous logout/login masked cache effects by forcing a fresh fetch.

### CORS Header Issues
**Resolved**: backend/app.py CORS 설정 확인
**Pattern**: ERROR_PATTERNS.md 참조

### API Response Mismatch
**Fixed**: PortfolioResponse interface 수정
**Commit**: `60e930f`

### Cycle API 404/503 (Render 배포본 구버전)
**Fixed**:
- Flask `$PORT` 바인딩 수정, `gunicorn` 추가, redeploy trigger로 Render 재배포
- 신용/유동성·심리/밸류 사이클 서비스가 데이터 미존재 시 기본 중립 점수로 200 응답 반환하도록 변경
**Verification**:
- `GET https://investment-app-backend-x166.onrender.com/api/v2/credit-cycle` → 200 OK (JSON)
- `GET https://investment-app-backend-x166.onrender.com/api/v2/sentiment-cycle` → 200 OK (JSON)
- Deploy hook used: `https://api.render.com/deploy/srv-d359te95pdvs73bimfvg?key=CJnlNmtsOcM`

---

**Last Updated**: 2026-02-16
