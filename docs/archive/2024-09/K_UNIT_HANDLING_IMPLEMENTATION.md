# K 단위 데이터 처리 시스템 구현 가이드

> 날짜: 2025-09-25
> 작업자: Claude Code
> 목표: 비농업고용, 신규실업급여신청 K 단위 데이터 처리 및 색상 로직 수정

## 📋 작업 개요

### 배경
- 사용자 요청: "비농업 고용과 신규 실업 급여 신청은 K가 들어가잖아. 다른 지표들의%처럼. 그렇게 처리할 수 없나?"
- 문제: K 단위 데이터가 숫자로 변환되어 단위 정보 손실
- 목표: % 데이터와 동일한 방식으로 K 단위 데이터 처리

### 작업 범위
1. 백엔드 크롤러에서 K 단위 문자열 보존
2. 프론트엔드 파싱 함수에 K 단위 처리 로직 추가
3. 차트에서 K 값을 숫자로 변환하여 시각화
4. 테이블에서 원본 K 단위 문자열 표시
5. 고용지표 카드 색상 로직 수정

## 🔧 구현 상세

### 1. 백엔드 크롤러 수정

**파일**: `/backend/crawlers/investing_crawler.py`

```python
def parse_numeric_value(value_str):
    """Parse numeric value from string, keep % symbol if present"""
    if not value_str or value_str.strip() == '':
        return None

    value_str = value_str.strip()

    # If value contains % or K, return as string with the symbol
    if '%' in value_str or 'K' in value_str:
        return value_str

    try:
        # Remove any non-numeric characters except decimal point and minus
        cleaned = re.sub(r'[^\d.-]', '', value_str)
        return float(cleaned) if cleaned else None
    except:
        return None
```

**변경점**: `'K' in value_str` 조건 추가하여 K 단위 문자열 보존

### 2. 프론트엔드 파싱 함수 확장

**파일**: `/frontend/src/components/DataCharts.tsx`

```typescript
const parseChartValue = (value: string | number | null): number | null => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    // Handle percentage values
    if (value.includes('%')) {
      const numericValue = parseFloat(value.replace('%', ''));
      return isNaN(numericValue) ? null : numericValue;
    }
    // Handle K (thousands) values
    if (value.includes('K')) {
      const numericValue = parseFloat(value.replace('K', ''));
      return isNaN(numericValue) ? null : numericValue;
    }
  }
  return parseFloat(value) || null;
};
```

**파일**: `/frontend/src/components/EmploymentDataSection.tsx`

```typescript
const parsePercentValue = (value: string | number | null): number | null => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    // Handle percentage values
    if (value.includes('%')) {
      const numericValue = parseFloat(value.replace('%', ''));
      return isNaN(numericValue) ? null : numericValue;
    }
    // Handle K (thousands) values
    if (value.includes('K')) {
      const numericValue = parseFloat(value.replace('K', ''));
      return isNaN(numericValue) ? null : numericValue;
    }
  }
  return parseFloat(String(value)) || null;
};
```

### 3. 고용지표 카드 색상 로직 수정

**파일**: `/frontend/src/components/EconomicIndicatorCard.tsx`

#### 3.1 고용지표 매핑 추가

```typescript
const getIndicatorId = (name: string): string => {
  // ... 기존 경기지표 매핑 ...

  // 고용지표
  if (name.includes('실업률')) return 'unemployment-rate';
  if (name.includes('비농업 고용')) return 'nonfarm-payrolls';
  if (name.includes('신규 실업급여 신청')) return 'initial-jobless-claims';
  if (name.includes('평균시간당임금 (YoY)')) return 'average-hourly-earnings-1777';
  if (name.includes('평균시간당임금')) return 'average-hourly-earnings';
  if (name.includes('경제활동참가율')) return 'participation-rate';

  return 'unknown';
};
```

#### 3.2 역방향 지표 색상 로직 구현

