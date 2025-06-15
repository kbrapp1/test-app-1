/**
 * Conversation Intent Domain Service
 * 
 * Pure domain service for intent detection and classification.
 * Contains business rules for understanding user intentions.
 * Following @golden-rule.mdc: Single responsibility, pure domain logic
 */

export interface IntentDetectionResult {
  intent: string;
  confidence: number;
  category: 'inquiry' | 'request' | 'support' | 'sales';
}

export class ConversationIntentService {
  private readonly intentPatterns = {
    pricing_inquiry: [
      'price', 'cost', 'pricing', 'how much', 'payment', 'fee', 'rate', 'budget'
    ],
    demo_request: [
      'demo', 'trial', 'test', 'preview', 'show me', 'try it', 'example'
    ],
    contact_request: [
      'contact', 'call', 'email', 'reach out', 'get in touch', 'speak with'
    ],
    support_request: [
      'help', 'support', 'problem', 'issue', 'trouble', 'error', 'bug'
    ],
    feature_inquiry: [
      'feature', 'how does', 'can you', 'what can', 'capabilities', 'functionality'
    ],
    lead_capture: [
      'interested', 'want to know more', 'my email is', 'my phone is', 
      'my company is', 'sign up', 'get started', 'quote'
    ]
  };

  private readonly categoryMapping = {
    pricing_inquiry: 'sales' as const,
    demo_request: 'sales' as const,
    contact_request: 'request' as const,
    support_request: 'support' as const,
    feature_inquiry: 'inquiry' as const,
    lead_capture: 'sales' as const,
    general_inquiry: 'inquiry' as const
  };

  /**
   * Detect user intent from message content
   */
  detectIntent(userMessage: string): IntentDetectionResult {
    const message = userMessage.toLowerCase();
    let bestMatch = { intent: 'general_inquiry', score: 0 };

    // Score each intent pattern
    for (const [intent, patterns] of Object.entries(this.intentPatterns)) {
      const score = patterns.reduce((acc, pattern) => {
        return acc + (message.includes(pattern) ? 1 : 0);
      }, 0);

      if (score > bestMatch.score) {
        bestMatch = { intent, score };
      }
    }

    const confidence = this.calculateConfidence(bestMatch.score, message);
    const category = this.categoryMapping[bestMatch.intent as keyof typeof this.categoryMapping];

    return {
      intent: bestMatch.intent,
      confidence,
      category
    };
  }

  /**
   * Check if message should trigger lead capture
   */
  shouldTriggerLeadCapture(userMessage: string): boolean {
    const leadTriggerPatterns = this.intentPatterns.lead_capture;
    const message = userMessage.toLowerCase();
    
    return leadTriggerPatterns.some(pattern => message.includes(pattern));
  }

  /**
   * Calculate confidence score based on pattern matches and message characteristics
   */
  private calculateConfidence(patternMatches: number, message: string): number {
    const baseConfidence = Math.min(patternMatches * 0.3, 0.9);
    
    // Adjust for message length and complexity
    const lengthFactor = message.length > 10 ? 0.1 : 0;
    const questionFactor = message.includes('?') ? 0.1 : 0;
    
    return Math.min(baseConfidence + lengthFactor + questionFactor, 0.95);
  }
} 