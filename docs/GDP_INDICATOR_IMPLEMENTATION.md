# GDP 지표 추가 구현 과정 및 시행착오 분석

## 개요
본 문서는 Investment App에 GDP QoQ 경제지표를 추가하는 과정에서 겪은 문제점들과 해결 방법을 상세히 기록합니다.

## 시스템 아키텍처 이해

### 데이터 흐름
```
1. 크롤링 → Neon DB 저장
2. v2 API → 데이터베이스 조회
3. 프론트엔드 → Raw Data 카드 표시
4. 프론트엔드 → 데이터 섹션 테이블 표시
```

### 핵심 구조
- **백엔드**: Flask API + PostgreSQL (Neon.tech)
- **프론트엔드**: Next.js + Vercel
- **데이터**: 실시간 크롤링 → DB 저장 → 빠른 조회

## 표준 4단계 구현 절차

### 1단계: 백엔드 크롤링 모듈 구현
```python
# 파일: backend/crawlers/gdp.py
from .investing_crawler import fetch_html, parse_history_table, extract_raw_data

def get_gdp_data():
    """Get GDP QoQ data from investing.com"""
    try:
        url = "https://www.investing.com/economic-calendar/gdp-375"
        html = fetch_html(url)
        rows = parse_history_table(html)
        raw_data = extract_raw_data(rows)
        return raw_data
    except Exception as e:
        return {"error": f"Crawling failed: {str(e)}"}
```

**API 엔드포인트 추가:**
```python
# backend/app.py
@app.route('/api/rawdata/gdp')
def get_gdp_rawdata():
    # ADR-007 표준 API 응답 구조 준수
    return jsonify({
        "status": "success",
        "data": data,
        "source": "investing.com",
        "indicator": "GDP QoQ"
    })

@app.route('/api/history-table/gdp')
def get_gdp_history():
    # History Table 데이터 제공
```

### 2단계: Raw Data 카드 연동
**v2 API 자동 처리 방식**: 별도 구현 불필요, 데이터베이스 저장 시 자동 표시

### 3단계: 데이터 섹션 테이블 연동
```typescript
// frontend/src/components/DataSection.tsx
const [tabsData, setTabsData] = useState<TabData[]>([
  // 기존 지표들...
  {
    id: 'gdp',
    name: 'GDP QoQ',
    data: [],
    loading: false
  }
]);
```

### 4단계: 차트 구현
기존 `DataCharts` 컴포넌트가 자동 처리 (추가 구현 불필요)

## 시행착오 및 해결 과정

### ❌ 문제 1: 잘못된 구현 순서
**문제**: 1단계만 완료하고 바로 데이터베이스 작업 시작
```
잘못된 순서: 크롤러 구현 → 데이터베이스 저장 → 프론트엔드 미완성
올바른 순서: 크롤러 구현 → 프론트엔드 완성 → 데이터베이스 저장
```

**교훈**: 표준 4단계를 순차적으로 완료해야 함

### ❌ 문제 2: v2 API 업데이트 로직 오류
**문제**: `db_service.get_all_indicators()`가 기존 저장된 지표만 반환
```python
# 문제 코드
def update_all_indicators():
    indicators = db_service.get_all_indicators()  # GDP 제외됨

# 해결 코드
def update_all_indicators():
    indicators = list(CrawlerService.INDICATOR_URLS.keys())  # 모든 지표 포함
```

**교훈**: 신규 지표는 CrawlerService 기준으로 처리해야 함

### ❌ 문제 3: v2 API 응답에서 GDP 누락
**문제**: GDP가 데이터베이스에 저장되어도 카드 표시 안됨
```python
# 문제 코드
@app.route('/api/v2/indicators')
def get_all_indicators_from_db():
    indicators = db_service.get_all_indicators()  # 저장된 것만 조회

# 해결 코드
@app.route('/api/v2/indicators')
def get_all_indicators_from_db():
    all_indicator_ids = list(CrawlerService.INDICATOR_URLS.keys())  # 정의된 모든 지표 확인
    for indicator_id in all_indicator_ids:
        data = db_service.get_indicator_data(indicator_id)
        if "error" not in data:  # 저장된 것만 포함
```

**교훈**: v2 API는 모든 정의된 지표를 확인하되 저장된 것만 응답해야 함

### ❌ 문제 4: CORS 설정 불완전
**문제**: POST 요청 preflight 차단
```python
# 초기 설정
CORS(app, origins=["https://investment-app-rust-one.vercel.app", "http://localhost:3000"])

# 개선된 설정
CORS(app,
     origins=["https://investment-app-rust-one.vercel.app", "http://localhost:3000"],
     methods=['GET', 'POST', 'OPTIONS'],
     allow_headers=['Content-Type', 'Authorization'])
```

### ❌ 문제 5: CrawlerService 설정 누락
**문제**: GDP가 업데이트 대상에서 제외됨
```python
# CrawlerService에 추가 필요
INDICATOR_URLS = {
    # 기존 지표들...
    'gdp': 'https://www.investing.com/economic-calendar/gdp-375'
}

name_mapping = {
    # 기존 지표들...
    'gdp': 'GDP QoQ'
}
```

## 핵심 학습 사항

### 1. 시스템 이해의 중요성
- v2 API 기반 데이터베이스 조회 시스템
- 실시간 크롤링이 아닌 저장된 데이터 기반 표시
- 업데이트 버튼으로 수동 갱신

### 2. 데이터 흐름 추적
```
크롤링 성공 → 데이터베이스 저장 → v2 API 포함 → 카드 표시
```
어느 단계에서 문제가 발생했는지 정확한 진단 필요

### 3. 일관성 있는 코드 패턴
- CrawlerService 중심 설계
- ADR-007 표준 API 응답 구조
- % 데이터 처리 규칙 (ADR-005)

## 검증 체크리스트

### 백엔드 검증
- [ ] CrawlerService.INDICATOR_URLS에 지표 추가
- [ ] CrawlerService.get_indicator_name()에 이름 매핑 추가
- [ ] /api/rawdata/{indicator} 엔드포인트 정상 응답
- [ ] /api/history-table/{indicator} 엔드포인트 정상 응답

### 데이터베이스 검증
- [ ] 수동 크롤링으로 데이터 저장: `/api/v2/crawl/{indicator}`
- [ ] 개별 지표 조회 가능: `/api/v2/indicators/{indicator}`
- [ ] v2 전체 목록에 포함: `/api/v2/indicators`

### 프론트엔드 검증
- [ ] DataSection.tsx에 탭 추가
- [ ] Raw Data 카드 자동 표시
- [ ] 데이터 섹션 테이블 작동
- [ ] 차트 자동 생성

## 결론

GDP 지표 추가 과정에서 겪은 주요 문제는 **시스템 아키텍처에 대한 이해 부족**이었습니다. 특히:

1. v2 API 기반 데이터베이스 시스템의 동작 방식
2. CrawlerService 중심의 지표 관리 구조
3. 프론트엔드 자동 처리 메커니즘

이러한 이해를 바탕으로 **표준 4단계 절차**를 정확히 따르면 새로운 경제지표를 효율적으로 추가할 수 있습니다.

---

**작성일**: 2025-09-18
**대상 지표**: GDP QoQ
**소요 시간**: 약 3시간 (시행착오 포함)
**성공 지표**: Raw Data 카드 + 데이터 섹션 테이블 + 차트 모두 정상 작동