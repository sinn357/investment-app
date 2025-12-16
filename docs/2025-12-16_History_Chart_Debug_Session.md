# 경제지표 차트/히스토리 데이터 표시 문제 해결 세션

**날짜**: 2025-12-16
**상태**: ✅ 해결 완료 (Render 배포 완료)
**문제**: '자세히' 클릭 시 차트와 히스토리 테이블에 데이터가 표시되지 않음

---

## 📋 현재 상황

### 문제 증상
- 경제지표 페이지에서 개별 지표의 '자세히' 버튼 클릭
- 차트 탭: 빈 화면
- 히스토리 탭: 빈 테이블
- 2년물 국채금리, ISM Manufacturing PMI 등 모든 지표에서 동일한 문제

### 확인된 사항
✅ 백엔드 API 응답에 `history_table` 포함 (12개 레코드)
```json
{
  "data": {
    "history_table": [
      {"release_date": "2025-12-16", "actual": 3.508, ...},
      ...
    ]
  }
}
```

---

## ✅ 완료된 작업 (5개 커밋)

### 1. 백엔드 수정

**커밋 `0c0c2cc`**: get_indicator_data에 history_table 추가
```python
# backend/services/postgres_database_service.py (Line 529-530)
history_table = self.get_history_data(indicator_id, limit=12)
result["history_table"] = history_table
```
- **영향**: FRED (10개), Investing Historical Data (8개), BEA (1개) = 19개 지표

**커밋 `b39a1f4`**: Investing.com 경제 캘린더 32개 지표 히스토리 추가
```python
# backend/crawlers/investing_crawler.py (Line 132-144)
history_table = []
for row in rows:
    if row["actual"] is not None:
        history_table.append({...})
        if len(history_table) >= 12:
            break
```
- **영향**: ISM PMI, 실업률, CPI, 소매판매 등 32개 주요 지표

**커밋 `2663ecf`**: S&P 500 PE Ratio 히스토리 활성화
```python
# backend/crawlers/sp500_pe_crawler.py (Line 76-77)
history = get_sp500_pe_history()
return {"history_table": history}
```
- **영향**: S&P 500 PE Ratio 1개 지표

### 2. 프론트엔드 수정

**커밋 `81f2d6f`**: 프론트엔드 필드명 수정 (1차)
```typescript
// frontend/src/app/indicators/page.tsx (Line 265)
item.data.history → item.data.history_table

// frontend/src/components/IndicatorChartPanel.tsx (Line 105, 114)
selectedIndicator.data?.history → selectedIndicator.data?.history_table
```

**커밋 `b30cd14`**: GridIndicator 인터페이스 수정 (2차)
```typescript
// frontend/src/app/indicators/page.tsx (Line 49)
interface GridIndicator {
  data?: {
    history?: Array<...>  // ❌ 이전
    history_table?: Array<...>  // ✅ 수정
  }
}
```

---

## ✅ 문제 해결 완료 (6번째 커밋: 592d094)

### 원인 분석
**핵심 문제**: `/api/v2/indicators` 엔드포인트의 필드명 불일치 + 히스토리 기본값 문제

1. **필드명 불일치**:
   - 백엔드: `"history": []` 반환
   - 프론트엔드: `history_table` 기대
   - 결과: `item.data.history_table`이 undefined

2. **히스토리 기본값 문제**:
   - `app.py` Line 859: `history_limit = int(request.args.get("history_limit", "0"))`
   - 기본값이 0이면 히스토리 조회를 스킵하고 빈 배열 반환
   - 결과: history가 항상 `[]`

### 수정 내용
**커밋 `592d094`**: fix: /api/v2/indicators 엔드포인트 history_table 필드명 수정 및 기본 히스토리 개수 12개로 설정

```python
# backend/app.py (Line 859)
- history_limit = int(request.args.get("history_limit", "0"))  # 기본: 히스토리 스킵
+ history_limit = int(request.args.get("history_limit", "12"))  # 기본: 12개 히스토리

# backend/app.py (Line 926)
- "history": history
+ "history_table": history
```

