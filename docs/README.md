# Investment App 문서 가이드

> **최종 업데이트**: 2025-12-09  
> **프로젝트**: Economic Indicators Dashboard  
> **스택**: Flask (Backend) + Next.js (Frontend)  

---

## 📚 문서 구조

### 🎯 핵심 문서 (반드시 읽기)

1. **[MASTER_PLAN.md](./MASTER_PLAN.md)**
   - 전체 프로젝트 로드맵
   - 아키텍처 개요
   - 기술 스택 결정사항

2. **[CHANGELOG.md](./CHANGELOG.md)**
   - 최근 업데이트 이력
   - 배포 기록

3. **[ROADMAP.md](./ROADMAP.md)**
   - 향후 계획
   - 우선순위 작업 목록

---

## 🚀 기능별 문서

### Master Market Cycle System
> **상태**: ✅ 완료 (2025-12-09)

- **[2025-12-05_Master_Market_Cycle_Phase1.md](./2025-12-05_Master_Market_Cycle_Phase1.md)**
  - Phase 1: 거시경제 사이클 구현
  - 6개 지표 점수화 로직

- **[2025-12-05_Master_Market_Cycle_Phase2.md](./2025-12-05_Master_Market_Cycle_Phase2.md)**
  - Phase 2: 신용/유동성 사이클 구현
  - 5개 지표 통합

- **[2025-12-05_Master_Market_Cycle_Phase3.md](./2025-12-05_Master_Market_Cycle_Phase3.md)**
  - Phase 3: 심리/밸류에이션 사이클 구현
  - 6개 지표 크롤링

- **[2025-12-05_Master_Market_Cycle_Complete.md](./2025-12-05_Master_Market_Cycle_Complete.md)**
  - 최종 통합 및 검증
  - 실제 경제 상황과 일치도 95%

- **[2025-12-06_Master_Cycle_Debugging_Session.md](./2025-12-06_Master_Cycle_Debugging_Session.md)**
  - Sentiment 사이클 임계값 수정
  - 4개 지표 0점 문제 해결

---

### 뉴스 & 담론 시스템
> **상태**: ✅ Phase 3 (담론 가이드) + Phase 5 (과거 리뷰) 유지 / ❌ Phase 1·2·4 롤백 (2025-12-10 `c0741c4`)

- **[NEWS_NARRATIVE_IMPROVEMENT_PLAN.md](./NEWS_NARRATIVE_IMPROVEMENT_PLAN.md)** ⭐ **NEW**
  - Phase 1-5 상세 구현 계획 (기록용, 1·2·4 Phase는 롤백됨)
  - 담론 작성 가이드 + 과거 담론 검증 시스템만 유지

---

### 경제지표 시스템

- **[INDICATOR_INTERPRETATION_SYSTEM.md](./INDICATOR_INTERPRETATION_SYSTEM.md)**
  - 지표 해석 시스템 설계
  - 5개 섹션 구조 (핵심정의, 해석법, 의미/맥락, 시장 반응, 확인 정보)

- **[INDICATOR_METADATA_GUIDE.md](./INDICATOR_METADATA_GUIDE.md)**
  - 지표 메타데이터 작성 가이드
  - 우선순위 지표 리스트

- **[INDICATOR_RENEWAL_PLAN.md](./INDICATOR_RENEWAL_PLAN.md)**
  - 지표 갱신 전략
  - 크롤러 유지보수 계획

- **[MACRO_INDICATOR_REDESIGN.md](./MACRO_INDICATOR_REDESIGN.md)**
  - 거시경제 지표 재설계
  - 17개 핵심 지표 선정 전략

---

### 사이클 시스템 설계

- **[CYCLE_SYSTEM_REDESIGN.md](./CYCLE_SYSTEM_REDESIGN.md)**
  - 3대 사이클 시스템 재설계 계획
  - "Less is More" 철학
  - 47개 → 17개 핵심 지표 선정

---

### 성능 최적화

- **[2025-12-04_API_Performance_Optimization.md](./2025-12-04_API_Performance_Optimization.md)**
  - v2 API 통합 최적화
  - 4개 요청 → 1개 요청 (75% 감소)
  - 로딩 시간 단축 (10초 → 2초)

---

### UI/UX 개선

- **[SESSION_2025_12_03_UI_IMPROVEMENTS.md](./SESSION_2025_12_03_UI_IMPROVEMENTS.md)**
  - Phase 7-9 UI 개선 세션
  - 그리드 시스템, 에러 처리, 성능 최적화

- **[DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md)**
  - 골드-에메랄드 프리미엄 테마
  - 컴포넌트 디자인 가이드
  - 다크모드 시스템

---

## 📂 guides/ 폴더

상세 개발 가이드:
- API 설계 패턴
- 크롤러 작성 가이드
- 프론트엔드 컴포넌트 구조
- 데이터베이스 스키마

---

## 📦 archive/ 폴더

완료된 작업 문서 보관:
- 과거 버전 설계 문서
- 폐기된 기능 문서
- 마이그레이션 기록

---

## 🎯 빠른 참조

### 새로운 세션 시작 시
1. **[CHANGELOG.md](./CHANGELOG.md)** 최근 변경사항 확인
2. **[ROADMAP.md](./ROADMAP.md)** 다음 작업 확인
3. 해당 기능 문서 읽기

### 새 기능 구현 시
1. **[MASTER_PLAN.md](./MASTER_PLAN.md)** 아키텍처 확인
2. **guides/** 관련 가이드 참조
3. 구현 후 **CHANGELOG.md** 업데이트

### 버그 수정 시
1. **[FIXES.md](./FIXES.md)** 알려진 이슈 확인
2. 해당 기능 문서 디버깅 섹션 참조
3. 수정 후 **CHANGELOG.md** 업데이트

---

## 🔄 문서 업데이트 규칙

### 파일명 규칙
- 세션 문서: `YYYY-MM-DD_<제목>.md`
- 계획 문서: `<기능명>_PLAN.md`
- 가이드 문서: `<주제명>_GUIDE.md`
- 시스템 문서: `<시스템명>.md`

### 필수 헤더
```markdown
# 문서 제목

> **작성일**: YYYY-MM-DD  
> **상태**: 진행 중 | 완료 | 보류  
> **관련 이슈**: #123  
```

### 업데이트 시점
- ✅ 새 기능 완료 시
- ✅ 주요 버그 수정 시
- ✅ 아키텍처 변경 시
- ✅ API 변경 시

---

## 📞 문의 & 기여

- **프로젝트 Owner**: Partner & Claude Code
- **저장소**: https://github.com/sinn357/investment-app
- **배포**: 
  - Frontend: https://investment-app-rust-one.vercel.app
  - Backend: https://investment-app-backend-x166.onrender.com

---

**마지막 업데이트**: 2025-12-09  
**담당**: Claude Code  
