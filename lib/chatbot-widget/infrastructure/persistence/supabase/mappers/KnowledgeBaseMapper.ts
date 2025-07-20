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
      companyInfo: this.safeString(kb?.companyInfo),
      productCatalog: this.safeString(kb?.productCatalog),
      faqs: this.mapFaqs(kb?.faqs),
      supportDocs: this.safeString(kb?.supportDocs),
      complianceGuidelines: this.safeString(kb?.complianceGuidelines),
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
        lastCrawled: this.safeDate(sourceRecord?.lastCrawled),
        status: this.safeStatus(sourceRecord?.status),
        pageCount: this.safeNumber(sourceRecord?.pageCount, 0),
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
      maxPages: this.safeNumber(settings?.maxPages, 10),
      maxDepth: this.safeNumber(settings?.maxDepth, 3),
      includePatterns: this.safeStringArray(settings?.includePatterns),
      excludePatterns: this.safeStringArray(settings?.excludePatterns),
      respectRobotsTxt: (settings?.respectRobotsTxt as boolean) !== false, // Default true
      crawlFrequency: this.safeCrawlFrequency(settings?.crawlFrequency),
      includeImages: (settings?.includeImages as boolean) || false,
      includePDFs: (settings?.includePDFs as boolean) !== false, // Default true
    };
  }

  /**
   * Safely convert unknown value to string with fallback
   */
  private static safeString(value: unknown): string {
    if (typeof value === 'string') return value;
    return '';
  }

  /**
   * Safely convert unknown value to number with fallback
   */
  private static safeNumber(value: unknown, defaultValue: number): number {
    if (typeof value === 'number' && !isNaN(value)) return value;
    if (typeof value === 'string') {
      const parsed = parseInt(value, 10);
      if (!isNaN(parsed)) return parsed;
    }
    return defaultValue;
  }

  /**
   * Safely convert unknown value to string array with fallback
   */
  private static safeStringArray(value: unknown): string[] {
    if (Array.isArray(value) && value.every(item => typeof item === 'string')) {
      return value;
    }
    return [];
  }

  /**
   * Safely convert unknown value to valid crawl frequency with fallback
   */
  private static safeCrawlFrequency(value: unknown): 'manual' | 'daily' | 'weekly' | 'monthly' {
    const validFrequencies = ['manual', 'daily', 'weekly', 'monthly'] as const;
    if (typeof value === 'string' && validFrequencies.includes(value as typeof validFrequencies[number])) {
      return value as 'manual' | 'daily' | 'weekly' | 'monthly';
    }
    return 'weekly';
  }

  /**
   * Safely convert unknown value to valid status with fallback
   */
  private static safeStatus(value: unknown): 'pending' | 'crawling' | 'vectorizing' | 'completed' | 'error' {
    const validStatuses = ['pending', 'crawling', 'vectorizing', 'completed', 'error'] as const;
    if (typeof value === 'string' && validStatuses.includes(value as typeof validStatuses[number])) {
      return value as 'pending' | 'crawling' | 'vectorizing' | 'completed' | 'error';
    }
    return 'pending';
  }

  /**
   * Safely convert unknown value to Date with fallback
   */
  private static safeDate(value: unknown): Date | undefined {
    if (value instanceof Date) return value;
    if (typeof value === 'string') {
      const date = new Date(value);
      if (!isNaN(date.getTime())) return date;
    }
    return undefined;
  }
}