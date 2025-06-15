import { QualificationThresholds } from './QualificationThresholds';
import { RiskFactor } from './RiskFactorAnalyzer';

/**
 * QualificationStatusDeterminer
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Determine final qualification status based on criteria
 * - Apply business rules for status determination logic
 * - Keep under 100 lines, focused on status determination only
 * - Use pure functions with no side effects
 * - Follow @golden-rule patterns exactly
 */

export type QualificationStatus = 'qualified' | 'unqualified' | 'needs_review';

export interface QualificationCriteria {
  hasMinimumContactInfo: boolean;
  meetsScoreThreshold: boolean;
  hasEngagement: boolean;
  completedQualification: boolean;
  riskFactors: RiskFactor[];
}

export class QualificationStatusDeterminer {
  /**
   * Determine qualification status based on score and criteria
   */
  static determineStatus(
    leadScore: number,
    criteria: QualificationCriteria
  ): QualificationStatus {
    // Immediate disqualification conditions
    if (this.shouldDisqualify(leadScore, criteria)) {
      return 'unqualified';
    }

    // High qualification conditions
    if (this.shouldQualify(leadScore, criteria)) {
      return 'qualified';
    }

    // Medium range needs review
    return 'needs_review';
  }

  /**
   * Check if lead should be disqualified
   */
  private static shouldDisqualify(
    leadScore: number,
    criteria: QualificationCriteria
  ): boolean {
    // Score too low
    if (QualificationThresholds.isScoreClearlyUnqualified(leadScore)) {
      return true;
    }

    // Missing essential contact information
    if (!criteria.hasMinimumContactInfo) {
      return true;
    }

    // Too many risk factors
    if (criteria.riskFactors.length > QualificationThresholds.MAX_RISK_FACTORS_FOR_QUALIFICATION) {
      return true;
    }

    // Critical risk factors present
    const criticalRiskFactors = ['no_contact_info', 'very_low_score'];
    if (criteria.riskFactors.some(factor => criticalRiskFactors.includes(factor))) {
      return true;
    }

    return false;
  }

  /**
   * Check if lead should be qualified
   */
  private static shouldQualify(
    leadScore: number,
    criteria: QualificationCriteria
  ): boolean {
    // Must meet score threshold
    if (!QualificationThresholds.isScoreClearlyQualified(leadScore)) {
      return false;
    }

    // Must have minimum contact info
    if (!criteria.hasMinimumContactInfo) {
      return false;
    }

    // Must show engagement
    if (!criteria.hasEngagement) {
      return false;
    }

    // Should have minimal risk factors
    if (criteria.riskFactors.length > 1) {
      return false;
    }

    return true;
  }

  /**
   * Get status description
   */
  static getStatusDescription(status: QualificationStatus): string {
    switch (status) {
      case 'qualified':
        return 'Lead meets all qualification criteria and is ready for sales engagement';
      case 'unqualified':
        return 'Lead does not meet minimum qualification requirements';
      case 'needs_review':
        return 'Lead shows potential but requires manual review before sales handoff';
      default:
        return 'Unknown qualification status';
    }
  }

  /**
   * Get next action for status
   */
  static getNextAction(status: QualificationStatus): string {
    switch (status) {
      case 'qualified':
        return 'Assign to sales team for immediate follow-up';
      case 'unqualified':
        return 'Add to nurture campaign or discard';
      case 'needs_review':
        return 'Queue for manual review and additional qualification';
      default:
        return 'Review qualification status';
    }
  }
} 