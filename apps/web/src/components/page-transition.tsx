'use client'

import { m, AnimatePresence } from '@/lib/motion'
import { usePathname } from 'next/navigation'
import { useReducedMotion } from '@/hooks/use-reduced-motion'

interface PageTransitionProps {
  children: React.ReactNode
  className?: string
}

/**
 * Premium page transition component with accessibility support
 * Provides smooth transitions between routes while respecting user preferences
 */
export function PageTransition({ children, className = '' }: PageTransitionProps) {
  const pathname = usePathname()
  const prefersReducedMotion = useReducedMotion()

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      <m.div
        key={pathname}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className={className}
      >
        {children}
      </m.div>
    </AnimatePresence>
  )
}

/**
 * Staggered container for animating child elements
 */
export function StaggerContainer({ 
  children, 
  className = '',
  staggerDelay = 0.05,
  delayChildren = 0
}: {
  children: React.ReactNode
  className?: string
  staggerDelay?: number
  delayChildren?: number
}) {
  const prefersReducedMotion = useReducedMotion()

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>
  }

  return (
    <m.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: staggerDelay,
            delayChildren: delayChildren
          }
        }
      }}
      className={className}
    >
      {children}
    </m.div>
  )
}

/**
 * Individual staggered item
 */
export function StaggerItem({ 
  children, 
  className = '' 
}: {
  children: React.ReactNode
  className?: string
}) {
  const prefersReducedMotion = useReducedMotion()

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>
  }

  return (
    <m.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { 
          opacity: 1, 
          y: 0, 
          transition: { duration: 0.3, ease: 'easeOut' } 
        }
      }}
      className={className}
    >
      {children}
    </m.div>
  )
}

/**
 * Slide in from direction animation
 */
export function SlideIn({ 
  children, 
  direction = 'up',
  delay = 0,
  duration = 0.4,
  className = ''
}: {
  children: React.ReactNode
  direction?: 'up' | 'down' | 'left' | 'right'
  delay?: number
  duration?: number
  className?: string
}) {
  const prefersReducedMotion = useReducedMotion()

  const directionOffsets = {
    up: { x: 0, y: 20 },
    down: { x: 0, y: -20 },
    left: { x: 20, y: 0 },
    right: { x: -20, y: 0 }
  }

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>
  }

  return (
    <m.div
      initial={{ 
        opacity: 0, 
        x: directionOffsets[direction].x,
        y: directionOffsets[direction].y 
      }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ duration, ease: 'easeOut', delay }}
      className={className}
    >
      {children}
    </m.div>
  )
}

/**
 * Scale and fade animation
 */
export function ScaleIn({ 
  children, 
  delay = 0,
  duration = 0.3,
  scale = 0.95,
  className = ''
}: {
  children: React.ReactNode
  delay?: number
  duration?: number
  scale?: number
  className?: string
}) {
  const prefersReducedMotion = useReducedMotion()

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>
  }

  return (
    <m.div
      initial={{ opacity: 0, scale }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration, ease: 'easeOut', delay }}
      className={className}
    >
      {children}
    </m.div>
  )
}

/**
 * Loading skeleton animation
 */
export function LoadingTransition({ 
  isLoading, 
  children, 
  fallback,
  className = ''
}: {
  isLoading: boolean
  children: React.ReactNode
  fallback: React.ReactNode
  className?: string
}) {
  const prefersReducedMotion = useReducedMotion()

  if (prefersReducedMotion) {
    return <div className={className}>{isLoading ? fallback : children}</div>
  }

  return (
    <div className={className}>
      <AnimatePresence mode="wait">
        {isLoading ? (
          <m.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {fallback}
          </m.div>
        ) : (
          <m.div
            key="content"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            {children}
          </m.div>
        )}
      </AnimatePresence>
    </div>
  )
}