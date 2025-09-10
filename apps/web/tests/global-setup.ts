import { chromium, FullConfig } from '@playwright/test'

async function globalSetup(config: FullConfig) {
  const { baseURL } = config.projects[0].use
  
  console.log('🚀 Starting global test setup...')
  
  // Launch browser for setup
  const browser = await chromium.launch()
  const page = await browser.newPage({
    baseURL,
  })

  try {
    // Health check - wait for the application to be ready
    console.log('⏳ Waiting for application to be ready...')
    let attempts = 0
    const maxAttempts = 30 // 30 seconds
    
    while (attempts < maxAttempts) {
      try {
        const response = await page.goto('/api/health', {
          waitUntil: 'networkidle',
          timeout: 2000
        })
        
        if (response?.ok()) {
          const healthData = await response.json()
          console.log('✅ Health check passed:', healthData.status)
          break
        }
      } catch {
        // Continue retrying
      }
      
      attempts++
      await page.waitForTimeout(1000)
      
      if (attempts === maxAttempts) {
        console.warn('⚠️ Health check failed, proceeding anyway...')
      }
    }

    // Pre-warm authentication
    console.log('🔐 Pre-warming authentication...')
    try {
      await page.goto('/enter')
      await page.waitForSelector('input[type="password"]', { timeout: 5000 })
      console.log('✅ Authentication page loaded')
    } catch (error) {
      console.warn('⚠️ Authentication pre-warm failed:', error)
    }

    // Clear any existing sessions
    await page.context().clearCookies()
    
    console.log('✅ Global setup completed')

  } catch (error) {
    console.error('❌ Global setup failed:', error)
    throw error
  } finally {
    await page.close()
    await browser.close()
  }
}

export default globalSetup