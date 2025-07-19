/**
 * Message Retention Selection Domain Service
 * 
 * AI INSTRUCTIONS:
 * - Pure business logic for selecting which messages to retain
 * - Keep business logic pure, no external dependencies
 * - Maintain single responsibility principle  
 * - Never exceed 100 lines - focused on retention selection only
 * - Follow @golden-rule patterns exactly
 * - Always validate inputs using value objects
 * - Handle domain errors with specific error types
 */

import { 
  ContextWindowExceededError,
  MessageRelevanceCalculationError
} from '../../errors/ChatbotWidgetDomainErrors';
import { MessageRelevanceScore } from './MessageRelevanceCalculationService';

export interface MessageTokenInfo {
  readonly messageId: string;
  readonly tokenCount: number;
  readonly cumulativeTokens: number;
}

export interface ContextWindowLimits {
  readonly maxTokens: number;
  readonly softLimitTokens: number;
  readonly minRetainedMessages: number;
  readonly maxRetainedMessages: number;
}

export class MessageRetentionSelectionService {
  
  /** Determine which messages to retain based on token limits and relevance */
  static selectMessagesForRetention(
    messageTokens: MessageTokenInfo[],
    relevanceScores: MessageRelevanceScore[],
    limits: ContextWindowLimits
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
    if (totalTokens <= limits.softLimitTokens) {
      return {
        retainedMessages: messageTokens.map(m => m.messageId),
        removedMessages: [],
        totalTokensRetained: totalTokens,
        compressionRatio: 1.0
      };
    }

    // Need to compress - use intelligent selection
    const scoredMessages = this.combineTokensAndScores(messageTokens, relevanceScores);
    const selectedMessages = this.selectOptimalMessageSet(scoredMessages, limits);

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

  private static combineTokensAndScores(
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

  private static selectOptimalMessageSet(
    scoredMessages: Array<MessageTokenInfo & MessageRelevanceScore>,
    limits: ContextWindowLimits
  ): Array<MessageTokenInfo & MessageRelevanceScore> {
    // Always retain the most recent messages (within min/max bounds)
    const recentMessages = scoredMessages.slice(-limits.minRetainedMessages);
    let currentTokens = recentMessages.reduce((sum, msg) => sum + msg.tokenCount, 0);
    
    if (currentTokens >= limits.maxTokens) {
      throw new ContextWindowExceededError(currentTokens, limits.maxTokens, {
        recentMessageCount: recentMessages.length
      });
    }

    // Add additional messages based on relevance score until we hit limits
    const remainingMessages = scoredMessages
      .slice(0, -limits.minRetainedMessages)
      .sort((a, b) => b.overallScore - a.overallScore); // Highest score first

    const selectedMessages = [...recentMessages];

    for (const message of remainingMessages) {
      const potentialTokens = currentTokens + message.tokenCount;
      
      if (potentialTokens <= limits.softLimitTokens && 
          selectedMessages.length < limits.maxRetainedMessages) {
        selectedMessages.push(message);
        currentTokens = potentialTokens;
      }
    }

    // Sort by original message order for coherent conversation flow
    return selectedMessages.sort((a, b) => 
      scoredMessages.indexOf(a) - scoredMessages.indexOf(b)
    );
  }
}