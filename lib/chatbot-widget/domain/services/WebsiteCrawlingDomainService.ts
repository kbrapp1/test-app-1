/**
 * Website Crawling Domain Service
 * 
 * AI INSTRUCTIONS:
 * - Keep business logic pure, no external dependencies
 * - Maintain single responsibility principle  
 * - Never exceed 250 lines - refactor into smaller services
 * - Follow @golden-rule patterns exactly
 * - Focus on domain rules and business validation
 * - Handle domain errors with specific error types
 * - Coordinate other domain services for complex operations
 */

import { createHash } from 'crypto';
import { WebsiteSource, WebsiteCrawlSettings } from '../value-objects/ai-configuration/KnowledgeBase';
import { KnowledgeItem } from '../services/interfaces/IKnowledgeRetrievalService';
import { 
  InvalidUrlError, 
  WebsiteAccessibilityError, 
  CrawlLimitExceededError,
  RobotsTxtViolationError 
} from '../errors/ChatbotWidgetDomainErrors';
import { 
  WebsiteCrawlingError, 
  ContentExtractionError, 
  UrlNormalizationError,
  DataValidationError 
} from '../errors/ChatbotWidgetDomainErrors';

/**
 * Interface for robots.txt checking abstraction
 * 
 * AI INSTRUCTIONS:
 * - Abstract external robots.txt library from domain logic
 * - Enable testing with mock implementations
 * - Keep domain layer pure from infrastructure dependencies
 */
export interface IRobotsTxtChecker {
  isAllowed(url: string, userAgent: string): Promise<boolean>;
  canLoad(url: string): Promise<boolean>;
}

/**
 * Domain model for crawled page data
 * 
 * AI INSTRUCTIONS:
 * - Represent crawled page in domain terms
 * - Include business-relevant metadata
 * - Support domain operations and validation
 */
export interface CrawledPageData {
  readonly url: string;
  readonly title: string;
  readonly content: string;
  readonly depth: number;
  readonly crawledAt: Date;
  readonly status: 'success' | 'failed' | 'skipped';
  readonly errorMessage?: string;
  readonly responseTime?: number;
  readonly statusCode?: number;
}

/**
 * Domain model for crawl result
 */
export interface CrawlResult {
  readonly knowledgeItems: KnowledgeItem[];
  readonly crawledPages: CrawledPageData[];
  readonly totalPagesAttempted: number;
  readonly successfulPages: number;
  readonly failedPages: number;
  readonly skippedPages: number;
}

/**
 * Website Crawling Domain Service
 * 
 * AI INSTRUCTIONS:
 * - Pure business logic for website crawling orchestration
 * - No external dependencies on crawling libraries
 * - Focus on domain rules and business validation
 * - Coordinate with other domain services
 * - Use domain-specific error handling
 */
export class WebsiteCrawlingDomainService {
  private readonly userAgent = 'Mozilla/5.0 (compatible; ChatbotCrawler/1.0)';

  /**
   * Validate crawl request according to business rules
   * 
   * AI INSTRUCTIONS:
   * - Apply all business validation rules
   * - Check URL accessibility and format
   * - Validate crawl settings constraints
   * - Ensure robots.txt compliance if required
   */
  async validateCrawlRequest(
    source: WebsiteSource,
    settings: WebsiteCrawlSettings,
    robotsChecker?: IRobotsTxtChecker
  ): Promise<void> {
    console.log(`📋 Domain Service: Validating crawl request for ${source.url}`);
    
    // Domain rule: Validate URL format and protocol
    console.log('🔍 Validating URL format...');
    this.validateUrlFormat(source.url);
    console.log('✅ URL format validation passed');
    
    // Domain rule: Validate crawl settings
    console.log('⚙️ Validating crawl settings...');
    this.validateCrawlSettings(settings);
    console.log('✅ Crawl settings validation passed');
    
    // Domain rule: Check URL accessibility
    console.log('🌐 Checking URL accessibility...');
    await this.validateUrlAccessibility(source.url);
    console.log('✅ URL accessibility check passed');
    
    // Domain rule: Check robots.txt compliance if required
    if (settings.respectRobotsTxt && robotsChecker) {
      console.log('🤖 Checking robots.txt compliance...');
      await this.validateRobotsTxtCompliance(source.url, robotsChecker);
      console.log('✅ Robots.txt compliance check passed');
    } else {
      console.log('⏭️ Robots.txt compliance check skipped');
    }
    
    console.log('✅ Domain Service: All validations passed');
  }

