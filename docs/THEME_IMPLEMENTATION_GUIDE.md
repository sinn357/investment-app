# 골드-에메랄드 테마 시스템 구현 가이드

> 날짜: 2025-11-18
> 구현자: Claude
> 브랜치: `claude/update-color-scheme-01RZe48B7xF7d1fgJXDtK4Kn`

---

## 📋 목차

1. [개요](#개요)
2. [색상 시스템](#색상-시스템)
3. [구현 상세](#구현-상세)
4. [다크모드](#다크모드)
5. [커밋 히스토리](#커밋-히스토리)
6. [검증 가이드](#검증-가이드)

---

## 개요

### 목표
- 기존 흑백 테마를 투자 앱에 어울리는 프리미엄 골드-에메랄드 테마로 전환
- 라이트모드와 다크모드 완전 지원
- 모든 페이지에 일관된 디자인 적용

### 설계 원칙
- **CSS 변수 기반**: 중앙 집중식 색상 관리
- **의미론적 네이밍**: primary, secondary, background 등
- **확장성**: 새로운 색상 추가 용이
- **접근성**: WCAG 2.1 AA 기준 준수

---

## 색상 시스템

### 라이트 모드

#### Primary (골드)
```css
--primary: oklch(0.68 0.17 88);
--primary-foreground: oklch(0.98 0 0);
```
- **용도**: 주요 버튼, 강조 요소, 로고
- **의미**: 번영, 재산 증가, 프리미엄

#### Secondary (에메랄드)
```css
--secondary: oklch(0.65 0.16 158);
--secondary-foreground: oklch(0.98 0 0);
```
- **용도**: 보조 버튼, 액센트, 성공 상태
- **의미**: 성장, 호황, 긍정적 변화

#### Background & Cards
```css
--background: oklch(0.99 0.005 90);  /* 크림/아이보리 */
--card: oklch(1 0 0);                /* 순백색 */
--border: oklch(0.90 0.01 90);       /* 은은한 골드 테두리 */
```

#### Chart Colors
```css
--chart-1: oklch(0.68 0.17 88);   /* 골드 */
--chart-2: oklch(0.65 0.16 158);  /* 에메랄드 */
--chart-3: oklch(0.60 0.14 120);  /* 중간 그린 */
--chart-4: oklch(0.72 0.15 75);   /* 밝은 골드 */
--chart-5: oklch(0.62 0.15 140);  /* 틸 */
```

---

### 다크 모드

#### Primary (빛나는 골드)
```css
--primary: oklch(0.78 0.20 88);
--primary-foreground: oklch(0.10 0.02 90);
```
- 라이트 모드보다 **더 밝고 선명**하게
- 어두운 배경에서도 눈부심 없이 잘 보임

#### Secondary (생동감 있는 에메랄드)
```css
--secondary: oklch(0.70 0.19 158);
--secondary-foreground: oklch(0.10 0.02 90);
```
- 채도를 높여 **더 생생**하게

#### Background & Cards
```css
--background: oklch(0.13 0.02 85);     /* 은은한 골드 힌트 다크 */
--card: oklch(0.17 0.025 88);          /* 골드 톤 카드 */
--border: oklch(0.28 0.03 88);         /* 선명한 골드 테두리 */
```
- 완전한 검정 대신 **따뜻한 골드 톤** 유지
- 프리미엄한 느낌 강조

---

## 구현 상세

### 1. CSS 변수 시스템 (`frontend/src/app/globals.css`)

```css
:root {
  /* 라이트 모드 변수 */
  --primary: oklch(0.68 0.17 88);
  --secondary: oklch(0.65 0.16 158);
  /* ... 기타 변수 */
}

.dark {
  /* 다크 모드 변수 오버라이드 */
  --primary: oklch(0.78 0.20 88);
  --secondary: oklch(0.70 0.19 158);
  /* ... 기타 변수 */
}
```

**장점:**
- 한 곳에서 모든 색상 관리
- 다크모드 자동 대응
- Tailwind CSS와 완벽 통합

---

### 2. Navigation 컴포넌트

#### 골드 그라데이션 헤더
```tsx
<nav className="bg-gradient-to-r from-primary via-primary/90 to-secondary/20 shadow-lg border-b border-primary/30">
```

**효과:**
- 골드에서 에메랄드로 자연스러운 그라데이션
- 프리미엄하고 화려한 느낌
- 모든 텍스트는 흰색으로 가독성 확보

#### 다크모드 토글 버튼
```tsx
<button onClick={toggleDarkMode}>
  {isDarkMode ? (
    <svg>/* 해 아이콘 */</svg>
  ) : (
    <svg>/* 달 아이콘 */</svg>
  )}
</button>
```

---

### 3. 페이지별 적용

#### 홈페이지 (`frontend/src/app/page.tsx`)
```tsx
{/* 경제지표 카드 - 골드 테두리 */}
<div className="border-2 border-primary/20 hover:border-primary/40">
  <div className="w-12 h-12 bg-primary/10">
    <svg className="text-primary">...</svg>
  </div>
  <button className="bg-primary hover:bg-primary/90 text-primary-foreground">
    지표 확인하기
  </button>
</div>

{/* 포트폴리오 카드 - 에메랄드 테두리 */}
<div className="border-2 border-secondary/20 hover:border-secondary/40">
  <div className="w-12 h-12 bg-secondary/10">
    <svg className="text-secondary">...</svg>
  </div>
  <button className="bg-secondary hover:bg-secondary/90 text-secondary-foreground">
    포트폴리오 관리
  </button>
</div>
```

**패턴:**
- 카드: `border-2 border-{color}/20 hover:border-{color}/40`
- 아이콘 배경: `bg-{color}/10`
- 버튼: `bg-{color} hover:bg-{color}/90`

#### 경제지표/포트폴리오/가계부 페이지
```tsx
{/* 헤더 */}
<header className="bg-gradient-to-r from-primary/5 to-secondary/5 shadow-sm border-b border-primary/10">
  <h1 className="text-foreground">제목</h1>
  <p className="text-muted-foreground">부제목</p>
</header>

{/* 버튼 */}
<button className="text-secondary border border-secondary/30 hover:bg-secondary/10">
  계정 설정
</button>
<button className="text-primary border border-primary/30 hover:bg-primary/10">
  로그아웃
</button>
```

---

## 다크모드

### useDarkMode 훅 (`frontend/src/hooks/useDarkMode.ts`)

```typescript
export function useDarkMode() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // 1. localStorage 확인
    const savedTheme = localStorage.getItem('theme');
    // 2. 시스템 설정 확인
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    // 3. 우선순위: localStorage > 시스템 설정
    const shouldBeDark = savedTheme === 'dark' || (!savedTheme && prefersDark);

    // 4. HTML 클래스 추가/제거
    if (shouldBeDark) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);

    // DOM 업데이트
    document.documentElement.classList.toggle('dark', newDarkMode);
    // localStorage 저장
    localStorage.setItem('theme', newDarkMode ? 'dark' : 'light');
  };

  return { isDarkMode, toggleDarkMode };
}
```

**핵심 로직:**
1. 초기 로드 시 localStorage 또는 시스템 설정 확인
2. `html` 태그에 `dark` 클래스 추가/제거
3. Tailwind의 `dark:` prefix가 자동 활성화
4. localStorage에 선택 저장

---

## 커밋 히스토리

### Commit 1: 색상 스킴 업데이트
```bash
feat: update color scheme to gold-emerald theme
```
- CSS 변수 정의
- 라이트/다크 모드 색상 설정

### Commit 2: 전체 페이지 적용
```bash
feat: apply gold-emerald theme across all pages
```
- Navigation 그라데이션
- 홈/경제지표/포트폴리오/가계부 페이지
- 버튼/카드 스타일링

### Commit 3: 다크모드 구현
```bash
feat: implement dark mode with premium gold-emerald theme
```
- useDarkMode 훅
- 토글 버튼
- 다크모드 전용 색상

---

## 검증 가이드

### 로컬 테스트
```bash
cd frontend
npm run dev
# http://localhost:3000
```

### 체크리스트

#### 라이트 모드
- [ ] Navigation 헤더 골드 그라데이션 확인
- [ ] 홈페이지 카드 골드/에메랄드 테두리 확인
- [ ] 버튼 hover 효과 확인
- [ ] 모든 페이지 일관된 배경색 확인

#### 다크 모드
- [ ] 토글 버튼으로 모드 전환 확인
- [ ] 배경이 은은한 골드 톤인지 확인
- [ ] 골드/에메랄드가 더 밝고 선명한지 확인
- [ ] 카드 배경이 골드 톤인지 확인

#### 영속성
- [ ] 다크모드 선택 후 새로고침 시 유지 확인
- [ ] 시스템 설정 변경 시 자동 감지 확인

#### 반응형
- [ ] 모바일 화면에서 색상 정상 확인
- [ ] 태블릿 화면에서 색상 정상 확인

---

## 트러블슈팅

### 문제: 색상이 적용되지 않음
**해결:**
```bash
# 브라우저 캐시 클리어
# Hard Reload (Ctrl+Shift+R or Cmd+Shift+R)
```

### 문제: 다크모드 토글 안됨
**확인:**
```typescript
// useDarkMode 훅이 Navigation에서 import 되었는지
import { useDarkMode } from '@/hooks/useDarkMode';
```

### 문제: 일부 컴포넌트만 색상 적용
**확인:**
```tsx
// 하드코딩된 색상 클래스 제거
// ❌ className="bg-blue-600"
// ✅ className="bg-primary"
```

---

## 향후 개선사항

1. **자동 테마 전환**: 시간대별 자동 라이트/다크 모드
2. **사용자 정의 테마**: 사용자가 골드/에메랄드 색상 직접 조정
3. **테마 프리셋**: 여러 색상 조합 중 선택 가능
4. **애니메이션**: 테마 전환 시 부드러운 애니메이션
5. **접근성 개선**: 고대비 모드 지원

---

## 참고 자료

- [OKLCH 색상 공간](https://oklch.com)
- [Tailwind CSS Dark Mode](https://tailwindcss.com/docs/dark-mode)
- [WCAG 2.1 색상 대비 가이드라인](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)
- ADR-044: 골드-에메랄드 프리미엄 테마 아키텍처
- ADR-045: 다크모드 토글 시스템 아키텍처
