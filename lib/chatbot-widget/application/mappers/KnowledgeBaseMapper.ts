/**
 * Knowledge Base Mapper
 * 
 * AI INSTRUCTIONS:
 * - Handles bidirectional mapping between KnowledgeBase domain value objects and DTOs
 * - Manages complex FAQ, website source, and documentation transformations
 * - Maintains DDD principle: Clean separation between domain knowledge and DTO representations
 * - Preserves crawl settings, FAQ metadata, and content structure integrity
 */

import { KnowledgeBase } from '../../domain/value-objects/ai-configuration/KnowledgeBase';
import { KnowledgeBaseDto } from '../dto/ChatbotConfigDto';

export class KnowledgeBaseMapper {
  static toDto(kb: KnowledgeBase): KnowledgeBaseDto {
    return {
      companyInfo: kb.companyInfo,
      productCatalog: kb.productCatalog,
      faqs: this.mapFaqsToDto(kb.faqs),
      supportDocs: kb.supportDocs,
      complianceGuidelines: kb.complianceGuidelines,
      websiteSources: this.mapWebsiteSourcesToDto(kb.websiteSources),
    };
  }

  static fromDto(dto: KnowledgeBaseDto): KnowledgeBase {
    return KnowledgeBase.create({
      companyInfo: dto.companyInfo,
      productCatalog: dto.productCatalog,
      faqs: this.mapFaqsFromDto(dto.faqs),
      supportDocs: dto.supportDocs,
      complianceGuidelines: dto.complianceGuidelines,
      websiteSources: this.mapWebsiteSourcesFromDto(dto.websiteSources),
    });
  }

  private static mapFaqsToDto(faqs: any[]) {
    return faqs.map((faq) => ({
      id: faq.id,
      question: faq.question,
      answer: faq.answer,
      category: faq.category,
      keywords: [], // TODO: Extract from FAQ content or add to domain
      priority: 1, // TODO: Add priority to domain or derive from category
    }));
  }

  private static mapFaqsFromDto(dtoFaqs: any[]) {
    return dtoFaqs.map(faq => ({
      id: faq.id,
      question: faq.question,
      answer: faq.answer,
      category: faq.category,
      isActive: true,
    }));
  }

  private static mapWebsiteSourcesToDto(websiteSources: any[]) {
    return websiteSources.map((ws) => ({
      id: ws.id,
      url: ws.url,
      name: ws.name,
      description: ws.description,
      isActive: ws.isActive,
      crawlSettings: {
        maxPages: ws.crawlSettings.maxPages,
        maxDepth: ws.crawlSettings.maxDepth,
        includePatterns: ws.crawlSettings.includePatterns,
        excludePatterns: ws.crawlSettings.excludePatterns,
        respectRobotsTxt: ws.crawlSettings.respectRobotsTxt,
        crawlFrequency: ws.crawlSettings.crawlFrequency,
        includeImages: ws.crawlSettings.includeImages,
        includePDFs: ws.crawlSettings.includePDFs,
      },
      lastCrawled: ws.lastCrawled?.toISOString(),
      pageCount: ws.pageCount,
      status: ws.status,
      errorMessage: ws.errorMessage,
    }));
  }

  private static mapWebsiteSourcesFromDto(dtoWebsiteSources: any[]) {
    return dtoWebsiteSources.map(ws => ({
      id: ws.id,
      url: ws.url,
      name: ws.name,
      description: ws.description,
      isActive: ws.isActive,
      crawlSettings: {
        maxPages: ws.crawlSettings.maxPages,
        maxDepth: ws.crawlSettings.maxDepth,
        includePatterns: ws.crawlSettings.includePatterns,
        excludePatterns: ws.crawlSettings.excludePatterns,
        respectRobotsTxt: ws.crawlSettings.respectRobotsTxt,
        crawlFrequency: ws.crawlSettings.crawlFrequency,
        includeImages: ws.crawlSettings.includeImages,
        includePDFs: ws.crawlSettings.includePDFs,
      },
      lastCrawled: ws.lastCrawled ? new Date(ws.lastCrawled) : undefined,
      pageCount: ws.pageCount,
      status: ws.status,
      errorMessage: ws.errorMessage,
    }));
  }
}
