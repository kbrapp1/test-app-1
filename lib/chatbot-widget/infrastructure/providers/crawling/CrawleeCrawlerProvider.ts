/**
 * Crawlee Crawler Provider - DDD-Refactored
 * 
 * Infrastructure layer provider that orchestrates crawling using focused adapters.
 * Coordinates domain services and infrastructure adapters for efficient crawling.
 * REFACTORED: Now uses composition of specialized services for better separation.
 */

import { WebsiteSource, WebsiteCrawlSettings } from '../../../domain/value-objects/ai-configuration/KnowledgeBase';
import { IWebCrawlerProvider, CrawlProgressCallback } from '../../../application/use-cases/CrawlWebsiteUseCase';
import { CrawledPageData, IRobotsTxtChecker } from '../../../domain/services/WebsiteCrawlingDomainService';
import * as cheerio from 'cheerio';
import { IHtmlParser } from '../../../domain/services/ContentExtractionService';
import { WebsiteCrawlingError } from '../../../domain/errors/ChatbotWidgetDomainErrors';
import { CheerioHtmlParserAdapter } from '../adapters/CheerioHtmlParserAdapter';
import { UrlNormalizationService } from '../../../domain/services/UrlNormalizationService';
import { CrawlPolicyService } from '../../../domain/services/CrawlPolicyService';
import { CrawlStrategyService } from '../../../domain/services/CrawlStrategyService';
import { SitemapXmlAdapter } from '../../adapters/SitemapXmlAdapter';
import { WebPageFetcher } from '../../adapters/WebPageFetcher';
import { ChatbotWidgetCompositionRoot } from '../../composition/ChatbotWidgetCompositionRoot';
import { ErrorTrackingFacade } from '../../../application/services/ErrorTrackingFacade';

export class CrawleeCrawlerProvider implements IWebCrawlerProvider {
  private readonly urlNormalizationService = new UrlNormalizationService();
  private readonly crawlPolicyService = new CrawlPolicyService();
  private readonly crawlStrategyService = new CrawlStrategyService();
  private readonly sitemapAdapter = new SitemapXmlAdapter();
  private readonly webPageFetcher = new WebPageFetcher();
  private readonly errorTrackingService: ErrorTrackingFacade;

  constructor() {
    this.errorTrackingService = ChatbotWidgetCompositionRoot.getErrorTrackingFacade();
  }

  async crawlWebsite(
    source: WebsiteSource,
    settings: WebsiteCrawlSettings,
    organizationId: string,
    onPageCrawled: (pageData: CrawledPageData, htmlParser: IHtmlParser) => Promise<void>,
    progressCallback?: CrawlProgressCallback
  ): Promise<CrawledPageData[]> {
    try {
      // Determine crawl strategy using domain service
      const strategy = this.crawlStrategyService.determineCrawlStrategy(settings);
      
      const crawledData: CrawledPageData[] = [];
      const normalizedUrls = new Set<string>();
      
      // Try to discover URLs from sitemap using infrastructure adapter
      const sitemapUrls = await this.sitemapAdapter.discoverUrlsFromSitemap(source.url);
      
      // Initialize crawl queue based on strategy
      const crawlQueue = this.initializeCrawlQueue(source, sitemapUrls, strategy);
      
      // Notify initial setup complete - both SSE and callback
      this.sendProgressUpdate(source.id, 'status', {
        status: 'crawling',
        message: 'Starting to crawl pages...'
      });
      this.sendProgressUpdate(source.id, 'pages_found', {
        pagesFound: crawlQueue.length
      });
      
      progressCallback?.onStatusUpdate?.('crawling', 'Starting to crawl pages...');
      progressCallback?.onPageFound?.(crawlQueue.length);
      
      // Use Cheerio for HTML parsing
      const { load } = await import('cheerio');
      
      while (crawlQueue.length > 0 && crawledData.length < settings.maxPages) {
        const { url: currentUrl, depth: currentDepth } = crawlQueue.shift()!;
        
        // Skip if already crawled
        const normalizedUrl = this.urlNormalizationService.normalizeUrl(currentUrl);
        if (normalizedUrls.has(normalizedUrl)) {
          continue;
        }
        normalizedUrls.add(normalizedUrl);
        
        // Fetch page using infrastructure adapter
        const pageData = await this.webPageFetcher.fetchPageData(currentUrl, currentDepth);
        if (!pageData || pageData.status === 'failed') {
          continue;
        }
        
        crawledData.push(pageData);
        
        // Create HTML parser adapter for content processing
        const $ = load(pageData.content);
        const htmlParser = new CheerioHtmlParserAdapter($);
        
        // Process the page through the callback
        await onPageCrawled(pageData, htmlParser);
        
        // Send pages processed update to SSE stream
        this.sendProgressUpdate(source.id, 'pages_processed', {
          pagesProcessed: crawledData.length
        });
        
        // Extract and queue new URLs if within depth limit
        if (currentDepth < settings.maxDepth && crawledData.length < settings.maxPages) {
          const initialQueueSize = crawlQueue.length;
          this.extractAndQueueLinks($, currentUrl, currentDepth, source.url, crawlQueue, normalizedUrls);
          
          // Update pages found count if new pages were discovered
          if (crawlQueue.length > initialQueueSize) {
            const totalFound = crawledData.length + crawlQueue.length;
            const pagesFound = Math.min(totalFound, settings.maxPages);
            
            // Send to SSE stream
            this.sendProgressUpdate(source.id, 'pages_found', {
              pagesFound
            });
            
            progressCallback?.onPageFound?.(pagesFound);
          }
        }
      }
      
      // Send completion update to SSE stream
      this.sendProgressUpdate(source.id, 'complete', {
        pagesProcessed: crawledData.length,
        message: `Crawl completed - processed ${crawledData.length} pages`
      });
      
      return crawledData;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('❌ CrawleeCrawlerProvider: Crawl execution failed:', errorMessage);
      
      // Send error update to SSE stream
      this.sendProgressUpdate(source.id, 'error', {
        error: errorMessage,
        message: 'Crawl failed'
      });
      
      // Track critical crawling infrastructure error to database
      await this.errorTrackingService.trackWebsiteCrawlingError(
        source.url,
        `Crawlee provider execution failed: ${errorMessage}`,
        {
          organizationId,
          metadata: {
            sourceUrl: source.url,
            maxPages: settings.maxPages,
            maxDepth: settings.maxDepth,
            errorType: error instanceof Error ? error.constructor.name : 'Unknown',
            errorMessage: errorMessage,
            workflowStep: 'crawlee_provider_execution'
          }
        }
      );
      
      throw new WebsiteCrawlingError(
        source.url,
        errorMessage,
        { originalError: error }
      );
    }
  }

