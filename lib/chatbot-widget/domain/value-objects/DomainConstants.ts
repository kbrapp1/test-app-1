/**
 * Domain Constants Value Object
 * 
 * Single source of truth for all hardcoded values in the chatbot domain.
 * Following DDD principles, this encapsulates all business constants and rules
 * to ensure consistency and maintainability across the system.
 */

// Core Intent Types
export const INTENT_TYPES = [
  'greeting',
  'faq_general', 
  'faq_pricing',
  'faq_features',
  'sales_inquiry',
  'booking_request',
  'demo_request',
  'support_request',
  'objection_handling',
  'qualification',
  'closing',
  'unknown'
] as const;

export type IntentType = typeof INTENT_TYPES[number];

// Journey Stages
export const JOURNEY_STAGES = [
  'visitor',
  'curious', 
  'interested',
  'evaluating',
  'ready_to_buy',
  'qualified_lead',
  'converted',
  'lost'
] as const;

export type JourneyStage = typeof JOURNEY_STAGES[number];

// Entity Types
export const CORE_BUSINESS_ENTITIES = [
  'budget',
  'timeline', 
  'company',
  'industry',
  'teamSize',
  'location',
  'urgency',
  'contactMethod',
  'preferredTime',
  'timezone',
  'availability',
  'role'
] as const;

export const ADVANCED_ENTITIES = [
  'eventType',
  'productName',
  'featureName',
  'integrationNeeds',
  'issueType',
  'severity',
  'affectedFeature',
  'currentSolution',
  'painPoints',
  'decisionMakers'
] as const;

export const ALL_ENTITY_TYPES = [...CORE_BUSINESS_ENTITIES, ...ADVANCED_ENTITIES] as const;
export type EntityType = typeof ALL_ENTITY_TYPES[number];

// Enum Values
export const URGENCY_LEVELS = ['low', 'medium', 'high'] as const;
export const SEVERITY_LEVELS = ['low', 'medium', 'high', 'critical'] as const;
export const CONTACT_METHODS = ['email', 'phone', 'meeting'] as const;
export const EVENT_TYPES = ['demo', 'consultation', 'onboarding', 'support_call', 'sales_call'] as const;
export const ISSUE_TYPES = ['technical', 'billing', 'feature_request', 'bug_report', 'general'] as const;

// Business Rules - Lead Scoring
export const LEAD_SCORING_RULES = {
  budget: 25,
  timeline: 20, 
  company: 15,
  industry: 10,
  teamSize: 15,
  urgency: 10,
  contactMethod: 5,
  role: 10
} as const;

// Stage Transition Rules
export const SALES_READY_STAGES: readonly JourneyStage[] = ['ready_to_buy', 'qualified_lead'];
export const ACTIVELY_ENGAGED_STAGES: readonly JourneyStage[] = ['curious', 'interested', 'evaluating', 'ready_to_buy'];

// Default Thresholds
export const DEFAULT_THRESHOLDS = {
  intentConfidence: 0.7,
  stageTransition: 0.75,
  personaInference: 0.6,
  leadQualification: 70,
  responseTime: 2000,
  contextWindow: 12000,
  maxConversationTurns: 20,
  inactivityTimeout: 300
} as const;

// Intent Categories
export const SALES_INTENTS: readonly IntentType[] = [
  'sales_inquiry',
  'booking_request', 
  'demo_request',
  'closing'
];

export const SUPPORT_INTENTS: readonly IntentType[] = [
  'support_request',
  'faq_general',
  'faq_pricing', 
  'faq_features'
];

export const QUALIFICATION_INTENTS: readonly IntentType[] = [
  'qualification',
  'objection_handling'
];

/**
 * DomainConstants Value Object
 * Provides structured access to all domain constants and business rules
 */
export class DomainConstants {
  
  // Intent Type Methods
  static getAllIntentTypes(): readonly IntentType[] {
    return INTENT_TYPES;
  }

  static getSalesIntents(): readonly IntentType[] {
    return SALES_INTENTS;
  }

  static getSupportIntents(): readonly IntentType[] {
    return SUPPORT_INTENTS;
  }

  static getQualificationIntents(): readonly IntentType[] {
    return QUALIFICATION_INTENTS;
  }

  static isValidIntentType(intent: string): intent is IntentType {
    return INTENT_TYPES.includes(intent as IntentType);
  }

  // Journey Stage Methods
  static getAllJourneyStages(): readonly JourneyStage[] {
    return JOURNEY_STAGES;
  }

