/**
 * Vector Knowledge Cache Domain Service
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Manage vector cache state and provide simple API
 * - Domain service focused on cache state management and coordination
 * - Keep business logic pure, no external dependencies beyond domain services
 * - Never exceed 250 lines per @golden-rule
 * - Delegate complex workflows to VectorCacheOrchestrationService
 * - Handle domain errors with specific error types
 * - Cache vectors per chatbot configuration for performance
 * - Maintain clean separation between state management and orchestration
 */

import { KnowledgeItem } from './interfaces/IKnowledgeRetrievalService';
import { BusinessRuleViolationError } from '../errors/ChatbotWidgetDomainErrors';
import { IChatbotLoggingService } from './interfaces/IChatbotLoggingService';
import { VectorMemoryManagementService } from './VectorMemoryManagementService';
import { VectorCacheStatisticsService } from './VectorCacheStatisticsService';
import { VectorCacheOrchestrationService } from './VectorCacheOrchestrationService';
import {
  CachedKnowledgeVector,
  VectorCacheStats,
  VectorSearchOptions,
  VectorCacheConfig,
  VectorCacheInitializationResult,
  VectorSearchResult
} from '../types/VectorCacheTypes';

/** In-Memory Vector Knowledge Cache Service with State Management Focus */
export class VectorKnowledgeCache {
  private cachedVectors: Map<string, CachedKnowledgeVector> = new Map();
  private isInitialized: boolean = false;
  private initializationTime: Date | null = null;
  private searchCount: number = 0;
  private cacheHits: number = 0;
  private evictionsPerformed: number = 0;
  private readonly loggingService: IChatbotLoggingService;
  private readonly config: Required<VectorCacheConfig>;

  constructor(
    private readonly organizationId: string,
    private readonly chatbotConfigId: string,
    loggingService: IChatbotLoggingService,
    config: VectorCacheConfig = {}
  ) {
    this.loggingService = loggingService;
    this.config = VectorMemoryManagementService.createConfig(config);
  }

  /** Initialize cache with knowledge vectors */
  async initialize(
    vectors: Array<{ item: KnowledgeItem; vector: number[] }>,
    sharedLogFile: string
  ): Promise<VectorCacheInitializationResult> {
    try {
      const logger = this.createLogger('vector-cache', sharedLogFile, 'cache-initialization');

      const result = await VectorCacheOrchestrationService.orchestrateInitialization(
        vectors,
        this.cachedVectors,
        this.config,
        logger,
        this.organizationId,
        this.chatbotConfigId,
        (vectors) => this.loadVectorsIntoCache(vectors),
        () => this.clearCacheState()
      );

      // Update cache state based on orchestration results
      this.evictionsPerformed += result.vectorsEvicted;
      this.isInitialized = true;
      this.initializationTime = new Date();

      return result;

    } catch (error) {
      throw new BusinessRuleViolationError(
        'Vector cache initialization failed',
        {
          error: error instanceof Error ? error.message : 'Unknown error',
          organizationId: this.organizationId,
          chatbotConfigId: this.chatbotConfigId
        }
      );
    }
  }

  /**
   * Search cached vectors using cosine similarity
   * 
   * AI INSTRUCTIONS:
   * - Validate cache state before search
   * - Delegate complex search workflow to orchestration service
   * - Update search statistics
   * - Handle search errors gracefully
   */
  async searchVectors(
    queryEmbedding: number[],
    options: VectorSearchOptions = {},
    sharedLogFile: string
  ): Promise<VectorSearchResult[]> {
    if (!this.isInitialized) {
      throw new BusinessRuleViolationError(
        'Vector cache not initialized - call initialize() first',
        {
          organizationId: this.organizationId,
          chatbotConfigId: this.chatbotConfigId,
          operation: 'searchVectors'
        }
      );
    }

    try {
      const logger = this.createLogger('vector-search', sharedLogFile, 'cached-vector-search');

      return await VectorCacheOrchestrationService.orchestrateSearch(
        queryEmbedding,
        options,
        this.cachedVectors,
        logger,
        this.organizationId,
        this.chatbotConfigId,
        () => this.incrementSearchStats(),
        () => this.getCacheStats()
      );

    } catch (error) {
      throw new BusinessRuleViolationError(
        'Cached vector search failed',
        {
          error: error instanceof Error ? error.message : 'Unknown error',
          organizationId: this.organizationId,
          chatbotConfigId: this.chatbotConfigId
        }
      );
    }
  }

  /** Get cache statistics for monitoring */
  getCacheStats(): VectorCacheStats {
    return VectorCacheStatisticsService.calculateCacheStats(
      this.cachedVectors,
      this.config,
      this.searchCount,
      this.cacheHits,
      this.evictionsPerformed,
      this.initializationTime
    );
  }

  /** Check if cache is initialized and ready for searches */
  isReady(): boolean {
    return this.isInitialized && this.cachedVectors.size > 0;
  }

  /** Clear cache and reset statistics */
  clear(): void {
    const previousSize = this.cachedVectors.size;
    
    if (this.loggingService && previousSize > 0) {
      const logger = this.createLogger('vector-cache-clear', 'cache-operations.log', 'cache-clear');
      
      VectorCacheOrchestrationService.orchestrateCacheClear(
        previousSize,
        this.organizationId,
        this.chatbotConfigId,
        logger,
        () => this.performCacheClear()
      );
    } else {
      this.performCacheClear();
    }
  }

  /** Load vectors into cache with access tracking */
  private loadVectorsIntoCache(vectors: Array<{ item: KnowledgeItem; vector: number[] }>): void {
    const now = new Date();
    
    vectors.forEach(({ item, vector }) => {
      const cacheKey = this.generateCacheKey(item.id);
      this.cachedVectors.set(cacheKey, {
        item,
        vector: [...vector], // Create copy to prevent external mutations
        lastAccessed: now,
        accessCount: 0
      });
    });
  }

  /** Clear cache state and reset counters */
  private clearCacheState(): void {
    this.cachedVectors.clear();
    this.searchCount = 0;
    this.cacheHits = 0;
    this.evictionsPerformed = 0;
  }

  /** Perform complete cache clearing */
  private performCacheClear(): void {
    this.clearCacheState();
    this.isInitialized = false;
    this.initializationTime = null;
  }

  /** Increment search statistics */
  private incrementSearchStats(): void {
    this.searchCount++;
    this.cacheHits++; // All searches are cache hits since we search in-memory
  }

  /** Generate cache key for knowledge item */
  private generateCacheKey(itemId: string): string {
    return `${this.organizationId}_${this.chatbotConfigId}_${itemId}`;
  }

  /** Create session logger with consistent context */
  private createLogger(sessionId: string, logFile: string, operation: string) {
    return this.loggingService.createSessionLogger(
      sessionId,
      logFile,
      {
        operation,
        organizationId: this.organizationId,
        metadata: { chatbotConfigId: this.chatbotConfigId }
      }
    );
  }
}

// Re-export types for backward compatibility
export type { 
  CachedKnowledgeVector,
  VectorCacheStats,
  VectorSearchOptions,
  VectorCacheConfig,
  VectorCacheInitializationResult,
  VectorSearchResult
} from '../types/VectorCacheTypes'; 