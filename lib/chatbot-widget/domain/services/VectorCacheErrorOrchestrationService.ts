/**
 * Vector Cache Error Orchestration Service
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Orchestrate vector cache error handling workflows
 * - Domain service focused on coordinating error reporting and logging
 * - Keep business logic pure, no external dependencies beyond domain services
 * - Never exceed 250 lines per @golden-rule
 * - Delegate all specialized operations to focused services
 * - Handle error workflows with comprehensive logging
 * - Support troubleshooting and monitoring
 */

import { ISessionLogger } from './interfaces/IChatbotLoggingService';
import { VectorCacheLoggingService } from './VectorCacheLoggingService';

/** Orchestration Service for Vector Cache Error Handling */
export class VectorCacheErrorOrchestrationService {
  
  /**
   * Orchestrate error handling and logging
   * 
   * AI INSTRUCTIONS:
   * - Coordinate comprehensive error reporting
   * - Handle error context and debugging information
   * - Support troubleshooting and monitoring
   * - Ensure error information is preserved even if logging fails
   */
  static orchestrateErrorHandling(
    operation: string,
    error: Error,
    context: Record<string, unknown>,
    logger: ISessionLogger
  ): void {
    try {
      VectorCacheLoggingService.logError(
        logger,
        error instanceof Error ? error : new Error(String(error)),
        operation,
        context
      );
    } catch (loggingError) {
      // If logging fails, at least preserve the original error
      console.error('Failed to log vector cache error:', loggingError);
      console.error('Original error:', error);
    }
  }
}