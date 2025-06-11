import { QualificationData, QualificationAnswer } from '../entities/Lead';
import { SessionContext } from '../entities/ChatSession';

export interface ScoringCriteria {
  questionWeights: Record<string, number>;
  engagementMultiplier: number;
  budgetBonus: number;
  timelineBonus: number;
  decisionMakerBonus: number;
  companyInfoBonus: number;
  industryWeights: Record<string, number>;
  companySizeWeights: Record<string, number>;
}

export interface ScoringResult {
  totalScore: number;
  breakdown: {
    questionScore: number;
    engagementScore: number;
    budgetScore: number;
    timelineScore: number;
    decisionMakerScore: number;
    companyScore: number;
    industryScore: number;
    companySizeScore: number;
  };
  qualificationReasons: string[];
  disqualificationReasons: string[];
}

export class LeadScoringService {
  private static readonly DEFAULT_CRITERIA: ScoringCriteria = {
    questionWeights: {
      email: 10,
      phone: 8,
      company: 12,
      jobTitle: 8,
      budget: 15,
      timeline: 12,
      painPoints: 10,
      currentSolution: 8,
      interests: 6,
    },
    engagementMultiplier: 0.3,
    budgetBonus: 15,
    timelineBonus: 10,
    decisionMakerBonus: 20,
    companyInfoBonus: 8,
    industryWeights: {
      'technology': 1.2,
      'healthcare': 1.1,
      'finance': 1.3,
      'manufacturing': 1.0,
      'retail': 0.9,
      'education': 0.8,
      'nonprofit': 0.7,
      'other': 1.0,
    },
    companySizeWeights: {
      'startup': 0.8,
      'small': 0.9,
      'medium': 1.2,
      'large': 1.4,
      'enterprise': 1.5,
    },
  };

  constructor(private readonly criteria: ScoringCriteria = LeadScoringService.DEFAULT_CRITERIA) {}

  /**
   * Calculate comprehensive lead score
   */
  calculateLeadScore(
    qualificationData: QualificationData,
    sessionContext?: SessionContext
  ): ScoringResult {
    const breakdown = {
      questionScore: this.calculateQuestionScore(qualificationData.answeredQuestions),
      engagementScore: this.calculateEngagementScore(qualificationData.engagementLevel, sessionContext),
      budgetScore: this.calculateBudgetScore(qualificationData.budget),
      timelineScore: this.calculateTimelineScore(qualificationData.timeline),
      decisionMakerScore: this.calculateDecisionMakerScore(qualificationData.decisionMaker),
      companyScore: this.calculateCompanyScore(qualificationData),
      industryScore: this.calculateIndustryScore(qualificationData.industry),
      companySizeScore: this.calculateCompanySizeScore(qualificationData.companySize),
    };

    const totalScore = this.calculateTotalScore(breakdown);
    const { qualificationReasons, disqualificationReasons } = this.analyzeQualification(
      qualificationData,
      breakdown
    );

    return {
      totalScore: Math.min(100, Math.max(0, Math.round(totalScore))),
      breakdown,
      qualificationReasons,
      disqualificationReasons,
    };
  }

  /**
   * Calculate score from answered questions
   */
  private calculateQuestionScore(answeredQuestions: QualificationAnswer[]): number {
    if (answeredQuestions.length === 0) return 0;

    let totalScore = 0;
    let totalWeight = 0;

    answeredQuestions.forEach(answer => {
      totalWeight += answer.scoringWeight;
      
      // Score based on answer quality and completeness
      let answerScore = 0;
      
      if (Array.isArray(answer.answer)) {
        // Multiple choice answers
        answerScore = answer.answer.length > 0 ? answer.scoringWeight : 0;
      } else {
        // Text answers - score based on length and content quality
        const text = answer.answer.toString().trim();
        if (text.length === 0) {
          answerScore = 0;
        } else if (text.length < 10) {
          answerScore = answer.scoringWeight * 0.5;
        } else if (text.length < 50) {
          answerScore = answer.scoringWeight * 0.8;
        } else {
          answerScore = answer.scoringWeight;
        }

        // Bonus for specific answer types
        if (this.isEmailAnswer(answer.questionId, text)) {
          answerScore *= 1.2;
        } else if (this.isPhoneAnswer(answer.questionId, text)) {
          answerScore *= 1.1;
        }
      }

      totalScore += answerScore;
    });

    return totalWeight > 0 ? (totalScore / totalWeight) * 40 : 0; // 40% of total score
  }

  /**
   * Calculate engagement score
   */
  private calculateEngagementScore(
    engagementLevel: 'low' | 'medium' | 'high',
    sessionContext?: SessionContext
  ): number {
    let baseScore = {
      low: 5,
      medium: 15,
      high: 25,
    }[engagementLevel];

    // Additional context-based scoring
    if (sessionContext) {
      const { pageViews, topics, interests, conversationSummary } = sessionContext;
      
      // Page engagement bonus
      if (pageViews.length > 3) baseScore += 3;
      if (pageViews.length > 10) baseScore += 2;
      
      // Topic diversity bonus
      if (topics.length > 2) baseScore += 2;
      if (topics.length > 5) baseScore += 3;
      
      // Interest depth bonus
      if (interests.length > 3) baseScore += 2;
      
      // Conversation length bonus
      if (conversationSummary.length > 200) baseScore += 2;
      if (conversationSummary.length > 500) baseScore += 3;
    }

    return Math.min(25, baseScore); // Max 25% of total score
  }

