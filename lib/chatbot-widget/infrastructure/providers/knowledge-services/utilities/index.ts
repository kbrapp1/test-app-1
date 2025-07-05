/**
 * AI INSTRUCTIONS: (Only need AI instruction at the top of the file ONCE)
 * - Central export point for utility services
 * - Maintains clean API surface for external consumers
 * - Groups related utility services logically
 * - Keep exports organized and well-documented
 */

// Content Distribution Services
export { KnowledgeContentDistributionService } from './KnowledgeContentDistributionService';

// Simple Utility Services (following @golden-rule patterns)
export { KnowledgeGroupingService } from './KnowledgeGroupingService';
export { KnowledgeStatsService } from './KnowledgeStatsService';
export { KnowledgeFormatService } from './KnowledgeFormatService';

// Content Hashing and Deduplication
export { KnowledgeContentHashingService } from './KnowledgeContentHashingService';

// Content Validation and Quality Assessment
export { KnowledgeValidationService } from './KnowledgeValidationService';
export { KnowledgeQualityService } from './KnowledgeQualityService';

// Content Chunking and Analysis
export { KnowledgeChunkingService } from './KnowledgeChunkingService';
export { KnowledgeAnalysisService } from './KnowledgeAnalysisService';

// Content Health
export { KnowledgeHealthService } from './KnowledgeHealthService';

// Content Comparison
export { KnowledgeComparisonService } from './KnowledgeComparisonService';

// Content Monitoring
export { KnowledgeMonitoringService } from './KnowledgeMonitoringService';
export type { HealthAlert } from './KnowledgeMonitoringService';

// Content Reporting
export { KnowledgeReportingService } from './KnowledgeReportingService';
export type { ContentSummary, ContentMetrics } from './KnowledgeReportingService';

// Content Similarity and Clustering
export { KnowledgeContentSimilarityService } from './KnowledgeContentSimilarityService';
export type { 
  SimilarityResult, 
  ClusterResult 
} from './KnowledgeContentSimilarityService'; 