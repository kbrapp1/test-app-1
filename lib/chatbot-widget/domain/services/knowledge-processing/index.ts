/**
 * Knowledge Processing Services Barrel Export
 * 
 * AI INSTRUCTIONS:
 * - Exports all knowledge processing domain services
 * - Maintains backward compatibility with existing imports
 * - Groups related services for clean architecture
 */

// Main services
export { KnowledgeSearchExecutionService } from './KnowledgeSearchExecutionService';
export { SearchExecutionCoordinatorService } from './SearchExecutionCoordinatorService';

// Specialized services
export { SearchValidationService } from './SearchValidationService';
export { SearchPerformanceTrackingService } from './SearchPerformanceTrackingService';
export type { SearchExecutionMetrics } from './SearchPerformanceTrackingService';
export type { PerformanceSnapshot } from './SearchPerformanceTrackingService';
export { SearchOperationLogger } from './SearchOperationLogger';

// Other knowledge processing services
export { KnowledgeBaseFormService } from './KnowledgeBaseFormService';
export { SearchMetricsLoggingService } from './SearchMetricsLoggingService';
export { VectorCacheInitializationService } from './VectorCacheInitializationService';