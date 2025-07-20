import { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '../../../../supabase/server';
import { IChatMessageRepository } from '../../../domain/repositories/IChatMessageRepository';
import { ChatMessage } from '../../../domain/entities/ChatMessage';
import { ChatMessageCrudService } from './services/ChatMessageCrudService';
import { ChatMessageAnalyticsService } from './services/ChatMessageAnalyticsService';
import { 
  ChatMessageBasicQueryService, 
  ChatMessageAnalyticsQueryService,
  ChatMessagePaginationQueryService,
  ChatMessageAdvancedAnalyticsQueryService,
  ChatMessagePerformanceQueryService,
  ChatMessageSearchService 
} from './services/chat-message-queries';
import { ChatMessageMapper } from './mappers/ChatMessageMapper';
import { DatabaseError } from '../../../domain/errors/ChatbotWidgetDomainErrors';

/**
 * Core ChatMessage Repository Implementation - No Cross-Cutting Concerns
 * 
 * Clean DDD repository focused solely on:
 * - Service delegation and coordination
 * - Direct database operations for create()
 * - Domain entity mapping
 * 
 * Cross-cutting concerns (logging, caching, etc.) handled by decorators.
 * Maintains all security patterns and organizational context.
 */
export class ChatMessageSupabaseRepositoryCore implements IChatMessageRepository {
  private crudService: ChatMessageCrudService;
  private analyticsService: ChatMessageAnalyticsService;
  private basicQueryService: ChatMessageBasicQueryService;
  private analyticsQueryService: ChatMessageAnalyticsQueryService;
  private paginationQueryService: ChatMessagePaginationQueryService;
  private advancedAnalyticsQueryService: ChatMessageAdvancedAnalyticsQueryService;
  private performanceQueryService: ChatMessagePerformanceQueryService;
  private searchService: ChatMessageSearchService;
  private supabase: SupabaseClient;

  constructor(supabaseClient?: SupabaseClient) {
    this.supabase = supabaseClient ?? createClient();
    this.crudService = new ChatMessageCrudService(this.supabase);
    this.analyticsService = new ChatMessageAnalyticsService(this.supabase);
    this.basicQueryService = new ChatMessageBasicQueryService(this.supabase);
    this.analyticsQueryService = new ChatMessageAnalyticsQueryService(this.supabase);
    this.paginationQueryService = new ChatMessagePaginationQueryService(this.supabase);
    this.advancedAnalyticsQueryService = new ChatMessageAdvancedAnalyticsQueryService(this.supabase);
    this.performanceQueryService = new ChatMessagePerformanceQueryService(this.supabase);
    this.searchService = new ChatMessageSearchService(this.supabase);
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

  async save(message: ChatMessage, _sharedLogFile: string): Promise<ChatMessage> {
    // Optimize: Use database-level upsert instead of separate existence check
    return this.crudService.upsert(message);
  }

  async update(message: ChatMessage, _sharedLogFile: string): Promise<ChatMessage> {
    return this.crudService.update(message);
  }

  async delete(id: string): Promise<void> {
    return this.crudService.delete(id);
  }

  async deleteBySessionId(sessionId: string): Promise<void> {
    return this.crudService.deleteBySessionId(sessionId);
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

  // Direct database operation for create (maintains logging integration point)
  async create(message: ChatMessage, _sharedLogFile: string): Promise<ChatMessage> {
    const insertData = ChatMessageMapper.toInsert(message);

    const { data, error } = await this.supabase
      .from('chat_messages')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      throw new DatabaseError(`Failed to create chat message: ${error.message}`);
    }

    return ChatMessageMapper.toDomain(data);
  }

  // Query operations - delegated to BasicQueryService
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
    return this.paginationQueryService.findBySessionIdWithPagination(sessionId, page, limit);
  }

  async findRecentByOrganizationId(organizationId: string, limit: number): Promise<ChatMessage[]> {
    return this.basicQueryService.findRecentByOrganizationId(organizationId, limit);
  }

  async getMessagesForOrganization(
    organizationId: string,
    dateFrom: Date,
    dateTo: Date
  ): Promise<ChatMessage[]> {
    return this.analyticsQueryService.getMessagesForOrganization(organizationId, dateFrom, dateTo);
  }

  async getMessagesByTypeWithDateRange(
    organizationId: string,
    messageType: 'user' | 'bot' | 'system',
    dateFrom: Date,
    dateTo: Date
  ): Promise<ChatMessage[]> {
    return this.analyticsQueryService.getMessagesByTypeWithDateRange(organizationId, messageType, dateFrom, dateTo);
  }

  async findMessagesWithErrors(
    organizationId: string,
    dateFrom: Date,
    dateTo: Date
  ): Promise<ChatMessage[]> {
    return this.analyticsQueryService.findMessagesWithErrors(organizationId, dateFrom, dateTo);
  }

  // Search operations - delegated to SearchService
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
    return this.searchService.searchByContent(organizationId, searchTerm, filters);
  }

  // Advanced analytics queries - delegated to AdvancedAnalyticsQueryService
  async findByIntentDetected(
    organizationId: string,
    intent: string,
    dateFrom?: Date,
    dateTo?: Date,
    limit?: number
  ): Promise<ChatMessage[]> {
    return this.advancedAnalyticsQueryService.findByIntentDetected(organizationId, intent, dateFrom, dateTo, limit);
  }

  async findBySentiment(
    organizationId: string,
    sentiment: 'positive' | 'neutral' | 'negative',
    dateFrom?: Date,
    dateTo?: Date,
    limit?: number
  ): Promise<ChatMessage[]> {
    return this.advancedAnalyticsQueryService.findBySentiment(organizationId, sentiment, dateFrom, dateTo, limit);
  }

  async findMessagesByModel(
    organizationId: string,
    model: string,
    dateFrom?: Date,
    dateTo?: Date,
    limit?: number
  ): Promise<ChatMessage[]> {
    return this.advancedAnalyticsQueryService.findMessagesByModel(organizationId, model, dateFrom, dateTo, limit);
  }

  // Performance analytics queries - delegated to PerformanceQueryService
  async findHighCostMessages(
    organizationId: string,
    minCostCents: number,
    dateFrom?: Date,
    dateTo?: Date,
    limit?: number
  ): Promise<ChatMessage[]> {
    return this.performanceQueryService.findHighCostMessages(organizationId, minCostCents, dateFrom, dateTo, limit);
  }

  async findSlowResponseMessages(
    organizationId: string,
    minResponseTimeMs: number,
    dateFrom?: Date,
    dateTo?: Date,
    limit?: number
  ): Promise<ChatMessage[]> {
    return this.performanceQueryService.findSlowResponseMessages(organizationId, minResponseTimeMs, dateFrom, dateTo, limit);
  }

  async findMessagesByTokenUsage(
    organizationId: string,
    minTokens: number,
    dateFrom?: Date,
    dateTo?: Date,
    limit?: number
  ): Promise<ChatMessage[]> {
    return this.performanceQueryService.findMessagesByTokenUsage(organizationId, minTokens, dateFrom, dateTo, limit);
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

  async getResponseTimeMetrics(
    organizationId: string,
    dateFrom: Date,
    dateTo: Date,
    groupBy: 'hour' | 'day' | 'week'
  ): Promise<Array<{ period: string; avgResponseTime: number; messageCount: number }>> {
    return this.analyticsService.getResponseTimeMetrics(organizationId, dateFrom, dateTo, groupBy);
  }
}