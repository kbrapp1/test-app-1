/**
 * Vector Cache Logging Service
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Handle all vector cache logging operations
 * - Domain service focused on structured logging for cache operations
 * - Keep business logic pure, no external dependencies beyond logging interfaces
 * - Never exceed 250 lines per @golden-rule
 * - Provide comprehensive logging for cache initialization, search, and performance
 * - Support monitoring and debugging through detailed log messages
 * - Handle metric logging with proper type casting for logger compatibility
 */

import { ISessionLogger } from './interfaces/IChatbotLoggingService';
import { VectorSimilarityService } from './VectorSimilarityService';
import { VectorCacheStatisticsService } from './VectorCacheStatisticsService';
import {
  VectorSearchOptions,
  VectorSearchResult,
  VectorCacheStats,
  VectorCacheConfig
} from '../types/VectorCacheTypes';

/**
 * Specialized Logging Service for Vector Cache Operations
 * 
 * AI INSTRUCTIONS:
 * - Handles all logging operations for vector cache lifecycle
 * - Provides structured logging for initialization, search, and performance
 * - Supports monitoring and debugging with detailed metrics
 * - Maintains consistent logging format across all cache operations
 * - Handles type casting for logger compatibility
 */
export class VectorCacheLoggingService {
  
  /**
   * Log cache initialization start with configuration
   * 
   * AI INSTRUCTIONS:
   * - Log initialization parameters and configuration
   * - Provide visibility into cache setup process
   * - Support troubleshooting initialization issues
   */
  static logInitializationStart(
    logger: ISessionLogger,
    vectorCount: number,
    config: Required<VectorCacheConfig>,
    organizationId: string
  ): void {
    logger.logStep('Vector Cache Initialization with Memory Management');
    logger.logMessage(`Loading ${vectorCount} knowledge vectors into memory`);
    logger.logMessage(`📊 Memory limit: ${config.maxMemoryKB} KB, Vector limit: ${config.maxVectors}`);
    logger.logMessage(`📊 Organization: ${organizationId}`);
    logger.logMessage(`📊 LRU Eviction: disabled (serverless optimized)`);
    logger.logMessage(`📊 Eviction batch size: ${config.evictionBatchSize}`);
  }

  /** Log cache initialization results and metrics
 */
  static logInitializationResults(
    logger: ISessionLogger,
    metrics: ReturnType<typeof VectorCacheStatisticsService.generateInitializationMetrics>
  ): void {
    logger.logMessage(`✅ Cache initialized successfully`);
    logger.logMessage(`📊 Vectors loaded: ${metrics.vectorsLoaded}`);
    logger.logMessage(`📊 Vectors evicted: ${metrics.vectorsEvicted}`);
    logger.logMessage(`📊 Memory usage: ${metrics.memoryUsageKB} KB (${metrics.memoryUtilization.toFixed(1)}% of limit)`);
    logger.logMessage(`📊 Average vector size: ${metrics.averageVectorSize} dimensions`);
    logger.logMessage(`📊 Data Source: In-memory vector cache (no database queries)`);
    
    // Cast metrics to compatible type for logger
    logger.logMetrics('vector-cache-init', {
      duration: metrics.initializationTimeMs,
      customMetrics: metrics as unknown as Record<string, number>
    });
  }

  /**
   * Log search operation start with parameters
   * 
   * AI INSTRUCTIONS:
   * - Log search parameters and configuration
   * - Provide visibility into search operations
   * - Support debugging search performance issues
   */
  static logSearchStart(
    logger: ISessionLogger,
    cacheSize: number,
    options: VectorSearchOptions,
    queryDimensions: number
  ): void {
    const threshold = options.threshold || VectorSimilarityService.DEFAULT_THRESHOLD;
    const limit = options.limit || VectorSimilarityService.DEFAULT_LIMIT;

    logger.logMessage(`🔍 Searching ${cacheSize} cached vectors`);
    logger.logMessage(`📊 Data Source: In-memory vector cache (cache hit)`);
    logger.logMessage(`Search threshold: ${threshold}, limit: ${limit}`);
    logger.logMessage(`🔍 Query embedding dimensions: ${queryDimensions}`);
    
    if (options.categoryFilter) {
      logger.logMessage(`📂 Category filter: ${options.categoryFilter}`);
    }
    
    if (options.sourceTypeFilter) {
      logger.logMessage(`📄 Source type filter: ${options.sourceTypeFilter}`);
    }
  }

