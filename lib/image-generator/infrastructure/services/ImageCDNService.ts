export interface ImageOptimizationOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'auto' | 'webp' | 'jpeg' | 'png';
  blur?: boolean;
}

/**
 * Image CDN Service for optimizing and caching generated images
 * Provides a proxy layer for external image URLs with optimization parameters
 */
export class ImageCDNService {
  private static readonly CDN_BASE = process.env.NEXT_PUBLIC_CDN_URL || '';
  private static readonly IMAGE_PROXY_ENDPOINT = '/api/image-proxy';
  
  /**
   * Optimize image URL with CDN parameters
   */
  static optimizeImageUrl(
    originalUrl: string, 
    options: ImageOptimizationOptions = {}
  ): string {
    // Return original URL if no CDN configured or URL is empty
    if (!originalUrl || (!this.CDN_BASE && typeof window !== 'undefined')) {
      return this.addOptimizationParams(originalUrl, options);
    }

    const {
      width,
      height,
      quality = 90,
      format = 'auto',
      blur = false
    } = options;
    
    // Build optimization parameters
    const params = new URLSearchParams();
    params.set('url', encodeURIComponent(originalUrl));
    
    if (width) params.set('w', width.toString());
    if (height) params.set('h', height.toString());
    params.set('q', quality.toString());
    params.set('f', format);
    if (blur) params.set('blur', '20');
    
    // Use CDN if available, otherwise use local proxy
    const baseUrl = this.CDN_BASE || this.IMAGE_PROXY_ENDPOINT;
    return `${baseUrl}?${params.toString()}`;
  }

  /**
   * Generate responsive image srcSet for different screen densities
   */
  static generateImageSrcSet(originalUrl: string): string {
    if (!originalUrl) return '';
    
    const sizes = [
      { width: 400, descriptor: '400w' },
      { width: 800, descriptor: '800w' },
      { width: 1200, descriptor: '1200w' },
      { width: 1600, descriptor: '1600w' }
    ];
    
    return sizes
      .map(({ width, descriptor }) => 
        `${this.optimizeImageUrl(originalUrl, { width })} ${descriptor}`
      )
      .join(', ');
  }

  /**
   * Get optimized URLs for different sizes
   */
  static getImageVariants(originalUrl: string) {
    return {
      thumbnail: this.optimizeImageUrl(originalUrl, { 
        width: 200, 
        height: 200, 
        quality: 85 
      }),
      medium: this.optimizeImageUrl(originalUrl, { 
        width: 800, 
        height: 600, 
        quality: 90 
      }),
      full: this.optimizeImageUrl(originalUrl, { 
        width: 1200, 
        height: 1200, 
        quality: 95 
      }),
      original: originalUrl
    };
  }

  /**
   * Generate blur placeholder URL
   */
  static generateBlurPlaceholder(originalUrl: string): string {
    return this.optimizeImageUrl(originalUrl, {
      width: 20,
      height: 20,
      quality: 20,
      blur: true
    });
  }

  /**
   * Preload critical images with high priority
   */
  static preloadCriticalImage(
    imageUrl: string, 
    size: 'thumbnail' | 'medium' | 'full' = 'medium'
  ): void {
    if (typeof window === 'undefined' || !imageUrl) return;

    const sizeOptions = {
      thumbnail: { width: 200, height: 200 },
      medium: { width: 800, height: 600 },
      full: { width: 1200, height: 1200 }
    };

    const optimizedUrl = this.optimizeImageUrl(imageUrl, sizeOptions[size]);
    
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = optimizedUrl;
    link.as = 'image';
    link.setAttribute('fetchpriority', 'high');
    
    document.head.appendChild(link);
  }

  /**
   * Batch preload multiple images
   */
  static batchPreloadImages(
    imageUrls: string[], 
    size: 'thumbnail' | 'medium' | 'full' = 'thumbnail',
    maxConcurrent: number = 3
  ): void {
    if (typeof window === 'undefined') return;

    // Process images in batches to avoid overwhelming the browser
    const batches = this.chunkArray(imageUrls, maxConcurrent);
    
    batches.forEach((batch, batchIndex) => {
      setTimeout(() => {
        batch.forEach(url => this.preloadCriticalImage(url, size));
      }, batchIndex * 100); // Stagger batch loading
    });
  }

  /**
   * Estimate bandwidth savings from optimization
   */
  static estimateBandwidthSavings(
    originalUrl: string,
    options: ImageOptimizationOptions = {}
  ): { estimatedSavings: number; optimizedFormat: string } {
    const format = options.format === 'auto' ? 'webp' : (options.format || 'jpeg');
    
    // Rough estimates based on typical compression ratios
    const formatSavings = {
      webp: 0.4,  // WebP typically 40% smaller than JPEG
      jpeg: 0.2,  // JPEG optimization typically 20% smaller
      png: 0.3    // PNG optimization typically 30% smaller
    };

    const sizeSavings = options.width ? Math.min(0.8, (1920 - options.width) / 1920) : 0;
    const qualitySavings = options.quality ? Math.max(0, (100 - options.quality) / 100 * 0.3) : 0;
    
    const totalSavings = Math.min(0.9, 
      (formatSavings[format as keyof typeof formatSavings] || 0.2) + 
      sizeSavings + 
      qualitySavings
    );
    
    return {
      estimatedSavings: Math.round(totalSavings * 100),
      optimizedFormat: format
    };
  }

  /**
   * Get cache control headers for optimized images
   */
  static getCacheHeaders(): Record<string, string> {
    return {
      'Cache-Control': 'public, max-age=31536000, immutable', // 1 year
      'CDN-Cache-Control': 'public, max-age=31536000',
      'Cloudflare-CDN-Cache-Control': 'public, max-age=31536000',
      'Vary': 'Accept, Accept-Encoding'
    };
  }

  /**
   * Check if image URL supports optimization
   */
  static supportsOptimization(imageUrl: string): boolean {
    if (!imageUrl) return false;
    
    const supportedDomains = [
      'replicate.delivery',
      'cdn.replicate.com',
      // Add other supported domains
    ];
    
    const supportedFormats = ['.jpg', '.jpeg', '.png', '.webp'];
    
    return supportedDomains.some(domain => imageUrl.includes(domain)) ||
           supportedFormats.some(format => imageUrl.toLowerCase().includes(format));
  }

  /**
   * Fallback to basic optimization if CDN unavailable
   */
  private static addOptimizationParams(
    originalUrl: string, 
    options: ImageOptimizationOptions
  ): string {
    if (!originalUrl || !options.width && !options.height && !options.quality) {
      return originalUrl;
    }

    const params = new URLSearchParams();
    if (options.width) params.set('w', options.width.toString());
    if (options.height) params.set('h', options.height.toString());
    if (options.quality) params.set('q', options.quality.toString());
    
    const separator = originalUrl.includes('?') ? '&' : '?';
    return `${originalUrl}${separator}${params.toString()}`;
  }

  /**
   * Utility to chunk array for batch processing
   */
  private static chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
} 