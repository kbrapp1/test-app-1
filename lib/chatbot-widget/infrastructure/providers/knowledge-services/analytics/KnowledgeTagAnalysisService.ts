/**
 * AI INSTRUCTIONS: (Only need AI instruction at the top of the file ONCE)
 * - Single responsibility: Coordinate tag analysis operations
 * - Keep business logic pure, no external dependencies
 * - Keep under 250 lines per @golden-rule patterns
 * - Use static methods for efficiency and statelessness
 * - Handle domain errors with specific error types
 * - Focus on coordinating tag analysis services and providing unified API
 */

import { KnowledgeItem } from '../../../../domain/services/interfaces/IKnowledgeRetrievalService';
import { TagAnalysisResult } from '../types/KnowledgeServiceTypes';
import { KnowledgeTagCoreAnalysisService } from './KnowledgeTagCoreAnalysisService';
import { KnowledgeTagQualityService } from './KnowledgeTagQualityService';
import { KnowledgeTagTrendsService } from './KnowledgeTagTrendsService';

export class KnowledgeTagAnalysisService {

  // Main analysis method - coordinates all tag analysis
  static async analyzeTags(items: KnowledgeItem[]): Promise<TagAnalysisResult> {
    return await KnowledgeTagCoreAnalysisService.analyzeTags(items);
  }

  // Core analysis methods - delegate to core service
  static calculateTagFrequency(items: KnowledgeItem[]): Record<string, number> {
    return KnowledgeTagCoreAnalysisService.calculateTagFrequency(items);
  }

  static analyzeTagCooccurrence(items: KnowledgeItem[]): Record<string, Record<string, number>> {
    return KnowledgeTagCoreAnalysisService.analyzeTagCooccurrence(items);
  }

  static identifyTagClusters(items: KnowledgeItem[]): Array<{ cluster: string[]; strength: number }> {
    return KnowledgeTagCoreAnalysisService.identifyTagClusters(items);
  }

  static identifyUnusedTags(items: KnowledgeItem[]): string[] {
    return KnowledgeTagCoreAnalysisService.identifyUnusedTags(items);
  }

  static analyzeTagEffectiveness(items: KnowledgeItem[]): Record<string, { usage: number; effectiveness: number }> {
    return KnowledgeTagCoreAnalysisService.analyzeTagEffectiveness(items);
  }

  static generateTagSuggestions(items: KnowledgeItem[]): string[] {
    return KnowledgeTagCoreAnalysisService.generateTagSuggestions(items);
  }

  static getPopularTags(items: KnowledgeItem[]): Array<{ tag: string; count: number; percentage: number }> {
    return KnowledgeTagCoreAnalysisService.getPopularTags(items);
  }

  // Quality analysis methods - delegate to quality service
  static analyzeTagConsistency(items: KnowledgeItem[]): { consistencyScore: number; issues: string[]; recommendations: string[] } {
    return KnowledgeTagQualityService.analyzeTagConsistency(items);
  }

  static identifyTagGaps(items: KnowledgeItem[]): { gaps: string[]; coverage: number; suggestions: string[] } {
    return KnowledgeTagQualityService.identifyTagGaps(items);
  }

  static analyzeTagDistribution(items: KnowledgeItem[]): { distribution: Record<string, number>; balance: string; recommendations: string[] } {
    return KnowledgeTagQualityService.analyzeTagDistribution(items);
  }

  static assessTagQuality(items: KnowledgeItem[]): {
    overallScore: number;
    qualityMetrics: {
      consistency: number;
      coverage: number;
      distribution: number;
      effectiveness: number;
    };
    issues: string[];
    recommendations: string[];
  } {
    return KnowledgeTagQualityService.assessTagQuality(items);
  }

  // Trends analysis methods - delegate to trends service
  static predictTagTrends(items: KnowledgeItem[]): { trending: string[]; declining: string[]; stable: string[] } {
    return KnowledgeTagTrendsService.predictTagTrends(items);
  }

  static analyzeSeasonalPatterns(items: KnowledgeItem[]): {
    seasonalTags: Record<string, { peak: string; frequency: number }>;
    recommendations: string[];
  } {
    return KnowledgeTagTrendsService.analyzeSeasonalPatterns(items);
  }

  static analyzeTagLifecycle(items: KnowledgeItem[]): {
    emerging: string[];
    mature: string[];
    legacy: string[];
    insights: string[];
  } {
    return KnowledgeTagTrendsService.analyzeTagLifecycle(items);
  }

  static forecastTagNeeds(items: KnowledgeItem[]): {
    projectedTags: string[];
    contentGaps: string[];
    recommendations: string[];
  } {
    return KnowledgeTagTrendsService.forecastTagNeeds(items);
  }

  // Comprehensive analysis that uses all services
  static async comprehensiveTagAnalysis(items: KnowledgeItem[]): Promise<{
    coreAnalysis: TagAnalysisResult;
    qualityAssessment: ReturnType<typeof KnowledgeTagQualityService.assessTagQuality>;
    trendAnalysis: ReturnType<typeof KnowledgeTagTrendsService.predictTagTrends>;
    lifecycleAnalysis: ReturnType<typeof KnowledgeTagTrendsService.analyzeTagLifecycle>;
    recommendations: string[];
  }> {
    const coreAnalysis = await KnowledgeTagCoreAnalysisService.analyzeTags(items);
    const qualityAssessment = KnowledgeTagQualityService.assessTagQuality(items);
    const trendAnalysis = KnowledgeTagTrendsService.predictTagTrends(items);
    const lifecycleAnalysis = KnowledgeTagTrendsService.analyzeTagLifecycle(items);
    
    // Combine recommendations from all services
    const recommendations = [
      ...qualityAssessment.recommendations,
      ...lifecycleAnalysis.insights,
      ...trendAnalysis.trending.length > 0 ? [`Monitor trending tags: ${trendAnalysis.trending.slice(0, 3).join(', ')}`] : [],
      ...trendAnalysis.declining.length > 0 ? [`Review declining tags: ${trendAnalysis.declining.slice(0, 3).join(', ')}`] : []
    ].slice(0, 10);
    
    return {
      coreAnalysis,
      qualityAssessment,
      trendAnalysis,
      lifecycleAnalysis,
      recommendations
    };
  }
} 