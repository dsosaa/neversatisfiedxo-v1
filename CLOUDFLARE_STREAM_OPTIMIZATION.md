# Cloudflare Stream Optimization Guide

This guide provides comprehensive instructions for optimizing your video trailer website using Cloudflare Stream and the Global API.

## 🚀 Quick Start

### 1. Prerequisites

- Cloudflare account with Global API key
- Domain added to Cloudflare
- Cloudflare Stream account
- Node.js installed

### 2. Environment Setup

Create a `.env` file in your project root:

```bash
# Cloudflare Configuration
CF_GLOBAL_API_KEY=your_global_api_key_here
CF_ACCOUNT_ID=your_account_id_here

# Cloudflare Stream Configuration
NEXT_PUBLIC_CF_STREAM_CUSTOMER_CODE=your_customer_code_here
CF_STREAM_API_TOKEN=your_stream_api_token_here

# Domain Configuration
NEXT_PUBLIC_DOMAIN=videos.neversatisfiedxo.com
```

### 3. Run Optimization Script

```bash
# Make the setup script executable
chmod +x scripts/setup-cloudflare-stream.sh

# Run the optimization setup
./scripts/setup-cloudflare-stream.sh

# Or run the optimization script directly
node scripts/cloudflare-stream-optimize.js videos.neversatisfiedxo.com
```

## 📊 What Gets Optimized

### Cache Rules
- **HLS Manifests**: 1 hour cache + 2 hours stale-while-revalidate
- **Video Segments**: 7 days cache + 14 days stale-while-revalidate
- **Thumbnails**: 24 hours cache
- **Player Assets**: 1 year cache

### Compression
- **Video Manifests**: Brotli + Gzip compression
- **Large Assets**: Zstandard + Brotli + Gzip
- **Thumbnails**: Brotli + Gzip compression

### Speed Optimizations
- Smart Tiered Cache enabled
- Polish image optimization
- Minification (CSS, HTML, JS)
- Rocket Loader enabled
- Mirage enabled

### Security
- Always use HTTPS
- Full SSL encryption
- TLS 1.2 minimum
- HTTP/2 prioritization

## 🎬 Video-Specific Optimizations

### 1. Optimized Video Player

Use the new `OptimizedVideoPlayer` component:

```tsx
import { OptimizedVideoPlayer } from '@/components/optimized-video-player';

<OptimizedVideoPlayer
  videoId="your-video-id"
  customerCode="your-customer-code"
  autoplay={false}
  muted={true}
  enableCloudflareOptimizations={true}
  cacheStrategy="balanced"
  enableAnalytics={true}
  clientBandwidthHint={5000000} // 5 Mbps
  quality="auto"
/>
```

### 2. Performance Monitoring

Monitor your optimizations with the performance dashboard:

```tsx
import { CloudflarePerformanceMonitor } from '@/components/cloudflare-performance-monitor';

<CloudflarePerformanceMonitor
  enableRealTimeUpdates={true}
  updateInterval={30000} // 30 seconds
/>
```

### 3. Adaptive Quality Settings

The player automatically adjusts quality based on device capabilities:

```tsx
import { getOptimalVideoSettings } from '@/components/optimized-video-player';

const settings = getOptimalVideoSettings();
// Returns optimal settings based on device and connection
```

## 📈 Expected Performance Improvements

| Metric | Improvement | Impact |
|--------|-------------|---------|
| Video manifest loading | 60-80% faster | Critical |
| Video segment loading | 50-70% faster | High |
| Thumbnail loading | 40-60% faster | High |
| Overall cache hit ratio | 40-60% increase | Critical |
| Bandwidth usage | 60-80% reduction | High |
| Time to First Byte | 20-30% faster | Medium |
| Core Web Vitals | Significant improvement | High |

## 🔧 Advanced Configuration

### Custom Cache Rules

You can create additional cache rules for specific content:

```javascript
// Example: Cache API responses for 1 hour
const apiCacheRule = {
  description: 'Cache API responses',
  expression: '(http.request.uri.path contains "/api/")',
  action: 'set_cache_settings',
  action_parameters: {
    cache: true,
    edge_ttl: { mode: 'override_origin', default: 3600 },
    browser_ttl: { mode: 'override_origin', default: 1800 }
  }
};
```

