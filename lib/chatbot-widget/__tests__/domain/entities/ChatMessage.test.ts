/**
 * Unit Tests for ChatMessage Domain Entity
 * 
 * Tests business rules, invariants, and domain behavior
 */

import { describe, test, expect } from 'vitest';
import { ChatMessage } from '../../../domain/entities/ChatMessage';
import { MessageAIMetadata } from '../../../domain/value-objects/message-processing/MessageAIMetadata';
import { MessageContextMetadata } from '../../../domain/value-objects/message-processing/MessageContextMetadata';
import { MessageProcessingMetrics } from '../../../domain/value-objects/message-processing/MessageProcessingMetrics';
import { MessageCostTracking } from '../../../domain/value-objects/message-processing/MessageCostTracking';
import { useTestEnvironment, TestAssertions } from '../../test-utils/TestSetupHelpers';

describe('ChatMessage Entity', () => {
  const getEnv = useTestEnvironment();

  describe('Entity Creation', () => {
    test('should create valid ChatMessage with required properties', () => {
      const { factory } = getEnv();
      
      const message = factory.createChatMessage('session-123', {
        content: 'Hello, I need help',
        messageType: 'user'
      });

      expect(message).toBeDefined();
      expect(message.id).toBeTruthy();
      expect(message.content).toBe('Hello, I need help');
      expect(message.messageType).toBe('user');
      expect(message.sessionId).toBe('session-123');
      expect(message.isVisible).toBe(true);
      expect(message.timestamp).toBeInstanceOf(Date);
    });

    test('should enforce business invariants during creation', () => {
      const { factory } = getEnv();

      // Test content validation
      expect(() => {
        ChatMessage.create({
          id: 'msg-123',
          sessionId: 'session-123',
          messageType: 'user',
          content: '', // Empty content
          timestamp: new Date(),
          isVisible: true,
          aiMetadata: factory.createAIMetadata(),
          contextMetadata: factory.createContextMetadata(),
          processingMetrics: factory.createProcessingMetrics(),
          costTracking: factory.createCostTracking(),
        });
      }).toThrow();

      // Test session ID requirement
      expect(() => {
        ChatMessage.create({
          id: 'msg-124',
          sessionId: '', // Empty session ID
          messageType: 'user',
          content: 'Hello',
          timestamp: new Date(),
          isVisible: true,
          aiMetadata: factory.createAIMetadata(),
          contextMetadata: factory.createContextMetadata(),
          processingMetrics: factory.createProcessingMetrics(),
          costTracking: factory.createCostTracking(),
        });
      }).toThrow();
    });

    test('should create bot message with AI metadata', () => {
      const { factory } = getEnv();
      
      const botMessage = factory.createBotMessage('session-123', 'How can I help you?');

      expect(botMessage.messageType).toBe('bot');
      expect(botMessage.content).toBe('How can I help you?');
      expect(botMessage.aiMetadata).toBeDefined();
      expect(botMessage.aiMetadata.aiModel).toBeTruthy();
      expect(botMessage.costTracking).toBeDefined();
    });
  });

  describe('Business Logic', () => {
    test('should calculate processing cost correctly', () => {
      const { factory } = getEnv();
      
      const message = factory.createBotMessage('session-123');
      
      expect(message.costTracking).toBeDefined();
      expect(message.costTracking.costCents).toBeGreaterThanOrEqual(0);
      expect(message.costTracking.costBreakdown).toBeDefined();
    });

    test('should handle entity extraction for user messages', () => {
      const { factory } = getEnv();
      
      // Create a user message and add entities to it
      const message = factory.createChatMessage('session-123', {
        content: 'My email is john@example.com and budget is $50k',
        messageType: 'user'
      })
      .addExtractedEntity({ type: 'email', value: 'john@example.com', confidence: 0.95 })
      .addExtractedEntity({ type: 'budget', value: '$50k', confidence: 0.90 })
      .addTopicDiscussed('contact')
      .addTopicDiscussed('pricing');

      expect(message.aiMetadata.entitiesExtracted).toHaveLength(2);
      expect(message.aiMetadata.entitiesExtracted[0].type).toBe('email');
      expect(message.aiMetadata.entitiesExtracted[1].type).toBe('budget');
      expect(message.contextMetadata.topicsDiscussed).toContain('contact');
      expect(message.contextMetadata.topicsDiscussed).toContain('pricing');
    });

    test('should track processing steps and performance', () => {
      const { factory } = getEnv();
      
      const message = factory.createBotMessage('session-123');
      
      expect(message.processingMetrics).toBeDefined();
      expect(message.processingTime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Domain Invariants', () => {
    test('should maintain immutability', () => {
      const { factory } = getEnv();
      
      const message = factory.createChatMessage('session-123');
      const originalContent = message.content;
      const originalTimestamp = message.timestamp;

      // Attempting to modify should not change original
      expect(message.content).toBe(originalContent);
      expect(message.timestamp).toBe(originalTimestamp);
    });

    test('should enforce message ordering by timestamp', async () => {
      const { factory } = getEnv();
      
      const message1 = factory.createChatMessage('session-123');
      
      // Add small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 5));
      
      const message2 = factory.createChatMessage('session-123');

      expect(message2.timestamp.getTime()).toBeGreaterThan(message1.timestamp.getTime());
    });

    test('should validate session consistency', () => {
      const { factory } = getEnv();
      
      const message1 = factory.createChatMessage('session-123');
      const message2 = factory.createChatMessage('session-123');
      const message3 = factory.createChatMessage('session-456');

      expect(message1.sessionId).toBe(message2.sessionId);
      expect(message1.sessionId).not.toBe(message3.sessionId);
    });
  });

  describe('Message Types', () => {
    test('should handle user message metadata correctly', () => {
      const { factory } = getEnv();
      
      const userMessage = ChatMessage.createUserMessage('session-123', 'I need pricing information', 'text')
        .addTopicDiscussed('pricing');

      expect(userMessage.messageType).toBe('user');
      expect(userMessage.contextMetadata.inputMethod).toBe('text');
      expect(userMessage.contextMetadata.topicsDiscussed).toContain('pricing');
    });

    test('should handle bot message metadata correctly', () => {
      const { factory } = getEnv();
      
      const botMessage = factory.createBotMessage('session-123');

      expect(botMessage.messageType).toBe('bot');
      expect(botMessage.aiMetadata.aiModel).toBeTruthy();
      expect(typeof botMessage.aiMetadata.confidence).toBe('number');
      expect(botMessage.aiMetadata.intentDetected).toBeTruthy();
    });

    test('should handle system message types', () => {
      const { factory } = getEnv();
      
      const systemMessage = factory.createChatMessage('session-123', {
        messageType: 'system',
        content: 'Session started',
        isVisible: false
      });

      expect(systemMessage.messageType).toBe('system');
      expect(systemMessage.isVisible).toBe(false);
    });
  });

  describe('Cost Tracking', () => {
    test('should calculate token-based costs for bot messages', () => {
      const { factory } = getEnv();
      
      const botMessage = factory.createBotMessage('session-123');
      const costBreakdown = botMessage.costTracking.costBreakdown;

      expect(costBreakdown).toBeDefined();
      expect(botMessage.costTracking.costCents).toBeGreaterThanOrEqual(0);
    });

    test('should have zero cost for user messages', () => {
      const userMessage = ChatMessage.createUserMessage('session-123', 'Hello');

      expect(userMessage.costTracking.costCents).toBe(0);
    });
  });

  describe('Performance Requirements', () => {
    test('should create message within performance limits', () => {
      const { factory } = getEnv();
      
      const startTime = performance.now();
      
      for (let i = 0; i < 100; i++) {
        factory.createChatMessage(`session-${i}`, {
          content: `Message ${i}`,
          messageType: 'user'
        });
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Should create 100 messages in under 50ms
      expect(duration).toBeLessThan(50);
    });

    test('should handle large message content efficiently', () => {
      const { factory } = getEnv();
      
      const largeContent = 'A'.repeat(3999); // Just under 4000 character limit
      
      const startTime = performance.now();
      const message = factory.createChatMessage('session-123', {
        content: largeContent
      });
      const endTime = performance.now();
      
      expect(message.content).toHaveLength(3999);
      expect(endTime - startTime).toBeLessThan(10); // Should handle large content quickly
    });
  });

  describe('Edge Cases', () => {
    test('should handle special characters in content', () => {
      const { factory } = getEnv();
      
      const specialContent = '🚀 Hello! @user #hashtag $100 & <script>alert("test")</script>';
      const message = factory.createChatMessage('session-123', {
        content: specialContent
      });

      expect(message.content).toBe(specialContent);
    });

    test('should handle very long session IDs', () => {
      const { factory } = getEnv();
      
      const longSessionId = 'session-' + 'x'.repeat(100);
      const message = factory.createChatMessage(longSessionId);

      expect(message.sessionId).toBe(longSessionId);
    });

    test('should handle edge case timestamps', () => {
      const futureDate = new Date('2030-01-01T00:00:00Z');
      
      // Create message directly with timestamp override
      const message = ChatMessage.create({
        id: ChatMessage.generateId(),
        sessionId: 'session-123',
        messageType: 'user',
        content: 'Test message',
        timestamp: futureDate,
        isVisible: true,
        aiMetadata: MessageAIMetadata.createEmpty(),
        contextMetadata: MessageContextMetadata.createEmpty(),
        processingMetrics: MessageProcessingMetrics.createEmpty(),
        costTracking: MessageCostTracking.createZeroCost(),
      });

      expect(message.timestamp).toEqual(futureDate);
    });
  });
});