/**
 * Context Relevance Scoring Domain Service
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Score message relevance for intelligent context prioritization
 * - Pure domain service - no external dependencies except interfaces
 * - Follow @golden-rule patterns exactly - under 250 lines
 * - Use domain-specific error handling with BusinessRuleViolationError
 * - Delegate complex scoring calculations to specialized methods
 * - Enable smart context window management based on relevance, not just recency
 * - Apply 2025 optimization patterns for context intelligence
 */

import { ChatMessage } from '../../entities/ChatMessage';
import { BusinessRuleViolationError } from '../../errors/BusinessRuleViolationError';
import { IntentResult } from '../../value-objects/message-processing/IntentResult';
import { CONTEXT_LIMITS_2025 } from '../../value-objects/ai-configuration/ContextLimits2025';

export interface RelevanceScore {
  messageId: string;
  overallScore: number;
  componentScores: {
    recencyScore: number;
    entityRelevanceScore: number;
    intentAlignmentScore: number;
    businessContextScore: number;
    engagementScore: number;
  };
  retentionPriority: 'critical' | 'high' | 'medium' | 'low';
  reasonsForRetention: string[];
}

export interface RelevanceContext {
  currentIntent: IntentResult;
  businessEntities: Record<string, any>;
  conversationPhase: string;
  leadScore: number;
  maxRetentionMessages: number;
}

export interface PrioritizedMessages {
  criticalMessages: ChatMessage[];
  highPriorityMessages: ChatMessage[];
  mediumPriorityMessages: ChatMessage[];
  lowPriorityMessages: ChatMessage[];
  totalRelevanceScore: number;
  retentionRecommendation: {
    shouldCompress: boolean;
    messagesToCompress: ChatMessage[];
    messagesToRetain: ChatMessage[];
  };
}

/**
 * Domain Service for intelligent message relevance scoring
 * Enables context prioritization beyond simple recency-based retention
 */
export class ContextRelevanceService {
  
  /**
   * Score message relevance for intelligent context management
   * AI INSTRUCTIONS: Main orchestration method - delegate to specialized scoring methods
   */
  static scoreMessageRelevance(
    message: ChatMessage,
    context: RelevanceContext,
    messagePosition: number,
    totalMessages: number
  ): RelevanceScore {
    this.validateRelevanceInput(message, context);
    
    // Calculate component scores using specialized methods
    const recencyScore = this.calculateRecencyScore(messagePosition, totalMessages);
    const entityRelevanceScore = this.calculateEntityRelevanceScore(message, context.businessEntities);
    const intentAlignmentScore = this.calculateIntentAlignmentScore(message, context.currentIntent);
    const businessContextScore = this.calculateBusinessContextScore(message, context.leadScore, context.conversationPhase);
    const engagementScore = this.calculateEngagementScore(message);
    
    // Weighted overall score calculation
    const overallScore = this.calculateWeightedOverallScore({
      recencyScore,
      entityRelevanceScore,
      intentAlignmentScore,
      businessContextScore,
      engagementScore
    });
    
    // Determine retention priority and reasons
    const retentionPriority = this.determineRetentionPriority(overallScore);
    const reasonsForRetention = this.generateRetentionReasons({
      recencyScore,
      entityRelevanceScore,
      intentAlignmentScore,
      businessContextScore,
      engagementScore
    });
    
    return {
      messageId: message.id,
      overallScore,
      componentScores: {
        recencyScore,
        entityRelevanceScore,
        intentAlignmentScore,
        businessContextScore,
        engagementScore
      },
      retentionPriority,
      reasonsForRetention
    };
  }
  
