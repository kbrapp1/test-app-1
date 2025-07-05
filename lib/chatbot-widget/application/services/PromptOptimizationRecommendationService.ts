/**
 * Prompt Optimization Recommendation Service
 * 
 * AI INSTRUCTIONS:
 * - Application service for generating optimization recommendations
 * - Orchestrates domain services without business logic
 * - Keep under 250 lines by focusing on coordination
 * - Follow @golden-rule patterns exactly
 * - Single responsibility: recommendation generation and prioritization
 */

import { PromptTokenAnalysisDomainService } from '../../domain/services/ai-configuration/PromptTokenAnalysisDomainService';
import { PromptEffectivenessAnalysisDomainService, EffectivenessImprovement } from '../../domain/services/ai-configuration/PromptEffectivenessAnalysisDomainService';
import {
  TokenAnalysis,
  EffectivenessAnalysis,
  OptimizationRecommendation,
  PERFORMANCE_THRESHOLDS
} from '../../domain/services/ai-configuration/types/PromptPerformanceTypes';

export class PromptOptimizationRecommendationService {
  
  /**
   * Generate comprehensive optimization recommendations
   * 
   * AI INSTRUCTIONS:
   * - Orchestrate domain services to generate recommendations
   * - Combine token and effectiveness analysis
   * - Prioritize recommendations by business impact
   * - Return actionable improvement plan
   */
  static generateOptimizationRecommendations(
    tokenAnalysis: TokenAnalysis,
    effectivenessAnalysis: EffectivenessAnalysis
  ): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = [];

    // Token optimization recommendations
    const tokenRecommendations = this.generateTokenOptimizationRecommendations(tokenAnalysis);
    recommendations.push(...tokenRecommendations);

    // Effectiveness optimization recommendations
    const effectivenessRecommendations = this.generateEffectivenessOptimizationRecommendations(effectivenessAnalysis);
    recommendations.push(...effectivenessRecommendations);

    // Module-specific recommendations
    const moduleRecommendations = this.generateModuleOptimizationRecommendations(tokenAnalysis);
    recommendations.push(...moduleRecommendations);

