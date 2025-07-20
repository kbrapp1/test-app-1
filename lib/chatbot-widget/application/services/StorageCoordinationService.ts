/**
 * Storage Coordination Service
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Storage coordination and result mapping
 * - Application layer service - orchestrate storage workflow
 * - Never exceed 250 lines per @golden-rule
 * - Handle repository coordination and result transformation
 * - Support storage result mapping and metrics
 */

import { IVectorKnowledgeRepository } from '../../domain/repositories/IVectorKnowledgeRepository';
import { EmbeddedKnowledgeItem } from './EmbeddingOrchestrationService';
import { CrawledPageData } from '../types/CrawledPagesTypes';

/** Domain model for storage coordination result */
export interface StorageCoordinationResult {
  readonly storedItems: number;
  readonly totalPages: number;
  readonly successfulPages: number;
  readonly failedPages: number;
  readonly skippedPages: number;
  readonly crawledPages: Array<{
    url: string;
    title: string;
    content: string;
    depth: number;
    crawledAt: Date;
    status: 'success' | 'failed' | 'skipped';
    errorMessage?: string;
    responseTime?: number;
    statusCode?: number;
  }>;
}

/** Domain model for crawl result summary */
export interface CrawlResultSummary {
  readonly totalPagesAttempted: number;
  readonly successfulPages: number;
  readonly failedPages: number;
  readonly skippedPages: number;
  readonly crawledPages: CrawledPageData[];
}

/**
 * Specialized Service for Storage Coordination and Result Mapping
 * 
 * AI INSTRUCTIONS:
 * - Handle vector knowledge repository coordination
 * - Coordinate storage operations with result transformation
 * - Support crawl result mapping to storage result format
 * - Enable storage metrics and status reporting
 * - Provide clear result transformation for UI consumption
 */
export class StorageCoordinationService {

  constructor(private readonly vectorKnowledgeRepository: IVectorKnowledgeRepository) {}

  /** Store embedded knowledge items and return coordination result */
  async storeKnowledgeItems(
    organizationId: string,
    chatbotConfigId: string,
    embeddedItems: EmbeddedKnowledgeItem[],
    crawlResultSummary: CrawlResultSummary
  ): Promise<StorageCoordinationResult> {
    // Store knowledge items with embeddings if any exist
    if (embeddedItems.length > 0) {
      await this.vectorKnowledgeRepository.storeKnowledgeItems(
        organizationId,
        chatbotConfigId,
        embeddedItems
      );
    }

    // Transform crawl result to storage result format
    return this.buildStorageResult(embeddedItems.length, crawlResultSummary);
  }

  /** Build storage coordination result from components */
  private buildStorageResult(
    storedItemsCount: number,
    crawlResultSummary: CrawlResultSummary
  ): StorageCoordinationResult {
    return {
      storedItems: storedItemsCount,
      totalPages: crawlResultSummary.totalPagesAttempted,
      successfulPages: crawlResultSummary.successfulPages,
      failedPages: crawlResultSummary.failedPages,
      skippedPages: crawlResultSummary.skippedPages,
      crawledPages: this.transformCrawledPages(crawlResultSummary.crawledPages)
    };
  }

  /** Transform crawled pages to result format */
  private transformCrawledPages(crawledPages: CrawledPageData[]): Array<{
    url: string;
    title: string;
    content: string;
    depth: number;
    crawledAt: Date;
    status: 'success' | 'failed' | 'skipped';
    errorMessage?: string;
    responseTime?: number;
    statusCode?: number;
  }> {
    return crawledPages.map(page => ({
      url: page.url,
      title: page.title,
      content: page.content,
      depth: page.depth,
      crawledAt: page.crawledAt,
      status: page.status,
      errorMessage: page.errorMessage,
      responseTime: page.responseTime,
      statusCode: page.statusCode
    }));
  }

  /** Get storage statistics for monitoring */
  getStorageStatistics(result: StorageCoordinationResult): {
    storageSuccessRate: number;
    crawlSuccessRate: number;
    totalItemsProcessed: number;
    totalPagesAttempted: number;
  } {
    const crawlSuccessRate = result.totalPages > 0 
      ? (result.successfulPages / result.totalPages) * 100 
      : 0;

    const storageSuccessRate = result.totalPages > 0 
      ? (result.storedItems / result.totalPages) * 100 
      : 0;

    return {
      storageSuccessRate: Math.round(storageSuccessRate * 100) / 100,
      crawlSuccessRate: Math.round(crawlSuccessRate * 100) / 100,
      totalItemsProcessed: result.storedItems,
      totalPagesAttempted: result.totalPages
    };
  }
}