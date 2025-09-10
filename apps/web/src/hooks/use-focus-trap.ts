'use client'

import { useEffect, useRef } from 'react'

/**
 * Hook to trap focus within a container for accessibility
 * Used in modals, dropdowns, and other overlay components
 */
export function useFocusTrap<T extends HTMLElement = HTMLElement>(isActive: boolean = false) {
  const containerRef = useRef<T>(null)
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!isActive || !containerRef.current) return

    const container = containerRef.current
    
    // Store the currently focused element
    previouslyFocusedElementRef.current = document.activeElement as HTMLElement

    // Get all focusable elements within the container
    const getFocusableElements = () => {
      return container.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    }

    const focusableElements = getFocusableElements()
    const firstElement = focusableElements[0]

    // Focus the first element
    if (firstElement) {
      firstElement.focus()
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return

      const currentFocusableElements = getFocusableElements()
      const firstEl = currentFocusableElements[0]
      const lastEl = currentFocusableElements[currentFocusableElements.length - 1]

      if (event.shiftKey) {
        // Shift + Tab (backwards)
        if (document.activeElement === firstEl) {
          event.preventDefault()
          lastEl?.focus()
        }
      } else {
        // Tab (forwards)
        if (document.activeElement === lastEl) {
          event.preventDefault()
          firstEl?.focus()
        }
      }
    }

    // Add event listener
    document.addEventListener('keydown', handleKeyDown)

    // Cleanup function
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      
      // Return focus to previously focused element
      if (previouslyFocusedElementRef.current) {
        previouslyFocusedElementRef.current.focus()
      }
    }
  }, [isActive])

  return containerRef
}

/**
 * Hook to manage focus return when a component unmounts or closes
 */
export function useFocusReturn() {
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null)

  const storeFocus = () => {
    previouslyFocusedElementRef.current = document.activeElement as HTMLElement
  }

  const returnFocus = () => {
    if (previouslyFocusedElementRef.current) {
      previouslyFocusedElementRef.current.focus()
    }
  }

  useEffect(() => {
    return returnFocus
  }, [])

  return { storeFocus, returnFocus }
}