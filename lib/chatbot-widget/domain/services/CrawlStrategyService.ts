/**
 * Crawl Strategy Domain Service
 * 
 * Pure domain logic for crawling strategy and prioritization.
 * Contains business rules for efficient lead-generation focused crawling.
 */

import { WebsiteCrawlSettings } from '../value-objects/ai-configuration/KnowledgeBase';

/**
 * Crawl execution strategy based on domain rules
 */
export interface CrawlStrategy {
  readonly type: 'sitemap-first' | 'breadth-first' | 'hybrid';
  readonly prioritizeSitemaps: boolean;
  readonly maxConcurrency: number;
  readonly retryPolicy: {
    readonly maxRetries: number;
    readonly backoffMultiplier: number;
  };
}

/**
 * URL prioritization result for crawl queue management
 */
export interface CrawlPriorityResult {
  readonly url: string;
  readonly priority: number;
  readonly reasoning: string;
  readonly shouldCrawl: boolean;
}

/**
 * Domain service for crawling strategy and prioritization
 * Contains business logic for optimal crawling approach
 */
export class CrawlStrategyService {
  
  /**
   * Determine optimal crawl strategy based on settings and domain rules
   * Business logic: optimize for lead generation value
   */
  public determineCrawlStrategy(settings: WebsiteCrawlSettings): CrawlStrategy {
    // Domain rule: For small crawls, prioritize sitemaps for efficiency
    if (settings.maxPages <= 10) {
      return {
        type: 'sitemap-first',
        prioritizeSitemaps: true,
        maxConcurrency: 2,
        retryPolicy: {
          maxRetries: 2,
          backoffMultiplier: 1.5
        }
      };
    }
    
    // Domain rule: For medium crawls, use hybrid approach
    if (settings.maxPages <= 50) {
      return {
        type: 'hybrid',
        prioritizeSitemaps: true,
        maxConcurrency: 3,
        retryPolicy: {
          maxRetries: 3,
          backoffMultiplier: 2.0
        }
      };
    }
    
    // Domain rule: For large crawls, use breadth-first with sitemap boost
    return {
      type: 'breadth-first',
      prioritizeSitemaps: false, // Don't rely solely on sitemaps
      maxConcurrency: 5,
      retryPolicy: {
        maxRetries: 2,
        backoffMultiplier: 1.8
      }
    };
  }
  
  /**
   * Calculate URL priority for crawl queue ordering
   * Business logic: prioritize URLs with highest lead generation potential
   */
  public calculateUrlPriority(
    url: string,
    depth: number,
    source: 'sitemap' | 'discovered' | 'manual',
    settings: WebsiteCrawlSettings
  ): CrawlPriorityResult {
    let priority = 100; // Base priority
    let reasoning = 'Base priority';
    
    // Domain rule: Sitemap URLs are higher quality
    if (source === 'sitemap') {
      priority += 50;
      reasoning += ', sitemap source (+50)';
    }
    
    // Domain rule: Shallow pages are more important
    const depthPenalty = depth * 10;
    priority -= depthPenalty;
    reasoning += `, depth penalty (-${depthPenalty})`;
    
    // Domain rule: Certain URL patterns indicate high-value content
    if (this.isHighValueUrl(url)) {
      priority += 30;
      reasoning += ', high-value URL pattern (+30)';
    }
    
    // Domain rule: Respect maximum depth
    const shouldCrawl = depth <= settings.maxDepth;
    if (!shouldCrawl) {
      reasoning += ', exceeds max depth';
    }
    
    return {
      url,
      priority: Math.max(0, priority),
      reasoning,
      shouldCrawl
    };
  }
  
  /**
   * Determine if URL pattern indicates high lead generation value
   * Business logic: identify content types most valuable for lead capture
   */
  private isHighValueUrl(url: string): boolean {
    const highValuePatterns = [
      '/about', '/services', '/products', '/solutions',
      '/contact', '/pricing', '/demo', '/trial',
      '/resources', '/case-studies', '/testimonials',
      '/industries', '/features', '/benefits'
    ];
    
    const lowValuePatterns = [
      '/blog/', '/news/', '/press/', '/events/',
      '/privacy', '/terms', '/legal', '/sitemap',
      '/search', '/category/', '/tag/', '/author/'
    ];
    
    const urlLower = url.toLowerCase();
    
    // Check for low-value patterns first (exclusions)
    if (lowValuePatterns.some(pattern => urlLower.includes(pattern))) {
      return false;
    }
    
    // Check for high-value patterns
    return highValuePatterns.some(pattern => urlLower.includes(pattern));
  }
  
  /**
   * Calculate optimal crawl queue size based on domain constraints
   * Business logic: balance crawl speed with resource usage
   */
  public calculateOptimalQueueSize(
    totalPagesToCrawl: number,
    strategy: CrawlStrategy,
    availableMemory?: number
  ): number {
    // Domain rule: Base queue size on crawl strategy
    let baseQueueSize = strategy.maxConcurrency * 10;
    
    // Domain rule: Scale with total pages but cap for memory efficiency
    const scaleFactor = Math.min(totalPagesToCrawl / 10, 5);
    baseQueueSize = Math.floor(baseQueueSize * scaleFactor);
    
    // Domain rule: Memory constraint (if available)
    if (availableMemory) {
      const memoryLimit = Math.floor(availableMemory / 1024 / 1024); // Convert to MB
      const maxQueueForMemory = Math.floor(memoryLimit / 2); // Conservative estimate
      baseQueueSize = Math.min(baseQueueSize, maxQueueForMemory);
    }
    
    // Domain rule: Reasonable bounds
    return Math.max(5, Math.min(baseQueueSize, 100));
  }
}