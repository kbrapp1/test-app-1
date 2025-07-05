/**
 * AI INSTRUCTIONS: (Only need AI instruction at the top of the file ONCE)
 * - Central export point for all knowledge services
 * - Maintains clean API surface for external consumers
 * - Groups related services logically
 * - Keep exports organized and well-documented
 */

// Core Knowledge Services
export { KnowledgeItemService } from './KnowledgeItemService';
export { KnowledgeConverterService } from './KnowledgeConverterService';
export { KnowledgeStatisticsService } from './KnowledgeStatisticsService';
export { KnowledgeAnalyticsCoordinatorService } from './KnowledgeAnalyticsCoordinatorService';
export { KnowledgeUtilityService } from './KnowledgeUtilityService';

// Search and Query Services
export { KnowledgeSearchService } from './KnowledgeSearchService';
export { KnowledgeAdvancedQueryService } from './KnowledgeAdvancedQueryService';
export { KnowledgeBasicFilterService } from './KnowledgeBasicFilterService';
export { KnowledgeRelevanceService } from './KnowledgeRelevanceService'; 

// Processing Services
// Moved to utilities - use KnowledgeChunkingService and KnowledgeAnalysisService
export { TagExtractionService } from './TagExtractionService';
export { PDFKnowledgeProcessor } from './PDFKnowledgeProcessor';
export { ProductCatalogProcessorService } from './ProductCatalogProcessorService';

// Analytics Services
export * from './analytics';

// Utility Services
export * from './utilities';

// Type Definitions
export * from './types/KnowledgeServiceTypes'; 