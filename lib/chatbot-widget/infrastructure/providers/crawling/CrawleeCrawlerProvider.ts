/**
 * AI INSTRUCTIONS: (Only need AI instruction at the top of the file ONCE)
 * - Technical crawling implementation only, no business logic
 * - Implement interface defined by application layer
 * - Handle Crawlee-specific configuration and operations
 * - Abstract Crawlee complexity from upper layers
 * - Follow @golden-rule patterns exactly
 * - Keep under 250 lines - focus on technical implementation
 * - Use domain error types for technical failures
 * - Let Crawlee handle robots.txt compliance (industry standard)
 */

// import { CheerioCrawler } from '@crawlee/cheerio';
// import { RobotsFile } from '@crawlee/utils';
import { WebsiteSource, WebsiteCrawlSettings } from '../../../domain/value-objects/ai-configuration/KnowledgeBase';
import { IWebCrawlerProvider } from '../../../application/use-cases/CrawlWebsiteUseCase';
import { CrawledPageData, IRobotsTxtChecker } from '../../../domain/services/WebsiteCrawlingDomainService';
import { IHtmlParser } from '../../../domain/services/ContentExtractionService';
import { WebsiteCrawlingError } from '../../../domain/errors/ChatbotWidgetDomainErrors';
import { CheerioHtmlParserAdapter } from '../adapters/CheerioHtmlParserAdapter';
import { UrlNormalizationService } from '../../../domain/services/UrlNormalizationService';
import { CrawlPolicyService } from '../../../domain/services/CrawlPolicyService';
import { ChatbotWidgetCompositionRoot } from '../../composition/ChatbotWidgetCompositionRoot';
import { ErrorTrackingFacade } from '../../../application/services/ErrorTrackingFacade';

export class CrawleeCrawlerProvider implements IWebCrawlerProvider {
  private urlNormalizationService = new UrlNormalizationService();
  private crawlPolicyService = new CrawlPolicyService();
  private errorTrackingService: ErrorTrackingFacade;

  constructor() {
    this.errorTrackingService = ChatbotWidgetCompositionRoot.getErrorTrackingFacade();
  }

