/**
 * Search Execution Coordinator Service
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Coordinate search execution workflow
 * - Domain service focused on orchestrating search operations
 * - Keep business logic pure, minimal external dependencies
 * - Never exceed 250 lines per @golden-rule
 * - Delegates to specialized services for validation, performance, and logging
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
  EmbeddingGenerationError,
  VectorSearchError
} from '../../errors/ChatbotWidgetDomainErrors';
import { SearchValidationService } from './SearchValidationService';
import { SearchPerformanceTrackingService, SearchExecutionMetrics, PerformanceSnapshot } from './SearchPerformanceTrackingService';
import { SearchOperationLogger } from './SearchOperationLogger';

/**
 * Coordinator service for executing knowledge search operations
 * 
 * AI INSTRUCTIONS:
 * - Orchestrates complete search workflow using specialized services
 * - Handles core search execution: validation -> embedding -> search -> results
 * - Delegates specialized concerns to focused domain services
 * - Security: Preserves organizationId throughout entire operation
 */
export class SearchExecutionCoordinatorService {
  private static readonly DEFAULT_MIN_RELEVANCE = 0.15;
  private static readonly DEFAULT_MAX_RESULTS = 5;

  private readonly validationService: SearchValidationService;
  private readonly performanceService: SearchPerformanceTrackingService;
  private readonly operationLogger: SearchOperationLogger;

  constructor(
    private readonly embeddingService: IEmbeddingService,
    private readonly vectorCache: VectorKnowledgeCache,
    private readonly organizationId: string,
    private readonly chatbotConfigId: string
  ) {
    // Initialize specialized services with security context
    this.validationService = new SearchValidationService(organizationId, chatbotConfigId);
    this.performanceService = new SearchPerformanceTrackingService(organizationId, chatbotConfigId);
    this.operationLogger = new SearchOperationLogger(organizationId, chatbotConfigId);
  }

  /**
   * Execute semantic search with full performance tracking
   * 
   * AI INSTRUCTIONS:
   * - Coordinates complete search workflow using specialized services
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
    // Validate search parameters using specialized service
    this.validationService.validateSearchContext(context);

    // Initialize performance tracking
    const performanceSnapshot = this.performanceService.createPerformanceSnapshot();

    // Configure embedding service logging
    this.embeddingService.setLogContext({
      logEntry: (message: string) => logger.logMessage(message)
    });

    // Generate query embedding
    logger.logStep('3.1: Generate embeddings for user query');
    const { embedding, timeMs: embeddingTimeMs } = await this.generateQueryEmbedding(
      context.userQuery,
      logger,
      performanceSnapshot
    );

    // Execute vector search
    logger.logStep('3.2: Search knowledge base using in-memory vector cache');
    const { results, timeMs: searchTimeMs } = await this.executeVectorSearch(
      embedding,
      context,
      logger,
      performanceSnapshot
    );

    const totalTimeMs = this.performanceService.calculateTotalTime(performanceSnapshot);

    // Check performance thresholds using specialized service
    this.performanceService.validatePerformanceThresholds(
      totalTimeMs, 
      embeddingTimeMs, 
      searchTimeMs, 
      context.userQuery
    );

    // Log search completion using specialized logger
    this.operationLogger.logSearchCompletion(
      logger, 
      this.vectorCache, 
      results, 
      searchTimeMs, 
      totalTimeMs
    );

    // Create metrics and results
    const metrics = this.performanceService.createMetrics(
      performanceSnapshot,
      embeddingTimeMs,
      searchTimeMs,
      results.length,
      context.userQuery.length,
      embedding.length
    );

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
    logger: ISessionLogger,
    performanceSnapshot: PerformanceSnapshot
  ): Promise<{ embedding: number[]; timeMs: number }> {
    this.operationLogger.logQueryDetails(logger, query);

    const updatedSnapshot = this.performanceService.recordEmbeddingStart(performanceSnapshot);
    
    try {
      const embedding = await this.embeddingService.generateEmbedding(query);
      const timeMs = this.performanceService.calculateEmbeddingTime(updatedSnapshot);
      
      // Log embedding completion using specialized logger
      this.operationLogger.logEmbeddingCompletion(logger, this.embeddingService, embedding, timeMs);
      
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
    logger: ISessionLogger,
    performanceSnapshot: PerformanceSnapshot
  ): Promise<{ results: Array<{ item: KnowledgeItem; similarity: number }>; timeMs: number }> {
    // Log search parameters using specialized logger
    this.operationLogger.logSearchParameters(logger, this.vectorCache, context);

    const updatedSnapshot = this.performanceService.recordSearchStart(performanceSnapshot);
    
    try {
      const searchResults = await this.vectorCache.searchVectors(
        queryEmbedding,
        {
          threshold: context.minRelevanceScore || SearchExecutionCoordinatorService.DEFAULT_MIN_RELEVANCE,
          limit: context.maxResults || SearchExecutionCoordinatorService.DEFAULT_MAX_RESULTS
        },
        context.sharedLogFile!
      );
      
      const timeMs = this.performanceService.calculateSearchTime(updatedSnapshot);
      
      return { results: searchResults, timeMs };
    } catch (error) {
      throw new VectorSearchError('in_memory_cache', {
        query: context.userQuery,
        threshold: context.minRelevanceScore || SearchExecutionCoordinatorService.DEFAULT_MIN_RELEVANCE,
        limit: context.maxResults || SearchExecutionCoordinatorService.DEFAULT_MAX_RESULTS,
        error: error instanceof Error ? error.message : String(error),
        organizationId: this.organizationId,
        chatbotConfigId: this.chatbotConfigId
      });
    }
  }
}