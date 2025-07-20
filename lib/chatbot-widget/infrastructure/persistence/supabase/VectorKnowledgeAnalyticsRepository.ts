import { SupabaseClient } from '@supabase/supabase-js';
import { IVectorKnowledgeAnalyticsRepository } from '../../../domain/repositories/IVectorKnowledgeAnalyticsRepository';
import { BusinessRuleViolationError } from '../../../domain/errors/ChatbotWidgetDomainErrors';
import { VectorStatisticsService } from '../../services/VectorStatisticsService';
import { VectorQueryContext } from '../../types/VectorRepositoryTypes';

/**
 * Vector Knowledge Analytics Repository Implementation
 * 
 * AI INSTRUCTIONS:
 * - Handles all analytics operations for vector knowledge
 * - Delegates to VectorStatisticsService for implementation
 * - Maintains clean separation of concerns
 * - Focuses on metrics, statistics, and health monitoring
 * - Support multi-tenant isolation by organization
 * - Keep under 100 lines per DDD splitting guidelines
 */
export class VectorKnowledgeAnalyticsRepository implements IVectorKnowledgeAnalyticsRepository {
  private readonly statisticsService: VectorStatisticsService;

  constructor(private supabase: SupabaseClient) {
    this.statisticsService = new VectorStatisticsService(supabase);
  }

  /** Get knowledge item statistics and analytics */
  async getKnowledgeItemStats(
    organizationId: string,
    chatbotConfigId: string
  ): Promise<{
    totalItems: number;
    itemsBySourceType: Record<string, number>;
    itemsByCategory: Record<string, number>;
    lastUpdated: Date | null;
    storageSize: number;
  }> {
    try {
      const context: VectorQueryContext = { organizationId, chatbotConfigId };
      return await this.statisticsService.getKnowledgeItemStats(context);
    } catch (error) {
      throw new BusinessRuleViolationError(
        `Failed to get knowledge vector statistics: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { organizationId, chatbotConfigId }
      );
    }
  }

  /** Get storage optimization metrics */
  async getStorageOptimizationMetrics(
    organizationId: string,
    chatbotConfigId: string
  ): Promise<{
    averageVectorSize: number;
    totalVectorCount: number;
    duplicateContentCount: number;
    unusedVectorCount: number;
    storageEfficiency: number;
    recommendations: string[];
  }> {
    try {
      const context: VectorQueryContext = { organizationId, chatbotConfigId };
      return await this.statisticsService.getStorageOptimizationMetrics(context);
    } catch (error) {
      throw new BusinessRuleViolationError(
        `Failed to get storage optimization metrics: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { organizationId, chatbotConfigId }
      );
    }
  }

  /**
   * Get knowledge base health metrics
   * 
   * AI INSTRUCTIONS:
   * - Delegate to VectorStatisticsService for health analysis
   * - Provide comprehensive health monitoring
   * - Support proactive maintenance strategies
   * - Handle content freshness tracking
   * - Enable operational insights
   */
  async getKnowledgeBaseHealthMetrics(
    organizationId: string,
    chatbotConfigId: string
  ): Promise<{
    healthScore: number;
    staleContentCount: number;
    recentUpdatesCount: number;
    contentFreshness: 'excellent' | 'good' | 'fair' | 'poor';
    maintenanceNeeded: boolean;
    recommendations: string[];
  }> {
    try {
      const context: VectorQueryContext = { organizationId, chatbotConfigId };
      return await this.statisticsService.getKnowledgeBaseHealthMetrics(context);
    } catch (error) {
      throw new BusinessRuleViolationError(
        `Failed to get knowledge base health metrics: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { organizationId, chatbotConfigId }
      );
    }
  }
}