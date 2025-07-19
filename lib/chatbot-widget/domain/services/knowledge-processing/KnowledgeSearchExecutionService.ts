/**
 * Knowledge Search Execution Service
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Execute semantic search operations with vector embeddings
 * - Domain service focused on search orchestration and performance tracking
 * - Keep business logic pure, minimal external dependencies
 * - Never exceed 250 lines per @golden-rule
 * - Handle search validation, embedding generation, and result processing
 * - Use existing VectorSimilarityService and logging infrastructure
 */

import { IEmbeddingService } from '../interfaces/IEmbeddingService';
import { ISessionLogger } from '../interfaces/IChatbotLoggingService';
import { VectorKnowledgeCache } from '../VectorKnowledgeCache';
import { 
  KnowledgeRetrievalContext, 
  KnowledgeSearchResult,
  KnowledgeItem 
} from '../interfaces/IKnowledgeRetrievalService';
import { 
  BusinessRuleViolationError,
  EmbeddingGenerationError,
  VectorSearchError,
  PerformanceThresholdError
} from '../../errors/ChatbotWidgetDomainErrors';

export interface SearchExecutionMetrics {
  embeddingTimeMs: number;
  searchTimeMs: number;
  totalTimeMs: number;
  resultsFound: number;
  queryLength: number;
  vectorDimensions: number;
}

/**
 * Specialized service for executing knowledge search operations
 * 
 * AI INSTRUCTIONS:
 * - Handles core search workflow: validation -> embedding -> search -> results
 * - Delegates to existing services for vector operations and logging
 * - Tracks performance metrics and enforces business rules
 * - Provides clean interface for search execution without cache management
 */
export class KnowledgeSearchExecutionService {
  private static readonly PERFORMANCE_THRESHOLD_MS = 5000;
  private static readonly DEFAULT_MIN_RELEVANCE = 0.15;
  private static readonly DEFAULT_MAX_RESULTS = 5;

  constructor(
    private readonly embeddingService: IEmbeddingService,
    private readonly vectorCache: VectorKnowledgeCache,
    private readonly organizationId: string,
    private readonly chatbotConfigId: string
  ) {}

  /**
   * Execute semantic search with full performance tracking
   * 
   * AI INSTRUCTIONS:
   * - Validates search context and parameters
   * - Generates embeddings with error handling
   * - Executes vector search using cache
   * - Tracks performance and enforces thresholds
   * - Returns structured search results
   */
  async executeSearch(
    context: KnowledgeRetrievalContext,
    logger: ISessionLogger
  ): Promise<{ result: KnowledgeSearchResult; metrics: SearchExecutionMetrics }> {
    const startTime = Date.now();
    
    // Validate search parameters
    this.validateSearchContext(context);

    // Configure embedding service logging
    this.embeddingService.setLogContext({
      logEntry: (message: string) => logger.logMessage(message)
    });

    // Generate query embedding
    logger.logStep('3.1: Generate embeddings for user query');
    const { embedding, timeMs: embeddingTimeMs } = await this.generateQueryEmbedding(
      context.userQuery,
      logger
    );

    // Execute vector search
    logger.logStep('3.2: Search knowledge base using in-memory vector cache');
    const { results, timeMs: searchTimeMs } = await this.executeVectorSearch(
      embedding,
      context,
      logger
    );

    const totalTimeMs = Date.now() - startTime;

    // Check performance thresholds
    this.validatePerformanceThresholds(totalTimeMs, embeddingTimeMs, searchTimeMs, context.userQuery);

    // Log search completion
    this.logSearchCompletion(logger, results, searchTimeMs, totalTimeMs);

    const metrics: SearchExecutionMetrics = {
      embeddingTimeMs,
      searchTimeMs,
      totalTimeMs,
      resultsFound: results.length,
      queryLength: context.userQuery.length,
      vectorDimensions: embedding.length
    };

    const searchResult: KnowledgeSearchResult = {
      items: results.map(result => ({
        ...result.item,
        relevanceScore: result.similarity
      })),
      totalFound: results.length,
      searchQuery: context.userQuery,
      searchTimeMs: totalTimeMs
    };

    return { result: searchResult, metrics };
  }

  /**
   * Generate embedding for search query with performance tracking
   */
  private async generateQueryEmbedding(
    query: string,
    logger: ISessionLogger
  ): Promise<{ embedding: number[]; timeMs: number }> {
    logger.logRaw(`User query: "${query}"`);
    logger.logMessage(`Query length: ${query.length} characters`);

    const embeddingStartTime = Date.now();
    
    try {
      const embedding = await this.embeddingService.generateEmbedding(query);
      const timeMs = Date.now() - embeddingStartTime;
      
      // Log embedding completion
      this.logEmbeddingCompletion(logger, embedding, timeMs);
      
      return { embedding, timeMs };
    } catch (error) {
      throw new EmbeddingGenerationError('user_query', {
        query,
        error: error instanceof Error ? error.message : String(error),
        organizationId: this.organizationId,
        chatbotConfigId: this.chatbotConfigId
      });
    }
  }

