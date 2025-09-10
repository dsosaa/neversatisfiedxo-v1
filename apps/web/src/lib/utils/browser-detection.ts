'use client'

import { useState, useEffect } from 'react'

export interface BrowserInfo {
  isSafari: boolean
  isIOSSafari: boolean
  isMacOSSafari: boolean
  isChrome: boolean
  isFirefox: boolean
  isEdge: boolean
  userAgent: string
  supportsBackdropFilter: boolean
  supportsComplexAnimations: boolean
  supportsGlassMorphism: boolean
  supportsAdvancedCSS: boolean
  prefersSafeAnimations: boolean
  supportsVideoAutoplay: boolean
  browserVersion: string
  devicePixelRatio: number
}

/**
 * Hook to detect Safari browser and return browser-specific capabilities
 * Used for progressive enhancement and Safari compatibility fixes
 */
export function useBrowserDetection(): BrowserInfo {
  const [browserInfo, setBrowserInfo] = useState<BrowserInfo>({
    isSafari: false,
    isIOSSafari: false,
    isMacOSSafari: false,
    isChrome: false,
    isFirefox: false,
    isEdge: false,
    userAgent: '',
    supportsBackdropFilter: false,
    supportsComplexAnimations: false,
    supportsGlassMorphism: false,
    supportsAdvancedCSS: false,
    prefersSafeAnimations: false,
    supportsVideoAutoplay: false,
    browserVersion: '',
    devicePixelRatio: 1,
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    const userAgent = navigator.userAgent
    
    // Safari detection (must check before Chrome as Safari contains both strings)
    const isSafari = /Safari/.test(userAgent) && !/Chrome|Chromium/.test(userAgent)
    const isIOSSafari = /iPad|iPhone|iPod/.test(userAgent) && /Safari/.test(userAgent)
    const isMacOSSafari = isSafari && /Macintosh/.test(userAgent)
    
    // Other browser detection
    const isChrome = /Chrome|Chromium/.test(userAgent) && !/Edge/.test(userAgent)
    const isFirefox = /Firefox/.test(userAgent)
    const isEdge = /Edge/.test(userAgent)

    // Extract browser version
    let browserVersion = ''
    if (isSafari) {
      const safariVersion = userAgent.match(/Version\/([0-9.]+)/)
      browserVersion = safariVersion ? safariVersion[1] : ''
    } else if (isChrome) {
      const chromeVersion = userAgent.match(/Chrome\/([0-9.]+)/)
      browserVersion = chromeVersion ? chromeVersion[1] : ''
    }

    // Get device pixel ratio
    const devicePixelRatio = window.devicePixelRatio || 1

    // Enhanced feature detection for Safari compatibility
    const supportsBackdropFilter = CSS.supports('backdrop-filter', 'blur(1px)') && !isSafari
    const supportsComplexAnimations = !isSafari || (isSafari && devicePixelRatio <= 2)
    const supportsGlassMorphism = supportsBackdropFilter && CSS.supports('background-color', 'rgba(255,255,255,0.1)')
    const supportsAdvancedCSS = CSS.supports('transform', 'scale3d(1,1,1)') && CSS.supports('will-change', 'transform')
    
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const prefersSafeAnimations = prefersReducedMotion || isSafari
    
    // Video autoplay support detection (Safari requires user gesture for unmuted videos)
    const supportsVideoAutoplay = !isSafari || isIOSSafari // iOS Safari has different autoplay policies

    setBrowserInfo({
      isSafari,
      isIOSSafari,
      isMacOSSafari,
      isChrome,
      isFirefox,
      isEdge,
      userAgent,
      supportsBackdropFilter,
      supportsComplexAnimations,
      supportsGlassMorphism,
      supportsAdvancedCSS,
      prefersSafeAnimations,
      supportsVideoAutoplay,
      browserVersion,
      devicePixelRatio,
    })

    // Debug logging for development
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Enhanced Browser Detection:', {
        browser: isSafari ? 'Safari' : isChrome ? 'Chrome' : 'Other',
        version: browserVersion,
        isSafari,
        isIOSSafari,
        isMacOSSafari,
        isChrome,
        devicePixelRatio,
        capabilities: {
          supportsBackdropFilter,
          supportsComplexAnimations,
          supportsGlassMorphism,
          supportsAdvancedCSS,
          prefersSafeAnimations,
          supportsVideoAutoplay
        },
        userAgent: userAgent.substring(0, 100) + '...'
      })
    }
  }, [])

  return browserInfo
}

/**
 * Enhanced utility function to get Safari-safe CSS class names
 * Uses progressive enhancement instead of removing features entirely
 */
export function getSafariSafeClasses(
  standardClasses: string,
  browserInfo: BrowserInfo,
  safariClasses?: string
): string {
  if (browserInfo.isSafari && safariClasses) {
    return safariClasses
  }
  
  if (browserInfo.isSafari) {
    // Progressive enhancement for Safari - replace instead of remove
    return standardClasses
      .replace(/backdrop-blur-(\w+)/g, 'bg-black/20 border border-white/10') // Glass effect fallback
      .replace(/bg-gradient-radial/g, 'bg-gradient-to-br from-gray-900 to-black') // Radial gradient fallback
      .replace(/animate-bounce/g, browserInfo.prefersSafeAnimations ? '' : 'animate-pulse') // Gentler animation
      .replace(/animate-spin/g, browserInfo.prefersSafeAnimations ? '' : 'animate-pulse') // Loading fallback
      .replace(/hover:scale-\[[\d.]+\]/g, 'hover:opacity-90') // Scale fallback
      .replace(/glass(?:\s|$)/g, 'bg-black/30 border border-white/5 ') // Glass morphism fallback
      .trim()
  }
  
  return standardClasses
}

/**
 * Get browser-appropriate animation classes
 */
export function getBrowserSafeAnimations(
  standardAnimations: string,
  browserInfo: BrowserInfo,
  safariAnimations?: string
): string {
  if (browserInfo.prefersSafeAnimations) {
    return safariAnimations || standardAnimations
      .replace(/animate-\w+/g, 'transition-all duration-200')
      .replace(/hover:scale-\[[\d.]+\]/g, 'hover:opacity-90')
  }
  
  return standardAnimations
}

/**
 * Get browser-appropriate backdrop/glass effect classes
 */
export function getBrowserSafeBackdrop(
  glassClasses: string,
  browserInfo: BrowserInfo
): string {
  if (!browserInfo.supportsGlassMorphism) {
    return glassClasses
      .replace(/backdrop-blur-\w+/g, '')
      .replace(/bg-\w+\/[\d.]+/g, 'bg-black/40')
      .concat(' border border-white/10')
  }
  
  return glassClasses
}

/**
 * Conditional class application based on browser capabilities
 */
export function applyBrowserConditional(
  browserInfo: BrowserInfo,
  standardClasses: string,
  safariClasses?: string,
  chromeClasses?: string
): string {
  if (browserInfo.isSafari && safariClasses) {
    return safariClasses
  }
  
  if (browserInfo.isChrome && chromeClasses) {
    return chromeClasses
  }
  
  // Apply progressive enhancement for Safari
  if (browserInfo.isSafari) {
    return getSafariSafeClasses(standardClasses, browserInfo)
  }
  
  return standardClasses
}

/**
 * Check if current browser is Safari (server-side safe)
 */
export function isSafariUA(userAgent?: string): boolean {
  if (typeof window !== 'undefined') {
    userAgent = navigator.userAgent
  }
  
  if (!userAgent) return false
  
  return /Safari/.test(userAgent) && !/Chrome|Chromium/.test(userAgent)
}