'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

interface UseIntersectionObserverOptions extends IntersectionObserverInit {
  freezeOnceVisible?: boolean
  triggerOnce?: boolean
}

/**
 * High-performance intersection observer hook
 * Optimized for Core Web Vitals and battery efficiency
 */
export function useIntersectionObserver<T extends Element = HTMLDivElement>(
  options: UseIntersectionObserverOptions = {}
) {
  const {
    threshold = 0.1,
    root = null,
    rootMargin = '50px', // Preload 50px before element is visible
    freezeOnceVisible = false,
    triggerOnce = false,
    ...rest
  } = options

  const elementRef = useRef<T>(null)
  const [isIntersecting, setIsIntersecting] = useState(false)
  const [hasIntersected, setHasIntersected] = useState(false)
  const observerRef = useRef<IntersectionObserver | undefined>(undefined)

  // Cleanup observer on unmount or option changes
  const cleanupObserver = useCallback(() => {
    if (observerRef.current) {
      observerRef.current.disconnect()
      observerRef.current = undefined
    }
  }, [])

  // Create intersection observer with performance optimizations
  useEffect(() => {
    if (!('IntersectionObserver' in window)) {
      // Fallback for unsupported browsers
      setIsIntersecting(true)
      return
    }

    const element = elementRef.current
    if (!element) return

    // Don't observe if already triggered and triggerOnce is enabled
    if (triggerOnce && hasIntersected) return

    cleanupObserver()

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isVisible = entry.isIntersecting

        setIsIntersecting(isVisible)
        
        if (isVisible) {
          setHasIntersected(true)
          
          // Disconnect observer if freezeOnceVisible or triggerOnce
          if (freezeOnceVisible || triggerOnce) {
            observer.disconnect()
          }
        }
      },
      {
        threshold,
        root,
        rootMargin,
        ...rest
      }
    )

    observer.observe(element)
    observerRef.current = observer

    return () => {
      observer.disconnect()
    }
  }, [threshold, root, rootMargin, freezeOnceVisible, triggerOnce, hasIntersected, cleanupObserver, rest])

  // Cleanup on unmount
  useEffect(() => {
    return cleanupObserver
  }, [cleanupObserver])

  return {
    elementRef,
    isIntersecting,
    hasIntersected,
    isVisible: isIntersecting || hasIntersected
  }
}

/**
 * Specialized hook for preloading content with intelligent strategies
 */
export function useSmartPreload<T extends Element = HTMLDivElement>(
  preloadFn: () => Promise<void> | void,
  options: UseIntersectionObserverOptions & {
    enabled?: boolean
    priority?: 'high' | 'low' | 'auto'
    connectionType?: 'fast' | 'slow' | 'auto'
  } = {}
) {
  const {
    enabled = true,
    priority = 'auto',
    connectionType = 'auto',
    rootMargin = '200px', // Start preloading 200px before visibility
    ...observerOptions
  } = options

  const [isPreloading, setIsPreloading] = useState(false)
  const [isPreloaded, setIsPreloaded] = useState(false)
  const hasPreloadedRef = useRef(false)

  const { elementRef, isIntersecting } = useIntersectionObserver<T>({
    rootMargin,
    triggerOnce: true,
    ...observerOptions
  })

  // Detect connection type for smart preloading
  const shouldPreload = useCallback(() => {
    if (!enabled || hasPreloadedRef.current) return false

    // Respect user's data saver preference
    if ('connection' in navigator) {
      const connection = (navigator as { connection: { saveData?: boolean; effectiveType?: string } }).connection
      if (connection?.saveData) return false
      
      // Auto-detect connection quality
      if (connectionType === 'auto') {
        const effectiveType = connection?.effectiveType
        if (effectiveType === 'slow-2g' || effectiveType === '2g') return false
      }
    }

    // Battery API disabled due to Playwright compatibility issues
    // getBattery() causes "Illegal invocation" errors in test environments
    // Feature removed for stability - preloading always allowed based on connection only

    return true
  }, [enabled, connectionType])

  // Preload when element comes into view
  useEffect(() => {
    if (!isIntersecting || !shouldPreload()) return

    let isMounted = true

    const executePreload = async () => {
      if (hasPreloadedRef.current) return
      
      setIsPreloading(true)
      hasPreloadedRef.current = true

      try {
        await preloadFn()
        
        if (isMounted) {
          setIsPreloaded(true)
        }
      } catch (error) {
        console.warn('Preload failed:', error)
      } finally {
        if (isMounted) {
          setIsPreloading(false)
        }
      }
    }

    // Prioritize preloading based on priority setting
    if (priority === 'high') {
      executePreload()
    } else {
      // Use scheduler for low priority preloading
      const timeoutId = setTimeout(executePreload, priority === 'low' ? 500 : 100)
      return () => clearTimeout(timeoutId)
    }

    return () => {
      isMounted = false
    }
  }, [isIntersecting, shouldPreload, preloadFn, priority])

  return {
    elementRef,
    isIntersecting,
    isPreloading,
    isPreloaded,
    shouldPreload: shouldPreload()
  }
}