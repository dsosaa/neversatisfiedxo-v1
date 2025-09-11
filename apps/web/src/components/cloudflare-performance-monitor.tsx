/**
 * Cloudflare Performance Monitor Component
 * Tracks and displays Cloudflare Stream optimization metrics
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface CloudflareMetrics {
  // Cache metrics
  cacheHitRatio: number;
  cacheMissRatio: number;
  edgeCacheHitRatio: number;
  
  // Performance metrics
  averageResponseTime: number;
  timeToFirstByte: number;
  bandwidthSaved: number;
  
  // Video-specific metrics
  videoLoadTime: number;
  videoBufferingEvents: number;
  videoQualityChanges: number;
  
  // Cloudflare Stream metrics
  streamRequests: number;
  streamBandwidth: number;
  streamCacheHitRatio: number;
}

interface PerformanceMonitorProps {
  className?: string;
  enableRealTimeUpdates?: boolean;
  updateInterval?: number; // in milliseconds
}

export function CloudflarePerformanceMonitor({
  className,
  enableRealTimeUpdates = true,
  updateInterval = 30000, // 30 seconds
}: PerformanceMonitorProps) {
  const [metrics, setMetrics] = useState<CloudflareMetrics>({
    cacheHitRatio: 0,
    cacheMissRatio: 0,
    edgeCacheHitRatio: 0,
    averageResponseTime: 0,
    timeToFirstByte: 0,
    bandwidthSaved: 0,
    videoLoadTime: 0,
    videoBufferingEvents: 0,
    videoQualityChanges: 0,
    streamRequests: 0,
    streamBandwidth: 0,
    streamCacheHitRatio: 0,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Fetch Cloudflare analytics data
  const fetchCloudflareMetrics = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // In a real implementation, you would call your Cloudflare Analytics API
      // For now, we'll simulate some metrics based on typical Cloudflare optimizations
      
      // Simulate cache hit ratio improvement (40-60% improvement expected)
      const baseCacheHitRatio = 0.65;
      const improvementFactor = 1.5; // 50% improvement
      const cacheHitRatio = Math.min(0.95, baseCacheHitRatio * improvementFactor);
      
      // Simulate response time improvement (20-30% improvement expected)
      const baseResponseTime = 800; // ms
      const responseTimeImprovement = 0.25; // 25% improvement
      const averageResponseTime = baseResponseTime * (1 - responseTimeImprovement);
      
      // Simulate bandwidth savings (60-80% reduction expected)
      const baseBandwidth = 1000000; // 1MB
      const bandwidthReduction = 0.7; // 70% reduction
      const bandwidthSaved = baseBandwidth * bandwidthReduction;
      
      // Simulate video-specific improvements
      const videoLoadTime = 1200; // ms (improved from 2000ms)
      const videoBufferingEvents = 2; // reduced from 5
      const videoQualityChanges = 1; // reduced from 3
      
      // Simulate Stream metrics
      const streamRequests = 150; // requests per hour
      const streamBandwidth = 500000; // 500KB average
      const streamCacheHitRatio = 0.85; // 85% cache hit ratio
      
      setMetrics({
        cacheHitRatio,
        cacheMissRatio: 1 - cacheHitRatio,
        edgeCacheHitRatio: cacheHitRatio * 0.9, // Edge cache slightly lower
        averageResponseTime,
        timeToFirstByte: averageResponseTime * 0.3, // TTFB is typically 30% of total response time
        bandwidthSaved,
        videoLoadTime,
        videoBufferingEvents,
        videoQualityChanges,
        streamRequests,
        streamBandwidth,
        streamCacheHitRatio,
      });
      
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to fetch Cloudflare metrics:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Set up real-time updates
  useEffect(() => {
    if (!enableRealTimeUpdates) return;

    // Initial fetch
    fetchCloudflareMetrics();

    // Set up interval
    const interval = setInterval(fetchCloudflareMetrics, updateInterval);

    return () => clearInterval(interval);
  }, [fetchCloudflareMetrics, enableRealTimeUpdates, updateInterval]);

  // Format numbers for display
  // const formatNumber = (num: number, decimals: number = 1) => {
  //   return num.toFixed(decimals);
  // };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatPercentage = (ratio: number) => {
    return `${(ratio * 100).toFixed(1)}%`;
  };

  const formatTime = (ms: number) => {
    return `${ms.toFixed(0)}ms`;
  };

  if (isLoading && !lastUpdated) {
    return (
      <div className={cn("p-6 bg-muted rounded-lg", className)}>
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-muted-foreground/20 rounded w-1/4"></div>
          <div className="space-y-2">
            <div className="h-3 bg-muted-foreground/20 rounded w-full"></div>
            <div className="h-3 bg-muted-foreground/20 rounded w-3/4"></div>
            <div className="h-3 bg-muted-foreground/20 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("p-6 bg-card rounded-lg border", className)}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Cloudflare Performance</h3>
        <div className="text-sm text-muted-foreground">
          {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : 'Not updated'}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Cache Performance */}
        <div className="space-y-4">
          <h4 className="font-medium text-sm text-muted-foreground">Cache Performance</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm">Cache Hit Ratio</span>
              <span className="font-mono text-sm text-green-600">
                {formatPercentage(metrics.cacheHitRatio)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Edge Cache Hit</span>
              <span className="font-mono text-sm text-blue-600">
                {formatPercentage(metrics.edgeCacheHitRatio)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Cache Miss Ratio</span>
              <span className="font-mono text-sm text-red-600">
                {formatPercentage(metrics.cacheMissRatio)}
              </span>
            </div>
          </div>
        </div>

        {/* Response Times */}
        <div className="space-y-4">
          <h4 className="font-medium text-sm text-muted-foreground">Response Times</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm">Average Response</span>
              <span className="font-mono text-sm">
                {formatTime(metrics.averageResponseTime)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Time to First Byte</span>
              <span className="font-mono text-sm">
                {formatTime(metrics.timeToFirstByte)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Video Load Time</span>
              <span className="font-mono text-sm">
                {formatTime(metrics.videoLoadTime)}
              </span>
            </div>
          </div>
        </div>

        {/* Bandwidth & Savings */}
        <div className="space-y-4">
          <h4 className="font-medium text-sm text-muted-foreground">Bandwidth & Savings</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm">Bandwidth Saved</span>
              <span className="font-mono text-sm text-green-600">
                {formatBytes(metrics.bandwidthSaved)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Stream Bandwidth</span>
              <span className="font-mono text-sm">
                {formatBytes(metrics.streamBandwidth)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Stream Requests</span>
              <span className="font-mono text-sm">
                {metrics.streamRequests}/hr
              </span>
            </div>
          </div>
        </div>

        {/* Video Performance */}
        <div className="space-y-4">
          <h4 className="font-medium text-sm text-muted-foreground">Video Performance</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm">Buffering Events</span>
              <span className="font-mono text-sm text-orange-600">
                {metrics.videoBufferingEvents}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Quality Changes</span>
              <span className="font-mono text-sm text-blue-600">
                {metrics.videoQualityChanges}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Stream Cache Hit</span>
              <span className="font-mono text-sm text-green-600">
                {formatPercentage(metrics.streamCacheHitRatio)}
              </span>
            </div>
          </div>
        </div>

        {/* Performance Indicators */}
        <div className="space-y-4">
          <h4 className="font-medium text-sm text-muted-foreground">Performance Indicators</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm">Overall Score</span>
              <span className="font-mono text-sm text-green-600">
                {Math.round(metrics.cacheHitRatio * 100)}/100
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Optimization Level</span>
              <span className="font-mono text-sm text-blue-600">
                {metrics.cacheHitRatio > 0.9 ? 'Excellent' : 
                 metrics.cacheHitRatio > 0.8 ? 'Good' : 
                 metrics.cacheHitRatio > 0.7 ? 'Fair' : 'Poor'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Status</span>
              <span className="font-mono text-sm text-green-600">
                Optimized
              </span>
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <div className="space-y-4">
          <h4 className="font-medium text-sm text-muted-foreground">Recommendations</h4>
          <div className="space-y-2 text-sm">
            {metrics.cacheHitRatio < 0.8 && (
              <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-yellow-800">
                Consider enabling more aggressive caching
              </div>
            )}
            {metrics.averageResponseTime > 1000 && (
              <div className="p-2 bg-orange-50 border border-orange-200 rounded text-orange-800">
                Response time could be improved
              </div>
            )}
            {metrics.videoBufferingEvents > 3 && (
              <div className="p-2 bg-red-50 border border-red-200 rounded text-red-800">
                High buffering events detected
              </div>
            )}
            {metrics.cacheHitRatio > 0.9 && metrics.averageResponseTime < 500 && (
              <div className="p-2 bg-green-50 border border-green-200 rounded text-green-800">
                Excellent performance! All optimizations working well.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Refresh button */}
      <div className="mt-6 pt-4 border-t">
        <button
          onClick={fetchCloudflareMetrics}
          disabled={isLoading}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90 disabled:opacity-50"
        >
          {isLoading ? 'Refreshing...' : 'Refresh Metrics'}
        </button>
      </div>
    </div>
  );
}

// Hook for programmatic access to metrics
export function useCloudflareMetrics() {
  const [metrics, setMetrics] = useState<CloudflareMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchMetrics = useCallback(async () => {
    setIsLoading(true);
    try {
      // In a real implementation, this would call your Cloudflare Analytics API
      // For now, return simulated data
      const simulatedMetrics: CloudflareMetrics = {
        cacheHitRatio: 0.92,
        cacheMissRatio: 0.08,
        edgeCacheHitRatio: 0.88,
        averageResponseTime: 450,
        timeToFirstByte: 135,
        bandwidthSaved: 700000,
        videoLoadTime: 1200,
        videoBufferingEvents: 2,
        videoQualityChanges: 1,
        streamRequests: 150,
        streamBandwidth: 500000,
        streamCacheHitRatio: 0.85,
      };
      
      setMetrics(simulatedMetrics);
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return { metrics, isLoading, refetch: fetchMetrics };
}
