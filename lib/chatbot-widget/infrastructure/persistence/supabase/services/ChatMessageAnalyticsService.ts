import { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { ChatMessage } from '../../../../domain/entities/ChatMessage';
import { ChatMessageMapper, RawChatMessageDbRecord } from '../mappers/ChatMessageMapper';
import { DatabaseError } from '@/lib/errors/base';

/**
 * Chat Message Analytics Service
 * 
 * Single responsibility: Analytics and metrics for chat messages
 * Following DDD infrastructure layer patterns with focused analytics operations
 */
export class ChatMessageAnalyticsService {
  private supabase: SupabaseClient;
  private readonly tableName = 'chat_messages';

  constructor(supabaseClient?: SupabaseClient) {
    this.supabase = supabaseClient ?? createClient();
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
    const messages = await this.getMessagesForOrganization(organizationId, dateFrom, dateTo);
    
    return this.calculateAnalytics(messages);
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

  async getResponseTimeMetrics(
    organizationId: string,
    dateFrom: Date,
    dateTo: Date,
    groupBy: 'hour' | 'day' | 'week'
  ): Promise<Array<{ period: string; avgResponseTime: number; messageCount: number }>> {
    const messages = await this.getMessagesForOrganization(organizationId, dateFrom, dateTo);
    
    return this.calculateResponseTimeMetrics(messages, groupBy);
  }

  async getCostAnalytics(
    organizationId: string,
    dateFrom: Date,
    dateTo: Date
  ): Promise<{
    totalCostCents: number;
    avgCostPerMessage: number;
    costByModel: Array<{ model: string; totalCents: number; messageCount: number }>;
    costTrend: Array<{ date: string; totalCents: number }>;
  }> {
    const messages = await this.getMessagesForOrganization(organizationId, dateFrom, dateTo);
    
    return this.calculateCostAnalytics(messages);
  }

  private async getMessagesForOrganization(
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

  private calculateAnalytics(messages: ChatMessage[]): {
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
  } {
    const totalMessages = messages.length;
    const userMessages = messages.filter(m => m.messageType === 'user').length;
    const botMessages = messages.filter(m => m.messageType === 'bot').length;
    const systemMessages = messages.filter(m => m.messageType === 'system').length;
    
    const avgResponseTime = this.calculateAverageResponseTime(messages);
    const avgTokensPerMessage = this.calculateAverageTokens(messages);
    const totalTokenCost = this.calculateTotalCost(messages);
    const sentimentDistribution = this.calculateSentimentDistribution(messages);
    const topIntents = this.calculateTopIntents(messages);
    const errorRate = this.calculateErrorRate(messages);

    return {
      totalMessages,
      userMessages,
      botMessages,
      systemMessages,
      avgResponseTime: Math.round(avgResponseTime * 100) / 100,
      avgTokensPerMessage: Math.round(avgTokensPerMessage),
      totalTokenCost,
      sentimentDistribution,
      topIntents,
      errorRate: Math.round(errorRate * 100) / 100,
    };
  }

  private calculateAverageResponseTime(messages: ChatMessage[]): number {
    const responseTimes: number[] = [];
    
    for (let i = 1; i < messages.length; i++) {
      const current = messages[i];
      const previous = messages[i - 1];
      
      if (current.messageType === 'bot' && previous.messageType === 'user') {
        const responseTime = current.timestamp.getTime() - previous.timestamp.getTime();
        responseTimes.push(responseTime);
      }
    }
    
    return responseTimes.length > 0
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length / 1000
      : 0;
  }

  private calculateAverageTokens(messages: ChatMessage[]): number {
    let totalTokens = 0;
    let messagesWithTokens = 0;

    messages.forEach(m => {
      if (m.aiMetadata.totalTokens) {
        totalTokens += m.aiMetadata.totalTokens;
        messagesWithTokens++;
      }
    });

    return messagesWithTokens > 0 ? totalTokens / messagesWithTokens : 0;
  }

  private calculateTotalCost(messages: ChatMessage[]): number {
    return messages.reduce((total, m) => total + (m.costTracking.costCents || 0), 0);
  }

  private calculateSentimentDistribution(messages: ChatMessage[]): {
    positive: number;
    neutral: number;
    negative: number;
  } {
    const sentiments = { positive: 0, neutral: 0, negative: 0 };
    
    messages.forEach(m => {
      if (m.contextMetadata.sentiment && sentiments.hasOwnProperty(m.contextMetadata.sentiment)) {
        sentiments[m.contextMetadata.sentiment as keyof typeof sentiments]++;
      }
    });

    return sentiments;
  }

  private calculateTopIntents(messages: ChatMessage[]): Array<{ intent: string; count: number }> {
    const intentsMap = new Map<string, number>();
    
    messages.forEach(m => {
      if (m.aiMetadata.intentDetected) {
        intentsMap.set(m.aiMetadata.intentDetected, (intentsMap.get(m.aiMetadata.intentDetected) || 0) + 1);
      }
    });
    
    return Array.from(intentsMap.entries())
      .map(([intent, count]) => ({ intent, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  private calculateErrorRate(messages: ChatMessage[]): number {
    const errorMessages = messages.filter(m => m.contextMetadata.errorType).length;
    return messages.length > 0 ? (errorMessages / messages.length) * 100 : 0;
  }

  private calculateResponseTimeMetrics(
    messages: ChatMessage[],
    groupBy: 'hour' | 'day' | 'week'
  ): Array<{ period: string; avgResponseTime: number; messageCount: number }> {
    const sessionGroups = this.groupMessagesBySession(messages);
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

    const results: Array<{ period: string; avgResponseTime: number; messageCount: number }> = [];
    
    responseTimesByPeriod.forEach((responseTimes, period) => {
      const avgResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length / 1000;
      results.push({
        period,
        avgResponseTime: Math.round(avgResponseTime * 100) / 100,
        messageCount: responseTimes.length,
      });
    });

    return results.sort((a, b) => a.period.localeCompare(b.period));
  }

  private calculateCostAnalytics(messages: ChatMessage[]): {
    totalCostCents: number;
    avgCostPerMessage: number;
    costByModel: Array<{ model: string; totalCents: number; messageCount: number }>;
    costTrend: Array<{ date: string; totalCents: number }>;
  } {
    const totalCostCents = this.calculateTotalCost(messages);
    const avgCostPerMessage = messages.length > 0 ? totalCostCents / messages.length : 0;
    
    const modelCosts = new Map<string, { totalCents: number; messageCount: number }>();
    const dailyCosts = new Map<string, number>();
    
    messages.forEach(m => {
      const cost = m.costTracking.costCents || 0;
      const model = m.aiMetadata.aiModel || 'unknown';
      const date = m.timestamp.toISOString().split('T')[0];
      
      // Model costs
      const modelData = modelCosts.get(model) || { totalCents: 0, messageCount: 0 };
      modelCosts.set(model, {
        totalCents: modelData.totalCents + cost,
        messageCount: modelData.messageCount + 1,
      });
      
      // Daily costs
      dailyCosts.set(date, (dailyCosts.get(date) || 0) + cost);
    });
    
    const costByModel = Array.from(modelCosts.entries())
      .map(([model, data]) => ({ model, ...data }))
      .sort((a, b) => b.totalCents - a.totalCents);
    
    const costTrend = Array.from(dailyCosts.entries())
      .map(([date, totalCents]) => ({ date, totalCents }))
      .sort((a, b) => a.date.localeCompare(b.date));
    
    return {
      totalCostCents,
      avgCostPerMessage: Math.round(avgCostPerMessage * 100) / 100,
      costByModel,
      costTrend,
    };
  }

  private groupMessagesBySession(messages: ChatMessage[]): Map<string, ChatMessage[]> {
    const sessionGroups = new Map<string, ChatMessage[]>();
    
    messages.forEach(message => {
      const sessionMessages = sessionGroups.get(message.sessionId) || [];
      sessionMessages.push(message);
      sessionGroups.set(message.sessionId, sessionMessages);
    });
    
    return sessionGroups;
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