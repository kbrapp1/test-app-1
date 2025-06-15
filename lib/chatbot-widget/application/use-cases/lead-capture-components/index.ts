/**
 * Lead Capture Components Index
 * 
 * AI INSTRUCTIONS:
 * - Components for lead capture, scoring, and qualification functionality
 * - Handle lead data processing, analysis, and recommendation generation
 * - Single responsibility - focused on lead capture concerns
 * - Maintain clean separation between lead logic and presentation
 * - Follow DDD application layer patterns with focused components
 */

export { LeadDataFactory } from './LeadDataFactory';
export { QualificationProcessor } from './QualificationProcessor';
export type { QualificationAnswer } from './QualificationProcessor';

export { LeadRecommendationEngine } from './LeadRecommendationEngine';
export type { 
  LeadRecommendation,
  RecommendationType,
  RecommendationPriority,
  RecommendationCategory
} from './LeadRecommendationEngine';

export { LeadNextStepsGenerator } from './LeadNextStepsGenerator';
export type { NextStep } from './LeadNextStepsGenerator';

export { NextStepDefinitions } from './NextStepDefinitions';

export { LeadQualificationAnalyzer } from './LeadQualificationAnalyzer';
export type { 
  QualificationStatus,
  QualificationAnalysis
} from './LeadQualificationAnalyzer';

// Qualification Analyzers - Focused sub-components for qualification analysis
export * from './qualification-analyzers';

// Recommendation Generators - Focused sub-components for recommendation generation
export * from './recommendation-generators'; 