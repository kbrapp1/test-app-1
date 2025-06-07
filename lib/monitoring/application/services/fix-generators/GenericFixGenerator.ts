import { CacheAnalysisResult } from '../../../domain/value-objects/CacheAnalysisResult';

/**
 * Application Service: Generic Fix Generator
 * Single Responsibility: Generate generic fix recommendations and fallback analysis
 * DDD Pattern: Specialized service for fallback scenarios
 */
export class GenericFixGenerator {

  /**
   * Generate generic fix recommendations
   */
  generateGenericFix(analysis: CacheAnalysisResult): string {
    // Defensive handling for malformed analysis objects
    const issue = analysis?.issue || 'Unknown cache issue';
    const rootCause = analysis?.rootCause || 'Root cause not available';
    const specificFix = analysis?.specificFix || 'Review cache configuration';
    const impact = analysis?.getFormattedImpact?.() || 'Impact unknown';

    return `
// GENERIC FIX for ${issue}:
// Root Cause: ${rootCause}
// Recommended Fix: ${specificFix}
// Expected Impact: ${impact}

// Please review your React Query configuration and ensure:
// 1. Appropriate staleTime (usually 2-5 minutes)
// 2. Consistent cache keys for related data
// 3. Proper use of initialData for data sharing
// 4. Avoid redundant polling or refetch intervals
      `;
  }

  /**
   * Create a fallback analysis when the provided analysis is invalid
   */
  createFallbackAnalysis(): CacheAnalysisResult {
    return new CacheAnalysisResult(
      'medium',
      'Unknown cache issue',
      'Analysis data was incomplete or malformed',
      'Review cache configuration and ensure proper data flow',
      'Unable to determine impact - requires investigation'
    );
  }
} 