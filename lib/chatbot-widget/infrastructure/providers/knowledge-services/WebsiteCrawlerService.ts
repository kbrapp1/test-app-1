/**
 * Website Crawler Service - Infrastructure Layer (Gold Standard Implementation)
 * 
 * AI INSTRUCTIONS:
 * - Uses Crawlee, the industry gold standard for web crawling
 * - Professional-grade crawling with built-in best practices
 * - Automatic rate limiting, retries, and error handling
 * - Robust HTML parsing with Cheerio integration
 * - Follow @golden-rule patterns exactly
 * - Use domain-specific error types, no generic errors
 * - Delegate business logic to domain services
 */

import { CheerioCrawler, createCheerioRouter } from '@crawlee/cheerio';
import { RobotsFile } from '@crawlee/utils';
import { WebsiteSource, WebsiteCrawlSettings } from '../../../domain/value-objects/ai-configuration/KnowledgeBase';
import { KnowledgeItem } from '../../../domain/services/interfaces/IKnowledgeRetrievalService';
import { BusinessRuleViolationError } from '../../../domain/errors/BusinessRuleViolationError';
import { OpenAIProvider } from '../openai/OpenAIProvider';
import { IKnowledgeItemRepository } from '../../../domain/repositories/IKnowledgeItemRepository';
import { OpenAIEmbeddingService } from '../openai/services/OpenAIEmbeddingService';
import { createHash } from 'crypto';

/**
 * Domain-specific error classes for website crawling
 */
export class WebsiteCrawlError extends Error {
  constructor(
    message: string,
    public readonly context: Record<string, any> = {}
  ) {
    super(message);
    this.name = 'WebsiteCrawlError';
  }
}

export class ContentExtractionError extends Error {
  constructor(
    message: string,
    public readonly context: Record<string, any> = {}
  ) {
    super(message);
    this.name = 'ContentExtractionError';
  }
}

export class InvalidUrlError extends Error {
  constructor(
    message: string,
    public readonly context: Record<string, any> = {}
  ) {
    super(message);
    this.name = 'InvalidUrlError';
  }
}

/**
 * Professional Website Crawler using Crawlee
 * 
 * AI INSTRUCTIONS:
 * - Uses Crawlee CheerioCrawler for robust, production-grade crawling
 * - Automatic rate limiting, retries, and error handling
 * - Respects robots.txt and crawling best practices
 * - Smart content extraction with AI categorization
 * - Proper error handling with domain-specific errors
 */
export class WebsiteCrawlerService {
  private readonly openAIProvider: OpenAIProvider;
  private readonly knowledgeItemRepository: IKnowledgeItemRepository;
  private readonly embeddingService: OpenAIEmbeddingService;

  constructor(
    openAIProvider: OpenAIProvider,
    knowledgeItemRepository: IKnowledgeItemRepository,
    embeddingService: OpenAIEmbeddingService
  ) {
    // Ensure this service is only used on the server side
    if (typeof window !== 'undefined') {
      throw new Error('WebsiteCrawlerService can only be used on the server side');
    }
    
    this.openAIProvider = openAIProvider;
    this.knowledgeItemRepository = knowledgeItemRepository;
    this.embeddingService = embeddingService;
  }

