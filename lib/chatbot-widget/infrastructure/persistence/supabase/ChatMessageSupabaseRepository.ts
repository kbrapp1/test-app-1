import { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { IChatMessageRepository } from '../../../domain/repositories/IChatMessageRepository';
import { ChatMessage } from '../../../domain/entities/ChatMessage';
import { ChatMessageCrudService } from './services/ChatMessageCrudService';
import { ChatMessageAnalyticsService } from './services/ChatMessageAnalyticsService';
import { ChatMessageQueryService } from './services/ChatMessageQueryService';

/**
 * Refactored ChatMessage Repository Implementation
 * 
 * Follows DDD principles with focused services:
 * - Single Responsibility: Delegates to specialized services
 * - Clean Architecture: Maintains repository interface while using composition
 * - Under 200 lines: Focused coordination instead of monolithic implementation
 */
export class ChatMessageSupabaseRepository implements IChatMessageRepository {
  private crudService: ChatMessageCrudService;
  private analyticsService: ChatMessageAnalyticsService;
  private queryService: ChatMessageQueryService;

  constructor(supabaseClient?: SupabaseClient) {
    const supabase = supabaseClient ?? createClient();
    this.crudService = new ChatMessageCrudService(supabase);
    this.analyticsService = new ChatMessageAnalyticsService(supabase);
    this.queryService = new ChatMessageQueryService(supabase);
  }

  // Basic CRUD operations - delegated to CrudService
  async findById(id: string): Promise<ChatMessage | null> {
    return this.crudService.findById(id);
  }

  async findBySessionId(sessionId: string): Promise<ChatMessage[]> {
    return this.crudService.findBySessionId(sessionId);
  }

  async findVisibleBySessionId(sessionId: string): Promise<ChatMessage[]> {
    return this.crudService.findVisibleBySessionId(sessionId);
  }

  // Query operations - delegated to QueryService
  async findBySessionIdWithPagination(
    sessionId: string,
    page: number,
    limit: number
  ): Promise<{
    messages: ChatMessage[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    return this.queryService.findBySessionIdWithPagination(sessionId, page, limit);
  }

  // CRUD operations continued - delegated to CrudService
  async save(message: ChatMessage): Promise<ChatMessage> {
    return this.crudService.save(message);
  }

  async update(message: ChatMessage): Promise<ChatMessage> {
    return this.crudService.update(message);
  }

  async delete(id: string): Promise<void> {
    return this.crudService.delete(id);
  }

  async deleteBySessionId(sessionId: string): Promise<void> {
    return this.crudService.deleteBySessionId(sessionId);
  }

  async findRecentByOrganizationId(organizationId: string, limit: number): Promise<ChatMessage[]> {
    return this.queryService.findRecentByOrganizationId(organizationId, limit);
  }

  async searchByContent(
    organizationId: string,
    searchTerm: string,
    filters?: {
      messageType?: string;
      dateFrom?: Date;
      dateTo?: Date;
      sessionId?: string;
    }
  ): Promise<ChatMessage[]> {
    return this.queryService.searchByContent(organizationId, searchTerm, filters);
  }

  // Analytics operations - delegated to AnalyticsService
  async getAnalytics(
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
  }> {
    return this.analyticsService.getAnalytics(organizationId, dateFrom, dateTo);
  }

  async findLastBySessionId(sessionId: string): Promise<ChatMessage | null> {
    return this.crudService.findLastBySessionId(sessionId);
  }

  async countByTypeAndSessionId(sessionId: string): Promise<{
    user: number;
    bot: number;
    system: number;
    lead_capture: number;
    qualification: number;
  }> {
    return this.crudService.countByTypeAndSessionId(sessionId);
  }

  async findMessagesWithErrors(
    organizationId: string,
    dateFrom: Date,
    dateTo: Date
  ): Promise<ChatMessage[]> {
    return this.analyticsService.findMessagesWithErrors(organizationId, dateFrom, dateTo);
  }

  async getResponseTimeMetrics(
    organizationId: string,
    dateFrom: Date,
    dateTo: Date,
    groupBy: 'hour' | 'day' | 'week'
  ): Promise<Array<{ period: string; avgResponseTime: number; messageCount: number }>> {
    return this.analyticsService.getResponseTimeMetrics(organizationId, dateFrom, dateTo, groupBy);
  }
} 