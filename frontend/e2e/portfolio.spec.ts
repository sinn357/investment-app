import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

/**
 * 포트폴리오 자산 관리 E2E 테스트
 * - 자산 추가, 수정, 삭제 플로우
 * - 접근성 검증 (axe-core)
 */
test.describe('Portfolio Management', () => {
  test.beforeEach(async ({ page }) => {
    // 로그인 (간단한 로컬스토리지 세션 설정)
    await page.goto('/')
    await page.evaluate(() => {
      localStorage.setItem('userId', '1')
      localStorage.setItem('username', 'test')
    })
    await page.goto('/portfolio')
  })

  test('should load portfolio page', async ({ page }) => {
    // 페이지 타이틀 확인
    await expect(page).toHaveTitle(/Investment App/)

    // 포트폴리오 대시보드 로드 확인
    await expect(page.locator('text=포트폴리오')).toBeVisible()
  })

  test('should pass accessibility tests', async ({ page }) => {
    // axe-core로 접근성 검사
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze()

    // 접근성 위반 사항이 있으면 테스트 실패
    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('should add new asset', async ({ page }) => {
    // "자산 추가" 섹션으로 스크롤
    const addAssetSection = page.locator('text=자산 추가').first()
    await addAssetSection.scrollIntoViewIfNeeded()

    // 자산군 선택
    await page.selectOption('select[name="assetType"]', 'immediate-cash')

    // 소분류 선택
    await page.selectOption('select[name="subCategory"]', 'cash')

    // 자산명 입력
    await page.fill('input[name="name"]', 'E2E 테스트 현금')

    // 금액 입력
    await page.fill('input[name="amount"]', '1000000')

    // 날짜 입력
    await page.fill('input[name="date"]', '2024-01-01')

    // 저장 버튼 클릭
    await page.click('button:has-text("저장")')

    // Toast 알림 확인 (sonner)
    await expect(page.locator('text=자산이 성공적으로 추가되었습니다')).toBeVisible({
      timeout: 5000,
    })

    // 포트폴리오 테이블에 추가된 자산 확인
    await expect(page.locator('text=E2E 테스트 현금')).toBeVisible({
      timeout: 10000,
    })
  })

  test('should filter by category', async ({ page }) => {
    // 카테고리 필터 선택
    const categoryFilter = page.locator('select').filter({ hasText: '전체' }).first()
    await categoryFilter.selectOption('즉시현금')

    // 필터링된 결과 확인 (즉시현금 자산만 표시)
    const assetRows = page.locator('[data-asset-type="즉시현금"]')
    await expect(assetRows.first()).toBeVisible({ timeout: 5000 })
  })

  test('should navigate using keyboard', async ({ page }) => {
    // Tab 키로 네비게이션 테스트
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')

    // 포커스된 요소 확인
    const focusedElement = page.locator(':focus')
    await expect(focusedElement).toBeVisible()

    // Enter 키로 버튼 활성화 테스트
    await focusedElement.press('Enter')
  })

  test('should handle loading states', async ({ page }) => {
    // 새로고침하여 로딩 상태 확인
    await page.reload()

    // 로딩 인디케이터 확인 (Skeleton 또는 Spinner)
    const loadingIndicator = page.locator('text=로딩 중').or(page.locator('[role="status"]'))
    await expect(loadingIndicator).toBeVisible({ timeout: 10000 })

    // 로딩 완료 후 데이터 표시 확인
    await expect(page.locator('text=포트폴리오')).toBeVisible({ timeout: 10000 })
  })

  test('should handle error states', async ({ page }) => {
    // 네트워크 오프라인으로 설정
    await page.context().setOffline(true)

    // 새로고침하여 에러 상태 트리거
    await page.reload()

    // 에러 메시지 확인
    await expect(
      page.locator('text=오류').or(page.locator('text=실패'))
    ).toBeVisible({ timeout: 10000 })

    // 네트워크 복구
    await page.context().setOffline(false)
  })

  test('should be responsive on mobile', async ({ page }) => {
    // 모바일 뷰포트로 설정
    await page.setViewportSize({ width: 375, height: 667 })

    // 페이지 로드
    await page.goto('/portfolio')

    // 모바일에서도 핵심 요소 표시 확인
    await expect(page.locator('text=포트폴리오')).toBeVisible()

    // 가로 스크롤 없이 콘텐츠 표시 확인
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
    const viewportWidth = await page.evaluate(() => window.innerWidth)
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth * 1.1) // 10% 오차 허용
  })
})
