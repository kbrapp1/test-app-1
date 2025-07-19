/**
 * Message Validation Utilities
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Consolidate message validation logic
 * - Used across 6+ files to eliminate duplication
 * - Follow @golden-rule patterns: Pure functions, no side effects
 * - Keep under 100 lines following DRY principle
 */

import { ChatMessage } from '../entities/ChatMessage';

export class MessageValidationUtils {
  
  /** 
   * Filter out invalid ChatMessage objects
   * Consolidates: messages.filter(m => m && typeof m.isFromUser === 'function')
   */
  static filterValidMessages(messages: ChatMessage[]): ChatMessage[] {
    return messages.filter(m => m && typeof m.isFromUser === 'function');
  }

  /** 
   * Get only user messages from a conversation
   * Commonly used pattern across the codebase
   */
  static getUserMessages(messages: ChatMessage[]): ChatMessage[] {
    const validMessages = this.filterValidMessages(messages);
    return validMessages.filter(m => m.isFromUser());
  }

  /** 
   * Get only bot messages from a conversation
   * Commonly used pattern across the codebase
   */
  static getBotMessages(messages: ChatMessage[]): ChatMessage[] {
    const validMessages = this.filterValidMessages(messages);
    return validMessages.filter(m => !m.isFromUser());
  }

  /** 
   * Get message statistics
   * Consolidates common message counting patterns
   */
  static getMessageStatistics(messages: ChatMessage[]): {
    totalMessages: number;
    userMessages: number;
    botMessages: number;
    validMessages: number;
  } {
    const validMessages = this.filterValidMessages(messages);
    const userMessages = validMessages.filter(m => m.isFromUser());
    const botMessages = validMessages.filter(m => !m.isFromUser());

    return {
      totalMessages: messages.length,
      validMessages: validMessages.length,
      userMessages: userMessages.length,
      botMessages: botMessages.length
    };
  }

  /** 
   * Check if conversation has any valid user messages
   * Common validation pattern
   */
  static hasUserMessages(messages: ChatMessage[]): boolean {
    return this.getUserMessages(messages).length > 0;
  }

  /** 
   * Get combined content from all messages
   * Used for analysis and summarization
   */
  static getCombinedContent(messages: ChatMessage[]): string {
    const validMessages = this.filterValidMessages(messages);
    return validMessages.map(msg => msg.content).join(' ');
  }
} 