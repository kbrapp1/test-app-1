/**
 * CrawlStrategyService Tests
 * 
 * Critical domain logic tests for crawling strategy and prioritization
 * Tests sophisticated business rules for lead-generation focused crawling
 */

import { describe, it, expect } from 'vitest';
import { CrawlStrategyService, CrawlStrategy, CrawlPriorityResult } from '../CrawlStrategyService';
import { WebsiteCrawlSettings } from '../../value-objects/ai-configuration/KnowledgeBase';

describe('CrawlStrategyService', () => {
  let service: CrawlStrategyService;

  const createMockCrawlSettings = (overrides: Partial<WebsiteCrawlSettings> = {}): WebsiteCrawlSettings => ({
    maxPages: 50,
    maxDepth: 3,
    includePatterns: [],
    excludePatterns: [],
    respectRobotsTxt: true,
    crawlFrequency: 'manual',
    includeImages: false,
    includePDFs: true,
    ...overrides
  });

  beforeEach(() => {
    service = new CrawlStrategyService();
  });

  describe('determineCrawlStrategy', () => {
    it('should use sitemap-first strategy for small crawls (≤10 pages)', () => {
      const settings = createMockCrawlSettings({ maxPages: 5 });
      
      const strategy = service.determineCrawlStrategy(settings);
      
      expect(strategy).toEqual({
        type: 'sitemap-first',
        prioritizeSitemaps: true,
        maxConcurrency: 2,
        retryPolicy: {
          maxRetries: 2,
          backoffMultiplier: 1.5
        }
      });
    });

    it('should use sitemap-first strategy for exactly 10 pages', () => {
      const settings = createMockCrawlSettings({ maxPages: 10 });
      
      const strategy = service.determineCrawlStrategy(settings);
      
      expect(strategy.type).toBe('sitemap-first');
      expect(strategy.prioritizeSitemaps).toBe(true);
      expect(strategy.maxConcurrency).toBe(2);
    });

    it('should use hybrid strategy for medium crawls (11-50 pages)', () => {
      const settings = createMockCrawlSettings({ maxPages: 25 });
      
      const strategy = service.determineCrawlStrategy(settings);
      
      expect(strategy).toEqual({
        type: 'hybrid',
        prioritizeSitemaps: true,
        maxConcurrency: 3,
        retryPolicy: {
          maxRetries: 3,
          backoffMultiplier: 2.0
        }
      });
    });

    it('should use hybrid strategy for exactly 50 pages', () => {
      const settings = createMockCrawlSettings({ maxPages: 50 });
      
      const strategy = service.determineCrawlStrategy(settings);
      
      expect(strategy.type).toBe('hybrid');
      expect(strategy.prioritizeSitemaps).toBe(true);
      expect(strategy.maxConcurrency).toBe(3);
    });

    it('should use breadth-first strategy for large crawls (>50 pages)', () => {
      const settings = createMockCrawlSettings({ maxPages: 100 });
      
      const strategy = service.determineCrawlStrategy(settings);
      
      expect(strategy).toEqual({
        type: 'breadth-first',
        prioritizeSitemaps: false, // Don't rely solely on sitemaps for large crawls
        maxConcurrency: 5,
        retryPolicy: {
          maxRetries: 2,
          backoffMultiplier: 1.8
        }
      });
    });

    it('should handle very large crawls appropriately', () => {
      const settings = createMockCrawlSettings({ maxPages: 1000 });
      
      const strategy = service.determineCrawlStrategy(settings);
      
      expect(strategy.type).toBe('breadth-first');
      expect(strategy.prioritizeSitemaps).toBe(false);
      expect(strategy.maxConcurrency).toBe(5);
    });

    it('should handle edge case with zero pages', () => {
      const settings = createMockCrawlSettings({ maxPages: 0 });
      
      const strategy = service.determineCrawlStrategy(settings);
      
      expect(strategy.type).toBe('sitemap-first'); // Falls into ≤10 pages category
      expect(strategy.maxConcurrency).toBe(2);
    });
  });

  describe('calculateUrlPriority', () => {
    const settings = createMockCrawlSettings({ maxDepth: 3 });

    it('should calculate base priority correctly', () => {
      const result = service.calculateUrlPriority(
        'https://example.com/page',
        0,
        'discovered',
        settings
      );

      expect(result.priority).toBe(100); // Base priority with no bonuses/penalties
      expect(result.reasoning).toBe('Base priority, depth penalty (-0)');
      expect(result.shouldCrawl).toBe(true);
    });

    it('should add sitemap bonus for sitemap sources', () => {
      const result = service.calculateUrlPriority(
        'https://example.com/page',
        0,
        'sitemap',
        settings
      );

      expect(result.priority).toBe(150); // Base 100 + sitemap bonus 50
      expect(result.reasoning).toContain('sitemap source (+50)');
      expect(result.shouldCrawl).toBe(true);
    });

    it('should apply depth penalty correctly', () => {
      const result = service.calculateUrlPriority(
        'https://example.com/deep/nested/page',
        2,
        'discovered',
        settings
      );

      expect(result.priority).toBe(80); // Base 100 - depth penalty (2 * 10)
      expect(result.reasoning).toContain('depth penalty (-20)');
      expect(result.shouldCrawl).toBe(true);
    });

    it('should combine sitemap bonus and depth penalty', () => {
      const result = service.calculateUrlPriority(
        'https://example.com/deep/page',
        1,
        'sitemap',
        settings
      );

      expect(result.priority).toBe(140); // Base 100 + sitemap 50 - depth 10
      expect(result.reasoning).toContain('sitemap source (+50)');
      expect(result.reasoning).toContain('depth penalty (-10)');
    });

    it('should identify and bonus high-value URLs', () => {
      const highValueUrls = [
        'https://example.com/about',
        'https://example.com/services',
        'https://example.com/products',
        'https://example.com/solutions',
        'https://example.com/contact',
        'https://example.com/pricing',
        'https://example.com/demo',
        'https://example.com/trial',
        'https://example.com/resources',
        'https://example.com/case-studies',
        'https://example.com/testimonials',
        'https://example.com/industries',
        'https://example.com/features',
        'https://example.com/benefits'
      ];

      highValueUrls.forEach(url => {
        const result = service.calculateUrlPriority(url, 0, 'discovered', settings);
        
        expect(result.priority).toBe(130); // Base 100 + high-value bonus 30
        expect(result.reasoning).toContain('high-value URL pattern (+30)');
      });
    });

    it('should exclude low-value URLs from high-value bonus', () => {
      const lowValueUrls = [
        'https://example.com/blog/post',
        'https://example.com/news/article',
        'https://example.com/press/release',
        'https://example.com/events/conference',
        'https://example.com/privacy',
        'https://example.com/terms',
        'https://example.com/legal/notice',
        'https://example.com/sitemap.xml',
        'https://example.com/search?q=test',
        'https://example.com/category/tech',
        'https://example.com/tag/ai',
        'https://example.com/author/john'
      ];

      lowValueUrls.forEach(url => {
        const result = service.calculateUrlPriority(url, 0, 'discovered', settings);
        
        expect(result.priority).toBe(100); // Only base priority, no high-value bonus
        expect(result.reasoning).not.toContain('high-value URL pattern');
      });
    });

    it('should respect maximum depth constraint', () => {
      const result = service.calculateUrlPriority(
        'https://example.com/very/deep/nested/page',
        4, // Exceeds maxDepth of 3
        'discovered',
        settings
      );

      expect(result.shouldCrawl).toBe(false);
      expect(result.reasoning).toContain('exceeds max depth');
      expect(result.priority).toBe(60); // Base 100 - depth penalty 40, but still calculated
    });

    it('should handle boundary case at maximum depth', () => {
      const result = service.calculateUrlPriority(
        'https://example.com/at/max/depth',
        3, // Exactly at maxDepth
        'discovered',
        settings
      );

      expect(result.shouldCrawl).toBe(true);
      expect(result.priority).toBe(70); // Base 100 - depth penalty 30
    });

    it('should prevent negative priorities', () => {
      const result = service.calculateUrlPriority(
        'https://example.com/extremely/deep/nested/path/beyond/reasonable/depth',
        15, // Very deep
        'discovered',
        settings
      );

      expect(result.priority).toBe(0); // Math.max(0, negative_value) = 0
      expect(result.shouldCrawl).toBe(false);
    });

    it('should handle complex URL with all bonuses and penalties', () => {
      const result = service.calculateUrlPriority(
        'https://example.com/products/enterprise', // High-value URL
        1, // Some depth
        'sitemap', // Sitemap source
        settings
      );

      expect(result.priority).toBe(170); // Base 100 + sitemap 50 + high-value 30 - depth 10
      expect(result.reasoning).toContain('sitemap source (+50)');
      expect(result.reasoning).toContain('high-value URL pattern (+30)');
      expect(result.reasoning).toContain('depth penalty (-10)');
      expect(result.shouldCrawl).toBe(true);
    });

    it('should handle manual source type', () => {
      const result = service.calculateUrlPriority(
        'https://example.com/manual-page',
        0,
        'manual',
        settings
      );

      expect(result.priority).toBe(100); // Only base priority, no sitemap bonus
      expect(result.reasoning).toBe('Base priority, depth penalty (-0)');
    });

    it('should be case-insensitive for URL pattern matching', () => {
      const upperCaseUrl = 'https://example.com/ABOUT';
      const lowerCaseUrl = 'https://example.com/about';

      const upperResult = service.calculateUrlPriority(upperCaseUrl, 0, 'discovered', settings);
      const lowerResult = service.calculateUrlPriority(lowerCaseUrl, 0, 'discovered', settings);

      expect(upperResult.priority).toBe(lowerResult.priority);
      expect(upperResult.reasoning).toContain('high-value URL pattern (+30)');
      expect(lowerResult.reasoning).toContain('high-value URL pattern (+30)');
    });
  });

  describe('calculateOptimalQueueSize', () => {
    it('should calculate base queue size from strategy concurrency', () => {
      const strategy: CrawlStrategy = {
        type: 'sitemap-first',
        prioritizeSitemaps: true,
        maxConcurrency: 2,
        retryPolicy: { maxRetries: 2, backoffMultiplier: 1.5 }
      };

      const queueSize = service.calculateOptimalQueueSize(10, strategy);

      expect(queueSize).toBe(20); // maxConcurrency (2) * 10 * scaleFactor (1)
    });

    it('should scale queue size with total pages', () => {
      const strategy: CrawlStrategy = {
        type: 'breadth-first',
        prioritizeSitemaps: false,
        maxConcurrency: 5,
        retryPolicy: { maxRetries: 2, backoffMultiplier: 1.8 }
      };

      const smallCrawl = service.calculateOptimalQueueSize(10, strategy);
      const largeCrawl = service.calculateOptimalQueueSize(50, strategy);

      expect(largeCrawl).toBeGreaterThan(smallCrawl);
    });

    it('should cap scale factor at maximum value', () => {
      const strategy: CrawlStrategy = {
        type: 'breadth-first',
        prioritizeSitemaps: false,
        maxConcurrency: 3,
        retryPolicy: { maxRetries: 2, backoffMultiplier: 1.8 }
      };

      const veryLargeCrawl = service.calculateOptimalQueueSize(1000, strategy);
      const maxScaledCrawl = service.calculateOptimalQueueSize(50, strategy); // 50/10 = 5 scale factor (max)

      expect(veryLargeCrawl).toBe(maxScaledCrawl); // Both should hit the 5x scale factor cap
    });

    it('should respect memory constraints when provided', () => {
      const strategy: CrawlStrategy = {
        type: 'hybrid',
        prioritizeSitemaps: true,
        maxConcurrency: 4,
        retryPolicy: { maxRetries: 3, backoffMultiplier: 2.0 }
      };

      const availableMemory = 64 * 1024 * 1024; // 64MB in bytes
      const queueSize = service.calculateOptimalQueueSize(100, strategy, availableMemory);

      // Memory limit: 64MB / 1024 / 1024 = 64MB, conservative estimate = 64/2 = 32
      expect(queueSize).toBeLessThanOrEqual(32);
    });

    it('should enforce minimum queue size', () => {
      const strategy: CrawlStrategy = {
        type: 'sitemap-first',
        prioritizeSitemaps: true,
        maxConcurrency: 1, // Very low concurrency
        retryPolicy: { maxRetries: 1, backoffMultiplier: 1.0 }
      };

      const queueSize = service.calculateOptimalQueueSize(1, strategy);

      expect(queueSize).toBeGreaterThanOrEqual(5); // Minimum queue size
    });

    it('should enforce maximum queue size', () => {
      const strategy: CrawlStrategy = {
        type: 'breadth-first',
        prioritizeSitemaps: false,
        maxConcurrency: 10, // High concurrency
        retryPolicy: { maxRetries: 3, backoffMultiplier: 2.0 }
      };

      const queueSize = service.calculateOptimalQueueSize(1000, strategy);

      expect(queueSize).toBeLessThanOrEqual(100); // Maximum queue size
    });

    it('should handle very low memory constraints', () => {
      const strategy: CrawlStrategy = {
        type: 'hybrid',
        prioritizeSitemaps: true,
        maxConcurrency: 5,
        retryPolicy: { maxRetries: 2, backoffMultiplier: 1.5 }
      };

      const lowMemory = 1024 * 1024; // 1MB in bytes
      const queueSize = service.calculateOptimalQueueSize(100, strategy, lowMemory);

      expect(queueSize).toBe(5); // Should hit minimum due to memory constraint
    });

    it('should handle zero available memory gracefully', () => {
      const strategy: CrawlStrategy = {
        type: 'sitemap-first',
        prioritizeSitemaps: true,
        maxConcurrency: 2,
        retryPolicy: { maxRetries: 2, backoffMultiplier: 1.5 }
      };

      const queueSize = service.calculateOptimalQueueSize(10, strategy, 0);

      // The base calculation would be: maxConcurrency (2) * 10 * scaleFactor (1) = 20
      // With zero memory: availableMemory is falsy, so memory constraint is ignored
      // Result: Math.max(5, Math.min(20, 100)) = 20
      expect(queueSize).toBe(20); // Memory constraint ignored when availableMemory is 0
    });

    it('should prefer memory constraint over calculated size when more restrictive', () => {
      const strategy: CrawlStrategy = {
        type: 'breadth-first',
        prioritizeSitemaps: false,
        maxConcurrency: 5,
        retryPolicy: { maxRetries: 2, backoffMultiplier: 1.8 }
      };

      // Large crawl that would normally get high queue size
      const withoutMemoryLimit = service.calculateOptimalQueueSize(100, strategy);
      const withMemoryLimit = service.calculateOptimalQueueSize(100, strategy, 8 * 1024 * 1024); // 8MB

      expect(withMemoryLimit).toBeLessThan(withoutMemoryLimit);
    });
  });

  describe('Domain Business Rules Integration', () => {
    it('should optimize for lead generation with high-value URL prioritization', () => {
      const settings = createMockCrawlSettings();
      
      const leadGenUrls = [
        'https://example.com/pricing',
        'https://example.com/demo',
        'https://example.com/contact',
        'https://example.com/trial'
      ];

      const blogUrls = [
        'https://example.com/blog/article-1',
        'https://example.com/news/update',
        'https://example.com/press/release'
      ];

      leadGenUrls.forEach(url => {
        const result = service.calculateUrlPriority(url, 0, 'discovered', settings);
        expect(result.priority).toBeGreaterThan(100); // Should have high-value bonus
      });

      blogUrls.forEach(url => {
        const result = service.calculateUrlPriority(url, 0, 'discovered', settings);
        expect(result.priority).toBe(100); // Should only have base priority
      });
    });

    it('should balance crawl efficiency with comprehensiveness', () => {
      // Small crawl: prioritize efficiency (sitemap-first)
      const smallSettings = createMockCrawlSettings({ maxPages: 5 });
      const smallStrategy = service.determineCrawlStrategy(smallSettings);
      expect(smallStrategy.prioritizeSitemaps).toBe(true);
      expect(smallStrategy.maxConcurrency).toBe(2); // Conservative

      // Large crawl: prioritize comprehensiveness (breadth-first)
      const largeSettings = createMockCrawlSettings({ maxPages: 200 });
      const largeStrategy = service.determineCrawlStrategy(largeSettings);
      expect(largeStrategy.prioritizeSitemaps).toBe(false); // Don't rely solely on sitemaps
      expect(largeStrategy.maxConcurrency).toBe(5); // More aggressive
    });

    it('should ensure resource-aware queue sizing', () => {
      const strategy: CrawlStrategy = {
        type: 'hybrid',
        prioritizeSitemaps: true,
        maxConcurrency: 3,
        retryPolicy: { maxRetries: 3, backoffMultiplier: 2.0 }
      };

      // Test progression of queue sizes with different total pages
      const queueSize10 = service.calculateOptimalQueueSize(10, strategy);
      const queueSize50 = service.calculateOptimalQueueSize(50, strategy);
      const queueSize100 = service.calculateOptimalQueueSize(100, strategy);

      expect(queueSize50).toBeGreaterThan(queueSize10);
      expect(queueSize100).toBeGreaterThanOrEqual(queueSize50); // May cap due to scale factor limit
    });

    it('should maintain reasonable bounds across all operations', () => {
      const settings = createMockCrawlSettings({ maxDepth: 5 });

      // Test priority bounds
      const maxPriorityResult = service.calculateUrlPriority(
        'https://example.com/pricing', // High-value
        0, // No depth penalty
        'sitemap', // Sitemap bonus
        settings
      );
      expect(maxPriorityResult.priority).toBeLessThanOrEqual(200); // Reasonable upper bound

      // Test queue size bounds
      const strategies: CrawlStrategy[] = [
        { type: 'sitemap-first', prioritizeSitemaps: true, maxConcurrency: 1, retryPolicy: { maxRetries: 1, backoffMultiplier: 1.0 } },
        { type: 'breadth-first', prioritizeSitemaps: false, maxConcurrency: 10, retryPolicy: { maxRetries: 5, backoffMultiplier: 3.0 } }
      ];

      strategies.forEach(strategy => {
        const queueSize = service.calculateOptimalQueueSize(1000, strategy);
        expect(queueSize).toBeGreaterThanOrEqual(5);
        expect(queueSize).toBeLessThanOrEqual(100);
      });
    });

    it('should handle edge cases gracefully', () => {
      const edgeCaseSettings = createMockCrawlSettings({ 
        maxPages: 0, 
        maxDepth: 0 
      });

      // Should still provide valid strategy
      const strategy = service.determineCrawlStrategy(edgeCaseSettings);
      expect(strategy.type).toBeDefined();
      expect(strategy.maxConcurrency).toBeGreaterThan(0);

      // Should handle zero depth gracefully
      const result = service.calculateUrlPriority(
        'https://example.com/test',
        1, // Exceeds maxDepth of 0
        'discovered',
        edgeCaseSettings
      );
      expect(result.shouldCrawl).toBe(false);
      expect(result.priority).toBeGreaterThanOrEqual(0);
    });
  });
});