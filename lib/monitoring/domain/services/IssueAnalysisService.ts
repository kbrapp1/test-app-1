import { ReactQueryCacheAnalysisService } from './ReactQueryCacheAnalysisService';
import { NetworkPatternAnalysisService } from './NetworkPatternAnalysisService';
import { NetworkBusinessImpactService } from './NetworkBusinessImpactService';

/**
 * Domain Service: Pure business logic for analyzing network redundancy issues
 * Responsibility: Determine if network patterns represent legitimate vs problematic behavior
 * Bounded Context: Network Performance Monitoring
 */
export class IssueAnalysisService {
  constructor(
    private readonly cacheAnalysisService: ReactQueryCacheAnalysisService
  ) {}

  /**
   * Business Rule: Analyze if a redundant pattern represents a real issue
   * Returns null for legitimate behavior that should not be reported
   */
  analyzeRedundantPattern(pattern: any): IssueAnalysisResult | null {
    const source = pattern.originalCall.source;
    const duplicateCount = pattern.duplicateCalls.length;
    
    // Business Rule 1: Use enhanced React Query analysis for cache-related issues
    const reactQueryAnalysis = this.cacheAnalysisService.analyzeReactQueryPattern([
      pattern.originalCall,
      ...pattern.duplicateCalls
    ]);
    
    // Business Rule 2: Only use network analysis if we have a valid pattern type
    let networkAnalysis = null;
    if (!reactQueryAnalysis && pattern.pattern) {
      networkAnalysis = NetworkPatternAnalysisService.analyzeNetworkPattern(pattern);
    }
    
    // Business Rule 3: If both analyses return null, this is legitimate behavior
    if (!reactQueryAnalysis && !networkAnalysis) {
      return null; // Skip legitimate infinite scroll, user interactions, etc.
    }
    
    // Business Rule 4: Determine priority and impact
    const priorityInfo = NetworkBusinessImpactService.determineIssuePriority(
      duplicateCount, 
      pattern.timeWindow
    );
    
    // Handle different analysis result types
    if (reactQueryAnalysis) {
      return {
        source: {
          component: source?.component,
          hook: source?.hook,
          file: reactQueryAnalysis.codeLocation || source?.file,
          line: source?.line,
          trigger: source?.trigger
        },
        classification: {
          issue: reactQueryAnalysis.issue,
          severity: reactQueryAnalysis.severity as any,
          category: this.categorizeIssue(reactQueryAnalysis.issue),
          isReactQueryRelated: true
        },
        solution: {
          suggestedFix: reactQueryAnalysis.specificFix,
          estimatedImpact: reactQueryAnalysis.estimatedImpact,
          businessImpact: priorityInfo.businessImpact
        },
        performance: {
          duplicateCount,
          timeWindow: pattern.timeWindow,
          priority: reactQueryAnalysis.severity as any
        },
        originalPattern: pattern,
        analysisSource: 'cache-analysis' as const
      };
    } else {
      // NetworkIssueAnalysis case
      return {
        source: {
          component: source?.component,
          hook: source?.hook,
          file: source?.file,
          line: source?.line,
          trigger: source?.trigger
        },
        classification: {
          issue: networkAnalysis!.issue,
          severity: priorityInfo.priority,
          category: this.categorizeIssue(networkAnalysis!.issue),
          isReactQueryRelated: false
        },
        solution: {
          suggestedFix: networkAnalysis!.suggestedFix,
          estimatedImpact: priorityInfo.timeToFix,
          businessImpact: priorityInfo.businessImpact
        },
        performance: {
          duplicateCount,
          timeWindow: pattern.timeWindow,
          priority: priorityInfo.priority
        },
        originalPattern: pattern,
        analysisSource: 'network-pattern' as const
      };
    }
  }

  /**
   * Business Rule: Categorize issues by type for better organization
   */
  private categorizeIssue(issue: string): IssueCategory {
    const lowerIssue = issue.toLowerCase();
    
    if (lowerIssue.includes('cache') || lowerIssue.includes('react query')) {
      return 'cache-optimization';
    }
    
    if (lowerIssue.includes('redundant') || lowerIssue.includes('duplicate')) {
      return 'redundancy-elimination';
    }
    
    if (lowerIssue.includes('performance') || lowerIssue.includes('timing')) {
      return 'performance-optimization';
    }
    
    if (lowerIssue.includes('stale') || lowerIssue.includes('revalidate')) {
      return 'data-freshness';
    }
    
    return 'general-optimization';
  }

  /**
   * Business Rule: Classify issues by urgency for action planning
   */
  classifyIssuesByUrgency(analysisResults: IssueAnalysisResult[]): IssueClassification {
    const critical = analysisResults.filter(r => r.classification.severity === 'critical');
    const high = analysisResults.filter(r => r.classification.severity === 'high');
    const medium = analysisResults.filter(r => r.classification.severity === 'medium');
    const low = analysisResults.filter(r => r.classification.severity === 'low');

    return {
      critical: critical.length,
      high: high.length,
      medium: medium.length,
      low: low.length,
      total: analysisResults.length,
      categories: this.groupByCategory(analysisResults),
      hasReactQueryIssues: analysisResults.some(r => r.classification.isReactQueryRelated)
    };
  }

  /**
   * Business Rule: Group issues by category for targeted fixes
   */
  private groupByCategory(results: IssueAnalysisResult[]): Map<IssueCategory, IssueAnalysisResult[]> {
    const categories = new Map<IssueCategory, IssueAnalysisResult[]>();
    
    for (const result of results) {
      const category = result.classification.category;
      if (!categories.has(category)) {
        categories.set(category, []);
      }
      categories.get(category)!.push(result);
    }
    
    return categories;
  }

  /**
   * Factory method for dependency injection
   */
  static create(): IssueAnalysisService {
    return new IssueAnalysisService(
      ReactQueryCacheAnalysisService.create()
    );
  }
}

/**
 * Value Object: Immutable analysis result
 */
export interface IssueAnalysisResult {
  readonly source: {
    readonly component?: string;
    readonly hook?: string;
    readonly file?: string;
    readonly line?: number;
    readonly trigger?: string;
  };
  readonly classification: {
    readonly issue: string;
    readonly severity: 'critical' | 'high' | 'medium' | 'low';
    readonly category: IssueCategory;
    readonly isReactQueryRelated: boolean;
  };
  readonly solution: {
    readonly suggestedFix: string;
    readonly estimatedImpact: string;
    readonly businessImpact: string;
  };
  readonly performance: {
    readonly duplicateCount: number;
    readonly timeWindow: number;
    readonly priority: 'critical' | 'high' | 'medium' | 'low';
  };
  readonly originalPattern: any;
  readonly analysisSource: 'cache-analysis' | 'network-pattern';
}

/**
 * Value Object: Issue classification summary
 */
export interface IssueClassification {
  readonly critical: number;
  readonly high: number;
  readonly medium: number;
  readonly low: number;
  readonly total: number;
  readonly categories: Map<IssueCategory, IssueAnalysisResult[]>;
  readonly hasReactQueryIssues: boolean;
}

/**
 * Value Object: Issue category enumeration
 */
export type IssueCategory = 
  | 'cache-optimization'
  | 'redundancy-elimination' 
  | 'performance-optimization'
  | 'data-freshness'
  | 'general-optimization'; 