/**
 * Service responsible for categorizing intents
 * Following DDD principles: Single responsibility for intent categorization
 */
export class IntentCategorizationService {
  static getIntentCategory(intent: string): 'sales' | 'support' | 'qualification' | 'general' {
    const categoryMap: Record<string, 'sales' | 'support' | 'qualification' | 'general'> = {
      'greeting': 'general',
      'faq_general': 'general',
      'faq_pricing': 'general',
      'faq_features': 'general',
      'sales_inquiry': 'sales',
      'demo_request': 'sales',
      'booking_request': 'sales',
      'support_request': 'support',
      'qualification': 'qualification',
      'objection_handling': 'sales',
      'closing': 'sales'
    };
    return categoryMap[intent] || 'general';
  }
} 