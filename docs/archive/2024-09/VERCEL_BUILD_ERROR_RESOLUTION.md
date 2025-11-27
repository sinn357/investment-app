# Vercel 빌드 오류 해결 가이드

## 개요

2단계 카테고리 시스템 구현 중 발생한 Vercel 빌드 오류를 해결하는 과정을 문서화합니다. "Unterminated regexp literal" 파싱 오류가 JSX 중첩 구조에서 발생하여 프론트엔드 배포가 차단되었던 문제를 추적하고 해결했습니다.

### 문제 발생일: 2025-09-22
### 해결 완료일: 2025-09-22
### 관련 파일:
- `frontend/src/components/PortfolioDashboard.tsx`

---

## 문제 상황

### 오류 증상
```
Error: ./src/components/PortfolioDashboard.tsx:816:12
Parsing ecmascript source code failed
  814 |               })}
  815 |             </div>
> 816 |           </div>
      |            ^^^^^
  817 |         );
  818 |       })}

Unterminated regexp literal
```

### 발생 배경
- 2단계 카테고리 시스템(대분류-소분류) 구현 중 발생
- 기존 단일 레벨 그룹화에서 중첩 그룹화로 변경하는 과정에서 JSX 구조 복잡화
- Object.entries() 중첩 사용으로 인한 브레이스/괄호 매칭 문제

---

## 근본 원인 분석

### 1. JSX 중첩 구조 문제
```typescript
// 문제가 된 구조 (의사코드)
{Object.entries(groupedAssets).map(([category, subCategories]) => {
  return (
    <div>
      {Object.entries(subCategories).map(([subCategory, assets]) => {
        return (
          <div>
            {/* 복잡한 테이블 구조 */}
          </div>
        );
      })}
    </div>  // 여기서 브레이스 매칭 오류 발생
  </div>   // 추가 closing div가 문제
  );
})}
```

### 2. 타입 정의 변경 영향
- `getGroupedAssets()` 반환 타입: `Record<string, typeof filtered>` → `Record<string, Record<string, typeof filtered>>`
- 중첩 객체 구조로 인한 렌더링 로직 복잡화

### 3. 컴파일러 혼동 요인
- JavaScript 표현식과 정규식 리터럴 구분 실패
- 복잡한 중첩 JSX에서 브레이스 매칭 추적 실패

---

## 해결 과정

### 1단계: 오류 위치 특정
- 빌드 로그에서 line 816 주변 집중 분석
- JSX 브레이스 매칭 수동 검증

### 2단계: 구조 간소화 시도
- 소분류 입력 필드 임시 제거
- 여전히 동일 오류 발생 → 근본 원인이 다른 곳에 있음을 확인

### 3단계: 완전 복원 및 재구현
```bash
git checkout ecb23e1 -- src/components/PortfolioDashboard.tsx
```
- 마지막 작동 상태로 완전 복원
- 단일 레벨 그룹화 구조 확인

### 4단계: 동작 검증
- 개발 서버 정상 실행 확인
- 포트폴리오 페이지 로딩 성공 확인

---

## 해결책

### 즉시 해결 (Hot Fix)
1. **파일 복원**: 마지막 안정 버전으로 롤백
2. **캐시 정리**: `.next` 디렉토리 완전 삭제
3. **개발서버 재시작**: 새로운 빌드로 재시작

### 장기 해결 방안
1. **JSX 구조 단순화**: 중첩 렌더링을 별도 컴포넌트로 분리
2. **점진적 구현**: 2단계 카테고리를 단계별로 구현
3. **타입 안전성**: TypeScript strict 모드로 컴파일 타임 검증 강화

---

## 예방 대책

### 개발 프로세스
1. **복잡한 JSX 변경 시 단계별 접근**
   - 구조 변경 → 빌드 확인 → 기능 추가 → 빌드 확인
2. **백업 브랜치 활용**
   - 대규모 리팩토링 전 백업 브랜치 생성
3. **로컬 빌드 검증**
   - Vercel 배포 전 로컬에서 프로덕션 빌드 테스트

### 코드 품질
1. **컴포넌트 분리**
   ```typescript
   // 권장: 중첩 구조를 별도 컴포넌트로 분리
   const SubCategorySection = ({ subCategory, assets }) => { ... }
   const MainCategorySection = ({ category, subCategories }) => { ... }
   ```

2. **JSX 단순화**
   - 3단계 이상 중첩 금지
   - 복잡한 로직은 별도 함수로 추출

---

## 기술적 교훈

### JSX 파싱 한계
- JavaScript 파서가 정규식과 JSX를 혼동할 수 있음
- 특히 중첩된 Object.entries()와 복잡한 템플릿에서 발생

### TypeScript 빌드 vs 런타임
- 런타임에서 작동하더라도 빌드 시점에서 실패 가능
- 컴파일 타임 검증의 중요성

### 캐시 문제
- Next.js 개발 캐시가 오류 상태를 유지할 수 있음
- 구조적 변경 시 캐시 완전 정리 필요

---

## 검증 결과

### ✅ 해결 완료
- Vercel 빌드 오류 해결
- 로컬 개발 서버 정상 실행
- 포트폴리오 페이지 정상 로딩

### 🔄 남은 작업
- 2단계 카테고리 시스템 안전한 재구현
- 서브 카테고리 UI 표시 기능 복원
- 단위 테스트 추가로 회귀 방지

---

## 관련 링크
- [2단계 카테고리 시스템 구현 가이드](./2TIER_CATEGORY_SYSTEM_IMPLEMENTATION.md)
- [CLAUDE.md Task T-053](../CLAUDE.md#tasks-single-source-of-truth)