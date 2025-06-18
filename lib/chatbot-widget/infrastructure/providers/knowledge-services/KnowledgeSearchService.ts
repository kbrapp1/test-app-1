/**
 * Knowledge Search Service
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Handle knowledge search and similarity operations
 * - Coordinate search operations using item and relevance services
 * - Keep under 200-250 lines
 * - Focus on search operations only
 * - Follow @golden-rule patterns exactly
 */

import { KnowledgeItem, KnowledgeSearchResult } from '../../../domain/services/interfaces/IKnowledgeRetrievalService';
import { KnowledgeItemService } from './KnowledgeItemService';
import { KnowledgeRelevanceService } from './KnowledgeRelevanceService';

export class KnowledgeSearchService {
  constructor(
    private readonly itemService: KnowledgeItemService,
    private readonly relevanceService: KnowledgeRelevanceService
  ) {}

  async searchKnowledge(
    userQuery: string,
    intent: string,
    maxResults: number = 5,
    minRelevanceScore: number = 0.3
  ): Promise<Omit<KnowledgeSearchResult, 'searchTimeMs' | 'usedFallback'>> {
    // Get all available knowledge items
    const allItems = await this.itemService.getAllKnowledgeItems();

    // Filter and score based on query and intent
    const scoredItems = this.relevanceService.findBestMatches(
      allItems,
      userQuery,
      intent,
      maxResults,
      minRelevanceScore
    );

    return {
      items: scoredItems,
      totalFound: scoredItems.length,
      searchQuery: userQuery
    };
  }

  async findSimilarContent(
    query: string,
    excludeIds: string[] = [],
    limit: number = 5
  ): Promise<KnowledgeItem[]> {
    const allItems = await this.itemService.getAllKnowledgeItems();
    
    const similarItems = allItems
      .filter(item => !excludeIds.includes(item.id))
      .map(item => ({
        ...item,
        relevanceScore: this.relevanceService.calculateSimilarityScore(query, item.content + ' ' + item.title)
      }))
      .filter(item => item.relevanceScore > 0.2)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);

    return similarItems;
  }

  async searchByCategory(
    category: KnowledgeItem['category'],
    query?: string,
    limit: number = 10
  ): Promise<KnowledgeItem[]> {
    const categoryItems = await this.itemService.getKnowledgeByCategory(category, limit * 2);

    if (!query) {
      return categoryItems.slice(0, limit);
    }

    // Score and filter by query if provided
    const scoredItems = categoryItems
      .map(item => ({
        ...item,
        relevanceScore: this.relevanceService.calculateSimilarityScore(query, item.content + ' ' + item.title)
      }))
      .filter(item => item.relevanceScore > 0.1)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);

    return scoredItems;
  }

  async searchByTags(
    tags: string[],
    query?: string,
    limit: number = 10
  ): Promise<KnowledgeItem[]> {
    const taggedItems = await this.itemService.getKnowledgeByTags(tags, limit * 2);

    if (!query) {
      return taggedItems.slice(0, limit);
    }

    // Score and filter by query if provided
    const scoredItems = taggedItems
      .map(item => ({
        ...item,
        relevanceScore: this.relevanceService.calculateSimilarityScore(query, item.content + ' ' + item.title)
      }))
      .filter(item => item.relevanceScore > 0.1)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);

    return scoredItems;
  }

  async findBestMatchForIntent(
    intent: string,
    query: string,
    maxResults: number = 3
  ): Promise<KnowledgeItem[]> {
    const allItems = await this.itemService.getAllKnowledgeItems();
    
    // Focus on intent-category matching with higher weight
    const intentFocusedItems = allItems
      .map(item => ({
        ...item,
        relevanceScore: this.calculateIntentFocusedScore(item, query, intent)
      }))
      .filter(item => item.relevanceScore > 0.2)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, maxResults);

    return intentFocusedItems;
  }

  async searchWithFallback(
    query: string,
    intent: string,
    maxResults: number = 5,
    minScore: number = 0.3
  ): Promise<KnowledgeItem[]> {
    // API-only approach: no static fallbacks, just throw error if search fails
    const primaryResults = await this.searchKnowledge(query, intent, maxResults, minScore);
    
    if (primaryResults.items.length === 0) {
      throw new Error(`No knowledge items found for query "${query}" with intent "${intent}". API-only mode - no static fallbacks available.`);
    }

    return primaryResults.items;
  }

  private calculateIntentFocusedScore(
    item: KnowledgeItem,
    query: string,
    intent: string
  ): number {
    let score = 0;

    // Higher weight for intent-category matching
    const intentBonus = this.relevanceService.calculateCategoryRelevance(intent, item.category);
    score += intentBonus * 0.5;

    // Text similarity with moderate weight
    const textSimilarity = this.relevanceService.calculateTextSimilarity(query, item.content + ' ' + item.title);
    score += textSimilarity * 0.4;

    // Tag matching bonus
    const tagBonus = this.relevanceService.calculateQueryTagRelevance(query, item.tags);
    score += tagBonus * 0.1;

    return Math.min(score, 1.0);
  }
} 