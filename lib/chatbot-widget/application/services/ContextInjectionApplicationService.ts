/**
 * Context Injection Application Service
 * 
 * AI INSTRUCTIONS:
 * - Orchestrate context injection workflow without business logic
 * - Coordinate domain services for context selection
 * - Handle application-level concerns and validation
 * - Keep under 250 lines by delegating to domain services
 * - Follow @golden-rule patterns exactly
 * - Single responsibility: workflow orchestration
 */

import { ChatSession } from '../../domain/entities/ChatSession';
import { ChatbotConfig } from '../../domain/entities/ChatbotConfig';
import { ChatMessage } from '../../domain/entities/ChatMessage';
import { ContextModulePriorityDomainService } from '../../domain/services/context-injection/ContextModulePriorityDomainService';
import { ContextModuleGeneratorDomainService } from '../../domain/services/context-injection/ContextModuleGeneratorDomainService';
import { ContextTokenBudgetDomainService } from '../../domain/services/context-injection/ContextTokenBudgetDomainService';
import {
  ContextModule,
  ContextSelectionCriteria,
  EntityData,
  TokenBudgetAllocation,
  ContextGenerationOptions,
  ContextRelevanceFactors,
  ConversationPhase
} from '../../domain/services/interfaces/ContextInjectionTypes';

export interface ContextInjectionResult {
  selectedModules: ContextModule[];
  allocation: TokenBudgetAllocation;
  relevanceFactors: ContextRelevanceFactors;
  conversationPhase: ConversationPhase;
  recommendations: string[];
}

export class ContextInjectionApplicationService {
  
  /**
   * Main orchestration method for intelligent context selection
   * 
   * AI INSTRUCTIONS:
   * - Coordinate all domain services
   * - Handle workflow without business logic
   * - Return comprehensive result with analytics
   */
  async selectOptimalContext(
    session: ChatSession,
    chatbotConfig: ChatbotConfig,
    availableTokens: number,
    conversationHistory: ChatMessage[] = [],
    entityData?: EntityData,
    leadScore?: number,
    qualificationStatus?: string,
    options?: ContextGenerationOptions
  ): Promise<ContextInjectionResult> {
    // Build selection criteria
    const criteria: ContextSelectionCriteria = {
      availableTokens,
      leadScore,
      qualificationStatus,
      messageCount: conversationHistory.length,
      entityData
    };

    // Generate candidate modules using domain service
    const candidateModules = ContextModuleGeneratorDomainService.generateCandidateModules(
      session,
      chatbotConfig,
      conversationHistory,
      entityData,
      leadScore,
      qualificationStatus,
      options
    );

    // Calculate relevance factors using domain service
    const relevanceFactors = ContextModulePriorityDomainService.calculateRelevanceFactors(
      session,
      conversationHistory,
      entityData,
      leadScore,
      chatbotConfig.operatingHours
    );

    // Apply session multipliers to adjust priorities
    const prioritizedModules = ContextModulePriorityDomainService.applySessionMultipliers(
      candidateModules,
      session,
      conversationHistory,
      entityData,
      leadScore
    );

    // Select modules within token budget using domain service
    const { selectedModules, allocation } = ContextTokenBudgetDomainService.selectModulesWithinBudget(
      prioritizedModules,
      availableTokens,
      criteria
    );

    // Determine conversation phase
    const conversationPhase = ContextModulePriorityDomainService.determineConversationPhase(
      leadScore,
      entityData,
      conversationHistory
    );

    // Validate and get recommendations
    const validation = ContextTokenBudgetDomainService.validateTokenBudget(
      selectedModules,
      availableTokens
    );

    // Generate additional recommendations
    const recommendations = this.generateRecommendations(
      selectedModules,
      allocation,
      criteria,
      validation
    );

    return {
      selectedModules,
      allocation,
      relevanceFactors,
      conversationPhase,
      recommendations: [...validation.recommendations, ...recommendations]
    };
  }

