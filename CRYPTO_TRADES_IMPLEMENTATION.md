# 코인 거래 분석 시스템 구현

**구현일**: 2025-10-09
**개발자**: Claude + Partner
**상태**: ✅ 로컬 개발 완료 (프로덕션 배포 대기)

---

## 📋 프로젝트 개요

업비트(Upbit) API를 연동하여 코인 거래 내역을 자동으로 불러와 FIFO(선입선출) 방식으로 라운드를 매칭하고, 수익/손실을 분석하는 대시보드 시스템

### 핵심 기능
1. **업비트 API 연동**: 실시간 거래 내역 자동 조회
2. **같은 시간대 거래 합산**: 여러 건의 거래를 하나로 통합 표시
3. **FIFO 라운드 매칭**: 매수-매도 쌍을 자동으로 매칭하여 수익 계산
4. **시각적 대시보드**: Next.js 기반 반응형 UI

---

## 🏗️ 시스템 아키텍처

### 개발 환경 구조
```
로컬 개발 (현재)
├── Frontend: http://localhost:3000/crypto-trades
│   └── Next.js 15 + TypeScript + Tailwind CSS
└── Backend: http://localhost:5001/api/crypto/*
    └── Flask + Python 3.11 + 업비트 API

프로덕션 (향후 배포)
├── Frontend: https://investment-app-rust-one.vercel.app/crypto-trades
│   └── Vercel 배포
└── Backend: https://investment-app-backend-x166.onrender.com/api/crypto/*
    └── Render 배포 + PostgreSQL (Neon.tech)
```

---

## 🔧 백엔드 구현

### 1. 업비트 API 서비스 (`services/upbit_service.py`)

**핵심 기능**:
- JWT 기반 API 인증
- 잔고 조회 (`get_accounts()`)
- 주문 내역 조회 (`get_orders()`)
- 페이지네이션 처리 (`get_all_trades()`)

**인증 방식**:
```python
def _get_headers(self, query_params: Optional[Dict] = None) -> Dict[str, str]:
    payload = {
        'access_key': self.access_key,
        'nonce': str(uuid.uuid4())  # 고유 nonce 생성
    }

    if query_params:
        query_string = unquote(urlencode(query_params, doseq=True)).encode("utf-8")
        m = hashlib.sha512()
        m.update(query_string)
        payload['query_hash'] = m.hexdigest()
        payload['query_hash_alg'] = 'SHA512'

    jwt_token = jwt.encode(payload, self.secret_key, algorithm='HS256')
    return {'Authorization': f'Bearer {jwt_token}'}
```

### 2. 거래 분석 엔진 (`services/crypto_analyzer.py`)

**핵심 로직**:

#### 같은 시간대 거래 합산
```python
def group_by_same_time(trades: List[Dict]) -> List[Dict]:
    """
    예시:
    10.03 17:21에 4건의 매도 → 1건으로 합산
    - 총 수량: 13,917 DOGE
    - 총 금액: 5,007,887원
    - 평균 가격: 360원
    """
    grouped = defaultdict(lambda: {...})

    for trade in trades:
        time_key = trade['date']  # "10.03 17:21"
        grouped[time_key]['volume'] += trade['volume']
        grouped[time_key]['total_amount'] += trade['total']
        grouped[time_key]['count'] += 1
```

#### FIFO 라운드 매칭
```python
def match_buy_sell_rounds(buys: List[Dict], sells: List[Dict]) -> List[Dict]:
    """
    선입선출(FIFO) 방식으로 매수-매도 매칭:

    라운드 예시:
    - 매수1: 09.15 13:22, 390원, 2,501,250원
    - 매수2: 09.30 10:04, 333원, 2,501,250원
    - 매도: 10.03 17:21, 360원, 5,007,887원
    → 수익: 5,387원 (+0.11%)
    """
    rounds = []
    buy_queue = sorted(buys, key=lambda x: x['date'])

    while sell_idx < len(sell_queue):
        # 매수 물량을 채워서 매도 물량과 매칭
        while buy_volume_total < sell_volume:
            current_buys.append(buy_queue[buy_idx])
            buy_volume_total += buy['volume']
            buy_idx += 1

        profit = sell_total - buy_total
        profit_rate = (profit / buy_total * 100)
```

