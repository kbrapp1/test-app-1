/**
 * Knowledge Processing Error Logger
 * 
 * Domain service responsible for logging errors in knowledge processing operations
 * following DDD principles for the chatbot domain.
 */

import { ISessionLogger } from '../../interfaces/IChatbotLoggingService';

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

export class KnowledgeProcessingErrorLogger {
  
  /**
   * Log errors with comprehensive context
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
    logger.logMessage('❌ Embedding Generation Error:');
    logger.logMessage(`  Error: ${error.message}`);
    logger.logMessage(`  Query Length: ${context.queryLength} chars`);
    logger.logMessage(`  Organization: ${context.organizationId}`);
    
    if (context.attemptCount) {
      logger.logMessage(`  Attempt: ${context.attemptCount}`);
    }
    
    // Sanitize query for logging (remove sensitive info)
    const sanitizedQuery = context.query.length > 100 ? 
      context.query.substring(0, 100) + '...' : context.query;
    logger.logMessage(`  Query Sample: "${sanitizedQuery}"`);
    
    logger.logError(error);
  }

  /**
   * Log vector search errors with detailed context
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
    logger.logMessage('❌ Vector Search Error:');
    logger.logMessage(`  Error: ${error.message}`);
    logger.logMessage(`  Cache Size: ${context.cacheSize} vectors`);
    logger.logMessage(`  Query Dimensions: ${context.queryDimensions}`);
    logger.logMessage(`  Threshold: ${context.threshold}`);
    logger.logMessage(`  Limit: ${context.limit}`);
    
    if (context.searchTimeMs) {
      logger.logMessage(`  Duration Before Error: ${context.searchTimeMs}ms`);
    }
    
    logger.logError(error);
  }

  /**
   * Log cache initialization errors
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
    logger.logMessage('❌ Cache Initialization Error:');
    logger.logMessage(`  Error: ${error.message}`);
    logger.logMessage(`  Stage: ${context.initializationStage}`);
    logger.logMessage(`  Vector Count: ${context.vectorCount}`);
    logger.logMessage(`  Max Memory: ${context.maxMemoryKB} KB`);
    logger.logMessage(`  Organization: ${context.organizationId}`);
    
    logger.logError(error);
  }

  /**
   * Log memory management errors
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
    logger.logMessage('❌ Memory Management Error:');
    logger.logMessage(`  Error: ${error.message}`);
    logger.logMessage(`  Operation: ${context.operation}`);
    logger.logMessage(`  Current Memory: ${context.currentMemoryKB} KB`);
    
    if (context.targetMemoryKB) {
      logger.logMessage(`  Target Memory: ${context.targetMemoryKB} KB`);
    }
    
    if (context.vectorsAffected) {
      logger.logMessage(`  Vectors Affected: ${context.vectorsAffected}`);
    }
    
    logger.logError(error);
  }

  /**
   * Log configuration validation errors
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
    logger.logMessage(`⚠️ Performance Threshold Exceeded [${operation}]:`);
    logger.logMessage(`  Actual Time: ${context.actualTimeMs}ms`);
    logger.logMessage(`  Max Allowed: ${context.maxAllowedTimeMs}ms`);
    logger.logMessage(`  Overage: ${context.actualTimeMs - context.maxAllowedTimeMs}ms`);
    
    if (context.additionalMetrics) {
      Object.entries(context.additionalMetrics).forEach(([key, value]) => {
        logger.logMessage(`  ${key}: ${value}`);
      });
    }
  }

  /**
   * Log error recovery attempts
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
    logger.logMessage('🚨 CRITICAL ERROR DETECTED:');
    logger.logMessage(`  Error: ${error.message}`);
    logger.logMessage(`  Operation: ${context.operation}`);
    logger.logMessage(`  Scope: ${impact.scope}`);
    logger.logMessage(`  Severity: ${impact.severity}`);
    logger.logMessage(`  User Facing: ${impact.userFacing ? 'Yes' : 'No'}`);
    
    if (context.organizationId) {
      logger.logMessage(`  Organization: ${context.organizationId}`);
    }
    
    if (context.sessionId) {
      logger.logMessage(`  Session: ${context.sessionId}`);
    }
    
    // Log additional context
    Object.entries(context).forEach(([key, value]) => {
      if (key !== 'operation' && value !== undefined) {
        logger.logMessage(`  ${key}: ${String(value)}`);
      }
    });
    
    logger.logError(error);
    
    // Log structured metrics for alerting
    logger.logMetrics('critical-error', {
      duration: 0,
      customMetrics: {
        severityLevel: impact.severity === 'critical' ? 4 : impact.severity === 'high' ? 3 : impact.severity === 'medium' ? 2 : 1,
        scopeLevel: impact.scope === 'system' ? 3 : impact.scope === 'organization' ? 2 : 1,
        userFacing: impact.userFacing ? 1 : 0,
        errorTypeHash: error.constructor.name.length
      }
    });
  }
}