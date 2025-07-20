/**
 * Search Operation Logger
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Handle specialized logging for search operations
 * - Domain service focused on search-specific logging concerns
 * - Keep business logic pure, minimal external dependencies
 * - Never exceed 250 lines per @golden-rule
 */

import { ISessionLogger } from '../interfaces/IChatbotLoggingService';
import { IEmbeddingService } from '../interfaces/IEmbeddingService';
import { VectorKnowledgeCache } from '../VectorKnowledgeCache';
import { KnowledgeRetrievalContext, KnowledgeItem } from '../interfaces/IKnowledgeRetrievalService';

/**
 * Specialized service for logging search operations with rich context
 * 
 * AI INSTRUCTIONS:
 * - Handles all search-specific logging with proper formatting
 * - Integrates with embedding and vector cache statistics
 * - Provides structured logging for search lifecycle events
 * - Security: Logs organizationId for audit trail
 */
export class SearchOperationLogger {
  private static readonly DEFAULT_MIN_RELEVANCE = 0.15;
  private static readonly DEFAULT_MAX_RESULTS = 5;

  constructor(
    private readonly organizationId: string,
    private readonly chatbotConfigId: string
  ) {}

  /**
   * Log embedding completion with cache statistics
   */
  logEmbeddingCompletion(
    logger: ISessionLogger,
    embeddingService: IEmbeddingService,
    embedding: number[],
    timeMs: number
  ): void {
    // Use synchronous logging for proper order
    const logMessage = (msg: string) => {
      if (typeof (logger as { logMessageSync?: (message: string) => void }).logMessageSync === 'function') {
        (logger as { logMessageSync: (message: string) => void }).logMessageSync(msg);
      } else {
        logger.logMessage(msg);
      }
    };

    logMessage('✅ Embeddings generated successfully');
    logMessage(`Vector dimensions: ${embedding.length}`);
    logMessage(`Embedding time: ${timeMs}ms`);

    // Log embedding cache statistics
    const embeddingCacheStats = embeddingService.getCacheStats();
    logger.logMessage(`📊 Embedding Cache: ${embeddingCacheStats.size}/${embeddingCacheStats.maxSize} entries (${embeddingCacheStats.utilizationPercent}% full)`);
  }

  /**
   * Log search parameters and cache statistics
   */
  logSearchParameters(
    logger: ISessionLogger,
    vectorCache: VectorKnowledgeCache,
    context: KnowledgeRetrievalContext
  ): void {
    logger.logMessage(`Organization: ${this.organizationId}`);
    logger.logMessage(`Chatbot Config: ${this.chatbotConfigId}`);
    logger.logMessage(`Search threshold: ${context.minRelevanceScore || SearchOperationLogger.DEFAULT_MIN_RELEVANCE}`);
    logger.logMessage(`Result limit: ${context.maxResults || SearchOperationLogger.DEFAULT_MAX_RESULTS}`);

    // Log vector cache statistics
    const vectorCacheStats = vectorCache.getCacheStats();
    logger.logMessage(`📊 Vector Cache: ${vectorCacheStats.totalVectors} vectors (${vectorCacheStats.memoryUsageKB} KB)`);
  }

  /**
   * Log search completion with results summary
   */
  logSearchCompletion(
    logger: ISessionLogger,
    vectorCache: VectorKnowledgeCache,
    results: Array<{ item: KnowledgeItem; similarity: number }>,
    searchTimeMs: number,
    totalTimeMs: number
  ): void {
    const vectorCacheStats = vectorCache.getCacheStats();
    
    logger.logMessage(`✅ Search completed in ${searchTimeMs}ms (total: ${totalTimeMs}ms)`);
    logger.logMessage(`Found ${results.length} relevant items`);
    logger.logMessage(`📊 Data Source: In-memory vector cache (${(vectorCacheStats.cacheHitRate * 100).toFixed(1)}% cache efficiency)`);
    
    if (results.length > 0) {
      this.logSearchResults(logger, results);
    } else {
      logger.logMessage('⚠️ No relevant knowledge items found above threshold');
    }
  }

  /**
   * Log query details for search operation
   */
  logQueryDetails(logger: ISessionLogger, query: string): void {
    logger.logRaw(`User query: "${query}"`);
    logger.logMessage(`Query length: ${query.length} characters`);
  }

  /**
   * Log detailed search results
   */
  private logSearchResults(
    logger: ISessionLogger,
    results: Array<{ item: KnowledgeItem; similarity: number }>
  ): void {
    logger.logMessage(`Best match similarity: ${results[0].similarity.toFixed(3)}`);
    logger.logMessage(`Worst match similarity: ${results[results.length - 1].similarity.toFixed(3)}`);
    
    // Log search result details
    logger.logRaw('');
    logger.logMessage('📋 Search Results Summary:');
    results.forEach((result, index) => {
      logger.logMessage(`  ${index + 1}. "${result.item.title}" (similarity: ${result.similarity.toFixed(3)})`);
      logger.logMessage(`     Category: ${result.item.category || 'none'}, Source: ${result.item.source}`);
    });
  }
}