/**
 * Knowledge Item Preparation Service
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Knowledge item processing and validation
 * - Application layer service - orchestrate preparation workflow
 * - Never exceed 250 lines per @golden-rule
 * - Handle content validation and metadata mapping
 * - Support crawled page data correlation
 */

import { KnowledgeItem } from '../../domain/services/interfaces/IKnowledgeRetrievalService';
import { CrawledPageData } from '../types/CrawledPagesTypes';

/** Domain model for prepared knowledge item */
export interface PreparedKnowledgeItem {
  readonly knowledgeItemId: string;
  readonly title: string;
  readonly content: string;
  readonly category: string;
  readonly sourceType: 'faq' | 'company_info' | 'product_catalog' | 'support_docs' | 'website_crawled';
  readonly sourceUrl?: string;
  readonly metadata?: Record<string, unknown>;
}

/** Domain model for knowledge preparation result */
export interface KnowledgePreparationResult {
  readonly preparedItems: PreparedKnowledgeItem[];
  readonly validItems: number;
  readonly skippedItems: number;
  readonly totalItems: number;
}

/**
 * Specialized Service for Knowledge Item Preparation
 * 
 * AI INSTRUCTIONS:
 * - Handle knowledge item content validation and preparation
 * - Coordinate crawled page metadata mapping
 * - Support content filtering and normalization
 * - Enable correlation between knowledge items and crawl data
 * - Provide clear metrics for preparation results
 */
export class KnowledgeItemPreparationService {

  /** Prepare knowledge items with crawl metadata correlation */
  prepareKnowledgeItems(
    knowledgeItems: KnowledgeItem[],
    crawledPages: CrawledPageData[]
  ): KnowledgePreparationResult {
    const crawledPagesMap = this.createCrawledPagesMap(crawledPages);
    const preparedItems: PreparedKnowledgeItem[] = [];
    let skippedItems = 0;

    for (const knowledgeItem of knowledgeItems) {
      const preparedItem = this.prepareSingleKnowledgeItem(knowledgeItem, crawledPagesMap);
      
      if (preparedItem) {
        preparedItems.push(preparedItem);
      } else {
        skippedItems++;
      }
    }

    return {
      preparedItems,
      validItems: preparedItems.length,
      skippedItems,
      totalItems: knowledgeItems.length
    };
  }

  /** Prepare single knowledge item with validation */
  private prepareSingleKnowledgeItem(
    knowledgeItem: KnowledgeItem,
    crawledPagesMap: Map<string, CrawledPageData>
  ): PreparedKnowledgeItem | null {
    // Validate content before preparation
    if (!this.isValidKnowledgeItem(knowledgeItem)) {
      return null;
    }

    const content = knowledgeItem.content.trim();
    
    // Get crawl metadata from the corresponding crawled page
    const crawlMetadata = this.buildCrawlMetadata(knowledgeItem.source, crawledPagesMap);

    return {
      knowledgeItemId: knowledgeItem.id,
      title: knowledgeItem.title,
      content,
      category: knowledgeItem.category,
      sourceType: 'website_crawled',
      sourceUrl: knowledgeItem.source,
      metadata: crawlMetadata
    };
  }

  /** Validate knowledge item content */
  private isValidKnowledgeItem(knowledgeItem: KnowledgeItem): boolean {
    // Check for valid content
    if (!knowledgeItem.content || typeof knowledgeItem.content !== 'string') {
      return false;
    }
    
    // Check for non-empty content
    const content = knowledgeItem.content.trim();
    if (content.length === 0) {
      return false;
    }

    return true;
  }

  /** Create map of URLs to crawled page data for efficient lookup */
  private createCrawledPagesMap(crawledPages: CrawledPageData[]): Map<string, CrawledPageData> {
    const crawledPagesMap = new Map<string, CrawledPageData>();
    crawledPages.forEach(page => {
      crawledPagesMap.set(page.url, page);
    });
    return crawledPagesMap;
  }

  /** Build crawl metadata from crawled page data */
  private buildCrawlMetadata(
    sourceUrl: string,
    crawledPagesMap: Map<string, CrawledPageData>
  ): Record<string, unknown> {
    const crawledPage = crawledPagesMap.get(sourceUrl);
    
    if (crawledPage) {
      return {
        crawl: {
          status: crawledPage.status || 'success',
          statusCode: crawledPage.statusCode || 200,
          responseTime: crawledPage.responseTime || 0,
          depth: crawledPage.depth || 0,
          crawledAt: crawledPage.crawledAt ? crawledPage.crawledAt.toISOString() : new Date().toISOString(),
          errorMessage: crawledPage.errorMessage || null
        }
      };
    }

    // Default metadata for items without crawl data
    return {
      crawl: {
        status: 'success',
        statusCode: 200,
        responseTime: 0,
        depth: 0,
        crawledAt: new Date().toISOString(),
        errorMessage: null
      }
    };
  }
}