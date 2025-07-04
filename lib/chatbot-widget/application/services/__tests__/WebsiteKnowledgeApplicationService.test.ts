/**
 * Website Knowledge Application Service Integration Tests
 * 
 * AI INSTRUCTIONS:
 * - Test complete crawl workflow integration
 * - Verify request validation and error handling
 * - Test batch website knowledge updates
 * - Follow @golden-rule testing patterns
 * - Mock external dependencies appropriately
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WebsiteKnowledgeApplicationService, WebsiteCrawlRequest, WebsiteKnowledgeUpdateRequest } from '../WebsiteKnowledgeApplicationService';
import { CrawlAndStoreWebsiteUseCase } from '../../use-cases/CrawlAndStoreWebsiteUseCase';
import { TestDataFactory } from '../../../__tests__/test-utilities/TestDataFactory';
import { BusinessRuleViolationError } from '../../../domain/errors/ContextManagementErrors';

// Mock the use case
vi.mock('../../use-cases/CrawlAndStoreWebsiteUseCase');

describe('WebsiteKnowledgeApplicationService Integration Tests', () => {
  let service: WebsiteKnowledgeApplicationService;
  let mockCrawlUseCase: any;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Create mock use case
    mockCrawlUseCase = {
      execute: vi.fn()
    };

    // Create service with mock
    service = new WebsiteKnowledgeApplicationService(mockCrawlUseCase);
  });

  describe('crawlWebsiteSource', () => {
    describe('Successful Crawl Scenarios', () => {
      it('should successfully crawl website and return crawled pages', async () => {
        // Arrange
        const websiteSource = TestDataFactory.createWebsiteSource({
          id: 'source-123',
          url: 'https://example.com',
          name: 'Example Site',
          status: 'pending'
        });

        const request: WebsiteCrawlRequest = {
          organizationId: 'org-123',
          chatbotConfigId: 'config-123',
          websiteSource
        };

        const mockCrawlResult = {
          success: true,
          crawledPages: [
            {
              url: 'https://example.com',
              title: 'Home Page',
              content: 'Welcome to our website',
              depth: 0,
              crawledAt: new Date(),
              status: 'success' as const,
              responseTime: 200,
              statusCode: 200
            },
            {
              url: 'https://example.com/about',
              title: 'About Us',
              content: 'Learn about our company',
              depth: 1,
              crawledAt: new Date(),
              status: 'success' as const,
              responseTime: 150,
              statusCode: 200
            }
          ]
        };

        mockCrawlUseCase.execute.mockResolvedValue(mockCrawlResult);

        // Act
        const result = await service.crawlWebsiteSource(request);

        // Assert
        expect(result.success).toBe(true);
        expect(result.crawledPages).toHaveLength(2);
        expect(result.crawledPages?.[0].url).toBe('https://example.com');
        expect(result.crawledPages?.[1].url).toBe('https://example.com/about');

        // Verify use case was called with correct parameters
        expect(mockCrawlUseCase.execute).toHaveBeenCalledWith(
          'org-123',
          'config-123',
          websiteSource,
          expect.objectContaining({
            maxPages: 50,
            maxDepth: 3,
            respectRobotsTxt: true,
            crawlFrequency: 'manual'
          })
        );
      });

      it('should use custom crawl settings when provided', async () => {
        // Arrange
        const websiteSource = TestDataFactory.createWebsiteSource({
          id: 'source-123',
          url: 'https://example.com',
          crawlSettings: {
            maxPages: 100,
            maxDepth: 5,
            includePatterns: ['/blog/*'],
            excludePatterns: ['/private/*'],
            respectRobotsTxt: false,
            crawlFrequency: 'weekly',
            includeImages: true,
            includePDFs: false
          }
        });

        const request: WebsiteCrawlRequest = {
          organizationId: 'org-123',
          chatbotConfigId: 'config-123',
          websiteSource
        };

        mockCrawlUseCase.execute.mockResolvedValue({
          success: true,
          crawledPages: []
        });

        // Act
        await service.crawlWebsiteSource(request);

        // Assert
        expect(mockCrawlUseCase.execute).toHaveBeenCalledWith(
          'org-123',
          'config-123',
          websiteSource,
          expect.objectContaining({
            maxPages: 100,
            maxDepth: 5,
            includePatterns: ['/blog/*'],
            excludePatterns: ['/private/*'],
            respectRobotsTxt: false,
            crawlFrequency: 'weekly',
            includeImages: true,
            includePDFs: false
          })
        );
      });

      it('should handle progress callback when provided', async () => {
        // Arrange
        const websiteSource = TestDataFactory.createWebsiteSource();
        const progressCallback = vi.fn();

        const request: WebsiteCrawlRequest = {
          organizationId: 'org-123',
          chatbotConfigId: 'config-123',
          websiteSource,
          progressCallback
        };

        mockCrawlUseCase.execute.mockResolvedValue({
          success: true,
          crawledPages: []
        });

        // Act
        await service.crawlWebsiteSource(request);

        // Assert
        expect(mockCrawlUseCase.execute).toHaveBeenCalled();
        // Progress callback handling would be tested in the use case layer
      });
    });

    describe('Error Scenarios', () => {
      it('should handle business rule violation errors', async () => {
        // Arrange
        const websiteSource = TestDataFactory.createWebsiteSource({
          url: 'invalid-url'
        });

        const request: WebsiteCrawlRequest = {
          organizationId: 'org-123',
          chatbotConfigId: 'config-123',
          websiteSource
        };

        const businessError = new BusinessRuleViolationError(
          'Invalid URL format',
          { url: 'invalid-url' }
        );

        mockCrawlUseCase.execute.mockRejectedValue(businessError);

        // Act
        const result = await service.crawlWebsiteSource(request);

        // Assert
        expect(result.success).toBe(false);
        expect(result.error?.code).toBe('BUSINESS_RULE_VIOLATION');
        expect(result.error?.message).toBe('Business rule violated: Invalid URL format');
        expect(result.error?.context).toEqual({ url: 'invalid-url' });
      });

      it('should handle unexpected errors gracefully', async () => {
        // Arrange
        const websiteSource = TestDataFactory.createWebsiteSource();

        const request: WebsiteCrawlRequest = {
          organizationId: 'org-123',
          chatbotConfigId: 'config-123',
          websiteSource
        };

        mockCrawlUseCase.execute.mockRejectedValue(new Error('Network timeout'));

        // Act
        const result = await service.crawlWebsiteSource(request);

        // Assert
        expect(result.success).toBe(false);
        expect(result.error?.code).toBe('WEBSITE_CRAWL_ERROR');
        expect(result.error?.message).toContain('Network timeout');
        expect(result.error?.context?.sourceId).toBe(websiteSource.id);
        expect(result.error?.context?.url).toBe(websiteSource.url);
      });

      it('should validate crawl request parameters', async () => {
        // Arrange
        const invalidRequest: WebsiteCrawlRequest = {
          organizationId: '', // Invalid empty organization ID
          chatbotConfigId: 'config-123',
          websiteSource: TestDataFactory.createWebsiteSource()
        };

        // Act
        const result = await service.crawlWebsiteSource(invalidRequest);

        // Assert
        expect(result.success).toBe(false);
        expect(result.error?.message).toContain('Organization ID is required');

        // Verify use case was not called
        expect(mockCrawlUseCase.execute).not.toHaveBeenCalled();
      });
    });
  });

  describe('updateWebsiteKnowledge', () => {
    describe('Batch Processing', () => {
      it('should successfully process multiple website sources', async () => {
        // Arrange
        const websiteSources = [
          TestDataFactory.createWebsiteSource({
            id: 'source-1',
            url: 'https://example1.com',
            isActive: true
          }),
          TestDataFactory.createWebsiteSource({
            id: 'source-2',
            url: 'https://example2.com',
            isActive: true
          }),
          TestDataFactory.createWebsiteSource({
            id: 'source-3',
            url: 'https://example3.com',
            isActive: false // Inactive source
          })
        ];

        const request: WebsiteKnowledgeUpdateRequest = {
          organizationId: 'org-123',
          chatbotConfigId: 'config-123',
          websiteSources
        };

        // Mock successful crawls for active sources
        mockCrawlUseCase.execute
          .mockResolvedValueOnce({
            success: true,
            crawledPages: [
              { url: 'https://example1.com', status: 'success' as const, title: 'Page 1', content: 'Content 1', depth: 0, crawledAt: new Date() }
            ]
          })
          .mockResolvedValueOnce({
            success: true,
            crawledPages: [
              { url: 'https://example2.com', status: 'success' as const, title: 'Page 2', content: 'Content 2', depth: 0, crawledAt: new Date() }
            ]
          });

        // Act
        const result = await service.updateWebsiteKnowledge(request);

        // Assert
        expect(result.success).toBe(true);
        expect(result.totalSources).toBe(3);
        expect(result.successfulSources).toBe(2);
        expect(result.failedSources).toBe(0);
        expect(result.totalKnowledgeItems).toBe(2);
        expect(result.errors).toHaveLength(0);

        // Verify only active sources were crawled
        expect(mockCrawlUseCase.execute).toHaveBeenCalledTimes(2);
      });

      it('should handle partial failures in batch processing', async () => {
        // Arrange
        const websiteSources = [
          TestDataFactory.createWebsiteSource({
            id: 'source-1',
            url: 'https://example1.com',
            isActive: true
          }),
          TestDataFactory.createWebsiteSource({
            id: 'source-2',
            url: 'https://invalid-url',
            isActive: true
          })
        ];

        const request: WebsiteKnowledgeUpdateRequest = {
          organizationId: 'org-123',
          chatbotConfigId: 'config-123',
          websiteSources
        };

        // Mock one success, one failure
        mockCrawlUseCase.execute
          .mockResolvedValueOnce({
            success: true,
            crawledPages: [
              { url: 'https://example1.com', status: 'success' as const, title: 'Page 1', content: 'Content 1', depth: 0, crawledAt: new Date() }
            ]
          })
          .mockRejectedValueOnce(new Error('Invalid URL'));

        // Act
        const result = await service.updateWebsiteKnowledge(request);

        // Assert
        expect(result.success).toBe(false);
        expect(result.totalSources).toBe(2);
        expect(result.successfulSources).toBe(1);
        expect(result.failedSources).toBe(1);
        expect(result.totalKnowledgeItems).toBe(1);
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0].sourceId).toBe('source-2');
        expect(result.errors[0].error).toContain('Invalid URL');
      });

      it('should process inactive sources when forceRefresh is true', async () => {
        // Arrange
        const websiteSources = [
          TestDataFactory.createWebsiteSource({
            id: 'source-1',
            url: 'https://example.com',
            isActive: false
          })
        ];

        const request: WebsiteKnowledgeUpdateRequest = {
          organizationId: 'org-123',
          chatbotConfigId: 'config-123',
          websiteSources,
          forceRefresh: true
        };

        mockCrawlUseCase.execute.mockResolvedValue({
          success: true,
          crawledPages: [
            { url: 'https://example.com', status: 'success' as const, title: 'Page 1', content: 'Content 1', depth: 0, crawledAt: new Date() }
          ]
        });

        // Act
        const result = await service.updateWebsiteKnowledge(request);

        // Assert
        expect(result.successfulSources).toBe(1);
        expect(mockCrawlUseCase.execute).toHaveBeenCalledTimes(1);
      });
    });

    describe('Request Validation', () => {
      it('should validate update request parameters', async () => {
        // Arrange - create an invalid request that will trigger validation error
        const invalidRequest: WebsiteKnowledgeUpdateRequest = {
          organizationId: '', // Empty org ID should trigger validation error
          chatbotConfigId: 'config-123',
          websiteSources: [TestDataFactory.createWebsiteSource()] // Add at least one source
        };

        // Act & Assert
        await expect(service.updateWebsiteKnowledge(invalidRequest)).rejects.toThrow(BusinessRuleViolationError);
      });
    });
  });

  describe('validateWebsiteSource', () => {
    it('should validate website source correctly', async () => {
      // Arrange
      const validSource = TestDataFactory.createWebsiteSource({
        url: 'https://httpbin.org/get', // Use a reliable test endpoint
        name: 'Test Site'
      });

      // Act
      const result = await service.validateWebsiteSource(validSource);

      // Assert
      // The validation might fail due to network issues, so we check for either success or specific failure
      if (result.isValid) {
        expect(result.errors).toHaveLength(0);
      } else {
        // If validation fails, it should be due to accessibility issues
        expect(result.errors.some(error => error.includes('accessible'))).toBe(true);
      }
      expect(result.warnings).toBeDefined();
    });

    it('should detect invalid website sources', async () => {
      // Arrange
      const invalidSource = TestDataFactory.createWebsiteSource({
        url: 'invalid-url',
        name: ''
      });

      // Act
      const result = await service.validateWebsiteSource(invalidSource);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(error => error.includes('URL'))).toBe(true);
      expect(result.errors.some(error => error.includes('name'))).toBe(true);
    });
  });
}); 