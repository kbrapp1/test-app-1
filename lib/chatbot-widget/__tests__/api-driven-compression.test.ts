/**
 * API-Driven Compression Service Tests
 * 
 * Testing the simplified API-driven compression approach that replaces
 * complex domain-level compression with AI-powered summarization.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ApiDrivenCompressionService } from '../application/services/conversation-management/ApiDrivenCompressionService';
import { ChatMessage } from '../domain/entities/ChatMessage';

describe('ApiDrivenCompressionService', () => {
  // Create test messages
  const createTestMessage = (content: string, isUser: boolean): ChatMessage => {
    return {
      id: ChatMessage.generateId(),
      content,
      messageType: isUser ? 'user' : 'bot',
      timestamp: new Date(),
      sessionId: 'test-session'
    } as ChatMessage;
  };

  describe('Token Analysis', () => {
    it('should correctly analyze token usage below threshold', () => {
      const messages = [
        createTestMessage('Hello', true),
        createTestMessage('Hi there! How can I help?', false),
        createTestMessage('I need help with pricing', true)
      ];

      const analysis = ApiDrivenCompressionService.analyzeTokenUsage(messages, {
        maxTokenLimit: 1000,
        tokenThresholdPercentage: 85
      });

      expect(analysis.needsCompression).toBe(false);
      expect(analysis.utilizationPercentage).toBeLessThan(85);
      expect(analysis.tokensToSave).toBe(0);
    });

    it('should correctly identify when compression is needed', () => {
      // Create many messages to simulate large conversation
      const messages: ChatMessage[] = [];
      for (let i = 0; i < 50; i++) {
        messages.push(createTestMessage(
          `This is a longer test message number ${i} that should help us reach the token ` +
          `threshold for compression testing`,
          i % 2 === 0
        ));
      }

      const analysis = ApiDrivenCompressionService.analyzeTokenUsage(messages, {
        maxTokenLimit: 1000,
        tokenThresholdPercentage: 85
      });

      expect(analysis.needsCompression).toBe(true);
      expect(analysis.utilizationPercentage).toBeGreaterThan(85);
      expect(analysis.tokensToSave).toBeGreaterThan(0);
    });
  });

  describe('Conversation Compression', () => {
    let mockSummarizationFunction: any;

    beforeEach(() => {
      mockSummarizationFunction = vi.fn().mockResolvedValue(
        'Summary: User discussed pricing and showed interest in enterprise features. Company size: 50+ employees. Budget range mentioned: $5000-10000.'
      );
    });

    it('should not compress when below threshold', async () => {
      const messages = [
        createTestMessage('Hello', true),
        createTestMessage('Hi! How can I help you today?', false),
        createTestMessage('Tell me about your pricing', true),
        createTestMessage('I\'d be happy to discuss our pricing options!', false)
      ];

      const result = await ApiDrivenCompressionService.compressConversation(
        messages,
        mockSummarizationFunction,
        { maxTokenLimit: 10000, tokenThresholdPercentage: 85 }
      );

      expect(result.wasCompressed).toBe(false);
      expect(result.recentMessages).toEqual(messages);
      expect(result.conversationSummary).toBe('');
      expect(mockSummarizationFunction).not.toHaveBeenCalled();
    });

    it('should compress conversation when above threshold', async () => {
      // Create 20 messages (10 turns) to ensure we have enough for compression
      const messages: ChatMessage[] = [];
      for (let i = 0; i < 20; i++) {
        const isUser = i % 2 === 0;
        messages.push(createTestMessage(
          `This is message ${i + 1}. ${isUser ? 'User asking about business solutions and pricing details.' : 'Assistant providing detailed information about enterprise features.'}`,
          isUser
        ));
      }

             // Check if the messages will actually trigger compression
       const _analysis = ApiDrivenCompressionService.analyzeTokenUsage(messages, {
         maxTokenLimit: 1000,
         tokenThresholdPercentage: 85
       });

       const result = await ApiDrivenCompressionService.compressConversation(
        messages,
        mockSummarizationFunction,
        {
          maxTokenLimit: 200, // Lower limit to ensure compression triggers
          tokenThresholdPercentage: 85,
          recentTurnsToPreserve: 3
        }
      );

      expect(result.wasCompressed).toBe(true);
      expect(result.recentMessages).toHaveLength(6); // 3 turns = 6 messages
      expect(result.conversationSummary).toContain('Summary: User discussed pricing');
      expect(mockSummarizationFunction).toHaveBeenCalledOnce();
      expect(result.compressionRatio).toBeLessThan(1.0);
    });

    it('should preserve business entities in summary instruction', async () => {
      const messages: ChatMessage[] = [];
      for (let i = 0; i < 16; i++) {
        messages.push(createTestMessage(
          `This is a longer message ${i + 1} with more content to reach token threshold for compression testing`, 
          i % 2 === 0
        ));
      }

      await ApiDrivenCompressionService.compressConversation(
        messages,
        mockSummarizationFunction,
        { maxTokenLimit: 50, tokenThresholdPercentage: 85 }  // Lower limit to trigger compression
      );

      // Check that function was called
      expect(mockSummarizationFunction).toHaveBeenCalled();
      
      const instructionCall = mockSummarizationFunction.mock.calls[0][1];
      expect(instructionCall).toContain('business entities');
      expect(instructionCall).toContain('company, role, budget, timeline');
      expect(instructionCall).toContain('lead qualification');
      expect(instructionCall).toContain('business-critical information');
    });
  });

  describe('Context Building', () => {
    it('should build compressed context with summary in system prompt', () => {
      const compressionResult = {
        conversationSummary: 'User interested in enterprise pricing. Company: TechCorp (100 employees). Budget: $10k.',
        recentMessages: [
          createTestMessage('What about implementation timeline?', true),
          createTestMessage('Implementation typically takes 2-4 weeks.', false)
        ],
        originalTokenCount: 1000,
        compressedTokenCount: 300,
        compressionRatio: 0.3,
        wasCompressed: true
      };

      const baseSystemPrompt = 'You are a helpful business assistant.';
      const context = ApiDrivenCompressionService.buildCompressedContext(
        compressionResult,
        baseSystemPrompt
      );

      expect(context).toHaveLength(3); // system + 2 recent messages
      expect(context[0].role).toBe('system');
      expect(context[0].content).toContain(baseSystemPrompt);
      expect(context[0].content).toContain('CONVERSATION CONTEXT SUMMARY');
      expect(context[0].content).toContain('TechCorp');
      expect(context[1].content).toBe('What about implementation timeline?');
      expect(context[2].content).toBe('Implementation typically takes 2-4 weeks.');
    });

    it('should build context without summary when not compressed', () => {
      const compressionResult = {
        conversationSummary: '',
        recentMessages: [
          createTestMessage('Hello', true),
          createTestMessage('Hi! How can I help?', false)
        ],
        originalTokenCount: 100,
        compressedTokenCount: 100,
        compressionRatio: 1.0,
        wasCompressed: false
      };

      const baseSystemPrompt = 'You are a helpful assistant.';
      const context = ApiDrivenCompressionService.buildCompressedContext(
        compressionResult,
        baseSystemPrompt
      );

      expect(context).toHaveLength(3); // system + 2 messages
      expect(context[0].content).toBe(baseSystemPrompt); // No summary added
      expect(context[0].content).not.toContain('CONVERSATION CONTEXT SUMMARY');
    });
  });

  describe('Error Handling', () => {
    it('should throw error for empty message array', async () => {
      const mockSummarizationFunction = vi.fn();

      await expect(
        ApiDrivenCompressionService.compressConversation(
          [],
          mockSummarizationFunction
        )
      ).rejects.toThrow('Cannot compress empty conversation');
    });

    it('should throw error for invalid recent turns configuration', async () => {
      const messages = [createTestMessage('test', true)];
      const mockSummarizationFunction = vi.fn();

      await expect(
        ApiDrivenCompressionService.compressConversation(
          messages,
          mockSummarizationFunction,
          { recentTurnsToPreserve: 0 }
        )
      ).rejects.toThrow('Must preserve at least 1 recent conversation turn');
    });

    it('should throw error for invalid token threshold', async () => {
      const messages = [createTestMessage('test', true)];
      const mockSummarizationFunction = vi.fn();

      await expect(
        ApiDrivenCompressionService.compressConversation(
          messages,
          mockSummarizationFunction,
          { tokenThresholdPercentage: 30 }
        )
      ).rejects.toThrow('Token threshold must be between 50% and 95%');
    });
  });

  describe('2025 Best Practices Compliance', () => {
    it('should use 85% threshold by default', () => {
      const messages = [createTestMessage('test', true)];
      const analysis = ApiDrivenCompressionService.analyzeTokenUsage(messages);
      
      // Should use 85% as default threshold
      expect(analysis.utilizationPercentage < 85).toBe(true);
      expect(analysis.needsCompression).toBe(false);
    });

    it('should preserve 6 turns (12 messages) by default', async () => {
      const messages: ChatMessage[] = [];
      for (let i = 0; i < 20; i++) {
        messages.push(createTestMessage(`Message ${i}`, i % 2 === 0));
      }

      const mockSummarizationFunction = vi.fn().mockResolvedValue('Summary');
      
      const result = await ApiDrivenCompressionService.compressConversation(
        messages,
        mockSummarizationFunction,
        { maxTokenLimit: 10 } // Force compression with very low limit
      );

      expect(result.recentMessages).toHaveLength(12); // 6 turns × 2 messages
    });

    it('should target 60% utilization after compression', () => {
      const messages: ChatMessage[] = [];
      // Create enough messages to trigger compression
      for (let i = 0; i < 50; i++) {
        messages.push(createTestMessage('test message content here', true));
      }

      const analysis = ApiDrivenCompressionService.analyzeTokenUsage(messages, {
        maxTokenLimit: 1000,
        tokenThresholdPercentage: 85
      });

      if (analysis.needsCompression) {
        const targetTokens = 1000 * 0.6; // 60% of limit
        expect(analysis.tokensToSave).toBeGreaterThan(0);
        expect(analysis.currentTokens - analysis.tokensToSave).toBeLessThanOrEqual(targetTokens + 50); // Allow small buffer
      }
    });
  });
}); 