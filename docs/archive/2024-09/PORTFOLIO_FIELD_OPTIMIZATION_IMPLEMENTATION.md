# 포트폴리오 소분류별 필드 최적화 시스템 구현 완료 보고서

> 날짜: 2025-09-24
> 상태: ✅ 완료 및 배포됨
> 작업자: Claude + 사용자

---

## 1) 개요

**사용자 요청**:
- 부동산, 원자재에서 불필요한 수량/매수평균가 필드 제거
- 소분류별로 적합한 입력/수정 필드만 표시
- 추가 폼과 수정 모달 모두에 완전한 소분류별 전용 필드 구현

**구현 목표**: 각 소분류의 특성에 맞는 최적화된 입력/수정 인터페이스 제공

---

## 2) 완료된 작업

### ✅ Phase 1: 추가 폼 필드 최적화 (100% 완료)

#### 1. 수량/평균가 필드 제거 로직 구현
```typescript
// EnhancedPortfolioForm.tsx
const showQuantityAndPrice = (() => {
  if (formData.assetType === 'investment-assets') return true;
  if (formData.assetType === 'alternative-investment') {
    // 부동산, 원자재는 수량/평균가 대신 원금/평가금액만 사용
    return !['real-estate', 'commodity'].includes(formData.subCategory);
  }
  return false;
})();
```

#### 2. 원금/평가금액 필드 표시 로직
- 투자자산: 수량/평균가 + 원금/평가금액
- 대체투자(암호화폐): 수량/평균가 + 원금/평가금액
- 대체투자(부동산/원자재): 원금/평가금액만
- 현금/예치자산: 보유금액만

#### 3. 검증 로직 세분화
```typescript
const needsPrincipalAndEvaluation = showPrincipalAndEvaluation ||
  (formData.assetType === 'alternative-investment' && ['real-estate', 'commodity'].includes(formData.subCategory));
```

### ✅ Phase 2: 수정 모달 필드 최적화 (100% 완료)

#### 1. 테이블 표시 최적화
```typescript
// PortfolioDashboard.tsx
const shouldShowQuantityPrice = (subCategory: string | null) => {
  const subCat = subCategory?.toLowerCase();
  return ['국내주식', '해외주식', 'etf', '펀드', '암호화폐'].includes(subCat || '');
};
```

#### 2. 수정 모달 필드 분리
- 수량/평균가 블록: 투자자산 + 대체투자(부동산/원자재 제외)
- 원금/평가금액 블록: 모든 투자자산 + 대체투자 (독립적 표시)

### ✅ Phase 3: 소분류별 전용 필드 완전 구현 (100% 완료)

#### 1. 추가 폼 전용 필드 (완료 + 2025-10-29 업데이트)
```typescript
const getSubCategorySpecificFields = () => {
  switch (subCat) {
    case 'real-estate': return ['areaPyeong', 'acquisitionTax', 'lawyerFee', 'brokerageFee', 'rentType', 'rentalIncome', 'jeonseDeposit'];
    case 'savings': case 'installment-savings':
      return ['maturityDate', 'interestRate', 'earlyWithdrawalFee'];
    // ... 전체 13개 전용 필드 매핑
  }
};
```

#### 2. 수정 모달 전용 필드 (완료 + 2025-10-29 업데이트)
```typescript
const getEditSubCategorySpecificFields = (subCategory: string | null) => {
  switch (subCat) {
    case '부동산':
    case 'real-estate': return ['area_pyeong', 'acquisition_tax', 'lawyer_fee', 'brokerage_fee', 'rent_type', 'rental_income', 'jeonse_deposit'];
    case '예금': case 'savings': case '적금': case 'installment-savings':
      return ['maturity_date', 'interest_rate', 'early_withdrawal_fee'];
    case 'mmf': return ['current_yield', 'annual_yield', 'minimum_balance', 'withdrawal_fee'];
    case '입출금통장': case 'checking-account': case '증권예수금': case 'securities-deposit':
      return ['interest_rate'];
    case '국내주식': case 'domestic-stock': case '해외주식': case 'foreign-stock': case 'etf':
      return ['dividend_rate'];
    case '펀드': case 'fund': return ['nav', 'management_fee'];
  }
};
```

