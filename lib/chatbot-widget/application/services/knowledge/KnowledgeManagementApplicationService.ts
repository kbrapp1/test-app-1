/**
 * Knowledge Management Application Service
 * 
 * AI INSTRUCTIONS:
 * - Main application service for knowledge management orchestration
 * - Coordinates domain services and repositories
 * - Single responsibility: knowledge management coordination
 * - Preserves organization security throughout
 */

import { KnowledgeItem, KnowledgeRetrievalContext } from '../../../domain/services/interfaces/IKnowledgeRetrievalService';
import { IVectorKnowledgeRepository } from '../../../domain/repositories/IVectorKnowledgeRepository';
import { IChatbotLoggingService } from '../../../domain/services/interfaces/IChatbotLoggingService';
import { KnowledgeQuery } from '../../../domain/value-objects/knowledge/KnowledgeQuery';
import { KnowledgeStatsResult } from '../../../domain/value-objects/knowledge/KnowledgeStatsResult';
import { HealthCheckResult } from '../../../domain/value-objects/knowledge/HealthCheckResult';
import { KnowledgeSecurityDomainService } from '../../../domain/services/knowledge/KnowledgeSecurityDomainService';
import { KnowledgeRetrievalOrchestrator } from './KnowledgeRetrievalOrchestrator';
import { KnowledgeStatisticsService } from './KnowledgeStatisticsService';
import { KnowledgeErrorHandler } from './KnowledgeErrorHandler';

export class KnowledgeManagementApplicationService {
  private readonly retrievalOrchestrator: KnowledgeRetrievalOrchestrator;
  private readonly statisticsService: KnowledgeStatisticsService;
  private readonly securityService: KnowledgeSecurityDomainService;

  constructor(
    private readonly vectorRepository: IVectorKnowledgeRepository,
    private readonly organizationId: string,
    private readonly chatbotConfigId: string,
    loggingService: IChatbotLoggingService
  ) {
    // Initialize domain services
    this.securityService = new KnowledgeSecurityDomainService();
    
    // Security: Validate organization context during construction
    this.securityService.validateSecurityContext(this.organizationId, this.chatbotConfigId);

    this.retrievalOrchestrator = new KnowledgeRetrievalOrchestrator(
      vectorRepository,
      loggingService
    );
    this.statisticsService = new KnowledgeStatisticsService(
      vectorRepository,
      loggingService
    );
  }

  /**
   * Get knowledge items by category with security preservation
   */
  async getKnowledgeByCategory(
    category: string,
    context?: KnowledgeRetrievalContext,
    sharedLogFile?: string
  ): Promise<KnowledgeItem[]> {
    try {
      const query = KnowledgeQuery.createByCategory(
        this.organizationId, // Security: Use validated organization context
        this.chatbotConfigId,
        category,
        sharedLogFile
      );

      return await this.retrievalOrchestrator.getKnowledgeByCategory(query, context);

    } catch (error) {
      const errorContext = KnowledgeErrorHandler.createCategoryOperationContext(
        this.organizationId,
        this.chatbotConfigId,
        category
      );
      
      KnowledgeErrorHandler.handleKnowledgeRetrievalError(
        error,
        errorContext,
        'retrieve knowledge by category'
      );
    }
  }

  /**
   * Get knowledge items by tags with security preservation
   */
  async getKnowledgeByTags(
    tags: string[],
    context?: KnowledgeRetrievalContext,
    sharedLogFile?: string
  ): Promise<KnowledgeItem[]> {
    try {
      const query = KnowledgeQuery.createByTags(
        this.organizationId, // Security: Use validated organization context
        this.chatbotConfigId,
        tags,
        sharedLogFile
      );

      return await this.retrievalOrchestrator.getKnowledgeByTags(query, context);

    } catch (error) {
      const errorContext = KnowledgeErrorHandler.createTagOperationContext(
        this.organizationId,
        this.chatbotConfigId,
        tags
      );
      
      KnowledgeErrorHandler.handleKnowledgeRetrievalError(
        error,
        errorContext,
        'retrieve knowledge by tags'
      );
    }
  }

