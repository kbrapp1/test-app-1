/**
 * Search Metrics Logging Service
 * 
 * Orchestrates specialized logging services for knowledge processing operations.
 * Maintains backward compatibility while delegating to focused domain services
 * following DDD principles for the chatbot domain.
 */

import { ISessionLogger } from '../interfaces/IChatbotLoggingService';
import { VectorKnowledgeCache } from '../VectorKnowledgeCache';
import { SearchExecutionMetrics } from './KnowledgeSearchExecutionService';
import { VectorCacheStats, VectorCacheConfig, VectorSearchOptions } from '../../types/VectorCacheTypes';
import { VectorCacheStatisticsService } from '../VectorCacheStatisticsService';
import { SearchPerformanceLogger, SearchMetricsContext } from './logging/SearchPerformanceLogger';
import { VectorCacheInitializationLogger } from './logging/VectorCacheInitializationLogger';
import { VectorSearchOperationLogger } from './logging/VectorSearchOperationLogger';
import { VectorCacheStateLogger } from './logging/VectorCacheStateLogger';
import { KnowledgeProcessingErrorLogger } from './logging/KnowledgeProcessingErrorLogger';

// Re-export types for backward compatibility
export type { SearchMetricsContext } from './logging/SearchPerformanceLogger';

/**
 * Orchestrated logging service for knowledge search metrics and operations
 * 
 * Delegates to specialized logging services while maintaining backward compatibility
 * for existing consumers of the SearchMetricsLoggingService API.
 */
export class SearchMetricsLoggingService {

  // Search Performance Logging - Delegate to SearchPerformanceLogger
  static logSearchMetrics(
    logger: ISessionLogger,
    metrics: SearchExecutionMetrics,
    vectorCache: VectorKnowledgeCache,
    context: SearchMetricsContext
  ): void {
    return SearchPerformanceLogger.logSearchMetrics(logger, metrics, vectorCache, context);
  }

  static logResultQualityMetrics(
    logger: ISessionLogger,
    results: Array<{ similarity: number }>,
    threshold: number
  ): void {
    return SearchPerformanceLogger.logResultQualityMetrics(logger, results, threshold);
  }

  static logSearchMetricsLegacy(
    logger: ISessionLogger,
    timeMs: number,
    cacheSize: number,
    resultCount: number,
    cacheHitRate: number,
    memoryUtilization: number,
    threshold: number
  ): void {
    return SearchPerformanceLogger.logSearchMetricsLegacy(logger, timeMs, cacheSize, resultCount, cacheHitRate, memoryUtilization, threshold);
  }

  // Vector Cache Initialization Logging - Delegate to VectorCacheInitializationLogger
  static logVectorCacheInitializationStart(
    logger: ISessionLogger,
    vectorCount: number,
    config: Required<VectorCacheConfig>,
    organizationId: string
  ): void {
    return VectorCacheInitializationLogger.logInitializationStart(logger, vectorCount, config, organizationId);
  }

  static logVectorCacheInitializationResults(
    logger: ISessionLogger,
    metrics: ReturnType<typeof VectorCacheStatisticsService.generateInitializationMetrics>
  ): void {
    return VectorCacheInitializationLogger.logInitializationResults(logger, metrics);
  }

  // Vector Search Operation Logging - Delegate to VectorSearchOperationLogger  
  static logVectorSearchStart(
    logger: ISessionLogger,
    cacheSize: number,
    options: VectorSearchOptions,
    queryDimensions: number
  ): void {
    return VectorSearchOperationLogger.logSearchStart(logger, cacheSize, options, queryDimensions);
  }

  static logSearchResults(
    logger: ISessionLogger,
    options: VectorSearchOptions,
    results: Array<{ item: unknown; similarity: number }>,
    debugInfo: Array<{ similarity: number; id: string }>,
    timeMs: number,
    stats: VectorCacheStats
  ): void {
    return VectorSearchOperationLogger.logSearchResults(logger, options, results, debugInfo, timeMs, stats);
  }

  // Vector Cache State Logging - Delegate to VectorCacheStateLogger
  static logVectorCacheState(
    logger: ISessionLogger,
    stats: VectorCacheStats,
    operation?: string
  ): void {
    return VectorCacheStateLogger.logCacheState(logger, stats, operation);
  }

  static logCacheStateUpdate(
    logger: ISessionLogger,
    operation: string,
    beforeStats: VectorCacheStats,
    afterStats: VectorCacheStats
  ): void {
    return VectorCacheStateLogger.logCacheStateUpdate(logger, operation, beforeStats, afterStats);
  }

  static logMemoryEviction(
    logger: ISessionLogger,
    evictedCount: number,
    memoryFreedKB: number,
    reason: string
  ): void {
    return VectorCacheStateLogger.logMemoryEviction(logger, evictedCount, memoryFreedKB, reason);
  }

  static logCacheClear(
    logger: ISessionLogger,
    vectorsCleared: number,
    memoryFreedKB: number,
    reason?: string
  ): void {
    return VectorCacheStateLogger.logCacheClear(logger, vectorsCleared, memoryFreedKB, reason);
  }

  // Alias for backward compatibility
  static logCacheState = SearchMetricsLoggingService.logVectorCacheState;

  // Error Logging - Delegate to KnowledgeProcessingErrorLogger
  static logError(
    logger: ISessionLogger,
    error: Error,
    operation: string,
    context?: Record<string, unknown>
  ): void {
    return KnowledgeProcessingErrorLogger.logError(logger, error, operation, context);
  }

  // Additional methods for backward compatibility
  static logSearchStart(
    logger: ISessionLogger,
    context: SearchMetricsContext
  ): void {
    logger.logMessage(`🔍 Starting knowledge search for query: "${context.userQuery}"`);
    logger.logMessage(`📊 Organization: ${context.organizationId}`);
    logger.logMessage(`📊 Chatbot Config: ${context.chatbotConfigId}`);
    if (context.sessionId) {
      logger.logMessage(`📊 Session: ${context.sessionId}`);
    }
  }

  static logCacheReadiness(
    logger: ISessionLogger,
    vectorCache: VectorKnowledgeCache,
    isReady: boolean
  ): void {
    const stats = vectorCache.getCacheStats();
    logger.logMessage(`📊 Vector Cache Readiness: ${isReady ? '✅ Ready' : '❌ Not Ready'}`);
    logger.logMessage(`  Vectors Available: ${stats.totalVectors}`);
    logger.logMessage(`  Memory Usage: ${stats.memoryUsageKB} KB`);
  }

  static logSearchError(
    logger: ISessionLogger,
    error: Error,
    context: SearchMetricsContext
  ): void {
    return KnowledgeProcessingErrorLogger.logError(logger, error, 'knowledge-search', {
      organizationId: context.organizationId,
      chatbotConfigId: context.chatbotConfigId,
      sessionId: context.sessionId,
      userQuery: context.userQuery
    });
  }
}