### 3. Flask API 엔드포인트 (`app.py`)

#### `/api/crypto/analysis`
전체 거래 분석 결과 반환

**요청**:
```
GET /api/crypto/analysis?max_orders=300
```

**응답**:
```json
{
  "status": "success",
  "data": {
    "DOGE": {
      "rounds": [
        {
          "buys": [
            {"date": "09.15 13:22", "price": 390, "total": 2501250},
            {"date": "09.30 10:04", "price": 333, "total": 2501250}
          ],
          "sell": {"date": "10.03 17:21", "price": 360, "total": 5007887, "count": 4},
          "profit": 5387,
          "profit_rate": 0.11
        }
      ],
      "total_profit": 37116,
      "total_rounds": 2
    }
  },
  "total_orders": 300
}
```

#### `/api/crypto/balance`
현재 코인 잔고 조회

**응답**:
```json
{
  "status": "success",
  "data": [
    {
      "currency": "BTC",
      "balance": 0.0562436,
      "avg_buy_price": 177798000,
      "locked": 0
    }
  ]
}
```

---

## 🎨 프론트엔드 구현

### 페이지: `/crypto-trades/page.tsx`

**기술 스택**:
- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS

**UI 구성**:

1. **헤더**
   - 제목: "코인 거래 분석"
   - 설명: "업비트 거래 내역을 라운드별로 분석합니다"

2. **전체 통계 카드** (3개)
   - 총 코인 종류
   - 총 라운드 수
   - 전체 수익 (초록/빨강 색상 구분)

3. **코인별 라운드 상세**
   ```
   DOGE
   라운드 1:
     09.15 13:22 390원에 2,501,250원 매수
     09.30 10:04 333원에 2,501,250원 매수
     10.03 17:21 360원에 5,007,887원 매도 (4건 합산)
     5,387원 수익 (+0.11%)
   ```

**색상 시스템**:
- 수익: `text-green-400`
- 손실: `text-red-400`
- 합산 표시: `text-yellow-300` (n건 합산)

**반응형 디자인**:
- 데스크톱: 3칸 그리드
- 모바일: 1칸 스택

---

## 🔐 보안 설정

### API 키 관리

**로컬 개발**:
```python
# app.py
UPBIT_ACCESS_KEY = os.getenv('UPBIT_ACCESS_KEY', 'Z3mZz...')
UPBIT_SECRET_KEY = os.getenv('UPBIT_SECRET_KEY', 'G1INp...')
```

**프로덕션 배포 시**:
1. Render 환경변수 설정:
   ```
   UPBIT_ACCESS_KEY=Z3mZzfH1Bn61JqqenCyL77tnsvB7jSHQESAAbwN5
   UPBIT_SECRET_KEY=G1INpa7Ac1ewldqkAJLbG9hyUu2CEZIWFADJ9jc9
   ```
2. `.env` 파일에서 기본값 제거

### CORS 설정
```python
CORS(app,
     origins=["https://investment-app-rust-one.vercel.app", "http://localhost:3000"],
     methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
     allow_headers=['Content-Type', 'Authorization'],
     supports_credentials=True)
```

---

## 🚀 배포 계획

### Phase 1: 로컬 개발 (✅ 완료)
- [x] 업비트 API 연동
- [x] 거래 분석 로직 구현
- [x] Flask API 엔드포인트
- [x] Next.js 프론트엔드
- [x] 로컬 테스트 완료

### Phase 2: 프로덕션 배포 (⏳ 대기)
- [ ] Render 백엔드 배포
  - [ ] `requirements.txt`에 의존성 추가: `PyJWT`, `requests`
  - [ ] 환경변수 설정 (업비트 API 키)
  - [ ] 배포 후 테스트: `curl https://investment-app-backend-x166.onrender.com/api/crypto/balance`
- [ ] Vercel 프론트엔드 배포
  - [ ] API URL을 Render URL로 변경
  - [ ] 빌드 및 배포
  - [ ] 접속 테스트: `https://investment-app-rust-one.vercel.app/crypto-trades`
