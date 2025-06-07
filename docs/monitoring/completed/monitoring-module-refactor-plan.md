# Monitoring Module Refactoring Plan

**Duration:** 4-6 weeks  
**Priority:** High Impact Performance & Architecture Improvements  
**Scope:** Skip large file fixes but focus on critical architectural and performance fixes

---

## Phase 1: Critical Architecture Fixes (Week 1-2)

### Task 1.1: Fix Layer Dependency Violations
**Priority:** Critical | **Duration:** 3-4 days | **Impact:** Architecture Compliance

#### Step 1.1.1: Create Application Layer Interfaces
**File:** `lib/monitoring/application/interfaces/IBundleAnalysisService.ts`
```typescript
export interface IBundleAnalysisService {
  getBundleAnalysis(): Promise<BundleAnalysis>;
  getRouteSizes(): Promise<Record<string, number>>;
  getLargestImports(): Promise<ImportInfo[]>;
}
```

**File:** `lib/monitoring/application/interfaces/IComponentProfilerService.ts`
```typescript
export interface IComponentProfilerService {
  getComponentPerformance(): ComponentPerformanceMetric[];
  startProfiling(componentName: string): void;
  stopProfiling(componentName: string): void;
}
```

**File:** `lib/monitoring/application/interfaces/IResourceTimingService.ts`
```typescript
export interface IResourceTimingService {
  getResourceTiming(): ResourceTimingMetric[];
  getSlowResources(threshold: number): ResourceTimingMetric[];
}
```

#### Step 1.1.2: Update Infrastructure Services to Implement Interfaces
**File:** `lib/monitoring/infrastructure/services/BundleAnalysisService.ts`
```typescript
import { IBundleAnalysisService } from '../../application/interfaces/IBundleAnalysisService';

export class BundleAnalysisService implements IBundleAnalysisService {
  // Existing implementation
}
```

#### Step 1.1.3: Create Dependency Injection Container
**File:** `lib/monitoring/application/container/ServiceContainer.ts`
```typescript
import { IBundleAnalysisService } from '../interfaces/IBundleAnalysisService';
import { BundleAnalysisService } from '../../infrastructure/services/BundleAnalysisService';

export class ServiceContainer {
  private static instance: ServiceContainer;
  
  private constructor(
    public bundleAnalysisService: IBundleAnalysisService = new BundleAnalysisService(),
    public componentProfilerService: IComponentProfilerService = new ComponentProfilerService(),
    public resourceTimingService: IResourceTimingService = new ResourceTimingService()
  ) {}
  
  static getInstance(): ServiceContainer {
    if (!ServiceContainer.instance) {
      ServiceContainer.instance = new ServiceContainer();
    }
    return ServiceContainer.instance;
  }
}
```

#### Step 1.1.4: Update Application Services to Use Interfaces
**File:** `lib/monitoring/application/services/DetailedPerformanceService.ts`
```typescript
// Replace direct infrastructure imports
import { ServiceContainer } from '../container/ServiceContainer';

export class DetailedPerformanceService {
  private static container = ServiceContainer.getInstance();
  
  static async generateDetailedReport(/* params */) {
    const [bundleAnalysis, componentPerformance, resourceTiming] = await Promise.all([
      this.container.bundleAnalysisService.getBundleAnalysis(),
      Promise.resolve(this.container.componentProfilerService.getComponentPerformance()),
      Promise.resolve(this.container.resourceTimingService.getResourceTiming())
    ]);
    // Rest of implementation
  }
}
```

**Validation:**
- [ ] No direct infrastructure imports in application layer
- [ ] All services use dependency injection
- [ ] Interface abstractions properly defined

---

### Task 1.2: Improve Error Handling Patterns
**Priority:** High | **Duration:** 2-3 days | **Impact:** Reliability

