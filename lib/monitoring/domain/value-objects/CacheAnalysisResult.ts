export interface CacheKeyMismatchAnalysis {
  severity: 'critical' | 'high' | 'medium' | 'low';
  issue: string;
  rootCause: string;
  specificFix: string;
  codeLocation?: string;
  estimatedImpact: string;
}

export interface ReactQueryCallAnalysis {
  hookName?: string;
  queryKey?: string;
  cacheKeyPattern?: string;
  isInfiniteQuery?: boolean;
  hasSharedDataIntent?: boolean;
  dataType?: string;
  originalCall?: any;
}

/**
 * Value Object for Cache Analysis Results
 * Single Responsibility: Represent cache analysis findings
 */
export class CacheAnalysisResult {
  constructor(
    public readonly severity: 'critical' | 'high' | 'medium' | 'low',
    public readonly issue: string,
    public readonly rootCause: string,
    public readonly specificFix: string,
    public readonly estimatedImpact: string,
    public readonly codeLocation?: string
  ) {
    if (!issue.trim()) {
      throw new Error('Issue description cannot be empty');
    }
    if (!rootCause.trim()) {
      throw new Error('Root cause cannot be empty');
    }
    if (!specificFix.trim()) {
      throw new Error('Specific fix cannot be empty');
    }
  }

  static create(analysis: CacheKeyMismatchAnalysis): CacheAnalysisResult {
    return new CacheAnalysisResult(
      analysis.severity,
      analysis.issue,
      analysis.rootCause,
      analysis.specificFix,
      analysis.estimatedImpact,
      analysis.codeLocation
    );
  }

  isCritical(): boolean {
    return this.severity === 'critical';
  }

  isHighPriority(): boolean {
    return this.severity === 'critical' || this.severity === 'high';
  }

  getFormattedImpact(): string {
    return this.estimatedImpact.includes('%') 
      ? this.estimatedImpact 
      : `Impact: ${this.estimatedImpact}`;
  }
} 