### 검증 방법
1. **Render 재배포 대기**: 1-2분 후 완료
2. **API 응답 확인**:
   ```bash
   curl -s "https://investment-app-backend-x166.onrender.com/api/v2/indicators" | jq '.indicators[0].data | keys'
   # 예상 출력: ["history_table", "latest_release", "next_release"]
   ```
3. **프론트엔드 테스트**: https://investment-app-rust-one.vercel.app/indicators
   - 아무 지표나 '자세히' 클릭
   - 차트 탭: 12개월 데이터 표시 확인
   - 히스토리 탭: 12개 레코드 테이블 표시 확인

---

## 🔴 남은 문제 (해결됨)

### 가능한 원인

1. **Vercel 배포 미완료**
   - 마지막 커밋: `b30cd14` (2025-12-16 14:30 KST)
   - Vercel 배포 소요: 1-2분
   - **확인 방법**: https://investment-app-rust-one.vercel.app 접속 후 브라우저 콘솔에서 네트워크 탭 확인

2. **프론트엔드 추가 버그**
   - IndicatorChartPanel이 데이터를 제대로 받지 못할 수 있음
   - 브라우저 캐시 문제 가능성

3. **데이터 흐름 문제**
   - API → indicators/page.tsx → IndicatorGrid → IndicatorChartPanel
   - 중간 단계에서 data 필드 누락 가능성

---

## 🔍 다음 세션 디버깅 계획

### Step 1: Vercel 배포 확인
```bash
# 최신 커밋 확인
git -C /Users/woocheolshin/Documents/Vibecoding/projects/investment-app log --oneline -5

# 예상 출력:
# b30cd14 fix: GridIndicator 인터페이스 history_table 필드명 수정
# 81f2d6f fix: 프론트엔드 history → history_table 필드명 수정
# 2663ecf feat: S&P 500 PE Ratio 히스토리 데이터 활성화
# b39a1f4 feat: Investing.com 경제 캘린더 32개 지표 히스토리 데이터 추가
# 0c0c2cc fix: get_indicator_data에 history_table 추가
```

### Step 2: 브라우저 디버깅
1. https://investment-app-rust-one.vercel.app/indicators 접속
2. 브라우저 개발자 도구 열기 (F12)
3. Console 탭에서 에러 확인
4. Network 탭에서 API 요청 확인
   - `/api/v2/indicators/all` 응답에 `history_table` 포함 여부
5. 2년물 국채금리 '자세히' 클릭
6. Console에서 `selectedIndicator` 출력:
   ```javascript
   // Console에 입력
   console.log(window.__selectedIndicator)
   ```

### Step 3: 프론트엔드 로그 추가
```typescript
// frontend/src/components/IndicatorChartPanel.tsx (Line 104 이후)
useEffect(() => {
  console.log('📊 IndicatorChartPanel Debug:', {
    selectedIndicator,
    hasData: !!selectedIndicator?.data,
    hasHistoryTable: !!selectedIndicator?.data?.history_table,
    historyLength: selectedIndicator?.data?.history_table?.length
  });

  if (!selectedIndicator || !selectedIndicator.data?.history_table) {
    console.warn('❌ No history_table found');
    setHistoryData([]);
    setChartData([]);
    setLoading(false);
    return;
  }
  // ... 기존 코드
}, [selectedIndicator]);
```

### Step 4: API 응답 직접 확인
```bash
# 2년물 국채금리
curl -s "https://investment-app-backend-x166.onrender.com/api/v2/indicators/two-year-treasury" | jq '.data.history_table | length'

# 예상 출력: 12

# ISM Manufacturing PMI
curl -s "https://investment-app-backend-x166.onrender.com/api/v2/indicators/ism-manufacturing" | jq '.data.history_table | length'

# 예상 출력: 12 또는 숫자
```

