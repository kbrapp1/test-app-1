import { lazy } from 'react';
import React from 'react';

/**
 * Lazy loading utility for image generator components
 * Single responsibility: Provides reusable lazy loading patterns with error handling
 */

interface LazyComponentOptions {
  /** 
   * Retry loading on failure (useful for network issues)
   * @default 1
   */
  retries?: number;
  
  /**
   * Delay before retry (in milliseconds)
   * @default 1000
   */
  retryDelay?: number;
}

/**
 * Creates a lazy-loaded component with error handling and retry logic
 */
export function createLazyComponent(
  importFn: () => Promise<{ default: React.ComponentType<unknown> } | React.ComponentType<unknown>>,
  options: LazyComponentOptions = {}
) {
  const { retries = 1, retryDelay = 1000 } = options;
  
  return lazy(() => {
    let attemptCount = 0;
    
    const attemptImport = async (): Promise<{ default: React.ComponentType<unknown> }> => {
      try {
        const importedModule = await importFn();
        
        // Handle both default exports and named exports
        if (importedModule && typeof importedModule === 'object' && 'default' in importedModule) {
          return importedModule as { default: React.ComponentType<unknown> };
        } else {
          return { default: importedModule as React.ComponentType<unknown> };
        }
      } catch (error) {
        attemptCount++;
        
        if (attemptCount <= retries) {
          console.warn(`Failed to load component (attempt ${attemptCount}/${retries + 1}), retrying...`, error);
          
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          return attemptImport();
        }
        
        throw error;
      }
    };
    
    return attemptImport();
  });
}

/**
 * Preloads a lazy component without rendering it
 * Useful for preloading on hover or route pre-fetch
 */
export function preloadLazyComponent(importFn: () => Promise<{ default: React.ComponentType<unknown> } | React.ComponentType<unknown>>): void {
  importFn().catch((error) => {
    console.warn('Failed to preload component:', error);
  });
}

/**
 * Creates a hook for preloading components on user interaction
 */
export function useComponentPreloader() {
  const preload = (importFn: () => Promise<{ default: React.ComponentType<unknown> } | React.ComponentType<unknown>>) => {
    return () => preloadLazyComponent(importFn);
  };
  
  return { preload };
}

/**
 * Bundle size tracking (development only)
 */
export function logBundleSize(componentName: string, startTime: number) {
  if (process.env.NODE_ENV === 'development') {
    const loadTime = Date.now() - startTime;
    console.info(`📦 Lazy loaded ${componentName} in ${loadTime}ms`);
  }
} 