  /** Log search results and performance metrics
 */
  static logSearchResults(
    logger: ISessionLogger,
    options: VectorSearchOptions,
    results: VectorSearchResult[],
    debugInfo: Array<{ id: string; similarity: number; passedThreshold: boolean }>,
    timeMs: number,
    stats: VectorCacheStats
  ): void {
    const threshold = options.threshold || VectorSimilarityService.DEFAULT_THRESHOLD;

    logger.logMessage(`🔍 Total similarities calculated: ${debugInfo.length}`);
    
    // Log top similarities for debugging
    if (debugInfo.length > 0) {
      debugInfo
        .slice(0, 5)
        .forEach((item, index) => {
          const passedThreshold = item.passedThreshold ? '✅' : '❌';
          logger.logMessage(`  ${index + 1}. ${item.id}: ${(item.similarity * 100).toFixed(1)}% ${passedThreshold}`);
        });
    }

    logger.logMessage(`✅ Search completed in ${timeMs}ms`);
    logger.logMessage(`Found ${results.length} relevant items`);
    logger.logMessage(`📊 Cache Hit Rate: ${(stats.cacheHitRate * 100).toFixed(1)}%`);
    logger.logMessage(`📊 Memory Usage: ${stats.memoryUsageKB} KB (${stats.memoryUtilization.toFixed(1)}% of limit)`);

    if (results.length > 0) {
      logger.logMessage(`Best match similarity: ${results[0].similarity.toFixed(3)}`);
      logger.logMessage(`Worst match similarity: ${results[results.length - 1].similarity.toFixed(3)}`);
    } else {
      logger.logMessage(`⚠️ No matches found above threshold ${threshold}`);
    }
  }

  /** Log search performance metrics
 */
  static logSearchMetrics(
    logger: ISessionLogger,
    timeMs: number,
    cacheSize: number,
    resultsFound: number,
    cacheHitRate: number,
    memoryUtilization: number,
    searchThreshold: number
  ): void {
    const searchMetrics = VectorCacheStatisticsService.generateSearchMetrics(
      timeMs,
      cacheSize,
      resultsFound,
      cacheHitRate,
      memoryUtilization,
      searchThreshold
    );

    logger.logMetrics('cached-vector-search', {
      duration: timeMs,
      customMetrics: searchMetrics as unknown as Record<string, number>
    });
  }

  /** Log cache state and health information
 */
  static logCacheState(
    logger: ISessionLogger,
    stats: VectorCacheStats,
    isInitialized: boolean,
    cacheSize: number
  ): void {
    logger.logMessage(`📊 Cache State Summary:`);
    logger.logMessage(`  - Initialized: ${isInitialized ? '✅' : '❌'}`);
    logger.logMessage(`  - Total vectors: ${cacheSize}`);
    logger.logMessage(`  - Memory usage: ${stats.memoryUsageKB} KB (${stats.memoryUtilization.toFixed(1)}%)`);
    logger.logMessage(`  - Cache hit rate: ${(stats.cacheHitRate * 100).toFixed(1)}%`);
    logger.logMessage(`  - Searches performed: ${stats.searchesPerformed}`);
    logger.logMessage(`  - Evictions performed: ${stats.evictionsPerformed}`);
    logger.logMessage(`  - Last updated: ${stats.lastUpdated.toISOString()}`);
  }

  /**
   * Log cache clearing operation
   * 
   * AI INSTRUCTIONS:
   * - Log cache clearing for audit trail
   * - Provide visibility into cache lifecycle
   * - Support troubleshooting cache operations
   */
  static logCacheClear(
    logger: ISessionLogger,
    previousSize: number,
    organizationId: string,
    chatbotConfigId: string
  ): void {
    logger.logMessage(`🗑️ Clearing vector cache`);
    logger.logMessage(`📊 Previous cache size: ${previousSize} vectors`);
    logger.logMessage(`📊 Organization: ${organizationId}`);
    logger.logMessage(`📊 Chatbot Config: ${chatbotConfigId}`);
    logger.logMessage(`✅ Cache cleared successfully`);
  }

  /**
   * Log error conditions with context
   * 
   * AI INSTRUCTIONS:
   * - Log errors with comprehensive context
   * - Support troubleshooting and debugging
   * - Provide actionable error information
   */
  static logError(
    logger: ISessionLogger,
    operation: string,
    error: Error,
    context: Record<string, any>
  ): void {
    logger.logMessage(`❌ Vector cache error in ${operation}`);
    logger.logMessage(`Error: ${error.message}`);
    
    Object.entries(context).forEach(([key, value]) => {
      logger.logMessage(`  ${key}: ${JSON.stringify(value)}`);
    });
    
    if (error.stack) {
      logger.logMessage(`Stack trace: ${error.stack}`);
    }
  }

  /**
   * Log cache configuration for debugging
   * 
   * AI INSTRUCTIONS:
   * - Log current cache configuration
   * - Support configuration troubleshooting
   * - Provide visibility into cache settings
   */
  static logConfiguration(
    logger: ISessionLogger,
    config: Required<VectorCacheConfig>,
    organizationId: string,
    chatbotConfigId: string
  ): void {
    logger.logMessage(`⚙️ Vector Cache Configuration:`);
    logger.logMessage(`  - Organization: ${organizationId}`);
    logger.logMessage(`  - Chatbot Config: ${chatbotConfigId}`);
    logger.logMessage(`  - Max Memory: ${config.maxMemoryKB} KB`);
    logger.logMessage(`  - Max Vectors: ${config.maxVectors}`);
    logger.logMessage(`  - LRU Eviction: disabled (serverless optimized)`);
    logger.logMessage(`  - Eviction Batch Size: ${config.evictionBatchSize}`);
  }
} 