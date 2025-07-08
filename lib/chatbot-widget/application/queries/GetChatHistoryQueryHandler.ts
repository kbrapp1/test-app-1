/**
 * Get Chat History Query Handler
 * 
 * CQRS Query Handler that processes chat history retrieval requests.
 * Accesses repositories directly for optimized read operations.
 * 
 * Single Responsibility: Handle GetChatHistoryQuery processing
 */

import { GetChatHistoryQuery, GetChatHistoryResult } from './GetChatHistoryQuery';
import { IChatSessionRepository } from '../../domain/repositories/IChatSessionRepository';
import { IChatMessageRepository } from '../../domain/repositories/IChatMessageRepository';
import { ILeadRepository } from '../../domain/repositories/ILeadRepository';

export class GetChatHistoryQueryHandler {
  constructor(
    private readonly chatSessionRepository: IChatSessionRepository,
    private readonly chatMessageRepository: IChatMessageRepository,
    private readonly leadRepository: ILeadRepository
  ) {}

  /** Handle the get chat history query */
  async handle(query: GetChatHistoryQuery): Promise<GetChatHistoryResult> {
    try {
      // 1. Load session
      const session = await this.chatSessionRepository.findById(query.sessionId);
      if (!session) {
        throw new Error(`Chat session ${query.sessionId} not found`);
      }

      // 2. Load messages with pagination
      const page = Math.floor((query.offset || 0) / (query.limit || 50)) + 1;
      const messageResult = await this.chatMessageRepository.findBySessionIdWithPagination(
        query.sessionId,
        page,
        query.limit || 50
      );

      // 3. Filter out system messages if requested
      let messages = messageResult.messages;
      if (!query.includeSystemMessages) {
        messages = messages.filter(msg => msg.messageType !== 'system');
      }

      // 4. Check if there are more messages
      const hasMore = messageResult.page < messageResult.totalPages;

      // 5. Check if lead was captured
      const lead = await this.leadRepository.findBySessionId(query.sessionId);
      const leadCaptured = !!lead;

      // 6. Get message counts for analytics
      const messageCounts = await this.chatMessageRepository.countByTypeAndSessionId(query.sessionId);
      const totalMessages = messageCounts.user + messageCounts.bot + 
                           (query.includeSystemMessages ? messageCounts.system : 0);

      // 7. Build conversation summary
      const conversationSummary = {
        duration: session.getSessionDuration(),
        messageCount: totalMessages,
        engagementScore: session.contextData.engagementScore,
        topicsDiscussed: session.contextData.topics,
        leadCaptured
      };

      return {
        session,
        messages,
        totalMessages,
        hasMore,
        conversationSummary
      };
    } catch (error) {
      // Re-throw with context for upper layers to handle
      throw new Error(`Failed to get chat history: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
} 