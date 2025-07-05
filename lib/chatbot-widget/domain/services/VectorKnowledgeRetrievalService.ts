import { 
  IKnowledgeRetrievalService, 
  KnowledgeItem, 
  KnowledgeSearchResult, 
  KnowledgeRetrievalContext 
} from './interfaces/IKnowledgeRetrievalService';
import { IVectorKnowledgeRepository } from '../repositories/IVectorKnowledgeRepository';
import { OpenAIEmbeddingService } from '../../infrastructure/providers/openai/services/OpenAIEmbeddingService';
import { BusinessRuleViolationError } from '../errors/ChatbotWidgetDomainErrors';
import { 
  KnowledgeRetrievalError, 
  VectorSearchError, 
  EmbeddingGenerationError,
  KnowledgeCacheError,
  PerformanceThresholdError 
} from '../errors/ChatbotWidgetDomainErrors';
import { IEmbeddingService } from './interfaces/IEmbeddingService';
import { IChatbotLoggingService, ISessionLogger } from './interfaces/IChatbotLoggingService';
import { ChatbotWidgetCompositionRoot } from '../../infrastructure/composition/ChatbotWidgetCompositionRoot';
import { KnowledgeCacheWarmingService, CacheWarmingMetrics } from './KnowledgeCacheWarmingService';
import { KnowledgeManagementService, KnowledgeStatsResult, HealthCheckResult } from './KnowledgeManagementService';
import { VectorKnowledgeCache, VectorCacheStats } from './VectorKnowledgeCache';

/**
 * Vector Knowledge Retrieval Service
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Knowledge search and retrieval with in-memory vector caching
 * - Domain service focused on semantic search operations
 * - Uses VectorKnowledgeCache for fast in-memory similarity search
 * - Delegate cache warming to KnowledgeCacheWarmingService
 * - Delegate management operations to KnowledgeManagementService
 * - Use structured logging for search operations
 * - Keep under 200-250 lines per @golden-rule
 */
export class VectorKnowledgeRetrievalService implements IKnowledgeRetrievalService {
  private readonly loggingService: IChatbotLoggingService;
  private readonly cacheWarmingService: KnowledgeCacheWarmingService;
  private readonly managementService: KnowledgeManagementService;
  private readonly vectorCache: VectorKnowledgeCache;
  
  constructor(
    private readonly vectorRepository: IVectorKnowledgeRepository,
    private readonly embeddingService: OpenAIEmbeddingService,
    private readonly organizationId: string,
    private readonly chatbotConfigId: string
  ) {
    // Initialize centralized logging service
    this.loggingService = ChatbotWidgetCompositionRoot.getLoggingService();
    
    // Initialize vector cache for fast in-memory searches with memory management
    this.vectorCache = new VectorKnowledgeCache(
      this.organizationId,
      this.chatbotConfigId,
      this.loggingService,
      {
        maxMemoryKB: 50 * 1024, // 50MB limit
        maxVectors: 10000, // Maximum 10k vectors
        enableLRUEviction: true, // Enable automatic eviction
        evictionBatchSize: 100 // Evict 100 vectors at a time
      }
    );
    
    // Initialize specialized services
    this.cacheWarmingService = new KnowledgeCacheWarmingService(
      this.vectorRepository,
      this.embeddingService,
      this.organizationId,
      this.chatbotConfigId
    );
    
    this.managementService = new KnowledgeManagementService(
      this.vectorRepository,
      this.organizationId,
      this.chatbotConfigId
    );
  }

