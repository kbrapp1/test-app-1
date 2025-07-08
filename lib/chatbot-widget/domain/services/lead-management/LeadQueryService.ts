/**
 * Lead Query Service
 * 
 * Domain Service: Handles lead query and status checking operations
 * Single Responsibility: Lead status queries and business rule evaluation
 * Following DDD domain service patterns
 * 
 * AI INSTRUCTIONS:
 * - UPDATED: Removed dependency on LeadScoringService - using API-only approach
 * - QualificationStatus defined locally
 * - Keep under 200 lines following @golden-rule patterns
 */

import { Lead } from '../../entities/Lead';
import { FollowUpStatus } from '../../entities/LeadLifecycleManager';

// Define QualificationStatus locally since we removed LeadScoringService
export type QualificationStatus = 'not_qualified' | 'qualified' | 'highly_qualified' | 'disqualified';

export class LeadQueryService {
  /** Check if lead is qualified (qualified or highly qualified) */
  static isQualified(qualificationStatus: QualificationStatus): boolean {
    return qualificationStatus === 'qualified' || 
           qualificationStatus === 'highly_qualified';
  }

  /** Check if lead is highly qualified */
  static isHighlyQualified(qualificationStatus: QualificationStatus): boolean {
    return qualificationStatus === 'highly_qualified';
  }

  /** Check if lead is disqualified */
  static isDisqualified(qualificationStatus: QualificationStatus): boolean {
    return qualificationStatus === 'disqualified';
  }

  /** Check if lead is new (not yet contacted) */
  static isNew(followUpStatus: FollowUpStatus): boolean {
    return followUpStatus === 'new';
  }

  /** Check if lead is converted */
  static isConverted(followUpStatus: FollowUpStatus): boolean {
    return followUpStatus === 'converted';
  }

  /** Check if lead is assigned to someone */
  static isAssigned(assignedTo?: string): boolean {
    return !!assignedTo;
  }

  /** Check if lead has recent activity within threshold days */
  static hasRecentActivity(
    lastContactedAt?: Date,
    createdAt?: Date,
    daysThreshold: number = 7
  ): boolean {
    const referenceDate = lastContactedAt || createdAt;
    if (!referenceDate) return false;

    const now = new Date();
    const diffTime = Math.abs(now.getTime() - referenceDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays <= daysThreshold;
  }

  /** Calculate days since lead was created */
  static getDaysSinceCreated(createdAt: Date): number {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - createdAt.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /** Calculate days since last contact */
  static getDaysSinceLastContact(lastContactedAt?: Date): number | null {
    if (!lastContactedAt) return null;
    
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - lastContactedAt.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /** Check if lead needs follow-up based on business rules */
  static needsFollowUp(
    followUpStatus: FollowUpStatus,
    lastContactedAt?: Date,
    daysSinceLastContact: number = 7
  ): boolean {
    // New leads always need follow-up
    if (followUpStatus === 'new') return true;
    
    // Converted and lost leads don't need follow-up
    if (followUpStatus === 'converted' || followUpStatus === 'lost') return false;
    
    // Check if enough time has passed since last contact
    if (!lastContactedAt) return true;
    
    const daysSince = this.getDaysSinceLastContact(lastContactedAt);
    return daysSince !== null && daysSince >= daysSinceLastContact;
  }

  /** Check if lead is high priority based on score and status */
  static isHighPriority(
    leadScore: number,
    qualificationStatus: QualificationStatus,
    followUpStatus: FollowUpStatus
  ): boolean {
    // Highly qualified leads are always high priority
    if (qualificationStatus === 'highly_qualified') return true;
    
    // High score qualified leads are high priority
    if (qualificationStatus === 'qualified' && leadScore >= 80) return true;
    
    // New leads with good scores are high priority
    if (followUpStatus === 'new' && leadScore >= 70) return true;
    
    return false;
  }

  /** Get lead priority level */
  static getPriorityLevel(
    leadScore: number,
    qualificationStatus: QualificationStatus,
    followUpStatus: FollowUpStatus
  ): 'high' | 'medium' | 'low' {
    if (this.isHighPriority(leadScore, qualificationStatus, followUpStatus)) {
      return 'high';
    }
    
    if (qualificationStatus === 'qualified' || leadScore >= 50) {
      return 'medium';
    }
    
    return 'low';
  }

  /** Check if lead is stale (no activity for extended period) */
  static isStale(
    lastContactedAt?: Date,
    createdAt?: Date,
    staleDaysThreshold: number = 30
  ): boolean {
    const referenceDate = lastContactedAt || createdAt;
    if (!referenceDate) return false;

    const daysSince = this.getDaysSinceCreated(referenceDate);
    return daysSince > staleDaysThreshold;
  }
} 