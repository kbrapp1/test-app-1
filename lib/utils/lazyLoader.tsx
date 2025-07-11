import React, { Suspense, ComponentType } from 'react';

/**
 * Error boundary for lazy-loaded components
 */
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: ComponentType<{ error: Error; retry: () => void }> },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error for monitoring
    console.error('Lazy component error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError && this.state.error) {
      const Fallback = this.props.fallback;
      return <Fallback error={this.state.error} retry={() => this.setState({ hasError: false, error: null })} />;
    }
    return this.props.children;
  }
}

/**
 * HOC to wrap a lazy-loaded component with loading fallback and error boundary
 */
export function withLazyLoading<T extends object>(
  LazyComponent: ComponentType<T>,
  LoadingSkeleton: ComponentType,
  errorFallback?: ComponentType<{ error: Error; retry: () => void }>
): ComponentType<T> {
  return function LazyLoadedComponent(props: T) {
    const DefaultErrorFallback = ({ retry }: { error: Error; retry: () => void }) => (
      <div className="p-4 border border-destructive/20 rounded-lg">
        <p className="text-sm text-destructive mb-2">Failed to load component</p>
        <button onClick={retry} className="text-xs text-primary hover:underline">
          Try again
        </button>
      </div>
    );

    return (
      <Suspense fallback={<LoadingSkeleton />}>  
        <ErrorBoundary fallback={errorFallback || DefaultErrorFallback}>
          <LazyComponent {...props} />
        </ErrorBoundary>
      </Suspense>
    );
  };
}

/**
 * Factory to create preload functions for dynamic imports
 */
export function makePreloadComponents(
  importers: Record<string, () => Promise<any>>
): Record<string, () => Promise<any>> & { all(): Promise<PromiseSettledResult<any>[]> } {
  const preloads: Record<string, () => Promise<any>> = { ...importers };
  return {
    ...preloads,
    all: () => Promise.allSettled(Object.values(preloads).map(fn => fn())),
  };
} 