  static getSalesReadyStages(): readonly JourneyStage[] {
    return SALES_READY_STAGES;
  }

  static getActivelyEngagedStages(): readonly JourneyStage[] {
    return ACTIVELY_ENGAGED_STAGES;
  }

  static isValidJourneyStage(stage: string): stage is JourneyStage {
    return JOURNEY_STAGES.includes(stage as JourneyStage);
  }

  static isSalesReady(stage: JourneyStage): boolean {
    return SALES_READY_STAGES.includes(stage);
  }

  static isActivelyEngaged(stage: JourneyStage): boolean {
    return ACTIVELY_ENGAGED_STAGES.includes(stage);
  }

  // Entity Type Methods
  static getAllEntityTypes(): readonly EntityType[] {
    return ALL_ENTITY_TYPES;
  }

  static getCoreBusinessEntities(): readonly string[] {
    return CORE_BUSINESS_ENTITIES;
  }

  static getAdvancedEntities(): readonly string[] {
    return ADVANCED_ENTITIES;
  }

  static isValidEntityType(entity: string): entity is EntityType {
    return ALL_ENTITY_TYPES.includes(entity as EntityType);
  }

  // Enum Value Methods
  static getUrgencyLevels(): readonly string[] {
    return URGENCY_LEVELS;
  }

  static getSeverityLevels(): readonly string[] {
    return SEVERITY_LEVELS;
  }

  static getContactMethods(): readonly string[] {
    return CONTACT_METHODS;
  }

  static getEventTypes(): readonly string[] {
    return EVENT_TYPES;
  }

  static getIssueTypes(): readonly string[] {
    return ISSUE_TYPES;
  }

  // Business Rules Methods
  static getLeadScoringRules(): typeof LEAD_SCORING_RULES {
    return LEAD_SCORING_RULES;
  }

  static getLeadScoringWeight(entity: keyof typeof LEAD_SCORING_RULES): number {
    return LEAD_SCORING_RULES[entity];
  }

  static calculateLeadScore(entities: Partial<Record<keyof typeof LEAD_SCORING_RULES, any>>): number {
    let score = 0;
    
    Object.entries(entities).forEach(([key, value]) => {
      if (value && key in LEAD_SCORING_RULES) {
        score += LEAD_SCORING_RULES[key as keyof typeof LEAD_SCORING_RULES];
      }
    });
    
    return Math.min(score, 100);
  }

  // Threshold Methods
  static getDefaultThresholds(): typeof DEFAULT_THRESHOLDS {
    return DEFAULT_THRESHOLDS;
  }

  static getIntentConfidenceThreshold(): number {
    return DEFAULT_THRESHOLDS.intentConfidence;
  }

  static getStageTransitionThreshold(): number {
    return DEFAULT_THRESHOLDS.stageTransition;
  }

  static getPersonaInferenceThreshold(): number {
    return DEFAULT_THRESHOLDS.personaInference;
  }

  // Validation Methods
  static validateBusinessRules(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate scoring rules sum to reasonable total
    const totalPoints = Object.values(LEAD_SCORING_RULES).reduce((sum, points) => sum + points, 0);
    if (totalPoints > 150) {
      errors.push(`Lead scoring rules total ${totalPoints} points, which may be too high`);
    }

    // Validate thresholds are in valid ranges
    Object.entries(DEFAULT_THRESHOLDS).forEach(([key, value]) => {
      if (key.includes('confidence') || key.includes('Threshold')) {
        if (value < 0 || value > 1) {
          errors.push(`${key} threshold ${value} is outside valid range [0, 1]`);
        }
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Categorization Methods
  static getIntentCategory(intent: IntentType): 'sales' | 'support' | 'qualification' | 'general' {
    if (SALES_INTENTS.includes(intent)) return 'sales';
    if (SUPPORT_INTENTS.includes(intent)) return 'support';
    if (QUALIFICATION_INTENTS.includes(intent)) return 'qualification';
    return 'general';
  }

  static getEntityCategory(entity: EntityType): 'core_business' | 'advanced' {
    return CORE_BUSINESS_ENTITIES.includes(entity as any) ? 'core_business' : 'advanced';
  }

  // Summary Methods
  static getDomainSummary() {
    return {
      intentTypes: INTENT_TYPES.length,
      journeyStages: JOURNEY_STAGES.length,
      entityTypes: ALL_ENTITY_TYPES.length,
      businessRules: Object.keys(LEAD_SCORING_RULES).length,
      thresholds: Object.keys(DEFAULT_THRESHOLDS).length,
      validation: this.validateBusinessRules()
    };
  }
} 