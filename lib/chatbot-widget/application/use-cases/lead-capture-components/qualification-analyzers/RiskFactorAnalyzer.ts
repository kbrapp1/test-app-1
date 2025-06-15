import { Lead } from '../../../../domain/entities/Lead';
import { QualificationThresholds } from './QualificationThresholds';

/**
 * RiskFactorAnalyzer
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Identify and analyze lead qualification risk factors
 * - Apply business rules for risk assessment
 * - Keep under 150 lines, focused on risk analysis only
 * - Use pure functions with no side effects
 * - Follow @golden-rule patterns exactly
 */

export type RiskFactor = 
  | 'no_contact_info'
  | 'low_engagement'
  | 'no_qualification_answers'
  | 'very_low_score'
  | 'no_interests'
  | 'missing_name'
  | 'no_pain_points'
  | 'incomplete_qualification';

export interface RiskAssessment {
  riskFactors: RiskFactor[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskScore: number;
  recommendations: string[];
}

export class RiskFactorAnalyzer {
  /**
   * Identify all risk factors for a lead
   */
  static identifyRiskFactors(lead: Lead, leadScore: number): RiskFactor[] {
    const riskFactors: RiskFactor[] = [];

    // Contact information risks
    if (!lead.contactInfo.email && !lead.contactInfo.phone) {
      riskFactors.push('no_contact_info');
    }

    if (!lead.contactInfo.name || lead.contactInfo.name.trim().length === 0) {
      riskFactors.push('missing_name');
    }

    // Engagement risks
    if (lead.qualificationData.engagementLevel === 'low') {
      riskFactors.push('low_engagement');
    }

    // Qualification process risks
    if (lead.qualificationData.answeredQuestions.length === 0) {
      riskFactors.push('no_qualification_answers');
    }

    if (lead.qualificationData.answeredQuestions.length < QualificationThresholds.MINIMUM_QUALIFICATION_ANSWERS) {
      riskFactors.push('incomplete_qualification');
    }

    // Score-based risks
    if (QualificationThresholds.isScoreCriticallyLow(leadScore)) {
      riskFactors.push('very_low_score');
    }

    // Interest and pain point risks
    if (lead.qualificationData.interests.length === 0) {
      riskFactors.push('no_interests');
    }

    if (lead.qualificationData.painPoints.length === 0) {
      riskFactors.push('no_pain_points');
    }

    return riskFactors;
  }

  /**
   * Perform comprehensive risk assessment
   */
  static assessRisk(lead: Lead, leadScore: number): RiskAssessment {
    const riskFactors = this.identifyRiskFactors(lead, leadScore);
    const riskLevel = this.calculateRiskLevel(riskFactors, leadScore);
    const riskScore = this.calculateRiskScore(riskFactors, leadScore);
    const recommendations = this.generateRecommendations(riskFactors, riskLevel);

    return {
      riskFactors,
      riskLevel,
      riskScore,
      recommendations
    };
  }

  /**
   * Calculate overall risk level
   */
  static calculateRiskLevel(riskFactors: RiskFactor[], leadScore: number): 'low' | 'medium' | 'high' | 'critical' {
    const criticalFactors = riskFactors.filter(factor => 
      factor === 'no_contact_info' || factor === 'very_low_score'
    );

    if (criticalFactors.length > 0 || riskFactors.length >= 5) {
      return 'critical';
    }

    if (riskFactors.length >= 3 || QualificationThresholds.isScoreClearlyUnqualified(leadScore)) {
      return 'high';
    }

    if (riskFactors.length >= 2 || QualificationThresholds.isScoreAmbiguous(leadScore)) {
      return 'medium';
    }

    return 'low';
  }

  /**
   * Calculate numerical risk score (0-100, higher = more risk)
   */
  static calculateRiskScore(riskFactors: RiskFactor[], leadScore: number): number {
    let riskScore = 0;

    // Base risk from lead score (inverted)
    riskScore += Math.max(0, 100 - leadScore);

    // Risk factor penalties
    const riskWeights: Record<RiskFactor, number> = {
      'no_contact_info': 25,
      'very_low_score': 20,
      'low_engagement': 15,
      'no_qualification_answers': 15,
      'incomplete_qualification': 10,
      'missing_name': 10,
      'no_interests': 8,
      'no_pain_points': 5
    };

    riskFactors.forEach(factor => {
      riskScore += riskWeights[factor] || 5;
    });

    return Math.min(100, riskScore);
  }

  /**
   * Generate recommendations based on risk factors
   */
  static generateRecommendations(riskFactors: RiskFactor[], riskLevel: 'low' | 'medium' | 'high' | 'critical'): string[] {
    const recommendations: string[] = [];

    if (riskLevel === 'critical') {
      recommendations.push('Consider disqualifying or moving to long-term nurture campaign');
    }

    if (riskFactors.includes('no_contact_info')) {
      recommendations.push('Prioritize collecting contact information before proceeding');
    }

    if (riskFactors.includes('low_engagement')) {
      recommendations.push('Implement engagement strategies to increase interaction');
    }

    if (riskFactors.includes('no_qualification_answers')) {
      recommendations.push('Guide lead through qualification questions');
    }

    if (riskFactors.includes('very_low_score')) {
      recommendations.push('Reassess lead fit and consider alternative nurture paths');
    }

    if (riskFactors.includes('no_interests')) {
      recommendations.push('Explore lead interests and pain points through targeted questions');
    }

    if (riskLevel === 'medium' || riskLevel === 'high') {
      recommendations.push('Schedule manual review before sales handoff');
    }

    return recommendations;
  }

  /**
   * Check if risk factors disqualify the lead
   */
  static shouldDisqualifyBasedOnRisk(riskFactors: RiskFactor[]): boolean {
    return riskFactors.length > QualificationThresholds.MAX_RISK_FACTORS_FOR_QUALIFICATION ||
           riskFactors.includes('no_contact_info');
  }
} 