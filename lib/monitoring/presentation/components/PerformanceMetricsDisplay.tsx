'use client';

import React from 'react';
import { Database, Zap, Gauge, Copy, Check } from 'lucide-react';
import { PerformanceMetrics, WebVitalsMetrics } from '../../domain/entities/PerformanceMetrics';
import { PerformanceTrackingState } from '../hooks/usePerformanceTracking';
import { OptimizationGap } from '../../domain/value-objects/OptimizationGap';
import { OptimizationStatusDisplay } from './OptimizationStatusDisplay';

interface PerformanceMetricsDisplayProps {
  metrics: PerformanceMetrics;
  trackingState: PerformanceTrackingState;
  frontendOptimizations?: OptimizationGap[];
}

export interface FrontendIssueAnalysis {
  component?: string;
  hook?: string;
  file?: string;
  issue: string;
  suggestedFix: string;
  reactQueryKey?: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  timeToFix: string;
  businessImpact: string;
  codeExample?: string;
  webVitalImpact?: string;
}

// Enhanced frontend performance report for production use
function formatFrontendReport(
  metrics: PerformanceMetrics, 
  trackingState: PerformanceTrackingState, 
  frontendOptimizations: OptimizationGap[]
): string {
  const timestamp = new Date().toISOString();
  const reportLines = [
    `# 🚀 Frontend Performance Report - PRODUCTION READY`,
    `Generated: ${timestamp}`,
    ``,
    `## 📊 Executive Summary`,
    `- **Page Context**: ${trackingState.pageContext}`,
    `- **Total Renders**: ${trackingState.renderMetrics.count}`,
    `- **Cache Performance**: ${trackingState.cacheHitRate.toFixed(1)}% hit rate`,
    `- **Cache Size**: ${metrics.cacheSize} queries cached`,
    `- **Active Mutations**: ${metrics.activeMutations}`,
    `- **Avg Response Time**: ${trackingState.avgResponseTime}ms`,
    `- **Issues Found**: ${frontendOptimizations.length}`,
    ``,
    `## 🎯 Business Impact`,
    calculateFrontendBusinessImpact(trackingState, metrics),
    ``
  ];

  // Web Vitals with production analysis
  reportLines.push(`## 📈 Web Vitals Performance`);
  if (Object.keys(trackingState.webVitals).length > 0) {
    Object.entries(trackingState.webVitals).forEach(([metric, value]) => {
      const rating = getWebVitalRating(metric as keyof WebVitalsMetrics, value);
      const impact = getWebVitalBusinessImpact(metric as keyof WebVitalsMetrics, value, rating);
      const displayValue = metric === 'CLS' ? value?.toFixed(3) : 
                         metric === 'LCP' || metric === 'FCP' || metric === 'TTFB' ? `${Math.round(value || 0)}ms` :
                         metric === 'INP' ? `${Math.round(value || 0)}ms` : value;
      
      reportLines.push(`- **${metric}**: ${displayValue || '--'} (${rating.toUpperCase()}) - ${impact}`);
    });
  } else {
    reportLines.push(`- 📊 Collecting Web Vitals metrics...`);
  }

  reportLines.push(``, `## 🔧 Frontend Issues (Copy/Paste Ready)`);
  
  if (frontendOptimizations.length > 0) {
    frontendOptimizations.forEach((issue, index) => {
      const analysis = analyzeFrontendIssueForProduction(issue, trackingState, metrics, index);
      
      reportLines.push(``, `### 🚨 Issue #${index + 1}: ${analysis.issue}`);
      reportLines.push(`**Priority**: ${analysis.priority.toUpperCase()} | **Time to Fix**: ${analysis.timeToFix} | **Business Impact**: ${analysis.businessImpact}`);
      if (analysis.webVitalImpact) {
        reportLines.push(`**Web Vital Impact**: ${analysis.webVitalImpact}`);
      }
      reportLines.push(``);
      
      reportLines.push(`- **Issue Type**: \`${issue.type}\``);
      reportLines.push(`- **Severity**: ${issue.severity}`);
      reportLines.push(`- **Persistent**: ${issue.persistent ? 'Yes (architectural)' : 'No (behavioral)'}`);
      reportLines.push(`- **Page Context**: ${trackingState.pageContext}`);

      // Component and file analysis
      reportLines.push(``, `#### 🔍 Root Cause Analysis:`);
      const fileAnalysis = analyzePageContext(trackingState.pageContext, issue.type);
      if (fileAnalysis.likelyComponents.length > 0) {
        reportLines.push(`- **Likely Components**: ${fileAnalysis.likelyComponents.map(c => `\`${c}\``).join(', ')}`);
        fileAnalysis.likelyComponents.forEach(component => {
          const filePath = guessComponentFilePath(component, trackingState.pageContext);
          if (filePath) {
            reportLines.push(`  - \`${component}\` → \`${filePath}\``);
          }
        });
      }

      if (fileAnalysis.likelyHooks.length > 0) {
        reportLines.push(`- **Likely Hooks**: ${fileAnalysis.likelyHooks.map(h => `\`${h}\``).join(', ')}`);
        fileAnalysis.likelyHooks.forEach(hook => {
          const filePath = guessHookFilePath(hook, trackingState.pageContext);
          if (filePath) {
            reportLines.push(`  - \`${hook}\` → \`${filePath}\``);
          }
        });
      }

      // React Query Analysis
      if (issue.type === 'caching') {
        reportLines.push(``, `#### ⚡ React Query Analysis:`);
        const reactQueryAnalysis = analyzeReactQueryOpportunity(trackingState.pageContext, metrics);
        reportLines.push(`- **Missing Cache Keys**: ${reactQueryAnalysis.suggestedKeys.map(k => `\`${k}\``).join(', ')}`);
        reportLines.push(`- **Cache Strategy**: ${reactQueryAnalysis.strategy}`);
        reportLines.push(`- **Performance Gain**: ${reactQueryAnalysis.performanceGain}`);
        
        if (reactQueryAnalysis.endpoints.length > 0) {
          reportLines.push(`- **API Endpoints to Cache**:`);
          reactQueryAnalysis.endpoints.forEach(endpoint => {
            reportLines.push(`  - \`${endpoint.url}\` → Query Key: \`${endpoint.queryKey}\``);
          });
        }
      }

      // Production-Ready Fix Section
      reportLines.push(``, `#### 🛠️ IMMEDIATE FIX (Copy/Paste Ready):`);
      reportLines.push(`**Problem**: ${analysis.issue}`);
      reportLines.push(`**Solution**: ${analysis.suggestedFix}`);
      
      if (analysis.codeExample) {
        reportLines.push(``, `**Code Example:**`);
        reportLines.push('```typescript');
        reportLines.push(analysis.codeExample);
        reportLines.push('```');
      }

      // Add separator for readability
      reportLines.push(``, `---`);
    });
  } else {
    reportLines.push(``, `✅ **No optimization issues detected** - frontend performance is optimal!`);
  }

  // Enhanced action plan
  reportLines.push(``, `## 🎯 Production Action Plan`);
  reportLines.push(`### Immediate Actions (This Sprint):`);
  
  const criticalIssues = frontendOptimizations.filter((issue, i) => 
    analyzeFrontendIssueForProduction(issue, trackingState, metrics, i).priority === 'critical'
  );
  
  const highIssues = frontendOptimizations.filter((issue, i) => 
    analyzeFrontendIssueForProduction(issue, trackingState, metrics, i).priority === 'high'
  );

  if (criticalIssues.length > 0) {
    reportLines.push(`- **CRITICAL**: Fix ${criticalIssues.length} critical issues immediately`);
    criticalIssues.forEach((issue, index) => {
      const analysis = analyzeFrontendIssueForProduction(issue, trackingState, metrics, index);
      reportLines.push(`  - ${analysis.issue} (${analysis.timeToFix})`);
    });
  }

  if (highIssues.length > 0) {
    reportLines.push(`- **HIGH**: Address ${highIssues.length} high-priority issues this sprint`);
    highIssues.forEach((issue, index) => {
      const analysis = analyzeFrontendIssueForProduction(issue, trackingState, metrics, index);
      reportLines.push(`  - ${analysis.issue} (${analysis.timeToFix})`);
    });
  }

  // React Query Implementation Guide
  if (frontendOptimizations.some(issue => issue.type === 'caching')) {
    reportLines.push(``, `### 📚 React Query Implementation Guide:`);
    reportLines.push(`1. **Verify React Query setup** in your page/layout:`);
    reportLines.push('```typescript');
    reportLines.push('// Ensure QueryClient is available');
    reportLines.push('import { QueryClient, QueryClientProvider } from "@tanstack/react-query";');
    reportLines.push('');
    reportLines.push('<QueryClientProvider client={queryClient}>');
    reportLines.push('  {children}');
    reportLines.push('</QueryClientProvider>');
    reportLines.push('```');
    
    reportLines.push(``, `2. **Replace manual API calls with React Query:**`);
    reportLines.push('```typescript');
    reportLines.push('// ❌ Before: Manual fetch');
    reportLines.push('const [data, setData] = useState(null);');
    reportLines.push('useEffect(() => {');
    reportLines.push('  fetch("/api/endpoint").then(res => res.json()).then(setData);');
    reportLines.push('}, []);');
    reportLines.push('');
    reportLines.push('// ✅ After: React Query');
    reportLines.push('const { data, isLoading, error } = useQuery({');
    reportLines.push('  queryKey: ["endpoint-name"],');
    reportLines.push('  queryFn: () => fetch("/api/endpoint").then(res => res.json()),');
    reportLines.push('  staleTime: 5 * 60 * 1000, // 5 minutes');
    reportLines.push('});');
    reportLines.push('```');
  }

  // Performance improvement analysis
  if (frontendOptimizations.length > 0) {
    reportLines.push(``, `## 📈 Expected Performance Improvements`);
    const renderImprovement = estimateRenderImprovement(trackingState, frontendOptimizations);
    const cacheImprovement = estimateCacheImprovement(metrics, frontendOptimizations);
    const webVitalImprovement = estimateWebVitalImprovement(trackingState.webVitals, frontendOptimizations);
    
    reportLines.push(`- **Render Performance**: ${renderImprovement}`);
    reportLines.push(`- **Cache Efficiency**: ${cacheImprovement}`);
    reportLines.push(`- **Web Vitals**: ${webVitalImprovement}`);
    reportLines.push(`- **User Experience**: Faster page loads, smoother interactions`);
    reportLines.push(`- **Development Experience**: Better debugging, cleaner code patterns`);
  }

  // Implementation checklist
  reportLines.push(``, `## ✅ Implementation Checklist`);
  reportLines.push(`- [ ] Review all critical/high priority issues above`);
  reportLines.push(`- [ ] Search codebase for identified components in ${trackingState.pageContext} pages`);
  reportLines.push(`- [ ] Implement React Query for API calls if cache issues detected`);
  reportLines.push(`- [ ] Add memoization if render issues detected`);
  reportLines.push(`- [ ] Test performance improvements with this monitor`);
  reportLines.push(`- [ ] Monitor Web Vitals in production`);
  reportLines.push(`- [ ] Schedule follow-up performance review`);

  return reportLines.join('\n');
}