  /**
   * Prioritize messages based on relevance scores for context window optimization
   * AI INSTRUCTIONS: Orchestrate message prioritization and retention recommendations
   */
  static prioritizeMessages(
    messages: ChatMessage[],
    context: RelevanceContext
  ): PrioritizedMessages {
    this.validatePrioritizationInput(messages, context);
    
    // Score all messages
    const scoredMessages = messages.map((message, index) => ({
      message,
      score: this.scoreMessageRelevance(message, context, index, messages.length)
    }));
    
    // Sort by overall relevance score (descending)
    scoredMessages.sort((a, b) => b.score.overallScore - a.score.overallScore);
    
    // Categorize by priority levels
    const categorizedMessages = this.categorizeMessagesByPriority(scoredMessages);
    
    // Generate retention recommendations
    const retentionRecommendation = this.generateRetentionRecommendation(
      categorizedMessages,
      context.maxRetentionMessages
    );
    
    // Calculate total relevance score for analytics
    const totalRelevanceScore = scoredMessages.reduce(
      (sum, scored) => sum + scored.score.overallScore, 0
    ) / scoredMessages.length;
    
    return {
      criticalMessages: categorizedMessages.critical.map(s => s.message),
      highPriorityMessages: categorizedMessages.high.map(s => s.message),
      mediumPriorityMessages: categorizedMessages.medium.map(s => s.message),
      lowPriorityMessages: categorizedMessages.low.map(s => s.message),
      totalRelevanceScore,
      retentionRecommendation
    };
  }
  
  /**
   * Calculate recency score - more recent messages score higher
   * AI INSTRUCTIONS: Implement exponential decay for recency scoring
   */
  private static calculateRecencyScore(position: number, totalMessages: number): number {
    if (totalMessages <= 1) return 1.0;
    
    // Position from end (0 = most recent, totalMessages-1 = oldest)
    const positionFromEnd = totalMessages - 1 - position;
    
    // Exponential decay: recent messages get higher scores
    const decayFactor = 0.1; // Adjust for steeper/gentler decay
    const normalizedPosition = positionFromEnd / (totalMessages - 1);
    
    return Math.exp(-decayFactor * normalizedPosition * 10);
  }
  
  /**
   * Calculate entity relevance score based on business entity mentions
   * AI INSTRUCTIONS: Score based on business-critical entity presence and density
   */
  private static calculateEntityRelevanceScore(
    message: ChatMessage,
    businessEntities: Record<string, any>
  ): number {
    if (!businessEntities || Object.keys(businessEntities).length === 0) {
      return 0.1; // Base score for messages without entity context
    }
    
    const content = message.content.toLowerCase();
    let entityScore = 0;
    let entityCount = 0;
    
    // High-value business entities (weighted scoring)
    const entityWeights = {
      budget: 0.3,
      company: 0.25,
      role: 0.2,
      timeline: 0.15,
      teamSize: 0.1,
      industry: 0.1,
      urgency: 0.15,
      contactMethod: 0.05
    };
    
    Object.entries(businessEntities).forEach(([entityType, entityValue]) => {
      if (entityValue && typeof entityValue === 'string') {
        const entityString = entityValue.toLowerCase();
        if (content.includes(entityString)) {
          const weight = entityWeights[entityType as keyof typeof entityWeights] || 0.05;
          entityScore += weight;
          entityCount++;
        }
      }
    });
    
    // Bonus for multiple entity mentions
    if (entityCount > 1) {
      entityScore += 0.1 * (entityCount - 1);
    }
    
    return Math.min(1.0, entityScore);
  }
  
  /**
   * Calculate intent alignment score based on current conversation intent
   * AI INSTRUCTIONS: Score based on intent relevance and conversation flow continuity
   */
  private static calculateIntentAlignmentScore(
    message: ChatMessage,
    currentIntent: IntentResult
  ): number {
    if (!currentIntent?.intent) {
      return 0.2; // Base score when no intent context available
    }
    
    const content = message.content.toLowerCase();
    
    // Intent-specific keywords for alignment scoring
    const intentKeywords = {
      'faq_pricing': ['price', 'cost', 'pricing', 'budget', 'expensive', 'affordable'],
      'faq_features': ['feature', 'functionality', 'can it', 'does it', 'capability'],
      'demo_request': ['demo', 'show', 'see it', 'demonstration', 'preview'],
      'support_request': ['help', 'support', 'assistance', 'training'],
      'sales_inquiry': ['compare', 'vs', 'versus', 'difference', 'better'],
      'booking_request': ['trial', 'test', 'try', 'evaluate', 'pilot'],
      'qualification': ['team', 'decision', 'budget', 'timeline', 'authority']
    };
    
    const currentIntentKeywords = intentKeywords[currentIntent.intent as keyof typeof intentKeywords] || [];
    
    // Calculate keyword match score
    const matchCount = currentIntentKeywords.filter(keyword => content.includes(keyword)).length;
    const keywordScore = Math.min(1.0, matchCount * 0.2);
    
    // Bonus for high-confidence intent alignment
    const confidenceBonus = currentIntent.confidence > 0.8 ? 0.2 : 0;
    
    return Math.min(1.0, keywordScore + confidenceBonus);
  }
  
