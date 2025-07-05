/**
 * AI INSTRUCTIONS: (Only need AI instruction at the top of the file ONCE)
 * - Central export point for analytics services
 * - Maintains clean API surface for external consumers
 * - Groups related analytics services logically
 * - Keep exports organized and well-documented
 */

// Core Analytics Services
export { KnowledgeContentCoordinatorService } from './KnowledgeContentCoordinatorService';
// Moved to utilities - use KnowledgeReportingService
export { KnowledgeContentOptimizationService } from './KnowledgeContentOptimizationService';
export { KnowledgeContentAnalysisService } from './KnowledgeContentAnalysisService';
export { KnowledgeInsightsService } from './KnowledgeInsightsService';
export { KnowledgeTrendsService } from './KnowledgeTrendsService';

// Optimization Services
export { KnowledgeOptimizationRecommendationService } from './KnowledgeOptimizationRecommendationService';
export type { OptimizationRecommendation } from './KnowledgeOptimizationRecommendationService';
export { KnowledgeOptimizationPlanningService } from './KnowledgeOptimizationPlanningService';
export type { OptimizationPlan, ContentOptimizationMetrics } from './KnowledgeOptimizationPlanningService';

// Health and Quality Services
// Moved to utilities - use KnowledgeHealthService
// Moved to utilities - use KnowledgeMonitoringService
// Moved to utilities - use KnowledgeComparisonService
// Moved to utilities - use KnowledgeQualityService
export { KnowledgeContentPerformanceService } from './KnowledgeContentPerformanceService';
export type { PerformanceMetrics } from './KnowledgeContentPerformanceService';
export { KnowledgeQualityAnalysisService } from './KnowledgeQualityAnalysisService';

// Structure and Analysis Services
export { KnowledgeContentStructureService } from './KnowledgeContentStructureService';
export { KnowledgeContentPatternService } from './KnowledgeContentPatternService';
export { KnowledgeTagAnalysisService } from './KnowledgeTagAnalysisService';

// Tag Analysis Services
export { KnowledgeTagCoreAnalysisService } from './KnowledgeTagCoreAnalysisService';
export { KnowledgeTagQualityService } from './KnowledgeTagQualityService';
export { KnowledgeTagTrendsService } from './KnowledgeTagTrendsService';

// Re-export common types
export type { QualityScoreResult } from './KnowledgeContentPerformanceService';
// Moved to utilities - use KnowledgeComparisonService types 