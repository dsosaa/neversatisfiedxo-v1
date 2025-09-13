'use client'

import { useEffect, useState, useCallback } from 'react'

interface PerformanceMetrics {
  imageLoadTime: number
  videoLoadTime: number
  scrollPerformance: number
  memoryUsage: number
  connectionSpeed: string
  deviceType: string
  isHighDPI: boolean
}

interface PerformanceMonitorProps {
  onMetricsUpdate?: (metrics: PerformanceMetrics) => void
  enableLogging?: boolean
}

/**
 * Performance monitoring component for tracking image and video loading performance
 */
export function PerformanceMonitor({ onMetricsUpdate, enableLogging = false }: PerformanceMonitorProps) {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    imageLoadTime: 0,
    videoLoadTime: 0,
    scrollPerformance: 0,
    memoryUsage: 0,
    connectionSpeed: 'unknown',
    deviceType: 'unknown',
    isHighDPI: false
  })

  // Monitor image loading performance
  const measureImageLoadTime = useCallback((src: string): Promise<number> => {
    return new Promise((resolve) => {
      const startTime = performance.now()
      const img = new Image()
      
      img.onload = () => {
        const loadTime = performance.now() - startTime
        if (enableLogging) {
          console.log(`🖼️ Image loaded in ${loadTime.toFixed(2)}ms:`, src)
        }
        resolve(loadTime)
      }
      
      img.onerror = () => {
        const loadTime = performance.now() - startTime
        if (enableLogging) {
          console.warn(`❌ Image failed to load after ${loadTime.toFixed(2)}ms:`, src)
        }
        resolve(loadTime)
      }
      
      img.src = src
    })
  }, [enableLogging])

  // Monitor video loading performance
  const measureVideoLoadTime = useCallback((uid: string) => {
    return new Promise((resolve) => {
      const startTime = performance.now()
      const iframe = document.createElement('iframe')
      
      iframe.onload = () => {
        const loadTime = performance.now() - startTime
        if (enableLogging) {
          console.log(`🎥 Video loaded in ${loadTime.toFixed(2)}ms:`, uid)
        }
        resolve(loadTime)
      }
      
      iframe.onerror = () => {
        const loadTime = performance.now() - startTime
        if (enableLogging) {
          console.warn(`❌ Video failed to load after ${loadTime.toFixed(2)}ms:`, uid)
        }
        resolve(loadTime)
      }
      
      iframe.src = `https://iframe.videodelivery.net/${uid}`
      iframe.style.display = 'none'
      document.body.appendChild(iframe)
      
      // Clean up after measurement
      setTimeout(() => {
        document.body.removeChild(iframe)
      }, 1000)
    })
  }, [enableLogging])

  // Monitor scroll performance
  const measureScrollPerformance = useCallback(() => {
    let scrollStartTime = 0
    let scrollEndTime = 0
    let frameCount = 0

    const handleScrollStart = () => {
      scrollStartTime = performance.now()
      frameCount = 0
    }

    const handleScrollEnd = () => {
      scrollEndTime = performance.now()
      const scrollDuration = scrollEndTime - scrollStartTime
      const fps = frameCount / (scrollDuration / 1000)
      
      if (enableLogging) {
        console.log(`📜 Scroll performance: ${fps.toFixed(1)} FPS over ${scrollDuration.toFixed(2)}ms`)
      }
      
      setMetrics(prev => ({
        ...prev,
        scrollPerformance: fps
      }))
    }

    const handleScroll = () => {
      frameCount++
    }

    // Throttled scroll handlers
    let scrollTimeout: NodeJS.Timeout
    const throttledScrollStart = () => {
      clearTimeout(scrollTimeout)
      handleScrollStart()
    }

    const throttledScrollEnd = () => {
      clearTimeout(scrollTimeout)
      scrollTimeout = setTimeout(handleScrollEnd, 150)
    }

    const throttledScroll = () => {
      handleScroll()
    }

    window.addEventListener('scroll', throttledScrollStart, { passive: true })
    window.addEventListener('scroll', throttledScrollEnd, { passive: true })
    window.addEventListener('scroll', throttledScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', throttledScrollStart)
      window.removeEventListener('scroll', throttledScrollEnd)
      window.removeEventListener('scroll', throttledScroll)
      clearTimeout(scrollTimeout)
    }
  }, [enableLogging])

  // Get device and connection information
  const getDeviceInfo = useCallback(() => {
    const connection = (navigator as any).connection
    const isMobile = window.innerWidth < 768
    const isTablet = window.innerWidth < 1024
    const isHighDPI = window.devicePixelRatio > 1.5
    
    let deviceType = 'desktop'
    if (isMobile) deviceType = 'mobile'
    else if (isTablet) deviceType = 'tablet'
    
    let connectionSpeed = 'unknown'
    if (connection) {
      if (connection.effectiveType === '4g') connectionSpeed = '4g'
      else if (connection.effectiveType === '3g') connectionSpeed = '3g'
      else if (connection.effectiveType === '2g') connectionSpeed = '2g'
      else if (connection.effectiveType === 'slow-2g') connectionSpeed = 'slow-2g'
    }

    return {
      deviceType,
      connectionSpeed,
      isHighDPI
    }
  }, [])

  // Get memory usage (if available)
  const getMemoryUsage = useCallback(() => {
    if ('memory' in performance) {
      const memory = (performance as any).memory
      return Math.round(memory.usedJSHeapSize / 1024 / 1024) // MB
    }
    return 0
  }, [])

  // Update metrics
  const updateMetrics = useCallback(() => {
    const deviceInfo = getDeviceInfo()
    const memoryUsage = getMemoryUsage()
    
    setMetrics(prev => ({
      ...prev,
      ...deviceInfo,
      memoryUsage
    }))
  }, [getDeviceInfo, getMemoryUsage])

  // Initialize monitoring
  useEffect(() => {
    updateMetrics()
    
    // Set up scroll performance monitoring
    const cleanupScroll = measureScrollPerformance()
    
    // Update metrics periodically
    const interval = setInterval(updateMetrics, 5000)
    
    // Update on resize
    const handleResize = () => {
      setTimeout(updateMetrics, 100)
    }
    
    window.addEventListener('resize', handleResize)
    
    return () => {
      cleanupScroll()
      clearInterval(interval)
      window.removeEventListener('resize', handleResize)
    }
  }, [updateMetrics, measureScrollPerformance])

  // Notify parent component of metrics updates
  useEffect(() => {
    if (onMetricsUpdate) {
      onMetricsUpdate(metrics)
    }
  }, [metrics, onMetricsUpdate])

  // Expose measurement functions globally for use by other components
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).measureImageLoadTime = measureImageLoadTime
      // (window as any).measureVideoLoadTime = measureVideoLoadTime
    }
  }, [measureImageLoadTime, measureVideoLoadTime])

  return null // This component doesn't render anything
}

