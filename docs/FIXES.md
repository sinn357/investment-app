# Investment App - Error Fixes

## Recent Fixes

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

**Last Updated**: 2025-12-03
