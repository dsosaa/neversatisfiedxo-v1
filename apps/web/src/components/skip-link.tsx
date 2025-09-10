'use client'

/**
 * Skip to content link for screen readers and keyboard users
 * Allows users to bypass navigation and go directly to main content
 */
export function SkipLink() {
  return (
    <a
      href="#main-content"
      className="skip-to-content sr-only focus:not-sr-only"
    >
      Skip to main content
    </a>
  )
}

/**
 * Visual indicator that keyboard navigation is active
 * Helps sighted keyboard users understand the current focus state
 */
export function KeyboardNavigationIndicator() {
  return (
    <div
      className="fixed top-4 right-4 z-50 opacity-0 pointer-events-none transition-opacity duration-200 focus-within:opacity-100"
      role="status"
      aria-label="Keyboard navigation active"
    >
      <div className="bg-primary text-primary-foreground px-3 py-1 rounded-md text-sm font-medium">
        Keyboard Navigation Active
      </div>
    </div>
  )
}