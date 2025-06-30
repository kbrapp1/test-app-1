/**
 * Chat Session Query Service
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Database queries for chat sessions
 * - Handle all Supabase query operations
 * - Keep under 200-250 lines
 * - Focus on data retrieval and persistence only
 * - Follow @golden-rule patterns exactly
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { ChatSession } from '../../../../../domain/entities/ChatSession';
import { ChatSessionMapper, RawChatSessionDbRecord } from '../../mappers/ChatSessionMapper';
import { DatabaseError } from '../../../../../../errors/base';

export class ChatSessionQueryService {
  private readonly tableName = 'chat_sessions';

  constructor(private readonly supabase: SupabaseClient) {}

  async findById(id: string): Promise<ChatSession | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new DatabaseError('Failed to find chat session by ID', error.message);
    }

    return ChatSessionMapper.toDomain(data as RawChatSessionDbRecord);
  }

  async findBySessionToken(sessionToken: string): Promise<ChatSession | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('session_token', sessionToken)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new DatabaseError('Failed to find chat session by token', error.message);
    }

    return ChatSessionMapper.toDomain(data as RawChatSessionDbRecord);
  }

  async findActiveByChatbotConfigId(chatbotConfigId: string): Promise<ChatSession[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('chatbot_config_id', chatbotConfigId)
      .eq('status', 'active')
      .order('last_activity_at', { ascending: false });

    if (error) {
      throw new DatabaseError('Failed to find active chat sessions', error.message);
    }

    return (data || []).map(record => ChatSessionMapper.toDomain(record as RawChatSessionDbRecord));
  }

  async findByVisitorId(visitorId: string): Promise<ChatSession[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('visitor_id', visitorId)
      .order('started_at', { ascending: false });

    if (error) {
      throw new DatabaseError('Failed to find chat sessions by visitor ID', error.message);
    }

    return (data || []).map(record => ChatSessionMapper.toDomain(record as RawChatSessionDbRecord));
  }

  async findByOrganizationIdWithPagination(
    organizationId: string,
    page: number,
    limit: number,
    filters?: {
      status?: string;
      dateFrom?: Date;
      dateTo?: Date;
      hasLead?: boolean;
    }
  ): Promise<{
    sessions: ChatSession[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    let baseQuery = this.supabase
      .from(this.tableName)
      .select('*, chatbot_configs!inner(organization_id)', { count: 'exact' })
      .eq('chatbot_configs.organization_id', organizationId);

    // Apply filters
    if (filters?.status) {
      baseQuery = baseQuery.eq('status', filters.status);
    }
    if (filters?.dateFrom) {
      baseQuery = baseQuery.gte('started_at', filters.dateFrom.toISOString());
    }
    if (filters?.dateTo) {
      baseQuery = baseQuery.lte('started_at', filters.dateTo.toISOString());
    }
    if (filters?.hasLead !== undefined) {
      if (filters.hasLead) {
        baseQuery = baseQuery.not('lead_qualification_state->qualificationStatus', 'eq', 'not_started');
      } else {
        baseQuery = baseQuery.eq('lead_qualification_state->qualificationStatus', 'not_started');
      }
    }

    // Get total count first
    const { count, error: countError } = await baseQuery;
    if (countError) {
      throw new DatabaseError('Failed to count chat sessions', countError.message);
    }

    // Get paginated data
    const { data, error } = await baseQuery
      .order('started_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (error) {
      throw new DatabaseError('Failed to find chat sessions with pagination', error.message);
    }

    const sessions = (data || []).map(record => ChatSessionMapper.toDomain(record as RawChatSessionDbRecord));
    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    return {
      sessions,
      total,
      page,
      limit,
      totalPages,
    };
  }

  async save(session: ChatSession): Promise<ChatSession> {
    const insertData = ChatSessionMapper.toInsert(session);
    
    const { data, error } = await this.supabase
      .from(this.tableName)
      .insert(insertData)
      .select()
      .single();

    if (error) {
      throw new DatabaseError('Failed to save chat session', error.message);
    }

    return ChatSessionMapper.toDomain(data as RawChatSessionDbRecord);
  }

  async update(session: ChatSession): Promise<ChatSession> {
    const updateData = ChatSessionMapper.toUpdate(session);
    
    const { data, error } = await this.supabase
      .from(this.tableName)
      .update(updateData)
      .eq('id', session.id)
      .select()
      .single();

    if (error) {
      throw new DatabaseError('Failed to update chat session', error.message);
    }

    return ChatSessionMapper.toDomain(data as RawChatSessionDbRecord);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from(this.tableName)
      .delete()
      .eq('id', id);

    if (error) {
      throw new DatabaseError('Failed to delete chat session', error.message);
    }
  }

  async findRecentByVisitorId(visitorId: string, limit: number): Promise<ChatSession[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('visitor_id', visitorId)
      .order('started_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new DatabaseError('Failed to find recent sessions by visitor ID', error.message);
    }

    return (data || []).map(record => ChatSessionMapper.toDomain(record as RawChatSessionDbRecord));
  }

  async countActiveByChatbotConfigId(chatbotConfigId: string): Promise<number> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('id')
      .eq('chatbot_config_id', chatbotConfigId)
      .eq('status', 'active');

    if (error) {
      throw new DatabaseError('Failed to count active sessions', error.message);
    }

    return data?.length || 0;
  }
} 