// Helper functions for production analysis
function calculateFrontendBusinessImpact(trackingState: PerformanceTrackingState, metrics: PerformanceMetrics): string {
  const renderCount = trackingState.renderMetrics.count;
  const cacheHitRate = trackingState.cacheHitRate;
  const webVitals = trackingState.webVitals;
  
  let impactLevel = 'low';
  let description = 'Performance is acceptable';
  
  if (renderCount > 20 || (webVitals.LCP && webVitals.LCP > 4000) || cacheHitRate < 30) {
    impactLevel = 'critical';
    description = 'Significant user experience degradation affecting conversions';
  } else if (renderCount > 15 || (webVitals.LCP && webVitals.LCP > 2500) || (metrics.cacheSize === 0 && trackingState.pageContext !== 'dashboard')) {
    impactLevel = 'high';
    description = 'Performance issues impacting user satisfaction';
  } else if (renderCount > 10 || cacheHitRate < 70) {
    impactLevel = 'medium';
    description = 'Optimization opportunities for better performance';
  }
  
  const icon = impactLevel === 'critical' ? '🔴' : impactLevel === 'high' ? '🟡' : impactLevel === 'medium' ? '🟢' : '✅';
  return `${icon} **${impactLevel.toUpperCase()}**: ${description}`;
}