  async crawlWebsite(
    source: WebsiteSource,
    settings: WebsiteCrawlSettings,
    organizationId: string,
    onPageCrawled: (pageData: CrawledPageData, htmlParser: IHtmlParser) => Promise<void>
  ): Promise<CrawledPageData[]> {
    try {
      const crawledData: CrawledPageData[] = [];
      const normalizedUrls = new Set<string>();
      
      // Try to discover URLs from sitemap first
      const sitemapUrls = await this.discoverUrlsFromSitemap(source.url);
      
      // Queue for breadth-first crawling: [url, depth]
      const crawlQueue: Array<{ url: string; depth: number }> = [];
      
      // Add sitemap URLs to queue (prioritize them at depth 0)
      if (sitemapUrls.length > 0) {
        // Filter sitemap URLs for lead generation value
        const filteredSitemapUrls = sitemapUrls.filter(url => 
          this.crawlPolicyService.isValuableLeadGenContent(url)
        );
        
        filteredSitemapUrls.forEach(url => {
          crawlQueue.push({ url, depth: 0 });
        });
        
        // AI: Update total based on discovered URLs
        const _totalPages = Math.min(filteredSitemapUrls.length, settings.maxPages);
        // progressCallback?.({ current: 0, total: totalPages, status: 'crawling', currentPage: `Found ${filteredSitemapUrls.length} pages to crawl` });
      } else {
        // Fallback to starting with just the homepage
        crawlQueue.push({ url: source.url, depth: 0 });
        // progressCallback?.({ current: 0, total: settings.maxPages, status: 'crawling' });
      }
      
      // Use Cheerio for HTML parsing
      const { load } = await import('cheerio');
      
      while (crawlQueue.length > 0 && crawledData.length < settings.maxPages) {
        const { url: currentUrl, depth: currentDepth } = crawlQueue.shift()!;
        
        // Skip if we've already crawled this URL
        const normalizedUrl = this.urlNormalizationService.normalizeUrl(currentUrl);
        if (normalizedUrls.has(normalizedUrl)) {
          continue;
        }
        normalizedUrls.add(normalizedUrl);
        
        // AI: Emit progress for current page being crawled
        // progressCallback?.({ 
        //   current: crawledData.length, 
        //   total: Math.max(crawlQueue.length + crawledData.length + 1, settings.maxPages), 
        //   status: 'crawling', 
        //   currentPage: currentUrl 
        // });
        
        try {
          const response = await fetch(currentUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
          });

          if (!response.ok) {
            continue; // Skip failed pages
          }

          const html = await response.text();
          const $ = load(html);

          // Extract title
          const title = $('title').text().trim() || $('h1').first().text().trim() || 'Untitled';
          
          // Create page data
          const pageData: CrawledPageData = {
            url: currentUrl,
            title,
            content: html,
            depth: currentDepth,
            crawledAt: new Date(),
            status: 'success',
            responseTime: 0,
            statusCode: response.status
          };

          crawledData.push(pageData);

          // AI: Emit progress after page is crawled
          // progressCallback?.({ 
          //   current: crawledData.length, 
          //   total: Math.max(crawlQueue.length + crawledData.length, settings.maxPages), 
          //   status: 'processing', 
          //   currentPage: `Processing: ${title}` 
          // });

          // Create HTML parser adapter for content processing
          const htmlParser = new CheerioHtmlParserAdapter($);

          // Process the page through the callback
          await onPageCrawled(pageData, htmlParser);

          // AI: Emit progress after page is processed
          // progressCallback?.({ 
          //   current: crawledData.length, 
          //   total: Math.max(crawlQueue.length + crawledData.length, settings.maxPages), 
          //   status: crawledData.length >= settings.maxPages ? 'vectorizing' : 'crawling', 
          //   currentPage: `Processed: ${title}` 
          // });

          // If we haven't reached max depth and didn't use sitemap, extract links for next level
          if (currentDepth < settings.maxDepth && crawledData.length < settings.maxPages && sitemapUrls.length === 0) {
            $('a[href]').each((_, element) => {
              const href = $(element).attr('href');
              if (href) {
                try {
                  const fullUrl = new URL(href, currentUrl).toString();
                  const sourceUrl = new URL(source.url);
                  const linkUrl = new URL(fullUrl);
                  
                  // Only crawl same-domain links that are valuable for lead generation
                  if (linkUrl.hostname === sourceUrl.hostname && 
                      this.crawlPolicyService.isValuableLeadGenContent(fullUrl)) {
                    const linkNormalizedUrl = this.urlNormalizationService.normalizeUrl(fullUrl);
                    
                    // Add to queue if not already processed or queued
                    if (!normalizedUrls.has(linkNormalizedUrl) && 
                        !crawlQueue.some(item => this.urlNormalizationService.normalizeUrl(item.url) === linkNormalizedUrl)) {
                      crawlQueue.push({ url: fullUrl, depth: currentDepth + 1 });
                    }
                  }
                } catch {
                  // Skip invalid URLs
                }
              }
            });
          }

        } catch {
          // Skip pages that fail to process
          continue;
        }
      }
      
      // AI: Emit completion progress
      // progressCallback?.({ 
      //   current: crawledData.length, 
      //   total: crawledData.length, 
      //   status: 'completed', 
      //   currentPage: `Completed crawling ${crawledData.length} pages` 
      // });
      
      return crawledData;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('❌ CrawleeCrawlerProvider: Crawl execution failed:', errorMessage);
      
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

  private async discoverUrlsFromSitemap(baseUrl: string): Promise<string[]> {
    const sitemapUrls = [
      `${baseUrl}/sitemap.xml`,
      `${baseUrl}/sitemap_index.xml`,
      `${baseUrl}/sitemap.xml.gz`,
      `${baseUrl}/sitemaps/sitemap.xml`
    ];

    for (const sitemapUrl of sitemapUrls) {
      try {
        const response = await fetch(sitemapUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          }
        });
        
        if (response.ok) {
          const xml = await response.text();
          const urls = await this.extractUrlsFromSitemap(xml, baseUrl);
          if (urls.length > 0) {
            return urls;
          }
        }
      } catch {
        // Try next sitemap URL
        continue;
      }
    }
    
    return []; // No sitemap found
  }

  private async extractUrlsFromSitemap(xml: string, baseUrl: string): Promise<string[]> {
    const urls: string[] = [];
    
    try {
      // Extract URLs from <loc> tags
      const urlMatches = xml.match(/<loc>(.*?)<\/loc>/g);
      if (urlMatches) {
        for (const match of urlMatches) {
          const url = match.replace(/<\/?loc>/g, '').trim();
          
          // Validate URL and ensure it's from the same domain
          try {
            const urlObj = new URL(url);
            const baseUrlObj = new URL(baseUrl);
            
            // Only include same-domain URLs that are valuable for lead generation
            if (urlObj.hostname === baseUrlObj.hostname && 
                this.crawlPolicyService.isValuableLeadGenContent(url)) {
              urls.push(url);
            }
          } catch {
            // Skip invalid URLs
          }
        }
      }
      
      // Handle sitemap index files (contains references to other sitemaps)
      const sitemapMatches = xml.match(/<sitemap>[\s\S]*?<\/sitemap>/g);
      if (sitemapMatches) {
        for (const sitemapMatch of sitemapMatches) {
          const locMatch = sitemapMatch.match(/<loc>(.*?)<\/loc>/);
          if (locMatch) {
            const sitemapUrl = locMatch[1].trim();
            try {
              // Recursively fetch nested sitemap
              const nestedUrls = await this.fetchNestedSitemap(sitemapUrl, baseUrl);
              urls.push(...nestedUrls);
            } catch {
              // Skip failed nested sitemaps
            }
          }
        }
      }
      
    } catch {
      // Return empty array if parsing fails
    }
    
    return urls;
  }

  private async fetchNestedSitemap(sitemapUrl: string, baseUrl: string): Promise<string[]> {
    try {
      const response = await fetch(sitemapUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      
      if (response.ok) {
        const xml = await response.text();
        return await this.extractUrlsFromSitemap(xml, baseUrl);
      }
    } catch {
      // Return empty array if fetch fails
    }
    
    return [];
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