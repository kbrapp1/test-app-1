export type OptimizationType = 'caching' | 'memoization' | 'debouncing' | 'lazy-loading' | 'batching';
export type OptimizationSeverity = 'high' | 'medium' | 'low';

export class OptimizationGap {
  constructor(
    public readonly type: OptimizationType,
    public readonly title: string,
    public readonly description: string,
    public readonly severity: OptimizationSeverity,
    public readonly persistent: boolean
  ) {}

  static createCachingGap(): OptimizationGap {
    return new OptimizationGap(
      'caching',
      'React Query Caching',
      'No cached queries detected. Consider using React Query for API calls.',
      'medium',
      true
    );
  }

  static createMemoizationGap(renderCount: number): OptimizationGap {
    return new OptimizationGap(
      'memoization',
      'Component Memoization',
      'High re-render count. Consider useMemo, useCallback, or React.memo.',
      renderCount > 25 ? 'high' : 'medium',
      false
    );
  }

  static createDebouncingGap(): OptimizationGap {
    return new OptimizationGap(
      'debouncing',
      'Request Debouncing',
      'Low cache hit rate. Consider debouncing rapid API calls.',
      'medium',
      false
    );
  }

  static createLazyLoadingGap(): OptimizationGap {
    return new OptimizationGap(
      'lazy-loading',
      'Lazy Loading',
      'Slow content loading. Consider code splitting or lazy loading.',
      'high',
      false
    );
  }

  static createBatchingGap(): OptimizationGap {
    return new OptimizationGap(
      'batching',
      'Mutation Batching',
      'Multiple simultaneous mutations. Consider batching operations.',
      'medium',
      true
    );
  }
} 