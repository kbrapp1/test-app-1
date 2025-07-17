/**
 * Lead Qualification Analyzer (AI-Only Version)
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Extract and format AI-provided qualification data
 * - No business rules or thresholds - AI determines everything
 * - Keep under 100 lines, focused on data extraction only
 * - Use AI-provided qualification status, reasons, and confidence
 * - Follow @golden-rule patterns exactly
 * - UPDATED: Removed all business rule analyzers - using OpenAI API decisions only
 */

import { Lead as _Lead } from '../../../domain/entities/Lead';

// AI-provided qualification types (from OpenAI function calling)
export type QualificationStatus = 'qualified' | 'unqualified' | 'needs_review';

export interface QualificationAnalysis {
  status: QualificationStatus;
  score: number;
  reasons: string[];
  confidence: number;
  aiProvided: boolean; // Flag to indicate this came from AI
}

export class LeadQualificationAnalyzer {
  /**
   * Extract qualification analysis from AI-provided data
   * This replaces all business rule logic with AI decisions
   */
  static extractAIQualification(
    leadScore: number,
    aiQualificationData?: {
      isQualified?: boolean;
      readyForSales?: boolean;
      qualificationReason?: string;
      confidence?: number;
    }
  ): QualificationAnalysis {
    // If AI provided qualification data, use it
    if (aiQualificationData) {
      return {
        status: this.mapAIStatusToQualificationStatus(aiQualificationData),
        score: leadScore,
        reasons: aiQualificationData.qualificationReason 
          ? [aiQualificationData.qualificationReason]
          : [`AI-determined lead score: ${leadScore}`],
        confidence: aiQualificationData.confidence || 0.8,
        aiProvided: true
      };
    }

    // Fallback: Simple score-based classification (minimal business logic)
    return this.createFallbackQualification(leadScore);
  }

  /** Map AI qualification flags to our status enum */
  private static mapAIStatusToQualificationStatus(
    aiData: {
      isQualified?: boolean;
      readyForSales?: boolean;
      qualificationReason?: string;
    }
  ): QualificationStatus {
    // AI explicitly says qualified and ready for sales
    if (aiData.isQualified && aiData.readyForSales) {
      return 'qualified';
    }

    // AI explicitly says not qualified
    if (aiData.isQualified === false) {
      return 'unqualified';
    }

    // AI says qualified but not ready for sales, or unclear
    return 'needs_review';
  }

  /** Create minimal fallback qualification when AI data is unavailable */
  private static createFallbackQualification(leadScore: number): QualificationAnalysis {
    // Minimal fallback logic - just use score ranges
    let status: QualificationStatus;
    let reason: string;

    if (leadScore >= 80) {
      status = 'qualified';
      reason = `High lead score (${leadScore}) indicates strong qualification`;
    } else if (leadScore < 30) {
      status = 'unqualified';
      reason = `Low lead score (${leadScore}) indicates poor fit`;
    } else {
      status = 'needs_review';
      reason = `Moderate lead score (${leadScore}) requires manual review`;
    }

    return {
      status,
      score: leadScore,
      reasons: [reason],
      confidence: 0.6, // Lower confidence for fallback
      aiProvided: false
    };
  }

  /** Get simple qualification summary for reporting */
  static getQualificationSummary(analysis: QualificationAnalysis): {
    isQualified: boolean;
    readyForSales: boolean;
    nextAction: string;
  } {
    return {
      isQualified: analysis.status === 'qualified',
      readyForSales: analysis.status === 'qualified',
      nextAction: this.getNextAction(analysis.status)
    };
  }

  /** Get recommended next action based on qualification status */
  private static getNextAction(status: QualificationStatus): string {
    switch (status) {
      case 'qualified':
        return 'immediate_sales_handoff';
      case 'unqualified':
        return 'nurture_sequence';
      case 'needs_review':
        return 'manual_review';
      default:
        return 'manual_review';
    }
  }
} 