/**
 * Vector Cache Orchestration Service
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Delegate to specialized orchestration services
 * - Domain service focused on maintaining backward compatibility
 * - Keep business logic pure, no external dependencies beyond domain services
 * - Never exceed 250 lines per @golden-rule
 * - Delegate all operations to focused orchestration services
 * - Maintain existing API for backward compatibility
 * - Support comprehensive logging and monitoring
 */

import { KnowledgeItem } from './interfaces/IKnowledgeRetrievalService';
import { ISessionLogger } from './interfaces/IChatbotLoggingService';
import { VectorCacheInitializationOrchestrationService } from './VectorCacheInitializationOrchestrationService';
import { VectorCacheSearchOrchestrationService } from './VectorCacheSearchOrchestrationService';
import { VectorCacheManagementOrchestrationService } from './VectorCacheManagementOrchestrationService';
import { VectorCacheErrorOrchestrationService } from './VectorCacheErrorOrchestrationService';
import {
  CachedKnowledgeVector,
  VectorCacheStats,
  VectorSearchOptions,
  VectorCacheConfig,
  VectorCacheInitializationResult,
  VectorSearchResult
} from '../types/VectorCacheTypes';

/** Orchestration Service for Complex Vector Cache Operations */
export class VectorCacheOrchestrationService {
  
  /**
   * Orchestrate cache initialization workflow
   * 
   * AI INSTRUCTIONS:
   * - Delegate to specialized initialization orchestration service
   * - Maintain backward compatibility with existing API
   * - Preserve all security and organizational context
   */
  static async orchestrateInitialization(
    vectors: Array<{ item: KnowledgeItem; vector: number[] }>,
    cachedVectors: Map<string, CachedKnowledgeVector>,
    config: Required<VectorCacheConfig>,
    logger: ISessionLogger,
    organizationId: string,
    chatbotConfigId: string,
    loadVectorsCallback: (vectors: Array<{ item: KnowledgeItem; vector: number[] }>) => void,
    clearCacheCallback: () => void
  ): Promise<VectorCacheInitializationResult> {
    return VectorCacheInitializationOrchestrationService.orchestrateInitialization(
      vectors,
      cachedVectors,
      config,
      logger,
      organizationId,
      chatbotConfigId,
      loadVectorsCallback,
      clearCacheCallback
    );
  }

  /** Orchestrate cache search workflow */
  static async orchestrateSearch(
    queryEmbedding: number[],
    options: VectorSearchOptions,
    cachedVectors: Map<string, CachedKnowledgeVector>,
    logger: ISessionLogger,
    organizationId: string,
    chatbotConfigId: string,
    incrementSearchStats: () => void,
    getCacheStats: () => VectorCacheStats
  ): Promise<VectorSearchResult[]> {
    return VectorCacheSearchOrchestrationService.orchestrateSearch(
      queryEmbedding,
      options,
      cachedVectors,
      logger,
      organizationId,
      chatbotConfigId,
      incrementSearchStats,
      getCacheStats
    );
  }

  /** Orchestrate cache clearing workflow */
  static orchestrateCacheClear(
    previousSize: number,
    organizationId: string,
    chatbotConfigId: string,
    logger: ISessionLogger,
    clearCacheCallback: () => void
  ): void {
    return VectorCacheManagementOrchestrationService.orchestrateCacheClear(
      previousSize,
      organizationId,
      chatbotConfigId,
      logger,
      clearCacheCallback
    );
  }

  /** Orchestrate cache state monitoring */
  static orchestrateStateMonitoring(
    cachedVectors: Map<string, CachedKnowledgeVector>,
    config: Required<VectorCacheConfig>,
    searchCount: number,
    cacheHits: number,
    evictionsPerformed: number,
    initializationTime: Date | null,
    isInitialized: boolean,
    logger: ISessionLogger
  ): VectorCacheStats {
    return VectorCacheManagementOrchestrationService.orchestrateStateMonitoring(
      cachedVectors,
      config,
      searchCount,
      cacheHits,
      evictionsPerformed,
      initializationTime,
      isInitialized,
      logger
    );
  }

  /**
   * Orchestrate error handling and logging
   * 
   * AI INSTRUCTIONS:
   * - Delegate to specialized error orchestration service
   * - Maintain backward compatibility with existing API
   * - Preserve comprehensive error reporting
   */
  static orchestrateErrorHandling(
    operation: string,
    error: Error,
    context: Record<string, unknown>,
    logger: ISessionLogger
  ): void {
    return VectorCacheErrorOrchestrationService.orchestrateErrorHandling(
      operation,
      error,
      context,
      logger
    );
  }
}