#### Step 1.2.1: Create Monitoring Error Types
**File:** `lib/monitoring/domain/errors/MonitoringErrors.ts`
```typescript
export class NetworkTrackingError extends Error {
  constructor(message: string, public originalError?: Error) {
    super(`Network Tracking: ${message}`);
    this.name = 'NetworkTrackingError';
  }
}

export class PerformanceCalculationError extends Error {
  constructor(message: string, public context?: any) {
    super(`Performance Calculation: ${message}`);
    this.name = 'PerformanceCalculationError';
  }
}

export class SourceCaptureError extends Error {
  constructor(message: string, public source?: string) {
    super(`Source Capture: ${message}`);
    this.name = 'SourceCaptureError';
  }
}
```

#### Step 1.2.2: Add Error Boundaries in Infrastructure
**File:** `lib/monitoring/infrastructure/services/NetworkInterceptors.ts`
```typescript
// Replace silent error handling
private async captureSourceSafely(): Promise<CallSource | undefined> {
  try {
    const { SourceTracker } = await import('./SourceTracker');
    return SourceTracker.captureSource();
  } catch (error) {
    console.error(new SourceCaptureError(
      'Failed to capture call source',
      error instanceof Error ? error.message : 'Unknown error'
    ));
    return undefined;
  }
}
```

#### Step 1.2.3: Add Error Recovery in Application Services
**File:** `lib/monitoring/application/services/NetworkMonitoringService.ts`
```typescript
async trackNetworkCall(callData: NetworkCallData): Promise<string> {
  try {
    return await this.networkTracker.trackCall(callData);
  } catch (error) {
    const trackingError = new NetworkTrackingError(
      'Failed to track network call',
      error instanceof Error ? error : new Error(String(error))
    );
    
    // Log error and return fallback
    console.error(trackingError);
    return this.generateFallbackCallId();
  }
}

private generateFallbackCallId(): string {
  return `fallback-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
```

**Validation:**
- [ ] Proper error types defined
- [ ] No silent error swallowing
- [ ] Graceful degradation implemented
- [ ] Error context preserved

---

## Phase 2: React Query Implementation (Week 2-3)

### Task 2.1: Create React Query Hooks for Performance Data
**Priority:** Critical | **Duration:** 4-5 days | **Impact:** 40-60% Performance Improvement

#### Step 2.1.1: Create Performance Data Query Hook
**File:** `lib/monitoring/presentation/hooks/queries/usePerformanceMetrics.ts`
```typescript
import { useQuery } from '@tanstack/react-query';
import { PerformanceMetrics } from '../../../domain/entities/PerformanceMetrics';
import { ServiceContainer } from '../../../application/container/ServiceContainer';

const PERFORMANCE_QUERY_KEY = ['monitoring', 'performance'] as const;

export function usePerformanceMetrics(enabled = true) {
  const container = ServiceContainer.getInstance();
  
  return useQuery({
    queryKey: PERFORMANCE_QUERY_KEY,
    queryFn: async (): Promise<PerformanceMetrics> => {
      // Implementation to gather performance metrics
      return container.performanceService.getCurrentMetrics();
    },
    staleTime: 30000,      // 30 seconds
    gcTime: 300000,        // 5 minutes
    refetchInterval: 60000, // 1 minute
    enabled,
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

export function useInvalidatePerformanceMetrics() {
  const queryClient = useQueryClient();
  
  return useCallback(() => {
    queryClient.invalidateQueries({ queryKey: PERFORMANCE_QUERY_KEY });
  }, [queryClient]);
}
```

#### Step 2.1.2: Create Network Monitoring Query Hook
**File:** `lib/monitoring/presentation/hooks/queries/useNetworkMonitoring.ts`
```typescript
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { NetworkStats } from '../../../application/dto/NetworkStatsDTO';

const NETWORK_MONITORING_QUERY_KEY = ['monitoring', 'network'] as const;

export function useNetworkMonitoring(enabled = true) {
  return useQuery({
    queryKey: NETWORK_MONITORING_QUERY_KEY,
    queryFn: async (): Promise<NetworkStats> => {
      const container = ServiceContainer.getInstance();
      return container.networkMonitoringService.getCurrentStats();
    },
    staleTime: 15000,      // 15 seconds (more frequent for network data)
    gcTime: 180000,        // 3 minutes
    refetchInterval: 30000, // 30 seconds
    enabled,
    retry: 2,
  });
}

export function useClearNetworkData() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      const container = ServiceContainer.getInstance();
      await container.networkMonitoringService.clearAllData();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NETWORK_MONITORING_QUERY_KEY });
    },
  });
}
```

#### Step 2.1.3: Create Detailed Performance Report Hook
**File:** `lib/monitoring/presentation/hooks/queries/useDetailedPerformanceReport.ts`
```typescript
import { useQuery } from '@tanstack/react-query';
import { DetailedPerformanceMetrics } from '../../../domain/entities/DetailedPerformanceMetrics';

