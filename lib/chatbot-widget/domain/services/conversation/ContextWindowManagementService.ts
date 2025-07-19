/**
 * Context Window Management Service
 * 
 * AI INSTRUCTIONS:
 * - Orchestrate conversation context window management using specialized services
 * - Single responsibility: Manage conversation context window sizing and compression
 * - Delegate to specialized services for token analysis and compression
 * - Follow DDD patterns with proper error handling and separation of concerns
 * - Keep under 100 lines - focused on orchestration only
 */

import { ChatMessage } from '../../entities/ChatMessage';
import { ConversationContextWindow } from '../../value-objects/session-management/ConversationContextWindow';
import { ContextWindowResult } from '../../value-objects/message-processing/ContextAnalysis';
import { ITokenCountingService } from '../interfaces/ITokenCountingService';
import { ContextRelevanceService } from '../utilities/ContextRelevanceService';
import { RelevanceContext } from '../utilities/types/RelevanceTypes';
import { IntentResult } from '../../value-objects/message-processing/IntentResult';
import { TokenAnalysisService } from './TokenAnalysisService';
import { MessageCompressionService } from './MessageCompressionService';

interface LoggingContext {
  logEntry: (message: string) => void;
}

export class ContextWindowManagementService {
  private tokenAnalysisService: TokenAnalysisService;

  constructor(tokenCountingService: ITokenCountingService) {
    this.tokenAnalysisService = new TokenAnalysisService(tokenCountingService);
  }

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
    const tokenAnalysis = await this.tokenAnalysisService.analyzeTokenUsage(messages, existingSummary);
    const availableTokens = contextWindow.getAvailableTokensForMessages();
    
    logEntry(`🔧 TOKEN ANALYSIS: ${tokenAnalysis.messagesTokens} msg + ${tokenAnalysis.summaryTokens} summary = ${tokenAnalysis.totalTokens}/${availableTokens}`);

    // Step 3: Apply compression if needed
    const compressionResult = MessageCompressionService.applyCompressionIfNeeded(
      messages,
      prioritizedMessages,
      tokenAnalysis,
      availableTokens
    );

    if (compressionResult.wasCompressed) {
      logEntry(`📋 COMPRESSION: Retained ${compressionResult.finalMessages.length} most relevant messages`);
    }

    // Step 4: Final token calculation
    const finalTokens = await this.tokenAnalysisService.calculateFinalTokenUsage(
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
}