/**
 * Crawl Website Use Case - Application Layer
 * 
 * AI INSTRUCTIONS:
 * - Orchestrate website crawling workflow without business logic
 * - Coordinate domain services and infrastructure providers
 * - Handle workflow errors and delegate to appropriate services
 * - Follow @golden-rule patterns exactly
 * - Single responsibility: website crawling coordination
 * - Keep under 250 lines - focus on orchestration only
 * - Trust Crawlee's built-in robots.txt compliance (industry standard)
 */

import { WebsiteSource, WebsiteCrawlSettings } from '../../domain/value-objects/ai-configuration/KnowledgeBase';
import { 
  WebsiteCrawlingDomainService, 
  CrawledPageData, 
  CrawlResult
} from '../../domain/services/WebsiteCrawlingDomainService';
import { ContentExtractionService, IHtmlParser } from '../../domain/services/ContentExtractionService';
import { ContentCategorizationService } from '../../domain/services/ContentCategorizationService';
import { 
  WebsiteCrawlingError, 
  ContentExtractionError,
  ContentCategorizationError 
} from '../../domain/errors/ChatbotWidgetDomainErrors';
import { ChatbotWidgetCompositionRoot } from '../../infrastructure/composition/ChatbotWidgetCompositionRoot';
import { ErrorTrackingFacade } from '../services/ErrorTrackingFacade';

/** Progress Callback Interface for Real-time Updates */
export interface CrawlProgressCallback {
  onPageFound?: (count: number) => void;
  onPageProcessed?: (count: number) => void;
  onStatusUpdate?: (status: string, message?: string) => void;
}

/** Web Crawler Provider Interface */
export interface IWebCrawlerProvider {
  crawlWebsite(
    source: WebsiteSource,
    settings: WebsiteCrawlSettings,
    organizationId: string,
    onPageCrawled: (pageData: CrawledPageData, htmlParser: IHtmlParser) => Promise<void>,
    progressCallback?: CrawlProgressCallback
  ): Promise<CrawledPageData[]>;
}

/** Crawl Website Use Case - Application Layer */
export class CrawlWebsiteUseCase {
  private readonly errorTrackingService: ErrorTrackingFacade;

  constructor(
    private readonly websiteCrawlingService: WebsiteCrawlingDomainService,
    private readonly webCrawlerProvider: IWebCrawlerProvider,
    private readonly contentExtractionService: ContentExtractionService,
    private readonly contentCategorizationService: ContentCategorizationService
  ) {
    this.errorTrackingService = ChatbotWidgetCompositionRoot.getErrorTrackingFacade();
  }

  /** Execute website crawling workflow */
  async execute(
    source: WebsiteSource,
    settings: WebsiteCrawlSettings,
    organizationId: string,
    progressCallback?: CrawlProgressCallback
  ): Promise<CrawlResult> {
    try {
      // Step 1: Validate crawl parameters (domain validation)
      await this.websiteCrawlingService.validateCrawlRequest(source, settings);

      // Step 2: Calculate crawl budget (domain calculation)
      const _budget = this.websiteCrawlingService.calculateCrawlBudget(settings);

      // Step 3: Execute crawling (infrastructure delegation)
      const crawledPages: CrawledPageData[] = [];

      // Note: Crawlee handles robots.txt compliance automatically

      await this.webCrawlerProvider.crawlWebsite(
        source,
        settings,
        organizationId,
        async (pageData: CrawledPageData, htmlParser: IHtmlParser) => {
          try {
            // Extract content using domain service
            const extractedContent = this.contentExtractionService.extractMainContent(htmlParser);

            // Categorize content using domain service
            const _category = await this.contentCategorizationService.categorizeContent(
              extractedContent,
              pageData.title
            );

            // Update page data with processed content
            const processedPageData: CrawledPageData = {
              ...pageData,
              title: pageData.title,
              content: extractedContent
            };

            crawledPages.push(processedPageData);

            // Notify progress callback of processed page
            progressCallback?.onPageProcessed?.(crawledPages.length);

          } catch (error) {
            if (error instanceof ContentExtractionError || error instanceof ContentCategorizationError) {
              throw error;
            }
            
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error(`❌ Page processing failed for ${pageData.url}:`, errorMessage);
            throw new WebsiteCrawlingError(
              pageData.url,
              `Page processing failed: ${errorMessage}`,
              { url: pageData.url, originalError: error }
            );
          }
        },
        progressCallback
      );

      // Process results through domain service
      const result = this.websiteCrawlingService.processCrawlResult(crawledPages);

      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('❌ CrawlWebsiteUseCase: Workflow failed:', errorMessage);

      // Track critical crawling error to database
      await this.errorTrackingService.trackWebsiteCrawlingError(
        source.url,
        `Crawl workflow failed: ${errorMessage}`,
        {
          organizationId,
          metadata: {
            sourceUrl: source.url,
            errorType: error instanceof Error ? error.constructor.name : 'Unknown',
            errorMessage: errorMessage,
            workflowStep: 'crawl_execution'
          }
        }
      );

      if (error instanceof WebsiteCrawlingError || 
          error instanceof ContentExtractionError || 
          error instanceof ContentCategorizationError) {
        throw error;
      }

      throw new WebsiteCrawlingError(
        source.url,
        `Crawl workflow failed: ${errorMessage}`,
        { url: source.url, originalError: error }
      );
    }
  }
} 