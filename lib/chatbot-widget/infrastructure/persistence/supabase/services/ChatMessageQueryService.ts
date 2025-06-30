/**
 * Chat Message Query Service
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Coordinate chat message query operations
 * - Delegate specialized queries to focused services
 * - Keep under 200-250 lines by extracting query services
 * - Use composition pattern for complex operations
 * - Follow @golden-rule patterns exactly
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '../../../../../supabase/server';
import { ChatMessage } from '../../../../domain/entities/ChatMessage';
import { 
  ChatMessageBasicQueryService,
  ChatMessageSearchService,
  ChatMessageAnalyticsQueryService
} from './chat-message-queries';

export class ChatMessageQueryService {
  private readonly basicQueryService: ChatMessageBasicQueryService;
  private readonly searchService: ChatMessageSearchService;
  private readonly analyticsQueryService: ChatMessageAnalyticsQueryService;

  constructor(supabaseClient?: SupabaseClient) {
    const supabase = supabaseClient ?? createClient();
    this.basicQueryService = new ChatMessageBasicQueryService(supabase);
    this.searchService = new ChatMessageSearchService(supabase);
    this.analyticsQueryService = new ChatMessageAnalyticsQueryService(supabase);
  }

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
    return this.basicQueryService.findBySessionIdWithPagination(sessionId, page, limit);
  }

  async findRecentByOrganizationId(organizationId: string, limit: number): Promise<ChatMessage[]> {
    return this.basicQueryService.findRecentByOrganizationId(organizationId, limit);
  }

  async searchByContent(
    organizationId: string,
    searchTerm: string,
    filters?: {
      messageType?: string;
      dateFrom?: Date;
      dateTo?: Date;
      sessionId?: string;
      sentiment?: string;
      hasErrors?: boolean;
    }
  ): Promise<ChatMessage[]> {
    return this.searchService.searchByContent(organizationId, searchTerm, filters);
  }

  async findByIntentDetected(
    organizationId: string,
    intent: string,
    dateFrom?: Date,
    dateTo?: Date,
    limit: number = 50
  ): Promise<ChatMessage[]> {
    return this.analyticsQueryService.findByIntentDetected(organizationId, intent, dateFrom, dateTo, limit);
  }

  async findBySentiment(
    organizationId: string,
    sentiment: 'positive' | 'neutral' | 'negative',
    dateFrom?: Date,
    dateTo?: Date,
    limit: number = 50
  ): Promise<ChatMessage[]> {
    return this.analyticsQueryService.findBySentiment(organizationId, sentiment, dateFrom, dateTo, limit);
  }

  async findHighCostMessages(
    organizationId: string,
    minCostCents: number,
    dateFrom?: Date,
    dateTo?: Date,
    limit: number = 50
  ): Promise<ChatMessage[]> {
    return this.analyticsQueryService.findHighCostMessages(organizationId, minCostCents, dateFrom, dateTo, limit);
  }

  async findLowConfidenceMessages(
    organizationId: string,
    maxConfidence: number = 0.5,
    dateFrom?: Date,
    dateTo?: Date,
    limit: number = 50
  ): Promise<ChatMessage[]> {
    return this.analyticsQueryService.findLowConfidenceMessages(organizationId, maxConfidence, dateFrom, dateTo, limit);
  }

  async findMessagesByModel(
    organizationId: string,
    model: string,
    dateFrom?: Date,
    dateTo?: Date,
    limit: number = 100
  ): Promise<ChatMessage[]> {
    return this.analyticsQueryService.findMessagesByModel(organizationId, model, dateFrom, dateTo, limit);
  }
} 