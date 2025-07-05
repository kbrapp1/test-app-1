/**
 * AI INSTRUCTIONS: (Only need AI instruction at the top of the file ONCE)
 * - Single responsibility: Knowledge item management and retrieval
 * - Orchestrates knowledge processing and retrieval operations
 * - Maintains clean API for knowledge operations
 * - Keep under 250 lines per @golden-rule
 * - Generic approach that works for any organization
 */

import { KnowledgeItem } from '../../../domain/services/interfaces/IKnowledgeRetrievalService';
import { ChatbotConfig } from '../../../domain/entities/ChatbotConfig';
import { KnowledgeProcessingContext } from './types/KnowledgeServiceTypes';
import { KnowledgeConverterService } from './KnowledgeConverterService';
import { ProductCatalogProcessorService } from './ProductCatalogProcessorService';
import { KnowledgeStatisticsService } from './KnowledgeStatisticsService';
import { KnowledgeAnalyticsCoordinatorService } from './KnowledgeAnalyticsCoordinatorService';
import { KnowledgeBasicFilterService } from './KnowledgeBasicFilterService';
import { KnowledgeSearchService } from './KnowledgeSearchService';
import { KnowledgeAdvancedQueryService, AdvancedQueryFilters } from './KnowledgeAdvancedQueryService';

// Legacy interface for backward compatibility
export interface KnowledgeStatsResult {
  totalItems: number;
  itemsByCategory: Record<string, number>;
  itemsBySource: Record<string, number>;
  averageRelevanceScore: number;
  totalTags: number;
  processingTime: number;
}

export class KnowledgeItemService {
  private processingContext: KnowledgeProcessingContext;

  constructor(private chatbotConfig: ChatbotConfig) {
    this.processingContext = this.createProcessingContext();
  }

  async getAllKnowledgeItems(): Promise<KnowledgeItem[]> {
    const items: KnowledgeItem[] = [];

    // Process FAQs
    const faqItems = await this.getFaqKnowledgeItems();
    items.push(...faqItems);

    // Process company info
    const companyInfoItem = this.getCompanyInfoKnowledgeItem();
    if (companyInfoItem) {
      items.push(companyInfoItem);
    }

    // Process product catalog with advanced processing
    const productItems = await this.getProductCatalogKnowledgeItems();
    items.push(...productItems);

    // Process support docs
    const supportDocsItem = this.getSupportDocsKnowledgeItem();
    if (supportDocsItem) {
      items.push(supportDocsItem);
    }

    return items;
  }

  // Get Knowledge by Category - Use Basic Filter Service directly
  async getKnowledgeByCategory(
    category: KnowledgeItem['category'],
    limit: number = 10
  ): Promise<KnowledgeItem[]> {
    const allItems = await this.getAllKnowledgeItems();
    return KnowledgeBasicFilterService.filterByCategory(allItems, category, limit);
  }

  // Get Frequently Asked Questions - Use Basic Filter Service directly
  async getFrequentlyAskedQuestions(limit: number = 10): Promise<KnowledgeItem[]> {
    const allItems = await this.getAllKnowledgeItems();
    return KnowledgeBasicFilterService.getFaqItems(allItems, limit);
  }

  // Get Knowledge by Tags - Use Basic Filter Service directly
  async getKnowledgeByTags(
    tags: string[],
    limit: number = 10
  ): Promise<KnowledgeItem[]> {
    const allItems = await this.getAllKnowledgeItems();
    return KnowledgeBasicFilterService.filterByTags(allItems, tags, limit);
  }

  // Search Knowledge Items - Use Search Service directly
  async searchKnowledgeItems(
    searchTerm: string,
    limit: number = 10
  ): Promise<KnowledgeItem[]> {
    const allItems = await this.getAllKnowledgeItems();
    return KnowledgeSearchService.searchByContent(allItems, searchTerm, limit);
  }

  // Advanced Filter - Use Advanced Query Service directly
  async advancedFilter(
    filters: AdvancedQueryFilters,
    limit: number = 10
  ): Promise<KnowledgeItem[]> {
    const allItems = await this.getAllKnowledgeItems();
    return KnowledgeAdvancedQueryService.advancedFilter(allItems, filters, limit);
  }

