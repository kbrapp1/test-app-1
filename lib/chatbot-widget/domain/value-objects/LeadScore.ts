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

export class LeadScore {
  private static readonly MIN_SCORE = 0;
  private static readonly MAX_SCORE = 100;
  private static readonly QUALIFIED_THRESHOLD = 60;
  private static readonly HIGHLY_QUALIFIED_THRESHOLD = 80;

  constructor(
    public readonly score: number,
    public readonly qualificationLevel: QualificationLevel,
    public readonly breakdown: ScoreBreakdown,
    public readonly calculatedAt: Date = new Date()
  ) {
    this.validate();
  }

  private validate(): void {
    if (typeof this.score !== 'number' || this.score < LeadScore.MIN_SCORE || this.score > LeadScore.MAX_SCORE) {
      throw new Error(`Score must be a number between ${LeadScore.MIN_SCORE} and ${LeadScore.MAX_SCORE}`);
    }

    if (!Object.values(QualificationLevel).includes(this.qualificationLevel)) {
      throw new Error(`Invalid qualification level: ${this.qualificationLevel}`);
    }

    if (!this.breakdown) {
      throw new Error('Score breakdown is required');
    }

    if (!(this.calculatedAt instanceof Date)) {
      throw new Error('calculatedAt must be a Date');
    }
  }

  /**
   * Calculate lead score from scoring factors
   */
  public static calculate(factors: ScoringFactors, criteria: ScoringCriteria = LeadScore.getDefaultCriteria()): LeadScore {
    LeadScore.validateScoringFactors(factors);
    LeadScore.validateScoringCriteria(criteria);

    const questionScore = LeadScore.calculateQuestionScore(factors, criteria);
    const engagementScore = LeadScore.calculateEngagementScore(factors, criteria);
    const contactInfoScore = LeadScore.calculateContactInfoScore(factors, criteria);
    const budgetTimelineScore = LeadScore.calculateBudgetTimelineScore(factors, criteria);
    const industryCompanySizeScore = LeadScore.calculateIndustryCompanySizeScore(factors, criteria);

    const totalScore = Math.round(
      questionScore + engagementScore + contactInfoScore + budgetTimelineScore + industryCompanySizeScore
    );

    const qualificationLevel = LeadScore.determineQualificationLevel(totalScore, factors);

    const breakdown: ScoreBreakdown = {
      questionScore: Math.round(questionScore),
      engagementScore: Math.round(engagementScore),
      contactInfoScore: Math.round(contactInfoScore),
      budgetTimelineScore: Math.round(budgetTimelineScore),
      industryCompanySizeScore: Math.round(industryCompanySizeScore),
      totalScore,
      qualificationLevel
    };

    return new LeadScore(totalScore, qualificationLevel, breakdown);
  }

  private static validateScoringFactors(factors: ScoringFactors): void {
    if (typeof factors.answeredQuestionsCount !== 'number' || factors.answeredQuestionsCount < 0) {
      throw new Error('answeredQuestionsCount must be a non-negative number');
    }

    if (typeof factors.totalQuestionsCount !== 'number' || factors.totalQuestionsCount < 0) {
      throw new Error('totalQuestionsCount must be a non-negative number');
    }

    if (factors.answeredQuestionsCount > factors.totalQuestionsCount) {
      throw new Error('answeredQuestionsCount cannot exceed totalQuestionsCount');
    }

    if (typeof factors.engagementScore !== 'number' || factors.engagementScore < 0 || factors.engagementScore > 100) {
      throw new Error('engagementScore must be a number between 0 and 100');
    }

    if (typeof factors.conversationLength !== 'number' || factors.conversationLength < 0) {
      throw new Error('conversationLength must be a non-negative number');
    }

    if (typeof factors.sessionDuration !== 'number' || factors.sessionDuration < 0) {
      throw new Error('sessionDuration must be a non-negative number');
    }
  }

