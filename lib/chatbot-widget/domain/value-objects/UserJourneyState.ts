import { IntentResult } from './IntentResult';

export type JourneyStage = 
  | 'visitor'        // Just arrived, browsing
  | 'curious'        // Asking questions, exploring
  | 'interested'     // Showing buying signals
  | 'evaluating'     // Comparing options, asking detailed questions
  | 'ready_to_buy'   // Strong purchase intent, asking about next steps
  | 'qualified_lead' // Provided contact info, ready for sales
  | 'lost'           // Disengaged or explicitly not interested
  | 'converted';     // Successfully converted to customer

export interface JourneyTransitionTrigger {
  type: 'intent' | 'engagement' | 'time' | 'explicit';
  value: string | number;
  confidence: number;
}

export interface JourneyStateMetadata {
  enteredAt: Date;
  lastUpdatedAt: Date;
  transitionTriggers: JourneyTransitionTrigger[];
  engagementScore: number;
  interactionCount: number;
}

export class UserJourneyState {
  private constructor(
    private readonly _stage: JourneyStage,
    private readonly _confidence: number,
    private readonly _metadata: JourneyStateMetadata
  ) {}

  static create(
    stage: JourneyStage = 'visitor',
    confidence: number = 1.0,
    metadata?: Partial<JourneyStateMetadata>
  ): UserJourneyState {
    const now = new Date();
    const defaultMetadata: JourneyStateMetadata = {
      enteredAt: now,
      lastUpdatedAt: now,
      transitionTriggers: [],
      engagementScore: 0,
      interactionCount: 0,
      ...metadata
    };

    return new UserJourneyState(stage, confidence, defaultMetadata);
  }

  get stage(): JourneyStage {
    return this._stage;
  }

  get confidence(): number {
    return this._confidence;
  }

  get metadata(): JourneyStateMetadata {
    return { ...this._metadata };
  }

  /**
   * Determine if user should transition to a new stage based on intent
   */
  shouldTransitionBasedOnIntent(intentResult: IntentResult): {
    shouldTransition: boolean;
    newStage?: JourneyStage;
    confidence: number;
    reasoning: string;
  } {
    const currentStage = this._stage;
    const intent = intentResult.intent;
    const intentConfidence = intentResult.confidence;

    // Define transition rules
    const transitionRules = this.getTransitionRules();
    
    for (const rule of transitionRules) {
      if (rule.fromStage === currentStage && rule.triggers.includes(intent)) {
        const confidence = Math.min(intentConfidence, rule.confidence);
        
        if (confidence >= rule.minConfidence) {
          return {
            shouldTransition: true,
            newStage: rule.toStage,
            confidence,
            reasoning: rule.reasoning
          };
        }
      }
    }

    return {
      shouldTransition: false,
      confidence: 0,
      reasoning: 'No transition rules matched current state and intent'
    };
  }

  /**
   * Create new state with transition
   */
  transitionTo(
    newStage: JourneyStage,
    trigger: JourneyTransitionTrigger,
    newEngagementScore?: number
  ): UserJourneyState {
    const updatedMetadata: JourneyStateMetadata = {
      ...this._metadata,
      lastUpdatedAt: new Date(),
      transitionTriggers: [...this._metadata.transitionTriggers, trigger],
      engagementScore: newEngagementScore ?? this._metadata.engagementScore,
      interactionCount: this._metadata.interactionCount + 1
    };

    return new UserJourneyState(newStage, trigger.confidence, updatedMetadata);
  }

  /**
   * Update engagement score without changing stage
   */
  updateEngagement(newScore: number): UserJourneyState {
    const updatedMetadata: JourneyStateMetadata = {
      ...this._metadata,
      lastUpdatedAt: new Date(),
      engagementScore: newScore,
      interactionCount: this._metadata.interactionCount + 1
    };

    return new UserJourneyState(this._stage, this._confidence, updatedMetadata);
  }

  /**
   * Check if user is in a sales-ready stage
   */
  isSalesReady(): boolean {
    const salesReadyStages: JourneyStage[] = ['ready_to_buy', 'qualified_lead'];
    return salesReadyStages.includes(this._stage);
  }