export function useDetailedPerformanceReport(
  basicMetrics: PerformanceMetrics,
  pageContext: string,
  enabled = true
) {
  return useQuery({
    queryKey: ['monitoring', 'detailed-report', pageContext, basicMetrics.timestamp],
    queryFn: async (): Promise<DetailedPerformanceMetrics> => {
      const container = ServiceContainer.getInstance();
      return container.detailedPerformanceService.generateDetailedReport(
        basicMetrics,
        [], // optimizations - to be filled
        pageContext
      );
    },
    staleTime: 120000,  // 2 minutes (expensive operation)
    gcTime: 600000,     // 10 minutes
    enabled: enabled && !!basicMetrics && !!pageContext,
    retry: 1,           // Expensive operation, minimal retries
  });
}
```

#### Step 2.1.4: Update Existing Hooks to Use React Query
**File:** `lib/monitoring/presentation/hooks/usePerformanceDashboard.ts`
```typescript
// Replace direct service calls with React Query hooks
import { usePerformanceMetrics } from './queries/usePerformanceMetrics';
import { useNetworkMonitoring } from './queries/useNetworkMonitoring';
import { useDetailedPerformanceReport } from './queries/useDetailedPerformanceReport';

export function usePerformanceDashboard(initialMetrics?: PerformanceMetrics) {
  // Use React Query for data fetching
  const { 
    data: performanceMetrics, 
    isLoading: performanceLoading,
    error: performanceError 
  } = usePerformanceMetrics();
  
  const { 
    data: networkStats, 
    isLoading: networkLoading 
  } = useNetworkMonitoring();
  
  const { 
    data: detailedReport,
    isLoading: reportLoading 
  } = useDetailedPerformanceReport(
    performanceMetrics || initialMetrics,
    'dashboard',
    !!performanceMetrics
  );
  
  // Memoized calculations (optimized)
  const overallScore = useMemo(() => {
    if (!performanceMetrics || !networkStats) return 0;
    return calculateOverallScore(performanceMetrics, networkStats);
  }, [performanceMetrics?.id, networkStats?.sessionId]);
  
  // Rest of hook implementation...
}
```

**Validation:**
- [ ] All data fetching uses React Query
- [ ] Proper cache configuration (staleTime, gcTime)
- [ ] Query invalidation patterns implemented
- [ ] Loading and error states handled

---

### Task 2.2: Optimize Component Performance
**Priority:** High | **Duration:** 2-3 days | **Impact:** 20-30% Render Performance

#### Step 2.2.1: Add React.memo to Performance Components
**File:** `lib/monitoring/presentation/components/PerformanceDashboard.tsx`
```typescript
import React from 'react';

interface PerformanceDashboardProps {
  metrics: PerformanceMetrics;
  onRefresh: () => void;
}

const PerformanceDashboard = React.memo<PerformanceDashboardProps>(({ 
  metrics, 
  onRefresh 
}) => {
  // Component implementation
}, (prevProps, nextProps) => {
  // Custom comparison for optimal re-rendering
  return (
    prevProps.metrics.id === nextProps.metrics.id &&
    prevProps.metrics.timestamp === nextProps.metrics.timestamp &&
    prevProps.onRefresh === nextProps.onRefresh
  );
});

PerformanceDashboard.displayName = 'PerformanceDashboard';
export default PerformanceDashboard;
```

#### Step 2.2.2: Optimize useMemo Dependencies
**File:** `lib/monitoring/presentation/hooks/usePerformanceDashboard.ts`
```typescript
// Optimize memoization with minimal dependencies
const frontendPerformanceScore = useMemo(() => {
  if (!performanceMetrics) return 0;
  return PerformanceCalculationService.calculateScore(performanceMetrics);
}, [
  performanceMetrics?.id,           // Use ID instead of full object
  performanceMetrics?.timestamp     // Key identifiers only
]);

