/**
 * Embedding Error Logger
 * 
 * Domain service specialized for logging embedding generation errors.
 * Follows DDD principles with focused responsibility on AI embedding concerns.
 */

import { ISessionLogger } from '../../interfaces/IChatbotLoggingService';
import { EmbeddingGenerationError } from '../../../errors/KnowledgeProcessingError';

export interface EmbeddingErrorContext {
  query: string;
  queryLength: number;
  organizationId: string;
  attemptCount?: number;
  modelUsed?: string;
  tokenCount?: number;
}

export class EmbeddingErrorLogger {
  
  /**
   * Log embedding generation errors with AI-specific context
   */
  static logEmbeddingError(
    logger: ISessionLogger,
    error: Error | EmbeddingGenerationError,
    context: EmbeddingErrorContext
  ): void {
    logger.logMessage('❌ Embedding Generation Error:');
    logger.logMessage(`  Error: ${error.message}`);
    logger.logMessage(`  Query Length: ${context.queryLength} chars`);
    logger.logMessage(`  Organization: ${context.organizationId}`);
    
    if (context.attemptCount) {
      logger.logMessage(`  Attempt: ${context.attemptCount}`);
    }

    if (context.modelUsed) {
      logger.logMessage(`  Model: ${context.modelUsed}`);
    }

    if (context.tokenCount) {
      logger.logMessage(`  Estimated Tokens: ${context.tokenCount}`);
    }
    
    // Sanitize query for logging (remove sensitive info)
    const sanitizedQuery = EmbeddingErrorLogger.sanitizeQueryForLogging(context.query);
    logger.logMessage(`  Query Sample: "${sanitizedQuery}"`);
    
    logger.logError(error);

    // Log structured metrics for monitoring
    logger.logMetrics('embedding-error', {
      duration: 0,
      customMetrics: {
        queryLength: context.queryLength,
        attemptCount: context.attemptCount || 1,
        hasLongQuery: context.queryLength > 1000 ? 1 : 0,
        tokenEstimate: context.tokenCount || 0
      }
    });
  }

  /**
   * Log embedding quota/rate limit errors
   */
  static logEmbeddingQuotaError(
    logger: ISessionLogger,
    error: Error,
    context: EmbeddingErrorContext & {
      quotaType: 'rate_limit' | 'monthly_quota' | 'concurrent_limit';
      remainingQuota?: number;
      resetTime?: Date;
    }
  ): void {
    logger.logMessage('❌ Embedding Quota/Rate Limit Error:');
    logger.logMessage(`  Error: ${error.message}`);
    logger.logMessage(`  Quota Type: ${context.quotaType}`);
    logger.logMessage(`  Organization: ${context.organizationId}`);
    
    if (context.remainingQuota !== undefined) {
      logger.logMessage(`  Remaining Quota: ${context.remainingQuota}`);
    }

    if (context.resetTime) {
      logger.logMessage(`  Reset Time: ${context.resetTime.toISOString()}`);
    }

    if (context.attemptCount) {
      logger.logMessage(`  Attempt: ${context.attemptCount}`);
    }
    
    logger.logError(error);
  }

  /**
   * Log embedding model configuration errors
   */
  static logEmbeddingConfigError(
    logger: ISessionLogger,
    error: Error,
    context: EmbeddingErrorContext & {
      configIssue: 'invalid_model' | 'missing_api_key' | 'invalid_dimensions' | 'unsupported_format';
      expectedValue?: string;
      actualValue?: string;
    }
  ): void {
    logger.logMessage('❌ Embedding Configuration Error:');
    logger.logMessage(`  Error: ${error.message}`);
    logger.logMessage(`  Configuration Issue: ${context.configIssue}`);
    logger.logMessage(`  Organization: ${context.organizationId}`);
    
    if (context.expectedValue) {
      logger.logMessage(`  Expected: ${context.expectedValue}`);
    }

    if (context.actualValue) {
      logger.logMessage(`  Actual: ${context.actualValue}`);
    }
    
    logger.logError(error);
  }

  private static sanitizeQueryForLogging(query: string): string {
    const maxLength = 100;
    
    // Remove potential sensitive information patterns
    const sanitized = query
      .replace(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, '[CARD_REDACTED]')
      .replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[SSN_REDACTED]')
      .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL_REDACTED]');
    
    return sanitized.length > maxLength ? sanitized.substring(0, maxLength) + '...' : sanitized;
  }
}