  private static validateScoringCriteria(criteria: ScoringCriteria): void {
    const weights = [
      criteria.questionAnswerWeight,
      criteria.engagementWeight,
      criteria.contactInfoWeight,
      criteria.budgetTimelineWeight,
      criteria.industryCompanySizeWeight
    ];

    weights.forEach((weight, index) => {
      if (typeof weight !== 'number' || weight < 0 || weight > 1) {
        throw new Error(`Weight at index ${index} must be a number between 0 and 1`);
      }
    });

    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    if (Math.abs(totalWeight - 1) > 0.001) { // Allow for floating point precision
      throw new Error(`Total weights must sum to 1, got ${totalWeight}`);
    }
  }

  private static calculateQuestionScore(factors: ScoringFactors, criteria: ScoringCriteria): number {
    if (factors.totalQuestionsCount === 0) return 0;
    
    const completionRate = factors.answeredQuestionsCount / factors.totalQuestionsCount;
    return completionRate * criteria.questionAnswerWeight * LeadScore.MAX_SCORE;
  }

  private static calculateEngagementScore(factors: ScoringFactors, criteria: ScoringCriteria): number {
    // Base engagement score from the provided engagement metric
    let engagementMultiplier = factors.engagementScore / 100;
    
    // Bonus for conversation length (up to 20% bonus)
    const conversationBonus = Math.min(factors.conversationLength / 20, 1) * 0.2;
    
    // Bonus for session duration (up to 15% bonus)
    const durationBonus = Math.min(factors.sessionDuration / 10, 1) * 0.15;
    
    engagementMultiplier = Math.min(engagementMultiplier + conversationBonus + durationBonus, 1);
    
    return engagementMultiplier * criteria.engagementWeight * LeadScore.MAX_SCORE;
  }

  private static calculateContactInfoScore(factors: ScoringFactors, criteria: ScoringCriteria): number {
    const contactInfoMultiplier = factors.hasContactInfo ? 1 : 0;
    return contactInfoMultiplier * criteria.contactInfoWeight * LeadScore.MAX_SCORE;
  }

  private static calculateBudgetTimelineScore(factors: ScoringFactors, criteria: ScoringCriteria): number {
    let budgetTimelineScore = 0;
    
    if (factors.hasBudgetInfo) budgetTimelineScore += 0.6;
    if (factors.hasTimelineInfo) budgetTimelineScore += 0.4;
    
    return budgetTimelineScore * criteria.budgetTimelineWeight * LeadScore.MAX_SCORE;
  }

  private static calculateIndustryCompanySizeScore(factors: ScoringFactors, criteria: ScoringCriteria): number {
    let industryCompanyScore = 0;
    
    if (factors.hasIndustryInfo) industryCompanyScore += 0.5;
    if (factors.hasCompanySizeInfo) industryCompanyScore += 0.5;
    
    return industryCompanyScore * criteria.industryCompanySizeWeight * LeadScore.MAX_SCORE;
  }

  private static determineQualificationLevel(score: number, factors: ScoringFactors): QualificationLevel {
    // Automatic disqualification conditions
    if (factors.engagementScore < 20 && factors.conversationLength < 3) {
      return QualificationLevel.DISQUALIFIED;
    }

    // Score-based qualification
    if (score >= LeadScore.HIGHLY_QUALIFIED_THRESHOLD) {
      return QualificationLevel.HIGHLY_QUALIFIED;
    } else if (score >= LeadScore.QUALIFIED_THRESHOLD) {
      return QualificationLevel.QUALIFIED;
    } else {
      return QualificationLevel.NOT_QUALIFIED;
    }
  }

  /**
   * Get default scoring criteria
   */
  public static getDefaultCriteria(): ScoringCriteria {
    return {
      questionAnswerWeight: 0.3,
      engagementWeight: 0.25,
      contactInfoWeight: 0.25,
      budgetTimelineWeight: 0.15,
      industryCompanySizeWeight: 0.05
    };
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
  public static getThresholds() {
    return {
      qualified: LeadScore.QUALIFIED_THRESHOLD,
      highlyQualified: LeadScore.HIGHLY_QUALIFIED_THRESHOLD,
      min: LeadScore.MIN_SCORE,
      max: LeadScore.MAX_SCORE
    };
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
    const newQualificationLevel = LeadScore.determineQualificationLevel(newScore, {
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