'use client'

import { useState, useCallback, useRef } from 'react'

interface UseImageFallbackOptions {
  maxRetries?: number
  retryDelay?: number
  fallbackUrls?: string[]
}

interface UseImageFallbackResult {
  currentUrl: string | null
  isLoading: boolean
  hasError: boolean
  retry: () => void
  handleLoad: () => void
  handleError: () => void
}

export function useImageFallback(
  primaryUrl: string | null,
  options: UseImageFallbackOptions = {}
): UseImageFallbackResult {
  const {
    maxRetries = 2,
    retryDelay = 1000,
    fallbackUrls = []
  } = options

  const [currentUrlIndex, setCurrentUrlIndex] = useState(0)
  const [retryCount, setRetryCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)

  // Build the complete URL list: primary + fallbacks
  const allUrls = [primaryUrl, ...fallbackUrls].filter(Boolean) as string[]
  const currentUrl = allUrls[currentUrlIndex] || null

  const handleLoad = useCallback(() => {
    setIsLoading(false)
    setHasError(false)
    setRetryCount(0)
  }, [])

  const handleError = useCallback(() => {
    setIsLoading(false)
    
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // If we have more URLs to try, move to the next one
    if (currentUrlIndex < allUrls.length - 1) {
      setCurrentUrlIndex(prev => prev + 1)
      setIsLoading(true)
      setHasError(false)
      return
    }

    // If we're on the last URL but haven't hit max retries, retry current URL
    if (retryCount < maxRetries) {
      timeoutRef.current = setTimeout(() => {
        setRetryCount(prev => prev + 1)
        setIsLoading(true)
        setHasError(false)
      }, retryDelay)
      return
    }

    // All URLs and retries exhausted
    setHasError(true)
  }, [currentUrlIndex, allUrls.length, retryCount, maxRetries, retryDelay])

  const retry = useCallback(() => {
    setCurrentUrlIndex(0)
    setRetryCount(0)
    setIsLoading(true)
    setHasError(false)
  }, [])

  return {
    currentUrl,
    isLoading,
    hasError,
    retry,
    handleLoad,
    handleError
  }
}