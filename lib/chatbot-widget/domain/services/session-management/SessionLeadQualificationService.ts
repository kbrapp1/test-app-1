import { LeadQualificationState, AnsweredQuestion, SessionContext } from '../../value-objects/session-management/ChatSessionTypes';

/**
 * Session Lead Qualification Service
 * 
 * AI INSTRUCTIONS:
 * - Pure business logic for lead qualification process management
 * - Focus on qualification process management only - using API-only approach for scoring
 * - Keep under 200 lines following @golden-rule patterns with single responsibility
 */
export class SessionLeadQualificationService {
  private static readonly QUALIFICATION_THRESHOLD = 60;

  // Score individual answer based on content quality
  private static scoreAnswer(answer: AnsweredQuestion): number {
    if (Array.isArray(answer.answer)) {
      // Multiple choice answers
      return answer.answer.length > 0 ? 1 : 0;
    } else {
      // Text answers - score based on length and content
      const text = answer.answer.trim();
      if (text.length === 0) return 0;
      if (text.length < 5) return 0.3;
      if (text.length < 20) return 0.6;
      return 1;
    }
  }

  // Determine if lead is qualified based on external score (from API)
  static isLeadQualified(leadScore: number): boolean {
    return leadScore >= this.QUALIFICATION_THRESHOLD;
  }

  // Create answered question for qualification tracking
  static createAnsweredQuestion(
    questionId: string,
    question: string,
    answer: string | string[],
    scoringWeight: number = 1
  ): AnsweredQuestion {
    return {
      questionId,
      question,
      answer,
      scoringWeight,
      answeredAt: new Date()
    };
  }

  // Add answer to qualification state
  static addAnswer(
    currentState: LeadQualificationState,
    answer: AnsweredQuestion
  ): LeadQualificationState {
    return {
      ...currentState,
      answeredQuestions: [...currentState.answeredQuestions, answer],
      currentStep: currentState.currentStep + 1
    };
  }

  // Start qualification process
  static startQualification(currentState: LeadQualificationState): LeadQualificationState {
    return {
      ...currentState,
      qualificationStatus: 'in_progress',
      currentStep: 0
    };
  }

  // Complete qualification process
  static completeQualification(
    currentState: LeadQualificationState,
    contextData: SessionContext,
    apiLeadScore?: number
  ): LeadQualificationState {
    return {
      ...currentState,
      qualificationStatus: 'completed',
      isQualified: apiLeadScore ? this.isLeadQualified(apiLeadScore) : false,
      capturedAt: new Date()
    };
  }

  // Skip qualification process
  static skipQualification(currentState: LeadQualificationState): LeadQualificationState {
    return {
      ...currentState,
      qualificationStatus: 'skipped'
    };
  }

  // Get qualification progress percentage
  static getQualificationProgress(
    currentState: LeadQualificationState,
    totalQuestions: number
  ): number {
    if (totalQuestions === 0) return 0;
    return Math.round((currentState.answeredQuestions.length / totalQuestions) * 100);
  }

  // Check if qualification is in progress
  static isQualificationInProgress(state: LeadQualificationState): boolean {
    return state.qualificationStatus === 'in_progress';
  }

  // Check if qualification is completed
  static isQualificationCompleted(state: LeadQualificationState): boolean {
    return state.qualificationStatus === 'completed';
  }
} 