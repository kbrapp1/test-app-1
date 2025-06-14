/**
 * Lead Score Types and Interfaces
 * Following DDD principles: Separate type definitions for clarity
 */

export interface ScoringCriteria {
  questionAnswerWeight: number; // Weight for answered qualification questions (0-1)
  engagementWeight: number; // Weight for engagement metrics (0-1)
  contactInfoWeight: number; // Weight for providing contact information (0-1)
  budgetTimelineWeight: number; // Weight for budget/timeline indicators (0-1)
  industryCompanySizeWeight: number; // Weight for industry/company size (0-1)
}

export interface ScoringFactors {
  answeredQuestionsCount: number;
  totalQuestionsCount: number;
  engagementScore: number; // 0-100
  hasContactInfo: boolean;
  hasBudgetInfo: boolean;
  hasTimelineInfo: boolean;
  hasIndustryInfo: boolean;
  hasCompanySizeInfo: boolean;
  conversationLength: number; // Number of messages
  sessionDuration: number; // Duration in minutes
}

export enum QualificationLevel {
  NOT_QUALIFIED = 'not_qualified',
  QUALIFIED = 'qualified', 
  HIGHLY_QUALIFIED = 'highly_qualified',
  DISQUALIFIED = 'disqualified'
}

export interface ScoreBreakdown {
  questionScore: number;
  engagementScore: number;
  contactInfoScore: number;
  budgetTimelineScore: number;
  industryCompanySizeScore: number;
  totalScore: number;
  qualificationLevel: QualificationLevel;
}

export interface LeadScoreThresholds {
  qualified: number;
  highlyQualified: number;
  min: number;
  max: number;
} 