# E2E 테스트 가이드

## 개요

Playwright를 사용한 End-to-End 테스트 시스템입니다.

## 설치

```bash
npm install -D @playwright/test @axe-core/playwright
npx playwright install chromium
```

## 테스트 실행

```bash
# 모든 테스트 실행 (headless)
npm run test:e2e

# UI 모드로 실행 (권장)
npm run test:e2e:ui

# 브라우저 창 보면서 실행
npm run test:e2e:headed

# 디버그 모드
npm run test:e2e:debug
```

## 테스트 구조

### auth.spec.ts
- 로그인/회원가입 플로우
- 폼 검증
- 세션 관리
- 보호된 라우트 접근 제어

### portfolio.spec.ts
- 포트폴리오 자산 CRUD
- 필터링 및 정렬
- 키보드 네비게이션
- 접근성 검증 (axe-core)
- 로딩/에러 상태 처리
- 반응형 디자인 검증

## 접근성 테스트

각 테스트에서 `@axe-core/playwright`를 사용하여 WCAG 2.1 AA 표준 준수를 자동 검증합니다.

```typescript
import AxeBuilder from '@axe-core/playwright'

test('should pass accessibility tests', async ({ page }) => {
  const accessibilityScanResults = await new AxeBuilder({ page }).analyze()
  expect(accessibilityScanResults.violations).toEqual([])
})
```

## CI/CD 통합

GitHub Actions에서 자동 실행:

```yaml
- name: Run E2E tests
  run: npm run test:e2e
```

## 모범 사례

1. **격리된 테스트**: 각 테스트는 독립적으로 실행 가능해야 함
2. **명확한 선택자**: `data-testid`나 `role` 속성 사용 권장
3. **적절한 대기**: `waitForSelector` 대신 `expect().toBeVisible()` 사용
4. **스크린샷**: 실패 시 자동으로 스크린샷 저장
5. **접근성 우선**: 모든 주요 페이지에서 axe 검증 실행

## 디버깅

```bash
# 특정 테스트만 실행
npx playwright test portfolio.spec.ts

# 실패한 테스트만 재실행
npx playwright test --last-failed

# 리포트 보기
npx playwright show-report
```

## 커버리지 목표

- ✅ 인증 플로우: 100%
- ✅ 포트폴리오 CRUD: 100%
- ⏳ 가계부 CRUD: 0% (향후 추가)
- ⏳ 경제지표 조회: 0% (향후 추가)

**현재 커버리지**: ~50% (핵심 플로우 완료)
**목표 커버리지**: 70%
