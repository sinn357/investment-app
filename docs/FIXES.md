# Investment App - Error Fixes

## Recent Fixes

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
