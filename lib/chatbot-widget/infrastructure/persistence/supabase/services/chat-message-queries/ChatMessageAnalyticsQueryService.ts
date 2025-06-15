/**
 * Chat Message Analytics Query Service
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Analytics and metrics queries for chat messages
 * - Handle complex analytics calculations and filtering
 * - Keep under 200-250 lines
 * - Focus on analytics operations only
 * - Follow @golden-rule patterns exactly
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { ChatMessage } from '../../../../../domain/entities/ChatMessage';
import { ChatMessageMapper, RawChatMessageDbRecord } from '../../mappers/ChatMessageMapper';
import { DatabaseError } from '@/lib/errors/base';

export class ChatMessageAnalyticsQueryService {
  private readonly tableName = 'chat_messages';

  constructor(private readonly supabase: SupabaseClient) {}

  async findByIntentDetected(
    organizationId: string,
    intent: string,
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
      .eq('metadata->>intentDetected', intent);

    if (dateFrom) {
      query = query.gte('timestamp', dateFrom.toISOString());
    }
    if (dateTo) {
      query = query.lte('timestamp', dateTo.toISOString());
    }

    const { data, error } = await query
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) {
      throw new DatabaseError('Failed to find messages by intent', error.message);
    }

    return (data || []).map(record => ChatMessageMapper.toDomain(record as RawChatMessageDbRecord));
  }

  async findBySentiment(
    organizationId: string,
    sentiment: 'positive' | 'neutral' | 'negative',
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
      .eq('metadata->>sentiment', sentiment);

    if (dateFrom) {
      query = query.gte('timestamp', dateFrom.toISOString());
    }
    if (dateTo) {
      query = query.lte('timestamp', dateTo.toISOString());
    }

    const { data, error } = await query
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) {
      throw new DatabaseError('Failed to find messages by sentiment', error.message);
    }

    return (data || []).map(record => ChatMessageMapper.toDomain(record as RawChatMessageDbRecord));
  }

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

  async findLowConfidenceMessages(
    organizationId: string,
    maxConfidence: number = 0.5,
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
      .lte('metadata->>confidence', maxConfidence.toString())
      .not('metadata->>confidence', 'is', null);

    if (dateFrom) {
      query = query.gte('timestamp', dateFrom.toISOString());
    }
    if (dateTo) {
      query = query.lte('timestamp', dateTo.toISOString());
    }

    const { data, error } = await query
      .order('metadata->>confidence', { ascending: true })
      .limit(limit);

    if (error) {
      throw new DatabaseError('Failed to find low-confidence messages', error.message);
    }

    return (data || []).map(record => ChatMessageMapper.toDomain(record as RawChatMessageDbRecord));
  }

  async findMessagesByModel(
    organizationId: string,
    model: string,
    dateFrom?: Date,
    dateTo?: Date,
    limit: number = 100
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
      .eq('metadata->>aiModel', model);

    if (dateFrom) {
      query = query.gte('timestamp', dateFrom.toISOString());
    }
    if (dateTo) {
      query = query.lte('timestamp', dateTo.toISOString());
    }

    const { data, error } = await query
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) {
      throw new DatabaseError('Failed to find messages by model', error.message);
    }

    return (data || []).map(record => ChatMessageMapper.toDomain(record as RawChatMessageDbRecord));
  }

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
} 