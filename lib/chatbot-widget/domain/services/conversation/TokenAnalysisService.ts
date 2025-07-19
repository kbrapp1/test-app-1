/**
 * Token Analysis Domain Service
 * 
 * AI INSTRUCTIONS:
 * - Pure business logic for token counting and analysis
 * - Keep business logic pure, no external dependencies
 * - Maintain single responsibility principle  
 * - Never exceed 100 lines - focused on token analysis only
 * - Follow @golden-rule patterns exactly
 * - Handle domain errors with specific error types
 */

import { ChatMessage } from '../../entities/ChatMessage';
import { ITokenCountingService } from '../interfaces/ITokenCountingService';
import { SummaryExtractionService } from '../../utilities/SummaryExtractionService';

export interface TokenAnalysisResult {
  messagesTokens: number;
  summaryTokens: number;
  totalTokens: number;
  summaryText: string;
}

export class TokenAnalysisService {
  private tokenCountCache = new Map<string, number>();
  private readonly maxCacheSize = 100;

  constructor(private tokenCountingService: ITokenCountingService) {}

  /** Analyze token usage for messages and summary */
  async analyzeTokenUsage(messages: ChatMessage[], existingSummary?: string): Promise<TokenAnalysisResult> {
    const messagesTokens = await this.estimateTokenUsage(messages);
    const summaryText = SummaryExtractionService.extractSummaryText(existingSummary);
    const summaryTokens = summaryText 
      ? await this.tokenCountingService.countTextTokens(summaryText)
      : 0;

    return {
      messagesTokens,
      summaryTokens,
      totalTokens: messagesTokens + summaryTokens,
      summaryText
    };
  }

  /** Calculate final token usage for messages and summary */
  async calculateFinalTokenUsage(messages: ChatMessage[], summaryText: string): Promise<{
    messagesTokens: number;
    summaryTokens: number;
    totalTokens: number;
  }> {
    const messagesTokens = await this.estimateTokenUsage(messages);
    const summaryTokens = summaryText 
      ? await this.tokenCountingService.countTextTokens(summaryText)
      : 0;

    return {
      messagesTokens,
      summaryTokens,
      totalTokens: messagesTokens + summaryTokens
    };
  }

  private async estimateTokenUsage(messages: ChatMessage[]): Promise<number> {
    try {
      const cacheKey = messages.map(m => `${m.id}:${m.content.length}`).join('|');
      
      if (this.tokenCountCache.has(cacheKey)) {
        return this.tokenCountCache.get(cacheKey)!;
      }
      
      const tokenCount = await this.tokenCountingService.countMessagesTokens(messages);
      this.updateTokenCache(cacheKey, tokenCount);
      
      return tokenCount;
    } catch {
      // Fallback to character-based estimation
      return messages.reduce((total, msg) => total + Math.ceil(msg.content.length / 4), 0);
    }
  }

  private updateTokenCache(key: string, value: number): void {
    this.tokenCountCache.set(key, value);
    
    // Prevent memory leaks by limiting cache size
    if (this.tokenCountCache.size > this.maxCacheSize) {
      const firstKey = this.tokenCountCache.keys().next().value;
      if (firstKey) {
        this.tokenCountCache.delete(firstKey);
      }
    }
  }
}