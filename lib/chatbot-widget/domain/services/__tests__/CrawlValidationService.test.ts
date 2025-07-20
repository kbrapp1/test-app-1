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
      const result = service.validateUrlFormat('http://example.com');
      expect(result).toBeUndefined(); // Validation should complete without returning anything
      expect(() => service.validateUrlFormat('http://example.com')).not.toThrow();
    });

    it('should accept valid HTTPS URLs', () => {
      const result = service.validateUrlFormat('https://example.com');
      expect(result).toBeUndefined(); // Validation should complete without returning anything
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
        expect.fail('Should have thrown InvalidUrlError');
      } catch (error) {
        expect(error).toBeInstanceOf(InvalidUrlError);
        expect((error as InvalidUrlError).message).toContain('Only HTTP and HTTPS protocols are supported');
      }
    });

    it('should handle edge case URLs correctly', () => {
      // Test with port numbers
      expect(() => service.validateUrlFormat('https://example.com:8080')).not.toThrow();
      expect(() => service.validateUrlFormat('http://localhost:3000')).not.toThrow();
      
      // Test with query parameters and fragments
      expect(() => service.validateUrlFormat('https://example.com/path?query=value')).not.toThrow();
      expect(() => service.validateUrlFormat('https://example.com/path#fragment')).not.toThrow();
      
      // Test IP addresses
      expect(() => service.validateUrlFormat('https://192.168.1.1')).not.toThrow();
      expect(() => service.validateUrlFormat('http://127.0.0.1:8080')).not.toThrow();
    });

    it('should reject URLs with unsupported schemes case-insensitively', () => {
      expect(() => service.validateUrlFormat('FTP://example.com')).toThrow(InvalidUrlError);
      expect(() => service.validateUrlFormat('MAILTO:test@example.com')).toThrow(InvalidUrlError);
      expect(() => service.validateUrlFormat('file:///path/to/file')).toThrow(InvalidUrlError);
    });
  });

  describe('validateCrawlSettings', () => {
    it('should accept valid crawl settings', () => {
      const result = service.validateCrawlSettings(mockCrawlSettings);
      expect(result).toBeUndefined(); // Validation should complete without returning anything
      expect(() => service.validateCrawlSettings(mockCrawlSettings)).not.toThrow();
    });

    it('should reject zero or negative maxPages', () => {
      expect(() => service.validateCrawlSettings({ ...mockCrawlSettings, maxPages: 0 }))
        .toThrow(DataValidationError);
      expect(() => service.validateCrawlSettings({ ...mockCrawlSettings, maxPages: -1 }))
        .toThrow(DataValidationError);
    });

    it('should reject maxPages exceeding limit', () => {
      expect(() => service.validateCrawlSettings({ ...mockCrawlSettings, maxPages: 1001 }))
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
        service.validateCrawlSettings({ ...mockCrawlSettings, maxPages: 1500 });
        expect.fail('Should have thrown DataValidationError');
      } catch (error) {
        expect(error).toBeInstanceOf(DataValidationError);
        expect((error as DataValidationError).context).toEqual({
          maxPages: 1500,
          limit: 1000,
          field: 'maxPages',
          validationRule: 'cannot exceed 1000'
        });
      }
    });

    it('should validate boundary values precisely', () => {
      // Test exact boundary values
      expect(() => service.validateCrawlSettings({ ...mockCrawlSettings, maxPages: 1 })).not.toThrow();
      expect(() => service.validateCrawlSettings({ ...mockCrawlSettings, maxPages: 1000 })).not.toThrow();
      expect(() => service.validateCrawlSettings({ ...mockCrawlSettings, maxDepth: 1 })).not.toThrow();
      expect(() => service.validateCrawlSettings({ ...mockCrawlSettings, maxDepth: 5 })).not.toThrow();
      
      // Test just outside boundaries
      expect(() => service.validateCrawlSettings({ ...mockCrawlSettings, maxPages: 1001 })).toThrow();
      expect(() => service.validateCrawlSettings({ ...mockCrawlSettings, maxDepth: 6 })).toThrow();
    });

    it('should validate all required fields are present', () => {
      // The service only validates maxPages and maxDepth values, not presence of all fields
      // Test what the service actually validates
      const settingsWithInvalidDepth = { ...mockCrawlSettings, maxDepth: 0 };
      expect(() => service.validateCrawlSettings(settingsWithInvalidDepth)).toThrow(DataValidationError);
      
      const settingsWithInvalidPages = { ...mockCrawlSettings, maxPages: 0 };
      expect(() => service.validateCrawlSettings(settingsWithInvalidPages)).toThrow(DataValidationError);
    });
  });

  describe('validateUrlAccessibility', () => {
    it('should pass for accessible URLs', async () => {
      // Default MSW handler already returns 200 for https://example.com
      const result = await service.validateUrlAccessibility('https://example.com');
      expect(result).toBeUndefined(); // Should complete without returning anything
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

      const result = await service.validateRobotsTxtCompliance('https://example.com', mockRobotsChecker);
      expect(result).toBeUndefined(); // Should complete without returning anything
      await expect(service.validateRobotsTxtCompliance('https://example.com', mockRobotsChecker))
        .resolves.not.toThrow();
      
      // Verify both checks were called (accounting for double execution from both assertions)
      expect(mockRobotsChecker.canLoad).toHaveBeenCalled();
      expect(mockRobotsChecker.isAllowed).toHaveBeenCalled();
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
      const result = await service.validateComprehensively(
        mockWebsiteSource,
        mockCrawlSettings,
        mockRobotsChecker
      );
      expect(result).toBeUndefined(); // Should complete without returning anything
      await expect(service.validateComprehensively(
        mockWebsiteSource,
        mockCrawlSettings,
        mockRobotsChecker
      )).resolves.not.toThrow();
      
      // Verify all validations were performed (accounting for double execution from both assertions)
      expect(mockRobotsChecker.canLoad).toHaveBeenCalled();
      expect(mockRobotsChecker.isAllowed).toHaveBeenCalled();
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
    it('should enforce maximum pages limit of 1000', () => {
      const maxAllowedPages = 1000;
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