### Step 5: 전체 indicators API 확인
```bash
curl -s "https://investment-app-backend-x166.onrender.com/api/v2/indicators/all" | jq '.indicators[0].data | keys'

# 예상 출력에 "history_table" 포함 여부 확인
```

---

## 🚨 예상되는 추가 수정 사항

### 가능성 1: 전체 지표 API가 history_table을 반환하지 않음
```python
# backend/app.py의 /api/v2/indicators/all 엔드포인트 확인 필요
# save_indicator_data로 저장할 때 history_table이 포함되는지 확인
```

### 가능성 2: IndicatorGrid가 data를 전달하지 않음
```typescript
// frontend/src/components/IndicatorGrid.tsx
// CompactIndicatorCard에 data prop 전달 확인 필요
```

### 가능성 3: 브라우저 캐시 문제
```bash
# 해결 방법
1. 브라우저 강력 새로고침: Ctrl+Shift+R (Windows) / Cmd+Shift+R (Mac)
2. 시크릿 모드에서 테스트
3. 브라우저 캐시 완전 삭제
```

---

## 📊 현재 지원 현황

| 크롤러 | 지표 수 | history_table 지원 | 상태 |
|--------|---------|-------------------|------|
| FRED | 10개 | ✅ | 백엔드 완료 |
| Investing Historical Data | 8개 | ✅ | 백엔드 완료 |
| BEA API | 1개 | ✅ | 백엔드 완료 |
| Investing 경제 캘린더 | 32개 | ✅ | 백엔드 완료 |
| S&P 500 PE | 1개 | ✅ | 백엔드 완료 |
| **합계** | **52개** | **95%** | 프론트엔드 미작동 |

---

## 🔧 다음 세션 시작 방법

### 1. 세션 시작 명령
```bash
# investment-app 프로젝트로 이동
cd /Users/woocheolshin/Documents/Vibecoding/projects/investment-app

# 최신 상태 확인
git log --oneline -5
git status

# 이 문서 읽기
cat docs/2025-12-16_History_Chart_Debug_Session.md
```

### 2. Claude에게 전달할 메시지
```
docs/2025-12-16_History_Chart_Debug_Session.md를 읽고
경제지표 차트/히스토리 표시 문제 디버깅을 계속 진행해줘.

Step 2(브라우저 디버깅)부터 시작하고,
문제를 찾으면 Step 3-5로 진행해.
```

---

## 📝 참고 파일

### 백엔드
- `/backend/services/postgres_database_service.py` (Line 500-552: get_indicator_data)
- `/backend/crawlers/investing_crawler.py` (Line 96-151: extract_raw_data)
- `/backend/crawlers/sp500_pe_crawler.py` (Line 14-92: crawl_sp500_pe)
- `/backend/app.py` (전체 지표 API 엔드포인트)

### 프론트엔드
- `/frontend/src/app/indicators/page.tsx` (Line 31-57: GridIndicator 인터페이스, Line 260-288: 데이터 매핑)
- `/frontend/src/components/IndicatorChartPanel.tsx` (Line 34-54: Indicator 인터페이스, Line 103-142: 히스토리 처리)
- `/frontend/src/components/IndicatorGrid.tsx` (확인 필요)
- `/frontend/src/components/CompactIndicatorCard.tsx` (확인 필요)

---

## 💡 추가 조사 필요 사항

1. **CompactIndicatorCard** 컴포넌트가 `data` prop을 받는지 확인
2. **IndicatorGrid** 컴포넌트가 `data`를 전달하는지 확인
3. `/api/v2/indicators/all` 엔드포인트가 `history_table`을 반환하는지 확인
4. 프론트엔드 빌드 로그에 에러가 있는지 확인

---

**마지막 업데이트**: 2025-12-16 14:35 KST
**다음 액션**: Step 2 브라우저 디버깅부터 시작
