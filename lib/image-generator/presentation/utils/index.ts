// Tree-shaking optimized exports
// Single responsibility: Explicit exports for maximum tree shaking efficiency

// Lazy loading utilities - explicit exports only
export { createLazyComponent, preloadLazyComponent, useComponentPreloader, logBundleSize } from './lazyLoader';

// Image optimization utilities (when implemented)
export { getOptimizedImageUrl, useOptimizedImage } from './imageOptimization';

// Performance utilities  
// export { debounce } from './performance'; // TODO: Implement when needed

// Bundle analyzer utility (development only)
export const analyzeBundleSize = () => {
  if (process.env.NODE_ENV === 'development') {
    console.group('📦 Bundle Analysis');
    console.info('Image Generator Lazy Components:', [
      'PerformanceMonitor', 'StyleSection', 'ProviderSelector', 
      'GenerationActions', 'VirtualizedGenerationList', 'GenerationStats'
    ]);
    console.info('Use React DevTools Profiler to measure lazy loading impact');
    console.groupEnd();
  }
}; 