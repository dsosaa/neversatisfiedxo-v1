import { FullConfig } from '@playwright/test'

async function globalTeardown(_config: FullConfig) {
  console.log('🧹 Starting global test teardown...')
  
  try {
    // Clean up any test data or resources
    console.log('🗑️ Cleaning up test data...')
    
    // Add any cleanup logic here, such as:
    // - Removing test files
    // - Clearing test databases
    // - Resetting application state
    
    console.log('✅ Global teardown completed')
  } catch (error) {
    console.error('❌ Global teardown failed:', error)
    // Don't throw error to avoid failing the test suite
  }
}

export default globalTeardown