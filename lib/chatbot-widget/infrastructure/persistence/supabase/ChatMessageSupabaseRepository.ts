import { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { IChatMessageRepository } from '../../../domain/repositories/IChatMessageRepository';
import { ChatMessage } from '../../../domain/entities/ChatMessage';
import { ChatMessageMapper, RawChatMessageDbRecord } from './mappers/ChatMessageMapper';
import { DatabaseError } from '@/lib/errors/base';

/**
 * Supabase ChatMessage Repository Implementation
 * Follows DDD principles with clean separation of concerns
 */
export class ChatMessageSupabaseRepository implements IChatMessageRepository {
  private supabase: SupabaseClient;
  private readonly tableName = 'chat_messages';

  constructor(supabaseClient?: SupabaseClient) {
    this.supabase = supabaseClient ?? createClient();
  }

  async findById(id: string): Promise<ChatMessage | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new DatabaseError('Failed to find chat message by ID', error.message);
    }

    return ChatMessageMapper.toDomain(data as RawChatMessageDbRecord);
  }

  async findBySessionId(sessionId: string): Promise<ChatMessage[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('session_id', sessionId)
      .order('timestamp', { ascending: true });

    if (error) {
      throw new DatabaseError('Failed to find chat messages by session ID', error.message);
    }

    return (data || []).map(record => ChatMessageMapper.toDomain(record as RawChatMessageDbRecord));
  }

  async findVisibleBySessionId(sessionId: string): Promise<ChatMessage[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('session_id', sessionId)
      .eq('is_visible', true)
      .order('timestamp', { ascending: true });

    if (error) {
      throw new DatabaseError('Failed to find visible chat messages', error.message);
    }

    return (data || []).map(record => ChatMessageMapper.toDomain(record as RawChatMessageDbRecord));
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

  async save(message: ChatMessage): Promise<ChatMessage> {
    const insertData = ChatMessageMapper.toInsert(message);
    
    const { data, error } = await this.supabase
      .from(this.tableName)
      .insert(insertData)
      .select()
      .single();

    if (error) {
      throw new DatabaseError('Failed to save chat message', error.message);
    }

    return ChatMessageMapper.toDomain(data as RawChatMessageDbRecord);
  }

  async update(message: ChatMessage): Promise<ChatMessage> {
    const updateData = ChatMessageMapper.toUpdate(message);
    
    const { data, error } = await this.supabase
      .from(this.tableName)
      .update(updateData)
      .eq('id', message.id)
      .select()
      .single();

    if (error) {
      throw new DatabaseError('Failed to update chat message', error.message);
    }

    return ChatMessageMapper.toDomain(data as RawChatMessageDbRecord);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from(this.tableName)
      .delete()
      .eq('id', id);

    if (error) {
      throw new DatabaseError('Failed to delete chat message', error.message);
    }
  }

  async deleteBySessionId(sessionId: string): Promise<void> {
    const { error } = await this.supabase
      .from(this.tableName)
      .delete()
      .eq('session_id', sessionId);

    if (error) {
      throw new DatabaseError('Failed to delete chat messages by session', error.message);
    }
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

    const { data, error } = await query
      .order('timestamp', { ascending: false })
      .limit(100);

    if (error) {
      throw new DatabaseError('Failed to search messages by content', error.message);
    }

    return (data || []).map(record => ChatMessageMapper.toDomain(record as RawChatMessageDbRecord));
  }

  async getAnalytics(
    organizationId: string,
    dateFrom: Date,
    dateTo: Date
  ): Promise<{
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
  }> {
    // Get message data with organization filter
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
      .lte('timestamp', dateTo.toISOString());

    if (error) {
      throw new DatabaseError('Failed to get message analytics', error.message);
    }

    const messages = (data || []).map(record => ChatMessageMapper.toDomain(record as RawChatMessageDbRecord));
    
    // Calculate basic counts
    const totalMessages = messages.length;
    const userMessages = messages.filter(m => m.messageType === 'user').length;
    const botMessages = messages.filter(m => m.messageType === 'bot').length;
    const systemMessages = messages.filter(m => m.messageType === 'system').length;
    
    // Calculate average response time (for bot responses to user messages)
    const responseTimes: number[] = [];
    for (let i = 1; i < messages.length; i++) {
      const current = messages[i];
      const previous = messages[i - 1];
      
      if (current.messageType === 'bot' && previous.messageType === 'user') {
        const responseTime = current.timestamp.getTime() - previous.timestamp.getTime();
        responseTimes.push(responseTime);
      }
    }
    
    const avgResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length / 1000 // Convert to seconds
      : 0;

    // Calculate token and cost metrics from metadata
    let totalTokens = 0;
    let totalCostCents = 0;
    let messagesWithTokens = 0;

    messages.forEach(m => {
      if (m.metadata.tokens) {
        totalTokens += m.metadata.tokens;
        messagesWithTokens++;
      }
      if (m.metadata.costCents) {
        totalCostCents += m.metadata.costCents;
      }
    });

    const avgTokensPerMessage = messagesWithTokens > 0 ? totalTokens / messagesWithTokens : 0;

    // Calculate sentiment distribution from metadata
    const sentiments = { positive: 0, neutral: 0, negative: 0 };
    messages.forEach(m => {
      if (m.metadata.sentiment) {
        if (sentiments.hasOwnProperty(m.metadata.sentiment)) {
          sentiments[m.metadata.sentiment as keyof typeof sentiments]++;
        }
      }
    });

    // Calculate top intents from metadata
    const intentsMap = new Map<string, number>();
    messages.forEach(m => {
      if (m.metadata.intent) {
        intentsMap.set(m.metadata.intent, (intentsMap.get(m.metadata.intent) || 0) + 1);
      }
    });
    
    const topIntents = Array.from(intentsMap.entries())
      .map(([intent, count]) => ({ intent, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Calculate error rate from metadata
    const errorMessages = messages.filter(m => m.metadata.error || m.metadata.hasError).length;
    const errorRate = totalMessages > 0 ? (errorMessages / totalMessages) * 100 : 0;

    return {
      totalMessages,
      userMessages,
      botMessages,
      systemMessages,
      avgResponseTime: Math.round(avgResponseTime * 100) / 100,
      avgTokensPerMessage: Math.round(avgTokensPerMessage),
      totalTokenCost: totalCostCents,
      sentimentDistribution: sentiments,
      topIntents,
      errorRate: Math.round(errorRate * 100) / 100,
    };
  }

  async findLastBySessionId(sessionId: string): Promise<ChatMessage | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('session_id', sessionId)
      .order('timestamp', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new DatabaseError('Failed to find last message by session', error.message);
    }

    return ChatMessageMapper.toDomain(data as RawChatMessageDbRecord);
  }

  async countByTypeAndSessionId(sessionId: string): Promise<{
    user: number;
    bot: number;
    system: number;
    lead_capture: number;
    qualification: number;
  }> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('message_type')
      .eq('session_id', sessionId);

    if (error) {
      throw new DatabaseError('Failed to count messages by type', error.message);
    }

    const counts = {
      user: 0,
      bot: 0,
      system: 0,
      lead_capture: 0,
      qualification: 0,
    };

    (data || []).forEach(record => {
      if (counts.hasOwnProperty(record.message_type)) {
        counts[record.message_type as keyof typeof counts]++;
      }
    });

    return counts;
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
      .or('metadata->>error.neq.null,metadata->>hasError.eq.true')
      .order('timestamp', { ascending: false });

    if (error) {
      throw new DatabaseError('Failed to find messages with errors', error.message);
    }

    return (data || []).map(record => ChatMessageMapper.toDomain(record as RawChatMessageDbRecord));
  }

  async getResponseTimeMetrics(
    organizationId: string,
    dateFrom: Date,
    dateTo: Date,
    groupBy: 'hour' | 'day' | 'week'
  ): Promise<Array<{ period: string; avgResponseTime: number; messageCount: number }>> {
    // This is a complex query that would typically be better handled with a database function
    // For now, we'll get the raw data and process it in application code
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
      throw new DatabaseError('Failed to get response time metrics', error.message);
    }

    const messages = (data || []).map(record => ChatMessageMapper.toDomain(record as RawChatMessageDbRecord));
    
    // Group messages by session and calculate response times
    const sessionGroups = new Map<string, ChatMessage[]>();
    messages.forEach(message => {
      const sessionMessages = sessionGroups.get(message.sessionId) || [];
      sessionMessages.push(message);
      sessionGroups.set(message.sessionId, sessionMessages);
    });

    const responseTimesByPeriod = new Map<string, number[]>();
    
    sessionGroups.forEach(sessionMessages => {
      for (let i = 1; i < sessionMessages.length; i++) {
        const current = sessionMessages[i];
        const previous = sessionMessages[i - 1];
        
        if (current.messageType === 'bot' && previous.messageType === 'user') {
          const responseTime = current.timestamp.getTime() - previous.timestamp.getTime();
          const period = this.formatPeriod(current.timestamp, groupBy);
          
          const periods = responseTimesByPeriod.get(period) || [];
          periods.push(responseTime);
          responseTimesByPeriod.set(period, periods);
        }
      }
    });

    // Calculate averages for each period
    const results: Array<{ period: string; avgResponseTime: number; messageCount: number }> = [];
    
    responseTimesByPeriod.forEach((responseTimes, period) => {
      const avgResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length / 1000; // Convert to seconds
      results.push({
        period,
        avgResponseTime: Math.round(avgResponseTime * 100) / 100,
        messageCount: responseTimes.length,
      });
    });

    return results.sort((a, b) => a.period.localeCompare(b.period));
  }

  private formatPeriod(date: Date, groupBy: 'hour' | 'day' | 'week'): string {
    switch (groupBy) {
      case 'hour':
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:00`;
      case 'day':
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      case 'week':
        const startOfWeek = new Date(date);
        startOfWeek.setDate(date.getDate() - date.getDay());
        return `${startOfWeek.getFullYear()}-${String(startOfWeek.getMonth() + 1).padStart(2, '0')}-${String(startOfWeek.getDate()).padStart(2, '0')}`;
      default:
        return date.toISOString().split('T')[0];
    }
  }
} 