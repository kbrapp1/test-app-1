import { CacheAnalysisResult } from '../../domain/value-objects/CacheAnalysisResult';
import { CacheKeyMismatchFixGenerator } from './fix-generators/CacheKeyMismatchFixGenerator';
import { ServerActionCacheBypassFixGenerator } from './fix-generators/ServerActionCacheBypassFixGenerator';
import { SharedDataAntiPatternFixGenerator } from './fix-generators/SharedDataAntiPatternFixGenerator';
import { QueryPatternFixGenerator } from './fix-generators/QueryPatternFixGenerator';
import { GenericFixGenerator } from './fix-generators/GenericFixGenerator';

/**
 * Application Service: Cache Fix Recommendation Orchestrator
 * Single Responsibility: Orchestrate specialized fix generators for cache issues
 * Application Layer: Coordinates specialized fix generation services
 */
export class CacheFixRecommendationService {
  constructor(
    private readonly cacheKeyMismatchGenerator: CacheKeyMismatchFixGenerator,
    private readonly serverActionBypassGenerator: ServerActionCacheBypassFixGenerator,
    private readonly sharedDataAntiPatternGenerator: SharedDataAntiPatternFixGenerator,
    private readonly queryPatternGenerator: QueryPatternFixGenerator,
    private readonly genericFixGenerator: GenericFixGenerator
  ) {}

  /**
   * Generate specific fix recommendations based on analysis results
   */
  generateSpecificFix(analysis: CacheAnalysisResult): string {
    // Defensive check for undefined/null analysis or issue
    if (!analysis || !analysis.issue || typeof analysis.issue !== 'string') {
      return this.genericFixGenerator.generateGenericFix(
        analysis || this.genericFixGenerator.createFallbackAnalysis()
      );
    }

    const issue = analysis.issue;

    if (issue.includes('CACHE_KEY_MISMATCH')) {
      return this.cacheKeyMismatchGenerator.generateFix(analysis);
    }

    if (issue.includes('SERVER_ACTION_CACHE_BYPASS')) {
      return this.serverActionBypassGenerator.generateFix(analysis);
    }

    if (issue.includes('SHARED_DATA_ANTI_PATTERN')) {
      return this.sharedDataAntiPatternGenerator.generateFix(analysis);
    }

    if (issue.includes('Stale-while-revalidate')) {
      return this.queryPatternGenerator.generateStaleTimingFix(analysis);
    }

    if (issue.includes('Infinite query conflicts')) {
      return this.queryPatternGenerator.generateInfiniteQueryConflictFix(analysis);
    }

    if (issue.includes('polling interval conflicts')) {
      return this.queryPatternGenerator.generatePollingConflictFix(analysis);
    }

    // Default fallback
    return this.genericFixGenerator.generateGenericFix(analysis);
  }

  /**
   * Factory method for dependency injection
   */
  static create(): CacheFixRecommendationService {
    return new CacheFixRecommendationService(
      new CacheKeyMismatchFixGenerator(),
      new ServerActionCacheBypassFixGenerator(),
      new SharedDataAntiPatternFixGenerator(),
      new QueryPatternFixGenerator(),
      new GenericFixGenerator()
    );
  }

} 