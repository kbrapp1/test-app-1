/**
 * Readiness Indicator Domain Service
 * 
 * AI INSTRUCTIONS:
 * - Pure domain logic for calculating readiness indicators from API data
 * - Single responsibility: Transform API data into business readiness indicators
 * - No external dependencies - only domain concepts
 * - Follow @golden-rule.mdc domain service patterns
 * - Stay under 200-250 lines
 * - Use specific domain errors for validation failures
 */

import { BusinessRuleViolationError } from '../../errors/ChatbotWidgetDomainErrors';
import { EntitySummary } from '../../types/AccumulatedEntityTypes';

export interface ReadinessIndicators {
  hasContactInfo: boolean;
  showsBuyingIntent: boolean;
  hasDecisionAuthority: boolean;
  hasBudgetIndications: boolean;
  hasTimelineUrgency: boolean;
}

export interface ReadinessEntityContext extends EntitySummary {
  // Additional entity fields for readiness calculation
  email?: string;
  phone?: string;
  eventType?: string;
  productName?: string;
  featureName?: string;
  preferredTime?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

export interface ReadinessCalculationContext {
  leadScore: number;
  entities: ReadinessEntityContext;
  conversationPhase: string;
  engagementLevel: string;
  userRole?: string;
  industry?: string;
}

export class ReadinessIndicatorDomainService {
  
  /** Derive readiness indicators from API-provided data */
  static deriveReadinessIndicators(context: ReadinessCalculationContext): ReadinessIndicators {
    // Validate required context
    if (typeof context.leadScore !== 'number' || context.leadScore < 0 || context.leadScore > 100) {
      throw new BusinessRuleViolationError(
        'Lead score must be a number between 0 and 100',
        { providedScore: context.leadScore }
      );
    }

    const entities = context.entities || {};
    const leadScore = context.leadScore;
    const conversationPhase = context.conversationPhase || 'discovery';
    const engagementLevel = context.engagementLevel || 'low';

    return {
      hasContactInfo: this.calculateContactInfoIndicator(entities, conversationPhase),
      showsBuyingIntent: this.calculateBuyingIntentIndicator(leadScore, entities, conversationPhase, engagementLevel),
      hasDecisionAuthority: this.calculateDecisionAuthorityIndicator(entities, context.userRole),
      hasBudgetIndications: this.calculateBudgetIndicator(entities, leadScore, conversationPhase),
      hasTimelineUrgency: this.calculateTimelineUrgencyIndicator(entities, conversationPhase, engagementLevel)
    };
  }

  /**
   * Calculate readiness score from derived indicators
   * 
   * AI INSTRUCTIONS:
   * - Apply business weighting rules for each indicator
   * - Use domain knowledge for scoring algorithm
   * - Return score in business-meaningful range (0-100)
   */
  static calculateReadinessScore(indicators: ReadinessIndicators): number {
    const weights = {
      hasContactInfo: 25,
      showsBuyingIntent: 30,
      hasDecisionAuthority: 20,
      hasBudgetIndications: 15,
      hasTimelineUrgency: 10
    };
    
    let score = 0;
    if (indicators.hasContactInfo) score += weights.hasContactInfo;
    if (indicators.showsBuyingIntent) score += weights.showsBuyingIntent;
    if (indicators.hasDecisionAuthority) score += weights.hasDecisionAuthority;
    if (indicators.hasBudgetIndications) score += weights.hasBudgetIndications;
    if (indicators.hasTimelineUrgency) score += weights.hasTimelineUrgency;
    
    return score;
  }

  /** Domain logic: Calculate contact information indicator */
  private static calculateContactInfoIndicator(entities: ReadinessEntityContext, conversationPhase: string): boolean {
    // Direct contact information available
    if (entities.email || entities.phone || entities.contactMethod) {
      return true;
    }

    // Business context indicates contact readiness
    if (entities.company && entities.role) {
      return true;
    }

    // Advanced conversation phases typically indicate contact exchange readiness
    if (['qualification', 'demonstration', 'closing'].includes(conversationPhase)) {
      return !!(entities.company || entities.role);
    }

    return false;
  }

