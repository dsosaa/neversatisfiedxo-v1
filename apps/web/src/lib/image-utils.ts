/**
 * Image utilities for optimized loading and caching
 * Separate chunk for better bundle splitting
 */

export interface ImageLoadOptions {
  lowQuality?: boolean;
  format?: 'webp' | 'jpeg' | 'avif';
  width?: number;
  height?: number;
  dpr?: number;
}

export interface ThumbnailOptions {
  time?: string;
  quality?: number;
  format?: 'webp' | 'jpeg';
  fit?: 'cover' | 'crop' | 'pad';
  width?: number;
  height?: number;
  dpr?: number;
}

/**
 * Generate optimized Cloudflare thumbnail URL with device pixel ratio support
 */
export function generateOptimizedThumbnailUrl(
  videoId: string, 
  options: ThumbnailOptions = {}
): string {
  const {
    time = '0.005s',
    quality = 95,
    format = 'webp',
    fit = 'cover',
    width = 1920,
    height = 1080,
    dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1
  } = options;

  const params = new URLSearchParams({
    time,
    width: width.toString(),
    height: height.toString(),
    quality: quality.toString(),
    format,
    fit,
    ...(dpr > 1 && { dpr: dpr.toString() })
  });

  return `https://videodelivery.net/${videoId}/thumbnails/thumbnail.jpg?${params.toString()}`;
}

/**
 * Generate multiple fallback URLs with different timestamps and formats
 */
export function generateFallbackUrls(
  videoId: string,
  options: ThumbnailOptions = {}
): string[] {
  const timestamps = ['0.005s', '0.015s', '0.03s'];
  const formats: ('webp' | 'jpeg')[] = ['webp', 'jpeg'];
  const urls: string[] = [];

  // Generate combinations of timestamps and formats
  for (const format of formats) {
    for (const time of timestamps) {
      urls.push(generateOptimizedThumbnailUrl(videoId, {
        ...options,
        time,
        format,
        quality: format === 'webp' ? 95 : 90
      }));
    }
  }

  // Add mobile fallback
  urls.push(generateOptimizedThumbnailUrl(videoId, {
    ...options,
    time: timestamps[2],
    format: 'jpeg',
    width: 800,
    height: 450,
    quality: 85
  }));

  return urls;
}

/**
 * Preload critical images with high priority
 */
export function preloadImage(src: string, priority: boolean = false): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    if (priority) {
      img.fetchPriority = 'high';
    }
    
    img.onload = () => resolve();
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

/**
 * Progressive image loading with low-quality placeholder
 */
export async function loadProgressiveImage(
  videoId: string, 
  highQualityOptions: ThumbnailOptions = {},
  lowQualityOptions: ThumbnailOptions = {}
): Promise<{ lowQuality: string; highQuality: string }> {
  const lowQuality = generateOptimizedThumbnailUrl(videoId, {
    width: 320,
    height: 180,
    quality: 50,
    format: 'jpeg',
    ...lowQualityOptions
  });

  const highQuality = generateOptimizedThumbnailUrl(videoId, highQualityOptions);

  // Preload low quality first
  try {
    await preloadImage(lowQuality);
  } catch (error) {
    console.warn('Failed to preload low quality image:', error);
  }

  return { lowQuality, highQuality };
}

/**
 * Calculate optimal image dimensions based on container size and DPR
 */
export function calculateOptimalDimensions(
  containerWidth: number,
  containerHeight: number,
  dpr: number = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1
): { width: number; height: number } {
  // Cap DPR at 2 for performance
  const adjustedDpr = Math.min(dpr, 2);
  
  return {
    width: Math.round(containerWidth * adjustedDpr),
    height: Math.round(containerHeight * adjustedDpr)
  };
}

/**
 * Create a blur data URL for image placeholders
 */
export function createBlurDataUrl(): string {
  // Generate a simple blur data URL for consistent placeholders
  return `data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAGAAcDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGBkRMUIjH/xAAVAQEBAAAAAAAAAAAAAAAAAAABBP/EABcRAAMBAAAAAAAAAAAAAAAAAAECEQA/2gAMAwEAAhEDEQA/AKrjUyy3qIUvL5P04hKE3TIEqf6nYH6B`;
}

/**
 * Image loading state management
 */
export interface ImageState {
  loading: boolean;
  error: boolean;
  loaded: boolean;
  retryCount: number;
}

export function createImageState(): ImageState {
  return {
    loading: true,
    error: false,
    loaded: false,
    retryCount: 0
  };
}

/**
 * Retry image loading with exponential backoff
 */
export async function retryImageLoad(
  urls: string[], 
  maxRetries: number = 3
): Promise<string> {
  for (let i = 0; i < urls.length; i++) {
    for (let retry = 0; retry <= maxRetries; retry++) {
      try {
        await preloadImage(urls[i]);
        return urls[i];
      } catch {
        if (retry === maxRetries) {
          console.warn(`Failed to load image ${urls[i]} after ${maxRetries} retries`);
          continue; // Try next URL
        }
        
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, retry) * 100));
      }
    }
  }
  
  throw new Error('All image URLs failed to load');
}

/**
 * Memory-efficient image cache for client-side caching
 */
class ImageCache {
  private cache = new Map<string, { blob: Blob; timestamp: number }>();
  private maxSize = 50;
  private ttl = 30 * 60 * 1000; // 30 minutes

  async get(url: string): Promise<Blob | null> {
    const entry = this.cache.get(url);
    if (!entry) return null;
    
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(url);
      return null;
    }
    
    return entry.blob;
  }

  async set(url: string, blob: Blob): Promise<void> {
    // Clean up old entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }
    
    this.cache.set(url, {
      blob,
      timestamp: Date.now()
    });
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

export const imageCache = new ImageCache();