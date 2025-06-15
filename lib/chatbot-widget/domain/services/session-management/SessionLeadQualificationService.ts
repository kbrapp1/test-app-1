import { LeadQualificationState, AnsweredQuestion, SessionContext } from '../../value-objects/session-management/ChatSessionTypes';

/**
 * Session Lead Qualification Service
 * Domain Service: Pure business logic for lead qualification
 * Following DDD principles: Single responsibility for qualification logic
 */
export class SessionLeadQualificationService {
  private static readonly QUALIFICATION_THRESHOLD = 60;

  /**
   * Calculate lead score based on answered questions and engagement
   */
  static calculateLeadScore(
    qualificationState: LeadQualificationState,
    contextData: SessionContext
  ): number {
    const { answeredQuestions } = qualificationState;
    
    if (answeredQuestions.length === 0) {
      return 0;
    }

    // Base score calculation from questions
    let totalScore = 0;
    let totalWeight = 0;

    answeredQuestions.forEach(answer => {
      totalWeight += answer.scoringWeight;
      
      // Score based on answer quality
      const answerScore = this.scoreAnswer(answer);
      totalScore += answerScore * answer.scoringWeight;
    });

    // Calculate base score from questions
    const baseScore = totalWeight > 0 ? (totalScore / totalWeight) * 100 : 0;

    // Apply engagement factor
    const engagementFactor = contextData.engagementScore / 100;
    const finalScore = baseScore * (0.7 + 0.3 * engagementFactor);

    return Math.round(Math.min(finalScore, 100));
  }

  /**
   * Score individual answer based on content quality
   */
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

  /**
   * Determine if lead is qualified based on score
   */
  static isLeadQualified(leadScore: number): boolean {
    return leadScore >= this.QUALIFICATION_THRESHOLD;
  }

  /**
   * Create answered question object
   */
  static createAnsweredQuestion(
    questionId: string,
    question: string,
    answer: string | string[],
    scoringWeight: number
  ): AnsweredQuestion {
    return {
      questionId,
      question,
      answer,
      answeredAt: new Date(),
      scoringWeight
    };
  }

  /**
   * Start qualification process
   */
  static startQualification(currentState: LeadQualificationState): LeadQualificationState {
    return {
      ...currentState,
      qualificationStatus: 'in_progress',
      currentStep: 0
    };
  }

  /**
   * Add answer to qualification state
   */
  static addAnswer(
    currentState: LeadQualificationState,
    answeredQuestion: AnsweredQuestion
  ): LeadQualificationState {
    // Remove existing answer for same question
    const existingAnswers = currentState.answeredQuestions.filter(
      q => q.questionId !== answeredQuestion.questionId
    );

    return {
      ...currentState,
      answeredQuestions: [...existingAnswers, answeredQuestion],
      currentStep: currentState.currentStep + 1
    };
  }

  /**
   * Complete qualification process
   */
  static completeQualification(
    currentState: LeadQualificationState,
    contextData: SessionContext
  ): LeadQualificationState {
    const leadScore = this.calculateLeadScore(currentState, contextData);
    
    return {
      ...currentState,
      qualificationStatus: 'completed',
      leadScore,
      isQualified: this.isLeadQualified(leadScore),
      capturedAt: new Date()
    };
  }

  /**
   * Skip qualification process
   */
  static skipQualification(currentState: LeadQualificationState): LeadQualificationState {
    return {
      ...currentState,
      qualificationStatus: 'skipped'
    };
  }

  /**
   * Get qualification progress percentage
   */
  static getQualificationProgress(
    currentState: LeadQualificationState,
    totalQuestions: number
  ): number {
    if (totalQuestions === 0) return 0;
    return Math.round((currentState.answeredQuestions.length / totalQuestions) * 100);
  }

  /**
   * Check if qualification is in progress
   */
  static isQualificationInProgress(state: LeadQualificationState): boolean {
    return state.qualificationStatus === 'in_progress';
  }

  /**
   * Check if qualification is completed
   */
  static isQualificationCompleted(state: LeadQualificationState): boolean {
    return state.qualificationStatus === 'completed';
  }
} 