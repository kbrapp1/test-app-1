/**
 * Chat Message Performance Query Service
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Performance and cost analytics queries
 * - Handle cost tracking, response time analysis, and token usage
 * - Keep under 200-250 lines per @golden-rule patterns
 * - Focus on performance metrics and cost optimization
 * - Follow existing mapper and error patterns exactly
 * - Always validate organizationId for security isolation
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { ChatMessage } from '../../../../../domain/entities/ChatMessage';
import { ChatMessageMapper, RawChatMessageDbRecord } from '../../mappers/ChatMessageMapper';
import { DatabaseError } from '../../../../../domain/errors/ChatbotWidgetDomainErrors';

export class ChatMessagePerformanceQueryService {
  private readonly tableName = 'chat_messages';

  constructor(private readonly supabase: SupabaseClient) {}

  /**
   * Find messages with high API costs for cost optimization
   * 
   * AI INSTRUCTIONS:
   * - Queries metadata for costCents field
   * - Used for identifying expensive operations
   * - Helps with cost monitoring and optimization
   */
  async findHighCostMessages(
    organizationId: string,
    minCostCents: number,
    dateFrom?: Date,
    dateTo?: Date,
    limit: number = 50
  ): Promise<ChatMessage[]> {
    let query = this.supabase
      .from(this.tableName)
      .select(`
        *,
        chat_sessions!inner(
          chatbot_config_id,
          chatbot_configs!inner(organization_id)
        )
      `)
      .eq('chat_sessions.chatbot_configs.organization_id', organizationId)
      .gte('metadata->>costCents', minCostCents.toString());

    if (dateFrom) {
      query = query.gte('timestamp', dateFrom.toISOString());
    }
    if (dateTo) {
      query = query.lte('timestamp', dateTo.toISOString());
    }

    const { data, error } = await query
      .order('metadata->>costCents', { ascending: false })
      .limit(limit);

    if (error) {
      throw new DatabaseError('Failed to find high-cost messages', error.message);
    }

    return (data || []).map(record => ChatMessageMapper.toDomain(record as RawChatMessageDbRecord));
  }

  /**
   * Find messages with slow response times for performance analysis
   * 
   * AI INSTRUCTIONS:
   * - Queries metadata for responseTimeMs field
   * - Filters for bot messages only (user messages don't have response times)
   * - Used for identifying performance bottlenecks
   */
  async findSlowResponseMessages(
    organizationId: string,
    minResponseTimeMs: number,
    dateFrom?: Date,
    dateTo?: Date,
    limit: number = 50
  ): Promise<ChatMessage[]> {
    let query = this.supabase
      .from(this.tableName)
      .select(`
        *,
        chat_sessions!inner(
          chatbot_config_id,
          chatbot_configs!inner(organization_id)
        )
      `)
      .eq('chat_sessions.chatbot_configs.organization_id', organizationId)
      .eq('message_type', 'bot')
      .gte('metadata->>responseTimeMs', minResponseTimeMs.toString());

    if (dateFrom) {
      query = query.gte('timestamp', dateFrom.toISOString());
    }
    if (dateTo) {
      query = query.lte('timestamp', dateTo.toISOString());
    }

    const { data, error } = await query
      .order('metadata->>responseTimeMs', { ascending: false })
      .limit(limit);

    if (error) {
      throw new DatabaseError('Failed to find slow response messages', error.message);
    }

    return (data || []).map(record => ChatMessageMapper.toDomain(record as RawChatMessageDbRecord));
  }

  /**
   * Find messages by token usage for optimization analysis
   * 
   * AI INSTRUCTIONS:
   * - Queries metadata for totalTokens field
   * - Used for token usage optimization and cost analysis
   * - Helps identify token-heavy operations
   */
  async findMessagesByTokenUsage(
    organizationId: string,
    minTokens: number,
    dateFrom?: Date,
    dateTo?: Date,
    limit: number = 50
  ): Promise<ChatMessage[]> {
    let query = this.supabase
      .from(this.tableName)
      .select(`
        *,
        chat_sessions!inner(
          chatbot_config_id,
          chatbot_configs!inner(organization_id)
        )
      `)
      .eq('chat_sessions.chatbot_configs.organization_id', organizationId)
      .gte('metadata->>totalTokens', minTokens.toString());

    if (dateFrom) {
      query = query.gte('timestamp', dateFrom.toISOString());
    }
    if (dateTo) {
      query = query.lte('timestamp', dateTo.toISOString());
    }

    const { data, error } = await query
      .order('metadata->>totalTokens', { ascending: false })
      .limit(limit);

    if (error) {
      throw new DatabaseError('Failed to find messages by token usage', error.message);
    }

    return (data || []).map(record => ChatMessageMapper.toDomain(record as RawChatMessageDbRecord));
  }

  /**
   * Find messages with high input token usage
   * 
   * AI INSTRUCTIONS:
   * - Specialized query for input token analysis
   * - Used for understanding prompt engineering efficiency
   * - Helps optimize input token usage for cost reduction
   */
  async findHighInputTokenMessages(
    organizationId: string,
    minInputTokens: number,
    dateFrom?: Date,
    dateTo?: Date,
    limit: number = 50
  ): Promise<ChatMessage[]> {
    let query = this.supabase
      .from(this.tableName)
      .select(`
        *,
        chat_sessions!inner(
          chatbot_config_id,
          chatbot_configs!inner(organization_id)
        )
      `)
      .eq('chat_sessions.chatbot_configs.organization_id', organizationId)
      .gte('metadata->>inputTokens', minInputTokens.toString());

    if (dateFrom) {
      query = query.gte('timestamp', dateFrom.toISOString());
    }
    if (dateTo) {
      query = query.lte('timestamp', dateTo.toISOString());
    }

    const { data, error } = await query
      .order('metadata->>inputTokens', { ascending: false })
      .limit(limit);

    if (error) {
      throw new DatabaseError('Failed to find messages with high input tokens', error.message);
    }

    return (data || []).map(record => ChatMessageMapper.toDomain(record as RawChatMessageDbRecord));
  }

  /**
   * Find messages with high output token usage
   * 
   * AI INSTRUCTIONS:
   * - Specialized query for output token analysis
   * - Used for understanding response generation efficiency
   * - Helps optimize response length and generation costs
   */
  async findHighOutputTokenMessages(
    organizationId: string,
    minOutputTokens: number,
    dateFrom?: Date,
    dateTo?: Date,
    limit: number = 50
  ): Promise<ChatMessage[]> {
    let query = this.supabase
      .from(this.tableName)
      .select(`
        *,
        chat_sessions!inner(
          chatbot_config_id,
          chatbot_configs!inner(organization_id)
        )
      `)
      .eq('chat_sessions.chatbot_configs.organization_id', organizationId)
      .gte('metadata->>outputTokens', minOutputTokens.toString());

    if (dateFrom) {
      query = query.gte('timestamp', dateFrom.toISOString());
    }
    if (dateTo) {
      query = query.lte('timestamp', dateTo.toISOString());
    }

    const { data, error } = await query
      .order('metadata->>outputTokens', { ascending: false })
      .limit(limit);

    if (error) {
      throw new DatabaseError('Failed to find messages with high output tokens', error.message);
    }

    return (data || []).map(record => ChatMessageMapper.toDomain(record as RawChatMessageDbRecord));
  }
}