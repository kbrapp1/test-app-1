/**
 * Chat Message Basic Query Service
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Basic chat message queries and pagination
 * - Handle fundamental query operations
 * - Keep under 200-250 lines
 * - Focus on basic query operations only
 * - Follow @golden-rule patterns exactly
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { ChatMessage } from '../../../../../domain/entities/ChatMessage';
import { ChatMessageMapper, RawChatMessageDbRecord } from '../../mappers/ChatMessageMapper';
import { DatabaseError } from '../../../../../domain/errors/ChatbotWidgetDomainErrors';

export class ChatMessageBasicQueryService {
  private readonly tableName = 'chat_messages';

  constructor(private readonly supabase: SupabaseClient) {}

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
    // Get total count
    const { count, error: countError } = await this.supabase
      .from(this.tableName)
      .select('id', { count: 'exact', head: true })
      .eq('session_id', sessionId);

    if (countError) {
      throw new DatabaseError('Failed to count chat messages', countError.message);
    }

    // Get paginated data
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('session_id', sessionId)
      .order('timestamp', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (error) {
      throw new DatabaseError('Failed to find chat messages with pagination', error.message);
    }

    const messages = (data || []).map(record => ChatMessageMapper.toDomain(record as RawChatMessageDbRecord));
    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    return {
      messages,
      total,
      page,
      limit,
      totalPages,
    };
  }

  async findRecentByOrganizationId(organizationId: string, limit: number): Promise<ChatMessage[]> {
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
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) {
      throw new DatabaseError('Failed to find recent messages by organization', error.message);
    }

    return (data || []).map(record => ChatMessageMapper.toDomain(record as RawChatMessageDbRecord));
  }

  async findBySessionId(sessionId: string, limit?: number): Promise<ChatMessage[]> {
    let query = this.supabase
      .from(this.tableName)
      .select('*')
      .eq('session_id', sessionId)
      .order('timestamp', { ascending: true });

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      throw new DatabaseError('Failed to find messages by session ID', error.message);
    }

    return (data || []).map(record => ChatMessageMapper.toDomain(record as RawChatMessageDbRecord));
  }

  async findById(messageId: string): Promise<ChatMessage | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('id', messageId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new DatabaseError('Failed to find message by ID', error.message);
    }

    return ChatMessageMapper.toDomain(data as RawChatMessageDbRecord);
  }

  async findByMessageType(
    organizationId: string,
    messageType: 'user' | 'bot',
    limit: number = 100
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
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) {
      throw new DatabaseError('Failed to find messages by type', error.message);
    }

    return (data || []).map(record => ChatMessageMapper.toDomain(record as RawChatMessageDbRecord));
  }

  async countBySessionId(sessionId: string): Promise<number> {
    const { count, error } = await this.supabase
      .from(this.tableName)
      .select('id', { count: 'exact', head: true })
      .eq('session_id', sessionId);

    if (error) {
      throw new DatabaseError('Failed to count messages by session ID', error.message);
    }

    return count || 0;
  }

  /**
   * Get all messages for an organization within date range
   * 
   * AI INSTRUCTIONS:
   * - Primary method for organization-scoped message retrieval with date filtering
   * - Uses RLS-compliant join pattern for security
   * - Ordered by session and timestamp for conversation flow
   */
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

  /**
   * Find messages with errors for troubleshooting
   * 
   * AI INSTRUCTIONS:
   * - Specialized query for error analysis and debugging
   * - Filters for messages with errorType metadata present
   * - Ordered by timestamp descending for recent errors first
   */
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

  /**
   * Get messages by session with optional date filtering
   * Enhanced version that supports date range filtering
   * 
   * AI INSTRUCTIONS:
   * - Session-scoped retrieval for conversation history
   * - Optional date filtering for performance optimization
   * - Ordered chronologically for conversation flow
   */
  async getMessagesBySessionWithDateRange(
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
      throw new DatabaseError('Failed to get messages by session with date range', error.message);
    }

    return (data || []).map(record => ChatMessageMapper.toDomain(record as RawChatMessageDbRecord));
  }

  /**
   * Enhanced message type filtering with date range support
   * 
   * AI INSTRUCTIONS:
   * - Type-specific filtering for user, bot, or system messages
   * - Maintains organization security boundary
   * - Adds date range filtering for time-scoped analysis
   */
  async getMessagesByTypeWithDateRange(
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
      throw new DatabaseError(`Failed to get ${messageType} messages with date range`, error.message);
    }

    return (data || []).map(record => ChatMessageMapper.toDomain(record as RawChatMessageDbRecord));
  }
} 