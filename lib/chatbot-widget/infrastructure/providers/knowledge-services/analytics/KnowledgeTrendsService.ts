/**
 * AI INSTRUCTIONS: (Only need AI instruction at the top of the file ONCE)
 * - Single responsibility: Analyze knowledge trends and patterns over time
 * - Keep business logic pure, no external dependencies
 * - Never exceed 250 lines per @golden-rule
 * - Use static methods for efficiency and statelessness
 * - Handle domain errors with specific error types
 * - Focus on temporal analysis and growth patterns
 */

import { KnowledgeItem } from '../../../../domain/services/interfaces/IKnowledgeRetrievalService';
import { KnowledgeTrends } from '../types/KnowledgeServiceTypes';

export class KnowledgeTrendsService {

  static async analyzeTrends(items: KnowledgeItem[]): Promise<KnowledgeTrends> {
    const creationTrends = this.analyzeCreationTrends(items);
    const updateTrends = this.analyzeUpdateTrends(items);
    const contentGrowth = this.analyzeContentGrowth(items);
    const tagTrends = this.analyzeTagTrends(items);
    const sourceTrends = this.analyzeSourceTrends(items);
    const qualityTrends = this.analyzeQualityTrends(items);

    return {
      creationTrends,
      updateTrends,
      contentGrowth,
      tagTrends,
      sourceTrends,
      qualityTrends
    };
  }

  // Trend Analysis Methods
  private static analyzeCreationTrends(items: KnowledgeItem[]): Record<string, number> {
    const trends: Record<string, number> = {};
    
    items.forEach(item => {
      const createdAt = new Date(item.lastUpdated);
      const monthKey = `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, '0')}`;
      trends[monthKey] = (trends[monthKey] || 0) + 1;
    });
    
    return trends;
  }

  private static analyzeUpdateTrends(items: KnowledgeItem[]): Record<string, number> {
    const trends: Record<string, number> = {};
    
    items.forEach(item => {
      const updatedAt = new Date(item.lastUpdated);
      const monthKey = `${updatedAt.getFullYear()}-${String(updatedAt.getMonth() + 1).padStart(2, '0')}`;
      trends[monthKey] = (trends[monthKey] || 0) + 1;
    });
    
    return trends;
  }

  private static analyzeContentGrowth(items: KnowledgeItem[]): { totalGrowth: number; monthlyGrowth: Record<string, number> } {
    const creationTrends = this.analyzeCreationTrends(items);
    const months = Object.keys(creationTrends).sort();
    
    const monthlyGrowth: Record<string, number> = {};
    let cumulativeCount = 0;
    
    months.forEach(month => {
      cumulativeCount += creationTrends[month];
      monthlyGrowth[month] = cumulativeCount;
    });
    
    return {
      totalGrowth: items.length,
      monthlyGrowth
    };
  }

  private static analyzeTagTrends(items: KnowledgeItem[]): Record<string, Record<string, number>> {
    const tagTrends: Record<string, Record<string, number>> = {};
    
    items.forEach(item => {
      const createdAt = new Date(item.lastUpdated);
      const monthKey = `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, '0')}`;
      
      if (!tagTrends[monthKey]) {
        tagTrends[monthKey] = {};
      }
      
      if (item.tags) {
        item.tags.forEach((tag: string) => {
          tagTrends[monthKey][tag] = (tagTrends[monthKey][tag] || 0) + 1;
        });
      }
    });
    
    return tagTrends;
  }

  private static analyzeSourceTrends(items: KnowledgeItem[]): Record<string, Record<string, number>> {
    const sourceTrends: Record<string, Record<string, number>> = {};
    
    items.forEach(item => {
      const createdAt = new Date(item.lastUpdated);
      const monthKey = `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, '0')}`;
      const source = item.source || 'unknown';
      
      if (!sourceTrends[monthKey]) {
        sourceTrends[monthKey] = {};
      }
      
      sourceTrends[monthKey][source] = (sourceTrends[monthKey][source] || 0) + 1;
    });
    
    return sourceTrends;
  }

  private static analyzeQualityTrends(items: KnowledgeItem[]): Record<string, number> {
    const qualityTrends: Record<string, number> = {};
    
    items.forEach(item => {
      const createdAt = new Date(item.lastUpdated);
      const monthKey = `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, '0')}`;
      const quality = this.calculateItemQuality(item);
      
      if (!qualityTrends[monthKey]) {
        qualityTrends[monthKey] = 0;
      }
      
      qualityTrends[monthKey] += quality;
    });
    
    // Calculate average quality per month
    const creationTrends = this.analyzeCreationTrends(items);
    Object.keys(qualityTrends).forEach(month => {
      if (creationTrends[month]) {
        qualityTrends[month] = Math.round((qualityTrends[month] / creationTrends[month]) * 100) / 100;
      }
    });
    
    return qualityTrends;
  }