  /**
   * Crawl a single website source
   * 
   * AI INSTRUCTIONS:
   * - Use Crawlee's built-in best practices
   * - Respect crawl settings and limits
   * - Extract meaningful content only
   * - Use AI for intelligent categorization
   */
  async crawlWebsite(
    source: WebsiteSource, 
    settings: WebsiteCrawlSettings
  ): Promise<{
    knowledgeItems: KnowledgeItem[];
    crawledPages: Array<{
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
  }> {
    try {
      this.validateUrl(source.url);
      
      // Test URL accessibility before starting crawler
      console.log(`🔍 Testing URL accessibility: ${source.url}`);
      try {
        const testResponse = await fetch(source.url, {
          method: 'HEAD',
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; ChatbotCrawler/1.0)'
          }
        });
        console.log(`📋 URL test result: ${testResponse.status} ${testResponse.statusText}`);
        
        if (!testResponse.ok) {
          throw new WebsiteCrawlError(
            `Website returned ${testResponse.status} ${testResponse.statusText}`,
            { 
              url: source.url, 
              status: testResponse.status,
              statusText: testResponse.statusText
            }
          );
        }
      } catch (fetchError) {
        console.log(`❌ URL accessibility test failed:`, fetchError);
        throw new WebsiteCrawlError(
          `Cannot access website: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}`,
          { 
            url: source.url, 
            error: fetchError instanceof Error ? fetchError.message : String(fetchError)
          }
        );
      }
      
      const crawledData: Array<{
        url: string;
        title: string;
        content: string;
        links: string[];
        depth: number;
        crawledAt: Date;
        status: 'success' | 'failed' | 'skipped';
        errorMessage?: string;
        responseTime?: number;
        statusCode?: number;
      }> = [];

      // Load robots.txt for the domain (if respecting robots.txt is enabled)
      let robotsFile: RobotsFile | null = null;
      
      if (settings.respectRobotsTxt) {
        try {
          console.log(`🤖 Loading robots.txt for ${source.url}`);
          robotsFile = await RobotsFile.find(source.url);
          console.log(`🤖 Robots.txt loaded successfully`);
        } catch (robotsError) {
          console.log(`🤖 Could not load robots.txt (will proceed without it):`, robotsError);
          // Continue without robots.txt if it can't be loaded
        }
      } else {
        console.log(`🤖 Robots.txt checking disabled in settings`);
      }

      // Configure Crawlee with professional settings
      const crawler = new CheerioCrawler({
        // Configure crawling limits
        maxRequestsPerCrawl: settings.maxPages,
        maxConcurrency: 2, // Conservative concurrency
        requestHandlerTimeoutSecs: 30,
        
        // Configure HTTP client behavior
        ignoreSslErrors: true, // Allow crawling sites with SSL issues
        additionalMimeTypes: ['text/html', 'application/xhtml+xml'],
        
        // Skip non-text content types (images, videos, etc.)
        ignoreHttpErrorStatusCodes: [404, 403], // Don't retry on these common errors
        additionalHttpErrorStatusCodes: [], // Only treat 5xx as errors by default
        
        // Disable session pool to avoid keyv storage issues in Next.js
        useSessionPool: false,
        
        // Configure pre-navigation hooks for robots.txt checking and debugging
        preNavigationHooks: [
          async ({ request, log }) => {
            console.log(`🔄 Pre-navigation hook called for: ${request.url}`);
            log.info(`Pre-navigation for: ${request.url}`);
            
            // Check robots.txt if enabled and available
            if (robotsFile && settings.respectRobotsTxt) {
              const userAgent = 'Mozilla/5.0 (compatible; ChatbotCrawler/1.0)';
                
              if (!robotsFile.isAllowed(request.url, userAgent)) {
                log.warning(`Skipping ${request.url} due to robots.txt restrictions`);
                throw new Error(`Blocked by robots.txt: ${request.url}`);
              }
            }
            
            // Set custom headers to appear more like a regular browser
            request.headers = {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
              'Accept-Language': 'en-US,en;q=0.5',
              'Accept-Encoding': 'gzip, deflate',
              'Connection': 'keep-alive',
              'Upgrade-Insecure-Requests': '1',
              ...request.headers
            };
          }
        ],
        
        // Smart request handling
        requestHandler: async ({ request, $, log, response }) => {
          console.log(`🔍 Request handler called for: ${request.url}`);
          try {
            // Check content type to skip non-HTML content
            const contentType = response?.headers?.['content-type'] || '';
            if (!contentType.includes('text/html') && !contentType.includes('application/xhtml')) {
              log.info(`Skipping non-HTML content: ${request.url} (${contentType})`);
              return;
            }
            
            const pageDepth = (request.userData as any)?.depth || 0;
            console.log(`📋 Page depth: ${pageDepth}, Loaded URL: ${request.loadedUrl}`);
            console.log(`📋 Cheerio object available: ${!!$}`);
            log.info(`Processing page at depth ${pageDepth}: ${request.loadedUrl}`);
            
            // Extract page content
            const title = $('title').text().trim() || 
                         $('h1').first().text().trim() || 
                         'Untitled Page';
            
            // Smart content extraction
            const content = this.extractMainContent($);
            
            if (content.length < 100) {
              log.warning(`Skipping page with minimal content: ${request.loadedUrl}`);
              return;
            }

            // Extract internal links for further crawling
            const links = this.extractInternalLinks($, source.url, settings.maxDepth);
            log.info(`Found ${links.length} internal links on ${request.loadedUrl}`);
            
            crawledData.push({
              url: request.loadedUrl || request.url,
              title,
              content,
              links,
              depth: pageDepth,
              crawledAt: new Date(),
              status: 'success'
            });

            // Add discovered links to crawl queue (respecting depth)
            const currentDepth = (request.userData as any)?.depth || 0;
            if (currentDepth < settings.maxDepth) {
              // Filter links through robots.txt if enabled
              let linksToAdd = links.slice(0, 10);
              
              if (robotsFile && settings.respectRobotsTxt) {
                const userAgent = 'Mozilla/5.0 (compatible; ChatbotCrawler/1.0)';
                linksToAdd = linksToAdd.filter(link => {
                  const allowed = robotsFile!.isAllowed(link, userAgent);
                  if (!allowed) {
                    log.info(`Skipping link due to robots.txt: ${link}`);
                  }
                  return allowed;
                });
              }
              
              const newRequests = linksToAdd.map(link => ({
                url: link,
                userData: { depth: currentDepth + 1 }
              }));
              
              await crawler.addRequests(newRequests);
              log.info(`Added ${newRequests.length} links at depth ${currentDepth + 1}`);
            } else {
              log.info(`Reached max depth ${settings.maxDepth}, not adding more links`);
            }

          } catch (error) {
            console.log(`❌ Error in request handler for ${request.url}:`, error);
            log.error(`Error processing ${request.url}:`, { error });
            
            // Add failed page to crawled data
            crawledData.push({
              url: request.url,
              title: 'Processing failed',
              content: '',
              links: [],
              depth: (request.userData as any)?.depth || 0,
              crawledAt: new Date(),
              status: 'failed',
              errorMessage: error instanceof Error ? error.message : String(error)
            });
            
            // Don't throw - let crawler continue
            log.warning(`Continuing crawl despite error on ${request.url}`);
          }
        },

        // Handle failures gracefully
        failedRequestHandler: async ({ request, log, error }) => {
          const errorMessage = error instanceof Error ? error.message : 'Request failed';
          log.error(`Request failed: ${request.url}`, { error: errorMessage });
          
          // Add failed page to crawled data for tracking
          crawledData.push({
            url: request.url,
            title: 'Failed to load',
            content: '',
            links: [],
            depth: (request.userData as any)?.depth || 0,
            crawledAt: new Date(),
            status: 'failed',
            errorMessage: errorMessage
          });
        }
      });

      // Start crawling from the root URL with initial depth
      console.log(`🚀 Starting crawler for URL: ${source.url}`);
      console.log(`📋 Crawler settings:`, { 
        maxPages: settings.maxPages, 
        maxDepth: settings.maxDepth, 
        maxConcurrency: 2,
        respectRobotsTxt: settings.respectRobotsTxt
      });
      
      // Add the initial request to the crawler
      const initialRequests = [{ url: source.url, userData: { depth: 0 } }];
      console.log(`📋 Adding initial requests:`, initialRequests);
      
      // Check robots.txt first for debugging
      try {
        const robotsUrl = new URL('/robots.txt', source.url).href;
        const robotsResponse = await fetch(robotsUrl);
        if (robotsResponse.ok) {
          const robotsText = await robotsResponse.text();
          console.log(`🤖 Robots.txt found at ${robotsUrl}:`);
          console.log(robotsText.substring(0, 500) + (robotsText.length > 500 ? '...' : ''));
        } else {
          console.log(`🤖 No robots.txt found at ${robotsUrl} (${robotsResponse.status})`);
        }
      } catch (robotsError) {
        console.log(`🤖 Could not check robots.txt:`, robotsError);
      }
      
      await crawler.run(initialRequests);
      
      console.log(`📊 Crawl completed. Pages found: ${crawledData.length}`);
      console.log(`📋 Crawled data summary:`, crawledData.map(d => ({
        url: d.url,
        status: d.status,
        contentLength: d.content.length,
        error: d.errorMessage
      })));

      if (crawledData.length === 0) {
        throw new WebsiteCrawlError(
          `No content could be extracted from ${source.url}. The website may be blocking crawlers, require authentication, or have technical issues.`,
          { 
            url: source.url, 
            pagesAttempted: 0,
            suggestion: 'Try checking if the website is accessible in a browser and doesn\'t require login',
            robotsFileLoaded: !!robotsFile,
            respectRobotsTxt: settings.respectRobotsTxt
          }
        );
      }

      // Convert crawled data to knowledge items with AI categorization
      const knowledgeItems: KnowledgeItem[] = [];
      
      for (const page of crawledData) {
        try {
          const category = await this.categorizeContentWithAI(page.content, page.title);
          
          const knowledgeItem: KnowledgeItem = {
            id: `website_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            title: `${page.title} | ${new URL(page.url).pathname}`,
            content: page.content,
            category,
            tags: ['website', 'crawled'],
            relevanceScore: 0.8,
            source: page.url,
            lastUpdated: new Date()
          };

          knowledgeItems.push(knowledgeItem);
        } catch (error) {
          // Log but don't fail the entire crawl for categorization errors
          console.warn(`Failed to categorize content for ${page.url}:`, error);
          
          // Use fallback categorization
          const knowledgeItem: KnowledgeItem = {
            id: `website_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            title: `${page.title} | ${new URL(page.url).pathname}`,
            content: page.content,
            category: 'general', // Fallback category
            tags: ['website', 'crawled'],
            relevanceScore: 0.8,
            source: page.url,
            lastUpdated: new Date()
          };

          knowledgeItems.push(knowledgeItem);
        }
      }

      return {
        knowledgeItems,
        crawledPages: crawledData.map(page => ({
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

    } catch (error) {
      if (error instanceof WebsiteCrawlError || 
          error instanceof ContentExtractionError ||
          error instanceof InvalidUrlError) {
        throw error;
      }

      throw new WebsiteCrawlError(
        `Crawling failed for ${source.url}`,
        { 
          url: source.url, 
          error: error instanceof Error ? error.message : String(error) 
        }
      );
    }
  }

  /**
   * Crawl website and store content persistently (2025 Best Practice)
   * 
   * AI INSTRUCTIONS:
   * - Crawls website content and stores in chatbot_knowledge_items table
   * - Generates embeddings for semantic search capabilities
   * - Provides complete RAG pipeline with content persistence
   * - Supports efficient content retrieval for answering questions
   */
  async crawlAndStoreWebsite(
    organizationId: string,
    chatbotConfigId: string,
    source: WebsiteSource,
    settings: WebsiteCrawlSettings
  ): Promise<{
    storedItems: number;
    crawledPages: Array<{
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
  }> {
    try {
      // First, crawl the website
      const crawlResult = await this.crawlWebsite(source, settings);

      // Generate embeddings and prepare for storage
      const itemsToStore = [];

      for (const knowledgeItem of crawlResult.knowledgeItems) {
        try {
          // Generate embedding for content
          const embedding = await this.embeddingService.generateEmbedding(knowledgeItem.content);
          
          // Generate content hash for change detection
          const contentHash = createHash('sha256')
            .update(knowledgeItem.content)
            .digest('hex');

          // Check if content already exists and is unchanged
          const exists = await this.knowledgeItemRepository.knowledgeItemExists(
            organizationId,
            chatbotConfigId,
            knowledgeItem.id,
            contentHash
          );

          if (!exists) {
            itemsToStore.push({
              knowledgeItemId: knowledgeItem.id,
              title: knowledgeItem.title,
              content: knowledgeItem.content,
              category: knowledgeItem.category,
              tags: knowledgeItem.tags || [],
              sourceType: 'website_crawled' as const,
              sourceUrl: knowledgeItem.source,
              sourceMetadata: {
                crawledAt: new Date().toISOString(),
                originalUrl: knowledgeItem.source
              },
              relevanceScore: knowledgeItem.relevanceScore || 0.8,
              embedding: embedding,
              contentHash
            });
          }
        } catch (error) {
          console.warn(`Failed to process knowledge item ${knowledgeItem.id}:`, error);
          // Continue with other items
        }
      }

      // Store knowledge items with content and embeddings
      if (itemsToStore.length > 0) {
        await this.knowledgeItemRepository.storeKnowledgeItems(
          organizationId,
          chatbotConfigId,
          itemsToStore
        );
      }

      return {
        storedItems: itemsToStore.length,
        crawledPages: crawlResult.crawledPages
      };

    } catch (error) {
      if (error instanceof WebsiteCrawlError || 
          error instanceof ContentExtractionError ||
          error instanceof InvalidUrlError) {
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
   * Delete stored content for a website source
   * 
   * AI INSTRUCTIONS:
   * - Removes all stored knowledge items for a specific website
   * - Used when website sources are removed or refreshed
   * - Returns count of deleted items for confirmation
   */
  async deleteStoredWebsiteContent(
    organizationId: string,
    chatbotConfigId: string,
    sourceUrl: string
  ): Promise<number> {
    try {
      return await this.knowledgeItemRepository.deleteKnowledgeItemsBySource(
        organizationId,
        chatbotConfigId,
        'website_crawled',
        sourceUrl
      );
    } catch (error) {
      throw new BusinessRuleViolationError(
        `Failed to delete stored website content: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { organizationId, chatbotConfigId, sourceUrl }
      );
    }
  }

  /**
   * Crawl multiple website sources in batch
   */
  async crawlMultipleWebsites(
    sources: WebsiteSource[], 
    settings: WebsiteCrawlSettings
  ): Promise<{ results: KnowledgeItem[]; errors: Array<{ source: WebsiteSource; error: string }> }> {
    const results: KnowledgeItem[] = [];
    const errors: Array<{ source: WebsiteSource; error: string }> = [];

    for (const source of sources) {
      try {
        const crawlResult = await this.crawlWebsite(source, settings);
        results.push(...crawlResult.knowledgeItems);
      } catch (error) {
        errors.push({
          source,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    return { results, errors };
  }

  /**
   * Smart content extraction from HTML
   * 
   * AI INSTRUCTIONS:
   * - Extract main content, avoiding navigation and ads
   * - Preserve structure and context
   * - Clean up formatting for better embedding
   */
  private extractMainContent($: any): string {
    // Remove unwanted elements
    $('script, style, nav, header, footer, aside, .ads, .advertisement, .sidebar').remove();
    
    // Try to find main content areas
    const contentSelectors = [
      'main',
      'article', 
      '[role="main"]',
      '.content',
      '.main-content',
      '#content',
      '#main'
    ];

    let content = '';
    
    for (const selector of contentSelectors) {
      const element = $(selector);
      if (element.length > 0) {
        content = element.text();
        break;
      }
    }

    // Fallback to body if no main content found
    if (!content) {
      content = $('body').text();
    }

    // Clean up the content
    return content
      .replace(/\s+/g, ' ')  // Normalize whitespace
      .replace(/\n+/g, '\n') // Normalize line breaks
      .trim();
  }

  /**
   * Extract internal links for further crawling
   */
  private extractInternalLinks($: any, baseUrl: string, maxDepth: number): string[] {
    const links: string[] = [];
    const baseDomain = new URL(baseUrl).hostname;

    $('a[href]').each((_: any, element: any) => {
      try {
        const href = $(element).attr('href');
        if (!href) return;

        // Convert relative URLs to absolute
        const absoluteUrl = new URL(href, baseUrl).href;
        const linkDomain = new URL(absoluteUrl).hostname;

        // Only include internal links that are likely to contain text content
        if (linkDomain === baseDomain && 
            !links.includes(absoluteUrl) &&
            !this.isExcludedPath(absoluteUrl) &&
            this.isLikelyTextContent(absoluteUrl)) {
          links.push(absoluteUrl);
        }
      } catch (error) {
        // Skip invalid URLs
      }
    });

    return links;
  }

  /**
   * Check if a URL is likely to contain text content worth crawling
   */
  private isLikelyTextContent(url: string): boolean {
    // If it passes the exclusion check and doesn't have obvious non-text indicators
    if (this.isExcludedPath(url)) {
      return false;
    }
    
    // Additional positive indicators for text content
    const textContentIndicators = [
      /\/(blog|article|news|post|page|content|about|help|faq|docs|documentation)/i,
      /\.(html|htm|php|asp|aspx)$/i,
      /\/$/  // Directory paths often contain HTML pages
    ];
    
    // If URL has no file extension, it's likely a page
    const hasNoExtension = !url.match(/\.[a-z0-9]{2,4}$/i);
    const hasTextIndicators = textContentIndicators.some(pattern => pattern.test(url));
    
    return hasNoExtension || hasTextIndicators;
  }

  /**
   * Check if a path should be excluded from crawling
   * 
   * AI INSTRUCTIONS:
   * - Skip image files, videos, and other media (no textual content)
   * - Skip binary files and downloads
   * - Skip admin areas and user-specific pages
   * - Skip tracking URLs and anchor links
   */
  private isExcludedPath(url: string): boolean {
    const excludedPatterns = [
      // Image files - no textual content for knowledge base
      /\.(jpg|jpeg|png|gif|bmp|webp|svg|ico|tiff|tif)$/i,
      
      // Video and audio files - no textual content
      /\.(mp4|avi|mov|wmv|flv|webm|mkv|mp3|wav|ogg|flac|aac)$/i,
      
      // Document files that might need special handling
      /\.(pdf|doc|docx|xls|xlsx|ppt|pptx|zip|rar|tar|gz|7z)$/i,
      
      // Executable and binary files
      /\.(exe|dmg|pkg|deb|rpm|msi|app)$/i,
      
      // CSS, JS, and other assets
      /\.(css|js|json|xml|rss|atom)$/i,
      
      // Admin and user-specific areas
      /\/(admin|wp-admin|login|register|checkout|cart|account|profile|dashboard)/i,
      
      // Skip anchor links (same page)
      /#/,
      
      // Skip tracking URLs and campaign parameters
      /\?.*utm_/i,
      /\?.*fbclid/i,
      /\?.*gclid/i,
      
      // Skip common non-content paths
      /\/(api|wp-json|feed|rss|sitemap)/i,
      
      // Skip social media and external sharing URLs
      /\/(share|print|email)/i
    ];

    return excludedPatterns.some(pattern => pattern.test(url));
  }

  /**
   * AI-powered content categorization
   */
  private async categorizeContentWithAI(content: string, title: string): Promise<KnowledgeItem['category']> {
    try {
      const prompt = `Analyze this webpage content and categorize it into ONE of these categories:
- general: General information, news, blogs
- faq: Frequently asked questions, help content
- product_info: Product descriptions, specifications, catalogs  
- pricing: Pricing, plans, costs, quotes
- support: Help, troubleshooting, documentation

Title: "${title}"
Content: "${content.substring(0, 1000)}..."

Respond with ONLY the category name (lowercase):`;

      const response = await this.openAIProvider.createChatCompletion(
        [{ role: 'user', content: prompt }],
        undefined, // no functions
        'none', // no function calling
        undefined, // no session ID
        undefined // no call type
      );

      const responseContent = response.choices[0]?.message?.content || '';
      return this.parseAICategoryResponse(responseContent);
    } catch (error) {
      // Fallback to general category if AI categorization fails
      return 'general';
    }
  }

  /**
   * Validate URL format and accessibility
   */
  private validateUrl(url: string): void {
    try {
      const urlObj = new URL(url);
      
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        throw new InvalidUrlError(
          `Invalid protocol: ${urlObj.protocol}. Only HTTP and HTTPS are supported.`,
          { url, protocol: urlObj.protocol }
        );
      }
    } catch (error) {
      if (error instanceof InvalidUrlError) {
        throw error;
      }
      
      throw new InvalidUrlError(
        `Invalid URL format: ${url}`,
        { url, error: error instanceof Error ? error.message : String(error) }
      );
    }
  }

  /**
   * Parse AI categorization response
   */
  private parseAICategoryResponse(response: string): KnowledgeItem['category'] {
    const category = response.toLowerCase().trim();
    const validCategories = ['general', 'faq', 'product_info', 'pricing', 'support'];
    
    return validCategories.includes(category) ? category as KnowledgeItem['category'] : 'general';
  }
} 
