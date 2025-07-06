/**
 * CrawlValidationService Tests
 * 
 * AI INSTRUCTIONS:
 * - Test all validation scenarios and edge cases
 * - Mock external dependencies (fetch, robotsChecker)
 * - Test domain-specific error handling
 * - Verify validation workflow orchestration
 * - Test business rule enforcement
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../../../../lib/test/mocks/server';
import { CrawlValidationService } from '../CrawlValidationService';
import { WebsiteSource, WebsiteCrawlSettings } from '../../value-objects/ai-configuration/KnowledgeBase';
import { 
  InvalidUrlError, 
  WebsiteAccessibilityError, 
  RobotsTxtViolationError,
  WebsiteCrawlingError, 
  UrlNormalizationError,
  DataValidationError 
} from '../../errors/ChatbotWidgetDomainErrors';
import { IRobotsTxtChecker } from '../WebsiteCrawlingDomainService';

describe('CrawlValidationService', () => {
  let service: CrawlValidationService;
  let mockRobotsChecker: IRobotsTxtChecker;
  let mockWebsiteSource: WebsiteSource;
  let mockCrawlSettings: WebsiteCrawlSettings;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    
    service = new CrawlValidationService();
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
    
    // Setup default MSW handlers for test URLs
    server.use(
      http.head('https://example.com', () => {
        return new HttpResponse(null, { status: 200, statusText: 'OK' });
      }),
      http.head('https://example.com/nonexistent', () => {
        return new HttpResponse(null, { status: 404, statusText: 'Not Found' });
      }),
      http.head('https://unreachable.com', () => {
        // Simulate network error by returning an error response
        return HttpResponse.error();
      })
    );
  });

  describe('validateUrlFormat', () => {
    it('should accept valid HTTP URLs', () => {
      expect(() => service.validateUrlFormat('http://example.com')).not.toThrow();
    });

    it('should accept valid HTTPS URLs', () => {
      expect(() => service.validateUrlFormat('https://example.com')).not.toThrow();
    });

    it('should reject non-HTTP protocols', () => {
      expect(() => service.validateUrlFormat('ftp://example.com')).toThrow(InvalidUrlError);
      expect(() => service.validateUrlFormat('mailto:test@example.com')).toThrow(InvalidUrlError);
    });

    it('should reject URLs without hostname', () => {
      expect(() => service.validateUrlFormat('https://')).toThrow(UrlNormalizationError);
    });

    it('should throw UrlNormalizationError for malformed URLs', () => {
      expect(() => service.validateUrlFormat('not-a-url')).toThrow(UrlNormalizationError);
      expect(() => service.validateUrlFormat('https://[invalid-host')).toThrow(UrlNormalizationError);
    });

    it('should provide specific error messages for protocol violations', () => {
      try {
        service.validateUrlFormat('ftp://example.com');
      } catch (error) {
        expect(error).toBeInstanceOf(InvalidUrlError);
        expect((error as InvalidUrlError).message).toContain('Only HTTP and HTTPS protocols are supported');
      }
    });
  });

  describe('validateCrawlSettings', () => {
    it('should accept valid crawl settings', () => {
      expect(() => service.validateCrawlSettings(mockCrawlSettings)).not.toThrow();
    });

    it('should reject zero or negative maxPages', () => {
      expect(() => service.validateCrawlSettings({ ...mockCrawlSettings, maxPages: 0 }))
        .toThrow(DataValidationError);
      expect(() => service.validateCrawlSettings({ ...mockCrawlSettings, maxPages: -1 }))
        .toThrow(DataValidationError);
    });

    it('should reject maxPages exceeding limit', () => {
      expect(() => service.validateCrawlSettings({ ...mockCrawlSettings, maxPages: 101 }))
        .toThrow(DataValidationError);
    });

    it('should reject invalid maxDepth values', () => {
      expect(() => service.validateCrawlSettings({ ...mockCrawlSettings, maxDepth: 0 }))
        .toThrow(DataValidationError);
      expect(() => service.validateCrawlSettings({ ...mockCrawlSettings, maxDepth: 6 }))
        .toThrow(DataValidationError);
    });

    it('should provide specific error context for validation failures', () => {
      try {
        service.validateCrawlSettings({ ...mockCrawlSettings, maxPages: 150 });
      } catch (error) {
        expect(error).toBeInstanceOf(DataValidationError);
        expect((error as DataValidationError).context).toEqual({
          maxPages: 150,
          limit: 100,
          field: 'maxPages',
          validationRule: 'cannot exceed 100'
        });
      }
    });
  });

  describe('validateUrlAccessibility', () => {
    it('should pass for accessible URLs', async () => {
      // Default MSW handler already returns 200 for https://example.com
      await expect(service.validateUrlAccessibility('https://example.com')).resolves.not.toThrow();
    });

    it('should throw WebsiteAccessibilityError for non-OK responses', async () => {
      // Default MSW handler already returns 404 for https://example.com/nonexistent
      await expect(service.validateUrlAccessibility('https://example.com/nonexistent'))
        .rejects.toThrow(WebsiteAccessibilityError);
    });

    it('should throw WebsiteCrawlingError for network failures', async () => {
      // Default MSW handler already returns network error for https://unreachable.com
      await expect(service.validateUrlAccessibility('https://unreachable.com'))
        .rejects.toThrow(WebsiteCrawlingError);
    });

    it('should use HEAD method for efficiency', async () => {
      // Create a spy to verify the method used
      const headSpy = vi.fn(() => new HttpResponse(null, { status: 200 }));
      server.use(
        http.head('https://example.com', headSpy)
      );

      await service.validateUrlAccessibility('https://example.com');

      expect(headSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('validateRobotsTxtCompliance', () => {
    it('should pass when robots.txt allows crawling', async () => {
      (mockRobotsChecker.canLoad as any).mockResolvedValue(true);
      (mockRobotsChecker.isAllowed as any).mockResolvedValue(true);

      await expect(service.validateRobotsTxtCompliance('https://example.com', mockRobotsChecker))
        .resolves.not.toThrow();
    });

    it('should throw RobotsTxtViolationError when robots.txt cannot be loaded', async () => {
      (mockRobotsChecker.canLoad as any).mockResolvedValue(false);

      await expect(service.validateRobotsTxtCompliance('https://example.com', mockRobotsChecker))
        .rejects.toThrow(RobotsTxtViolationError);
    });

    it('should throw RobotsTxtViolationError when URL is blocked', async () => {
      (mockRobotsChecker.canLoad as any).mockResolvedValue(true);
      (mockRobotsChecker.isAllowed as any).mockResolvedValue(false);

      await expect(service.validateRobotsTxtCompliance('https://example.com/blocked', mockRobotsChecker))
        .rejects.toThrow(RobotsTxtViolationError);
    });

    it('should handle robots.txt checker errors gracefully', async () => {
      (mockRobotsChecker.canLoad as any).mockRejectedValue(new Error('Robots.txt parsing error'));

      await expect(service.validateRobotsTxtCompliance('https://example.com', mockRobotsChecker))
        .rejects.toThrow(RobotsTxtViolationError);
    });

    it('should pass correct user agent to robots checker', async () => {
      (mockRobotsChecker.canLoad as any).mockResolvedValue(true);
      (mockRobotsChecker.isAllowed as any).mockResolvedValue(true);

      await service.validateRobotsTxtCompliance('https://example.com', mockRobotsChecker);

      expect(mockRobotsChecker.isAllowed).toHaveBeenCalledWith(
        'https://example.com',
        'Mozilla/5.0 (compatible; ChatbotCrawler/1.0)'
      );
    });
  });

  describe('validateComprehensively', () => {
    beforeEach(() => {
      // Reset MSW to default success state and mock robots checker
      (mockRobotsChecker.canLoad as any).mockResolvedValue(true);
      (mockRobotsChecker.isAllowed as any).mockResolvedValue(true);
    });

    it('should perform all validation steps for valid requests', async () => {
      await expect(service.validateComprehensively(
        mockWebsiteSource,
        mockCrawlSettings,
        mockRobotsChecker
      )).resolves.not.toThrow();
    });

    it('should skip robots.txt validation when respectRobotsTxt is false', async () => {
      const settingsWithoutRobots = { ...mockCrawlSettings, respectRobotsTxt: false };

      await service.validateComprehensively(
        mockWebsiteSource,
        settingsWithoutRobots,
        mockRobotsChecker
      );

      expect(mockRobotsChecker.canLoad).not.toHaveBeenCalled();
      expect(mockRobotsChecker.isAllowed).not.toHaveBeenCalled();
    });

    it('should skip robots.txt validation when checker is not provided', async () => {
      await service.validateComprehensively(
        mockWebsiteSource,
        mockCrawlSettings
      );

      expect(mockRobotsChecker.canLoad).not.toHaveBeenCalled();
      expect(mockRobotsChecker.isAllowed).not.toHaveBeenCalled();
    });

    it('should fail early on URL format validation', async () => {
      const invalidSource = { ...mockWebsiteSource, url: 'invalid-url' };

      await expect(service.validateComprehensively(
        invalidSource,
        mockCrawlSettings,
        mockRobotsChecker
      )).rejects.toThrow();

      // Should not call accessibility check if URL format is invalid
      // Note: MSW will not be called for invalid URLs since they fail format validation first
    });

    it('should fail early on crawl settings validation', async () => {
      const invalidSettings = { ...mockCrawlSettings, maxPages: 0 };

      await expect(service.validateComprehensively(
        mockWebsiteSource,
        invalidSettings,
        mockRobotsChecker
      )).rejects.toThrow(DataValidationError);

      // Should not call accessibility check if settings are invalid
      // Note: MSW will not be called for invalid settings since they fail validation first
    });

    it('should propagate accessibility errors', async () => {
      // Override MSW to return 403 for this test
      server.use(
        http.head('https://example.com', () => {
          return new HttpResponse(null, { status: 403, statusText: 'Forbidden' });
        })
      );

      await expect(service.validateComprehensively(
        mockWebsiteSource,
        mockCrawlSettings,
        mockRobotsChecker
      )).rejects.toThrow(WebsiteAccessibilityError);
    });

    it('should propagate robots.txt violations', async () => {
      (mockRobotsChecker.isAllowed as any).mockResolvedValue(false);

      await expect(service.validateComprehensively(
        mockWebsiteSource,
        mockCrawlSettings,
        mockRobotsChecker
      )).rejects.toThrow(RobotsTxtViolationError);
    });
  });

  describe('business rule enforcement', () => {
    it('should enforce maximum pages limit of 100', () => {
      const maxAllowedPages = 100;
      expect(() => service.validateCrawlSettings({ ...mockCrawlSettings, maxPages: maxAllowedPages }))
        .not.toThrow();
      expect(() => service.validateCrawlSettings({ ...mockCrawlSettings, maxPages: maxAllowedPages + 1 }))
        .toThrow(DataValidationError);
    });

    it('should enforce maximum depth limit of 5', () => {
      const maxAllowedDepth = 5;
      expect(() => service.validateCrawlSettings({ ...mockCrawlSettings, maxDepth: maxAllowedDepth }))
        .not.toThrow();
      expect(() => service.validateCrawlSettings({ ...mockCrawlSettings, maxDepth: maxAllowedDepth + 1 }))
        .toThrow(DataValidationError);
    });
  });
});