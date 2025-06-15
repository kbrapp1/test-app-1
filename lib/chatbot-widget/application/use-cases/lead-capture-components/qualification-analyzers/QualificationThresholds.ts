/**
 * QualificationThresholds
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Define and manage qualification threshold constants
 * - Domain knowledge for scoring boundaries and criteria
 * - Keep under 80 lines, focused on threshold definitions only
 * - Use static readonly values for consistency
 * - Follow @golden-rule patterns exactly
 */

export class QualificationThresholds {
  // Core qualification thresholds
  static readonly QUALIFIED_SCORE_THRESHOLD = 80;
  static readonly UNQUALIFIED_SCORE_THRESHOLD = 30;
  static readonly MINIMUM_ENGAGEMENT_SCORE = 40;
  
  // Risk assessment thresholds
  static readonly MAX_RISK_FACTORS_FOR_QUALIFICATION = 2;
  static readonly VERY_LOW_SCORE_THRESHOLD = 20;
  static readonly MINIMUM_QUALIFICATION_ANSWERS = 2;
  
  // Confidence calculation weights
  static readonly CONFIDENCE_WEIGHTS = {
    CLEAR_SCORE_BOUNDARY: 40,
    AMBIGUOUS_SCORE_RANGE: 20,
    HAS_CONTACT_INFO: 20,
    HAS_ENGAGEMENT: 20,
    COMPLETED_QUALIFICATION: 15,
    RISK_FACTOR_PENALTY: 5
  } as const;

  /**
   * Check if score indicates clear qualification
   */
  static isScoreClearlyQualified(score: number): boolean {
    return score >= this.QUALIFIED_SCORE_THRESHOLD;
  }

  /**
   * Check if score indicates clear disqualification
   */
  static isScoreClearlyUnqualified(score: number): boolean {
    return score < this.UNQUALIFIED_SCORE_THRESHOLD;
  }

  /**
   * Check if score is in ambiguous range requiring review
   */
  static isScoreAmbiguous(score: number): boolean {
    return score >= this.UNQUALIFIED_SCORE_THRESHOLD && score < this.QUALIFIED_SCORE_THRESHOLD;
  }

  /**
   * Check if score is critically low
   */
  static isScoreCriticallyLow(score: number): boolean {
    return score < this.VERY_LOW_SCORE_THRESHOLD;
  }

  /**
   * Get threshold summary for reporting
   */
  static getThresholdSummary() {
    return {
      qualified: this.QUALIFIED_SCORE_THRESHOLD,
      unqualified: this.UNQUALIFIED_SCORE_THRESHOLD,
      minimumEngagement: this.MINIMUM_ENGAGEMENT_SCORE,
      maxRiskFactors: this.MAX_RISK_FACTORS_FOR_QUALIFICATION
    };
  }
} 