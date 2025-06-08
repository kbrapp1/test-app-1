// Lazy Component Loader - Presentation Layer
// Single Responsibility: Dynamically load heavy UI components for better performance
// Following Golden Rule: Presentation service for code splitting optimization

import React, { lazy } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { withLazyLoading, makePreloadComponents } from '@/lib/utils/lazyLoader';

/**
 * Lazy Component Loader with Loading States
 * Implements dynamic imports with proper loading fallbacks
 */

// Loading fallback components
const ProviderSelectorSkeleton = () => (
  <div className="space-y-2">
    <Skeleton className="h-4 w-24" />
    <Skeleton className="h-10 w-full" />
  </div>
);

const HistoryPanelSkeleton = () => (
  <div className="space-y-4 p-4">
    <Skeleton className="h-6 w-32" />
    <div className="grid grid-cols-2 gap-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="aspect-square w-full" />
      ))}
    </div>
  </div>
);

const ImageEditorSkeleton = () => (
  <div className="space-y-4">
    <Skeleton className="aspect-video w-full" />
    <div className="flex gap-2">
      <Skeleton className="h-8 w-16" />
      <Skeleton className="h-8 w-16" />
      <Skeleton className="h-8 w-16" />
    </div>
  </div>
);

// Lazy-loaded components with dynamic imports and monitoring integration
export const LazyProviderSelector = lazy(async () => {
  const startTime = performance.now();
  const { ProviderSelector } = await import('./providers/ProviderSelector');
  
  // Track component load via monitoring service
  if (typeof window !== 'undefined') {
    import('../../../monitoring/application/services/BundleMonitoringService').then(({ BundleMonitoringService }) => {
      const loadTime = performance.now() - startTime;
      const service = new BundleMonitoringService();
      service.trackBundleMetrics(
        'image-generator',
        { initialLoadTime: loadTime, componentLoadTimes: { 'ProviderSelector': loadTime }, providerLoadTimes: {}, totalBundleSize: 50000, criticalPathSize: 15000 },
        { hitRatio: 0, missCount: 1, hitCount: 0, cacheSize: 0, memoryUsage: 25000 },
        { lazyLoadingEnabled: true, dynamicImportsCount: 1, codeSpittingRatio: 0.7, parallelLoadingEnabled: true }
      );
    });
  }
  
  return { default: ProviderSelector };
});

export const LazyHistoryPanel = lazy(async () => {
  const startTime = performance.now();
  const { HistoryPanel } = await import('./generation/history/HistoryPanel');
  
  if (typeof window !== 'undefined') {
    import('../../../monitoring/application/services/BundleMonitoringService').then(({ BundleMonitoringService }) => {
      const loadTime = performance.now() - startTime;
      const service = new BundleMonitoringService();
      service.trackBundleMetrics(
        'image-generator',
        { initialLoadTime: loadTime, componentLoadTimes: { 'HistoryPanel': loadTime }, providerLoadTimes: {}, totalBundleSize: 75000, criticalPathSize: 15000 },
        { hitRatio: 0, missCount: 1, hitCount: 0, cacheSize: 0, memoryUsage: 40000 },
        { lazyLoadingEnabled: true, dynamicImportsCount: 1, codeSpittingRatio: 0.7, parallelLoadingEnabled: true }
      );
    }).catch(err => {
      console.error('❌ Failed to track bundle metrics:', err);
    });
  }
  
  return { default: HistoryPanel };
});

export const LazyImageEditor = lazy(async () => {
  // Future component for image editing functionality
  // Return a placeholder component since ImageEditor doesn't exist yet
  return { 
    default: () => (
      <div className="p-4 text-center text-muted-foreground">
        Image editor coming soon...
      </div>
    )
  };
});

// Wrap lazy components with consistent loading and error handling
export const LazyProviderSelectorWithLoading = withLazyLoading(
  LazyProviderSelector,
  ProviderSelectorSkeleton
);

export const LazyHistoryPanelWithLoading = withLazyLoading(
  LazyHistoryPanel,
  HistoryPanelSkeleton
);

export const LazyImageEditorWithLoading = withLazyLoading(
  LazyImageEditor,
  ImageEditorSkeleton
);

// Preload feature components and track metrics
export const preloadComponents = makePreloadComponents({
  providerSelector: async () => {
    const startTime = performance.now();
    const mod = await import('./providers/ProviderSelector');
    const loadTime = performance.now() - startTime;
    const { BundleMonitoringService } = await import('../../../monitoring/application/services/BundleMonitoringService');
    new BundleMonitoringService().trackBundleMetrics(
      'ProviderSelector',
      { initialLoadTime: loadTime, componentLoadTimes: { ProviderSelector: loadTime }, providerLoadTimes: {}, totalBundleSize: 50000, criticalPathSize: 15000 },
      { hitRatio: 0, missCount: 1, hitCount: 0, cacheSize: 0, memoryUsage: 25000 },
      { lazyLoadingEnabled: true, dynamicImportsCount: 1, codeSpittingRatio: 0.7, parallelLoadingEnabled: true }
    );
    return mod;
  },
  historyPanel: async () => await import('./generation/history/HistoryPanel'),
  imageEditor: async () => {
    const startTime = performance.now();
    const loadTime = performance.now() - startTime;
    const { BundleMonitoringService } = await import('../../../monitoring/application/services/BundleMonitoringService');
    new BundleMonitoringService().trackBundleMetrics(
      'ImageEditor',
      { initialLoadTime: loadTime, componentLoadTimes: { ImageEditor: loadTime }, providerLoadTimes: {}, totalBundleSize: 15000, criticalPathSize: 5000 },
      { hitRatio: 0, missCount: 1, hitCount: 0, cacheSize: 0, memoryUsage: 5000 },
      { lazyLoadingEnabled: true, dynamicImportsCount: 0, codeSpittingRatio: 0.7, parallelLoadingEnabled: true }
    );
    return Promise.resolve(null);
  }
}); 