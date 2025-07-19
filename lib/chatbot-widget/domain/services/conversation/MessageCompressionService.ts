/**
 * Message Compression Domain Service
 * 
 * AI INSTRUCTIONS:
 * - Pure business logic for compressing conversation messages
 * - Keep business logic pure, no external dependencies
 * - Maintain single responsibility principle  
 * - Never exceed 100 lines - focused on compression logic only
 * - Follow @golden-rule patterns exactly
 * - Handle domain errors with specific error types
 */

import { ChatMessage } from '../../entities/ChatMessage';
import { ContextRelevanceService } from '../utilities/ContextRelevanceService';
import { TokenAnalysisResult } from './TokenAnalysisService';

export interface CompressionResult {
  finalMessages: ChatMessage[];
  wasCompressed: boolean;
}

export class MessageCompressionService {
  
  /** Apply compression if needed based on token analysis and relevance */
  static applyCompressionIfNeeded(
    messages: ChatMessage[],
    prioritizedMessages: ReturnType<typeof ContextRelevanceService.prioritizeMessages>,
    tokenAnalysis: TokenAnalysisResult,
    availableTokens: number
  ): CompressionResult {
    if (tokenAnalysis.totalTokens > availableTokens && messages.length > 5) {
      const retentionRecommendation = prioritizedMessages.retentionRecommendation;
      if (retentionRecommendation.shouldCompress) {
        return {
          finalMessages: retentionRecommendation.messagesToRetain,
          wasCompressed: true
        };
      }
    }

    return {
      finalMessages: messages,
      wasCompressed: false
    };
  }

  /** Determine if compression is recommended based on message count and tokens */
  static shouldCompress(
    messageCount: number,
    tokenCount: number,
    availableTokens: number,
    minMessages: number = 5
  ): boolean {
    return tokenCount > availableTokens && messageCount > minMessages;
  }

  /** Calculate compression ratio for analytics */
  static calculateCompressionRatio(
    originalMessageCount: number,
    compressedMessageCount: number
  ): number {
    if (originalMessageCount === 0) return 1.0;
    return compressedMessageCount / originalMessageCount;
  }

  /** Get compression metrics for monitoring */
  static getCompressionMetrics(
    originalMessages: ChatMessage[],
    compressedMessages: ChatMessage[],
    originalTokens: number,
    compressedTokens: number
  ): {
    messageCompressionRatio: number;
    tokenCompressionRatio: number;
    messagesRemoved: number;
    tokensRemoved: number;
  } {
    return {
      messageCompressionRatio: this.calculateCompressionRatio(originalMessages.length, compressedMessages.length),
      tokenCompressionRatio: originalTokens > 0 ? compressedTokens / originalTokens : 1.0,
      messagesRemoved: originalMessages.length - compressedMessages.length,
      tokensRemoved: originalTokens - compressedTokens
    };
  }
}