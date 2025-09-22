# 2단계 카테고리 시스템 구현 가이드

## 개요

포트폴리오 자산 관리를 위한 대분류-소분류 2단계 카테고리 시스템 구현 가이드입니다. 기존 단일 자산군 분류에서 세분화된 2단계 구조로 개선하여 더 체계적인 자산 관리를 가능하게 합니다.

### 구현 일자: 2025-09-22
### 관련 파일:
- `backend/app.py` (API 엔드포인트)
- `backend/services/postgres_database_service.py` (데이터베이스 서비스)
- `frontend/src/components/PortfolioDashboard.tsx` (UI 컴포넌트)

---

## 시스템 구조

### 카테고리 분류 체계

**대분류 (유동성 기준):**
- **즉시현금**: 즉시 사용 가능한 현금성 자산
- **예치자산**: 예금, 적금 등 안전한 예치 자산
- **투자자산**: 주식, 펀드, ETF, 채권 등 투자 상품
- **대체투자**: 부동산, 암호화폐, 원자재 등 대체 투자

**소분류 (상품 유형별):**
- 즉시현금: 현금, 입출금통장, 증권예수금
- 예치자산: 예금, 적금, MMF
- 투자자산: 국내주식, 해외주식, 펀드, ETF, 채권
- 대체투자: 암호화폐, 부동산, 원자재

---

## 백엔드 구현

### 1. 데이터베이스 스키마

PostgreSQL `assets` 테이블에 `sub_category` 컬럼 추가:

```sql
ALTER TABLE assets ADD COLUMN IF NOT EXISTS sub_category VARCHAR(50);
```

### 2. API 엔드포인트 수정

#### 자산 추가 API (`/api/add-asset`)
```python
# backend/app.py
asset_data = {
    'asset_type': data.get('assetType'),
    'sub_category': data.get('subCategory'),  # 추가
    'name': data.get('name'),
    # ... 기타 필드
}
```

#### 자산 수정 API (`/api/update-asset/<id>`)
```python
# 프론트엔드에서 sub_category 전송 지원
body: JSON.stringify({
    asset_type: editForm.asset_type,
    sub_category: editForm.sub_category,  // 추가
    // ... 기타 필드
})
```

### 3. 데이터베이스 서비스 수정

#### 조회 시 sub_category 포함
```python
# backend/services/postgres_database_service.py
asset = {
    "id": row['id'],
    "asset_type": row['asset_type'],
    "sub_category": row['sub_category'],  # 추가
    "name": row['name'],
    # ... 기타 필드
}
```

---

## 프론트엔드 구현

### 1. TypeScript 인터페이스 확장

```typescript
// frontend/src/components/PortfolioDashboard.tsx
interface Asset {
  id: number;
  asset_type: string;
  sub_category: string;  // 추가
  name: string;
  // ... 기타 필드
}
```

### 2. 2단계 그룹화 로직

```typescript
const getGroupedAssets = () => {
  const filtered = getFilteredAssets();
  const grouped: Record<string, Record<string, typeof filtered>> = {};

  filtered.forEach(asset => {
    const mainCategory = asset.asset_type;
    const subCategory = asset.sub_category || '기타';

    if (!grouped[mainCategory]) {
      grouped[mainCategory] = {};
    }
    if (!grouped[mainCategory][subCategory]) {
      grouped[mainCategory][subCategory] = [];
    }
    grouped[mainCategory][subCategory].push(asset);
  });

  return grouped;
};
```

### 3. 중첩 테이블 UI 구조

```jsx
{/* 대분류별 반복 */}
{Object.entries(groupedAssets).map(([category, subCategories]) => {
  return (
    <div key={category}>
      {/* 대분류 헤더 (파란색) */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600">
        <h3>{category}</h3>
      </div>

      {/* 소분류별 반복 */}
      {Object.entries(subCategories).map(([subCategory, assets]) => (
        <div key={subCategory}>
          {/* 소분류 헤더 (회색) */}
          <div className="bg-gray-50 dark:bg-gray-700">
            <h4>{subCategory}</h4>
          </div>

          {/* 자산 테이블 */}
          <table>
            {assets.map(asset => (
              <tr key={asset.id}>
                <td>{asset.name}</td>
                {/* ... 기타 컬럼들 */}
              </tr>
            ))}
          </table>
        </div>
      ))}
    </div>
  );
})}
```

### 4. 수정 모달에 소분류 필드 추가

```jsx
{/* 소분류 입력 필드 */}
<div>
  <label>소분류</label>
  <input
    type="text"
    value={editForm.sub_category || ''}
    onChange={(e) => setEditForm({...editForm, sub_category: e.target.value})}
    placeholder="소분류 입력 (선택사항)"
  />
</div>
```

---

## 구현 결과

### ✅ 완성된 기능

1. **데이터 처리**
   - 백엔드에서 `subCategory` → `sub_category` 매핑 처리
   - PostgreSQL에 소분류 정보 저장/조회
   - API 응답에 sub_category 필드 포함

2. **UI 개선**
   - 대분류-소분류 2단계 중첩 테이블 구조
   - 시각적 계층 구분 (대분류: 파란 헤더, 소분류: 회색 헤더)
   - 각 헤더에 자산 개수 및 총액 표시

3. **CRUD 지원**
   - 자산 추가 시 소분류 선택 가능
   - 자산 수정 시 소분류 편집 가능
   - 모든 기존 자산에 적절한 소분류 할당 완료

### 📊 테스트 데이터

기존 자산들에 다음과 같이 소분류를 할당하여 테스트 완료:

- **투자자산**
  - 국내주식: 삼성전자, 네이버, 카카오, LG전자
  - ETF: KODEX 200
  - 펀드: 삼성 주식투자신탁
  - 채권: 국고채 10년

- **대체투자**
  - 암호화폐: 비트코인, 솔라나, 이더리움
  - 부동산: 역삼동 오피스텔
  - 원자재: KODEX 골드선물

- **예치자산**
  - MMF: 국민KB 스타 MMF

- **즉시현금**
  - 현금: 지갑현금, 테스트 현금

---

## 주의사항

### 하위 호환성
- 기존 자산들의 `sub_category`가 null인 경우 "기타"로 자동 처리
- 기존 API 호출 시 소분류 없이도 정상 작동

### 데이터 무결성
- 소분류는 선택사항이므로 null 값 허용
- 대분류는 여전히 필수 필드로 유지

### 확장성
- 새로운 대분류/소분류 추가 시 코드 수정 최소화
- 자동 그룹 생성으로 동적 확장 가능

---

## 배포 및 검증

### Git 커밋 정보
```
commit c2e235c
fix: Complete 2-tier category system with sub_category data transfer

- Fix backend API to map subCategory to sub_category in add-asset endpoint
- Add sub_category field to Asset interface in frontend
- Include sub_category in portfolio API response from PostgreSQL
- Display sub_category under asset name in portfolio table
- Add sub_category input field to edit modal
- Enable sub_category updates through update-asset API
```

### 배포 상태
- ✅ GitHub 저장소 푸시 완료
- ✅ Render 백엔드 자동 배포 완료
- ✅ 프론트엔드 개발 서버 실행 중 (localhost:3001)

### 테스트 확인
- ✅ 소분류 데이터 저장/조회 정상
- ✅ 2단계 그룹화 테이블 정상 렌더링
- ✅ CRUD 모든 작업에서 소분류 지원 확인