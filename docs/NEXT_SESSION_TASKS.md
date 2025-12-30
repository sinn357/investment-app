# 다음 세션 작업 목록

> **작성일**: 2025-12-30
> **우선순위**: 높음(🔴) / 중간(🟡) / 낮음(🟢)
> **예상 시간**: 총 3-4시간

---

## 🔴 최우선 순위 (즉시 해결 필요)

### 1. 투자철학 페이지 로딩 성능 문제 ⚠️

**현상**:
- 페이지 로딩 시간: **몇십 초** (심각한 성능 문제)
- 사용자 경험 매우 나쁨

**원인 추정**:
- 무거운 컴포넌트 또는 이미지
- 동기적 데이터 로딩
- 불필요한 렌더링
- 대용량 라이브러리 로드

**해결 방안**:
1. React DevTools Profiler로 병목 지점 파악
2. Dynamic imports 적용 (무거운 컴포넌트)
3. Lazy loading 이미지/컴포넌트
4. Suspense 경계 추가
5. 번들 분석 (webpack-bundle-analyzer)

**예상 시간**: 1-2시간

**파일 위치**: `frontend/src/app/philosophy/page.tsx`

**우선순위**: 🔴🔴🔴 **최고 우선순위**

---

## 🟡 높은 우선순위 (버그 수정)

### 2. 포트폴리오 요약 카드 폰트 크기 문제

**현상**:
- **총자산**, **총투자원금** 박스: 폰트가 너무 커서 박스 밖으로 삐져나옴
- 끝자리 일부가 안 보임
- 나머지 3개 박스 (투자현금, 총 손익, 수익률): 정상

**원인**:
- 총자산/총투자원금 카드의 폰트 크기가 다른 카드와 다름
- 반응형 폰트 크기 설정 오류

**해결 방안**:
1. 5개 요약 카드의 폰트 크기 통일
2. 반응형 폰트 크기 적용 (text-2xl → text-xl)
3. 박스 크기 조정 또는 패딩 조정
4. 숫자가 길어질 경우 자동 축소 (clamp)

**예상 시간**: 30분

**파일 위치**: `frontend/src/components/PortfolioDashboard.tsx` (요약 카드 섹션)

**우선순위**: 🟡🟡

---

### 3. 자산구성분석 "전체" 탭 데이터 미표시 문제

**현상**:
- **전체 탭**: 데이터가 아예 보이지 않음
  - 구성비중 도넛 차트: **완전히 안 보임**
  - 투자원금 막대 차트: **그래프틀만 보이고 바 형식 데이터 없음**
- **다른 탭** (대체투자, 예치자산, 즉시현금, 투자자산): 정상 작동

**원인 추정**:
- "전체" 탭의 데이터 집계 로직 오류
- 차트 데이터 변환 함수 버그
- 빈 배열 또는 null 데이터 전달
- 조건부 렌더링 문제

**해결 방안**:
1. "전체" 탭 선택 시 데이터 집계 로직 확인
2. `pieChartData`, `barChartData` 계산 함수 디버깅
3. 콘솔 로그로 데이터 흐름 추적
4. 차트 컴포넌트에 전달되는 데이터 확인
5. 조건부 렌더링 조건 수정

**예상 시간**: 1시간

**파일 위치**: `frontend/src/components/PortfolioDashboard.tsx` (차트 데이터 로직)

**우선순위**: 🟡🟡

---

## 🟢 중간 우선순위 (UX 개선)

### 4. 각 페이지 헤더 제거 및 재구성

**현상**:
- **포트폴리오/가계부 페이지 헤더**:
  - 페이지 제목만 표시 (번잡함)
  - 계정설정/로그아웃 버튼 중복 (메인 네비게이션에 이미 있음)
  - 엑셀 추출 버튼만 필요한 기능

**개선 방안**:
1. **포트폴리오 페이지**:
   - 헤더 완전 제거
   - 엑셀 추출 버튼을 테이블 상단 우측으로 이동
   - 제목은 페이지 상단에 간단히 표시 (선택적)

2. **가계부 페이지**:
   - 헤더 완전 제거
   - 엑셀 추출 버튼을 테이블 상단 우측으로 이동
   - 제목은 페이지 상단에 간단히 표시 (선택적)

**예상 시간**: 30분

**파일 위치**:
- `frontend/src/components/PortfolioDashboard.tsx`
- `frontend/src/components/ExpenseManagementDashboard.tsx`

**우선순위**: 🟢🟢

---

### 5. 엑셀 추출 기능 개선

**현상**:
- 현재 엑셀 추출 기능이 있지만 데이터가 잘 정리되지 않음
- 포맷이 깔끔하지 않음

**개선 방안**:
1. **포트폴리오 엑셀**:
   - 헤더 행 추가 (자산명, 대분류, 소분류, 수량, 평균가, 원금, 평가액, 수익률 등)
   - 숫자 포맷 (천단위 쉼표, 소수점 2자리)
   - 대분류별 소계 행 추가
   - 전체 합계 행 추가
   - 색상 구분 (헤더: 골드, 소계: 에메랄드)

2. **가계부 엑셀**:
   - 헤더 행 추가 (날짜, 거래유형, 금액, 카테고리, 세부내역 등)
   - 숫자 포맷 (천단위 쉼표)
   - 카테고리별 소계 행 추가
   - 수입/지출 합계 행 추가
   - 색상 구분 (수입: 에메랄드, 지출: 레드)

**예상 시간**: 1시간

**파일 위치**:
- `frontend/src/components/PortfolioDashboard.tsx` (엑셀 추출 로직)
- `frontend/src/components/ExpenseManagementDashboard.tsx` (엑셀 추출 로직)

