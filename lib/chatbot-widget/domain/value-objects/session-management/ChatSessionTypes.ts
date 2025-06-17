/**
 * Chat Session Types and Interfaces
 * Following DDD principles: Separate type definitions for clarity
 */

export interface ChatSessionProps {
  id: string;
  chatbotConfigId: string;
  visitorId: string;
  sessionToken: string;
  contextData: SessionContext;
  leadQualificationState: LeadQualificationState;
  status: SessionStatus;
  startedAt: Date;
  lastActivityAt: Date;
  endedAt?: Date;
  ipAddress?: string;
  userAgent?: string;
  referrerUrl?: string;
  currentUrl?: string;
}

export interface SessionContext {
  visitorName?: string;
  email?: string;
  phone?: string;
  company?: string;
  previousVisits: number;
  pageViews: PageView[];
  conversationSummary: string;
  topics: string[];
  interests: string[];
  engagementScore: number;
  journeyState?: {
    stage: string;
    confidence: number;
    metadata: any;
  };
  accumulatedEntities?: {
    decisionMakers: string[];
    painPoints: string[];
    integrationNeeds: string[];
    evaluationCriteria: string[];
    budget?: {
      value: string;
      confidence: number;
      lastUpdated: string;
      sourceMessageId: string;
    };
    timeline?: {
      value: string;
      confidence: number;
      lastUpdated: string;
      sourceMessageId: string;
    };
    urgency?: {
      value: string;
      confidence: number;
      lastUpdated: string;
      sourceMessageId: string;
    };
    contactMethod?: {
      value: string;
      confidence: number;
      lastUpdated: string;
      sourceMessageId: string;
    };
    role?: {
      value: string;
      confidence: number;
      lastUpdated: string;
      sourceMessageId: string;
    };
    industry?: {
      value: string;
      confidence: number;
      lastUpdated: string;
      sourceMessageId: string;
    };
    company?: {
      value: string;
      confidence: number;
      lastUpdated: string;
      sourceMessageId: string;
    };
    teamSize?: {
      value: string;
      confidence: number;
      lastUpdated: string;
      sourceMessageId: string;
    };
    lastEntityUpdate?: string;
    entityMetadata?: {
      totalEntitiesExtracted: number;
      correctionsApplied: number;
      lastExtractionMethod: 'enhanced' | 'basic' | 'fallback';
      lastProcessedMessageId: string;
    };
  };
}

export interface PageView {
  url: string;
  title: string;
  timestamp: Date;
  timeOnPage: number;
}

export interface LeadQualificationState {
  isQualified: boolean;
  currentStep: number;
  answeredQuestions: AnsweredQuestion[];
  leadScore: number;
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