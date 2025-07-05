/**
 * AI INSTRUCTIONS:
 * - Single responsibility: Basic statistics calculations
 * - Keep under 120 lines per @golden-rule patterns
 * - Use static methods for efficiency
 * - No complex interfaces or over-engineering
 * - Just math and basic stats, nothing more
 */

import { KnowledgeItem } from '../../../../domain/services/interfaces/IKnowledgeRetrievalService';

export class KnowledgeStatsService {

  static calculateBasicStats(items: KnowledgeItem[]) {
    const totalItems = items.length;
    const averageContentLength = this.calculateAverageContentLength(items);
    const totalContentLength = items.reduce((sum, item) => sum + (item.content?.length || 0), 0);
    
    return {
      totalItems,
      averageContentLength,
      totalContentLength,
      itemsWithContent: items.filter(item => item.content && item.content.trim().length > 0).length,
      itemsWithTags: items.filter(item => item.tags && item.tags.length > 0).length
    };
  }

  static calculateContentLengthStats(items: KnowledgeItem[]) {
    const lengths = items.map(item => item.content?.length || 0).filter(length => length > 0);
    
    if (lengths.length === 0) {
      return { min: 0, max: 0, average: 0, median: 0 };
    }

    const sorted = lengths.sort((a, b) => a - b);
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    const average = lengths.reduce((sum, length) => sum + length, 0) / lengths.length;
    const median = sorted.length % 2 === 0
      ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
      : sorted[Math.floor(sorted.length / 2)];

    return { min, max, average: Math.round(average), median };
  }

  static calculateDistributionStats(distribution: Record<string, number>) {
    const values = Object.values(distribution);
    const total = values.reduce((sum, count) => sum + count, 0);
    
    if (total === 0) {
      return { entropy: 0, maxPercentage: 0, evenness: 0 };
    }

    // Calculate entropy (measure of distribution evenness)
    const entropy = values.reduce((entropy, count) => {
      const probability = count / total;
      return entropy - (probability * Math.log2(probability || 1));
    }, 0);

    // Calculate max percentage (measure of concentration)
    const maxPercentage = (Math.max(...values) / total) * 100;

    // Calculate evenness (normalized entropy)
    const maxEntropy = Math.log2(values.length);
    const evenness = maxEntropy > 0 ? entropy / maxEntropy : 0;

    return {
      entropy: Math.round(entropy * 100) / 100,
      maxPercentage: Math.round(maxPercentage * 100) / 100,
      evenness: Math.round(evenness * 100) / 100
    };
  }

  static calculateTagStats(items: KnowledgeItem[]) {
    const itemsWithTags = items.filter(item => item.tags && item.tags.length > 0);
    const allTags = items.flatMap(item => item.tags || []);
    const uniqueTags = new Set(allTags);
    
    const averageTagsPerItem = itemsWithTags.length > 0 
      ? allTags.length / itemsWithTags.length 
      : 0;

    return {
      totalTags: allTags.length,
      uniqueTags: uniqueTags.size,
      averageTagsPerItem: Math.round(averageTagsPerItem * 100) / 100,
      itemsWithoutTags: items.length - itemsWithTags.length,
      tagCoverage: items.length > 0 ? (itemsWithTags.length / items.length) * 100 : 0
    };
  }

  static calculateHealthScore(items: KnowledgeItem[]): number {
    const basicStats = this.calculateBasicStats(items);
    const tagStats = this.calculateTagStats(items);
    
    if (basicStats.totalItems === 0) return 0;

    // Simple health scoring
    const contentScore = (basicStats.itemsWithContent / basicStats.totalItems) * 100;
    const tagScore = tagStats.tagCoverage;
    const averageLengthScore = Math.min(basicStats.averageContentLength / 200, 1) * 100;

    const overallScore = (contentScore * 0.4 + tagScore * 0.3 + averageLengthScore * 0.3);
    return Math.round(overallScore);
  }

  private static calculateAverageContentLength(items: KnowledgeItem[]): number {
    if (items.length === 0) return 0;
    
    const totalLength = items.reduce((sum, item) => {
      return sum + (item.content?.length || 0);
    }, 0);
    
    return Math.round(totalLength / items.length);
  }
} 