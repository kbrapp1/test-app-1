// Domain services imports
import { ConversationFlowService, AIConversationFlowDecision } from '../../../domain/services/conversation-management/ConversationFlowService';
import { ReadinessIndicators } from '../../../domain/services/conversation-management/ReadinessIndicatorDomainService';

// Domain errors
import { BusinessRuleViolationError } from '../../../domain/errors/base/DomainErrorBase';

/**
 * Readiness Calculation Composition Service
 * 
 * AI INSTRUCTIONS:
 * - Focused delegation service for AI readiness calculations
 * - Follow @golden-rule domain service delegation patterns
 * - Validate decision parameters before processing all operations
 * - Use domain errors for validation failures
 * - Single responsibility: Readiness calculation delegation
 * - Keep under 100 lines - focused on readiness concerns only
 * - No state management - pure delegation to domain services
 * - Comprehensive error handling with context information
 */
export class ReadinessCalculationCompositionService {
  
  // ===== READINESS CALCULATION DELEGATION METHODS =====
  
  /**
   * Calculate readiness score using AI flow decision
   * 
   * AI INSTRUCTIONS:
   * - Delegate to domain service for readiness score calculation
   * - Follow @golden-rule domain service delegation patterns
   * - Validate decision parameter before processing
   */
  static calculateReadinessScore(flowDecision: AIConversationFlowDecision): number {
    if (!flowDecision) {
      throw new BusinessRuleViolationError(
        'AI conversation flow decision is required for readiness score calculation',
        { service: 'ConversationFlowService', method: 'calculateReadinessScore' }
      );
    }
    
    try {
      return ConversationFlowService.calculateReadinessScore(flowDecision);
    } catch (error) {
      throw new BusinessRuleViolationError(
        'Failed to calculate readiness score',
        { 
          error: error instanceof Error ? error.message : 'Unknown error',
          decision: typeof flowDecision
        } as Record<string, unknown>
      );
    }
  }

  /**
   * Get derived readiness indicators from AI flow decision
   * 
   * AI INSTRUCTIONS:
   * - Delegate to domain service for readiness indicators retrieval
   * - Follow @golden-rule domain service delegation patterns
   * - Validate decision parameter before processing
   */
  static getReadinessIndicators(flowDecision: AIConversationFlowDecision): ReadinessIndicators {
    if (!flowDecision) {
      throw new BusinessRuleViolationError(
        'AI conversation flow decision is required for readiness indicators',
        { service: 'ConversationFlowService', method: 'getReadinessIndicators' }
      );
    }
    
    try {
      return ConversationFlowService.getReadinessIndicators(flowDecision);
    } catch (error) {
      throw new BusinessRuleViolationError(
        'Failed to get readiness indicators',
        { 
          error: error instanceof Error ? error.message : 'Unknown error',
          decision: typeof flowDecision
        } as Record<string, unknown>
      );
    }
  }
}