/**
 * AI INSTRUCTIONS: (Only need AI instruction at the top of the file ONCE)
 * - Single responsibility: Content search and ranking for knowledge items
 * - Handles text-based search with relevance scoring
 * - Supports similarity matching and recommendations
 * - Keep under 250 lines per @golden-rule
 * - Generic approach that works for any organization
 */

import { KnowledgeItem } from '../../../domain/services/interfaces/IKnowledgeRetrievalService';

/** Search Result Interface */
/* interface SearchResult {
  item: KnowledgeItem;
  score: number;
} */

export class KnowledgeSearchService {

  static searchByContent(
    items: KnowledgeItem[],
    searchTerm: string,
    limit: number = 10
  ): KnowledgeItem[] {
    if (!searchTerm.trim()) return items.slice(0, limit);
    
    const lowerSearchTerm = searchTerm.toLowerCase();
    
    // Score items based on search term relevance
    const scoredItems = items
      .map(item => ({
        item,
        score: this.calculateContentScore(item, lowerSearchTerm)
      }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return scoredItems.map(({ item }) => item);
  }

  static searchByTitle(
    items: KnowledgeItem[],
    searchTerm: string,
    limit: number = 10
  ): KnowledgeItem[] {
    if (!searchTerm.trim()) return items.slice(0, limit);
    
    const lowerSearchTerm = searchTerm.toLowerCase();
    
    const scoredItems = items
      .map(item => ({
        item,
        score: this.calculateTitleScore(item.title, lowerSearchTerm)
      }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return scoredItems.map(({ item }) => item);
  }

  static searchByTags(
    items: KnowledgeItem[],
    searchTerm: string,
    limit: number = 10
  ): KnowledgeItem[] {
    if (!searchTerm.trim()) return items.slice(0, limit);
    
    const lowerSearchTerm = searchTerm.toLowerCase();
    
    const scoredItems = items
      .map(item => ({
        item,
        score: this.calculateTagScore(item.tags, lowerSearchTerm)
      }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return scoredItems.map(({ item }) => item);
  }

  static getSimilarItems(
    items: KnowledgeItem[],
    referenceItem: KnowledgeItem,
    limit: number = 5
  ): KnowledgeItem[] {
    const referenceTags = referenceItem.tags.map(tag => tag.toLowerCase());
    
    const scoredItems = items
      .filter(item => item.id !== referenceItem.id)
      .map(item => ({
        item,
        score: this.calculateSimilarityScore(item.tags, referenceTags)
      }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return scoredItems.map(({ item }) => item);
  }

  static getSimilarItemsByContent(
    items: KnowledgeItem[],
    referenceItem: KnowledgeItem,
    limit: number = 5
  ): KnowledgeItem[] {
    const referenceWords = this.extractKeywords(referenceItem.content);
    
    const scoredItems = items
      .filter(item => item.id !== referenceItem.id)
      .map(item => ({
        item,
        score: this.calculateContentSimilarityScore(item.content, referenceWords)
      }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return scoredItems.map(({ item }) => item);
  }

  private static calculateContentScore(item: KnowledgeItem, searchTerm: string): number {
    let score = 0;
    const lowerTitle = item.title.toLowerCase();
    const lowerContent = item.content.toLowerCase();
    
    // Exact title match gets highest score
    if (lowerTitle === searchTerm) {
      score += 20;
    } else if (lowerTitle.includes(searchTerm)) {
      score += 15;
    }
    
    // Content matches get medium score
    if (lowerContent.includes(searchTerm)) {
      score += 10;
    }
    
    // Tag matches get good score
    if (item.tags.some(tag => tag.toLowerCase().includes(searchTerm))) {
      score += 12;
    }
    
    // Boost score based on item's relevance score
    score *= item.relevanceScore;
    
    return score;
  }

  private static calculateTitleScore(title: string, searchTerm: string): number {
    const lowerTitle = title.toLowerCase();
    
    // Exact match
    if (lowerTitle === searchTerm) return 20;
    
    // Starts with search term
    if (lowerTitle.startsWith(searchTerm)) return 15;
    
    // Contains search term
    if (lowerTitle.includes(searchTerm)) return 10;
    
    // Word boundary match
    const words = lowerTitle.split(/\s+/);
    if (words.some(word => word.includes(searchTerm))) return 8;
    
    return 0;
  }


  private static calculateTagScore(tags: string[], searchTerm: string): number {
    let score = 0;
    
    tags.forEach(tag => {
      const lowerTag = tag.toLowerCase();
      
      // Exact tag match
      if (lowerTag === searchTerm) {
        score += 15;
      } else if (lowerTag.includes(searchTerm)) {
        score += 10;
      }
    });
    
    return score;
  }

  private static calculateSimilarityScore(itemTags: string[], referenceTags: string[]): number {
    const lowerItemTags = itemTags.map(tag => tag.toLowerCase());
    const commonTags = lowerItemTags.filter(tag => referenceTags.includes(tag));
    
    if (commonTags.length === 0) return 0;
    
    // Jaccard similarity: intersection / union
    const union = new Set([...lowerItemTags, ...referenceTags]);
    return (commonTags.length / union.size) * 100;
  }

  private static extractKeywords(content: string): string[] {
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'cannot', 'this', 'that', 'these', 'those']);
    
    return content
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3 && !stopWords.has(word))
      .slice(0, 20); // Limit to top 20 keywords
  }


  private static calculateContentSimilarityScore(content: string, referenceWords: string[]): number {
    const contentWords = this.extractKeywords(content);
    const commonWords = contentWords.filter(word => referenceWords.includes(word));
    
    if (commonWords.length === 0) return 0;
    
    return (commonWords.length / Math.max(contentWords.length, referenceWords.length)) * 100;
  }
} 