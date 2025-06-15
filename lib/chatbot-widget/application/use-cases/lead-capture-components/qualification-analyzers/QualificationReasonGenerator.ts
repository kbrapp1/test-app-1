import { QualificationStatus, QualificationCriteria } from './QualificationStatusDeterminer';
import { QualificationThresholds } from './QualificationThresholds';

/**
 * QualificationReasonGenerator
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Generate human-readable reasons for qualification decisions
 * - Apply business logic for reason generation
 * - Keep under 120 lines, focused on reason generation only
 * - Use pure functions with no side effects
 * - Follow @golden-rule patterns exactly
 */

export class QualificationReasonGenerator {
  /**
   * Generate reasons for qualification status
   */
  static generateReasons(
    status: QualificationStatus,
    criteria: QualificationCriteria,
    leadScore: number
  ): string[] {
    switch (status) {
      case 'qualified':
        return this.generateQualifiedReasons(criteria, leadScore);
      case 'unqualified':
        return this.generateUnqualifiedReasons(criteria, leadScore);
      case 'needs_review':
        return this.generateNeedsReviewReasons(criteria, leadScore);
      default:
        return ['Unknown qualification status'];
    }
  }

  /**
   * Generate reasons for qualified status
   */
  private static generateQualifiedReasons(
    criteria: QualificationCriteria,
    leadScore: number
  ): string[] {
    const reasons: string[] = [];

    reasons.push(`High lead score: ${leadScore}`);

    if (criteria.hasMinimumContactInfo) {
      reasons.push('Has required contact information');
    }

    if (criteria.hasEngagement) {
      reasons.push('Shows strong engagement');
    }

    if (criteria.completedQualification) {
      reasons.push('Completed qualification process');
    }

    if (criteria.meetsScoreThreshold) {
      reasons.push(`Exceeds qualification threshold of ${QualificationThresholds.QUALIFIED_SCORE_THRESHOLD}`);
    }

    if (criteria.riskFactors.length === 0) {
      reasons.push('No risk factors identified');
    }

    return reasons;
  }

  /**
   * Generate reasons for unqualified status
   */
  private static generateUnqualifiedReasons(
    criteria: QualificationCriteria,
    leadScore: number
  ): string[] {
    const reasons: string[] = [];

    if (QualificationThresholds.isScoreClearlyUnqualified(leadScore)) {
      reasons.push(`Low lead score: ${leadScore} (below threshold of ${QualificationThresholds.UNQUALIFIED_SCORE_THRESHOLD})`);
    }

    if (!criteria.hasMinimumContactInfo) {
      reasons.push('Missing required contact information');
    }

    if (criteria.riskFactors.length > QualificationThresholds.MAX_RISK_FACTORS_FOR_QUALIFICATION) {
      reasons.push(`Too many risk factors: ${criteria.riskFactors.length}`);
    }

    if (criteria.riskFactors.length > 0) {
      const riskFactorNames = criteria.riskFactors.map(factor => 
        this.formatRiskFactorName(factor)
      ).join(', ');
      reasons.push(`Risk factors identified: ${riskFactorNames}`);
    }

    if (!criteria.hasEngagement) {
      reasons.push('Insufficient engagement level');
    }

    return reasons;
  }

  /**
   * Generate reasons for needs review status
   */
  private static generateNeedsReviewReasons(
    criteria: QualificationCriteria,
    leadScore: number
  ): string[] {
    const reasons: string[] = [];

    reasons.push(`Moderate lead score: ${leadScore} (requires review)`);

    if (!criteria.completedQualification) {
      reasons.push('Incomplete qualification process');
    }

    if (criteria.riskFactors.length > 0) {
      const riskFactorNames = criteria.riskFactors.map(factor => 
        this.formatRiskFactorName(factor)
      ).join(', ');
      reasons.push(`Some concerns identified: ${riskFactorNames}`);
    }

    if (QualificationThresholds.isScoreAmbiguous(leadScore)) {
      reasons.push('Score falls in ambiguous range requiring manual assessment');
    }

    if (criteria.hasMinimumContactInfo && criteria.hasEngagement) {
      reasons.push('Shows potential but needs additional qualification');
    }

    return reasons;
  }

  /**
   * Format risk factor names for human readability
   */
  private static formatRiskFactorName(riskFactor: string): string {
    const formatMap: Record<string, string> = {
      'no_contact_info': 'No contact information',
      'low_engagement': 'Low engagement',
      'no_qualification_answers': 'No qualification answers',
      'very_low_score': 'Very low score',
      'no_interests': 'No interests identified',
      'missing_name': 'Missing name',
      'no_pain_points': 'No pain points shared',
      'incomplete_qualification': 'Incomplete qualification'
    };

    return formatMap[riskFactor] || riskFactor.replace(/_/g, ' ');
  }

  /**
   * Get primary reason (most important)
   */
  static getPrimaryReason(
    status: QualificationStatus,
    criteria: QualificationCriteria,
    leadScore: number
  ): string {
    const reasons = this.generateReasons(status, criteria, leadScore);
    return reasons[0] || 'No specific reason provided';
  }
} 