  // Get Knowledge Processing Statistics - Delegate to Stats Service
  async getKnowledgeProcessingStats(): Promise<KnowledgeStatsResult> {
    const items = await this.getAllKnowledgeItems();
    const basicStats = await KnowledgeStatisticsService.getBasicStats(items);
    
    // Convert to KnowledgeStatsResult format
    const averageRelevanceScore = items.length > 0 ? 
      items.reduce((sum, item) => sum + item.relevanceScore, 0) / items.length : 0;
    
    return {
      totalItems: basicStats.totalItems,
      itemsByCategory: basicStats.itemsByType,
      itemsBySource: basicStats.itemsBySource,
      averageRelevanceScore,
      totalTags: basicStats.totalTags,
      processingTime: 0 // Not tracked in this context
    };
  }

  // Get Knowledge Health Metrics - Delegate to Stats Service
  async getKnowledgeHealthMetrics() {
    const items = await this.getAllKnowledgeItems();
    return KnowledgeStatisticsService.getHealthMetrics(items);
  }

  // Get Knowledge Quality Score - Delegate to Stats Service
  async getKnowledgeQualityScore() {
    const items = await this.getAllKnowledgeItems();
    return KnowledgeAnalyticsCoordinatorService.generateQualityScore(items);
  }

  // Upsert Knowledge Item - Delegate to Converter Service
  async upsertKnowledgeItem(item: Omit<KnowledgeItem, 'id' | 'lastUpdated'>): Promise<KnowledgeItem> {
    return KnowledgeConverterService.createKnowledgeItemFromContent(
      crypto.randomUUID(),
      item.title,
      item.content,
      item.category,
      this.processingContext,
      {
        relevanceScore: item.relevanceScore,
        customTags: item.tags
      }
    );
  }

  // Get FAQ Knowledge Items - Private Helper
  private async getFaqKnowledgeItems(): Promise<KnowledgeItem[]> {
    const activeFaqs = this.chatbotConfig.knowledgeBase.faqs.filter(faq => faq.isActive);
    
    if (activeFaqs.length === 0) {
      return [];
    }

    const conversionResult = KnowledgeConverterService.convertFaqsToKnowledgeItems(
      activeFaqs,
      this.processingContext
    );

    // Log warnings if any
    if (conversionResult.warnings.length > 0) {
      console.warn('FAQ conversion warnings:', conversionResult.warnings);
    }

    return conversionResult.items;
  }

  // Get Company Info Knowledge Item - Private Helper
  private getCompanyInfoKnowledgeItem(): KnowledgeItem | null {
    const companyInfo = this.chatbotConfig.knowledgeBase.companyInfo;
    
    if (!companyInfo) {
      return null;
    }

    return KnowledgeConverterService.convertCompanyInfoToKnowledgeItem(
      companyInfo,
      this.processingContext
    );
  }

  // Get Product Catalog Knowledge Items - Private Helper
  private async getProductCatalogKnowledgeItems(): Promise<KnowledgeItem[]> {
    const productCatalog = this.chatbotConfig.knowledgeBase.productCatalog;
    
    if (!productCatalog) {
      return [];
    }

    // Create product-specific processing context
    const productContext = ProductCatalogProcessorService.createProcessingContext(
      this.processingContext.organizationId,
      productCatalog,
      this.processingContext.source
    );

    return ProductCatalogProcessorService.processProductCatalogAdvanced(
      productCatalog,
      productContext
    );
  }

  // Get Support Docs Knowledge Item - Private Helper
  private getSupportDocsKnowledgeItem(): KnowledgeItem | null {
    const supportDocs = this.chatbotConfig.knowledgeBase.supportDocs;
    
    if (!supportDocs) {
      return null;
    }

    return KnowledgeConverterService.convertSupportDocsToKnowledgeItem(
      supportDocs,
      this.processingContext
    );
  }

 // Create Processing Context - Private Helper
  private createProcessingContext(): KnowledgeProcessingContext {
    const companyName = this.extractCompanyName();
    
    return {
      organizationId: this.chatbotConfig.organizationId,
      companyName,
      lastUpdated: this.chatbotConfig.updatedAt,
      source: 'chatbot_config'
    };
  }

  // Extract Company Name - Private Helper
  private extractCompanyName(): string | undefined {
    const companyInfo = this.chatbotConfig.knowledgeBase.companyInfo;
    if (!companyInfo) return undefined;
    
    // Try to extract company name from company info
    const nameMatch = companyInfo.match(/(?:For nearly \d+ years?,\s+)?([A-Z][a-zA-Z\s&]+)(?:\s+has been)/);
    return nameMatch ? nameMatch[1].trim() : undefined;
  }
} 