/**
 * Knowledge Statistics Service
 * 
 * AI INSTRUCTIONS:
 * - Application layer service for statistics coordination
 * - Orchestrates domain services for statistics collection
 * - Single responsibility: statistics orchestration
 * - Preserves organization security throughout
 */

import { IVectorKnowledgeRepository } from '../../../domain/repositories/IVectorKnowledgeRepository';
import { KnowledgeValidationService } from '../../../domain/services/knowledge/KnowledgeValidationService';
import { KnowledgeHealthChecker, HealthCheckInput } from '../../../domain/services/knowledge/KnowledgeHealthChecker';
import { KnowledgeStatsResult, KnowledgeStatsData } from '../../../domain/value-objects/knowledge/KnowledgeStatsResult';
import { HealthCheckResult } from '../../../domain/value-objects/knowledge/HealthCheckResult';
import { IChatbotLoggingService } from '../../../domain/services/interfaces/IChatbotLoggingService';

export class KnowledgeStatisticsService {
  private readonly validationService: KnowledgeValidationService;
  private readonly healthChecker: KnowledgeHealthChecker;

  constructor(
    private readonly vectorRepository: IVectorKnowledgeRepository,
    private readonly loggingService: IChatbotLoggingService
  ) {
    this.validationService = new KnowledgeValidationService();
    this.healthChecker = new KnowledgeHealthChecker();
  }

