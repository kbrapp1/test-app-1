/**
 * Knowledge Management Service (Legacy Adapter)
 * 
 * AI INSTRUCTIONS:
 * - Maintains backward compatibility
 * - Delegates to new DDD-structured services
 * - Preserves existing API surface
 * - Single responsibility: API compatibility
 */

import { 
  KnowledgeItem, 
  KnowledgeRetrievalContext 
} from './interfaces/IKnowledgeRetrievalService';
import { IVectorKnowledgeRepository } from '../repositories/IVectorKnowledgeRepository';
import { IChatbotLoggingService as _IChatbotLoggingService } from './interfaces/IChatbotLoggingService';
import { ChatbotWidgetCompositionRoot } from '../../infrastructure/composition/ChatbotWidgetCompositionRoot';
import { KnowledgeManagementApplicationService } from '../../application/services/knowledge/KnowledgeManagementApplicationService';
import { KnowledgeStatsData } from '../value-objects/knowledge/KnowledgeStatsResult';
import { HealthCheckData } from '../value-objects/knowledge/HealthCheckResult';

// Legacy interfaces for backward compatibility
export type KnowledgeStatsResult = KnowledgeStatsData;
export type HealthCheckResult = HealthCheckData;

export class KnowledgeManagementService {
  private readonly applicationService: KnowledgeManagementApplicationService;

  constructor(
    vectorRepository: IVectorKnowledgeRepository,
    organizationId: string,
    chatbotConfigId: string
  ) {
    const loggingService = ChatbotWidgetCompositionRoot.getLoggingService();
    
    this.applicationService = new KnowledgeManagementApplicationService(
      vectorRepository,
      organizationId,
      chatbotConfigId,
      loggingService
    );
  }

  async getKnowledgeByCategory(
    category: string, 
    context?: KnowledgeRetrievalContext, 
    sharedLogFile?: string
  ): Promise<KnowledgeItem[]> {
    return this.applicationService.getKnowledgeByCategory(category, context, sharedLogFile);
  }

  async getKnowledgeByTags(
    tags: string[], 
    context?: KnowledgeRetrievalContext, 
    sharedLogFile?: string
  ): Promise<KnowledgeItem[]> {
    return this.applicationService.getKnowledgeByTags(tags, context, sharedLogFile);
  }

  async getKnowledgeStats(sharedLogFile?: string): Promise<KnowledgeStatsResult> {
    const stats = await this.applicationService.getKnowledgeStats(sharedLogFile);
    return stats.toData();
  }

  async deleteKnowledgeBySource(
    sourceType: string, 
    sourceUrl?: string, 
    sharedLogFile?: string
  ): Promise<number> {
    return this.applicationService.deleteKnowledgeBySource(sourceType, sourceUrl, sharedLogFile);
  }

  async checkHealthStatus(sharedLogFile?: string): Promise<HealthCheckResult> {
    const healthCheck = await this.applicationService.checkHealthStatus(sharedLogFile);
    return healthCheck.toData();
  }
} 