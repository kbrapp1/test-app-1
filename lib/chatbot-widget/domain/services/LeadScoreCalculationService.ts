import { ScoringFactors, ScoringCriteria, QualificationLevel, ScoreBreakdown } from '../value-objects/LeadScoreTypes';
import { LeadScoreValidationService } from './LeadScoreValidationService';

/**
 * Lead Score Calculation Service
 * Domain Service: Pure business logic for calculating lead scores
 * Following DDD principles: Single responsibility for score calculation
 */
export class LeadScoreCalculationService {
  private static readonly MIN_SCORE = 0;
  private static readonly MAX_SCORE = 100;
  private static readonly QUALIFIED_THRESHOLD = 60;
  private static readonly HIGHLY_QUALIFIED_THRESHOLD = 80;

  /**
   * Calculate complete lead score with breakdown
   */
  static calculateScore(factors: ScoringFactors, criteria: ScoringCriteria = this.getDefaultCriteria()): {
    score: number;
    qualificationLevel: QualificationLevel;
    breakdown: ScoreBreakdown;
  } {
    LeadScoreValidationService.validateScoringFactors(factors);
    LeadScoreValidationService.validateScoringCriteria(criteria);

    const questionScore = this.calculateQuestionScore(factors, criteria);
    const engagementScore = this.calculateEngagementScore(factors, criteria);
    const contactInfoScore = this.calculateContactInfoScore(factors, criteria);
    const budgetTimelineScore = this.calculateBudgetTimelineScore(factors, criteria);
    const industryCompanySizeScore = this.calculateIndustryCompanySizeScore(factors, criteria);

    const totalScore = Math.round(
      questionScore + engagementScore + contactInfoScore + budgetTimelineScore + industryCompanySizeScore
    );

    const qualificationLevel = this.determineQualificationLevel(totalScore, factors);

    const breakdown: ScoreBreakdown = {
      questionScore: Math.round(questionScore),
      engagementScore: Math.round(engagementScore),
      contactInfoScore: Math.round(contactInfoScore),
      budgetTimelineScore: Math.round(budgetTimelineScore),
      industryCompanySizeScore: Math.round(industryCompanySizeScore),
      totalScore,
      qualificationLevel
    };

    return { score: totalScore, qualificationLevel, breakdown };
  }

  /**
   * Calculate question completion score
   */
  private static calculateQuestionScore(factors: ScoringFactors, criteria: ScoringCriteria): number {
    if (factors.totalQuestionsCount === 0) return 0;
    
    const completionRate = factors.answeredQuestionsCount / factors.totalQuestionsCount;
    return completionRate * criteria.questionAnswerWeight * this.MAX_SCORE;
  }

  /**
   * Calculate engagement score with bonuses
   */
  private static calculateEngagementScore(factors: ScoringFactors, criteria: ScoringCriteria): number {
    // Base engagement score from the provided engagement metric
    let engagementMultiplier = factors.engagementScore / 100;
    
    // Bonus for conversation length (up to 20% bonus)
    const conversationBonus = Math.min(factors.conversationLength / 20, 1) * 0.2;
    
    // Bonus for session duration (up to 15% bonus)
    const durationBonus = Math.min(factors.sessionDuration / 10, 1) * 0.15;
    
    engagementMultiplier = Math.min(engagementMultiplier + conversationBonus + durationBonus, 1);
    
    return engagementMultiplier * criteria.engagementWeight * this.MAX_SCORE;
  }

  /**
   * Calculate contact information score
   */
  private static calculateContactInfoScore(factors: ScoringFactors, criteria: ScoringCriteria): number {
    const contactInfoMultiplier = factors.hasContactInfo ? 1 : 0;
    return contactInfoMultiplier * criteria.contactInfoWeight * this.MAX_SCORE;
  }

  /**
   * Calculate budget and timeline score
   */
  private static calculateBudgetTimelineScore(factors: ScoringFactors, criteria: ScoringCriteria): number {
    let budgetTimelineScore = 0;
    
    if (factors.hasBudgetInfo) budgetTimelineScore += 0.6;
    if (factors.hasTimelineInfo) budgetTimelineScore += 0.4;
    
    return budgetTimelineScore * criteria.budgetTimelineWeight * this.MAX_SCORE;
  }

  /**
   * Calculate industry and company size score
   */
  private static calculateIndustryCompanySizeScore(factors: ScoringFactors, criteria: ScoringCriteria): number {
    let industryCompanyScore = 0;
    
    if (factors.hasIndustryInfo) industryCompanyScore += 0.5;
    if (factors.hasCompanySizeInfo) industryCompanyScore += 0.5;
    
    return industryCompanyScore * criteria.industryCompanySizeWeight * this.MAX_SCORE;
  }

  /**
   * Determine qualification level based on score and factors
   */
  static determineQualificationLevel(score: number, factors: ScoringFactors): QualificationLevel {
    // Automatic disqualification conditions
    if (factors.engagementScore < 20 && factors.conversationLength < 3) {
      return QualificationLevel.DISQUALIFIED;
    }

    // Score-based qualification
    if (score >= this.HIGHLY_QUALIFIED_THRESHOLD) {
      return QualificationLevel.HIGHLY_QUALIFIED;
    } else if (score >= this.QUALIFIED_THRESHOLD) {
      return QualificationLevel.QUALIFIED;
    } else {
      return QualificationLevel.NOT_QUALIFIED;
    }
  }

  /**
   * Get default scoring criteria
   */
  static getDefaultCriteria(): ScoringCriteria {
    return {
      questionAnswerWeight: 0.3,
      engagementWeight: 0.25,
      contactInfoWeight: 0.25,
      budgetTimelineWeight: 0.15,
      industryCompanySizeWeight: 0.05
    };
  }

  /**
   * Get qualification threshold values
   */
  static getThresholds() {
    return {
      qualified: this.QUALIFIED_THRESHOLD,
      highlyQualified: this.HIGHLY_QUALIFIED_THRESHOLD,
      min: this.MIN_SCORE,
      max: this.MAX_SCORE
    };
  }

  /**
   * Calculate expected cost for given token counts (for testing/validation)
   */
  static calculateExpectedScore(
    answeredQuestions: number,
    totalQuestions: number,
    engagement: number,
    hasContact: boolean = false,
    criteria: ScoringCriteria = this.getDefaultCriteria()
  ): number {
    const factors: ScoringFactors = {
      answeredQuestionsCount: answeredQuestions,
      totalQuestionsCount: totalQuestions,
      engagementScore: engagement,
      hasContactInfo: hasContact,
      hasBudgetInfo: false,
      hasTimelineInfo: false,
      hasIndustryInfo: false,
      hasCompanySizeInfo: false,
      conversationLength: 5,
      sessionDuration: 2
    };

    const result = this.calculateScore(factors, criteria);
    return result.score;
  }
} 