**우선순위**: 🟢🟢

---

### 6. 가계부 색상 시스템 변경 (지출 레드 컬러)

**현상**:
- **수입**: 에메랄드 색상 (✅ 좋음, 긍정적)
- **지출**: 황금 색상 (❌ 문제, 긍정적인 느낌이라 직관적이지 않음)

**개선 방안**:
- **지출 관련 모든 색상을 레드 컬러로 변경**:
  - 지출 카드
  - 지출 차트 (도넛, 막대)
  - 지출 게이지
  - 지출 테이블 행
  - 지출 배지

**색상 시스템**:
- **수입**: 에메랄드 계열 유지 (#50C878, #3CB371)
- **지출**: 레드 계열로 변경 (#EF4444, #DC2626, #B91C1C)

**예상 시간**: 30분

**파일 위치**:
- `frontend/src/components/ExpenseManagementDashboard.tsx`
- `frontend/src/components/ExpenseGoalGauge.tsx`
- `frontend/src/components/IncomeGoalGauge.tsx`

**우선순위**: 🟢🟢

---

## 📋 작업 순서 (권장)

### 1단계: 버그 수정 (2-3시간)
1. 🔴 **투자철학 페이지 로딩 성능 문제** (최우선)
2. 🟡 **포트폴리오 요약 카드 폰트 크기 문제**
3. 🟡 **자산구성분석 "전체" 탭 데이터 미표시 문제**

### 2단계: UX 개선 (1-2시간)
4. 🟢 **각 페이지 헤더 제거 및 재구성**
5. 🟢 **엑셀 추출 기능 개선**
6. 🟢 **가계부 색상 시스템 변경**

---

## 🎯 세션 시작 방법

### 옵션 1: 최우선 작업부터
```
"투자철학 페이지 로딩 성능 문제를 해결해줘.
NEXT_SESSION_TASKS.md를 읽고 시작해."
```

### 옵션 2: 전체 작업 진행
```
"NEXT_SESSION_TASKS.md에 있는 작업들을 순서대로 진행해줘.
1번 투자철학 페이지부터 시작하자."
```

### 옵션 3: 특정 작업 지정
```
"포트폴리오 요약 카드 폰트 크기 문제를 먼저 해결해줘."
```

---

## 📂 주요 파일 위치

### 투자철학 페이지
- `frontend/src/app/philosophy/page.tsx`

### 포트폴리오 페이지
- `frontend/src/components/PortfolioDashboard.tsx`
- `frontend/src/components/EnhancedPortfolioForm.tsx`

### 가계부 페이지
- `frontend/src/components/ExpenseManagementDashboard.tsx`
- `frontend/src/components/ExpenseGoalGauge.tsx`
- `frontend/src/components/IncomeGoalGauge.tsx`

### 차트 컴포넌트
- `frontend/src/components/charts/OraclePieChart.tsx`
- `frontend/src/components/charts/OracleBarChart.tsx`
- `frontend/src/components/charts/OracleLineChart.tsx`

---

## 🔍 디버깅 가이드

### 투자철학 페이지 성능 문제
1. React DevTools Profiler 사용
2. Chrome DevTools Performance 탭
3. Network 탭에서 느린 요청 확인
4. Lighthouse 점수 측정

### 자산구성분석 "전체" 탭 문제
1. 콘솔 로그로 데이터 확인:
   ```typescript
   console.log('pieChartData:', pieChartData);
   console.log('barChartData:', barChartData);
   ```
2. "전체" 탭과 다른 탭의 데이터 비교
3. 차트 컴포넌트에 전달되는 props 확인

---

## 📊 예상 작업 시간

| 작업 | 시간 | 우선순위 |
|------|------|----------|
| 투자철학 로딩 성능 | 1-2h | 🔴🔴🔴 |
| 포트폴리오 폰트 크기 | 30m | 🟡🟡 |
| 자산구성분석 전체 탭 | 1h | 🟡🟡 |
| 페이지 헤더 제거 | 30m | 🟢🟢 |
| 엑셀 추출 개선 | 1h | 🟢🟢 |
| 가계부 색상 변경 | 30m | 🟢🟢 |
| **합계** | **3.5-5h** | |

---

## ✅ 완료 체크리스트 (다음 세션 종료 시)

작업 완료 후 체크:
- [ ] 투자철학 페이지 로딩 시간 < 3초
- [ ] 포트폴리오 요약 카드 폰트 크기 정상
- [ ] 자산구성분석 "전체" 탭 데이터 정상 표시
- [ ] 포트폴리오/가계부 헤더 제거 완료
- [ ] 엑셀 추출 기능 개선 완료
- [ ] 가계부 지출 색상 레드로 변경
- [ ] TypeScript 빌드 0 오류
- [ ] ESLint 0 경고
- [ ] 모든 변경사항 커밋 및 푸시

---

## 📝 참고 문서

- **이번 세션 완료 문서**: `docs/SESSION_2025-12-30_FINAL_COMPLETE.md`
- **프로젝트 컨텍스트**: `CLAUDE.md`
- **Oracle 2025 디자인 가이드**: `docs/ORACLE_2025_DESIGN_UPGRADE.md`
- **성능 최적화 문서**: `docs/SESSION_2025-12-30_PERFORMANCE_OPTIMIZATION.md`

---

**문서 버전**: 1.0
**최종 업데이트**: 2025-12-30
**작성자**: Claude Code

**준비 완료! 다음 세션에서 계속 진행하세요.** 🚀
