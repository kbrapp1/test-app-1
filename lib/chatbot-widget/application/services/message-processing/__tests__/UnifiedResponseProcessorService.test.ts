/**
 * Unified Response Processor Service Tests
 * 
 * Tests the application service responsible for processing unified AI results
 * into bot messages including token usage extraction, cost calculation,
 * and entity processing with comprehensive error handling
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UnifiedResponseProcessorService } from '../UnifiedResponseProcessorService';
import { ChatMessage } from '../../../../domain/entities/ChatMessage';
import { IChatMessageRepository } from '../../../../domain/repositories/IChatMessageRepository';
import { ChatMessageFactoryService } from '../../../../domain/services/utilities/ChatMessageFactoryService';
import { MessageCostCalculationService } from '../../../../domain/services/utilities/MessageCostCalculationService';
import { ErrorTrackingFacade } from '../../ErrorTrackingFacade';

// Mock dependencies
vi.mock('../../../../domain/services/utilities/ChatMessageFactoryService');
vi.mock('../../../../domain/services/utilities/MessageCostCalculationService');

describe('UnifiedResponseProcessorService', () => {
  let service: UnifiedResponseProcessorService;
  let mockRepository: IChatMessageRepository;
  let mockErrorTracking: ErrorTrackingFacade;
  let mockSession: any;
  let mockConfig: any;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Create mock repository
    mockRepository = {
      save: vi.fn().mockResolvedValue(undefined),
      findById: vi.fn(),
      findBySessionId: vi.fn(),
      deleteById: vi.fn()
    } as any;

    // Create mock error tracking
    mockErrorTracking = {
      trackResponseExtractionFallback: vi.fn().mockResolvedValue(undefined)
    } as any;

    // Create test session and config
    mockSession = {
      id: 'session-123',
      configId: 'config-456'
    };

    mockConfig = {
      id: 'config-456',
      organizationId: 'org-789'
    };

    // Initialize service
    service = new UnifiedResponseProcessorService(
      mockRepository,
      mockErrorTracking
    );
  });

  // Helper to create mock message with cost tracking
  const createMockMessage = () => ({ 
    content: 'Test response',
    addCostTracking: vi.fn().mockReturnValue('messageWithCosts')
  } as any);

  describe('Response Content Extraction', () => {
    it('should extract response content from direct path', async () => {
      const mockMessage = { content: 'Test response' } as ChatMessage;
      const mockCostBreakdown = { 
        totalCents: 50, 
        promptTokensCents: 30, 
        completionTokensCents: 20,
        displayCents: 50
      };

      vi.mocked(ChatMessageFactoryService.createBotMessageWithFullMetadata).mockReturnValue(mockMessage);
      vi.mocked(MessageCostCalculationService.calculateCostBreakdown).mockReturnValue(mockCostBreakdown);
      mockMessage.addCostTracking = vi.fn().mockReturnValue(mockMessage);

      const unifiedResult = {
        response: {
          content: 'Hello, how can I help you?'
        },
        usage: {
          prompt_tokens: 100,
          completion_tokens: 50,
          total_tokens: 150
        },
        model: 'gpt-4o-mini'
      };

      const result = await service.createBotMessageFromUnifiedResult(
        mockSession,
        unifiedResult,
        'test.log',
        mockConfig
      );

      expect(ChatMessageFactoryService.createBotMessageWithFullMetadata).toHaveBeenCalledWith(
        'session-123',
        'Hello, how can I help you?',
        'gpt-4o-mini',
        100,
        50,
        0,
        'unified_processing',
        [],
        0
      );

      expect(result).toBe(mockMessage);
    });

    it('should extract response content from analysis path', async () => {
      const mockMessage = createMockMessage();
      vi.mocked(ChatMessageFactoryService.createBotMessageWithFullMetadata).mockReturnValue(mockMessage);

      const unifiedResult = {
        analysis: {
          response: {
            content: 'Response from analysis path'
          },
          primaryConfidence: 0.85,
          primaryIntent: 'customer_support',
          entities: {
            product: 'Widget Pro',
            intent: 'pricing_inquiry'
          }
        },
        usage: {
          prompt_tokens: 120,
          completion_tokens: 60
        }
      };

      await service.createBotMessageFromUnifiedResult(
        mockSession,
        unifiedResult,
        'test.log',
        mockConfig
      );

      expect(ChatMessageFactoryService.createBotMessageWithFullMetadata).toHaveBeenCalledWith(
        'session-123',
        'Response from analysis path',
        'gpt-4o-mini',
        120,
        60,
        0.85,
        'customer_support',
        [
          { type: 'product', value: 'Widget Pro', confidence: 0.9 },
          { type: 'intent', value: 'pricing_inquiry', confidence: 0.9 }
        ],
        0
      );
    });

    it('should extract response content from function call arguments', async () => {
      const mockMessage = createMockMessage();
      vi.mocked(ChatMessageFactoryService.createBotMessageWithFullMetadata).mockReturnValue(mockMessage);

      const unifiedResult = {
        choices: [{
          message: {
            function_call: {
              arguments: JSON.stringify({
                response: {
                  content: 'Function call response'
                },
                analysis: {
                  primaryConfidence: 0.9,
                  primaryIntent: 'sales_qualification',
                  entities: {
                    company: 'Acme Corp'
                  }
                }
              })
            }
          }
        }],
        usage: {
          prompt_tokens: 80,
          completion_tokens: 40
        }
      };

      await service.createBotMessageFromUnifiedResult(
        mockSession,
        unifiedResult,
        'test.log',
        mockConfig
      );

      expect(ChatMessageFactoryService.createBotMessageWithFullMetadata).toHaveBeenCalledWith(
        'session-123',
        'Function call response',
        'gpt-4o-mini',
        80,
        40,
        0.9,
        'sales_qualification',
        [
          { type: 'company', value: 'Acme Corp', confidence: 0.9 }
        ],
        0
      );
    });

    it('should handle malformed function call arguments', async () => {
      const mockMessage = createMockMessage();
      vi.mocked(ChatMessageFactoryService.createBotMessageWithFullMetadata).mockReturnValue(mockMessage);

      const unifiedResult = {
        choices: [{
          message: {
            function_call: {
              arguments: 'invalid json{'
            }
          }
        }],
        usage: {
          prompt_tokens: 50,
          completion_tokens: 25
        }
      };

      await service.createBotMessageFromUnifiedResult(
        mockSession,
        unifiedResult,
        'test.log',
        mockConfig
      );

      expect(mockErrorTracking.trackResponseExtractionFallback).toHaveBeenCalledWith(
        unifiedResult,
        'session-123',
        null,
        'org-789'
      );

      expect(ChatMessageFactoryService.createBotMessageWithFullMetadata).toHaveBeenCalledWith(
        'session-123',
        "I'm having trouble processing your message right now, but I'm here to help! Please try again in a moment.",
        'gpt-4o-mini',
        50,
        25,
        0,
        'unified_processing',
        [],
        0
      );
    });

    it('should use fallback response when no content found', async () => {
      const mockMessage = createMockMessage();
      vi.mocked(ChatMessageFactoryService.createBotMessageWithFullMetadata).mockReturnValue(mockMessage);

      const unifiedResult = {
        usage: {
          prompt_tokens: 30,
          completion_tokens: 15
        }
      };

      await service.createBotMessageFromUnifiedResult(
        mockSession,
        unifiedResult,
        'test.log',
        mockConfig
      );

      expect(mockErrorTracking.trackResponseExtractionFallback).toHaveBeenCalled();
      expect(ChatMessageFactoryService.createBotMessageWithFullMetadata).toHaveBeenCalledWith(
        'session-123',
        "I'm having trouble processing your message right now, but I'm here to help! Please try again in a moment.",
        'gpt-4o-mini',
        30,
        15,
        0,
        'unified_processing',
        [],
        0
      );
    });
  });

  describe('Token Usage Extraction', () => {
    it('should extract token usage from unified result', async () => {
      const mockMessage = createMockMessage();
      vi.mocked(ChatMessageFactoryService.createBotMessageWithFullMetadata).mockReturnValue(mockMessage);

      const unifiedResult = {
        response: { content: 'Test' },
        usage: {
          prompt_tokens: 200,
          completion_tokens: 100,
          total_tokens: 300
        }
      };

      await service.createBotMessageFromUnifiedResult(
        mockSession,
        unifiedResult,
        'test.log',
        mockConfig
      );

      expect(ChatMessageFactoryService.createBotMessageWithFullMetadata).toHaveBeenCalledWith(
        'session-123',
        'Test',
        'gpt-4o-mini',
        200, // prompt tokens
        100, // completion tokens
        0,
        'unified_processing',
        [],
        0
      );
    });

    it('should handle missing token usage gracefully', async () => {
      const mockMessage = { content: 'Test response' } as ChatMessage;
      vi.mocked(ChatMessageFactoryService.createBotMessageWithFullMetadata).mockReturnValue(mockMessage);

      const unifiedResult = {
        response: { content: 'Test' }
      };

      await service.createBotMessageFromUnifiedResult(
        mockSession,
        unifiedResult,
        'test.log',
        mockConfig
      );

      expect(ChatMessageFactoryService.createBotMessageWithFullMetadata).toHaveBeenCalledWith(
        'session-123',
        'Test',
        'gpt-4o-mini',
        0, // default prompt tokens
        0, // default completion tokens
        0,
        'unified_processing',
        [],
        0
      );
    });

    it('should calculate total tokens when missing', async () => {
      const mockMessage = createMockMessage();
      vi.mocked(ChatMessageFactoryService.createBotMessageWithFullMetadata).mockReturnValue(mockMessage);

      const unifiedResult = {
        response: { content: 'Test' },
        usage: {
          prompt_tokens: 150,
          completion_tokens: 75
          // total_tokens missing
        }
      };

      await service.createBotMessageFromUnifiedResult(
        mockSession,
        unifiedResult,
        'test.log',
        mockConfig
      );

      // Service should calculate total internally, but we only check the factory call
      expect(ChatMessageFactoryService.createBotMessageWithFullMetadata).toHaveBeenCalledWith(
        'session-123',
        'Test',
        'gpt-4o-mini',
        150,
        75,
        0,
        'unified_processing',
        [],
        0
      );
    });
  });

  describe('Entity Extraction', () => {
    it('should extract entities and transform to factory format', async () => {
      const mockMessage = { content: 'Test response' } as ChatMessage;
      vi.mocked(ChatMessageFactoryService.createBotMessageWithFullMetadata).mockReturnValue(mockMessage);

      const unifiedResult = {
        response: { content: 'Test' },
        analysis: {
          entities: {
            product: 'Enterprise Plan',
            location: 'New York',
            date: '2024-01-15'
          }
        }
      };

      await service.createBotMessageFromUnifiedResult(
        mockSession,
        unifiedResult,
        'test.log',
        mockConfig
      );

      expect(ChatMessageFactoryService.createBotMessageWithFullMetadata).toHaveBeenCalledWith(
        'session-123',
        'Test',
        'gpt-4o-mini',
        0,
        0,
        0,
        'unified_processing',
        [
          { type: 'product', value: 'Enterprise Plan', confidence: 0.9 },
          { type: 'location', value: 'New York', confidence: 0.9 },
          { type: 'date', value: '2024-01-15', confidence: 0.9 }
        ],
        0
      );
    });

    it('should filter out invalid entities', async () => {
      const mockMessage = { content: 'Test response' } as ChatMessage;
      vi.mocked(ChatMessageFactoryService.createBotMessageWithFullMetadata).mockReturnValue(mockMessage);

      const unifiedResult = {
        response: { content: 'Test' },
        analysis: {
          entities: {
            validEntity: 'Valid Value',
            '': 'empty key',
            nullValue: null,
            undefinedValue: undefined,
            emptyValue: '',
            whitespaceValue: '   '
          }
        }
      };

      await service.createBotMessageFromUnifiedResult(
        mockSession,
        unifiedResult,
        'test.log',
        mockConfig
      );

      expect(ChatMessageFactoryService.createBotMessageWithFullMetadata).toHaveBeenCalledWith(
        'session-123',
        'Test',
        'gpt-4o-mini',
        0,
        0,
        0,
        'unified_processing',
        [
          { type: 'validEntity', value: 'Valid Value', confidence: 0.9 }
        ],
        0
      );
    });

    it('should handle malformed entities gracefully', async () => {
      const mockMessage = { content: 'Test response' } as ChatMessage;
      vi.mocked(ChatMessageFactoryService.createBotMessageWithFullMetadata).mockReturnValue(mockMessage);

      const unifiedResult = {
        response: { content: 'Test' },
        analysis: {
          entities: 'not an object'
        }
      };

      await service.createBotMessageFromUnifiedResult(
        mockSession,
        unifiedResult,
        'test.log',
        mockConfig
      );

      expect(ChatMessageFactoryService.createBotMessageWithFullMetadata).toHaveBeenCalledWith(
        'session-123',
        'Test',
        'gpt-4o-mini',
        0,
        0,
        0,
        'unified_processing',
        [],
        0
      );
    });
  });

  describe('Cost Tracking', () => {
    it('should add cost tracking when tokens are present', async () => {
      const mockMessage = { 
        content: 'Test response',
        addCostTracking: vi.fn().mockReturnValue('messageWithCosts')
      } as any;
      
      const mockCostBreakdown = {
        totalCents: 125,
        promptTokensCents: 75,
        completionTokensCents: 50,
        displayCents: 125
      };

      vi.mocked(ChatMessageFactoryService.createBotMessageWithFullMetadata).mockReturnValue(mockMessage);
      vi.mocked(MessageCostCalculationService.calculateCostBreakdown).mockReturnValue(mockCostBreakdown);

      const unifiedResult = {
        response: { content: 'Test' },
        usage: {
          prompt_tokens: 150,
          completion_tokens: 75
        },
        model: 'gpt-4o'
      };

      const result = await service.createBotMessageFromUnifiedResult(
        mockSession,
        unifiedResult,
        'test.log',
        mockConfig
      );

      expect(MessageCostCalculationService.calculateCostBreakdown).toHaveBeenCalledWith(
        'gpt-4o',
        150,
        75
      );

      expect(mockMessage.addCostTracking).toHaveBeenCalledWith(125, mockCostBreakdown);
      expect(result).toBe('messageWithCosts');
    });

    it('should skip cost tracking when no tokens present', async () => {
      const mockMessage = { 
        content: 'Test response',
        addCostTracking: vi.fn()
      } as any;

      vi.mocked(ChatMessageFactoryService.createBotMessageWithFullMetadata).mockReturnValue(mockMessage);

      const unifiedResult = {
        response: { content: 'Test' },
        usage: {
          prompt_tokens: 0,
          completion_tokens: 0
        }
      };

      const result = await service.createBotMessageFromUnifiedResult(
        mockSession,
        unifiedResult,
        'test.log',
        mockConfig
      );

      expect(MessageCostCalculationService.calculateCostBreakdown).not.toHaveBeenCalled();
      expect(mockMessage.addCostTracking).not.toHaveBeenCalled();
      expect(result).toBe(mockMessage);
    });

    it('should use default model when not specified', async () => {
      const mockMessage = { 
        content: 'Test response',
        addCostTracking: vi.fn()
      } as any;
      mockMessage.addCostTracking.mockReturnValue(mockMessage);
      
      const mockCostBreakdown = { 
        totalCents: 50,
        promptTokensCents: 30,
        completionTokensCents: 20,
        displayCents: 50
      };

      vi.mocked(ChatMessageFactoryService.createBotMessageWithFullMetadata).mockReturnValue(mockMessage);
      vi.mocked(MessageCostCalculationService.calculateCostBreakdown).mockReturnValue(mockCostBreakdown);

      const unifiedResult = {
        response: { content: 'Test' },
        usage: {
          prompt_tokens: 100,
          completion_tokens: 50
        }
        // model not specified
      };

      await service.createBotMessageFromUnifiedResult(
        mockSession,
        unifiedResult,
        'test.log',
        mockConfig
      );

      expect(MessageCostCalculationService.calculateCostBreakdown).toHaveBeenCalledWith(
        'gpt-4o-mini', // default model
        100,
        50
      );
    });
  });

  describe('Message Persistence', () => {
    it('should save message to repository with log context', async () => {
      const mockMessage = { content: 'Test response' } as ChatMessage;
      vi.mocked(ChatMessageFactoryService.createBotMessageWithFullMetadata).mockReturnValue(mockMessage);

      const unifiedResult = {
        response: { content: 'Test response' }
      };

      await service.createBotMessageFromUnifiedResult(
        mockSession,
        unifiedResult,
        'processing.log',
        mockConfig
      );

      expect(mockRepository.save).toHaveBeenCalledWith(mockMessage, 'processing.log');
    });

    it('should return the saved message', async () => {
      const mockMessage = { content: 'Test response' } as ChatMessage;
      vi.mocked(ChatMessageFactoryService.createBotMessageWithFullMetadata).mockReturnValue(mockMessage);

      const unifiedResult = {
        response: { content: 'Test response' }
      };

      const result = await service.createBotMessageFromUnifiedResult(
        mockSession,
        unifiedResult,
        'test.log',
        mockConfig
      );

      expect(result).toBe(mockMessage);
    });
  });

  describe('Error Tracking Integration', () => {
    it('should track fallback with correct RLS context', async () => {
      const mockMessage = createMockMessage();
      vi.mocked(ChatMessageFactoryService.createBotMessageWithFullMetadata).mockReturnValue(mockMessage);

      const unifiedResult = {
        // No response content to trigger fallback
        usage: { prompt_tokens: 50, completion_tokens: 25 }
      };

      await service.createBotMessageFromUnifiedResult(
        mockSession,
        unifiedResult,
        'test.log',
        mockConfig
      );

      expect(mockErrorTracking.trackResponseExtractionFallback).toHaveBeenCalledWith(
        unifiedResult,
        'session-123',
        null, // No authenticated user for chatbot widget visitors
        'org-789' // Organization ID from config
      );
    });

    it('should handle error tracking failures by propagating the error', async () => {
      const mockMessage = createMockMessage();
      vi.mocked(ChatMessageFactoryService.createBotMessageWithFullMetadata).mockReturnValue(mockMessage);
      
      // Make error tracking throw
      mockErrorTracking.trackResponseExtractionFallback = vi.fn().mockRejectedValue(
        new Error('Error tracking failed')
      );

      const unifiedResult = {
        // No response content to trigger fallback and error tracking
        usage: { prompt_tokens: 50, completion_tokens: 25 }
      };

      // Should throw due to error tracking failure
      await expect(
        service.createBotMessageFromUnifiedResult(
          mockSession,
          unifiedResult,
          'test.log',
          mockConfig
        )
      ).rejects.toThrow('Error tracking failed');
    });
  });
});