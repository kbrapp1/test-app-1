'use client';

import React from 'react';
import { AlertTriangle, CheckCircle, Copy, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { OptimizationGap } from '../../domain/value-objects/OptimizationGap';
import { NetworkIssue } from '../../domain/network-efficiency/value-objects/NetworkIssue';
import { CrossDomainInsight } from '../../domain/cross-domain/services/PerformanceCorrelationService';
import { PerformanceMetrics } from '../../domain/entities/PerformanceMetrics';
import { PerformanceTrackingState } from '../hooks/usePerformanceTracking';

interface PerformanceIssueSummaryProps {
  frontendIssues: OptimizationGap[];
  networkIssues: NetworkIssue[];
  crossDomainInsights: CrossDomainInsight[];
  metrics?: PerformanceMetrics;
  trackingState?: PerformanceTrackingState;
}

interface UnifiedIssue {
  title: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
  category: 'Frontend' | 'Network' | 'Cross-Domain';
  icon: string;
  timestamp: number;
}

interface CrossDomainAnalysis {
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

// Enhanced cross-domain performance report for production use
function formatCrossDomainReport(
  crossDomainInsights: CrossDomainInsight[],
  pageContext?: string
): string {
  const timestamp = new Date().toISOString();
  const actualIssues = crossDomainInsights.filter(insight => {
    const isPositiveInsight = insight.title === 'Optimal Performance' || 
                              (insight.type === 'optimization' && insight.severity === 'low' && 
                               insight.description.includes('well optimized'));
    return !isPositiveInsight;
  });

  const reportLines = [
    `# 🔗 Cross-Domain Performance Report - ${(pageContext || 'unknown').toUpperCase()}`,
    `Generated: ${timestamp}`,
    `**Page**: ${pageContext || 'unknown'} | **Status**: PRODUCTION READY`,
    ``,
    `## 📊 Executive Summary`,
    `- **Domain Interactions**: Frontend ↔ Network performance correlation`,
    `- **Cross-Domain Issues Found**: ${actualIssues.length}`,
    `- **Analysis Type**: Real-time cascade detection and correlation analysis`,
    `- **Business Impact**: ${calculateCrossDomainBusinessImpact(actualIssues)}`,
    ``,
    `## 🎯 Cross-Domain Performance Analysis`,
    `Cross-domain issues occur when frontend and network performance problems compound each other,`,
    `creating cascading effects that impact user experience more severely than isolated issues.`,
    ``,
    `## 🔧 Cross-Domain Issues (Copy/Paste Ready)`
  ];
  
  if (actualIssues.length > 0) {
      actualIssues.forEach((insight, index) => {
        const analysis = analyzeCrossDomainIssueForProduction(insight, index, pageContext);
        
        reportLines.push(``, `### 🚨 Issue #${index + 1}: ${analysis.issue}`);
        reportLines.push(`**Priority**: ${analysis.priority.toUpperCase()} | **Time to Fix**: ${analysis.timeToFix} | **Business Impact**: ${analysis.businessImpact}`);
        reportLines.push(`**Affected Domains**: ${analysis.domains.join(' + ')}`);
        reportLines.push(`**Page Context**: ${pageContext || 'unknown'}`);
        reportLines.push(``);
        
        reportLines.push(`- **Issue Type**: \`${insight.type}\``);
        reportLines.push(`- **Severity**: ${insight.severity}`);
        reportLines.push(`- **Domain Interaction**: ${insight.domains.join(' ↔ ')}`);
        reportLines.push(`- **Cross-Domain Effect**: ${insight.type === 'correlation' ? 'Compound' : insight.type === 'cascade' ? 'Cascade' : 'Optimization'}`);

        // Page-specific file paths and components
        const pageAnalysis = analyzePageContextForCrossDomain(pageContext || 'unknown', insight.type);
        if (pageAnalysis.likelyFiles.length > 0) {
          reportLines.push(``, `#### 🔍 Page-Specific Root Cause Analysis:`);
          reportLines.push(`- **Likely Components**: ${pageAnalysis.likelyComponents.map((c: string) => `\`${c}\``).join(', ')}`);
          reportLines.push(`- **Likely Files to Modify:**`);
          pageAnalysis.likelyFiles.forEach((file: string) => {
            reportLines.push(`  - \`${file}\``);
          });
          
          if (pageAnalysis.likelyQueryKeys.length > 0) {
            reportLines.push(`- **React Query Keys to Implement:**`);
            pageAnalysis.likelyQueryKeys.forEach((key: string) => {
              reportLines.push(`  - \`${key}\``);
            });
          }
          
          if (pageAnalysis.likelyEndpoints.length > 0) {
            reportLines.push(`- **API Endpoints to Optimize:**`);
            pageAnalysis.likelyEndpoints.forEach((endpoint: string) => {
              reportLines.push(`  - \`${endpoint}\``);
            });
          }
        }

        // Root cause analysis
        reportLines.push(``, `#### 🔍 Cross-Domain Root Cause Analysis:`);
        reportLines.push(`- **Primary Cause**: ${analysis.rootCause}`);
        reportLines.push(`- **Secondary Effects**: Impacts across ${analysis.domains.length} performance domains`);
        
        if (insight.type === 'correlation') {
          reportLines.push(`- **Correlation Type**: Issues in both domains amplify each other`);
          reportLines.push(`- **Compound Effect**: 1 + 1 = 3 (exponential impact on user experience)`);
        } else if (insight.type === 'cascade') {
          reportLines.push(`- **Cascade Type**: Network issues triggering frontend problems`);
          reportLines.push(`- **Chain Reaction**: Network delays → Frontend re-renders → More network calls`);
        } else {
          reportLines.push(`- **Optimization Gap**: Missing coordination between frontend and network layers`);
          reportLines.push(`- **Efficiency Loss**: Lack of integrated caching/optimization strategy`);
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

        // Implementation steps
        reportLines.push(``, `#### 📋 Implementation Steps:`);
        analysis.implementationSteps.forEach((step, i) => {
          reportLines.push(`${i + 1}. ${step}`);
        });

        // Add separator for readability
        reportLines.push(``, `---`);
      });
  } else {
    reportLines.push(``, `✅ **No cross-domain issues detected** - frontend and network performance are well coordinated!`);
  }

    // Enhanced action plan
    reportLines.push(``, `## 🎯 Production Action Plan`);
    reportLines.push(`### Cross-Domain Optimization Strategy for ${pageContext || 'Current Page'}:`);
    
    const criticalIssues = actualIssues.filter((insight, i) => 
      analyzeCrossDomainIssueForProduction(insight, i, pageContext).priority === 'critical'
    );
    
    const highIssues = actualIssues.filter((insight, i) => 
      analyzeCrossDomainIssueForProduction(insight, i, pageContext).priority === 'high'
    );

    if (criticalIssues.length > 0) {
      reportLines.push(`- **CRITICAL**: Address ${criticalIssues.length} critical cross-domain issues immediately`);
      criticalIssues.forEach((insight, index) => {
        const analysis = analyzeCrossDomainIssueForProduction(insight, index, pageContext);
        reportLines.push(`  - ${analysis.issue} (${analysis.timeToFix})`);
      });
    }

    if (highIssues.length > 0) {
      reportLines.push(`- **HIGH**: Fix ${highIssues.length} high-priority domain interactions this sprint`);
      highIssues.forEach((insight, index) => {
        const analysis = analyzeCrossDomainIssueForProduction(insight, index, pageContext);
        reportLines.push(`  - ${analysis.issue} (${analysis.timeToFix})`);
      });
    }

    // Page-specific implementation guide
    reportLines.push(``, `### 📚 ${pageContext || 'Page'}-Specific Implementation Guide:`);
    const pageImplementationSteps = getPageSpecificImplementationSteps(pageContext || 'unknown');
    pageImplementationSteps.forEach((step: string, i: number) => {
      reportLines.push(`${i + 1}. ${step}`);
    });

    // Performance improvement analysis
    if (actualIssues.length > 0) {
      reportLines.push(``, `## 📈 Expected Cross-Domain Improvements`);
      const correlationImprovement = estimateCorrelationImprovement(actualIssues);
      const cascadeImprovement = estimateCascadeImprovement(actualIssues);
      const optimizationImprovement = estimateOptimizationImprovement(actualIssues);
      
      reportLines.push(`- **Correlation Fixes**: ${correlationImprovement}`);
      reportLines.push(`- **Cascade Prevention**: ${cascadeImprovement}`);
      reportLines.push(`- **Domain Coordination**: ${optimizationImprovement}`);
      reportLines.push(`- **User Experience**: Dramatically smoother interactions with coordinated optimizations`);
      reportLines.push(`- **Development Experience**: Easier debugging with clear domain separation`);
    }

    // Implementation checklist
    reportLines.push(``, `## ✅ Cross-Domain Implementation Checklist`);
    reportLines.push(`- [ ] Review all critical/high priority cross-domain issues above`);
    reportLines.push(`- [ ] Identify primary domain causing cascade effects`);
    reportLines.push(`- [ ] Implement frontend optimizations (React Query, memoization)`);
    reportLines.push(`- [ ] Implement network optimizations (caching, deduplication)`);
    reportLines.push(`- [ ] Test performance improvements across both domains`);
    reportLines.push(`- [ ] Monitor for new cross-domain correlations`);
    reportLines.push(`- [ ] Schedule follow-up cross-domain performance review`);

    return reportLines.join('\n');
}