  /**
   * Calculate budget qualification score
   */
  private calculateBudgetScore(budget?: string): number {
    if (!budget) return 0;

    const budgetScores: Record<string, number> = {
      'no_budget': -20,
      'under_1k': 2,
      '1k_5k': 5,
      '5k_10k': 8,
      '10k_25k': 12,
      '25k_50k': 15,
      'over_50k': 18,
      'not_sure': 3,
    };

    return budgetScores[budget] || 0;
  }

  /**
   * Calculate timeline urgency score
   */
  private calculateTimelineScore(timeline?: string): number {
    if (!timeline) return 0;

    const timelineScores: Record<string, number> = {
      'immediate': 15,
      'within_month': 12,
      'within_quarter': 8,
      'within_year': 5,
      'no_timeline': -10,
      'exploring': 2,
    };

    return timelineScores[timeline] || 0;
  }

  /**
   * Calculate decision maker score
   */
  private calculateDecisionMakerScore(isDecisionMaker?: boolean): number {
    if (isDecisionMaker === undefined) return 0;
    return isDecisionMaker ? this.criteria.decisionMakerBonus : -10;
  }

  /**
   * Calculate company information score
   */
  private calculateCompanyScore(qualificationData: QualificationData): number {
    let score = 0;
    
    // Basic company info bonus
    if (qualificationData.answeredQuestions.some(q => 
      q.questionId.includes('company') && q.answer.toString().trim().length > 0)) {
      score += 3;
    }

    // Current solution bonus (shows they're in market)
    if (qualificationData.currentSolution && qualificationData.currentSolution !== 'none') {
      score += 5;
    }

    // Pain points bonus (indicates need)
    if (qualificationData.painPoints && qualificationData.painPoints.length > 0) {
      score += qualificationData.painPoints.length * 2;
    }

    return Math.min(10, score);
  }

  /**
   * Calculate industry-specific score
   */
  private calculateIndustryScore(industry?: string): number {
    if (!industry) return 0;
    
    const multiplier = this.criteria.industryWeights[industry.toLowerCase()] || 1.0;
    return Math.round((multiplier - 1.0) * 10); // Convert multiplier to additive score
  }

  /**
   * Calculate company size score
   */
  private calculateCompanySizeScore(companySize?: string): number {
    if (!companySize) return 0;
    
    const multiplier = this.criteria.companySizeWeights[companySize.toLowerCase()] || 1.0;
    return Math.round((multiplier - 1.0) * 10); // Convert multiplier to additive score
  }

  /**
   * Calculate total score from breakdown
   */
  private calculateTotalScore(breakdown: ScoringResult['breakdown']): number {
    return Object.values(breakdown).reduce((sum, score) => sum + score, 0);
  }

  /**
   * Analyze qualification and provide reasons
   */
  private analyzeQualification(
    qualificationData: QualificationData,
    breakdown: ScoringResult['breakdown']
  ): { qualificationReasons: string[]; disqualificationReasons: string[] } {
    const qualificationReasons: string[] = [];
    const disqualificationReasons: string[] = [];

    // Positive qualification factors
    if (breakdown.budgetScore > 10) {
      qualificationReasons.push('Strong budget qualification');
    }
    if (breakdown.timelineScore > 10) {
      qualificationReasons.push('Urgent timeline needs');
    }
    if (breakdown.decisionMakerScore > 0) {
      qualificationReasons.push('Decision maker identified');
    }
    if (breakdown.engagementScore > 20) {
      qualificationReasons.push('High engagement level');
    }
    if (qualificationData.painPoints.length > 2) {
      qualificationReasons.push('Multiple pain points identified');
    }

    // Negative disqualification factors
    if (qualificationData.budget === 'no_budget') {
      disqualificationReasons.push('No budget available');
    }
    if (qualificationData.timeline === 'no_timeline') {
      disqualificationReasons.push('No implementation timeline');
    }
    if (qualificationData.decisionMaker === false) {
      disqualificationReasons.push('Not a decision maker');
    }
    if (breakdown.engagementScore < 5) {
      disqualificationReasons.push('Low engagement');
    }

    return { qualificationReasons, disqualificationReasons };
  }

  /**
   * Check if answer is an email
   */
  private isEmailAnswer(questionId: string, answer: string): boolean {
    return questionId.toLowerCase().includes('email') && 
           /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(answer);
  }

  /**
   * Check if answer is a phone number
   */
  private isPhoneAnswer(questionId: string, answer: string): boolean {
    return questionId.toLowerCase().includes('phone') && 
           /^[\+]?[1-9][\d]{0,15}$/.test(answer.replace(/[\s\-\(\)\.]/g, ''));
  }

  /**
   * Get qualification threshold scores
   */
  getQualificationThresholds(): {
    disqualified: number;
    notQualified: number;
    qualified: number;
    highlyQualified: number;
  } {
    return {
      disqualified: 0, // Any negative factors
      notQualified: 40,
      qualified: 60,
      highlyQualified: 80,
    };
  }

  /**
   * Update scoring criteria
   */
  updateCriteria(newCriteria: Partial<ScoringCriteria>): LeadScoringService {
    const updatedCriteria = { ...this.criteria, ...newCriteria };
    return new LeadScoringService(updatedCriteria);
  }
} 