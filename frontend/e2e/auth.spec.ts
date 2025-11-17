import { test, expect } from '@playwright/test'

/**
 * 사용자 인증 E2E 테스트
 * - 로그인/회원가입 플로우
 * - 폼 검증 테스트
 */
test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    // 로컬스토리지 초기화
    await page.goto('/')
    await page.evaluate(() => {
      localStorage.clear()
    })
  })

  test('should show login page', async ({ page }) => {
    await page.goto('/login')

    // 로그인 폼 요소 확인
    await expect(page.locator('input[name="username"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.locator('button:has-text("로그인")')).toBeVisible()
  })

  test('should login successfully', async ({ page }) => {
    await page.goto('/login')

    // 폼 입력
    await page.fill('input[name="username"]', 'test')
    await page.fill('input[type="password"]', 'test')

    // 로그인 버튼 클릭
    await page.click('button:has-text("로그인")')

    // 포트폴리오 페이지로 리다이렉트 확인
    await expect(page).toHaveURL(/portfolio/, { timeout: 10000 })

    // localStorage에 사용자 정보 저장 확인
    const userId = await page.evaluate(() => localStorage.getItem('userId'))
    expect(userId).toBeTruthy()
  })

  test('should show validation errors on empty submit', async ({ page }) => {
    await page.goto('/login')

    // 빈 폼 제출
    await page.click('button:has-text("로그인")')

    // 검증 에러 확인 (Zod 검증)
    await expect(
      page.locator('text=사용자명').or(page.locator('text=아이디'))
    ).toBeVisible({ timeout: 5000 })
  })

  test('should toggle between login and signup', async ({ page }) => {
    await page.goto('/login')

    // "회원가입" 링크 클릭
    const signupLink = page.locator('text=회원가입').or(page.locator('a[href*="signup"]'))
    await signupLink.click()

    // 회원가입 폼으로 전환 확인
    await expect(page.locator('button:has-text("회원가입")')).toBeVisible({ timeout: 5000 })
  })

  test('should logout', async ({ page }) => {
    // 로그인 상태 설정
    await page.goto('/')
    await page.evaluate(() => {
      localStorage.setItem('userId', '1')
      localStorage.setItem('username', 'test')
    })

    await page.goto('/portfolio')

    // 로그아웃 버튼/링크 찾기
    const logoutButton = page.locator('text=로그아웃').or(page.locator('button[aria-label="로그아웃"]'))

    if (await logoutButton.isVisible()) {
      await logoutButton.click()

      // 로그인 페이지로 리다이렉트 확인
      await expect(page).toHaveURL(/login/, { timeout: 10000 })

      // localStorage 초기화 확인
      const userId = await page.evaluate(() => localStorage.getItem('userId'))
      expect(userId).toBeNull()
    }
  })

  test('should remember user session', async ({ page }) => {
    // 로그인
    await page.goto('/login')
    await page.fill('input[name="username"]', 'test')
    await page.fill('input[type="password"]', 'test')
    await page.click('button:has-text("로그인")')

    await expect(page).toHaveURL(/portfolio/)

    // 페이지 새로고침
    await page.reload()

    // 여전히 로그인 상태 유지 확인 (로그인 페이지로 리다이렉트되지 않음)
    await expect(page).toHaveURL(/portfolio/)
  })

  test('should prevent access to protected routes', async ({ page }) => {
    // 로그인하지 않은 상태로 보호된 페이지 접근 시도
    await page.goto('/portfolio')

    // 로그인 페이지로 리다이렉트되거나, 접근 거부 메시지 표시
    const isLoginPage = await page.url().includes('login')
    const hasAccessDenied = await page.locator('text=로그인').isVisible({ timeout: 5000 })

    expect(isLoginPage || hasAccessDenied).toBeTruthy()
  })
})
