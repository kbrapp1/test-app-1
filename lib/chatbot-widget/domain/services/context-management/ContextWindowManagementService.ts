/**
 * Context Window Management Domain Service
 * 
 * AI INSTRUCTIONS:
 * - Orchestrate context window management using specialized services
 * - Keep business logic pure, no external dependencies
 * - Maintain single responsibility principle  
 * - Never exceed 100 lines - focused on orchestration only
 * - Follow @golden-rule patterns exactly
 * - Delegate to specialized services for complex operations
 * - Handle domain errors with specific error types
 * - Publish domain events for cross-aggregate communication
 */

import { MessageRelevanceCalculationService, MessageRelevanceScore } from './MessageRelevanceCalculationService';
import { MessageRetentionSelectionService, MessageTokenInfo, ContextWindowLimits } from './MessageRetentionSelectionService';
import { ContextWindowValidationService } from './ContextWindowValidationService';

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
    ContextWindowValidationService.validateLimits(limits);
  }

  /**
   * Calculate relevance score for a message using specialized service
   */
  calculateMessageRelevance(
    messageId: string,
    messagePosition: number,
    totalMessages: number,
    businessEntityCount: number,
    conversationPhase: string,
    userEngagementLevel: 'high' | 'medium' | 'low'
  ): MessageRelevanceScore {
    return MessageRelevanceCalculationService.calculateMessageRelevance(
      messageId,
      messagePosition,
      totalMessages,
      businessEntityCount,
      conversationPhase,
      userEngagementLevel
    );
  }

  /** Determine which messages to retain based on token limits and relevance */
  selectMessagesForRetention(
    messageTokens: MessageTokenInfo[],
    relevanceScores: MessageRelevanceScore[]
  ): {
    retainedMessages: string[];
    removedMessages: string[];
    totalTokensRetained: number;
    compressionRatio: number;
  } {
    return MessageRetentionSelectionService.selectMessagesForRetention(
      messageTokens,
      relevanceScores,
      this.limits
    );
  }

  /** Get current context window utilization metrics */
  getContextWindowMetrics(
    currentTokens: number,
    messageCount: number
  ): {
    utilizationPercentage: number;
    remainingTokens: number;
    compressionRecommended: boolean;
    messagesWithinLimits: boolean;
  } {
    return ContextWindowValidationService.getContextWindowMetrics(
      currentTokens,
      messageCount,
      this.limits
    );
  }

  /** Validate message count constraints */
  validateMessageCount(messageCount: number): boolean {
    return ContextWindowValidationService.validateMessageCount(messageCount, this.limits);
  }

  /** Validate token usage constraints */
  validateTokenUsage(tokenCount: number): {
    withinHardLimit: boolean;
    withinSoftLimit: boolean;
    exceedsRecommendedLimit: boolean;
  } {
    return ContextWindowValidationService.validateTokenUsage(tokenCount, this.limits);
  }

  /** Get current limits configuration */
  getLimits(): ContextWindowLimits {
    return { ...this.limits };
  }
}