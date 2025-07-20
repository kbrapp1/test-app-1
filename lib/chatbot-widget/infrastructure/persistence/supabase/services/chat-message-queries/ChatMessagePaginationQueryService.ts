/**
 * Chat Message Pagination Query Service
 * 
 * RESPONSIBILITIES:
 * - Complex pagination operations
 * - Paginated queries with counting
 * - Pagination result formatting
 * - Performance-optimized pagination patterns
 * 
 * DDD LAYER: Infrastructure (persistence)
 * FILE SIZE: 60-80 lines (focused on pagination operations)
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Pagination and counting operations
 * - Complex pagination logic with total counts
 * - Performance-optimized for large datasets
 * - Maintain organization security boundaries
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { ChatMessage } from '../../../../../domain/entities/ChatMessage';
import { ChatMessageMapper, RawChatMessageDbRecord } from '../../mappers/ChatMessageMapper';
import { DatabaseError } from '../../../../../domain/errors/ChatbotWidgetDomainErrors';

export interface PaginatedChatMessages {
  messages: ChatMessage[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class ChatMessagePaginationQueryService {
  private readonly tableName = 'chat_messages';

  constructor(private readonly supabase: SupabaseClient) {}

  /**
   * Find messages by session ID with pagination
   * 
   * AI INSTRUCTIONS:
   * - Primary pagination method for session message history
   * - Includes total count for pagination UI
   * - Ordered by timestamp descending for recent-first display
   * - Performance optimized with separate count and data queries
   */
  async findBySessionIdWithPagination(
    sessionId: string,
    page: number,
    limit: number
  ): Promise<PaginatedChatMessages> {
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
}