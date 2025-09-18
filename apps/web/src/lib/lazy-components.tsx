/**
 * Lazy loading components for better bundle splitting
 * Components that are not critical for initial page load
 */

import { lazy, Suspense, useState, useEffect } from 'react';
import type { ComponentType, ReactNode } from 'react';

// Lazy loading utility with error boundary
interface LazyWrapperProps {
  children: ReactNode;
  fallback?: ReactNode;
  error?: ReactNode;
}

function LazyWrapper({ children, fallback }: LazyWrapperProps) {
  return (
    <Suspense fallback={fallback || <div className="animate-pulse bg-muted rounded-lg h-32" />}>
      {children}
    </Suspense>
  );
}

// Video components removed - using direct iframe implementation in quick-preview

// Lazy load modal and overlay components
export const LazyQuickPreview = lazy(() => 
  import('@/components/quick-preview').then(module => ({ default: module.QuickPreview }))
);

// Performance monitoring and debug components removed for production cleanup

// Video player wrappers removed - using direct iframe implementation

import type { Trailer } from '@/lib/types'

interface QuickPreviewWrapperProps {
  trailer: Trailer | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LazyQuickPreviewWrapper(props: QuickPreviewWrapperProps) {
  // Only render if modal is open to save resources
  if (!props.open) return null;
  
  return (
    <LazyWrapper fallback={
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <LazyQuickPreview {...props} />
    </LazyWrapper>
  );
}

// Development only components removed for production cleanup

// Higher-order component for lazy loading any component
export function withLazyLoading<P extends object>(
  Component: ComponentType<P>,
  fallback?: ReactNode
) {
  const LazyComponent = lazy(() => Promise.resolve({ default: Component }));
  
  return function WrappedComponent(props: P) {
    return (
      <LazyWrapper fallback={fallback}>
        <LazyComponent {...props} />
      </LazyWrapper>
    );
  };
}

// Intersection Observer based lazy loading for below-the-fold components
export function useIntersectionLazyLoad(threshold: number = 0.1) {
  const [isVisible, setIsVisible] = useState(false);
  const [elementRef, setElementRef] = useState<Element | null>(null);
  
  useEffect(() => {
    if (!elementRef) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold }
    );
    
    observer.observe(elementRef);
    
    return () => observer.disconnect();
  }, [elementRef, threshold]);
  
  return { isVisible, ref: setElementRef };
}

// Viewport-based component lazy loading
interface ViewportLazyProps {
  children: ReactNode;
  fallback?: ReactNode;
  threshold?: number;
  rootMargin?: string;
}

export function ViewportLazy({ 
  children, 
  fallback, 
  threshold = 0.1, 
  rootMargin = '50px' 
}: ViewportLazyProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [ref, setRef] = useState<Element | null>(null);
  
  useEffect(() => {
    if (!ref) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin }
    );
    
    observer.observe(ref);
    
    return () => observer.disconnect();
  }, [ref, threshold, rootMargin]);
  
  return (
    <div ref={setRef}>
      {isVisible ? children : (fallback || <div className="animate-pulse bg-muted rounded-lg h-32" />)}
    </div>
  );
}

// Bundle analysis helper (development only)
export function BundleAnalysisInfo() {
  if (process.env.NODE_ENV !== 'development' || !process.env.__BUNDLE_ANALYZE__) {
    return null;
  }
  
  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-2 rounded text-xs font-mono z-50">
      Bundle Analysis Active
    </div>
  );
}