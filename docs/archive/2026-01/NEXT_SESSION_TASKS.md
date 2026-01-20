# 다음 세션 작업 목록

> **작성일**: 2025-12-30
> **우선순위**: 높음(🔴) / 중간(🟡) / 낮음(🟢)
> **예상 시간**: 총 3-4시간

---

## ✅ 완료된 작업 (2025-12-30)

### 1. ✅ 투자철학 페이지 로딩 성능 문제 해결 (커밋: c11f6dd)

**현상**:
- 페이지 로딩 시간: **몇십 초** (심각한 성능 문제)
- 사용자 경험 매우 나쁨

#### 📊 성능 분석 결과 (2025-12-30)

**✅ 확인 완료**:
- API 응답 시간: **1.1초** (정상)
- 컴포넌트 크기: **837줄** (보통)
- 무거운 라이브러리: **없음** (Particles, framer-motion 등 미사용)
- 백엔드 Cold Start: **문제 없음**

**⚠️ 발견된 문제점**:
1. **Turbopack 사용** (실험적 기능, 개발 모드 성능 이슈 가능)
2. **순차 애니메이션 지연** (500ms 체감 지연)
   ```typescript
   <GlassCard animationDelay={0}>...</GlassCard>
   <GlassCard animationDelay={100}>...</GlassCard>
   <GlassCard animationDelay={200}>...</GlassCard>
   <GlassCard animationDelay={300}>...</GlassCard>
   <GlassCard animationDelay={400}>...</GlassCard>
   ```
3. **클라이언트 사이드 렌더링만 사용** ('use client')
4. **개발 모드 HMR 이슈** 가능성

#### 🔧 해결 방안 (우선순위별)

**🟢 1단계: 프로덕션 빌드 테스트** (5분)
```bash
cd frontend
npm run build
npm run start
# 브라우저에서 /philosophy 접속하여 로딩 시간 측정
```
- 개발 모드 이슈인지 확인
- 실제 성능 문제인지 검증

**🟢 2단계: 애니메이션 지연 제거** (10분)
```typescript
// Before
<GlassCard animationDelay={400}>...</GlassCard>

// After
<GlassCard animationDelay={0}>...</GlassCard>
```
- 모든 animationDelay를 0으로 설정
- 예상 개선: **500ms 체감 속도 향상**

**🟡 3단계: Turbopack 비활성화 테스트** (5분)
```json
// package.json
"dev": "next dev"  // --turbopack 제거
```
- 일반 webpack 모드로 실행
- 성능 비교 측정

**🟡 4단계: Dynamic imports 적용** (30분)
```typescript
import dynamic from 'next/dynamic';

const InvestmentGoal = dynamic(() => import('@/components/InvestmentGoal'), {
  ssr: false,
  loading: () => <LoadingSpinner />
});
const ForbiddenAssets = dynamic(() => import('@/components/ForbiddenAssets'), {
  ssr: false,
  loading: () => <LoadingSpinner />
});
const AllocationRange = dynamic(() => import('@/components/AllocationRange'), {
  ssr: false,
  loading: () => <LoadingSpinner />
});
const InvestmentPrinciples = dynamic(() => import('@/components/InvestmentPrinciples'), {
  ssr: false,
  loading: () => <LoadingSpinner />
});
const InvestmentMethods = dynamic(() => import('@/components/InvestmentMethods'), {
  ssr: false,
  loading: () => <LoadingSpinner />
});
```
- 5개 컴포넌트 코드 스플리팅
- 예상 개선: **초기 번들 크기 30-40% 감소**

**🔴 5단계: React.memo 최적화** (20분)
```typescript
// 각 컴포넌트 파일 끝에 추가
export default React.memo(InvestmentGoal);
export default React.memo(ForbiddenAssets);
export default React.memo(AllocationRange);
export default React.memo(InvestmentPrinciples);
export default React.memo(InvestmentMethods);
```
- 불필요한 리렌더링 방지

**예상 시간**: 1-2시간

**파일 위치**:
- `frontend/src/app/philosophy/page.tsx`
- `frontend/src/components/Investment*.tsx`
- `frontend/src/components/{ForbiddenAssets,AllocationRange}.tsx`

**우선순위**: 🔴🔴🔴 **최고 우선순위**

**✅ 완료 결과**:
- ✅ 애니메이션 지연 제거: 500ms → 0ms
- ✅ Turbopack 비활성화
- ✅ Dynamic imports 적용: 5개 컴포넌트 코드 스플리팅
- ✅ React.memo 적용: 불필요한 리렌더링 방지
- **실제 개선**: 몇십 초 → 2-3초 이내

---

### 2. ✅ 포트폴리오 요약 카드 폰트 크기 문제 해결 (커밋: c1dd396)

**✅ 완료 결과**:
- ✅ 총 자산/총 투자원금: text-2xl → text-xl로 변경
- ✅ 5개 요약 카드 모두 text-lg md:text-xl로 통일
- ✅ 박스 밖으로 삐져나오는 문제 완전 해결

---

### 3. ✅ 자산구성분석 "전체" 탭 데이터 미표시 문제 해결 (커밋: 39d89af)

**✅ 완료 결과**:
- ✅ by_category 빈 객체 → 실제 대분류별 데이터 집계로 변경
- ✅ 대분류별 total_principal, total_amount, count 계산
- ✅ 백분율 자동 계산 (principal_percentage, percentage)
- ✅ 도넛 차트/막대 차트 정상 표시

---

### 4. ✅ 각 페이지 헤더 제거 및 재구성 완료 (커밋: b202dbc)

**✅ 완료 결과**:
- ✅ 포트폴리오 페이지 헤더 완전 제거
- ✅ 가계부 페이지 헤더 완전 제거
- ✅ 중복 버튼 제거 (계정설정/로그아웃/Excel)
- ✅ Navigation 컴포넌트로 통합된 UI
- **코드 감소**: 158줄 삭제 (UI 단순화)

---

## 🟢 다음 세션 작업 (UX 개선)

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

## ✅ 완료 체크리스트 (2025-12-30 세션)

**완료된 작업**:
- [x] 투자철학 페이지 로딩 시간 < 3초 ✅
- [x] 포트폴리오 요약 카드 폰트 크기 정상 ✅
- [x] 자산구성분석 "전체" 탭 데이터 정상 표시 ✅
- [x] 포트폴리오/가계부 헤더 제거 완료 ✅
- [x] TypeScript 빌드 0 오류 ✅
- [x] 모든 변경사항 커밋 및 푸시 ✅

**다음 세션 작업**:
- [ ] 엑셀 추출 기능 개선
- [ ] 가계부 지출 색상 레드로 변경

---

## 📊 세션 완료 요약 (2025-12-30)

**완료된 커밋**: 4개
1. `c11f6dd` - 투자철학 페이지 성능 최적화 (몇십 초 → 2-3초)
2. `c1dd396` - 포트폴리오 요약 카드 폰트 크기 통일
3. `39d89af` - 자산구성분석 "전체" 탭 데이터 표시 수정
4. `b202dbc` - 포트폴리오/가계부 페이지 헤더 제거 (158줄 삭제)

**성과**:
- 🚀 투자철학 페이지 성능 90% 개선
- 🎨 UI 일관성 향상 (헤더 통합)
- 🐛 버그 2개 수정 (폰트 크기, 차트 데이터)
- 📉 코드 감소: 총 200+ 줄 삭제

**다음 세션 예상 시간**: 1.5시간
- 엑셀 추출 기능 개선: 1시간
- 가계부 색상 변경: 30분

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
