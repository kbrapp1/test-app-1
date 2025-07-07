/**
 * Context Effectiveness Domain Service
 * 
 * AI INSTRUCTIONS:
 * - Pure business logic for analyzing context effectiveness with no application concerns
 * - Keep under 200 lines by focusing on single responsibility
 * - Follow @golden-rule patterns exactly - use domain errors for business rule violations
 * - Calculate effectiveness scores using domain rules for quality measurement
 */

import { BusinessRuleViolationError } from '../../errors/ChatbotWidgetDomainErrors';
import { ContextModule, ContextRelevanceFactors } from '../interfaces/ContextInjectionTypes';

// Configuration constants for context effectiveness calculations
export const EFFECTIVENESS_CONFIG = {
  SCORING: {
    BASE_EFFECTIVENESS: 70,
    MAX_EFFECTIVENESS: 100,
    DIVERSITY_POINTS: 3,
    MAX_DIVERSITY_BONUS: 15,
    CONFIDENCE_BONUS: 5,
    EFFICIENCY_BONUS: 10
  },
  THRESHOLDS: {
    EFFICIENCY_MIN: 0.7,
    EFFICIENCY_MAX: 0.95,
    HIGH_CONFIDENCE: 0.8,
    VERY_HIGH_CONFIDENCE: 0.85,
    LOW_UTILIZATION: 0.6,
    MIN_COMPREHENSIVE_MODULES: 4
  }
} as const;

export interface ContextEffectivenessAnalysis {
  effectivenessScore: number;
  strengths: string[];
  weaknesses: string[];
  optimizationSuggestions: string[];
}

export interface TokenUtilizationMetrics {
  totalUsed: number;
  totalAvailable: number;
  utilizationRate: number;
  isEfficient: boolean;
}

// Context Effectiveness Domain Service - encapsulates business rules for measuring context quality
export class ContextEffectivenessDomainService {
  
  // Calculate overall effectiveness score for context selection
  calculateEffectivenessScore(
    modules: ContextModule[],
    utilization: TokenUtilizationMetrics,
    relevanceFactors: ContextRelevanceFactors
  ): number {
    this.validateInputs(modules, utilization);
    
    let score = EFFECTIVENESS_CONFIG.SCORING.BASE_EFFECTIVENESS;
    
    // Token utilization efficiency scoring
    if (this.isUtilizationEfficient(utilization)) {
      score += EFFECTIVENESS_CONFIG.SCORING.EFFICIENCY_BONUS;
    }
    
    // Module diversity scoring
    const diversityBonus = this.calculateDiversityBonus(modules);
    score += diversityBonus;
    
    // Confidence scoring - using phaseRelevance as proxy for confidence
    if (relevanceFactors.phaseRelevance > EFFECTIVENESS_CONFIG.THRESHOLDS.HIGH_CONFIDENCE) {
      score += EFFECTIVENESS_CONFIG.SCORING.CONFIDENCE_BONUS;
    }
    
    return Math.min(score, EFFECTIVENESS_CONFIG.SCORING.MAX_EFFECTIVENESS);
  }
  
  // Identify strengths in current context selection
  identifyStrengths(
    modules: ContextModule[],
    utilization: TokenUtilizationMetrics,
    relevanceFactors: ContextRelevanceFactors
  ): string[] {
    const strengths: string[] = [];
    
    if (this.isUtilizationEfficient(utilization)) {
      strengths.push('Efficient token utilization');
    }
    
    const moduleTypes = new Set(modules.map(m => m.type));
    if (moduleTypes.size >= EFFECTIVENESS_CONFIG.THRESHOLDS.MIN_COMPREHENSIVE_MODULES) {
      strengths.push('Comprehensive context coverage');
    }
    
    if (relevanceFactors.phaseRelevance > EFFECTIVENESS_CONFIG.THRESHOLDS.VERY_HIGH_CONFIDENCE) {
      strengths.push('High confidence in conversation phase detection');
    }
    
    return strengths;
  }
  
  // Identify weaknesses in current context selection
  identifyWeaknesses(
    modules: ContextModule[],
    utilization: TokenUtilizationMetrics,
    relevanceFactors: ContextRelevanceFactors
  ): string[] {
    const weaknesses: string[] = [];
    
    if (utilization.utilizationRate < EFFECTIVENESS_CONFIG.THRESHOLDS.LOW_UTILIZATION * 0.8) {
      weaknesses.push('Underutilized token budget');
    }
    
    const hasEssentialModules = modules.some(m => 
      m.type === 'userProfile' || m.type === 'conversationPhase'
    );
    if (!hasEssentialModules) {
      weaknesses.push('Missing essential context modules');
    }
    
    if (relevanceFactors.phaseRelevance < EFFECTIVENESS_CONFIG.THRESHOLDS.HIGH_CONFIDENCE * 0.75) {
      weaknesses.push('Low confidence in conversation phase detection');
    }
    
    return weaknesses;
  }
  
  // Generate optimization suggestions based on analysis
  generateOptimizationSuggestions(
    modules: ContextModule[],
    utilization: TokenUtilizationMetrics,
    messageCount: number,
    leadScore?: number
  ): string[] {
    const suggestions: string[] = [];
    
    // Token budget optimization
    if (utilization.utilizationRate < EFFECTIVENESS_CONFIG.THRESHOLDS.LOW_UTILIZATION) {
      suggestions.push('Increase context richness by adding more modules');
    } else if (utilization.utilizationRate > 0.95) {
      suggestions.push('Consider increasing token budget for better context coverage');
    }
    
    // Module-specific suggestions
    const moduleTypes = new Set(modules.map(m => m.type));
    if (!moduleTypes.has('knowledgeBase') && messageCount <= 3) {
      suggestions.push('Add knowledge base context for early conversation support');
    }
    
    // Lead score optimization
    if (leadScore && leadScore > 70 && !moduleTypes.has('leadScoring')) {
      suggestions.push('Include lead scoring context for high-value prospects');
    }
    
    return suggestions;
  }
  
  // Private helper methods for business calculations
  private isUtilizationEfficient(utilization: TokenUtilizationMetrics): boolean {
    return utilization.utilizationRate > EFFECTIVENESS_CONFIG.THRESHOLDS.EFFICIENCY_MIN && 
           utilization.utilizationRate < EFFECTIVENESS_CONFIG.THRESHOLDS.EFFICIENCY_MAX;
  }
  
  private calculateDiversityBonus(modules: ContextModule[]): number {
    const moduleTypes = new Set(modules.map(m => m.type));
    return Math.min(
      moduleTypes.size * EFFECTIVENESS_CONFIG.SCORING.DIVERSITY_POINTS,
      EFFECTIVENESS_CONFIG.SCORING.MAX_DIVERSITY_BONUS
    );
  }
  
  private validateInputs(modules: ContextModule[], utilization: TokenUtilizationMetrics): void {
    if (!modules || !Array.isArray(modules)) {
      throw new BusinessRuleViolationError(
        'Context modules are required for effectiveness analysis',
        { modules }
      );
    }
    
    if (!utilization || typeof utilization.utilizationRate !== 'number') {
      throw new BusinessRuleViolationError(
        'Valid utilization metrics are required',
        { utilization }
      );
    }
  }
}