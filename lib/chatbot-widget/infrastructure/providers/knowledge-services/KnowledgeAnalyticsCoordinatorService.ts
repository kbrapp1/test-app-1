/**
 * AI INSTRUCTIONS: (Only need AI instruction at the top of the file ONCE)
 * - Single responsibility: Coordinate advanced analytics operations
 * - Orchestrates multiple analytics services for comprehensive analysis
 * - Keep under 250 lines per @golden-rule patterns
 * - Use static methods for efficiency and statelessness
 * - Delegate all business logic to specialized services
 * - Handle error cases and provide meaningful summaries
 */

import { KnowledgeItem } from '../../../domain/services/interfaces/IKnowledgeRetrievalService';
import { KnowledgeStatisticsService } from './KnowledgeStatisticsService';
import { KnowledgeHealthService } from './utilities/KnowledgeHealthService';
import { KnowledgeMonitoringService } from './utilities/KnowledgeMonitoringService';
import { KnowledgeComparisonService } from './utilities/KnowledgeComparisonService';
import { KnowledgeInsightsService } from './analytics/KnowledgeInsightsService';
import { KnowledgeTrendsService } from './analytics/KnowledgeTrendsService';
import { KnowledgeContentAnalysisService } from './analytics/KnowledgeContentAnalysisService';
import { KnowledgeTagAnalysisService } from './analytics/KnowledgeTagAnalysisService';
import { KnowledgeContentCoordinatorService } from './analytics/KnowledgeContentCoordinatorService';
import { KnowledgeContentPerformanceService } from './analytics/KnowledgeContentPerformanceService';
import type { 
  QualityScoreResult,
  PerformanceMetrics
} from './analytics/KnowledgeContentPerformanceService';
import { 
  KnowledgeStats, 
  KnowledgeHealthMetrics, 
  KnowledgeInsights, 
  KnowledgeTrends,
  ContentAnalysisResult,
  TagAnalysisResult 
} from './types/KnowledgeServiceTypes';

export class KnowledgeAnalyticsCoordinatorService {

  // Advanced Analytics Operations
  static async generateInsights(items: KnowledgeItem[]): Promise<KnowledgeInsights> {
    this.validateItems(items);
    return await KnowledgeInsightsService.generateInsights(items);
  }

  static async analyzeTrends(items: KnowledgeItem[]): Promise<KnowledgeTrends> {
    this.validateItems(items);
    return await KnowledgeTrendsService.analyzeTrends(items);
  }

  static async analyzeContent(items: KnowledgeItem[]): Promise<ContentAnalysisResult> {
    this.validateItems(items);
    return await KnowledgeContentAnalysisService.analyzeContent(items);
  }

  static async analyzeTags(items: KnowledgeItem[]): Promise<TagAnalysisResult> {
    this.validateItems(items);
    return await KnowledgeTagAnalysisService.analyzeTags(items);
  }

  // Quality Assessment Operations
  static async generateQualityScore(items: KnowledgeItem[]): Promise<QualityScoreResult> {
    this.validateItems(items);
    return await KnowledgeContentPerformanceService.generateQualityScore(items);
  }

  static getPerformanceMetrics(items: KnowledgeItem[], processingTime: number): PerformanceMetrics {
    this.validateItems(items);
    return KnowledgeContentPerformanceService.getPerformanceMetrics(items, processingTime);
  }

  // Comprehensive Analysis Operations
  static async generateCompleteAnalysis(items: KnowledgeItem[]): Promise<{
    basicStats: KnowledgeStats;
    healthMetrics: KnowledgeHealthMetrics;
    insights: KnowledgeInsights;
    trends: KnowledgeTrends;
    qualityScore: QualityScoreResult;
    performanceMetrics: PerformanceMetrics;
    contentAnalysis: ContentAnalysisResult;
    tagAnalysis: TagAnalysisResult;
  }> {
    this.validateItems(items);
    
    const startTime = Date.now();
    
    // Execute all analyses in parallel for better performance
    const [
      basicStats,
      healthMetrics,
      insights,
      trends,
      contentAnalysis,
      tagAnalysis
    ] = await Promise.all([
      KnowledgeStatisticsService.getBasicStats(items),
      KnowledgeStatisticsService.getHealthMetrics(items),
      this.generateInsights(items),
      this.analyzeTrends(items),
      this.analyzeContent(items),
      this.analyzeTags(items)
    ]);

    const processingTime = Date.now() - startTime;
    const qualityScore = await this.generateQualityScore(items);
    const performanceMetrics = this.getPerformanceMetrics(items, processingTime);

    return {
      basicStats,
      healthMetrics,
      insights,
      trends,
      qualityScore,
      performanceMetrics,
      contentAnalysis,
      tagAnalysis
    };
  }