  /**
   * Calculate crawl budget based on settings and business rules
   * 
   * AI INSTRUCTIONS:
   * - Apply business rules for crawl limits
   * - Consider depth and page count constraints
   * - Provide guidance for efficient crawling
   */
  calculateCrawlBudget(settings: WebsiteCrawlSettings): {
    maxPages: number;
    maxDepth: number;
    estimatedTime: number;
    recommendedConcurrency: number;
  } {
    // Domain rule: Enforce maximum page limits
    const maxPages = Math.min(settings.maxPages, this.getMaxAllowedPages());
    
    // Domain rule: Enforce maximum depth limits
    const maxDepth = Math.min(settings.maxDepth, this.getMaxAllowedDepth());
    
    // Domain rule: Estimate crawl time based on page count
    const estimatedTime = this.estimateCrawlTime(maxPages, maxDepth);
    
    // Domain rule: Recommend conservative concurrency
    const recommendedConcurrency = this.calculateOptimalConcurrency(maxPages);

    return {
      maxPages,
      maxDepth,
      estimatedTime,
      recommendedConcurrency
    };
  }

  /**
   * Process crawl result and apply business validation
   * 
   * AI INSTRUCTIONS:
   * - Validate crawl results meet business requirements
   * - Apply content quality rules
   * - Generate business metrics and insights
   */
  processCrawlResult(crawledPages: CrawledPageData[]): CrawlResult {
    // Domain rule: Filter out low-quality content
    const qualityFilteredPages = this.filterQualityContent(crawledPages);
    
    // Domain rule: Calculate business metrics
    const metrics = this.calculateCrawlMetrics(crawledPages);
    
    // Domain rule: Generate knowledge items from quality content
    const knowledgeItems = this.generateKnowledgeItems(qualityFilteredPages);

    return {
      knowledgeItems,
      crawledPages: qualityFilteredPages,
      totalPagesAttempted: metrics.totalPages,
      successfulPages: metrics.successfulPages,
      failedPages: metrics.failedPages,
      skippedPages: metrics.skippedPages
    };
  }

  /**
   * Check if URL should be crawled based on business rules
   * 
   * AI INSTRUCTIONS:
   * - Apply business rules for URL selection
   * - Consider content value and relevance
   * - Respect crawl depth and limits
   */
  shouldCrawlUrl(
    url: string,
    baseUrl: string,
    currentDepth: number,
    settings: WebsiteCrawlSettings
  ): boolean {
    // Domain rule: Respect depth limits
    if (currentDepth >= settings.maxDepth) {
      return false;
    }
    
    // Domain rule: Only crawl same-domain URLs
    if (!this.isSameDomain(url, baseUrl)) {
      return false;
    }
    
    // Domain rule: Skip URLs that won't provide valuable content
    if (!this.isValueableContent(url)) {
      return false;
    }

    return true;
  }

