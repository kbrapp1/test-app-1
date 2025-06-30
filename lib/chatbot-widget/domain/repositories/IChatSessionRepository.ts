import { ChatSession } from '../entities/ChatSession';

export interface IChatSessionRepository {
  /**
   * Find chat session by ID
   */
  findById(id: string): Promise<ChatSession | null>;

  /**
   * Find chat session by session token
   */
  findBySessionToken(sessionToken: string): Promise<ChatSession | null>;

  /**
   * Find active sessions for a chatbot configuration
   */
  findActiveByChatbotConfigId(chatbotConfigId: string): Promise<ChatSession[]>;

  /**
   * Find sessions by visitor ID
   */
  findByVisitorId(visitorId: string): Promise<ChatSession[]>;

  /**
   * Find sessions by organization ID with pagination
   */
  findByOrganizationIdWithPagination(
    organizationId: string,
    page: number,
    limit: number,
    filters?: {
      status?: string;
      dateFrom?: Date;
      dateTo?: Date;
      hasLead?: boolean;
    }
  ): Promise<{
    sessions: ChatSession[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>;

  /**
   * Save a new chat session
   */
  save(session: ChatSession, sharedLogFile?: string): Promise<ChatSession>;

  /**
   * Update an existing chat session
   */
  update(session: ChatSession, sharedLogFile?: string): Promise<ChatSession>;

  /**
   * Delete a chat session and related data
   */
  delete(id: string): Promise<void>;

  /**
   * Find expired sessions for cleanup
   */
  findExpiredSessions(timeoutMinutes: number): Promise<ChatSession[]>;

  /**
   * Mark expired sessions as abandoned
   */
  markExpiredAsAbandoned(timeoutMinutes: number): Promise<number>;

  /**
   * Get session analytics for a time period
   */
  getAnalytics(
    organizationId: string,
    dateFrom: Date,
    dateTo: Date
  ): Promise<{
    totalSessions: number;
    activeSessions: number;
    completedSessions: number;
    abandonedSessions: number;
    avgSessionDuration: number;
    avgEngagementScore: number;
    conversionRate: number;
    topTopics: Array<{ topic: string; count: number }>;
    hourlyDistribution: Array<{ hour: number; count: number }>;
  }>;

  /**
   * Get recent sessions for a visitor
   */
  findRecentByVisitorId(visitorId: string, limit: number): Promise<ChatSession[]>;

  /**
   * Count active sessions by chatbot config
   */
  countActiveByChatbotConfigId(chatbotConfigId: string): Promise<number>;
} 