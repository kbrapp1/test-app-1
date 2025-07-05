/**
 * WebsiteCrawlingDomainService Integration Tests
 * 
 * AI INSTRUCTIONS:
 * - Test service orchestration and coordination
 * - Test error propagation between services
 * - Test dependency injection and composition
 * - Test end-to-end crawl planning workflows
 * - Mock external dependencies appropriately
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../../../../lib/test/mocks/server';
import { WebsiteCrawlingDomainService, IRobotsTxtChecker } from '../WebsiteCrawlingDomainService';
import { WebsiteSource, WebsiteCrawlSettings } from '../../value-objects/ai-configuration/KnowledgeBase';
import { 
  InvalidUrlError, 
  DataValidationError,
  WebsiteAccessibilityError,
  RobotsTxtViolationError 
} from '../../errors/ChatbotWidgetDomainErrors';

describe('WebsiteCrawlingDomainService Integration Tests', () => {
  let service: WebsiteCrawlingDomainService;
  let mockRobotsChecker: IRobotsTxtChecker;
  let mockWebsiteSource: WebsiteSource;
  let mockCrawlSettings: WebsiteCrawlSettings;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    
    service = new WebsiteCrawlingDomainService();
    mockRobotsChecker = {
      isAllowed: vi.fn() as any,
      canLoad: vi.fn() as any
    };
    mockWebsiteSource = {
      id: 'test-source-1',
      url: 'https://example.com',
      name: 'Example Site',
      isActive: true,
      crawlSettings: {
        maxPages: 50,
        maxDepth: 3,
        includePatterns: [],
        excludePatterns: [],
        respectRobotsTxt: true,
        crawlFrequency: 'weekly' as const,
        includeImages: false,
        includePDFs: true
      },
      status: 'pending' as const
    };
    mockCrawlSettings = {
      maxPages: 50,
      maxDepth: 3,
      includePatterns: [],
      excludePatterns: [],
      respectRobotsTxt: true,
      crawlFrequency: 'weekly' as const,
      includeImages: false,
      includePDFs: true
    };

    // Setup default MSW handlers and robot checker mocks
    server.use(
      http.head('https://example.com', () => {
        return new HttpResponse(null, { status: 200, statusText: 'OK' });
      }),
      http.head('http://test.org', () => {
        return new HttpResponse(null, { status: 200, statusText: 'OK' });
      }),
      http.head('https://subdomain.example.com', () => {
        return new HttpResponse(null, { status: 200, statusText: 'OK' });
      })
    );
    
    (mockRobotsChecker.canLoad as any).mockResolvedValue(true);
    (mockRobotsChecker.isAllowed as any).mockResolvedValue(true);
  });

  describe('service composition and dependency injection', () => {
    it('should initialize all specialized services', () => {
      expect(service.getCrawlValidationService()).toBeDefined();
      expect(service.getCrawlPolicyService()).toBeDefined();
    });

    it('should provide access to validation service', () => {
      const validationService = service.getCrawlValidationService();
      expect(validationService).toHaveProperty('validateComprehensively');
      expect(validationService).toHaveProperty('validateUrlFormat');
    });

    it('should provide access to policy service', () => {
      const policyService = service.getCrawlPolicyService();
      expect(policyService).toHaveProperty('shouldCrawlUrl');
      expect(policyService).toHaveProperty('evaluateUrl');
    });
  });

  describe('validateCrawlRequest orchestration', () => {
    it('should delegate validation to specialized service', async () => {
      await expect(service.validateCrawlRequest(
        mockWebsiteSource,
        mockCrawlSettings,
        mockRobotsChecker
      )).resolves.not.toThrow();

      // MSW will handle the HEAD request - we can verify robots checker was called
      expect(mockRobotsChecker.canLoad).toHaveBeenCalledWith('https://example.com');
      expect(mockRobotsChecker.isAllowed).toHaveBeenCalledWith(
        'https://example.com',
        'Mozilla/5.0 (compatible; ChatbotCrawler/1.0)'
      );
    });

    it('should propagate URL format validation errors', async () => {
      const invalidSource = { ...mockWebsiteSource, url: 'invalid-url' };

      await expect(service.validateCrawlRequest(
        invalidSource,
        mockCrawlSettings,
        mockRobotsChecker
      )).rejects.toThrow();
    });

    it('should propagate crawl settings validation errors', async () => {
      const invalidSettings = { ...mockCrawlSettings, maxPages: 0 };

      await expect(service.validateCrawlRequest(
        mockWebsiteSource,
        invalidSettings,
        mockRobotsChecker
      )).rejects.toThrow(DataValidationError);
    });

    it('should propagate accessibility errors', async () => {
      // Override MSW to return 404 for this test
      server.use(
        http.head('https://example.com', () => {
          return new HttpResponse(null, { status: 404, statusText: 'Not Found' });
        })
      );

      await expect(service.validateCrawlRequest(
        mockWebsiteSource,
        mockCrawlSettings,
        mockRobotsChecker
      )).rejects.toThrow(WebsiteAccessibilityError);
    });

    it('should propagate robots.txt violations', async () => {
      (mockRobotsChecker.isAllowed as any).mockResolvedValue(false);

      await expect(service.validateCrawlRequest(
        mockWebsiteSource,
        mockCrawlSettings,
        mockRobotsChecker
      )).rejects.toThrow(RobotsTxtViolationError);
    });

    it('should skip robots.txt validation when not required', async () => {
      const settingsWithoutRobots = { ...mockCrawlSettings, respectRobotsTxt: false };

      await service.validateCrawlRequest(
        mockWebsiteSource,
        settingsWithoutRobots,
        mockRobotsChecker
      );

      expect(mockRobotsChecker.canLoad).not.toHaveBeenCalled();
      expect(mockRobotsChecker.isAllowed).not.toHaveBeenCalled();
    });
  });

  describe('calculateCrawlBudget orchestration', () => {
    it('should delegate budget calculation to specialized service', () => {
      const budget = service.calculateCrawlBudget(mockCrawlSettings);

      expect(budget).toMatchObject({
        maxPages: expect.any(Number),
        maxDepth: expect.any(Number),
        estimatedTime: expect.any(Number),
        recommendedConcurrency: expect.any(Number)
      });
    });

    it('should enforce business constraints', () => {
      const largeCrawlSettings = { ...mockCrawlSettings, maxPages: 150, maxDepth: 10 };
      const budget = service.calculateCrawlBudget(largeCrawlSettings);

      expect(budget.maxPages).toBeLessThanOrEqual(100);
      expect(budget.maxDepth).toBeLessThanOrEqual(5);
    });

    it('should provide consistent results', () => {
      const budget1 = service.calculateCrawlBudget(mockCrawlSettings);
      const budget2 = service.calculateCrawlBudget(mockCrawlSettings);

      expect(budget1).toEqual(budget2);
    });
  });

  describe('processCrawlResult orchestration', () => {
    it('should delegate result processing to specialized service', () => {
      const mockCrawledPages = [
        {
          url: 'https://example.com/page1',
          title: 'Page 1',
          content: 'This is quality content with sufficient length for testing purposes.',
          depth: 1,
          crawledAt: new Date(),
          status: 'success' as const,
          responseTime: 300,
          statusCode: 200
        },
        {
          url: 'https://example.com/page2',
          title: 'Page 2',
          content: 'Short',
          depth: 2,
          crawledAt: new Date(),
          status: 'failed' as const,
          errorMessage: 'Connection timeout'
        }
      ];

      const result = service.processCrawlResult(mockCrawledPages);

      expect(result).toMatchObject({
        knowledgeItems: expect.any(Array),
        crawledPages: expect.any(Array),
        totalPagesAttempted: 2,
        successfulPages: 1,
        failedPages: 1,
        skippedPages: 0
      });
    });

    it('should filter quality content through processing', () => {
      const mockCrawledPages = [
        {
          url: 'https://example.com/good',
          title: 'Good Page',
          content: 'This is quality content with sufficient length and meaningful information that provides real value to users.',
          depth: 1,
          crawledAt: new Date(),
          status: 'success' as const
        },
        {
          url: 'https://example.com/bad',
          title: '',
          content: 'Bad content without title should be filtered out even if long enough and meets other criteria.',
          depth: 1,
          crawledAt: new Date(),
          status: 'success' as const
        }
      ];

      const result = service.processCrawlResult(mockCrawledPages);

      expect(result.knowledgeItems).toHaveLength(1);
      expect(result.knowledgeItems[0].source).toBe('https://example.com/good');
    });

    it('should handle empty crawl results', () => {
      const result = service.processCrawlResult([]);

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

  describe('shouldCrawlUrl business logic coordination', () => {
    const baseUrl = 'https://example.com';

    it('should coordinate depth and domain checks', () => {
      expect(service.shouldCrawlUrl(
        'https://example.com/page',
        baseUrl,
        1,
        mockCrawlSettings
      )).toBe(true);

      expect(service.shouldCrawlUrl(
        'https://example.com/page',
        baseUrl,
        3, // At max depth
        mockCrawlSettings
      )).toBe(false);

      expect(service.shouldCrawlUrl(
        'https://different.com/page',
        baseUrl,
        1,
        mockCrawlSettings
      )).toBe(false);
    });

    it('should apply policy service rules', () => {
      expect(service.shouldCrawlUrl(
        'https://example.com/about',
        baseUrl,
        1,
        mockCrawlSettings
      )).toBe(true);

      expect(service.shouldCrawlUrl(
        'https://example.com/image.jpg',
        baseUrl,
        1,
        mockCrawlSettings
      )).toBe(false);
    });

    it('should enforce depth limits strictly', () => {
      const maxDepth = mockCrawlSettings.maxDepth;

      expect(service.shouldCrawlUrl(
        'https://example.com/page',
        baseUrl,
        maxDepth - 1,
        mockCrawlSettings
      )).toBe(true);

      expect(service.shouldCrawlUrl(
        'https://example.com/page',
        baseUrl,
        maxDepth,
        mockCrawlSettings
      )).toBe(false);
    });
  });

  describe('end-to-end workflow integration', () => {
    it('should handle complete crawl planning workflow', async () => {
      // Step 1: Validate crawl request
      await expect(service.validateCrawlRequest(
        mockWebsiteSource,
        mockCrawlSettings,
        mockRobotsChecker
      )).resolves.not.toThrow();

      // Step 2: Calculate budget
      const budget = service.calculateCrawlBudget(mockCrawlSettings);
      expect(budget.maxPages).toBeGreaterThan(0);

      // Step 3: Test URL evaluation
      expect(service.shouldCrawlUrl(
        'https://example.com/about',
        mockWebsiteSource.url,
        1,
        mockCrawlSettings
      )).toBe(true);

      // Step 4: Process mock results
      const mockResults = [
        {
          url: 'https://example.com/about',
          title: 'About Us',
          content: 'Quality content about the company with sufficient length for processing and meaningful information that provides real value to users and contains substantial detail.',
          depth: 1,
          crawledAt: new Date(),
          status: 'success' as const
        }
      ];

      const processedResult = service.processCrawlResult(mockResults);
      expect(processedResult.knowledgeItems).toHaveLength(1);
    });

    it('should fail early on validation errors', async () => {
      const invalidSource = { ...mockWebsiteSource, url: 'invalid-url' };

      await expect(service.validateCrawlRequest(
        invalidSource,
        mockCrawlSettings,
        mockRobotsChecker
      )).rejects.toThrow();

      // Subsequent steps should not be reached in real implementation
    });

    it('should maintain data consistency across services', () => {
      // Budget calculation should respect the same limits as validation
      const budget = service.calculateCrawlBudget({
        ...mockCrawlSettings,
        maxPages: 150, // Over limit
        maxDepth: 10   // Over limit
      });

      expect(budget.maxPages).toBe(100); // Enforced limit
      expect(budget.maxDepth).toBe(5);   // Enforced limit

      // Policy service should work with same constraints
      expect(service.shouldCrawlUrl(
        'https://example.com/page',
        'https://example.com',
        5, // At new max depth
        { ...mockCrawlSettings, maxDepth: 5 }
      )).toBe(false);
    });
  });

  describe('error handling and propagation', () => {
    it('should propagate validation errors without modification', async () => {
      // Override MSW to simulate network error
      server.use(
        http.head('https://example.com', () => {
          return HttpResponse.error();
        })
      );

      await expect(service.validateCrawlRequest(
        mockWebsiteSource,
        mockCrawlSettings,
        mockRobotsChecker
      )).rejects.toThrow();
    });

    it('should handle robots.txt checker failures gracefully', async () => {
      (mockRobotsChecker.canLoad as any).mockRejectedValue(new Error('Robots.txt error'));

      await expect(service.validateCrawlRequest(
        mockWebsiteSource,
        mockCrawlSettings,
        mockRobotsChecker
      )).rejects.toThrow(RobotsTxtViolationError);
    });

    it('should not break on processing service errors', () => {
      // Processing service should handle malformed data gracefully
      const malformedData = [
        {
          url: 'https://example.com/test',
          title: null as any, // Malformed title
          content: '', // Empty content
          depth: 1,
          crawledAt: new Date(),
          status: 'success' as const
        }
      ];

      expect(() => service.processCrawlResult(malformedData)).not.toThrow();
    });
  });

  describe('configuration and flexibility', () => {
    it('should handle different crawl configurations', async () => {
      const configurations = [
        { maxPages: 10, maxDepth: 1 },
        { maxPages: 50, maxDepth: 3 },
        { maxPages: 100, maxDepth: 5 }
      ];

      for (const config of configurations) {
        const settings = { ...mockCrawlSettings, ...config };
        
        await expect(service.validateCrawlRequest(
          mockWebsiteSource,
          settings,
          mockRobotsChecker
        )).resolves.not.toThrow();

        const budget = service.calculateCrawlBudget(settings);
        expect(budget.maxPages).toBeLessThanOrEqual(config.maxPages);
        expect(budget.maxDepth).toBeLessThanOrEqual(config.maxDepth);
      }
    });

    it('should work without robots.txt checker', async () => {
      await expect(service.validateCrawlRequest(
        mockWebsiteSource,
        { ...mockCrawlSettings, respectRobotsTxt: false }
      )).resolves.not.toThrow();
    });

    it('should support different website sources', async () => {
      const sources = [
        { ...mockWebsiteSource, url: 'https://example.com' },
        { ...mockWebsiteSource, url: 'http://test.org' },
        { ...mockWebsiteSource, url: 'https://subdomain.example.com' }
      ];

      for (const source of sources) {
        await expect(service.validateCrawlRequest(
          source,
          mockCrawlSettings,
          mockRobotsChecker
        )).resolves.not.toThrow();
      }
    });
  });
});