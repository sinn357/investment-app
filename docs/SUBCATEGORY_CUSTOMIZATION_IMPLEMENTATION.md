# 소분류별 맞춤 포트폴리오 항목 시스템 구현 진행상황

> 날짜: 2025-09-24
> 상태: 진행 중 (80% 완료)
> 작업자: Claude + 사용자

---

## 1) 개요

**사용자 요청**:
- 소분류별로 적합한 입력 항목 설계
- 부동산: 면적(평수), 취득세, 임대수익(월세)
- 예금/적금: 만기일, 연이율, 중도해지수수료
- MMF/CMA: 현재수익률, 연환산수익률, 최소유지잔고, 출금수수료
- 주식/ETF: 배당율만 추가
- 펀드: 기준가격, 운용보수
- 현금/통장: 연이율
- 소분류 컬럼 제거 (탭으로 구분되므로)
- 평가금액을 원금보다 앞에 배치
- 등록일을 아이콘+툴팁으로 표시

**구현 목표**: 각 소분류의 특성에 맞는 맞춤형 포트폴리오 테이블 구현

---

## 2) 완료된 작업

### ✅ Backend 구현 (100% 완료)

#### 1. PostgreSQL 스키마 확장
```sql
-- 소분류별 전용 필드 추가
ALTER TABLE assets ADD COLUMN IF NOT EXISTS area_pyeong NUMERIC; -- 부동산: 면적(평수)
ALTER TABLE assets ADD COLUMN IF NOT EXISTS acquisition_tax NUMERIC; -- 부동산: 취득세
ALTER TABLE assets ADD COLUMN IF NOT EXISTS rental_income NUMERIC; -- 부동산: 임대수익(월세)
ALTER TABLE assets ADD COLUMN IF NOT EXISTS maturity_date DATE; -- 예금/적금: 만기일
ALTER TABLE assets ADD COLUMN IF NOT EXISTS interest_rate NUMERIC; -- 예금/적금: 연이율
ALTER TABLE assets ADD COLUMN IF NOT EXISTS early_withdrawal_fee NUMERIC; -- 예금/적금: 중도해지수수료
ALTER TABLE assets ADD COLUMN IF NOT EXISTS current_yield NUMERIC; -- MMF/CMA: 현재수익률
ALTER TABLE assets ADD COLUMN IF NOT EXISTS annual_yield NUMERIC; -- MMF/CMA: 연환산수익률
ALTER TABLE assets ADD COLUMN IF NOT EXISTS minimum_balance NUMERIC; -- MMF/CMA: 최소유지잔고
ALTER TABLE assets ADD COLUMN IF NOT EXISTS withdrawal_fee NUMERIC; -- MMF/CMA: 출금수수료
ALTER TABLE assets ADD COLUMN IF NOT EXISTS dividend_rate NUMERIC; -- 주식/ETF: 배당율
ALTER TABLE assets ADD COLUMN IF NOT EXISTS nav NUMERIC; -- 펀드: 기준가격
ALTER TABLE assets ADD COLUMN IF NOT EXISTS management_fee NUMERIC; -- 펀드: 운용보수
```

#### 2. save_asset 메서드 확장
- 새로운 필드들을 INSERT 문에 추가
- 13개 새로운 필드 모두 지원

#### 3. get_all_assets 메서드 확장
- SELECT 문에 새로운 필드들 추가
- 모든 소분류별 전용 필드 조회 지원

#### 4. update_asset 메서드 확장
- 새로운 필드들에 대한 업데이트 로직 추가
- 각 필드별 null 처리 및 검증

### ✅ Frontend 구현 (90% 완료)

#### 1. TypeScript 인터페이스 확장
```typescript
interface Asset {
  // 기존 필드들...

  // 부동산 전용 필드
  area_pyeong?: number;
  acquisition_tax?: number;
  rental_income?: number;

  // 예금/적금 전용 필드
  maturity_date?: string;
  interest_rate?: number;
  early_withdrawal_fee?: number;

  // MMF/CMA 전용 필드
  current_yield?: number;
  annual_yield?: number;
  minimum_balance?: number;
  withdrawal_fee?: number;

  // 주식/ETF 전용 필드
  dividend_rate?: number;

  // 펀드 전용 필드
  nav?: number;
  management_fee?: number;
}
```

