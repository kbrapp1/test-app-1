/**
 * Vector Knowledge Retrieval Application Service Tests
 * 
 * These tests focus on preventing regressions in critical knowledge search functionality.
 * Tests cover error scenarios that were causing production issues.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BusinessRuleViolationError } from '../../../domain/errors/ChatbotWidgetDomainErrors';
import { KnowledgeRetrievalContext, KnowledgeSearchResult } from '../../../domain/services/interfaces/IKnowledgeRetrievalService';
import { VectorKnowledgeRetrievalApplicationService } from '../VectorKnowledgeRetrievalApplicationService';

// Mock dependencies
const mockVectorRepository = {
  storeKnowledgeItems: vi.fn(),
  searchKnowledgeItems: vi.fn(),
  getAllKnowledgeVectors: vi.fn(),
  deleteKnowledgeItemsBySource: vi.fn(),
};

const mockEmbeddingService = {
  generateEmbedding: vi.fn(),
  setLogContext: vi.fn(),
};

const mockOrganizationId = 'org-123';
const mockChatbotConfigId = 'config-456';

describe('VectorKnowledgeRetrievalApplicationService', () => {
  let service: VectorKnowledgeRetrievalApplicationService;

  beforeEach(() => {
    vi.clearAllMocks();
    
    service = new VectorKnowledgeRetrievalApplicationService(
      mockVectorRepository as any,
      mockEmbeddingService as any,
      mockOrganizationId,
      mockChatbotConfigId
    );
  });

  describe('Cache Initialization Edge Cases', () => {
    it('should handle cache initialization with proper log file from context', async () => {
      // Arrange: Mock internal services 
      const mockCacheService = {
        isReady: vi.fn().mockReturnValue(false),
        initializeForSession: vi.fn().mockResolvedValue(undefined)
      };
      const mockSearchService = {
        executeSearch: vi.fn().mockResolvedValue({
          result: { items: [], totalFound: 0, searchQuery: 'test', searchTimeMs: 100 }
        })
      };
      
      // Access private services via reflection for testing
      (service as any).cacheInitializationService = mockCacheService;
      (service as any).searchExecutionService = mockSearchService;

      const context: KnowledgeRetrievalContext = {
        userQuery: 'test query',
        sharedLogFile: 'shared-log-file.log',
        maxResults: 5,
        minRelevanceScore: 0.15
      };

      // Act
      await service.searchKnowledge(context);

      // Assert: Should use the shared log file from context
      expect(mockCacheService.initializeForSession).toHaveBeenCalledWith('shared-log-file.log');
    });

    it('should provide fallback log file when context has no shared log file', async () => {
      // Arrange: Mock internal services
      const mockCacheService = {
        isReady: vi.fn().mockReturnValue(false),
        initializeForSession: vi.fn().mockResolvedValue(undefined)
      };
      const mockSearchService = {
        executeSearch: vi.fn().mockResolvedValue({
          result: { items: [], totalFound: 0, searchQuery: 'test', searchTimeMs: 100 }
        })
      };
      
      (service as any).cacheInitializationService = mockCacheService;
      (service as any).searchExecutionService = mockSearchService;

      const context: KnowledgeRetrievalContext = {
        userQuery: 'test query',
        // sharedLogFile is undefined
        maxResults: 5,
        minRelevanceScore: 0.15
      };

      // Act
      await service.searchKnowledge(context);

      // Assert: Should use fallback log file
      expect(mockCacheService.initializeForSession).toHaveBeenCalledWith('fallback-cache-init.log');
    });

    it('should not initialize cache when already ready', async () => {
      // Arrange: Mock internal services
      const mockCacheService = {
        isReady: vi.fn().mockReturnValue(true),
        initializeForSession: vi.fn()
      };
      const mockSearchService = {
        executeSearch: vi.fn().mockResolvedValue({
          result: { items: [], totalFound: 0, searchQuery: 'test', searchTimeMs: 100 }
        })
      };
      
      (service as any).cacheInitializationService = mockCacheService;
      (service as any).searchExecutionService = mockSearchService;

      const context: KnowledgeRetrievalContext = {
        userQuery: 'test query',
        sharedLogFile: 'shared-log-file.log'
      };

      // Act
      await service.searchKnowledge(context);

      // Assert: Should not call cache initialization
      expect(mockCacheService.initializeForSession).not.toHaveBeenCalled();
    });

    it('should handle cache initialization failure gracefully', async () => {
      // Arrange: Mock cache initialization failure
      const mockCacheService = {
        isReady: vi.fn().mockReturnValue(false),
        initializeForSession: vi.fn().mockRejectedValue(new Error('Cache initialization failed'))
      };
      
      (service as any).cacheInitializationService = mockCacheService;

      const context: KnowledgeRetrievalContext = {
        userQuery: 'test query',
        sharedLogFile: 'shared-log-file.log'
      };

      // Act & Assert: Should wrap error properly
      await expect(service.searchKnowledge(context)).rejects.toThrow(BusinessRuleViolationError);
      await expect(service.searchKnowledge(context)).rejects.toThrow('Knowledge search failed - application service error');
    });
  });

  describe('Error Handling and Propagation', () => {
    beforeEach(() => {
      // Setup cache as ready to isolate error handling
      const mockCacheService = {
        isReady: vi.fn().mockReturnValue(true)
      };
      (service as any).cacheInitializationService = mockCacheService;
    });

    it('should wrap non-domain errors with application service error', async () => {
      // Arrange: Mock search execution failure
      const mockSearchService = {
        executeSearch: vi.fn().mockRejectedValue(new Error('Network connection failed'))
      };
      (service as any).searchExecutionService = mockSearchService;

      const context: KnowledgeRetrievalContext = {
        userQuery: 'test query',
        sharedLogFile: 'shared-log-file.log'
      };

      // Act & Assert: Should wrap with application service error
      await expect(service.searchKnowledge(context)).rejects.toThrow(BusinessRuleViolationError);
      await expect(service.searchKnowledge(context)).rejects.toThrow('Knowledge search failed - application service error');
    });

    it('should include error context in wrapped errors', async () => {
      // Arrange: Mock search execution failure
      const mockSearchService = {
        executeSearch: vi.fn().mockRejectedValue(new Error('Network connection failed'))
      };
      (service as any).searchExecutionService = mockSearchService;

      const context: KnowledgeRetrievalContext = {
        userQuery: 'How did you help Dominos?',
        sharedLogFile: 'shared-log-file.log'
      };

      // Act & Assert: Should include context in error
      try {
        await service.searchKnowledge(context);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(BusinessRuleViolationError);
        const businessError = error as BusinessRuleViolationError;
        expect(businessError.context).toMatchObject({
          error: 'Network connection failed',
          organizationId: mockOrganizationId,
          chatbotConfigId: mockChatbotConfigId,
          userQuery: 'How did you help Dominos?'
        });
      }
    });
  });

  describe('Knowledge Search Workflow', () => {
    beforeEach(() => {
      const mockCacheService = {
        isReady: vi.fn().mockReturnValue(true)
      };
      (service as any).cacheInitializationService = mockCacheService;
    });

    it('should complete successful knowledge search workflow', async () => {
      // Arrange: Create proper KnowledgeItem with all required fields
      const mockSearchResult: KnowledgeSearchResult = {
        items: [
          {
            id: 'kb-1',
            title: 'Dominos Case Study',
            content: 'We helped Dominos increase conversion by 40%',
            category: 'general' as const,
            tags: ['case-study', 'dominos'],
            relevanceScore: 0.85,
            source: 'case-studies',
            lastUpdated: new Date('2024-01-01')
          }
        ],
        totalFound: 1,
        searchQuery: 'How did you help Dominos?',
        searchTimeMs: 150
      };

      const mockSearchService = {
        executeSearch: vi.fn().mockResolvedValue({
          result: mockSearchResult,
          metrics: { embeddingTimeMs: 50, searchTimeMs: 100, totalTimeMs: 150 }
        })
      };
      (service as any).searchExecutionService = mockSearchService;

      const context: KnowledgeRetrievalContext = {
        userQuery: 'How did you help Dominos?',
        sharedLogFile: 'shared-log-file.log',
        maxResults: 5,
        minRelevanceScore: 0.15
      };

      // Act
      const result = await service.searchKnowledge(context);

      // Assert: Should complete workflow successfully
      expect(mockSearchService.executeSearch).toHaveBeenCalledWith(
        context,
        expect.any(Object) // Logger object
      );
      expect(result).toEqual(mockSearchResult);
    });

    it('should validate search results after execution', async () => {
      // Arrange: Mock result with invalid relevance score
      const mockSearchResult: KnowledgeSearchResult = {
        items: [{ 
          id: 'kb-1', 
          title: 'Test', 
          content: 'Test', 
          category: 'general' as const,
          tags: [],
          relevanceScore: 1.5, // Invalid score > 1
          source: 'test',
          lastUpdated: new Date()
        }],
        totalFound: 1,
        searchQuery: 'test',
        searchTimeMs: 100
      };

      const mockSearchService = {
        executeSearch: vi.fn().mockResolvedValue({
          result: mockSearchResult
        })
      };
      (service as any).searchExecutionService = mockSearchService;

      // Mock domain service validation to throw error
      const mockDomainService = {
        validateSearchContext: vi.fn(),
        validateSearchResults: vi.fn().mockImplementation(() => {
          throw new BusinessRuleViolationError('Invalid relevance scores in search results');
        })
      };
      (service as any).domainService = mockDomainService;

      const context: KnowledgeRetrievalContext = {
        userQuery: 'test query',
        sharedLogFile: 'shared-log-file.log'
      };

      // Act & Assert: Should propagate validation error
      await expect(service.searchKnowledge(context)).rejects.toThrow('Invalid relevance scores in search results');
    });
  });

  describe('initializeVectorCacheForSession', () => {
    it('should handle undefined shared log file in cache initialization', async () => {
      // Arrange: Mock cache service
      const mockCacheService = {
        initializeForSession: vi.fn().mockResolvedValue(undefined)
      };
      (service as any).cacheInitializationService = mockCacheService;

      // Act: Call without shared log file
      await service.initializeVectorCacheForSession();

      // Assert: Should use fallback log file
      expect(mockCacheService.initializeForSession).toHaveBeenCalledWith('fallback-cache-init.log');
    });

    it('should use provided shared log file in cache initialization', async () => {
      // Arrange: Mock cache service
      const mockCacheService = {
        initializeForSession: vi.fn().mockResolvedValue(undefined)
      };
      (service as any).cacheInitializationService = mockCacheService;

      // Act: Call with shared log file
      await service.initializeVectorCacheForSession('custom-log.log');

      // Assert: Should use provided log file
      expect(mockCacheService.initializeForSession).toHaveBeenCalledWith('custom-log.log');
    });

    it('should propagate cache initialization errors', async () => {
      // Arrange: Mock cache service failure
      const mockCacheService = {
        initializeForSession: vi.fn().mockRejectedValue(new Error('Cache initialization failed'))
      };
      (service as any).cacheInitializationService = mockCacheService;

      // Act & Assert: Should propagate error
      await expect(service.initializeVectorCacheForSession('test.log')).rejects.toThrow('Cache initialization failed');
    });
  });
}); 