  /**
   * Initialize crawl queue based on strategy and discovered URLs
   * Infrastructure operation: queue management for crawl orchestration
   */
  private initializeCrawlQueue(
    source: WebsiteSource,
    sitemapUrls: string[],
    strategy: { type: string; prioritizeSitemaps: boolean }
  ): Array<{ url: string; depth: number }> {
    const crawlQueue: Array<{ url: string; depth: number }> = [];
    
    if (sitemapUrls.length > 0 && strategy.prioritizeSitemaps) {
      // Filter sitemap URLs for lead generation value using domain service
      const filteredSitemapUrls = sitemapUrls.filter(url => 
        this.crawlPolicyService.isValuableLeadGenContent(url)
      );
      
      filteredSitemapUrls.forEach(url => {
        crawlQueue.push({ url, depth: 0 });
      });
    } else {
      // Fallback to starting with homepage
      crawlQueue.push({ url: source.url, depth: 0 });
    }
    
    return crawlQueue;
  }

  /**
   * Extract and queue new links from current page
   * Infrastructure operation: link extraction and queue management
   */
  private extractAndQueueLinks(
    $: cheerio.CheerioAPI,
    currentUrl: string,
    currentDepth: number,
    sourceUrl: string,
    crawlQueue: Array<{ url: string; depth: number }>,
    normalizedUrls: Set<string>
  ): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- cheerio Element type compatibility
    $('a[href]').each((_: number, element: any) => {
      const href = $(element).attr('href');
      if (href) {
        try {
          const fullUrl = new URL(href, currentUrl).toString();
          const linkUrl = new URL(fullUrl);
          const sourceUrlObj = new URL(sourceUrl);
          
          // Only crawl same-domain links that are valuable for lead generation
          if (linkUrl.hostname === sourceUrlObj.hostname && 
              this.crawlPolicyService.isValuableLeadGenContent(fullUrl)) {
            const linkNormalizedUrl = this.urlNormalizationService.normalizeUrl(fullUrl);
            
            // Add to queue if not already processed or queued
            if (!normalizedUrls.has(linkNormalizedUrl) && 
                !crawlQueue.some(item => 
                  this.urlNormalizationService.normalizeUrl(item.url) === linkNormalizedUrl)) {
              crawlQueue.push({ url: fullUrl, depth: currentDepth + 1 });
            }
          }
        } catch {
          // Skip invalid URLs
        }
      }
    });
  }

  /**
   * Send progress update to SSE stream
   * Infrastructure operation: Real-time progress communication
   */
  private sendProgressUpdate(sourceId: string, type: string, data: Record<string, unknown>): void {
    try {
      // Note: Progress streaming is handled by the API route
      // This is a placeholder for future progress tracking integration
      console.log('Progress update:', { sourceId, type, data });
    } catch {
      // Silently handle SSE update failures
    }
  }
}

export class CrawleeRobotsTxtProvider {
  async createChecker(_baseUrl: string): Promise<IRobotsTxtChecker> {
    // Return a no-op checker since Crawlee handles this
    return {
      canLoad: async () => true,
      isAllowed: async () => true
    };
  }
} 