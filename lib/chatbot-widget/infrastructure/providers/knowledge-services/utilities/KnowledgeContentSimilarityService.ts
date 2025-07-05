/**
 * AI INSTRUCTIONS: (Only need AI instruction at the top of the file ONCE)
 * - Single responsibility: Content similarity analysis and comparison
 * - Keep business logic pure, no external dependencies
 * - Keep under 250 lines per @golden-rule patterns
 * - Use static methods for efficiency and statelessness
 * - Handle domain errors with specific error types
 * - Focus on similarity algorithms, clustering, and content relationships
 */

import { KnowledgeItem } from '../../../../domain/services/interfaces/IKnowledgeRetrievalService';
import { KnowledgeContentHashingService } from './KnowledgeContentHashingService';

export interface SimilarityResult {
  item1: KnowledgeItem;
  item2: KnowledgeItem;
  similarity: number;
  similarityType: 'content' | 'title' | 'tags' | 'combined';
}

export interface ClusterResult {
  clusterId: string;
  items: KnowledgeItem[];
  centroid: string;
  averageSimilarity: number;
}

export class KnowledgeContentSimilarityService {

  // Content Similarity Operations
  static calculateContentSimilarity(item1: KnowledgeItem, item2: KnowledgeItem): number {
    const content1 = KnowledgeContentHashingService.normalizeForComparison(item1.content || '');
    const content2 = KnowledgeContentHashingService.normalizeForComparison(item2.content || '');
    
    if (content1.length === 0 || content2.length === 0) {
      return 0;
    }
    
    // Enhanced Jaccard similarity with word filtering
    const words1 = new Set(content1.split(' ').filter(word => word.length > 2));
    const words2 = new Set(content2.split(' ').filter(word => word.length > 2));
    
    if (words1.size === 0 || words2.size === 0) {
      return 0;
    }
    
    const intersection = new Set([...words1].filter(word => words2.has(word)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  }

  static calculateTitleSimilarity(item1: KnowledgeItem, item2: KnowledgeItem): number {
    const title1 = KnowledgeContentHashingService.normalizeForComparison(item1.title || '');
    const title2 = KnowledgeContentHashingService.normalizeForComparison(item2.title || '');
    
    if (title1.length === 0 || title2.length === 0) {
      return 0;
    }
    
    const words1 = new Set(title1.split(' ').filter(word => word.length > 2));
    const words2 = new Set(title2.split(' ').filter(word => word.length > 2));
    
    if (words1.size === 0 || words2.size === 0) {
      return 0;
    }
    
    const intersection = new Set([...words1].filter(word => words2.has(word)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  }

  static calculateTagSimilarity(item1: KnowledgeItem, item2: KnowledgeItem): number {
    const tags1 = new Set((item1.tags || []).map(tag => tag.toLowerCase()));
    const tags2 = new Set((item2.tags || []).map(tag => tag.toLowerCase()));
    
    if (tags1.size === 0 || tags2.size === 0) {
      return 0;
    }
    
    const intersection = new Set([...tags1].filter(tag => tags2.has(tag)));
    const union = new Set([...tags1, ...tags2]);
    
    return intersection.size / union.size;
  }

  static calculateCombinedSimilarity(item1: KnowledgeItem, item2: KnowledgeItem): number {
    const contentSim = this.calculateContentSimilarity(item1, item2);
    const titleSim = this.calculateTitleSimilarity(item1, item2);
    const tagSim = this.calculateTagSimilarity(item1, item2);
    
    // Weighted combination: content is most important
    return (contentSim * 0.6) + (titleSim * 0.25) + (tagSim * 0.15);
  }

  // Similarity Finding Operations
  static findSimilarItems(items: KnowledgeItem[], threshold: number = 0.7): SimilarityResult[] {
    const similarPairs: SimilarityResult[] = [];

    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        const similarity = this.calculateCombinedSimilarity(items[i], items[j]);
        
        if (similarity >= threshold) {
          similarPairs.push({
            item1: items[i],
            item2: items[j],
            similarity,
            similarityType: 'combined'
          });
        }
      }
    }

    return similarPairs.sort((a, b) => b.similarity - a.similarity);
  }

  static findSimilarByType(
    items: KnowledgeItem[], 
    type: 'content' | 'title' | 'tags' = 'content',
    threshold: number = 0.7
  ): SimilarityResult[] {
    const similarPairs: SimilarityResult[] = [];
    const calculateSimilarity = this.getSimilarityFunction(type);

    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        const similarity = calculateSimilarity(items[i], items[j]);
        
        if (similarity >= threshold) {
          similarPairs.push({
            item1: items[i],
            item2: items[j],
            similarity,
            similarityType: type
          });
        }
      }
    }

    return similarPairs.sort((a, b) => b.similarity - a.similarity);
  }

