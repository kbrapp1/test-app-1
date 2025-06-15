import { QualificationCriteria } from './QualificationStatusDeterminer';
import { QualificationThresholds } from './QualificationThresholds';

/**
 * QualificationConfidenceCalculator
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Calculate confidence levels for qualification decisions
 * - Apply business rules for confidence scoring
 * - Keep under 100 lines, focused on confidence calculation only
 * - Use pure functions with no side effects
 * - Follow @golden-rule patterns exactly
 */

export class QualificationConfidenceCalculator {
  /**
   * Calculate confidence level in qualification decision (0-100)
   */
  static calculateConfidence(
    criteria: QualificationCriteria,
    leadScore: number
  ): number {
    let confidence = 0;
    const weights = QualificationThresholds.CONFIDENCE_WEIGHTS;

    // Base confidence from score clarity
    if (this.hasScoreClarity(leadScore)) {
      confidence += weights.CLEAR_SCORE_BOUNDARY;
    } else {
      confidence += weights.AMBIGUOUS_SCORE_RANGE;
    }

    // Contact info confidence
    if (criteria.hasMinimumContactInfo) {
      confidence += weights.HAS_CONTACT_INFO;
    }

    // Engagement confidence
    if (criteria.hasEngagement) {
      confidence += weights.HAS_ENGAGEMENT;
    }

    // Qualification completion confidence
    if (criteria.completedQualification) {
      confidence += weights.COMPLETED_QUALIFICATION;
    }

    // Risk factor penalty
    confidence -= criteria.riskFactors.length * weights.RISK_FACTOR_PENALTY;

    // Ensure confidence is between 0 and 100
    return Math.max(0, Math.min(100, confidence));
  }

  /**
   * Check if score provides clear qualification direction
   */
  private static hasScoreClarity(leadScore: number): boolean {
    return QualificationThresholds.isScoreClearlyQualified(leadScore) || 
           QualificationThresholds.isScoreClearlyUnqualified(leadScore);
  }

  /**
   * Get confidence level description
   */
  static getConfidenceDescription(confidence: number): string {
    if (confidence >= 90) {
      return 'Very High - Decision is highly reliable';
    } else if (confidence >= 75) {
      return 'High - Decision is reliable with strong supporting evidence';
    } else if (confidence >= 60) {
      return 'Medium - Decision is reasonably reliable but may benefit from review';
    } else if (confidence >= 40) {
      return 'Low - Decision has limited supporting evidence, review recommended';
    } else {
      return 'Very Low - Decision is uncertain, manual review required';
    }
  }

  /**
   * Check if confidence level warrants manual review
   */
  static requiresManualReview(confidence: number): boolean {
    return confidence < 60;
  }

  /**
   * Get confidence factors breakdown
   */
  static getConfidenceFactors(
    criteria: QualificationCriteria,
    leadScore: number
  ): Array<{ factor: string; points: number; description: string }> {
    const factors = [];
    const weights = QualificationThresholds.CONFIDENCE_WEIGHTS;

    // Score clarity factor
    if (this.hasScoreClarity(leadScore)) {
      factors.push({
        factor: 'Score Clarity',
        points: weights.CLEAR_SCORE_BOUNDARY,
        description: 'Lead score provides clear qualification direction'
      });
    } else {
      factors.push({
        factor: 'Score Ambiguity',
        points: weights.AMBIGUOUS_SCORE_RANGE,
        description: 'Lead score falls in ambiguous range'
      });
    }

    // Other factors
    if (criteria.hasMinimumContactInfo) {
      factors.push({
        factor: 'Contact Information',
        points: weights.HAS_CONTACT_INFO,
        description: 'Has required contact information'
      });
    }

    if (criteria.hasEngagement) {
      factors.push({
        factor: 'Engagement',
        points: weights.HAS_ENGAGEMENT,
        description: 'Shows sufficient engagement'
      });
    }

    if (criteria.completedQualification) {
      factors.push({
        factor: 'Qualification Completion',
        points: weights.COMPLETED_QUALIFICATION,
        description: 'Completed qualification process'
      });
    }

    // Risk factor penalties
    if (criteria.riskFactors.length > 0) {
      factors.push({
        factor: 'Risk Factors',
        points: -(criteria.riskFactors.length * weights.RISK_FACTOR_PENALTY),
        description: `${criteria.riskFactors.length} risk factor(s) identified`
      });
    }

    return factors;
  }
} 