/**
 * AI INSTRUCTIONS: (Only need AI instruction at the top of the file ONCE)
 * - Single responsibility: High-level content analysis coordination and orchestration
 * - Keep business logic pure, no external dependencies
 * - Keep under 250 lines per @golden-rule patterns
 * - Use static methods for efficiency and statelessness
 * - Handle domain errors with specific error types
 * - Focus on comprehensive analysis coordination between specialized services
 * - Delegate specific tasks to specialized services
 */

import { KnowledgeItem } from '../../../../domain/services/interfaces/IKnowledgeRetrievalService';
import { ContentAnalysisResult } from '../types/KnowledgeServiceTypes';
import { KnowledgeContentStructureService } from './KnowledgeContentStructureService';
import { KnowledgeContentAnalysisService } from './KnowledgeContentAnalysisService';
import { KnowledgeReportingService, ContentSummary, ContentMetrics } from '../utilities/KnowledgeReportingService';
import { KnowledgeHealthService } from '../utilities/KnowledgeHealthService';
import { KnowledgeContentOptimizationService } from './KnowledgeContentOptimizationService';
import { KnowledgeUtilityService } from '../KnowledgeUtilityService';
import { KnowledgeQualityService } from '../utilities/KnowledgeQualityService';

export interface ComprehensiveContentAnalysis {
  basicAnalysis: ContentAnalysisResult;
  qualityAnalysis: ReturnType<typeof KnowledgeQualityService.analyzeContentQuality>;
  structureAnalysis: ReturnType<typeof KnowledgeContentStructureService.analyzeContentStructure>;
  hierarchyAnalysis: ReturnType<typeof KnowledgeContentStructureService.analyzeContentHierarchy>;
  flowAnalysis: ReturnType<typeof KnowledgeContentStructureService.analyzeContentFlow>;
  patternAnalysis: ReturnType<typeof KnowledgeContentStructureService.identifyContentPatterns>;
  consistencyAnalysis: ReturnType<typeof KnowledgeContentStructureService.calculateStructuralConsistency>;
  completenessAnalysis: ReturnType<typeof KnowledgeQualityService.assessContentCompleteness>;
  freshnessAnalysis: ReturnType<typeof KnowledgeQualityService.calculateContentFreshness>;
  gapAnalysis: ReturnType<typeof KnowledgeUtilityService.identifyContentGaps>;
}

export interface ContentManagementDashboard {
  summary: ContentSummary;
  health: ReturnType<typeof KnowledgeHealthService.getHealthSummary>;
  metrics: ContentMetrics;
  optimizationPlan: ReturnType<typeof KnowledgeContentOptimizationService.generateOptimizationPlan>;
  recommendations: ReturnType<typeof KnowledgeContentOptimizationService.generateOptimizationRecommendations>;
  lastUpdated: Date;
}

export interface ContentCoordinatorResult {
  qualityAnalysis: ReturnType<typeof KnowledgeQualityService.analyzeContentQuality>;
  structureAnalysis: {
    structureTypes: Record<string, number>;
    recommendations: string[];
  };
  completenessAnalysis: ReturnType<typeof KnowledgeQualityService.assessContentCompleteness>;
  freshnessAnalysis: ReturnType<typeof KnowledgeQualityService.calculateContentFreshness>;
  gapAnalysis: ReturnType<typeof KnowledgeUtilityService.identifyContentGaps>;
  overallAssessment: {
    score: number;
    recommendations: string[];
    status: 'excellent' | 'good' | 'needs_improvement' | 'poor';
  };
}

export class KnowledgeContentCoordinatorService {

  // Comprehensive content analysis combining all services
  static async analyzeContentComprehensive(items: KnowledgeItem[]): Promise<ComprehensiveContentAnalysis> {
    const basicAnalysis = await KnowledgeContentAnalysisService.analyzeContent(items);
    const qualityAnalysis = KnowledgeQualityService.analyzeContentQuality(items);
    const structureAnalysis = KnowledgeContentStructureService.analyzeContentStructure(items);
    const hierarchyAnalysis = KnowledgeContentStructureService.analyzeContentHierarchy(items);
    const flowAnalysis = KnowledgeContentStructureService.analyzeContentFlow(items);
    const patternAnalysis = KnowledgeContentStructureService.identifyContentPatterns(items);
    const consistencyAnalysis = KnowledgeContentStructureService.calculateStructuralConsistency(items);
    const completenessAnalysis = KnowledgeQualityService.assessContentCompleteness(items);
    const freshnessAnalysis = KnowledgeQualityService.calculateContentFreshness(items);
    const gapAnalysis = KnowledgeUtilityService.identifyContentGaps(items);

    return {
      basicAnalysis,
      qualityAnalysis,
      structureAnalysis,
      hierarchyAnalysis,
      flowAnalysis,
      patternAnalysis,
      consistencyAnalysis,
      completenessAnalysis,
      freshnessAnalysis,
      gapAnalysis
    };
  }

  // Content management dashboard combining all specialized services
  static generateContentManagementDashboard(items: KnowledgeItem[]): ContentManagementDashboard {
    const summary = KnowledgeReportingService.generateContentSummary(items);
    const health = KnowledgeHealthService.getHealthSummary(items);
    const metrics = KnowledgeReportingService.generateContentMetrics(items);
    const optimizationPlan = KnowledgeContentOptimizationService.generateOptimizationPlan(items);
    const recommendations = KnowledgeContentOptimizationService.generateOptimizationRecommendations(items);

    return {
      summary,
      health,
      metrics,
      optimizationPlan,
      recommendations,
      lastUpdated: new Date()
    };
  }

