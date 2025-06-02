/**
 * Report Generation Service
 * 
 * Domain service responsible for analysis report generation and copying
 * Single responsibility: Create comprehensive network analysis reports
 */

import { CallAnalysis } from '@/lib/utils/network-monitor';
import { NetworkCall } from './NetworkMonitorService';

export class ReportGenerationService {
  
  async generateAndCopyReport(
    analysis: CallAnalysis,
    calls: NetworkCall[],
    currentAction: string
  ): Promise<boolean> {
    const report = this.generateReport(analysis, calls, currentAction);
    return await this.copyToClipboard(report);
  }

  private generateReport(
    analysis: CallAnalysis,
    calls: NetworkCall[],
    currentAction: string
  ): string {
    const currentActionCalls = calls.filter(call => call.actionContext === currentAction);
    const actionScope = analysis && calls.length > currentActionCalls.length ? 
      `Action: ${currentAction} (${currentActionCalls.length}/${calls.length} calls)` : 
      'All Actions';

    return `DAM Network Analysis Report
Generated: ${new Date().toLocaleString()}
Scope: ${actionScope} | Organization: ${window.location.pathname}

=== SUMMARY ===
Total Calls: ${analysis.totalCalls}
Unique Endpoints: ${analysis.uniqueCalls}
Redundant Calls: ${analysis.redundantCalls.length}
Rapid Fire Groups: ${analysis.timeAnalysis.rapidFireCalls.length}

${this.getPerformanceStatus(analysis)}

${this.generateRedundantCallsSection(analysis)}

${this.generateRapidFireSection(analysis)}

${this.generateEndpointSection(analysis)}

${this.generateTimelineSection(calls)}

${this.generateRecommendationsSection(analysis)}

=== NEXT STEPS ===
1. Copy this report to your issue tracker
2. Review the flagged endpoints in your code
3. Implement suggested optimizations
4. Re-test with the network monitor
5. Monitor production metrics for improvements
`;
  }

  private getPerformanceStatus(analysis: CallAnalysis): string {
    return analysis.redundantCalls.length > 0 || analysis.timeAnalysis.rapidFireCalls.length > 0 
      ? '🚨 PERFORMANCE ISSUES DETECTED - ACTION REQUIRED' 
      : '✅ NO PERFORMANCE ISSUES DETECTED';
  }

  private generateRedundantCallsSection(analysis: CallAnalysis): string {
    if (analysis.redundantCalls.length === 0) {
      return '=== REDUNDANT CALLS (IDENTICAL DUPLICATES) ===\nNone detected ✅';
    }

    const details = analysis.redundantCalls.map((call, i) => {
      const url = call.url || 'URL_MISSING';
      const method = call.method || 'METHOD_MISSING';
      const body = call.body ? `\n    Body: ${typeof call.body === 'string' ? call.body : JSON.stringify(call.body)}` : '';
      const headers = call.headers ? `\n    Headers: ${JSON.stringify(call.headers)}` : '';
      const stackTrace = call.stackTrace ? `Stack: ${call.stackTrace.split('\n')[1]?.trim() || 'Unknown'}` : 'Stack: Not available';
      
      return `${i + 1}. ${method} ${url}${body}${headers}
   Time: ${new Date(call.timestamp).toLocaleTimeString()}.${call.timestamp % 1000}
   ${stackTrace}`;
    }).join('\n\n');

    return `=== REDUNDANT CALLS (IDENTICAL DUPLICATES) ===\n${details}`;
  }

  private generateRapidFireSection(analysis: CallAnalysis): string {
    if (analysis.timeAnalysis.rapidFireCalls.length === 0) {
      return '=== RAPID FIRE CALLS (BURST PATTERNS) ===\nNone detected ✅';
    }

    const details = analysis.timeAnalysis.rapidFireCalls.map((group, i) => {
      const firstCall = group[0];
      const lastCall = group[group.length - 1];
      const duration = lastCall.timestamp - firstCall.timestamp;
      const avgInterval = duration / (group.length - 1);
      const url = firstCall.url || 'URL_MISSING';
      const method = firstCall.method || 'METHOD_MISSING';
      
      return `${i + 1}. ${method} ${url}
   Count: ${group.length} calls in ${duration}ms (avg ${avgInterval.toFixed(0)}ms apart)
   Times: ${group.map(c => new Date(c.timestamp).toLocaleTimeString()).join(', ')}
   Pattern: ${group.length >= 5 ? 'EXCESSIVE' : 'MODERATE'} burst`;
    }).join('\n\n');

    return `=== RAPID FIRE CALLS (BURST PATTERNS) ===\n${details}`;
  }

  private generateEndpointSection(analysis: CallAnalysis): string {
    const endpoints = Object.entries(analysis.callsByEndpoint).map(([endpoint, calls]) => {
      const method = endpoint.split(':')[0];
      const url = endpoint.split(':').slice(1).join(':');
      const timestamps = calls.map(c => new Date(c.timestamp).toLocaleTimeString()).join(', ');
      
      return `${method} ${url}
  Count: ${calls.length} calls
  Times: ${timestamps}
  ${calls.length > 2 ? '⚠️  Consider batching or caching' : '✅ Normal frequency'}`;
    }).join('\n\n');

    return `=== ALL CALLS BY ENDPOINT ===\n${endpoints}`;
  }

  private generateTimelineSection(calls: NetworkCall[]): string {
    const recentCalls = calls.slice(-15).map((call, i) => {
      const prev = calls[calls.length - 15 + i - 1];
      const gap = prev ? call.timestamp - prev.timestamp : 0;
      const gapMs = gap > 0 ? ` (+${gap}ms)` : '';
      
      return `${i + 1}. [${call.timeString}${gapMs}] ${call.method} ${call.url || 'URL_MISSING'}`;
    }).join('\n');

    return `=== RECENT CALL TIMELINE ===\n${recentCalls}`;
  }

  private generateRecommendationsSection(analysis: CallAnalysis): string {
    let recommendations = '=== RECOMMENDED ACTIONS ===';

    if (analysis.redundantCalls.length > 0) {
      recommendations += `\n🔧 REDUNDANT CALLS:
- Add request deduplication using ApiDeduplicationService
- Check for rapid component re-renders causing duplicate API calls
- Implement proper loading states to prevent button double-clicks
- Use React.memo() or useMemo() for expensive operations`;
    }

    if (analysis.timeAnalysis.rapidFireCalls.length > 0) {
      recommendations += `\n🔧 RAPID FIRE CALLS:
- Implement debouncing for search/filter inputs (300-500ms)
- Use batch requests for bulk operations
- Add proper dependency arrays to useEffect hooks
- Consider virtualization for large lists`;
    }

    if (analysis.totalCalls > 20) {
      recommendations += `\n🔧 HIGH CALL VOLUME:
- Implement response caching with TTL
- Use pagination or infinite scroll
- Consider GraphQL for complex data fetching
- Add background sync for non-critical updates`;
    }

    if (analysis.redundantCalls.length === 0 && analysis.timeAnalysis.rapidFireCalls.length === 0) {
      recommendations += `\n✅ PERFORMANCE LOOKS GOOD:
- No redundant calls detected
- No rapid fire patterns found
- Current implementation appears optimized`;
    }

    return recommendations;
  }

  private async copyToClipboard(text: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      console.warn('Failed to copy analysis:', error);
      console.log('Network Analysis (copy manually):', text);
      return false;
    }
  }
} 