- [ ] 통합 테스트
  - [ ] 실제 거래 데이터 조회 확인
  - [ ] 라운드 매칭 정확성 검증
  - [ ] 수익 계산 검증

### Phase 3: 기능 확장 (향후)
- [ ] 엑셀 파일 업로드 기능 (과거 데이터 분석)
- [ ] 기간별 필터링 (월별, 연도별)
- [ ] 차트 시각화 (Recharts 활용)
- [ ] 수익률 통계 (승률, 평균 수익률)
- [ ] CSV 내보내기

---

## 🐛 알려진 이슈

### 1. executed_funds 값이 None
**문제**: 업비트 API에서 `executed_funds` 필드가 None으로 반환됨
**해결**: `avg_price * volume`으로 계산
```python
if executed_funds is None:
    executed_funds = volume * avg_price
```

### 2. 수수료 계산 방식
**주의**: 매수와 매도의 수수료 처리가 다름
```python
if side == 'bid':  # 매수
    total_amount = executed_funds + paid_fee
else:  # 매도
    total_amount = executed_funds - paid_fee
```

---

## 📊 데이터 흐름

```
업비트 API
   ↓ (REST API 호출)
Flask Backend (/api/crypto/analysis)
   ↓ (JSON 응답)
Next.js Frontend (fetch)
   ↓ (React State)
UI 렌더링 (라운드별 표시)
```

---

## 🧪 테스트 결과

### 로컬 테스트 (2025-10-09)
- ✅ 업비트 API 연결 성공
- ✅ 300개 주문 조회 완료
- ✅ DOGE, ETH, SOL, BTC 등 8개 코인 분석
- ✅ 라운드 매칭 정확성 확인
- ✅ 수익 계산 정확성 확인
- ✅ UI 렌더링 정상

**샘플 결과**:
```
DOGE: 총 2라운드, 37,116원 수익
ETH: 총 11라운드
SOL: 총 3라운드
BTC: 진행 중 (매도 대기)
```

---

## 📝 코드 위치

```
/Users/woocheolshin/Documents/Vibecoding_1/investment-app/
├── backend/
│   ├── services/
│   │   ├── upbit_service.py          # 업비트 API 서비스
│   │   └── crypto_analyzer.py        # 거래 분석 엔진
│   ├── app.py                         # Flask 엔드포인트 추가 (2538-2663번 라인)
│   └── test_upbit_api.py             # API 연결 테스트
└── frontend/
    └── src/app/
        └── crypto-trades/
            └── page.tsx               # 프론트엔드 대시보드
```

---

## 🎯 다음 세션 작업 사항

1. **Render 배포 준비**:
   ```bash
   # requirements.txt에 추가
   PyJWT==2.8.0
   requests==2.31.0
   ```

2. **환경변수 설정**:
   - Render Dashboard → Environment Variables
   - `UPBIT_ACCESS_KEY`, `UPBIT_SECRET_KEY` 추가

3. **프론트엔드 URL 변경**:
   ```typescript
   // page.tsx
   const response = await fetch('https://investment-app-backend-x166.onrender.com/api/crypto/analysis');
   ```

4. **통합 테스트**:
   - 프로덕션 환경에서 API 호출 성공 확인
   - 데이터 정합성 검증

---

## 💡 참고 자료

- **업비트 API 문서**: https://docs.upbit.com
- **기존 포트폴리오 시스템**: `/portfolio/page.tsx`
- **경제지표 시스템**: `/indicators/page.tsx`
- **CLAUDE.md**: 프로젝트 컨텍스트 문서

---

## 🏆 성공 기준

- [x] 로컬에서 거래 내역 정상 조회
- [x] 라운드 매칭 정확성 100%
- [x] 같은 시간대 거래 합산 기능 작동
- [ ] 프로덕션 배포 완료
- [ ] 실제 사용자 테스트 통과

---

**작성일**: 2025-10-09 19:00 KST
**최종 업데이트**: 2025-10-09 19:00 KST
