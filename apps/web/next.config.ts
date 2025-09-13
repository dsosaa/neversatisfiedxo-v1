import type { NextConfig } from "next";

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig: NextConfig = {
  // Enable standalone output for Docker deployment
  output: 'standalone',

  // Security headers - Optimized for video streaming compatibility
  async headers() {
    return [
      {
        // Static assets - long-term caching
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      },
      {
        // API routes - no caching
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'private, no-cache, no-store, must-revalidate'
          }
        ]
      },
      {
        // All other routes - balanced security headers
        source: '/(.*)',
        headers: [
          // Dynamic cache control for pages
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, stale-while-revalidate=86400'
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
          // DISABLE X-Frame-Options for video streaming compatibility
          // {
          //   key: 'X-Frame-Options',
          //   value: 'SAMEORIGIN'
          // },
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
          // DISABLE Permissions-Policy for video streaming compatibility
          // {
          //   key: 'Permissions-Policy',
          //   value: [
          //     'camera=(self)',
          //     'microphone=()',
          //     'geolocation=()',
          //     'browsing-topics=()'
          //   ].join(', ')
          // },
          // COMPLETELY DISABLE CSP FOR VIDEO STREAMING TEST
          // {
          //   key: 'Content-Security-Policy',
          //   value: [
          //     "default-src 'self'",
          //     "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com",
          //     "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
          //     "img-src 'self' data: https://videodelivery.net https://imagedelivery.net https://*.cloudflarestream.com blob:",
          //     "font-src 'self' https://fonts.gstatic.com",
          //     "media-src 'self' https://videodelivery.net https://*.cloudflarestream.com blob:",
          //     "frame-src 'self' https://iframe.videodelivery.net https://*.cloudflarestream.com https://challenges.cloudflare.com",
          //     "connect-src 'self' https://cloudflareinsights.com https://api.cloudflare.com https://*.cloudflarestream.com",
          //     "worker-src 'self' blob:",
          //     "manifest-src 'self'",
          //     "object-src 'none'",
          //     "base-uri 'self'",
          //     "form-action 'self'",
          //     "frame-ancestors 'none'",
          //     "upgrade-insecure-requests"
          //   ].join('; ')
          // }
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
    // Enhanced image optimization
    deviceSizes: [640, 750, 828, 960, 1080, 1200, 1440, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384, 480, 540, 810],
    minimumCacheTTL: 3600, // 1 hour for faster deployments
    unoptimized: false,
    loader: 'default',
    // Enable placeholder blur
    // placeholder: 'blur',
    // blurDataURL: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=',
  },

  // Performance optimizations with Next.js 15 advanced features
  experimental: {
    optimizePackageImports: [
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-scroll-area',
      '@radix-ui/react-slot', 
      '@radix-ui/react-tabs',
      '@radix-ui/react-toast',
      '@radix-ui/react-avatar',
      '@radix-ui/react-checkbox',
      '@radix-ui/react-label',
      '@radix-ui/react-popover',
      '@radix-ui/react-progress',
      '@radix-ui/react-separator',
      '@radix-ui/react-slider',
      '@radix-ui/react-toggle',
      '@radix-ui/react-toggle-group',
      '@radix-ui/react-tooltip',
      '@tanstack/react-query',
      '@tanstack/react-query-devtools',
      'lucide-react',
      'framer-motion',
      'class-variance-authority',
      'clsx',
      'tailwind-merge',
      'cmdk',
      'sonner',
      'vaul',
      'react-hook-form',
      'zod'
    ],
    staleTimes: {
      dynamic: 30, // 30 seconds for dynamic pages
      static: 180, // 3 minutes for static pages
    },
    // Next.js 15 stable features (experimental features disabled for stable release)
    // ppr: true, // Partial Prerendering - requires canary version
    // reactCompiler: true, // React 19 compiler - requires canary version
    // cacheComponents: true, // Enhanced component caching - requires canary version
    // Existing optimizations
    typedEnv: true, // Enable typed environment variables
    browserDebugInfoInTerminal: true, // Enable browser debug info forwarding
    optimizeCss: true, // Enable CSS optimization
    optimizeServerReact: true, // Optimize server-side React
    // Build cache optimization
    swcTraceProfiling: false, // Disable SWC tracing in production
    webpackBuildWorker: true, // Enable webpack build worker for faster builds
    // Memory optimization
    largePageDataBytes: 128 * 1000, // 128KB threshold for large page data warning
  },

  // Enable statically typed routes
  typedRoutes: true,

  // Server components optimization (moved from experimental)
  serverExternalPackages: ['sharp', 'canvas'],

  // Performance monitoring
  logging: {
    fetches: {
      fullUrl: true,
    },
  },

  // Turbopack configuration
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
    resolveAlias: {
      // Optimize common imports
      '@/components': './src/components',
      '@/lib': './src/lib',
      '@/styles': './src/styles',
    },
  },

  // Webpack optimization for build performance and caching
  webpack: (config, { dev, webpack }) => {
    // Production optimizations
    if (!dev) {
      // Optimize chunks for better caching
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          minSize: 20000,
          maxSize: 244000,
          cacheGroups: {
            default: false,
            vendors: false,
            // Framework chunk for React/Next.js
            framework: {
              name: 'framework',
              chunks: 'all',
              test: /[\\/]node_modules[\\/](react|react-dom|scheduler|prop-types|use-subscription)[\\/]/,
              priority: 50,
              enforce: true,
              reuseExistingChunk: true
            },
            // UI components chunk
            ui: {
              name: 'ui',
              chunks: 'all',
              test: /[\\/]node_modules[\\/](@radix-ui|lucide-react|class-variance-authority|clsx|tailwind-merge)[\\/]/,
              priority: 45,
              enforce: true,
              reuseExistingChunk: true
            },
            // Animation libraries chunk
            animation: {
              name: 'animation',
              chunks: 'all',
              test: /[\\/]node_modules[\\/](framer-motion|lottie-react)[\\/]/,
              priority: 40,
              enforce: true,
              reuseExistingChunk: true
            },
            // Query libraries chunk
            query: {
              name: 'query',
              chunks: 'all',
              test: /[\\/]node_modules[\\/](@tanstack)[\\/]/,
              priority: 35,
              enforce: true,
              reuseExistingChunk: true
            },
            // Form libraries chunk
            form: {
              name: 'form',
              chunks: 'all',
              test: /[\\/]node_modules[\\/](react-hook-form|zod|@hookform)[\\/]/,
              priority: 30,
              enforce: true,
              reuseExistingChunk: true
            },
            // Utility libraries chunk
            utils: {
              name: 'utils',
              chunks: 'all',
              test: /[\\/]node_modules[\\/](date-fns|lodash|uuid|nanoid)[\\/]/,
              priority: 25,
              enforce: true,
              reuseExistingChunk: true
            },
            // Vendor chunk for other node_modules
            vendor: {
              name: 'vendor',
              chunks: 'all',
              test: /[\\/]node_modules[\\/]/,
              priority: 20,
              enforce: true,
              reuseExistingChunk: true
            },
            // Common chunk for shared code
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'all',
              priority: 10,
              reuseExistingChunk: true,
              enforce: true
            }
          }
        },
        // Enable module concatenation for smaller bundles
        concatenateModules: true,
        // Enable tree shaking
        usedExports: true,
        sideEffects: false
      }
      
      // Add bundle analyzer plugin conditionally
      if (process.env.ANALYZE === 'true') {
        config.plugins.push(
          new webpack.DefinePlugin({
            '__BUNDLE_ANALYZE__': JSON.stringify(true)
          })
        )
      }
    }
    
    // Development optimizations
    if (dev) {
      // Enable webpack build cache for faster rebuilds
      config.cache = {
        type: 'filesystem',
        buildDependencies: {
          config: [__filename]
        }
      }
      
      // Optimize development build speed
      config.optimization = {
        ...config.optimization,
        removeAvailableModules: false,
        removeEmptyChunks: false,
        splitChunks: false
      }
    }
    
    return config
  },

  // Modern bundle analysis will be handled by @next/bundle-analyzer wrapper

  // Compress responses
  compress: true,

  // Remove powered by header for security
  poweredByHeader: false,

  // Disable ESLint during builds for faster deployment
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Environment variables validation and client-side exposure
  env: {
    CUSTOM_BUILD_ID: process.env.NODE_ENV === 'production' ? 'production' : 'development',
    // Ensure Cloudflare variables are available at build time
    NEXT_PUBLIC_CF_STREAM_CUSTOMER_CODE: process.env.NEXT_PUBLIC_CF_STREAM_CUSTOMER_CODE,
  }
};

export default withBundleAnalyzer(nextConfig);
