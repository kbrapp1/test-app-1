/**
 * AI INSTRUCTIONS: (Only need AI instruction at the top of the file ONCE)
 * - Single responsibility: Basic content reporting and summaries
 * - Keep under 120 lines per @golden-rule patterns
 * - Use static methods for efficiency
 * - Simple reporting, no complex dashboard objects
 * - Just generate basic summaries and metrics
 */

import { KnowledgeItem } from '../../../../domain/services/interfaces/IKnowledgeRetrievalService';
import { KnowledgeQualityService } from './KnowledgeQualityService';
import { KnowledgeHealthService } from './KnowledgeHealthService';

export interface ContentSummary {
  totalItems: number;
  averageLength: number;
  overallQualityScore: number;
  topIssues: string[];
  topStrengths: string[];
  recommendations: string[];
}

export interface ContentMetrics {
  totalContent: number;
  averageLength: number;
  qualityScore: number;
  freshnessScore: number;
  completenessScore: number;
  topCategories: Array<{ category: string; count: number }>;
}

export class KnowledgeReportingService {

  static generateContentSummary(items: KnowledgeItem[]): ContentSummary {
    const totalItems = items.length;
    const averageLength = this.calculateAverageLength(items);
    const qualityAnalysis = KnowledgeQualityService.analyzeContentQuality(items);
    const gapAnalysis = KnowledgeQualityService.identifyContentGaps(items);

    const topIssues = [
      ...qualityAnalysis.issues.slice(0, 3),
      ...gapAnalysis.gaps.slice(0, 2)
    ];

    const topStrengths = qualityAnalysis.strengths.slice(0, 3);

    const recommendations = [
      ...gapAnalysis.gaps.slice(0, 2).map((gap: string) => `Address ${gap.toLowerCase()}`),
      'Review and improve content quality',
      'Maintain regular content updates'
    ];

    return {
      totalItems,
      averageLength,
      overallQualityScore: qualityAnalysis.qualityScore,
      topIssues,
      topStrengths,
      recommendations
    };
  }

  static generateContentMetrics(items: KnowledgeItem[]): ContentMetrics {
    const totalContent = items.length;
    const averageLength = this.calculateAverageLength(items);
    const qualityAnalysis = KnowledgeQualityService.analyzeContentQuality(items);
    const freshnessAnalysis = KnowledgeQualityService.calculateContentFreshness(items);
    const completenessAnalysis = KnowledgeQualityService.assessContentCompleteness(items);
    const topCategories = this.getTopCategories(items);

    return {
      totalContent,
      averageLength,
      qualityScore: qualityAnalysis.qualityScore,
      freshnessScore: freshnessAnalysis.freshnessScore,
      completenessScore: completenessAnalysis.completenessScore,
      topCategories
    };
  }

  static generateBasicReport(items: KnowledgeItem[]): {
    summary: ContentSummary;
    metrics: ContentMetrics;
    health: ReturnType<typeof KnowledgeHealthService.getHealthSummary>;
    timestamp: Date;
  } {
    const summary = this.generateContentSummary(items);
    const metrics = this.generateContentMetrics(items);
    const health = KnowledgeHealthService.getHealthSummary(items);

    return {
      summary,
      metrics,
      health,
      timestamp: new Date()
    };
  }

  static filterHighQualityContent(items: KnowledgeItem[]): {
    highQualityItems: KnowledgeItem[];
    lowQualityItems: KnowledgeItem[];
    qualityDistribution: { high: number; medium: number; low: number };
  } {
    const highQualityItems: KnowledgeItem[] = [];
    const lowQualityItems: KnowledgeItem[] = [];
    const qualityDistribution = { high: 0, medium: 0, low: 0 };

    items.forEach(item => {
      const readabilityScore = KnowledgeQualityService.calculateReadabilityScore(item);
      
      if (readabilityScore >= 0.7) {
        qualityDistribution.high++;
        highQualityItems.push(item);
      } else if (readabilityScore >= 0.4) {
        qualityDistribution.medium++;
        highQualityItems.push(item);
      } else {
        qualityDistribution.low++;
        lowQualityItems.push(item);
      }
    });

    return {
      highQualityItems,
      lowQualityItems,
      qualityDistribution
    };
  }

  static generateExportData(items: KnowledgeItem[], format: 'summary' | 'metrics' | 'full'): any {
    switch (format) {
      case 'summary':
        return this.generateContentSummary(items);
      case 'metrics':
        return this.generateContentMetrics(items);
      case 'full':
        return this.generateBasicReport(items);
      default:
        return this.generateContentSummary(items);
    }
  }

  private static calculateAverageLength(items: KnowledgeItem[]): number {
    if (items.length === 0) return 0;
    const totalLength = items.reduce((sum, item) => sum + (item.content?.length || 0), 0);
    return Math.round(totalLength / items.length);
  }

  private static getTopCategories(items: KnowledgeItem[]): Array<{ category: string; count: number }> {
    const categoryCount: Record<string, number> = {};
    
    items.forEach(item => {
      if (item.tags) {
        item.tags.forEach(tag => {
          categoryCount[tag] = (categoryCount[tag] || 0) + 1;
        });
      }
    });

    return Object.entries(categoryCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([category, count]) => ({ category, count }));
  }
} 