### Transform Rules

Add custom headers for video content:

```javascript
// Example: Add video-specific headers
const videoHeadersRule = {
  description: 'Add video headers',
  expression: '(http.request.uri.path.extension in {"m3u8" "mpd" "ts" "m4s"})',
  action: 'rewrite',
  action_parameters: {
    headers: [
      {
        name: 'X-Video-Optimized',
        operation: 'set',
        value: 'true'
      }
    ]
  }
};
```

## 📊 Monitoring and Analytics

### 1. Cloudflare Analytics

Monitor your optimizations in the Cloudflare dashboard:
- **Analytics tab**: Traffic and performance metrics
- **Caching tab**: Cache hit ratios and purge history
- **Speed tab**: Optimization settings status
- **Security tab**: Threat and security metrics

### 2. Performance Tools

Use these tools to verify improvements:
- **GTmetrix**: Overall performance scoring
- **PageSpeed Insights**: Core Web Vitals analysis
- **WebPageTest**: Detailed waterfall analysis
- **Cloudflare Analytics API**: Programmatic monitoring

### 3. Custom Metrics

Track video-specific metrics:

```tsx
import { useVideoPerformance } from '@/components/optimized-video-player';

const videoRef = useRef<HTMLVideoElement>(null);
const metrics = useVideoPerformance(videoRef);

console.log('Video metrics:', {
  loadTime: metrics.loadTime,
  bufferingEvents: metrics.bufferingEvents,
  averageBitrate: metrics.averageBitrate,
  peakBitrate: metrics.peakBitrate
});
```

## 🚨 Troubleshooting

### Common Issues

1. **Script fails with authentication error**
   - Verify your Global API key is correct
   - Ensure the API key has the necessary permissions

2. **Domain not found error**
   - Add your domain to Cloudflare first
   - Verify the domain name is correct

3. **Some optimizations not working**
   - Check if you have the required Cloudflare plan
   - Some features require Pro/Business/Enterprise plans

4. **Video not loading**
   - Verify your Stream customer code is correct
   - Check if the video ID exists in your Stream account

### Rollback Commands

If you need to disable specific optimizations:

```bash
# Disable compression
curl -X PATCH "https://api.cloudflare.com/client/v4/zones/{zone_id}/settings/minify" \
  -H "X-Auth-Email: your-email@example.com" \
  -H "X-Auth-Key: your-api-key" \
  --data '{"value":{"css":"off","html":"off","js":"off"}}'

# Disable Polish
curl -X PATCH "https://api.cloudflare.com/client/v4/zones/{zone_id}/settings/polish" \
  -H "X-Auth-Email: your-email@example.com" \
  -H "X-Auth-Key: your-api-key" \
  --data '{"value":"off"}'
```

## 🎯 Best Practices

### 1. Video Upload
- Upload videos in 4K resolution for best quality
- Use H.264 codec for maximum compatibility
- Set appropriate thumbnail timestamps
- Optimize video bitrates for different quality levels

### 2. Frontend Implementation
- Use lazy loading for video thumbnails
- Implement preloading strategies for critical videos
- Monitor Core Web Vitals regularly
- Test on various devices and connections

### 3. Monitoring
- Set up alerts for performance degradation
- Monitor cache hit ratios regularly
- Track video engagement metrics
- Use A/B testing for optimization strategies

## 🔄 Maintenance

### Regular Tasks
- Monitor performance metrics weekly
- Review cache hit ratios monthly
- Update video content regularly
- Test new optimizations in staging

### Updates
- Keep Cloudflare settings up to date
- Monitor for new optimization features
- Update video player components as needed
- Review and adjust cache rules based on usage patterns

## 📞 Support

For issues with this optimization setup:
1. Check the troubleshooting section above
2. Review Cloudflare documentation
3. Contact Cloudflare support for API-related issues
4. Check the project's GitHub issues for known problems

---

**Note**: This optimization setup is specifically designed for video trailer websites using Cloudflare Stream. Results may vary based on your specific content and traffic patterns.
