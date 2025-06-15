/**
 * Lead Qualification Analyzer
 * 
 * AI INSTRUCTIONS:
 * - Main orchestrator for lead qualification analysis functionality
 * - Application layer component that coordinates specialized analyzers
 * - Keep under 150 lines, focused on orchestration only
 * - Delegate specific responsibilities to focused sub-components
 * - Follow @golden-rule patterns exactly
 */

import { Lead } from '../../../domain/entities/Lead';
import {
  QualificationThresholds,
  ContactInfoValidator,
  EngagementAnalyzer,
  RiskFactorAnalyzer,
  QualificationStatusDeterminer,
  QualificationReasonGenerator,
  QualificationConfidenceCalculator,
  type QualificationStatus,
  type QualificationCriteria
} from './qualification-analyzers';

export type { QualificationStatus } from './qualification-analyzers';

export interface QualificationAnalysis {
  status: QualificationStatus;
  score: number;
  reasons: string[];
  confidence: number;
  criteria: QualificationCriteria;
}

export class LeadQualificationAnalyzer {
  /**
   * Analyze lead qualification status
   */
  static analyzeQualification(lead: Lead, leadScore: number): QualificationAnalysis {
    const criteria = this.evaluateCriteria(lead, leadScore);
    const status = QualificationStatusDeterminer.determineStatus(leadScore, criteria);
    const reasons = QualificationReasonGenerator.generateReasons(status, criteria, leadScore);
    const confidence = QualificationConfidenceCalculator.calculateConfidence(criteria, leadScore);

    return {
      status,
      score: leadScore,
      reasons,
      confidence,
      criteria
    };
  }

  /**
   * Evaluate qualification criteria using specialized analyzers
   */
  private static evaluateCriteria(lead: Lead, leadScore: number): QualificationCriteria {
    const hasMinimumContactInfo = ContactInfoValidator.hasMinimumContactInfo(lead);
    const meetsScoreThreshold = QualificationThresholds.isScoreClearlyQualified(leadScore);
    const hasEngagement = EngagementAnalyzer.hasEngagement(lead);
    const completedQualification = EngagementAnalyzer.hasCompletedQualification(lead);
    const riskFactors = RiskFactorAnalyzer.identifyRiskFactors(lead, leadScore);

    return {
      hasMinimumContactInfo,
      meetsScoreThreshold,
      hasEngagement,
      completedQualification,
      riskFactors
    };
  }

  /**
   * Get qualification summary for reporting
   */
  static getQualificationSummary(analysis: QualificationAnalysis): {
    status: QualificationStatus;
    score: number;
    confidence: number;
    primaryReason: string;
    actionRequired: string;
  } {
    const primaryReason = QualificationReasonGenerator.getPrimaryReason(
      analysis.status,
      analysis.criteria,
      analysis.score
    );
    
    const actionRequired = QualificationStatusDeterminer.getNextAction(analysis.status);

    return {
      status: analysis.status,
      score: analysis.score,
      confidence: analysis.confidence,
      primaryReason,
      actionRequired
    };
  }

  /**
   * Get detailed qualification breakdown
   */
  static getDetailedBreakdown(lead: Lead, leadScore: number): {
    analysis: QualificationAnalysis;
    contactInfo: {
      completeness: number;
      missing: string[];
      hasMinimum: boolean;
    };
    engagement: {
      score: number;
      description: string;
      strengths: string[];
      concerns: string[];
    };
    riskAssessment: {
      riskLevel: 'low' | 'medium' | 'high' | 'critical';
      riskScore: number;
      recommendations: string[];
    };
    confidenceFactors: Array<{
      factor: string;
      points: number;
      description: string;
    }>;
  } {
    const analysis = this.analyzeQualification(lead, leadScore);
    
    return {
      analysis,
      contactInfo: {
        completeness: ContactInfoValidator.getContactInfoCompleteness(lead),
        missing: ContactInfoValidator.getMissingContactInfo(lead),
        hasMinimum: ContactInfoValidator.hasMinimumContactInfo(lead)
      },
      engagement: {
        score: EngagementAnalyzer.getEngagementScore(lead),
        description: EngagementAnalyzer.getEngagementDescription(lead),
        strengths: EngagementAnalyzer.getEngagementStrengths(lead),
        concerns: EngagementAnalyzer.getEngagementConcerns(lead)
      },
      riskAssessment: RiskFactorAnalyzer.assessRisk(lead, leadScore),
      confidenceFactors: QualificationConfidenceCalculator.getConfidenceFactors(
        analysis.criteria,
        leadScore
      )
    };
  }

  /**
   * Quick qualification check (simplified)
   */
  static isQualified(lead: Lead, leadScore: number): boolean {
    const analysis = this.analyzeQualification(lead, leadScore);
    return analysis.status === 'qualified';
  }

  /**
   * Check if manual review is required
   */
  static requiresManualReview(lead: Lead, leadScore: number): boolean {
    const analysis = this.analyzeQualification(lead, leadScore);
    return analysis.status === 'needs_review' || 
           QualificationConfidenceCalculator.requiresManualReview(analysis.confidence);
  }
} 