  // Utility method for quality calculation
  private static calculateItemQuality(item: KnowledgeItem): number {
    let quality = 0;
    
    if (item.content && item.content.length > 100) quality += 0.3;
    if (item.tags && item.tags.length > 0) quality += 0.2;
    if (item.title && item.title.length > 10) quality += 0.2;
    if (item.source) quality += 0.1;
    if (item.relevanceScore > 0.5) quality += 0.2;
    
    return Math.min(quality, 1.0);
  }

  // Additional trend analysis methods
  static analyzeGrowthRate(items: KnowledgeItem[], periodMonths: number = 6): { growthRate: number; trend: string } {
    const creationTrends = this.analyzeCreationTrends(items);
    const months = Object.keys(creationTrends).sort();
    
    if (months.length < 2) {
      return { growthRate: 0, trend: 'insufficient_data' };
    }
    
    const recentMonths = months.slice(-periodMonths);
    const earlierMonths = months.slice(0, Math.max(1, months.length - periodMonths));
    
    const recentAvg = recentMonths.reduce((sum, month) => sum + creationTrends[month], 0) / recentMonths.length;
    const earlierAvg = earlierMonths.reduce((sum, month) => sum + creationTrends[month], 0) / earlierMonths.length;
    
    const growthRate = ((recentAvg - earlierAvg) / Math.max(earlierAvg, 1)) * 100;
    
    let trend = 'stable';
    if (growthRate > 10) trend = 'growing';
    else if (growthRate < -10) trend = 'declining';
    
    return { growthRate: Math.round(growthRate * 100) / 100, trend };
  }

  static identifySeasonalPatterns(items: KnowledgeItem[]): { patterns: Record<string, number>; hasSeasonality: boolean } {
    const monthlyActivity: Record<string, number> = {};
    
    items.forEach(item => {
      const month = new Date(item.lastUpdated).getMonth() + 1;
      const monthName = new Date(2000, month - 1, 1).toLocaleDateString('en-US', { month: 'long' });
      monthlyActivity[monthName] = (monthlyActivity[monthName] || 0) + 1;
    });
    
    const values = Object.values(monthlyActivity);
    const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / values.length;
    const standardDeviation = Math.sqrt(variance);
    
    // Consider seasonal if standard deviation is > 20% of average
    const hasSeasonality = standardDeviation > (avg * 0.2);
    
    return { patterns: monthlyActivity, hasSeasonality };
  }

  static analyzeContentVelocity(items: KnowledgeItem[]): { velocity: number; trend: string; recommendation: string } {
    const last30Days = items.filter(item => {
      const itemDate = new Date(item.lastUpdated);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return itemDate >= thirtyDaysAgo;
    });
    
    const last60Days = items.filter(item => {
      const itemDate = new Date(item.lastUpdated);
      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
      return itemDate >= sixtyDaysAgo;
    });
    
    const velocity = last30Days.length;
    const previousVelocity = last60Days.length - last30Days.length;
    
    let trend = 'stable';
    let recommendation = 'Maintain current content creation pace';
    
    if (velocity > previousVelocity * 1.2) {
      trend = 'accelerating';
      recommendation = 'Content creation is accelerating - ensure quality standards are maintained';
    } else if (velocity < previousVelocity * 0.8) {
      trend = 'decelerating';
      recommendation = 'Content creation is slowing - consider increasing content production';
    }
    
    return { velocity, trend, recommendation };
  }

  static predictContentNeeds(items: KnowledgeItem[]): { prediction: string; confidence: number; suggestions: string[] } {
    const tagTrends = this.analyzeTagTrends(items);
    const months = Object.keys(tagTrends).sort();
    
    if (months.length < 3) {
      return {
        prediction: 'Insufficient data for prediction',
        confidence: 0,
        suggestions: ['Collect more data over time to enable trend prediction']
      };
    }
    
    const recentMonth = months[months.length - 1];
    const previousMonth = months[months.length - 2];
    
    const recentTags = tagTrends[recentMonth] || {};
    const previousTags = tagTrends[previousMonth] || {};
    
    const growingTags = Object.keys(recentTags).filter(tag => {
      const recentCount = recentTags[tag] || 0;
      const previousCount = previousTags[tag] || 0;
      return recentCount > previousCount;
    });
    
    const suggestions = growingTags.slice(0, 3).map(tag => 
      `Increase content for trending topic: ${tag}`
    );
    
    return {
      prediction: growingTags.length > 0 ? 'Growing demand for specific topics' : 'Stable content demand',
      confidence: Math.min(growingTags.length / 5, 1),
      suggestions
    };
  }
} 