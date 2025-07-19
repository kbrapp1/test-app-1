// Domain services imports
import { AIConversationFlowDecision, ConversationFlowState } from '../../../domain/services/conversation-management/ConversationFlowService';

// Domain errors
import { BusinessRuleViolationError } from '../../../domain/errors/base/DomainErrorBase';

// Internal composition services
import { ConversationFlowCompositionService } from './ConversationFlowCompositionService';
import { FlowValidationCompositionService } from './FlowValidationCompositionService';

/**
 * Flow Batch Processing Composition Service
 * 
 * AI INSTRUCTIONS:
 * - Focused batch processing service for AI conversation flow decisions
 * - Follow @golden-rule domain service delegation patterns
 * - Provide error handling for each decision independently
 * - Use domain errors for validation failures
 * - Single responsibility: Batch flow decision processing
 * - Keep under 100 lines - focused on batch processing concerns only
 * - No state management - pure batch processing logic
 * - Comprehensive error handling with context information
 */
export class FlowBatchProcessingCompositionService {
  
  // ===== BATCH PROCESSING DELEGATION METHODS =====
  
  /**
   * Batch process multiple AI flow decisions
   * 
   * AI INSTRUCTIONS:
   * - Process multiple decisions efficiently
   * - Follow @golden-rule batch processing patterns
   * - Provide error handling for each decision independently
   * - Return results with success/failure status for each
   */
  static batchProcessFlowDecisions(
    decisions: AIConversationFlowDecision[],
    currentStates: ConversationFlowState[]
  ): Array<{ success: boolean; result?: ConversationFlowState; error?: string }> {
    if (!Array.isArray(decisions)) {
      throw new BusinessRuleViolationError(
        'Decisions must be provided as an array for batch processing',
        { service: 'ConversationFlowService', method: 'batchProcessFlowDecisions' }
      );
    }

    if (!Array.isArray(currentStates)) {
      throw new BusinessRuleViolationError(
        'Current states must be provided as an array for batch processing',
        { service: 'ConversationFlowService', method: 'batchProcessFlowDecisions' }
      );
    }

    if (decisions.length !== currentStates.length) {
      throw new BusinessRuleViolationError(
        'Decisions and current states arrays must have the same length',
        { 
          service: 'ConversationFlowService', 
          method: 'batchProcessFlowDecisions',
          decisionsLength: decisions.length,
          statesLength: currentStates.length
        }
      );
    }

    // Validate all decisions before processing
    try {
      FlowValidationCompositionService.validateDecisionArray(decisions);
    } catch (error) {
      throw new BusinessRuleViolationError(
        'Batch validation failed',
        { 
          service: 'ConversationFlowService', 
          method: 'batchProcessFlowDecisions',
          validationError: error instanceof Error ? error.message : 'Unknown validation error'
        }
      );
    }

    return decisions.map((decision, index) => {
      try {
        const result = ConversationFlowCompositionService.processAIFlowDecision(decision, currentStates[index]);
        return { success: true, result };
      } catch (error) {
        return { 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    });
  }

  /**
   * Batch check lead capture triggers for multiple decisions
   * 
   * AI INSTRUCTIONS:
   * - Check lead capture for multiple decisions efficiently
   * - Follow @golden-rule batch processing patterns
   * - Provide error handling for each decision independently
   */
  static batchCheckLeadCapture(
    decisions: AIConversationFlowDecision[]
  ): Array<{ success: boolean; result?: boolean; error?: string }> {
    if (!Array.isArray(decisions)) {
      throw new BusinessRuleViolationError(
        'Decisions must be provided as an array for batch lead capture check',
        { service: 'ConversationFlowService', method: 'batchCheckLeadCapture' }
      );
    }

    return decisions.map((decision) => {
      try {
        const result = ConversationFlowCompositionService.shouldTriggerLeadCapture(decision);
        return { success: true, result };
      } catch (error) {
        return { 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    });
  }
}