```typescript
const getSurpriseColor = (surprise: number | null) => {
  if (surprise === null) return 'text-gray-500';

  const indicatorId = getIndicatorId(indicator.name);

  // 실업률과 신규 실업급여 신청은 낮을수록 좋음 (역방향 지표)
  if (indicatorId === 'unemployment-rate' || indicatorId === 'initial-jobless-claims') {
    if (surprise > 0) return 'text-red-600';   // 실제가 예상보다 높음 = 나쁜 소식 = RED
    if (surprise < 0) return 'text-green-600'; // 실제가 예상보다 낮음 = 좋은 소식 = GREEN
  } else {
    // 나머지 지표들은 높을수록 좋음 (정방향 지표)
    if (surprise > 0) return 'text-green-600'; // 실제가 예상보다 높음 = 좋은 소식 = GREEN
    if (surprise < 0) return 'text-red-600';   // 실제가 예상보다 낮음 = 나쁜 소식 = RED
  }

  return 'text-gray-500';
};
```

## ✅ 검증 및 테스트

### API 응답 검증

```bash
# 비농업고용
curl "https://investment-app-backend-x166.onrender.com/api/rawdata/nonfarm-payrolls"
# 응답: "actual": "22K", "forecast": "75K", "previous": "79K"

# 신규실업급여신청
curl "https://investment-app-backend-x166.onrender.com/api/rawdata/initial-jobless-claims"
# 응답: "actual": "218K", "forecast": "233K", "previous": "232K"
```

### 데이터베이스 검증

```bash
# 히스토리 데이터에도 K 단위 저장됨
curl "https://investment-app-backend-x166.onrender.com/api/v2/history/nonfarm-payrolls"
# 응답: "actual": "22K", "forecast": "75K", "previous": "79K"
```

### 색상 로직 검증

**신규실업급여신청 (역방향 지표)**:
- 실제: 218K, 예상: 233K
- 218 < 233 → 실업급여 신청이 예상보다 적음 → 좋은 소식 → **초록색** ✅
- 서프라이즈: 218 - 233 = -15 (음수) → 역방향에서 **초록색** ✅

**비농업고용 (정방향 지표)**:
- 실제: 22K, 예상: 75K
- 22 < 75 → 고용이 예상보다 적음 → 나쁜 소식 → **빨간색** ✅

## 🚀 배포 및 검증

### Git 커밋
```bash
git add .
git commit -m "feat: K 단위 데이터 처리 시스템 구현

- 백엔드 크롤러에서 K 단위 문자열 보존 (parse_numeric_value)
- 프론트엔드 파싱 함수에 K 단위 처리 로직 추가
- DataCharts: parseChartValue에 K 단위 숫자 변환
- EmploymentDataSection: parsePercentValue에 K 단위 지원
- EconomicIndicatorCard: 고용지표 매핑 및 역방향 색상 로직

비농업고용, 신규실업급여신청에서 22K, 218K 등 K 단위 정상 표시"

git push origin main
```

### 프로덕션 배포 확인
- Vercel (프론트엔드): 자동 배포 완료
- Render (백엔드): 정상 작동 중

## 📊 결과 요약

### 성공한 기능
- ✅ K 단위 데이터 문자열로 보존 ("22K", "218K")
- ✅ 차트에서 K 값을 숫자로 변환하여 정상 시각화
- ✅ 테이블에서 원본 K 단위 표시
- ✅ 카드에서 K 단위 기반 올바른 색상 표시
- ✅ 역방향 지표 (실업률, 신규실업급여신청) 색상 로직 구현

### 데이터 플로우
1. **크롤링**: investing.com → K 단위 문자열 보존
2. **저장**: PostgreSQL 데이터베이스 → K 단위 문자열 저장
3. **API**: /api/rawdata, /api/v2/history → K 단위 문자열 응답
4. **프론트엔드**:
   - 테이블 표시: K 단위 문자열 그대로 표시
   - 차트 렌더링: K 단위 → 숫자 변환 (22)
   - 색상 계산: K 단위 → 숫자 변환하여 비교

## 🔮 향후 확장성

### 새로운 단위 추가 시
1. 백엔드 `parse_numeric_value`에 새 단위 조건 추가
2. 프론트엔드 `parseChartValue`, `parsePercentValue`에 새 단위 처리 로직 추가
3. 동일한 패턴으로 확장 가능

### 새로운 역방향 지표 추가 시
1. `EconomicIndicatorCard.getSurpriseColor`에 지표 ID 추가
2. `EmploymentDataSection.getColorForValue`에 지표 ID 추가
3. 일관된 색상 로직 적용

이 문서는 K 단위 데이터 처리 시스템의 완전한 구현 가이드로, 향후 유사한 단위 데이터 확장 시 참고 자료로 활용할 수 있습니다.