#### 2. 소분류별 헬퍼 함수들 구현
```typescript
// 소분류별 맞춤 컬럼 정의
const getSubCategoryColumns = (subCategory: string | null) => { ... }

// 소분류별로 수량×평균가 표시 여부 결정
const shouldShowQuantityPrice = (subCategory: string | null) => { ... }

// 날짜 컬럼 라벨 결정 (개설일자 vs 매수일자)
const getDateLabel = (subCategory: string | null) => { ... }
```

#### 3. 동적 테이블 헤더 구현
- 소분류에 따른 조건부 헤더 표시
- 수량×평균가는 투자자산만 표시
- 평가금액을 원금보다 앞에 배치

#### 4. 동적 테이블 바디 구현
- 등록일 아이콘+툴팁 추가
- 소분류별 맞춤 컬럼 동적 렌더링
- 투자자산 외에는 수량×평균가 숨김

---

## 3) 진행 중인 작업

### 🔄 현재 작업 상황
- 백엔드 스키마 및 API: ✅ 완료
- 프론트엔드 UI 구조: ✅ 완료
- **테스트 및 검증**: 🚧 진행 중

### 🔄 마지막 작업 내용
- 프론트엔드에서 새로운 테이블 구조 구현 완료
- curl 명령어로 부동산 자산 추가 테스트 시도 중
- 서버 재시작으로 새 스키마 적용 완료

---

## 4) 남은 작업

### 🔲 즉시 해야 할 작업
1. **API 테스트**: 새로운 필드들이 포함된 자산 추가/수정 테스트
2. **프론트엔드 연동 확인**: 소분류별 맞춤 필드들이 올바르게 표시되는지 확인
3. **입력 폼 업데이트**: 자산 추가/수정 폼에서 소분류별 필드 입력 지원
4. **데이터 검증**: 각 소분류별 필드 값이 정상적으로 저장/조회되는지 확인

### 🔲 추가 개선사항
1. EditFormData 인터페이스에 새 필드들 추가 (완료)
2. 자산 추가/수정 폼에서 소분류별 동적 필드 표시
3. 필드별 유효성 검증 로직 추가
4. GitHub/Render 배포

---

## 5) 기술적 세부사항

### 소분류별 필드 매핑
```javascript
부동산: area_pyeong, acquisition_tax, rental_income
예금/적금: maturity_date, interest_rate, early_withdrawal_fee
MMF/CMA: current_yield, annual_yield, minimum_balance, withdrawal_fee
주식/ETF: dividend_rate
펀드: nav, management_fee
현금/통장: interest_rate
```

### 수량×평균가 표시 조건
```javascript
// 표시: 국내주식, 해외주식, ETF, 펀드, 암호화폐, 원자재
// 숨김: 현금, 입출금통장, 증권예수금, 예금, 적금, MMF, CMA, 부동산
```

### 날짜 라벨 변경
```javascript
// 개설일자: 예금, 적금, MMF, CMA, 현금, 입출금통장, 증권예수금, 부동산
// 매수일자: 국내주식, 해외주식, ETF, 펀드, 암호화폐, 원자재
```

---

## 6) 재개 방법

다음 세션에서 **"소분류별 맞춤 항목 시스템 구현 재개"**라고 말하면:

1. 부동산 자산 추가 API 테스트부터 시작
2. 프론트엔드에서 새 필드들이 올바르게 표시되는지 확인
3. 자산 추가/수정 폼에 소분류별 동적 필드 추가
4. 전체 시스템 테스트 및 배포

### 테스트용 API 호출 예시
```bash
# 부동산 자산 추가 테스트
curl -X POST "http://localhost:5001/api/add-asset" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "1",
    "assetType": "대체투자",
    "subCategory": "부동산",
    "name": "테스트아파트",
    "evaluationAmount": 500000000,
    "area_pyeong": 25.5,
    "acquisition_tax": 15000000,
    "rental_income": 2000000,
    "date": "2024-01-15",
    "note": "소분류 테스트"
  }'
```

---

## 7) 핵심 변경사항 요약

- ✅ PostgreSQL 스키마: 13개 새 컬럼 추가
- ✅ 백엔드 API: save/get/update 모든 메서드에 새 필드 지원
- ✅ 프론트엔드 인터페이스: Asset, EditFormData 확장
- ✅ 동적 테이블: 소분류별 조건부 컬럼 렌더링
- ✅ UI 개선: 등록일 툴팁, 평가금액 우선 배치
- 🔲 폼 업데이트: 자산 추가/수정 시 새 필드 입력 지원 (남은 작업)