function getWebVitalRating(metric: keyof WebVitalsMetrics, value?: number): 'good' | 'needs-improvement' | 'poor' | 'unknown' {
  if (!value) return 'unknown';
  
  switch (metric) {
    case 'LCP':
      return value <= 2500 ? 'good' : value <= 4000 ? 'needs-improvement' : 'poor';
    case 'CLS':
      return value <= 0.1 ? 'good' : value <= 0.25 ? 'needs-improvement' : 'poor';
    case 'FCP':
      return value <= 1800 ? 'good' : value <= 3000 ? 'needs-improvement' : 'poor';
    case 'INP':
      return value <= 200 ? 'good' : value <= 500 ? 'needs-improvement' : 'poor';
    case 'TTFB':
      return value <= 800 ? 'good' : value <= 1800 ? 'needs-improvement' : 'poor';
    default:
      return 'unknown';
  }
}

function getWebVitalBusinessImpact(metric: keyof WebVitalsMetrics, value: number | undefined, rating: string): string {
  if (!value) return 'Measuring...';
  
  const impacts = {
    'LCP': {
      'good': 'Fast loading - excellent user retention',
      'needs-improvement': 'Slow loading - may increase bounce rate',
      'poor': 'Very slow loading - significant bounce rate impact'
    },
    'CLS': {
      'good': 'Stable layout - good user experience',
      'needs-improvement': 'Some layout shifts - may cause click errors',
      'poor': 'Unstable layout - poor user experience'
    },
    'FCP': {
      'good': 'Quick first paint - users see content fast',
      'needs-improvement': 'Delayed first paint - slower perceived performance',
      'poor': 'Very delayed first paint - poor perceived performance'
    },
    'INP': {
      'good': 'Responsive interactions - smooth user experience',
      'needs-improvement': 'Slow interactions - may feel sluggish',
      'poor': 'Very slow interactions - poor responsiveness'
    },
    'TTFB': {
      'good': 'Fast server response - good foundation',
      'needs-improvement': 'Slow server response - impacts all metrics',
      'poor': 'Very slow server response - critical infrastructure issue'
    }
  };
  
  return impacts[metric]?.[rating as keyof typeof impacts[typeof metric]] || 'Unknown impact';
}