  /**
   * Calculate business context score based on lead qualification signals
   * AI INSTRUCTIONS: Score based on business value and qualification importance
   */
  private static calculateBusinessContextScore(
    message: ChatMessage,
    leadScore: number,
    conversationPhase: string
  ): number {
    const content = message.content.toLowerCase();
    let businessScore = 0;
    
    // Business signal patterns with weighted scoring
    const businessSignals = {
      budget_mention: { patterns: ['budget', 'cost', 'price', '$'], weight: 0.3 },
      authority_indication: { patterns: ['decision', 'approve', 'manager', 'director', 'ceo'], weight: 0.25 },
      timeline_urgency: { patterns: ['timeline', 'when', 'urgent', 'soon', 'deadline'], weight: 0.2 },
      pain_point: { patterns: ['problem', 'issue', 'challenge', 'difficult'], weight: 0.15 },
      solution_seeking: { patterns: ['solution', 'solve', 'help', 'improve'], weight: 0.1 },
      evaluation_intent: { patterns: ['evaluate', 'consider', 'looking at', 'compare'], weight: 0.15 }
    };
    
    // Score based on business signal presence
    Object.values(businessSignals).forEach(signal => {
      const hasSignal = signal.patterns.some(pattern => content.includes(pattern));
      if (hasSignal) {
        businessScore += signal.weight;
      }
    });
    
    // Lead score influence (higher lead scores boost message relevance)
    const leadScoreBonus = leadScore > 60 ? 0.2 : leadScore > 40 ? 0.1 : 0;
    
    // Conversation phase influence
    const phaseBonus = ['qualification', 'evaluation'].includes(conversationPhase) ? 0.15 : 0;
    
    return Math.min(1.0, businessScore + leadScoreBonus + phaseBonus);
  }
  
  /**
   * Calculate engagement score based on message characteristics
   * AI INSTRUCTIONS: Score based on user engagement indicators and message quality
   */
  private static calculateEngagementScore(message: ChatMessage): number {
    const content = message.content;
    let engagementScore = 0;
    
    // Message length scoring (detailed responses indicate engagement)
    if (content.length > 100) engagementScore += 0.3;
    else if (content.length > 50) engagementScore += 0.2;
    else if (content.length > 20) engagementScore += 0.1;
    
    // Question asking (indicates active engagement)
    const questionCount = (content.match(/\?/g) || []).length;
    engagementScore += Math.min(0.3, questionCount * 0.1);
    
    // Enthusiasm markers
    const enthusiasmMarkers = ['!', 'great', 'excellent', 'perfect', 'love', 'amazing', 'awesome'];
    const hasEnthusiasm = enthusiasmMarkers.some(marker => content.toLowerCase().includes(marker));
    if (hasEnthusiasm) engagementScore += 0.2;
    
    // Specific information sharing (indicates serious interest)
    const infoPatterns = ['company', 'team', 'we have', 'our', 'currently using'];
    const sharesInfo = infoPatterns.some(pattern => content.toLowerCase().includes(pattern));
    if (sharesInfo) engagementScore += 0.2;
    
    return Math.min(1.0, engagementScore);
  }
  
  /**
   * Calculate weighted overall score from component scores
   * AI INSTRUCTIONS: Apply business-optimized weighting for overall relevance
   */
  private static calculateWeightedOverallScore(componentScores: {
    recencyScore: number;
    entityRelevanceScore: number;
    intentAlignmentScore: number;
    businessContextScore: number;
    engagementScore: number;
  }): number {
    // 2025 optimization weights - prioritize business context over pure recency
    const weights = {
      recency: 0.2,           // Reduced from traditional 0.4
      entityRelevance: 0.25,  // High weight for business entities
      intentAlignment: 0.2,   // Important for conversation flow
      businessContext: 0.25,  // High weight for qualification signals
      engagement: 0.1         // Moderate weight for engagement
    };
    
    return (
      componentScores.recencyScore * weights.recency +
      componentScores.entityRelevanceScore * weights.entityRelevance +
      componentScores.intentAlignmentScore * weights.intentAlignment +
      componentScores.businessContextScore * weights.businessContext +
      componentScores.engagementScore * weights.engagement
    );
  }
  
