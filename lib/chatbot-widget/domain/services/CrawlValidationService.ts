/**
 * Crawl Validation Service
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Handle all crawl request validation
 * - Keep validation logic pure and focused
 * - Never exceed 250 lines per @golden-rule
 * - Handle domain-specific validation rules
 * - Use domain-specific error handling
 * - Support comprehensive validation workflows
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

/**
 * Specialized Service for Crawl Request Validation
 * 
 * AI INSTRUCTIONS:
 * - Handle comprehensive validation of crawl requests
 * - Apply all business validation rules systematically
 * - Provide clear validation error messages
 * - Support both basic and advanced validation scenarios
 * - Maintain separation between validation types
 */
export class CrawlValidationService {
  private readonly userAgent = 'Mozilla/5.0 (compatible; ChatbotCrawler/1.0)';

  /**
   * Perform comprehensive validation of crawl request
   * 
   * AI INSTRUCTIONS:
   * - Orchestrate all validation steps in logical order
   * - Handle validation workflow systematically
   * - Provide clear error context for failures
   * - Support optional validation components
   */
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

  /**
   * Validate URL format and protocol requirements
   * 
   * AI INSTRUCTIONS:
   * - Check URL syntax and format validity
   * - Enforce protocol requirements (HTTP/HTTPS only)
   * - Validate hostname presence and validity
   * - Provide specific error messages for validation failures
   */
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

  /**
   * Validate crawl settings according to business rules
   * 
   * AI INSTRUCTIONS:
   * - Apply business constraints on crawl parameters
   * - Validate page count and depth limits
   * - Ensure settings are within allowed ranges
   * - Provide specific validation error context
   */
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

  /**
   * Validate URL accessibility via network request
   * 
   * AI INSTRUCTIONS:
   * - Check if URL is accessible and responds correctly
   * - Use HEAD request for efficiency
   * - Handle network errors appropriately
   * - Provide detailed error context for failures
   */
  async validateUrlAccessibility(url: string): Promise<void> {
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
      if (fetchError instanceof WebsiteAccessibilityError) {
        throw fetchError;
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

  /**
   * Validate robots.txt compliance
   * 
   * AI INSTRUCTIONS:
   * - Check robots.txt availability and compliance
   * - Validate crawl permissions for user agent
   * - Handle robots.txt parsing errors gracefully
   * - Provide specific violation context
   */
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

  /**
   * Get maximum allowed pages per crawl
   * 
   * AI INSTRUCTIONS:
   * - Return business rule for maximum page limit
   * - Support configuration through domain constants
   * - Enable easy adjustment of business constraints
   */
  private getMaxAllowedPages(): number {
    return 100; // Domain rule: Maximum 100 pages per crawl
  }

  /**
   * Get maximum allowed crawl depth
   * 
   * AI INSTRUCTIONS:
   * - Return business rule for maximum depth limit
   * - Support configuration through domain constants
   * - Enable easy adjustment of business constraints
   */
  private getMaxAllowedDepth(): number {
    return 5; // Domain rule: Maximum depth of 5 levels
  }
}