import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Start fresh for each test
    await page.context().clearCookies()
    await page.goto('/')
  })

  test('should redirect unauthenticated users to enter page', async ({ page }) => {
    await expect(page).toHaveURL('/enter')
    await expect(page.locator('h1')).toContainText('Enter Password')
  })

  test('should show error for incorrect password', async ({ page }) => {
    await page.goto('/enter')
    
    // Try with wrong password
    await page.fill('input[type="password"]', 'wrong-password')
    await page.click('button[type="submit"]')
    
    await expect(page.locator('[role="alert"]')).toContainText('Incorrect password')
  })

  test('should authenticate with correct password', async ({ page }) => {
    await page.goto('/enter')
    
    // Use the test password
    await page.fill('input[type="password"]', 'test-password')
    await page.click('button[type="submit"]')
    
    // Should redirect to home page
    await expect(page).toHaveURL('/')
    await expect(page.locator('h1')).toContainText('neversatisfiedxo')
  })

  test('should maintain session after authentication', async ({ page }) => {
    // First authenticate
    await page.goto('/enter')
    await page.fill('input[type="password"]', 'test-password')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL('/')

    // Reload page - should stay authenticated
    await page.reload()
    await expect(page).toHaveURL('/')
  })

  test('should handle rate limiting', async ({ page }) => {
    await page.goto('/enter')

    // Make multiple failed attempts
    for (let i = 0; i < 6; i++) {
      await page.fill('input[type="password"]', 'wrong-password')
      await page.click('button[type="submit"]')
      await page.waitForTimeout(100)
    }

    // Should show rate limit message
    await expect(page.locator('[role="alert"]')).toContainText('too many')
  })

  test('should logout successfully', async ({ page, context }) => {
    // First authenticate
    await page.goto('/enter')
    await page.fill('input[type="password"]', 'test-password')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL('/')

    // Clear cookies to simulate logout
    await context.clearCookies()
    
    // Try to access protected route
    await page.goto('/')
    await expect(page).toHaveURL('/enter')
  })
})