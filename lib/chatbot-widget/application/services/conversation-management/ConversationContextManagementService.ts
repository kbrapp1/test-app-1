/**
 * Conversation Context Management Service
 * 
 * Application service for managing conversation context and token-aware operations.
 * Single responsibility: Handle context retrieval, token management, and conversation summaries.
 */

import { ChatMessage } from '../../../domain/entities/ChatMessage';
import { IChatMessageRepository } from '../../../domain/repositories/IChatMessageRepository';
import { IChatSessionRepository } from '../../../domain/repositories/IChatSessionRepository';
import { ConversationContextOrchestrator } from '../../../domain/services/conversation/ConversationContextOrchestrator';
import { ITokenCountingService } from '../../../domain/services/interfaces/ITokenCountingService';
import { ContextAnalysisInput } from '../../../domain/types/ChatbotTypes';
import { SummaryExtractionService } from '../../../domain/utilities/SummaryExtractionService';
import { ConversationContextWindow } from '../../../domain/value-objects/session-management/ConversationContextWindow';

export interface TokenAwareContextResult {
  messages: ContextAnalysisInput['messages'];
  summary?: string;
  tokenUsage: { messagesTokens: number; summaryTokens: number; totalTokens: number };
  wasCompressed: boolean;
}

export class ConversationContextManagementService {
  constructor(
    private readonly conversationContextOrchestrator: ConversationContextOrchestrator,
    private readonly tokenCountingService: ITokenCountingService,
    private readonly sessionRepository: IChatSessionRepository,
    private readonly messageRepository: IChatMessageRepository
  ) {}

  /**
   * Application Layer: Extract string from any conversation summary format
   * This handles the data transformation concern properly at application boundary
   */
  private extractSummaryText(summary?: string | Record<string, unknown>): string {
    return SummaryExtractionService.extractSummaryText(summary);
  }

  /**
   * Get token-aware context for conversation
   * AI INSTRUCTIONS: Enhanced with Phase 2 services for intelligent context management
   */
  async getTokenAwareContext(
    sessionId: string, 
    newUserMessage: ChatMessage,
    contextWindow: ConversationContextWindow,
    loggingContext?: { logEntry: (message: string) => void },
    sharedLogFile?: string
  ): Promise<TokenAwareContextResult> {
    // Get all messages for this session
    const allMessages = await this.messageRepository.findBySessionId(sessionId);
    
    if (allMessages.length === 0) {
      return {
        messages: [],
        tokenUsage: { messagesTokens: 0, summaryTokens: 0, totalTokens: 0 },
        wasCompressed: false
      };
    }

    // Get existing conversation summary from session if available
    const session = await this.sessionRepository.findById(sessionId);
    const existingSummary = session?.contextData.conversationSummary;
    
    // Application Layer: Extract string from any summary format (DDD-compliant data transformation)
    const summaryText = this.extractSummaryText(existingSummary);

    // Use context orchestrator (enhanced method removed - now using API-driven compression)
    const contextResult = await this.conversationContextOrchestrator.getMessagesForContextWindow(
      allMessages,
      contextWindow,
      summaryText,
      loggingContext
    );

    // If we need to compress and don't have a summary, create one
    if (contextResult.wasCompressed && !existingSummary && allMessages.length > 5) {
      const messagesToSummarize = allMessages.slice(0, -2); // Don't summarize the most recent messages
      const summary = await this.conversationContextOrchestrator.createAISummary(
        messagesToSummarize,
        contextWindow.summaryTokens
      );

      // Update session with new summary
      if (session) {
        const updatedSession = session.updateConversationSummary(summary);
        if (sharedLogFile) {
          await this.sessionRepository.update(updatedSession, sharedLogFile);
        } else {
          // Create context-specific log file if no shared log file provided
          const contextLogFile = `context-${new Date().toISOString().replace(/[:.]/g, '-').split('.')[0]}.log`;
          await this.sessionRepository.update(updatedSession, contextLogFile);
        }
      }

      return {
        messages: contextResult.messages,
        summary,
        tokenUsage: {
          messagesTokens: contextResult.tokenUsage.messagesTokens,
          summaryTokens: await this.tokenCountingService.countTextTokens(summary),
          totalTokens: contextResult.tokenUsage.totalTokens
        },
        wasCompressed: true
      };
    }

    return {
      messages: contextResult.messages,
      summary: summaryText,
      tokenUsage: contextResult.tokenUsage,
      wasCompressed: contextResult.wasCompressed
    };
  }

  // NOTE: updateSessionWithEnhancedSummary method removed - replaced by API-driven compression
} 