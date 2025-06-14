import { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { ChatMessage } from '../../../../domain/entities/ChatMessage';
import { ChatMessageMapper, RawChatMessageDbRecord } from '../mappers/ChatMessageMapper';
import { DatabaseError } from '@/lib/errors/base';

/**
 * Chat Message Query Service
 * 
 * Single responsibility: Complex queries, search, and pagination for chat messages
 * Following DDD infrastructure layer patterns with focused query operations
 */
export class ChatMessageQueryService {
  private supabase: SupabaseClient;
  private readonly tableName = 'chat_messages';

  constructor(supabaseClient?: SupabaseClient) {
    this.supabase = supabaseClient ?? createClient();
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

    // Apply filters
    if (filters?.messageType) {
      query = query.eq('message_type', filters.messageType);
    }
    if (filters?.dateFrom) {
      query = query.gte('timestamp', filters.dateFrom.toISOString());
    }
    if (filters?.dateTo) {
      query = query.lte('timestamp', filters.dateTo.toISOString());
    }
    if (filters?.sessionId) {
      query = query.eq('session_id', filters.sessionId);
    }
    if (filters?.sentiment) {
      query = query.eq('metadata->>sentiment', filters.sentiment);
    }
    if (filters?.hasErrors) {
      query = query.not('metadata->>errorType', 'is', null);
    }

    const { data, error } = await query
      .order('timestamp', { ascending: false })
      .limit(100);

    if (error) {
      throw new DatabaseError('Failed to search messages by content', error.message);
    }

    return (data || []).map(record => ChatMessageMapper.toDomain(record as RawChatMessageDbRecord));
  }

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
} 