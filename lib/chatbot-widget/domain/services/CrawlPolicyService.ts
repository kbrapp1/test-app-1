/**
 * Crawl Policy Service
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Determine crawling policies and URL selection rules
 * - Keep policy logic pure and deterministic
 * - Never exceed 250 lines per @golden-rule
 * - Handle business rules for URL crawling decisions
 * - Support configurable crawling strategies
 * - Enable efficient crawl planning and execution
 */

import { WebsiteCrawlSettings } from '../value-objects/ai-configuration/KnowledgeBase';

/**
 * Domain model for URL evaluation result
 */
export interface UrlEvaluation {
  readonly shouldCrawl: boolean;
  readonly reason: string;
  readonly priority: 'high' | 'medium' | 'low';
  readonly estimatedValue: number;
}

/**
 * Specialized Service for Crawl Policy Decisions
 * 
 * AI INSTRUCTIONS:
 * - Handle URL crawling policy evaluation
 * - Apply business rules for efficient crawl selection
 * - Support different crawling strategies and priorities
 * - Enable content value assessment and optimization
 * - Provide clear reasoning for crawling decisions
 */
export class CrawlPolicyService {

  /**
   * Determine if URL should be crawled based on comprehensive policies
   * 
   * AI INSTRUCTIONS:
   * - Apply all relevant crawling policies systematically
   * - Consider depth, domain, and content value constraints
   * - Provide efficient crawl selection logic
   * - Support policy-based crawl optimization
   */
  shouldCrawlUrl(
    url: string,
    baseUrl: string,
    currentDepth: number,
    settings: WebsiteCrawlSettings
  ): boolean {
    const evaluation = this.evaluateUrl(url, baseUrl, currentDepth, settings);
    return evaluation.shouldCrawl;
  }

  /**
   * Evaluate URL with detailed reasoning and priority
   * 
   * AI INSTRUCTIONS:
   * - Provide comprehensive URL evaluation with reasoning
   * - Calculate priority and estimated value for crawl planning
   * - Support advanced crawl optimization strategies
   * - Enable detailed crawl decision analysis
   */
  evaluateUrl(
    url: string,
    baseUrl: string,
    currentDepth: number,
    settings: WebsiteCrawlSettings
  ): UrlEvaluation {
    // Check depth constraints
    if (currentDepth >= settings.maxDepth) {
      return {
        shouldCrawl: false,
        reason: `Exceeds maximum depth limit (${settings.maxDepth})`,
        priority: 'low',
        estimatedValue: 0
      };
    }

    // Check domain constraints
    if (!this.isSameDomain(url, baseUrl)) {
      return {
        shouldCrawl: false,
        reason: 'Outside target domain',
        priority: 'low',
        estimatedValue: 0
      };
    }

    // Check content value
    if (!this.isValuableContent(url)) {
      return {
        shouldCrawl: false,
        reason: 'Low-value content type or pattern',
        priority: 'low',
        estimatedValue: 0
      };
    }

    // Calculate priority and value for valuable URLs
    const priority = this.calculateUrlPriority(url, currentDepth);
    const estimatedValue = this.estimateUrlValue(url, currentDepth);

    return {
      shouldCrawl: true,
      reason: 'Meets all crawling criteria',
      priority,
      estimatedValue
    };
  }

  /**
   * Check if URLs are from the same domain
   * 
   * AI INSTRUCTIONS:
   * - Enforce same-domain crawling policy
   * - Handle URL parsing edge cases gracefully
   * - Support domain boundary enforcement
   * - Prevent crawl scope expansion beyond target domain
   */
  isSameDomain(url: string, baseUrl: string): boolean {
    try {
      const urlHostname = new URL(url).hostname.toLowerCase();
      const baseHostname = new URL(baseUrl).hostname.toLowerCase();
      
      // Allow exact matches
      if (urlHostname === baseHostname) {
        return true;
      }
      
      // Allow subdomain crawling (optional enhancement)
      if (this.shouldAllowSubdomains()) {
        return urlHostname.endsWith(`.${baseHostname}`) || 
               baseHostname.endsWith(`.${urlHostname}`);
      }
      
      return false;
    } catch {
      return false; // Invalid URLs should not be crawled
    }
  }

