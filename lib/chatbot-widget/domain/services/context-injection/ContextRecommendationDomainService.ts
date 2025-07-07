/**
 * Context Recommendation Domain Service
 * 
 * AI INSTRUCTIONS:
 * - Pure business logic for generating context recommendations with domain rules
 * - Keep under 200 lines by focusing on single responsibility
 * - Follow @golden-rule patterns exactly - use domain criteria for recommendation logic
 */

import { BusinessRuleViolationError } from '../../errors/ChatbotWidgetDomainErrors';
import { ContextModule, ContextSelectionCriteria, TokenBudgetAllocation } from '../interfaces/ContextInjectionTypes';

// Configuration constants for recommendation generation
export const RECOMMENDATION_CONFIG = {
  THRESHOLDS: {
    LOW_UTILIZATION: 0.6,
    HIGH_UTILIZATION: 0.9,
    HIGH_LEAD_SCORE: 70,
    EXTENDED_MESSAGES: 5,
    RICH_ENTITY_THRESHOLD: 3
  },
  CONVERSATION: {
    EARLY_STAGE_MESSAGES: 2,
    MIN_DIVERSE_MODULES: 3
  }
} as const;

// Context Recommendation Domain Service - generates actionable suggestions based on domain criteria
export class ContextRecommendationDomainService {
  
  // Generate recommendations based on context selection and allocation
  generateRecommendations(
    selectedModules: ContextModule[],
    allocation: TokenBudgetAllocation,
    criteria: ContextSelectionCriteria
  ): string[] {
    this.validateInputs(selectedModules, allocation, criteria);
    
    const recommendations: string[] = [];
    
    // Token utilization recommendations
    const utilizationRecommendations = this.generateUtilizationRecommendations(allocation);
    recommendations.push(...utilizationRecommendations);
    
    // Module diversity recommendations
    const diversityRecommendations = this.generateDiversityRecommendations(selectedModules, criteria);
    recommendations.push(...diversityRecommendations);
    
    // Lead-specific recommendations
    const leadRecommendations = this.generateLeadRecommendations(selectedModules, criteria);
    recommendations.push(...leadRecommendations);
    
    return recommendations;
  }
  
  // Calculate adjustment factors for token budget recommendations
  calculateAdjustmentFactors(criteria: ContextSelectionCriteria): string[] {
    this.validateCriteria(criteria);
    
    const factors: string[] = [];
    
    if (criteria.messageCount <= RECOMMENDATION_CONFIG.CONVERSATION.EARLY_STAGE_MESSAGES) {
      factors.push('Early conversation stage reduces context needs');
    }
    
    if (criteria.leadScore && criteria.leadScore > RECOMMENDATION_CONFIG.THRESHOLDS.HIGH_LEAD_SCORE) {
      factors.push('High lead score justifies increased context budget');
    }
    
    if (criteria.entityData && Object.keys(criteria.entityData).length > RECOMMENDATION_CONFIG.THRESHOLDS.RICH_ENTITY_THRESHOLD) {
      factors.push('Rich entity data supports comprehensive context');
    }
    
    return factors;
  }
  
  // Private methods for generating specific recommendation types
  private generateUtilizationRecommendations(allocation: TokenBudgetAllocation): string[] {
    const recommendations: string[] = [];
    const utilizationPercent = allocation.totalUsed / allocation.totalAvailable;
    
    if (utilizationPercent < RECOMMENDATION_CONFIG.THRESHOLDS.LOW_UTILIZATION) {
      recommendations.push('Consider adding more context modules to improve response quality');
    } else if (utilizationPercent > RECOMMENDATION_CONFIG.THRESHOLDS.HIGH_UTILIZATION) {
      recommendations.push('Token budget is nearly exhausted - consider increasing budget');
    }
    
    return recommendations;
  }
  
  private generateDiversityRecommendations(
    selectedModules: ContextModule[],
    criteria: ContextSelectionCriteria
  ): string[] {
    const recommendations: string[] = [];
    const moduleTypes = new Set(selectedModules.map(m => m.type));
    
    if (moduleTypes.size < RECOMMENDATION_CONFIG.CONVERSATION.MIN_DIVERSE_MODULES && 
        criteria.messageCount > RECOMMENDATION_CONFIG.THRESHOLDS.EXTENDED_MESSAGES) {
      recommendations.push('Consider including more diverse context types for extended conversations');
    }
    
    return recommendations;
  }
  
  private generateLeadRecommendations(
    selectedModules: ContextModule[],
    criteria: ContextSelectionCriteria
  ): string[] {
    const recommendations: string[] = [];
    
    if (criteria.leadScore && 
        criteria.leadScore > RECOMMENDATION_CONFIG.THRESHOLDS.HIGH_LEAD_SCORE && 
        !selectedModules.some(m => m.type === 'leadScoring')) {
      recommendations.push('High-value lead detected - consider including lead scoring context');
    }
    
    return recommendations;
  }
  
  private validateInputs(
    selectedModules: ContextModule[],
    allocation: TokenBudgetAllocation,
    criteria: ContextSelectionCriteria
  ): void {
    if (!selectedModules || !Array.isArray(selectedModules)) {
      throw new BusinessRuleViolationError(
        'Selected modules are required for recommendation generation',
        { selectedModules }
      );
    }
    
    if (!allocation || typeof allocation.totalUsed !== 'number' || typeof allocation.totalAvailable !== 'number') {
      throw new BusinessRuleViolationError(
        'Valid token allocation is required for recommendations',
        { allocation }
      );
    }
    
    this.validateCriteria(criteria);
  }
  
  private validateCriteria(criteria: ContextSelectionCriteria): void {
    if (!criteria) {
      throw new BusinessRuleViolationError(
        'Context selection criteria are required',
        { criteria }
      );
    }
  }
}