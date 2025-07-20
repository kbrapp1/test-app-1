/**
 * Knowledge Processing Logging Services
 * 
 * Barrel export for specialized DDD domain logging services.
 * Each service handles specific error logging concerns following single responsibility principle.
 */

// Specialized error loggers
export { EmbeddingErrorLogger } from './EmbeddingErrorLogger';
export { VectorSearchErrorLogger } from './VectorSearchErrorLogger';
export { CacheErrorLogger } from './CacheErrorLogger';
export { PerformanceErrorLogger } from './PerformanceErrorLogger';
export { CriticalErrorLogger } from './CriticalErrorLogger';

// Legacy unified logger (maintained for backward compatibility)
export { KnowledgeProcessingErrorLogger } from './KnowledgeProcessingErrorLogger';

// Performance and state loggers
export { SearchPerformanceLogger } from './SearchPerformanceLogger';
export { VectorCacheInitializationLogger } from './VectorCacheInitializationLogger';
export { VectorCacheStateLogger } from './VectorCacheStateLogger';
export { VectorSearchOperationLogger } from './VectorSearchOperationLogger';

// Re-export common types for convenience
export type { ErrorContext as LegacyErrorContext } from './KnowledgeProcessingErrorLogger';

// Export domain value objects
export { ErrorContext } from '../../../value-objects/ErrorContext';
export { ErrorImpact } from '../../../value-objects/ErrorImpact';

// Export domain errors
export {
  KnowledgeProcessingError,
  EmbeddingGenerationError,
  VectorSearchError,
  CacheInitializationError,
  MemoryManagementError,
  ConfigurationValidationError,
  PerformanceThresholdError,
  ErrorSeverity
} from '../../../errors/KnowledgeProcessingError';