/**
 * Context Window Management Service
 * 
 * Single responsibility: Manage conversation context window sizing and compression
 * Handles token counting, message prioritization, and compression decisions
 * Follows DDD patterns with proper error handling and separation of concerns
 */

import { ChatMessage } from '../../entities/ChatMessage';
import { ConversationContextWindow } from '../../value-objects/session-management/ConversationContextWindow';
import { ContextWindowResult } from '../../value-objects/message-processing/ContextAnalysis';
import { ITokenCountingService } from '../interfaces/ITokenCountingService';
import { ContextRelevanceService } from '../utilities/ContextRelevanceService';
import { RelevanceContext } from '../utilities/types/RelevanceTypes';
import { IntentResult } from '../../value-objects/message-processing/IntentResult';
import { SummaryExtractionService } from '../../utilities/SummaryExtractionService';

interface LoggingContext {
  logEntry: (message: string) => void;
}

export class ContextWindowManagementService {
  private tokenCountCache = new Map<string, number>();
  private readonly maxCacheSize = 100;

  constructor(private tokenCountingService: ITokenCountingService) {}

  async getMessagesForContextWindow(
    messages: ChatMessage[],
    contextWindow: ConversationContextWindow,
    existingSummary?: string,
    loggingContext?: LoggingContext
  ): Promise<ContextWindowResult> {
    const logEntry = loggingContext?.logEntry || (() => {});
    
    if (messages.length === 0) {
      return this.createEmptyResult();
    }

    logEntry(`🧠 CONTEXT WINDOW: ${messages.length} messages, ${contextWindow.maxTokens} max tokens`);

    // Step 1: Analyze message relevance for intelligent prioritization
    const prioritizedMessages = this.analyzeMessageRelevance(messages, contextWindow);
    logEntry(`📈 RELEVANCE: Critical=${prioritizedMessages.criticalMessages.length}, High=${prioritizedMessages.highPriorityMessages.length}`);

    // Step 2: Token analysis
    const tokenAnalysis = await this.analyzeTokenUsage(messages, existingSummary);
    const availableTokens = contextWindow.getAvailableTokensForMessages();
    
    logEntry(`🔧 TOKEN ANALYSIS: ${tokenAnalysis.messagesTokens} msg + ${tokenAnalysis.summaryTokens} summary = ${tokenAnalysis.totalTokens}/${availableTokens}`);

    // Step 3: Apply compression if needed
    const compressionResult = this.applyCompressionIfNeeded(
      messages,
      prioritizedMessages,
      tokenAnalysis,
      availableTokens
    );

    if (compressionResult.wasCompressed) {
      logEntry(`📋 COMPRESSION: Retained ${compressionResult.finalMessages.length} most relevant messages`);
    }

    // Step 4: Final token calculation
    const finalTokens = await this.calculateFinalTokenUsage(
      compressionResult.finalMessages,
      tokenAnalysis.summaryText
    );

    logEntry(`✅ COMPLETE: ${compressionResult.finalMessages.length} messages, ${finalTokens.totalTokens} tokens, compressed=${compressionResult.wasCompressed}`);

    return this.buildContextWindowResult(
      compressionResult.finalMessages,
      tokenAnalysis.summaryText,
      finalTokens,
      compressionResult.wasCompressed
    );
  }

  private createEmptyResult(): ContextWindowResult {
    return {
      messages: [],
      tokenUsage: { messagesTokens: 0, summaryTokens: 0, totalTokens: 0 },
      wasCompressed: false
    };
  }

  private analyzeMessageRelevance(messages: ChatMessage[], contextWindow: ConversationContextWindow) {
    const relevanceContext: RelevanceContext = {
      currentIntent: IntentResult.createUnknown(),
      businessEntities: {},
      conversationPhase: 'discovery',
      leadScore: 0,
      maxRetentionMessages: Math.floor(contextWindow.getAvailableTokensForMessages() / 100)
    };

    return ContextRelevanceService.prioritizeMessages(messages, relevanceContext);
  }

  private async analyzeTokenUsage(messages: ChatMessage[], existingSummary?: string) {
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

  private applyCompressionIfNeeded(
    messages: ChatMessage[],
    prioritizedMessages: ReturnType<typeof ContextRelevanceService.prioritizeMessages>,
    tokenAnalysis: { totalTokens: number },
    availableTokens: number
  ) {
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

  private async calculateFinalTokenUsage(messages: ChatMessage[], summaryText: string) {
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

  private buildContextWindowResult(
    messages: ChatMessage[],
    summaryText: string,
    tokenUsage: { messagesTokens: number; summaryTokens: number; totalTokens: number },
    wasCompressed: boolean
  ): ContextWindowResult {
    return {
      messages: messages.map(msg => ({
        id: msg.id,
        content: msg.content,
        role: msg.messageType === 'user' ? 'user' as const : 
              msg.messageType === 'bot' ? 'assistant' as const : 'system' as const,
        timestamp: msg.timestamp,
        metadata: { 
          sessionId: msg.sessionId,
          processingTime: msg.processingTime,
          isVisible: msg.isVisible
        }
      })),
      summary: summaryText,
      tokenUsage,
      wasCompressed
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