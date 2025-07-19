/**
 * Lead Scoring Value Objects - Domain Types
 * 
 * Pure domain value objects for lead scoring and qualification.
 * Contains business logic concepts for lead evaluation.
 */

/**
 * Lead scoring calculation interface
 * Domain value object containing all data needed for lead scoring
 */
export interface LeadScoringEntities {
  readonly contactInfo: {
    readonly email?: string;
    readonly phone?: string;
    readonly name?: string;
  };
  readonly businessInfo: {
    readonly company?: string;
    readonly industry?: string;
    readonly size?: string;
  };
  readonly intentSignals: {
    readonly urgency?: 'low' | 'medium' | 'high';
    readonly budget?: 'low' | 'medium' | 'high';
    readonly timeline?: 'immediate' | 'short' | 'medium' | 'long';
  };
  readonly engagementMetrics: {
    readonly messageCount?: number;
    readonly sessionDuration?: number;
    readonly responseTime?: number;
  };
  readonly role?: string; // User's role/title for authority-based scoring
}

/**
 * Lead qualification parameters interface
 * Domain value object for qualification calculation results
 */
export interface LeadQualificationParams {
  readonly score: number;
  readonly qualificationLevel: 'low' | 'medium' | 'high';
  readonly breakdown: {
    readonly contactInfo: number;
    readonly businessInfo: number;
    readonly intentSignals: number;
    readonly engagementMetrics: number;
  };
  readonly calculatedAt: Date;
  readonly organizationId: string; // SECURITY-CRITICAL: Organization isolation
}