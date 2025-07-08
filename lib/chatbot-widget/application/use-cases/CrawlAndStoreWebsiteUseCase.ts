/**
 * Crawl and Store Website Use Case
 * 
 * AI INSTRUCTIONS:
 * - Orchestrate domain objects, no business logic
 * - Single use case focus - crawling and persistent storage
 * - Handle workflow coordination only
 * - Delegate all business logic to domain services
 * - Follow @golden-rule patterns exactly
 * - Use domain-specific error handling
 * - Keep under 250 lines
 */

import { WebsiteSource, WebsiteCrawlSettings } from '../../domain/value-objects/ai-configuration/KnowledgeBase';
import { CrawlWebsiteUseCase } from './CrawlWebsiteUseCase';
import { IVectorKnowledgeRepository } from '../../domain/repositories/IVectorKnowledgeRepository';
import { IEmbeddingService } from '../../domain/services/interfaces/IEmbeddingService';
import { WebsiteCrawlingError } from '../../domain/errors/ChatbotWidgetDomainErrors';
import { createHash } from 'crypto';
import { ChatbotWidgetCompositionRoot } from '../../infrastructure/composition/ChatbotWidgetCompositionRoot';
import { ErrorTrackingFacade } from '../services/ErrorTrackingFacade';

/** Storage result for crawl and store operation
 */
export interface CrawlAndStoreResult {
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

/**
 * Crawl and Store Website Use Case
 * 
 * AI INSTRUCTIONS:
 * - Orchestrate crawling and storage workflow
 * - Coordinate with CrawlWebsiteUseCase for content acquisition
 * - Handle embedding generation and storage persistence
 * - No business logic - delegate everything to domain layer
 */
export class CrawlAndStoreWebsiteUseCase {
  private readonly errorTrackingService: ErrorTrackingFacade;

  constructor(
    private readonly crawlWebsiteUseCase: CrawlWebsiteUseCase,
    private readonly vectorKnowledgeRepository: IVectorKnowledgeRepository,
    private readonly embeddingService: IEmbeddingService
  ) {
    this.errorTrackingService = ChatbotWidgetCompositionRoot.getErrorTrackingFacade();
  }

  /** Execute crawl and store workflow
 */
  async execute(
    organizationId: string,
    chatbotConfigId: string,
    source: WebsiteSource,
    settings: WebsiteCrawlSettings
  ): Promise<CrawlAndStoreResult> {
    try {
      // Step 1: Crawl website using existing use case
      const crawlResult = await this.crawlWebsiteUseCase.execute(source, settings, organizationId);

      // Step 2: Prepare knowledge items for storage
      const itemsToStore = await this.prepareKnowledgeItemsForStorage(
        crawlResult.knowledgeItems,
        crawlResult.crawledPages
      );

      // Step 3: Store knowledge items with embeddings
      if (itemsToStore.length > 0) {
        await this.vectorKnowledgeRepository.storeKnowledgeItems(
          organizationId,
          chatbotConfigId,
          itemsToStore
        );
      }

      // Step 4: Return storage result
      const result = {
        storedItems: itemsToStore.length,
        totalPages: crawlResult.totalPagesAttempted,
        successfulPages: crawlResult.successfulPages,
        failedPages: crawlResult.failedPages,
        skippedPages: crawlResult.skippedPages,
        crawledPages: crawlResult.crawledPages.map(page => ({
          url: page.url,
          title: page.title,
          content: page.content,
          depth: page.depth,
          crawledAt: page.crawledAt,
          status: page.status,
          errorMessage: page.errorMessage,
          responseTime: page.responseTime,
          statusCode: page.statusCode
        }))
      };
      
      return result;

    } catch (error) {
      // AI: Track critical crawling error to database instead of console logging
      await this.errorTrackingService.trackWebsiteCrawlingError(
        source.url,
        `Crawl and store workflow failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        {
          organizationId,
          metadata: {
            chatbotConfigId,
            sourceUrl: source.url,
            errorType: error instanceof Error ? error.constructor.name : 'Unknown',
            errorMessage: error instanceof Error ? error.message : String(error),
            workflowStep: 'crawl_and_store_execution',
            stack: error instanceof Error ? error.stack?.split('\n').slice(0, 5) : undefined
          }
        }
      );
      
      if (error instanceof WebsiteCrawlingError) {
        throw error;
      }

      throw new WebsiteCrawlingError(
        source.url,
        `Failed to crawl and store website content: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { 
          organizationId,
          chatbotConfigId,
          sourceUrl: source.url,
          error: error instanceof Error ? error.message : String(error) 
        }
      );
    }
  }

  /**
   * Prepare knowledge items for storage with embeddings
   * 
   * AI INSTRUCTIONS:
   * - Generate embeddings for semantic search capabilities
   * - Calculate content hashes for change detection
   * - Store crawl metadata for UI display (status, response time, depth, etc.)
   * - Handle embedding generation errors gracefully
   * - Return items ready for storage
   */
  private async prepareKnowledgeItemsForStorage(
    knowledgeItems: any[],
    crawledPages: any[]
  ): Promise<any[]> {
    const itemsToStore = [];

    // Create a map of URLs to crawled page data for metadata lookup
    const crawledPagesMap = new Map();
    crawledPages.forEach(page => {
      crawledPagesMap.set(page.url, page);
    });

    for (let i = 0; i < knowledgeItems.length; i++) {
      const knowledgeItem = knowledgeItems[i];
      
      try {
        // Validate content before embedding generation
        if (!knowledgeItem.content || typeof knowledgeItem.content !== 'string') {
          // AI: Skip invalid content items silently - error tracking handled at higher level
          continue;
        }
        
        const content = knowledgeItem.content.trim();
        if (content.length === 0) {
          // AI: Skip empty content items silently - error tracking handled at higher level
          continue;
        }
        
        // Generate embedding for content
        const embedding = await this.embeddingService.generateEmbedding(content);
        
        // Generate content hash for change detection
        const contentHash = createHash('sha256')
          .update(content)
          .digest('hex');

        // Get crawl metadata from the corresponding crawled page
        const crawledPage = crawledPagesMap.get(knowledgeItem.source);
        const crawlMetadata = crawledPage ? {
          crawl: {
            status: crawledPage.status || 'success',
            statusCode: crawledPage.statusCode || 200,
            responseTime: crawledPage.responseTime || 0,
            depth: crawledPage.depth || 0,
            crawledAt: crawledPage.crawledAt ? crawledPage.crawledAt.toISOString() : new Date().toISOString(),
            errorMessage: crawledPage.errorMessage || null
          }
        } : {
          crawl: {
            status: 'success',
            statusCode: 200,
            responseTime: 0,
            depth: 0,
            crawledAt: new Date().toISOString(),
            errorMessage: null
          }
        };

        // Prepare item for storage
        const itemToStore = {
          knowledgeItemId: knowledgeItem.id,
          title: knowledgeItem.title,
          content: content,
          category: knowledgeItem.category,
          sourceType: 'website_crawled' as const,
          sourceUrl: knowledgeItem.source,
          embedding: embedding,
          contentHash,
          metadata: crawlMetadata
        };
        
        itemsToStore.push(itemToStore);
        
      } catch (error) {
        // AI: Skip items that fail embedding generation silently
        // Don't fail the entire process for individual items - error tracking handled at higher level
        continue;
      }
    }

    return itemsToStore;
  }
} 