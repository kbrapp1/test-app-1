import { CrossDomainInsight } from '../../cross-domain/services/PerformanceCorrelationService';

export interface CrossDomainAnalysis {
  issue: string;
  rootCause: string;
  domains: string[];
  businessImpact: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  timeToFix: string;
  suggestedFix: string;
  codeExample?: string;
  implementationSteps: string[];
}

export class CrossDomainAnalysisService {
  static calculateBusinessImpact(issues: CrossDomainInsight[]): string {
    if (issues.length === 0) return 'No cross-domain performance issues';
    
    const criticalCount = issues.filter(i => i.severity === 'high').length;
    
    if (criticalCount > 0) {
      return `🔴 CRITICAL - ${criticalCount} compound performance issues severely impacting UX`;
    } else if (issues.length > 1) {
      return `🟡 HIGH - Multiple domain interactions causing performance degradation`;
    } else {
      return `🟢 MEDIUM - Minor cross-domain optimization opportunities`;
    }
  }

  static analyzeIssueForProduction(
    insight: CrossDomainInsight, 
    index: number,
    pageContext?: string
  ): CrossDomainAnalysis {
    let priority: 'critical' | 'high' | 'medium' | 'low' = 'medium';
    let timeToFix = '2-4 hours';
    let businessImpact = 'Cross-domain performance optimization';
    let rootCause = 'Domain interaction inefficiency';
    let suggestedFix = 'Coordinate frontend and network optimizations';
    let codeExample = '';
    let implementationSteps: string[] = [];

    if (insight.type === 'correlation' && insight.severity === 'high') {
      priority = 'critical';
      timeToFix = '4-6 hours';
      businessImpact = 'Compound performance issues severely impact user experience';
      rootCause = 'High re-renders AND redundant API calls amplifying each other';
      suggestedFix = 'Implement React Query caching AND component memoization simultaneously';
      
      codeExample = this.generateCorrelationCodeExample(pageContext);
      implementationSteps = this.getCorrelationImplementationSteps();
    } else if (insight.type === 'cascade') {
      priority = 'high';
      timeToFix = '3-5 hours';
      businessImpact = 'Network delays triggering frontend performance issues';
      rootCause = 'Slow network responses causing excessive component re-renders';
      suggestedFix = 'Optimize network calls and add loading states to prevent cascade';
      
      codeExample = this.generateCascadeCodeExample();
      implementationSteps = this.getCascadeImplementationSteps();
    } else if (insight.type === 'optimization') {
      priority = 'medium';
      timeToFix = '2-3 hours';
      businessImpact = 'Missing integrated caching strategy';
      rootCause = 'Frontend and network layers not coordinating optimizations';
      suggestedFix = 'Implement coordinated React Query caching strategy';
      
      codeExample = this.generateOptimizationCodeExample();
      implementationSteps = this.getOptimizationImplementationSteps();
    }

    return {
      issue: insight.title,
      rootCause,
      domains: insight.domains,
      businessImpact,
      priority,
      timeToFix,
      suggestedFix,
      codeExample: codeExample || undefined,
      implementationSteps
    };
  }

  static estimateCorrelationImprovement(issues: CrossDomainInsight[]): string {
    const correlationIssues = issues.filter(i => i.type === 'correlation');
    if (correlationIssues.length > 0) {
      return `${correlationIssues.length * 40}% improvement by fixing compound issues`;
    }
    return 'No correlation issues detected';
  }

  static estimateCascadeImprovement(issues: CrossDomainInsight[]): string {
    const cascadeIssues = issues.filter(i => i.type === 'cascade');
    if (cascadeIssues.length > 0) {
      return `${cascadeIssues.length * 30}% improvement by preventing cascades`;
    }
    return 'No cascade issues detected';
  }

  static estimateOptimizationImprovement(issues: CrossDomainInsight[]): string {
    const optimizationIssues = issues.filter(i => i.type === 'optimization');
    if (optimizationIssues.length > 0) {
      return `${optimizationIssues.length * 25}% improvement through coordination`;
    }
    return 'No optimization gaps detected';
  }

  private static generateCorrelationCodeExample(_pageContext?: string): string {
    return `// Fix both domains together for compound effect
// 1. Add React Query caching
const { data, isLoading } = useQuery({
  queryKey: ['data-key'],
  queryFn: fetchData,
  staleTime: 5 * 60 * 1000, // 5 minutes
});

// 2. Add component memoization
const MemoizedComponent = memo(({ data }) => {
  const processedData = useMemo(() => {
    return expensiveDataProcessing(data);
  }, [data]);
  
  return <div>{processedData}</div>;
});`;
  }

  private static generateCascadeCodeExample(): string {
    return `// Prevent network-to-frontend cascade
// 1. Optimize network calls
const { data, isLoading, error } = useQuery({
  queryKey: ['optimized-data'],
  queryFn: optimizedFetchFunction,
  staleTime: 10 * 60 * 1000, // Cache for 10 minutes
  refetchOnWindowFocus: false, // Prevent unnecessary refetches
});

// 2. Add proper loading states
if (isLoading) return <LoadingSkeleton />;
if (error) return <ErrorBoundary />;

// 3. Debounce user interactions
const debouncedSearch = useMemo(
  () => debounce(handleSearch, 300),
  []
);`;
  }

  private static generateOptimizationCodeExample(): string {
    return `// Coordinate frontend and network optimization
// Unified caching strategy
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
    },
  },
});

// Prevent redundant calls across components
const useSharedData = () => {
  return useQuery({
    queryKey: ['shared-data'],
    queryFn: fetchSharedData,
    // Shared across all components using this hook
  });
};`;
  }

  private static getCorrelationImplementationSteps(): string[] {
    return [
      'Identify components causing high re-renders',
      'Add React Query to eliminate redundant API calls',
      'Implement component memoization (React.memo, useMemo)',
      'Test both optimizations together',
      'Monitor for cascade reduction'
    ];
  }

  private static getCascadeImplementationSteps(): string[] {
    return [
      'Profile network calls causing delays',
      'Implement caching to reduce network latency',
      'Add proper loading states and skeletons',
      'Debounce user interactions to prevent cascade',
      'Monitor render count reduction'
    ];
  }

  private static getOptimizationImplementationSteps(): string[] {
    return [
      'Audit current caching patterns',
      'Implement React Query with unified configuration',
      'Share query keys across related components',
      'Test cache hit rates improvement',
      'Monitor network request reduction'
    ];
  }
} 