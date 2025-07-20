/**
 * Knowledge Processing Error Logger (Legacy Unified Interface)
 * 
 * REFACTORED: This file now serves as a backward-compatible facade over specialized DDD domain services.
 * New code should use the specialized loggers directly for better domain separation.
 * 
 * @deprecated Use specialized loggers: EmbeddingErrorLogger, VectorSearchErrorLogger, etc.
 */

import { ISessionLogger } from '../../interfaces/IChatbotLoggingService';
import { EmbeddingErrorLogger } from './EmbeddingErrorLogger';
import { VectorSearchErrorLogger } from './VectorSearchErrorLogger';
import { CacheErrorLogger } from './CacheErrorLogger';
import { PerformanceErrorLogger } from './PerformanceErrorLogger';
import { CriticalErrorLogger } from './CriticalErrorLogger';
import { ErrorContext as DomainErrorContextVO } from '../../../value-objects/ErrorContext';
import { ErrorImpact } from '../../../value-objects/ErrorImpact';

// Legacy interface for backward compatibility
export interface ErrorContext {
  operation: string;
  organizationId?: string;
  chatbotConfigId?: string;
  sessionId?: string;
  userQuery?: string;
  vectorCount?: number;
  memoryUsage?: number;
  searchOptions?: Record<string, unknown>;
}

/**
 * @deprecated Use specialized domain loggers instead
 */
export class KnowledgeProcessingErrorLogger {
  
  /**
   * Log errors with comprehensive context
   * @deprecated Use specialized loggers for better domain separation
   */
  static logError(
    logger: ISessionLogger,
    error: Error,
    operation: string,
    context?: Record<string, unknown>
  ): void {
    logger.logMessage(`❌ Error in ${operation}:`);
    logger.logMessage(`  Message: ${error.message}`);
    
    if (context) {
      Object.entries(context).forEach(([key, value]) => {
        logger.logMessage(`  ${key}: ${String(value)}`);
      });
    }
    
    logger.logError(error);
  }

  /**
   * Log embedding generation errors with specific context
   * @deprecated Use EmbeddingErrorLogger.logEmbeddingError() instead
   */
  static logEmbeddingError(
    logger: ISessionLogger,
    error: Error,
    context: {
      query: string;
      queryLength: number;
      organizationId: string;
      attemptCount?: number;
    }
  ): void {
    // Delegate to specialized logger
    EmbeddingErrorLogger.logEmbeddingError(logger, error, context);
  }

  /**
   * Log vector search errors with detailed context
   * @deprecated Use VectorSearchErrorLogger.logVectorSearchError() instead
   */
  static logVectorSearchError(
    logger: ISessionLogger,
    error: Error,
    context: {
      cacheSize: number;
      queryDimensions: number;
      threshold: number;
      limit: number;
      searchTimeMs?: number;
    }
  ): void {
    // Delegate to specialized logger
    VectorSearchErrorLogger.logVectorSearchError(logger, error, context);
  }

  /**
   * Log cache initialization errors
   * @deprecated Use CacheErrorLogger.logCacheInitializationError() instead
   */
  static logCacheInitializationError(
    logger: ISessionLogger,
    error: Error,
    context: {
      vectorCount: number;
      maxMemoryKB: number;
      organizationId: string;
      initializationStage: string;
    }
  ): void {
    // Delegate to specialized logger
    CacheErrorLogger.logCacheInitializationError(logger, error, {
      ...context,
      cacheType: undefined,
      storageBackend: undefined
    });
  }

  /**
   * Log memory management errors
   * @deprecated Use CacheErrorLogger.logMemoryError() instead
   */
  static logMemoryError(
    logger: ISessionLogger,
    error: Error,
    context: {
      operation: 'eviction' | 'allocation' | 'cleanup';
      currentMemoryKB: number;
      targetMemoryKB?: number;
      vectorsAffected?: number;
    }
  ): void {
    // Delegate to specialized logger
    CacheErrorLogger.logMemoryError(logger, error, context);
  }

  /**
   * Log configuration validation errors
   * @deprecated Use domain-specific error handling instead
   */
  static logConfigurationError(
    logger: ISessionLogger,
    error: Error,
    context: {
      configType: string;
      validationField?: string;
      providedValue?: unknown;
      expectedRange?: string;
    }
  ): void {
    logger.logMessage('❌ Configuration Validation Error:');
    logger.logMessage(`  Error: ${error.message}`);
    logger.logMessage(`  Config Type: ${context.configType}`);
    
    if (context.validationField) {
      logger.logMessage(`  Field: ${context.validationField}`);
    }
    
    if (context.providedValue !== undefined) {
      logger.logMessage(`  Provided Value: ${String(context.providedValue)}`);
    }
    
    if (context.expectedRange) {
      logger.logMessage(`  Expected Range: ${context.expectedRange}`);
    }
    
    logger.logError(error);
  }

  /**
   * Log performance threshold violations
   * @deprecated Use PerformanceErrorLogger.logPerformanceError() instead
   */
  static logPerformanceError(
    logger: ISessionLogger,
    operation: string,
    context: {
      actualTimeMs: number;
      maxAllowedTimeMs: number;
      additionalMetrics?: Record<string, number>;
    }
  ): void {
    // Delegate to specialized logger
    PerformanceErrorLogger.logPerformanceError(logger, operation, {
      ...context,
      operation
    });
  }

  /**
   * Log error recovery attempts
   * @deprecated Use PerformanceErrorLogger.logErrorRecoveryPerformance() for performance impact tracking
   */
  static logErrorRecovery(
    logger: ISessionLogger,
    originalError: Error,
    recoveryAction: string,
    recoveryResult: 'success' | 'failed' | 'partial',
    context?: {
      attemptNumber: number;
      maxAttempts: number;
      recoveryTimeMs?: number;
    }
  ): void {
    logger.logMessage(`🔄 Error Recovery Attempt [${recoveryAction}]:`);
    logger.logMessage(`  Original Error: ${originalError.message}`);
    logger.logMessage(`  Recovery Result: ${recoveryResult}`);
    
    if (context) {
      logger.logMessage(`  Attempt: ${context.attemptNumber}/${context.maxAttempts}`);
      
      if (context.recoveryTimeMs) {
        logger.logMessage(`  Recovery Time: ${context.recoveryTimeMs}ms`);
      }
    }
    
    if (recoveryResult === 'success') {
      logger.logMessage('✅ Error successfully recovered');
    } else if (recoveryResult === 'failed') {
      logger.logMessage('❌ Error recovery failed');
    } else {
      logger.logMessage('⚠️ Partial error recovery achieved');
    }
  }

  /**
   * Log critical system errors that require immediate attention
   * @deprecated Use CriticalErrorLogger.logCriticalError() with proper domain value objects instead
   */
  static logCriticalError(
    logger: ISessionLogger,
    error: Error,
    context: ErrorContext,
    impact: {
      scope: 'user' | 'organization' | 'system';
      severity: 'low' | 'medium' | 'high' | 'critical';
      userFacing: boolean;
    }
  ): void {
    // Convert legacy interfaces to domain value objects
    const errorContext = DomainErrorContextVO.create(context);
    const errorImpact = ErrorImpact.create(impact);
    
    // Delegate to specialized logger
    CriticalErrorLogger.logCriticalError(logger, error, errorContext, errorImpact);
  }
}