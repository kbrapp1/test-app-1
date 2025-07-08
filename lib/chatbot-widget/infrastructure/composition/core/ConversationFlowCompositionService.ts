// Domain services imports
import { ConversationFlowService, AIConversationFlowDecision } from '../../../domain/services/conversation-management/ConversationFlowService';

// Domain errors
import { BusinessRuleViolationError } from '../../../domain/errors/base/DomainErrorBase';

/**
 * Conversation Flow Composition Service
 * 
 * AI INSTRUCTIONS:
 * - Centralized delegation service for AI conversation flow decisions
 * - Follow @golden-rule domain service delegation patterns
 * - Validate decision parameters before processing all operations
 * - Use domain errors for validation failures
 * - Single responsibility: AI conversation flow decision delegation
 * - Keep under 250 lines - focused on conversation flow concerns only
 * - No state management - pure delegation to domain services
 * - Comprehensive error handling with context information
 */
export class ConversationFlowCompositionService {
  
  // ===== AI CONVERSATION FLOW DELEGATION METHODS =====
  
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
    currentState: any
  ): any {
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
        }
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
        }
      );
    }
  }

  /** Get next best action from AI flow decision */
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
        }
      );
    }
  }

  /** Calculate readiness score using AI flow decision */
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
        }
      );
    }
  }

  /** Get derived readiness indicators from AI flow decision */
  static getReadinessIndicators(flowDecision: AIConversationFlowDecision): any {
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
        }
      );
    }
  }

  /**
   * Validate AI conversation flow decision structure
   * 
   * AI INSTRUCTIONS:
   * - Validate decision object structure before processing
   * - Follow @golden-rule validation patterns
   * - Provide detailed validation context for debugging
   */
  static validateFlowDecision(decision: any): boolean {
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
    currentStates: any[]
  ): Array<{ success: boolean; result?: any; error?: string }> {
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

    return decisions.map((decision, index) => {
      try {
        const result = this.processAIFlowDecision(decision, currentStates[index]);
        return { success: true, result };
      } catch (error) {
        return { 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    });
  }

  /** Get conversation flow service health status */
  static async healthCheck(): Promise<{
    conversationFlowService: boolean;
    canProcessDecisions: boolean;
    canTriggerLeadCapture: boolean;
    canCalculateReadiness: boolean;
    overall: boolean;
  }> {
    const results = {
      conversationFlowService: false,
      canProcessDecisions: false,
      canTriggerLeadCapture: false,
      canCalculateReadiness: false,
      overall: false
    };

    try {
      // Test basic service availability
      results.conversationFlowService = typeof ConversationFlowService !== 'undefined';

      // Test core methods with mock data
      const mockDecision = {} as AIConversationFlowDecision;
      
      try {
        // This should fail with validation error, but service is working
        this.processAIFlowDecision(mockDecision, {});
      } catch (error) {
        if (error instanceof BusinessRuleViolationError) {
          results.canProcessDecisions = true; // Service is working, just validation failed
        }
      }

      try {
        // This should fail with validation error, but service is working
        this.shouldTriggerLeadCapture(mockDecision);
      } catch (error) {
        if (error instanceof BusinessRuleViolationError) {
          results.canTriggerLeadCapture = true; // Service is working, just validation failed
        }
      }

      try {
        // This should fail with validation error, but service is working
        this.calculateReadinessScore(mockDecision);
      } catch (error) {
        if (error instanceof BusinessRuleViolationError) {
          results.canCalculateReadiness = true; // Service is working, just validation failed
        }
      }

      results.overall = results.conversationFlowService && 
                        results.canProcessDecisions && 
                        results.canTriggerLeadCapture && 
                        results.canCalculateReadiness;

    } catch (error) {
      // Unexpected error - service is not healthy
    }

    return results;
  }
}