  /** Domain logic: Calculate buying intent indicator */
  private static calculateBuyingIntentIndicator(
    leadScore: number, 
    entities: ReadinessEntityContext, 
    conversationPhase: string,
    engagementLevel: string
  ): boolean {
    // High lead score indicates strong buying signals
    if (leadScore >= 70) {
      return true;
    }

    // Specific buying-related entities
    if (entities.budget || entities.timeline || entities.urgency === 'high') {
      return true;
    }

    // Pain points + medium engagement suggests solution seeking
    if (entities.painPoints && entities.painPoints.length > 0 && (engagementLevel === 'high' || engagementLevel === 'very_high')) {
      return true;
    }

    // Advanced conversation phases with reasonable engagement
    if (['qualification', 'demonstration', 'closing'].includes(conversationPhase) && leadScore >= 50) {
      return true;
    }

    // Demo or trial requests indicate buying intent
    if (entities.eventType === 'demo' || entities.productName || entities.featureName) {
      return true;
    }

    return false;
  }

  /** Domain logic: Calculate decision authority indicator */
  private static calculateDecisionAuthorityIndicator(entities: ReadinessEntityContext, userRole?: string): boolean {
    const role = entities.role || userRole || '';
    const normalizedRole = role.toLowerCase();

    // C-level executives have clear decision authority
    if (normalizedRole.includes('ceo') || normalizedRole.includes('cto') || normalizedRole.includes('cfo')) {
      return true;
    }

    // VP and Director level typically have decision authority
    if (normalizedRole.includes('vp') || normalizedRole.includes('director') || normalizedRole.includes('vice president')) {
      return true;
    }

    // Founders and owners have decision authority
    if (normalizedRole.includes('founder') || normalizedRole.includes('owner')) {
      return true;
    }

    // Manager level with budget discussions indicates decision involvement
    if (normalizedRole.includes('manager') && entities.budget) {
      return true;
    }

    // Decision makers explicitly mentioned
    if (entities.decisionMakers && entities.decisionMakers.length > 0) {
      return true;
    }

    // Small company context - individual contributors often have authority
    if (entities.teamSize && this.isSmallTeam(entities.teamSize) && entities.company) {
      return true;
    }

    return false;
  }

  /**
   * Domain logic: Calculate budget indicator
   */
  private static calculateBudgetIndicator(entities: ReadinessEntityContext, leadScore: number, conversationPhase: string): boolean {
    // Explicit budget information
    if (entities.budget) {
      return true;
    }

    // High lead score in advanced phases suggests budget alignment
    if (leadScore >= 80 && ['qualification', 'demonstration', 'closing'].includes(conversationPhase)) {
      return true;
    }

    // Company size and role combination suggests budget capacity
    if (entities.company && entities.role && this.hasImpliedBudgetCapacity(entities)) {
      return true;
    }

    return false;
  }

  /** Domain logic: Calculate timeline urgency indicator */
  private static calculateTimelineUrgencyIndicator(
    entities: ReadinessEntityContext, 
    conversationPhase: string,
    engagementLevel: string
  ): boolean {
    // Explicit urgency indicators
    if (entities.urgency === 'high' || entities.timeline) {
      return true;
    }

    // High engagement in closing phase indicates urgency
    if (conversationPhase === 'closing' && (engagementLevel === 'high' || engagementLevel === 'very_high')) {
      return true;
    }

    // Immediate scheduling requests indicate urgency
    if (entities.eventType && entities.preferredTime) {
      return true;
    }

    // Severity levels indicate urgency in support contexts
    if (entities.severity === 'high' || entities.severity === 'critical') {
      return true;
    }

    return false;
  }

  /** Helper: Determine if team size indicates small organization */
  private static isSmallTeam(teamSize: string): boolean {
    const normalizedSize = teamSize.toLowerCase();
    return normalizedSize.includes('1-10') || 
           normalizedSize.includes('small') || 
           normalizedSize.includes('startup') ||
           normalizedSize.includes('5') ||
           normalizedSize.includes('under 20');
  }

  /** Helper: Determine if role/company combination implies budget capacity */
  private static hasImpliedBudgetCapacity(entities: ReadinessEntityContext): boolean {
    const role = entities.role ? entities.role.toLowerCase() : '';
    const industry = entities.industry ? entities.industry.toLowerCase() : '';
    
    // Technology companies with technical roles typically have software budgets
    if (industry.includes('technology') && (role.includes('engineer') || role.includes('developer'))) {
      return true;
    }
    
    // Business roles in established industries
    if (['finance', 'healthcare', 'education', 'manufacturing'].some(ind => industry.includes(ind))) {
      if (role.includes('manager') || role.includes('analyst') || role.includes('coordinator')) {
        return true;
      }
    }

    return false;
  }
} 