    // Sort by priority and business impact
    return this.prioritizeRecommendations(recommendations);
  }

  /**
   * Generate token-focused optimization recommendations
   */
  private static generateTokenOptimizationRecommendations(tokenAnalysis: TokenAnalysis): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = [];

    // Overall token efficiency
    if (tokenAnalysis.efficiency < PERFORMANCE_THRESHOLDS.tokenEfficiency) {
      recommendations.push({
        type: 'token_optimization',
        priority: 'high',
        title: 'Optimize Token Usage',
        description: `Prompt is using ${tokenAnalysis.totalTokens} tokens with ${(tokenAnalysis.efficiency * 100).toFixed(1)}% efficiency`,
        impact: 'high',
        effort: 'medium',
        actions: tokenAnalysis.recommendations
      });
    }

    // Distribution balance
    if (tokenAnalysis.breakdown.distribution.balance < 0.7) {
      recommendations.push({
        type: 'distribution_balance',
        priority: 'medium',
        title: 'Improve Token Distribution',
        description: `Token distribution is imbalanced (${(tokenAnalysis.breakdown.distribution.balance * 100).toFixed(1)}% optimal)`,
        impact: 'medium',
        effort: 'medium',
        actions: [
          'Rebalance core, context, and enhancement modules',
          'Move non-essential content to conditional injection',
          'Optimize module loading strategy'
        ]
      });
    }

    return recommendations;
  }

  /**
   * Generate effectiveness-focused optimization recommendations
   */
  private static generateEffectivenessOptimizationRecommendations(effectivenessAnalysis: EffectivenessAnalysis): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = [];
    
    // Get improvement opportunities from domain service
    const improvements = PromptEffectivenessAnalysisDomainService.identifyImprovementOpportunities(effectivenessAnalysis);
    
    // Convert to optimization recommendations
    improvements.forEach(improvement => {
      recommendations.push({
        type: `effectiveness_${improvement.metric}`,
        priority: this.mapPriorityFromScore(improvement.priority),
        title: this.getEffectivenessTitle(improvement.metric),
        description: this.getEffectivenessDescription(improvement),
        impact: this.mapImpactFromPriority(improvement.priority),
        effort: this.estimateEffortForMetric(improvement.metric),
        actions: improvement.recommendations
      });
    });

    return recommendations;
  }

  /**
   * Generate module-specific optimization recommendations
   */
  private static generateModuleOptimizationRecommendations(tokenAnalysis: TokenAnalysis): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = [];

    // Process high-waste modules
    tokenAnalysis.breakdown.wasteIdentification.forEach(waste => {
      if (waste.wastePercentage > 20) {
        recommendations.push({
          type: 'module_optimization',
          priority: waste.wastePercentage > 40 ? 'high' : 'medium',
          title: `Optimize ${this.formatModuleName(waste.module)} Module`,
          description: `${waste.module} module is using ${waste.wastePercentage.toFixed(1)}% more tokens than optimal (${waste.wastedTokens} excess tokens)`,
          impact: this.calculateModuleImpact(waste.wastePercentage),
          effort: 'low',
          actions: waste.recommendations
        });
      }
    });

    // Critical status modules
    tokenAnalysis.breakdown.modules
      .filter(module => module.status === 'critical')
      .forEach(module => {
        recommendations.push({
          type: 'critical_module',
          priority: 'high',
          title: `Critical: ${this.formatModuleName(module.module)} Module`,
          description: `${module.module} module has critical efficiency (${(module.efficiency * 100).toFixed(1)}%) and needs immediate attention`,
          impact: 'high',
          effort: 'high',
          actions: [
            'Immediate review and redesign required',
            'Consider breaking into smaller modules',
            'Implement conditional loading',
            'Add performance monitoring'
          ]
        });
      });

    return recommendations;
  }

  /**
   * Prioritize recommendations by business impact and urgency
   */
  private static prioritizeRecommendations(recommendations: OptimizationRecommendation[]): OptimizationRecommendation[] {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    const impactOrder = { high: 3, medium: 2, low: 1 };

    return recommendations.sort((a, b) => {
      const aPriorityScore = priorityOrder[a.priority] * 2; // Weight priority higher
      const aImpactScore = impactOrder[a.impact];
      const aTotal = aPriorityScore + aImpactScore;

      const bPriorityScore = priorityOrder[b.priority] * 2;
      const bImpactScore = impactOrder[b.impact];
      const bTotal = bPriorityScore + bImpactScore;

      return bTotal - aTotal;
    });
  }

  /**
   * Map priority score to priority level
   */
  private static mapPriorityFromScore(score: number): 'high' | 'medium' | 'low' {
    if (score >= 0.7) return 'high';
    if (score >= 0.4) return 'medium';
    return 'low';
  }

  /**
   * Map impact from priority score
   */
  private static mapImpactFromPriority(priority: number): 'high' | 'medium' | 'low' {
    if (priority >= 0.6) return 'high';
    if (priority >= 0.3) return 'medium';
    return 'low';
  }

  /**
   * Estimate effort required for metric improvement
   */
  private static estimateEffortForMetric(metric: string): 'high' | 'medium' | 'low' {
    const effortMap: Record<string, 'high' | 'medium' | 'low'> = {
      responseRelevance: 'high',
      leadQualificationAccuracy: 'high',
      entityExtractionAccuracy: 'medium',
      conversationProgression: 'medium',
      userEngagement: 'medium',
      conversionRate: 'low',
      averageSessionLength: 'low',
      escalationRate: 'low'
    };

    return effortMap[metric] || 'medium';
  }

  /**
   * Get user-friendly title for effectiveness metrics
   */
  private static getEffectivenessTitle(metric: string): string {
    const titleMap: Record<string, string> = {
      responseRelevance: 'Improve Response Relevance',
      leadQualificationAccuracy: 'Enhance Lead Qualification',
      entityExtractionAccuracy: 'Optimize Entity Extraction',
      conversationProgression: 'Improve Conversation Flow',
      userEngagement: 'Boost User Engagement',
      conversionRate: 'Increase Conversion Rate',
      averageSessionLength: 'Optimize Session Length',
      escalationRate: 'Reduce Escalation Rate'
    };

    return titleMap[metric] || `Optimize ${metric}`;
  }

  /**
   * Get detailed description for effectiveness improvement
   */
  private static getEffectivenessDescription(improvement: EffectivenessImprovement): string {
    const currentPercent = (improvement.currentScore * 100).toFixed(1);
    const targetPercent = (improvement.targetScore * 100).toFixed(1);
    const gapPercent = (improvement.gap * 100).toFixed(1);

    return `${improvement.metric} is at ${currentPercent}%, target is ${targetPercent}% (${gapPercent}% gap)`;
  }

  /**
   * Calculate module impact based on waste percentage
   */
  private static calculateModuleImpact(wastePercentage: number): 'high' | 'medium' | 'low' {
    if (wastePercentage > 40) return 'high';
    if (wastePercentage > 20) return 'medium';
    return 'low';
  }

  /**
   * Format module name for display
   */
  private static formatModuleName(module: string): string {
    return module
      .split(/(?=[A-Z])/)
      .join(' ')
      .replace(/^\w/, c => c.toUpperCase());
  }
} 