function analyzeFrontendIssueForProduction(
  issue: OptimizationGap, 
  trackingState: PerformanceTrackingState, 
  metrics: PerformanceMetrics,
  index: number
): FrontendIssueAnalysis {
  let priority: 'critical' | 'high' | 'medium' | 'low' = 'medium';
  let timeToFix = '1-2 hours';
  let businessImpact = 'Performance optimization';
  let codeExample = '';
  let webVitalImpact = '';

  // Priority based on issue type and severity
  if (issue.type === 'caching' && metrics.cacheSize === 0) {
    priority = 'high';
    timeToFix = '2-3 hours';
    businessImpact = 'Faster loading, reduced server load';
    codeExample = `// Add React Query to your main layout/page
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});

// Wrap your app
<QueryClientProvider client={queryClient}>
  {children}
</QueryClientProvider>`;
  } else if (issue.type === 'memoization' && trackingState.renderMetrics.count > 20) {
    priority = 'critical';
    timeToFix = '1 hour';
    businessImpact = 'Reduced CPU usage, smoother UI';
    webVitalImpact = 'Improves INP and reduces jank';
    codeExample = `// Add memoization to expensive components
import { memo, useCallback, useMemo } from 'react';

const ExpensiveComponent = memo(({ data, onUpdate }) => {
  const processedData = useMemo(() => {
    return data.map(item => expensiveTransform(item));
  }, [data]);

  const handleUpdate = useCallback((id, value) => {
    onUpdate(id, value);
  }, [onUpdate]);

  return <div>{/* render with processedData */}</div>;
});`;
  } else if (issue.type === 'lazy-loading' && trackingState.webVitals.LCP && trackingState.webVitals.LCP > 4000) {
    priority = 'high';
    timeToFix = '2-4 hours';
    businessImpact = 'Faster initial page load';
    webVitalImpact = 'Improves LCP and FCP significantly';
    codeExample = `// Add code splitting for heavy components
import { lazy, Suspense } from 'react';

const HeavyComponent = lazy(() => import('./HeavyComponent'));

function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HeavyComponent />
    </Suspense>
  );
}`;
  }

  return {
    issue: issue.title,
    suggestedFix: generateSpecificFix(issue.type, trackingState.pageContext),
    priority,
    timeToFix,
    businessImpact,
    codeExample: codeExample || undefined,
    webVitalImpact: webVitalImpact || undefined
  };
}