  async searchKnowledge(context: KnowledgeRetrievalContext): Promise<KnowledgeSearchResult> {
    const startTime = Date.now();
    
    if (!context.userQuery?.trim()) {
      throw new BusinessRuleViolationError(
        'Query is required for knowledge search',
        { context, organizationId: this.organizationId }
      );
    }

    try {
      // Create session logger with context - use a dummy session ID if not provided
      const sessionId = (context as any).sessionId || 'unknown-session';
      
      // Shared log file is required for all logging operations
      if (!context.sharedLogFile) {
        throw new Error('SharedLogFile is required for knowledge search operations - all logging must be conversation-specific');
      }
      
      const logger = this.loggingService.createSessionLogger(
        sessionId,
        context.sharedLogFile,
        {
          sessionId,
          operation: 'knowledge-search',
          organizationId: this.organizationId
        }
      );

      // Initialize vector cache if not already done
      if (!this.vectorCache.isReady()) {
        await this.initializeVectorCache(context.sharedLogFile, logger);
      }

      // Log the embeddings step
      logger.logSeparator();
      logger.logRaw('');
      logger.logStep('3.1: Generate embeddings for user query');
      logger.logMessage(`User query: "${context.userQuery}"`);
      logger.logMessage(`Query length: ${context.userQuery.length} characters`);

      // Set embedding service log context to capture cache hit/miss info
      this.embeddingService.setLogContext({
        logEntry: (message: string) => logger.logMessage(message)
      });

      const embeddingStartTime = Date.now();
      
      // Generate embedding for search query (with cache logging)
      let queryEmbedding: number[];
      try {
        queryEmbedding = await this.embeddingService.generateEmbedding(context.userQuery);
      } catch (error) {
        // Track embedding generation error
        throw new EmbeddingGenerationError('user_query', {
          query: context.userQuery,
          error: error instanceof Error ? error.message : String(error),
          organizationId: this.organizationId,
          chatbotConfigId: this.chatbotConfigId
        });
      }
      
      const embeddingTimeMs = Date.now() - embeddingStartTime;
      
      logger.logMessage('✅ Embeddings generated successfully');
      logger.logMessage(`Vector dimensions: ${queryEmbedding.length}`);
      logger.logMessage(`Embedding time: ${embeddingTimeMs}ms`);
      
      // Log cache statistics for performance monitoring
      const embeddingCacheStats = this.embeddingService.getCacheStats();
      logger.logMessage(`📊 Embedding Cache: ${embeddingCacheStats.size}/${embeddingCacheStats.maxSize} entries (${embeddingCacheStats.utilizationPercent}% full)`);

      // Log the search step
      logger.logRaw('');
      logger.logStep('3.2: Search knowledge base using in-memory vector cache');
      logger.logMessage(`Organization: ${this.organizationId}`);
      logger.logMessage(`Chatbot Config: ${this.chatbotConfigId}`);
      logger.logMessage(`Search threshold: ${context.minRelevanceScore || 0.15}`);
      logger.logMessage(`Result limit: ${context.maxResults || 5}`);

      // Get vector cache statistics
      const vectorCacheStats = this.vectorCache.getCacheStats();
      logger.logMessage(`📊 Vector Cache: ${vectorCacheStats.totalVectors} vectors (${vectorCacheStats.memoryUsageKB} KB)`);

      const searchStartTime = Date.now();

      // Search knowledge using in-memory vector cache
      let searchResults;
      try {
        searchResults = await this.vectorCache.searchVectors(
          queryEmbedding,
          {
            threshold: context.minRelevanceScore || 0.15,
            limit: context.maxResults || 5
          },
          context.sharedLogFile
        );
      } catch (error) {
        // Track vector search error
        throw new VectorSearchError('in_memory_cache', {
          query: context.userQuery,
          threshold: context.minRelevanceScore || 0.15,
          limit: context.maxResults || 5,
          error: error instanceof Error ? error.message : String(error),
          organizationId: this.organizationId,
          chatbotConfigId: this.chatbotConfigId
        });
      }

      const searchTimeMs = Date.now() - searchStartTime;
      const totalTimeMs = Date.now() - startTime;

      // Track performance threshold violations
      if (totalTimeMs > 5000) { // 5 second threshold
        throw new PerformanceThresholdError('knowledge_search_duration', 5000, totalTimeMs, {
          query: context.userQuery,
          embeddingTimeMs,
          searchTimeMs,
          organizationId: this.organizationId,
          chatbotConfigId: this.chatbotConfigId
        });
      }

      // Log search results with cache information
      logger.logMessage(`✅ Search completed in ${searchTimeMs}ms`);
      logger.logMessage(`Found ${searchResults.length} relevant items`);
      logger.logMessage(`📊 Data Source: In-memory vector cache (${(vectorCacheStats.cacheHitRate * 100).toFixed(1)}% cache efficiency)`);
      
      if (searchResults.length > 0) {
        logger.logMessage(`Best match similarity: ${searchResults[0].similarity.toFixed(3)}`);
        logger.logMessage(`Worst match similarity: ${searchResults[searchResults.length - 1].similarity.toFixed(3)}`);
        
        // Log search result details
        logger.logRaw('');
        logger.logMessage('📋 Search Results Summary:');
        searchResults.forEach((result, index) => {
          logger.logMessage(`  ${index + 1}. "${result.item.title}" (similarity: ${result.similarity.toFixed(3)})`);
          logger.logMessage(`     Category: ${result.item.category || 'none'}, Source: ${result.item.source}`);
        });
      } else {
        logger.logMessage('⚠️ No relevant knowledge items found above threshold');
      }

      // Log performance metrics
      logger.logRaw('');
      logger.logMetrics('knowledge-search', {
        duration: totalTimeMs,
        customMetrics: {
          embeddingTimeMs,
          searchTimeMs,
          resultsFound: searchResults.length,
          queryLength: context.userQuery.length,
          vectorDimensions: queryEmbedding.length,
          vectorsCached: vectorCacheStats.totalVectors,
          cacheMemoryKB: vectorCacheStats.memoryUsageKB
        }
      });

      return {
        items: searchResults.map(result => result.item),
        totalFound: searchResults.length,
        searchQuery: context.userQuery,
        searchTimeMs: totalTimeMs
      };

    } catch (error) {
      const errorTimeMs = Date.now() - startTime;
      
      if (error instanceof BusinessRuleViolationError) {
        throw error;
      }
      
      throw new BusinessRuleViolationError(
        'Knowledge search failed',
        { 
          error: error instanceof Error ? error.message : 'Unknown error',
          context,
          organizationId: this.organizationId,
          chatbotConfigId: this.chatbotConfigId,
          searchTimeMs: errorTimeMs
        }
      );
    }
  }

