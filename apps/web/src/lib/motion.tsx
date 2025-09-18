'use client'

import { LazyMotion, domAnimation } from 'framer-motion'
import type { ReactNode } from 'react'

/**
 * Optimized Motion Provider using LazyMotion for reduced bundle size
 * Only loads essential motion features (domAnimation) instead of full Framer Motion
 * 
 * Features included in domAnimation:
 * - Basic animations (animate, initial, exit, transition)
 * - Gesture animations (whileHover, whileTap, whileFocus, whileDrag)  
 * - AnimatePresence for enter/exit animations
 * - Transform and filter animations
 * 
 * Bundle size reduction: ~60% smaller than full framer-motion
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      {children}
    </LazyMotion>
  )
}

// Re-export optimized motion components
export { m, AnimatePresence, useReducedMotion } from 'framer-motion'
export type { Variants, Transition } from 'framer-motion'

/**
 * Performance-optimized motion presets
 * Respects user's reduced motion preferences
 */
export const motionPresets = {
  // Fade animations
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }
  },
  
  // Slide animations
  slideUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }
  },
  
  slideLeft: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
    transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }
  },
  
  // Scale animations
  scaleIn: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
    transition: { duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }
  },
  
  // Hover effects
  cardHover: {
    whileHover: { y: -4, transition: { duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] } },
    whileTap: { scale: 0.98, transition: { duration: 0.1 } }
  },
  
  buttonHover: {
    whileHover: { scale: 1.05, transition: { duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] } },
    whileTap: { scale: 0.95, transition: { duration: 0.1 } }
  }
}

/**
 * Utility function to conditionally apply motion based on reduced motion preference
 */
export function conditionalMotion(
  motionProps: Record<string, unknown>,
  prefersReducedMotion: boolean,
  fallbackProps: Record<string, unknown> = {}
) {
  return prefersReducedMotion ? fallbackProps : motionProps
}