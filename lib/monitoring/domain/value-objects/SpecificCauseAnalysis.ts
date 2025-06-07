/**
 * Value object representing specific cause analysis results
 * Used by domain services to analyze performance issues
 */
export interface SpecificCauseAnalysis {
  primaryComponent?: string;
  primaryComponentPath?: string;
  componentIssue?: string;
  primaryHook?: string;
  primaryHookPath?: string;
  hookIssue?: string;
  problemQuery?: string;
  cacheIssue?: string;
  querySource?: string;
} 