  /**
   * Validate URL format and protocol
   */
  private validateUrlFormat(url: string): void {
    try {
      const urlObj = new URL(url);
      
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        throw new InvalidUrlError(
          url,
          `Only HTTP and HTTPS protocols are supported`,
          { protocol: urlObj.protocol }
        );
      }
      
      if (!urlObj.hostname) {
        throw new InvalidUrlError(
          url,
          `URL must have a valid hostname`
        );
      }
      
    } catch (error) {
      if (error instanceof InvalidUrlError) {
        throw error;
      }
      
      // Track URL normalization error
      throw new UrlNormalizationError(url, {
        originalError: error instanceof Error ? error.message : String(error),
        operation: 'url_format_validation'
      });
    }
  }

  /**
   * Validate crawl settings according to business rules
   */
  private validateCrawlSettings(settings: WebsiteCrawlSettings): void {
    if (settings.maxPages <= 0) {
      throw new DataValidationError(
        'maxPages',
        'must be greater than 0',
        { maxPages: settings.maxPages }
      );
    }
    
    if (settings.maxPages > this.getMaxAllowedPages()) {
      throw new DataValidationError(
        'maxPages',
        `cannot exceed ${this.getMaxAllowedPages()}`,
        { maxPages: settings.maxPages, limit: this.getMaxAllowedPages() }
      );
    }
    
    if (settings.maxDepth <= 0 || settings.maxDepth > this.getMaxAllowedDepth()) {
      throw new DataValidationError(
        'maxDepth',
        `must be between 1 and ${this.getMaxAllowedDepth()}`,
        { maxDepth: settings.maxDepth, limit: this.getMaxAllowedDepth() }
      );
    }
  }

  /**
   * Validate URL accessibility
   */
  private async validateUrlAccessibility(url: string): Promise<void> {
    try {
      const response = await fetch(url, {
        method: 'HEAD',
        headers: { 'User-Agent': this.userAgent },
      });

      if (!response.ok) {
        throw new WebsiteAccessibilityError(
          url,
          `Website returned ${response.status} ${response.statusText}`,
          {
            status: response.status,
            statusText: response.statusText,
          }
        );
      }
    } catch (fetchError) {
      // Track website crawling error
      throw new WebsiteCrawlingError(
        url,
        fetchError instanceof Error ? fetchError.message : String(fetchError),
        {
          operation: 'url_accessibility_check',
          userAgent: this.userAgent
        }
      );
    }
  }

  /**
   * Validate robots.txt compliance
   */
  private async validateRobotsTxtCompliance(
    url: string,
    robotsChecker: IRobotsTxtChecker
  ): Promise<void> {
    try {
      const canLoad = await robotsChecker.canLoad(url);
      if (!canLoad) {
        throw new RobotsTxtViolationError(
          url,
          'Unable to load robots.txt for compliance checking'
        );
      }
      
      const isAllowed = await robotsChecker.isAllowed(url, this.userAgent);
      if (!isAllowed) {
        throw new RobotsTxtViolationError(
          url,
          'URL is blocked by robots.txt',
          { userAgent: this.userAgent }
        );
      }
    } catch (error) {
      if (error instanceof RobotsTxtViolationError) {
        throw error;
      }
      
      throw new RobotsTxtViolationError(
        url,
        'Failed to check robots.txt compliance',
        { 
          error: error instanceof Error ? error.message : String(error) 
        }
      );
    }
  }

  private getMaxAllowedPages(): number {
    return 100; // Domain rule: Maximum 100 pages per crawl
  }

  private getMaxAllowedDepth(): number {
    return 5; // Domain rule: Maximum depth of 5 levels
  }

  private estimateCrawlTime(maxPages: number, maxDepth: number): number {
    // Domain rule: Estimate 2-3 seconds per page on average
    return maxPages * 2.5;
  }

  private calculateOptimalConcurrency(maxPages: number): number {
    // Domain rule: Conservative concurrency to avoid overwhelming servers
    return Math.min(2, Math.ceil(maxPages / 20));
  }

  private filterQualityContent(pages: CrawledPageData[]): CrawledPageData[] {
    return pages.filter(page => 
      page.status === 'success' && 
      page.content.length >= 100 && // Minimum content length
      page.title.trim().length > 0
    );
  }

  private calculateCrawlMetrics(pages: CrawledPageData[]) {
    return {
      totalPages: pages.length,
      successfulPages: pages.filter(p => p.status === 'success').length,
      failedPages: pages.filter(p => p.status === 'failed').length,
      skippedPages: pages.filter(p => p.status === 'skipped').length
    };
  }

  private generateKnowledgeItems(pages: CrawledPageData[]): KnowledgeItem[] {
    return pages.map(page => {
      // Generate deterministic ID based on URL to prevent duplicates on recrawl
      // Use URL hash for consistent, unique identification
      const urlForId = page.url.replace(/[#?].*$/, ''); // Remove query params and fragments
      const urlHash = createHash('sha256').update(urlForId).digest('hex').substring(0, 16);
      
      return {
        id: `website_${urlHash}`,
        title: `${page.title} | ${new URL(page.url).pathname}`,
        content: page.content,
        category: 'general' as const, // Will be categorized by ContentCategorizationService
        tags: ['website', 'crawled'],
        relevanceScore: 0.8,
        source: page.url,
        lastUpdated: page.crawledAt
      };
    });
  }

  private isSameDomain(url: string, baseUrl: string): boolean {
    try {
      return new URL(url).hostname === new URL(baseUrl).hostname;
    } catch {
      return false;
    }
  }

  private isValueableContent(url: string): boolean {
    // Reuse content URL validation logic
    const excludedPatterns = [
      /\.(jpg|jpeg|png|gif|bmp|webp|svg|ico|pdf|doc|zip)$/i,
      /\/(admin|login|api|feed)/i,
      /#/, /\?.*utm_/i
    ];

    return !excludedPatterns.some(pattern => pattern.test(url));
  }
} 