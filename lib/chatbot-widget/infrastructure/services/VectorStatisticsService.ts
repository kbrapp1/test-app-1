/**
 * Vector Statistics Service
 * 
 * AI INSTRUCTIONS: (Only need AI instruction at the top of the file ONCE)
 * - Single responsibility: Aggregate vector statistics from multiple specialized calculators
 * - Infrastructure service orchestrating specialized analytics services
 * - Keep business logic pure, delegate to specialized services
 * - Never exceed 250 lines per @golden-rule
 * - Coordinate between query, calculation, and metrics services
 * - Handle error aggregation and context management
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { BusinessRuleViolationError } from '../../domain/errors/ChatbotWidgetDomainErrors';
import {
  VectorKnowledgeStats,
  VectorQueryContext,
  SupabaseVectorRow
} from '../types/VectorRepositoryTypes';
import { VectorStatisticsQueryService } from './VectorStatisticsQueryService';
import { VectorMetricsCalculatorService } from './VectorMetricsCalculatorService';
import { VectorStorageAnalyticsService } from './VectorStorageAnalyticsService';

export class VectorStatisticsService {
  private queryService: VectorStatisticsQueryService;
  private metricsCalculator: VectorMetricsCalculatorService;
  private storageAnalytics: VectorStorageAnalyticsService;
  
  constructor(private supabase: SupabaseClient) {
    this.queryService = new VectorStatisticsQueryService(supabase);
    this.metricsCalculator = new VectorMetricsCalculatorService();
    this.storageAnalytics = new VectorStorageAnalyticsService();
  }

  async getKnowledgeItemStats(context: VectorQueryContext): Promise<VectorKnowledgeStats> {
    try {
      // Delegate data collection to query service
      const rawData = await this.queryService.getBasicStatisticsData(context);
      
      // Delegate calculations to metrics calculator
      const basicStats = this.metricsCalculator.calculateBasicStatistics(rawData);
      
      // Get storage size through query service
      const storageSize = await this.queryService.getStorageSize(context);

      return {
        totalItems: basicStats.totalItems,
        itemsBySourceType: basicStats.itemsBySourceType,
        itemsByCategory: basicStats.itemsByCategory,
        lastUpdated: basicStats.lastUpdated,
        storageSize
      };
    } catch (error) {
      throw new BusinessRuleViolationError(
        `Failed to get knowledge vector statistics: ${error instanceof Error ? error.message : 'Unknown error'}`,
        context
      );
    }
  }

  /**
   * Get vector storage optimization metrics
   * 
   * AI INSTRUCTIONS:
   * - Delegate data collection to query service
   * - Use storage analytics service for calculations
   * - Coordinate between specialized services
   * - Handle error context and propagation
   * - Provide optimization insights interface
   */
  async getStorageOptimizationMetrics(context: VectorQueryContext): Promise<{
    averageVectorSize: number;
    totalVectorCount: number;
    duplicateContentCount: number;
    unusedVectorCount: number;
    storageEfficiency: number;
    recommendations: string[];
  }> {
    try {
      // Delegate data collection to query service
      const rawData = await this.queryService.getOptimizationData(context);

      // Delegate calculations to storage analytics service
      return this.storageAnalytics.calculateOptimizationMetrics(rawData);
    } catch (error) {
      throw new BusinessRuleViolationError(
        `Failed to calculate storage optimization metrics: ${error instanceof Error ? error.message : 'Unknown error'}`,
        context
      );
    }
  }

  /**
   * Get knowledge base health metrics
   * 
   * AI INSTRUCTIONS:
   * - Delegate data collection to query service
   * - Use metrics calculator for health analysis
   * - Coordinate between specialized services
   * - Handle error context and propagation
   * - Provide health monitoring interface
   */
  async getKnowledgeBaseHealthMetrics(context: VectorQueryContext): Promise<{
    healthScore: number;
    staleContentCount: number;
    recentUpdatesCount: number;
    contentFreshness: 'excellent' | 'good' | 'fair' | 'poor';
    maintenanceNeeded: boolean;
    recommendations: string[];
  }> {
    try {
      // Delegate data collection to query service
      const rawData = await this.queryService.getHealthMetricsData(context);

      // Delegate calculations to metrics calculator
      return this.metricsCalculator.calculateHealthMetrics(rawData);
    } catch (error) {
      throw new BusinessRuleViolationError(
        `Failed to calculate knowledge base health metrics: ${error instanceof Error ? error.message : 'Unknown error'}`,
        context
      );
    }
  }

  /**
   * Get usage analytics and patterns
   * 
   * AI INSTRUCTIONS:
   * - Delegate data collection to query service
   * - Use metrics calculator for usage analysis
   * - Coordinate between specialized services
   * - Handle error context and propagation
   * - Provide usage analytics interface
   */
  async getUsageAnalytics(context: VectorQueryContext): Promise<{
    mostAccessedCategories: Array<{ category: string; accessCount: number }>;
    leastUsedContent: Array<{ id: string; title: string; lastAccessed: Date | null }>;
    contentUtilization: number;
    popularityTrends: Array<{ period: string; accessCount: number }>;
  }> {
    try {
      // Delegate data collection to query service
      const rawData = await this.queryService.getUsageAnalyticsData(context);

      // Delegate calculations to metrics calculator
      return this.metricsCalculator.calculateUsageAnalytics(rawData);
    } catch (error) {
      throw new BusinessRuleViolationError(
        `Failed to calculate usage analytics: ${error instanceof Error ? error.message : 'Unknown error'}`,
        context
      );
    }
  }

} 