  // Executive summary for stakeholders
  static generateExecutiveSummary(items: KnowledgeItem[]): {
    overallScore: number;
    status: 'excellent' | 'good' | 'needs_attention' | 'poor';
    keyInsights: string[];
    priorityActions: string[];
    businessImpact: {
      userExperience: 'positive' | 'neutral' | 'negative';
      contentEffectiveness: 'high' | 'medium' | 'low';
      maintenanceRequired: 'minimal' | 'moderate' | 'significant';
    };
    nextSteps: string[];
  } {
    const health = KnowledgeHealthService.getHealthSummary(items);
    const summary = KnowledgeReportingService.generateContentSummary(items);
    const optimizationMetrics = KnowledgeContentOptimizationService.calculateOptimizationMetrics(items);
    const priorityRecommendations = KnowledgeContentOptimizationService.generateOptimizationRecommendations(items)
      .filter(rec => rec.priority === 'high');

    const overallScore = Math.round(
      (health.score * 0.4 + summary.overallQualityScore * 0.3 + optimizationMetrics.currentScore * 0.3)
    );

    const keyInsights = [
      `Content health score: ${health.score}/100`,
      `${summary.totalItems} total content items analyzed`,
      `${optimizationMetrics.improvementOpportunity}% improvement opportunity identified`,
      ...summary.topStrengths.slice(0, 2)
    ];

    const priorityActions = [
      ...(health.issuesCount > 0 ? [`Address ${health.issuesCount} content issues`] : []),
      ...priorityRecommendations.slice(0, 2).map(rec => rec.recommendation)
    ];

    // Determine business impact
    const businessImpact = {
      userExperience: health.score >= 75 ? 'positive' : health.score >= 50 ? 'neutral' : 'negative' as 'positive' | 'neutral' | 'negative',
      contentEffectiveness: summary.overallQualityScore >= 70 ? 'high' : summary.overallQualityScore >= 50 ? 'medium' : 'low' as 'high' | 'medium' | 'low',
      maintenanceRequired: health.issuesCount <= 3 ? 'minimal' : health.issuesCount <= 7 ? 'moderate' : 'significant' as 'minimal' | 'moderate' | 'significant'
    };

    const nextSteps = [
      ...(health.issuesCount > 0 ? ['Review and address content health issues'] : []),
      'Schedule regular content health monitoring',
      'Implement content optimization recommendations'
    ];

    return {
      overallScore,
      status: health.status as 'excellent' | 'good' | 'needs_attention' | 'poor',
      keyInsights,
      priorityActions,
      businessImpact,
      nextSteps
    };
  }

  // Coordination method for batch content processing
  static async processBatchContentAnalysis(itemBatches: KnowledgeItem[][]): Promise<{
    batchResults: Array<{
      batchIndex: number;
      itemCount: number;
      analysis: ComprehensiveContentAnalysis;
      summary: ContentSummary;
      health: ReturnType<typeof KnowledgeHealthService.getHealthSummary>;
    }>;
    aggregatedResults: {
      totalItems: number;
      overallHealth: ReturnType<typeof KnowledgeHealthService.getHealthSummary>;
      combinedMetrics: ContentMetrics;
      consolidatedRecommendations: ReturnType<typeof KnowledgeContentOptimizationService.generateOptimizationRecommendations>;
    };
  }> {
    const batchResults = await Promise.all(
      itemBatches.map(async (batch, index) => ({
        batchIndex: index,
        itemCount: batch.length,
        analysis: await this.analyzeContentComprehensive(batch),
        summary: KnowledgeReportingService.generateContentSummary(batch),
        health: KnowledgeHealthService.getHealthSummary(batch)
      }))
    );

    // Aggregate all items for overall analysis
    const allItems = itemBatches.flat();
    const overallHealth = KnowledgeHealthService.getHealthSummary(allItems);
    const combinedMetrics = KnowledgeReportingService.generateContentMetrics(allItems);
    const consolidatedRecommendations = KnowledgeContentOptimizationService.generateOptimizationRecommendations(allItems);

    return {
      batchResults,
      aggregatedResults: {
        totalItems: allItems.length,
        overallHealth,
        combinedMetrics,
        consolidatedRecommendations
      }
    };
  }

  // Generate reports based on type
  static generateReport(items: KnowledgeItem[], reportType: 'summary' | 'detailed' | 'executive' | 'dashboard' | 'full'): any {
    switch (reportType) {
      case 'summary':
        return KnowledgeReportingService.generateContentSummary(items);
      case 'detailed':
        return KnowledgeReportingService.generateBasicReport(items);
      case 'executive':
        return this.generateExecutiveSummary(items);
      case 'dashboard':
        return this.generateContentManagementDashboard(items);
      default:
        return KnowledgeReportingService.generateBasicReport(items);
    }
  }

  // Quick health check for monitoring systems
  static quickHealthCheck(items: KnowledgeItem[]): {
    isHealthy: boolean;
    score: number;
    needsAttention: boolean;
    criticalIssues: number;
    status: string;
  } {
    const health = KnowledgeHealthService.getHealthSummary(items);
    
    return {
      isHealthy: health.isHealthy,
      score: health.score,
      needsAttention: !health.isHealthy,
      criticalIssues: health.issuesCount,
      status: health.status
    };
  }
} 