/**
 * Context Window Validation Domain Service
 * 
 * AI INSTRUCTIONS:
 * - Pure business logic for validating context window constraints
 * - Keep business logic pure, no external dependencies
 * - Maintain single responsibility principle  
 * - Never exceed 100 lines - focused on validation and metrics only
 * - Follow @golden-rule patterns exactly
 * - Always validate inputs using value objects
 * - Handle domain errors with specific error types
 */

import { 
  ContextCompressionError
} from '../../errors/ChatbotWidgetDomainErrors';
import { ContextWindowLimits } from './MessageRetentionSelectionService';

export class ContextWindowValidationService {
  
  /** Validate context window limits for business rule compliance */
  static validateLimits(limits: ContextWindowLimits): void {
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

  /** Get current context window utilization metrics */
  static getContextWindowMetrics(
    currentTokens: number,
    messageCount: number,
    limits: ContextWindowLimits
  ): {
    utilizationPercentage: number;
    remainingTokens: number;
    compressionRecommended: boolean;
    messagesWithinLimits: boolean;
  } {
    const utilizationPercentage = (currentTokens / limits.maxTokens) * 100;
    const remainingTokens = limits.maxTokens - currentTokens;
    const compressionRecommended = currentTokens > limits.softLimitTokens;
    const messagesWithinLimits = messageCount <= limits.maxRetainedMessages;

    return {
      utilizationPercentage,
      remainingTokens,
      compressionRecommended,
      messagesWithinLimits
    };
  }

  /** Validate message count constraints */
  static validateMessageCount(
    messageCount: number,
    limits: ContextWindowLimits
  ): boolean {
    return messageCount >= limits.minRetainedMessages && 
           messageCount <= limits.maxRetainedMessages;
  }

  /** Validate token usage constraints */
  static validateTokenUsage(
    tokenCount: number,
    limits: ContextWindowLimits
  ): {
    withinHardLimit: boolean;
    withinSoftLimit: boolean;
    exceedsRecommendedLimit: boolean;
  } {
    return {
      withinHardLimit: tokenCount <= limits.maxTokens,
      withinSoftLimit: tokenCount <= limits.softLimitTokens,
      exceedsRecommendedLimit: tokenCount > limits.softLimitTokens
    };
  }
}