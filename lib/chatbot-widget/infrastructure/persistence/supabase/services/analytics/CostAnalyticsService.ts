/**
 * Cost Analytics Service
 * AI INSTRUCTIONS:
 * - Single responsibility: Cost calculations and financial metrics
 * - Pure business logic, no external dependencies
 * - Keep under 200-250 lines
 * - Focus on cost-related analytics only
 * - Follow @golden-rule patterns exactly
 */

import { ChatMessage } from '../../../../../domain/entities/ChatMessage';

export interface CostAnalytics {
  totalCostCents: number;
  avgCostPerMessage: number;
  costByModel: Array<{ model: string; totalCents: number; messageCount: number }>;
  costTrend: Array<{ date: string; totalCents: number }>;
}

export class CostAnalyticsService {
  calculateCostAnalytics(messages: ChatMessage[]): CostAnalytics {
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

  calculateCostByTimeRange(
    messages: ChatMessage[],
    groupBy: 'hour' | 'day' | 'week' | 'month'
  ): Array<{ period: string; totalCents: number; messageCount: number; avgCostPerMessage: number }> {
    const costsByPeriod = new Map<string, { totalCents: number; messageCount: number }>();
    
    messages.forEach(message => {
      const cost = message.costTracking.costCents || 0;
      const period = this.formatPeriod(message.timestamp, groupBy);
      
      const periodData = costsByPeriod.get(period) || { totalCents: 0, messageCount: 0 };
      costsByPeriod.set(period, {
        totalCents: periodData.totalCents + cost,
        messageCount: periodData.messageCount + 1,
      });
    });
    
    return Array.from(costsByPeriod.entries())
      .map(([period, data]) => ({
        period,
        totalCents: data.totalCents,
        messageCount: data.messageCount,
        avgCostPerMessage: data.messageCount > 0 ? data.totalCents / data.messageCount : 0,
      }))
      .sort((a, b) => a.period.localeCompare(b.period));
  }

  calculateTokenCostEfficiency(messages: ChatMessage[]): {
    avgCostPerToken: number;
    avgTokensPerDollar: number;
    costEfficiencyByModel: Array<{
      model: string;
      avgCostPerToken: number;
      avgTokensPerMessage: number;
      totalTokens: number;
      totalCostCents: number;
    }>;
  } {
    const modelStats = new Map<string, {
      totalTokens: number;
      totalCostCents: number;
      messageCount: number;
    }>();
    
    let totalTokens = 0;
    let totalCostCents = 0;
    
    messages.forEach(message => {
      const tokens = message.aiMetadata.totalTokens || 0;
      const cost = message.costTracking.costCents || 0;
      const model = message.aiMetadata.aiModel || 'unknown';
      
      totalTokens += tokens;
      totalCostCents += cost;
      
      const modelData = modelStats.get(model) || {
        totalTokens: 0,
        totalCostCents: 0,
        messageCount: 0,
      };
      
      modelStats.set(model, {
        totalTokens: modelData.totalTokens + tokens,
        totalCostCents: modelData.totalCostCents + cost,
        messageCount: modelData.messageCount + 1,
      });
    });
    
    const avgCostPerToken = totalTokens > 0 ? totalCostCents / totalTokens : 0;
    const avgTokensPerDollar = totalCostCents > 0 ? (totalTokens / totalCostCents) * 100 : 0;
    
    const costEfficiencyByModel = Array.from(modelStats.entries())
      .map(([model, stats]) => ({
        model,
        avgCostPerToken: stats.totalTokens > 0 ? stats.totalCostCents / stats.totalTokens : 0,
        avgTokensPerMessage: stats.messageCount > 0 ? stats.totalTokens / stats.messageCount : 0,
        totalTokens: stats.totalTokens,
        totalCostCents: stats.totalCostCents,
      }))
      .sort((a, b) => a.avgCostPerToken - b.avgCostPerToken);
    
    return {
      avgCostPerToken: Math.round(avgCostPerToken * 10000) / 10000,
      avgTokensPerDollar: Math.round(avgTokensPerDollar),
      costEfficiencyByModel,
    };
  }

  calculateCostProjections(
    messages: ChatMessage[],
    _projectionDays: number = 30
  ): {
    dailyAvgCostCents: number;
    projectedMonthlyCostCents: number;
    projectedYearlyCostCents: number;
    costGrowthRate: number;
  } {
    if (messages.length === 0) {
      return {
        dailyAvgCostCents: 0,
        projectedMonthlyCostCents: 0,
        projectedYearlyCostCents: 0,
        costGrowthRate: 0,
      };
    }
    
    const dailyCosts = this.calculateCostByTimeRange(messages, 'day');
    const totalCost = dailyCosts.reduce((sum, day) => sum + day.totalCents, 0);
    const dailyAvgCostCents = dailyCosts.length > 0 ? totalCost / dailyCosts.length : 0;
    
    // Calculate growth rate from first half vs second half of data
    const midPoint = Math.floor(dailyCosts.length / 2);
    const firstHalfAvg = dailyCosts.slice(0, midPoint).reduce((sum, day) => sum + day.totalCents, 0) / midPoint;
    const secondHalfAvg = dailyCosts.slice(midPoint).reduce((sum, day) => sum + day.totalCents, 0) / (dailyCosts.length - midPoint);
    
    const costGrowthRate = firstHalfAvg > 0 ? ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100 : 0;
    
    return {
      dailyAvgCostCents: Math.round(dailyAvgCostCents * 100) / 100,
      projectedMonthlyCostCents: Math.round(dailyAvgCostCents * 30 * 100) / 100,
      projectedYearlyCostCents: Math.round(dailyAvgCostCents * 365 * 100) / 100,
      costGrowthRate: Math.round(costGrowthRate * 100) / 100,
    };
  }

  private calculateTotalCost(messages: ChatMessage[]): number {
    return messages.reduce((total, m) => total + (m.costTracking.costCents || 0), 0);
  }

  private formatPeriod(date: Date, groupBy: 'hour' | 'day' | 'week' | 'month'): string {
    switch (groupBy) {
      case 'hour':
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:00`;
      case 'day':
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      case 'week':
        const startOfWeek = new Date(date);
        startOfWeek.setDate(date.getDate() - date.getDay());
        return `${startOfWeek.getFullYear()}-${String(startOfWeek.getMonth() + 1).padStart(2, '0')}-${String(startOfWeek.getDate()).padStart(2, '0')}`;
      case 'month':
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      default:
        return date.toISOString().split('T')[0];
    }
  }
} 