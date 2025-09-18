'use client'

import { useState, useEffect } from 'react'
import { m, AnimatePresence } from '@/lib/motion'
import { Home, Search, Filter, Grid, Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { cn } from '@/lib/utils'

interface MobileNavProps {
  currentPath?: string
  onNavigate?: (path: string) => void
  filterCount?: number
  className?: string
}

interface NavItem {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  path: string
  badge?: number
}

/**
 * Mobile-optimized bottom navigation with iOS-style design
 * Includes haptic feedback simulation and smooth animations
 */
export function MobileNav({ 
  currentPath = '/', 
  onNavigate, 
  filterCount = 0,
  className 
}: MobileNavProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)
  const prefersReducedMotion = useReducedMotion()

  const navItems: NavItem[] = [
    {
      id: 'home',
      label: 'Home',
      icon: Home,
      path: '/'
    },
    {
      id: 'search',
      label: 'Search',
      icon: Search,
      path: '/search'
    },
    {
      id: 'filter',
      label: 'Filter',
      icon: Filter,
      path: '/filter',
      badge: filterCount > 0 ? filterCount : undefined
    },
    {
      id: 'grid',
      label: 'View',
      icon: Grid,
      path: '/view'
    },
    {
      id: 'menu',
      label: 'Menu',
      icon: Menu,
      path: '/menu'
    }
  ]

  // Auto-hide on scroll
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      const isScrollingDown = currentScrollY > lastScrollY
      const shouldHide = isScrollingDown && currentScrollY > 100

      setIsVisible(!shouldHide)
      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY])

  // Simulate haptic feedback
  const simulateHaptic = () => {
    // In a real app, you might use the Vibration API
    if ('vibrate' in navigator) {
      navigator.vibrate(10)
    }
  }

  const handleNavClick = (item: NavItem) => {
    simulateHaptic()
    
    if (item.id === 'menu') {
      setMenuOpen(true)
    } else {
      onNavigate?.(item.path)
    }
  }

  return (
    <>
      {/* Bottom Navigation Bar */}
      <AnimatePresence>
        {isVisible && (
          <m.div
            initial={prefersReducedMotion ? {} : { y: 100, opacity: 0 }}
            animate={prefersReducedMotion ? {} : { y: 0, opacity: 1 }}
            exit={prefersReducedMotion ? {} : { y: 100, opacity: 0 }}
            transition={prefersReducedMotion ? { duration: 0 } : {
              duration: 0.3,
              ease: 'easeOut'
            }}
            className={cn(
              'fixed bottom-0 left-0 right-0 z-50 lg:hidden',
              'bg-background/80 backdrop-blur-xl border-t border-border',
              'safe-area-padding-bottom', // For devices with home indicator
              className
            )}
          >
            <div className="flex items-center justify-around px-2 py-2">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = currentPath === item.path
                
                return (
                  <Button
                    key={item.id}
                    variant="ghost"
                    size="sm"
                    onClick={() => handleNavClick(item)}
                    className={cn(
                      'flex flex-col items-center gap-1 h-auto py-2 px-3 rounded-xl',
                      'transition-colors duration-200 relative',
                      isActive 
                        ? 'text-primary bg-primary/10' 
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    )}
                  >
                    <div className="relative">
                      <Icon 
                        className={cn(
                          'w-5 h-5 transition-transform duration-200',
                          isActive && !prefersReducedMotion && 'scale-110'
                        )} 
                      />
                      
                      {/* Badge for filter count */}
                      {item.badge && (
                        <Badge 
                          variant="destructive" 
                          className="absolute -top-2 -right-2 w-5 h-5 p-0 text-xs flex items-center justify-center"
                        >
                          {item.badge}
                        </Badge>
                      )}
                      
                      {/* Active indicator */}
                      {isActive && (
                        <m.div
                          layoutId="mobile-nav-indicator"
                          className="absolute -bottom-1 left-1/2 w-1 h-1 bg-primary rounded-full -translate-x-1/2"
                          transition={prefersReducedMotion ? { duration: 0 } : {
                            type: "spring",
                            stiffness: 500,
                            damping: 30
                          }}
                        />
                      )}
                    </div>
                    
                    <span className={cn(
                      'text-xs font-medium transition-colors duration-200',
                      isActive ? 'text-primary' : 'text-muted-foreground'
                    )}>
                      {item.label}
                    </span>
                  </Button>
                )
              })}
            </div>
          </m.div>
        )}
      </AnimatePresence>

      {/* Mobile Menu Sheet */}
      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent 
          side="bottom" 
          className="rounded-t-2xl border-t-2 max-h-[90vh] overflow-y-auto"
        >
          <SheetHeader className="pb-4">
            <div className="flex items-center justify-between">
              <SheetTitle>Menu</SheetTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMenuOpen(false)}
                className="p-1 h-auto"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </SheetHeader>
          
          <div className="space-y-4">
            {/* Quick Actions */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Quick Actions
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  className="h-auto py-4 flex flex-col gap-2"
                  onClick={() => {
                    onNavigate?.('/featured')
                    setMenuOpen(false)
                  }}
                >
                  <Grid className="w-5 h-5" />
                  <span className="text-sm">Featured</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-auto py-4 flex flex-col gap-2"
                  onClick={() => {
                    onNavigate?.('/recent')
                    setMenuOpen(false)
                  }}
                >
                  <Search className="w-5 h-5" />
                  <span className="text-sm">Recent</span>
                </Button>
              </div>
            </div>

            {/* Categories */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Categories
              </h4>
              <div className="space-y-2">
                {['Free Content', 'Premium', 'New Releases', 'Popular'].map((category) => (
                  <Button
                    key={category}
                    variant="ghost"
                    className="w-full justify-start h-auto py-3"
                    onClick={() => {
                      onNavigate?.(`/category/${category.toLowerCase().replace(' ', '-')}`)
                      setMenuOpen(false)
                    }}
                  >
                    {category}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}

/**
 * Safe area padding utility for devices with home indicators
 */
export function SafeAreaProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Add CSS custom properties for safe area
    const updateSafeArea = () => {
      const safeAreaTop = getComputedStyle(document.documentElement).getPropertyValue('--sat') || '0px'
      const safeAreaBottom = getComputedStyle(document.documentElement).getPropertyValue('--sab') || '0px'
      
      document.documentElement.style.setProperty('--safe-area-top', safeAreaTop)
      document.documentElement.style.setProperty('--safe-area-bottom', safeAreaBottom)
    }

    updateSafeArea()
    window.addEventListener('resize', updateSafeArea)
    
    return () => window.removeEventListener('resize', updateSafeArea)
  }, [])

  return <>{children}</>
}