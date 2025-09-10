import type { NextConfig } from "next";

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig: NextConfig = {
  // Security headers for production only
  async headers() {
    // Skip security headers in development for Safari compatibility
    if (process.env.NODE_ENV === 'development') {
      return [];
    }
    
    return [
      {
        // Apply security headers to all routes
        source: '/(.*)',
        headers: [
          // Content Security Policy - Now handled by middleware with nonces
          // Removed static CSP to prevent conflicts with dynamic nonce-based CSP
          // Cache Control for static assets
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          },
          // Enable compression hint
          {
            key: 'Accept-Encoding',
            value: 'br, gzip, deflate'
          },
          // HTTP Strict Transport Security - Forces HTTPS
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          // Prevents MIME type sniffing
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          // Prevents clickjacking attacks
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          // Controls referrer information
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          // Prevents XSS attacks
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          // Prevents DNS prefetching
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'off'
          },
          // Controls browser features
          {
            key: 'Permissions-Policy',
            value: [
              'camera=()',
              'microphone=()',
              'geolocation=()',
              'browsing-topics=()'
            ].join(', ')
          }
        ]
      }
    ];
  },

  // Optimize images and static assets
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'videodelivery.net',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'imagedelivery.net',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'customer-*.cloudflarestream.com',
        port: '',
        pathname: '/*/thumbnails/**',
      },
    ],
    formats: ['image/webp', 'image/avif'],
    qualities: [75, 80, 85, 90, 92, 95, 100],
    dangerouslyAllowSVG: false,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // Performance optimizations
  experimental: {
    optimizePackageImports: [
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-scroll-area',
      '@radix-ui/react-slot', 
      '@radix-ui/react-tabs',
      '@radix-ui/react-toast',
      '@tanstack/react-query',
      'lucide-react',
      'framer-motion',
      'class-variance-authority'
    ],
    staleTimes: {
      dynamic: 30, // 30 seconds for dynamic pages
      static: 180, // 3 minutes for static pages
    },
    typedEnv: true, // Enable typed environment variables
    browserDebugInfoInTerminal: true, // Enable Safari debug info forwarding
  },

  // Enable statically typed routes
  typedRoutes: true,

  // Turbopack configuration
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },

  // Modern bundle analysis will be handled by @next/bundle-analyzer wrapper

  // Compress responses
  compress: true,

  // Remove powered by header for security
  poweredByHeader: false,

  // Environment variables validation
  env: {
    CUSTOM_BUILD_ID: process.env.NODE_ENV === 'production' ? 'production' : 'development'
  }
};

export default withBundleAnalyzer(nextConfig);
