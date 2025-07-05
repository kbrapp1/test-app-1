/**
 * Prompt Performance Service - DDD Refactored
 * 
 * AI INSTRUCTIONS:
 * - Clean facade pattern for prompt performance analysis
 * - Delegates to focused DDD services following @golden-rule patterns
 * - Maintains clean interface while using proper domain architecture
 * - Single responsibility: unified access to performance analysis
 */

import { PromptPerformanceFacade, PerformanceHealthCheck } from '../../../application/services/PromptPerformanceFacade';
import {
  PromptMetrics,
  PromptPerformanceAnalysis,
  PromptPerformanceReport,
  TokenAnalysis,
  EffectivenessAnalysis,
  OptimizationRecommendation
} from './types/PromptPerformanceTypes';
import { ImprovementPlan } from '../../../application/services/PromptPerformanceReportingService';

/**
 * Prompt Performance Service
 * 
 * AI INSTRUCTIONS:
 * - Maintains existing interface for compatibility
 * - Delegates all logic to proper DDD services
 * - Follows facade pattern for clean architecture
 * - Under 100 lines by delegating to domain services
 */
export class PromptPerformanceService {
  
  /**
   * Analyze prompt performance and provide optimization recommendations
   */
  static analyzePromptPerformance(metrics: PromptMetrics): PromptPerformanceAnalysis {
    return PromptPerformanceFacade.analyzePromptPerformance(metrics);
  }

  /**
   * Generate performance report with trends and benchmarks
   */
  static generatePerformanceReport(analyses: PromptPerformanceAnalysis[]): PromptPerformanceReport {
    return PromptPerformanceFacade.generatePerformanceReport(analyses);
  }

  /**
   * Get priority optimization recommendations
   */
  static getPriorityRecommendations(report: PromptPerformanceReport): OptimizationRecommendation[] {
    return PromptPerformanceFacade.getPriorityRecommendations(report);
  }

  /**
   * Generate actionable improvement plan
   */
  static generateImprovementPlan(report: PromptPerformanceReport): ImprovementPlan {
    return PromptPerformanceFacade.generateImprovementPlan(report);
  }

  /**
   * Generate human-readable performance summary
   */
  static generatePerformanceSummary(report: PromptPerformanceReport): string {
    return PromptPerformanceFacade.generatePerformanceSummary(report);
  }

  /**
   * Analyze token usage efficiency
   */
  static analyzeTokenUsage(metrics: PromptMetrics): TokenAnalysis {
    return PromptPerformanceFacade.analyzeTokenUsage(metrics);
  }

  /**
   * Analyze conversation effectiveness
   */
  static analyzeEffectiveness(metrics: PromptMetrics): EffectivenessAnalysis {
    return PromptPerformanceFacade.analyzeEffectiveness(metrics);
  }

  /**
   * Calculate overall effectiveness score
   */
  static calculateOverallEffectivenessScore(analysis: EffectivenessAnalysis): number {
    return PromptPerformanceFacade.calculateOverallEffectivenessScore(analysis);
  }

  /**
   * Generate optimization recommendations
   */
  static generateOptimizationRecommendations(
    tokenAnalysis: TokenAnalysis,
    effectivenessAnalysis: EffectivenessAnalysis
  ): OptimizationRecommendation[] {
    return PromptPerformanceFacade.generateOptimizationRecommendations(tokenAnalysis, effectivenessAnalysis);
  }

  /**
   * Calculate overall performance score
   */
  static calculateOverallScore(tokenEfficiency: number, effectivenessScore: number): number {
    return PromptPerformanceFacade.calculateOverallScore(tokenEfficiency, effectivenessScore);
  }

  /**
   * Quick performance health check
   */
  static performHealthCheck(metrics: PromptMetrics): PerformanceHealthCheck {
    return PromptPerformanceFacade.performHealthCheck(metrics);
  }
} 