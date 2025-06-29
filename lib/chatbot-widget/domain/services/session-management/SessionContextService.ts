import { SessionContext, PageView, ContactInfo } from '../../value-objects/session-management/ChatSessionTypes';

/**
 * Session Context Service
 * 
 * AI INSTRUCTIONS:
 * - Domain Service: Pure business logic for managing session context data
 * - Following @golden-rule DDD principles: Single responsibility for context management
 * - All utility functions inlined following pure function patterns
 * - No external service dependencies, maintaining domain layer purity
 */
export class SessionContextService {
  
  /**
   * Add page view to context
   * AI INSTRUCTIONS: Inline page view creation following @golden-rule immutability patterns
   */
  static addPageView(
    context: SessionContext,
    url: string,
    title: string,
    timeOnPage: number = 0
  ): SessionContext {
    // Inline PageView creation - pure value object pattern
    const pageView: PageView = {
      url,
      title,
      timestamp: new Date(),
      timeOnPage
    };
    
    return {
      ...context,
      pageViews: [...context.pageViews, pageView]
    };
  }

  /**
   * Update conversation summary with enhanced format
   * AI INSTRUCTIONS: Use enhanced object format only, following @golden-rule patterns
   */
  static updateConversationSummary(
    context: SessionContext, 
    fullSummary: string,
    phaseSummaries?: Array<{
      phase: string;
      summary: string;
      keyOutcomes: string[];
      entitiesExtracted: string[];
      timeframe: { start: Date; end: Date };
    }>,
    criticalMoments?: Array<{
      messageId: string;
      importance: 'high' | 'critical';
      context: string;
      preserveInContext: boolean;
    }>
  ): SessionContext {
    return {
      ...context,
      conversationSummary: {
        fullSummary,
        phaseSummaries,
        criticalMoments
      }
    };
  }

  /**
   * Add topic to context
   * AI INSTRUCTIONS: Inline topic existence check following @golden-rule pure function pattern
   */
  static addTopic(context: SessionContext, topic: string): SessionContext {
    // Inline topic existence check - simple array includes
    if (context.topics.includes(topic)) {
      return context;
    }

    return {
      ...context,
      topics: [...context.topics, topic]
    };
  }

  /**
   * Add interest to context
   * AI INSTRUCTIONS: Inline interest existence check following @golden-rule pure function pattern
   */
  static addInterest(context: SessionContext, interest: string): SessionContext {
    // Inline interest existence check - simple array includes
    if (context.interests.includes(interest)) {
      return context;
    }

    return {
      ...context,
      interests: [...context.interests, interest]
    };
  }

  /**
   * Update engagement score
   * AI INSTRUCTIONS: Inline score clamping following @golden-rule value object validation pattern
   */
  static updateEngagementScore(context: SessionContext, score: number): SessionContext {
    // Inline engagement score clamping - ensures valid range 0-100
    const clampedScore = Math.max(0, Math.min(100, score));
    
    return {
      ...context,
      engagementScore: clampedScore
    };
  }

  /**
   * Update journey state
   */
  static updateJourneyState(
    context: SessionContext,
    stage: string,
    confidence: number,
    metadata: any = {}
  ): SessionContext {
    return {
      ...context,
      journeyState: {
        stage,
        confidence,
        metadata
      }
    };
  }

  /**
   * Increment previous visits count
   */
  static incrementPreviousVisits(context: SessionContext): SessionContext {
    return {
      ...context,
      previousVisits: context.previousVisits + 1
    };
  }

  /**
   * Get latest page view
   */
  static getLatestPageView(context: SessionContext): PageView | undefined {
    return context.pageViews[context.pageViews.length - 1];
  }

  /**
   * Get total time on site
   */
  static getTotalTimeOnSite(context: SessionContext): number {
    return context.pageViews.reduce((total, pageView) => total + pageView.timeOnPage, 0);
  }

  /**
   * Check if context has contact information - MODERN: Check accumulated entities
   */
  static hasContactInfo(context: SessionContext): boolean {
    // MODERN: Check for visitor identification in accumulated entities
    return !!context.accumulatedEntities?.visitorName?.value;
  }

  /**
   * Get context summary for analytics
   */
  static getContextSummary(context: SessionContext): {
    pageViewCount: number;
    topicCount: number;
    interestCount: number;
    hasContactInfo: boolean;
    engagementLevel: 'low' | 'medium' | 'high';
  } {
    return {
      pageViewCount: context.pageViews.length,
      topicCount: context.topics.length,
      interestCount: context.interests.length,
      hasContactInfo: this.hasContactInfo(context),
      engagementLevel: context.engagementScore >= 70 ? 'high' : 
                      context.engagementScore >= 40 ? 'medium' : 'low'
    };
  }

  /**
   * Merge new context data with existing context
   * AI INSTRUCTIONS:
   * - Pure function following @golden-rule immutability
   * - Complete replacement for accumulated entities when provided
   * - Always return new object, never mutate input
   * - Simplified logic following @golden-rule patterns
   */
  static mergeContextData(
    existingContext: SessionContext, 
    newContextData: Partial<SessionContext>
  ): SessionContext {
    return {
      ...existingContext,
      ...newContextData,
      // Ensure accumulated entities are completely replaced when provided
      // (EntityAccumulationService provides complete entity state)
      accumulatedEntities: newContextData.accumulatedEntities || existingContext.accumulatedEntities,
    };
  }
} 