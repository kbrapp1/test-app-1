/**
 * Chat Message Basic Query Service (Refactored)
 * 
 * RESPONSIBILITIES:
 * - Basic CRUD operations for chat messages
 * - Simple session and ID-based queries
 * - Core message retrieval functionality
 * 
 * DDD LAYER: Infrastructure (persistence)
 * FILE SIZE: 80-100 lines (focused on basic operations)
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Basic chat message CRUD queries
 * - No complex analytics or specialized operations
 * - Focus on fundamental query operations only
 * - Maintain organization security boundaries
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { ChatMessage } from '../../../../../domain/entities/ChatMessage';
import { ChatMessageMapper, RawChatMessageDbRecord } from '../../mappers/ChatMessageMapper';
import { DatabaseError } from '../../../../../domain/errors/ChatbotWidgetDomainErrors';

export class ChatMessageBasicQueryService {
  private readonly tableName = 'chat_messages';

  constructor(private readonly supabase: SupabaseClient) {}

  /**
   * Find a single message by ID
   */
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

  /**
   * Find all messages for a session (ordered chronologically)
   */
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

  /**
   * Count total messages in a session
   */
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
   * Find recent messages for an organization (basic filtering)
   */
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
}