/**
 * Lead Scoring Service
 * 
 * Domain Service: Handles complex lead scoring calculations
 * Single Responsibility: Lead score computation and qualification assessment
 * Following DDD domain service patterns
 */

import { QualificationData, EngagementLevel } from '../../value-objects/lead-management/QualificationData';

export type QualificationStatus = 'not_qualified' | 'qualified' | 'highly_qualified' | 'disqualified';

export interface LeadScoringResult {
  score: number;
  qualificationStatus: QualificationStatus;
  scoreBreakdown: ScoreBreakdown;
}

export interface ScoreBreakdown {
  baseScore: number;
  engagementBonus: number;
  budgetBonus: number;
  timelineBonus: number;
  decisionMakerBonus: number;
  totalBonuses: number;
  finalScore: number;
}

export class LeadScoringService {
  private static readonly SCORE_WEIGHTS = {
    ENGAGEMENT: {
      low: 0,
      medium: 10,
      high: 20,
    },
    BUDGET_BONUS: 15,
    TIMELINE_BONUS: 10,
    DECISION_MAKER_BONUS: 20,
    BASE_SCORE_PERCENTAGE: 60,
  };

  private static readonly QUALIFICATION_THRESHOLDS = {
    HIGHLY_QUALIFIED: 80,
    QUALIFIED: 60,
    DISQUALIFIED_FACTORS: ['no_budget', 'no_timeline'],
  };

  static calculateScore(qualificationData: QualificationData): LeadScoringResult {
    // Check for automatic disqualification first
    if (this.hasDisqualifyingFactors(qualificationData)) {
      return this.createDisqualifiedResult(qualificationData);
    }

    const scoreBreakdown = this.calculateScoreBreakdown(qualificationData);
    const finalScore = Math.min(100, Math.max(0, scoreBreakdown.finalScore));
    const qualificationStatus = this.determineQualificationStatus(finalScore, qualificationData);

    return {
      score: finalScore,
      qualificationStatus,
      scoreBreakdown: {
        ...scoreBreakdown,
        finalScore,
      },
    };
  }

  private static calculateScoreBreakdown(qualificationData: QualificationData): ScoreBreakdown {
    const baseScore = this.calculateBaseScore(qualificationData);
    const engagementBonus = this.calculateEngagementBonus(qualificationData.engagementLevel);
    const budgetBonus = this.calculateBudgetBonus(qualificationData);
    const timelineBonus = this.calculateTimelineBonus(qualificationData);
    const decisionMakerBonus = this.calculateDecisionMakerBonus(qualificationData);

    const totalBonuses = engagementBonus + budgetBonus + timelineBonus + decisionMakerBonus;
    const finalScore = Math.round(baseScore + totalBonuses);

    return {
      baseScore: Math.round(baseScore),
      engagementBonus,
      budgetBonus,
      timelineBonus,
      decisionMakerBonus,
      totalBonuses,
      finalScore,
    };
  }

  private static calculateBaseScore(qualificationData: QualificationData): number {
    const totalWeight = qualificationData.getTotalScoringWeight();
    const totalContribution = qualificationData.getTotalScoreContribution();

    if (totalWeight === 0) {
      return 0;
    }

    const scorePercentage = totalContribution / totalWeight;
    return scorePercentage * this.SCORE_WEIGHTS.BASE_SCORE_PERCENTAGE;
  }

  private static calculateEngagementBonus(engagementLevel: EngagementLevel): number {
    return this.SCORE_WEIGHTS.ENGAGEMENT[engagementLevel];
  }

  private static calculateBudgetBonus(qualificationData: QualificationData): number {
    return qualificationData.hasBudgetInformation() ? this.SCORE_WEIGHTS.BUDGET_BONUS : 0;
  }

  private static calculateTimelineBonus(qualificationData: QualificationData): number {
    return qualificationData.hasTimelineInformation() ? this.SCORE_WEIGHTS.TIMELINE_BONUS : 0;
  }

  private static calculateDecisionMakerBonus(qualificationData: QualificationData): number {
    return qualificationData.isDecisionMaker() ? this.SCORE_WEIGHTS.DECISION_MAKER_BONUS : 0;
  }

  private static hasDisqualifyingFactors(qualificationData: QualificationData): boolean {
    return qualificationData.hasDisqualifyingFactors();
  }

  private static determineQualificationStatus(
    score: number, 
    qualificationData: QualificationData
  ): QualificationStatus {
    // Double-check for disqualifying factors
    if (this.hasDisqualifyingFactors(qualificationData)) {
      return 'disqualified';
    }

    if (score >= this.QUALIFICATION_THRESHOLDS.HIGHLY_QUALIFIED) {
      return 'highly_qualified';
    }
    
    if (score >= this.QUALIFICATION_THRESHOLDS.QUALIFIED) {
      return 'qualified';
    }
    
    return 'not_qualified';
  }

  private static createDisqualifiedResult(qualificationData: QualificationData): LeadScoringResult {
    const scoreBreakdown = this.calculateScoreBreakdown(qualificationData);
    
    return {
      score: 0,
      qualificationStatus: 'disqualified',
      scoreBreakdown: {
        ...scoreBreakdown,
        finalScore: 0,
      },
    };
  }

  // Utility methods for score analysis
  static getScoreGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  static isQualifiedScore(score: number): boolean {
    return score >= this.QUALIFICATION_THRESHOLDS.QUALIFIED;
  }

  static isHighlyQualifiedScore(score: number): boolean {
    return score >= this.QUALIFICATION_THRESHOLDS.HIGHLY_QUALIFIED;
  }

  static getQualificationDescription(status: QualificationStatus): string {
    const descriptions = {
      'not_qualified': 'This lead does not meet the minimum qualification criteria.',
      'qualified': 'This lead meets the basic qualification requirements and shows potential.',
      'highly_qualified': 'This lead is an excellent prospect with high conversion potential.',
      'disqualified': 'This lead has been disqualified due to specific criteria.',
    };

    return descriptions[status];
  }

  static getScoreRecommendations(result: LeadScoringResult): string[] {
    const recommendations: string[] = [];
    const { score, scoreBreakdown } = result;

    if (score < 60) {
      recommendations.push('Consider nurturing this lead with educational content');
      
      if (scoreBreakdown.engagementBonus === 0) {
        recommendations.push('Increase engagement through personalized follow-up');
      }
      
      if (scoreBreakdown.budgetBonus === 0) {
        recommendations.push('Qualify budget requirements');
      }
      
      if (scoreBreakdown.timelineBonus === 0) {
        recommendations.push('Understand their timeline and urgency');
      }
      
      if (scoreBreakdown.decisionMakerBonus === 0) {
        recommendations.push('Identify and connect with decision makers');
      }
    } else if (score < 80) {
      recommendations.push('This lead shows good potential - prioritize follow-up');
      recommendations.push('Focus on addressing remaining qualification gaps');
    } else {
      recommendations.push('High-priority lead - contact immediately');
      recommendations.push('Prepare detailed proposal or demo');
    }

    return recommendations;
  }
} 