  /**
   * Determine retention priority based on overall score
   * AI INSTRUCTIONS: Map scores to actionable priority levels
   */
  private static determineRetentionPriority(overallScore: number): 'critical' | 'high' | 'medium' | 'low' {
    if (overallScore >= 0.8) return 'critical';
    if (overallScore >= 0.6) return 'high';
    if (overallScore >= 0.4) return 'medium';
    return 'low';
  }
  
  /**
   * Generate human-readable reasons for retention
   * AI INSTRUCTIONS: Provide clear explanations for debugging and optimization
   */
  private static generateRetentionReasons(componentScores: {
    recencyScore: number;
    entityRelevanceScore: number;
    intentAlignmentScore: number;
    businessContextScore: number;
    engagementScore: number;
  }): string[] {
    const reasons: string[] = [];
    
    if (componentScores.recencyScore > 0.8) reasons.push('Recent message');
    if (componentScores.entityRelevanceScore > 0.5) reasons.push('Contains business entities');
    if (componentScores.intentAlignmentScore > 0.6) reasons.push('Aligns with current intent');
    if (componentScores.businessContextScore > 0.5) reasons.push('High business value');
    if (componentScores.engagementScore > 0.5) reasons.push('High engagement indicators');
    
    return reasons.length > 0 ? reasons : ['Low overall relevance'];
  }
  
  /**
   * Categorize messages by priority levels
   * AI INSTRUCTIONS: Group messages for efficient retention decisions
   */
  private static categorizeMessagesByPriority(
    scoredMessages: Array<{ message: ChatMessage; score: RelevanceScore }>
  ) {
    return {
      critical: scoredMessages.filter(s => s.score.retentionPriority === 'critical'),
      high: scoredMessages.filter(s => s.score.retentionPriority === 'high'),
      medium: scoredMessages.filter(s => s.score.retentionPriority === 'medium'),
      low: scoredMessages.filter(s => s.score.retentionPriority === 'low')
    };
  }
  
  /**
   * Generate retention recommendation based on prioritization
   * AI INSTRUCTIONS: Provide actionable retention strategy
   */
  private static generateRetentionRecommendation(
    categorized: any,
    maxRetentionMessages: number
  ) {
    const allMessages = [
      ...categorized.critical,
      ...categorized.high,
      ...categorized.medium,
      ...categorized.low
    ];
    
    if (allMessages.length <= maxRetentionMessages) {
      return {
        shouldCompress: false,
        messagesToCompress: [],
        messagesToRetain: allMessages.map(s => s.message)
      };
    }
    
    // Retain based on priority, up to max limit
    const messagesToRetain = allMessages.slice(0, maxRetentionMessages);
    const messagesToCompress = allMessages.slice(maxRetentionMessages);
    
    return {
      shouldCompress: messagesToCompress.length > 0,
      messagesToCompress: messagesToCompress.map(s => s.message),
      messagesToRetain: messagesToRetain.map(s => s.message)
    };
  }
  
  /**
   * Validation for relevance scoring input
   * AI INSTRUCTIONS: Use domain-specific error handling
   */
  private static validateRelevanceInput(message: ChatMessage, context: RelevanceContext): void {
    if (!message) {
      throw new BusinessRuleViolationError(
        'Cannot score relevance of null message',
        { messageId: 'unknown' }
      );
    }
    
    if (!context) {
      throw new BusinessRuleViolationError(
        'Relevance context is required for scoring',
        { messageId: message.id }
      );
    }
  }
  
  /**
   * Validation for message prioritization input
   * AI INSTRUCTIONS: Ensure valid input for prioritization process
   */
  private static validatePrioritizationInput(messages: ChatMessage[], context: RelevanceContext): void {
    if (!messages || messages.length === 0) {
      throw new BusinessRuleViolationError(
        'Cannot prioritize empty message list',
        { messageCount: messages?.length || 0 }
      );
    }
    
    if (context.maxRetentionMessages < 1) {
      throw new BusinessRuleViolationError(
        'Maximum retention messages must be at least 1',
        { maxRetentionMessages: context.maxRetentionMessages }
      );
    }
  }
} 