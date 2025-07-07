/**
 * Website Crawling Domain Workflows Behavior Tests
 * 
 * AI INSTRUCTIONS:
 * - Test complete domain workflows and business scenarios
 * - Test cross-service coordination and data flow
 * - Test business rule enforcement across the domain
 * - Focus on behavior rather than implementation details
 * - Test realistic crawling scenarios end-to-end
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../../../../lib/test/mocks/server';
import { WebsiteCrawlingDomainService, IRobotsTxtChecker } from '../WebsiteCrawlingDomainService';
import { CrawlPolicyService } from '../CrawlPolicyService';
import { CrawlValidationService } from '../CrawlValidationService';
import { CrawlBudgetCalculatorService } from '../CrawlBudgetCalculatorService';
import { CrawlResultProcessorService } from '../CrawlResultProcessorService';
import { WebsiteSource, WebsiteCrawlSettings } from '../../value-objects/ai-configuration/KnowledgeBase';

describe('Website Crawling Domain Workflows - Behavior Tests', () => {
  let domainService: WebsiteCrawlingDomainService;
  let policyService: CrawlPolicyService;
  let validationService: CrawlValidationService;
  let budgetService: CrawlBudgetCalculatorService;
  let processorService: CrawlResultProcessorService;
  let mockRobotsChecker: IRobotsTxtChecker;

  beforeEach(() => {
    domainService = new WebsiteCrawlingDomainService();
    policyService = new CrawlPolicyService();
    validationService = new CrawlValidationService();
    budgetService = new CrawlBudgetCalculatorService();
    processorService = new CrawlResultProcessorService();
    
    mockRobotsChecker = {
      isAllowed: vi.fn().mockResolvedValue(true) as any,
      canLoad: vi.fn().mockResolvedValue(true) as any
    };

    // Setup MSW handlers for test URLs
    server.use(
      http.head('https://smallbusiness.com', () => {
        return new HttpResponse(null, { status: 200, statusText: 'OK' });
      }),
      http.head('https://shop.example.com', () => {
        return new HttpResponse(null, { status: 200, statusText: 'OK' });
      }),
      http.head('https://corporate.com', () => {
        return new HttpResponse(null, { status: 200, statusText: 'OK' });
      }),
      http.head('https://restricted.com', () => {
        return new HttpResponse(null, { status: 200, statusText: 'OK' });
      })
    );

    vi.clearAllMocks();
  });

  describe('Small Business Website Crawl Workflow', () => {
    const smallBusinessSource: WebsiteSource = {
      id: 'small-business-1',
      url: 'https://smallbusiness.com',
      name: 'Small Business Site',
      isActive: true,
      crawlSettings: {
        maxPages: 15,
        maxDepth: 2,
        includePatterns: [],
        excludePatterns: [],
        respectRobotsTxt: true,
        crawlFrequency: 'weekly' as const,
        includeImages: false,
        includePDFs: true
      },
      status: 'pending' as const
    };

    const conservativeCrawlSettings: WebsiteCrawlSettings = {
      maxPages: 15,
      maxDepth: 2,
      includePatterns: [],
      excludePatterns: [],
      respectRobotsTxt: true,
      crawlFrequency: 'weekly' as const,
      includeImages: false,
      includePDFs: true
    };

    it('should plan and validate a conservative small business crawl', async () => {
      // Step 1: Validate the crawl request
      await expect(domainService.validateCrawlRequest(
        smallBusinessSource,
        conservativeCrawlSettings,
        mockRobotsChecker
      )).resolves.not.toThrow();

      // Step 2: Calculate optimal budget
      const budget = domainService.calculateCrawlBudget(conservativeCrawlSettings);
      
      expect(budget).toMatchObject({
        maxPages: 15,
        maxDepth: 2,
        recommendedConcurrency: 2
      });
      expect(budget.estimatedTime).toBeLessThan(120); // Should be under 2 minutes

      // Step 3: Verify URL selection follows business rules
      const importantPages = [
        'https://smallbusiness.com/about',
        'https://smallbusiness.com/services',
        'https://smallbusiness.com/contact'
      ];

      importantPages.forEach(url => {
        expect(domainService.shouldCrawlUrl(
          url,
          smallBusinessSource.url,
          1,
          conservativeCrawlSettings
        )).toBe(true);
      });

      // Step 4: Verify exclusion of non-valuable content
      const excludedPages = [
        'https://smallbusiness.com/image.jpg',
        'https://smallbusiness.com/admin',
        'https://smallbusiness.com/cart'
      ];

      excludedPages.forEach(url => {
        expect(domainService.shouldCrawlUrl(
          url,
          smallBusinessSource.url,
          1,
          conservativeCrawlSettings
        )).toBe(false);
      });
    });

    it('should process typical small business crawl results effectively', () => {
      const typicalCrawlResults = [
        {
          url: 'https://smallbusiness.com',
          title: 'Small Business - Home',
          content: 'Welcome to our small business. We provide quality services to our community with dedicated customer support.',
          depth: 0,
          crawledAt: new Date(),
          status: 'success' as const,
          responseTime: 300
        },
        {
          url: 'https://smallbusiness.com/about',
          title: 'About Us',
          content: 'Founded in 2020, we are a family-owned business committed to excellence and customer satisfaction in our local market.',
          depth: 1,
          crawledAt: new Date(),
          status: 'success' as const,
          responseTime: 250
        },
        {
          url: 'https://smallbusiness.com/services',
          title: 'Our Services',
          content: 'We offer comprehensive services including consultation, implementation, and ongoing support for all our clients.',
          depth: 1,
          crawledAt: new Date(),
          status: 'success' as const,
          responseTime: 400
        }
      ];

      const result = domainService.processCrawlResult(typicalCrawlResults);

      expect(result.knowledgeItems).toHaveLength(3);
      expect(result.successfulPages).toBe(3);
      expect(result.failedPages).toBe(0);
      
      // Verify knowledge items have appropriate relevance scores
      const homePageItem = result.knowledgeItems.find(item => item.source === 'https://smallbusiness.com');
      const aboutPageItem = result.knowledgeItems.find(item => item.source === 'https://smallbusiness.com/about');
      
      expect(homePageItem?.relevanceScore ?? 0).toBeGreaterThan(aboutPageItem?.relevanceScore ?? 0); // Home page typically more relevant
    });
  });

  describe('E-commerce Website Crawl Workflow', () => {
    const ecommerceSource: WebsiteSource = {
      id: 'ecommerce-1',
      url: 'https://shop.example.com',
      name: 'E-commerce Store',
      isActive: true,
      crawlSettings: {
        maxPages: 80,
        maxDepth: 4,
        includePatterns: [],
        excludePatterns: [],
        respectRobotsTxt: true,
        crawlFrequency: 'weekly' as const,
        includeImages: false,
        includePDFs: true
      },
      status: 'pending' as const
    };

    const aggressiveCrawlSettings: WebsiteCrawlSettings = {
      maxPages: 80,
      maxDepth: 4,
      includePatterns: [],
      excludePatterns: [],
      respectRobotsTxt: true,
      crawlFrequency: 'weekly' as const,
      includeImages: false,
      includePDFs: true
    };

    it('should plan a comprehensive e-commerce crawl with risk management', async () => {
      // Step 1: Validate large crawl request
      await expect(domainService.validateCrawlRequest(
        ecommerceSource,
        aggressiveCrawlSettings,
        mockRobotsChecker
      )).resolves.not.toThrow();

      // Step 2: Calculate budget with risk assessment
      const budget = domainService.calculateCrawlBudget(aggressiveCrawlSettings);
      
      expect(budget.recommendedConcurrency).toBeGreaterThan(2);
      expect(budget.estimatedTime).toBeGreaterThan(300); // Should be over 5 minutes

      // Step 3: Verify product pages are prioritized correctly
      const productUrls = [
        'https://shop.example.com/products/laptop',
        'https://shop.example.com/category/electronics',
        'https://shop.example.com/products/phone'
      ];

      productUrls.forEach(url => {
        const evaluation = policyService.evaluateUrl(
          url,
          ecommerceSource.url,
          2,
          aggressiveCrawlSettings
        );
        expect(evaluation.shouldCrawl).toBe(true);
        expect(['medium', 'high']).toContain(evaluation.priority);
      });

      // Step 4: Verify exclusion of user-specific pages
      const excludedUrls = [
        'https://shop.example.com/cart',
        'https://shop.example.com/checkout',
        'https://shop.example.com/user/profile'
      ];

      excludedUrls.forEach(url => {
        expect(domainService.shouldCrawlUrl(
          url,
          ecommerceSource.url,
          1,
          aggressiveCrawlSettings
        )).toBe(false);
      });
    });

    it('should handle mixed-quality e-commerce crawl results', () => {
      const mixedCrawlResults = [
        {
          url: 'https://shop.example.com/products/laptop',
          title: 'Gaming Laptop - High Performance',
          content: 'Premium gaming laptop with latest processor, high-end graphics card, and excellent build quality. Perfect for gaming and professional work.',
          depth: 2,
          crawledAt: new Date(),
          status: 'success' as const,
          responseTime: 500
        },
        {
          url: 'https://shop.example.com/products/phone',
          title: 'Smartphone',
          content: 'Phone.',
          depth: 2,
          crawledAt: new Date(),
          status: 'success' as const,
          responseTime: 300
        },
        {
          url: 'https://shop.example.com/category/electronics',
          title: 'Electronics Category',
          content: '',
          depth: 1,
          crawledAt: new Date(),
          status: 'failed' as const,
          errorMessage: 'Timeout'
        }
      ];

      const result = domainService.processCrawlResult(mixedCrawlResults);

      // Should filter out low-quality and failed pages
      expect(result.knowledgeItems).toHaveLength(1);
      expect(result.knowledgeItems[0].source).toBe('https://shop.example.com/products/laptop');
      expect(result.successfulPages).toBe(2);
      expect(result.failedPages).toBe(1);
    });
  });

  describe('Corporate Website Crawl Workflow', () => {
    const corporateSource: WebsiteSource = {
      id: 'corporate-1',
      url: 'https://corporate.com',
      name: 'Corporate Website',
      isActive: true,
      crawlSettings: {
        maxPages: 40,
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

    const balancedCrawlSettings: WebsiteCrawlSettings = {
      maxPages: 40,
      maxDepth: 3,
      includePatterns: [],
      excludePatterns: [],
      respectRobotsTxt: true,
      crawlFrequency: 'weekly' as const,
      includeImages: false,
      includePDFs: true
    };

    it('should execute balanced corporate crawl with quality focus', async () => {
      // Step 1: Validate corporate crawl
      await expect(domainService.validateCrawlRequest(
        corporateSource,
        balancedCrawlSettings,
        mockRobotsChecker
      )).resolves.not.toThrow();

      // Step 2: Verify medium risk assessment
      const budget = domainService.calculateCrawlBudget(balancedCrawlSettings);
      expect(budget.recommendedConcurrency).toBeGreaterThan(1);

      // Step 3: Test corporate content prioritization
      const corporateUrls = [
        { url: 'https://corporate.com/about', expectedPriority: 'high' },
        { url: 'https://corporate.com/services', expectedPriority: 'high' },
        { url: 'https://corporate.com/blog/latest-news', expectedPriority: 'high' },
        { url: 'https://corporate.com/team/john-doe', expectedPriority: 'low' }
      ];

      corporateUrls.forEach(({ url, expectedPriority }) => {
        const evaluation = policyService.evaluateUrl(
          url,
          corporateSource.url,
          url.includes('/team/') ? 3 : 1,
          balancedCrawlSettings
        );
        expect(evaluation.priority).toBe(expectedPriority);
      });
    });

    it('should process corporate content with appropriate quality thresholds', () => {
      const corporateCrawlResults = [
        {
          url: 'https://corporate.com/about',
          title: 'About Our Company',
          content: 'Established in 1995, our company has been a leader in innovative solutions for enterprise clients worldwide. We pride ourselves on delivering exceptional value through cutting-edge technology and dedicated customer service.',
          depth: 1,
          crawledAt: new Date(),
          status: 'success' as const,
          responseTime: 400
        },
        {
          url: 'https://corporate.com/news/press-release-1',
          title: 'Latest Press Release',
          content: 'Brief announcement about our latest achievement in the industry, including significant business developments and expansion plans.',
          depth: 2,
          crawledAt: new Date(),
          status: 'success' as const,
          responseTime: 350
        }
      ];

      const result = domainService.processCrawlResult(corporateCrawlResults);

      expect(result.knowledgeItems).toHaveLength(2);
      
      // About page should have higher relevance due to content length and depth
      const aboutItem = result.knowledgeItems.find(item => item.source.includes('/about'));
      const newsItem = result.knowledgeItems.find(item => item.source.includes('/news'));
      
      expect(aboutItem?.relevanceScore ?? 0).toBeGreaterThan(newsItem?.relevanceScore ?? 0);
    });
  });

  describe('Cross-Domain Crawl Prevention Workflow', () => {
    it('should prevent cross-domain crawling consistently across all services', () => {
      const baseUrl = 'https://example.com';
      const crossDomainUrls = [
        'https://malicious.com/page',
        'https://different.org/content',
        'http://suspicious.net/data'
      ];

      crossDomainUrls.forEach(url => {
        // Policy service should reject
        expect(policyService.isSameDomain(url, baseUrl)).toBe(false);
        
        // Domain service should reject
        expect(domainService.shouldCrawlUrl(
          url,
          baseUrl,
          1,
          { maxPages: 50, maxDepth: 3, respectRobotsTxt: true, crawlFrequency: 'weekly' as const, includePatterns: [], excludePatterns: [], includeImages: false, includePDFs: true }
        )).toBe(false);
        
        // Evaluation should indicate rejection
        const evaluation = policyService.evaluateUrl(
          url,
          baseUrl,
          1,
          { maxPages: 50, maxDepth: 3, respectRobotsTxt: true, crawlFrequency: 'weekly' as const, includePatterns: [], excludePatterns: [], includeImages: false, includePDFs: true }
        );
        expect(evaluation.shouldCrawl).toBe(false);
        expect(evaluation.reason).toBe('Outside target domain');
      });
    });
  });

  describe('Robots.txt Compliance Workflow', () => {
    it('should handle robots.txt blocking gracefully', async () => {
      const blockedRobotsChecker: IRobotsTxtChecker = {
        canLoad: vi.fn().mockResolvedValue(true),
        isAllowed: vi.fn().mockResolvedValue(false)
      };

      const source: WebsiteSource = {
        id: 'restricted-1',
        url: 'https://restricted.com',
        name: 'Restricted Site',
        isActive: true,
        crawlSettings: {
          maxPages: 10,
          maxDepth: 2,
          includePatterns: [],
          excludePatterns: [],
          respectRobotsTxt: true,
          crawlFrequency: 'weekly' as const,
          includeImages: false,
          includePDFs: true
        },
        status: 'pending' as const
      };

      const settings: WebsiteCrawlSettings = {
        maxPages: 10,
        maxDepth: 2,
        respectRobotsTxt: true,
        crawlFrequency: 'weekly' as const,
        includePatterns: [],
        excludePatterns: [],
        includeImages: false,
        includePDFs: true
      };

      await expect(domainService.validateCrawlRequest(
        source,
        settings,
        blockedRobotsChecker
      )).rejects.toThrow('robots.txt');
    });

    it('should proceed when robots.txt compliance is disabled', async () => {
      const blockedRobotsChecker: IRobotsTxtChecker = {
        canLoad: vi.fn().mockResolvedValue(true),
        isAllowed: vi.fn().mockResolvedValue(false)
      };

      const source: WebsiteSource = {
        id: 'restricted-2',
        url: 'https://restricted.com',
        name: 'Restricted Site',
        isActive: true,
        crawlSettings: {
          maxPages: 10,
          maxDepth: 2,
          includePatterns: [],
          excludePatterns: [],
          respectRobotsTxt: false,
          crawlFrequency: 'weekly' as const,
          includeImages: false,
          includePDFs: true
        },
        status: 'pending' as const
      };

      const settings: WebsiteCrawlSettings = {
        maxPages: 10,
        maxDepth: 2,
        respectRobotsTxt: false, // Disabled
        crawlFrequency: 'weekly' as const,
        includePatterns: [],
        excludePatterns: [],
        includeImages: false,
        includePDFs: true
      };

      await expect(domainService.validateCrawlRequest(
        source,
        settings,
        blockedRobotsChecker
      )).resolves.not.toThrow();
    });
  });

  describe('Depth and Page Limit Enforcement Workflow', () => {
    it('should consistently enforce depth limits across all services', () => {
      const settings: WebsiteCrawlSettings = {
        maxPages: 50,
        maxDepth: 3,
        respectRobotsTxt: true,
        crawlFrequency: 'weekly' as const,
        includePatterns: [],
        excludePatterns: [],
        includeImages: false,
        includePDFs: true
      };

      const baseUrl = 'https://example.com';
      const deepUrl = 'https://example.com/level1/level2/level3/level4';

      // Domain service should enforce depth limit
      expect(domainService.shouldCrawlUrl(deepUrl, baseUrl, 3, settings)).toBe(false);
      expect(domainService.shouldCrawlUrl(deepUrl, baseUrl, 2, settings)).toBe(true);

      // Policy service should evaluate consistently
      const atLimitEvaluation = policyService.evaluateUrl(deepUrl, baseUrl, 3, settings);
      const overLimitEvaluation = policyService.evaluateUrl(deepUrl, baseUrl, 4, settings);

      expect(atLimitEvaluation.shouldCrawl).toBe(false);
      expect(overLimitEvaluation.shouldCrawl).toBe(false);
      expect(overLimitEvaluation.reason).toContain('depth limit');

      // Budget service should respect limits
      const budget = budgetService.calculateOptimalBudget(settings);
      expect(budget.maxDepth).toBeLessThanOrEqual(3);
    });

    it('should enforce page limits in budget calculations', () => {
      const overLimitSettings: WebsiteCrawlSettings = {
        maxPages: 150, // Over the 100 limit
        maxDepth: 8,   // Over the 5 limit
        respectRobotsTxt: true,
        crawlFrequency: 'weekly' as const,
        includePatterns: [],
        excludePatterns: [],
        includeImages: false,
        includePDFs: true
      };

      const budget = budgetService.calculateOptimalBudget(overLimitSettings);

      expect(budget.maxPages).toBe(100); // Should be capped
      expect(budget.maxDepth).toBe(5);   // Should be capped
    });
  });

  describe('Quality Content Processing Workflow', () => {
    it('should maintain consistent quality standards across processing pipeline', () => {
      const variableQualityResults = [
        {
          url: 'https://example.com/high-quality',
          title: 'Comprehensive Guide',
          content: 'This is a detailed and comprehensive guide that provides valuable information to users. It contains substantial content that would be useful for knowledge base purposes and demonstrates high quality standards.',
          depth: 1,
          crawledAt: new Date(),
          status: 'success' as const,
          responseTime: 300
        },
        {
          url: 'https://example.com/medium-quality',
          title: 'Basic Information',
          content: 'This page contains basic information that meets minimum quality requirements for inclusion in knowledge base.',
          depth: 2,
          crawledAt: new Date(),
          status: 'success' as const,
          responseTime: 400
        },
        {
          url: 'https://example.com/low-quality',
          title: 'Poor Content',
          content: 'Short text.',
          depth: 1,
          crawledAt: new Date(),
          status: 'success' as const,
          responseTime: 200
        },
        {
          url: 'https://example.com/no-title',
          title: '',
          content: 'Content without a proper title should be filtered out even if the content itself is reasonably good.',
          depth: 1,
          crawledAt: new Date(),
          status: 'success' as const,
          responseTime: 350
        }
      ];

      const result = domainService.processCrawlResult(variableQualityResults);

      // Should only include high and medium quality content
      expect(result.knowledgeItems).toHaveLength(2);
      
      const includedUrls = result.knowledgeItems.map(item => item.source);
      expect(includedUrls).toContain('https://example.com/high-quality');
      expect(includedUrls).toContain('https://example.com/medium-quality');
      expect(includedUrls).not.toContain('https://example.com/low-quality');
      expect(includedUrls).not.toContain('https://example.com/no-title');
    });
  });
});