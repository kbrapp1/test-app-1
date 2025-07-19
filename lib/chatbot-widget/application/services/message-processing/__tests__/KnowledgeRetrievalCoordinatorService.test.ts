/**
 * KnowledgeRetrievalCoordinatorService Tests
 * 
 * Critical business logic tests for knowledge retrieval coordination
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { KnowledgeRetrievalCoordinatorService, KnowledgeQueryContext } from '../KnowledgeRetrievalCoordinatorService';
import { IKnowledgeRetrievalService, KnowledgeSearchResult, KnowledgeItem } from '../../../../domain/services/interfaces/IKnowledgeRetrievalService';
import { IntentResult, IntentType } from '../../../../domain/value-objects/message-processing/IntentResult';

describe('KnowledgeRetrievalCoordinatorService', () => {
  let service: KnowledgeRetrievalCoordinatorService;
  let mockKnowledgeService: IKnowledgeRetrievalService;

  const createMockKnowledgeItem = (overrides: Partial<KnowledgeItem> = {}): KnowledgeItem => ({
    id: 'item-1',
    title: 'Test Knowledge',
    content: 'Test content for knowledge base',
    category: 'faq',
    tags: ['test', 'general'],
    relevanceScore: 0.85,
    source: 'test-source',
    lastUpdated: new Date('2023-01-01'),
    ...overrides
  });

  const createMockSearchResult = (items: KnowledgeItem[] = []): KnowledgeSearchResult => ({
    items,
    totalFound: items.length,
    searchQuery: 'test query',
    searchTimeMs: 150
  });

  const createMockIntentResult = (intent: IntentType = 'faq_general', confidence: number = 0.8): IntentResult => {
    return IntentResult.create(
      intent,
      confidence,
      {},
      'Mock intent result',
      {
        model: 'mock-model',
        processingTimeMs: 100,
        alternativeIntents: []
      }
    );
  };

  beforeEach(() => {
    // Create mock knowledge service
    mockKnowledgeService = {
      searchKnowledge: vi.fn(),
      getKnowledgeByCategory: vi.fn(),
      getFrequentlyAskedQuestions: vi.fn(),
      findSimilarContent: vi.fn(),
      getKnowledgeByTags: vi.fn(),
      upsertKnowledgeItem: vi.fn(),
      healthCheck: vi.fn(),
      initializeVectorCacheForSession: vi.fn(),
      isVectorCacheReady: vi.fn()
    };

    service = new KnowledgeRetrievalCoordinatorService(mockKnowledgeService);
  });

  describe('Initialization', () => {
    it('should create service with knowledge retrieval service', () => {
      expect(service).toBeDefined();
      expect(service.isKnowledgeServiceAvailable()).toBe(true);
    });

    it('should create service without knowledge retrieval service', () => {
      const serviceWithoutKnowledge = new KnowledgeRetrievalCoordinatorService();
      expect(serviceWithoutKnowledge).toBeDefined();
      expect(serviceWithoutKnowledge.isKnowledgeServiceAvailable()).toBe(false);
    });

    it('should handle undefined knowledge service', () => {
      const serviceWithUndefined = new KnowledgeRetrievalCoordinatorService(undefined);
      expect(serviceWithUndefined.isKnowledgeServiceAvailable()).toBe(false);
    });
  });

  describe('isKnowledgeServiceAvailable', () => {
    it('should return true when service is available', () => {
      expect(service.isKnowledgeServiceAvailable()).toBe(true);
    });

    it('should return false when service is not available', () => {
      const serviceWithoutKnowledge = new KnowledgeRetrievalCoordinatorService();
      expect(serviceWithoutKnowledge.isKnowledgeServiceAvailable()).toBe(false);
    });
  });

  describe('retrieveKnowledge', () => {
    it('should retrieve knowledge with minimal context', async () => {
      const mockItems = [createMockKnowledgeItem({ relevanceScore: 0.9 })];
      const mockResult = createMockSearchResult(mockItems);
      
      (mockKnowledgeService.searchKnowledge as any).mockResolvedValue(mockResult);

      const result = await service.retrieveKnowledge('test query');

      expect(mockKnowledgeService.searchKnowledge).toHaveBeenCalledWith({
        userQuery: 'test query',
        intentResult: undefined,
        conversationHistory: undefined,
        userPreferences: undefined,
        maxResults: 5,
        minRelevanceScore: 0.5
      });
      expect(result).toEqual(mockItems);
    });

    it('should retrieve knowledge with full context', async () => {
      const intentResult = createMockIntentResult('faq_general', 0.8);
      const conversationHistory = ['Hello', 'How can I help?'];
      const userPreferences = { language: 'en', theme: 'dark' };
      
      const context = {
        intentResult,
        conversationHistory,
        userPreferences,
        maxResults: 10,
        minRelevanceScore: 0.7
      };

      const mockItems = [
        createMockKnowledgeItem({ relevanceScore: 0.9 }),
        createMockKnowledgeItem({ id: 'item-2', relevanceScore: 0.8 })
      ];
      const mockResult = createMockSearchResult(mockItems);
      
      (mockKnowledgeService.searchKnowledge as any).mockResolvedValue(mockResult);

      const result = await service.retrieveKnowledge('test query', context);

      expect(mockKnowledgeService.searchKnowledge).toHaveBeenCalledWith({
        userQuery: 'test query',
        intentResult,
        conversationHistory,
        userPreferences,
        maxResults: 10,
        minRelevanceScore: 0.7
      });
      expect(result).toEqual(mockItems);
    });

    it('should handle default values for missing context properties', async () => {
      const partialContext = {
        intentResult: createMockIntentResult('faq_general', 0.8)
        // Missing other properties
      };

      const mockResult = createMockSearchResult([]);
      (mockKnowledgeService.searchKnowledge as any).mockResolvedValue(mockResult);

      await service.retrieveKnowledge('test query', partialContext);

      expect(mockKnowledgeService.searchKnowledge).toHaveBeenCalledWith({
        userQuery: 'test query',
        intentResult: partialContext.intentResult,
        conversationHistory: undefined,
        userPreferences: undefined,
        maxResults: 5,
        minRelevanceScore: 0.5
      });
    });

    it('should return null when knowledge service is not available', async () => {
      const serviceWithoutKnowledge = new KnowledgeRetrievalCoordinatorService();
      const result = await serviceWithoutKnowledge.retrieveKnowledge('test query');
      expect(result).toBeNull();
    });

    it('should handle empty search results', async () => {
      const mockResult = createMockSearchResult([]);
      (mockKnowledgeService.searchKnowledge as any).mockResolvedValue(mockResult);

      const result = await service.retrieveKnowledge('no results query');

      expect(result).toEqual([]);
    });

    it('should propagate errors from knowledge service', async () => {
      const error = new Error('Knowledge service unavailable');
      (mockKnowledgeService.searchKnowledge as any).mockRejectedValue(error);

      await expect(service.retrieveKnowledge('test query')).rejects.toThrow('Knowledge service unavailable');
    });

    it('should handle type coercion for context properties', async () => {
      const context = {
        maxResults: '8' as any, // Wrong type
        minRelevanceScore: '0.6' as any, // Wrong type
        conversationHistory: 'not an array' as any, // Wrong type
        userPreferences: 'not an object' as any // Wrong type
      };

      const mockResult = createMockSearchResult([]);
      (mockKnowledgeService.searchKnowledge as any).mockResolvedValue(mockResult);

      await service.retrieveKnowledge('test query', context);

      expect(mockKnowledgeService.searchKnowledge).toHaveBeenCalledWith({
        userQuery: 'test query',
        intentResult: undefined,
        conversationHistory: 'not an array',
        userPreferences: 'not an object',
        maxResults: '8', // Should handle coercion gracefully
        minRelevanceScore: '0.6'
      });
    });
  });

  describe('retrieveKnowledgeWithEnhancedContext', () => {
    it('should retrieve knowledge with enhanced context parameters', async () => {
      const conversationHistory = ['Hello', 'What are your pricing plans?', 'Thank you'];
      const userPreferences = { segment: 'enterprise', priority: 'security' };
      const intentResult = createMockIntentResult('faq_pricing', 0.95);

      const mockItems = [
        createMockKnowledgeItem({ 
          category: 'pricing',
          title: 'Enterprise Pricing Plans',
          relevanceScore: 0.95
        })
      ];
      const mockResult = createMockSearchResult(mockItems);
      
      (mockKnowledgeService.searchKnowledge as any).mockResolvedValue(mockResult);

      const result = await service.retrieveKnowledgeWithEnhancedContext(
        'enterprise pricing',
        conversationHistory,
        userPreferences,
        intentResult
      );

      expect(mockKnowledgeService.searchKnowledge).toHaveBeenCalledWith({
        userQuery: 'enterprise pricing',
        intentResult,
        conversationHistory,
        userPreferences,
        maxResults: 10, // Enhanced limit
        minRelevanceScore: 0.3 // Lower threshold for broader results
      });
      expect(result).toEqual(mockItems);
    });

    it('should use enhanced context defaults', async () => {
      const conversationHistory = ['Hello'];
      const userPreferences = {};

      const mockResult = createMockSearchResult([]);
      (mockKnowledgeService.searchKnowledge as any).mockResolvedValue(mockResult);

      await service.retrieveKnowledgeWithEnhancedContext(
        'test query',
        conversationHistory,
        userPreferences
      );

      expect(mockKnowledgeService.searchKnowledge).toHaveBeenCalledWith({
        userQuery: 'test query',
        intentResult: undefined,
        conversationHistory,
        userPreferences,
        maxResults: 10,
        minRelevanceScore: 0.3
      });
    });

    it('should return null when knowledge service is not available', async () => {
      const serviceWithoutKnowledge = new KnowledgeRetrievalCoordinatorService();
      
      const result = await serviceWithoutKnowledge.retrieveKnowledgeWithEnhancedContext(
        'test query',
        ['Hello'],
        {}
      );

      expect(result).toBeNull();
    });

    it('should handle complex conversation history', async () => {
      const longConversationHistory = Array.from({ length: 20 }, (_, i) => 
        `Message ${i + 1}: This is conversation turn ${i + 1}`
      );
      const complexUserPreferences = {
        department: 'engineering',
        role: 'architect',
        experienceLevel: 'senior',
        preferredSources: ['documentation', 'tutorials'],
        languages: ['typescript', 'javascript']
      };

      const mockResult = createMockSearchResult([]);
      (mockKnowledgeService.searchKnowledge as any).mockResolvedValue(mockResult);

      await service.retrieveKnowledgeWithEnhancedContext(
        'complex technical query',
        longConversationHistory,
        complexUserPreferences
      );

      expect(mockKnowledgeService.searchKnowledge).toHaveBeenCalledWith({
        userQuery: 'complex technical query',
        intentResult: undefined,
        conversationHistory: longConversationHistory,
        userPreferences: complexUserPreferences,
        maxResults: 10,
        minRelevanceScore: 0.3
      });
    });

    it('should propagate errors from knowledge service', async () => {
      const error = new Error('Enhanced search failed');
      (mockKnowledgeService.searchKnowledge as any).mockRejectedValue(error);

      await expect(
        service.retrieveKnowledgeWithEnhancedContext('test query', [], {})
      ).rejects.toThrow('Enhanced search failed');
    });

    it('should handle high-relevance results with enhanced context', async () => {
      const highRelevanceItems = [
        createMockKnowledgeItem({ relevanceScore: 0.95, title: 'Perfect Match' }),
        createMockKnowledgeItem({ id: 'item-2', relevanceScore: 0.85, title: 'Good Match' }),
        createMockKnowledgeItem({ id: 'item-3', relevanceScore: 0.35, title: 'Broad Match' }) // This should be included due to lower threshold
      ];
      const mockResult = createMockSearchResult(highRelevanceItems);
      
      (mockKnowledgeService.searchKnowledge as any).mockResolvedValue(mockResult);

      const result = await service.retrieveKnowledgeWithEnhancedContext(
        'specialized query',
        ['Previous context'],
        { specialty: 'advanced' }
      );

      expect(result).toEqual(highRelevanceItems);
      expect(result).toHaveLength(3); // All items should be included with 0.3 threshold
    });
  });

  describe('Context Building Logic', () => {
    it('should build search context with all undefined values', async () => {
      const mockResult = createMockSearchResult([]);
      (mockKnowledgeService.searchKnowledge as any).mockResolvedValue(mockResult);

      await service.retrieveKnowledge('query with no context');

      const expectedContext: KnowledgeQueryContext = {
        userQuery: 'query with no context',
        intentResult: undefined,
        conversationHistory: undefined,
        userPreferences: undefined,
        maxResults: 5,
        minRelevanceScore: 0.5
      };

      expect(mockKnowledgeService.searchKnowledge).toHaveBeenCalledWith(expectedContext);
    });

    it('should preserve all context properties when provided', async () => {
      const fullContext = {
        intentResult: createMockIntentResult('support_request', 0.9),
        conversationHistory: ['Hi', 'I need help', 'With configuration'],
        userPreferences: { 
          theme: 'dark', 
          notifications: true,
          advancedMode: false 
        },
        maxResults: 15,
        minRelevanceScore: 0.8
      };

      const mockResult = createMockSearchResult([]);
      (mockKnowledgeService.searchKnowledge as any).mockResolvedValue(mockResult);

      await service.retrieveKnowledge('comprehensive query', fullContext);

      expect(mockKnowledgeService.searchKnowledge).toHaveBeenCalledWith({
        userQuery: 'comprehensive query',
        ...fullContext
      });
    });

    it('should handle edge cases in context values', async () => {
      const edgeCaseContext = {
        maxResults: 0, // Edge case: zero results - will default to 5 due to falsy check
        minRelevanceScore: 1.0, // Edge case: perfect relevance required
        conversationHistory: [], // Empty array
        userPreferences: {} // Empty object
      };

      const mockResult = createMockSearchResult([]);
      (mockKnowledgeService.searchKnowledge as any).mockResolvedValue(mockResult);

      await service.retrieveKnowledge('edge case query', edgeCaseContext);

      expect(mockKnowledgeService.searchKnowledge).toHaveBeenCalledWith({
        userQuery: 'edge case query',
        intentResult: undefined,
        conversationHistory: [],
        userPreferences: {},
        maxResults: 5, // 0 defaults to 5 due to || operator
        minRelevanceScore: 1.0
      });
    });
  });

  describe('Service Availability and Resilience', () => {
    it('should gracefully handle null knowledge service in all methods', async () => {
      const serviceWithNull = new KnowledgeRetrievalCoordinatorService(null as any);

      expect(serviceWithNull.isKnowledgeServiceAvailable()).toBe(false);
      expect(await serviceWithNull.retrieveKnowledge('test')).toBeNull();
      expect(await serviceWithNull.retrieveKnowledgeWithEnhancedContext('test', [], {})).toBeNull();
    });

    it('should handle knowledge service becoming unavailable during operation', async () => {
      // Simulate service becoming unavailable
      (mockKnowledgeService.searchKnowledge as any).mockRejectedValue(
        new Error('Service temporarily unavailable')
      );

      await expect(service.retrieveKnowledge('test query')).rejects.toThrow('Service temporarily unavailable');
    });

    it('should maintain consistent availability checks', () => {
      // Multiple calls should return consistent results
      expect(service.isKnowledgeServiceAvailable()).toBe(true);
      expect(service.isKnowledgeServiceAvailable()).toBe(true);
      expect(service.isKnowledgeServiceAvailable()).toBe(true);
    });
  });

  describe('Performance and Resource Management', () => {
    it('should not cache results between calls', async () => {
      const mockResult1 = createMockSearchResult([createMockKnowledgeItem({ id: 'item-1' })]);
      const mockResult2 = createMockSearchResult([createMockKnowledgeItem({ id: 'item-2' })]);

      (mockKnowledgeService.searchKnowledge as any)
        .mockResolvedValueOnce(mockResult1)
        .mockResolvedValueOnce(mockResult2);

      const result1 = await service.retrieveKnowledge('query 1');
      const result2 = await service.retrieveKnowledge('query 1'); // Same query

      expect(result1).toEqual(mockResult1.items);
      expect(result2).toEqual(mockResult2.items);
      expect(mockKnowledgeService.searchKnowledge).toHaveBeenCalledTimes(2);
    });

    it('should handle concurrent knowledge retrieval requests', async () => {
      const mockResult1 = createMockSearchResult([createMockKnowledgeItem({ id: 'concurrent-1' })]);
      const mockResult2 = createMockSearchResult([createMockKnowledgeItem({ id: 'concurrent-2' })]);

      (mockKnowledgeService.searchKnowledge as any)
        .mockImplementation(async (context: KnowledgeQueryContext) => {
          // Simulate different response times
          await new Promise(resolve => setTimeout(resolve, context.userQuery === 'fast' ? 10 : 50));
          return context.userQuery === 'fast' ? mockResult1 : mockResult2;
        });

      const [result1, result2] = await Promise.all([
        service.retrieveKnowledge('fast'),
        service.retrieveKnowledge('slow')
      ]);

      expect(result1).toEqual(mockResult1.items);
      expect(result2).toEqual(mockResult2.items);
      expect(mockKnowledgeService.searchKnowledge).toHaveBeenCalledTimes(2);
    });
  });
});