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
   * Update conversation summary
   */
  static updateConversationSummary(context: SessionContext, summary: string): SessionContext {
    return {
      ...context,
      conversationSummary: summary
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
   * Update contact information
   */
  static updateContactInfo(context: SessionContext, contactInfo: ContactInfo): SessionContext {
    return {
      ...context,
      email: contactInfo.email || context.email,
      phone: contactInfo.phone || context.phone,
      visitorName: contactInfo.name || context.visitorName,
      company: contactInfo.company || context.company
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
   * Check if context has contact information
   */
  static hasContactInfo(context: SessionContext): boolean {
    return !!(context.email || context.phone);
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
   * - Deep merge for nested objects like accumulatedEntities
   * - Preserve array integrity for pageViews, topics, interests
   * - Always return new object, never mutate input
   */
  static mergeContextData(
    existingContext: SessionContext, 
    newContextData: Partial<SessionContext>
  ): SessionContext {
    // Handle accumulated entities deep merge
    let mergedAccumulatedEntities = existingContext.accumulatedEntities;
    
    if (newContextData.accumulatedEntities) {
      mergedAccumulatedEntities = {
        // Merge arrays (new values replace old)
        decisionMakers: newContextData.accumulatedEntities.decisionMakers || existingContext.accumulatedEntities?.decisionMakers || [],
        painPoints: newContextData.accumulatedEntities.painPoints || existingContext.accumulatedEntities?.painPoints || [],
        integrationNeeds: newContextData.accumulatedEntities.integrationNeeds || existingContext.accumulatedEntities?.integrationNeeds || [],
        evaluationCriteria: newContextData.accumulatedEntities.evaluationCriteria || existingContext.accumulatedEntities?.evaluationCriteria || [],
        
        // Merge single-value entities (confidence-based updates)
        budget: newContextData.accumulatedEntities.budget || existingContext.accumulatedEntities?.budget,
        timeline: newContextData.accumulatedEntities.timeline || existingContext.accumulatedEntities?.timeline,
        urgency: newContextData.accumulatedEntities.urgency || existingContext.accumulatedEntities?.urgency,
        contactMethod: newContextData.accumulatedEntities.contactMethod || existingContext.accumulatedEntities?.contactMethod,
        role: newContextData.accumulatedEntities.role || existingContext.accumulatedEntities?.role,
        industry: newContextData.accumulatedEntities.industry || existingContext.accumulatedEntities?.industry,
        company: newContextData.accumulatedEntities.company || existingContext.accumulatedEntities?.company,
        teamSize: newContextData.accumulatedEntities.teamSize || existingContext.accumulatedEntities?.teamSize,
        
        // Merge metadata
        lastEntityUpdate: newContextData.accumulatedEntities.lastEntityUpdate || existingContext.accumulatedEntities?.lastEntityUpdate,
        entityMetadata: newContextData.accumulatedEntities.entityMetadata || existingContext.accumulatedEntities?.entityMetadata,
      };
    }

    return {
      ...existingContext,
      ...newContextData,
      // Handle special array fields that should be preserved/merged correctly
      pageViews: newContextData.pageViews || existingContext.pageViews,
      topics: newContextData.topics || existingContext.topics,
      interests: newContextData.interests || existingContext.interests,
      // Deep merge accumulated entities
      accumulatedEntities: mergedAccumulatedEntities,
    };
  }
} 