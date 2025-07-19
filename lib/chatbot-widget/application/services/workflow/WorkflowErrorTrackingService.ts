/**
 * Workflow Error Tracking Service
 * 
 * AI INSTRUCTIONS:
 * - Handle error tracking and monitoring for workflow orchestration
 * - Coordinate error reporting and logging
 * - Maintain single responsibility for error handling
 * - Delegate to domain services for error tracking
 * - Keep under 200 lines following SRP
 */

import { IChatbotLoggingService, ISessionLogger } from '../../../domain/services/interfaces/IChatbotLoggingService';
import { ChatbotWidgetCompositionRoot } from '../../../infrastructure/composition/ChatbotWidgetCompositionRoot';
import { ProcessChatMessageRequest } from '../../dto/ProcessChatMessageRequest';

export class WorkflowErrorTrackingService {
  private readonly loggingService: IChatbotLoggingService;

  constructor() {
    this.loggingService = ChatbotWidgetCompositionRoot.getLoggingService();
  }

  /**
   * Track workflow error with comprehensive context
   */
  async trackError(
    error: unknown, 
    request: ProcessChatMessageRequest, 
    processingTime: number, 
    logger: ISessionLogger
  ): Promise<void> {
    try {
      const errorTrackingFacade = ChatbotWidgetCompositionRoot.getErrorTrackingFacade();
      
      await errorTrackingFacade.trackMessageProcessingError(
        this.extractErrorMessage(error),
        this.buildErrorContext(request, processingTime)
      );

      logger.logMessage('📊 Error tracked successfully');
    } catch (trackingError) {
      logger.logMessage('⚠️ Error tracking failed', { 
        trackingError: this.extractErrorMessage(trackingError)
      });
    }
  }

  /**
   * Extract error message from various error types
   */
  private extractErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    return String(error);
  }

  /**
   * Build error context for tracking
   */
  private buildErrorContext(request: ProcessChatMessageRequest, processingTime: number) {
    return {
      sessionId: request.sessionId,
      organizationId: request.organizationId,
      performanceMetrics: { 
        responseTime: processingTime, 
        memoryUsage: 0, 
        cpuUsage: 0 
      },
      metadata: { 
        userMessage: request.userMessage, 
        ...request.metadata 
      }
    };
  }
} 