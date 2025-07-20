// Vector Knowledge Retrieval Application Service
// Orchestrates knowledge search and cache management

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
import { KnowledgeStatsData } from '../../domain/value-objects/knowledge/KnowledgeStatsResult';
import { HealthCheckData } from '../../domain/value-objects/knowledge/HealthCheckResult';
import { VectorKnowledgeCache } from '../../domain/services/VectorKnowledgeCache';
import { VectorCacheStats } from '../../domain/types/VectorCacheTypes';
import { ChatbotWidgetCompositionRoot } from '../../infrastructure/composition/ChatbotWidgetCompositionRoot';

// Domain service for business validation
import { VectorKnowledgeRetrievalDomainService } from '../../domain/services/VectorKnowledgeRetrievalDomainService';

// Specialized domain services
import { KnowledgeSearchExecutionService } from '../../domain/services/knowledge-processing/KnowledgeSearchExecutionService';
import { VectorCacheInitializationService } from '../../domain/services/knowledge-processing/VectorCacheInitializationService';

// Operations coordinator
import { VectorKnowledgeOperationsCoordinator } from './VectorKnowledgeOperationsCoordinator';

// Vector Knowledge Retrieval Application Service
export class VectorKnowledgeRetrievalApplicationService implements IKnowledgeRetrievalService {
  private readonly domainService: VectorKnowledgeRetrievalDomainService;
  private readonly cacheWarmingService: KnowledgeCacheWarmingService;
  private readonly vectorCache: VectorKnowledgeCache;
  private readonly searchExecutionService: KnowledgeSearchExecutionService;
  private readonly cacheInitializationService: VectorCacheInitializationService;
  private readonly operationsCoordinator: VectorKnowledgeOperationsCoordinator;
  
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
      loggingService,
      this.organizationId,
      this.chatbotConfigId
    );
    
    this.operationsCoordinator = new VectorKnowledgeOperationsCoordinator(
      this.vectorRepository,
      this.embeddingService,
      this.vectorCache,
      this.organizationId,
      this.chatbotConfigId
    );
  }

  // Execute knowledge search use case
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

  // Create session logger for search operations
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

  // Create minimal logger as fallback
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

  // Initialize vector cache for session
  async initializeVectorCacheForSession(sharedLogFile?: string): Promise<void> {
    // AI FIX: Provide a fallback log file name instead of empty string
    const logFile = sharedLogFile || 'fallback-cache-init.log';
    await this.cacheInitializationService.initializeForSession(logFile);
  }

  // Check if vector cache is ready
  isVectorCacheReady(): boolean {
    return this.cacheInitializationService.isReady();
  }

  // Cache warming delegation
  async warmCache(sharedLogFile?: string): Promise<{ success: boolean; itemsWarmed: number; timeMs: number; metrics: CacheWarmingMetrics }> {
    return this.cacheWarmingService.warmCache(sharedLogFile);
  }

  // Management operations delegation
  async getKnowledgeByCategory(category: KnowledgeItem['category'], limit?: number, sharedLogFile?: string): Promise<KnowledgeItem[]> {
    return this.operationsCoordinator.getKnowledgeByCategory(category, limit, sharedLogFile);
  }

  async getKnowledgeByTags(tags: string[], limit?: number, sharedLogFile?: string): Promise<KnowledgeItem[]> {
    return this.operationsCoordinator.getKnowledgeByTags(tags, limit, sharedLogFile);
  }

  async getFrequentlyAskedQuestions(limit?: number): Promise<KnowledgeItem[]> {
    return this.operationsCoordinator.getFrequentlyAskedQuestions(limit);
  }

  async findSimilarContent(query: string, excludeIds?: string[], limit?: number): Promise<KnowledgeItem[]> {
    return this.operationsCoordinator.findSimilarContent(query, (context) => this.searchKnowledge(context), excludeIds, limit);
  }

  async upsertKnowledgeItem(_item: Omit<KnowledgeItem, 'id' | 'lastUpdated'>): Promise<KnowledgeItem> {
    this.domainService.validateModificationOperation();
  }

  async healthCheck(sharedLogFile?: string): Promise<boolean> {
    try {
      const healthResult = await this.operationsCoordinator.checkHealthStatus(sharedLogFile);
      return healthResult.status === 'healthy' && this.cacheInitializationService.isReady();
    } catch {
      return false;
    }
  }

  // Extended management operations
  async getKnowledgeStats(sharedLogFile?: string): Promise<KnowledgeStatsData> {
    return this.operationsCoordinator.getKnowledgeStats(sharedLogFile);
  }

  async deleteKnowledgeBySource(sourceType: string, sourceUrl?: string, sharedLogFile?: string): Promise<number> {
    return this.operationsCoordinator.deleteKnowledgeBySource(sourceType, sourceUrl, sharedLogFile);
  }

  async checkHealthStatus(sharedLogFile?: string): Promise<HealthCheckData> {
    return this.operationsCoordinator.checkHealthStatus(sharedLogFile);
  }

  // Vector cache specific methods
  getVectorCacheStats(): VectorCacheStats {
    return this.operationsCoordinator.getVectorCacheStats();
  }
}