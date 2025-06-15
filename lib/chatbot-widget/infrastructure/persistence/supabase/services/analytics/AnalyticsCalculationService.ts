/**
 * Analytics Calculation Service
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Core analytics calculations
 * - Pure business logic, no external dependencies
 * - Keep under 200-250 lines
 * - Focus on calculation algorithms only
 * - Follow @golden-rule patterns exactly
 */

import { ChatMessage } from '../../../../../domain/entities/ChatMessage';

export interface AnalyticsResult {
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
}

export class AnalyticsCalculationService {
  calculateAnalytics(messages: ChatMessage[]): AnalyticsResult {
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

  calculateMessageCounts(messages: ChatMessage[]): {
    total: number;
    byType: Record<string, number>;
    byHour: Record<string, number>;
    byDay: Record<string, number>;
  } {
    const byType: Record<string, number> = {};
    const byHour: Record<string, number> = {};
    const byDay: Record<string, number> = {};

    messages.forEach(message => {
      // Count by type
      byType[message.messageType] = (byType[message.messageType] || 0) + 1;

      // Count by hour
      const hour = message.timestamp.toISOString().substring(0, 13);
      byHour[hour] = (byHour[hour] || 0) + 1;

      // Count by day
      const day = message.timestamp.toISOString().substring(0, 10);
      byDay[day] = (byDay[day] || 0) + 1;
    });

    return {
      total: messages.length,
      byType,
      byHour,
      byDay,
    };
  }

  calculateEngagementMetrics(messages: ChatMessage[]): {
    avgMessagesPerSession: number;
    avgSessionDuration: number;
    bounceRate: number;
    conversionRate: number;
  } {
    const sessionGroups = this.groupMessagesBySession(messages);
    const sessionMetrics = Array.from(sessionGroups.values()).map(sessionMessages => {
      const duration = sessionMessages.length > 1
        ? sessionMessages[sessionMessages.length - 1].timestamp.getTime() - sessionMessages[0].timestamp.getTime()
        : 0;
      
      return {
        messageCount: sessionMessages.length,
        duration: duration / 1000, // Convert to seconds
        hasConversion: sessionMessages.some(m => m.aiMetadata.intentDetected === 'lead_capture'),
      };
    });

    const avgMessagesPerSession = sessionMetrics.length > 0
      ? sessionMetrics.reduce((sum, s) => sum + s.messageCount, 0) / sessionMetrics.length
      : 0;

    const avgSessionDuration = sessionMetrics.length > 0
      ? sessionMetrics.reduce((sum, s) => sum + s.duration, 0) / sessionMetrics.length
      : 0;

    const bounceRate = sessionMetrics.length > 0
      ? (sessionMetrics.filter(s => s.messageCount <= 1).length / sessionMetrics.length) * 100
      : 0;

    const conversionRate = sessionMetrics.length > 0
      ? (sessionMetrics.filter(s => s.hasConversion).length / sessionMetrics.length) * 100
      : 0;

    return {
      avgMessagesPerSession: Math.round(avgMessagesPerSession * 100) / 100,
      avgSessionDuration: Math.round(avgSessionDuration * 100) / 100,
      bounceRate: Math.round(bounceRate * 100) / 100,
      conversionRate: Math.round(conversionRate * 100) / 100,
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
} 