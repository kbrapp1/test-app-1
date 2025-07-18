import { SessionContext } from '../../value-objects/session-management/ChatSessionTypes';
// import { IntentType } from '../../value-objects/message-processing/IntentResult';

/**
 * Intent Persistence Service - 2025 Context Memory Implementation
 * 
 * AI INSTRUCTIONS:
 * - Tracks intent classification results across conversation turns
 * - Maintains business context flags for smart prompt injection
 * - Prevents context loss between casual and business interactions
 * - Follows @golden-rule.mdc DDD patterns for domain services
 */
export class IntentPersistenceService {

  /** Update session with new intent data and maintain context flags */
  static updateIntentHistory(
    sessionContext: SessionContext,
    intentData: unknown,
    messageId: string,
    turnNumber: number
  ): SessionContext {
    const currentIntentHistory: NonNullable<SessionContext['intentHistory']> = sessionContext.intentHistory || this.createInitialIntentHistory();
    
    // Add new intent to sequence
    const intent = intentData as { primary?: string; confidence?: number } | null | undefined;
    const newIntentEntry = {
      turn: turnNumber,
      intent: intent?.primary || 'unknown',
      confidence: intent?.confidence || 0,
      timestamp: new Date().toISOString(),
      messageId: messageId
    };

    const updatedSequence = [
      ...currentIntentHistory.intentSequence,
      newIntentEntry
    ].slice(-15); // Keep last 15 intents for enhanced business context (2025 optimization)

    // Update business context flags based on new intent
    const updatedContextFlags = this.updateContextFlags(
      currentIntentHistory.contextFlags,
      intentData,
      turnNumber
    );

    // Determine business context establishment
    const businessContextEstablished = this.determineBusinessContextStatus(
      intentData,
      updatedContextFlags,
      currentIntentHistory.businessContextEstablished
    );

    // Determine conversation mode
    const conversationMode = this.determineConversationMode(
      intentData,
      updatedContextFlags,
      businessContextEstablished
    );

    return {
      ...sessionContext,
      intentHistory: {
        businessContextEstablished,
        lastBusinessIntent: this.isBusinessIntent(intentData) ? (intent?.primary || '') : currentIntentHistory.lastBusinessIntent,
        lastBusinessTurn: this.isBusinessIntent(intentData) ? turnNumber : currentIntentHistory.lastBusinessTurn,
        currentConversationMode: conversationMode,
        intentSequence: updatedSequence,
        contextFlags: updatedContextFlags
      }
    };
  }

  /** Check if knowledge base should be injected based on intent history */
  static shouldInjectKnowledgeBase(sessionContext: SessionContext): boolean {
    const intentHistory = sessionContext.intentHistory;
    
    if (!intentHistory) {
      return false;
    }

    // Always inject if business context was established and hasn't expired
    if (intentHistory.businessContextEstablished) {
      const turnsSinceLastBusiness = this.getTurnsSinceLastBusiness(intentHistory);
      // Keep business context for 5 turns after last business question
      return turnsSinceLastBusiness <= 5;
    }

    // Check if current conversation mode needs knowledge base
    return intentHistory.currentConversationMode === 'business' || 
           intentHistory.currentConversationMode === 'qualification';
  }

  /** Get business context strength for prompt weighting */
  static getBusinessContextStrength(sessionContext: SessionContext): number {
    const intentHistory = sessionContext.intentHistory;
    
    if (!intentHistory?.businessContextEstablished) {
      return 0;
    }

    const turnsSince = this.getTurnsSinceLastBusiness(intentHistory);
    const businessIntentCount = this.getBusinessIntentCount(intentHistory);
    
    // Decay strength over time but maintain baseline if multiple business intents
    let strength = Math.max(0.3, 1.0 - (turnsSince * 0.15));
    
    // Boost for multiple business interactions
    if (businessIntentCount >= 2) {
      strength = Math.min(1.0, strength + 0.2);
    }
    
    return strength;
  }

  /** Create initial intent history structure */
  private static createInitialIntentHistory(): NonNullable<SessionContext['intentHistory']> {
    return {
      businessContextEstablished: false,
      lastBusinessIntent: '',
      lastBusinessTurn: 0,
      currentConversationMode: 'greeting' as const,
      intentSequence: [],
      contextFlags: {
        productInterestEstablished: false,
        pricingDiscussed: false,
        comparisonMode: false,
        companyInquiryMade: false,
        knowledgeBaseNeeded: false,
        lastBusinessQuestionTurn: 0
      }
    };
  }

