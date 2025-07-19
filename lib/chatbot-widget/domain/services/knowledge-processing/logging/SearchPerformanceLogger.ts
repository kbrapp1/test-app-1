/**
 * Search Performance Logger
 * 
 * Domain service responsible for logging search performance metrics
 * following DDD principles for the chatbot domain.
 */

import { ISessionLogger } from '../../interfaces/IChatbotLoggingService';
import { SearchExecutionMetrics } from '../KnowledgeSearchExecutionService';
import { VectorKnowledgeCache } from '../../VectorKnowledgeCache';

export interface SearchMetricsContext {
  organizationId: string;
  chatbotConfigId: string;
  sessionId?: string;
  userQuery: string;
}

export class SearchPerformanceLogger {
  
  /**
   * Log comprehensive search performance metrics
   * 
   * Includes execution timing, vector cache statistics, and result quality
   */
  static logSearchMetrics(
    logger: ISessionLogger,
    metrics: SearchExecutionMetrics,
    vectorCache: VectorKnowledgeCache,
    _context: SearchMetricsContext
  ): void {
    // Get current vector cache statistics
    const vectorCacheStats = vectorCache.getCacheStats();

    // Log performance summary
    logger.logRaw('');
    logger.logMessage('📊 Knowledge Search Performance Metrics:');
    logger.logMessage(`  Query Processing: ${metrics.embeddingTimeMs}ms`);
    logger.logMessage(`  Vector Search: ${metrics.searchTimeMs}ms`);
    logger.logMessage(`  Total Time: ${metrics.totalTimeMs}ms`);
    logger.logMessage(`  Results Found: ${metrics.resultsFound}`);
    logger.logMessage(`  Query Length: ${metrics.queryLength} characters`);
    logger.logMessage(`  Vector Dimensions: ${metrics.vectorDimensions}`);

    // Log vector cache performance
    logger.logMessage('📊 Vector Cache Performance:');
    logger.logMessage(`  Cache Size: ${vectorCacheStats.totalVectors} vectors`);
    logger.logMessage(`  Memory Usage: ${vectorCacheStats.memoryUsageKB} KB`);
    logger.logMessage(`  Cache Hit Rate: ${(vectorCacheStats.cacheHitRate * 100).toFixed(1)}%`);
    logger.logMessage(`  Cache Efficiency: ${vectorCacheStats.totalVectors > 0 ? 'Optimal' : 'Empty Cache'}`);

    // Log structured metrics for monitoring
    logger.logMetrics('knowledge-search-performance', {
      duration: metrics.totalTimeMs,
      customMetrics: {
        embeddingTimeMs: metrics.embeddingTimeMs,
        searchTimeMs: metrics.searchTimeMs,
        resultsFound: metrics.resultsFound,
        queryLength: metrics.queryLength,
        vectorDimensions: metrics.vectorDimensions,
        cacheSize: vectorCacheStats.totalVectors,
        memoryUsageKB: vectorCacheStats.memoryUsageKB,
        cacheHitRate: Math.round(vectorCacheStats.cacheHitRate * 100)
      }
    });

    logger.logRaw('');
  }

  /**
   * Log search result quality metrics
   */
  static logResultQualityMetrics(
    logger: ISessionLogger,
    results: Array<{ similarity: number }>,
    threshold: number
  ): void {
    if (results.length === 0) {
      logger.logMessage('📊 Result Quality: No results found above threshold');
      return;
    }

    const similarities = results.map(r => r.similarity);
    const avgSimilarity = similarities.reduce((sum, sim) => sum + sim, 0) / similarities.length;
    const maxSimilarity = Math.max(...similarities);
    const minSimilarity = Math.min(...similarities);

    logger.logMessage('📊 Result Quality Metrics:');
    logger.logMessage(`  Average Similarity: ${avgSimilarity.toFixed(3)}`);
    logger.logMessage(`  Best Match: ${maxSimilarity.toFixed(3)}`);
    logger.logMessage(`  Worst Match: ${minSimilarity.toFixed(3)}`);
    logger.logMessage(`  Threshold Used: ${threshold}`);
    logger.logMessage(`  Results Count: ${results.length}`);
  }

  /**
   * Log detailed search metrics (legacy signature for backward compatibility)
   */
  static logSearchMetricsLegacy(
    logger: ISessionLogger,
    timeMs: number,
    cacheSize: number,
    resultCount: number,
    cacheHitRate: number,
    memoryUtilization: number,
    threshold: number
  ): void {
    logger.logMessage('📊 Search Performance Metrics:');
    logger.logMessage(`  Search Time: ${timeMs}ms`);
    logger.logMessage(`  Cache Size: ${cacheSize} vectors`);
    logger.logMessage(`  Results Found: ${resultCount}`);
    logger.logMessage(`  Cache Hit Rate: ${(cacheHitRate * 100).toFixed(1)}%`);
    logger.logMessage(`  Memory Utilization: ${(memoryUtilization * 100).toFixed(1)}%`);
    logger.logMessage(`  Threshold Used: ${threshold}`);

    // Log structured metrics
    logger.logMetrics('vector-search', {
      duration: timeMs,
      customMetrics: {
        cacheSize,
        resultCount,
        cacheHitRate: Math.round(cacheHitRate * 100),
        memoryUtilization: Math.round(memoryUtilization * 100),
        threshold: Math.round(threshold * 1000)
      }
    });
  }

  /**
   * Calculate and log performance thresholds
   */
  static validatePerformanceThresholds(
    logger: ISessionLogger,
    metrics: SearchExecutionMetrics,
    maxAllowedTimeMs: number = 5000
  ): boolean {
    const isWithinThreshold = metrics.totalTimeMs <= maxAllowedTimeMs;
    
    if (!isWithinThreshold) {
      logger.logMessage(`⚠️ Performance Alert: Search time ${metrics.totalTimeMs}ms exceeded threshold ${maxAllowedTimeMs}ms`);
      logger.logMessage(`  Embedding time: ${metrics.embeddingTimeMs}ms`);
      logger.logMessage(`  Search time: ${metrics.searchTimeMs}ms`);
    } else {
      logger.logMessage(`✅ Performance: Search completed within ${maxAllowedTimeMs}ms threshold`);
    }

    return isWithinThreshold;
  }

  /**
   * Log search operation summary
   */
  static logSearchSummary(
    logger: ISessionLogger,
    query: string,
    resultsFound: number,
    totalTimeMs: number,
    bestSimilarity?: number
  ): void {
    logger.logMessage('🔍 Search Operation Summary:');
    logger.logMessage(`  Query: "${query}"`);
    logger.logMessage(`  Results: ${resultsFound} found`);
    logger.logMessage(`  Duration: ${totalTimeMs}ms`);
    
    if (bestSimilarity !== undefined) {
      logger.logMessage(`  Best Match: ${bestSimilarity.toFixed(3)} similarity`);
    }
    
    if (resultsFound === 0) {
      logger.logMessage('  Recommendation: Consider lowering threshold or expanding knowledge base');
    }
  }
}