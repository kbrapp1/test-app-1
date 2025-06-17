import { ScoringFactors, ScoringCriteria, QualificationLevel, ScoreBreakdown, LeadScoreThresholds } from './LeadScoreTypes';
import { LeadScoreCalculationService } from '../../services/lead-management/LeadScoreCalculationService';
import { LeadScoreValidationService } from '../../services/lead-management/LeadScoreValidationService';

/**
 * Lead Score Value Object
 * Following DDD principles: Pure value object with immutable state
 * Delegates calculation and validation to domain services
 */
export class LeadScore {
  constructor(
    public readonly score: number,
    public readonly qualificationLevel: QualificationLevel,
    public readonly breakdown: ScoreBreakdown,
    public readonly calculatedAt: Date = new Date()
  ) {
    LeadScoreValidationService.validateLeadScoreParams(score, qualificationLevel, breakdown, calculatedAt);
  }

  /**
   * Calculate lead score from scoring factors
   * Delegates to domain service for calculation logic
   */
  public static calculate(factors: ScoringFactors, criteria: ScoringCriteria = LeadScoreCalculationService.getDefaultCriteria()): LeadScore {
    const result = LeadScoreCalculationService.calculateScore(factors, criteria);
    return new LeadScore(result.score, result.qualificationLevel, result.breakdown);
  }

  /**
   * Get default scoring criteria
   */
  public static getDefaultCriteria(): ScoringCriteria {
    return LeadScoreCalculationService.getDefaultCriteria();
  }

  /**
   * Check if lead is qualified
   */
  public isQualified(): boolean {
    return this.qualificationLevel === QualificationLevel.QUALIFIED || 
           this.qualificationLevel === QualificationLevel.HIGHLY_QUALIFIED;
  }

  /**
   * Check if lead is highly qualified
   */
  public isHighlyQualified(): boolean {
    return this.qualificationLevel === QualificationLevel.HIGHLY_QUALIFIED;
  }

  /**
   * Check if lead is disqualified
   */
  public isDisqualified(): boolean {
    return this.qualificationLevel === QualificationLevel.DISQUALIFIED;
  }

  /**
   * Get qualification threshold values
   */
  public static getThresholds(): LeadScoreThresholds {
    return LeadScoreCalculationService.getThresholds();
  }

  /**
   * Get a description of the score
   */
  public getDescription(): string {
    switch (this.qualificationLevel) {
      case QualificationLevel.HIGHLY_QUALIFIED:
        return `Highly qualified lead with score ${this.score}/100. Strong engagement and provided detailed information.`;
      case QualificationLevel.QUALIFIED:
        return `Qualified lead with score ${this.score}/100. Good engagement and provided basic information.`;
      case QualificationLevel.NOT_QUALIFIED:
        return `Not yet qualified with score ${this.score}/100. Needs more engagement or information.`;
      case QualificationLevel.DISQUALIFIED:
        return `Disqualified with score ${this.score}/100. Low engagement or unsuitable criteria.`;
      default:
        return `Lead score: ${this.score}/100`;
    }
  }

  /**
   * Get recommendations for improving the score
   */
  public getImprovementRecommendations(): string[] {
    const recommendations: string[] = [];

    if (this.breakdown.questionScore < 20) {
      recommendations.push('Encourage the visitor to answer more qualification questions');
    }

    if (this.breakdown.engagementScore < 15) {
      recommendations.push('Improve engagement with more interactive conversation');
    }

    if (this.breakdown.contactInfoScore < 20) {
      recommendations.push('Request contact information (email, phone)');
    }

    if (this.breakdown.budgetTimelineScore < 10) {
      recommendations.push('Ask about budget and timeline requirements');
    }

    if (this.breakdown.industryCompanySizeScore < 5) {
      recommendations.push('Gather information about industry and company size');
    }

    if (recommendations.length === 0) {
      recommendations.push('Lead is well qualified - consider escalating to sales team');
    }

    return recommendations;
  }

  /**
   * Compare with another LeadScore
   */
  public compareTo(other: LeadScore): number {
    return this.score - other.score;
  }

  /**
   * Check if score has improved since another score
   */
  public hasImprovedFrom(previousScore: LeadScore): boolean {
    return this.score > previousScore.score;
  }

  /**
   * Get the percentage improvement from a previous score
   */
  public getImprovementPercentage(previousScore: LeadScore): number {
    if (previousScore.score === 0) return this.score > 0 ? 100 : 0;
    return ((this.score - previousScore.score) / previousScore.score) * 100;
  }

  /**
   * Create a copy with updated score
   */
  public withScore(newScore: number): LeadScore {
    const newQualificationLevel = LeadScoreCalculationService.determineQualificationLevel(newScore, {
      answeredQuestionsCount: 0,
      totalQuestionsCount: 0,
      engagementScore: 50,
      hasContactInfo: false,
      hasBudgetInfo: false,
      hasTimelineInfo: false,
      hasIndustryInfo: false,
      hasCompanySizeInfo: false,
      conversationLength: 0,
      sessionDuration: 0
    });

    return new LeadScore(
      newScore,
      newQualificationLevel,
      { ...this.breakdown, totalScore: newScore, qualificationLevel: newQualificationLevel },
      new Date()
    );
  }

  /**
   * Check equality with another LeadScore
   */
  public equals(other: LeadScore): boolean {
    return (
      this.score === other.score &&
      this.qualificationLevel === other.qualificationLevel
    );
  }

  /**
   * Convert to JSON for storage
   */
  public toJSON(): object {
    return {
      score: this.score,
      qualificationLevel: this.qualificationLevel,
      breakdown: this.breakdown,
      calculatedAt: this.calculatedAt.toISOString()
    };
  }

  /**
   * Create from JSON data
   */
  public static fromJSON(data: any): LeadScore {
    return new LeadScore(
      data.score,
      data.qualificationLevel,
      data.breakdown,
      new Date(data.calculatedAt)
    );
  }

  /**
   * Create a default/initial lead score
   */
  public static createInitial(): LeadScore {
    const breakdown: ScoreBreakdown = {
      questionScore: 0,
      engagementScore: 0,
      contactInfoScore: 0,
      budgetTimelineScore: 0,
      industryCompanySizeScore: 0,
      totalScore: 0,
      qualificationLevel: QualificationLevel.NOT_QUALIFIED
    };

    return new LeadScore(0, QualificationLevel.NOT_QUALIFIED, breakdown);
  }
} 