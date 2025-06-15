/**
 * Knowledge Item Service
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Manage knowledge items and data conversion
 * - Handle knowledge item creation and retrieval
 * - Keep under 200-250 lines
 * - Focus on item management operations only
 * - Follow @golden-rule patterns exactly
 */

import { KnowledgeItem } from '../../../domain/services/interfaces/IKnowledgeRetrievalService';
import { ChatbotConfig } from '../../../domain/entities/ChatbotConfig';

export class KnowledgeItemService {
  constructor(private readonly chatbotConfig: ChatbotConfig) {}

  async getAllKnowledgeItems(): Promise<KnowledgeItem[]> {
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

  async getKnowledgeByCategory(
    category: KnowledgeItem['category'],
    limit: number = 10
  ): Promise<KnowledgeItem[]> {
    const allItems = await this.getAllKnowledgeItems();
    
    return allItems
      .filter(item => item.category === category)
      .slice(0, limit);
  }

  async getFrequentlyAskedQuestions(limit: number = 10): Promise<KnowledgeItem[]> {
    const faqs = this.chatbotConfig.knowledgeBase.faqs
      .filter(faq => faq.isActive)
      .slice(0, limit)
      .map(faq => this.convertFaqToKnowledgeItem(faq));

    return faqs;
  }

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
} 