# Investment App - Economic Indicators Dashboard

실시간 경제지표 데이터를 크롤링하여 시각화하는 웹 애플리케이션

## 🚀 Features

- **실시간 경제지표 크롤링**: investing.com에서 최신 경제지표 데이터 수집
- **Raw Data 카드**: 주요 지표의 최신 발표일, 다음 발표일, 실제치, 예측치, 서프라이즈 표시
- **History Table**: 각 지표별 과거 데이터 전체 조회 (탭 네비게이션)
- **인터랙티브 차트**: 막대형 + 선형 차트로 데이터 시각화
- **다크 모드 지원**: 라이트/다크 테마 전환
- **개별분석 시스템**: 자산별 투자 분석 및 의사결정 지원

## 💼 개별분석 페이지 (Analysis Page)

### 5개 탭 구조
1. **① 투자 가설** (thesis)
   - 투자 이유와 알파 종류
   - 7개 필드: 핵심 가설, 투자 테제, 기회 유형, 알파 원천 등

2. **② 검증: 펀더멘털** (validation)
   - 사업 구조, 경쟁력, 재무 분석
   - 24개 필드, 4개 섹션: 사업 구조, 경쟁 분석, 재무 상태, 리스크

3. **③ 가격과 기대치** (pricing)
   - 밸류에이션, 시나리오 분석
   - 8개 지표 + 3가지 시나리오 (최선/기본/최악)

4. **④ 타이밍 & 리스크** (timing)
   - 기술적 분석, 진입/청산 조건
   - 14개 필드: 7가지 진입 조건 + 7가지 무효화 조건

5. **⑤ 결정 & 관리** (decision)
   - 최종 결정, 목표가, 리스크 관리
   - 11개 필드: 투자 결정, 비중, 목표가, 손절가 등

### 기술 스택
- **프론트엔드**: Next.js 15, TypeScript, shadcn/ui
- **백엔드**: Flask, PostgreSQL, JSONB
- **상태 관리**: localStorage (임시), PostgreSQL (영구)
- **데이터 저장**: 80+ 입력 필드를 JSONB 구조로 유연하게 저장

### 주요 기능
- **시나리오 분석**: 최선/기본/최악 시나리오 기반 목표가 자동 계산
- **진입/무효화 조건**: 7가지 기술적 조건 기반 매수/매도 판단
- **실시간 저장**: localStorage 기반 자동 저장 (향후 PostgreSQL 마이그레이션 예정)

## 📊 Supported Indicators

1. **ISM Manufacturing PMI** - 제조업 구매관리자지수
2. **ISM Non-Manufacturing PMI** - 비제조업 구매관리자지수
3. **S&P Global Composite PMI** - S&P 글로벌 종합 구매관리자지수
4. **Industrial Production** - 산업생산지수
5. **Industrial Production YoY** - 산업생산지수 전년대비 (%)

## 🛠 Tech Stack

### Backend
- **Python 3.11** - 서버 언어
- **Flask** - 웹 프레임워크
- **BeautifulSoup4** - 웹 크롤링
- **Flask-CORS** - CORS 처리

### Frontend
- **Next.js 15** - React 프레임워크
- **TypeScript** - 타입 안전성
- **Tailwind CSS** - 스타일링
- **Recharts** - 차트 라이브러리

## 🏗 Architecture

```
investment-app/
├── backend/                 # Python Flask API
│   ├── app.py              # 메인 Flask 애플리케이션
│   ├── crawlers/           # 크롤링 모듈
│   │   ├── investing_crawler.py      # 공통 크롤링 함수
│   │   ├── ism_non_manufacturing.py  # ISM 비제조업 PMI
│   │   ├── sp_global_composite.py    # S&P 글로벌 종합 PMI
│   │   ├── industrial_production.py # 산업생산지수
│   │   └── industrial_production_1755.py # 산업생산지수 YoY
│   └── requirements.txt    # Python 의존성
├── frontend/               # Next.js React 앱
│   ├── src/
│   │   ├── app/           # App Router
│   │   └── components/    # React 컴포넌트
│   ├── package.json       # Node.js 의존성
│   └── ...
└── CLAUDE.md              # 프로젝트 컨텍스트 및 개발 히스토리
```

## 🚀 Getting Started

### Prerequisites
- Python 3.11+
- Node.js 20+
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd investment-app
```

2. **Backend Setup**
```bash
cd backend
pip install -r requirements.txt
python app.py
```
Backend runs on: http://localhost:5001

3. **Frontend Setup**
```bash
cd frontend
npm install
npm run dev
```
Frontend runs on: http://localhost:3000

## 📡 API Endpoints

### Raw Data APIs
- `GET /api/rawdata/latest` - ISM Manufacturing PMI 최신 데이터
- `GET /api/rawdata/ism-non-manufacturing` - ISM Non-Manufacturing PMI
- `GET /api/rawdata/sp-global-composite` - S&P Global Composite PMI
- `GET /api/rawdata/industrial-production` - Industrial Production
- `GET /api/rawdata/industrial-production-1755` - Industrial Production YoY

### History Table APIs
- `GET /api/history-table/{indicator}` - 지표별 과거 데이터 전체

## 🎯 Key Features

### 📈 Data Processing
- **원본 데이터 보존**: 크롤링한 데이터를 원본 그대로 저장
- **% 데이터 처리**: 퍼센트 단위 데이터는 문자열로 저장, 차트에서만 숫자 변환
- **서프라이즈 계산**: (실제치 - 예측치) 자동 계산 및 반올림
- **"미정" 규칙**: 다음 발표일을 알 수 없는 경우 "미정" 표시

### 🎨 UI/UX
- **반응형 디자인**: 모바일, 태블릿, 데스크톱 대응
- **다크 모드**: 시스템 설정에 따른 자동 테마 전환
- **실시간 로딩**: 데이터 로딩 상태 및 에러 처리
- **인터랙티브 차트**: Recharts를 활용한 동적 차트

## 🔧 Development

### 4단계 지표 추가 프로세스
1. **Step 1**: 크롤링 및 데이터 검증
2. **Step 2**: Raw Data 카드 연동
3. **Step 3**: History Table 탭 추가
4. **Step 4**: 차트 자동 통합

### 코딩 컨벤션
- **Commits**: Conventional Commits 사용
- **함수 기반**: 모듈화된 크롤링 함수
- **타입 안전성**: TypeScript 엄격 모드
- **에러 처리**: 크롤링 실패 시 graceful fallback

## 📊 Data Sources

- **investing.com**: 경제지표 데이터 크롤링
- 실시간 업데이트 (수동 새로고침)
- 과거 6개월 히스토리 데이터

## 🚨 Important Notes

- 본 프로젝트는 교육/연구 목적으로 제작되었습니다
- 투자 의사결정에 사용 시 주의가 필요합니다
- 크롤링 대상 웹사이트의 이용약관을 준수해주세요

## 📄 License

MIT License

---

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>