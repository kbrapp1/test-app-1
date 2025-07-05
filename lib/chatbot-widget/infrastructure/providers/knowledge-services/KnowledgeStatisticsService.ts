/**
 * AI INSTRUCTIONS: (Only need AI instruction at the top of the file ONCE)
 * - Single responsibility: Core knowledge statistics and health metrics
 * - Consolidates basic stats and health metrics into one focused service
 * - Keep under 250 lines per @golden-rule patterns
 * - Use static methods for efficiency and statelessness
 * - Delegate complex calculations to utility service
 * - Handle validation and error cases appropriately
 */

import { KnowledgeItem } from '../../../domain/services/interfaces/IKnowledgeRetrievalService';
import { KnowledgeStats, KnowledgeHealthMetrics } from './types/KnowledgeServiceTypes';
import { KnowledgeUtilityService } from './KnowledgeUtilityService';
import { KnowledgeContentHashingService } from './utilities/KnowledgeContentHashingService';
import { KnowledgeGroupingService } from './utilities/KnowledgeGroupingService';

export class KnowledgeStatisticsService {

  // Primary Statistics Operations
  static async getBasicStats(items: KnowledgeItem[]): Promise<KnowledgeStats> {
    this.validateItems(items);
    
    const totalItems = items.length;
    const totalSources = this.countUniqueSources(items);
    const totalTags = this.countUniqueTags(items);
    const averageContentLength = this.calculateAverageContentLength(items);
    const itemsByType = this.groupItemsByType(items);
    const itemsBySource = this.groupItemsBySource(items);
    const tagDistribution = this.calculateTagDistribution(items);
    const contentLengthDistribution = this.calculateContentLengthDistribution(items);
    const recentlyUpdated = this.countRecentlyUpdated(items);
    const itemsWithoutTags = this.countItemsWithoutTags(items);

    return {
      totalItems,
      totalSources,
      totalTags,
      averageContentLength,
      itemsByType,
      itemsBySource,
      tagDistribution,
      contentLengthDistribution,
      recentlyUpdated,
      itemsWithoutTags
    };
  }

  static async getHealthMetrics(items: KnowledgeItem[]): Promise<KnowledgeHealthMetrics> {
    this.validateItems(items);
    
    const totalItems = items.length;
    const itemsWithContent = this.countItemsWithContent(items);
    const itemsWithTags = this.countItemsWithTags(items);
    const itemsWithMetadata = this.countItemsWithMetadata(items);
    const duplicateItems = this.countDuplicateItems(items);
    const staleItems = this.countStaleItems(items);
    const incompleteItems = this.countIncompleteItems(items);
    
    const contentCoverage = totalItems > 0 ? (itemsWithContent / totalItems) * 100 : 0;
    const tagCoverage = totalItems > 0 ? (itemsWithTags / totalItems) * 100 : 0;
    const metadataCoverage = totalItems > 0 ? (itemsWithMetadata / totalItems) * 100 : 0;
    const duplicateRate = totalItems > 0 ? (duplicateItems / totalItems) * 100 : 0;
    const staleRate = totalItems > 0 ? (staleItems / totalItems) * 100 : 0;
    const completionRate = totalItems > 0 ? ((totalItems - incompleteItems) / totalItems) * 100 : 0;

    const overallHealth = this.calculateOverallHealth(
      contentCoverage,
      tagCoverage,
      metadataCoverage,
      duplicateRate,
      staleRate,
      completionRate
    );

    return {
      totalItems,
      itemsWithContent,
      itemsWithTags,
      itemsWithMetadata,
      duplicateItems,
      staleItems,
      incompleteItems,
      contentCoverage,
      tagCoverage,
      metadataCoverage,
      duplicateRate,
      staleRate,
      completionRate,
      overallHealth
    };
  }

  // Counting Operations
  private static countUniqueSources(items: KnowledgeItem[]): number {
    return KnowledgeGroupingService.countUniqueSources(items);
  }

