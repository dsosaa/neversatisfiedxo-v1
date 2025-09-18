'use client'

import { useEffect, useRef, useState } from 'react'

interface TouchPosition {
  x: number
  y: number
}

interface SwipeGesture {
  direction: 'left' | 'right' | 'up' | 'down'
  distance: number
  velocity: number
}

interface UseTouchGesturesOptions {
  onSwipe?: (gesture: SwipeGesture) => void
  onTap?: (position: TouchPosition) => void
  onDoubleTap?: (position: TouchPosition) => void
  onLongPress?: (position: TouchPosition) => void
  onPinch?: (scale: number) => void
  swipeThreshold?: number
  longPressDelay?: number
  doubleTapDelay?: number
}

/**
 * Hook for handling touch gestures on mobile devices
 * Provides swipe, tap, double-tap, long press, and pinch detection
 */
export function useTouchGestures(options: UseTouchGesturesOptions = {}) {
  const {
    onSwipe,
    onTap,
    onDoubleTap,
    onLongPress,
    onPinch,
    swipeThreshold = 50,
    longPressDelay = 500,
    doubleTapDelay = 300
  } = options

  const elementRef = useRef<HTMLElement>(null)
  const touchStartRef = useRef<TouchPosition | null>(null)
  const touchEndRef = useRef<TouchPosition | null>(null)
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null)
  const lastTapRef = useRef<number>(0)
  const lastTouchDistanceRef = useRef<number>(0)

  const [isPressed, setIsPressed] = useState(false)
  const [isPinching, setIsPinching] = useState(false)

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    const getTouchPosition = (touch: Touch): TouchPosition => ({
      x: touch.clientX,
      y: touch.clientY
    })

    const getDistance = (touch1: Touch, touch2: Touch): number => {
      const dx = touch1.clientX - touch2.clientX
      const dy = touch1.clientY - touch2.clientY
      return Math.sqrt(dx * dx + dy * dy)
    }

    const getSwipeDirection = (start: TouchPosition, end: TouchPosition): SwipeGesture['direction'] => {
      const dx = end.x - start.x
      const dy = end.y - start.y
      const absDx = Math.abs(dx)
      const absDy = Math.abs(dy)

      if (absDx > absDy) {
        return dx > 0 ? 'right' : 'left'
      } else {
        return dy > 0 ? 'down' : 'up'
      }
    }

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0]
      if (!touch) return

      touchStartRef.current = getTouchPosition(touch)
      setIsPressed(true)

      // Handle multiple touches (pinch)
      if (e.touches.length === 2) {
        setIsPinching(true)
        lastTouchDistanceRef.current = getDistance(e.touches[0], e.touches[1])
        return
      }

      // Start long press timer
      if (onLongPress) {
        longPressTimerRef.current = setTimeout(() => {
          if (touchStartRef.current && isPressed) {
            onLongPress(touchStartRef.current)
          }
        }, longPressDelay)
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      // Cancel long press on move
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current)
        longPressTimerRef.current = null
      }

      // Handle pinch gesture
      if (e.touches.length === 2 && isPinching && onPinch) {
        e.preventDefault()
        const currentDistance = getDistance(e.touches[0], e.touches[1])
        const scale = currentDistance / lastTouchDistanceRef.current
        onPinch(scale)
        lastTouchDistanceRef.current = currentDistance
      }
    }

    const handleTouchEnd = (e: TouchEvent) => {
      setIsPressed(false)
      setIsPinching(false)

      // Clear long press timer
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current)
        longPressTimerRef.current = null
      }

      const touch = e.changedTouches[0]
      if (!touch || !touchStartRef.current) return

      touchEndRef.current = getTouchPosition(touch)
      
      const dx = touchEndRef.current.x - touchStartRef.current.x
      const dy = touchEndRef.current.y - touchStartRef.current.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      const timeDelta = Date.now() - (e.timeStamp || Date.now())
      const velocity = distance / timeDelta

      // Swipe detection
      if (distance > swipeThreshold && onSwipe) {
        const direction = getSwipeDirection(touchStartRef.current!, touchEndRef.current)
        onSwipe({ direction, distance, velocity })
        return
      }

      // Tap detection (small movement threshold)
      if (distance < 10) {
        const now = Date.now()
        const timeSinceLastTap = now - lastTapRef.current

        // Double tap detection
        if (timeSinceLastTap < doubleTapDelay && onDoubleTap) {
          onDoubleTap(touchEndRef.current)
          lastTapRef.current = 0 // Reset to prevent triple tap
        } else {
          // Single tap
          if (onTap) {
            // Small delay to detect potential double tap
            setTimeout(() => {
              if (now === lastTapRef.current && touchEndRef.current) {
                onTap(touchEndRef.current)
              }
            }, doubleTapDelay / 2)
          }
          lastTapRef.current = now
        }
      }

      touchStartRef.current = null
      touchEndRef.current = null
    }

    // Add event listeners
    element.addEventListener('touchstart', handleTouchStart, { passive: false })
    element.addEventListener('touchmove', handleTouchMove, { passive: false })
    element.addEventListener('touchend', handleTouchEnd, { passive: false })

    // Cleanup
    return () => {
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchmove', handleTouchMove)
      element.removeEventListener('touchend', handleTouchEnd)
      
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current)
      }
    }
  }, [onSwipe, onTap, onDoubleTap, onLongPress, onPinch, swipeThreshold, longPressDelay, doubleTapDelay, isPressed, isPinching])

  return {
    ref: elementRef,
    isPressed,
    isPinching
  }
}

/**
 * Hook for pull-to-refresh functionality
 */
export function usePullToRefresh(onRefresh: () => Promise<void> | void, threshold = 80) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const [isPulling, setIsPulling] = useState(false)

  const { ref } = useTouchGestures({
    onSwipe: async (gesture) => {
      if (gesture.direction === 'down' && gesture.distance > threshold && window.scrollY === 0) {
        setIsRefreshing(true)
        setIsPulling(false)
        setPullDistance(0)
        
        try {
          await onRefresh()
        } finally {
          setIsRefreshing(false)
        }
      }
    }
  })

  useEffect(() => {
    const element = ref.current
    if (!element) return

    let startY = 0
    let currentY = 0

    const handleTouchStart = (e: TouchEvent) => {
      if (window.scrollY !== 0 || isRefreshing) return
      startY = e.touches[0].clientY
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (window.scrollY !== 0 || isRefreshing) return
      
      currentY = e.touches[0].clientY
      const distance = currentY - startY

      if (distance > 0 && distance < threshold * 2) {
        e.preventDefault()
        setIsPulling(true)
        setPullDistance(Math.min(distance, threshold * 1.5))
      }
    }

    const handleTouchEnd = () => {
      setIsPulling(false)
      setPullDistance(0)
    }

    element.addEventListener('touchstart', handleTouchStart, { passive: false })
    element.addEventListener('touchmove', handleTouchMove, { passive: false })
    element.addEventListener('touchend', handleTouchEnd, { passive: false })

    return () => {
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchmove', handleTouchMove)
      element.removeEventListener('touchend', handleTouchEnd)
    }
  }, [ref, threshold, isRefreshing])

  return {
    ref,
    isRefreshing,
    pullDistance,
    isPulling,
    isAtThreshold: pullDistance >= threshold
  }
}