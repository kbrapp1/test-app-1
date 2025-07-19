/**
 * Session Support Types
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Define supporting interfaces for session management
 * - Domain value objects for qualification, contact info, and metrics
 * - Keep under 100 lines by focusing on support structures only
 * - Follow DDD patterns exactly
 */

export interface LeadQualificationState {
  isQualified: boolean;
  currentStep: number;
  answeredQuestions: AnsweredQuestion[];
  qualificationStatus: 'not_started' | 'in_progress' | 'completed' | 'skipped';
  capturedAt?: Date;
}

export interface AnsweredQuestion {
  questionId: string;
  question: string;
  answer: string | string[];
  answeredAt: Date;
  scoringWeight: number;
}

export type SessionStatus = 'active' | 'idle' | 'completed' | 'abandoned' | 'ended';

export interface ContactInfo {
  email?: string;
  phone?: string;
  name?: string;
  company?: string;
}

export interface SessionMetrics {
  duration: number;
  pageViewCount: number;
  topicCount: number;
  interestCount: number;
  hasContactInfo: boolean;
}