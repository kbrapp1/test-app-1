/**
 * Context Module Optimization Domain Service
 * 
 * AI INSTRUCTIONS:
 * - Pure domain logic for advanced context module optimization algorithms
 * - Implements knapsack-like optimization for maximum value extraction
 * - Follow @golden-rule patterns exactly - single responsibility for optimization
 * - Keep business logic isolated from external concerns
 */

import {
  ContextModule,
  ContextSelectionCriteria,
  TokenBudgetAllocation
} from '../interfaces/ContextInjectionTypes';

export class ContextModuleOptimizationService {
  
  // Optimize token allocation for maximum value using advanced algorithms
  static optimizeTokenAllocation(
    modules: ContextModule[],
    availableTokens: number,
    criteria: ContextSelectionCriteria
  ): ContextModule[] {
    // Calculate value-to-token ratio for each module
    const modulesWithRatio = modules.map(module => ({
      ...module,
      valueToTokenRatio: this.calculateValueToTokenRatio(module, criteria)
    }));

    // Sort by value-to-token ratio (highest first)
    const optimizedModules = modulesWithRatio.sort((a, b) => 
      b.valueToTokenRatio - a.valueToTokenRatio
    );

    // Select modules using knapsack-like approach
    const selectedModules: ContextModule[] = [];
    let usedTokens = 0;

    for (const contextModule of optimizedModules) {
      if (usedTokens + contextModule.estimatedTokens <= availableTokens) {
        selectedModules.push(contextModule);
        usedTokens += contextModule.estimatedTokens;
      }
    }

    return selectedModules;
  }

  // Select minimal modules optimized for early conversation scenarios
  static selectMinimalModulesForEarlyConversation(
    modules: ContextModule[],
    availableTokens: number
  ): { selectedModules: ContextModule[]; allocation: TokenBudgetAllocation } {
    // For early conversations, prioritize essential modules only
    const essentialTypes = ['userProfile', 'conversationPhase', 'businessHours'];
    const essentialModules = modules.filter(m => essentialTypes.includes(m.type));
    
    const selectedModules: ContextModule[] = [];
    let usedTokens = 0;
    
    for (const contextModule of essentialModules) {
      if (usedTokens + contextModule.estimatedTokens <= availableTokens) {
        selectedModules.push(contextModule);
        usedTokens += contextModule.estimatedTokens;
      }
    }
    
    const allocation = this.calculateTokenAllocation(selectedModules, availableTokens);
    
    return { selectedModules, allocation };
  }

  // Calculate value-to-token ratio with sophisticated business rules
  private static calculateValueToTokenRatio(
    module: ContextModule,
    criteria: ContextSelectionCriteria
  ): number {
    let baseValue = module.relevanceScore;
    
    // Apply business rules for value adjustment
    if (module.type === 'userProfile' && criteria.entityData) {
      baseValue *= 1.2; // User profile is highly valuable
    }
    
    if (module.type === 'leadScoring' && criteria.leadScore && criteria.leadScore > 70) {
      baseValue *= 1.3; // High-value leads get priority
    }
    
    if (module.type === 'knowledgeBase' && criteria.messageCount <= 3) {
      baseValue *= 1.1; // Knowledge base valuable early in conversation
    }
    
    // Prevent division by zero
    const tokenCost = Math.max(module.estimatedTokens, 1);
    
    return baseValue / tokenCost;
  }

  // Helper method to determine if conversation is in early stage
  static isEarlyConversation(messageCount: number): boolean {
    return messageCount <= 2;
  }

  // Calculate token allocation breakdown for tracking
  private static calculateTokenAllocation(
    selectedModules: ContextModule[],
    totalAvailable: number
  ): TokenBudgetAllocation {
    const allocation: TokenBudgetAllocation = {
      corePersona: 0,
      highPriorityContext: 0,
      progressionModules: 0,
      realTimeContext: 0,
      totalUsed: 0,
      totalAvailable
    };

    selectedModules.forEach(module => {
      allocation.totalUsed += module.estimatedTokens;
      
      // Categorize modules for allocation tracking
      switch (module.type) {
        case 'userProfile':
        case 'conversationPhase':
          allocation.corePersona += module.estimatedTokens;
          break;
        case 'companyContext':
        case 'knowledgeBase':
          allocation.highPriorityContext += module.estimatedTokens;
          break;
        case 'leadScoring':
        case 'industrySpecific':
          allocation.progressionModules += module.estimatedTokens;
          break;
        case 'conversationHistory':
        case 'businessHours':
        case 'engagementOptimization':
          allocation.realTimeContext += module.estimatedTokens;
          break;
      }
    });

    return allocation;
  }
}