/**
 * Intent Types Value Object
 * 
 * Encapsulates all intent types and their categorization logic
 * following DDD principles for the chatbot domain.
 */

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

export type IntentCategory = 'sales' | 'support' | 'qualification' | 'business_context' | 'general';

/**
 * Intent Types Value Object
 * Provides structured access to intent types and categorization
 */
export class IntentTypes {
  
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

  static getIntentCategory(intent: IntentType): IntentCategory {
    if (SALES_INTENTS.includes(intent)) return 'sales';
    if (SUPPORT_INTENTS.includes(intent)) return 'support';
    if (QUALIFICATION_INTENTS.includes(intent)) return 'qualification';
    if (BUSINESS_CONTEXT_INTENTS.includes(intent)) return 'business_context';
    return 'general';
  }
}