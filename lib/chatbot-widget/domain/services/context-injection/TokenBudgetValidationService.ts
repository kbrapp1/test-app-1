/**
 * Token Budget Validation Domain Service
 * 
 * AI INSTRUCTIONS:
 * - Pure domain logic for token budget validation and business rule enforcement
 * - Provides intelligent recommendations based on conversation context
 * - Follow @golden-rule patterns exactly - single responsibility for validation
 * - Keep business logic isolated from external concerns
 */

import {
  ContextModule,
  ContextSelectionCriteria
} from '../interfaces/ContextInjectionTypes';

export class TokenBudgetValidationService {
  
  // Validate token budget constraints with comprehensive business rules
  static validateTokenBudget(
    selectedModules: ContextModule[],
    availableTokens: number,
    minRequiredTokens: number = 500
  ): { isValid: boolean; violations: string[]; recommendations: string[] } {
    const violations: string[] = [];
    const recommendations: string[] = [];
    
    const totalUsed = selectedModules.reduce((sum, module) => sum + module.estimatedTokens, 0);
    
    // Check budget constraints
    if (totalUsed > availableTokens) {
      violations.push(`Token usage (${totalUsed}) exceeds budget (${availableTokens})`);
      recommendations.push('Remove lower-priority modules or increase token budget');
    }
    
    // Check minimum requirements
    if (totalUsed < minRequiredTokens) {
      recommendations.push('Consider adding more context modules for better responses');
    }
    
    // Check for essential modules
    const hasUserProfile = selectedModules.some(m => m.type === 'userProfile');
    const hasConversationPhase = selectedModules.some(m => m.type === 'conversationPhase');
    
    if (!hasUserProfile && !hasConversationPhase) {
      violations.push('Missing essential context modules');
      recommendations.push('Include at least user profile or conversation phase context');
    }
    
    return {
      isValid: violations.length === 0,
      violations,
      recommendations
    };
  }

  // Get intelligent token budget recommendations based on conversation context
  static getRecommendedTokenBudget(
    criteria: ContextSelectionCriteria
  ): { recommended: number; minimum: number; maximum: number; reasoning: string[] } {
    const reasoning: string[] = [];
    let recommended = 1500; // Base recommendation
    
    // Adjust based on conversation length
    if (criteria.messageCount <= 2) {
      recommended = 800;
      reasoning.push('Early conversation - minimal context needed');
    } else if (criteria.messageCount > 10) {
      recommended = 2000;
      reasoning.push('Extended conversation - comprehensive context valuable');
    }
    
    // Adjust based on lead value
    if (criteria.leadScore && criteria.leadScore > 70) {
      recommended += 300;
      reasoning.push('High-value lead - enhanced context justified');
    }
    
    // Adjust based on entity complexity
    if (criteria.entityData && Object.keys(criteria.entityData).length > 3) {
      recommended += 200;
      reasoning.push('Complex entity data - additional context valuable');
    }
    
    return {
      recommended,
      minimum: Math.max(500, recommended * 0.6),
      maximum: recommended * 1.5,
      reasoning
    };
  }

  // Validate module selection meets business requirements
  static validateModuleSelection(
    selectedModules: ContextModule[],
    criteria: ContextSelectionCriteria
  ): { isValid: boolean; issues: string[]; suggestions: string[] } {
    const issues: string[] = [];
    const suggestions: string[] = [];
    
    // Check for high-value lead requirements
    if (criteria.leadScore && criteria.leadScore > 70) {
      const hasLeadScoringModule = selectedModules.some(m => m.type === 'leadScoring');
      if (!hasLeadScoringModule) {
        issues.push('High-value lead missing lead scoring context');
        suggestions.push('Include lead scoring module for high-value prospects');
      }
    }
    
    // Check for complex entity data requirements
    if (criteria.entityData && Object.keys(criteria.entityData).length > 3) {
      const hasKnowledgeBase = selectedModules.some(m => m.type === 'knowledgeBase');
      if (!hasKnowledgeBase) {
        suggestions.push('Consider knowledge base context for complex entity interactions');
      }
    }
    
    // Check for extended conversation requirements
    if (criteria.messageCount > 8) {
      const hasConversationHistory = selectedModules.some(m => m.type === 'conversationHistory');
      if (!hasConversationHistory) {
        suggestions.push('Extended conversations benefit from conversation history context');
      }
    }
    
    return {
      isValid: issues.length === 0,
      issues,
      suggestions
    };
  }

  // Calculate optimization metrics for budget analysis
  static calculateOptimizationMetrics(
    selectedModules: ContextModule[],
    availableTokens: number
  ): {
    utilizationRate: number;
    efficiencyScore: number;
    wastedTokens: number;
    averageModuleValue: number;
  } {
    const totalUsed = selectedModules.reduce((sum, module) => sum + module.estimatedTokens, 0);
    const totalValue = selectedModules.reduce((sum, module) => sum + module.relevanceScore, 0);
    
    const utilizationRate = totalUsed / availableTokens;
    const efficiencyScore = selectedModules.length > 0 ? totalValue / totalUsed : 0;
    const wastedTokens = Math.max(0, availableTokens - totalUsed);
    const averageModuleValue = selectedModules.length > 0 ? totalValue / selectedModules.length : 0;
    
    return {
      utilizationRate,
      efficiencyScore,
      wastedTokens,
      averageModuleValue
    };
  }
}