// Domain services imports
import { AIConversationFlowDecision } from '../../../domain/services/conversation-management/ConversationFlowService';

// Domain errors
import { BusinessRuleViolationError } from '../../../domain/errors/base/DomainErrorBase';

/**
 * Flow Validation Composition Service
 * 
 * AI INSTRUCTIONS:
 * - Focused validation service for AI conversation flow decisions
 * - Follow @golden-rule domain service delegation patterns
 * - Provide detailed validation context for debugging
 * - Use domain errors for validation failures
 * - Single responsibility: AI flow decision validation
 * - Keep under 100 lines - focused on validation concerns only
 * - No state management - pure validation logic
 * - Comprehensive error handling with context information
 */
export class FlowValidationCompositionService {
  
  // ===== FLOW DECISION VALIDATION METHODS =====
  
  /**
   * Validate AI conversation flow decision structure
   * 
   * AI INSTRUCTIONS:
   * - Validate decision object structure before processing
   * - Follow @golden-rule validation patterns
   * - Provide detailed validation context for debugging
   */
  static validateFlowDecision(decision: AIConversationFlowDecision): boolean {
    if (!decision) {
      throw new BusinessRuleViolationError(
        'AI conversation flow decision cannot be null or undefined',
        { service: 'ConversationFlowService', method: 'validateFlowDecision', decision }
      );
    }

    if (typeof decision !== 'object') {
      throw new BusinessRuleViolationError(
        'AI conversation flow decision must be an object',
        { 
          service: 'ConversationFlowService', 
          method: 'validateFlowDecision',
          actualType: typeof decision,
          decision 
        }
      );
    }

    // Additional validation can be added here based on AIConversationFlowDecision interface
    return true;
  }

  /**
   * Validate decision array for batch processing
   * 
   * AI INSTRUCTIONS:
   * - Validate array structure and contents for batch operations
   * - Follow @golden-rule validation patterns
   * - Provide detailed validation context for debugging
   */
  static validateDecisionArray(decisions: AIConversationFlowDecision[]): boolean {
    if (!Array.isArray(decisions)) {
      throw new BusinessRuleViolationError(
        'Decisions must be provided as an array for validation',
        { service: 'ConversationFlowService', method: 'validateDecisionArray' }
      );
    }

    if (decisions.length === 0) {
      throw new BusinessRuleViolationError(
        'Decision array cannot be empty',
        { service: 'ConversationFlowService', method: 'validateDecisionArray' }
      );
    }

    // Validate each decision in the array
    decisions.forEach((decision, index) => {
      try {
        this.validateFlowDecision(decision);
      } catch (error) {
        throw new BusinessRuleViolationError(
          `Invalid decision at index ${index}`,
          { 
            service: 'ConversationFlowService', 
            method: 'validateDecisionArray',
            index,
            originalError: error instanceof Error ? error.message : 'Unknown error'
          }
        );
      }
    });

    return true;
  }
}