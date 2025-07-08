import { ChatMessage } from '../entities/ChatMessage';

export interface IChatMessageRepository {
  /** Find message by ID */
  findById(id: string): Promise<ChatMessage | null>;

  /** Find all messages for a session */
  findBySessionId(sessionId: string): Promise<ChatMessage[]>;

  /** Find visible messages for a session (for chat interface) */
  findVisibleBySessionId(sessionId: string): Promise<ChatMessage[]>;

  /** Find messages by session ID with pagination */
  findBySessionIdWithPagination(
    sessionId: string,
    page: number,
    limit: number
  ): Promise<{
    messages: ChatMessage[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>;

  /** Save a new message */
  save(message: ChatMessage, sharedLogFile: string): Promise<ChatMessage>;

  /** Update an existing message */
  update(message: ChatMessage, sharedLogFile: string): Promise<ChatMessage>;

  /** Delete a message */
  delete(id: string): Promise<void>;

  /** Delete all messages for a session */
  deleteBySessionId(sessionId: string): Promise<void>;

  /** Find recent messages across all sessions for an organization */
  findRecentByOrganizationId(organizationId: string, limit: number): Promise<ChatMessage[]>;

  /** Search messages by content */
  searchByContent(
    organizationId: string,
    searchTerm: string,
    filters?: {
      messageType?: string;
      dateFrom?: Date;
      dateTo?: Date;
      sessionId?: string;
    }
  ): Promise<ChatMessage[]>;

  /** Get message analytics for a time period */
  getAnalytics(
    organizationId: string,
    dateFrom: Date,
    dateTo: Date
  ): Promise<{
    totalMessages: number;
    userMessages: number;
    botMessages: number;
    systemMessages: number;
    avgResponseTime: number;
    avgTokensPerMessage: number;
    totalTokenCost: number;
    sentimentDistribution: {
      positive: number;
      neutral: number;
      negative: number;
    };
    topIntents: Array<{ intent: string; count: number }>;
    errorRate: number;
  }>;

  /** Get the last message for a session */
  findLastBySessionId(sessionId: string): Promise<ChatMessage | null>;

  /** Count messages by type for a session */
  countByTypeAndSessionId(sessionId: string): Promise<{
    user: number;
    bot: number;
    system: number;
    lead_capture: number;
    qualification: number;
  }>;

  /**
   * Find messages with errors for debugging
   */
  findMessagesWithErrors(
    organizationId: string,
    dateFrom: Date,
    dateTo: Date
  ): Promise<ChatMessage[]>;

  /** Get average response times by time period */
  getResponseTimeMetrics(
    organizationId: string,
    dateFrom: Date,
    dateTo: Date,
    groupBy: 'hour' | 'day' | 'week'
  ): Promise<Array<{ period: string; avgResponseTime: number; messageCount: number }>>;
} 