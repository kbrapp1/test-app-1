import { IKnowledgeRetrievalService, KnowledgeItem, KnowledgeSearchResult, KnowledgeRetrievalContext } from '../../domain/services/IKnowledgeRetrievalService';
import { ChatbotConfig } from '../../domain/entities/ChatbotConfig';

export class SimpleKnowledgeRetrievalService implements IKnowledgeRetrievalService {
  private readonly chatbotConfig: ChatbotConfig;

  constructor(chatbotConfig: ChatbotConfig) {
    this.chatbotConfig = chatbotConfig;
  }

  /**
   * Search for relevant knowledge based on user query and intent
   */
  async searchKnowledge(context: KnowledgeRetrievalContext): Promise<KnowledgeSearchResult> {
    const startTime = Date.now();
    const { userQuery, intentResult, maxResults = 5, minRelevanceScore = 0.3 } = context;

    try {
      // Get all available knowledge items
      const allItems = await this.getAllKnowledgeItems();

      // Filter and score based on query and intent
      const scoredItems = allItems
        .map(item => ({
          ...item,
          relevanceScore: this.calculateRelevanceScore(item, userQuery, intentResult.intent)
        }))
        .filter(item => item.relevanceScore >= minRelevanceScore)
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, maxResults);

      const processingTime = Date.now() - startTime;

      return {
        items: scoredItems,
        totalFound: scoredItems.length,
        searchQuery: userQuery,
        searchTimeMs: processingTime,
        usedFallback: false
      };
    } catch (error) {
      console.error('Knowledge search failed:', error);
      
      // Fallback to basic FAQ search
      const fallbackItems = await this.getFrequentlyAskedQuestions(maxResults);
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
    const allItems = await this.getAllKnowledgeItems();
    
    return allItems
      .filter(item => item.category === category)
      .slice(0, limit);
  }

  /**
   * Get frequently asked questions
   */
  async getFrequentlyAskedQuestions(limit: number = 10): Promise<KnowledgeItem[]> {
    const faqs = this.chatbotConfig.knowledgeBase.faqs
      .filter(faq => faq.isActive)
      .slice(0, limit)
      .map(faq => this.convertFaqToKnowledgeItem(faq));

    return faqs;
  }

  /**
   * Search for similar questions/content
   */
  async findSimilarContent(
    query: string,
    excludeIds: string[] = [],
    limit: number = 5
  ): Promise<KnowledgeItem[]> {
    const allItems = await this.getAllKnowledgeItems();
    
    const similarItems = allItems
      .filter(item => !excludeIds.includes(item.id))
      .map(item => ({
        ...item,
        relevanceScore: this.calculateTextSimilarity(query, item.content + ' ' + item.title)
      }))
      .filter(item => item.relevanceScore > 0.2)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);

