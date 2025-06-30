/**
 * Lead Capture Components Index
 * 
 * AI INSTRUCTIONS:
 * - Export only existing lead capture components
 * - Removed human-readable admin UI features per user requirements
 * - Keep only simulation and log file tracking functionality
 */

// Main components that exist
export { LeadQualificationAnalyzer } from './LeadQualificationAnalyzer';
export { LeadDataFactory } from './LeadDataFactory';
export { QualificationProcessor } from './QualificationProcessor';

// Export types from main components
export type { 
  QualificationAnalysis,
  QualificationStatus
} from './LeadQualificationAnalyzer';

export type { QualificationAnswer } from './QualificationProcessor';

// Domain types (imported from domain layer)
export type { 
  LeadRecommendation, 
  RecommendationType, 
  RecommendationPriority, 
  RecommendationCategory 
} from '../../../domain/value-objects/lead-management/LeadRecommendation';

// Note: Human-readable recommendation generators and next step generators have been removed
// System now uses pure log file tracking instead of human-readable actions
// Only simulation functionality remains for testing API and turns 