  /**
   * Get recommended token budget for conversation context
   * 
   * AI INSTRUCTIONS:
   * - Delegate to domain service for calculation
   * - Handle application-level formatting
   * - Provide actionable recommendations
   */
  async getRecommendedTokenBudget(
    criteria: ContextSelectionCriteria
  ): Promise<{
    recommended: number;
    minimum: number;
    maximum: number;
    reasoning: string[];
    adjustmentFactors: string[];
  }> {
    const budgetRecommendation = ContextTokenBudgetDomainService.getRecommendedTokenBudget(criteria);
    
    // Add application-level adjustment factors
    const adjustmentFactors = this.calculateAdjustmentFactors(criteria);
    
    return {
      ...budgetRecommendation,
      adjustmentFactors
    };
  }

  /**
   * Optimize context selection for specific use cases
   * 
   * AI INSTRUCTIONS:
   * - Apply use case specific optimizations
   * - Coordinate domain services for specialized scenarios
   * - Handle edge cases and special requirements
   */
  async optimizeForUseCase(
    session: ChatSession,
    chatbotConfig: ChatbotConfig,
    useCase: 'greeting' | 'qualification' | 'demonstration' | 'closing',
    availableTokens: number,
    conversationHistory: ChatMessage[] = [],
    entityData?: EntityData,
    leadScore?: number
  ): Promise<ContextInjectionResult> {
    // Create use case specific options
    const options = this.getUseCaseOptions(useCase, conversationHistory.length);
    
    // Apply use case specific token adjustments
    const adjustedTokens = this.adjustTokensForUseCase(useCase, availableTokens, leadScore);
    
    return this.selectOptimalContext(
      session,
      chatbotConfig,
      adjustedTokens,
      conversationHistory,
      entityData,
      leadScore,
      undefined,
      options
    );
  }

  /**
   * Analyze context effectiveness and provide insights
   * 
   * AI INSTRUCTIONS:
   * - Evaluate selected context quality
   * - Provide actionable insights for optimization
   * - Support continuous improvement
   */
  async analyzeContextEffectiveness(
    result: ContextInjectionResult,
    criteria: ContextSelectionCriteria
  ): Promise<{
    effectivenessScore: number;
    strengths: string[];
    weaknesses: string[];
    optimizationSuggestions: string[];
  }> {
    const effectivenessScore = this.calculateEffectivenessScore(result, criteria);
    const strengths = this.identifyStrengths(result);
    const weaknesses = this.identifyWeaknesses(result, criteria);
    const optimizationSuggestions = this.generateOptimizationSuggestions(result, criteria);
    
    return {
      effectivenessScore,
      strengths,
      weaknesses,
      optimizationSuggestions
    };
  }

  /**
   * Helper methods for application-level logic
   * 
   * AI INSTRUCTIONS:
   * - Support orchestration without business logic
   * - Handle application concerns and formatting
   * - Keep methods focused and delegating
   */
  private generateRecommendations(
    selectedModules: ContextModule[],
    allocation: TokenBudgetAllocation,
    criteria: ContextSelectionCriteria,
    validation: any
  ): string[] {
    const recommendations: string[] = [];
    
    // Token utilization recommendations
    const utilizationPercent = (allocation.totalUsed / allocation.totalAvailable) * 100;
    if (utilizationPercent < 60) {
      recommendations.push('Consider adding more context modules to improve response quality');
    } else if (utilizationPercent > 90) {
      recommendations.push('Token budget is nearly exhausted - consider increasing budget');
    }
    
    // Module diversity recommendations
    const moduleTypes = new Set(selectedModules.map(m => m.type));
    if (moduleTypes.size < 3 && criteria.messageCount > 5) {
      recommendations.push('Consider including more diverse context types for extended conversations');
    }
    
    // Lead-specific recommendations
    if (criteria.leadScore && criteria.leadScore > 70 && !selectedModules.some(m => m.type === 'leadScoring')) {
      recommendations.push('High-value lead detected - consider including lead scoring context');
    }
    
    return recommendations;
  }

  private calculateAdjustmentFactors(criteria: ContextSelectionCriteria): string[] {
    const factors: string[] = [];
    
    if (criteria.messageCount <= 2) {
      factors.push('Early conversation stage reduces context needs');
    }
    
    if (criteria.leadScore && criteria.leadScore > 70) {
      factors.push('High lead score justifies increased context budget');
    }
    
    if (criteria.entityData && Object.keys(criteria.entityData).length > 3) {
      factors.push('Rich entity data supports comprehensive context');
    }
    
    return factors;
  }

