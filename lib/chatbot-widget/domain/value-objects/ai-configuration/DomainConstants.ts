/**
 * Domain Constants Value Object
 * 
 * Single source of truth for all hardcoded values in the chatbot domain.
 * Following DDD principles, this encapsulates all business constants and rules
 * to ensure consistency and maintainability across the system.
 */

// Core Intent Types (Updated to include all business logic intents)
export const INTENT_TYPES = [
  // General intents
  'greeting',
  'unknown',
  
  // Support/FAQ intents
  'faq_general', 
  'faq_pricing',
  'faq_features',
  'support_request',
  
  // Sales intents
  'sales_inquiry',
  'booking_request',
  'demo_request',
  'closing',
  
  // Qualification intents
  'qualification',
  'objection_handling',
  
  // Business context intents (used by IntentPersistenceService)
  'company_inquiry',
  'business_inquiry',
  'product_inquiry',
  'feature_inquiry',
  'pricing_inquiry',
  'cost_inquiry',
  'comparison_inquiry',
  'competitor_inquiry'
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
  contactMethod: 5
  // REMOVED: role - now uses authority-based scoring via ROLE_AUTHORITY_WEIGHTS
} as const;

// Role Authority-Based Scoring (B2B Best Practice)
export const ROLE_AUTHORITY_WEIGHTS = {
  // C-Suite & Founders (Decision Makers) - 25 points
  'ceo': 25, 'chief executive officer': 25, 'chief executive': 25,
  'cto': 25, 'chief technology officer': 25, 'chief technical officer': 25,
  'cfo': 25, 'chief financial officer': 25,
  'coo': 25, 'chief operating officer': 25,
  'cmo': 25, 'chief marketing officer': 25,
  'cso': 25, 'chief security officer': 25,
  'cpo': 25, 'chief product officer': 25,
  'president': 25, 'founder': 25, 'co-founder': 25, 'owner': 25,
  'managing director': 25, 'executive director': 25,
  
  // Senior Leadership (Influencers) - 20 points  
  'vp': 20, 'vice president': 20, 'svp': 20, 'senior vice president': 20,
  'evp': 20, 'executive vice president': 20,
  'head of': 20, 'chief': 20, 'general manager': 20,
  
  // Mid-Level Management (Evaluators) - 15 points
  'director': 15, 'senior director': 15,
  'principal': 15, 'lead': 15, 'team lead': 15, 'tech lead': 15,
  'senior principal': 15, 'staff': 15,
  
  // Team Management (Users) - 10 points
  'manager': 10, 'senior manager': 10, 'project manager': 10,
  'product manager': 10, 'program manager': 10,
  'supervisor': 10, 'team leader': 10, 'scrum master': 10,
  
  // Senior Individual Contributors (Influencers) - 8 points
  'senior engineer': 8, 'senior developer': 8, 'senior analyst': 8,
  'senior consultant': 8, 'senior architect': 8, 'principal engineer': 8,
  'staff engineer': 8, 'senior specialist': 8,
  
  // Individual Contributors (End Users) - 5 points
  'engineer': 5, 'developer': 5, 'analyst': 5, 'consultant': 5,
  'specialist': 5, 'coordinator': 5, 'administrator': 5,
  'architect': 5, 'designer': 5, 'researcher': 5,
  
  // Entry Level (Researchers) - 2 points
  'associate': 2, 'junior': 2, 'intern': 2, 'trainee': 2,
  'assistant': 2, 'entry level': 2, 'graduate': 2
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

export const BUSINESS_CONTEXT_INTENTS: readonly IntentType[] = [
  'company_inquiry',
  'business_inquiry',
  'product_inquiry',
  'feature_inquiry',
  'pricing_inquiry',
  'cost_inquiry',
  'comparison_inquiry',
  'competitor_inquiry'
];

export const GENERAL_INTENTS: readonly IntentType[] = [
  'greeting',
  'unknown'
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

  static getBusinessContextIntents(): readonly IntentType[] {
    return BUSINESS_CONTEXT_INTENTS;
  }

  static getGeneralIntents(): readonly IntentType[] {
    return GENERAL_INTENTS;
  }

  static isValidIntentType(intent: string): intent is IntentType {
    return INTENT_TYPES.includes(intent as IntentType);
  }

  static isBusinessContextIntent(intent: string): boolean {
    return BUSINESS_CONTEXT_INTENTS.includes(intent as IntentType);
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

  static getRoleAuthorityScore(role: string): number {
    if (!role) return 0;
    
    const normalizedRole = role.toLowerCase().trim();
    
    // Check for exact matches first
    if (normalizedRole in ROLE_AUTHORITY_WEIGHTS) {
      return ROLE_AUTHORITY_WEIGHTS[normalizedRole as keyof typeof ROLE_AUTHORITY_WEIGHTS];
    }
    
    // Check for partial matches (e.g., "VP of Sales" should match "vp")
    for (const [roleKey, score] of Object.entries(ROLE_AUTHORITY_WEIGHTS)) {
      if (normalizedRole.includes(roleKey)) {
        return score;
      }
    }
    
    // Default score for unknown roles (treated as individual contributor)
    return 5;
  }

  static getRoleAuthorityWeights(): typeof ROLE_AUTHORITY_WEIGHTS {
    return ROLE_AUTHORITY_WEIGHTS;
  }

  static calculateLeadScore(entities: any): number {
    let score = 0;
    
    // Handle role with authority-based scoring
    if (entities.role) {
      score += this.getRoleAuthorityScore(entities.role);
    }
    
    // Handle other entities with standard scoring
    Object.entries(entities).forEach(([key, value]) => {
      if (value && key !== 'role' && key in LEAD_SCORING_RULES) {
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
  static getIntentCategory(intent: IntentType): 'sales' | 'support' | 'qualification' | 'business_context' | 'general' {
    if (SALES_INTENTS.includes(intent)) return 'sales';
    if (SUPPORT_INTENTS.includes(intent)) return 'support';
    if (QUALIFICATION_INTENTS.includes(intent)) return 'qualification';
    if (BUSINESS_CONTEXT_INTENTS.includes(intent)) return 'business_context';
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