    return similarItems;
  }

  /**
   * Get knowledge items by tags
   */
  async getKnowledgeByTags(
    tags: string[],
    limit: number = 10
  ): Promise<KnowledgeItem[]> {
    const allItems = await this.getAllKnowledgeItems();
    
    const taggedItems = allItems
      .filter(item => tags.some(tag => item.tags.includes(tag.toLowerCase())))
      .slice(0, limit);

    return taggedItems;
  }

  /**
   * Add or update knowledge item (for dynamic learning)
   */
  async upsertKnowledgeItem(item: Omit<KnowledgeItem, 'id' | 'lastUpdated'>): Promise<KnowledgeItem> {
    // For this simple implementation, we'll just return the item with generated ID
    // In a real implementation, this would persist to a database
    const newItem: KnowledgeItem = {
      ...item,
      id: crypto.randomUUID(),
      lastUpdated: new Date()
    };

    return newItem;
  }

  /**
   * Health check for the service
   */
  async healthCheck(): Promise<boolean> {
    try {
      const faqs = await this.getFrequentlyAskedQuestions(1);
      return faqs.length >= 0; // Even 0 FAQs is a valid state
    } catch (error) {
      return false;
    }
  }

  /**
   * Get all available knowledge items from the chatbot config
   */
  private async getAllKnowledgeItems(): Promise<KnowledgeItem[]> {
    const items: KnowledgeItem[] = [];

    // Convert FAQs to knowledge items
    const faqItems = this.chatbotConfig.knowledgeBase.faqs
      .filter(faq => faq.isActive)
      .map(faq => this.convertFaqToKnowledgeItem(faq));
    
    items.push(...faqItems);

    // Convert company info to knowledge item
    if (this.chatbotConfig.knowledgeBase.companyInfo) {
      items.push({
        id: 'company-info',
        title: 'Company Information',
        content: this.chatbotConfig.knowledgeBase.companyInfo,
        category: 'general',
        tags: ['company', 'about', 'general'],
        relevanceScore: 0.8,
        source: 'chatbot_config',
        lastUpdated: this.chatbotConfig.updatedAt
      });
    }

    // Convert product catalog to knowledge item
    if (this.chatbotConfig.knowledgeBase.productCatalog) {
      items.push({
        id: 'product-catalog',
        title: 'Product Information',
        content: this.chatbotConfig.knowledgeBase.productCatalog,
        category: 'product_info',
        tags: ['products', 'features', 'catalog'],
        relevanceScore: 0.9,
        source: 'chatbot_config',
        lastUpdated: this.chatbotConfig.updatedAt
      });
    }

    // Convert support docs to knowledge item
    if (this.chatbotConfig.knowledgeBase.supportDocs) {
      items.push({
        id: 'support-docs',
        title: 'Support Documentation',
        content: this.chatbotConfig.knowledgeBase.supportDocs,
        category: 'support',
        tags: ['support', 'help', 'documentation'],
        relevanceScore: 0.7,
        source: 'chatbot_config',
        lastUpdated: this.chatbotConfig.updatedAt
      });
    }

    return items;
  }

  /**
   * Convert FAQ to KnowledgeItem
   */
  private convertFaqToKnowledgeItem(faq: any): KnowledgeItem {
    return {
      id: faq.id,
      title: faq.question,
      content: faq.answer,
      category: this.mapFaqCategoryToKnowledgeCategory(faq.category),
      tags: this.extractTagsFromFaqCategory(faq.category),
      relevanceScore: 0.8,
      source: 'faq',
      lastUpdated: new Date() // FAQs don't have lastUpdated in the current schema
    };
  }

  /**
   * Map FAQ category to knowledge category
   */
  private mapFaqCategoryToKnowledgeCategory(faqCategory: string): KnowledgeItem['category'] {
    const categoryMap: Record<string, KnowledgeItem['category']> = {
      'pricing': 'pricing',
      'features': 'product_info',
      'support': 'support',
      'general': 'general',
      'product': 'product_info'
    };

    return categoryMap[faqCategory.toLowerCase()] || 'general';
  }

  /**
   * Extract tags from FAQ category
   */
  private extractTagsFromFaqCategory(category: string): string[] {
    const baseTag = category.toLowerCase();
    const tagMap: Record<string, string[]> = {
      'pricing': ['pricing', 'cost', 'price', 'plans'],
      'features': ['features', 'functionality', 'capabilities'],
      'support': ['support', 'help', 'troubleshooting'],
      'general': ['general', 'info', 'about'],
      'product': ['product', 'features', 'functionality']
    };

    return tagMap[baseTag] || [baseTag];
  }

  /**
   * Calculate relevance score based on query, content, and intent
   */
  private calculateRelevanceScore(
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

  /**
   * Calculate text similarity using simple keyword matching
   */
  private calculateTextSimilarity(query: string, text: string): number {
    const queryWords = query.toLowerCase().split(/\s+/).filter(word => word.length > 2);
    const textWords = text.toLowerCase().split(/\s+/);
    
    if (queryWords.length === 0) return 0;

    const matches = queryWords.filter(word => 
      textWords.some(textWord => textWord.includes(word) || word.includes(textWord))
    );

    return matches.length / queryWords.length;
  }

  /**
   * Get bonus score for intent-category matching
   */
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

  /**
   * Calculate bonus for tag matching
   */
  private calculateTagMatchBonus(query: string, tags: string[]): number {
    const queryWords = query.toLowerCase().split(/\s+/);
    const matchingTags = tags.filter(tag => 
      queryWords.some(word => tag.includes(word) || word.includes(tag))
    );

    return matchingTags.length > 0 ? 0.3 : 0;
  }
} 