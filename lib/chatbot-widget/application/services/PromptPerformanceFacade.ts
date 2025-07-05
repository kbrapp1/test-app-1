/**
 * Prompt Performance Facade
 * 
 * AI INSTRUCTIONS:
 * - Clean unified interface for prompt performance analysis
 * - Orchestrates all domain and application services
 * - Keep under 250 lines by focusing on coordination
 * - Follow @golden-rule patterns exactly
 * - Single responsibility: unified performance analysis interface
 */

import { PromptTokenAnalysisDomainService } from '../../domain/services/ai-configuration/PromptTokenAnalysisDomainService';
import { PromptEffectivenessAnalysisDomainService } from '../../domain/services/ai-configuration/PromptEffectivenessAnalysisDomainService';
import { PromptOptimizationRecommendationService } from './PromptOptimizationRecommendationService';
import { PromptPerformanceReportingService, ImprovementPlan } from './PromptPerformanceReportingService';
import {
  PromptMetrics,
  PromptPerformanceAnalysis,
  PromptPerformanceReport,
  TokenAnalysis,
  EffectivenessAnalysis,
  OptimizationRecommendation
} from '../../domain/services/ai-configuration/types/PromptPerformanceTypes';

export class PromptPerformanceFacade {
  
  /**
   * Analyze prompt performance comprehensively
   * 
   * AI INSTRUCTIONS:
   * - Main entry point for performance analysis
   * - Orchestrate all analysis services
   * - Return complete performance analysis
   */
  static analyzePromptPerformance(metrics: PromptMetrics): PromptPerformanceAnalysis {
    // Analyze token usage
    const tokenAnalysis = PromptTokenAnalysisDomainService.analyzeTokenUsage(metrics);
    
    // Analyze effectiveness
    const effectivenessAnalysis = PromptEffectivenessAnalysisDomainService.analyzeEffectiveness(metrics);
    
    // Generate optimization recommendations
    const optimizationRecommendations = PromptOptimizationRecommendationService.generateOptimizationRecommendations(
      tokenAnalysis,
      effectivenessAnalysis
    );
    
    // Calculate overall score
    const effectivenessScore = PromptEffectivenessAnalysisDomainService.calculateOverallEffectivenessScore(effectivenessAnalysis);
    const overallScore = PromptPerformanceReportingService.calculateOverallScore(tokenAnalysis.efficiency, effectivenessScore);
    
    return {
      tokenAnalysis,
      effectivenessAnalysis,
      optimizationRecommendations,
      overallScore,
      timestamp: new Date()
    };
  }

  /**
   * Generate comprehensive performance report
   * 
   * AI INSTRUCTIONS:
   * - Generate report with trends and benchmarks
   * - Include actionable recommendations
   * - Provide performance insights
   */
  static generatePerformanceReport(analyses: PromptPerformanceAnalysis[]): PromptPerformanceReport {
    return PromptPerformanceReportingService.generatePerformanceReport(analyses);
  }

  /**
   * Get priority optimization recommendations
   * 
   * AI INSTRUCTIONS:
   * - Extract highest priority recommendations
   * - Focus on immediate actionable items
   * - Sort by business impact
   */
  static getPriorityRecommendations(report: PromptPerformanceReport): OptimizationRecommendation[] {
    return PromptPerformanceReportingService.getPriorityRecommendations(report);
  }

  /**
   * Generate actionable improvement plan
   * 
   * AI INSTRUCTIONS:
   * - Create structured improvement roadmap
   * - Categorize by timeframe and effort
   * - Provide implementation guidance
   */
  static generateImprovementPlan(report: PromptPerformanceReport): ImprovementPlan {
    return PromptPerformanceReportingService.generateImprovementPlan(report);
  }

  /**
   * Generate human-readable performance summary
   * 
   * AI INSTRUCTIONS:
   * - Create concise performance overview
   * - Include key metrics and trends
   * - Provide actionable insights
   */
  static generatePerformanceSummary(report: PromptPerformanceReport): string {
    return PromptPerformanceReportingService.generatePerformanceSummary(report);
  }

