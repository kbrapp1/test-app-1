/**
 * AI INSTRUCTIONS: (Only need AI instruction at the top of the file ONCE)
 * - Single responsibility: Tag trends analysis and predictive insights
 * - Keep business logic pure, no external dependencies
 * - Never exceed 250 lines per @golden-rule
 * - Use static methods for efficiency and statelessness
 * - Handle domain errors with specific error types
 * - Focus on temporal tag analysis and trend prediction
 */

import { KnowledgeItem } from '../../../../domain/services/interfaces/IKnowledgeRetrievalService';
import { KnowledgeTagCoreAnalysisService } from './KnowledgeTagCoreAnalysisService';

export class KnowledgeTagTrendsService {

  // Predict tag trends based on historical data
  static predictTagTrends(items: KnowledgeItem[]): { 
    trending: string[]; 
    declining: string[]; 
    stable: string[] 
  } {
    const recentItems = items.filter(item => {
      const itemDate = new Date(item.lastUpdated);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return itemDate >= thirtyDaysAgo;
    });
    
    const olderItems = items.filter(item => {
      const itemDate = new Date(item.lastUpdated);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
      return itemDate >= sixtyDaysAgo && itemDate < thirtyDaysAgo;
    });
    
    const recentTagCounts = KnowledgeTagCoreAnalysisService.calculateTagFrequency(recentItems);
    const olderTagCounts = KnowledgeTagCoreAnalysisService.calculateTagFrequency(olderItems);
    
    const trending: string[] = [];
    const declining: string[] = [];
    const stable: string[] = [];
    
    const allTags = new Set([...Object.keys(recentTagCounts), ...Object.keys(olderTagCounts)]);
    
    allTags.forEach(tag => {
      const recentCount = recentTagCounts[tag] || 0;
      const olderCount = olderTagCounts[tag] || 0;
      
      if (recentCount > olderCount * 1.5) {
        trending.push(tag);
      } else if (recentCount < olderCount * 0.5) {
        declining.push(tag);
      } else {
        stable.push(tag);
      }
    });
    
    return {
      trending: trending.slice(0, 10),
      declining: declining.slice(0, 10),
      stable: stable.slice(0, 10)
    };
  }

  // Analyze seasonal tag patterns
  static analyzeSeasonalPatterns(items: KnowledgeItem[]): {
    seasonalTags: Record<string, { peak: string; frequency: number }>;
    recommendations: string[];
  } {
    const monthlyTagData: Record<string, Record<string, number>> = {};
    
    items.forEach(item => {
      if (item.tags && item.lastUpdated) {
        const date = new Date(item.lastUpdated);
        const month = date.toLocaleString('default', { month: 'long' });
        
        if (!monthlyTagData[month]) {
          monthlyTagData[month] = {};
        }
        
        item.tags.forEach((tag: string) => {
          monthlyTagData[month][tag] = (monthlyTagData[month][tag] || 0) + 1;
        });
      }
    });
    
    const seasonalTags: Record<string, { peak: string; frequency: number }> = {};
    const allTags = new Set<string>();
    
    Object.values(monthlyTagData).forEach(monthData => {
      Object.keys(monthData).forEach(tag => allTags.add(tag));
    });
    
    allTags.forEach(tag => {
      let peakMonth = '';
      let peakCount = 0;
      
      Object.entries(monthlyTagData).forEach(([month, tagData]) => {
        const count = tagData[tag] || 0;
        if (count > peakCount) {
          peakCount = count;
          peakMonth = month;
        }
      });
      
      if (peakCount > 0) {
        seasonalTags[tag] = { peak: peakMonth, frequency: peakCount };
      }
    });
    
    const recommendations = this.generateSeasonalRecommendations(seasonalTags);
    
    return { seasonalTags, recommendations };
  }