function analyzePageContext(pageContext: string, issueType: string): {
  likelyComponents: string[];
  likelyHooks: string[];
} {
  const contexts = {
    'dam': {
      likelyComponents: ['DamGallery', 'AssetCard', 'FolderTree', 'AssetDetails', 'UploadDialog'],
      likelyHooks: ['useAssets', 'useFolders', 'useAssetDetails', 'useUpload', 'useDamSearch']
    },
    'image-generator': {
      likelyComponents: ['ImageGeneration', 'ProviderSelector', 'GenerationHistory', 'PromptInput'],
      likelyHooks: ['useGeneration', 'useProviders', 'useGenerationHistory', 'useImageGenerate']
    },
    'dashboard': {
      likelyComponents: ['DashboardStats', 'RecentActivity', 'QuickActions'],
      likelyHooks: ['useDashboardData', 'useUserStats', 'useRecentActivity']
    },
    'team': {
      likelyComponents: ['TeamMembersList', 'MemberCard', 'InviteDialog', 'RoleSelector'],
      likelyHooks: ['useTeamMembers', 'useInvitations', 'useRoles', 'useUserProfile']
    },
    'settings': {
      likelyComponents: ['SettingsForm', 'ProfileSettings', 'SecuritySettings'],
      likelyHooks: ['useSettings', 'useProfile', 'useSecuritySettings']
    }
  };

  return contexts[pageContext as keyof typeof contexts] || { likelyComponents: [], likelyHooks: [] };
}

function guessComponentFilePath(component: string, pageContext: string): string | null {
  const basePaths = {
    'dam': 'lib/dam/presentation/components',
    'image-generator': 'lib/image-generator/presentation/components',
    'dashboard': 'components/dashboard',
    'team': 'components/team',
    'settings': 'components/settings'
  };

  const basePath = basePaths[pageContext as keyof typeof basePaths];
  if (!basePath) return null;

  return `${basePath}/**/${component}.tsx`;
}

function guessHookFilePath(hook: string, pageContext: string): string | null {
  const basePaths = {
    'dam': 'lib/dam/presentation/hooks',
    'image-generator': 'lib/image-generator/presentation/hooks',
    'dashboard': 'hooks/dashboard',
    'team': 'hooks/team',
    'settings': 'hooks/settings'
  };

  const basePath = basePaths[pageContext as keyof typeof basePaths];
  if (!basePath) return null;

  return `${basePath}/**/${hook}.ts`;
}