  /**
   * Execute vector search using cache with error handling
   */
  private async executeVectorSearch(
    queryEmbedding: number[],
    context: KnowledgeRetrievalContext,
    logger: ISessionLogger
  ): Promise<{ results: Array<{ item: KnowledgeItem; similarity: number }>; timeMs: number }> {
    // Log search parameters
    this.logSearchParameters(logger, context);

    const searchStartTime = Date.now();
    
    try {
      const searchResults = await this.vectorCache.searchVectors(
        queryEmbedding,
        {
          threshold: context.minRelevanceScore || KnowledgeSearchExecutionService.DEFAULT_MIN_RELEVANCE,
          limit: context.maxResults || KnowledgeSearchExecutionService.DEFAULT_MAX_RESULTS
        },
        context.sharedLogFile!
      );
      
      const timeMs = Date.now() - searchStartTime;
      
      return { results: searchResults, timeMs };
    } catch (error) {
      throw new VectorSearchError('in_memory_cache', {
        query: context.userQuery,
        threshold: context.minRelevanceScore || KnowledgeSearchExecutionService.DEFAULT_MIN_RELEVANCE,
        limit: context.maxResults || KnowledgeSearchExecutionService.DEFAULT_MAX_RESULTS,
        error: error instanceof Error ? error.message : String(error),
        organizationId: this.organizationId,
        chatbotConfigId: this.chatbotConfigId
      });
    }
  }

  /**
   * Validate search context parameters
   */
  private validateSearchContext(context: KnowledgeRetrievalContext): void {
    if (!context.userQuery?.trim()) {
      throw new BusinessRuleViolationError(
        'Query is required for knowledge search',
        { context, organizationId: this.organizationId }
      );
    }

    if (!context.sharedLogFile) {
      throw new BusinessRuleViolationError(
        'SharedLogFile is required for knowledge search operations - all logging must be conversation-specific',
        { context, organizationId: this.organizationId }
      );
    }
  }

  /**
   * Validate performance thresholds and throw error if exceeded
   */
  private validatePerformanceThresholds(
    totalTimeMs: number,
    embeddingTimeMs: number,
    searchTimeMs: number,
    query: string
  ): void {
    if (totalTimeMs > KnowledgeSearchExecutionService.PERFORMANCE_THRESHOLD_MS) {
      throw new PerformanceThresholdError(
        'knowledge_search_duration',
        KnowledgeSearchExecutionService.PERFORMANCE_THRESHOLD_MS,
        totalTimeMs,
        {
          query,
          embeddingTimeMs,
          searchTimeMs,
          organizationId: this.organizationId,
          chatbotConfigId: this.chatbotConfigId
        }
      );
    }
  }

  /**
   * Log embedding completion with cache statistics
   */
  private logEmbeddingCompletion(logger: ISessionLogger, embedding: number[], timeMs: number): void {
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
    const embeddingCacheStats = this.embeddingService.getCacheStats();
    logger.logMessage(`📊 Embedding Cache: ${embeddingCacheStats.size}/${embeddingCacheStats.maxSize} entries (${embeddingCacheStats.utilizationPercent}% full)`);
  }

  /**
   * Log search parameters and cache statistics
   */
  private logSearchParameters(logger: ISessionLogger, context: KnowledgeRetrievalContext): void {
    logger.logMessage(`Organization: ${this.organizationId}`);
    logger.logMessage(`Chatbot Config: ${this.chatbotConfigId}`);
    logger.logMessage(`Search threshold: ${context.minRelevanceScore || KnowledgeSearchExecutionService.DEFAULT_MIN_RELEVANCE}`);
    logger.logMessage(`Result limit: ${context.maxResults || KnowledgeSearchExecutionService.DEFAULT_MAX_RESULTS}`);

    // Log vector cache statistics
    const vectorCacheStats = this.vectorCache.getCacheStats();
    logger.logMessage(`📊 Vector Cache: ${vectorCacheStats.totalVectors} vectors (${vectorCacheStats.memoryUsageKB} KB)`);
  }

  /**
   * Log search completion with results summary
   */
  private logSearchCompletion(
    logger: ISessionLogger,
    results: Array<{ item: KnowledgeItem; similarity: number }>,
    searchTimeMs: number,
    totalTimeMs: number
  ): void {
    const vectorCacheStats = this.vectorCache.getCacheStats();
    
    logger.logMessage(`✅ Search completed in ${searchTimeMs}ms (total: ${totalTimeMs}ms)`);
    logger.logMessage(`Found ${results.length} relevant items`);
    logger.logMessage(`📊 Data Source: In-memory vector cache (${(vectorCacheStats.cacheHitRate * 100).toFixed(1)}% cache efficiency)`);
    
    if (results.length > 0) {
      logger.logMessage(`Best match similarity: ${results[0].similarity.toFixed(3)}`);
      logger.logMessage(`Worst match similarity: ${results[results.length - 1].similarity.toFixed(3)}`);
      
      // Log search result details
      logger.logRaw('');
      logger.logMessage('📋 Search Results Summary:');
      results.forEach((result, index) => {
        logger.logMessage(`  ${index + 1}. "${result.item.title}" (similarity: ${result.similarity.toFixed(3)})`);
        logger.logMessage(`     Category: ${result.item.category || 'none'}, Source: ${result.item.source}`);
      });
    } else {
      logger.logMessage('⚠️ No relevant knowledge items found above threshold');
    }
  }
}