import React from 'react';

export interface ImageOptimizationOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'auto' | 'webp' | 'jpeg' | 'png';
  blur?: boolean;
}

/**
 * Check if browser supports WebP format
 */
const checkWebPSupport = (): boolean => {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/webp').startsWith('data:image/webp');
  } catch {
    return false;
  }
};

// Cache WebP support check result
let webpSupported: boolean | null = null;

const getWebPSupport = (): boolean => {
  if (webpSupported === null) {
    webpSupported = checkWebPSupport();
  }
  return webpSupported;
};

/**
 * Generate optimized image URL with size and format parameters
 */
export const getOptimizedImageUrl = (
  originalUrl: string, 
  size?: 'thumbnail' | 'medium' | 'full',
  customOptions?: ImageOptimizationOptions
): string => {
  // If no optimization service available, return original URL
  if (!originalUrl || typeof window === 'undefined') {
    return originalUrl;
  }

  const supportsWebP = getWebPSupport();
  
  // Size-based optimization presets
  const sizeParams = {
    thumbnail: { width: 200, height: 200, quality: 85 },
    medium: { width: 800, height: 600, quality: 90 },
    full: { width: 1200, height: 1200, quality: 95 }
  };
  
  // Merge size preset with custom options
  const baseOptions = size ? sizeParams[size] : {};
  const options = { ...baseOptions, ...customOptions };
  
  // Build URL parameters
  const params = new URLSearchParams();
  
  if (options.width) params.set('w', options.width.toString());
  if (options.height) params.set('h', options.height.toString());
  if (options.quality) params.set('q', options.quality.toString());
  if (options.blur) params.set('blur', '20');
  
  // Auto-detect best format
  const format = options.format === 'auto' ? (supportsWebP ? 'webp' : 'jpeg') : options.format;
  if (format) params.set('f', format);
  
  // For external URLs, we might need an image proxy service
  // For now, append parameters if the URL supports them
  const separator = originalUrl.includes('?') ? '&' : '?';
  return `${originalUrl}${separator}${params.toString()}`;
};

/**
 * React hook for automatic image optimization
 */
export const useOptimizedImage = (
  imageUrl: string, 
  size?: 'thumbnail' | 'medium' | 'full',
  options?: ImageOptimizationOptions
): string => {
  if (typeof window === 'undefined') {
    return imageUrl;
  }

  // Use useMemo equivalent for optimization
  const optimizedUrl = React.useMemo(() => {
    return getOptimizedImageUrl(imageUrl, size, options);
  }, [imageUrl, size, options]);

  return optimizedUrl;
};

/**
 * Generate responsive image srcSet for different screen densities
 */
export const generateImageSrcSet = (originalUrl: string): string => {
  if (!originalUrl) return '';
  
  const sizes = [
    { width: 400, density: '400w' },
    { width: 800, density: '800w' },
    { width: 1200, density: '1200w' },
    { width: 1600, density: '1600w' }
  ];
  
  return sizes
    .map(({ width, density }) => 
      `${getOptimizedImageUrl(originalUrl, undefined, { width })} ${density}`
    )
    .join(', ');
};

/**
 * Get optimal image format based on browser support and image type
 */
export const getOptimalFormat = (originalUrl: string): 'webp' | 'jpeg' | 'png' => {
  const supportsWebP = getWebPSupport();
  
  if (supportsWebP) {
    return 'webp';
  }
  
  // Fallback based on original format or default to JPEG
  if (originalUrl.includes('.png') || originalUrl.includes('png')) {
    return 'png';
  }
  
  return 'jpeg';
};

/**
 * Preload image with optimal format
 */
export const preloadOptimizedImage = (
  imageUrl: string,
  size?: 'thumbnail' | 'medium' | 'full',
  priority: 'high' | 'low' = 'low'
): void => {
  if (typeof window === 'undefined' || !imageUrl) return;
  
  const optimizedUrl = getOptimizedImageUrl(imageUrl, size);
  
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = optimizedUrl;
  link.as = 'image';
  
  // Set priority for critical images
  if (priority === 'high') {
    link.setAttribute('fetchpriority', 'high');
  }
  
  document.head.appendChild(link);
};

/**
 * Estimate file size reduction from optimization
 */
export const estimateOptimizationSavings = (
  originalUrl: string,
  size?: 'thumbnail' | 'medium' | 'full'
): { estimatedSavings: number; newFormat: string } => {
  const format = getOptimalFormat(originalUrl);
  
  // Rough estimates based on typical compression ratios
  const savingsEstimate = {
    webp: 0.4, // WebP typically 40% smaller than JPEG
    jpeg: 0.2, // JPEG optimization typically 20% smaller
    png: 0.3   // PNG optimization typically 30% smaller
  };
  
  const sizeSavings = {
    thumbnail: 0.8, // 80% size reduction for thumbnails
    medium: 0.5,    // 50% size reduction for medium
    full: 0.2       // 20% size reduction for full size
  };
  
  const formatSaving = savingsEstimate[format] || 0.2;
  const sizeSaving = size ? sizeSavings[size] : 0;
  
  const totalSavings = Math.min(0.9, formatSaving + sizeSaving); // Cap at 90%
  
  return {
    estimatedSavings: Math.round(totalSavings * 100),
    newFormat: format
  };
}; 