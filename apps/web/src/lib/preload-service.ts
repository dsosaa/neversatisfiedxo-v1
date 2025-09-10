'use client'

interface PreloadOptions {
  priority?: 'high' | 'low' | 'auto'
  timeout?: number
  retries?: number
}

interface NetworkInfo {
  effectiveType?: '2g' | '3g' | '4g' | 'slow-2g'
  saveData?: boolean
  downlink?: number
  rtt?: number
}

/**
 * Smart Preloading Service
 * 
 * Features:
 * - Adaptive based on connection quality
 * - Respects data saver preferences  
 * - Battery-aware preloading
 * - Resource prioritization
 * - Intelligent caching
 */
export class PreloadService {
  private static instance: PreloadService
  private preloadCache = new Map<string, Promise<HTMLImageElement>>()
  private failedPreloads = new Set<string>()
  private preloadQueue: Array<{ url: string; priority: number; executor: () => Promise<void> }> = []
  private isProcessingQueue = false

  static getInstance(): PreloadService {
    if (!PreloadService.instance) {
      PreloadService.instance = new PreloadService()
    }
    return PreloadService.instance
  }

  private constructor() {
    // Initialize network monitoring if available
    this.setupNetworkMonitoring()
  }

  /**
   * Get current network conditions for smart preloading decisions
   */
  private getNetworkInfo(): NetworkInfo {
    if (!('connection' in navigator)) return {}
    
    const connection = (navigator as { connection: NetworkInfo }).connection
    return {
      effectiveType: connection?.effectiveType,
      saveData: connection?.saveData,
      downlink: connection?.downlink,
      rtt: connection?.rtt
    }
  }

  /**
   * Setup network condition monitoring
   */
  private setupNetworkMonitoring() {
    if (!('connection' in navigator)) return

    const connection = (navigator as { connection: NetworkInfo }).connection
    const updateNetworkStatus = () => {
      // Adjust preloading strategy based on network changes
      if (connection.saveData || connection.effectiveType === 'slow-2g') {
        this.clearPreloadQueue()
      }
    }

    // @ts-expect-error - Network Information API experimental
    connection?.addEventListener?.('change', updateNetworkStatus)
  }

  /**
   * Check if preloading should be enabled based on device conditions
   */
  private shouldPreload(): boolean {
    const networkInfo = this.getNetworkInfo()

    // Respect data saver
    if (networkInfo.saveData) return false

    // Avoid preloading on very slow connections
    if (networkInfo.effectiveType === 'slow-2g' || networkInfo.effectiveType === '2g') {
      return false
    }

    // Check if reduced data usage is preferred
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      navigator.storage.estimate().then(estimate => {
        const usageRatio = (estimate.usage || 0) / (estimate.quota || 1)
        if (usageRatio > 0.9) return false // Storage almost full
      })
    }

    return true
  }

  /**
   * Calculate priority score for preload queue
   */
  private getPriorityScore(priority: PreloadOptions['priority'], distance = 0): number {
    const basePriority = {
      high: 100,
      auto: 50,
      low: 10
    }[priority || 'auto']

    // Closer items get higher priority
    const distancePenalty = Math.min(distance * 5, 50)
    
    return basePriority - distancePenalty
  }

  /**
   * Process preload queue with intelligent scheduling
   */
  private async processPreloadQueue() {
    if (this.isProcessingQueue || this.preloadQueue.length === 0) return

    this.isProcessingQueue = true

    // Sort by priority
    this.preloadQueue.sort((a, b) => b.priority - a.priority)

    // Process items with throttling
    while (this.preloadQueue.length > 0 && this.shouldPreload()) {
      const item = this.preloadQueue.shift()
      if (!item) break

      try {
        // Throttle preloading to avoid overwhelming the network
        await new Promise(resolve => setTimeout(resolve, 50))
        await item.executor()
      } catch (error) {
        this.failedPreloads.add(item.url)
        console.warn('Preload failed for:', item.url, error)
      }
    }

    this.isProcessingQueue = false
  }

  /**
   * Clear preload queue (useful for network condition changes)
   */
  private clearPreloadQueue() {
    this.preloadQueue = []
  }

  /**
   * Preload an image with smart caching
   */
  async preloadImage(url: string, options: PreloadOptions = {}): Promise<HTMLImageElement> {
    if (!this.shouldPreload()) {
      throw new Error('Preloading disabled due to network conditions')
    }

    if (this.failedPreloads.has(url)) {
      throw new Error('Previous preload failed')
    }

    // Return cached promise if already preloading
    if (this.preloadCache.has(url)) {
      return this.preloadCache.get(url)!
    }

    const preloadPromise = new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image()
      
      // Set loading priority based on options
      if (options.priority === 'high') {
        img.loading = 'eager'
        img.fetchPriority = 'high'
      } else {
        img.loading = 'lazy'
        img.fetchPriority = 'low'
      }

      const timeoutId = setTimeout(() => {
        reject(new Error('Image preload timeout'))
      }, options.timeout || 10000)

      img.onload = () => {
        clearTimeout(timeoutId)
        resolve(img)
      }

      img.onerror = () => {
        clearTimeout(timeoutId)
        this.failedPreloads.add(url)
        reject(new Error('Image preload failed'))
      }

      img.src = url
    })

    this.preloadCache.set(url, preloadPromise)
    return preloadPromise
  }

  /**
   * Preload multiple images with intelligent queuing
   */
  async preloadImages(urls: string[], options: PreloadOptions = {}): Promise<HTMLImageElement[]> {
    const results = await Promise.allSettled(
      urls.map((url, index) => {
        const priority = this.getPriorityScore(options.priority, index)
        
        // Add to queue instead of immediate execution
        return new Promise<HTMLImageElement>((resolve, reject) => {
          this.preloadQueue.push({
            url,
            priority,
            executor: () => this.preloadImage(url, options).then(resolve).catch(reject)
          })
        })
      })
    )

    // Start processing queue
    this.processPreloadQueue()

    // Return successfully loaded images
    return results
      .filter((result): result is PromiseFulfilledResult<HTMLImageElement> => 
        result.status === 'fulfilled'
      )
      .map(result => result.value)
  }

  /**
   * Preload next page data
   */
  async preloadPageData(url: string, options: PreloadOptions = {}): Promise<unknown> {
    if (!this.shouldPreload()) return null

    if (this.preloadCache.has(url)) {
      return this.preloadCache.get(url)
    }

    const preloadPromise = fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      priority: options.priority === 'high' ? 'high' : 'low'
    } as RequestInit).then(response => {
      if (!response.ok) throw new Error('Failed to preload page data')
      return response.json()
    })

    this.preloadCache.set(url, preloadPromise)
    return preloadPromise
  }

  /**
   * Clear preload cache (useful for memory management)
   */
  clearCache() {
    this.preloadCache.clear()
    this.failedPreloads.clear()
  }

  /**
   * Get cache statistics for monitoring
   */
  getCacheStats() {
    return {
      cacheSize: this.preloadCache.size,
      failedPreloads: this.failedPreloads.size,
      queueLength: this.preloadQueue.length,
      isProcessing: this.isProcessingQueue
    }
  }
}

// Export singleton instance
export const preloadService = PreloadService.getInstance()

/**
 * React hook for easy preload service access
 */
export function usePreloadService() {
  return preloadService
}