const networkPerformanceScore = useMemo(() => {
  if (!networkStats) return 100;
  return Math.round(100 - networkStats.redundancyRate);
}, [networkStats?.redundancyRate]);  // Specific property only

// Cache expensive calculations
const performanceInsights = useMemo(() => {
  if (!detailedReport) return [];
  return generatePerformanceInsights(detailedReport);
}, [detailedReport?.timestamp]);     // Use timestamp for cache invalidation
```

#### Step 2.2.3: Optimize Event Handlers
**File:** `lib/monitoring/presentation/hooks/usePerformanceDashboard.ts`
```typescript
// Stable event handlers with useCallback
const toggleSection = useCallback((section: keyof ExpandableSections) => {
  setExpandedSections(prev => ({
    ...prev,
    [section]: !prev[section]
  }));
}, []); // No dependencies - pure state update

const handleFullReset = useCallback(async () => {
  try {
    setShowFullResetConfirm(false);
    await Promise.all([
      resetPerformanceCounters(),
      clearNetworkData.mutateAsync()
    ]);
  } catch (error) {
    console.error('Failed to reset performance data:', error);
  }
}, [resetPerformanceCounters, clearNetworkData.mutateAsync]);

const handleRefreshData = useCallback(() => {
  invalidatePerformanceMetrics();
  invalidateNetworkData();
}, [invalidatePerformanceMetrics, invalidateNetworkData]);
```

**Validation:**
- [ ] Components properly memoized
- [ ] useMemo dependencies minimized
- [ ] Event handlers use useCallback
- [ ] No unnecessary re-renders

---

## Phase 3: Memory Management & Cleanup (Week 3-4)

### Task 3.1: Fix Memory Leaks and Add Cleanup
**Priority:** Medium | **Duration:** 2-3 days | **Impact:** Memory Efficiency

#### Step 3.1.1: Add Proper Cleanup in Hooks
**File:** `lib/monitoring/presentation/hooks/usePerformanceDashboard.ts`
```typescript
export function usePerformanceDashboard(initialMetrics?: PerformanceMetrics) {
  const fullResetTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (fullResetTimeoutRef.current) {
        clearTimeout(fullResetTimeoutRef.current);
        fullResetTimeoutRef.current = null;
      }
    };
  }, []);
  
  // Reset confirmation with cleanup
  const showResetConfirmation = useCallback(() => {
    setShowFullResetConfirm(true);
    
    // Clear existing timeout
    if (fullResetTimeoutRef.current) {
      clearTimeout(fullResetTimeoutRef.current);
    }
    
    // Auto-hide after 5 seconds
    fullResetTimeoutRef.current = setTimeout(() => {
      setShowFullResetConfirm(false);
      fullResetTimeoutRef.current = null;
    }, 5000);
  }, []);
}
```

#### Step 3.1.2: Add AbortController Patterns
**File:** `lib/monitoring/application/services/DetailedPerformanceService.ts`
```typescript
export class DetailedPerformanceService {
  static async generateDetailedReport(
    basicMetrics: PerformanceMetrics,
    optimizations: OptimizationGap[],
    pageContext: string,
    abortSignal?: AbortSignal
  ): Promise<DetailedPerformanceMetrics> {
    
    const container = ServiceContainer.getInstance();
    
    // Check for abort before expensive operations
    if (abortSignal?.aborted) {
      throw new Error('Operation aborted');
    }
    
    const [bundleAnalysis, componentPerformance, resourceTiming] = await Promise.all([
      container.bundleAnalysisService.getBundleAnalysis(),
      Promise.resolve(container.componentProfilerService.getComponentPerformance()),
      Promise.resolve(container.resourceTimingService.getResourceTiming())
    ]);
    
    if (abortSignal?.aborted) {
      throw new Error('Operation aborted during data collection');
    }
    
    // Continue with report generation...
  }
}
```

#### Step 3.1.3: Add React Query Cache Limits
**File:** `lib/monitoring/presentation/providers/MonitoringQueryProvider.tsx`
```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const monitoringQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,
      gcTime: 300000,
      retry: 3,
      refetchOnWindowFocus: false,
    },
  },
  cache: {
    maxSize: 50, // Limit cache size for monitoring queries
  },
});

