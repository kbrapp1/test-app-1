/**
 * Knowledge Relevance Service
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Calculate relevance scores for knowledge items
 * - Handle text similarity and intent matching
 * - Keep under 200-250 lines
 * - Focus on scoring operations only
 * - Follow @golden-rule patterns exactly
 */

import { KnowledgeItem } from '../../../domain/services/interfaces/IKnowledgeRetrievalService';

export class KnowledgeRelevanceService {
  
  calculateRelevanceScore(
    item: KnowledgeItem,
    query: string,
    intent: string
  ): number {
    let score = 0;

    // Base text similarity
    const textSimilarity = this.calculateTextSimilarity(query, item.content + ' ' + item.title);
    score += textSimilarity * 0.6;

    // Intent-category matching bonus
    const intentCategoryBonus = this.getIntentCategoryBonus(intent, item.category);
    score += intentCategoryBonus * 0.3;

    // Tag matching bonus
    const tagBonus = this.calculateTagMatchBonus(query, item.tags);
    score += tagBonus * 0.1;

    return Math.min(score, 1.0); // Cap at 1.0
  }

  calculateTextSimilarity(query: string, text: string): number {
    const queryWords = query.toLowerCase().split(/\s+/).filter(word => word.length > 2);
    const textWords = text.toLowerCase().split(/\s+/);
    
    if (queryWords.length === 0) return 0;

    const matches = queryWords.filter(word => 
      textWords.some(textWord => textWord.includes(word) || word.includes(textWord))
    );

    return matches.length / queryWords.length;
  }

  calculateSimilarityScore(query: string, content: string): number {
    return this.calculateTextSimilarity(query, content);
  }

  private getIntentCategoryBonus(intent: string, category: KnowledgeItem['category']): number {
    const intentCategoryMap: Record<string, KnowledgeItem['category'][]> = {
      'faq_pricing': ['pricing'],
      'faq_features': ['product_info'],
      'faq_general': ['general', 'faq'],
      'support_request': ['support'],
      'sales_inquiry': ['product_info', 'pricing'],
      'demo_request': ['product_info'],
      'booking_request': ['general']
    };

    const relevantCategories = intentCategoryMap[intent] || [];
    return relevantCategories.includes(category) ? 0.5 : 0;
  }

  private calculateTagMatchBonus(query: string, tags: string[]): number {
    const queryWords = query.toLowerCase().split(/\s+/);
    const matchingTags = tags.filter(tag => 
      queryWords.some(word => tag.includes(word) || word.includes(tag))
    );

    return matchingTags.length > 0 ? 0.3 : 0;
  }

  scoreItemsByRelevance(
    items: KnowledgeItem[],
    query: string,
    intent: string,
    minScore: number = 0.3
  ): KnowledgeItem[] {
    return items
      .map(item => ({
        ...item,
        relevanceScore: this.calculateRelevanceScore(item, query, intent)
      }))
      .filter(item => item.relevanceScore >= minScore)
      .sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  findBestMatches(
    items: KnowledgeItem[],
    query: string,
    intent: string,
    maxResults: number = 5,
    minScore: number = 0.3
  ): KnowledgeItem[] {
    const scoredItems = this.scoreItemsByRelevance(items, query, intent, minScore);
    return scoredItems.slice(0, maxResults);
  }

  calculateCategoryRelevance(intent: string, category: KnowledgeItem['category']): number {
    return this.getIntentCategoryBonus(intent, category);
  }

  calculateQueryTagRelevance(query: string, tags: string[]): number {
    return this.calculateTagMatchBonus(query, tags);
  }
} 