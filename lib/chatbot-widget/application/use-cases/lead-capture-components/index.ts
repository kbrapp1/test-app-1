/**
 * Lead Capture Components Index
 * 
 * AI INSTRUCTIONS:
 * - Clean export interface for all lead capture components
 * - Application layer components for lead capture functionality
 * - Single responsibility components following DDD principles
 * - Maintain clean separation between capture concerns
 * - UPDATED: Removed qualification-analyzers - using AI-only approach
 */

// Main components that exist
export { LeadQualificationAnalyzer } from './LeadQualificationAnalyzer';
export { LeadNextStepsGenerator } from './LeadNextStepsGenerator';
export { NextStepDefinitions } from './NextStepDefinitions';
export { LeadRecommendationEngine } from './LeadRecommendationEngine';
export { LeadDataFactory } from './LeadDataFactory';
export { QualificationProcessor } from './QualificationProcessor';

// Export types from main components
export type { 
  QualificationAnalysis,
  QualificationStatus
} from './LeadQualificationAnalyzer';

export type {
  NextStep,
  StepPriority,
  StepAssignee,
  StepCategory
} from './LeadNextStepsGenerator';

export type { QualificationAnswer } from './QualificationProcessor';

// Domain types (imported from domain layer)
export type { 
  LeadRecommendation, 
  RecommendationType, 
  RecommendationPriority, 
  RecommendationCategory 
} from '../../../domain/value-objects/lead-management/LeadRecommendation';

// Recommendation generators
export * from './recommendation-generators'; 