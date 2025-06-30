/**
 * Chat Session Analytics Service
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Analytics calculations for chat sessions
 * - Handle complex analytics queries and calculations
 * - Keep under 200-250 lines
 * - Focus on analytics and metrics only
 * - Follow @golden-rule patterns exactly
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { ChatSession } from '../../../../../domain/entities/ChatSession';
import { ChatSessionMapper, RawChatSessionDbRecord } from '../../mappers/ChatSessionMapper';
import { DatabaseError } from '../../../../../../errors/base';

export class ChatSessionAnalyticsService {
  private readonly tableName = 'chat_sessions';

  constructor(private readonly supabase: SupabaseClient) {}

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
    
    return this.calculateAnalytics(sessions);
  }

  private calculateAnalytics(sessions: ChatSession[]): {
    totalSessions: number;
    activeSessions: number;
    completedSessions: number;
    abandonedSessions: number;
    avgSessionDuration: number;
    avgEngagementScore: number;
    conversionRate: number;
    topTopics: Array<{ topic: string; count: number }>;
    hourlyDistribution: Array<{ hour: number; count: number }>;
  } {
    const totalSessions = sessions.length;
    const activeSessions = sessions.filter(s => s.status === 'active').length;
    const completedSessions = sessions.filter(s => s.status === 'completed').length;
    const abandonedSessions = sessions.filter(s => s.status === 'abandoned').length;
    
    const avgSessionDuration = this.calculateAverageSessionDuration(sessions);
    const avgEngagementScore = this.calculateAverageEngagementScore(sessions);
    const conversionRate = this.calculateConversionRate(sessions);
    const topTopics = this.extractTopTopics(sessions);
    const hourlyDistribution = this.calculateHourlyDistribution(sessions);

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

  private calculateAverageSessionDuration(sessions: ChatSession[]): number {
    const sessionsWithDuration = sessions.filter(s => s.endedAt);
    
    if (sessionsWithDuration.length === 0) {
      return 0;
    }

    const totalDuration = sessionsWithDuration.reduce((sum, s) => {
      const duration = s.endedAt!.getTime() - s.startedAt.getTime();
      return sum + duration;
    }, 0);

    return totalDuration / sessionsWithDuration.length / 1000; // Convert to seconds
  }

  private calculateAverageEngagementScore(sessions: ChatSession[]): number {
    if (sessions.length === 0) {
      return 0;
    }

    const totalEngagement = sessions.reduce((sum, s) => sum + s.contextData.engagementScore, 0);
    return totalEngagement / sessions.length;
  }

  private calculateConversionRate(sessions: ChatSession[]): number {
    if (sessions.length === 0) {
      return 0;
    }

    const qualifiedSessions = sessions.filter(s => 
      s.leadQualificationState.qualificationStatus === 'completed' ||
      s.leadQualificationState.isQualified
    ).length;

    return (qualifiedSessions / sessions.length) * 100;
  }

  private extractTopTopics(sessions: ChatSession[]): Array<{ topic: string; count: number }> {
    const topicsMap = new Map<string, number>();
    
    sessions.forEach(s => {
      s.contextData.topics.forEach((topic: string) => {
        topicsMap.set(topic, (topicsMap.get(topic) || 0) + 1);
      });
    });

    return Array.from(topicsMap.entries())
      .map(([topic, count]) => ({ topic, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  private calculateHourlyDistribution(sessions: ChatSession[]): Array<{ hour: number; count: number }> {
    const hourlyMap = new Map<number, number>();
    
    sessions.forEach(s => {
      const hour = s.startedAt.getHours();
      hourlyMap.set(hour, (hourlyMap.get(hour) || 0) + 1);
    });

    return Array.from({ length: 24 }, (_, hour) => ({
      hour,
      count: hourlyMap.get(hour) || 0,
    }));
  }
} 