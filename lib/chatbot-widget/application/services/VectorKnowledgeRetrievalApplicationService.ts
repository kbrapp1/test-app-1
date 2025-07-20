/**
 * Vector Knowledge Retrieval Application Service (Application Layer)
 * 
 * APPLICATION LAYER RESPONSIBILITIES:
 * - Use case orchestration and coordination
 * - Cache management and initialization
 * - Cross-domain service coordination
 * - Session and logging management
 * - Infrastructure service delegation
 * 
 * DDD LAYER: Application (orchestration and use cases)
 * FILE SIZE: 120-150 lines
 * 
 * AI INSTRUCTIONS:
 * - Application service handling use case orchestration
 * - Coordinates domain services with infrastructure
 * - Manages caching, logging, and session concerns
 * - Delegates to domain service for business validation
 */

import { BusinessRuleViolationError } from '../../domain/errors/ChatbotWidgetDomainErrors';
import { IVectorKnowledgeRepository } from '../../domain/repositories/IVectorKnowledgeRepository';
import { ISessionLogger } from '../../domain/services/interfaces/IChatbotLoggingService';
import { IEmbeddingService } from '../../domain/services/interfaces/IEmbeddingService';
import {
  IKnowledgeRetrievalService,
  KnowledgeItem,
  KnowledgeRetrievalContext,
  KnowledgeSearchResult
} from '../../domain/services/interfaces/IKnowledgeRetrievalService';
import { CacheWarmingMetrics, KnowledgeCacheWarmingService } from '../../domain/services/KnowledgeCacheWarmingService';
import { HealthCheckResult, KnowledgeManagementService, KnowledgeStatsResult } from '../../domain/services/KnowledgeManagementService';
import { VectorKnowledgeCache } from '../../domain/services/VectorKnowledgeCache';
import { VectorCacheStats } from '../../domain/types/VectorCacheTypes';
import { ChatbotWidgetCompositionRoot } from '../../infrastructure/composition/ChatbotWidgetCompositionRoot';

// Domain service for business validation
import { VectorKnowledgeRetrievalDomainService } from '../../domain/services/VectorKnowledgeRetrievalDomainService';

// Specialized domain services
import { KnowledgeSearchExecutionService } from '../../domain/services/knowledge-processing/KnowledgeSearchExecutionService';
import { VectorCacheInitializationService } from '../../domain/services/knowledge-processing/VectorCacheInitializationService';

/**
 * Vector Knowledge Retrieval Application Service
 * 
 * APPLICATION RESPONSIBILITIES:
 * - Orchestrate knowledge search use cases
 * - Manage cache initialization and warming
 * - Coordinate infrastructure services
 * - Handle session logging and error management
 * - Delegate business validation to domain service
 */
export class VectorKnowledgeRetrievalApplicationService implements IKnowledgeRetrievalService {
  private readonly domainService: VectorKnowledgeRetrievalDomainService;
  private readonly cacheWarmingService: KnowledgeCacheWarmingService;
  private readonly managementService: KnowledgeManagementService;
  private readonly vectorCache: VectorKnowledgeCache;
  private readonly searchExecutionService: KnowledgeSearchExecutionService;
  private readonly cacheInitializationService: VectorCacheInitializationService;
  
