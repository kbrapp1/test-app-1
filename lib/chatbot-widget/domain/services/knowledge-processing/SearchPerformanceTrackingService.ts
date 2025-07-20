/**
 * Search Performance Tracking Service
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Track search performance metrics and enforce thresholds
 * - Domain service focused on performance monitoring and business rules
 * - Keep business logic pure, minimal external dependencies
 * - Never exceed 250 lines per @golden-rule
 */

import { PerformanceThresholdError } from '../../errors/ChatbotWidgetDomainErrors';

export interface SearchExecutionMetrics {
  embeddingTimeMs: number;
  searchTimeMs: number;
  totalTimeMs: number;
  resultsFound: number;
  queryLength: number;
  vectorDimensions: number;
}

export interface PerformanceSnapshot {
  startTime: number;
  embeddingStartTime?: number;
  searchStartTime?: number;
}

/**
 * Specialized service for tracking search performance and enforcing thresholds
 * 
 * AI INSTRUCTIONS:
 * - Tracks timing metrics for all search operations
 * - Enforces business performance thresholds
 * - Creates performance snapshots and calculates metrics
 * - Security: Preserves organizationId in all error contexts
 */
export class SearchPerformanceTrackingService {
  private static readonly PERFORMANCE_THRESHOLD_MS = 5000;
  private static readonly EMBEDDING_THRESHOLD_MS = 3000;
  private static readonly SEARCH_THRESHOLD_MS = 2000;

  constructor(
    private readonly organizationId: string,
    private readonly chatbotConfigId: string
  ) {}

  /**
   * Create initial performance snapshot
   */
  createPerformanceSnapshot(): PerformanceSnapshot {
    return {
      startTime: Date.now()
    };
  }

  /**
   * Record embedding operation start time
   */
  recordEmbeddingStart(snapshot: PerformanceSnapshot): PerformanceSnapshot {
    return {
      ...snapshot,
      embeddingStartTime: Date.now()
    };
  }

  /**
   * Record search operation start time
   */
  recordSearchStart(snapshot: PerformanceSnapshot): PerformanceSnapshot {
    return {
      ...snapshot,
      searchStartTime: Date.now()
    };
  }

  /**
   * Calculate embedding duration from snapshot
   */
  calculateEmbeddingTime(snapshot: PerformanceSnapshot): number {
    if (!snapshot.embeddingStartTime) {
      throw new Error('Embedding start time not recorded in performance snapshot');
    }
    return Date.now() - snapshot.embeddingStartTime;
  }

  /**
   * Calculate search duration from snapshot
   */
  calculateSearchTime(snapshot: PerformanceSnapshot): number {
    if (!snapshot.searchStartTime) {
      throw new Error('Search start time not recorded in performance snapshot');
    }
    return Date.now() - snapshot.searchStartTime;
  }

  /**
   * Calculate total operation duration
   */
  calculateTotalTime(snapshot: PerformanceSnapshot): number {
    return Date.now() - snapshot.startTime;
  }

  /**
   * Create complete metrics object from performance data
   */
  createMetrics(
    snapshot: PerformanceSnapshot,
    embeddingTimeMs: number,
    searchTimeMs: number,
    resultsFound: number,
    queryLength: number,
    vectorDimensions: number
  ): SearchExecutionMetrics {
    return {
      embeddingTimeMs,
      searchTimeMs,
      totalTimeMs: this.calculateTotalTime(snapshot),
      resultsFound,
      queryLength,
      vectorDimensions
    };
  }

  /**
   * Validate performance thresholds and throw error if exceeded
   * 
   * AI INSTRUCTIONS:
   * - Enforces business performance requirements
   * - Throws domain-specific errors with rich context
   * - Security: Preserves organizationId and chatbotConfigId in errors
   */
  validatePerformanceThresholds(
    totalTimeMs: number,
    embeddingTimeMs: number,
    searchTimeMs: number,
    query: string
  ): void {
    // Check total operation threshold
    if (totalTimeMs > SearchPerformanceTrackingService.PERFORMANCE_THRESHOLD_MS) {
      throw new PerformanceThresholdError(
        'knowledge_search_duration',
        SearchPerformanceTrackingService.PERFORMANCE_THRESHOLD_MS,
        totalTimeMs,
        {
          query: this.truncateQuery(query),
          embeddingTimeMs,
          searchTimeMs,
          organizationId: this.organizationId,
          chatbotConfigId: this.chatbotConfigId
        }
      );
    }

    // Check embedding-specific threshold
    if (embeddingTimeMs > SearchPerformanceTrackingService.EMBEDDING_THRESHOLD_MS) {
      throw new PerformanceThresholdError(
        'embedding_generation_duration',
        SearchPerformanceTrackingService.EMBEDDING_THRESHOLD_MS,
        embeddingTimeMs,
        {
          query: this.truncateQuery(query),
          organizationId: this.organizationId,
          chatbotConfigId: this.chatbotConfigId
        }
      );
    }

    // Check search-specific threshold
    if (searchTimeMs > SearchPerformanceTrackingService.SEARCH_THRESHOLD_MS) {
      throw new PerformanceThresholdError(
        'vector_search_duration',
        SearchPerformanceTrackingService.SEARCH_THRESHOLD_MS,
        searchTimeMs,
        {
          query: this.truncateQuery(query),
          organizationId: this.organizationId,
          chatbotConfigId: this.chatbotConfigId
        }
      );
    }
  }

  /**
   * Truncate query for error reporting to prevent excessive context
   */
  private truncateQuery(query: string, maxLength: number = 100): string {
    if (query.length <= maxLength) {
      return query;
    }
    return query.substring(0, maxLength) + '...';
  }
}