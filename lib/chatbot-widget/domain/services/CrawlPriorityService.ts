/**
 * Crawl Priority Service
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Priority and value calculation for crawling
 * - Keep priority logic pure and deterministic
 * - Never exceed 250 lines per @golden-rule
 * - Handle business rules for crawl ordering decisions
 * - Support configurable priority strategies
 */

/** Domain model for crawl priority assessment */
export interface CrawlPriorityAssessment {
  readonly priority: 'high' | 'medium' | 'low';
  readonly estimatedValue: number;
  readonly reason: string;
}

/**
 * Specialized Service for Crawl Priority and Value Calculation
 * 
 * AI INSTRUCTIONS:
 * - Handle priority calculation for crawl ordering
 * - Apply business rules for value estimation
 * - Support depth-based priority adjustments
 * - Enable URL pattern-based priority assignment
 * - Provide clear reasoning for priority decisions
 */
export class CrawlPriorityService {

  /** Calculate comprehensive priority assessment for URL */
  assessCrawlPriority(url: string, depth: number): CrawlPriorityAssessment {
    const priority = this.calculateUrlPriority(url, depth);
    const estimatedValue = this.estimateUrlValue(url, depth);
    const reason = this.getPriorityReason(url, depth, priority);

    return {
      priority,
      estimatedValue,
      reason
    };
  }

  /** Calculate URL priority for crawl ordering */
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

  /** Estimate value of URL for crawl planning */
  estimateUrlValue(url: string, depth: number): number {
    let value = 0.5; // Base value

    // Depth penalty (deeper = generally less valuable)
    value -= depth * 0.1;

    // URL structure bonuses
    value += this.calculateStructureBonus(url);

    // Clean URL structure bonus
    if (this.hasCleanUrlStructure(url)) {
      value += 0.1;
    }

    // URL length penalty for very long URLs
    if (url.length > 100) {
      value -= 0.1;
    }

    // Ensure value is within valid range
    return Math.max(0.1, Math.min(1.0, value));
  }

  /** Get priority URL patterns for crawling focus */
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

  /** Calculate structure-based value bonus */
  private calculateStructureBonus(url: string): number {
    let bonus = 0;

    // URL structure bonuses
    if (/\/(about|services|products)/.test(url)) bonus += 0.3;
    if (/\/(blog|articles|news)/.test(url)) bonus += 0.2;
    if (/\/(help|support|faq)/.test(url)) bonus += 0.2;
    if (/\/(contact|team)/.test(url)) bonus += 0.1;

    return bonus;
  }

  /** Check if URL has clean structure for bonus value */
  private hasCleanUrlStructure(url: string): boolean {
    try {
      const pathSegments = new URL(url).pathname.split('/').filter(Boolean);
      return pathSegments.length <= 3 && pathSegments.every(seg => !/\d/.test(seg));
    } catch {
      return false;
    }
  }

  /** Generate human-readable reason for priority assignment */
  private getPriorityReason(url: string, depth: number, priority: 'high' | 'medium' | 'low'): string {
    if (depth === 0) {
      return 'Root page - highest priority';
    }

    if (priority === 'high') {
      return `High-value content page at depth ${depth}`;
    }

    if (priority === 'medium') {
      if (depth <= 2) {
        return `Navigation or category page at shallow depth ${depth}`;
      }
      return `Standard content page at depth ${depth}`;
    }

    return `Lower priority due to depth ${depth} or content type`;
  }

  /** Check if URL matches high-priority patterns */
  isHighPriorityUrl(url: string): boolean {
    const highPriorityPatterns = [
      /\/(about|services|products|solutions)/i,
      /\/(contact|get-started|demo)/i,
      /\/(pricing|plans|packages)/i
    ];

    return highPriorityPatterns.some(pattern => pattern.test(url));
  }

  /** Check if URL should be crawled early in the process */
  shouldCrawlEarly(url: string, depth: number): boolean {
    return depth <= 1 || this.isHighPriorityUrl(url);
  }
}