import { useEffect, useCallback } from 'react';
import { useMonitoring } from '@/lib/monitoring';

interface PerformanceMonitoringOptions {
  trackPageLoad?: boolean;
  trackUserInteractions?: boolean;
  trackApiCalls?: boolean;
  trackLongTasks?: boolean;
}

export function usePerformanceMonitoring(options: PerformanceMonitoringOptions = {}) {
  const {
    trackPageLoad = true,
    trackUserInteractions = true,
    trackApiCalls = true,
    trackLongTasks = true,
  } = options;

  const { recordMetric, trackApiCall, trackUserInteraction } = useMonitoring();

  // Track page load performance
  useEffect(() => {
    if (!trackPageLoad || typeof window === 'undefined') return;

    const trackPageLoadPerformance = () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation) {
        recordMetric({
          type: 'pageLoad',
          name: 'page_load_complete',
          duration: navigation.loadEventEnd - navigation.loadEventStart,
          url: window.location.href,
          metadata: {
            domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
            firstByte: navigation.responseStart - navigation.requestStart,
            dns: navigation.domainLookupEnd - navigation.domainLookupStart,
            tcp: navigation.connectEnd - navigation.connectStart,
            ssl: navigation.secureConnectionStart > 0 ? navigation.connectEnd - navigation.secureConnectionStart : 0,
          },
        });
      }
    };

    if (document.readyState === 'complete') {
      trackPageLoadPerformance();
    } else {
      window.addEventListener('load', trackPageLoadPerformance);
      return () => window.removeEventListener('load', trackPageLoadPerformance);
    }
  }, [trackPageLoad, recordMetric]);

  // Track user interactions
  useEffect(() => {
    if (!trackUserInteractions || typeof window === 'undefined') return;

    const trackClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (target) {
        trackUserInteraction('click', target.tagName.toLowerCase(), 0);
      }
    };

    const trackScroll = () => {
      trackUserInteraction('scroll', 'window', 0);
    };

    const trackResize = () => {
      trackUserInteraction('resize', 'window', 0);
    };

    window.addEventListener('click', trackClick);
    window.addEventListener('scroll', trackScroll, { passive: true });
    window.addEventListener('resize', trackResize);

    return () => {
      window.removeEventListener('click', trackClick);
      window.removeEventListener('scroll', trackScroll);
      window.removeEventListener('resize', trackResize);
    };
  }, [trackUserInteractions, trackUserInteraction]);

  // Track API calls
  const trackApiCallWrapper = useCallback((url: string, method: string, duration: number, status: number) => {
    if (trackApiCalls) {
      trackApiCall(url, method, duration, status);
    }
  }, [trackApiCalls, trackApiCall]);

  // Track long tasks
  useEffect(() => {
    if (!trackLongTasks || typeof window === 'undefined' || !('PerformanceObserver' in window)) return;

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.duration > 50) { // Tasks longer than 50ms
          recordMetric({
            type: 'userInteraction',
            name: 'long_task',
            duration: entry.duration,
            url: window.location.href,
            metadata: {
              startTime: entry.startTime,
              type: 'long_task',
              name: entry.name,
            },
          });
        }
      }
    });

    observer.observe({ entryTypes: ['longtask'] });

    return () => observer.disconnect();
  }, [trackLongTasks, recordMetric]);

  return {
    trackApiCall: trackApiCallWrapper,
  };
}

// Hook for tracking specific component performance
export function useComponentPerformance(componentName: string) {
  const { recordMetric } = useMonitoring();

  const trackRender = useCallback((renderTime: number) => {
    recordMetric({
      type: 'userInteraction',
      name: 'component_render',
      duration: renderTime,
      url: typeof window !== 'undefined' ? window.location.href : '',
      metadata: {
        component: componentName,
        type: 'render',
      },
    });
  }, [componentName, recordMetric]);

  const trackInteraction = useCallback((action: string, duration: number = 0) => {
    recordMetric({
      type: 'userInteraction',
      name: 'component_interaction',
      duration,
      url: typeof window !== 'undefined' ? window.location.href : '',
      metadata: {
        component: componentName,
        action,
        type: 'interaction',
      },
    });
  }, [componentName, recordMetric]);

  return {
    trackRender,
    trackInteraction,
  };
}
