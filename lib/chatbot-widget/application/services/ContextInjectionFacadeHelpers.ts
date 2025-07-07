/**
 * Context Injection Facade Helpers
 * 
 * AI INSTRUCTIONS:
 * - Pure utility functions extracted from ContextInjectionServiceFacade
 * - No business logic - just data transformation and formatting
 * - Keep functions simple and focused on single responsibility
 * - Follow @golden-rule patterns exactly
 * - Under 250 lines total
 */

import { ContextModule, TokenBudgetAllocation, ContextSelectionCriteria, ContextGenerationOptions } from '../../domain/services/interfaces/ContextInjectionTypes';

/**
 * Generate context content from modules
 * AI INSTRUCTIONS: Convert modules to usable content strings
 */
export function generateContextContent(modules: ContextModule[]): string[] {
  return modules.map(module => {
    try {
      return module.content();
    } catch (error) {
      console.warn(`Failed to generate content for module ${module.type}:`, error);
      return `${module.type}: Content generation failed`;
    }
  });
}

/**
 * Get context summary for monitoring and debugging
 * AI INSTRUCTIONS: Provide context selection summary with key metrics
 */
export function getContextSummary(
  selectedModules: ContextModule[],
  allocation: TokenBudgetAllocation
): {
  moduleCount: number;
  moduleTypes: string[];
  totalTokens: number;
  utilizationPercent: number;
  priorityBreakdown: Record<string, number>;
} {
  const moduleTypes = selectedModules.map(m => m.type);
  const totalTokens = allocation.totalUsed;
  const utilizationPercent = Math.round((totalTokens / allocation.totalAvailable) * 100);
  
  // Calculate priority breakdown
  const priorityBreakdown = selectedModules.reduce((acc, module) => {
    const priority = module.adjustedPriority || module.priority;
    acc[module.type] = priority;
    return acc;
  }, {} as Record<string, number>);
  
  return {
    moduleCount: selectedModules.length,
    moduleTypes,
    totalTokens,
    utilizationPercent,
    priorityBreakdown
  };
}

/**
 * Build enhanced context generation options
 * AI INSTRUCTIONS: Create comprehensive options for high-value prospects
 */
export function buildEnhancedContextOptions(): ContextGenerationOptions {
  return {
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
}

/**
 * Build minimal token budget for greetings
 * AI INSTRUCTIONS: Conservative budget for initial interactions
 */
export function getMinimalTokenBudget(): number {
  return 800; // Conservative budget for greetings
}

/**
 * Build criteria from token budget recommendation parameters
 * AI INSTRUCTIONS: Convert parameters to selection criteria format
 */
export function buildTokenBudgetCriteria(
  messageCount: number,
  entityData?: any,
  leadScore?: number,
  qualificationStatus?: string
): ContextSelectionCriteria {
  return {
    availableTokens: 0, // Not used for recommendation
    messageCount,
    entityData,
    leadScore,
    qualificationStatus
  };
}

/**
 * Build criteria from effectiveness analysis parameters
 * AI INSTRUCTIONS: Convert analysis parameters to selection criteria
 */
export function buildEffectivenessCriteria(
  allocation: TokenBudgetAllocation,
  messageCount: number,
  entityData?: any,
  leadScore?: number
): ContextSelectionCriteria {
  return {
    availableTokens: allocation.totalAvailable,
    messageCount,
    entityData,
    leadScore
  };
}