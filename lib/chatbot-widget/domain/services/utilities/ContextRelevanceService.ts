/**
 * Context Relevance Orchestration Service
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Orchestrate relevance scoring and prioritization
 * - Pure domain service - delegate to specialized services
 * - Follow @golden-rule patterns exactly - under 100 lines
 * - Use domain-specific error handling with BusinessRuleViolationError
 * - Enable smart context window management based on relevance
 * - Apply 2025 optimization patterns for context intelligence
 */

import { ChatMessage } from '../../entities/ChatMessage';
import { BusinessRuleViolationError } from '../../errors/ChatbotWidgetDomainErrors';
import { 
  RelevanceScore, 
  RelevanceContext, 
  PrioritizedMessages 
} from './types/RelevanceTypes';
import { MessagePrioritizationService } from './MessagePrioritizationService';
import { RetentionStrategyService } from './RetentionStrategyService';

// Re-export types for backward compatibility
export type { 
  RelevanceScore, 
  RelevanceContext, 
  PrioritizedMessages,
  ScoredMessage,
  CategorizedMessages,
  ComponentScores,
  RetentionRecommendation
} from './types/RelevanceTypes';

/**
 * Domain Service for intelligent message relevance scoring
 * Orchestrates specialized services for context prioritization beyond simple recency-based retention
 */
export class ContextRelevanceService {
  
  /**
   * Score message relevance for intelligent context management
   * 
   * AI INSTRUCTIONS:
   * - Main orchestration method - delegate to MessagePrioritizationService
   * - Maintain backward compatibility with existing interface
   * - Apply domain validation before delegation
   */
  static scoreMessageRelevance(
    message: ChatMessage,
    context: RelevanceContext,
    messagePosition: number,
    totalMessages: number
  ): RelevanceScore {
    this.validateRelevanceInput(message, context);
    
    return MessagePrioritizationService.scoreMessageRelevance(
      message,
      context,
      messagePosition,
      totalMessages
    );
  }
  
  /**
   * Prioritize messages based on relevance scores for context window optimization
   * 
   * AI INSTRUCTIONS:
   * - Orchestrate message prioritization and retention recommendations
   * - Delegate to specialized services for scoring and retention strategy
   * - Provide complete prioritization result
   */
  static prioritizeMessages(
    messages: ChatMessage[],
    context: RelevanceContext
  ): PrioritizedMessages {
    this.validatePrioritizationInput(messages, context);
    
    // Score and categorize all messages
    const scoredMessages = MessagePrioritizationService.scoreAllMessages(messages, context);
    const categorizedMessages = MessagePrioritizationService.categorizeMessagesByPriority(scoredMessages);
    
    // Generate retention strategy
    const prioritizedMessages = RetentionStrategyService.generatePrioritizedMessages(
      categorizedMessages,
      context.maxRetentionMessages
    );
    
    return prioritizedMessages;
  }
  
  /**
   * Validation for relevance scoring input
   * 
   * AI INSTRUCTIONS:
   * - Use domain-specific error handling
   * - Validate required parameters before delegation
   * - Provide clear error messages with context
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
   * 
   * AI INSTRUCTIONS:
   * - Ensure valid input for prioritization process
   * - Check message list and context validity
   * - Provide specific error context for debugging
   */
  private static validatePrioritizationInput(messages: ChatMessage[], context: RelevanceContext): void {
    if (!messages || messages.length === 0) {
      throw new BusinessRuleViolationError(
        'Cannot prioritize empty message list',
        { messageCount: messages?.length || 0 }
      );
    }
    
    if (!context) {
      throw new BusinessRuleViolationError(
        'Relevance context is required for prioritization',
        { messageCount: messages.length }
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