# 프로젝트 문서화 가이드

## 📚 MD 파일 역할 분담

### 🎯 **CLAUDE.md** - 세션 관리 중심
- **목적**: Claude Code 세션간 연속성 보장 (SSOT)
- **업데이트**: 매 세션마다 Tasks/ADR 섹션 갱신
- **내용**:
  - 프로젝트 메타 정보
  - Tasks 관리 (Active/Done/Backlog)
  - ADR (Architecture Decision Records)
  - 환경설정, 컨벤션

### 📖 **README.md** - 프로젝트 소개
- **목적**: 외부 사용자/개발자용 프로젝트 소개서
- **업데이트**: 주요 기능 추가 시
- **내용**: Features, 설치법, 사용법, 기술 스택

### 📋 **docs/ 폴더** - 기술 문서 모음
- **목적**: 개발자용 상세 구현 가이드
- **업데이트**: 주요 기능 완성 시
- **내용**: 구현 절차, 아키텍처, API 명세

### 🔍 **루트 분석 파일** - 특정 이슈 해결 기록
- **목적**: 복잡한 문제 분석 및 해결 과정
- **업데이트**: 복잡한 이슈 해결 시
- **내용**: 문제 분석, 해결 과정, 검증 결과

---

## 📝 작업 기록 표준 방식

### **🔄 세션별 작업 기록** → **CLAUDE.md**
```markdown
## 12) Tasks (Single Source of Truth)
### Recent Done
- **T-XXX:** 작업명 ✅ (한 줄 요약)

### ADR-XXX: 결정 제목
- Date: YYYY-MM-DD
- Context: 왜 필요했는가
- Decision: 선택한 해결책
- Consequences: 영향/트레이드오프
```

### **📚 기술 구현 가이드** → **docs/XXX.md**
```markdown
# 기능명 구현 가이드

## 개요
기능 설명

## 구현 방법
코드 예시 및 절차

## 주의사항
알려진 이슈 및 해결책
```

### **🔍 특정 이슈 분석** → **ISSUE_NAME_ANALYSIS.md**
```markdown
# 이슈명 분석

## 문제 상황
발견된 문제 설명

## 원인 분석
근본 원인

## 해결 방법
적용한 해결책

## 검증 결과
테스트 및 확인 결과
```

---

## 📅 권장 업데이트 주기

| 파일 종류 | 업데이트 시점 | 담당 |
|-----------|---------------|------|
| CLAUDE.md | 매 세션 종료 시 | Claude |
| docs/ | 주요 기능 완성 시 | Claude + 개발자 |
| README.md | 주요 릴리즈 시 | 개발자 |
| 분석 파일 | 복잡한 이슈 해결 시 | Claude |

---

## 🔖 네이밍 컨벤션

- **기능 가이드**: `docs/FEATURE_NAME_GUIDE.md`
- **구현 기록**: `docs/FEATURE_NAME_IMPLEMENTATION.md`
- **이슈 분석**: `ISSUE_NAME_ANALYSIS.md`
- **시스템 명세**: `docs/SYSTEM_NAME_SPEC.md`

예시:
- `docs/THRESHOLD_BADGE_SYSTEM.md` (시스템 명세)
- `docs/ECONOMIC_INDICATOR_GUIDE.md` (구현 가이드)
- `DATASECTION_COLOR_FIX.md` (이슈 분석)