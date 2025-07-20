/**
 * Context Injection Application Types
 * 
 * Application service interfaces and result types for context injection operations.
 * Single responsibility: Type definitions for application layer contracts.
 */

import {
  ContextModule,
  TokenBudgetAllocation,
  ContextRelevanceFactors,
  ConversationPhase
} from '../../domain/services/interfaces/ContextInjectionTypes';

/**
 * Use case types for context injection optimization
 */
export type UseCase = 'greeting' | 'qualification' | 'demonstration' | 'closing';

/**
 * Result of context injection operation including all selected modules and metadata
 */
export interface ContextInjectionResult {
  selectedModules: ContextModule[];
  allocation: TokenBudgetAllocation;
  relevanceFactors: ContextRelevanceFactors;
  conversationPhase: ConversationPhase;
  recommendations: string[];
}

/**
 * Token budget recommendation with reasoning and adjustment factors
 */
export interface TokenBudgetRecommendation {
  recommended: number;
  minimum: number;
  maximum: number;
  reasoning: string[];
  adjustmentFactors: string[];
}