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
import { BusinessRuleViolationError } from '../../../domain/errors/ChatbotWidgetDomainErrors';
import { KnowledgeQuery } from '../../../domain/value-objects/knowledge/KnowledgeQuery';
import { KnowledgeStatsResult } from '../../../domain/value-objects/knowledge/KnowledgeStatsResult';
import { HealthCheckResult } from '../../../domain/value-objects/knowledge/HealthCheckResult';
import { KnowledgeRetrievalOrchestrator } from './KnowledgeRetrievalOrchestrator';
import { KnowledgeStatisticsService } from './KnowledgeStatisticsService';

export class KnowledgeManagementApplicationService {
  private readonly retrievalOrchestrator: KnowledgeRetrievalOrchestrator;
  private readonly statisticsService: KnowledgeStatisticsService;

  constructor(
    private readonly vectorRepository: IVectorKnowledgeRepository,
    private readonly organizationId: string,
    private readonly chatbotConfigId: string,
    loggingService: IChatbotLoggingService
  ) {
    // Security: Validate organization context during construction
    this.validateSecurityContext();

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
      if (error instanceof Error && error.message.includes('required')) {
        throw new BusinessRuleViolationError(
          error.message,
          { 
            category, 
            organizationId: this.organizationId,
            chatbotConfigId: this.chatbotConfigId
          }
        );
      }
      
      throw new BusinessRuleViolationError(
        'Failed to retrieve knowledge by category',
        { 
          error: error instanceof Error ? error.message : 'Unknown error',
          category,
          organizationId: this.organizationId,
          chatbotConfigId: this.chatbotConfigId
        }
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
      if (error instanceof Error && error.message.includes('required')) {
        throw new BusinessRuleViolationError(
          error.message,
          { 
            tags, 
            organizationId: this.organizationId,
            chatbotConfigId: this.chatbotConfigId
          }
        );
      }
      
      throw new BusinessRuleViolationError(
        'Failed to retrieve knowledge by tags',
        { 
          error: error instanceof Error ? error.message : 'Unknown error',
          tags,
          organizationId: this.organizationId,
          chatbotConfigId: this.chatbotConfigId
        }
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
      throw new BusinessRuleViolationError(
        'Failed to retrieve knowledge statistics',
        { 
          error: error instanceof Error ? error.message : 'Unknown error',
          organizationId: this.organizationId,
          chatbotConfigId: this.chatbotConfigId
        }
      );
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
      if (error instanceof Error && error.message.includes('required')) {
        throw new BusinessRuleViolationError(
          error.message,
          { 
            sourceType, 
            sourceUrl,
            organizationId: this.organizationId,
            chatbotConfigId: this.chatbotConfigId
          }
        );
      }
      
      throw new BusinessRuleViolationError(
        'Failed to delete knowledge by source',
        { 
          error: error instanceof Error ? error.message : 'Unknown error',
          sourceType,
          sourceUrl,
          organizationId: this.organizationId,
          chatbotConfigId: this.chatbotConfigId
        }
      );
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
    assessment: any;
  }> {
    return await this.statisticsService.getComprehensiveHealthAssessment(
      this.organizationId, // Security: Use validated organization context
      this.chatbotConfigId,
      sharedLogFile
    );
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

  /**
   * Security: Validate organization and chatbot config context
   */
  private validateSecurityContext(): void {
    if (!this.organizationId?.trim()) {
      throw new BusinessRuleViolationError(
        'Organization ID is required for knowledge management service initialization',
        { providedOrganizationId: this.organizationId }
      );
    }

    if (!this.chatbotConfigId?.trim()) {
      throw new BusinessRuleViolationError(
        'Chatbot config ID is required for knowledge management service initialization',
        { 
          organizationId: this.organizationId,
          providedChatbotConfigId: this.chatbotConfigId
        }
      );
    }

    // Security: Additional validation for organization ID format
    if (!/^[a-zA-Z0-9\-_]+$/.test(this.organizationId)) {
      throw new BusinessRuleViolationError(
        'Invalid organization ID format',
        { organizationId: this.organizationId }
      );
    }

    if (!/^[a-zA-Z0-9\-_]+$/.test(this.chatbotConfigId)) {
      throw new BusinessRuleViolationError(
        'Invalid chatbot config ID format',
        { 
          organizationId: this.organizationId,
          chatbotConfigId: this.chatbotConfigId
        }
      );
    }
  }
}