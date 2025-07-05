/**
 * AI INSTRUCTIONS: (Only need AI instruction at the top of the file ONCE)
 * - Single responsibility: Basic filtering operations for knowledge items
 * - Handles simple filters like category, source, tags, and relevance score
 * - Maintains efficient filtering algorithms
 * - Keep under 250 lines per @golden-rule
 * - Generic approach that works for any organization
 */

import { KnowledgeItem } from '../../../domain/services/interfaces/IKnowledgeRetrievalService';

export class KnowledgeBasicFilterService {

  static filterByCategory(
    items: KnowledgeItem[],
    category: KnowledgeItem['category'],
    limit: number = 10
  ): KnowledgeItem[] {
    return items
      .filter(item => item.category === category)
      .slice(0, limit);
  }

  static filterByCategories(
    items: KnowledgeItem[],
    categories: KnowledgeItem['category'][],
    limit: number = 10
  ): KnowledgeItem[] {
    if (categories.length === 0) return items.slice(0, limit);
    
    return items
      .filter(item => categories.includes(item.category))
      .slice(0, limit);
  }

  static filterBySource(
    items: KnowledgeItem[],
    sources: string[],
    limit: number = 10
  ): KnowledgeItem[] {
    if (sources.length === 0) return items.slice(0, limit);
    
    return items
      .filter(item => sources.includes(item.source))
      .slice(0, limit);
  }

  static filterByTags(
    items: KnowledgeItem[],
    tags: string[],
    limit: number = 10
  ): KnowledgeItem[] {
    if (tags.length === 0) return items.slice(0, limit);
    
    const lowerCaseTags = tags.map(tag => tag.toLowerCase());
    
    return items
      .filter(item => lowerCaseTags.some(tag => 
        item.tags.some(itemTag => itemTag.toLowerCase().includes(tag))
      ))
      .slice(0, limit);
  }

  static filterByRelevanceScore(
    items: KnowledgeItem[],
    minScore: number,
    limit: number = 10
  ): KnowledgeItem[] {
    return items
      .filter(item => item.relevanceScore >= minScore)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);
  }

  static getFaqItems(
    items: KnowledgeItem[],
    limit: number = 10
  ): KnowledgeItem[] {
    return items
      .filter(item => item.source === 'faq')
      .slice(0, limit);
  }

  static getProductInfoItems(
    items: KnowledgeItem[],
    limit: number = 10
  ): KnowledgeItem[] {
    return items
      .filter(item => item.category === 'product_info')
      .slice(0, limit);
  }

  static getSupportItems(
    items: KnowledgeItem[],
    limit: number = 10
  ): KnowledgeItem[] {
    return items
      .filter(item => item.category === 'support')
      .slice(0, limit);
  }

  static getGeneralItems(
    items: KnowledgeItem[],
    limit: number = 10
  ): KnowledgeItem[] {
    return items
      .filter(item => item.category === 'general')
      .slice(0, limit);
  }

  static getPricingItems(
    items: KnowledgeItem[],
    limit: number = 10
  ): KnowledgeItem[] {
    return items
      .filter(item => item.category === 'pricing')
      .slice(0, limit);
  }

  static getItemsByDateRange(
    items: KnowledgeItem[],
    startDate: Date,
    endDate: Date,
    limit: number = 10
  ): KnowledgeItem[] {
    return items
      .filter(item => {
        const itemDate = new Date(item.lastUpdated);
        return itemDate >= startDate && itemDate <= endDate;
      })
      .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime())
      .slice(0, limit);
  }

  static getRecentlyUpdatedItems(
    items: KnowledgeItem[],
    limit: number = 10
  ): KnowledgeItem[] {
    return items
      .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime())
      .slice(0, limit);
  }

  static getItemsBySourcePattern(
    items: KnowledgeItem[],
    sourcePattern: string,
    limit: number = 10
  ): KnowledgeItem[] {
    const lowerPattern = sourcePattern.toLowerCase();
    
    return items
      .filter(item => item.source.toLowerCase().includes(lowerPattern))
      .slice(0, limit);
  }


  static getHighQualityItems(
    items: KnowledgeItem[],
    qualityThreshold: number = 0.8,
    limit: number = 10
  ): KnowledgeItem[] {
    return items
      .filter(item => item.relevanceScore >= qualityThreshold)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);
  }
} 