  private static countUniqueTags(items: KnowledgeItem[]): number {
    return KnowledgeGroupingService.countUniqueTags(items);
  }

  private static countItemsWithContent(items: KnowledgeItem[]): number {
    return items.filter(item => 
      item.content && 
      item.content.trim().length > 0
    ).length;
  }

  private static countItemsWithTags(items: KnowledgeItem[]): number {
    return items.filter(item => 
      item.tags && 
      item.tags.length > 0
    ).length;
  }

  private static countItemsWithMetadata(items: KnowledgeItem[]): number {
    return items.filter(item => 
      item.tags && 
      item.tags.length > 0
    ).length;
  }

  private static countDuplicateItems(items: KnowledgeItem[]): number {
    const contentHashes = new Map<string, number>();
    
    items.forEach(item => {
      const contentHash = KnowledgeContentHashingService.generateItemContentHash(item);
      contentHashes.set(contentHash, (contentHashes.get(contentHash) || 0) + 1);
    });

    let duplicateCount = 0;
    contentHashes.forEach(count => {
      if (count > 1) {
        duplicateCount += count - 1;
      }
    });

    return duplicateCount;
  }

  private static countStaleItems(items: KnowledgeItem[]): number {
    const staleThreshold = new Date();
    staleThreshold.setMonth(staleThreshold.getMonth() - 6);

    return items.filter(item => {
      const updatedAt = new Date(item.lastUpdated);
      return updatedAt < staleThreshold;
    }).length;
  }

  private static countIncompleteItems(items: KnowledgeItem[]): number {
    return items.filter(item => {
      const hasContent = item.content && item.content.trim().length > 0;
      const hasTitle = item.title && item.title.trim().length > 0;
      const hasMinimalMetadata = item.tags && item.tags.length > 0;
      
      return !hasContent || !hasTitle || !hasMinimalMetadata;
    }).length;
  }

  private static countRecentlyUpdated(items: KnowledgeItem[]): number {
    const recentThreshold = new Date();
    recentThreshold.setDate(recentThreshold.getDate() - 30);

    return items.filter(item => {
      const updatedAt = new Date(item.lastUpdated);
      return updatedAt >= recentThreshold;
    }).length;
  }

  private static countItemsWithoutTags(items: KnowledgeItem[]): number {
    return KnowledgeGroupingService.countItemsWithoutTags(items);
  }

  // Basic Calculation Operations
  private static calculateAverageContentLength(items: KnowledgeItem[]): number {
    if (items.length === 0) return 0;
    
    const totalLength = items.reduce((sum, item) => {
      return sum + (item.content?.length || 0);
    }, 0);
    
    return Math.round(totalLength / items.length);
  }

  private static calculateOverallHealth(
    contentCoverage: number,
    tagCoverage: number,
    metadataCoverage: number,
    duplicateRate: number,
    staleRate: number,
    completionRate: number
  ): number {
    const positiveFactors = (contentCoverage + tagCoverage + metadataCoverage + completionRate) / 4;
    const negativeFactors = (duplicateRate + staleRate) / 2;
    const overallHealth = Math.max(0, positiveFactors - negativeFactors);
    
    return Math.round(overallHealth * 100) / 100;
  }

  // Grouping Operations - Delegate to simple grouping service
  private static groupItemsByType(items: KnowledgeItem[]): Record<string, number> {
    return KnowledgeGroupingService.groupByCategory(items);
  }

  private static groupItemsBySource(items: KnowledgeItem[]): Record<string, number> {
    return KnowledgeGroupingService.groupBySource(items);
  }

  private static calculateTagDistribution(items: KnowledgeItem[]): Record<string, number> {
    return KnowledgeGroupingService.groupByTags(items);
  }

  private static calculateContentLengthDistribution(items: KnowledgeItem[]): Record<string, number> {
    return KnowledgeGroupingService.groupByContentLength(items);
  }

  // Validation
  private static validateItems(items: KnowledgeItem[]): void {
    if (!Array.isArray(items)) {
      throw new Error('Items must be an array');
    }
  }
} 