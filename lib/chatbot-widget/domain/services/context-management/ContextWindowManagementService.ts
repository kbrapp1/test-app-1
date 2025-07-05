/**
 * Context Window Management Domain Service
 * 
 * AI INSTRUCTIONS:
 * - Keep business logic pure, no external dependencies
 * - Maintain single responsibility principle  
 * - Never exceed 250 lines - refactor into smaller services
 * - Follow @golden-rule patterns exactly
 * - Check for existing similar logic before creating new
 * - Always validate inputs using value objects
 * - Delegate complex calculations to separate methods
 * - Handle domain errors with specific error types
 * - Publish domain events for cross-aggregate communication
 */

import { 
  ContextWindowExceededError, 
  MessageRelevanceCalculationError,
  ContextCompressionError 
} from '../../errors/ChatbotWidgetDomainErrors';

export interface MessageRelevanceScore {
  readonly messageId: string;
  readonly overallScore: number;
  readonly components: {
    readonly recencyScore: number;
    readonly businessEntityRelevance: number;
    readonly conversationFlowRelevance: number;
    readonly userEngagementScore: number;
  };
  readonly retentionPriority: 'high' | 'medium' | 'low';
  readonly calculatedAt: Date;
}

export interface ContextWindowLimits {
  readonly maxTokens: number;
  readonly softLimitTokens: number;
  readonly minRetainedMessages: number;
  readonly maxRetainedMessages: number;
}

export interface MessageTokenInfo {
  readonly messageId: string;
  readonly tokenCount: number;
  readonly cumulativeTokens: number;
}

export class ContextWindowManagementService {
  private readonly defaultLimits: ContextWindowLimits = {
    maxTokens: 16000,
    softLimitTokens: 14000,
    minRetainedMessages: 2,
    maxRetainedMessages: 18
  };

  constructor(
    private readonly limits: ContextWindowLimits = this.defaultLimits
  ) {
    this.validateLimits(limits);
  }

  /**
   * Calculate relevance score for a message using simplified AI-first approach
   * Removes hardcoded keyword matching in favor of business context
   */
  calculateMessageRelevance(
    messageId: string,
    messagePosition: number,
    totalMessages: number,
    businessEntityCount: number,
    conversationPhase: string,
    userEngagementLevel: 'high' | 'medium' | 'low'
  ): MessageRelevanceScore {
    try {
      // Simplified scoring focused on business value, not keyword matching
      const recencyScore = this.calculateRecencyScore(messagePosition, totalMessages);
      const businessEntityRelevance = this.calculateBusinessEntityRelevance(businessEntityCount);
      const conversationFlowRelevance = this.calculateConversationFlowRelevance(conversationPhase);
      const userEngagementScore = this.calculateUserEngagementScore(userEngagementLevel);

      // Weighted scoring prioritizing business context over artificial complexity
      const overallScore = (
        recencyScore * 0.3 +
        businessEntityRelevance * 0.35 +
        conversationFlowRelevance * 0.25 +
        userEngagementScore * 0.1
      );

      const retentionPriority = this.determineRetentionPriority(overallScore);

      return {
        messageId,
        overallScore,
        components: {
          recencyScore,
          businessEntityRelevance,
          conversationFlowRelevance,
          userEngagementScore
        },
        retentionPriority,
        calculatedAt: new Date()
      };
    } catch (error) {
      throw new MessageRelevanceCalculationError(
        messageId,
        error instanceof Error ? error.message : 'Unknown calculation error',
        { messagePosition, totalMessages, businessEntityCount, conversationPhase }
      );
    }
  }

  /**
   * Determine which messages to retain based on token limits and relevance
   */
  selectMessagesForRetention(
    messageTokens: MessageTokenInfo[],
    relevanceScores: MessageRelevanceScore[]
  ): {
    retainedMessages: string[];
    removedMessages: string[];
    totalTokensRetained: number;
    compressionRatio: number;
  } {
    if (messageTokens.length === 0) {
      return {
        retainedMessages: [],
        removedMessages: [],
        totalTokensRetained: 0,
        compressionRatio: 1.0
      };
    }

    const totalTokens = messageTokens[messageTokens.length - 1]?.cumulativeTokens || 0;
    
    // If within limits, retain all messages
    if (totalTokens <= this.limits.softLimitTokens) {
      return {
        retainedMessages: messageTokens.map(m => m.messageId),
        removedMessages: [],
        totalTokensRetained: totalTokens,
        compressionRatio: 1.0
      };
    }

    // Need to compress - use intelligent selection
    const scoredMessages = this.combineTokensAndScores(messageTokens, relevanceScores);
    const selectedMessages = this.selectOptimalMessageSet(scoredMessages);

    const retainedTokens = selectedMessages.reduce((sum, msg) => sum + msg.tokenCount, 0);

    return {
      retainedMessages: selectedMessages.map(m => m.messageId),
      removedMessages: messageTokens
        .filter(m => !selectedMessages.find(s => s.messageId === m.messageId))
        .map(m => m.messageId),
      totalTokensRetained: retainedTokens,
      compressionRatio: retainedTokens / totalTokens
    };
  }

  private calculateRecencyScore(position: number, total: number): number {
    if (total <= 1) return 1.0;
    
    // Linear decay from most recent (1.0) to oldest (0.1)
    const relativePosition = position / (total - 1);
    return Math.max(0.1, 1.0 - (relativePosition * 0.9));
  }

