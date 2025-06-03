'use client';

import React, { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

interface LazyLoadWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
}

/**
 * LazyLoadWrapper Component
 * Single responsibility: Provides consistent loading states for lazy-loaded components
 */
export const LazyLoadWrapper: React.FC<LazyLoadWrapperProps> = ({
  children,
  fallback,
  className = '',
}) => {
  const defaultFallback = (
    <div className={`flex items-center justify-center p-8 ${className}`}>
      <div className="flex flex-col items-center space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Loading component...</p>
      </div>
    </div>
  );

  return (
    <Suspense fallback={fallback || defaultFallback}>
      {children}
    </Suspense>
  );
};

/**
 * Specialized loading states for different component types
 */
export const FormSectionLoader = () => (
  <div className="space-y-4 p-4">
    <div className="h-6 bg-muted animate-pulse rounded" />
    <div className="h-10 bg-muted animate-pulse rounded" />
    <div className="h-6 bg-muted animate-pulse rounded w-3/4" />
    <div className="h-10 bg-muted animate-pulse rounded" />
  </div>
);

export const StatsLoader = () => (
  <div className="grid grid-cols-2 gap-4 p-4">
    <div className="h-20 bg-muted animate-pulse rounded" />
    <div className="h-20 bg-muted animate-pulse rounded" />
    <div className="h-20 bg-muted animate-pulse rounded" />
    <div className="h-20 bg-muted animate-pulse rounded" />
  </div>
);

export const SidebarLoader = () => (
  <div className="w-80 space-y-4 p-4 border-r">
    <div className="h-8 bg-muted animate-pulse rounded" />
    <div className="space-y-2">
      <div className="h-4 bg-muted animate-pulse rounded" />
      <div className="h-4 bg-muted animate-pulse rounded w-2/3" />
    </div>
    <div className="h-32 bg-muted animate-pulse rounded" />
  </div>
);

/**
 * Hook for creating component-specific lazy wrappers
 */
export const useLazyWrapper = (FallbackComponent?: React.ComponentType) => {
  return React.useCallback(
    ({ children, ...props }: { children: React.ReactNode; [key: string]: any }) => (
      <LazyLoadWrapper fallback={FallbackComponent ? <FallbackComponent {...props} /> : undefined}>
        {children}
      </LazyLoadWrapper>
    ),
    [FallbackComponent]
  );
}; 