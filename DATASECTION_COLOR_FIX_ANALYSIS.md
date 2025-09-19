# DataSection History Table 색상 로직 수정 분석

**분석일**: 2025-09-18
**해결자**: Claude
**영향 범위**: `frontend/src/components/DataSection.tsx`

---

## 🚨 문제 상황

사용자가 History Table에서 경제지표 색상이 반대로 표시되는 문제 발견:

| 지표 | 날짜 | Forecast | Actual | 기대 색상 | 실제 색상 |
|------|------|----------|--------|----------|----------|
| GDP QoQ | 5월 29일 | -0.3% | -0.2% | 🟢 GREEN | 🔴 RED |
| GDP QoQ | 6월 26일 | -0.2% | -0.5% | 🔴 RED | 🟢 GREEN |
| Retail Sales MoM | 6월 17일 | -0.5% | -0.9% | 🔴 RED | 🟢 GREEN |
| Industrial Production | 4월 16일 | -0.2% | -0.3% | 🔴 RED | 🟢 GREEN |

**사용자 증언**: "GDP QoQ의 5월 29일은 -0.3에서 -0.2로 상승한건데 빨간색으로 나와"

---

## 🔍 원인 분석

### 1. 문제 위치 특정
여러 색상 로직 중 **DataSection.tsx 287-293번 라인**에서 발견:

```typescript
// 🔴 문제가 된 기존 코드
className={`font-medium ${
  row.actual === null
    ? 'text-gray-400'
    : row.forecast && row.actual > row.forecast    // ← 문제 지점
    ? 'text-green-600 dark:text-green-400'
    : row.forecast && row.actual < row.forecast    // ← 문제 지점
    ? 'text-red-600 dark:text-red-400'
    : 'text-gray-900 dark:text-white'
}`}
```

### 2. 근본 원인: JavaScript 문자열 vs 숫자 비교

**문제**: `row.actual`과 `row.forecast`가 문자열 형태 (`"-0.2%"`, `"-0.3%"`)로 저장되어 있어 ASCII 문자 순서로 비교됨

```javascript
// 문자열 비교 (잘못된 결과)
"-0.2%" > "-0.3%"  // false (ASCII: '-' → '0' → '.' → '2' vs '-' → '0' → '.' → '3')
"-0.5%" > "-0.2%"  // true  (ASCII: '5' > '2')

// 숫자 비교 (올바른 결과)
-0.2 > -0.3  // true  (수학적으로 -0.2가 -0.3보다 큼)
-0.5 > -0.2  // false (수학적으로 -0.5가 -0.2보다 작음)
```

### 3. 다른 컴포넌트와의 차이점

- **EconomicIndicatorCard.tsx**: ✅ `parsePercentValue()` 사용하여 정상 작동
- **DataSection.tsx**: ❌ 문자열 직접 비교로 오류 발생

---

## 🛠️ 해결 방법

### 1. parsePercentValue 함수 추가
```typescript
const parsePercentValue = (value: string | number | null): number | null => {
  if (value === null) return null;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const numStr = value.replace('%', '');
    const num = parseFloat(numStr);
    return isNaN(num) ? null : num;
  }
  return null;
};
```

### 2. 색상 로직 수정
```typescript
// ✅ 수정된 코드
className={`font-medium ${(() => {
  if (row.actual === null) return 'text-gray-400';

  const actualNum = parsePercentValue(row.actual);
  const forecastNum = parsePercentValue(row.forecast);

  if (actualNum !== null && forecastNum !== null) {
    if (actualNum > forecastNum) return 'text-green-600 dark:text-green-400'; // 실제가 예상보다 좋음
    if (actualNum < forecastNum) return 'text-red-600 dark:text-red-400';     // 실제가 예상보다 나쁨
  }

  return 'text-gray-900 dark:text-white';
})()}`}
```

---

## ✅ 검증 결과

수정 후 예상 색상과 실제 색상이 일치함을 확인:

```javascript
// 검증 테스트
GDP 5월 29일: actual="-0.2%", forecast="-0.3%" → color: GREEN ✅
GDP 6월 26일: actual="-0.5%", forecast="-0.2%" → color: RED ✅
Retail Sales 6월 17일: actual="-0.9%", forecast="-0.5%" → color: RED ✅
Industrial Production 4월 16일: actual="-0.3%", forecast="-0.2%" → color: RED ✅
```

### 경제학적 해석 검증
- **-0.2% vs -0.3%**: -0.2%가 더 좋음 (덜 마이너스) → 🟢 GREEN
- **-0.5% vs -0.2%**: -0.5%가 더 나쁨 (더 마이너스) → 🔴 RED
- **원칙**: "덜 음수 = 더 좋음" 적용

---

## 🎯 교훈 및 예방책

1. **문자열 vs 숫자 비교 주의**: 퍼센트 데이터는 반드시 숫자 변환 후 비교
2. **일관성 유지**: 모든 컴포넌트에서 동일한 parsePercentValue 함수 사용
3. **테스트 케이스 확장**: 음수 데이터 포함한 경계값 테스트 필요
4. **코드 리뷰**: 유사한 로직이 있는 다른 파일도 점검 필요

---

## 📋 관련 파일

- **수정 파일**: `frontend/src/components/DataSection.tsx`
- **참조 파일**: `frontend/src/components/EconomicIndicatorsSection.tsx` (parsePercentValue 로직)
- **영향 없음**: `frontend/src/components/EconomicIndicatorCard.tsx` (이미 올바른 로직)