  /** Update context flags based on new intent */
  private static updateContextFlags(
    currentFlags: NonNullable<SessionContext['intentHistory']>['contextFlags'], 
    intentData: unknown, 
    turnNumber: number
  ): NonNullable<SessionContext['intentHistory']>['contextFlags'] {
    const intent = intentData as { primary?: string } | null | undefined;
    
    // Start with current flags or defaults
    const newFlags: NonNullable<SessionContext['intentHistory']>['contextFlags'] = {
      productInterestEstablished: currentFlags.productInterestEstablished,
      pricingDiscussed: currentFlags.pricingDiscussed,
      comparisonMode: currentFlags.comparisonMode,
      companyInquiryMade: currentFlags.companyInquiryMade,
      knowledgeBaseNeeded: currentFlags.knowledgeBaseNeeded,
      lastBusinessQuestionTurn: currentFlags.lastBusinessQuestionTurn
    };

    if (intent?.primary === 'product_inquiry' || intent?.primary === 'feature_inquiry') {
      newFlags.productInterestEstablished = true;
      newFlags.knowledgeBaseNeeded = true;
    }

    if (intent?.primary === 'pricing_inquiry' || intent?.primary === 'cost_inquiry') {
      newFlags.pricingDiscussed = true;
      newFlags.knowledgeBaseNeeded = true;
    }

    if (intent?.primary === 'comparison_inquiry' || intent?.primary === 'competitor_inquiry') {
      newFlags.comparisonMode = true;
      newFlags.knowledgeBaseNeeded = true;
    }

    if (intent?.primary === 'company_inquiry' || intent?.primary === 'business_inquiry') {
      newFlags.companyInquiryMade = true;
      newFlags.knowledgeBaseNeeded = true;
      newFlags.lastBusinessQuestionTurn = turnNumber;
    }

    return newFlags;
  }

  /** Determine if business context should be established */
  private static determineBusinessContextStatus(
    intentData: unknown, 
    contextFlags: NonNullable<SessionContext['intentHistory']>['contextFlags'], 
    currentStatus: boolean
  ): boolean {
    // Once established, maintain unless explicitly cleared
    if (currentStatus) return true;

    // Establish on business intents
    return this.isBusinessIntent(intentData) || 
           contextFlags.productInterestEstablished ||
           contextFlags.companyInquiryMade;
  }

  /** Determine current conversation mode */
  private static determineConversationMode(
    intentData: unknown,
    contextFlags: NonNullable<SessionContext['intentHistory']>['contextFlags'],
    businessContextEstablished: boolean
  ): 'greeting' | 'business' | 'casual' | 'qualification' {
    if (this.isBusinessIntent(intentData)) {
      return 'business';
    }

    if (businessContextEstablished && (contextFlags.productInterestEstablished || contextFlags.pricingDiscussed)) {
      return 'qualification';
    }

    const intent = intentData as { primary?: string } | null | undefined;
    if (intent?.primary === 'greeting') {
      return businessContextEstablished ? 'casual' : 'greeting';
    }

    return businessContextEstablished ? 'casual' : 'greeting';
  }

  /** Check if intent is business-related */
  private static isBusinessIntent(intentData: unknown): boolean {
    const businessIntents: string[] = [
      'company_inquiry',
      'business_inquiry', 
      'product_inquiry',
      'feature_inquiry',
      'pricing_inquiry',
      'cost_inquiry',
      'comparison_inquiry',
      'competitor_inquiry',
      'faq_general'
    ];

    const intent = intentData as { primary?: string } | null | undefined;
    return businessIntents.includes(intent?.primary || '');
  }

  /** Get turns since last business intent */
  private static getTurnsSinceLastBusiness(intentHistory: NonNullable<SessionContext['intentHistory']>): number {
    const lastSequenceEntry = intentHistory.intentSequence[intentHistory.intentSequence.length - 1];
    const currentTurn = lastSequenceEntry?.turn || 0;
    return currentTurn - intentHistory.lastBusinessTurn;
  }

  /** Count business intents in history */
  private static getBusinessIntentCount(intentHistory: NonNullable<SessionContext['intentHistory']>): number {
    return intentHistory.intentSequence.filter(entry => 
      this.isBusinessIntent({ primary: entry.intent })
    ).length;
  }
}