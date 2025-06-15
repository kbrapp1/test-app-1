/**
 * Chat Message Query Service
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Database queries for chat messages
 * - Handle all Supabase query operations
 * - Keep under 200-250 lines
 * - Focus on data retrieval only
 * - Follow @golden-rule patterns exactly
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { ChatMessage } from '../../../../../domain/entities/ChatMessage';
import { ChatMessageMapper, RawChatMessageDbRecord } from '../../mappers/ChatMessageMapper';
import { DatabaseError } from '@/lib/errors/base';

export class ChatMessageQueryService {
  private readonly tableName = 'chat_messages';

  constructor(private readonly supabase: SupabaseClient) {}

  async getMessagesForOrganization(
    organizationId: string,
    dateFrom: Date,
    dateTo: Date
  ): Promise<ChatMessage[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select(`
        *,
        chat_sessions!inner(
          chatbot_config_id,
          chatbot_configs!inner(organization_id)
        )
      `)
      .eq('chat_sessions.chatbot_configs.organization_id', organizationId)
      .gte('timestamp', dateFrom.toISOString())
      .lte('timestamp', dateTo.toISOString())
      .order('session_id, timestamp', { ascending: true });

    if (error) {
      throw new DatabaseError('Failed to get messages for organization', error.message);
    }

    return (data || []).map(record => ChatMessageMapper.toDomain(record as RawChatMessageDbRecord));
  }

  async findMessagesWithErrors(
    organizationId: string,
    dateFrom: Date,
    dateTo: Date
  ): Promise<ChatMessage[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select(`
        *,
        chat_sessions!inner(
          chatbot_config_id,
          chatbot_configs!inner(organization_id)
        )
      `)
      .eq('chat_sessions.chatbot_configs.organization_id', organizationId)
      .gte('timestamp', dateFrom.toISOString())
      .lte('timestamp', dateTo.toISOString())
      .not('metadata->>errorType', 'is', null)
      .order('timestamp', { ascending: false });

    if (error) {
      throw new DatabaseError('Failed to find messages with errors', error.message);
    }

    return (data || []).map(record => ChatMessageMapper.toDomain(record as RawChatMessageDbRecord));
  }

  async getMessagesBySession(
    sessionId: string,
    dateFrom?: Date,
    dateTo?: Date
  ): Promise<ChatMessage[]> {
    let query = this.supabase
      .from(this.tableName)
      .select('*')
      .eq('session_id', sessionId)
      .order('timestamp', { ascending: true });

    if (dateFrom) {
      query = query.gte('timestamp', dateFrom.toISOString());
    }

    if (dateTo) {
      query = query.lte('timestamp', dateTo.toISOString());
    }

    const { data, error } = await query;

    if (error) {
      throw new DatabaseError('Failed to get messages by session', error.message);
    }

    return (data || []).map(record => ChatMessageMapper.toDomain(record as RawChatMessageDbRecord));
  }

  async getMessagesByType(
    organizationId: string,
    messageType: 'user' | 'bot' | 'system',
    dateFrom: Date,
    dateTo: Date
  ): Promise<ChatMessage[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select(`
        *,
        chat_sessions!inner(
          chatbot_config_id,
          chatbot_configs!inner(organization_id)
        )
      `)
      .eq('chat_sessions.chatbot_configs.organization_id', organizationId)
      .eq('message_type', messageType)
      .gte('timestamp', dateFrom.toISOString())
      .lte('timestamp', dateTo.toISOString())
      .order('timestamp', { ascending: true });

    if (error) {
      throw new DatabaseError(`Failed to get ${messageType} messages`, error.message);
    }

    return (data || []).map(record => ChatMessageMapper.toDomain(record as RawChatMessageDbRecord));
  }
} 