  /**
   * Initialize vector cache with knowledge base vectors
   * 
   * AI INSTRUCTIONS:
   * - Load all knowledge vectors from database into memory
   * - Should only be called once per service instance
   * - Log initialization performance and statistics
   * - Handle initialization failures gracefully
   */
  private async initializeVectorCache(sharedLogFile: string, logger: ISessionLogger): Promise<void> {
    try {
      logger.logStep('Vector Cache Initialization');
      logger.logMessage('Loading knowledge vectors into memory cache...');

      // Load all knowledge vectors with actual embeddings from database
      const allVectors = await this.vectorRepository.getAllKnowledgeVectors(
        this.organizationId,
        this.chatbotConfigId
      );

      logger.logMessage(`Found ${allVectors.length} knowledge vectors in database`);

      // Initialize cache with actual vectors
      const initResult = await this.vectorCache.initialize(allVectors, sharedLogFile);

      logger.logMessage(`✅ Vector cache initialized: ${initResult.vectorsLoaded} vectors loaded`);
      logger.logMessage(`📊 Memory usage: ${initResult.memoryUsageKB} KB`);
      
    } catch (error) {
      logger.logError(error instanceof Error ? error : new Error('Vector cache initialization failed'));
      throw new BusinessRuleViolationError(
        'Failed to initialize vector cache',
        {
          error: error instanceof Error ? error.message : 'Unknown error',
          organizationId: this.organizationId,
          chatbotConfigId: this.chatbotConfigId
        }
      );
    }
  }

  // Delegate cache warming to specialized service
  async warmCache(sharedLogFile?: string): Promise<{ success: boolean; itemsWarmed: number; timeMs: number; metrics: CacheWarmingMetrics }> {
    return this.cacheWarmingService.warmCache(sharedLogFile);
  }

  // Delegate management operations to specialized service
  async getKnowledgeByCategory(category: KnowledgeItem['category'], limit?: number, sharedLogFile?: string): Promise<KnowledgeItem[]> {
    return this.managementService.getKnowledgeByCategory(category, undefined, sharedLogFile);
  }

  async getKnowledgeByTags(tags: string[], limit?: number, sharedLogFile?: string): Promise<KnowledgeItem[]> {
    return this.managementService.getKnowledgeByTags(tags, undefined, sharedLogFile);
  }

  async getFrequentlyAskedQuestions(limit?: number): Promise<KnowledgeItem[]> {
    return this.getKnowledgeByCategory('faq', limit);
  }

  async findSimilarContent(query: string, excludeIds?: string[], limit?: number): Promise<KnowledgeItem[]> {
    const searchContext: KnowledgeRetrievalContext = {
      userQuery: query,
      maxResults: limit || 10,
      minRelevanceScore: 0.6
    };
    
    const result = await this.searchKnowledge(searchContext);
    return result.items.filter(item => !excludeIds?.includes(item.id));
  }

  async upsertKnowledgeItem(item: Omit<KnowledgeItem, 'id' | 'lastUpdated'>): Promise<KnowledgeItem> {
    throw new BusinessRuleViolationError(
      'Knowledge modifications not supported by retrieval service',
      { 
        operation: 'upsert',
        organizationId: this.organizationId,
        recommendation: 'Use VectorKnowledgeApplicationService for modifications'
      }
    );
  }

  async healthCheck(sharedLogFile?: string): Promise<boolean> {
    try {
      const healthResult = await this.managementService.checkHealthStatus(sharedLogFile);
      return healthResult.status === 'healthy' && this.vectorCache.isReady();
    } catch (error) {
      return false;
    }
  }

  // Extended methods for the split services
  async getKnowledgeStats(sharedLogFile?: string): Promise<KnowledgeStatsResult> {
    return this.managementService.getKnowledgeStats(sharedLogFile);
  }

  async deleteKnowledgeBySource(sourceType: string, sourceUrl?: string, sharedLogFile?: string): Promise<number> {
    return this.managementService.deleteKnowledgeBySource(sourceType, sourceUrl, sharedLogFile);
  }

  async checkHealthStatus(sharedLogFile?: string): Promise<HealthCheckResult> {
    return this.managementService.checkHealthStatus(sharedLogFile);
  }

  // Vector cache specific methods
  getVectorCacheStats(): VectorCacheStats {
    return this.vectorCache.getCacheStats();
  }

  isVectorCacheReady(): boolean {
    return this.vectorCache.isReady();
  }
} 