/**
 * AI INSTRUCTIONS: (Only need AI instruction at the top of the file ONCE)
 * - Single responsibility: Performance metrics and maturity assessment
 * - Keep business logic pure, no external dependencies
 * - Never exceed 250 lines per @golden-rule
 * - Use static methods for efficiency and statelessness
 * - Handle domain errors with specific error types
 * - Focus on performance analysis and maturity scoring
 */

import { KnowledgeItem } from '../../../../domain/services/interfaces/IKnowledgeRetrievalService';
import { KnowledgeStatisticsService } from '../KnowledgeStatisticsService';

// Performance Metrics Interface
export interface PerformanceMetrics {
  itemsPerSecond: number;
  averageProcessingTimePerItem: number;
  memoryEfficiency: string;
  recommendations: string[];
}

// Quality Score Result Interface
export interface QualityScoreResult {
  overallScore: number;
  factors: {
    contentCompleteness: number;
    tagCoverage: number;
    relevanceScore: number;
    freshness: number;
  };
  recommendations: string[];
}

export class KnowledgeContentPerformanceService {

  // Generate comprehensive quality score
  static async generateQualityScore(items: KnowledgeItem[]): Promise<QualityScoreResult> {
    if (items.length === 0) {
      return {
        overallScore: 0,
        factors: { contentCompleteness: 0, tagCoverage: 0, relevanceScore: 0, freshness: 0 },
        recommendations: ['Add knowledge items to improve quality score']
      };
    }

    const healthMetrics = await KnowledgeStatisticsService.getHealthMetrics(items);
    const basicStats = await KnowledgeStatisticsService.getBasicStats(items);
    const recommendations: string[] = [];

    // Content completeness (0-100)
    const contentCompleteness = healthMetrics.contentCoverage;
    if (contentCompleteness < 80) {
      recommendations.push('Improve content completeness by expanding short items');
    }

    // Tag coverage (0-100)
    const tagCoverage = healthMetrics.tagCoverage;
    if (tagCoverage < 90) {
      recommendations.push('Add tags to items without tags to improve searchability');
    }

    // Average relevance score (0-100) - calculate from items since basicStats doesn't have this
    const relevanceScore = items.length > 0 ? 
      (items.reduce((sum, item) => sum + item.relevanceScore, 0) / items.length) * 100 : 0;
    if (relevanceScore < 70) {
      recommendations.push('Review and improve relevance scores for better quality');
    }

    // Freshness (0-100) - use recently updated items percentage
    const freshness = items.length > 0 ? (basicStats.recentlyUpdated / items.length) * 100 : 0;
    if (freshness < 50) {
      recommendations.push('Update older content to maintain freshness');
    }

    const overallScore = (contentCompleteness + tagCoverage + relevanceScore + freshness) / 4;

    return {
      overallScore: Math.round(overallScore),
      factors: {
        contentCompleteness: Math.round(contentCompleteness),
        tagCoverage: Math.round(tagCoverage),
        relevanceScore: Math.round(relevanceScore),
        freshness: Math.round(freshness)
      },
      recommendations
    };
  }

  // Get performance metrics
  static getPerformanceMetrics(items: KnowledgeItem[], processingTime: number): PerformanceMetrics {
    const recommendations: string[] = [];
    const itemsPerSecond = processingTime > 0 ? (items.length / processingTime) * 1000 : 0;
    const averageProcessingTimePerItem = items.length > 0 ? processingTime / items.length : 0;

    // Estimate memory usage
    const estimatedMemoryUsage = items.reduce((total, item) => {
      return total + item.content.length + item.title.length + (item.tags.join('').length);
    }, 0);

    let memoryEfficiency = 'Good';
    if (estimatedMemoryUsage > 1000000) { // > 1MB
      memoryEfficiency = 'High';
      recommendations.push('Consider content chunking for large knowledge bases');
    } else if (estimatedMemoryUsage > 500000) { // > 500KB
      memoryEfficiency = 'Medium';
    }

    if (processingTime > 1000) { // > 1 second
      recommendations.push('Consider caching strategies for better performance');
    }

    if (items.length > 1000) {
      recommendations.push('Consider implementing pagination for large datasets');
    }

    return {
      itemsPerSecond: Math.round(itemsPerSecond),
      averageProcessingTimePerItem: Math.round(averageProcessingTimePerItem * 100) / 100,
      memoryEfficiency,
      recommendations
    };
  }

  // Calculate maturity score
  static async calculateMaturityScore(items: KnowledgeItem[]): Promise<{
    maturityScore: number;
    maturityLevel: 'basic' | 'developing' | 'mature' | 'advanced';
    factors: {
      contentVolume: number;
      categoryDiversity: number;
      qualityConsistency: number;
      maintenanceRegularity: number;
    };
    nextSteps: string[];
  }> {
    if (items.length === 0) {
      return {
        maturityScore: 0,
        maturityLevel: 'basic',
        factors: { contentVolume: 0, categoryDiversity: 0, qualityConsistency: 0, maintenanceRegularity: 0 },
        nextSteps: ['Start by adding basic knowledge items']
      };
    }

    const categories = new Set(items.map(item => item.category));
    const basicStats = await KnowledgeStatisticsService.getBasicStats(items);

    // Content volume (0-100)
    const contentVolume = Math.min(100, (items.length / 50) * 100); // 50 items = 100%

    // Category diversity (0-100)
    const categoryDiversity = Math.min(100, (categories.size / 5) * 100); // 5 categories = 100%

    // Quality consistency (0-100) - calculate from items
    const averageRelevanceScore = items.reduce((sum, item) => sum + item.relevanceScore, 0) / items.length;
    const qualityVariance = items.reduce((sum, item) => 
      sum + Math.pow(item.relevanceScore - averageRelevanceScore, 2), 0
    ) / items.length;
    const qualityConsistency = Math.max(0, 100 - (qualityVariance * 500)); // Lower variance = higher consistency

    // Maintenance regularity (0-100)
    const maintenanceRegularity = Math.min(100, (basicStats.recentlyUpdated / items.length) * 200);

    const factors = {
      contentVolume: Math.round(contentVolume),
      categoryDiversity: Math.round(categoryDiversity),
      qualityConsistency: Math.round(qualityConsistency),
      maintenanceRegularity: Math.round(maintenanceRegularity)
    };

    const maturityScore = Math.round(
      (factors.contentVolume + factors.categoryDiversity + factors.qualityConsistency + factors.maintenanceRegularity) / 4
    );

    let maturityLevel: 'basic' | 'developing' | 'mature' | 'advanced';
    if (maturityScore < 25) maturityLevel = 'basic';
    else if (maturityScore < 50) maturityLevel = 'developing';
    else if (maturityScore < 75) maturityLevel = 'mature';
    else maturityLevel = 'advanced';

    const nextSteps: string[] = [];
    if (factors.contentVolume < 50) nextSteps.push('Expand content volume');
    if (factors.categoryDiversity < 50) nextSteps.push('Diversify content categories');
    if (factors.qualityConsistency < 50) nextSteps.push('Improve quality consistency');
    if (factors.maintenanceRegularity < 50) nextSteps.push('Establish regular maintenance schedule');

    return {
      maturityScore,
      maturityLevel,
      factors,
      nextSteps
    };
  }
} 