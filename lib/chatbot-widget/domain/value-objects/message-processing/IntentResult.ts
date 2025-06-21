export type IntentType = 
  | 'greeting'
  | 'faq_general'
  | 'faq_pricing'
  | 'faq_features'
  | 'sales_inquiry'
  | 'booking_request'
  | 'demo_request'
  | 'support_request'
  | 'objection_handling'
  | 'qualification'
  | 'closing'
  | 'unknown';

export interface ExtractedEntities {
  visitorName?: string;
  location?: string;
  budget?: string;
  timeline?: string;
  company?: string;
  industry?: string;
  teamSize?: string;
  role?: string;
  urgency?: 'low' | 'medium' | 'high';
  contactMethod?: 'email' | 'phone' | 'meeting';
}

export interface IntentClassificationMetadata {
  model: string;
  processingTimeMs: number;
  alternativeIntents: Array<{
    intent: IntentType;
    confidence: number;
  }>;
}

export class IntentResult {
  private constructor(
    private readonly _intent: IntentType,
    private readonly _confidence: number,
    private readonly _entities: ExtractedEntities,
    private readonly _reasoning: string,
    private readonly _metadata: IntentClassificationMetadata
  ) {}

  static create(
    intent: IntentType,
    confidence: number,
    entities: ExtractedEntities = {},
    reasoning: string = '',
    metadata: IntentClassificationMetadata
  ): IntentResult {
    // Validate confidence score
    if (confidence < 0 || confidence > 1) {
      throw new Error('Confidence must be between 0 and 1');
    }

    return new IntentResult(intent, confidence, entities, reasoning, metadata);
  }

  /**
   * Create a low-confidence unknown intent result
   */
  static createUnknown(reasoning: string = 'Unable to classify intent'): IntentResult {
    return new IntentResult(
      'unknown',
      0.1,
      {},
      reasoning,
      {
        model: 'fallback',
        processingTimeMs: 0,
        alternativeIntents: []
      }
    );
  }

  get intent(): IntentType {
    return this._intent;
  }

  get confidence(): number {
    return this._confidence;
  }

  get entities(): ExtractedEntities {
    return { ...this._entities };
  }

  get reasoning(): string {
    return this._reasoning;
  }

  get metadata(): IntentClassificationMetadata {
    return { ...this._metadata };
  }

  /**
   * Check if this intent indicates sales interest
   */
  isSalesIntent(): boolean {
    const salesIntents: IntentType[] = [
      'sales_inquiry',
      'booking_request', 
      'demo_request',
      'qualification',
      'closing'
    ];
    return salesIntents.includes(this._intent);
  }

  /**
   * Check if this intent indicates support need
   */
  isSupportIntent(): boolean {
    const supportIntents: IntentType[] = [
      'support_request',
      'faq_general',
      'faq_pricing',
      'faq_features'
    ];
    return supportIntents.includes(this._intent);
  }

  /**
   * Check if confidence is high enough to act on
   */
  isHighConfidence(threshold: number = 0.7): boolean {
    return this._confidence >= threshold;
  }

  /**
   * Get intent category for routing
   */
  getCategory(): 'sales' | 'support' | 'general' | 'unknown' {
    if (this.isSalesIntent()) return 'sales';
    if (this.isSupportIntent()) return 'support';
    if (this._intent === 'greeting') return 'general';
    return 'unknown';
  }

  /**
   * Check if entities suggest qualified lead
   */
  hasQualifyingEntities(): boolean {
    const { budget, timeline, company, teamSize } = this._entities;
    return !!(budget || timeline || company || teamSize);
  }

  /**
   * Get urgency level from entities or intent
   */
  getUrgencyLevel(): 'low' | 'medium' | 'high' {
    // Explicit urgency from entities
    if (this._entities.urgency) {
      return this._entities.urgency;
    }

    // Infer from intent type
    if (this._intent === 'closing' || this._intent === 'demo_request') {
      return 'high';
    }

    if (this._intent === 'sales_inquiry' || this._intent === 'booking_request') {
      return 'medium';
    }

    return 'low';
  }

  /**
   * Convert to plain object for serialization
   */
  toPlainObject() {
    return {
      intent: this._intent,
      confidence: this._confidence,
      entities: this._entities,
      reasoning: this._reasoning,
      metadata: this._metadata,
      category: this.getCategory(),
      urgencyLevel: this.getUrgencyLevel(),
      isSalesIntent: this.isSalesIntent(),
      hasQualifyingEntities: this.hasQualifyingEntities()
    };
  }
} 