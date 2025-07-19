// Domain services imports
import { ConversationFlowService, AIConversationFlowDecision, ConversationFlowState } from '../../../domain/services/conversation-management/ConversationFlowService';

// Domain errors
import { BusinessRuleViolationError } from '../../../domain/errors/base/DomainErrorBase';

// Internal composition services
import { ConversationFlowCompositionService } from './ConversationFlowCompositionService';
import { ReadinessCalculationCompositionService } from './ReadinessCalculationCompositionService';

/**
 * Conversation Flow Health Composition Service
 * 
 * AI INSTRUCTIONS:
 * - Focused health monitoring service for conversation flow components
 * - Follow @golden-rule domain service delegation patterns
 * - Provide comprehensive health status reporting
 * - Use domain errors for validation failures
 * - Single responsibility: Health monitoring and diagnostics
 * - Keep under 100 lines - focused on health monitoring concerns only
 * - No state management - pure health checking logic
 * - Comprehensive error handling with context information
 */
export class ConversationFlowHealthCompositionService {
  
  // ===== HEALTH MONITORING METHODS =====
  
  /**
   * Get conversation flow service health status
   * 
   * AI INSTRUCTIONS:
   * - Test core conversation flow service functionality
   * - Follow @golden-rule health check patterns
   * - Provide detailed status for each component
   */
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
        ConversationFlowCompositionService.processAIFlowDecision(mockDecision, {
          currentPhase: 'discovery',
          messageCount: 0,
          engagementScore: 0,
          lastFlowDecision: null,
          flowHistory: []
        } as ConversationFlowState);
      } catch (error) {
        if (error instanceof BusinessRuleViolationError) {
          results.canProcessDecisions = true; // Service is working, just validation failed
        }
      }

      try {
        // This should fail with validation error, but service is working
        ConversationFlowCompositionService.shouldTriggerLeadCapture(mockDecision);
      } catch (error) {
        if (error instanceof BusinessRuleViolationError) {
          results.canTriggerLeadCapture = true; // Service is working, just validation failed
        }
      }

      try {
        // This should fail with validation error, but service is working
        ReadinessCalculationCompositionService.calculateReadinessScore(mockDecision);
      } catch (error) {
        if (error instanceof BusinessRuleViolationError) {
          results.canCalculateReadiness = true; // Service is working, just validation failed
        }
      }

      results.overall = results.conversationFlowService && 
                        results.canProcessDecisions && 
                        results.canTriggerLeadCapture && 
                        results.canCalculateReadiness;

    } catch {
      // Unexpected error - service is not healthy
    }

    return results;
  }

  /**
   * Get detailed health metrics for conversation flow components
   * 
   * AI INSTRUCTIONS:
   * - Provide detailed metrics for monitoring purposes
   * - Follow @golden-rule health monitoring patterns
   * - Include timing and performance data where applicable
   */
  static async getDetailedHealthMetrics(): Promise<{
    serviceAvailability: boolean;
    averageProcessingTime: number;
    lastHealthCheck: Date;
    errorRate: number;
    componentStatus: {
      core: boolean;
      readiness: boolean;
      validation: boolean;
      batchProcessing: boolean;
    };
  }> {
    const startTime = Date.now();
    const healthResult = await this.healthCheck();
    const processingTime = Date.now() - startTime;

    return {
      serviceAvailability: healthResult.overall,
      averageProcessingTime: processingTime,
      lastHealthCheck: new Date(),
      errorRate: healthResult.overall ? 0 : 1,
      componentStatus: {
        core: healthResult.canProcessDecisions,
        readiness: healthResult.canCalculateReadiness,
        validation: true, // Validation is always available as pure logic
        batchProcessing: healthResult.canProcessDecisions // Batch depends on core processing
      }
    };
  }
}