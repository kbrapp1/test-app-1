/**
 * Context Injection Facade Validation
 * 
 * AI INSTRUCTIONS:
 * - Validation logic extracted from ContextInjectionServiceFacade
 * - Focus on quality assurance and business rule compliance
 * - Keep validation functions pure and focused
 * - Follow @golden-rule patterns exactly
 * - Under 250 lines total
 */

import { ContextModule, TokenBudgetAllocation, ContextSelectionCriteria } from '../../domain/services/interfaces/ContextInjectionTypes';

/**
 * Validation result interface
 * AI INSTRUCTIONS: Structured validation response format
 */
export interface ValidationResult {
  isValid: boolean;
  warnings: string[];
  errors: string[];
  suggestions: string[];
}

/**
 * Validate context selection for quality assurance
 * AI INSTRUCTIONS: Check context quality and completeness
 */
export function validateContextSelection(
  selectedModules: ContextModule[],
  allocation: TokenBudgetAllocation,
  criteria: ContextSelectionCriteria
): ValidationResult {
  const warnings: string[] = [];
  const errors: string[] = [];
  const suggestions: string[] = [];
  
  // Check for essential modules
  const hasEssential = selectedModules.some(m => 
    m.type === 'userProfile' || m.type === 'conversationPhase'
  );
  if (!hasEssential) {
    errors.push('Missing essential context modules');
  }
  
  // Check token utilization
  const utilization = allocation.totalUsed / allocation.totalAvailable;
  if (utilization < 0.3) {
    warnings.push('Low token utilization - consider adding more context');
  } else if (utilization > 0.95) {
    warnings.push('Very high token utilization - risk of budget overflow');
  }
  
  // Check for high-value lead optimization
  if (criteria.leadScore && criteria.leadScore > 70) {
    const hasLeadScoring = selectedModules.some(m => m.type === 'leadScoring');
    if (!hasLeadScoring) {
      suggestions.push('Consider including lead scoring context for high-value prospects');
    }
  }
  
  return {
    isValid: errors.length === 0,
    warnings,
    errors,
    suggestions
  };
}

/**
 * Validate facade method parameters
 * AI INSTRUCTIONS: Input validation for facade methods
 */
export function validateFacadeInputs(
  session: unknown,
  chatbotConfig: unknown,
  availableTokens?: number
): string[] {
  const errors: string[] = [];
  
  if (!session) {
    errors.push('Session is required');
  }
  
  if (!chatbotConfig) {
    errors.push('Chatbot config is required');
  }
  
  if (availableTokens !== undefined && availableTokens < 0) {
    errors.push('Available tokens must be non-negative');
  }
  
  return errors;
}

/**
 * Validate conversation phase parameter
 * AI INSTRUCTIONS: Ensure valid conversation phase values
 */
export function validateConversationPhase(phase: string): boolean {
  const validPhases = ['greeting', 'qualification', 'demonstration', 'closing'];
  return validPhases.includes(phase);
}

/**
 * Validate entity data structure
 * AI INSTRUCTIONS: Basic entity data validation
 */
export function validateEntityData(entityData: unknown): string[] {
  const errors: string[] = [];
  
  if (entityData && typeof entityData !== 'object') {
    errors.push('Entity data must be an object');
  }
  
  return errors;
}

/**
 * Validate lead score range
 * AI INSTRUCTIONS: Ensure lead score is within valid range
 */
export function validateLeadScore(leadScore?: number): string[] {
  const errors: string[] = [];
  
  if (leadScore !== undefined) {
    if (typeof leadScore !== 'number') {
      errors.push('Lead score must be a number');
    } else if (leadScore < 0 || leadScore > 100) {
      errors.push('Lead score must be between 0 and 100');
    }
  }
  
  return errors;
}