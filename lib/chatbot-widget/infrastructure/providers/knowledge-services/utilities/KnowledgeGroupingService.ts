/**
 * AI INSTRUCTIONS: (Only need AI instruction at the top of the file ONCE)
 * - Single responsibility: Simple content grouping operations
 * - Keep under 100 lines per @golden-rule patterns
 * - Use static methods for efficiency
 * - No complex interfaces or over-engineering
 * - Just basic grouping, nothing more
 */

import { KnowledgeItem } from '../../../../domain/services/interfaces/IKnowledgeRetrievalService';

export class KnowledgeGroupingService {

  static groupByField(items: KnowledgeItem[], field: keyof KnowledgeItem): Record<string, number> {
    const groups: Record<string, number> = {};
    
    items.forEach(item => {
      const value = String(item[field] || 'unknown');
      groups[value] = (groups[value] || 0) + 1;
    });
    
    return groups;
  }

  static groupByTags(items: KnowledgeItem[]): Record<string, number> {
    const tagCounts: Record<string, number> = {};
    
    items.forEach(item => {
      if (item.tags && item.tags.length > 0) {
        item.tags.forEach(tag => {
          const normalizedTag = tag.trim().toLowerCase();
          tagCounts[normalizedTag] = (tagCounts[normalizedTag] || 0) + 1;
        });
      }
    });
    
    return tagCounts;
  }

  static groupByContentLength(items: KnowledgeItem[]): Record<string, number> {
    const groups: Record<string, number> = {
      'short': 0,    // < 100 chars
      'medium': 0,   // 100-500 chars
      'long': 0,     // 500-1500 chars
      'very_long': 0 // > 1500 chars
    };
    
    items.forEach(item => {
      const length = item.content?.length || 0;
      
      if (length < 100) groups.short++;
      else if (length < 500) groups.medium++;
      else if (length < 1500) groups.long++;
      else groups.very_long++;
    });
    
    return groups;
  }

  static groupBySource(items: KnowledgeItem[]): Record<string, number> {
    return this.groupByField(items, 'source');
  }

  static groupByCategory(items: KnowledgeItem[]): Record<string, number> {
    return this.groupByField(items, 'category');
  }

  static countUniqueSources(items: KnowledgeItem[]): number {
    const sources = new Set(items.map(item => item.source || 'unknown'));
    return sources.size;
  }

  static countUniqueTags(items: KnowledgeItem[]): number {
    const allTags = items.flatMap(item => item.tags || []);
    const uniqueTags = new Set(allTags);
    return uniqueTags.size;
  }

  static countItemsWithoutTags(items: KnowledgeItem[]): number {
    return items.filter(item => !item.tags || item.tags.length === 0).length;
  }
} 