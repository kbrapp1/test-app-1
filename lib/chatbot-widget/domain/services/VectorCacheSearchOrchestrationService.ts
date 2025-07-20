/**
 * Vector Cache Search Orchestration Service
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Orchestrate vector cache search workflows
 * - Domain service focused on coordinating search operations
 * - Keep business logic pure, no external dependencies beyond domain services
 * - Never exceed 250 lines per @golden-rule
 * - Delegate all specialized operations to focused services
 * - Handle search workflows with proper error handling
 * - Support comprehensive logging and performance monitoring
 */

import { BusinessRuleViolationError } from '../errors/ChatbotWidgetDomainErrors';
import { ISessionLogger } from './interfaces/IChatbotLoggingService';
import { VectorSimilarityService } from './VectorSimilarityService';
import { VectorCacheLoggingService } from './VectorCacheLoggingService';
import {
  CachedKnowledgeVector,
  VectorCacheStats,
  VectorSearchOptions,
  VectorSearchResult
} from '../types/VectorCacheTypes';

/** Orchestration Service for Vector Cache Search Operations */
export class VectorCacheSearchOrchestrationService {
  
  /**
   * Orchestrate cache search workflow
   * 
   * AI INSTRUCTIONS:
   * - Coordinate search across multiple specialized services
   * - Handle comprehensive logging and performance tracking
   * - Manage search statistics and cache metrics
   * - Return optimized search results with debug information
   */
  static async orchestrateSearch(
    queryEmbedding: number[],
    options: VectorSearchOptions,
    cachedVectors: Map<string, CachedKnowledgeVector>,
    logger: ISessionLogger,
    organizationId: string,
    chatbotConfigId: string,
    incrementSearchStats: () => void,
    getCacheStats: () => VectorCacheStats
  ): Promise<VectorSearchResult[]> {
    const startTime = Date.now();

    try {
      // Update search statistics
      incrementSearchStats();

      // Log search start
      VectorCacheLoggingService.logSearchStart(
        logger,
        cachedVectors.size,
        options,
        queryEmbedding.length
      );

      // Perform similarity search using specialized service
      const { results, debugInfo } = VectorSimilarityService.searchVectors(
        queryEmbedding,
        cachedVectors,
        options
      );

      const timeMs = Date.now() - startTime;
      const stats = getCacheStats();

      // Log search results and performance metrics
      VectorCacheLoggingService.logSearchResults(
        logger,
        options,
        results,
        debugInfo,
        timeMs,
        stats
      );

      VectorCacheLoggingService.logSearchMetrics(
        logger,
        timeMs,
        cachedVectors.size,
        results.length,
        stats.cacheHitRate,
        stats.memoryUtilization,
        options.threshold || VectorSimilarityService.DEFAULT_THRESHOLD
      );

      return results;

    } catch (error) {
      const timeMs = Date.now() - startTime;
      
      throw new BusinessRuleViolationError(
        'Vector cache search orchestration failed',
        {
          error: error instanceof Error ? error.message : 'Unknown error',
          organizationId,
          chatbotConfigId,
          searchTimeMs: timeMs,
          cacheSize: cachedVectors.size
        }
      );
    }
  }
}