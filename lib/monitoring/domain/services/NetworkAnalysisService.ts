import { NetworkIssue } from '../network-efficiency/value-objects/NetworkIssue';

export interface NetworkIssueAnalysis {
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

export class NetworkAnalysisService {
  static calculateBusinessImpact(issues: NetworkIssue[]): string {
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

  static analyzeIssueForProduction(
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

    const codeExample = this.generateCodeExample(issue.type, pageContext);
    const implementationSteps = this.getImplementationSteps(issue.type);

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

  static estimateRedundancyImprovement(issues: NetworkIssue[]): string {
    const redundancyIssues = issues.filter(issue => issue.type === 'redundancy');
    if (redundancyIssues.length === 0) return 'No redundancy issues detected';
    
    const totalDuplicateRequests = redundancyIssues.reduce((sum, issue) => sum + issue.count, 0);
    const estimatedReduction = Math.round((totalDuplicateRequests * 0.8) / redundancyIssues.length);
    
    return `${estimatedReduction}% reduction in API requests through React Query implementation`;
  }

  static estimateResponseTimeImprovement(issues: NetworkIssue[]): string {
    const slowResponseIssues = issues.filter(issue => issue.type === 'slow-response');
    if (slowResponseIssues.length === 0) return 'No response time issues detected';
    
    return `30-50% faster response times through database optimization and caching`;
  }

  private static generateCodeExample(issueType: string, pageContext?: string): string {
    if (issueType === 'redundancy') {
      return `// Replace multiple fetch calls with React Query
const { data, isLoading } = useQuery({
  queryKey: ['${pageContext || 'data'}', id],
  queryFn: () => fetchData(id),
  staleTime: 5 * 60 * 1000, // 5 minutes
});`;
    } else {
      return `// Add caching and optimize database queries
app.get('/api/endpoint', async (req, res) => {
  const cacheKey = 'endpoint-' + req.params.id;
  let data = await cache.get(cacheKey);
  
  if (!data) {
    data = await optimizedDatabaseQuery(req.params.id);
    await cache.set(cacheKey, data, 300); // 5 min cache
  }
  
  res.json(data);
});`;
    }
  }

  private static getImplementationSteps(issueType: string): string[] {
    if (issueType === 'redundancy') {
      return [
        'Identify components making duplicate API calls',
        'Replace fetch/axios calls with React Query useQuery hooks',
        'Configure appropriate staleTime and cacheTime values',
        'Test to ensure requests are properly deduplicated'
      ];
    } else {
      return [
        'Analyze slow API endpoints using monitoring tools',
        'Add database indexing for frequently queried fields',
        'Implement response caching at API level',
        'Consider pagination for large datasets',
        'Monitor response times after optimization'
      ];
    }
  }
} 