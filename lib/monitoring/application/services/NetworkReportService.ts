import { NetworkStats as DomainNetworkStats } from '../../domain/network-efficiency/entities/NetworkCall';
import { NetworkStats as ServiceNetworkStats } from '../../domain/network-efficiency/entities/NetworkCall';

export interface ProductionIssueAnalysis {
  component?: string;
  hook?: string;
  file?: string;
  line?: number;
  function?: string;
  issue: string;
  suggestedFix: string;
  reactQueryKey?: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  timeToFix: string;
  businessImpact: string;
  codeExample?: string;
}

export class NetworkReportService {
  static formatRedundancyReport(stats: ServiceNetworkStats): string {
    const timestamp = new Date().toISOString();
    const reportLines = [
      `# 🚨 Network Performance Issues Report - PRODUCTION READY`,
      `Generated: ${timestamp}`,
      ``,
      `## 📊 Executive Summary`,
      `- **Total API Calls**: ${stats.totalCalls}`,
      `- **Redundant Calls**: ${stats.redundantCalls}`,
      `- **Redundancy Rate**: ${stats.redundancyRate.toFixed(1)}%`,
      `- **Network Efficiency**: ${(100 - stats.redundancyRate).toFixed(1)}%`,
      `- **Issues Found**: ${stats.redundantPatterns.length}`,
      ``,
      `## 🎯 Business Impact`,
      this.calculateBusinessImpact(stats),
      ``,
      `## 🔧 Production Issues (Copy/Paste Ready)`
    ];

    stats.redundantPatterns.forEach((pattern, index) => {
      const analysis = this.analyzeIssueForProduction(pattern, index);
      
      reportLines.push(``, `### 🚨 Issue #${index + 1}: ${analysis.issue}`);
      reportLines.push(`**Priority**: ${analysis.priority.toUpperCase()} | **Time to Fix**: ${analysis.timeToFix} | **Business Impact**: ${analysis.businessImpact}`);
      reportLines.push(``);
      
      // Handle missing URL with more context
      const urlDisplay = pattern.originalCall.url || 
        (pattern.originalCall.type === 'server-action' ? 
          `[Server Action: ${pattern.originalCall.payload?.actionId?.substring(0, 8) || 'unknown'}...]` : 
          '[Unknown Endpoint]');
      reportLines.push(`- **Endpoint**: \`${urlDisplay}\``);
      reportLines.push(`- **HTTP Method**: ${pattern.originalCall.method}`);
      reportLines.push(`- **Call Type**: ${pattern.originalCall.type || 'unknown'}`);
      reportLines.push(`- **Duplicate Count**: ${pattern.duplicateCalls.length} redundant calls`);
      reportLines.push(`- **Time Window**: ${pattern.timeWindow}ms burst`);
      
      // Production-Ready Root Cause Analysis
      if (pattern.originalCall.source) {
        const source = pattern.originalCall.source;
        reportLines.push(``, `#### 🔍 Root Cause Analysis:`);
        
        if (source.component) {
          reportLines.push(`- **React Component**: \`${source.component}\``);
          // Try to extract file path from component name
          const potentialFile = this.guessFilePath(source.component, 'component');
          if (potentialFile) {
            reportLines.push(`- **Likely File**: \`${potentialFile}\``);
          }
        }
        
        if (source.hook) {
          reportLines.push(`- **React Hook**: \`${source.hook}\``);
          const potentialFile = this.guessFilePath(source.hook, 'hook');
          if (potentialFile) {
            reportLines.push(`- **Likely File**: \`${potentialFile}\``);
          }
        }
        
        if (source.file && source.line) {
          reportLines.push(`- **Source File**: \`${source.file}:${source.line}\``);
        } else if (source.file) {
          reportLines.push(`- **Source File**: \`${source.file}\``);
        }
        
        if (source.trigger) {
          reportLines.push(`- **Trigger Type**: \`${source.trigger}\``);
        }

        // React Query Analysis
        const reactQueryAnalysis = this.analyzeReactQueryOpportunity(pattern);
        if (reactQueryAnalysis) {
          reportLines.push(``, `#### ⚡ React Query Analysis:`);
          reportLines.push(`- **Missing Cache Key**: \`${reactQueryAnalysis.suggestedKey}\``);
          reportLines.push(`- **Cache Strategy**: ${reactQueryAnalysis.strategy}`);
          reportLines.push(`- **Estimated Performance Gain**: ${reactQueryAnalysis.performanceGain}`);
        }
        
        // Stack trace analysis
        if (source.stack) {
          reportLines.push(``, `#### 📋 Call Stack (Top 5):`);
          const relevantStack = this.extractRelevantStackTrace(source.stack);
          if (relevantStack.length > 0) {
            reportLines.push('```typescript');
            relevantStack.forEach(line => reportLines.push(line));
            reportLines.push('```');
          }
        }
      } else {
        reportLines.push(``, `#### 🔍 Root Cause Analysis:`);
        reportLines.push(`⚠️ _Source tracking unavailable - check request interception timing_`);
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

      // Duplicate calls timeline with production context
      if (pattern.duplicateCalls.length > 0) {
        reportLines.push(``, `#### ⏱️ Performance Timeline:`);
        pattern.duplicateCalls.forEach((call, i) => {
          const timeFromOriginal = call.timestamp - pattern.originalCall.timestamp;
          reportLines.push(`- **Call ${i + 1}**: +${timeFromOriginal}ms after original`);
          
          if (call.source?.component && call.source.component !== pattern.originalCall.source?.component) {
            reportLines.push(`  - Different Component: \`${call.source.component}\``);
          }
          
          if (call.source?.trigger && call.source.trigger !== pattern.originalCall.source?.trigger) {
            reportLines.push(`  - Different Trigger: \`${call.source.trigger}\``);
          }
        });
      }
      
      if (pattern.originalCall.error) {
        reportLines.push(``, `- **Error Details**: \`${pattern.originalCall.error}\``);
      }

      // Add separator for readability
      reportLines.push(``, `---`);
    });

    // Enhanced recommendations with production context
    reportLines.push(``, `## 🎯 Production Action Plan`);
    reportLines.push(`### Immediate Actions (This Sprint):`);
    
    const criticalIssues = stats.redundantPatterns.filter((_, i) => 
      this.analyzeIssueForProduction(stats.redundantPatterns[i], i).priority === 'critical'
    );
    
    const highIssues = stats.redundantPatterns.filter((_, i) => 
      this.analyzeIssueForProduction(stats.redundantPatterns[i], i).priority === 'high'
    );

    if (criticalIssues.length > 0) {
      reportLines.push(`- **CRITICAL**: Fix ${criticalIssues.length} critical issues immediately`);
      criticalIssues.forEach((pattern, index) => {
        const analysis = this.analyzeIssueForProduction(pattern, index);
        reportLines.push(`  - ${analysis.issue} (${analysis.timeToFix})`);
      });
    }

    if (highIssues.length > 0) {
      reportLines.push(`- **HIGH**: Address ${highIssues.length} high-priority issues this sprint`);
      highIssues.forEach((pattern, index) => {
        const analysis = this.analyzeIssueForProduction(pattern, index);
        reportLines.push(`  - ${analysis.issue} (${analysis.timeToFix})`);
      });
    }

    // React Query Implementation Guide
    reportLines.push(``, `### 📚 React Query Implementation Guide:`);
    reportLines.push(`1. **Install dependencies** (if not already installed):`);
    reportLines.push('```bash');
    reportLines.push('pnpm add @tanstack/react-query');
    reportLines.push('```');
    
    reportLines.push(``, `2. **Common patterns to implement**:`);
    reportLines.push('```typescript');
    reportLines.push('// Replace manual fetch with useQuery');
    reportLines.push('const { data, isLoading, error } = useQuery({');
    reportLines.push('  queryKey: ["endpoint-name", userId],');
    reportLines.push('  queryFn: () => fetchData(userId),');
    reportLines.push('  staleTime: 5 * 60 * 1000, // 5 minutes');
    reportLines.push('});');
    reportLines.push('');
    reportLines.push('// Replace manual mutations with useMutation');
    reportLines.push('const mutation = useMutation({');
    reportLines.push('  mutationFn: updateData,');
    reportLines.push('  onSuccess: () => {');
    reportLines.push('    queryClient.invalidateQueries(["endpoint-name"]);');
    reportLines.push('  }');
    reportLines.push('});');
    reportLines.push('```');
    
    // Performance impact analysis with production metrics
    if (stats.redundantCalls > 0) {
      reportLines.push(``, `## 📈 Production Performance Impact`);
      const wastedRequests = stats.redundantCalls;
      const potentialSavings = ((wastedRequests / stats.totalCalls) * 100).toFixed(1);
      const estimatedBandwidthSavings = this.estimateBandwidthSavings(stats);
      const estimatedTimeSavings = this.estimateTimeSavings(stats);
      
      reportLines.push(`- **Wasted API Calls**: ${wastedRequests} unnecessary requests`);
      reportLines.push(`- **Bandwidth Reduction**: ~${potentialSavings}% (${estimatedBandwidthSavings})`);
      reportLines.push(`- **Response Time Improvement**: ~${estimatedTimeSavings}`);
      reportLines.push(`- **User Experience**: Faster page loads, reduced loading states`);
      reportLines.push(`- **Server Load**: Reduced database queries and CPU usage`);
      reportLines.push(`- **Cost Savings**: Lower cloud infrastructure costs`);
    }

    // Implementation checklist
    reportLines.push(``, `## ✅ Implementation Checklist`);
    reportLines.push(`- [ ] Review all critical issues marked above`);
    reportLines.push(`- [ ] Search codebase for identified components/hooks`);
    reportLines.push(`- [ ] Implement React Query caching for repeated endpoints`);
    reportLines.push(`- [ ] Add debouncing for rapid-fire calls`);
    reportLines.push(`- [ ] Test with network monitor to verify fixes`);
    reportLines.push(`- [ ] Deploy and monitor production metrics`);
    reportLines.push(`- [ ] Schedule follow-up performance review`);

    return reportLines.join('\n');
  }

  private static calculateBusinessImpact(stats: ServiceNetworkStats): string {
    const redundancyRate = stats.redundancyRate;
    
    if (redundancyRate >= 30) {
      return `🔴 **CRITICAL**: ${redundancyRate.toFixed(1)}% redundant calls causing significant user experience degradation`;
    } else if (redundancyRate >= 15) {
      return `🟡 **HIGH**: ${redundancyRate.toFixed(1)}% redundant calls impacting performance and increasing costs`;
    } else if (redundancyRate >= 5) {
      return `🟢 **MEDIUM**: ${redundancyRate.toFixed(1)}% redundant calls - optimization opportunity`;
    } else {
      return `✅ **LOW**: ${redundancyRate.toFixed(1)}% redundant calls - network efficiency is good`;
    }
  }

  private static analyzeIssueForProduction(pattern: any, index: number): ProductionIssueAnalysis {
    const source = pattern.originalCall.source;
    const duplicateCount = pattern.duplicateCalls.length;
    
    // Determine priority based on impact
    let priority: 'critical' | 'high' | 'medium' | 'low' = 'medium';
    let timeToFix = '1-2 hours';
    let businessImpact = 'Performance optimization';
    
    if (duplicateCount >= 5 || pattern.timeWindow < 1000) {
      priority = 'critical';
      timeToFix = '30 minutes';
      businessImpact = 'User experience degradation';
    } else if (duplicateCount >= 3) {
      priority = 'high';
      timeToFix = '1 hour';
      businessImpact = 'Increased server load';
    }

    // Generate specific issue description
    let issue = `${pattern.pattern.toUpperCase()} pattern detected`;
    let suggestedFix = 'Implement request deduplication';
    let codeExample = '';

    if (pattern.pattern === 'rapid-fire') {
      issue = `Rapid-fire calls: ${duplicateCount} duplicates in ${pattern.timeWindow}ms`;
      suggestedFix = 'Add debouncing or useCallback optimization';
      codeExample = `// Add debouncing
const debouncedFunction = useMemo(
  () => debounce(originalFunction, 300),
  [dependencies]
);

// Or optimize with useCallback
const optimizedCallback = useCallback(() => {
  // your logic here
}, [specificDependencies]); // Only include necessary deps`;
    } else if (pattern.pattern === 'identical') {
      issue = `Identical requests: ${duplicateCount} exact duplicates`;
      suggestedFix = 'Implement React Query caching';
      codeExample = `// Replace manual fetch
const { data, isLoading } = useQuery({
  queryKey: ['${this.generateQueryKey(pattern.originalCall)}'],
  queryFn: () => fetchData(),
  staleTime: 5 * 60 * 1000, // 5 minutes
});`;
    } else if (pattern.pattern === 'burst') {
      issue = `Burst pattern: ${duplicateCount} calls in quick succession`;
      suggestedFix = 'Review component lifecycle and mounting';
      codeExample = `// Check for multiple component instances
// or useEffect dependency issues
useEffect(() => {
  // your logic here
}, [specificDependency]); // Avoid empty deps if not needed`;
    }

    return {
      component: source?.component,
      hook: source?.hook,
      file: source?.file,
      line: source?.line,
      issue,
      suggestedFix,
      reactQueryKey: this.generateQueryKey(pattern.originalCall),
      priority,
      timeToFix,
      businessImpact,
      codeExample: codeExample || undefined
    };
  }

  private static guessFilePath(name: string, type: 'component' | 'hook'): string | null {
    if (!name) return null;
    
    // Clean the name
    const cleanName = name.replace(/[^a-zA-Z0-9]/g, '');
    
    if (type === 'component') {
      // Common component patterns
      if (name.includes('Provider')) {
        return `lib/*/providers/${cleanName}.tsx`;
      }
      if (name.includes('Dialog') || name.includes('Modal')) {
        return `components/ui/${cleanName}.tsx`;
      }
      if (name.includes('Dam') || name.includes('Asset')) {
        return `lib/dam/presentation/components/**/${cleanName}.tsx`;
      }
      if (name.includes('Image') || name.includes('Generation')) {
        return `lib/image-generator/presentation/components/**/${cleanName}.tsx`;
      }
      return `components/**/${cleanName}.tsx`;
    } else {
      // Hook patterns
      if (name.startsWith('use')) {
        if (name.includes('Dam') || name.includes('Asset')) {
          return `lib/dam/presentation/hooks/**/${cleanName}.ts`;
        }
        if (name.includes('Image') || name.includes('Generation')) {
          return `lib/image-generator/presentation/hooks/**/${cleanName}.ts`;
        }
        return `hooks/**/${cleanName}.ts`;
      }
    }
    
    return null;
  }

  private static generateQueryKey(call: any): string {
    if (call.url) {
      // Extract meaningful parts from URL
      const urlParts = call.url.split('/').filter((part: string) => part && !part.match(/^[a-f0-9-]{36}$/)); // Remove UUIDs
      return urlParts.slice(-2).join('-') || 'endpoint';
    }
    
    if (call.type === 'server-action') {
      return `server-action-${call.payload?.actionId?.substring(0, 8) || 'unknown'}`;
    }
    
    return 'unknown-endpoint';
  }

  private static analyzeReactQueryOpportunity(pattern: any): {
    suggestedKey: string;
    strategy: string;
    performanceGain: string;
  } | null {
    const duplicateCount = pattern.duplicateCalls.length;
    
    if (duplicateCount < 2) return null;
    
    const queryKey = this.generateQueryKey(pattern.originalCall);
    let strategy = 'Basic caching';
    let performanceGain = `${duplicateCount} fewer API calls`;
    
    if (pattern.pattern === 'rapid-fire') {
      strategy = 'Debounced queries with short stale time';
      performanceGain = `${duplicateCount} fewer calls + improved UX`;
    } else if (pattern.pattern === 'identical') {
      strategy = 'Standard caching with 5min stale time';
      performanceGain = `${duplicateCount} fewer calls + instant responses`;
    }
    
    return {
      suggestedKey: queryKey,
      strategy,
      performanceGain
    };
  }

  private static extractRelevantStackTrace(stack: string): string[] {
    return stack.split('\n')
      .filter(line => line.trim().length > 0)
      .filter(line => !line.includes('node_modules'))
      .filter(line => !line.includes('webpack'))
      .slice(0, 5)
      .map(line => line.trim());
  }

  private static estimateBandwidthSavings(stats: ServiceNetworkStats): string {
    const avgRequestSize = 2048; // Average 2KB per request
    const wastedBytes = stats.redundantCalls * avgRequestSize;
    
    if (wastedBytes > 1024 * 1024) {
      return `${(wastedBytes / (1024 * 1024)).toFixed(1)}MB saved`;
    } else if (wastedBytes > 1024) {
      return `${(wastedBytes / 1024).toFixed(1)}KB saved`;
    }
    return `${wastedBytes}B saved`;
  }

  private static estimateTimeSavings(stats: ServiceNetworkStats): string {
    const avgResponseTime = 200; // Average 200ms per request
    const wastedTime = stats.redundantCalls * avgResponseTime;
    
    if (wastedTime > 1000) {
      return `${(wastedTime / 1000).toFixed(1)}s faster loading`;
    }
    return `${wastedTime}ms faster loading`;
  }
}