export function MonitoringQueryProvider({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={monitoringQueryClient}>
      {children}
    </QueryClientProvider>
  );
}
```

**Validation:**
- [ ] All timeouts properly cleaned up
- [ ] AbortController patterns implemented
- [ ] React Query cache limits configured
- [ ] No memory leaks in hooks

---

## Phase 4: Enhanced Testing (Week 4-5)

### Task 4.1: Add Comprehensive Unit Tests
**Priority:** Medium | **Duration:** 3-4 days | **Impact:** Quality Assurance

#### Step 4.1.1: Test Domain Services
**File:** `lib/monitoring/domain/services/__tests__/NetworkAnalysisService.test.ts`
```typescript
import { NetworkAnalysisService } from '../NetworkAnalysisService';
import { NetworkIssue } from '../../network-efficiency/value-objects/NetworkIssue';

describe('NetworkAnalysisService', () => {
  describe('calculateBusinessImpact', () => {
    it('should return no impact for empty issues', () => {
      const result = NetworkAnalysisService.calculateBusinessImpact([]);
      expect(result).toBe('No network impact detected');
    });

    it('should identify critical impact for high severity issues', () => {
      const issues: NetworkIssue[] = [
        { severity: 'high', type: 'redundancy', count: 5, title: 'Test Issue' }
      ];
      const result = NetworkAnalysisService.calculateBusinessImpact(issues);
      expect(result).toContain('Critical impact: 1 high-severity');
    });
  });

  describe('analyzeIssueForProduction', () => {
    it('should generate proper analysis for redundancy issues', () => {
      const issue: NetworkIssue = {
        type: 'redundancy',
        severity: 'high',
        title: 'Duplicate API calls',
        count: 3
      };
      
      const analysis = NetworkAnalysisService.analyzeIssueForProduction(issue, 0);
      
      expect(analysis.priority).toBe('critical');
      expect(analysis.timeToFix).toBe('2-4 hours');
      expect(analysis.suggestedFix).toContain('React Query');
    });
  });
});
```

#### Step 4.1.2: Test React Query Hooks
**File:** `lib/monitoring/presentation/hooks/__tests__/usePerformanceMetrics.test.ts`
```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { usePerformanceMetrics } from '../queries/usePerformanceMetrics';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('usePerformanceMetrics', () => {
  it('should fetch performance metrics successfully', async () => {
    const { result } = renderHook(() => usePerformanceMetrics(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toBeDefined();
  });

  it('should not fetch when disabled', () => {
    const { result } = renderHook(() => usePerformanceMetrics(false), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeUndefined();
  });
});
```

#### Step 4.1.3: Test Error Handling
**File:** `lib/monitoring/infrastructure/services/__tests__/NetworkInterceptors.test.ts`
```typescript
import { NetworkInterceptors } from '../NetworkInterceptors';
import { NetworkTrackingError } from '../../../domain/errors/MonitoringErrors';

describe('NetworkInterceptors', () => {
  let interceptors: NetworkInterceptors;

  beforeEach(() => {
    interceptors = new NetworkInterceptors();
  });

  afterEach(() => {
    interceptors.uninstall();
  });

  it('should handle source capture errors gracefully', async () => {
    // Mock SourceTracker to throw error
    jest.mock('../SourceTracker', () => ({
      SourceTracker: {
        captureSource: jest.fn().mockImplementation(() => {
          throw new Error('Source capture failed');
        })
      }
    }));

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    
    interceptors.install();
    
    // Trigger a fetch that would capture source
    await fetch('/test-endpoint');
    
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.any(SourceCaptureError)
    );
    
    consoleSpy.mockRestore();
  });
});
```

**Validation:**
- [ ] Domain services have unit tests
- [ ] React Query hooks are tested
- [ ] Error scenarios are covered
- [ ] Mocking strategies implemented

---

## Phase 5: Bundle Optimization (Week 5-6)

### Task 5.1: Implement Code Splitting
**Priority:** Low | **Duration:** 2-3 days | **Impact:** 10-15% Bundle Reduction

#### Step 5.1.1: Lazy Load Heavy Analysis Components
**File:** `lib/monitoring/presentation/components/DetailedReportModal.tsx`
```typescript
import { lazy, Suspense } from 'react';

const LazyDetailedPerformanceReport = lazy(() => 
  import('./DetailedPerformanceReport').then(module => ({
    default: module.DetailedPerformanceReport
  }))
);

export function DetailedReportModal({ isOpen, onClose }: Props) {
  if (!isOpen) return null;

  return (
    <div className="modal">
      <Suspense fallback={<div>Loading detailed report...</div>}>
        <LazyDetailedPerformanceReport />
      </Suspense>
    </div>
  );
}
```

#### Step 5.1.2: Optimize Import Patterns
**File:** `lib/monitoring/presentation/index.ts`
```typescript
// Avoid barrel exports that prevent tree shaking
export { usePerformanceMetrics } from './hooks/queries/usePerformanceMetrics';
export { useNetworkMonitoring } from './hooks/queries/useNetworkMonitoring';

// Don't export everything from a directory
// ❌ export * from './hooks';
// ✅ Selective exports above
```

#### Step 5.1.3: Add Dynamic Imports for Heavy Operations
**File:** `lib/monitoring/application/services/DetailedPerformanceService.ts`
```typescript
export class DetailedPerformanceService {
  static async generateDetailedReport(/* params */) {
    // Dynamically import heavy analysis modules
    const [
      { BundleAnalysisService },
      { ComponentProfilerService },
      { ResourceTimingService }
    ] = await Promise.all([
      import('../../infrastructure/services/BundleAnalysisService'),
      import('../../infrastructure/services/ComponentProfilerService'),
      import('../../infrastructure/services/ResourceTimingService')
    ]);

    // Use the imported services...
  }
}
```

**Validation:**
- [ ] Heavy components are lazy loaded
- [ ] Tree shaking is not blocked
- [ ] Dynamic imports used for expensive operations
- [ ] Bundle analyzer shows size reduction

---

## Testing & Validation Checklist

### After Each Phase:
- [ ] Run `pnpm test` to ensure no regressions
- [ ] Verify TypeScript compilation succeeds
- [ ] Check React Query DevTools for proper cache behavior
- [ ] Monitor bundle size changes
- [ ] Test error scenarios manually

### Performance Validation:
- [ ] Measure component render times before/after
- [ ] Monitor memory usage in DevTools
- [ ] Check for proper query deduplication
- [ ] Verify cache hit rates improve

### Architecture Validation:
- [ ] Confirm no circular dependencies
- [ ] Verify proper layer separation
- [ ] Check interface implementations
- [ ] Validate error handling coverage

---

## Success Metrics

### Performance Improvements:
- **40-60% reduction** in unnecessary re-renders (React Query)
- **20-30% faster** component rendering (memoization)
- **10-15% smaller** bundle size (code splitting)
- **95%+ cache hit rate** for performance data

### Code Quality Improvements:
- **0 architectural violations** (layer dependencies)
- **80%+ test coverage** for critical paths
- **100% error handling** coverage
- **0 memory leaks** in production

### Developer Experience:
- **Faster development** with proper abstractions
- **Easier debugging** with structured errors
- **Better maintainability** with clear separation
- **Improved monitoring** of monitoring performance

---

## Risk Mitigation

### Potential Risks:
1. **Breaking changes** during refactoring
   - **Mitigation:** Incremental changes with tests
2. **Performance regression** during optimization
   - **Mitigation:** Before/after benchmarks
3. **Complex merge conflicts**
   - **Mitigation:** Frequent small commits

### Rollback Plan:
- Keep original implementations during transition
- Feature flags for new React Query implementation
- Ability to fallback to direct service calls if needed 