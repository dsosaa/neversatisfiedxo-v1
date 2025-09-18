module.exports = {
  ci: {
    collect: {
      startServerCommand: 'npm run start',
      startServerReadyPattern: 'Ready on',
      url: [
        'http://localhost:3000/',
        'http://localhost:3000/video/sample-video-id'
      ],
      numberOfRuns: 3
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['warn', { minScore: 0.9 }],
        'categories:best-practices': ['warn', { minScore: 0.9 }],
        'categories:seo': ['warn', { minScore: 0.9 }],
        // Core Web Vitals thresholds
        'first-contentful-paint': ['error', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['error', { maxNumericValue: 200 }],
        // Bundle size checks
        'total-byte-weight': ['warn', { maxNumericValue: 2000000 }], // 2MB
        'unused-javascript': ['warn', { maxNumericValue: 500000 }], // 500KB
        'unused-css-rules': ['warn', { maxNumericValue: 100000 }], // 100KB
        // Performance budget
        'resource-summary:script:size': ['error', { maxNumericValue: 500000 }], // 500KB JS budget
        'resource-summary:image:size': ['warn', { maxNumericValue: 1000000 }], // 1MB images budget
      }
    },
    upload: {
      target: 'temporary-public-storage',
      // In production, configure proper storage like S3 or GitHub Pages
    }
  }
};