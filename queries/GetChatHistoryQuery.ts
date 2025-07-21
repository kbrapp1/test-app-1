/**
 * Get Chat History Query
 * 
 * AI INSTRUCTIONS:
 * - CQRS query for chat session history retrieval with pagination support
 * - Encapsulates read operation parameters for message data and conversation summaries
 * - Provides conversation analytics including engagement scores and topic analysis
 * - Supports filtering system messages and controlling result set size
 * - Returns comprehensive conversation metadata for UI display and analytics
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