/**
 * ConversationEnhancedAnalysisService Tests
 * 
 * Tests the enhanced analysis service that coordinates:
 * - Intent classification
 * - Knowledge retrieval (vector embeddings pipeline)
 * - Parallel processing optimization
 * - Error handling for optional services
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ConversationEnhancedAnalysisService } from '../ConversationEnhancedAnalysisService';
import { ContextAnalysis } from '../../../value-objects/message-processing/ContextAnalysis';
import { ChatMessage } from '../../../entities/ChatMessage';
import { ChatbotConfig } from '../../../entities/ChatbotConfig';
import { ChatSession } from '../../../entities/ChatSession';
import { IntentResult } from '../../../value-objects/message-processing/IntentResult';
import { IIntentClassificationService } from '../../interfaces/IIntentClassificationService';
import { IKnowledgeRetrievalService, KnowledgeRetrievalContext } from '../../interfaces/IKnowledgeRetrievalService';

describe('ConversationEnhancedAnalysisService', () => {
  let service: ConversationEnhancedAnalysisService;
  let mockIntentService: IIntentClassificationService;
  let mockKnowledgeService: IKnowledgeRetrievalService;
  let baseAnalysis: ContextAnalysis;
  let messages: ChatMessage[];
  let chatbotConfig: ChatbotConfig;
  let session: ChatSession;

  beforeEach(() => {
    // Mock intent classification service
    mockIntentService = {
      classifyIntent: vi.fn()
    };

    // Mock knowledge retrieval service
    mockKnowledgeService = {
      searchKnowledge: vi.fn(),
      getKnowledgeByCategory: vi.fn(),
      getFrequentlyAskedQuestions: vi.fn(),
      findSimilarContent: vi.fn(),
      getKnowledgeByTags: vi.fn(),
      upsertKnowledgeItem: vi.fn(),
      healthCheck: vi.fn()
    } as any;

    // Create base analysis
    baseAnalysis = {
      topics: ['pricing'],
      interests: ['pricing', 'service'],
      sentiment: 'positive',
      engagementLevel: 'high',
      userIntent: 'pricing inquiry',
      urgency: 'medium',
      conversationStage: 'discovery',
      intentResult: undefined,
      relevantKnowledge: undefined,
      knowledgeRetrievalThreshold: 0.15
    };

    // Create test messages
    messages = [
      {
        id: 'msg-1',
        content: 'Hello',
        isFromUser: () => true,
        timestamp: new Date('2024-01-01T10:00:00Z')
      } as ChatMessage,
      {
        id: 'msg-2',
        content: 'Hi there! How can I help you?',
        isFromUser: () => false,
        timestamp: new Date('2024-01-01T10:01:00Z')
      } as ChatMessage,
      {
        id: 'msg-3',
        content: 'I need help with pricing information',
        isFromUser: () => true,
        timestamp: new Date('2024-01-01T10:02:00Z')
      } as ChatMessage
    ];

    // Create mock config and session
    chatbotConfig = { id: 'config-1' } as ChatbotConfig;
    session = { id: 'session-1' } as ChatSession;

    service = new ConversationEnhancedAnalysisService(
      mockIntentService,
      mockKnowledgeService
    );
  });

  describe('Basic Enhancement', () => {
    it('should return base analysis when no user messages exist', async () => {
      const botOnlyMessages = messages.filter(m => !m.isFromUser());
      
      const result = await service.enhanceAnalysis(
        baseAnalysis,
        botOnlyMessages,
        chatbotConfig,
        session
      );

      expect(result).toEqual(baseAnalysis);
      expect(mockIntentService.classifyIntent).not.toHaveBeenCalled();
      expect(mockKnowledgeService.searchKnowledge).not.toHaveBeenCalled();
    });

    it('should return base analysis when messages array is empty', async () => {
      const result = await service.enhanceAnalysis(
        baseAnalysis,
        [],
        chatbotConfig,
        session
      );

      expect(result).toEqual(baseAnalysis);
      expect(mockIntentService.classifyIntent).not.toHaveBeenCalled();
      expect(mockKnowledgeService.searchKnowledge).not.toHaveBeenCalled();
    });
  });

  describe('Intent Classification', () => {
    it('should classify intent when service is available', async () => {
      const mockIntentResult = IntentResult.create(
        'faq_pricing',
        0.85,
        { budget: 'premium' },
        'User asking about pricing',
        { model: 'test', processingTimeMs: 100, alternativeIntents: [] }
      );

      (mockIntentService.classifyIntent as any).mockResolvedValue(mockIntentResult);
      (mockKnowledgeService.searchKnowledge as any).mockResolvedValue({ items: [] });

      const result = await service.enhanceAnalysis(
        baseAnalysis,
        messages,
        chatbotConfig,
        session
      );

      expect(result.intentResult).toEqual(mockIntentResult);
      expect(mockIntentService.classifyIntent).toHaveBeenCalledWith(
        'I need help with pricing information',
        {
          chatbotConfig,
          session,
          messageHistory: messages.slice(-5),
          currentMessage: 'I need help with pricing information'
        }
      );
    });

    it('should handle intent classification errors gracefully', async () => {
      (mockIntentService.classifyIntent as any).mockRejectedValue(new Error('Intent service unavailable'));
      (mockKnowledgeService.searchKnowledge as any).mockResolvedValue({ items: [] });

      const result = await service.enhanceAnalysis(
        baseAnalysis,
        messages,
        chatbotConfig,
        session
      );

      expect(result.intentResult).toBeUndefined();
      expect(result.relevantKnowledge).toEqual([]);
    });

    it('should skip intent classification when service is not provided', async () => {
      service = new ConversationEnhancedAnalysisService(
        undefined,
        mockKnowledgeService
      );

      (mockKnowledgeService.searchKnowledge as any).mockResolvedValue({ items: [] });

      const result = await service.enhanceAnalysis(
        baseAnalysis,
        messages,
        chatbotConfig,
        session
      );

      expect(result.intentResult).toBeUndefined();
      expect(mockIntentService.classifyIntent).not.toHaveBeenCalled();
    });

    it('should skip intent classification when config or session is missing', async () => {
      (mockKnowledgeService.searchKnowledge as any).mockResolvedValue({ items: [] });

      const result = await service.enhanceAnalysis(
        baseAnalysis,
        messages,
        undefined, // No config
        session
      );

      expect(result.intentResult).toBeUndefined();
      expect(mockIntentService.classifyIntent).not.toHaveBeenCalled();
    });
  });

  describe('Knowledge Retrieval', () => {
    it('should retrieve relevant knowledge when service is available', async () => {
      const mockKnowledgeItems = [
        {
          id: 'kb-1',
          title: 'Pricing Plans',
          content: 'Our pricing plans include basic, premium, and enterprise options.',
          relevanceScore: 0.85
        },
        {
          id: 'kb-2',
          title: 'Feature Comparison',
          content: 'Compare features across all our plans.',
          relevanceScore: 0.75
        }
      ];

      (mockIntentService.classifyIntent as any).mockResolvedValue(undefined);
      (mockKnowledgeService.searchKnowledge as any).mockResolvedValue({
        items: mockKnowledgeItems
      });

      const result = await service.enhanceAnalysis(
        baseAnalysis,
        messages,
        chatbotConfig,
        session
      );

      expect(result.relevantKnowledge).toEqual(mockKnowledgeItems);
      expect(result.knowledgeRetrievalThreshold).toBe(0.15);
      expect(mockKnowledgeService.searchKnowledge).toHaveBeenCalledWith({
        userQuery: 'I need help with pricing information',
        intentResult: undefined,
        conversationHistory: ['Hello', 'I need help with pricing information'],
        maxResults: 7,
        minRelevanceScore: 0.15,
        sharedLogFile: undefined
      });
    });

    it('should handle knowledge retrieval errors gracefully', async () => {
      (mockIntentService.classifyIntent as any).mockResolvedValue(undefined);
      (mockKnowledgeService.searchKnowledge as any).mockRejectedValue(new Error('Knowledge service unavailable'));

      const result = await service.enhanceAnalysis(
        baseAnalysis,
        messages,
        chatbotConfig,
        session
      );

      expect(result.relevantKnowledge).toBeUndefined();
      expect(result.intentResult).toBeUndefined();
    });

    it('should skip knowledge retrieval when service is not provided', async () => {
      service = new ConversationEnhancedAnalysisService(
        mockIntentService,
        undefined
      );

      (mockIntentService.classifyIntent as any).mockResolvedValue(undefined);

      const result = await service.enhanceAnalysis(
        baseAnalysis,
        messages,
        chatbotConfig,
        session
      );

      expect(result.relevantKnowledge).toBeUndefined();
      expect(mockKnowledgeService.searchKnowledge).not.toHaveBeenCalled();
    });

    it('should use conversation history in knowledge retrieval', async () => {
      const moreMessages = [
        ...messages,
        {
          id: 'msg-4',
          content: 'What about enterprise features?',
          isFromUser: () => true,
          timestamp: new Date('2024-01-01T10:03:00Z')
        } as ChatMessage,
        {
          id: 'msg-5',
          content: 'Can you tell me about volume discounts?',
          isFromUser: () => true,
          timestamp: new Date('2024-01-01T10:04:00Z')
        } as ChatMessage
      ];

      (mockIntentService.classifyIntent as any).mockResolvedValue(undefined);
      (mockKnowledgeService.searchKnowledge as any).mockResolvedValue({ items: [] });

      await service.enhanceAnalysis(
        baseAnalysis,
        moreMessages,
        chatbotConfig,
        session
      );

      expect(mockKnowledgeService.searchKnowledge).toHaveBeenCalledWith(
        expect.objectContaining({
          conversationHistory: [
            'I need help with pricing information',
            'What about enterprise features?',
            'Can you tell me about volume discounts?'
          ]
        })
      );
    });

    it('should pass shared log file to knowledge retrieval', async () => {
      const sharedLogFile = '/tmp/chat-log.txt';

      (mockIntentService.classifyIntent as any).mockResolvedValue(undefined);
      (mockKnowledgeService.searchKnowledge as any).mockResolvedValue({ items: [] });

      await service.enhanceAnalysis(
        baseAnalysis,
        messages,
        chatbotConfig,
        session,
        sharedLogFile
      );

      expect(mockKnowledgeService.searchKnowledge).toHaveBeenCalledWith(
        expect.objectContaining({
          sharedLogFile
        })
      );
    });
  });

  describe('Parallel Processing', () => {
    it('should run intent classification and knowledge retrieval in parallel', async () => {
      const mockIntentResult = IntentResult.create(
        'faq_pricing',
        0.85,
        {},
        'User asking about pricing',
        { model: 'test', processingTimeMs: 100, alternativeIntents: [] }
      );

      const mockKnowledgeItems = [
        {
          id: 'kb-1',
          title: 'Pricing Plans',
          content: 'Pricing information',
          relevanceScore: 0.85
        }
      ];

      // Track execution order
      const executionOrder: string[] = [];

      (mockIntentService.classifyIntent as any).mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        executionOrder.push('intent');
        return mockIntentResult;
      });

      (mockKnowledgeService.searchKnowledge as any).mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
        executionOrder.push('knowledge');
        return { items: mockKnowledgeItems };
      });

      const startTime = Date.now();
      const result = await service.enhanceAnalysis(
        baseAnalysis,
        messages,
        chatbotConfig,
        session
      );
      const endTime = Date.now();

      // Should complete in less than 150ms (not 150ms sequential)
      expect(endTime - startTime).toBeLessThan(150);
      expect(result.intentResult).toEqual(mockIntentResult);
      expect(result.relevantKnowledge).toEqual(mockKnowledgeItems);
      expect(executionOrder).toEqual(['knowledge', 'intent']);
    });
  });

  describe('Enhanced Analysis Result', () => {
    it('should combine base analysis with enhanced features', async () => {
      const mockIntentResult = IntentResult.create(
        'faq_pricing',
        0.85,
        { budget: 'premium' },
        'User asking about pricing',
        { model: 'test', processingTimeMs: 100, alternativeIntents: [] }
      );

      const mockKnowledgeItems = [
        {
          id: 'kb-1',
          title: 'Pricing Plans',
          content: 'Pricing information',
          relevanceScore: 0.85
        }
      ];

      (mockIntentService.classifyIntent as any).mockResolvedValue(mockIntentResult);
      (mockKnowledgeService.searchKnowledge as any).mockResolvedValue({
        items: mockKnowledgeItems
      });

      const result = await service.enhanceAnalysis(
        baseAnalysis,
        messages,
        chatbotConfig,
        session
      );

      expect(result).toEqual({
        ...baseAnalysis,
        intentResult: mockIntentResult,
        relevantKnowledge: mockKnowledgeItems,
        knowledgeRetrievalThreshold: 0.15
      });
    });

    it('should preserve base analysis when enhancement fails', async () => {
      (mockIntentService.classifyIntent as any).mockRejectedValue(new Error('Intent failed'));
      (mockKnowledgeService.searchKnowledge as any).mockRejectedValue(new Error('Knowledge failed'));

      const result = await service.enhanceAnalysis(
        baseAnalysis,
        messages,
        chatbotConfig,
        session
      );

      expect(result).toEqual({
        ...baseAnalysis,
        intentResult: undefined,
        relevantKnowledge: undefined,
        knowledgeRetrievalThreshold: 0.15
      });
    });

    it('should handle partial enhancement success', async () => {
      const mockIntentResult = IntentResult.create(
        'faq_pricing',
        0.85,
        {},
        'User asking about pricing',
        { model: 'test', processingTimeMs: 100, alternativeIntents: [] }
      );

      (mockIntentService.classifyIntent as any).mockResolvedValue(mockIntentResult);
      (mockKnowledgeService.searchKnowledge as any).mockRejectedValue(new Error('Knowledge failed'));

      const result = await service.enhanceAnalysis(
        baseAnalysis,
        messages,
        chatbotConfig,
        session
      );

      expect(result).toEqual({
        ...baseAnalysis,
        intentResult: mockIntentResult,
        relevantKnowledge: undefined,
        knowledgeRetrievalThreshold: 0.15
      });
    });
  });

  describe('Service Initialization', () => {
    it('should work with no services provided', async () => {
      service = new ConversationEnhancedAnalysisService();

      const result = await service.enhanceAnalysis(
        baseAnalysis,
        messages,
        chatbotConfig,
        session
      );

      expect(result).toEqual({
        ...baseAnalysis,
        intentResult: undefined,
        relevantKnowledge: undefined,
        knowledgeRetrievalThreshold: 0.15
      });
    });

    it('should work with only intent service', async () => {
      service = new ConversationEnhancedAnalysisService(mockIntentService);

      const mockIntentResult = IntentResult.create(
        'greeting',
        0.95,
        {},
        'User greeting',
        { model: 'test', processingTimeMs: 100, alternativeIntents: [] }
      );

      (mockIntentService.classifyIntent as any).mockResolvedValue(mockIntentResult);

      const result = await service.enhanceAnalysis(
        baseAnalysis,
        messages,
        chatbotConfig,
        session
      );

      expect(result.intentResult).toEqual(mockIntentResult);
      expect(result.relevantKnowledge).toBeUndefined();
    });

    it('should work with only knowledge service', async () => {
      service = new ConversationEnhancedAnalysisService(undefined, mockKnowledgeService);

      const mockKnowledgeItems = [
        {
          id: 'kb-1',
          title: 'Help',
          content: 'General help information',
          relevanceScore: 0.75
        }
      ];

      (mockKnowledgeService.searchKnowledge as any).mockResolvedValue({
        items: mockKnowledgeItems
      });

      const result = await service.enhanceAnalysis(
        baseAnalysis,
        messages,
        chatbotConfig,
        session
      );

      expect(result.intentResult).toBeUndefined();
      expect(result.relevantKnowledge).toEqual(mockKnowledgeItems);
    });
  });

  describe('Edge Cases', () => {
    it('should handle messages with very long content', async () => {
      const longMessage = 'x'.repeat(10000);
      const messagesWithLongContent = [
        {
          id: 'msg-1',
          content: longMessage,
          isFromUser: () => true,
          timestamp: new Date()
        } as ChatMessage
      ];

      (mockIntentService.classifyIntent as any).mockResolvedValue(undefined);
      (mockKnowledgeService.searchKnowledge as any).mockResolvedValue({ items: [] });

      const result = await service.enhanceAnalysis(
        baseAnalysis,
        messagesWithLongContent,
        chatbotConfig,
        session
      );

      expect(mockKnowledgeService.searchKnowledge).toHaveBeenCalledWith(
        expect.objectContaining({
          userQuery: longMessage
        })
      );
    });

    it('should handle empty message content', async () => {
      const emptyContentMessages = [
        {
          id: 'msg-1',
          content: '',
          isFromUser: () => true,
          timestamp: new Date()
        } as ChatMessage
      ];

      (mockIntentService.classifyIntent as any).mockResolvedValue(undefined);
      (mockKnowledgeService.searchKnowledge as any).mockResolvedValue({ items: [] });

      const result = await service.enhanceAnalysis(
        baseAnalysis,
        emptyContentMessages,
        chatbotConfig,
        session
      );

      expect(mockKnowledgeService.searchKnowledge).toHaveBeenCalledWith(
        expect.objectContaining({
          userQuery: ''
        })
      );
    });
  });
});