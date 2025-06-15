/**
 * Chat Message Analytics Service
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Coordinate analytics data retrieval
 * - Delegate calculations to domain services
 * - Keep under 200-250 lines by extracting specialized services
 * - Use composition pattern for complex analytics
 * - Follow @golden-rule patterns exactly
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { ChatMessage } from '../../../../domain/entities/ChatMessage';
import { ChatMessageMapper, RawChatMessageDbRecord } from '../mappers/ChatMessageMapper';
import { DatabaseError } from '@/lib/errors/base';
import { 
  ChatMessageQueryService,
  AnalyticsCalculationService,
  ResponseTimeAnalyticsService,
  CostAnalyticsService
} from './analytics';

export interface ChatAnalyticsResult {
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
}

export interface ResponseTimeMetrics {
  period: string;
  avgResponseTime: number;
  messageCount: number;
}

export interface CostAnalytics {
  totalCostCents: number;
  avgCostPerMessage: number;
  costByModel: Array<{ model: string; totalCents: number; messageCount: number }>;
  costTrend: Array<{ date: string; totalCents: number }>;
}

export class ChatMessageAnalyticsService {
  private queryService: ChatMessageQueryService;
  private calculationService: AnalyticsCalculationService;
  private responseTimeService: ResponseTimeAnalyticsService;
  private costService: CostAnalyticsService;

  constructor(supabaseClient?: SupabaseClient) {
    const supabase = supabaseClient ?? createClient();
    
    this.queryService = new ChatMessageQueryService(supabase);
    this.calculationService = new AnalyticsCalculationService();
    this.responseTimeService = new ResponseTimeAnalyticsService();
    this.costService = new CostAnalyticsService();
  }

  async getAnalytics(
    organizationId: string,
    dateFrom: Date,
    dateTo: Date
  ): Promise<ChatAnalyticsResult> {
    const messages = await this.queryService.getMessagesForOrganization(
      organizationId,
      dateFrom,
      dateTo
    );
    
    return this.calculationService.calculateAnalytics(messages);
  }

  async findMessagesWithErrors(
    organizationId: string,
    dateFrom: Date,
    dateTo: Date
  ): Promise<ChatMessage[]> {
    return this.queryService.findMessagesWithErrors(organizationId, dateFrom, dateTo);
  }

  async getResponseTimeMetrics(
    organizationId: string,
    dateFrom: Date,
    dateTo: Date,
    groupBy: 'hour' | 'day' | 'week'
  ): Promise<ResponseTimeMetrics[]> {
    const messages = await this.queryService.getMessagesForOrganization(
      organizationId,
      dateFrom,
      dateTo
    );
    
    return this.responseTimeService.calculateResponseTimeMetrics(messages, groupBy);
  }

  async getCostAnalytics(
    organizationId: string,
    dateFrom: Date,
    dateTo: Date
  ): Promise<CostAnalytics> {
    const messages = await this.queryService.getMessagesForOrganization(
      organizationId,
      dateFrom,
      dateTo
    );
    
    return this.costService.calculateCostAnalytics(messages);
  }
} 