  static findMostSimilarTo(targetItem: KnowledgeItem, candidates: KnowledgeItem[], count: number = 5): SimilarityResult[] {
    const similarities = candidates
      .filter(item => item.id !== targetItem.id) // Exclude self
      .map(item => ({
        item1: targetItem,
        item2: item,
        similarity: this.calculateCombinedSimilarity(targetItem, item),
        similarityType: 'combined' as const
      }))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, count);

    return similarities;
  }

  // Content Clustering Operations
  static clusterBySimilarity(items: KnowledgeItem[], threshold: number = 0.6): ClusterResult[] {
    const clusters: ClusterResult[] = [];
    const processed = new Set<string>();

    items.forEach(item => {
      if (processed.has(item.id)) return;

      const cluster: KnowledgeItem[] = [item];
      processed.add(item.id);

      // Find similar items for this cluster
      items.forEach(otherItem => {
        if (processed.has(otherItem.id)) return;

        const similarity = this.calculateCombinedSimilarity(item, otherItem);
        if (similarity >= threshold) {
          cluster.push(otherItem);
          processed.add(otherItem.id);
        }
      });

      if (cluster.length > 1) {
        clusters.push({
          clusterId: `cluster-${clusters.length + 1}`,
          items: cluster,
          centroid: this.calculateCentroid(cluster),
          averageSimilarity: this.calculateAverageIntraClusterSimilarity(cluster)
        });
      }
    });

    return clusters.sort((a, b) => b.items.length - a.items.length);
  }

  static clusterByTags(items: KnowledgeItem[]): ClusterResult[] {
    const tagClusters = new Map<string, KnowledgeItem[]>();

    items.forEach(item => {
      if (!item.tags || item.tags.length === 0) return;

      item.tags.forEach(tag => {
        const normalizedTag = tag.toLowerCase();
        if (!tagClusters.has(normalizedTag)) {
          tagClusters.set(normalizedTag, []);
        }
        tagClusters.get(normalizedTag)!.push(item);
      });
    });

    return Array.from(tagClusters.entries())
      .filter(([_, items]) => items.length > 1) // Only clusters with multiple items
      .map(([tag, clusterItems]) => ({
        clusterId: `tag-${tag}`,
        items: clusterItems,
        centroid: tag,
        averageSimilarity: this.calculateAverageIntraClusterSimilarity(clusterItems)
      }))
      .sort((a, b) => b.items.length - a.items.length);
  }

  // Advanced Similarity Operations
  static detectContentDrift(items: KnowledgeItem[], timeWindowDays: number = 30): Array<{
    item: KnowledgeItem;
    driftScore: number;
    similarItems: KnowledgeItem[];
  }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - timeWindowDays);

    const recentItems = items.filter(item => item.lastUpdated >= cutoffDate);
    const olderItems = items.filter(item => item.lastUpdated < cutoffDate);

    return recentItems.map(recentItem => {
      const similarOlderItems = olderItems
        .map(olderItem => ({
          item: olderItem,
          similarity: this.calculateCombinedSimilarity(recentItem, olderItem)
        }))
        .filter(result => result.similarity > 0.5)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 5);

      const avgSimilarity = similarOlderItems.length > 0
        ? similarOlderItems.reduce((sum, result) => sum + result.similarity, 0) / similarOlderItems.length
        : 0;

      return {
        item: recentItem,
        driftScore: 1 - avgSimilarity, // Higher drift = less similar to older content
        similarItems: similarOlderItems.map(result => result.item)
      };
    }).sort((a, b) => b.driftScore - a.driftScore);
  }

  // Helper Methods
  private static getSimilarityFunction(type: 'content' | 'title' | 'tags') {
    switch (type) {
      case 'content': return this.calculateContentSimilarity.bind(this);
      case 'title': return this.calculateTitleSimilarity.bind(this);
      case 'tags': return this.calculateTagSimilarity.bind(this);
      default: return this.calculateContentSimilarity.bind(this);
    }
  }

  private static calculateCentroid(items: KnowledgeItem[]): string {
    // Simple centroid calculation - most common words
    const allWords = items
      .flatMap(item => KnowledgeContentHashingService.normalizeForComparison(item.content || '').split(' '))
      .filter(word => word.length > 2);

    const wordCounts = new Map<string, number>();
    allWords.forEach(word => {
      wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
    });

    return Array.from(wordCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word)
      .join(' ');
  }

  private static calculateAverageIntraClusterSimilarity(items: KnowledgeItem[]): number {
    if (items.length < 2) return 1.0;

    let totalSimilarity = 0;
    let pairCount = 0;

    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        totalSimilarity += this.calculateCombinedSimilarity(items[i], items[j]);
        pairCount++;
      }
    }

    return pairCount > 0 ? totalSimilarity / pairCount : 0;
  }
} 