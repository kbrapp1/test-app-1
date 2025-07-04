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
import { WebsiteCrawlError } from '../../domain/errors/WebsiteCrawlingErrors';
import { createHash } from 'crypto';

/**
 * Storage result for crawl and store operation
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
  constructor(
    private readonly crawlWebsiteUseCase: CrawlWebsiteUseCase,
    private readonly vectorKnowledgeRepository: IVectorKnowledgeRepository,
    private readonly embeddingService: IEmbeddingService
  ) {}

  /**
   * Execute crawl and store workflow
   * 
   * AI INSTRUCTIONS:
   * - Orchestrate the complete crawl and storage workflow
   * - Use CrawlWebsiteUseCase for content acquisition
   * - Generate embeddings for semantic search
   * - Store content and embeddings persistently
   */
  async execute(
    organizationId: string,
    chatbotConfigId: string,
    source: WebsiteSource,
    settings: WebsiteCrawlSettings
  ): Promise<CrawlAndStoreResult> {
    console.log(`🚀 CrawlAndStoreWebsiteUseCase: Starting crawl for ${source.url}`);
    
    try {
      // Step 1: Crawl website using existing use case
      console.log('🔍 Step 1: Executing website crawl...');
      const crawlResult = await this.crawlWebsiteUseCase.execute(source, settings);
      console.log(`✅ Crawl completed: ${crawlResult.knowledgeItems.length} knowledge items extracted`);

      // Step 2: Prepare knowledge items for storage
      console.log('📦 Step 2: Preparing knowledge items for storage...');
      const itemsToStore = await this.prepareKnowledgeItemsForStorage(
        crawlResult.knowledgeItems,
        crawlResult.crawledPages
      );
      console.log(`✅ Prepared ${itemsToStore.length} items for storage`);

      // Step 3: Store knowledge items with embeddings
      if (itemsToStore.length > 0) {
        console.log('💾 Step 3: Storing knowledge items...');
        await this.vectorKnowledgeRepository.storeKnowledgeItems(
          organizationId,
          chatbotConfigId,
          itemsToStore
        );
        console.log(`✅ Successfully stored ${itemsToStore.length} knowledge items`);
      } else {
        console.log('⚠️ No items to store - skipping storage step');
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
      
      console.log(`🎉 CrawlAndStoreWebsiteUseCase: Completed successfully - ${result.storedItems} items stored`);
      return result;

    } catch (error) {
      console.error('❌ CrawlAndStoreWebsiteUseCase: Execution failed:', error);
      console.error('❌ Error details:', {
        name: error instanceof Error ? error.constructor.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack?.split('\n').slice(0, 5) : undefined,
        organizationId,
        chatbotConfigId,
        sourceUrl: source.url
      });
      
      if (error instanceof WebsiteCrawlError) {
        throw error;
      }

      throw new WebsiteCrawlError(
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
    console.log(`🔧 Processing ${knowledgeItems.length} knowledge items for storage`);

    // Create a map of URLs to crawled page data for metadata lookup
    const crawledPagesMap = new Map();
    crawledPages.forEach(page => {
      crawledPagesMap.set(page.url, page);
    });

    for (let i = 0; i < knowledgeItems.length; i++) {
      const knowledgeItem = knowledgeItems[i];
      
      try {
        console.log(`🔧 Processing item ${i + 1}/${knowledgeItems.length}: ${knowledgeItem.title?.substring(0, 50)}...`);
        
        // Validate content before embedding generation
        if (!knowledgeItem.content || typeof knowledgeItem.content !== 'string') {
          console.error(`❌ Item ${i + 1} has invalid content:`, {
            title: knowledgeItem.title,
            contentType: typeof knowledgeItem.content,
            contentValue: knowledgeItem.content
          });
          continue;
        }
        
        const content = knowledgeItem.content.trim();
        if (content.length === 0) {
          console.error(`❌ Item ${i + 1} has empty content:`, {
            title: knowledgeItem.title
          });
          continue;
        }
        
        if (content.length > 8000) {
          console.warn(`⚠️ Item ${i + 1} content very long (${content.length} chars), may cause issues:`, {
            title: knowledgeItem.title
          });
        }
        
        // Generate embedding for content
        console.log(`🤖 Generating embedding (content length: ${content.length})`);
        console.log(`📄 Content preview: "${content.substring(0, 200)}${content.length > 200 ? '...' : ''}"`);
        
        const embedding = await this.embeddingService.generateEmbedding(content);
        console.log(`✅ Embedding generated (dimensions: ${embedding.length})`);
        
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
        console.log(`✅ Item ${i + 1} prepared successfully with crawl metadata`);
        
      } catch (error) {
        // Skip items that fail embedding generation
        // Don't fail the entire process for individual items
        console.error(`❌ Failed to prepare item ${i + 1}:`, {
          title: knowledgeItem.title,
          contentLength: knowledgeItem.content?.length || 0,
          error: error instanceof Error ? error.message : String(error),
          errorName: error instanceof Error ? error.constructor.name : 'Unknown',
          stack: error instanceof Error ? error.stack?.split('\n').slice(0, 3) : undefined
        });
        continue;
      }
    }

    console.log(`🔧 Preparation completed: ${itemsToStore.length}/${knowledgeItems.length} items ready for storage`);
    return itemsToStore;
  }
} 