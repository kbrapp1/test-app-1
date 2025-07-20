/**
 * Knowledge Base Mapper
 * 
 * AI INSTRUCTIONS:
 * - Handles bidirectional mapping between KnowledgeBase domain value objects and DTOs
 * - Manages complex FAQ, website source, and documentation transformations
 * - Maintains DDD principle: Clean separation between domain knowledge and DTO representations
 * - Preserves crawl settings, FAQ metadata, and content structure integrity
 */

import { KnowledgeBase, FAQ, WebsiteSource } from '../../domain/value-objects/ai-configuration/KnowledgeBase';
import { KnowledgeBaseDto, FaqDto, WebsiteSourceDto } from '../dto/ChatbotConfigDto';

export class KnowledgeBaseMapper {
  static toDto(kb: KnowledgeBase): KnowledgeBaseDto {
    return {
      companyInfo: kb.companyInfo,
      productCatalog: kb.productCatalog,
      faqs: kb.faqs.map(faq => KnowledgeBaseMapper.mapFaqToDto(faq)),
      supportDocs: kb.supportDocs,
      complianceGuidelines: kb.complianceGuidelines,
      websiteSources: kb.websiteSources.map(ws => KnowledgeBaseMapper.mapWebsiteSourceToDto(ws)),
    };
  }

  static fromDto(dto: KnowledgeBaseDto): KnowledgeBase {
    return KnowledgeBase.create({
      companyInfo: dto.companyInfo,
      productCatalog: dto.productCatalog,
      faqs: dto.faqs.map(faq => KnowledgeBaseMapper.mapFaqFromDto(faq)),
      supportDocs: dto.supportDocs,
      complianceGuidelines: dto.complianceGuidelines,
      websiteSources: dto.websiteSources.map(ws => KnowledgeBaseMapper.mapWebsiteSourceFromDto(ws)),
    });
  }

  private static mapFaqToDto(faq: FAQ): FaqDto {
    return {
      id: faq.id,
      question: faq.question,
      answer: faq.answer,
      category: faq.category,
      keywords: this.extractKeywordsFromFAQ(faq),
      priority: this.derivePriorityFromCategory(faq.category),
    };
  }

  private static extractKeywordsFromFAQ(faq: FAQ): string[] {
    const text = `${faq.question} ${faq.answer}`.toLowerCase();
    const words = text.match(/\b\w{3,}\b/g) || [];
    const uniqueWords = [...new Set(words)];
    return uniqueWords.slice(0, 10);
  }

  private static derivePriorityFromCategory(category: string): number {
    const categoryPriorities: Record<string, number> = {
      urgent: 5,
      important: 4,
      billing: 4,
      technical: 3,
      general: 2,
      other: 1,
    };
    return categoryPriorities[category.toLowerCase()] || 2;
  }

  private static mapFaqFromDto(faq: FaqDto): FAQ {
    return {
      id: faq.id,
      question: faq.question,
      answer: faq.answer,
      category: faq.category,
      isActive: true,
    };
  }

  private static mapWebsiteSourceToDto(ws: WebsiteSource): WebsiteSourceDto {
    return {
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
    };
  }

  private static mapWebsiteSourceFromDto(dto: WebsiteSourceDto): WebsiteSource {
    return {
      id: dto.id,
      url: dto.url,
      name: dto.name,
      description: dto.description,
      isActive: dto.isActive,
      crawlSettings: {
        maxPages: dto.crawlSettings.maxPages,
        maxDepth: dto.crawlSettings.maxDepth,
        includePatterns: dto.crawlSettings.includePatterns,
        excludePatterns: dto.crawlSettings.excludePatterns,
        respectRobotsTxt: dto.crawlSettings.respectRobotsTxt,
        crawlFrequency: dto.crawlSettings.crawlFrequency,
        includeImages: dto.crawlSettings.includeImages,
        includePDFs: dto.crawlSettings.includePDFs,
      },
      lastCrawled: dto.lastCrawled ? new Date(dto.lastCrawled) : undefined,
      pageCount: dto.pageCount,
      status: dto.status,
      errorMessage: dto.errorMessage,
    };
  }
}