  /**
   * Get knowledge statistics with security preservation
   */
  async getKnowledgeStats(sharedLogFile?: string): Promise<KnowledgeStatsResult> {
    try {
      return await this.statisticsService.getKnowledgeStats(
        this.organizationId, // Security: Use validated organization context
        this.chatbotConfigId,
        sharedLogFile
      );

    } catch (error) {
      const errorContext = KnowledgeErrorHandler.createKnowledgeOperationContext(
        this.organizationId,
        this.chatbotConfigId,
        'getKnowledgeStats'
      );
      
      KnowledgeErrorHandler.handleKnowledgeStatisticsError(error, errorContext);
    }
  }

  /**
   * Delete knowledge by source with security preservation
   */
  async deleteKnowledgeBySource(
    sourceType: string,
    sourceUrl?: string,
    sharedLogFile?: string
  ): Promise<number> {
    try {
      const query = KnowledgeQuery.createBySource(
        this.organizationId, // Security: Use validated organization context
        this.chatbotConfigId,
        sourceType,
        sourceUrl,
        sharedLogFile
      );

      return await this.retrievalOrchestrator.deleteKnowledgeBySource(query);

    } catch (error) {
      const errorContext = KnowledgeErrorHandler.createSourceOperationContext(
        this.organizationId,
        this.chatbotConfigId,
        sourceType,
        sourceUrl
      );
      
      KnowledgeErrorHandler.handleKnowledgeDeletionError(error, errorContext);
    }
  }

  /**
   * Check health status with security preservation
   */
  async checkHealthStatus(sharedLogFile?: string): Promise<HealthCheckResult> {
    return await this.statisticsService.checkHealthStatus(
      this.organizationId, // Security: Use validated organization context
      this.chatbotConfigId,
      sharedLogFile
    );
  }

  /**
   * Get comprehensive health assessment
   */
  async getComprehensiveHealthAssessment(sharedLogFile?: string): Promise<{
    healthCheck: HealthCheckResult;
    statistics: KnowledgeStatsResult;
    assessment: {
      totalItems: number;
      healthScore: number;
      recommendations: string[];
    };
  }> {
    const result = await this.statisticsService.getComprehensiveHealthAssessment(
      this.organizationId, // Security: Use validated organization context
      this.chatbotConfigId,
      sharedLogFile
    );

    return {
      healthCheck: result.healthCheck,
      statistics: result.statistics,
      assessment: {
        totalItems: result.statistics.totalItems,
        healthScore: result.assessment.score,
        recommendations: result.assessment.recommendations
      }
    };
  }

  /**
   * Get unique categories for organization
   */
  async getUniqueCategories(sharedLogFile?: string): Promise<string[]> {
    return await this.retrievalOrchestrator.getUniqueCategories(
      this.organizationId, // Security: Use validated organization context
      this.chatbotConfigId,
      sharedLogFile
    );
  }

  /**
   * Get unique tags for organization
   */
  async getUniqueTags(sharedLogFile?: string): Promise<string[]> {
    return await this.retrievalOrchestrator.getUniqueTags(
      this.organizationId, // Security: Use validated organization context
      this.chatbotConfigId,
      sharedLogFile
    );
  }

  /**
   * Get performance metrics
   */
  async getPerformanceMetrics(sharedLogFile?: string): Promise<{
    responseTimeMs: number;
    throughputScore: number;
    availabilityScore: number;
    dataQualityScore: number;
    overallPerformanceScore: number;
  }> {
    return await this.statisticsService.getPerformanceMetrics(
      this.organizationId, // Security: Use validated organization context
      this.chatbotConfigId,
      sharedLogFile
    );
  }

}