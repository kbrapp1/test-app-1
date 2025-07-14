/**
 * Website Knowledge Application Service Tests
 * 
 * AI INSTRUCTIONS:
 * - Test orchestration service with mocked dependencies
 * - Verify proper delegation to specialized services
 * - Test error handling and validation
 * - Follow @golden-rule testing patterns
 * - Mock all external dependencies appropriately
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WebsiteKnowledgeApplicationService } from '../WebsiteKnowledgeApplicationService';
import { CrawlOrchestrationService as _CrawlOrchestrationService } from '../CrawlOrchestrationService';
import { BatchProcessingService as _BatchProcessingService } from '../BatchProcessingService';
import { CrawledPagesQueryService as _CrawledPagesQueryService } from '../CrawledPagesQueryService';
import { WebsiteValidationService as _WebsiteValidationService } from '../WebsiteValidationService';
import { TestDataFactory } from '../../../__tests__/test-utilities/TestDataFactory';
import { BusinessRuleViolationError } from '../../../domain/errors/ChatbotWidgetDomainErrors';

// Mock all specialized services
vi.mock('../CrawlOrchestrationService');
vi.mock('../BatchProcessingService');
vi.mock('../CrawledPagesQueryService');
vi.mock('../WebsiteValidationService');

describe('WebsiteKnowledgeApplicationService', () => {
  let service: WebsiteKnowledgeApplicationService;
  let mockCrawlOrchestrationService: any;
  let mockBatchProcessingService: any;
  let mockCrawledPagesQueryService: any;
  let mockValidationService: any;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Create mock services
    mockCrawlOrchestrationService = {
      crawlWebsiteSource: vi.fn()
    };

    mockBatchProcessingService = {
      updateWebsiteKnowledge: vi.fn()
    };

    mockCrawledPagesQueryService = {
      getCrawledPages: vi.fn()
    };

    mockValidationService = {
      validateWebsiteSource: vi.fn()
    };

    // Create service with mocked dependencies
    service = new WebsiteKnowledgeApplicationService(
      mockCrawlOrchestrationService,
      mockBatchProcessingService,
      mockCrawledPagesQueryService,
      mockValidationService
    );
  });

  describe('crawlWebsiteSource', () => {
    it('should delegate to crawl orchestration service', async () => {
      // Arrange
      const websiteSource = TestDataFactory.createWebsiteSource({
        id: 'source-123',
        url: 'https://example.com',
        name: 'Example Site'
      });

      const request = {
        organizationId: 'org-123',
        chatbotConfigId: 'config-123',
        websiteSource
      };

      const expectedResult = {
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
          }
        ]
      };

      mockCrawlOrchestrationService.crawlWebsiteSource.mockResolvedValue(expectedResult);

      // Act
      const result = await service.crawlWebsiteSource(request);

      // Assert
      expect(mockCrawlOrchestrationService.crawlWebsiteSource).toHaveBeenCalledWith(request);
      expect(result).toEqual(expectedResult);
    });

    it('should handle errors from crawl orchestration service', async () => {
      // Arrange
      const websiteSource = TestDataFactory.createWebsiteSource();
      const request = {
        organizationId: 'org-123',
        chatbotConfigId: 'config-123',
        websiteSource
      };

      const error = new BusinessRuleViolationError('Invalid URL format', {});
      mockCrawlOrchestrationService.crawlWebsiteSource.mockRejectedValue(error);

      // Act & Assert
      await expect(service.crawlWebsiteSource(request)).rejects.toThrow(BusinessRuleViolationError);
      expect(mockCrawlOrchestrationService.crawlWebsiteSource).toHaveBeenCalledWith(request);
    });
  });

  describe('updateWebsiteKnowledge', () => {
    it('should delegate to batch processing service', async () => {
      // Arrange
      const websiteSources = [
        TestDataFactory.createWebsiteSource({
          id: 'source-1',
          url: 'https://example1.com'
        }),
        TestDataFactory.createWebsiteSource({
          id: 'source-2',
          url: 'https://example2.com'
        })
      ];

      const request = {
        organizationId: 'org-123',
        chatbotConfigId: 'config-123',
        websiteSources
      };

      const expectedResult = {
        success: true,
        totalSources: 2,
        successfulSources: 2,
        failedSources: 0,
        totalKnowledgeItems: 5,
        errors: []
      };

      mockBatchProcessingService.updateWebsiteKnowledge.mockResolvedValue(expectedResult);

      // Act
      const result = await service.updateWebsiteKnowledge(request);

      // Assert
      expect(mockBatchProcessingService.updateWebsiteKnowledge).toHaveBeenCalledWith(request);
      expect(result).toEqual(expectedResult);
    });

    it('should handle errors from batch processing service', async () => {
      // Arrange
      const request = {
        organizationId: 'org-123',
        chatbotConfigId: 'config-123',
        websiteSources: [TestDataFactory.createWebsiteSource()]
      };

      const error = new BusinessRuleViolationError('Invalid batch request', {});
      mockBatchProcessingService.updateWebsiteKnowledge.mockRejectedValue(error);

      // Act & Assert
      await expect(service.updateWebsiteKnowledge(request)).rejects.toThrow(BusinessRuleViolationError);
      expect(mockBatchProcessingService.updateWebsiteKnowledge).toHaveBeenCalledWith(request);
    });
  });

  describe('getCrawledPages', () => {
    it('should delegate to crawled pages query service', async () => {
      // Arrange
      const organizationId = 'org-123';
      const chatbotConfigId = 'config-123';
      const sourceUrl = 'https://example.com';

      const expectedResult = {
        success: true,
        pages: [
          {
            url: 'https://example.com',
            title: 'Home Page',
            content: 'Welcome to our website',
            depth: 0,
            crawledAt: new Date(),
            status: 'success' as const,
            responseTime: 200,
            statusCode: 200
          }
        ],
        totalCount: 1,
        hasMore: false,
        statistics: {
          totalPages: 1,
          successfulPages: 1,
          failedPages: 0,
          averageResponseTime: 200
        }
      };

      mockCrawledPagesQueryService.getCrawledPages.mockResolvedValue(expectedResult);

      // Act
      const result = await service.getCrawledPages(organizationId, chatbotConfigId, sourceUrl);

      // Assert
      expect(mockCrawledPagesQueryService.getCrawledPages).toHaveBeenCalledWith({
        organizationId,
        chatbotConfigId,
        sourceUrl
      });
      expect(result).toEqual(expectedResult);
    });

    it('should handle errors from crawled pages query service', async () => {
      // Arrange
      const organizationId = 'org-123';
      const chatbotConfigId = 'config-123';
      const sourceUrl = 'https://example.com';

      const error = new BusinessRuleViolationError('Invalid query parameters', {});
      mockCrawledPagesQueryService.getCrawledPages.mockRejectedValue(error);

      // Act & Assert
      await expect(service.getCrawledPages(organizationId, chatbotConfigId, sourceUrl)).rejects.toThrow(BusinessRuleViolationError);
      expect(mockCrawledPagesQueryService.getCrawledPages).toHaveBeenCalledWith({
        organizationId,
        chatbotConfigId,
        sourceUrl
      });
    });
  });

  describe('validateWebsiteSource', () => {
    it('should delegate to validation service', async () => {
      // Arrange
      const websiteSource = TestDataFactory.createWebsiteSource({
        url: 'https://example.com',
        name: 'Example Site'
      });

      const expectedResult = {
        isValid: true,
        errors: [],
        warnings: ['Consider adding more specific include patterns']
      };

      mockValidationService.validateWebsiteSource.mockResolvedValue(expectedResult);

      // Act
      const result = await service.validateWebsiteSource(websiteSource);

      // Assert
      expect(mockValidationService.validateWebsiteSource).toHaveBeenCalledWith(websiteSource);
      expect(result).toEqual(expectedResult);
    });

    it('should handle validation errors', async () => {
      // Arrange
      const websiteSource = TestDataFactory.createWebsiteSource({
        url: 'invalid-url',
        name: ''
      });

      const expectedResult = {
        isValid: false,
        errors: ['Invalid URL format', 'Name is required'],
        warnings: []
      };

      mockValidationService.validateWebsiteSource.mockResolvedValue(expectedResult);

      // Act
      const result = await service.validateWebsiteSource(websiteSource);

      // Assert
      expect(mockValidationService.validateWebsiteSource).toHaveBeenCalledWith(websiteSource);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('Service Integration', () => {
    it('should maintain proper service dependencies', () => {
      // Arrange & Act
      const serviceInstance = new WebsiteKnowledgeApplicationService(
        mockCrawlOrchestrationService,
        mockBatchProcessingService,
        mockCrawledPagesQueryService,
        mockValidationService
      );

      // Assert
      expect(serviceInstance).toBeInstanceOf(WebsiteKnowledgeApplicationService);
      // Verify the service is properly constructed with all dependencies
      expect(serviceInstance.crawlWebsiteSource).toBeDefined();
      expect(serviceInstance.updateWebsiteKnowledge).toBeDefined();
      expect(serviceInstance.getCrawledPages).toBeDefined();
      expect(serviceInstance.validateWebsiteSource).toBeDefined();
    });

         it('should handle service initialization with null dependencies', async () => {
       // Arrange & Act
       const serviceWithNullDep = new WebsiteKnowledgeApplicationService(
         null as any,
         mockBatchProcessingService,
         mockCrawledPagesQueryService,
         mockValidationService
       );

       // Assert - service should be created but will fail when methods are called
       expect(serviceWithNullDep).toBeInstanceOf(WebsiteKnowledgeApplicationService);
       
       // Verify that calling a method with null dependency would fail
       await expect(async () => {
         await serviceWithNullDep.crawlWebsiteSource({
           organizationId: 'test',
           chatbotConfigId: 'test',
           websiteSource: TestDataFactory.createWebsiteSource()
         });
       }).rejects.toThrow();
     });
  });

  describe('Error Handling', () => {
    it('should propagate domain errors from services', async () => {
      // Arrange
      const websiteSource = TestDataFactory.createWebsiteSource();
      const request = {
        organizationId: 'org-123',
        chatbotConfigId: 'config-123',
        websiteSource
      };

      const domainError = new BusinessRuleViolationError(
        'Website source validation failed',
        { sourceId: websiteSource.id }
      );

      mockCrawlOrchestrationService.crawlWebsiteSource.mockRejectedValue(domainError);

             // Act & Assert
       await expect(service.crawlWebsiteSource(request)).rejects.toThrow(BusinessRuleViolationError);
       await expect(service.crawlWebsiteSource(request)).rejects.toThrow('Website source validation failed');
    });

    it('should handle unexpected service errors gracefully', async () => {
      // Arrange
      const request = {
        organizationId: 'org-123',
        chatbotConfigId: 'config-123',
        websiteSources: [TestDataFactory.createWebsiteSource()]
      };

      const unexpectedError = new Error('Unexpected service error');
      mockBatchProcessingService.updateWebsiteKnowledge.mockRejectedValue(unexpectedError);

      // Act & Assert
      await expect(service.updateWebsiteKnowledge(request)).rejects.toThrow('Unexpected service error');
    });
  });
}); 