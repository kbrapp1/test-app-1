/**
 * Vector Cache Initialization Orchestration Service
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Orchestrate vector cache initialization workflows
 * - Domain service focused on coordinating complex initialization operations
 * - Keep business logic pure, no external dependencies beyond domain services
 * - Never exceed 250 lines per @golden-rule
 * - Delegate all specialized operations to focused services
 * - Handle initialization workflows with proper error handling
 * - Support comprehensive logging and monitoring
 */

import { KnowledgeItem } from './interfaces/IKnowledgeRetrievalService';
import { BusinessRuleViolationError } from '../errors/ChatbotWidgetDomainErrors';
import { ISessionLogger } from './interfaces/IChatbotLoggingService';
import { VectorMemoryManagementService } from './VectorMemoryManagementService';
import { VectorCacheStatisticsService } from './VectorCacheStatisticsService';
import { VectorCacheLoggingService } from './VectorCacheLoggingService';
import {
  CachedKnowledgeVector,
  VectorCacheConfig,
  VectorCacheInitializationResult
} from '../types/VectorCacheTypes';

/** Orchestration Service for Vector Cache Initialization */
export class VectorCacheInitializationOrchestrationService {
  
  /**
   * Orchestrate cache initialization workflow
   * 
   * AI INSTRUCTIONS:
   * - Coordinate initialization across multiple specialized services
   * - Handle comprehensive logging and error tracking
   * - Manage memory limits and eviction during initialization
   * - Return detailed initialization results
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
    const startTime = Date.now();

    try {
      // Log initialization start
      VectorCacheLoggingService.logInitializationStart(
        logger,
        vectors.length,
        config,
        organizationId
      );

      // Clear existing cache and load vectors
      clearCacheCallback();
      loadVectorsCallback(vectors);

      // Enforce memory limits using specialized service
      const evictionResult = VectorMemoryManagementService.enforceMemoryLimits(
        cachedVectors,
        config,
        logger
      );

      // Calculate final metrics and log results
      const timeMs = Date.now() - startTime;
      const initializationMetrics = VectorCacheStatisticsService.generateInitializationMetrics(
        timeMs,
        cachedVectors.size,
        evictionResult.evictedCount,
        evictionResult.memoryUsageKB,
        config.maxMemoryKB,
        vectors.length > 0 ? vectors[0].vector.length : 0
      );

      VectorCacheLoggingService.logInitializationResults(logger, initializationMetrics);

      return {
        success: true,
        vectorsLoaded: cachedVectors.size,
        vectorsEvicted: evictionResult.evictedCount,
        memoryUsageKB: evictionResult.memoryUsageKB,
        timeMs
      };

    } catch (error) {
      const timeMs = Date.now() - startTime;
      
      throw new BusinessRuleViolationError(
        'Vector cache initialization orchestration failed',
        {
          error: error instanceof Error ? error.message : 'Unknown error',
          organizationId,
          chatbotConfigId,
          vectorCount: vectors.length,
          timeMs
        }
      );
    }
  }
}