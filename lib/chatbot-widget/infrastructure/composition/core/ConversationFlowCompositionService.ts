// Domain services imports
import { ConversationFlowService, AIConversationFlowDecision, ConversationFlowState } from '../../../domain/services/conversation-management/ConversationFlowService';

// Domain errors
import { BusinessRuleViolationError } from '../../../domain/errors/base/DomainErrorBase';

/**
 * Core Conversation Flow Composition Service
 * 
 * AI INSTRUCTIONS:
 * - Focused delegation service for core AI conversation flow decisions
 * - Follow @golden-rule domain service delegation patterns
 * - Validate decision parameters before processing all operations
 * - Use domain errors for validation failures
 * - Single responsibility: Core AI conversation flow decision delegation
 * - Keep under 100 lines - focused on core flow concerns only
 * - No state management - pure delegation to domain services
 * - Comprehensive error handling with context information
 */
export class ConversationFlowCompositionService {
  
  // ===== CORE AI CONVERSATION FLOW DELEGATION METHODS =====
  
  /**
   * Process AI conversation flow decision
   * 
   * AI INSTRUCTIONS:
   * - Delegate to domain service for AI flow processing
   * - Follow @golden-rule domain service delegation patterns
   * - Validate decision parameter before processing
   */
  static processAIFlowDecision(
    decision: AIConversationFlowDecision,
    currentState: ConversationFlowState
  ): ConversationFlowState {
    if (!decision) {
      throw new BusinessRuleViolationError(
        'AI conversation flow decision is required for processing',
        { service: 'ConversationFlowService', method: 'processAIFlowDecision' }
      );
    }
    
    try {
      return ConversationFlowService.processAIFlowDecision(decision, currentState);
    } catch (error) {
      throw new BusinessRuleViolationError(
        'Failed to process AI conversation flow decision',
        { 
          error: error instanceof Error ? error.message : 'Unknown error',
          decision: typeof decision,
          hasCurrentState: !!currentState
        } as Record<string, unknown>
      );
    }
  }

  /**
   * Check if lead capture should be triggered using AI decision
   * 
   * AI INSTRUCTIONS:
   * - Delegate to domain service for lead capture decision
   * - Follow @golden-rule domain service delegation patterns
   * - Validate decision parameter before processing
   */
  static shouldTriggerLeadCapture(decision: AIConversationFlowDecision): boolean {
    if (!decision) {
      throw new BusinessRuleViolationError(
        'AI conversation flow decision is required for lead capture check',
        { service: 'ConversationFlowService', method: 'shouldTriggerLeadCapture' }
      );
    }
    
    try {
      return ConversationFlowService.shouldTriggerLeadCapture(decision);
    } catch (error) {
      throw new BusinessRuleViolationError(
        'Failed to check lead capture trigger',
        { 
          error: error instanceof Error ? error.message : 'Unknown error',
          decision: typeof decision
        } as Record<string, unknown>
      );
    }
  }

  /**
   * Get next best action from AI flow decision
   * 
   * AI INSTRUCTIONS:
   * - Delegate to domain service for next action determination
   * - Follow @golden-rule domain service delegation patterns
   * - Validate decision parameter before processing
   */
  static getNextBestAction(decision: AIConversationFlowDecision): string {
    if (!decision) {
      throw new BusinessRuleViolationError(
        'AI conversation flow decision is required for next action determination',
        { service: 'ConversationFlowService', method: 'getNextBestAction' }
      );
    }
    
    try {
      return ConversationFlowService.getNextBestAction(decision);
    } catch (error) {
      throw new BusinessRuleViolationError(
        'Failed to get next best action',
        { 
          error: error instanceof Error ? error.message : 'Unknown error',
          decision: typeof decision
        } as Record<string, unknown>
      );
    }
  }
}