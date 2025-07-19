/**
 * Knowledge Base Infrastructure Mapper
 * 
 * Infrastructure layer mapper for KnowledgeBase value object.
 * Handles complex JSONB transformation for knowledge base data and website sources.
 */

import { KnowledgeBase } from '../../../../domain/value-objects/ai-configuration/KnowledgeBase';

/**
 * Infrastructure mapper for KnowledgeBase JSONB data
 * Handles complex nested arrays and objects with proper defaults
 */
export class KnowledgeBaseMapper {
  
  /**
   * Map JSONB knowledge base data to domain value object
   * Infrastructure operation: complex JSONB to domain object transformation
   */
  static fromJsonb(data: unknown): KnowledgeBase {
    const kb = data as Record<string, unknown> | null | undefined;
    
    // Handle case where knowledge_base JSONB field is null in database
    if (!kb || kb === null) {
      return KnowledgeBase.create({
        companyInfo: '',
        productCatalog: '',
        faqs: [],
        supportDocs: '',
        complianceGuidelines: '',
        websiteSources: [],
      });
    }
    
    return KnowledgeBase.create({
      companyInfo: (kb?.companyInfo as string) || '',
      productCatalog: (kb?.productCatalog as string) || '',
      faqs: this.mapFaqs(kb?.faqs),
      supportDocs: (kb?.supportDocs as string) || '',
      complianceGuidelines: (kb?.complianceGuidelines as string) || '',
      websiteSources: this.mapWebsiteSources(kb?.websiteSources),
    });
  }

  /**
   * Map domain KnowledgeBase to JSONB data
   * Infrastructure operation: domain object to JSONB transformation
   */
  static toJsonb(knowledgeBase: KnowledgeBase): unknown {
    return knowledgeBase.toPlainObject();
  }

  /**
   * Map FAQ array from JSONB with validation and defaults
   * Infrastructure operation: array mapping with UUID generation
   */
  private static mapFaqs(data: unknown): Array<{
    id: string;
    question: string;
    answer: string;
    category: string;
    isActive: boolean;
  }> {
    if (!Array.isArray(data)) {
      return [];
    }
    
    return data.map((faq: unknown) => {
      const faqRecord = faq as Record<string, unknown>;
      return {
        id: (faqRecord?.id as string) || crypto.randomUUID(),
        question: (faqRecord?.question as string) || '',
        answer: (faqRecord?.answer as string) || '',
        category: (faqRecord?.category as string) || 'general',
        isActive: (faqRecord?.isActive as boolean) !== false, // Default true
      };
    });
  }

  /**
   * Map website sources array from JSONB with complex nested objects
   * Infrastructure operation: complex nested object mapping
   */
  private static mapWebsiteSources(data: unknown): Array<{
    id: string;
    url: string;
    name: string;
    description: string;
    isActive: boolean;
    crawlSettings: {
      maxPages: number;
      maxDepth: number;
      includePatterns: string[];
      excludePatterns: string[];
      respectRobotsTxt: boolean;
      crawlFrequency: 'manual' | 'daily' | 'weekly' | 'monthly';
      includeImages: boolean;
      includePDFs: boolean;
    };
    lastCrawled?: Date;
    status: 'pending' | 'crawling' | 'vectorizing' | 'completed' | 'error';
    pageCount: number;
    errorMessage?: string;
  }> {
    if (!Array.isArray(data)) {
      return [];
    }
    
    return data.map((source: unknown) => {
      const sourceRecord = source as Record<string, unknown>;
      return {
        id: (sourceRecord?.id as string) || crypto.randomUUID(),
        url: (sourceRecord?.url as string) || '',
        name: (sourceRecord?.name as string) || '',
        description: (sourceRecord?.description as string) || '',
        isActive: (sourceRecord?.isActive as boolean) !== false, // Default true
        crawlSettings: this.mapCrawlSettings(sourceRecord?.crawlSettings),
        lastCrawled: sourceRecord?.lastCrawled ? new Date(sourceRecord.lastCrawled as string) : undefined,
        status: (sourceRecord?.status as 'pending' | 'crawling' | 'vectorizing' | 'completed' | 'error') || 'pending',
        pageCount: (sourceRecord?.pageCount as number) || 0,
        errorMessage: sourceRecord?.errorMessage as string,
      };
    });
  }

  /**
   * Map crawl settings with proper defaults
   * Infrastructure operation: nested object mapping with business defaults
   */
  private static mapCrawlSettings(data: unknown): {
    maxPages: number;
    maxDepth: number;
    includePatterns: string[];
    excludePatterns: string[];
    respectRobotsTxt: boolean;
    crawlFrequency: 'manual' | 'daily' | 'weekly' | 'monthly';
    includeImages: boolean;
    includePDFs: boolean;
  } {
    const settings = data as Record<string, unknown> | null | undefined;
    
    return {
      maxPages: (settings?.maxPages as number) || 10,
      maxDepth: (settings?.maxDepth as number) || 3,
      includePatterns: (settings?.includePatterns as string[]) || [],
      excludePatterns: (settings?.excludePatterns as string[]) || [],
      respectRobotsTxt: (settings?.respectRobotsTxt as boolean) !== false, // Default true
      crawlFrequency: (settings?.crawlFrequency as 'manual' | 'daily' | 'weekly' | 'monthly') || 'weekly',
      includeImages: (settings?.includeImages as boolean) || false,
      includePDFs: (settings?.includePDFs as boolean) !== false, // Default true
    };
  }
}