#### 3. 필드 설정 정보 (2025-10-29 업데이트)
```typescript
const getEditFieldConfig = (fieldName: string) => {
  const configs = {
    area_pyeong: { label: '면적(평)', placeholder: '25.55', step: '0.01' }, // 소수점 둘째자리까지
    acquisition_tax: { label: '취득세', placeholder: '15000000' },
    lawyer_fee: { label: '법무사 비용', placeholder: '1500000' }, // 신규 추가
    brokerage_fee: { label: '중개비', placeholder: '3000000' }, // 신규 추가
    rent_type: { label: '임대형태', placeholder: '', type: 'select' },
    rental_income: { label: '월세 수입', placeholder: '2000000' },
    jeonse_deposit: { label: '전세보증금', placeholder: '500000000' },
    maturity_date: { label: '만기일', placeholder: '', type: 'date' },
    interest_rate: { label: '연이율(%)', placeholder: '3.5', step: '0.01' },
    // ... 전체 15개 필드 설정 (13개 → 15개)
  };
};
```

### ✅ Phase 4: 데이터 처리 완전 구현 (100% 완료)

#### 1. 편집 시 기존값 로드 (2025-10-29 업데이트)
```typescript
const handleEditAsset = (asset: Asset) => {
  setEditForm({
    // 기본 필드
    asset_type: asset.asset_type,
    // ...
    // 소분류별 전용 필드
    area_pyeong: asset.area_pyeong?.toString() || '',
    acquisition_tax: asset.acquisition_tax?.toString() || '',
    lawyer_fee: asset.lawyer_fee?.toString() || '', // 신규 추가
    brokerage_fee: asset.brokerage_fee?.toString() || '', // 신규 추가
    rent_type: asset.rent_type || 'monthly',
    rental_income: asset.rental_income?.toString() || '',
    jeonse_deposit: asset.jeonse_deposit?.toString() || '',
    // ... 전체 15개 전용 필드
  });
};
```

#### 2. API 전송 데이터 확장 (2025-10-29 업데이트)
```typescript
body: JSON.stringify({
  // 기본 필드
  asset_type: editForm.asset_type,
  // ...
  // 소분류별 전용 필드
  area_pyeong: editForm.area_pyeong ? parseFloat(editForm.area_pyeong) : null,
  acquisition_tax: editForm.acquisition_tax ? parseFloat(editForm.acquisition_tax) : null,
  lawyer_fee: editForm.lawyer_fee ? parseFloat(editForm.lawyer_fee) : null, // 신규 추가
  brokerage_fee: editForm.brokerage_fee ? parseFloat(editForm.brokerage_fee) : null, // 신규 추가
  rent_type: editForm.rent_type,
  rental_income: editForm.rental_income ? parseFloat(editForm.rental_income) : null,
  jeonse_deposit: editForm.jeonse_deposit ? parseFloat(editForm.jeonse_deposit) : null,
  // ... 전체 15개 전용 필드
})
```

### ✅ Phase 5: TypeScript 오류 해결 (100% 완료)

#### Vercel 빌드 오류 수정
- **문제**: `(editForm as any)[fieldName]` → `@typescript-eslint/no-explicit-any` 규칙 위반
- **해결**: `editForm[fieldName as keyof typeof editForm]`로 타입 안전한 접근

---

## 3) 구현된 소분류별 전용 필드 목록

### 🏠 부동산 (2025-10-29 업데이트: 3개 → 7개)
- 면적(평): area_pyeong (소수점 둘째자리까지)
- 취득세: acquisition_tax
- 법무사 비용: lawyer_fee ⭐ 신규 추가
- 중개비: brokerage_fee ⭐ 신규 추가
- 임대형태: rent_type (전세/월세)
- 월세 수입: rental_income
- 전세보증금: jeonse_deposit

### 💰 예금/적금
- 만기일: maturity_date (date 타입)
- 연이율(%): interest_rate
- 중도해지수수료: early_withdrawal_fee