  /**
   * Analyze token usage only
   * 
   * AI INSTRUCTIONS:
   * - Focused token analysis for specific use cases
   * - Delegate to domain service
   * - Return detailed token breakdown
   */
  static analyzeTokenUsage(metrics: PromptMetrics): TokenAnalysis {
    return PromptTokenAnalysisDomainService.analyzeTokenUsage(metrics);
  }

  /**
   * Analyze effectiveness only
   * 
   * AI INSTRUCTIONS:
   * - Focused effectiveness analysis
   * - Delegate to domain service
   * - Return normalized effectiveness metrics
   */
  static analyzeEffectiveness(metrics: PromptMetrics): EffectivenessAnalysis {
    return PromptEffectivenessAnalysisDomainService.analyzeEffectiveness(metrics);
  }

  /**
   * Calculate overall effectiveness score
   * 
   * AI INSTRUCTIONS:
   * - Business-weighted effectiveness calculation
   * - Delegate to domain service
   * - Return normalized score
   */
  static calculateOverallEffectivenessScore(analysis: EffectivenessAnalysis): number {
    return PromptEffectivenessAnalysisDomainService.calculateOverallEffectivenessScore(analysis);
  }

  /**
   * Generate optimization recommendations
   * 
   * AI INSTRUCTIONS:
   * - Create actionable optimization plan
   * - Combine token and effectiveness insights
   * - Prioritize by business impact
   */
  static generateOptimizationRecommendations(
    tokenAnalysis: TokenAnalysis,
    effectivenessAnalysis: EffectivenessAnalysis
  ): OptimizationRecommendation[] {
    return PromptOptimizationRecommendationService.generateOptimizationRecommendations(
      tokenAnalysis,
      effectivenessAnalysis
    );
  }

  /**
   * Calculate overall performance score
   * 
   * AI INSTRUCTIONS:
   * - Weighted combination of token and effectiveness scores
   * - Business-focused scoring algorithm
   * - Return normalized 0-1 score
   */
  static calculateOverallScore(tokenEfficiency: number, effectivenessScore: number): number {
    return PromptPerformanceReportingService.calculateOverallScore(tokenEfficiency, effectivenessScore);
  }

  /**
   * Quick performance health check
   * 
   * AI INSTRUCTIONS:
   * - Rapid assessment of prompt performance
   * - Return simple pass/fail status with key metrics
   * - Identify critical issues requiring immediate attention
   */
  static performHealthCheck(metrics: PromptMetrics): PerformanceHealthCheck {
    const analysis = this.analyzePromptPerformance(metrics);
    
    const criticalIssues: string[] = [];
    
    // Check token efficiency
    if (analysis.tokenAnalysis.efficiency < 0.6) {
      criticalIssues.push('Token efficiency critically low');
    }
    
    // Check response relevance
    if (analysis.effectivenessAnalysis.responseRelevance < 0.7) {
      criticalIssues.push('Response relevance below acceptable threshold');
    }
    
    // Check overall score
    if (analysis.overallScore < 0.6) {
      criticalIssues.push('Overall performance below minimum standards');
    }
    
    // Check for critical modules
    const criticalModules = analysis.tokenAnalysis.breakdown.modules
      .filter(m => m.status === 'critical')
      .map(m => m.module);
    
    if (criticalModules.length > 0) {
      criticalIssues.push(`Critical modules detected: ${criticalModules.join(', ')}`);
    }
    
    return {
      status: criticalIssues.length === 0 ? 'healthy' : 'critical',
      overallScore: analysis.overallScore,
      tokenEfficiency: analysis.tokenAnalysis.efficiency,
      effectivenessScore: this.calculateOverallEffectivenessScore(analysis.effectivenessAnalysis),
      criticalIssues,
      recommendationCount: analysis.optimizationRecommendations.length,
      timestamp: new Date()
    };
  }
}

// Supporting interfaces
export interface PerformanceHealthCheck {
  status: 'healthy' | 'warning' | 'critical';
  overallScore: number;
  tokenEfficiency: number;
  effectivenessScore: number;
  criticalIssues: string[];
  recommendationCount: number;
  timestamp: Date;
} 