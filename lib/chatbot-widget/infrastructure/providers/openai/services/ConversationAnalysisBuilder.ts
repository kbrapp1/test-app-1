import { ChatMessage } from '../../../../domain/entities/ChatMessage';

/**
 * Conversation Analysis Builder Service
 * 
 * AI INSTRUCTIONS:
 * - Build conversation context analysis for OpenAI prompts
 * - Maintain single responsibility for conversation analysis
 * - Keep business logic pure, no external dependencies
 * - Follow @golden-rule patterns exactly
 * - Delegate complex analysis to separate methods
 * - Under 250 lines following DDD patterns
 */
export class ConversationAnalysisBuilder {

  /**
   * Build comprehensive conversation context analysis
   */
  static buildConversationContextAnalysis(conversationHistory: ChatMessage[]): string {
    const recentIntents = this.extractRecentIntents(conversationHistory);
    const sentimentProgression = this.extractSentimentProgression(conversationHistory);
    const engagementEvolution = this.extractEngagementEvolution(conversationHistory);
    const qualificationState = this.assessQualificationProgression(conversationHistory);

    return `

## Current Conversation Intelligence

**Conversation Analytics:**
- Message Count: ${conversationHistory.length} (${conversationHistory.filter(m => m.messageType === 'user').length} user messages)
- Intent Progression: ${recentIntents.join(' → ')}
- Sentiment Evolution: ${sentimentProgression.join(' → ')}
- Engagement Trajectory: ${engagementEvolution.join(' → ')}
- Qualification State: ${qualificationState}

**Conversation Momentum Indicators:**
${this.buildMomentumIndicators(conversationHistory)}

**Strategic Context:**
- User has ${this.calculateInvestmentLevel(conversationHistory)} investment in this conversation
- Conversation shows ${this.assessProgressionQuality(conversationHistory)} progression quality
- ${this.identifyOptimalNextAction(conversationHistory)}

**Behavioral Patterns:**
${this.extractBehavioralPatterns(conversationHistory).map(pattern => `- ${pattern}`).join('\n')}`;
  }

  /**
   * Extract recent intents with sophisticated pattern recognition
   */
  private static extractRecentIntents(conversationHistory: ChatMessage[]): string[] {
    return conversationHistory
      .filter(m => m.messageType === 'user')
      .slice(-8) // 2025 optimization: Increased from 5 to 8 for better intent tracking
      .map(m => this.inferIntentFromMessage(m.content));
  }

  /**
   * Extract sentiment progression with emotional intelligence
   */
  private static extractSentimentProgression(conversationHistory: ChatMessage[]): string[] {
    return conversationHistory
      .filter(m => m.messageType === 'user')
      .slice(-3)
      .map(m => {
        const sentiment = m.contextMetadata?.sentiment || this.inferSentiment(m.content);
        return sentiment || 'neutral';
      });
  }

  /**
   * Extract engagement evolution patterns
   */
  private static extractEngagementEvolution(conversationHistory: ChatMessage[]): string[] {
    return conversationHistory
      .filter(m => m.messageType === 'user')
      .slice(-3)
      .map(m => this.assessEngagementLevel(m.content));
  }

  /**
   * Assess qualification progression state
   */
  private static assessQualificationProgression(conversationHistory: ChatMessage[]): string {
    const userMessages = conversationHistory.filter(m => m.messageType === 'user');
    
    const hasBusinessContext = userMessages.some(m => 
      /company|business|organization|team|department/i.test(m.content)
    );
    
    const hasAuthorityIndicators = userMessages.some(m =>
      /manager|director|vp|ceo|decision|budget|approve|purchase/i.test(m.content)
    );
    
    const hasBudgetDiscussion = userMessages.some(m =>
      /budget|cost|price|investment|spend|afford/i.test(m.content)
    );
    
    const hasTimelineIndicators = userMessages.some(m =>
      /asap|urgent|timeline|deadline|soon|immediately|need by/i.test(m.content)
    );

    if (hasBusinessContext && hasAuthorityIndicators && hasBudgetDiscussion && hasTimelineIndicators) {
      return 'Fully Qualified';
    } else if (hasBusinessContext && (hasAuthorityIndicators || hasBudgetDiscussion)) {
      return 'Partially Qualified';
    } else if (hasBusinessContext) {
      return 'Initial Context Gathered';
    } else {
      return 'Discovery Phase';
    }
  }

  /**
   * Build momentum indicators analysis
   */
  private static buildMomentumIndicators(conversationHistory: ChatMessage[]): string {
    const userMessages = conversationHistory.filter(m => m.messageType === 'user');
    
    const indicators = [];
    
    if (userMessages.length > 3) {
      indicators.push('Extended engagement shows genuine interest');
    }
    
    const recentMessages = userMessages.slice(-2);
    const avgLength = recentMessages.reduce((sum, m) => sum + m.content.length, 0) / recentMessages.length;
    
    if (avgLength > 100) {
      indicators.push('Detailed responses indicate high engagement');
    }
    
    const hasQuestions = recentMessages.some(m => m.content.includes('?'));
    if (hasQuestions) {
      indicators.push('Active questioning shows information-seeking behavior');
    }
    
    const hasBusinessTerms = recentMessages.some(m => 
      /solution|implement|integrate|team|company|business|organization/i.test(m.content)
    );
    if (hasBusinessTerms) {
      indicators.push('Business-focused language indicates decision-making context');
    }
    
    return indicators.length > 0 ? indicators.map(i => `- ${i}`).join('\n') : '- Building initial engagement';
  }