  /**
   * Check if user is actively engaged
   */
  isActivelyEngaged(): boolean {
    const activeStages: JourneyStage[] = ['curious', 'interested', 'evaluating', 'ready_to_buy'];
    return activeStages.includes(this._stage) && this._metadata.engagementScore > 30;
  }

  /**
   * Get recommended next actions based on current stage
   */
  getRecommendedActions(): string[] {
    const actionMap: Record<JourneyStage, string[]> = {
      visitor: ['Provide helpful information', 'Ask qualifying questions'],
      curious: ['Answer questions thoroughly', 'Suggest relevant resources'],
      interested: ['Provide detailed information', 'Offer demo or consultation'],
      evaluating: ['Address specific concerns', 'Provide comparisons', 'Offer trial'],
      ready_to_buy: ['Discuss pricing', 'Schedule demo', 'Connect with sales'],
      qualified_lead: ['Schedule sales call', 'Send proposal', 'Follow up'],
      lost: ['Re-engagement campaign', 'Provide value content'],
      converted: ['Onboarding', 'Success follow-up']
    };

    return actionMap[this._stage] || [];
  }

  /**
   * Get time spent in current stage
   */
  getTimeInCurrentStage(): number {
    return Date.now() - this._metadata.enteredAt.getTime();
  }

  /**
   * Check if user has been in stage too long (potential stagnation)
   */
  isStagnant(maxTimeInStageMs: number = 24 * 60 * 60 * 1000): boolean { // 24 hours default
    return this.getTimeInCurrentStage() > maxTimeInStageMs;
  }

  /**
   * Define transition rules between stages
   */
  private getTransitionRules() {
    return [
      // From visitor
      {
        fromStage: 'visitor' as JourneyStage,
        toStage: 'curious' as JourneyStage,
        triggers: ['faq_general', 'faq_pricing', 'faq_features'],
        confidence: 0.8,
        minConfidence: 0.6,
        reasoning: 'User asking questions shows curiosity'
      },
      {
        fromStage: 'visitor' as JourneyStage,
        toStage: 'interested' as JourneyStage,
        triggers: ['sales_inquiry', 'demo_request'],
        confidence: 0.9,
        minConfidence: 0.7,
        reasoning: 'Direct sales inquiry shows interest'
      },

      // From curious
      {
        fromStage: 'curious' as JourneyStage,
        toStage: 'interested' as JourneyStage,
        triggers: ['sales_inquiry', 'demo_request', 'booking_request'],
        confidence: 0.85,
        minConfidence: 0.6,
        reasoning: 'Moving from questions to action shows interest'
      },

      // From interested
      {
        fromStage: 'interested' as JourneyStage,
        toStage: 'evaluating' as JourneyStage,
        triggers: ['faq_pricing', 'qualification', 'objection_handling'],
        confidence: 0.8,
        minConfidence: 0.6,
        reasoning: 'Detailed questions show evaluation phase'
      },
      {
        fromStage: 'interested' as JourneyStage,
        toStage: 'ready_to_buy' as JourneyStage,
        triggers: ['closing', 'booking_request'],
        confidence: 0.9,
        minConfidence: 0.7,
        reasoning: 'Strong buying signals detected'
      },

      // From evaluating
      {
        fromStage: 'evaluating' as JourneyStage,
        toStage: 'ready_to_buy' as JourneyStage,
        triggers: ['closing', 'demo_request', 'booking_request'],
        confidence: 0.85,
        minConfidence: 0.6,
        reasoning: 'Ready to move forward with purchase'
      },

      // From ready_to_buy
      {
        fromStage: 'ready_to_buy' as JourneyStage,
        toStage: 'qualified_lead' as JourneyStage,
        triggers: ['qualification', 'booking_request'],
        confidence: 0.9,
        minConfidence: 0.7,
        reasoning: 'Providing qualification information'
      }
    ];
  }

  /**
   * Convert to plain object for serialization
   */
  toPlainObject() {
    return {
      stage: this._stage,
      confidence: this._confidence,
      metadata: this._metadata,
      isSalesReady: this.isSalesReady(),
      isActivelyEngaged: this.isActivelyEngaged(),
      recommendedActions: this.getRecommendedActions(),
      timeInCurrentStage: this.getTimeInCurrentStage(),
      isStagnant: this.isStagnant()
    };
  }
} 