  /**
   * Get comprehensive knowledge statistics with security validation
   */
  async getKnowledgeStats(
    organizationId: string,
    chatbotConfigId: string,
    sharedLogFile?: string
  ): Promise<KnowledgeStatsResult> {
    // Validate parameters with security checks
    this.validationService.validateCommonParameters(organizationId, chatbotConfigId, sharedLogFile);

    // Create operation logger with security context
    const logger = this.loggingService.createOperationLogger(
      'knowledge-stats',
      sharedLogFile!,
      {
        operation: 'getKnowledgeStats',
        organizationId // Security: Include organization context
      }
    );

    logger.addContext('stage', 'Retrieving knowledge statistics');

    try {
      // Security: Pass organization and config IDs for tenant isolation
      const stats = await this.vectorRepository.getKnowledgeItemStats(
        organizationId,
        chatbotConfigId
      );

      // Create domain value object with validated data
      const statsData: KnowledgeStatsData = {
        totalItems: stats.totalItems,
        itemsBySourceType: stats.itemsBySourceType,
        itemsByCategory: stats.itemsByCategory,
        lastUpdated: stats.lastUpdated,
        storageSize: stats.storageSize,
        organizationId, // Security: Preserve organization context
        chatbotConfigId
      };

      const result = KnowledgeStatsResult.create(statsData);

      logger.addContext('results', `Total items: ${stats.totalItems}, Categories: ${Object.keys(stats.itemsByCategory).length}`);
      logger.complete({ 
        totalItems: stats.totalItems, 
        categories: Object.keys(stats.itemsByCategory).length,
        sourceTypes: Object.keys(stats.itemsBySourceType).length
      });

      return result;

    } catch (error) {
      logger.addContext('error', error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }

  /**
   * Perform health check with comprehensive validation
   */
  async checkHealthStatus(
    organizationId: string,
    chatbotConfigId: string,
    sharedLogFile?: string
  ): Promise<HealthCheckResult> {
    // Validate parameters with security checks
    this.validationService.validateCommonParameters(organizationId, chatbotConfigId, sharedLogFile);

    // Create operation logger with security context
    const logger = this.loggingService.createOperationLogger(
      'health-check',
      sharedLogFile!,
      {
        operation: 'checkHealthStatus',
        organizationId // Security: Include organization context
      }
    );

    logger.addContext('stage', 'Performing health check');

    try {
      const startTime = Date.now();
      
      // Security: Pass organization and config IDs for tenant isolation
      const stats = await this.vectorRepository.getKnowledgeItemStats(
        organizationId,
        chatbotConfigId
      );
      
      const responseTime = Date.now() - startTime;

      // Prepare health check input with security context
      const healthCheckInput: HealthCheckInput = {
        organizationId, // Security: Preserve organization context
        chatbotConfigId,
        responseTimeMs: responseTime,
        totalItems: stats.totalItems,
        lastUpdated: stats.lastUpdated
      };

      // Use domain service for health assessment
      const result = this.healthChecker.performHealthCheck(healthCheckInput);

      logger.addContext('results', `Health check ${result.isHealthy() ? 'passed' : 'failed'} in ${responseTime}ms`);
      logger.complete({ 
        status: result.status, 
        responseTime, 
        totalItems: stats.totalItems,
        healthScore: result.getHealthScore()
      });

      return result;

    } catch (error) {
      // Create unhealthy result for failed health checks
      const result = HealthCheckResult.createUnhealthy(
        organizationId,
        chatbotConfigId,
        error instanceof Error ? error.message : 'Unknown health check error'
      );

      logger.addContext('error', error instanceof Error ? error.message : 'Unknown error');
      logger.complete({ status: 'unhealthy', error: result.error });

      return result;
    }
  }

  /**
   * Get comprehensive health assessment with detailed metrics
   */
  async getComprehensiveHealthAssessment(
    organizationId: string,
    chatbotConfigId: string,
    sharedLogFile?: string
  ): Promise<{
    healthCheck: HealthCheckResult;
    statistics: KnowledgeStatsResult;
    assessment: any;
  }> {
    // Validate parameters
    this.validationService.validateCommonParameters(organizationId, chatbotConfigId, sharedLogFile);

    // Get both health check and statistics
    const [healthCheck, statistics] = await Promise.all([
      this.checkHealthStatus(organizationId, chatbotConfigId, sharedLogFile),
      this.getKnowledgeStats(organizationId, chatbotConfigId, sharedLogFile)
    ]);

    // Generate comprehensive assessment
    const healthCheckInput: HealthCheckInput = {
      organizationId,
      chatbotConfigId,
      responseTimeMs: healthCheck.responseTimeMs,
      totalItems: statistics.totalItems,
      lastUpdated: statistics.lastUpdated
    };

    const assessment = this.healthChecker.getComprehensiveAssessment(healthCheckInput);

    return {
      healthCheck,
      statistics,
      assessment
    };
  }

  /**
   * Get organization summary with security validation
   */
  async getOrganizationSummary(organizationId: string): Promise<{
    organizationId: string;
    totalChatbots: number;
    totalKnowledgeItems: number;
    averageItemsPerChatbot: number;
    healthStatus: 'healthy' | 'warning' | 'unhealthy';
  }> {
    // Validate organization ID
    this.validationService.validateOrganizationId(organizationId);

    // Note: This would require repository method to get all chatbots for organization
    // For now, throw an error indicating this needs repository support
    throw new Error('Organization summary requires repository method to list all chatbots for organization');
  }

  /**
   * Get performance metrics with security validation
   */
  async getPerformanceMetrics(
    organizationId: string,
    chatbotConfigId: string,
    sharedLogFile?: string
  ): Promise<{
    responseTimeMs: number;
    throughputScore: number;
    availabilityScore: number;
    dataQualityScore: number;
    overallPerformanceScore: number;
  }> {
    // Validate parameters
    this.validationService.validateCommonParameters(organizationId, chatbotConfigId, sharedLogFile);

    const healthCheck = await this.checkHealthStatus(organizationId, chatbotConfigId, sharedLogFile);
    const statistics = await this.getKnowledgeStats(organizationId, chatbotConfigId, sharedLogFile);

    // Calculate performance metrics using business rules
    const responseTimeMs = healthCheck.responseTimeMs;
    const throughputScore = this.calculateThroughputScore(responseTimeMs);
    const availabilityScore = healthCheck.isHealthy() ? 100 : 0;
    const dataQualityScore = this.calculateDataQualityScore(statistics);
    const overallPerformanceScore = (throughputScore + availabilityScore + dataQualityScore) / 3;

    return {
      responseTimeMs,
      throughputScore,
      availabilityScore,
      dataQualityScore,
      overallPerformanceScore
    };
  }

  /**
   * Calculate throughput score based on response time
   */
  private calculateThroughputScore(responseTimeMs: number): number {
    if (responseTimeMs < 500) return 100;
    if (responseTimeMs < 1000) return 90;
    if (responseTimeMs < 2000) return 70;
    if (responseTimeMs < 5000) return 50;
    return 20;
  }

  /**
   * Calculate data quality score based on statistics
   */
  private calculateDataQualityScore(statistics: KnowledgeStatsResult): number {
    let score = 100;

    // Deduct points for empty knowledge base
    if (statistics.isEmpty()) {
      return 0;
    }

    // Deduct points for lack of diversity
    const diversityScore = statistics.getDiversityScore();
    score -= (1 - diversityScore) * 30;

    // Deduct points for stale content
    if (statistics.needsUpdate()) {
      score -= 20;
    }

    return Math.max(0, Math.round(score));
  }
}