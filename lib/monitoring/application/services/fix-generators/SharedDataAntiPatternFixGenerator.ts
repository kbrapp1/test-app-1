import { CacheAnalysisResult } from '../../../domain/value-objects/CacheAnalysisResult';

/**
 * Application Service: Shared Data Anti-Pattern Fix Generator
 * Single Responsibility: Generate fix recommendations for shared data anti-patterns
 * DDD Pattern: Specialized service for data sharing issues
 */
export class SharedDataAntiPatternFixGenerator {

  /**
   * Generate specific fix for shared data anti-pattern issues
   */
  generateFix(analysis: CacheAnalysisResult): string {
    return `
// SPECIFIC FIX for ${analysis.issue}:

// Use initialData to share cache between hooks:
const { data: infiniteData } = useInfiniteQuery({
  queryKey: ['generations', 'infinite', filters],
  queryFn: ({ pageParam = 0 }) => getGenerations({ ...filters, offset: pageParam }),
  // Share data from regular query
  initialData: sharedData ? {
    pages: [sharedData.slice(0, 20)],
    pageParams: [0]
  } : undefined,
  staleTime: 2 * 60 * 1000,
});

// RESULT: ${analysis.getFormattedImpact()}
      `;
  }
} 