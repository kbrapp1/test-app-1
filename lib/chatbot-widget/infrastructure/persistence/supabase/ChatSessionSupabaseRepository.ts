/**
 * Chat Session Supabase Repository
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Core chat session data access coordination
 * - Delegate specialized operations to focused services
 * - Keep under 200-250 lines by extracting query services
 * - Use composition pattern for complex operations
 * - Follow @golden-rule patterns exactly
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { IChatSessionRepository } from '../../../domain/repositories/IChatSessionRepository';
import { ChatSession } from '../../../domain/entities/ChatSession';
import { ChatSessionMapper, RawChatSessionDbRecord } from './mappers/ChatSessionMapper';
import { DatabaseError } from '@/lib/errors/base';
import { 
  ChatSessionQueryService,
  ChatSessionAnalyticsService,
  ChatSessionMaintenanceService
} from './services/chat-session';

/**
 * Supabase ChatSession Repository Implementation
 * Follows DDD principles with clean separation of concerns
 */
export class ChatSessionSupabaseRepository implements IChatSessionRepository {
  private readonly queryService: ChatSessionQueryService;
  private readonly analyticsService: ChatSessionAnalyticsService;
  private readonly maintenanceService: ChatSessionMaintenanceService;
  private readonly tableName = 'chat_sessions';

  constructor(supabaseClient?: SupabaseClient) {
    const supabase = supabaseClient ?? createClient();
    this.queryService = new ChatSessionQueryService(supabase);
    this.analyticsService = new ChatSessionAnalyticsService(supabase);
    this.maintenanceService = new ChatSessionMaintenanceService(supabase);
  }

  async findById(id: string): Promise<ChatSession | null> {
    return this.queryService.findById(id);
  }

  async findBySessionToken(sessionToken: string): Promise<ChatSession | null> {
    return this.queryService.findBySessionToken(sessionToken);
  }

  async findActiveByChatbotConfigId(chatbotConfigId: string): Promise<ChatSession[]> {
    return this.queryService.findActiveByChatbotConfigId(chatbotConfigId);
  }

  async findByVisitorId(visitorId: string): Promise<ChatSession[]> {
    return this.queryService.findByVisitorId(visitorId);
  }

  async findByOrganizationIdWithPagination(
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
  }> {
    return this.queryService.findByOrganizationIdWithPagination(
      organizationId,
      page,
      limit,
      filters
    );
  }

  async save(session: ChatSession): Promise<ChatSession> {
    return this.queryService.save(session);
  }

  async update(session: ChatSession): Promise<ChatSession> {
    return this.queryService.update(session);
  }

  async delete(id: string): Promise<void> {
    return this.queryService.delete(id);
  }

  async findExpiredSessions(timeoutMinutes: number): Promise<ChatSession[]> {
    return this.maintenanceService.findExpiredSessions(timeoutMinutes);
  }

  async markExpiredAsAbandoned(timeoutMinutes: number): Promise<number> {
    return this.maintenanceService.markExpiredAsAbandoned(timeoutMinutes);
  }

  async getAnalytics(
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
  }> {
    return this.analyticsService.getAnalytics(organizationId, dateFrom, dateTo);
  }

  async findRecentByVisitorId(visitorId: string, limit: number): Promise<ChatSession[]> {
    return this.queryService.findRecentByVisitorId(visitorId, limit);
  }

  async countActiveByChatbotConfigId(chatbotConfigId: string): Promise<number> {
    return this.queryService.countActiveByChatbotConfigId(chatbotConfigId);
  }
} 