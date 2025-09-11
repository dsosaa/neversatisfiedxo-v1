/**
 * Cloudflare Video Integration Component
 * Example integration of optimized video player with your existing video components
 */

'use client';

import { OptimizedVideoPlayer, getOptimalVideoSettings } from '@/components/optimized-video-player';
import { CloudflarePerformanceMonitor } from '@/components/cloudflare-performance-monitor';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Volume2, VolumeX, Settings, Monitor } from 'lucide-react';
import { useState, useEffect } from 'react';

interface VideoIntegrationProps {
  videoId: string;
  title?: string;
  description?: string;
  showPerformanceMonitor?: boolean;
  className?: string;
}

export function CloudflareVideoIntegration({
  videoId,
  title = "Video Trailer",
  description = "Optimized with Cloudflare Stream",
  showPerformanceMonitor = false,
  className
}: VideoIntegrationProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showMonitor, setShowMonitor] = useState(showPerformanceMonitor);
  
  // Get optimal settings based on device capabilities
  const optimalSettings = getOptimalVideoSettings();

  // Handle video events
  const handlePlay = () => {
    setIsPlaying(true);
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  const handleEnded = () => {
    setIsPlaying(false);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const toggleSettings = () => {
    setShowSettings(!showSettings);
  };

  const toggleMonitor = () => {
    setShowMonitor(!showMonitor);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Video Player Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {title}
                <Badge variant="outline" className="text-green-600 border-green-600">
                  Cloudflare Optimized
                </Badge>
              </CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleSettings}
                className={showSettings ? "bg-primary text-primary-foreground" : ""}
              >
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={toggleMonitor}
                className={showMonitor ? "bg-primary text-primary-foreground" : ""}
              >
                <Monitor className="w-4 h-4 mr-2" />
                Monitor
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Video Player */}
            <OptimizedVideoPlayer
              videoId={videoId}
              autoplay={false}
              muted={isMuted}
              controls={true}
              enableCloudflareOptimizations={true}
              cacheStrategy={optimalSettings.cacheStrategy}
              enableAnalytics={true}
              clientBandwidthHint={optimalSettings.clientBandwidthHint}
              quality={optimalSettings.quality}
              preload={optimalSettings.preload}
              onPlay={handlePlay}
              onPause={handlePause}
              onEnded={handleEnded}
              className="w-full"
            />

            {/* Video Controls */}
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleMute}
                  className="flex items-center gap-2"
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  {isMuted ? 'Unmute' : 'Mute'}
                </Button>
                
                <div className="text-sm text-muted-foreground">
                  Status: {isPlaying ? 'Playing' : 'Paused'}
                </div>
              </div>

              <div className="text-sm text-muted-foreground">
                Quality: {optimalSettings.quality} | 
                Bandwidth: {Math.round(optimalSettings.clientBandwidthHint / 1000000)}Mbps
              </div>
            </div>

            {/* Settings Panel */}
            {showSettings && (
              <div className="p-4 border rounded-lg bg-muted/50">
                <h4 className="font-medium mb-3">Video Settings</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Cache Strategy:</strong> {optimalSettings.cacheStrategy}
                  </div>
                  <div>
                    <strong>Preload:</strong> {optimalSettings.preload}
                  </div>
                  <div>
                    <strong>Bandwidth Hint:</strong> {Math.round(optimalSettings.clientBandwidthHint / 1000000)} Mbps
                  </div>
                  <div>
                    <strong>Quality:</strong> {optimalSettings.quality}
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Performance Monitor */}
      {showMonitor && (
        <Card>
          <CardHeader>
            <CardTitle>Performance Monitor</CardTitle>
            <CardDescription>
              Real-time performance metrics for this video
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CloudflarePerformanceMonitor
              enableRealTimeUpdates={true}
              updateInterval={10000} // 10 seconds for more frequent updates
              className="w-full"
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Hook for video performance tracking
export function useVideoPerformanceTracking(videoId: string) {
  const [metrics, setMetrics] = useState({
    loadTime: 0,
    bufferingEvents: 0,
    qualityChanges: 0,
    averageBitrate: 0,
  });

  useEffect(() => {
    // In a real implementation, you would track metrics here
    // This is a placeholder for demonstration
    const interval = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        loadTime: Math.random() * 2000 + 500, // Simulated load time
        bufferingEvents: Math.floor(Math.random() * 3),
        qualityChanges: Math.floor(Math.random() * 2),
        averageBitrate: Math.random() * 5000000 + 1000000, // Simulated bitrate
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, [videoId]);

  return metrics;
}

// Example usage component
export function VideoGalleryExample() {
  const videos = [
    { id: 'video-1', title: 'Trailer 1', description: 'Action-packed trailer' },
    { id: 'video-2', title: 'Trailer 2', description: 'Dramatic trailer' },
    { id: 'video-3', title: 'Trailer 3', description: 'Comedy trailer' },
  ];

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Optimized Video Gallery</h2>
        <p className="text-muted-foreground mt-2">
          All videos are optimized with Cloudflare Stream for maximum performance
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {videos.map((video) => (
          <CloudflareVideoIntegration
            key={video.id}
            videoId={video.id}
            title={video.title}
            description={video.description}
            showPerformanceMonitor={false}
          />
        ))}
      </div>
    </div>
  );
}
