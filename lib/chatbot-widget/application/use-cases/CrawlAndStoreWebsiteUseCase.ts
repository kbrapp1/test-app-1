/**
 * Crawl and Store Website Use Case
 * 
 * AI INSTRUCTIONS:
 * - Orchestrate application services, no business logic
 * - Single use case focus - crawling and persistent storage workflow
 * - Handle use case coordination only
 * - Delegate specialized tasks to application services
 * - Follow @golden-rule patterns exactly
 * - Use domain-specific error handling
 * - Keep under 250 lines
 */

import { WebsiteSource, WebsiteCrawlSettings } from '../../domain/value-objects/ai-configuration/KnowledgeBase';
import { CrawlWebsiteUseCase } from './CrawlWebsiteUseCase';
import { IVectorKnowledgeRepository } from '../../domain/repositories/IVectorKnowledgeRepository';
import { IEmbeddingService } from '../../domain/services/interfaces/IEmbeddingService';
import { WebsiteCrawlingError } from '../../domain/errors/ChatbotWidgetDomainErrors';
import { ChatbotWidgetCompositionRoot } from '../../infrastructure/composition/ChatbotWidgetCompositionRoot';
import { ErrorTrackingFacade } from '../services/ErrorTrackingFacade';
import { KnowledgeItemPreparationService } from '../services/KnowledgeItemPreparationService';
import { EmbeddingOrchestrationService, EmbeddingProgressCallback } from '../services/EmbeddingOrchestrationService';
import { StorageCoordinationService } from '../services/StorageCoordinationService';

// Storage result for crawl and store operation
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
 * Orchestrating Use Case for Crawl and Store Workflow
 * 
 * AI INSTRUCTIONS:
 * - Orchestrate crawling and storage workflow using application services
 * - Coordinate with CrawlWebsiteUseCase for content acquisition
 * - Delegate preparation, embedding, and storage to specialized services
 * - No business logic - pure use case orchestration
 */
export class CrawlAndStoreWebsiteUseCase {
  private readonly errorTrackingService: ErrorTrackingFacade;
  private readonly knowledgePreparationService: KnowledgeItemPreparationService;
  private readonly embeddingOrchestrationService: EmbeddingOrchestrationService;
  private readonly storageCoordinationService: StorageCoordinationService;

  constructor(
    private readonly crawlWebsiteUseCase: CrawlWebsiteUseCase,
    private readonly vectorKnowledgeRepository: IVectorKnowledgeRepository,
    private readonly embeddingService: IEmbeddingService
  ) {
    this.errorTrackingService = ChatbotWidgetCompositionRoot.getErrorTrackingFacade();
    this.knowledgePreparationService = new KnowledgeItemPreparationService();
    this.embeddingOrchestrationService = new EmbeddingOrchestrationService(this.embeddingService);
    this.storageCoordinationService = new StorageCoordinationService(this.vectorKnowledgeRepository);
  }

  /** Execute crawl and store workflow using coordinated application services */
  async execute(
    organizationId: string,
    chatbotConfigId: string,
    source: WebsiteSource,
    settings: WebsiteCrawlSettings,
    statusUpdateCallback?: EmbeddingProgressCallback
  ): Promise<CrawlAndStoreResult> {
    try {
      // Step 1: Crawl website using existing use case
      const crawlResult = await this.crawlWebsiteUseCase.execute(source, settings, organizationId);

      // Step 2: Prepare knowledge items with metadata correlation
      const preparationResult = this.knowledgePreparationService.prepareKnowledgeItems(
        crawlResult.knowledgeItems,
        crawlResult.crawledPages
      );

      // Step 3: Generate embeddings with progress tracking
      const embeddingResult = await this.embeddingOrchestrationService.generateEmbeddings(
        preparationResult.preparedItems,
        statusUpdateCallback
      );

      // Step 4: Store knowledge items and return coordination result
      const storageResult = await this.storageCoordinationService.storeKnowledgeItems(
        organizationId,
        chatbotConfigId,
        embeddingResult.embeddedItems,
        {
          totalPagesAttempted: crawlResult.totalPagesAttempted,
          successfulPages: crawlResult.successfulPages,
          failedPages: crawlResult.failedPages,
          skippedPages: crawlResult.skippedPages,
          crawledPages: crawlResult.crawledPages
        }
      );

      return storageResult;

    } catch (error) {
      // Track critical crawling error to database instead of console logging
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
} 