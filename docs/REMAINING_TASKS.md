# 남은 작업 목록 (Remaining Tasks)

> **작성일**: 2025-12-30 (최종 업데이트)
> **상태**: Oracle 2025 디자인 시스템 완성! 🎉
> **우선순위**: 높음(⭐⭐⭐) / 중간(⭐⭐) / 낮음(⭐)

---

## 🎉 Oracle 2025 디자인 시스템 100% 완성!

### ✅ 완료된 페이지 (7개)
1. ✅ **홈페이지** - 파티클 배경, 글래스모피즘, 애니메이션 시스템
2. ✅ **투자철학** - 아이콘 배지, 섹션별 색상, shimmer 효과
3. ✅ **포트폴리오** - GlassCard, 애니메이션, 차트 개선
4. ✅ **가계부** - 게이지 시스템, 색상 테마, 반응형
5. ✅ **섹터/종목** - 6대 산업군 탭, 8개 분석 섹션, 순차 애니메이션
6. ✅ **경제지표** - LIVE 배지, GlassCard 통합, 골드-에메랄드 필터
7. ✅ **계정설정** - 홀로그램 효과, 탭 애니메이션, Oracle 배경 (2025-12-30 완료!)

**진행률**: **100%** (7/7 필수 페이지) 🎊

---

## ✅ 최근 완료된 작업 (2025-12-30)

### 1. 계정설정 페이지 Oracle 2025 업그레이드 ✅
- 프로필 카드 홀로그램 효과 (회전하는 빛 링 + Premium 배지)
- 탭 네비게이션 골드-에메랄드 그라디언트
- GlassCard + EnhancedButton 적용
- Oracle 배경 애니메이션 (float, gradient)
- 성공 화면 애니메이션 체크마크
- Input 크기 증가 (h-12)

### 2. Vercel 빌드 에러 수정 ✅
- OraclePieChart에 className prop 추가
- PortfolioDashboard.tsx 빌드 성공

### 3. 코드 품질 개선 ✅
- **ESLint 경고**: 12개 → 0개 완전 해결 ✨
- **Unused imports 제거**: 9개
- **console.log 제거**: 4개
- **코드 라인**: -42 라인 (정리)

---

## 🚀 선택적 작업 (우선순위별)

### 🟡 1. 성능 최적화 ⭐⭐ (추천)

**예상 시간**: 3-4시간

#### Phase 1: React 최적화
- [ ] **React.memo 적용** (무거운 컴포넌트)
  - MasterCycleCard (경제지표 마스터 사이클)
  - IndicatorGrid (47개 지표 그리드)
  - PortfolioDashboard (포트폴리오 대시보드)
  - ExpenseManagementDashboard (가계부 대시보드)
  - CompactIndicatorCard (개별 지표 카드)

- [ ] **useMemo 최적화**
  - 차트 데이터 계산 (prepareChartData)
  - 필터링된 데이터 (filteredAssets, filteredExpenses)
  - 정렬된 데이터 (sortedIndicators)

- [ ] **useCallback 최적화**
  - 이벤트 핸들러 (handleClick, handleSubmit)
  - 데이터 페칭 함수 (fetchAssets, fetchIndicators)

#### Phase 2: 이미지 최적화
- [ ] **Next.js Image 컴포넌트** 사용
- [ ] **Lazy loading** 적용
- [ ] **WebP 형식** 변환

#### Phase 3: 번들 크기 최적화
- [ ] **Dynamic imports** (코드 스플리팅)
  - 큰 차트 라이브러리 (Recharts)
  - 무거운 컴포넌트 (ExpenseManagementDashboard)
- [ ] **Tree shaking** 확인
- [ ] **사용하지 않는 패키지** 제거

#### Phase 4: 데이터 페칭 최적화
- [ ] **TanStack Query staleTime** 조정 (현재 1분 → 5분)
- [ ] **Prefetching 전략** 구현
- [ ] **캐싱 정책** 최적화

**기술 스택**:
- React.memo, useMemo, useCallback
- Next.js Image, dynamic import
- webpack-bundle-analyzer

**구현 예시**:
```typescript
// React.memo
const MasterCycleCard = React.memo(({ data }) => {
  // ...
}, (prevProps, nextProps) => {
  return prevProps.data === nextProps.data;
});

// useMemo
const chartData = useMemo(() => {
  return prepareChartData(rawData);
}, [rawData]);

// useCallback
const handleClick = useCallback(() => {
  // ...
}, [dependency]);
```

---

### 🟢 2. Confetti 효과 추가 ⭐ (선택적)

**예상 시간**: 30분

**작업 내용**:
- [ ] react-confetti 패키지 설치
- [ ] AccountSettings 저장 성공 시 Confetti 추가
- [ ] 골드/에메랄드/옐로우 색상 설정

**패키지 설치**:
```bash
npm install react-confetti
```

