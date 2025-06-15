/**
 * Simple Knowledge Retrieval Service
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Coordinate knowledge retrieval operations
 * - Delegate specialized operations to focused services
 * - Keep under 200-250 lines by extracting knowledge services
 * - Use composition pattern for complex operations
 * - Follow @golden-rule patterns exactly
 */

import { IKnowledgeRetrievalService, KnowledgeItem, KnowledgeSearchResult, KnowledgeRetrievalContext } from '../../domain/services/interfaces/IKnowledgeRetrievalService';
import { ChatbotConfig } from '../../domain/entities/ChatbotConfig';
import {
  KnowledgeSearchService,
  KnowledgeItemService,
  KnowledgeRelevanceService
} from './knowledge-services';

export class SimpleKnowledgeRetrievalService implements IKnowledgeRetrievalService {
  private readonly searchService: KnowledgeSearchService;
  private readonly itemService: KnowledgeItemService;
  private readonly relevanceService: KnowledgeRelevanceService;

  constructor(chatbotConfig: ChatbotConfig) {
    this.itemService = new KnowledgeItemService(chatbotConfig);
    this.relevanceService = new KnowledgeRelevanceService();
    this.searchService = new KnowledgeSearchService(this.itemService, this.relevanceService);
  }

  /**
   * Search for relevant knowledge based on user query and intent
   */
  async searchKnowledge(context: KnowledgeRetrievalContext): Promise<KnowledgeSearchResult> {
    const startTime = Date.now();
    const { userQuery, intentResult, maxResults = 5, minRelevanceScore = 0.3 } = context;

    try {
      const result = await this.searchService.searchKnowledge(
        userQuery,
        intentResult.intent,
        maxResults,
        minRelevanceScore
      );

      const processingTime = Date.now() - startTime;
      return {
        ...result,
        searchTimeMs: processingTime,
        usedFallback: false
      };
    } catch (error) {
      // Knowledge search failed - returning fallback results
      const fallbackItems = await this.itemService.getFrequentlyAskedQuestions(maxResults);
      const processingTime = Date.now() - startTime;

      return {
        items: fallbackItems,
        totalFound: fallbackItems.length,
        searchQuery: userQuery,
        searchTimeMs: processingTime,
        usedFallback: true
      };
    }
  }

  /**
   * Get knowledge items by category
   */
  async getKnowledgeByCategory(
    category: KnowledgeItem['category'],
    limit: number = 10
  ): Promise<KnowledgeItem[]> {
    return this.itemService.getKnowledgeByCategory(category, limit);
  }

  /**
   * Get frequently asked questions
   */
  async getFrequentlyAskedQuestions(limit: number = 10): Promise<KnowledgeItem[]> {
    return this.itemService.getFrequentlyAskedQuestions(limit);
  }

  /**
   * Search for similar questions/content
   */
  async findSimilarContent(
    query: string,
    excludeIds: string[] = [],
    limit: number = 5
  ): Promise<KnowledgeItem[]> {
    return this.searchService.findSimilarContent(query, excludeIds, limit);
  }

  /**
   * Get knowledge items by tags
   */
  async getKnowledgeByTags(
    tags: string[],
    limit: number = 10
  ): Promise<KnowledgeItem[]> {
    return this.itemService.getKnowledgeByTags(tags, limit);
  }

  /**
   * Add or update knowledge item (for dynamic learning)
   */
  async upsertKnowledgeItem(item: Omit<KnowledgeItem, 'id' | 'lastUpdated'>): Promise<KnowledgeItem> {
    return this.itemService.upsertKnowledgeItem(item);
  }

  /**
   * Health check for the service
   */
  async healthCheck(): Promise<boolean> {
    try {
      const faqs = await this.itemService.getFrequentlyAskedQuestions(1);
      return faqs.length >= 0; // Even 0 FAQs is a valid state
    } catch (error) {
      return false;
    }
  }
} 