function analyzeReactQueryOpportunity(pageContext: string, metrics: PerformanceMetrics): {
  suggestedKeys: string[];
  strategy: string;
  performanceGain: string;
  endpoints: { url: string; queryKey: string }[];
} {
  const contexts = {
    'dam': {
      keys: ['dam-assets', 'dam-folders', 'dam-search', 'asset-details'],
      endpoints: [
        { url: '/api/dam/assets', queryKey: 'dam-assets' },
        { url: '/api/dam/folders', queryKey: 'dam-folders' },
        { url: '/api/dam/search', queryKey: 'dam-search' }
      ]
    },
    'image-generator': {
      keys: ['generations', 'providers', 'generation-stats'],
      endpoints: [
        { url: '/api/image-generator/generations', queryKey: 'generations' },
        { url: '/api/image-generator/providers', queryKey: 'providers' }
      ]
    },
    'team': {
      keys: ['team-members', 'user-profile', 'invitations'],
      endpoints: [
        { url: '/api/team/members', queryKey: 'team-members' },
        { url: '/api/profile', queryKey: 'user-profile' }
      ]
    }
  };

  const context = contexts[pageContext as keyof typeof contexts] || {
    keys: ['api-data'],
    endpoints: [{ url: '/api/*', queryKey: 'api-data' }]
  };

  return {
    suggestedKeys: context.keys,
    strategy: 'Implement caching with 5-minute stale time',
    performanceGain: `Eliminate redundant API calls, instant data on re-visits`,
    endpoints: context.endpoints
  };
}

function generateSpecificFix(issueType: string, pageContext: string): string {
  const fixes = {
    'caching': `Implement React Query caching for ${pageContext} API calls`,
    'memoization': `Add React.memo and useCallback to ${pageContext} components`,
    'debouncing': `Add debouncing to search/filter inputs in ${pageContext}`,
    'lazy-loading': `Implement code splitting for heavy ${pageContext} components`,
    'batching': `Batch mutations together in ${pageContext} operations`
  };

  return fixes[issueType as keyof typeof fixes] || `Optimize ${issueType} patterns`;
}

function estimateRenderImprovement(trackingState: PerformanceTrackingState, issues: OptimizationGap[]): string {
  const hasMemoizationIssue = issues.some(issue => issue.type === 'memoization');
  if (hasMemoizationIssue && trackingState.renderMetrics.count > 15) {
    return `${Math.round((trackingState.renderMetrics.count - 10) / trackingState.renderMetrics.count * 100)}% fewer renders expected`;
  }
  return 'Minimal render improvement expected';
}

function estimateCacheImprovement(metrics: PerformanceMetrics, issues: OptimizationGap[]): string {
  const hasCachingIssue = issues.some(issue => issue.type === 'caching');
  if (hasCachingIssue && metrics.cacheSize === 0) {
    return '80-90% cache hit rate expected after implementation';
  }
  return 'Current cache performance maintained';
}

function estimateWebVitalImprovement(webVitals: WebVitalsMetrics, issues: OptimizationGap[]): string {
  const hasLazyLoadingIssue = issues.some(issue => issue.type === 'lazy-loading');
  const hasMemoizationIssue = issues.some(issue => issue.type === 'memoization');
  
  let improvements = [];
  
  if (hasLazyLoadingIssue && webVitals.LCP && webVitals.LCP > 2500) {
    improvements.push('LCP: 20-30% improvement');
  }
  
  if (hasMemoizationIssue && webVitals.INP && webVitals.INP > 200) {
    improvements.push('INP: 15-25% improvement');
  }
  
  return improvements.length > 0 ? improvements.join(', ') : 'Current Web Vitals maintained';
}

