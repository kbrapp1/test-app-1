/**
 * Get Chat History Query
 * 
 * CQRS Query for retrieving chat session history.
 * Represents a read operation request for message data.
 * 
 * Single Responsibility: Encapsulate chat history query parameters
 */

import { ChatMessage } from '../../domain/entities/ChatMessage';
import { ChatSession } from '../../domain/entities/ChatSession';

export interface GetChatHistoryQuery {
  sessionId: string;
  limit?: number;
  offset?: number;
  includeSystemMessages?: boolean;
}

export interface GetChatHistoryResult {
  session: ChatSession;
  messages: ChatMessage[];
  totalMessages: number;
  hasMore: boolean;
  conversationSummary: {
    duration: number; // minutes
    messageCount: number;
    engagementScore: number;
    topicsDiscussed: string[];
    leadCaptured: boolean;
  };
} 