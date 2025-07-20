/**
 * Vector Cache Management Orchestration Service
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Orchestrate vector cache management workflows
 * - Domain service focused on coordinating cache operations and monitoring
 * - Keep business logic pure, no external dependencies beyond domain services
 * - Never exceed 250 lines per @golden-rule
 * - Delegate all specialized operations to focused services
 * - Handle cache management workflows with proper error handling
 * - Support comprehensive state monitoring and logging
 */

import { BusinessRuleViolationError } from '../errors/ChatbotWidgetDomainErrors';
import { ISessionLogger } from './interfaces/IChatbotLoggingService';
import { VectorCacheStatisticsService } from './VectorCacheStatisticsService';
import { VectorCacheLoggingService } from './VectorCacheLoggingService';
import {
  CachedKnowledgeVector,
  VectorCacheConfig,
  VectorCacheStats
} from '../types/VectorCacheTypes';

/** Orchestration Service for Vector Cache Management Operations */
export class VectorCacheManagementOrchestrationService {
  
  /**
   * Orchestrate cache clearing workflow
   * 
   * AI INSTRUCTIONS:
   * - Coordinate cache clearing operations
   * - Handle comprehensive logging and error tracking
   * - Manage cache state transitions and cleanup
   * - Support organizational cache isolation
   */
  static orchestrateCacheClear(
    previousSize: number,
    organizationId: string,
    chatbotConfigId: string,
    logger: ISessionLogger,
    clearCacheCallback: () => void
  ): void {
    try {
      // Log cache clearing operation
      VectorCacheLoggingService.logCacheClear(
        logger,
        previousSize,
        0, // memoryFreedKB will be calculated later
        `Cache clear for organization ${organizationId}`
      );

      // Execute cache clearing
      clearCacheCallback();

    } catch (error) {
      throw new BusinessRuleViolationError(
        'Vector cache clear orchestration failed',
        {
          error: error instanceof Error ? error.message : 'Unknown error',
          organizationId,
          chatbotConfigId,
          previousSize
        }
      );
    }
  }

  /**
   * Orchestrate cache state monitoring
   * 
   * AI INSTRUCTIONS:
   * - Coordinate cache state calculation and monitoring
   * - Handle comprehensive statistics generation
   * - Manage cache performance metrics and logging
   * - Support real-time cache health monitoring
   */
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
    try {
      const stats = VectorCacheStatisticsService.calculateCacheStats(
        cachedVectors,
        config,
        searchCount,
        cacheHits,
        evictionsPerformed,
        initializationTime
      );

      // Log current cache state
      VectorCacheLoggingService.logCacheState(
        logger,
        stats,
        'status-check'
      );

      return stats;

    } catch (error) {
      throw new BusinessRuleViolationError(
        'Vector cache state monitoring failed',
        {
          error: error instanceof Error ? error.message : 'Unknown error',
          cacheSize: cachedVectors.size,
          isInitialized
        }
      );
    }
  }
}