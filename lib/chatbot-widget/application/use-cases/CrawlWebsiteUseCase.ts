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
  WebsiteCrawlError, 
  ContentExtractionError,
  ContentCategorizationError 
} from '../../domain/errors/WebsiteCrawlingErrors';

/**
 * Web Crawler Provider Interface
 * 
 * AI INSTRUCTIONS:
 * - Define contract for web crawling providers
 * - Focus on technical crawling capabilities
 * - Let providers handle their own compliance (robots.txt, etc.)
 */
export interface IWebCrawlerProvider {
  crawlWebsite(
    source: WebsiteSource,
    settings: WebsiteCrawlSettings,
    onPageCrawled: (pageData: CrawledPageData, htmlParser: IHtmlParser) => Promise<void>
  ): Promise<CrawledPageData[]>;
}

/**
 * Crawl Website Use Case - Application Layer
 * 
 * AI INSTRUCTIONS:
 * - Orchestrate crawling workflow without business logic
 * - Delegate validation to domain service
 * - Handle technical errors from infrastructure
 * - Process pages through domain services
 * - Return complete crawl results
 */
export class CrawlWebsiteUseCase {
  constructor(
    private readonly websiteCrawlingService: WebsiteCrawlingDomainService,
    private readonly webCrawlerProvider: IWebCrawlerProvider,
    private readonly contentExtractionService: ContentExtractionService,
    private readonly contentCategorizationService: ContentCategorizationService
  ) {}

  /**
   * Execute website crawling workflow
   * 
   * AI INSTRUCTIONS:
   * - Orchestrate complete crawling process
   * - Validate input through domain service
   * - Execute crawling through infrastructure provider
   * - Process content through domain services
   * - Handle errors appropriately without business logic
   */
  async execute(
    source: WebsiteSource,
    settings: WebsiteCrawlSettings
  ): Promise<CrawlResult> {
    try {
      console.log('🚀 CrawlWebsiteUseCase: Starting crawl workflow', {
        url: source.url,
        maxPages: settings.maxPages,
        maxDepth: settings.maxDepth
      });

      // Step 1: Validate crawl parameters (domain validation)
      console.log('✅ Step 1: Validating crawl parameters...');
      await this.websiteCrawlingService.validateCrawlRequest(source, settings);
      console.log('✅ Crawl parameters validated successfully');

      // Step 2: Calculate crawl budget (domain calculation)
      console.log('💰 Step 2: Calculating crawl budget...');
      const budget = this.websiteCrawlingService.calculateCrawlBudget(settings);
      console.log(`💰 Crawl budget calculated: ${budget.maxPages} pages, ${budget.maxDepth} depth`);

      // Step 3: Execute crawling (infrastructure delegation)
      console.log('🕷️ Step 3: Executing website crawl...');
      const crawledPages: CrawledPageData[] = [];

      // Note: Crawlee handles robots.txt compliance automatically
      console.log('🤖 Robots.txt compliance: Handled by Crawlee (industry standard)');

      await this.webCrawlerProvider.crawlWebsite(
        source,
        settings,
        async (pageData: CrawledPageData, htmlParser: IHtmlParser) => {
          try {
            console.log(`📄 Processing page: ${pageData.url}`);

            // Extract content using domain service
            const extractedContent = this.contentExtractionService.extractMainContent(htmlParser);

            // Categorize content using domain service
            const category = await this.contentCategorizationService.categorizeContent(
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
            console.log(`✅ Page processed: ${pageData.url} (${category})`);

          } catch (error) {
            if (error instanceof ContentExtractionError || error instanceof ContentCategorizationError) {
              throw error;
            }
            
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error(`❌ Page processing failed for ${pageData.url}:`, errorMessage);
            throw new WebsiteCrawlError(
              `Page processing failed: ${errorMessage}`,
              { url: pageData.url, originalError: error }
            );
          }
        }
      );

      console.log(`🎉 Crawl completed successfully: ${crawledPages.length} pages processed`);

      // Process results through domain service
      const result = this.websiteCrawlingService.processCrawlResult(crawledPages);

      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('❌ CrawlWebsiteUseCase: Workflow failed:', errorMessage);

      if (error instanceof WebsiteCrawlError || 
          error instanceof ContentExtractionError || 
          error instanceof ContentCategorizationError) {
        throw error;
      }

      throw new WebsiteCrawlError(
        `Crawl workflow failed: ${errorMessage}`,
        { url: source.url, originalError: error }
      );
    }
  }
} 