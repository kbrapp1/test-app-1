/**
 * Vector Knowledge Retrieval Service (Refactored)
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Orchestrate knowledge search operations with delegation
 * - Domain service focused on coordination between specialized services
 * - Uses composition to delegate specific concerns to focused services
 * - Keep under 200-250 lines per @golden-rule
 * - Maintain interface compatibility while improving internal structure
 */

import { 
  IKnowledgeRetrievalService, 
  KnowledgeItem, 
  KnowledgeSearchResult, 
  KnowledgeRetrievalContext 
} from './interfaces/IKnowledgeRetrievalService';
import { IVectorKnowledgeRepository } from '../repositories/IVectorKnowledgeRepository';
import { IEmbeddingService } from './interfaces/IEmbeddingService';
import { BusinessRuleViolationError } from '../errors/ChatbotWidgetDomainErrors';
import { IChatbotLoggingService } from './interfaces/IChatbotLoggingService';
import { ChatbotWidgetCompositionRoot } from '../../infrastructure/composition/ChatbotWidgetCompositionRoot';
import { KnowledgeCacheWarmingService, CacheWarmingMetrics } from './KnowledgeCacheWarmingService';
import { KnowledgeManagementService, KnowledgeStatsResult, HealthCheckResult } from './KnowledgeManagementService';
import { VectorKnowledgeCache } from './VectorKnowledgeCache';
import { VectorCacheStats } from '../types/VectorCacheTypes';

// Extracted specialized services
import { KnowledgeSearchExecutionService } from './knowledge-processing/KnowledgeSearchExecutionService';
import { VectorCacheInitializationService } from './knowledge-processing/VectorCacheInitializationService';
import { SearchMetricsLoggingService } from './knowledge-processing/SearchMetricsLoggingService';

/**
 * Refactored Vector Knowledge Retrieval Service
 * 
 * AI INSTRUCTIONS:
 * - Orchestrates knowledge search through specialized services
 * - Delegates cache initialization to VectorCacheInitializationService
 * - Delegates search execution to KnowledgeSearchExecutionService
 * - Delegates metrics logging to SearchMetricsLoggingService
 * - Maintains backward compatibility with existing interface
 * - Focuses on coordination rather than implementation details
 */
export class VectorKnowledgeRetrievalService implements IKnowledgeRetrievalService {
  private readonly loggingService: IChatbotLoggingService;
  private readonly cacheWarmingService: KnowledgeCacheWarmingService;
  private readonly managementService: KnowledgeManagementService;
  private readonly vectorCache: VectorKnowledgeCache;
  
  // Extracted specialized services
  private readonly searchExecutionService: KnowledgeSearchExecutionService;
  private readonly cacheInitializationService: VectorCacheInitializationService;
  
  constructor(
    private readonly vectorRepository: IVectorKnowledgeRepository,
    private readonly embeddingService: IEmbeddingService,
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
        evictionBatchSize: 100 // Evict 100 vectors at a time
      }
    );
    
    // Initialize specialized services for core responsibilities
    this.searchExecutionService = new KnowledgeSearchExecutionService(
      this.embeddingService,
      this.vectorCache,
      this.organizationId,
      this.chatbotConfigId
    );
    
    this.cacheInitializationService = new VectorCacheInitializationService(
      this.vectorRepository,
      this.vectorCache,
      this.loggingService,
      this.organizationId,
      this.chatbotConfigId
    );
    
    // Initialize existing specialized services
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

  /**
   * Execute knowledge search with full delegation to specialized services
   * 
   * AI INSTRUCTIONS:
   * - Coordinates search operation through specialized services
   * - Handles cache initialization if needed
   * - Delegates search execution and metrics logging
   * - Maintains error handling and business rule validation
   * - Provides comprehensive logging and performance tracking
   */
  async searchKnowledge(context: KnowledgeRetrievalContext): Promise<KnowledgeSearchResult> {
    const startTime = Date.now();
    
    try {
      // Create session logger with context
      const sessionId = (context as { sessionId?: string }).sessionId || 'unknown-session';
      const logger = this.loggingService.createSessionLogger(
        sessionId,
        context.sharedLogFile!,
        {
          sessionId,
          operation: 'knowledge-search',
          organizationId: this.organizationId
        }
      );

      // Log search start with context
      SearchMetricsLoggingService.logSearchStart(
        logger,
        {
          organizationId: this.organizationId,
          chatbotConfigId: this.chatbotConfigId,
          sessionId,
          userQuery: context.userQuery
        }
      );

      // Check and initialize vector cache if needed
      const isReady = this.cacheInitializationService.isReady();
      SearchMetricsLoggingService.logCacheReadiness(logger, this.vectorCache, isReady);

      if (!isReady) {
        await this.cacheInitializationService.initializeWithLogger(
          context.sharedLogFile!,
          logger
        );
      }

      // Execute search through specialized service
      const { result, metrics } = await this.searchExecutionService.executeSearch(
        context,
        logger
      );

      // Log comprehensive metrics
      SearchMetricsLoggingService.logSearchMetrics(
        logger,
        metrics,
        this.vectorCache,
        {
          organizationId: this.organizationId,
          chatbotConfigId: this.chatbotConfigId,
          sessionId,
          userQuery: context.userQuery
        }
      );

      return result;

    } catch (error) {
      const errorTimeMs = Date.now() - startTime;
      
      // Log error with context
      if (context.sharedLogFile) {
        const logger = this.loggingService.createSessionLogger(
          'search-error',
          context.sharedLogFile,
          { operation: 'knowledge-search-error', organizationId: this.organizationId }
        );
        
        SearchMetricsLoggingService.logSearchError(
          logger,
          error instanceof Error ? error : new Error('Unknown search error'),
          {
            organizationId: this.organizationId,
            chatbotConfigId: this.chatbotConfigId,
            userQuery: context.userQuery
          }
        );
      }
      
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
   * Initialize vector cache for session startup
   * 
   * AI INSTRUCTIONS:
   * - Delegates to VectorCacheInitializationService
   * - Provides clean interface for session preparation
   * - Maintains existing interface compatibility
   */
  async initializeVectorCacheForSession(sharedLogFile: string): Promise<void> {
    await this.cacheInitializationService.initializeForSession(sharedLogFile);
  }

  /**
   * Check if vector cache is ready for use
   */
  isVectorCacheReady(): boolean {
    return this.cacheInitializationService.isReady();
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

  async upsertKnowledgeItem(_item: Omit<KnowledgeItem, 'id' | 'lastUpdated'>): Promise<KnowledgeItem> {
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
      return healthResult.status === 'healthy' && this.cacheInitializationService.isReady();
    } catch {
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
}