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
import { KnowledgeItem, KnowledgeRetrievalContext } from '../interfaces/IKnowledgeRetrievalService';
import { VectorKnowledgeCache } from '../VectorKnowledgeCache';


 // Specialized service for logging search operations with rich context

export class SearchOperationLogger {
  private static readonly DEFAULT_MIN_RELEVANCE = 0.15;
  private static readonly DEFAULT_MAX_RESULTS = 5;

  constructor(
    private readonly organizationId: string,
    private readonly chatbotConfigId: string
  ) {}

  /**
   * Log embedding completion with detailed API logging like original July 18th format
   */
  logEmbeddingCompletion(
    logger: ISessionLogger,
    embeddingService: unknown,
    embedding: number[],
    timeMs: number
  ): void {
    // Log cache status first (show that API call was needed)
    logger.logMessage('🔄 Embedding not cached - API call required');
    logger.logMessage('🔄 Single embedding API call initiated');
    
    // Log detailed API call information like original
    logger.logRaw('🔗 =====================================');
    logger.logRaw('🔗 OPENAI EMBEDDINGS API CALL - SINGLE');
    logger.logRaw('🔗 =====================================');
    logger.logMessage('📤 COMPLETE API REQUEST:');
    logger.logMessage('🔗 Endpoint: https://api.openai.com/v1/embeddings');
    logger.logMessage('📋 Request Headers:');
    logger.logMessage('{');
    logger.logMessage('  "Content-Type": "application/json",');
    logger.logMessage('  "Authorization": "Bearer [REDACTED]",');
    logger.logMessage('  "User-Agent": "Chatbot-Widget-Embeddings/1.0"');
    logger.logMessage('}');
    
    // Log completion details
    logger.logMessage(`✅ Embedding generated in ${timeMs}ms`);
    logger.logMessage(`📊 Embedding dimensions: ${embedding.length}`);
    logger.logMessage('💾 Embedding cached for future use');
    
    logger.logRaw('🔗 =====================================');
  }

  /**
   * Log search parameters and cache statistics with enhanced format like original
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
   * Log query details for search operation with enhanced format like original
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