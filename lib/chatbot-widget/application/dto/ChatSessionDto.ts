/**
 * Chat Session DTO
 * 
 * Data Transfer Object for chat session data across application boundaries.
 * Handles session state, context, and lead qualification progress.
 */

export interface ChatSessionDto {
  readonly id: string;
  readonly chatbotConfigId: string;
  readonly visitorId: string;
  readonly sessionToken: string;
  readonly contextData: SessionContextDto;
  readonly leadQualificationState: LeadQualificationStateDto;
  readonly status: ChatSessionStatus;
  readonly startedAt: string;
  readonly lastActivityAt: string;
  readonly endedAt?: string;
  readonly ipAddress?: string;
  readonly userAgent?: string;
  readonly referrerUrl?: string;
  readonly currentUrl?: string;
}

export interface SessionContextDto {
  readonly previousVisits: number;
  readonly pageViews: string[];
  readonly conversationSummary: string;
  readonly topics: string[];
  readonly interests: string[];
  readonly engagementScore: number;
  // MODERN: Legacy fields removed, entity data is in accumulated entities
}

export interface LeadQualificationStateDto {
  readonly currentStep: number;
  readonly totalSteps: number;
  readonly answeredQuestions: AnsweredQuestionDto[];
  readonly qualificationStatus: QualificationStatus;
  readonly isQualified: boolean;
  readonly engagementLevel: EngagementLevel;
}

export interface AnsweredQuestionDto {
  readonly questionId: string;
  readonly question: string;
  readonly answer: string;
  readonly answeredAt: string;
  readonly confidence: number;
}

export type ChatSessionStatus = 'active' | 'completed' | 'abandoned' | 'escalated';
export type QualificationStatus = 'not_started' | 'in_progress' | 'qualified' | 'disqualified';
export type EngagementLevel = 'low' | 'medium' | 'high';

/**
 * DTO for creating a new chat session
 */
export interface CreateChatSessionDto {
  readonly chatbotConfigId: string;
  readonly visitorId: string;
  readonly ipAddress?: string;
  readonly userAgent?: string;
  readonly referrerUrl?: string;
  readonly currentUrl?: string;
}

/**
 * DTO for updating chat session context
 */
export interface UpdateChatSessionDto {
  readonly contextData?: Partial<SessionContextDto>;
  readonly leadQualificationState?: Partial<LeadQualificationStateDto>;
  readonly status?: ChatSessionStatus;
  readonly currentUrl?: string;
} 