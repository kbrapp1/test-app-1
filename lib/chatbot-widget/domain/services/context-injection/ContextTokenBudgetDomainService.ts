/**
 * Context Token Budget Domain Service
 * 
 * AI INSTRUCTIONS:
 * - Pure domain logic for token budget management and context selection optimization
 * - Orchestrates specialized services for optimization, validation, and allocation
 * - Follow @golden-rule patterns exactly - single responsibility for budget coordination
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
import { ContextModuleOptimizationService } from './ContextModuleOptimizationService';
import { TokenBudgetValidationService } from './TokenBudgetValidationService';
import { TokenAllocationCalculatorService } from './TokenAllocationCalculatorService';

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

    // Apply early conversation optimization using specialized service
    if (ContextModuleOptimizationService.isEarlyConversation(criteria.messageCount)) {
      return ContextModuleOptimizationService.selectMinimalModulesForEarlyConversation(
        sortedModules, 
        availableTokens
      );
    }

    // Greedy selection based on priority and token efficiency
    for (const contextModule of sortedModules) {
      if (usedTokens + contextModule.estimatedTokens <= availableTokens) {
        selectedModules.push(contextModule);
        usedTokens += contextModule.estimatedTokens;
      }
    }

    const allocation = TokenAllocationCalculatorService.calculateTokenAllocation(
      selectedModules, 
      availableTokens
    );
    
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

  // Delegate to specialized services for common operations
  
  // Legacy module selection - delegated to allocation calculator service
  static selectModulesForBudget(
    priorities: ModulePriority,
    tokenBudget: number,
    conversationHistory: ChatMessage[]
  ): SelectedModules {
    return TokenAllocationCalculatorService.selectModulesForBudget(
      priorities, 
      tokenBudget, 
      conversationHistory
    );
  }

  // Advanced optimization - delegated to optimization service
  static optimizeTokenAllocation(
    modules: ContextModule[],
    availableTokens: number,
    criteria: ContextSelectionCriteria
  ): ContextModule[] {
    return ContextModuleOptimizationService.optimizeTokenAllocation(
      modules, 
      availableTokens, 
      criteria
    );
  }

  // Token allocation calculation - delegated to calculator service
  static calculateTokenAllocation(
    selectedModules: ContextModule[],
    totalAvailable: number
  ): TokenBudgetAllocation {
    return TokenAllocationCalculatorService.calculateTokenAllocation(
      selectedModules, 
      totalAvailable
    );
  }

  // Budget validation - delegated to validation service
  static validateTokenBudget(
    selectedModules: ContextModule[],
    availableTokens: number,
    minRequiredTokens: number = 500
  ) {
    return TokenBudgetValidationService.validateTokenBudget(
      selectedModules, 
      availableTokens, 
      minRequiredTokens
    );
  }

  // Budget recommendations - delegated to validation service
  static getRecommendedTokenBudget(
    criteria: ContextSelectionCriteria
  ) {
    return TokenBudgetValidationService.getRecommendedTokenBudget(criteria);
  }
} 