  constructor(
    private readonly vectorRepository: IVectorKnowledgeRepository,
    private readonly embeddingService: IEmbeddingService,
    private readonly organizationId: string,
    private readonly chatbotConfigId: string
  ) {
    // Initialize domain service for business validation
    this.domainService = new VectorKnowledgeRetrievalDomainService(
      this.organizationId,
      this.chatbotConfigId
    );

    // Initialize vector cache with application configuration
    const loggingService = ChatbotWidgetCompositionRoot.getLoggingService();
    this.vectorCache = new VectorKnowledgeCache(
      this.organizationId,
      this.chatbotConfigId,
      loggingService,
      {
        maxMemoryKB: 50 * 1024,
        maxVectors: 10000,
        evictionBatchSize: 100
      }
    );
    
    // Initialize specialized services
    this.searchExecutionService = new KnowledgeSearchExecutionService(
      this.embeddingService,
      this.vectorCache,
      this.organizationId,
      this.chatbotConfigId
    );
    
    this.cacheInitializationService = new VectorCacheInitializationService(
      this.vectorRepository,
      this.vectorCache,
      loggingService,
      this.organizationId,
      this.chatbotConfigId
    );
    
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
   * Execute knowledge search use case
   * 
   * APPLICATION RESPONSIBILITIES:
   * - Orchestrate search process
   * - Ensure cache is ready
   * - Coordinate domain validation with infrastructure
   * - Handle errors and logging
   */
  async searchKnowledge(context: KnowledgeRetrievalContext): Promise<KnowledgeSearchResult> {
    // Delegate business validation to domain service
    this.domainService.validateSearchContext(context);
    
    try {
      // Application logic: Ensure cache is ready for search operations
      if (!this.cacheInitializationService.isReady()) {
        // AI FIX: Use the actual shared log file from context instead of empty string
        const logFile = context.sharedLogFile || 'fallback-cache-init.log';
        await this.cacheInitializationService.initializeForSession(logFile);
      }

      // AI FIX: Use the actual logger from the shared log file context instead of empty logger
      let searchLogger: ISessionLogger;
      if (context.sharedLogFile) {
        // Create a real logger using the shared log file from the context
        searchLogger = this.createSessionLogger(context.sharedLogFile);
      } else {
        // Fallback to minimal logger if no shared log file available
        searchLogger = this.createMinimalLogger();
      }
      
      // Execute search through specialized domain service with REAL logger
      const searchResult = await this.searchExecutionService.executeSearch(
        context,
        searchLogger  // ← NOW USING REAL LOGGER!
      );

      // Delegate result validation to domain service
      this.domainService.validateSearchResults(searchResult.result);

      return searchResult.result;

    } catch (error) {
      // Application error handling
      if (error instanceof BusinessRuleViolationError) {
        throw error;
      }
      
      throw new BusinessRuleViolationError(
        'Knowledge search failed - application service error',
        { 
          error: error instanceof Error ? error.message : 'Unknown error',
          organizationId: this.organizationId,
          chatbotConfigId: this.chatbotConfigId,
          userQuery: context.userQuery
        }
      );
    }
  }

  /**
   * Create a session logger for the search operation using the proper logging service
   */
  private createSessionLogger(sharedLogFile: string): ISessionLogger {
    // AI: Use the same pattern as VectorKnowledgeOrchestrationService to create proper logger
    const loggingService = ChatbotWidgetCompositionRoot.getLoggingService();
    
    return loggingService.createSessionLogger(
      'knowledge-search',
      sharedLogFile,
      {
        operation: 'vector-knowledge-search',
        organizationId: this.organizationId,
        metadata: { chatbotConfigId: this.chatbotConfigId }
      }
    );
  }

  /**
   * Create minimal logger as fallback
   */
  private createMinimalLogger(): ISessionLogger {
    return {
      logMessage: (msg: string) => console.log(`[KNOWLEDGE-SEARCH] ${msg}`),
      logError: (error: Error) => console.error(`[KNOWLEDGE-SEARCH] ERROR:`, error),
      logStep: (step: string) => console.log(`[KNOWLEDGE-SEARCH] ${step}`),
      logHeader: (title: string) => console.log(`[KNOWLEDGE-SEARCH] === ${title} ===`),
      logSeparator: () => console.log('[KNOWLEDGE-SEARCH] ' + '='.repeat(50)),
      logRaw: (msg: string) => console.log(msg),
      logMetrics: () => {},
      logApiCall: () => {},
      logCache: () => {},
      logDomainEvent: () => {},
      flush: async () => {},
      getCorrelationId: () => 'knowledge-search-minimal'
    } as ISessionLogger;
  }

  /**
   * Initialize vector cache for session (application use case)
   */
  async initializeVectorCacheForSession(sharedLogFile?: string): Promise<void> {
    // AI FIX: Provide a fallback log file name instead of empty string
    const logFile = sharedLogFile || 'fallback-cache-init.log';
    await this.cacheInitializationService.initializeForSession(logFile);
  }

  /**
   * Check if vector cache is ready for use
   */
  isVectorCacheReady(): boolean {
    return this.cacheInitializationService.isReady();
  }

  // Cache warming delegation
  async warmCache(sharedLogFile?: string): Promise<{ success: boolean; itemsWarmed: number; timeMs: number; metrics: CacheWarmingMetrics }> {
    return this.cacheWarmingService.warmCache(sharedLogFile);
  }

  // Management operations delegation
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
    this.domainService.validateModificationOperation();
  }

  async healthCheck(sharedLogFile?: string): Promise<boolean> {
    try {
      const healthResult = await this.managementService.checkHealthStatus(sharedLogFile);
      return healthResult.status === 'healthy' && this.cacheInitializationService.isReady();
    } catch {
      return false;
    }
  }

  // Extended management operations
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