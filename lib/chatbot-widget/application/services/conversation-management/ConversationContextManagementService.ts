/**
 * Conversation Context Management Service
 * 
 * Application service for managing conversation context and token-aware operations.
 * Single responsibility: Handle context retrieval, token management, and conversation summaries.
 */

import { ChatSession } from '../../../domain/entities/ChatSession';
import { ChatMessage } from '../../../domain/entities/ChatMessage';
import { ConversationContextWindow } from '../../../domain/value-objects/session-management/ConversationContextWindow';
import { ConversationContextOrchestrator } from '../../../domain/services/conversation/ConversationContextOrchestrator';
import { ITokenCountingService } from '../../../domain/services/interfaces/ITokenCountingService';
import { IChatSessionRepository } from '../../../domain/repositories/IChatSessionRepository';
import { IChatMessageRepository } from '../../../domain/repositories/IChatMessageRepository';

export interface TokenAwareContextResult {
  messages: ChatMessage[];
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
   * Get token-aware context for conversation
   */
  async getTokenAwareContext(
    sessionId: string, 
    newUserMessage: ChatMessage,
    contextWindow: ConversationContextWindow,
    loggingContext?: { logEntry: (message: string) => void }
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

    // Use conversation context orchestrator to get optimized message window with logging
    const contextResult = await this.conversationContextOrchestrator.getMessagesForContextWindow(
      allMessages,
      contextWindow,
      existingSummary,
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
        await this.sessionRepository.update(updatedSession);
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
      summary: existingSummary,
      tokenUsage: contextResult.tokenUsage,
      wasCompressed: contextResult.wasCompressed
    };
  }
} 