export const PerformanceMetricsDisplay: React.FC<PerformanceMetricsDisplayProps> = ({ 
  metrics, 
  trackingState,
  frontendOptimizations = []
}) => {
  const [copyButtonState, setCopyButtonState] = React.useState<'default' | 'success'>('default');

  const copyFrontendReport = async () => {
    const enhancedReport = formatFrontendReport(metrics, trackingState, frontendOptimizations);
    
    try {
      await navigator.clipboard.writeText(enhancedReport);
      setCopyButtonState('success');
      setTimeout(() => setCopyButtonState('default'), 2000);
    } catch (error) {
      console.error('Failed to copy frontend report:', error);
    }
  };

  const getWebVitalRating = (metric: keyof WebVitalsMetrics, value?: number) => {
    if (!value) return 'unknown';
    
    switch (metric) {
      case 'LCP':
        return value <= 2500 ? 'good' : value <= 4000 ? 'needs-improvement' : 'poor';
      case 'CLS':
        return value <= 0.1 ? 'good' : value <= 0.25 ? 'needs-improvement' : 'poor';
      case 'FCP':
        return value <= 1800 ? 'good' : value <= 3000 ? 'needs-improvement' : 'poor';
      case 'INP':
        return value <= 200 ? 'good' : value <= 500 ? 'needs-improvement' : 'poor';
      case 'TTFB':
        return value <= 800 ? 'good' : value <= 1800 ? 'needs-improvement' : 'poor';
      default:
        return 'unknown';
    }
  };

  return (
    <div className="space-y-4 text-xs pt-3">
      {/* Copy Report Button */}
      <div className="flex justify-between items-center">
        <h3 className="font-medium text-gray-800">Frontend Performance</h3>
        <button
          onClick={copyFrontendReport}
          className="flex items-center gap-1 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 px-2 py-1 rounded border border-blue-200 transition-colors"
          title="Copy detailed frontend performance report"
        >
          {copyButtonState === 'success' ? (
            <>
              <Check className="w-3 h-3" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              Copy Report
            </>
          )}
        </button>
      </div>

      {/* Frontend Issues Display */}
      <OptimizationStatusDisplay
        metrics={metrics}
        trackingState={trackingState}
        missingOptimizations={frontendOptimizations}
      />

      {/* React Query Cache */}
      <div className="space-y-2">
        <h4 className="font-medium text-gray-700 flex items-center gap-1">
          <Database className="w-3 h-3" />
          React Query Cache
        </h4>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex justify-between">
            <span className="text-gray-600">Cache Size:</span>
            <span className="font-mono">{metrics.cacheSize}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Hit Rate:</span>
            <span className="font-mono">{trackingState.cacheHitRate.toFixed(1)}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Active Mutations:</span>
            <span className="font-mono">{metrics.activeMutations}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Optimized:</span>
            <span className={`font-mono ${metrics.isOptimized ? 'text-green-600' : 'text-red-600'}`}>
              {metrics.isOptimized ? 'Yes' : 'No'}
            </span>
          </div>
        </div>
      </div>

      {/* Render Performance */}
      <div className="space-y-2">
        <h4 className="font-medium text-gray-700 flex items-center gap-1">
          <Zap className="w-3 h-3" />
          Render Performance
        </h4>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex justify-between">
            <span className="text-gray-600">Renders:</span>
            <span className="font-mono">{trackingState.renderMetrics.count}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Avg Response:</span>
            <span className="font-mono">{trackingState.avgResponseTime}ms</span>
          </div>
        </div>
      </div>

      {/* Web Vitals */}
      <div className="space-y-2">
        <h4 className="font-medium text-gray-700 flex items-center gap-1">
          <Gauge className="w-3 h-3" />
          Web Vitals
        </h4>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {Object.entries(trackingState.webVitals).map(([metric, value]) => {
            const rating = getWebVitalRating(metric as keyof WebVitalsMetrics, value);
            const ratingColor = rating === 'good' ? 'text-green-600' : 
                              rating === 'needs-improvement' ? 'text-yellow-600' : 
                              rating === 'poor' ? 'text-red-600' : 'text-gray-500';
            
            const displayValue = metric === 'CLS' ? value?.toFixed(3) : 
                               metric === 'LCP' || metric === 'FCP' || metric === 'TTFB' ? `${Math.round(value || 0)}ms` :
                               metric === 'INP' ? `${Math.round(value || 0)}ms` : value;
            
            return (
              <div key={metric} className="flex justify-between">
                <span className="text-gray-600">{metric}:</span>
                <span className={`font-mono ${ratingColor}`}>
                  {displayValue || '--'}
                </span>
              </div>
            );
          })}
          {Object.keys(trackingState.webVitals).length === 0 && (
            <div className="col-span-2 text-center text-gray-500 text-xs">
              Collecting metrics...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 