**구현 예시**:
```typescript
import Confetti from 'react-confetti';

const [showConfetti, setShowConfetti] = useState(false);

const handleSaveSettings = async () => {
  // 저장 로직
  setShowConfetti(true);
  setTimeout(() => setShowConfetti(false), 3000);
};

{showConfetti && (
  <Confetti
    width={window.innerWidth}
    height={window.innerHeight}
    colors={['var(--primary)', 'var(--secondary)', '#FFD700', '#50C878']}
    recycle={false}
  />
)}
```

---

### 🟢 3. 새로운 기능 추가 (자유)

#### 3.1 암호화폐거래 페이지 개발 ⭐
**예상 시간**: 4-5시간 (선택적)

**작업 내용**:
- [ ] 실시간 암호화폐 가격 대시보드
- [ ] 거래 기록 관리
- [ ] 수익률 계산 및 차트
- [ ] Oracle 2025 디자인 적용

**기술 스택**:
- CoinGecko API 또는 Binance API
- WebSocket 실시간 가격 업데이트
- GlassCard + 차트 시스템

#### 3.2 Oracle 컴포넌트 라이브러리 확장 ⭐
**예상 시간**: 2-3시간

**작업 내용**:
- [ ] **GlassModal** 컴포넌트
- [ ] **GlassTable** 컴포넌트
- [ ] **OracleAreaChart** (영역 차트)
- [ ] **OracleScatterChart** (산점도)
- [ ] **EnhancedInput** (향상된 입력 필드)

#### 3.3 PWA 지원 ⭐
**예상 시간**: 2-3시간

**작업 내용**:
- [ ] next-pwa 패키지 설치
- [ ] manifest.json 생성
- [ ] 오프라인 캐싱
- [ ] 홈 화면 추가 기능

---

## 📅 우선순위별 작업 순서

### 🟡 중간 우선순위 (추천)
1. **성능 최적화** (3-4시간) ⭐⭐
   - React.memo, useMemo, useCallback
   - 이미지 최적화
   - 번들 크기 분석

### 🟢 낮은 우선순위 (선택적)
2. **Confetti 효과** (30분) ⭐
3. **암호화폐거래 페이지** (4-5시간) ⭐
4. **Oracle 컴포넌트 확장** (2-3시간) ⭐
5. **PWA 지원** (2-3시간) ⭐

---

## 📊 예상 총 작업 시간

| 작업 | 시간 | 우선순위 |
|------|------|----------|
| 성능 최적화 | 3-4h | ⭐⭐ |
| Confetti 효과 | 30m | ⭐ |
| 암호화폐거래 페이지 | 4-5h | ⭐ |
| Oracle 컴포넌트 확장 | 2-3h | ⭐ |
| PWA 지원 | 2-3h | ⭐ |
| **합계 (선택적)** | **12-17h** | |

---

## 🛠️ 구현 가이드

### 성능 최적화 구현 순서
1. React DevTools Profiler로 성능 병목 확인
2. React.memo 적용 (무거운 컴포넌트)
3. useMemo / useCallback 추가 (불필요한 재계산 방지)
4. webpack-bundle-analyzer로 번들 크기 분석
5. Dynamic imports로 코드 스플리팅
6. Lighthouse 점수 측정 및 개선

### Confetti 효과 구현 순서
1. react-confetti 패키지 설치
2. AccountSettings에 useState(showConfetti) 추가
3. 저장 성공 시 Confetti 트리거
4. 3초 후 자동 종료
5. 골드/에메랄드 색상 설정

---

## 📝 참고 문서

- **Oracle 2025 디자인 마스터플랜**: `docs/ORACLE_2025_DESIGN_UPGRADE.md`
- **세션 완료 문서**: `docs/SESSION_2025-12-30_SETTINGS_AND_CODE_QUALITY.md`
- **프로젝트 컨텍스트**: `CLAUDE.md`
- **테마 시스템**: `frontend/src/styles/theme.ts`
- **GlassCard 컴포넌트**: `frontend/src/components/GlassCard.tsx`
- **EnhancedButton 컴포넌트**: `frontend/src/components/EnhancedButton.tsx`

---

## 🎓 다음 세션 시작 방법

### 성능 최적화 시작
```
"성능 최적화 작업을 시작할게.
docs/REMAINING_TASKS.md와 SESSION_2025-12-30_SETTINGS_AND_CODE_QUALITY.md 읽어줘."
```

### Confetti 효과 추가
```
"계정설정 페이지에 Confetti 효과를 추가할게.
react-confetti 패키지를 설치하고 구현해줘."
```

### 새로운 기능 개발
```
"[기능명] 개발을 시작할게.
Oracle 2025 디자인 시스템을 적용해서 만들어줘."
```

---

## 🎉 축하합니다!

**Oracle 2025 디자인 시스템이 완성되었습니다!**

모든 필수 페이지가 골드-에메랄드 프리미엄 테마로 통일되었으며,
코드 품질도 완벽하게 개선되었습니다 (ESLint 0 경고).

다음 단계는 선택적 작업입니다.
성능 최적화, 새로운 기능 추가 등 자유롭게 진행하세요! 🚀

---

**문서 버전**: 2.0
**최종 업데이트**: 2025-12-30
**작성자**: Claude Code Assistant
