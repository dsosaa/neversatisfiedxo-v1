# Cloudflare Performance Optimization Guide

## 🚀 Quick Start

Your environment is configured with:
- ✅ **Global API Key**: Added to `.env` file
- ✅ **Optimization Script**: Ready to run at `scripts/cloudflare-optimize.js`

## 📋 Step 1: Add Your Domain to Cloudflare (Manual)

Since no domains are currently configured in your Cloudflare account, you need to add your website domain first:

### Via Cloudflare Dashboard:
1. **Log in** to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. **Click "Add site"**
3. **Enter your domain** (e.g., `yourdomain.com`)
4. **Select a plan** (Free plan supports most optimizations)
5. **Update DNS records** as instructed by Cloudflare
6. **Update nameservers** at your domain registrar

### Via API (Alternative):
```bash
curl -X POST "https://api.cloudflare.com/client/v4/zones" \
  -H "X-Auth-Email: nsxofilms@gmail.com" \
  -H "X-Auth-Key: 15a7e848888bc25e79400deee710e42406b03" \
  -H "Content-Type: application/json" \
  --data '{"name":"yourdomain.com","type":"full"}'
```

## ⚡ Step 2: Run Optimization Script

Once your domain is added to Cloudflare:

```bash
# Navigate to project root
cd /Users/nsxo/Cursor/V0\ Trailer

# Run optimization script
node scripts/cloudflare-optimize.js yourdomain.com
```

### What the script does:
- 🔍 **Finds your zone ID**
- 🚀 **Enables Smart Tiered Cache** (40-60% cache hit improvement)
- 🗜️ **Configures compression** (60-80% size reduction)
- 🖼️ **Enables Polish image optimization** (35-50% image reduction)
- 📹 **Creates video-specific cache rules**
- ⚡ **Optimizes speed settings**
- 🛡️ **Enables security features**

## 🎛️ Manual Configuration Required

These features must be configured through the Cloudflare Dashboard:

### Pro/Business Plan Features:
- **APO (Automatic Platform Optimization)** - WordPress/CMS acceleration
- **Load Balancing** - Multi-origin traffic distribution
- **Advanced Image Resizing** - On-the-fly image transformation

### Enterprise Features:
- **Bot Management** - Advanced bot detection
- **Advanced DDoS Protection** - Custom sensitivity tuning
- **Custom WAF Rules** - Granular security controls

### Always Manual:
- **DNS Records Management** - A, CNAME, MX records
- **Page Rules** - Custom URL-based rules (if not via API)
- **Workers Deployment** - Custom edge computing logic
- **Analytics Dashboard** - Performance monitoring setup

## 📹 Video-Specific Optimizations

### For Cloudflare Stream:
Your Stream configuration is already set:
```env
NEXT_PUBLIC_CF_STREAM_CUSTOMER_CODE=d6a71f77965f2f32d7f3ebb03869b8d6
CF_ACCOUNT_ID=d6a71f77965f2f32d7f3ebb03869b8d6
CF_STREAM_API_TOKEN=rvWXyGVnRtQkQm_JXdhlJNcOjU-OC1yMSqmdw-xz
```

### Manual Stream Settings:
1. **Live Input Configuration** - RTMP/WebRTC settings
2. **Thumbnail Policies** - Default thumbnail timestamps
3. **Access Control** - Video viewing permissions
4. **Analytics Setup** - Video performance monitoring
5. **Webhook Configuration** - Stream event notifications

## 🔧 Frontend Optimizations to Implement

Add these optimizations to your Next.js app:

### 1. Video Preload Settings
```javascript
// In your video components
<video preload="metadata" ...>
```

### 2. Client Bandwidth Hints
```javascript
const manifestUrl = `https://customer-${customerCode}.cloudflarestream.com/${videoId}/manifest/video.m3u8?clientBandwidthHint=5000000`;
```

### 3. Lazy Loading for Thumbnails
```javascript
<img loading="lazy" src="..." alt="..." />
```

### 4. Next.js Cache Headers
```javascript
// next.config.ts - add to headers()
{
  key: 'Cache-Control',
  value: 'public, max-age=31536000, immutable'
}
```

## 📊 Expected Performance Improvements

After implementing all optimizations:

| Metric | Improvement | Impact |
|--------|-------------|---------|
| Video manifest loading | 40-70% faster | Critical |
| HTML/CSS/JS size | 60-80% reduction | High |
| Image/thumbnail size | 35-50% reduction | High |
| Time to First Byte | 20-30% faster | Medium |
| Core Web Vitals | Significant improvement | High |
| Cache hit ratio | 40-60% increase | Critical |

## 🔍 Monitoring & Verification

### Via Cloudflare Dashboard:
1. **Analytics tab** - Traffic and performance metrics
2. **Caching tab** - Cache hit ratios and purge history
3. **Speed tab** - Optimization settings status
4. **Security tab** - Threat and security metrics

### Via Tools:
- **GTmetrix** - Overall performance scoring
- **PageSpeed Insights** - Core Web Vitals analysis
- **WebPageTest** - Detailed waterfall analysis
- **Cloudflare Analytics API** - Programmatic monitoring

## 🚨 Troubleshooting

### Common Issues:
1. **Script fails** - Ensure domain is added to Cloudflare first
2. **Some features disabled** - May require plan upgrade
3. **Changes not visible** - Allow 5 minutes for global propagation
4. **Cache not working** - Check cache headers and rules

### Rollback Commands:
```bash
# Disable specific features if needed
curl -X PATCH "https://api.cloudflare.com/client/v4/zones/{zone_id}/settings/minify" \
  -H "X-Auth-Email: nsxofilms@gmail.com" \
  -H "X-Auth-Key: 15a7e848888bc25e79400deee710e42406b03" \
  --data '{"value":{"css":"off","html":"off","js":"off"}}'
```

## 🎯 Next Steps

1. **Add your domain** to Cloudflare
2. **Run the optimization script**
3. **Implement frontend optimizations**
4. **Monitor performance improvements**
5. **Consider plan upgrade** for advanced features

---

**Security Note**: The global API key provides full account access. Consider creating scoped API tokens for production use.

**Support**: For issues, check Cloudflare documentation or contact their support team.