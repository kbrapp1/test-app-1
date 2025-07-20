/**
 * Vector Knowledge Operations Coordinator (Application Layer)
 * 
 * APPLICATION LAYER RESPONSIBILITIES:
 * - Coordinate management and query operations
 * - Delegate to domain services for business logic
 * - Handle stats, health checks, and category queries
 * - Preserve security context and error handling
 * 
 * DDD LAYER: Application (coordination and delegation)
 * FILE SIZE: ~60 lines
 * 
 * AI INSTRUCTIONS:
 * - Application coordinator for management operations
 * - Delegates to domain services for business logic
 * - Maintains security context and error handling
 * - Preserves all multi-tenant security variables
 */

import { IVectorKnowledgeRepository } from '../../domain/repositories/IVectorKnowledgeRepository';
import { IEmbeddingService } from '../../domain/services/interfaces/IEmbeddingService';
import {
  KnowledgeItem,
  KnowledgeRetrievalContext,
} from '../../domain/services/interfaces/IKnowledgeRetrievalService';
import { KnowledgeManagementApplicationService } from './knowledge/KnowledgeManagementApplicationService';
import { KnowledgeStatsData } from '../../domain/value-objects/knowledge/KnowledgeStatsResult';
import { HealthCheckData } from '../../domain/value-objects/knowledge/HealthCheckResult';
import { ChatbotWidgetCompositionRoot } from '../../infrastructure/composition/ChatbotWidgetCompositionRoot';
import { VectorKnowledgeCache } from '../../domain/services/VectorKnowledgeCache';
import { VectorCacheStats } from '../../domain/types/VectorCacheTypes';

/**
 * Vector Knowledge Operations Coordinator
 * 
 * COORDINATION RESPONSIBILITIES:
 * - Management operations (stats, health, queries)
 * - Category and tag-based knowledge retrieval
 * - Cache statistics and health monitoring
 * - Preserve security context in all operations
 */
export class VectorKnowledgeOperationsCoordinator {
  private readonly managementService: KnowledgeManagementApplicationService;

  constructor(
    private readonly vectorRepository: IVectorKnowledgeRepository,
    private readonly embeddingService: IEmbeddingService,
    private readonly vectorCache: VectorKnowledgeCache,
    private readonly organizationId: string,
    private readonly chatbotConfigId: string
  ) {
    const loggingService = ChatbotWidgetCompositionRoot.getLoggingService();
    this.managementService = new KnowledgeManagementApplicationService(
      this.vectorRepository,
      this.organizationId,
      this.chatbotConfigId,
      loggingService
    );
  }

  // Category and tag-based operations
  async getKnowledgeByCategory(category: KnowledgeItem['category'], limit?: number, sharedLogFile?: string): Promise<KnowledgeItem[]> {
    return this.managementService.getKnowledgeByCategory(category, undefined, sharedLogFile);
  }

  async getKnowledgeByTags(tags: string[], limit?: number, sharedLogFile?: string): Promise<KnowledgeItem[]> {
    return this.managementService.getKnowledgeByTags(tags, undefined, sharedLogFile);
  }

  async getFrequentlyAskedQuestions(limit?: number): Promise<KnowledgeItem[]> {
    return this.getKnowledgeByCategory('faq', limit);
  }

  async findSimilarContent(
    query: string, 
    searchFunction: (context: KnowledgeRetrievalContext) => Promise<{ items: KnowledgeItem[] }>,
    excludeIds?: string[], 
    limit?: number
  ): Promise<KnowledgeItem[]> {
    const searchContext: KnowledgeRetrievalContext = {
      userQuery: query,
      maxResults: limit || 10,
      minRelevanceScore: 0.6
    };
    
    const result = await searchFunction(searchContext);
    return result.items.filter(item => !excludeIds?.includes(item.id));
  }

  // Stats and management operations
  async getKnowledgeStats(sharedLogFile?: string): Promise<KnowledgeStatsData> {
    const stats = await this.managementService.getKnowledgeStats(sharedLogFile);
    return stats.toData();
  }

  async deleteKnowledgeBySource(sourceType: string, sourceUrl?: string, sharedLogFile?: string): Promise<number> {
    return this.managementService.deleteKnowledgeBySource(sourceType, sourceUrl, sharedLogFile);
  }

  async checkHealthStatus(sharedLogFile?: string): Promise<HealthCheckData> {
    const healthCheck = await this.managementService.checkHealthStatus(sharedLogFile);
    return healthCheck.toData();
  }

  // Vector cache specific methods
  getVectorCacheStats(): VectorCacheStats {
    return this.vectorCache.getCacheStats();
  }
}