### 📈 MMF
- 현재수익률(%): current_yield
- 연환산수익률(%): annual_yield
- 최소유지잔고: minimum_balance
- 출금수수료: withdrawal_fee

### 💵 입출금통장/증권예수금
- 연이율(%): interest_rate

### 📊 주식/ETF
- 배당율(%): dividend_rate

### 🏦 펀드
- 기준가격: nav
- 운용보수(%): management_fee

---

## 4) 최적화된 필드 표시 로직

### 수량/평균가 표시
- ✅ **표시**: 국내주식, 해외주식, ETF, 펀드, 암호화폐
- ❌ **숨김**: 부동산, 원자재, 현금, 예금, 적금, MMF

### 원금/평가금액 표시
- ✅ **표시**: 모든 투자자산, 모든 대체투자
- ❌ **숨김**: 즉시현금, 예치자산 (보유금액만 사용)

### 전용 필드 표시
- 🎯 **동적 표시**: 선택한 소분류에 해당하는 전용 필드만 표시
- 📱 **반응형**: MD 이상 2칸, 그 이하 1칸 그리드

---

## 5) 기술적 성과

### Frontend 개선사항
- **타입 안전성**: TypeScript keyof 연산자로 런타임 오류 방지
- **코드 재사용성**: 필드 설정 함수 모듈화
- **UX 향상**: 불필요한 필드 제거로 인터페이스 단순화
- **반응형 디자인**: 모든 디바이스에서 최적화된 입력 경험

### Backend 호환성
- **데이터 무결성**: 13개 전용 필드 모두 null 허용으로 유연성 확보
- **API 확장성**: 새로운 소분류 추가 시 간단한 필드 추가만 필요
- **타입 변환**: 문자열 입력을 적절한 숫자/날짜 타입으로 자동 변환

---

## 6) 사용자 경험 개선

### Before (기존)
- 부동산에서 불필요한 수량/매수평균가 필드 표시
- 수정 시 소분류별 전용 필드 입력 불가
- 모든 자산에 동일한 입력 필드 적용

### After (개선)
- ✅ 소분류별 맞춤 필드만 표시
- ✅ 추가/수정 모두에서 전용 필드 완전 지원
- ✅ 자산 특성에 맞는 최적화된 인터페이스
- ✅ 타입 안전성과 사용자 편의성 모두 확보

---

## 7) 배포 현황

### GitHub Repository
- **브랜치**: main
- **커밋**: 6a4621e (TypeScript 오류 수정 완료)
- **상태**: ✅ 배포 완료

### Vercel Production
- **Frontend**: https://investment-app-rust-one.vercel.app
- **상태**: ✅ 빌드 성공 (TypeScript 오류 해결)

### Render Backend
- **API**: https://investment-app-backend-x166.onrender.com
- **상태**: ✅ 정상 운영 (13개 전용 필드 지원)

---

## 8) 다음 단계 제안

### 포트폴리오 자산흐름 실제 데이터 구현
현재 시뮬레이션 데이터 대신 실제 등록일 기반 자산흐름 구현 준비:

1. **날짜 기반 집계**: 등록일(date) 필드 활용
2. **월별 자산 변화**: 자산 추가/삭제/수정 이력 추적
3. **누적 자산 흐름**: 시계열 데이터로 포트폴리오 성장 추적
4. **시각화 개선**: 실제 데이터 기반 차트 생성

**데이터 준비 방안**:
- ✅ **권장**: 등록일을 다양하게 설정하여 데이터 생성/수정
- 📅 **예시**: 2024년 1월부터 현재까지 월별로 자산 등록일 분산
- 🔄 **실시간 반영**: 새로운 자산 추가 시 즉시 자산흐름에 반영

이제 실제 등록일 기반 자산흐름 구현을 진행할 준비가 완료되었습니다.

---

## 9) 2025-10-29 추가 업데이트

### ✅ Phase 6: 부동산 법무사비용/중개비 필드 추가 (100% 완료)

