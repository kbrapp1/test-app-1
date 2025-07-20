/**
 * Knowledge Processing Domain Errors
 * 
 * Domain-specific errors for knowledge processing operations in the chatbot domain.
 * Following DDD principles with proper error categorization and context.
 */

export abstract class KnowledgeProcessingError extends Error {
  abstract readonly code: string;
  abstract readonly severity: ErrorSeverity;
  
  constructor(
    message: string,
    public readonly context?: Record<string, unknown>
  ) {
    super(message);
    this.name = this.constructor.name;
  }

  toLogContext(): Record<string, unknown> {
    return {
      code: this.code,
      severity: this.severity,
      message: this.message,
      ...this.context
    };
  }
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium', 
  HIGH = 'high',
  CRITICAL = 'critical'
}

export class EmbeddingGenerationError extends KnowledgeProcessingError {
  readonly code = 'EMBEDDING_GENERATION_FAILED';
  readonly severity = ErrorSeverity.HIGH;

  constructor(
    message: string,
    context: {
      query: string;
      queryLength: number;
      organizationId: string;
      attemptCount?: number;
    }
  ) {
    super(message, context);
  }
}

export class VectorSearchError extends KnowledgeProcessingError {
  readonly code = 'VECTOR_SEARCH_FAILED';
  readonly severity = ErrorSeverity.HIGH;

  constructor(
    message: string,
    context: {
      cacheSize: number;
      queryDimensions: number;
      threshold: number;
      limit: number;
      searchTimeMs?: number;
    }
  ) {
    super(message, context);
  }
}

export class CacheInitializationError extends KnowledgeProcessingError {
  readonly code = 'CACHE_INITIALIZATION_FAILED';
  readonly severity = ErrorSeverity.CRITICAL;

  constructor(
    message: string,
    context: {
      vectorCount: number;
      maxMemoryKB: number;
      organizationId: string;
      initializationStage: string;
    }
  ) {
    super(message, context);
  }
}

export class MemoryManagementError extends KnowledgeProcessingError {
  readonly code = 'MEMORY_MANAGEMENT_FAILED';
  readonly severity = ErrorSeverity.MEDIUM;

  constructor(
    message: string,
    context: {
      operation: 'eviction' | 'allocation' | 'cleanup';
      currentMemoryKB: number;
      targetMemoryKB?: number;
      vectorsAffected?: number;
    }
  ) {
    super(message, context);
  }
}

export class ConfigurationValidationError extends KnowledgeProcessingError {
  readonly code = 'CONFIGURATION_VALIDATION_FAILED';
  readonly severity = ErrorSeverity.MEDIUM;

  constructor(
    message: string,
    context: {
      configType: string;
      validationField?: string;
      providedValue?: unknown;
      expectedRange?: string;
    }
  ) {
    super(message, context);
  }
}

export class PerformanceThresholdError extends KnowledgeProcessingError {
  readonly code = 'PERFORMANCE_THRESHOLD_EXCEEDED';
  readonly severity = ErrorSeverity.MEDIUM;

  constructor(
    operation: string,
    context: {
      actualTimeMs: number;
      maxAllowedTimeMs: number;
      additionalMetrics?: Record<string, number>;
    }
  ) {
    super(`Performance threshold exceeded for ${operation}`, { operation, ...context });
  }

  get overage(): number {
    const context = this.context as { actualTimeMs: number; maxAllowedTimeMs: number };
    return context.actualTimeMs - context.maxAllowedTimeMs;
  }
}