  private getUseCaseOptions(useCase: string, messageCount: number): ContextGenerationOptions {
    const baseOptions = {
      includeUserProfile: true,
      includeCompanyContext: true,
      includeConversationPhase: true,
      includeLeadScoring: true,
      includeKnowledgeBase: true,
      includeIndustrySpecific: true,
      includeConversationHistory: true,
      includeBusinessHours: true,
      includeEngagementOptimization: true
    };
    
    switch (useCase) {
      case 'greeting':
        return {
          ...baseOptions,
          includeLeadScoring: false,
          includeConversationHistory: false,
          includeEngagementOptimization: false
        };
      case 'qualification':
        return {
          ...baseOptions,
          includeLeadScoring: true,
          includeIndustrySpecific: true
        };
      case 'demonstration':
        return {
          ...baseOptions,
          includeKnowledgeBase: true,
          includeIndustrySpecific: true
        };
      case 'closing':
        return {
          ...baseOptions,
          includeLeadScoring: true,
          includeEngagementOptimization: true
        };
      default:
        return baseOptions;
    }
  }

  private adjustTokensForUseCase(useCase: string, baseTokens: number, leadScore?: number): number {
    switch (useCase) {
      case 'greeting':
        return Math.min(baseTokens, 800); // Limit for greetings
      case 'qualification':
        return baseTokens; // Standard allocation
      case 'demonstration':
        return Math.max(baseTokens, 1200); // Increase for demos
      case 'closing':
        return leadScore && leadScore > 70 ? Math.max(baseTokens, 1500) : baseTokens;
      default:
        return baseTokens;
    }
  }

  private calculateEffectivenessScore(result: ContextInjectionResult, criteria: ContextSelectionCriteria): number {
    let score = 70; // Base score
    
    // Token utilization efficiency
    const utilization = result.allocation.totalUsed / result.allocation.totalAvailable;
    if (utilization > 0.7 && utilization < 0.95) score += 10;
    
    // Module diversity
    const moduleTypes = new Set(result.selectedModules.map(m => m.type));
    score += Math.min(moduleTypes.size * 3, 15);
    
    // Conversation phase alignment
    if (result.conversationPhase.confidence > 0.8) score += 5;
    
    return Math.min(score, 100);
  }

  private identifyStrengths(result: ContextInjectionResult): string[] {
    const strengths: string[] = [];
    
    if (result.allocation.totalUsed / result.allocation.totalAvailable > 0.8) {
      strengths.push('Efficient token utilization');
    }
    
    const moduleTypes = new Set(result.selectedModules.map(m => m.type));
    if (moduleTypes.size >= 4) {
      strengths.push('Comprehensive context coverage');
    }
    
    if (result.conversationPhase.confidence > 0.85) {
      strengths.push('High confidence in conversation phase detection');
    }
    
    return strengths;
  }

  private identifyWeaknesses(result: ContextInjectionResult, criteria: ContextSelectionCriteria): string[] {
    const weaknesses: string[] = [];
    
    if (result.allocation.totalUsed / result.allocation.totalAvailable < 0.5) {
      weaknesses.push('Underutilized token budget');
    }
    
    const hasEssentialModules = result.selectedModules.some(m => 
      m.type === 'userProfile' || m.type === 'conversationPhase'
    );
    if (!hasEssentialModules) {
      weaknesses.push('Missing essential context modules');
    }
    
    return weaknesses;
  }

  private generateOptimizationSuggestions(result: ContextInjectionResult, criteria: ContextSelectionCriteria): string[] {
    const suggestions: string[] = [];
    
    // Token budget optimization
    const utilization = result.allocation.totalUsed / result.allocation.totalAvailable;
    if (utilization < 0.6) {
      suggestions.push('Increase context richness by adding more modules');
    } else if (utilization > 0.95) {
      suggestions.push('Consider increasing token budget for better context coverage');
    }
    
    // Module-specific suggestions
    const moduleTypes = new Set(result.selectedModules.map(m => m.type));
    if (!moduleTypes.has('knowledgeBase') && criteria.messageCount <= 3) {
      suggestions.push('Add knowledge base context for early conversation support');
    }
    
    return suggestions;
  }
} 