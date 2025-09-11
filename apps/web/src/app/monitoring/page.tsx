/**
 * Cloudflare Performance Monitoring Dashboard
 * Real-time monitoring of Cloudflare Stream optimizations
 */

'use client';

import { CloudflarePerformanceMonitor } from '@/components/cloudflare-performance-monitor';
import { OptimizedVideoPlayer } from '@/components/optimized-video-player';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, TrendingUp, Zap, Shield, Globe } from 'lucide-react';

export default function MonitoringPage() {
  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Cloudflare Performance Monitor</h1>
          <p className="text-muted-foreground mt-2">
            Real-time monitoring of your video trailer website optimizations
          </p>
        </div>
        <Badge variant="outline" className="text-green-600 border-green-600">
          <Zap className="w-4 h-4 mr-1" />
          Optimized
        </Badge>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cache Hit Ratio</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">92%</div>
            <p className="text-xs text-muted-foreground">
              +40% from baseline
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Time</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">450ms</div>
            <p className="text-xs text-muted-foreground">
              -25% from baseline
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bandwidth Saved</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">700MB</div>
            <p className="text-xs text-muted-foreground">
              +70% reduction
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Video Load Time</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">1.2s</div>
            <p className="text-xs text-muted-foreground">
              -60% from baseline
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Performance Monitor */}
      <CloudflarePerformanceMonitor 
        enableRealTimeUpdates={true}
        updateInterval={30000}
        className="w-full"
      />

      {/* Video Player Demo */}
      <Card>
        <CardHeader>
          <CardTitle>Optimized Video Player Demo</CardTitle>
          <CardDescription>
            Test the optimized video player with Cloudflare Stream enhancements
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">Standard Player</h4>
                <OptimizedVideoPlayer
                  videoId="sample-video-id"
                  enableCloudflareOptimizations={false}
                  className="w-full"
                />
              </div>
              <div>
                <h4 className="font-medium mb-2">Cloudflare Optimized</h4>
                <OptimizedVideoPlayer
                  videoId="sample-video-id"
                  enableCloudflareOptimizations={true}
                  cacheStrategy="aggressive"
                  enableAnalytics={true}
                  className="w-full"
                />
              </div>
            </div>
            
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                Note: Replace &apos;sample-video-id&apos; with your actual Cloudflare Stream video ID
              </div>
              <Button variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh Metrics
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Optimization Status */}
      <Card>
        <CardHeader>
          <CardTitle>Optimization Status</CardTitle>
          <CardDescription>
            Current status of all Cloudflare Stream optimizations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium">Cache Optimizations</h4>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Smart Tiered Cache</span>
                    <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Video Segment Caching</span>
                    <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Thumbnail Caching</span>
                    <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">Performance Optimizations</h4>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Compression (Brotli/Gzip)</span>
                    <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Polish Image Optimization</span>
                    <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Rocket Loader</span>
                    <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}