  // Analyze tag lifecycle and maturity
  static analyzeTagLifecycle(items: KnowledgeItem[]): {
    emerging: string[];
    mature: string[];
    legacy: string[];
    insights: string[];
  } {
    const tagFirstSeen: Record<string, Date> = {};
    const tagLastSeen: Record<string, Date> = {};
    const tagCounts = KnowledgeTagCoreAnalysisService.calculateTagFrequency(items);
    
    items.forEach(item => {
      if (item.tags && item.lastUpdated) {
        const itemDate = new Date(item.lastUpdated);
        
        item.tags.forEach((tag: string) => {
          if (!tagFirstSeen[tag] || itemDate < tagFirstSeen[tag]) {
            tagFirstSeen[tag] = itemDate;
          }
          if (!tagLastSeen[tag] || itemDate > tagLastSeen[tag]) {
            tagLastSeen[tag] = itemDate;
          }
        });
      }
    });
    
    const now = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    
    const emerging: string[] = [];
    const mature: string[] = [];
    const legacy: string[] = [];
    const insights: string[] = [];
    
    Object.entries(tagCounts).forEach(([tag, count]) => {
      const firstSeen = tagFirstSeen[tag];
      const lastSeen = tagLastSeen[tag];
      
      if (!firstSeen || !lastSeen) return;
      
      const daysSinceFirst = Math.floor((now.getTime() - firstSeen.getTime()) / (1000 * 60 * 60 * 24));
      const daysSinceLast = Math.floor((now.getTime() - lastSeen.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysSinceFirst < 90 && count >= 3) {
        emerging.push(tag);
      } else if (daysSinceFirst > 180 && daysSinceLast < 30 && count >= 5) {
        mature.push(tag);
      } else if (daysSinceLast > 180) {
        legacy.push(tag);
      }
    });
    
    if (emerging.length > 0) {
      insights.push(`${emerging.length} emerging tags detected - monitor for growth potential`);
    }
    
    if (legacy.length > 5) {
      insights.push(`${legacy.length} legacy tags found - consider archiving or updating`);
    }
    
    if (mature.length > 0) {
      insights.push(`${mature.length} mature tags are actively used - maintain consistency`);
    }
    
    return {
      emerging: emerging.slice(0, 10),
      mature: mature.slice(0, 15),
      legacy: legacy.slice(0, 10),
      insights
    };
  }

  // Forecast future tag needs
  static forecastTagNeeds(items: KnowledgeItem[]): {
    projectedTags: string[];
    contentGaps: string[];
    recommendations: string[];
  } {
    const trendAnalysis = this.predictTagTrends(items);
    const lifecycleAnalysis = this.analyzeTagLifecycle(items);
    
    const projectedTags: string[] = [];
    const contentGaps: string[] = [];
    const recommendations: string[] = [];
    
    // Project based on trending tags
    trendAnalysis.trending.forEach(tag => {
      projectedTags.push(`${tag}-advanced`);
      projectedTags.push(`${tag}-guide`);
    });
    
    // Identify gaps based on declining tags
    trendAnalysis.declining.forEach(tag => {
      contentGaps.push(`Content for '${tag}' may need refreshing`);
    });
    
    // Recommendations based on lifecycle
    if (lifecycleAnalysis.emerging.length > 0) {
      recommendations.push('Monitor emerging tags for content expansion opportunities');
    }
    
    if (lifecycleAnalysis.legacy.length > 5) {
      recommendations.push('Review legacy tags for potential content updates or archival');
    }
    
    // Content gap analysis
    const popularTags = KnowledgeTagCoreAnalysisService.getPopularTags(items);
    const topTags = popularTags.slice(0, 5).map(t => t.tag);
    
    topTags.forEach(tag => {
      const relatedContent = items.filter(item => 
        item.tags && item.tags.includes(tag)
      );
      
      if (relatedContent.length < 3) {
        contentGaps.push(`Limited content for popular tag: ${tag}`);
      }
    });
    
    return {
      projectedTags: projectedTags.slice(0, 10),
      contentGaps: contentGaps.slice(0, 8),
      recommendations: recommendations.slice(0, 5)
    };
  }

  // Helper methods
  private static generateSeasonalRecommendations(seasonalTags: Record<string, { peak: string; frequency: number }>): string[] {
    const recommendations: string[] = [];
    const monthlyPeaks: Record<string, string[]> = {};
    
    Object.entries(seasonalTags).forEach(([tag, data]) => {
      if (!monthlyPeaks[data.peak]) {
        monthlyPeaks[data.peak] = [];
      }
      monthlyPeaks[data.peak].push(tag);
    });
    
    Object.entries(monthlyPeaks).forEach(([month, tags]) => {
      if (tags.length > 2) {
        recommendations.push(`Plan content around ${month} for tags: ${tags.slice(0, 3).join(', ')}`);
      }
    });
    
    return recommendations.slice(0, 5);
  }
} 