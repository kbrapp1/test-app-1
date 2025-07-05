/**
 * Prompt Performance Reporting Service
 * 
 * AI INSTRUCTIONS:
 * - Application service for report generation and trend analysis
 * - Orchestrates domain services for comprehensive reporting
 * - Keep under 250 lines by focusing on coordination
 * - Follow @golden-rule patterns exactly
 * - Single responsibility: performance reporting and trend analysis
 */

import { PromptTokenAnalysisDomainService } from '../../domain/services/ai-configuration/PromptTokenAnalysisDomainService';
import { PromptEffectivenessAnalysisDomainService } from '../../domain/services/ai-configuration/PromptEffectivenessAnalysisDomainService';
import { PromptOptimizationRecommendationService } from './PromptOptimizationRecommendationService';
import {
  PromptPerformanceAnalysis,
  PromptPerformanceReport,
  PerformanceTrends,
  TrendData,
  BenchmarkComparisons,
  BenchmarkComparison,
  ConsolidatedRecommendations,
  RecommendationSummary,
  OptimizationRecommendation,
  PERFORMANCE_THRESHOLDS
} from '../../domain/services/ai-configuration/types/PromptPerformanceTypes';

export class PromptPerformanceReportingService {
  
  /**
   * Generate comprehensive performance report
   * 
   * AI INSTRUCTIONS:
   * - Orchestrate all analysis services for complete report
   * - Include current performance, trends, and recommendations
   * - Provide actionable insights for optimization
   */
  static generatePerformanceReport(analyses: PromptPerformanceAnalysis[]): PromptPerformanceReport {
    if (analyses.length === 0) {
      throw new Error('Cannot generate report without performance analyses');
    }

    const latest = analyses[0];
    
    return {
      currentPerformance: latest,
      trends: this.calculateTrends(analyses),
      benchmarks: this.getBenchmarkComparisons(latest),
      recommendations: this.consolidateRecommendations(analyses),
      generatedAt: new Date()
    };
  }

  /**
   * Calculate performance trends across analyses
   */
  private static calculateTrends(analyses: PromptPerformanceAnalysis[]): PerformanceTrends {
    if (analyses.length < 2) {
      return {
        tokenEfficiency: { trend: 'stable', change: 0 },
        responseRelevance: { trend: 'stable', change: 0 },
        overallScore: { trend: 'stable', change: 0 }
      };
    }

    const current = analyses[0];
    const previous = analyses[1];

    return {
      tokenEfficiency: this.calculateTrend(current.tokenAnalysis.efficiency, previous.tokenAnalysis.efficiency),
      responseRelevance: this.calculateTrend(current.effectivenessAnalysis.responseRelevance, previous.effectivenessAnalysis.responseRelevance),
      overallScore: this.calculateTrend(current.overallScore, previous.overallScore)
    };
  }

  /**
   * Calculate individual trend data
   */
  private static calculateTrend(current: number, previous: number): TrendData {
    const change = current - previous;
    const changePercent = previous === 0 ? 0 : (change / previous) * 100;

    let trend: 'improving' | 'stable' | 'declining';
    if (Math.abs(changePercent) < 2) {
      trend = 'stable';
    } else if (change > 0) {
      trend = 'improving';
    } else {
      trend = 'declining';
    }

    return { trend, change: changePercent };
  }

  /**
   * Get benchmark comparisons for current performance
   */
  private static getBenchmarkComparisons(analysis: PromptPerformanceAnalysis): BenchmarkComparisons {
    return {
      tokenEfficiency: this.createBenchmarkComparison(
        analysis.tokenAnalysis.efficiency,
        PERFORMANCE_THRESHOLDS.tokenEfficiency
      ),
      responseRelevance: this.createBenchmarkComparison(
        analysis.effectivenessAnalysis.responseRelevance,
        PERFORMANCE_THRESHOLDS.responseRelevance
      ),
      overallScore: this.createBenchmarkComparison(
        analysis.overallScore,
        0.8 // 80% overall target
      )
    };
  }

  /**
   * Create individual benchmark comparison
   */
  private static createBenchmarkComparison(current: number, benchmark: number): BenchmarkComparison {
    return {
      current,
      benchmark,
      status: current >= benchmark ? 'above' : 'below'
    };
  }

  /**
   * Consolidate recommendations across multiple analyses
   */
  private static consolidateRecommendations(analyses: PromptPerformanceAnalysis[]): ConsolidatedRecommendations {
    const allRecommendations = analyses.flatMap(analysis => analysis.optimizationRecommendations);
    
    // Group recommendations by type
    const grouped = this.groupRecommendationsByType(allRecommendations);
    
    // Create recommendation summaries
    const summaries = this.createRecommendationSummaries(grouped);
    
    // Categorize by priority
    return {
      immediate: summaries.filter(s => s.latestRecommendation.priority === 'high').slice(0, 3),
      planned: summaries.filter(s => s.latestRecommendation.priority === 'medium').slice(0, 5),
      future: summaries.filter(s => s.latestRecommendation.priority === 'low')
    };
  }

