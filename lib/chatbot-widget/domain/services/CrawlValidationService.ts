/**
 * AI INSTRUCTIONS: Service for crawl request validation.
 * Handle domain-specific validation rules. @golden-rule: <250 lines.
 */

import { WebsiteSource, WebsiteCrawlSettings } from '../value-objects/ai-configuration/KnowledgeBase';
import { 
  InvalidUrlError, 
  WebsiteAccessibilityError, 
  RobotsTxtViolationError,
  WebsiteCrawlingError, 
  UrlNormalizationError,
  DataValidationError 
} from '../errors/ChatbotWidgetDomainErrors';
import { IRobotsTxtChecker } from './WebsiteCrawlingDomainService';

/** Specialized Service for Crawl Request Validation */
export class CrawlValidationService {
  private readonly userAgent = 'Mozilla/5.0 (compatible; ChatbotCrawler/1.0)';

  /** Perform comprehensive validation of crawl request */
  async validateComprehensively(
    source: WebsiteSource,
    settings: WebsiteCrawlSettings,
    robotsChecker?: IRobotsTxtChecker
  ): Promise<void> {
    // Step 1: Validate URL format and protocol
    this.validateUrlFormat(source.url);
    
    // Step 2: Validate crawl settings constraints
    this.validateCrawlSettings(settings);
    
    // Step 3: Check URL accessibility
    await this.validateUrlAccessibility(source.url);
    
    // Step 4: Check robots.txt compliance if required
    if (settings.respectRobotsTxt && robotsChecker) {
      await this.validateRobotsTxtCompliance(source.url, robotsChecker);
    }
  }

  /** Validate URL format and protocol requirements */
  validateUrlFormat(url: string): void {
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
      
      throw new UrlNormalizationError(url, {
        originalError: error instanceof Error ? error.message : String(error),
        operation: 'url_format_validation'
      });
    }
  }

  /** Validate crawl settings according to business rules */
  validateCrawlSettings(settings: WebsiteCrawlSettings): void {
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

  /** Validate URL accessibility via network request */
  async validateUrlAccessibility(url: string): Promise<void> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    try {
      const response = await fetch(url, {
        method: 'HEAD',
        headers: { 'User-Agent': this.userAgent },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

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
      clearTimeout(timeoutId);
      
      if (fetchError instanceof WebsiteAccessibilityError) {
        throw fetchError;
      }
      
      // Handle abort errors specifically
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        throw new WebsiteCrawlingError(
          url,
          'Request timed out after 10 seconds',
          {
            operation: 'url_accessibility_check',
            userAgent: this.userAgent,
            timeout: true
          }
        );
      }
      
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

  /** Validate robots.txt compliance */
  async validateRobotsTxtCompliance(
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

  /** Get maximum allowed pages per crawl */
  private getMaxAllowedPages(): number {
    return 100; // Domain rule: Maximum 100 pages per crawl
  }

  /** Get maximum allowed crawl depth */
  private getMaxAllowedDepth(): number {
    return 5; // Domain rule: Maximum depth of 5 levels
  }
}