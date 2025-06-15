/**
 * Chat Message Search Service
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Search and filter chat messages
 * - Handle complex search queries and filtering
 * - Keep under 200-250 lines
 * - Focus on search operations only
 * - Follow @golden-rule patterns exactly
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { ChatMessage } from '../../../../../domain/entities/ChatMessage';
import { ChatMessageMapper, RawChatMessageDbRecord } from '../../mappers/ChatMessageMapper';
import { DatabaseError } from '@/lib/errors/base';

export interface SearchFilters {
  messageType?: string;
  dateFrom?: Date;
  dateTo?: Date;
  sessionId?: string;
  sentiment?: string;
  hasErrors?: boolean;
}

export class ChatMessageSearchService {
  private readonly tableName = 'chat_messages';

  constructor(private readonly supabase: SupabaseClient) {}

  async searchByContent(
    organizationId: string,
    searchTerm: string,
    filters?: SearchFilters
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
      .ilike('content', `%${searchTerm}%`);

    query = this.applyFilters(query, filters);

    const { data, error } = await query
      .order('timestamp', { ascending: false })
      .limit(100);

    if (error) {
      throw new DatabaseError('Failed to search messages by content', error.message);
    }

    return (data || []).map(record => ChatMessageMapper.toDomain(record as RawChatMessageDbRecord));
  }

  async searchByKeywords(
    organizationId: string,
    keywords: string[],
    filters?: SearchFilters
  ): Promise<ChatMessage[]> {
    const searchPattern = keywords.map(keyword => `%${keyword}%`).join('|');
    
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
      .or(keywords.map(keyword => `content.ilike.%${keyword}%`).join(','));

    query = this.applyFilters(query, filters);

    const { data, error } = await query
      .order('timestamp', { ascending: false })
      .limit(100);

    if (error) {
      throw new DatabaseError('Failed to search messages by keywords', error.message);
    }

    return (data || []).map(record => ChatMessageMapper.toDomain(record as RawChatMessageDbRecord));
  }

  async findMessagesWithErrors(
    organizationId: string,
    errorType?: string,
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
      .not('metadata->>errorType', 'is', null);

    if (errorType) {
      query = query.eq('metadata->>errorType', errorType);
    }

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
      throw new DatabaseError('Failed to find messages with errors', error.message);
    }

    return (data || []).map(record => ChatMessageMapper.toDomain(record as RawChatMessageDbRecord));
  }

  async findMessagesByDateRange(
    organizationId: string,
    dateFrom: Date,
    dateTo: Date,
    messageType?: 'user' | 'bot',
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
      .gte('timestamp', dateFrom.toISOString())
      .lte('timestamp', dateTo.toISOString());

    if (messageType) {
      query = query.eq('message_type', messageType);
    }

    const { data, error } = await query
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) {
      throw new DatabaseError('Failed to find messages by date range', error.message);
    }

    return (data || []).map(record => ChatMessageMapper.toDomain(record as RawChatMessageDbRecord));
  }

  async findMessagesBySession(
    sessionId: string,
    searchTerm?: string,
    messageType?: 'user' | 'bot'
  ): Promise<ChatMessage[]> {
    let query = this.supabase
      .from(this.tableName)
      .select('*')
      .eq('session_id', sessionId);

    if (searchTerm) {
      query = query.ilike('content', `%${searchTerm}%`);
    }

    if (messageType) {
      query = query.eq('message_type', messageType);
    }

    const { data, error } = await query
      .order('timestamp', { ascending: true });

    if (error) {
      throw new DatabaseError('Failed to find messages by session', error.message);
    }

    return (data || []).map(record => ChatMessageMapper.toDomain(record as RawChatMessageDbRecord));
  }

  private applyFilters(query: any, filters?: SearchFilters): any {
    if (!filters) return query;

    if (filters.messageType) {
      query = query.eq('message_type', filters.messageType);
    }
    if (filters.dateFrom) {
      query = query.gte('timestamp', filters.dateFrom.toISOString());
    }
    if (filters.dateTo) {
      query = query.lte('timestamp', filters.dateTo.toISOString());
    }
    if (filters.sessionId) {
      query = query.eq('session_id', filters.sessionId);
    }
    if (filters.sentiment) {
      query = query.eq('metadata->>sentiment', filters.sentiment);
    }
    if (filters.hasErrors) {
      query = query.not('metadata->>errorType', 'is', null);
    }

    return query;
  }
} 