#### 사용자 요청
- 부동산 자산에 법무사 비용과 중개비 입력 필드 추가
- 새 자산 추가 폼 및 수정 모달 모두에서 지원

#### 구현 내용

**1. 백엔드 확장**
```python
# backend/services/postgres_database_service.py - save_asset
INSERT INTO assets (
    ..., area_pyeong, acquisition_tax, lawyer_fee, brokerage_fee, rent_type, ...
)
VALUES (%s, %s, %s, %s, %s, %s, %s, ...)
```

**2. 프론트엔드 추가**
```typescript
// EnhancedPortfolioForm.tsx
case 'real-estate':
  return ['areaPyeong', 'acquisitionTax', 'lawyerFee', 'brokerageFee', 'rentType', 'rentalIncome', 'jeonseDeposit'];

// PortfolioDashboard.tsx - getSubCategoryColumns
case '부동산':
case 'real-estate':
  return [
    { key: 'area_pyeong', label: '면적(평)', format: (val: number) => `${formatNumber(val)}평` },
    { key: 'acquisition_tax', label: '취득세', format: formatCurrency },
    { key: 'lawyer_fee', label: '법무사비용', format: formatCurrency },
    { key: 'brokerage_fee', label: '중개비', format: formatCurrency },
    // ...
  ];
```

**3. 데이터베이스 스키마**
```sql
ALTER TABLE assets ADD COLUMN IF NOT EXISTS lawyer_fee NUMERIC;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS brokerage_fee NUMERIC;
```

#### 해결한 문제들

**문제 1: 백엔드 INSERT 문 누락**
- 증상: 필드 입력되지만 DB 저장 안됨
- 원인: save_asset INSERT 쿼리에 lawyer_fee, brokerage_fee 컬럼 누락
- 해결: INSERT 문에 2개 필드 추가

**문제 2: 프론트엔드 소분류 매칭 오류**
- 증상: 부동산 자산의 모든 전용 필드가 사라짐
- 원인: getSubCategoryColumns에서 한글('부동산')만 매칭, 실제 DB는 영문('real-estate') 또는 한글 혼재
- 해결: 한글과 영문 모두 case에 추가하여 호환성 확보

**문제 3: 수정 모달 스크롤 문제**
- 증상: 모달 높이가 화면 초과하여 하단 버튼 접근 불가
- 해결:
  - 모달에 `max-h-[90vh]` + `overflow-y-auto` 추가
  - 헤더를 `sticky top-0`로 고정
  - 버튼 영역을 `sticky bottom-0`으로 고정
  - 중간 콘텐츠만 스크롤

**문제 4: 면적(평) 소수점 입력 제한**
- 증상: 새 자산 추가에서 소수점 둘째자리 입력 시 "유효값을 입력하라" 오류
- 원인: `step: '0.1'`로 설정되어 소수점 첫째자리까지만 허용
- 해결: `step: '0.01'`로 변경, placeholder도 `'25.55'`로 업데이트

#### 배포 상태
- ✅ Frontend: Vercel 배포 완료
- ✅ Backend: Render 배포 완료
- ✅ Database: PostgreSQL 스키마 업데이트 완료

#### 커밋 이력
```
b60e4ca - fix: 면적(평) 입력 소수점 둘째자리까지 허용
0a4830d - fix: 수정 모달 스크롤 및 버튼 가시성 개선
7555fd5 - hotfix: 한글/영문 소분류 모두 지원하도록 수정
4534f72 - fix: 소분류 영문 코드 매칭 오류 수정으로 lawyer_fee, brokerage_fee 표시 문제 해결
88f8e6b - fix: save_asset INSERT 문에 lawyer_fee, brokerage_fee 컬럼 추가
```

#### 최종 결과
- ✅ 부동산 전용 필드: 3개 → 7개로 확장
- ✅ 새 자산 추가 시 법무사비용, 중개비 입력 가능
- ✅ 수정 모달에서도 완전 지원
- ✅ 포트폴리오 테이블에 정상 표시
- ✅ 면적(평) 소수점 둘째자리까지 입력 가능
- ✅ 수정 모달 스크롤 및 사용성 개선