import { CacheAnalysisResult } from '../../../domain/value-objects/CacheAnalysisResult';

/**
 * Application Service: Cache Key Mismatch Fix Generator
 * Single Responsibility: Generate fix recommendations for cache key mismatches
 * DDD Pattern: Specialized service for single concern
 */
export class CacheKeyMismatchFixGenerator {

  /**
   * Generate specific fix for cache key mismatch issues
   */
  generateFix(analysis: CacheAnalysisResult): string {
    return `
// SPECIFIC FIX for ${analysis.issue}:
const query = useInfiniteQuery({
  queryKey,
  queryFn,
  // ADD THIS: Use shared cache data as initial data
  initialData: reuseSharedData && existingSharedData && existingSharedData.length >= 20 
    ? {
        pages: [existingSharedData.slice(0, GENERATIONS_PER_PAGE)],
        pageParams: [0],
      }
    : undefined,
  // ... rest of config
});

// RESULT: ${analysis.getFormattedImpact()}
      `;
  }
} 