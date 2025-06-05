export interface BundleAnalysis {
  totalSize: number;
  chunks: ChunkInfo[];
  largestImports: ImportInfo[];
  unusedImports: string[];
  routeSizes: Record<string, number>;
}

export interface ChunkInfo {
  name: string;
  size: number;
  files: string[];
  modules: ModuleInfo[];
}

export interface ModuleInfo {
  name: string;
  size: number;
  reasons: string[];
}

export interface ImportInfo {
  module: string;
  size: number;
  component: string;
  isLazyLoadable: boolean;
}

export interface ComponentPerformance {
  name: string;
  mountTime: number;
  renderTime: number;
  reRenderCount: number;
  memoryUsage: number;
  children: ComponentPerformance[];
}

export interface ResourceTiming {
  name: string;
  type: 'script' | 'stylesheet' | 'image' | 'fetch' | 'navigation';
  size: number;
  duration: number;
  startTime: number;
  dnsLookup: number;
  tcpConnect: number;
  sslHandshake: number;
  ttfb: number;
  download: number;
}

export interface DetailedPerformanceMetrics {
  pageContext: string;
  timestamp: string;
  
  // Basic metrics (existing)
  renders: number;
  cacheHitRate: number;
  cacheSize: number;
  activeMutations: number;
  avgResponseTime: number;
  
  // Enhanced metrics
  bundleAnalysis: BundleAnalysis;
  componentPerformance: ComponentPerformance[];
  resourceTiming: ResourceTiming[];
  
  // Performance recommendations
  criticalIssues: PerformanceIssue[];
  optimizationOpportunities: OptimizationOpportunity[];
}

export interface PerformanceIssue {
  type: 'bundle-size' | 'component-performance' | 'resource-loading' | 'lazy-loading';
  severity: 'low' | 'medium' | 'high' | 'critical';
  component?: string;
  description: string;
  impact: string;
  solution: string;
  estimatedImprovement: string;
}

export interface OptimizationOpportunity {
  type: 'code-splitting' | 'lazy-loading' | 'image-optimization' | 'bundle-optimization';
  target: string;
  currentSize: number;
  potentialSavings: number;
  effort: 'low' | 'medium' | 'high';
  implementation: string;
} 