/**
 * Hook for accessing performance metrics
 */
export function usePerformanceMetrics() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null)

  const handleMetricsUpdate = useCallback((newMetrics: PerformanceMetrics) => {
    setMetrics(newMetrics)
  }, [])

  return { metrics, handleMetricsUpdate }
}

/**
 * Utility function to measure image load time
 */
export async function measureImagePerformance(src: string): Promise<number> {
  const startTime = performance.now()
  
  return new Promise((resolve) => {
    const img = new Image()
    
    img.onload = () => {
      const loadTime = performance.now() - startTime
      resolve(loadTime)
    }
    
    img.onerror = () => {
      const loadTime = performance.now() - startTime
      resolve(loadTime)
    }
    
    img.src = src
  })
}

/**
 * Utility function to measure video load time
 */
export async function measureVideoPerformance(uid: string): Promise<number> {
  const startTime = performance.now()
  
  return new Promise((resolve) => {
    const iframe = document.createElement('iframe')
    
    iframe.onload = () => {
      const loadTime = performance.now() - startTime
      document.body.removeChild(iframe)
      resolve(loadTime)
    }
    
    iframe.onerror = () => {
      const loadTime = performance.now() - startTime
      document.body.removeChild(iframe)
      resolve(loadTime)
    }
    
    iframe.src = `https://iframe.videodelivery.net/${uid}`
    iframe.style.display = 'none'
    document.body.appendChild(iframe)
  })
}
