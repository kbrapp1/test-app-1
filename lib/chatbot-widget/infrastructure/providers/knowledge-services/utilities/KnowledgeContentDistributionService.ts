/**
 * AI INSTRUCTIONS:
 * - Single responsibility: Simple distribution analysis coordination
 * - Keep under 200 lines per @golden-rule patterns
 * - Use static methods for efficiency
 * - No complex interfaces or over-engineering
 * - Just coordinate simple utilities, nothing more
 */

import { KnowledgeItem } from '../../../../domain/services/interfaces/IKnowledgeRetrievalService';
import { KnowledgeGroupingService } from './KnowledgeGroupingService';
import { KnowledgeStatsService } from './KnowledgeStatsService';
import { KnowledgeFormatService } from './KnowledgeFormatService';

export class KnowledgeContentDistributionService {

  // Simple distribution overview
  static getDistributionOverview(items: KnowledgeItem[]) {
    this.validateItems(items);
    
    const sourceDistribution = KnowledgeGroupingService.groupBySource(items);
    const tagDistribution = KnowledgeGroupingService.groupByTags(items);
    const lengthDistribution = KnowledgeGroupingService.groupByContentLength(items);
    const formatScore = KnowledgeFormatService.getOverallFormatScore(items);
    
    return {
      sourceDistribution,
      tagDistribution,
      lengthDistribution,
      formatConsistency: formatScore.score,
      totalItems: items.length
    };
  }

  // Comprehensive analysis (delegates to utilities)
  static analyzeComprehensiveDistribution(items: KnowledgeItem[]) {
    this.validateItems(items);
    
    // Basic grouping
    const sourceGroups = KnowledgeGroupingService.groupBySource(items);
    const tagGroups = KnowledgeGroupingService.groupByTags(items);
    const lengthGroups = KnowledgeGroupingService.groupByContentLength(items);
    const categoryGroups = KnowledgeGroupingService.groupByCategory(items);
    
    // Statistics
    const basicStats = KnowledgeStatsService.calculateBasicStats(items);
    const lengthStats = KnowledgeStatsService.calculateContentLengthStats(items);
    const tagStats = KnowledgeStatsService.calculateTagStats(items);
    const healthScore = KnowledgeStatsService.calculateHealthScore(items);
    
    // Distribution analysis
    const sourceDistStats = KnowledgeStatsService.calculateDistributionStats(sourceGroups);
    const tagDistStats = KnowledgeStatsService.calculateDistributionStats(tagGroups);
    
    // Format analysis
    const formatAnalysis = KnowledgeFormatService.getOverallFormatScore(items);
    
    return {
      // Grouping results
      grouping: {
        sources: sourceGroups,
        tags: tagGroups,
        lengths: lengthGroups,
        categories: categoryGroups
      },
      
      // Statistics
      stats: {
        basic: basicStats,
        contentLength: lengthStats,
        tags: tagStats,
        health: healthScore
      },
      
      // Distribution analysis
      distribution: {
        sources: sourceDistStats,
        tags: tagDistStats
      },
      
      // Format analysis
      format: formatAnalysis,
      
      // Summary
      summary: {
        totalItems: items.length,
        analysisDate: new Date(),
        overallScore: Math.round((healthScore + formatAnalysis.score) / 2),
        recommendations: this.generateRecommendations(healthScore, formatAnalysis, tagStats)
      }
    };
  }

  // Quality assessment
  static assessDistributionQuality(items: KnowledgeItem[]) {
    this.validateItems(items);
    
    const uniqueSources = KnowledgeGroupingService.countUniqueSources(items);
    const _uniqueTags = KnowledgeGroupingService.countUniqueTags(items);
    const tagStats = KnowledgeStatsService.calculateTagStats(items);
    const formatScore = KnowledgeFormatService.getOverallFormatScore(items);
    
    const sourceQuality = Math.min(uniqueSources / 3, 1) * 100; // Good if 3+ sources
    const tagQuality = tagStats.tagCoverage;
    const formatQuality = formatScore.score;
    
    const overallQuality = Math.round(
      (sourceQuality * 0.3 + tagQuality * 0.3 + formatQuality * 0.4)
    );
    
    return {
      sourceQuality,
      tagQuality,
      formatQuality,
      overallQuality,
      recommendations: this.generateQualityRecommendations({
        sourceQuality,
        tagQuality,
        formatQuality,
        overallQuality
      })
    };
  }

  // Backward compatibility methods (delegate to utilities)
  static groupItemsByField(items: KnowledgeItem[], field: keyof KnowledgeItem): Record<string, number> {
    return KnowledgeGroupingService.groupByField(items, field);
  }

  static calculateTagDistribution(items: KnowledgeItem[]): Record<string, number> {
    return KnowledgeGroupingService.groupByTags(items);
  }

  static calculateContentLengthDistribution(items: KnowledgeItem[]): Record<string, number> {
    return KnowledgeGroupingService.groupByContentLength(items);
  }

  static analyzeTitleFormats(items: KnowledgeItem[]): { variability: number } {
    const titleCheck = KnowledgeFormatService.checkTitleConsistency(items);
    return { variability: (100 - titleCheck.score) / 100 };
  }

  static analyzeStructureFormats(items: KnowledgeItem[]): { variability: number } {
    const contentCheck = KnowledgeFormatService.checkContentStructure(items);
    return { variability: (100 - contentCheck.score) / 100 };
  }

  static analyzeTagFormats(items: KnowledgeItem[]): { variability: number } {
    const tagCheck = KnowledgeFormatService.checkTagConsistency(items);
    return { variability: (100 - tagCheck.score) / 100 };
  }

  // Private helper methods
  private static generateRecommendations(
    healthScore: number,
    formatAnalysis: Record<string, unknown>,
    tagStats: Record<string, unknown>
  ): string[] {
    const recommendations: string[] = [];
    
    if (healthScore < 60) {
      recommendations.push('Improve content quality and completeness');
    }
    
    if ((formatAnalysis.score as number) < 70) {
      recommendations.push('Establish consistent formatting standards');
    }
    
    if ((tagStats.tagCoverage as number) < 50) {
      recommendations.push('Add more tags to improve content discoverability');
    }
    
    if ((tagStats.averageTagsPerItem as number) < 2) {
      recommendations.push('Increase average tags per item (aim for 2-4 tags)');
    }
    
    return recommendations;
  }

  private static generateQualityRecommendations(qualities: {
    sourceQuality: number;
    tagQuality: number;
    formatQuality: number;
    overallQuality: number;
  }): string[] {
    const recommendations: string[] = [];
    
    if (qualities.sourceQuality < 50) {
      recommendations.push('Diversify content sources');
    }
    
    if (qualities.tagQuality < 50) {
      recommendations.push('Improve tagging practices');
    }
    
    if (qualities.formatQuality < 70) {
      recommendations.push('Establish formatting guidelines');
    }
    
    if (qualities.overallQuality > 80) {
      recommendations.push('Excellent distribution quality - maintain standards');
    }
    
    return recommendations;
  }

  private static validateItems(items: KnowledgeItem[]): void {
    if (!Array.isArray(items)) {
      throw new Error('Items must be an array');
    }
  }
} 