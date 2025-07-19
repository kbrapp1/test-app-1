/**
 * Vector Search Operation Logger
 * 
 * Domain service responsible for logging vector search operation lifecycle
 * following DDD principles for the chatbot domain.
 */

import { ISessionLogger } from '../../interfaces/IChatbotLoggingService';
import { VectorSearchOptions, VectorCacheStats } from '../../../types/VectorCacheTypes';
import { VectorSimilarityService } from '../../VectorSimilarityService';

export class VectorSearchOperationLogger {
  
  /**
   * Log vector search operation start with parameters
   * 
   * Provides visibility into search operations and configuration
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
      logger.logMessage(`Category filter: ${options.categoryFilter}`);
    }
    
    if (options.sourceTypeFilter) {
      logger.logMessage(`Source type filter: ${options.sourceTypeFilter}`);
    }
  }

  /**
   * Log search results with detailed information
   */
  static logSearchResults(
    logger: ISessionLogger,
    options: VectorSearchOptions,
    results: Array<{ item: unknown; similarity: number }>,
    debugInfo: Array<{ similarity: number; id: string }>,
    timeMs: number,
    stats: VectorCacheStats
  ): void {
    const threshold = options.threshold || 0.15;
    const _limit = options.limit || 5;

    logger.logMessage(`✅ Vector search completed in ${timeMs}ms`);
    logger.logMessage(`Found ${results.length} results above threshold ${threshold}`);
    logger.logMessage(`Cache hit rate: ${(stats.cacheHitRate * 100).toFixed(1)}%`);

    if (results.length > 0) {
      logger.logMessage(`Best similarity: ${results[0].similarity.toFixed(3)}`);
      logger.logMessage(`Worst similarity: ${results[results.length - 1].similarity.toFixed(3)}`);
      
      logger.logMessage('📋 Search Results:');
      results.slice(0, 3).forEach((result, index) => {
        logger.logMessage(`  ${index + 1}. Similarity: ${result.similarity.toFixed(3)}`);
      });
    } else {
      logger.logMessage('⚠️ No results found above threshold');
    }
  }

  /**
   * Log search operation parameters for debugging
   */
  static logSearchParameters(
    logger: ISessionLogger,
    options: VectorSearchOptions,
    queryInfo: {
      dimensions: number;
      queryLength: number;
      normalized?: boolean;
    }
  ): void {
    logger.logMessage('🔍 Search Parameters:');
    logger.logMessage(`  Threshold: ${options.threshold || VectorSimilarityService.DEFAULT_THRESHOLD}`);
    logger.logMessage(`  Limit: ${options.limit || VectorSimilarityService.DEFAULT_LIMIT}`);
    logger.logMessage(`  Query Dimensions: ${queryInfo.dimensions}`);
    logger.logMessage(`  Query Length: ${queryInfo.queryLength} chars`);
    
    if (queryInfo.normalized !== undefined) {
      logger.logMessage(`  Vector Normalized: ${queryInfo.normalized}`);
    }
    
    if (options.categoryFilter) {
      logger.logMessage(`  Category Filter: ${options.categoryFilter}`);
    }
    
    if (options.sourceTypeFilter) {
      logger.logMessage(`  Source Filter: ${options.sourceTypeFilter}`);
    }
  }

  /**
   * Log search result analysis
   */
  static logResultAnalysis(
    logger: ISessionLogger,
    results: Array<{ similarity: number; item: { category?: string; source?: string } }>,
    threshold: number
  ): void {
    if (results.length === 0) {
      logger.logMessage('📊 Result Analysis: No matches found');
      logger.logMessage(`  Recommendation: Lower threshold (current: ${threshold}) or expand knowledge base`);
      return;
    }

    // Analyze similarity distribution
    const similarities = results.map(r => r.similarity);
    const avgSimilarity = similarities.reduce((sum, sim) => sum + sim, 0) / similarities.length;
    const highQualityResults = results.filter(r => r.similarity > 0.8).length;
    const mediumQualityResults = results.filter(r => r.similarity > 0.5 && r.similarity <= 0.8).length;
    const lowQualityResults = results.filter(r => r.similarity <= 0.5).length;

    logger.logMessage('📊 Result Analysis:');
    logger.logMessage(`  Average Similarity: ${avgSimilarity.toFixed(3)}`);
    logger.logMessage(`  High Quality (>0.8): ${highQualityResults}`);
    logger.logMessage(`  Medium Quality (0.5-0.8): ${mediumQualityResults}`);
    logger.logMessage(`  Low Quality (≤0.5): ${lowQualityResults}`);

    // Analyze result diversity
    const categories = new Set(results.map(r => r.item.category).filter(Boolean));
    const sources = new Set(results.map(r => r.item.source).filter(Boolean));
    
    if (categories.size > 0) {
      logger.logMessage(`  Categories Found: ${categories.size} (${Array.from(categories).join(', ')})`);
    }
    
    if (sources.size > 0) {
      logger.logMessage(`  Sources Found: ${sources.size} (${Array.from(sources).join(', ')})`);
    }
  }

  /**
   * Log search performance warnings
   */
  static logPerformanceWarnings(
    logger: ISessionLogger,
    metrics: {
      searchTimeMs: number;
      cacheSize: number;
      resultCount: number;
      memoryUsage: number;
    }
  ): void {
    const warnings: string[] = [];

    if (metrics.searchTimeMs > 1000) {
      warnings.push(`Slow search: ${metrics.searchTimeMs}ms (consider cache optimization)`);
    }

    if (metrics.cacheSize > 10000 && metrics.searchTimeMs > 500) {
      warnings.push(`Large cache with slow search: ${metrics.cacheSize} vectors in ${metrics.searchTimeMs}ms`);
    }

    if (metrics.resultCount === 0) {
      warnings.push('No results found (consider lowering threshold or expanding knowledge base)');
    }

    if (metrics.memoryUsage > 100000) { // 100MB
      warnings.push(`High memory usage: ${(metrics.memoryUsage / 1024).toFixed(1)} MB`);
    }

    if (warnings.length > 0) {
      logger.logMessage('⚠️ Performance Warnings:');
      warnings.forEach(warning => {
        logger.logMessage(`  ${warning}`);
      });
    }
  }

  /**
   * Log search error with detailed context
   */
  static logSearchError(
    logger: ISessionLogger,
    error: Error,
    context: {
      queryDimensions: number;
      cacheSize: number;
      options: VectorSearchOptions;
      searchTimeMs?: number;
    }
  ): void {
    logger.logMessage('❌ Vector Search Error:');
    logger.logMessage(`  Error: ${error.message}`);
    logger.logMessage(`  Query Dimensions: ${context.queryDimensions}`);
    logger.logMessage(`  Cache Size: ${context.cacheSize}`);
    logger.logMessage(`  Threshold: ${context.options.threshold || 'default'}`);
    logger.logMessage(`  Limit: ${context.options.limit || 'default'}`);
    
    if (context.searchTimeMs) {
      logger.logMessage(`  Time Before Error: ${context.searchTimeMs}ms`);
    }
    
    logger.logError(error);
  }
}