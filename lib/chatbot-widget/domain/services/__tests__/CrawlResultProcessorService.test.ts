/**
 * CrawlResultProcessorService Tests
 * 
 * AI INSTRUCTIONS:
 * - Test crawl result processing and transformation
 * - Test quality filtering criteria
 * - Test metrics calculation accuracy
 * - Test knowledge item generation
 * - Test relevance scoring logic
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CrawlResultProcessorService } from '../CrawlResultProcessorService';
import { CrawledPageData } from '../WebsiteCrawlingDomainService';
import { KnowledgeItem } from '../../services/interfaces/IKnowledgeRetrievalService';

describe('CrawlResultProcessorService', () => {
  let service: CrawlResultProcessorService;
  let mockCrawledPages: CrawledPageData[];

  beforeEach(() => {
    service = new CrawlResultProcessorService();
    mockCrawledPages = [
      {
        url: 'https://example.com/page1',
        title: 'Page 1 Title',
        content: 'This is quality content with sufficient length and meaningful text content.',
        depth: 1,
        crawledAt: new Date('2024-01-01'),
        status: 'success',
        responseTime: 500,
        statusCode: 200
      },
      {
        url: 'https://example.com/page2',
        title: 'Page 2 Title',
        content: 'This is another piece of quality content that meets the minimum length requirements for processing but not as comprehensive as page 1.',
        depth: 2,
        crawledAt: new Date('2024-01-02'),
        status: 'success',
        responseTime: 300,
        statusCode: 200
      },
      {
        url: 'https://example.com/page3',
        title: 'Page 3 Title',
        content: 'This is another quality content page with sufficient length and good content.',
        depth: 1,
        crawledAt: new Date('2024-01-03'),
        status: 'failed',
        errorMessage: 'Connection timeout',
        statusCode: 408
      },
      {
        url: 'https://example.com/page4',
        title: '',
        content: 'Content without title should be filtered out even if long enough and meets other criteria.',
        depth: 1,
        crawledAt: new Date('2024-01-04'),
        status: 'success',
        responseTime: 400,
        statusCode: 200
      }
    ];
  });

  describe('processComprehensively', () => {
    it('should process crawl results with quality filtering', () => {
      const result = service.processComprehensively(mockCrawledPages);

      expect(result).toMatchObject({
        knowledgeItems: expect.any(Array),
        crawledPages: expect.any(Array),
        totalPagesAttempted: 4,
        successfulPages: 3,
        failedPages: 1,
        skippedPages: 0
      });
    });

    it('should filter out low-quality pages', () => {
      const result = service.processComprehensively(mockCrawledPages);

      // Should only include high-quality pages
      expect(result.crawledPages.length).toBeLessThan(mockCrawledPages.length);
      expect(result.crawledPages.every(page => page.status === 'success')).toBe(true);
    });

    it('should generate knowledge items from quality pages', () => {
      const result = service.processComprehensively(mockCrawledPages);

      expect(result.knowledgeItems.length).toBeGreaterThan(0); // Some pages meet quality criteria
      // Check that we have quality knowledge items - pages 1 and 2 meet criteria
      const sources = result.knowledgeItems.map(item => item.source);
      expect(sources).toContain('https://example.com/page2');
    });
    it('should handle empty input gracefully', () => {
      const result = service.processComprehensively([]);

      expect(result).toEqual({
        knowledgeItems: [],
        crawledPages: [],
        totalPagesAttempted: 0,
        successfulPages: 0,
        failedPages: 0,
        skippedPages: 0
      });
    });
  });

  describe('filterQualityContent', () => {
    it('should filter out failed pages', () => {
      const filtered = service.filterQualityContent(mockCrawledPages);
      
      expect(filtered.every(page => page.status === 'success')).toBe(true);
    });

    it('should filter out pages with insufficient content', () => {
      const filtered = service.filterQualityContent(mockCrawledPages);
      
      expect(filtered.every(page => page.content.length >= 100)).toBe(true);
    });

    it('should filter out pages without titles', () => {
      const filtered = service.filterQualityContent(mockCrawledPages);
      
      expect(filtered.every(page => page.title && page.title.trim().length > 0)).toBe(true);
    });

    it('should filter out pages with mostly markup', () => {
      const markupHeavyPage: CrawledPageData = {
        url: 'https://example.com/markup',
        title: 'Markup Heavy Page',
        content: '<div><span><p></p></span></div>'.repeat(20) + 'Little actual content',
        depth: 1,
        crawledAt: new Date(),
        status: 'success'
      };

      const filtered = service.filterQualityContent([markupHeavyPage]);
      
      expect(filtered).toHaveLength(0);
    });

    it('should accept pages with good content-to-markup ratio', () => {
      const goodPage: CrawledPageData = {
        url: 'https://example.com/good',
        title: 'Good Content Page',
        content: '<h1>Title</h1><p>This is a page with good content and reasonable markup usage. The content is meaningful and provides value to users.</p>',
        depth: 1,
        crawledAt: new Date(),
        status: 'success'
      };

      const filtered = service.filterQualityContent([goodPage]);
      
      expect(filtered).toHaveLength(1);
    });
  });

  describe('calculateDetailedMetrics', () => {
    it('should calculate accurate page counts', () => {
      const metrics = service.calculateDetailedMetrics(mockCrawledPages);

      expect(metrics.totalPages).toBe(4);
      expect(metrics.successfulPages).toBe(3);
      expect(metrics.failedPages).toBe(1);
      expect(metrics.skippedPages).toBe(0);
    });

    it('should calculate average response time correctly', () => {
      const metrics = service.calculateDetailedMetrics(mockCrawledPages);

      // Average of 500, 300, 400 (failed page excluded)
      expect(metrics.averageResponseTime).toBe(400);
    });

    it('should calculate success rate correctly', () => {
      const metrics = service.calculateDetailedMetrics(mockCrawledPages);

      expect(metrics.successRate).toBe(75); // 3 out of 4 successful
    });

    it('should calculate quality score', () => {
      const metrics = service.calculateDetailedMetrics(mockCrawledPages);

      expect(metrics.qualityScore).toBeGreaterThan(0);
      expect(metrics.qualityScore).toBeLessThanOrEqual(100);
    });

    it('should handle pages without response times', () => {
      const pagesWithoutTimes = mockCrawledPages.map(page => ({
        ...page,
        responseTime: undefined
      }));

      const metrics = service.calculateDetailedMetrics(pagesWithoutTimes);

      expect(metrics.averageResponseTime).toBe(0);
    });
  });

  describe('generateKnowledgeItems', () => {
    it('should only generate items from successful pages', () => {
      const items = service.generateKnowledgeItems(mockCrawledPages);

      expect(items.length).toBeGreaterThan(0); // At least some pages meet quality criteria
      expect(items[0].source).toBe('https://example.com/page1');
    });

    it('should generate deterministic IDs', () => {
      const items1 = service.generateKnowledgeItems(mockCrawledPages);
      const items2 = service.generateKnowledgeItems(mockCrawledPages);

      expect(items1[0].id).toBe(items2[0].id);
    });

    it('should include path context in titles', () => {
      const pageWithPath: CrawledPageData = {
        url: 'https://example.com/about/team',
        title: 'Our Team',
        content: 'This is quality content about our team with sufficient length and meaningful information.',
        depth: 1,
        crawledAt: new Date(),
        status: 'success'
      };

      const items = service.generateKnowledgeItems([pageWithPath]);

      expect(items[0].title).toContain('Our Team');
      expect(items[0].title).toContain('/about/team');
    });

    it('should calculate relevance scores', () => {
      const items = service.generateKnowledgeItems(mockCrawledPages);

      expect(items[0].relevanceScore).toBeGreaterThan(0);
      expect(items[0].relevanceScore).toBeLessThanOrEqual(1);
    });

    it('should include appropriate tags', () => {
      const items = service.generateKnowledgeItems(mockCrawledPages);

      expect(items[0].tags).toContain('website');
      expect(items[0].tags).toContain('crawled');
      expect(items[0].tags).toContain('depth-1');
    });
  });

  describe('relevance scoring', () => {
    it('should give higher scores to longer content', () => {
      const shortPage: CrawledPageData = {
        url: 'https://example.com/short',
        title: 'Short Page',
        content: 'This is short but valid content for testing purposes.',
        depth: 1,
        crawledAt: new Date(),
        status: 'success'
      };

      const longPage: CrawledPageData = {
        url: 'https://example.com/long',
        title: 'Long Page',
        content: 'This is much longer content that provides more value and information. '.repeat(50),
        depth: 1,
        crawledAt: new Date(),
        status: 'success'
      };

      const shortItems = service.generateKnowledgeItems([shortPage]);
      const longItems = service.generateKnowledgeItems([longPage]);

      expect(longItems[0].relevanceScore).toBeGreaterThan(shortItems[0].relevanceScore);
    });

    it('should penalize deeper pages', () => {
      const shallowPage: CrawledPageData = {
        url: 'https://example.com/shallow',
        title: 'Shallow Page',
        content: 'This is quality content at shallow depth for testing relevance scoring.',
        depth: 1,
        crawledAt: new Date(),
        status: 'success'
      };

      const deepPage: CrawledPageData = {
        url: 'https://example.com/deep',
        title: 'Deep Page',
        content: 'This is quality content at deep depth for testing relevance scoring.',
        depth: 4,
        crawledAt: new Date(),
        status: 'success'
      };

      const shallowItems = service.generateKnowledgeItems([shallowPage]);
      const deepItems = service.generateKnowledgeItems([deepPage]);

      expect(shallowItems[0].relevanceScore).toBeGreaterThan(deepItems[0].relevanceScore);
    });

    it('should give bonus for fast response times', () => {
      const fastPage: CrawledPageData = {
        url: 'https://example.com/fast',
        title: 'Fast Loading Page',
        content: 'This is quality content from a fast loading page for testing relevance scoring.',
        depth: 1,
        crawledAt: new Date(),
        status: 'success',
        responseTime: 200
      };

      const slowPage: CrawledPageData = {
        url: 'https://example.com/slow',
        title: 'Slow Loading Page',
        content: 'This is quality content from a slow loading page for testing relevance scoring.',
        depth: 1,
        crawledAt: new Date(),
        status: 'success',
        responseTime: 2000
      };

      const fastItems = service.generateKnowledgeItems([fastPage]);
      const slowItems = service.generateKnowledgeItems([slowPage]);

      expect(fastItems[0].relevanceScore).toBeGreaterThan(slowItems[0].relevanceScore);
    });

    it('should keep scores within valid range', () => {
      const extremePage: CrawledPageData = {
        url: 'https://example.com/extreme',
        title: 'Extreme Page with Very Long Title That Could Cause Issues',
        content: 'Short content at extreme depth.',
        depth: 10,
        crawledAt: new Date(),
        status: 'success',
        responseTime: 10000
      };

      const items = service.generateKnowledgeItems([extremePage]);

      expect(items[0].relevanceScore).toBeGreaterThanOrEqual(0.1);
      expect(items[0].relevanceScore).toBeLessThanOrEqual(1.0);
    });
  });

  describe('quality assessment', () => {
    it('should accept pages with good content-to-markup ratio', () => {
      const goodPage: CrawledPageData = {
        url: 'https://example.com/good',
        title: 'Good Content',
        content: '<h1>Title</h1><p>This is quality content with good markup ratio and meaningful text that meets the minimum length requirements for content processing and quality assessment.</p>',
        depth: 1,
        crawledAt: new Date(),
        status: 'success'
      };

      const result = service.processComprehensively([goodPage]);

      expect(result.knowledgeItems).toHaveLength(1);
    });

    it('should reject pages with poor content-to-markup ratio', () => {
      const poorPage: CrawledPageData = {
        url: 'https://example.com/poor',
        title: 'Poor Content',
        content: '<div><span><p><strong><em><a href="#"><i><b><u>' + 'x'.repeat(10) + '</u></b></i></a></em></strong></p></span></div>'.repeat(10),
        depth: 1,
        crawledAt: new Date(),
        status: 'success'
      };

      const result = service.processComprehensively([poorPage]);

      expect(result.knowledgeItems).toHaveLength(0);
    });

    it('should calculate quality score based on multiple factors', () => {
      const highQualityPages: CrawledPageData[] = [
        {
          url: 'https://example.com/quality1',
          title: 'Quality Page 1',
          content: 'This is excellent quality content with substantial length and meaningful information. '.repeat(20),
          depth: 1,
          crawledAt: new Date(),
          status: 'success',
          responseTime: 300
        },
        {
          url: 'https://example.com/quality2',
          title: 'Quality Page 2',
          content: 'This is another excellent quality content page with good information density. '.repeat(15),
          depth: 1,
          crawledAt: new Date(),
          status: 'success',
          responseTime: 400
        }
      ];

      const metrics = service.calculateDetailedMetrics(highQualityPages);

      expect(metrics.qualityScore).toBeGreaterThan(80);
    });
  });
});