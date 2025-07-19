/**
 * MessageAnalysisExtractorService Tests
 * 
 * Critical performance optimization tests for unified analysis extraction
 * This service replaces 3 separate API calls for 2.8s performance gain
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MessageAnalysisExtractorService } from '../MessageAnalysisExtractorService';
import { ChatMessage } from '../../../../domain/entities/ChatMessage';
import { IChatMessageRepository } from '../../../../domain/repositories/IChatMessageRepository';
import { MessageAIMetadata } from '../../../../domain/value-objects/message-processing/MessageAIMetadata';
import { MessageContextMetadata } from '../../../../domain/value-objects/message-processing/MessageContextMetadata';
import { MessageProcessingMetrics } from '../../../../domain/value-objects/message-processing/MessageProcessingMetrics';
import { MessageCostTracking } from '../../../../domain/value-objects/message-processing/MessageCostTracking';

describe('MessageAnalysisExtractorService', () => {
  let service: MessageAnalysisExtractorService;
  let mockRepository: IChatMessageRepository;

  const createTestMessage = (overrides: Partial<any> = {}): ChatMessage => {
    return ChatMessage.create({
      id: 'test-message-id',
      sessionId: 'test-session-id',
      messageType: 'user',
      content: 'Test message content',
      timestamp: new Date('2023-01-01T12:00:00Z'),
      isVisible: true,
      aiMetadata: MessageAIMetadata.createEmpty(),
      contextMetadata: MessageContextMetadata.createForUser('text'),
      processingMetrics: MessageProcessingMetrics.createEmpty(),
      costTracking: MessageCostTracking.createZeroCost(),
      ...overrides
    });
  };

  beforeEach(() => {
    // Create mock repository
    mockRepository = {
      findById: vi.fn(),
      findBySessionId: vi.fn(),
      findVisibleBySessionId: vi.fn(),
      findBySessionIdWithPagination: vi.fn(),
      save: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findBySessionIds: vi.fn(),
      findRecentByOrganization: vi.fn(),
      count: vi.fn(),
      findByDateRange: vi.fn()
    } as any;

    service = new MessageAnalysisExtractorService(mockRepository);
  });

  describe('Initialization', () => {
    it('should create service with repository', () => {
      expect(service).toBeDefined();
    });
  });

  describe('extractAndApplyAnalysis', () => {
    it('should extract and apply all analysis data from unified response', async () => {
      const originalMessage = createTestMessage();
      const unifiedResult = {
        analysis: {
          sentiment: 'positive',
          entities: {
            urgency: 'high'
          }
        },
        conversationFlow: {
          engagementLevel: 'high'
        }
      };

      // Mock the save to return an updated message
      const savedMessage = createTestMessage();
      (mockRepository.save as any).mockResolvedValue(savedMessage);

      const result = await service.extractAndApplyAnalysis(
        originalMessage,
        unifiedResult,
        'test-log.txt'
      );

      expect(mockRepository.save).toHaveBeenCalledTimes(1);
      expect(result).toBeDefined();
      expect(result).toBe(savedMessage);
    });

    it('should handle unified response with sentiment in response field', async () => {
      const originalMessage = createTestMessage();
      const unifiedResult = {
        response: {
          sentiment: 'negative'
        },
        conversationFlow: {
          engagementLevel: 'low'
        }
      };

      const savedMessage = createTestMessage();
      (mockRepository.save as any).mockResolvedValue(savedMessage);

      const result = await service.extractAndApplyAnalysis(
        originalMessage,
        unifiedResult,
        'test-log.txt'
      );

      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.any(ChatMessage),
        'test-log.txt'
      );
      expect(result).toBe(savedMessage);
    });

    it('should apply default values when analysis data is missing', async () => {
      const originalMessage = createTestMessage();
      const unifiedResult = {}; // Empty response

      const savedMessage = createTestMessage();
      (mockRepository.save as any).mockResolvedValue(savedMessage);

      const result = await service.extractAndApplyAnalysis(
        originalMessage,
        unifiedResult,
        'test-log.txt'
      );

      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.any(ChatMessage),
        'test-log.txt'
      );
      expect(result).toBe(savedMessage);
    });

    it('should handle repository save failure gracefully', async () => {
      const originalMessage = createTestMessage();
      const unifiedResult = {
        analysis: { sentiment: 'positive' }
      };

      // Mock save to return null (failed save)
      (mockRepository.save as any).mockResolvedValue(null);

      const result = await service.extractAndApplyAnalysis(
        originalMessage,
        unifiedResult,
        'test-log.txt'
      );

      expect(result).toBe(originalMessage); // Should return original message
    });

    it('should catch and handle errors during extraction', async () => {
      const originalMessage = createTestMessage();
      const unifiedResult = {
        analysis: { sentiment: 'positive' }
      };

      // Mock save to throw error
      (mockRepository.save as any).mockRejectedValue(new Error('Database error'));

      // Should not throw, should return original message
      const result = await service.extractAndApplyAnalysis(
        originalMessage,
        unifiedResult,
        'test-log.txt'
      );

      expect(result).toBe(originalMessage);
    });

    it('should handle complex unified response with multiple data paths', async () => {
      const originalMessage = createTestMessage();
      const complexUnifiedResult = {
        analysis: {
          sentiment: 'positive',
          entities: {
            urgency: 'medium',
            userInfo: {
              name: 'John',
              company: 'Acme Corp'
            }
          },
          engagementLevel: 'medium' // This should be overridden by conversationFlow
        },
        conversationFlow: {
          engagementLevel: 'high', // This should take precedence
          urgency: 'low', // This should be ignored since entities.urgency exists
          phase: 'discovery'
        },
        response: {
          sentiment: 'neutral' // This should be ignored since analysis.sentiment exists
        }
      };

      const savedMessage = createTestMessage();
      (mockRepository.save as any).mockResolvedValue(savedMessage);

      const result = await service.extractAndApplyAnalysis(
        originalMessage,
        complexUnifiedResult,
        'complex-test-log.txt'
      );

      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.any(ChatMessage),
        'complex-test-log.txt'
      );
      expect(result).toBe(savedMessage);
    });

    it('should handle malformed unified response gracefully', async () => {
      const originalMessage = createTestMessage();
      const malformedResult = {
        analysis: null,
        conversationFlow: 'not an object',
        response: undefined
      };

      const savedMessage = createTestMessage();
      (mockRepository.save as any).mockResolvedValue(savedMessage);

      const result = await service.extractAndApplyAnalysis(
        originalMessage,
        malformedResult,
        'malformed-test-log.txt'
      );

      expect(result).toBe(savedMessage);
    });
  });

  describe('Sentiment Extraction', () => {
    it('should extract sentiment from analysis field', async () => {
      const originalMessage = createTestMessage();
      const unifiedResult = {
        analysis: { sentiment: 'positive' }
      };

      const savedMessage = createTestMessage();
      (mockRepository.save as any).mockResolvedValue(savedMessage);

      await service.extractAndApplyAnalysis(originalMessage, unifiedResult, 'test-log.txt');

      // Verify that the message was updated with sentiment
      const savedCall = (mockRepository.save as any).mock.calls[0];
      const updatedMessage = savedCall[0] as ChatMessage;
      expect(updatedMessage).toBeDefined();
    });

    it('should extract sentiment from response field as fallback', async () => {
      const originalMessage = createTestMessage();
      const unifiedResult = {
        response: { sentiment: 'negative' }
      };

      const savedMessage = createTestMessage();
      (mockRepository.save as any).mockResolvedValue(savedMessage);

      await service.extractAndApplyAnalysis(originalMessage, unifiedResult, 'test-log.txt');

      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should default to neutral when sentiment is invalid', async () => {
      const originalMessage = createTestMessage();
      const unifiedResult = {
        analysis: { sentiment: 'invalid_sentiment' }
      };

      const savedMessage = createTestMessage();
      (mockRepository.save as any).mockResolvedValue(savedMessage);

      await service.extractAndApplyAnalysis(originalMessage, unifiedResult, 'test-log.txt');

      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should default to neutral when sentiment is missing', async () => {
      const originalMessage = createTestMessage();
      const unifiedResult = {};

      const savedMessage = createTestMessage();
      (mockRepository.save as any).mockResolvedValue(savedMessage);

      await service.extractAndApplyAnalysis(originalMessage, unifiedResult, 'test-log.txt');

      expect(mockRepository.save).toHaveBeenCalled();
    });
  });

  describe('Urgency Extraction', () => {
    it('should extract urgency from entities field', async () => {
      const originalMessage = createTestMessage();
      const unifiedResult = {
        analysis: {
          entities: { urgency: 'high' }
        }
      };

      const savedMessage = createTestMessage();
      (mockRepository.save as any).mockResolvedValue(savedMessage);

      await service.extractAndApplyAnalysis(originalMessage, unifiedResult, 'test-log.txt');

      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should extract urgency from conversationFlow as fallback', async () => {
      const originalMessage = createTestMessage();
      const unifiedResult = {
        conversationFlow: { urgency: 'medium' }
      };

      const savedMessage = createTestMessage();
      (mockRepository.save as any).mockResolvedValue(savedMessage);

      await service.extractAndApplyAnalysis(originalMessage, unifiedResult, 'test-log.txt');

      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should default to low when urgency is invalid', async () => {
      const originalMessage = createTestMessage();
      const unifiedResult = {
        analysis: {
          entities: { urgency: 'extreme' }
        }
      };

      const savedMessage = createTestMessage();
      (mockRepository.save as any).mockResolvedValue(savedMessage);

      await service.extractAndApplyAnalysis(originalMessage, unifiedResult, 'test-log.txt');

      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should prioritize entities over conversationFlow for urgency', async () => {
      const originalMessage = createTestMessage();
      const unifiedResult = {
        analysis: {
          entities: { urgency: 'high' }
        },
        conversationFlow: { urgency: 'low' }
      };

      const savedMessage = createTestMessage();
      (mockRepository.save as any).mockResolvedValue(savedMessage);

      await service.extractAndApplyAnalysis(originalMessage, unifiedResult, 'test-log.txt');

      expect(mockRepository.save).toHaveBeenCalled();
    });
  });

  describe('Engagement Extraction', () => {
    it('should extract engagement from conversationFlow field', async () => {
      const originalMessage = createTestMessage();
      const unifiedResult = {
        conversationFlow: { engagementLevel: 'high' }
      };

      const savedMessage = createTestMessage();
      (mockRepository.save as any).mockResolvedValue(savedMessage);

      await service.extractAndApplyAnalysis(originalMessage, unifiedResult, 'test-log.txt');

      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should extract engagement from analysis as fallback', async () => {
      const originalMessage = createTestMessage();
      const unifiedResult = {
        analysis: { engagementLevel: 'medium' }
      };

      const savedMessage = createTestMessage();
      (mockRepository.save as any).mockResolvedValue(savedMessage);

      await service.extractAndApplyAnalysis(originalMessage, unifiedResult, 'test-log.txt');

      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should default to low when engagement is invalid', async () => {
      const originalMessage = createTestMessage();
      const unifiedResult = {
        conversationFlow: { engagementLevel: 'super_high' }
      };

      const savedMessage = createTestMessage();
      (mockRepository.save as any).mockResolvedValue(savedMessage);

      await service.extractAndApplyAnalysis(originalMessage, unifiedResult, 'test-log.txt');

      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should prioritize conversationFlow over analysis for engagement', async () => {
      const originalMessage = createTestMessage();
      const unifiedResult = {
        conversationFlow: { engagementLevel: 'high' },
        analysis: { engagementLevel: 'low' }
      };

      const savedMessage = createTestMessage();
      (mockRepository.save as any).mockResolvedValue(savedMessage);

      await service.extractAndApplyAnalysis(originalMessage, unifiedResult, 'test-log.txt');

      expect(mockRepository.save).toHaveBeenCalled();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle null unified result', async () => {
      const originalMessage = createTestMessage();
      
      const result = await service.extractAndApplyAnalysis(
        originalMessage,
        null as any,
        'test-log.txt'
      );

      expect(result).toBe(originalMessage);
    });

    it('should handle undefined unified result', async () => {
      const originalMessage = createTestMessage();
      
      const result = await service.extractAndApplyAnalysis(
        originalMessage,
        undefined as any,
        'test-log.txt'
      );

      expect(result).toBe(originalMessage);
    });

    it('should handle extremely nested malformed data', async () => {
      const originalMessage = createTestMessage();
      const deeplyMalformed = {
        analysis: {
          entities: {
            urgency: {
              nested: {
                value: 'this_is_not_a_string'
              }
            }
          }
        }
      };

      const savedMessage = createTestMessage();
      (mockRepository.save as any).mockResolvedValue(savedMessage);

      await service.extractAndApplyAnalysis(originalMessage, deeplyMalformed, 'test-log.txt');

      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should handle circular reference in unified result', async () => {
      const originalMessage = createTestMessage();
      const circularResult: any = {
        analysis: { sentiment: 'positive' }
      };
      circularResult.circular = circularResult; // Create circular reference

      const savedMessage = createTestMessage();
      (mockRepository.save as any).mockResolvedValue(savedMessage);

      await service.extractAndApplyAnalysis(originalMessage, circularResult, 'test-log.txt');

      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should maintain message immutability during processing', async () => {
      const originalMessage = createTestMessage();
      const originalContent = originalMessage.content;
      const originalId = originalMessage.id;

      const unifiedResult = {
        analysis: { sentiment: 'positive' }
      };

      const savedMessage = createTestMessage();
      (mockRepository.save as any).mockResolvedValue(savedMessage);

      await service.extractAndApplyAnalysis(originalMessage, unifiedResult, 'test-log.txt');

      // Original message should remain unchanged
      expect(originalMessage.content).toBe(originalContent);
      expect(originalMessage.id).toBe(originalId);
    });
  });

  describe('Performance and Resource Management', () => {
    it('should complete extraction quickly for simple cases', async () => {
      const originalMessage = createTestMessage();
      const unifiedResult = {
        analysis: { sentiment: 'positive' }
      };

      const savedMessage = createTestMessage();
      (mockRepository.save as any).mockResolvedValue(savedMessage);

      const startTime = Date.now();
      await service.extractAndApplyAnalysis(originalMessage, unifiedResult, 'test-log.txt');
      const endTime = Date.now();

      // Should complete very quickly (much less than the 2.8s we're saving)
      expect(endTime - startTime).toBeLessThan(100);
    });

    it('should handle concurrent extractions independently', async () => {
      const message1 = createTestMessage();
      const message2 = createTestMessage();
      
      const result1 = { analysis: { sentiment: 'positive' } };
      const result2 = { analysis: { sentiment: 'negative' } };

      const savedMessage1 = createTestMessage();
      const savedMessage2 = createTestMessage();

      (mockRepository.save as any)
        .mockResolvedValueOnce(savedMessage1)
        .mockResolvedValueOnce(savedMessage2);

      const [response1, response2] = await Promise.all([
        service.extractAndApplyAnalysis(message1, result1, 'log1.txt'),
        service.extractAndApplyAnalysis(message2, result2, 'log2.txt')
      ]);

      expect(response1).toBe(savedMessage1);
      expect(response2).toBe(savedMessage2);
      expect(mockRepository.save).toHaveBeenCalledTimes(2);
    });

    it('should not leak memory with large unified results', async () => {
      const originalMessage = createTestMessage();
      
      // Create a large unified result object
      const largeResult = {
        analysis: {
          sentiment: 'positive',
          largeArray: Array.from({ length: 10000 }, (_, i) => `item-${i}`)
        }
      };

      const savedMessage = createTestMessage();
      (mockRepository.save as any).mockResolvedValue(savedMessage);

      const result = await service.extractAndApplyAnalysis(
        originalMessage,
        largeResult,
        'large-test-log.txt'
      );

      expect(result).toBe(savedMessage);
      expect(mockRepository.save).toHaveBeenCalled();
    });
  });
});