  // Summary Operations
  static async generateStatsSummary(items: KnowledgeItem[]): Promise<{
    overview: {
      totalItems: number;
      overallQuality: number;
      healthScore: number;
      lastAnalysisDate: Date;
    };
    keyMetrics: {
      contentCoverage: number;
      tagCoverage: number;
      averageQuality: number;
      duplicateRate: number;
    };
    recommendations: string[];
    alerts: string[];
  }> {
    this.validateItems(items);
    
    const [basicStats, qualityScore, healthMetrics, insights] = await Promise.all([
      KnowledgeStatisticsService.getBasicStats(items),
      this.generateQualityScore(items),
      KnowledgeStatisticsService.getHealthMetrics(items),
      this.generateInsights(items)
    ]);

    const overview = {
      totalItems: basicStats.totalItems,
      overallQuality: qualityScore.overallScore,
      healthScore: healthMetrics.overallHealth,
      lastAnalysisDate: new Date()
    };

    const keyMetrics = {
      contentCoverage: healthMetrics.contentCoverage,
      tagCoverage: healthMetrics.tagCoverage,
      averageQuality: qualityScore.overallScore,
      duplicateRate: healthMetrics.duplicateRate
    };

    const recommendations = [
      ...insights.recommendations,
      ...qualityScore.recommendations
    ];

    const healthAlerts = KnowledgeMonitoringService.generateHealthAlerts(items);
    const alerts = healthAlerts.map(alert => alert.message);

    return {
      overview,
      keyMetrics,
      recommendations,
      alerts
    };
  }

  // Health Reporting Operations - Delegate to Health Report Service
  static async generateHealthReport(items: KnowledgeItem[]): Promise<{
    status: 'healthy' | 'warning' | 'critical';
    score: number;
    issues: Array<{ type: string; severity: string; description: string; count: number }>;
    recommendations: string[];
    timestamp: Date;
  }> {
    const healthSummary = KnowledgeHealthService.getHealthSummary(items);
    const batchHealth = KnowledgeHealthService.calculateBatchHealth(items);
    
    const status = healthSummary.score >= 75 ? 'healthy' : 
                   healthSummary.score >= 50 ? 'warning' : 'critical';
    
    const issues = [];
    if (batchHealth.staleCount > 0) {
      issues.push({
        type: 'stale_content',
        severity: 'medium',
        description: 'Content items not updated in 90+ days',
        count: batchHealth.staleCount
      });
    }
    
    if (batchHealth.poorCount > 0) {
      issues.push({
        type: 'poor_quality',
        severity: 'high',
        description: 'Content items with poor quality scores',
        count: batchHealth.poorCount
      });
    }
    
    const recommendations = [];
    if (batchHealth.staleCount > 0) {
      recommendations.push('Update or archive stale content');
    }
    if (batchHealth.poorCount > 0) {
      recommendations.push('Improve content quality for low-scoring items');
    }
    
    return {
      status,
      score: healthSummary.score,
      issues,
      recommendations,
      timestamp: new Date()
    };
  }

  // Knowledge Base Comparison Operations
  static async compareKnowledgeBases(
    currentItems: KnowledgeItem[],
    previousItems: KnowledgeItem[]
  ): Promise<{
    growth: {
      itemsAdded: number;
      itemsRemoved: number;
      netGrowth: number;
      growthRate: number;
    };
    qualityChange: {
      currentScore: number;
      previousScore: number;
      improvement: number;
      trend: 'improving' | 'declining' | 'stable';
    };
    recommendations: string[];
  }> {
    this.validateItems(currentItems);
    this.validateItems(previousItems);
    
    const comparison = KnowledgeComparisonService.getComparisonSummary(currentItems, previousItems);
    
    return {
      growth: comparison.growth,
      qualityChange: {
        currentScore: comparison.health.currentScore,
        previousScore: comparison.health.previousScore,
        improvement: comparison.health.improvement,
        trend: comparison.health.trend
      },
      recommendations: comparison.recommendations
    };
  }

  // Helper Methods
  private static validateItems(items: KnowledgeItem[]): void {
    if (!Array.isArray(items)) {
      throw new Error('Items must be an array');
    }
    
    if (items.length === 0) {
      throw new Error('Items array cannot be empty');
    }
  }

  private static validateNonEmpty(items: KnowledgeItem[]): void {
    if (!items || items.length === 0) {
      throw new Error('Cannot perform analysis on empty knowledge base');
    }
  }
} 