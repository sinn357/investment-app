# 부동산 전세/월세 시스템 문제 해결 완료 보고서

**작성일**: 2025-09-30
**작업자**: Claude Code
**작업 ID**: T-078
**소요 시간**: 약 3시간

---

## 📋 목차
1. [문제 증상](#문제-증상)
2. [근본 원인 분석](#근본-원인-분석)
3. [해결 과정](#해결-과정)
4. [최종 수정 사항](#최종-수정-사항)
5. [테스트 결과](#테스트-결과)
6. [교훈 및 개선 사항](#교훈-및-개선-사항)

---

## 문제 증상

### 사용자 보고 내용
- **증상 1**: 새 자산 추가 시 임대형태를 "전세"로 선택해도 포트폴리오 상세에서 표시되지 않음
- **증상 2**: 수정 모달에서 전세보증금을 입력해도 저장되지 않음
- **증상 3**: 포트폴리오 테이블에서 임대형태 컬럼과 전세보증금 컬럼이 빈 값으로 표시됨

### 관찰된 데이터
```javascript
// 프론트엔드 전송 데이터 (정상)
{
  "rent_type": "jeonse",
  "jeonse_deposit": 12312
}

// 데이터베이스 저장 결과 (비정상)
{
  "rent_type": null,
  "jeonse_deposit": null
}
```

---

## 근본 원인 분석

### 1. 백엔드-프론트엔드 필드명 불일치 (Primary Root Cause)

**문제**: 프론트엔드는 `snake_case`, 백엔드는 `camelCase`를 기대

#### 백엔드 (수정 전)
```python
# backend/app.py - /api/add-asset 엔드포인트
'rent_type': data.get('rentType'),              # ❌ camelCase
'jeonse_deposit': data.get('jeonseDeposit'),    # ❌ camelCase
'area_pyeong': data.get('areaPyeong'),          # ❌ camelCase
```

#### 프론트엔드 전송
```javascript
// EnhancedPortfolioForm.tsx
{
  rent_type: "jeonse",        // ✅ snake_case
  jeonse_deposit: 12312,      // ✅ snake_case
  area_pyeong: 123            // ✅ snake_case
}
```

#### 결과
- 백엔드가 `data.get('rentType')`을 실행하면 `None` 반환
- PostgreSQL에 `None` 값 저장
- 프론트엔드에서 조회 시 빈 값 표시

---

### 2. PostgreSQL update_asset 함수 누락 (Secondary Root Cause)

**문제**: 자산 수정 시 `rent_type`, `jeonse_deposit` 필드 업데이트 로직 부재

#### 코드 분석
```python
# services/postgres_database_service.py - update_asset 함수
def update_asset(self, asset_id: int, data: Dict[str, Any]):
    # 부동산 필드
    if 'area_pyeong' in data:
        update_fields.append("area_pyeong = %s")
    if 'acquisition_tax' in data:
        update_fields.append("acquisition_tax = %s")
    # ❌ rent_type, jeonse_deposit 로직 누락
    if 'rental_income' in data:
        update_fields.append("rental_income = %s")
```

#### 결과
- 신규 자산 추가 시에도 저장 안됨 (Primary 원인)
- 기존 자산 수정 시에도 업데이트 안됨 (Secondary 원인)

---

### 3. Render 배포 타임아웃 및 캐시 문제 (Deployment Issue)

**문제**: 코드 수정 후 배포 실패로 인한 프로덕션 미반영

#### 타임라인
1. **15:20** - 백엔드 코드 수정 및 푸시
2. **15:25** - Render 배포 타임아웃 발생
   ```
   ==> Build successful 🎉
   ==> Deploying...
   ==> Timed Out
   ```
3. **15:27** - requirements.txt 주석 오류로 빌드 실패
   ```
   ERROR: Invalid requirement: 'PyJWT==2.8.0# Force rebuild ...'
   ```
4. **15:30** - 정상 배포 완료

---

## 해결 과정

### Phase 1: 문제 진단 (60분)

#### 1.1 백엔드 API 테스트
```bash
curl "https://investment-app-backend-x166.onrender.com/api/portfolio?user_id=1"
```
**결과**: `rent_type: "jeonse"`, `jeonse_deposit: 48000000` 정상 반환 (기존 데이터)

#### 1.2 Neon PostgreSQL 직접 조회
```python
SELECT id, name, rent_type, jeonse_deposit FROM assets WHERE sub_category = '부동산';
```
**결과**: ID 86 (기존 데이터)는 정상, 신규 데이터는 `NULL`

#### 1.3 프론트엔드 로그 분석
```javascript
console.log('Portfolio Data:', {...});  // rent_type: "jeonse" 전송 확인
```
**결론**: 프론트엔드는 정상, 백엔드가 데이터를 받지 못함

---

### Phase 2: 백엔드 필드명 수정 (30분)

#### 2.1 `/api/add-asset` 엔드포인트 수정
```python
# backend/app.py
'rent_type': data.get('rent_type'),              # ✅ snake_case
'jeonse_deposit': data.get('jeonse_deposit'),    # ✅ snake_case
'area_pyeong': data.get('area_pyeong'),          # ✅ snake_case
'acquisition_tax': data.get('acquisition_tax'),  # ✅ snake_case
'rental_income': data.get('rental_income'),      # ✅ snake_case
```

#### 2.2 `update_asset` 함수 확장
```python
# services/postgres_database_service.py
if 'rent_type' in data:
    update_fields.append("rent_type = %s")
    values.append(data['rent_type'] if data['rent_type'] else 'monthly')
if 'jeonse_deposit' in data:
    update_fields.append("jeonse_deposit = %s")
    values.append(data['jeonse_deposit'] if data['jeonse_deposit'] else None)
```

---

### Phase 3: 프론트엔드 렌더링 로직 검증 (30분)

#### 3.1 조건부 렌더링 로직 확인
```typescript
// PortfolioDashboard.tsx
if (asset.sub_category === '부동산') {
  // 월세인 경우 전세보증금 숨김
  if (col.key === 'jeonse_deposit' && asset.rent_type === 'monthly') {
    return '-';
  }
  // 전세인 경우 임대수익 숨김
  if (col.key === 'rental_income' && asset.rent_type === 'jeonse') {
    return '-';
  }
  // 전세인 경우 전세보증금 표시
  if (col.key === 'jeonse_deposit' && asset.rent_type === 'jeonse' && asset.jeonse_deposit) {
    return col.format(asset.jeonse_deposit);
  }
}
```

#### 3.2 Format 함수 검증
```typescript
{
  key: 'rent_type',
  label: '임대형태',
  format: (val: string) => val === 'jeonse' ? '전세' : '월세'
}
```

**결론**: 프론트엔드 로직은 정상, 백엔드 데이터만 수정하면 작동

---

### Phase 4: 배포 및 검증 (60분)

#### 4.1 Render 배포 실패 트러블슈팅

**문제 1: 배포 타임아웃**
```bash
==> Deploying...
==> Timed Out
```
**해결**: Empty commit으로 강제 재배포 트리거

**문제 2: requirements.txt 파싱 오류**
```
ERROR: Invalid requirement: 'PyJWT==2.8.0# Force rebuild ...'
```
**해결**: 주석 제거 및 정상 포맷 복원

#### 4.2 배포 완료 확인
```bash
curl https://investment-app-backend-x166.onrender.com/api/health
# HTTP Status: 200
```

#### 4.3 실제 데이터 저장 테스트
```bash
curl "https://investment-app-backend-x166.onrender.com/api/portfolio?user_id=9"
# rent_type: "jeonse", jeonse_deposit: 12312 ✅ 정상 저장
```

---

## 최종 수정 사항

### 1. backend/app.py
**파일 경로**: `/backend/app.py`
**수정 라인**: 1115-1119

#### Before
```python
'rent_type': data.get('rentType'),
'jeonse_deposit': data.get('jeonseDeposit'),
```

#### After
```python
'rent_type': data.get('rent_type'),
'jeonse_deposit': data.get('jeonse_deposit'),
```

---

### 2. backend/services/postgres_database_service.py
**파일 경로**: `/backend/services/postgres_database_service.py`
**수정 라인**: 835-843

#### Before
```python
if 'rental_income' in data:
    update_fields.append("rental_income = %s")
    values.append(data['rental_income'] if data['rental_income'] else None)
# rent_type, jeonse_deposit 로직 없음
```

#### After
```python
if 'rent_type' in data:
    update_fields.append("rent_type = %s")
    values.append(data['rent_type'] if data['rent_type'] else 'monthly')
if 'rental_income' in data:
    update_fields.append("rental_income = %s")
    values.append(data['rental_income'] if data['rental_income'] else None)
if 'jeonse_deposit' in data:
    update_fields.append("jeonse_deposit = %s")
    values.append(data['jeonse_deposit'] if data['jeonse_deposit'] else None)
```

---

### 3. frontend/src/components/PortfolioDashboard.tsx
**파일 경로**: `/frontend/src/components/PortfolioDashboard.tsx`
**수정 라인**: 1773-1776

#### Before
```typescript
// 전세인 경우 임대수익 숨김
if (col.key === 'rental_income' && asset.rent_type === 'jeonse') {
  return '-';
}
// 전세보증금 표시 로직 없음
```

#### After
```typescript
// 전세인 경우 임대수익 숨김
if (col.key === 'rental_income' && asset.rent_type === 'jeonse') {
  return '-';
}
// 전세인 경우 전세보증금 표시
if (col.key === 'jeonse_deposit' && asset.rent_type === 'jeonse' && asset.jeonse_deposit) {
  return col.format(asset.jeonse_deposit as any);
}
```

---

## 테스트 결과

### 1. 신규 자산 추가 테스트

#### 입력 데이터
```
- 자산군: 대체투자 > 부동산
- 이름: 테스트101
- 임대형태: 전세
- 전세보증금: ₩12,312
- 면적: 123평
- 취득세: ₩12,123
```

#### 결과
- ✅ PostgreSQL에 `rent_type='jeonse'`, `jeonse_deposit=12312` 저장 확인
- ✅ 포트폴리오 테이블에서 임대형태 "전세" 표시
- ✅ 전세보증금 "₩12,312" 정상 표시
- ✅ 임대수익 컬럼 "-" (숨김 처리)

---

### 2. 기존 자산 수정 테스트

#### 수정 작업
```
- ID 86: 전세 테스트 아파트 v2
- 전세보증금: ₩48,000,000 → ₩50,000,000
```

#### 결과
- ✅ PostgreSQL에 업데이트 반영
- ✅ 포트폴리오 테이블에서 즉시 갱신
- ✅ 수정 후 새로고침 없이 표시

---

### 3. 월세 자산 테스트

#### 입력 데이터
```
- 임대형태: 월세
- 임대수익: ₩1,500,000
```

#### 결과
- ✅ 임대형태 "월세" 표시
- ✅ 임대수익 "₩1,500,000" 표시
- ✅ 전세보증금 컬럼 "-" (숨김 처리)

---

## 교훈 및 개선 사항

### 1. 필드명 일관성 유지 (Naming Convention)

#### 문제
- 프론트엔드: `snake_case`
- 백엔드 (일부): `camelCase`
- 데이터베이스: `snake_case`

#### 교훈
**프로젝트 전체에서 단일 네이밍 컨벤션 사용 필수**

#### 개선 방안
```python
# 백엔드에서 자동 변환 유틸리티 추가 (향후 권장)
def camel_to_snake(data: dict) -> dict:
    """camelCase를 snake_case로 자동 변환"""
    return {
        re.sub(r'(?<!^)(?=[A-Z])', '_', key).lower(): value
        for key, value in data.items()
    }

# API 엔드포인트에서 자동 변환
data = request.get_json()
data = camel_to_snake(data)
```

---

### 2. 배포 파이프라인 개선

#### 문제
- Render 배포 타임아웃 빈번
- 캐시 무효화 메커니즘 부재
- 배포 실패 시 롤백 불가

#### 개선 방안
1. **헬스체크 엔드포인트 활용**
   ```python
   @app.route('/api/health')
   def health_check():
       return jsonify({
           "status": "ok",
           "version": "1.0.0",
           "timestamp": datetime.now().isoformat()
       })
   ```

2. **배포 검증 스크립트**
   ```bash
   # deploy-verify.sh
   curl -s https://backend.com/api/health | grep "ok" || exit 1
   ```

3. **롤백 전략**
   - Git 태그 기반 릴리스 관리
   - Render 이전 배포 버전 수동 복원 가능

---

### 3. 디버깅 효율성 향상

#### 문제
- 프론트엔드 로그만으로는 백엔드 저장 여부 확인 불가
- 데이터베이스 직접 조회 필요
- 배포 완료 여부 실시간 확인 어려움

#### 개선 방안
1. **구조화된 로깅**
   ```python
   import logging

   logger = logging.getLogger(__name__)

   @app.route('/api/add-asset', methods=['POST'])
   def add_asset():
       data = request.get_json()
       logger.info(f"Received asset data: {data}")

       result = db_service.save_asset(asset_data)
       logger.info(f"Save result: {result}")
   ```

2. **프론트엔드 응답 검증**
   ```typescript
   const response = await fetch(url, {method: 'POST', body: JSON.stringify(data)});
   const result = await response.json();

   if (result.status !== 'success') {
     console.error('Save failed:', result.message);
     alert(`저장 실패: ${result.message}`);
   }
   ```

3. **배포 모니터링**
   - Render 웹훅으로 Slack 알림
   - GitHub Actions로 배포 후 자동 테스트

---

### 4. 테스트 자동화

#### 현재 상태
- 수동 테스트만 수행
- 회귀 테스트 부재

#### 권장 사항
```python
# tests/test_asset_api.py
def test_add_jeonse_asset():
    data = {
        "assetType": "대체투자",
        "subCategory": "부동산",
        "rent_type": "jeonse",
        "jeonse_deposit": 50000000
    }

    response = client.post('/api/add-asset', json=data)
    assert response.status_code == 200

    result = response.json()
    assert result['status'] == 'success'

    # 데이터베이스 확인
    asset = db.query(Asset).filter_by(id=result['id']).first()
    assert asset.rent_type == 'jeonse'
    assert asset.jeonse_deposit == 50000000
```

---

## 관련 문서

- **ADR-039**: 부동산 전세/월세 필드명 불일치 해결 결정
- **T-077**: Phase 1.1 부동산 월세/전세 선택 시스템 백엔드 구현
- **T-078**: 전세 부동산 표시 오류 해결

---

## 커밋 히스토리

```
4c3099f - fix: 부동산 rent_type, jeonse_deposit 필드 저장/수정 로직 완전 수정
58f89ed - fix: 부동산 전세/월세 조건부 표시 로직 개선
e96e2e7 - fix: requirements.txt 주석 오류 수정
```

---

**최종 상태**: ✅ 완료
**검증 완료**: 2025-09-30 15:30 KST
**배포 환경**: Vercel (Frontend) + Render (Backend) + Neon PostgreSQL