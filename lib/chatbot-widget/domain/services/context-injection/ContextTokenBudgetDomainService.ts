/**
 * Context Token Budget Domain Service
 * 
 * AI INSTRUCTIONS:
 * - Pure domain logic for token budget management and context selection optimization
 * - Apply business rules for token allocation within constraints
 * - Follow @golden-rule patterns exactly - single responsibility for token budget optimization
 * - Keep business logic isolated from external concerns
 */

import { ChatMessage } from '../../entities/ChatMessage';
import {
  ContextModule,
  ModulePriority,
  SelectedModules,
  TokenBudgetAllocation,
  ContextSelectionCriteria,
  EntityData
} from '../interfaces/ContextInjectionTypes';

export class ContextTokenBudgetDomainService {
  
  // Select modules that fit within token budget using priority-based allocation
  static selectModulesWithinBudget(
    modules: ContextModule[],
    availableTokens: number,
    criteria: ContextSelectionCriteria
  ): { selectedModules: ContextModule[]; allocation: TokenBudgetAllocation } {
    // Sort modules by adjusted priority (highest first)
    const sortedModules = [...modules].sort((a, b) => 
      (b.adjustedPriority || b.priority) - (a.adjustedPriority || a.priority)
    );

    const selectedModules: ContextModule[] = [];
    let usedTokens = 0;

    // Apply early conversation optimization
    if (this.isEarlyConversation(criteria.messageCount)) {
      return this.selectMinimalModulesForEarlyConversation(sortedModules, availableTokens);
    }

    // Greedy selection based on priority and token efficiency
    for (const module of sortedModules) {
      if (usedTokens + module.estimatedTokens <= availableTokens) {
        selectedModules.push(module);
        usedTokens += module.estimatedTokens;
      }
    }

    const allocation = this.calculateTokenAllocation(selectedModules, availableTokens);
    
    return { selectedModules, allocation };
  }

  // Calculate priority scores with enhanced token efficiency
  static calculatePriorityScores(
    conversationHistory: ChatMessage[],
    entityData?: EntityData,
    leadScore?: number
  ): ModulePriority {
    // For simple greetings (1-2 messages), use minimal context
    if (conversationHistory.length <= 2) {
      return {
        corePersona: 1.0,        // Always include
        highPriorityContext: 0.2, // Minimal context
        progressionModules: 0.1,  // Skip progression
        realTimeContext: 0.5     // Basic real-time only
      };
    }
    
    // For longer conversations, use full scoring
    const hasComplexEntities = entityData && Object.keys(entityData).length > 3;
    const isHighValueLead = leadScore && leadScore > 60;
    const conversationDepth = Math.min(conversationHistory.length / 10, 1);
    
    return {
      corePersona: 1.0,
      highPriorityContext: hasComplexEntities ? 0.9 : 0.4,
      progressionModules: isHighValueLead ? 0.8 : 0.3,
      realTimeContext: 0.6 + (conversationDepth * 0.3)
    };
  }

  // Select modules based on token budget with early conversation optimization
  static selectModulesForBudget(
    priorities: ModulePriority,
    tokenBudget: number,
    conversationHistory: ChatMessage[]
  ): SelectedModules {
    // For greetings and early conversation, use minimal modules
    if (conversationHistory.length <= 2) {
      return {
        corePersona: true,
        highPriorityContext: false, // Skip for greetings
        progressionModules: false,  // Skip for greetings
        realTimeContext: true,
        estimatedTokens: 900 // Much lower estimate
      };
    }
    
    // For longer conversations, use original logic
    const baseTokens = 800; // Core persona
    let currentTokens = baseTokens;
    
    const selected: SelectedModules = {
      corePersona: true,
      highPriorityContext: false,
      progressionModules: false,
      realTimeContext: false,
      estimatedTokens: baseTokens
    };
    
    // Add modules based on priority and available budget
    if (currentTokens + 400 <= tokenBudget && priorities.highPriorityContext > 0.6) {
      selected.highPriorityContext = true;
      currentTokens += 400;
    }
    
    if (currentTokens + 400 <= tokenBudget && priorities.progressionModules > 0.6) {
      selected.progressionModules = true;
      currentTokens += 400;
    }
    
    if (currentTokens + 300 <= tokenBudget && priorities.realTimeContext > 0.5) {
      selected.realTimeContext = true;
      currentTokens += 300;
    }
    
    selected.estimatedTokens = currentTokens;
    return selected;
  }

  // Optimize token allocation for maximum value
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

    for (const module of optimizedModules) {
      if (usedTokens + module.estimatedTokens <= availableTokens) {
        selectedModules.push(module);
        usedTokens += module.estimatedTokens;
      }
    }

    return selectedModules;
  }

  // Calculate token allocation breakdown
  static calculateTokenAllocation(
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

  // Validate token budget constraints
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

  // Helper methods for token budget calculations
  private static isEarlyConversation(messageCount: number): boolean {
    return messageCount <= 2;
  }

  private static selectMinimalModulesForEarlyConversation(
    modules: ContextModule[],
    availableTokens: number
  ): { selectedModules: ContextModule[]; allocation: TokenBudgetAllocation } {
    // For early conversations, prioritize essential modules only
    const essentialTypes = ['userProfile', 'conversationPhase', 'businessHours'];
    const essentialModules = modules.filter(m => essentialTypes.includes(m.type));
    
    const selectedModules: ContextModule[] = [];
    let usedTokens = 0;
    
    for (const module of essentialModules) {
      if (usedTokens + module.estimatedTokens <= availableTokens) {
        selectedModules.push(module);
        usedTokens += module.estimatedTokens;
      }
    }
    
    const allocation = this.calculateTokenAllocation(selectedModules, availableTokens);
    
    return { selectedModules, allocation };
  }

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

  // Get recommended token budget based on conversation context
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
} 