  /**
   * Calculate investment level in conversation
   */
  private static calculateInvestmentLevel(conversationHistory: ChatMessage[]): string {
    const userMessages = conversationHistory.filter(m => m.messageType === 'user');
    const totalLength = userMessages.reduce((sum, m) => sum + m.content.length, 0);
    const avgLength = totalLength / userMessages.length;
    
    if (userMessages.length >= 5 && avgLength > 80) {
      return 'high';
    } else if (userMessages.length >= 3 && avgLength > 50) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  /**
   * Assess conversation progression quality
   */
  private static assessProgressionQuality(conversationHistory: ChatMessage[]): string {
    const userMessages = conversationHistory.filter(m => m.messageType === 'user');
    
    const hasProgression = userMessages.length > 1;
    const increasingDetail = userMessages.length > 2 && 
      userMessages[userMessages.length - 1].content.length > userMessages[0].content.length;
    
    if (hasProgression && increasingDetail) {
      return 'positive';
    } else if (hasProgression) {
      return 'steady';
    } else {
      return 'early';
    }
  }

  /**
   * Identify optimal next action
   */
  private static identifyOptimalNextAction(conversationHistory: ChatMessage[]): string {
    const qualificationState = this.assessQualificationProgression(conversationHistory);
    const engagementLevel = this.calculateInvestmentLevel(conversationHistory);
    
    if (qualificationState === 'Fully Qualified' && engagementLevel === 'high') {
      return 'Prime opportunity for contact capture or demo scheduling';
    } else if (qualificationState === 'Partially Qualified') {
      return 'Continue qualification while providing value';
    } else if (engagementLevel === 'high') {
      return 'Build on high engagement to gather business context';
    } else {
      return 'Focus on value delivery and engagement building';
    }
  }

  /**
   * Extract behavioral patterns
   */
  private static extractBehavioralPatterns(conversationHistory: ChatMessage[]): string[] {
    const patterns = [];
    const userMessages = conversationHistory.filter(m => m.messageType === 'user');
    
    if (userMessages.some(m => /how much|cost|price|budget/i.test(m.content))) {
      patterns.push('Price-conscious: Shows budget awareness and cost consideration');
    }
    
    if (userMessages.some(m => /demo|show me|see it|example/i.test(m.content))) {
      patterns.push('Visual learner: Prefers demonstrations and concrete examples');
    }
    
    if (userMessages.some(m => /integrate|api|technical|system/i.test(m.content))) {
      patterns.push('Technical focus: Interested in implementation and integration details');
    }
    
    if (userMessages.some(m => /team|company|organization|we/i.test(m.content))) {
      patterns.push('Organizational buyer: Considers team and company-wide impact');
    }
    
    if (userMessages.some(m => /urgent|asap|quickly|soon/i.test(m.content))) {
      patterns.push('Urgency-driven: Has time-sensitive requirements');
    }
    
    return patterns.length > 0 ? patterns : ['Standard information-seeking behavior'];
  }

  /**
   * Infer intent from message content using advanced pattern recognition
   */
  private static inferIntentFromMessage(content: string): string {
    const lowerContent = content.toLowerCase();
    
    if (/hello|hi|hey|good morning|good afternoon/i.test(content)) return 'greeting';
    if (/price|cost|budget|how much/i.test(content)) return 'faq_pricing';
    if (/demo|demonstration|show me|see it/i.test(content)) return 'demo_request';
    if (/meeting|schedule|book|call|appointment/i.test(content)) return 'booking_request';
    if (/feature|capability|function|how does/i.test(content)) return 'faq_features';
    if (/buy|purchase|get started|sign up/i.test(content)) return 'sales_inquiry';
    if (/help|support|problem|issue|trouble/i.test(content)) return 'support_request';
    if (/company|business|team|organization/i.test(content)) return 'qualification';
    if (/concern|worry|but|however|what if/i.test(content)) return 'objection_handling';
    
    return 'discovery';
  }

  /**
   * Infer sentiment from message content
   */
  private static inferSentiment(content: string): string {
    const positiveWords = /great|excellent|love|amazing|perfect|awesome|fantastic/i;
    const negativeWords = /problem|issue|concern|worry|frustrated|difficult|bad/i;
    
    if (positiveWords.test(content)) return 'positive';
    if (negativeWords.test(content)) return 'negative';
    return 'neutral';
  }

  /**
   * Assess engagement level from message content
   */
  private static assessEngagementLevel(content: string): string {
    if (content.length > 100 && content.includes('?')) return 'high';
    if (content.length > 50) return 'medium';
    return 'low';
  }
} 