  private calculateBusinessEntityRelevance(entityCount: number): number {
    // Business entities indicate valuable lead qualification data
    if (entityCount === 0) return 0.1;
    if (entityCount >= 3) return 1.0;
    
    // Scale between 0.3 and 1.0 based on entity richness
    return 0.3 + (entityCount / 3) * 0.7;
  }

  private calculateConversationFlowRelevance(phase: string): number {
    // Phase-based relevance without hardcoded keywords
    const phaseScores: Record<string, number> = {
      'discovery': 0.8,      // High value for understanding needs
      'qualification': 1.0,   // Critical for lead assessment
      'demo': 0.9,           // Important product interaction
      'objection_handling': 0.95, // Key sales moments
      'closing': 1.0,        // Critical business outcome
      'unknown': 0.3         // Low but not zero for flexibility
    };

    return phaseScores[phase] || 0.5;
  }

  private calculateUserEngagementScore(level: 'high' | 'medium' | 'low'): number {
    const engagementScores = {
      'high': 1.0,
      'medium': 0.6,
      'low': 0.3
    };

    return engagementScores[level];
  }

  private determineRetentionPriority(score: number): 'high' | 'medium' | 'low' {
    if (score >= 0.7) return 'high';
    if (score >= 0.4) return 'medium';
    return 'low';
  }

  private combineTokensAndScores(
    messageTokens: MessageTokenInfo[],
    relevanceScores: MessageRelevanceScore[]
  ): Array<MessageTokenInfo & MessageRelevanceScore> {
    return messageTokens.map(tokenInfo => {
      const relevanceScore = relevanceScores.find(r => r.messageId === tokenInfo.messageId);
      
      if (!relevanceScore) {
        throw new MessageRelevanceCalculationError(
          tokenInfo.messageId,
          'No relevance score found for message',
          { availableScores: relevanceScores.length }
        );
      }

      return { ...tokenInfo, ...relevanceScore };
    });
  }

  private selectOptimalMessageSet(
    scoredMessages: Array<MessageTokenInfo & MessageRelevanceScore>
  ): Array<MessageTokenInfo & MessageRelevanceScore> {
    // Always retain the most recent messages (within min/max bounds)
    const recentMessages = scoredMessages.slice(-this.limits.minRetainedMessages);
    let currentTokens = recentMessages.reduce((sum, msg) => sum + msg.tokenCount, 0);
    
    if (currentTokens >= this.limits.maxTokens) {
      throw new ContextWindowExceededError(currentTokens, this.limits.maxTokens, {
        recentMessageCount: recentMessages.length
      });
    }

    // Add additional messages based on relevance score until we hit limits
    const remainingMessages = scoredMessages
      .slice(0, -this.limits.minRetainedMessages)
      .sort((a, b) => b.overallScore - a.overallScore); // Highest score first

    const selectedMessages = [...recentMessages];

    for (const message of remainingMessages) {
      const potentialTokens = currentTokens + message.tokenCount;
      
      if (potentialTokens <= this.limits.softLimitTokens && 
          selectedMessages.length < this.limits.maxRetainedMessages) {
        selectedMessages.push(message);
        currentTokens = potentialTokens;
      }
    }

    // Sort by original message order for coherent conversation flow
    return selectedMessages.sort((a, b) => 
      scoredMessages.indexOf(a) - scoredMessages.indexOf(b)
    );
  }

  private validateLimits(limits: ContextWindowLimits): void {
    if (limits.maxTokens <= 0) {
      throw new ContextCompressionError(
        'token_limits',
        'Maximum tokens must be positive',
        { maxTokens: limits.maxTokens }
      );
    }

    if (limits.softLimitTokens >= limits.maxTokens) {
      throw new ContextCompressionError(
        'token_limits',
        'Soft limit must be less than maximum tokens',
        { softLimit: limits.softLimitTokens, maxTokens: limits.maxTokens }
      );
    }

    if (limits.minRetainedMessages <= 0) {
      throw new ContextCompressionError(
        'message_limits',
        'Minimum retained messages must be positive',
        { minRetained: limits.minRetainedMessages }
      );
    }

    if (limits.minRetainedMessages > limits.maxRetainedMessages) {
      throw new ContextCompressionError(
        'message_limits',
        'Minimum retained messages cannot exceed maximum',
        { minRetained: limits.minRetainedMessages, maxRetained: limits.maxRetainedMessages }
      );
    }
  }

  /**
   * Get current context window utilization metrics
   */
  getContextWindowMetrics(
    currentTokens: number,
    messageCount: number
  ): {
    utilizationPercentage: number;
    remainingTokens: number;
    compressionRecommended: boolean;
    messagesWithinLimits: boolean;
  } {
    const utilizationPercentage = (currentTokens / this.limits.maxTokens) * 100;
    const remainingTokens = this.limits.maxTokens - currentTokens;
    const compressionRecommended = currentTokens > this.limits.softLimitTokens;
    const messagesWithinLimits = messageCount <= this.limits.maxRetainedMessages;

    return {
      utilizationPercentage,
      remainingTokens,
      compressionRecommended,
      messagesWithinLimits
    };
  }
} 