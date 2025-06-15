/**
 * Response Time Analytics Service
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Response time calculations and metrics
 * - Pure business logic, no external dependencies
 * - Keep under 200-250 lines
 * - Focus on time-based analytics only
 * - Follow @golden-rule patterns exactly
 */

import { ChatMessage } from '../../../../../domain/entities/ChatMessage';

export interface ResponseTimeMetrics {
  period: string;
  avgResponseTime: number;
  messageCount: number;
}

export class ResponseTimeAnalyticsService {
  calculateResponseTimeMetrics(
    messages: ChatMessage[],
    groupBy: 'hour' | 'day' | 'week'
  ): ResponseTimeMetrics[] {
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

    const results: ResponseTimeMetrics[] = [];
    
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

  calculateOverallResponseTime(messages: ChatMessage[]): {
    avgResponseTime: number;
    medianResponseTime: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
    totalResponses: number;
  } {
    const responseTimes: number[] = [];
    
    for (let i = 1; i < messages.length; i++) {
      const current = messages[i];
      const previous = messages[i - 1];
      
      if (current.messageType === 'bot' && previous.messageType === 'user') {
        const responseTime = current.timestamp.getTime() - previous.timestamp.getTime();
        responseTimes.push(responseTime / 1000); // Convert to seconds
      }
    }

    if (responseTimes.length === 0) {
      return {
        avgResponseTime: 0,
        medianResponseTime: 0,
        p95ResponseTime: 0,
        p99ResponseTime: 0,
        totalResponses: 0,
      };
    }

    const sortedTimes = responseTimes.sort((a, b) => a - b);
    const avgResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
    const medianResponseTime = this.calculatePercentile(sortedTimes, 50);
    const p95ResponseTime = this.calculatePercentile(sortedTimes, 95);
    const p99ResponseTime = this.calculatePercentile(sortedTimes, 99);

    return {
      avgResponseTime: Math.round(avgResponseTime * 100) / 100,
      medianResponseTime: Math.round(medianResponseTime * 100) / 100,
      p95ResponseTime: Math.round(p95ResponseTime * 100) / 100,
      p99ResponseTime: Math.round(p99ResponseTime * 100) / 100,
      totalResponses: responseTimes.length,
    };
  }

  calculateResponseTimeDistribution(messages: ChatMessage[]): {
    fast: number; // < 1 second
    normal: number; // 1-5 seconds
    slow: number; // 5-15 seconds
    verySlow: number; // > 15 seconds
  } {
    const responseTimes: number[] = [];
    
    for (let i = 1; i < messages.length; i++) {
      const current = messages[i];
      const previous = messages[i - 1];
      
      if (current.messageType === 'bot' && previous.messageType === 'user') {
        const responseTime = current.timestamp.getTime() - previous.timestamp.getTime();
        responseTimes.push(responseTime / 1000); // Convert to seconds
      }
    }

    const distribution = {
      fast: responseTimes.filter(t => t < 1).length,
      normal: responseTimes.filter(t => t >= 1 && t < 5).length,
      slow: responseTimes.filter(t => t >= 5 && t < 15).length,
      verySlow: responseTimes.filter(t => t >= 15).length,
    };

    return distribution;
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

  private calculatePercentile(sortedArray: number[], percentile: number): number {
    if (sortedArray.length === 0) return 0;
    
    const index = (percentile / 100) * (sortedArray.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    
    if (lower === upper) {
      return sortedArray[lower];
    }
    
    const weight = index - lower;
    return sortedArray[lower] * (1 - weight) + sortedArray[upper] * weight;
  }
} 