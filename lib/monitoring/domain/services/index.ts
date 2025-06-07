// Domain Services - Business Logic Layer
// Following DDD principles and Single Responsibility Principle

export { ReactQueryCacheAnalysisService } from './ReactQueryCacheAnalysisService';
export { CacheKeyMismatchDetector } from './CacheKeyMismatchDetector';
export { CachePatternDetector } from './CachePatternDetector';

// Existing domain services
export { NetworkAnalysisService } from './NetworkAnalysisService';
export { NetworkBusinessImpactService } from './NetworkBusinessImpactService';
export { NetworkPatternAnalysisService } from './NetworkPatternAnalysisService';
export { ReactQueryOptimizationService } from './ReactQueryOptimizationService';
export { BusinessImpactCalculationService } from './BusinessImpactCalculationService';
export { IssueAnalysisService } from './IssueAnalysisService';
export { FrontendOptimizationAnalysisService } from './FrontendOptimizationAnalysisService';
export { CauseAnalysisService } from './CauseAnalysisService';
export { WebVitalsAnalysisService } from './WebVitalsAnalysisService';

// Specialized Frontend Optimization Services (DDD Refactored)
export { OptimizationPriorityAssessmentService } from './OptimizationPriorityAssessmentService';
export { BusinessImpactCalculatorService } from './BusinessImpactCalculatorService';
export { OptimizationFixGeneratorService } from './OptimizationFixGeneratorService';
export { WebVitalsImpactAssessorService } from './WebVitalsImpactAssessorService';
export { SpecificCauseAnalyzerService } from './SpecificCauseAnalyzerService';

// Specialized Cache Analysis Services (DDD Refactored)
export { ServerActionDuplicateDetector } from './ServerActionDuplicateDetector';
export { ServerActionLegitimacyAnalyzer } from './ServerActionLegitimacyAnalyzer';
export { PaginationPatternDetector } from './PaginationPatternDetector';
export type { LegitimacyAnalysisResult } from './ServerActionLegitimacyAnalyzer';
export type { PaginationDetectionResult } from './PaginationPatternDetector';

export type { IRuntimeDetectionService } from './IRuntimeDetectionService';

export * from './ReactQueryCacheAnalysisService';
export * from './IssueAnalysisService'; 