  /**
   * Group recommendations by type
   */
  private static groupRecommendationsByType(recommendations: OptimizationRecommendation[]): Record<string, OptimizationRecommendation[]> {
    return recommendations.reduce((acc, rec) => {
      if (!acc[rec.type]) acc[rec.type] = [];
      acc[rec.type].push(rec);
      return acc;
    }, {} as Record<string, OptimizationRecommendation[]>);
  }

  /**
   * Create recommendation summaries from grouped recommendations
   */
  private static createRecommendationSummaries(grouped: Record<string, OptimizationRecommendation[]>): RecommendationSummary[] {
    return Object.entries(grouped).map(([type, recommendations]) => ({
      type,
      frequency: recommendations.length,
      latestRecommendation: recommendations[0], // Most recent
      consistentIssue: recommendations.length >= 3 // Appears in 3+ analyses
    }));
  }

  /**
   * Calculate overall performance score
   * 
   * AI INSTRUCTIONS:
   * - Combine token efficiency and effectiveness scores
   * - Weight effectiveness higher than token efficiency
   * - Return normalized score between 0 and 1
   */
  static calculateOverallScore(tokenEfficiency: number, effectivenessScore: number): number {
    // Weighted average: 30% token efficiency, 70% effectiveness
    return (tokenEfficiency * 0.3) + (effectivenessScore * 0.7);
  }

  /**
   * Generate performance summary text
   */
  static generatePerformanceSummary(report: PromptPerformanceReport): string {
    const current = report.currentPerformance;
    const benchmarks = report.benchmarks;
    
    const tokenStatus = benchmarks.tokenEfficiency.status === 'above' ? 'optimal' : 'needs improvement';
    const effectivenessStatus = benchmarks.responseRelevance.status === 'above' ? 'excellent' : 'needs attention';
    
    const trendDescription = this.describeTrend(report.trends.overallScore);
    
    return `Performance is ${tokenStatus} for token efficiency (${(current.tokenAnalysis.efficiency * 100).toFixed(1)}%) and ${effectivenessStatus} for effectiveness (${(current.effectivenessAnalysis.responseRelevance * 100).toFixed(1)}%). Overall score: ${(current.overallScore * 100).toFixed(1)}% with ${trendDescription} trend.`;
  }

  /**
   * Describe trend in human-readable format
   */
  private static describeTrend(trend: TrendData): string {
    const changeText = Math.abs(trend.change).toFixed(1);
    
    switch (trend.trend) {
      case 'improving':
        return `improving (+${changeText}%)`;
      case 'declining':
        return `declining (-${changeText}%)`;
      case 'stable':
        return 'stable';
      default:
        return 'stable';
    }
  }

  /**
   * Get priority recommendations for immediate action
   */
  static getPriorityRecommendations(report: PromptPerformanceReport): OptimizationRecommendation[] {
    return report.recommendations.immediate
      .map(summary => summary.latestRecommendation)
      .sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        const impactOrder = { high: 3, medium: 2, low: 1 };
        
        const aScore = priorityOrder[a.priority] + impactOrder[a.impact];
        const bScore = priorityOrder[b.priority] + impactOrder[b.impact];
        
        return bScore - aScore;
      });
  }

  /**
   * Generate actionable improvement plan
   */
  static generateImprovementPlan(report: PromptPerformanceReport): ImprovementPlan {
    const priorityRecommendations = this.getPriorityRecommendations(report);
    
    return {
      immediate: priorityRecommendations.slice(0, 3),
      shortTerm: report.recommendations.planned.slice(0, 5).map(s => s.latestRecommendation),
      longTerm: report.recommendations.future.slice(0, 3).map(s => s.latestRecommendation),
      estimatedEffort: this.estimateOverallEffort(priorityRecommendations),
      expectedImpact: this.estimateOverallImpact(priorityRecommendations)
    };
  }

  /**
   * Estimate overall effort for recommendations
   */
  private static estimateOverallEffort(recommendations: OptimizationRecommendation[]): 'high' | 'medium' | 'low' {
    const effortScores = recommendations.map(r => {
      switch (r.effort) {
        case 'high': return 3;
        case 'medium': return 2;
        case 'low': return 1;
        default: return 2;
      }
    });
    
    const averageEffort = effortScores.reduce((sum, score) => sum + score, 0) / effortScores.length;
    
    if (averageEffort >= 2.5) return 'high';
    if (averageEffort >= 1.5) return 'medium';
    return 'low';
  }

  /**
   * Estimate overall impact for recommendations
   */
  private static estimateOverallImpact(recommendations: OptimizationRecommendation[]): 'high' | 'medium' | 'low' {
    const impactScores = recommendations.map(r => {
      switch (r.impact) {
        case 'high': return 3;
        case 'medium': return 2;
        case 'low': return 1;
        default: return 2;
      }
    });
    
    const averageImpact = impactScores.reduce((sum, score) => sum + score, 0) / impactScores.length;
    
    if (averageImpact >= 2.5) return 'high';
    if (averageImpact >= 1.5) return 'medium';
    return 'low';
  }
}

// Supporting interfaces
export interface ImprovementPlan {
  immediate: OptimizationRecommendation[];
  shortTerm: OptimizationRecommendation[];
  longTerm: OptimizationRecommendation[];
  estimatedEffort: 'high' | 'medium' | 'low';
  expectedImpact: 'high' | 'medium' | 'low';
} 