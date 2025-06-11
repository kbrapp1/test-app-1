import { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { IChatSessionRepository } from '../../../domain/repositories/IChatSessionRepository';
import { ChatSession } from '../../../domain/entities/ChatSession';
import { ChatSessionMapper, RawChatSessionDbRecord } from './mappers/ChatSessionMapper';
import { DatabaseError } from '@/lib/errors/base';

/**
 * Supabase ChatSession Repository Implementation
 * Follows DDD principles with clean separation of concerns
 */
export class ChatSessionSupabaseRepository implements IChatSessionRepository {
  private supabase: SupabaseClient;
  private readonly tableName = 'chat_sessions';

  constructor(supabaseClient?: SupabaseClient) {
    this.supabase = supabaseClient ?? createClient();
  }

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

  async findExpiredSessions(timeoutMinutes: number): Promise<ChatSession[]> {
    const cutoffTime = new Date(Date.now() - timeoutMinutes * 60 * 1000);
    
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('status', 'active')
      .lt('last_activity_at', cutoffTime.toISOString())
      .order('last_activity_at', { ascending: true });

    if (error) {
      throw new DatabaseError('Failed to find expired sessions', error.message);
    }

    return (data || []).map(record => ChatSessionMapper.toDomain(record as RawChatSessionDbRecord));
  }

  async markExpiredAsAbandoned(timeoutMinutes: number): Promise<number> {
    const cutoffTime = new Date(Date.now() - timeoutMinutes * 60 * 1000);
    
    const { data, error } = await this.supabase
      .from(this.tableName)
      .update({ 
        status: 'abandoned',
        ended_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('status', 'active')
      .lt('last_activity_at', cutoffTime.toISOString())
      .select('id');

    if (error) {
      throw new DatabaseError('Failed to mark expired sessions as abandoned', error.message);
    }

    return data?.length || 0;
  }

  async getAnalytics(
    organizationId: string,
    dateFrom: Date,
    dateTo: Date
  ): Promise<{
    totalSessions: number;
    activeSessions: number;
    completedSessions: number;
    abandonedSessions: number;
    avgSessionDuration: number;
    avgEngagementScore: number;
    conversionRate: number;
    topTopics: Array<{ topic: string; count: number }>;
    hourlyDistribution: Array<{ hour: number; count: number }>;
  }> {
    // Get session data with organization filter
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*, chatbot_configs!inner(organization_id)')
      .eq('chatbot_configs.organization_id', organizationId)
      .gte('started_at', dateFrom.toISOString())
      .lte('started_at', dateTo.toISOString());

    if (error) {
      throw new DatabaseError('Failed to get session analytics', error.message);
    }

    const sessions = (data || []).map(record => ChatSessionMapper.toDomain(record as RawChatSessionDbRecord));
    
    // Calculate analytics
    const totalSessions = sessions.length;
    const activeSessions = sessions.filter(s => s.status === 'active').length;
    const completedSessions = sessions.filter(s => s.status === 'completed').length;
    const abandonedSessions = sessions.filter(s => s.status === 'abandoned').length;
    
    // Calculate average session duration
    const sessionsWithDuration = sessions.filter(s => s.endedAt);
    const avgSessionDuration = sessionsWithDuration.length > 0
      ? sessionsWithDuration.reduce((sum, s) => {
          const duration = s.endedAt!.getTime() - s.startedAt.getTime();
          return sum + duration;
        }, 0) / sessionsWithDuration.length / 1000 // Convert to seconds
      : 0;

    // Calculate average engagement score
    const avgEngagementScore = sessions.length > 0
      ? sessions.reduce((sum, s) => sum + s.contextData.engagementScore, 0) / sessions.length
      : 0;

         // Calculate conversion rate (sessions that led to qualified leads)
     const qualifiedSessions = sessions.filter(s => 
       s.leadQualificationState.qualificationStatus === 'completed' ||
       s.leadQualificationState.isQualified
     ).length;
    const conversionRate = totalSessions > 0 ? (qualifiedSessions / totalSessions) * 100 : 0;

         // Get top topics from context data
     const topicsMap = new Map<string, number>();
     sessions.forEach(s => {
       s.contextData.topics.forEach((topic: string) => {
         topicsMap.set(topic, (topicsMap.get(topic) || 0) + 1);
       });
     });
    const topTopics = Array.from(topicsMap.entries())
      .map(([topic, count]) => ({ topic, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Get hourly distribution
    const hourlyMap = new Map<number, number>();
    sessions.forEach(s => {
      const hour = s.startedAt.getHours();
      hourlyMap.set(hour, (hourlyMap.get(hour) || 0) + 1);
    });
    const hourlyDistribution = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      count: hourlyMap.get(hour) || 0,
    }));

    return {
      totalSessions,
      activeSessions,
      completedSessions,
      abandonedSessions,
      avgSessionDuration: Math.round(avgSessionDuration),
      avgEngagementScore: Math.round(avgEngagementScore * 100) / 100,
      conversionRate: Math.round(conversionRate * 100) / 100,
      topTopics,
      hourlyDistribution,
    };
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