export const PerformanceIssueSummary: React.FC<PerformanceIssueSummaryProps> = ({
  frontendIssues,
  networkIssues,
  crossDomainInsights,
  metrics,
  trackingState
}) => {
  const [copyButtonState, setCopyButtonState] = React.useState<{
    frontend: 'default' | 'success';
    crossDomain: 'default' | 'success';
    backend: 'default' | 'success';
  }>({
    frontend: 'default',
    crossDomain: 'default',
    backend: 'default'
  });

  const copyFrontendReport = async () => {
    let report: string;
    
    // Use comprehensive report if we have the required data
    if (metrics && trackingState) {
      report = formatComprehensiveFrontendReport(metrics, trackingState, frontendIssues);
    } else {
      // Fallback to basic report
      report = formatFrontendReport(frontendIssues, trackingState?.pageContext || 'dam');
    }
    
    try {
      await navigator.clipboard.writeText(report);
      setCopyButtonState(prev => ({ ...prev, frontend: 'success' }));
      setTimeout(() => setCopyButtonState(prev => ({ ...prev, frontend: 'default' })), 2000);
    } catch (error) {
      console.error('Failed to copy frontend report:', error);
    }
  };

  const copyCrossDomainReport = async () => {
    const enhancedReport = formatCrossDomainReport(crossDomainInsights, 'dam'); // TODO: Get actual page context
    try {
      await navigator.clipboard.writeText(enhancedReport);
      setCopyButtonState(prev => ({ ...prev, crossDomain: 'success' }));
      setTimeout(() => setCopyButtonState(prev => ({ ...prev, crossDomain: 'default' })), 2000);
    } catch (error) {
      console.error('Failed to copy cross-domain report:', error);
    }
  };

  const copyBackendReport = async () => {
    const report = formatBackendReport(networkIssues, trackingState?.pageContext || 'dam');
    try {
      await navigator.clipboard.writeText(report);
      setCopyButtonState(prev => ({ ...prev, backend: 'success' }));
      setTimeout(() => setCopyButtonState(prev => ({ ...prev, backend: 'default' })), 2000);
    } catch (error) {
      console.error('Failed to copy backend report:', error);
    }
  };

  // Convert all issues to unified format, excluding positive status insights
  // Create all issues with current timestamp, staggered to show intended order
  const baseTimestamp = Date.now();
  let timestampOffset = 0;
  
  const allIssues: UnifiedIssue[] = [
    // Network issues get most recent timestamps (just detected/updated)
    ...networkIssues.map(issue => ({
      title: issue.title,
      description: issue.description,
      severity: issue.severity,
      category: 'Network' as const,
      icon: issue.type === 'redundancy' ? '🔄' : issue.type === 'slow-response' ? '🐌' : '❌',
      timestamp: baseTimestamp - (timestampOffset++ * 10) // Most recent, stagger by 10ms
    })),
    // Cross-domain insights (slightly older)
    ...crossDomainInsights
      .filter(insight => {
        // Exclude positive status insights that aren't actual problems
        const isPositiveInsight = insight.title === 'Optimal Performance' || 
                                  (insight.type === 'optimization' && insight.severity === 'low' && 
                                   insight.description.includes('well optimized'));
        return !isPositiveInsight;
      })
      .map(insight => ({
        title: insight.title,
        description: insight.description,
        severity: insight.severity,
        category: 'Cross-Domain' as const,
        icon: insight.type === 'correlation' ? '🔗' : insight.type === 'cascade' ? '⚡' : '🎯',
        timestamp: baseTimestamp - (timestampOffset++ * 10) // Continue staggering by 10ms
      })),
    // Frontend issues (oldest in this detection cycle)
    ...frontendIssues.map(issue => ({
      title: issue.title,
      description: issue.description,
      severity: issue.severity,
      category: 'Frontend' as const,
      icon: issue.type === 'memoization' ? '⚡' : issue.type === 'caching' ? '💾' : '🚀',
      timestamp: baseTimestamp - (timestampOffset++ * 10) // Continue staggering by 10ms
    }))
  ].sort((a, b) => {
    // Sort by most recent first (higher timestamp = more recent)
    return b.timestamp - a.timestamp;
  });

  // Separate positive insights from actual issues
  const positiveInsights = crossDomainInsights.filter(insight => {
    const isPositiveInsight = insight.title === 'Optimal Performance' || 
                              (insight.type === 'optimization' && insight.severity === 'low' && 
                               insight.description.includes('well optimized'));
    return isPositiveInsight;
  });

  const totalIssues = allIssues.length;
  const highSeverityCount = allIssues.filter(issue => issue.severity === 'high').length;
  const crossDomainIssueCount = allIssues.filter(issue => issue.category === 'Cross-Domain').length;

  if (totalIssues === 0) {
    // Show positive insight if available, otherwise show default "optimal" message
    const positiveInsight = positiveInsights[0];
    
    return (
      <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
        <CheckCircle className="w-6 h-6 text-green-600" />
        <div>
          <h3 className="font-semibold text-green-800">
            {positiveInsight ? positiveInsight.title : 'All Systems Optimal'}
          </h3>
          <p className="text-sm text-green-700">
            {positiveInsight ? positiveInsight.description : 'No performance issues detected'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Performance Issues Header with Cross-Domain Report */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-6 h-6 text-red-600" />
          <div>
            <h3 className="font-semibold text-gray-800">
              Performance Issues Detected
            </h3>
            <p className="text-sm text-gray-600">
              {totalIssues} total {totalIssues === 1 ? 'issue' : 'issues'}
              {highSeverityCount > 0 && (
                <span className="text-red-600 font-medium">
                  , {highSeverityCount} high severity
                </span>
              )}
            </p>
          </div>
        </div>
        
        {/* Copy Report Buttons */}
        <div className="flex gap-1">
          {/* Frontend Report Button */}
          {frontendIssues.length > 0 && (
            <button
              onClick={copyFrontendReport}
              className="flex items-center gap-1 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 px-2 py-1 rounded border border-blue-200 transition-colors"
              title="Copy frontend performance report"
            >
              {copyButtonState.frontend === 'success' ? (
                <>
                  <Check className="w-3 h-3" />
                  ✓
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  FE
                </>
              )}
            </button>
          )}
          
          {/* Cross-Domain Report Button */}
          {crossDomainIssueCount > 0 && (
            <button
              onClick={copyCrossDomainReport}
              className="flex items-center gap-1 text-xs bg-purple-50 hover:bg-purple-100 text-purple-700 px-2 py-1 rounded border border-purple-200 transition-colors"
              title="Copy cross-domain performance report"
            >
              {copyButtonState.crossDomain === 'success' ? (
                <>
                  <Check className="w-3 h-3" />
                  ✓
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  CD
                </>
              )}
            </button>
          )}
          
          {/* Backend/Network Report Button */}
          {networkIssues.length > 0 && (
            <button
              onClick={copyBackendReport}
              className="flex items-center gap-1 text-xs bg-green-50 hover:bg-green-100 text-green-700 px-2 py-1 rounded border border-green-200 transition-colors"
              title="Copy backend/network performance report"
            >
              {copyButtonState.backend === 'success' ? (
                <>
                  <Check className="w-3 h-3" />
                  ✓
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  BE
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Issues List */}
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {allIssues.map((issue, index) => (
          <div 
            key={index}
            className={`p-3 rounded-lg border-l-4 ${
              issue.severity === 'high' 
                ? 'bg-red-50 border-red-400' 
                : issue.severity === 'medium'
                ? 'bg-yellow-50 border-yellow-400'
                : 'bg-blue-50 border-blue-400'
            }`}
          >
            <div className="flex items-start gap-3">
              <span className="text-lg">{issue.icon}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-gray-800">{issue.title}</h4>
                  <Badge 
                    variant={issue.severity === 'high' ? 'destructive' : 'secondary'}
                    className="text-xs"
                  >
                    {issue.category}
                  </Badge>
                  <Badge 
                    variant="outline"
                    className={`text-xs ${
                      issue.severity === 'high' ? 'border-red-300 text-red-700' :
                      issue.severity === 'medium' ? 'border-yellow-300 text-yellow-700' :
                      'border-blue-300 text-blue-700'
                    }`}
                  >
                    {issue.severity.toUpperCase()}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600">{issue.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Helper functions for cross-domain analysis
function calculateCrossDomainBusinessImpact(issues: CrossDomainInsight[]): string {
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

function analyzeCrossDomainIssueForProduction(
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
    
    codeExample = `// Fix both domains together for compound effect
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
    
    implementationSteps = [
      'Identify components causing high re-renders',
      'Add React Query to eliminate redundant API calls',
      'Implement component memoization (React.memo, useMemo)',
      'Test both optimizations together',
      'Monitor for cascade reduction'
    ];
  } else if (insight.type === 'cascade') {
    priority = 'high';
    timeToFix = '3-5 hours';
    businessImpact = 'Network delays triggering frontend performance issues';
    rootCause = 'Slow network responses causing excessive component re-renders';
    suggestedFix = 'Optimize network calls and add loading states to prevent cascade';
    
    codeExample = `// Prevent network-to-frontend cascade
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
    
    implementationSteps = [
      'Profile network calls causing delays',
      'Implement caching to reduce network latency',
      'Add proper loading states and skeletons',
      'Debounce user interactions to prevent cascade',
      'Monitor render count reduction'
    ];
  } else if (insight.type === 'optimization') {
    priority = 'medium';
    timeToFix = '2-3 hours';
    businessImpact = 'Missing integrated caching strategy';
    rootCause = 'Frontend and network layers not coordinating optimizations';
    suggestedFix = 'Implement coordinated React Query caching strategy';
    
    codeExample = `// Coordinate frontend and network optimization
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
    
    implementationSteps = [
      'Audit current caching patterns',
      'Implement React Query with unified configuration',
      'Share query keys across related components',
      'Test cache hit rates improvement',
      'Monitor network request reduction'
    ];
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

function estimateCorrelationImprovement(issues: CrossDomainInsight[]): string {
  const correlationIssues = issues.filter(i => i.type === 'correlation');
  if (correlationIssues.length > 0) {
    return `${correlationIssues.length * 40}% improvement by fixing compound issues`;
  }
  return 'No correlation issues detected';
}

function estimateCascadeImprovement(issues: CrossDomainInsight[]): string {
  const cascadeIssues = issues.filter(i => i.type === 'cascade');
  if (cascadeIssues.length > 0) {
    return `${cascadeIssues.length * 30}% improvement by preventing cascades`;
  }
  return 'No cascade issues detected';
}

function estimateOptimizationImprovement(issues: CrossDomainInsight[]): string {
  const optimizationIssues = issues.filter(i => i.type === 'optimization');
  if (optimizationIssues.length > 0) {
    return `${optimizationIssues.length * 25}% improvement through coordination`;
  }
  return 'No optimization gaps detected';
}

// Helper function for page-specific cross-domain analysis
function analyzePageContextForCrossDomain(pageContext: string, issueType: string): {
  likelyComponents: string[];
  likelyFiles: string[];
  likelyQueryKeys: string[];
  likelyEndpoints: string[];
} {
  const contexts = {
    'dam': {
      components: ['DamGallery', 'AssetCard', 'FolderTree', 'AssetDetails', 'UploadDialog', 'DamNavigation'],
      files: [
        'lib/dam/presentation/components/gallery/DamGallery.tsx',
        'lib/dam/presentation/hooks/useAssets.ts',
        'lib/dam/presentation/hooks/useFolders.ts',
        'lib/dam/application/actions/asset-actions.ts',
        'app/(protected)/dam/page.tsx'
      ],
      queryKeys: ['dam-assets', 'dam-folders', 'dam-search', 'dam-asset-details'],
      endpoints: ['/api/dam/asset/[assetId]', '/api/dam/folders/tree', '/api/dam/upload']
    },
    'image-generator': {
      components: ['ImageGeneration', 'ProviderSelector', 'GenerationHistory', 'PromptInput'],
      files: [
        'lib/image-generator/presentation/components/generation/ImageGeneration.tsx',
        'lib/image-generator/presentation/hooks/useGeneration.ts',
        'lib/image-generator/presentation/hooks/useGenerationHistory.ts',
        'app/(protected)/ai-playground/image-generator/page.tsx'
      ],
      queryKeys: ['generation-history', 'generation-providers', 'generation-stats'],
      endpoints: ['/api/image-generator/generate', '/api/image-generator/history']
    },
    'dashboard': {
      components: ['DashboardStats', 'RecentActivity', 'QuickActions'],
      files: [
        'app/(protected)/dashboard/page.tsx',
        'lib/dashboard/hooks/useDashboardData.ts'
      ],
      queryKeys: ['dashboard-stats', 'recent-activity'],
      endpoints: ['/api/dashboard/stats', '/api/dashboard/activity']
    },
    'team': {
      components: ['TeamMembersList', 'MemberCard', 'InviteDialog', 'RoleSelector'],
      files: [
        'app/(protected)/team/page.tsx',
        'lib/team/hooks/useTeamMembers.ts',
        'lib/team/hooks/useInvitations.ts'
      ],
      queryKeys: ['team-members', 'team-invitations', 'team-roles'],
      endpoints: ['/api/team/members', '/api/team/invite']
    }
  };

  const context = contexts[pageContext as keyof typeof contexts] || contexts['dam'];
  
  return {
    likelyComponents: context.components,
    likelyFiles: context.files,
    likelyQueryKeys: context.queryKeys,
    likelyEndpoints: context.endpoints
  };
}

// Helper function for page-specific implementation steps
function getPageSpecificImplementationSteps(pageContext: string): string[] {
  const baseSteps = [
    'Identify the root domain causing the issue (frontend vs network)',
    'Monitor cascade effects - ensure fixing one domain doesn\'t worsen the other',
    'Test holistically - verify both domains improve together'
  ];

  const pageSteps = {
    'dam': [
      'Implement React Query for DAM asset loading with `useAssets` hook',
      'Add memoization to `AssetCard` and `FolderTree` components',
      'Coordinate caching between asset details and gallery views',
      'Optimize folder tree expansion and asset thumbnail loading',
      ...baseSteps
    ],
    'image-generator': [
      'Implement React Query for generation history with `useGenerationHistory` hook',
      'Add memoization to `GenerationCard` components in history list',
      'Coordinate caching between generation requests and history updates',
      'Optimize provider selection and generation status polling',
      ...baseSteps
    ],
    'dashboard': [
      'Implement React Query for dashboard stats with `useDashboardData` hook',
      'Add memoization to chart and summary components',
      'Coordinate caching between different dashboard widgets',
      'Optimize real-time data updates and refresh intervals',
      ...baseSteps
    ],
    'team': [
      'Implement React Query for team data with `useTeamMembers` hook',
      'Add memoization to `MemberCard` and role components',
      'Coordinate caching between member list and invitation status',
      'Optimize team member search and role filtering',
      ...baseSteps
    ]
  };

  return pageSteps[pageContext as keyof typeof pageSteps] || baseSteps;
}

// Comprehensive frontend report using metrics and tracking state (like PerformanceMetricsDisplay)
function formatComprehensiveFrontendReport(
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
    `## 🔧 Frontend Issues (Copy/Paste Ready)`
  ];

  if (frontendOptimizations.length > 0) {
    frontendOptimizations.forEach((issue, index) => {
      reportLines.push(``, `### 🚨 Issue #${index + 1}: ${issue.title}`);
      reportLines.push(`**Priority**: ${issue.severity.toUpperCase()} | **Type**: ${issue.type}`);
      reportLines.push(`**Description**: ${issue.description}`);
      reportLines.push(`**Persistent**: ${issue.persistent ? 'Yes (architectural)' : 'No (behavioral)'}`);
      reportLines.push(`**Page Context**: ${trackingState.pageContext}`);

      // Production-Ready Fix Section
      reportLines.push(``, `#### 🛠️ IMMEDIATE FIX (Copy/Paste Ready):`);
      reportLines.push(`**Problem**: ${issue.title}`);
      
      // Add separator for readability
      reportLines.push(``, `---`);
    });
  } else {
    reportLines.push(``, `✅ **No optimization issues detected** - frontend performance is optimal!`);
  }

  // Enhanced action plan
  reportLines.push(``, `## 🎯 Production Action Plan`);
  reportLines.push(`### Immediate Actions (This Sprint):`);
  
  const criticalIssues = frontendOptimizations.filter(issue => issue.severity === 'high');

  if (criticalIssues.length > 0) {
    reportLines.push(`- **CRITICAL**: Fix ${criticalIssues.length} critical issues immediately`);
    criticalIssues.forEach(issue => {
      reportLines.push(`  - ${issue.title}`);
    });
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

// Helper functions for enhanced backend reporting
function calculateNetworkBusinessImpact(issues: NetworkIssue[]): string {
  if (issues.length === 0) return 'No network impact detected';
  
  const highSeverityCount = issues.filter(issue => issue.severity === 'high').length;
  const redundancyCount = issues.filter(issue => issue.type === 'redundancy').length;
  const totalOccurrences = issues.reduce((sum, issue) => sum + issue.count, 0);
  
  if (highSeverityCount > 0) {
    return `Critical impact: ${highSeverityCount} high-severity network issues affecting user experience`;
  } else if (redundancyCount > 0) {
    return `Moderate impact: ${redundancyCount} redundancy issues causing ${totalOccurrences} unnecessary requests`;
  } else {
    return `Low impact: ${issues.length} network issues with minimal user experience impact`;
  }
}

interface NetworkIssueAnalysis {
  issue: string;
  rootCause: string;
  networkPattern: string;
  optimizationOpportunity: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  timeToFix: string;
  businessImpact: string;
  suggestedFix: string;
  codeExample?: string;
  implementationSteps: string[];
}

function analyzeNetworkIssueForProduction(
  issue: NetworkIssue, 
  index: number, 
  pageContext?: string
): NetworkIssueAnalysis {
  const priority = issue.severity === 'high' ? 'critical' : 
                  issue.severity === 'medium' ? 'high' : 'medium';
  
  const timeToFix = issue.type === 'redundancy' ? '2-4 hours' : 
                   issue.type === 'slow-response' ? '4-8 hours' : '1-2 hours';
  
  const businessImpact = issue.severity === 'high' ? 
    'High user impact: slower page loads, poor UX' :
    'Medium impact: increased server load, inefficient resource usage';

  const rootCause = issue.type === 'redundancy' ? 
    'Multiple identical API requests from component re-renders or missing request deduplication' :
    'Slow database queries or unoptimized API endpoints causing response delays';

  const networkPattern = issue.type === 'redundancy' ? 
    'Request duplication pattern' : 'Response latency pattern';

  const optimizationOpportunity = issue.type === 'redundancy' ? 
    'Implement React Query for automatic request deduplication and caching' :
    'Optimize database queries and add response caching';

  const suggestedFix = issue.type === 'redundancy' ? 
    'Add React Query to eliminate duplicate requests and cache responses' :
    'Optimize API endpoint performance and implement proper caching strategies';

  const codeExample = issue.type === 'redundancy' ? 
    `// Replace multiple fetch calls with React Query
const { data, isLoading } = useQuery({
  queryKey: ['${pageContext || 'data'}', id],
  queryFn: () => fetchData(id),
  staleTime: 5 * 60 * 1000, // 5 minutes
});` : 
    `// Add caching and optimize database queries
app.get('/api/endpoint', async (req, res) => {
  const cacheKey = 'endpoint-' + req.params.id;
  let data = await cache.get(cacheKey);
  
  if (!data) {
    data = await optimizedDatabaseQuery(req.params.id);
    await cache.set(cacheKey, data, 300); // 5 min cache
  }
  
  res.json(data);
});`;

  const implementationSteps = issue.type === 'redundancy' ? [
    'Identify components making duplicate API calls',
    'Replace fetch/axios calls with React Query useQuery hooks',
    'Configure appropriate staleTime and cacheTime values',
    'Test to ensure requests are properly deduplicated'
  ] : [
    'Analyze slow API endpoints using monitoring tools',
    'Add database indexing for frequently queried fields',
    'Implement response caching at API level',
    'Consider pagination for large datasets',
    'Monitor response times after optimization'
  ];

  return {
    issue: issue.title,
    rootCause,
    networkPattern,
    optimizationOpportunity,
    priority,
    timeToFix,
    businessImpact,
    suggestedFix,
    codeExample,
    implementationSteps
  };
}

function analyzePageContextForNetwork(pageContext: string): {
  likelyEndpoints: string[];
  optimizationTargets: string[];
  cacheableEndpoints: string[];
} {
  const contexts = {
    'dam': {
      endpoints: ['/api/dam/asset/[assetId]', '/api/dam/folders/tree', '/api/dam/upload', '/api/dam/search'],
      optimizationTargets: ['Asset loading', 'Folder tree expansion', 'Search results'],
      cacheableEndpoints: ['/api/dam/asset/[assetId]', '/api/dam/folders/tree', '/api/dam/search']
    },
    'image-generator': {
      endpoints: ['/api/image-generator/generate', '/api/image-generator/history', '/api/image-generator/providers'],
      optimizationTargets: ['Generation requests', 'History loading', 'Provider selection'],
      cacheableEndpoints: ['/api/image-generator/history', '/api/image-generator/providers']
    },
    'dashboard': {
      endpoints: ['/api/dashboard/stats', '/api/dashboard/activity', '/api/dashboard/analytics'],
      optimizationTargets: ['Stats aggregation', 'Activity feeds', 'Real-time updates'],
      cacheableEndpoints: ['/api/dashboard/stats', '/api/dashboard/activity']
    },
    'team': {
      endpoints: ['/api/team/members', '/api/team/invite', '/api/team/roles'],
      optimizationTargets: ['Member list loading', 'Invitation management', 'Role assignments'],
      cacheableEndpoints: ['/api/team/members', '/api/team/roles']
    }
  };

  const context = contexts[pageContext as keyof typeof contexts] || contexts['dam'];
  return {
    likelyEndpoints: context.endpoints,
    optimizationTargets: context.optimizationTargets,
    cacheableEndpoints: context.cacheableEndpoints
  };
}

function estimateRedundancyImprovement(issues: NetworkIssue[]): string {
  const redundancyIssues = issues.filter(issue => issue.type === 'redundancy');
  if (redundancyIssues.length === 0) return 'No redundancy issues detected';
  
  const totalDuplicateRequests = redundancyIssues.reduce((sum, issue) => sum + issue.count, 0);
  const estimatedReduction = Math.round((totalDuplicateRequests * 0.8) / redundancyIssues.length);
  
  return `${estimatedReduction}% reduction in API requests through React Query implementation`;
}

function estimateResponseTimeImprovement(issues: NetworkIssue[]): string {
  const slowResponseIssues = issues.filter(issue => issue.type === 'slow-response');
  if (slowResponseIssues.length === 0) return 'No response time issues detected';
  
  return `30-50% faster response times through database optimization and caching`;
}

// Format functions for copy reports
function formatFrontendReport(frontendIssues: OptimizationGap[], pageContext?: string): string {
  const timestamp = new Date().toISOString();
  const reportLines = [
    `# ⚡ Frontend Performance Report - ${(pageContext || 'unknown').toUpperCase()}`,
    `Generated: ${timestamp}`,
    `**Page**: ${pageContext || 'unknown'} | **Status**: PRODUCTION READY`,
    ``,
    `## 📊 Executive Summary`,
    `- **Frontend Issues Found**: ${frontendIssues.length}`,
    `- **Page Context**: ${pageContext || 'unknown'}`,
    ``,
    `## 🔧 Frontend Issues (Copy/Paste Ready)`
  ];

  if (frontendIssues.length > 0) {
    frontendIssues.forEach((issue, index) => {
      reportLines.push(``, `### 🚨 Issue #${index + 1}: ${issue.title}`);
      reportLines.push(`**Priority**: ${issue.severity.toUpperCase()} | **Type**: ${issue.type}`);
      reportLines.push(`**Description**: ${issue.description}`);
      reportLines.push(`**Persistent**: ${issue.persistent ? 'Yes' : 'No'}`);
    });
  } else {
    reportLines.push(``, `✅ **No frontend issues detected** - performance is optimal!`);
  }

  return reportLines.join('\n');
}

function formatBackendReport(networkIssues: NetworkIssue[], pageContext?: string): string {
  const timestamp = new Date().toISOString();
  const reportLines = [
    `# 🌐 Backend/Network Performance Report - PRODUCTION READY`,
    `Generated: ${timestamp}`,
    `**Page Context**: ${pageContext || 'unknown'} | **Status**: PRODUCTION READY`,
    ``,
    `## 📊 Executive Summary`,
    `- **Network Issues Found**: ${networkIssues.length}`,
    `- **Page Context**: ${pageContext || 'unknown'}`,
    `- **Analysis Type**: Real-time network performance monitoring and redundancy detection`,
    `- **Business Impact**: ${calculateNetworkBusinessImpact(networkIssues)}`,
    ``,
    `## 🎯 Network Performance Analysis`,
    `Network issues impact user experience through slow response times, redundant requests,`,
    `and inefficient API usage patterns that compound frontend performance problems.`,
    ``,
    `## 🔧 Network Issues (Copy/Paste Ready)`
  ];

  if (networkIssues.length > 0) {
    networkIssues.forEach((issue, index) => {
      const analysis = analyzeNetworkIssueForProduction(issue, index, pageContext);
      
      reportLines.push(``, `### 🚨 Issue #${index + 1}: ${analysis.issue}`);
      reportLines.push(`**Priority**: ${analysis.priority.toUpperCase()} | **Time to Fix**: ${analysis.timeToFix} | **Business Impact**: ${analysis.businessImpact}`);
      reportLines.push(`**Occurrence Count**: ${issue.count} times | **First Detected**: ${new Date(issue.timestamp).toLocaleString()}`);
      reportLines.push(`**Persistent**: ${issue.persistent ? 'Yes (architectural)' : 'No (behavioral)'}`);
      reportLines.push(``);
      
      reportLines.push(`- **Issue Type**: \`${issue.type}\``);
      reportLines.push(`- **Severity**: ${issue.severity}`);
      reportLines.push(`- **Impact**: ${issue.description}`);

      // Root cause analysis
      reportLines.push(``, `#### 🔍 Root Cause Analysis:`);
      reportLines.push(`- **Primary Cause**: ${analysis.rootCause}`);
      reportLines.push(`- **Network Pattern**: ${analysis.networkPattern}`);
      
      if (issue.type === 'redundancy') {
        reportLines.push(`- **Redundancy Type**: Multiple identical requests detected`);
        reportLines.push(`- **Optimization Opportunity**: ${analysis.optimizationOpportunity}`);
      } else if (issue.type === 'slow-response') {
        reportLines.push(`- **Response Time Issue**: API endpoints responding slowly`);
        reportLines.push(`- **Performance Impact**: User experience degradation`);
      }

      // Page-specific API analysis
      if (pageContext) {
        const pageAnalysis = analyzePageContextForNetwork(pageContext);
        reportLines.push(``, `#### 🔍 Page-Specific Network Analysis:`);
        reportLines.push(`- **Likely API Endpoints**: ${pageAnalysis.likelyEndpoints.map(e => `\`${e}\``).join(', ')}`);
        reportLines.push(`- **Optimization Targets**: ${pageAnalysis.optimizationTargets.join(', ')}`);
        
        if (pageAnalysis.cacheableEndpoints.length > 0) {
          reportLines.push(`- **Cacheable Endpoints**:`);
          pageAnalysis.cacheableEndpoints.forEach(endpoint => {
            reportLines.push(`  - \`${endpoint}\` (implement React Query caching)`);
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

      // Implementation steps
      reportLines.push(``, `#### 📋 Implementation Steps:`);
      analysis.implementationSteps.forEach((step, i) => {
        reportLines.push(`${i + 1}. ${step}`);
      });

      // Add separator for readability
      reportLines.push(``, `---`);
    });
  } else {
    reportLines.push(``, `✅ **No network issues detected** - backend performance is optimal!`);
  }

  // Enhanced action plan
  reportLines.push(``, `## 🎯 Production Action Plan`);
  reportLines.push(`### Network Optimization Strategy for ${pageContext || 'Current Page'}:`);
  
  const criticalIssues = networkIssues.filter(issue => issue.severity === 'high');
  const redundancyIssues = networkIssues.filter(issue => issue.type === 'redundancy');
  const slowResponseIssues = networkIssues.filter(issue => issue.type === 'slow-response');

  if (criticalIssues.length > 0) {
    reportLines.push(`- **CRITICAL**: Address ${criticalIssues.length} critical network issues immediately`);
    criticalIssues.forEach(issue => {
      reportLines.push(`  - ${issue.title} (${issue.count} occurrences)`);
    });
  }

  if (redundancyIssues.length > 0) {
    reportLines.push(`- **REDUNDANCY**: Eliminate ${redundancyIssues.length} redundant request patterns`);
    reportLines.push(`  - Implement request deduplication`);
    reportLines.push(`  - Add React Query for automatic caching`);
    reportLines.push(`  - Review component re-render patterns`);
  }

  if (slowResponseIssues.length > 0) {
    reportLines.push(`- **PERFORMANCE**: Optimize ${slowResponseIssues.length} slow API endpoints`);
    reportLines.push(`  - Add database indexing`);
    reportLines.push(`  - Implement API response caching`);
    reportLines.push(`  - Consider pagination for large datasets`);
  }

  // Performance improvement analysis
  if (networkIssues.length > 0) {
    reportLines.push(``, `## 📈 Expected Network Improvements`);
    const redundancyImprovement = estimateRedundancyImprovement(networkIssues);
    const responseTimeImprovement = estimateResponseTimeImprovement(networkIssues);
    
    reportLines.push(`- **Request Reduction**: ${redundancyImprovement}`);
    reportLines.push(`- **Response Time**: ${responseTimeImprovement}`);
    reportLines.push(`- **User Experience**: Faster page loads, reduced loading states`);
    reportLines.push(`- **Server Resources**: Reduced load on backend infrastructure`);
  }

  // Implementation checklist
  reportLines.push(``, `## ✅ Network Implementation Checklist`);
  reportLines.push(`- [ ] Review all critical/high priority network issues above`);
  reportLines.push(`- [ ] Implement React Query for redundant API calls`);
  reportLines.push(`- [ ] Add request deduplication middleware`);
  reportLines.push(`- [ ] Optimize slow database queries and API endpoints`);
  reportLines.push(`- [ ] Add proper caching headers and strategies`);
  reportLines.push(`- [ ] Monitor network performance metrics in production`);
  reportLines.push(`- [ ] Schedule follow-up network performance review`);

  return reportLines.join('\n');
} 