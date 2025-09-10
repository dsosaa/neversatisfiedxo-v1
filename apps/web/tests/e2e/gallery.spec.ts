import { test, expect, Page } from '@playwright/test'

// Helper function to authenticate
async function authenticate(page: Page) {
  await page.goto('/enter')
  await page.fill('input[type="password"]', 'test-password')
  await page.click('button[type="submit"]')
  await expect(page).toHaveURL('/')
}

test.describe('Gallery Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies()
    await authenticate(page)
  })

  test('should display gallery page with trailers', async ({ page }) => {
    await page.goto('/')
    
    // Should have main heading
    await expect(page.locator('h1')).toContainText('neversatisfiedxo')
    
    // Should have some content or loading state
    await expect(page.locator('main')).toBeVisible()
  })

  test('should handle search functionality', async ({ page }) => {
    await page.goto('/')
    
    // Wait for any initial loading
    await page.waitForTimeout(1000)
    
    // Look for search input (if present)
    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]')
    if (await searchInput.count() > 0) {
      await searchInput.fill('test search')
      await page.keyboard.press('Enter')
      
      // Should update URL or show search results
      await page.waitForTimeout(500)
    }
  })

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    await page.goto('/')
    
    // Should still display main content
    await expect(page.locator('h1')).toBeVisible()
    await expect(page.locator('main')).toBeVisible()
  })

  test('should handle video player interaction', async ({ page }) => {
    await page.goto('/')
    
    // Look for video player elements
    const videoElements = page.locator('iframe[src*="videodelivery"], video')
    
    if (await videoElements.count() > 0) {
      const firstVideo = videoElements.first()
      await expect(firstVideo).toBeVisible()
      
      // Check if it has proper attributes
      if (await firstVideo.getAttribute('src')) {
        const src = await firstVideo.getAttribute('src')
        expect(src).toContain('videodelivery.net')
      }
    }
  })

  test('should navigate to individual video pages', async ({ page }) => {
    await page.goto('/')
    
    // Look for video links or cards
    const videoLinks = page.locator('a[href*="/video/"], [data-testid="video-card"]')
    
    if (await videoLinks.count() > 0) {
      const firstLink = videoLinks.first()
      await firstLink.click()
      
      // Should navigate to video page
      await expect(page.url()).toContain('/video/')
      
      // Should have video player or content
      await expect(page.locator('main')).toBeVisible()
    }
  })

  test('should load without JavaScript errors', async ({ page }) => {
    const consoleErrors: string[] = []
    
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })
    
    await page.goto('/')
    await page.waitForTimeout(2000)
    
    // Filter out expected errors (like network errors in test environment)
    const unexpectedErrors = consoleErrors.filter(error => 
      !error.includes('net::ERR_') &&
      !error.includes('Failed to fetch') &&
      !error.includes('localhost:8000') // MediaCMS backend not running in tests
    )
    
    expect(unexpectedErrors).toHaveLength(0)
  })

  test('should handle network errors gracefully', async ({ page }) => {
    // Block API requests to simulate network issues
    await page.route('**/api/trailers*', route => route.abort())
    
    await page.goto('/')
    
    // Should still render the page structure
    await expect(page.locator('h1')).toBeVisible()
    
    // Should show error state or loading state
    await expect(page.locator('main')).toBeVisible()
  })
})