  /**
   * Determine if URL points to valuable content
   * 
   * AI INSTRUCTIONS:
   * - Apply content value assessment rules
   * - Filter out file downloads, admin pages, and low-value content
   * - Support efficient crawl resource allocation
   * - Enable content quality optimization
   */
  isValuableContent(url: string): boolean {
    // Exclude file downloads and media
    const excludedExtensions = [
      /\.(jpg|jpeg|png|gif|bmp|webp|svg|ico)$/i, // Images
      /\.(pdf|doc|docx|xls|xlsx|ppt|pptx)$/i,   // Documents
      /\.(zip|rar|tar|gz|7z)$/i,                // Archives
      /\.(mp4|avi|mov|wmv|mp3|wav)$/i,          // Media
      /\.(css|js|xml|json)$/i                   // Technical files
    ];

    if (excludedExtensions.some(pattern => pattern.test(url))) {
      return false;
    }

    // Exclude administrative and system paths
    const excludedPaths = [
      /\/(admin|login|api|feed|rss)/i,
      /\/(wp-admin|wp-login|wp-json)/i,  // WordPress specific
      /\/(user|account|profile|settings)/i,
      /\/(cart|checkout|payment)/i,
      /\/(search|filter)\?/i
    ];

    if (excludedPaths.some(pattern => pattern.test(url))) {
      return false;
    }

    // Exclude URLs with tracking parameters or fragments
    if (/#/.test(url) || /[?&]utm_/.test(url)) {
      return false;
    }

    // Exclude very long URLs (likely dynamic/generated)
    if (url.length > 200) {
      return false;
    }

    return true;
  }

  /**
   * Calculate URL priority for crawl ordering
   * 
   * AI INSTRUCTIONS:
   * - Assign priority based on content value indicators
   * - Consider depth and URL structure for prioritization
   * - Support efficient crawl scheduling and resource allocation
   * - Enable priority-based crawl optimization
   */
  calculateUrlPriority(url: string, depth: number): 'high' | 'medium' | 'low' {
    // High priority for shallow, content-rich pages
    if (depth === 0) return 'high';
    
    // High priority for content pages
    const highValuePatterns = [
      /\/(about|services|products|solutions)/i,
      /\/(blog|articles|news|resources)/i,
      /\/(help|support|faq|documentation)/i
    ];

    if (highValuePatterns.some(pattern => pattern.test(url))) {
      return depth <= 1 ? 'high' : 'medium';
    }

    // Medium priority for navigation and category pages
    const mediumValuePatterns = [
      /\/(category|section|topic)/i,
      /\/[a-zA-Z-]+\/$/, // Clean category-like URLs
      /\/(contact|location|team)/i
    ];

    if (mediumValuePatterns.some(pattern => pattern.test(url))) {
      return depth <= 2 ? 'medium' : 'low';
    }

    // Default priority based on depth
    if (depth <= 1) return 'medium';
    if (depth <= 3) return 'low';
    return 'low';
  }

  /**
   * Estimate value of URL for crawl planning
   * 
   * AI INSTRUCTIONS:
   * - Calculate estimated content value (0-1 scale)
   * - Consider URL structure and content indicators
   * - Support value-based crawl prioritization
   * - Enable ROI optimization for crawl resources
   */
  estimateUrlValue(url: string, depth: number): number {
    let value = 0.5; // Base value

    // Depth penalty (deeper = generally less valuable)
    value -= depth * 0.1;

    // URL structure bonuses
    if (/\/(about|services|products)/.test(url)) value += 0.3;
    if (/\/(blog|articles|news)/.test(url)) value += 0.2;
    if (/\/(help|support|faq)/.test(url)) value += 0.2;
    if (/\/(contact|team)/.test(url)) value += 0.1;

    // Clean URL structure bonus
    const pathSegments = new URL(url).pathname.split('/').filter(Boolean);
    if (pathSegments.length <= 3 && pathSegments.every(seg => !/\d/.test(seg))) {
      value += 0.1; // Bonus for clean, non-dynamic URLs
    }

    // URL length penalty for very long URLs
    if (url.length > 100) {
      value -= 0.1;
    }

    // Ensure value is within valid range
    return Math.max(0.1, Math.min(1.0, value));
  }

  /**
   * Check if subdomain crawling should be allowed
   * 
   * AI INSTRUCTIONS:
   * - Control subdomain crawling policy
   * - Support configuration of domain scope
   * - Enable flexible domain boundary policies
   * - Default to conservative same-domain only
   */
  private shouldAllowSubdomains(): boolean {
    return false; // Conservative default - same domain only
  }

  /**
   * Get URLs that should be prioritized for crawling
   * 
   * AI INSTRUCTIONS:
   * - Identify high-value URL patterns for prioritization
   * - Support efficient crawl ordering and resource allocation
   * - Enable content discovery optimization
   * - Provide crawl strategy guidance
   */
  getPriorityUrlPatterns(): string[] {
    return [
      '/about',
      '/services',
      '/products',
      '/blog',
      '/help',
      '/faq',
      '/support',
      '/documentation'
    ];
  }
}