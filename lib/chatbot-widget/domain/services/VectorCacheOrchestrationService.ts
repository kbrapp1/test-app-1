/**
 * Vector Cache Orchestration Service
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Orchestrate complex vector cache workflows
 * - Domain service focused on coordinating initialization and search operations
 * - Keep business logic pure, no external dependencies beyond domain services
 * - Never exceed 250 lines per @golden-rule
 * - Delegate all specialized operations to focused services
 * - Handle complex workflows with proper error handling
 * - Support comprehensive logging and monitoring
 */

import { KnowledgeItem } from './interfaces/IKnowledgeRetrievalService';
import { BusinessRuleViolationError } from '../errors/ChatbotWidgetDomainErrors';
import { ISessionLogger } from './interfaces/IChatbotLoggingService';
import { VectorMemoryManagementService } from './VectorMemoryManagementService';
import { VectorSimilarityService } from './VectorSimilarityService';
import { VectorCacheStatisticsService } from './VectorCacheStatisticsService';
import { VectorCacheLoggingService } from './VectorCacheLoggingService';
import {
  CachedKnowledgeVector,
  VectorCacheStats,
  VectorSearchOptions,
  VectorCacheConfig,
  VectorCacheInitializationResult,
  VectorSearchResult
} from '../types/VectorCacheTypes';

/** Orchestration Service for Complex Vector Cache Operations */
export class VectorCacheOrchestrationService {
  
  /**
   * Orchestrate cache initialization workflow
   * 
   * AI INSTRUCTIONS:
   * - Coordinate initialization across multiple specialized services
   * - Handle comprehensive logging and error tracking
   * - Manage memory limits and eviction during initialization
   * - Return detailed initialization results
   */
  static async orchestrateInitialization(
    vectors: Array<{ item: KnowledgeItem; vector: number[] }>,
    cachedVectors: Map<string, CachedKnowledgeVector>,
    config: Required<VectorCacheConfig>,
    logger: ISessionLogger,
    organizationId: string,
    chatbotConfigId: string,
    loadVectorsCallback: (vectors: Array<{ item: KnowledgeItem; vector: number[] }>) => void,
    clearCacheCallback: () => void
  ): Promise<VectorCacheInitializationResult> {
    const startTime = Date.now();

    try {
      // Log initialization start
      VectorCacheLoggingService.logInitializationStart(
        logger,
        vectors.length,
        config,
        organizationId
      );

      // Clear existing cache and load vectors
      clearCacheCallback();
      loadVectorsCallback(vectors);

      // Enforce memory limits using specialized service
      const evictionResult = VectorMemoryManagementService.enforceMemoryLimits(
        cachedVectors,
        config,
        logger
      );

      // Calculate final metrics and log results
      const timeMs = Date.now() - startTime;
      const initializationMetrics = VectorCacheStatisticsService.generateInitializationMetrics(
        timeMs,
        cachedVectors.size,
        evictionResult.evictedCount,
        evictionResult.memoryUsageKB,
        config.maxMemoryKB,
        vectors.length > 0 ? vectors[0].vector.length : 0
      );

      VectorCacheLoggingService.logInitializationResults(logger, initializationMetrics);

      return {
        success: true,
        vectorsLoaded: cachedVectors.size,
        vectorsEvicted: evictionResult.evictedCount,
        memoryUsageKB: evictionResult.memoryUsageKB,
        timeMs
      };

    } catch (error) {
      const timeMs = Date.now() - startTime;
      
      throw new BusinessRuleViolationError(
        'Vector cache initialization orchestration failed',
        {
          error: error instanceof Error ? error.message : 'Unknown error',
          organizationId,
          chatbotConfigId,
          vectorCount: vectors.length,
          timeMs
        }
      );
    }
  }

  /** Orchestrate cache search workflow */
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

  /** Orchestrate cache clearing workflow */
  static orchestrateCacheClear(
    previousSize: number,
    organizationId: string,
    chatbotConfigId: string,
    logger: ISessionLogger,
    clearCacheCallback: () => void
  ): void {
    try {
      // Log cache clearing operation
      VectorCacheLoggingService.logCacheClear(
        logger,
        previousSize,
        organizationId,
        chatbotConfigId
      );

      // Execute cache clearing
      clearCacheCallback();

    } catch (error) {
      throw new BusinessRuleViolationError(
        'Vector cache clear orchestration failed',
        {
          error: error instanceof Error ? error.message : 'Unknown error',
          organizationId,
          chatbotConfigId,
          previousSize
        }
      );
    }
  }

  /** Orchestrate cache state monitoring */
  static orchestrateStateMonitoring(
    cachedVectors: Map<string, CachedKnowledgeVector>,
    config: Required<VectorCacheConfig>,
    searchCount: number,
    cacheHits: number,
    evictionsPerformed: number,
    initializationTime: Date | null,
    isInitialized: boolean,
    logger: ISessionLogger
  ): VectorCacheStats {
    try {
      const stats = VectorCacheStatisticsService.calculateCacheStats(
        cachedVectors,
        config,
        searchCount,
        cacheHits,
        evictionsPerformed,
        initializationTime
      );

      // Log current cache state
      VectorCacheLoggingService.logCacheState(
        logger,
        stats,
        isInitialized,
        cachedVectors.size
      );

      return stats;

    } catch (error) {
      throw new BusinessRuleViolationError(
        'Vector cache state monitoring failed',
        {
          error: error instanceof Error ? error.message : 'Unknown error',
          cacheSize: cachedVectors.size,
          isInitialized
        }
      );
    }
  }

  /**
   * Orchestrate error handling and logging
   * 
   * AI INSTRUCTIONS:
   * - Coordinate comprehensive error reporting
   * - Handle error context and debugging information
   * - Support troubleshooting and monitoring
   */
  static orchestrateErrorHandling(
    operation: string,
    error: Error,
    context: Record<string, unknown>,
    logger: ISessionLogger
  ): void {
    try {
      VectorCacheLoggingService.logError(
        logger,
        operation,
        error,
        context
      );
    } catch (loggingError) {
      // If logging fails, at least preserve the original error
      console.error('Failed to log vector cache error:', loggingError);
      console.error('Original error:', error);
    }
  }
} 