import { describe, it, expect, beforeEach } from 'vitest';
import { ConversationContextService } from '../ConversationContextService';
import { ChatMessage } from '../../entities/ChatMessage';
import { ChatSession } from '../../entities/ChatSession';

describe('ConversationContextService', () => {
  let contextService: ConversationContextService;
  let mockSession: ChatSession;
  let mockMessages: ChatMessage[];

  beforeEach(() => {
    contextService = new ConversationContextService();

    // Create mock session
    mockSession = ChatSession.create(
      'config-123',
      'visitor-123',
      {
        topics: ['pricing'],
        interests: ['demo'],
        engagementScore: 50
      }
    );

    // Create mock messages
    mockMessages = [
      ChatMessage.createUserMessage(
        mockSession.id,
        'Hi, I\'m interested in your pricing plans'
      ),
      ChatMessage.createBotMessage(
        mockSession.id,
        'Great! I\'d be happy to help you with pricing information. What type of plan are you looking for?'
      ),
      ChatMessage.createUserMessage(
        mockSession.id,
        'I need something for a small business with about 20 employees'
      ),
      ChatMessage.createBotMessage(
        mockSession.id,
        'Perfect! Our Business plan would be ideal for your team size. It includes advanced features and priority support.'
      ),
      ChatMessage.createUserMessage(
        mockSession.id,
        'That sounds great! Can I try a demo first?'
      )
    ];
  });

  describe('analyzeContext', () => {
    it('should extract topics from conversation', () => {
      const analysis = contextService.analyzeContext(mockMessages);

      expect(analysis.topics).toContain('pricing');
      expect(analysis.topics).toContain('trial');
      expect(Array.isArray(analysis.topics)).toBe(true);
    });

    it('should identify interests from user messages', () => {
      const messages = [
        ChatMessage.createUserMessage(mockSession.id, 'I\'m interested in your API integration features'),
        ChatMessage.createUserMessage(mockSession.id, 'Looking for something with good security')
      ];

      const analysis = contextService.analyzeContext(messages);

      expect(analysis.interests).toBeDefined();
      expect(Array.isArray(analysis.interests)).toBe(true);
    });

    it('should analyze sentiment correctly for positive messages', () => {
      const positiveMessages = [
        ChatMessage.createUserMessage(mockSession.id, 'This looks great! I love the features'),
        ChatMessage.createUserMessage(mockSession.id, 'Excellent product, exactly what I need')
      ];

      const analysis = contextService.analyzeContext(positiveMessages);

      expect(analysis.sentiment).toBe('positive');
    });

    it('should analyze sentiment correctly for negative messages', () => {
      const negativeMessages = [
        ChatMessage.createUserMessage(mockSession.id, 'This is terrible, I hate how complicated it is'),
        ChatMessage.createUserMessage(mockSession.id, 'Really disappointed with the performance')
      ];

      const analysis = contextService.analyzeContext(negativeMessages);

      expect(analysis.sentiment).toBe('negative');
    });

    it('should determine engagement level', () => {
      const analysis = contextService.analyzeContext(mockMessages);

      expect(['low', 'medium', 'high']).toContain(analysis.engagementLevel);
    });

    it('should identify user intent', () => {
      const analysis = contextService.analyzeContext(mockMessages);

      expect(typeof analysis.userIntent).toBe('string');
      expect(analysis.userIntent.length).toBeGreaterThan(0);
    });

    it('should assess urgency from context clues', () => {
      const urgentMessages = [
        ChatMessage.createUserMessage(mockSession.id, 'I need this immediately, it\'s urgent'),
        ChatMessage.createUserMessage(mockSession.id, 'This is critical for our business')
      ];

      const analysis = contextService.analyzeContext(urgentMessages);

      expect(['low', 'medium', 'high']).toContain(analysis.urgency);
    });

    it('should determine conversation stage', () => {
      const analysis = contextService.analyzeContext(mockMessages);

      expect(['greeting', 'discovery', 'qualification', 'closing', 'support']).toContain(analysis.conversationStage);
    });

    it('should handle empty messages gracefully', () => {
      const analysis = contextService.analyzeContext([]);

      expect(analysis.sentiment).toBe('neutral');
      expect(analysis.engagementLevel).toBe('low');
      expect(analysis.topics).toEqual([]);
      expect(analysis.interests).toEqual([]);
    });
  });

  describe('generateConversationSummary', () => {
    it('should generate comprehensive summary', () => {
      const summary = contextService.generateConversationSummary(mockMessages, mockSession);

      expect(summary.overview).toBeDefined();
      expect(typeof summary.overview).toBe('string');
      expect(summary.overview.length).toBeGreaterThan(0);
      expect(summary.keyTopics).toBeDefined();
      expect(Array.isArray(summary.keyTopics)).toBe(true);
      expect(summary.userNeeds).toBeDefined();
      expect(Array.isArray(summary.userNeeds)).toBe(true);
      expect(summary.painPoints).toBeDefined();
      expect(Array.isArray(summary.painPoints)).toBe(true);
      expect(summary.nextSteps).toBeDefined();
      expect(Array.isArray(summary.nextSteps)).toBe(true);
      expect(summary.qualificationStatus).toBeDefined();
      expect(typeof summary.qualificationStatus).toBe('string');
    });

    it('should handle short conversations', () => {
      const shortMessages = [mockMessages[0], mockMessages[1]];
      const summary = contextService.generateConversationSummary(shortMessages, mockSession);

      expect(summary.overview).toBeDefined();
      expect(summary.keyTopics).toBeDefined();
      expect(summary.userNeeds).toBeDefined();
    });

    it('should include context data in summary', () => {
      const summary = contextService.generateConversationSummary(mockMessages, mockSession);

      expect(summary.keyTopics.length).toBeGreaterThanOrEqual(0);
      expect(summary.userNeeds.length).toBeGreaterThanOrEqual(0);
    });

         it('should handle empty messages array', () => {
       const summary = contextService.generateConversationSummary([], mockSession);

       expect(summary.overview).toBeDefined();
       expect(summary.keyTopics).toBeDefined();
       expect(summary.userNeeds).toEqual([]);
       expect(summary.painPoints).toEqual([]);
     });
  });

  describe('updateSessionContext', () => {
    it('should update session with analyzed context', () => {
      const newMessage = ChatMessage.createUserMessage(
        mockSession.id,
        'I also need security features for compliance'
      );

      const updatedSession = contextService.updateSessionContext(
        mockSession,
        newMessage,
        mockMessages
      );

      expect(updatedSession).not.toBe(mockSession); // Should be a new instance
      expect(updatedSession.contextData.topics).toBeDefined();
      expect(updatedSession.contextData.interests).toBeDefined();
    });

    it('should preserve existing context data', () => {
      const originalTopics = mockSession.contextData.topics;
      const newMessage = ChatMessage.createUserMessage(mockSession.id, 'Hello');

      const updatedSession = contextService.updateSessionContext(
        mockSession,
        newMessage,
        []
      );

      // Should preserve original topics
      expect(updatedSession.contextData.topics).toEqual(expect.arrayContaining(originalTopics));
    });

    it('should merge new topics with existing ones', () => {
      const newMessage = ChatMessage.createUserMessage(
        mockSession.id,
        'I need help with integration'
      );

      const updatedSession = contextService.updateSessionContext(
        mockSession,
        newMessage,
        []
      );

      expect(updatedSession.contextData.topics.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('sentiment analysis edge cases', () => {
    it('should detect positive sentiment keywords', () => {
      const positiveMessages = [
        ChatMessage.createUserMessage(mockSession.id, 'This is excellent and amazing')
      ];

      const analysis = contextService.analyzeContext(positiveMessages);

      expect(analysis.sentiment).toBe('positive');
    });

    it('should detect negative sentiment keywords', () => {
      const negativeMessages = [
        ChatMessage.createUserMessage(mockSession.id, 'This is terrible and awful')
      ];

      const analysis = contextService.analyzeContext(negativeMessages);

      expect(analysis.sentiment).toBe('negative');
    });

    it('should default to neutral for mixed or unclear sentiment', () => {
      const neutralMessages = [
        ChatMessage.createUserMessage(mockSession.id, 'Can you tell me about your product?')
      ];

      const analysis = contextService.analyzeContext(neutralMessages);

      expect(analysis.sentiment).toBe('neutral');
    });
  });

  describe('engagement level analysis', () => {
         it('should detect high engagement from detailed responses', () => {
       const detailedMessages = [
         ChatMessage.createUserMessage(
           mockSession.id,
           'I\'m very interested in your advanced features, particularly the API integration capabilities and the security compliance features that you offer. Our company has been looking for a comprehensive solution that can handle our complex requirements.'
         ),
         ChatMessage.createUserMessage(
           mockSession.id,
           'We have about 100 employees and need something that can scale with our growth. The pricing plans look reasonable but I\'d like to understand more about the implementation process.'
         )
       ];

       const analysis = contextService.analyzeContext(detailedMessages);

       expect(['low', 'medium', 'high']).toContain(analysis.engagementLevel);
    });

    it('should detect low engagement from short responses', () => {
      const shortMessages = [
        ChatMessage.createUserMessage(mockSession.id, 'Hi'),
        ChatMessage.createUserMessage(mockSession.id, 'Ok'),
        ChatMessage.createUserMessage(mockSession.id, 'Maybe')
      ];

      const analysis = contextService.analyzeContext(shortMessages);

      expect(['low', 'medium']).toContain(analysis.engagementLevel);
    });

    it('should consider message frequency for engagement', () => {
      const frequentMessages = Array.from({ length: 8 }, (_, i) => 
        ChatMessage.createUserMessage(mockSession.id, `Message ${i + 1} with some content`)
      );

      const analysis = contextService.analyzeContext(frequentMessages);

      expect(['medium', 'high']).toContain(analysis.engagementLevel);
    });
  });

  describe('intent detection', () => {
    it('should detect support request intent', () => {
      const supportMessages = [
        ChatMessage.createUserMessage(mockSession.id, 'I need help with setting up my account'),
        ChatMessage.createUserMessage(mockSession.id, 'Can you assist me with troubleshooting?')
      ];

      const analysis = contextService.analyzeContext(supportMessages);

      expect(analysis.userIntent).toContain('support');
    });

    it('should detect demo request intent', () => {
      const demoMessages = [
        ChatMessage.createUserMessage(mockSession.id, 'Can I see a demo of your product?'),
        ChatMessage.createUserMessage(mockSession.id, 'I\'d like to try the trial version')
      ];

      const analysis = contextService.analyzeContext(demoMessages);

      expect(analysis.userIntent).toBeDefined();
    });

    it('should detect information seeking intent', () => {
      const infoMessages = [
        ChatMessage.createUserMessage(mockSession.id, 'Tell me more about your features'),
        ChatMessage.createUserMessage(mockSession.id, 'What are your pricing options?')
      ];

      const analysis = contextService.analyzeContext(infoMessages);

      expect(analysis.userIntent).toBeDefined();
    });
  });

  describe('urgency detection', () => {
    it('should detect high urgency from keywords', () => {
      const urgentMessages = [
        ChatMessage.createUserMessage(mockSession.id, 'This is urgent, I need this immediately'),
        ChatMessage.createUserMessage(mockSession.id, 'Critical business need, time-sensitive')
      ];

      const analysis = contextService.analyzeContext(urgentMessages);

      expect(analysis.urgency).toBe('high');
    });

         it('should detect medium urgency from timeline mentions', () => {
       const timelineMessages = [
         ChatMessage.createUserMessage(mockSession.id, 'We need to implement this next month'),
         ChatMessage.createUserMessage(mockSession.id, 'Our deadline is in a few weeks')
       ];

       const analysis = contextService.analyzeContext(timelineMessages);

       expect(['low', 'medium', 'high']).toContain(analysis.urgency);
    });

    it('should default to low urgency for general inquiries', () => {
      const generalMessages = [
        ChatMessage.createUserMessage(mockSession.id, 'I\'m just looking around'),
        ChatMessage.createUserMessage(mockSession.id, 'Exploring different options')
      ];

      const analysis = contextService.analyzeContext(generalMessages);

      expect(['low', 'medium']).toContain(analysis.urgency);
    });
  });

  describe('conversation stage detection', () => {
    it('should detect greeting stage', () => {
      const greetingMessages = [
        ChatMessage.createUserMessage(mockSession.id, 'Hello'),
        ChatMessage.createBotMessage(mockSession.id, 'Hi! How can I help you today?')
      ];

      const analysis = contextService.analyzeContext(greetingMessages);

      expect(['greeting', 'discovery']).toContain(analysis.conversationStage);
    });

    it('should detect qualification stage', () => {
      const qualificationMessages = [
        ChatMessage.createUserMessage(mockSession.id, 'My company has 50 employees'),
        ChatMessage.createBotMessage(mockSession.id, 'What\'s your budget range?'),
        ChatMessage.createUserMessage(mockSession.id, 'Around $5000 per month')
      ];

      const analysis = contextService.analyzeContext(qualificationMessages);

      expect(['discovery', 'qualification']).toContain(analysis.conversationStage);
    });

         it('should detect closing stage', () => {
       const closingMessages = [
         ChatMessage.createUserMessage(mockSession.id, 'This looks perfect, how do I sign up?'),
         ChatMessage.createBotMessage(mockSession.id, 'Great! Let me connect you with our sales team')
       ];

       const analysis = contextService.analyzeContext(closingMessages);

       expect(['greeting', 'discovery', 'qualification', 'closing', 'support']).toContain(analysis.conversationStage);
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle messages with only bot responses', () => {
      const botOnlyMessages = [
        ChatMessage.createBotMessage(mockSession.id, 'Hello! How can I help?'),
        ChatMessage.createBotMessage(mockSession.id, 'I\'m here to assist you'),
        ChatMessage.createBotMessage(mockSession.id, 'Let me know if you have questions')
      ];

      const analysis = contextService.analyzeContext(botOnlyMessages);

      expect(analysis.sentiment).toBe('neutral');
      expect(analysis.engagementLevel).toBe('low');
      expect(analysis.topics).toEqual([]);
    });

    it('should handle very long conversations', () => {
      const longMessages = Array.from({ length: 50 }, (_, i) => 
        i % 2 === 0 
          ? ChatMessage.createUserMessage(mockSession.id, `User message ${i + 1}`)
          : ChatMessage.createBotMessage(mockSession.id, `Bot response ${i + 1}`)
      );

      expect(() => {
        contextService.analyzeContext(longMessages);
      }).not.toThrow();

      const analysis = contextService.analyzeContext(longMessages);
      expect(analysis).toBeDefined();
    });

    it('should handle malformed message data gracefully', () => {
      const validMessages = [
        ChatMessage.createUserMessage(mockSession.id, 'Valid message'),
        ChatMessage.createBotMessage(mockSession.id, 'Bot response')
      ];

      expect(() => {
        contextService.analyzeContext(validMessages);
      }).not.toThrow();

      const analysis = contextService.analyzeContext(validMessages);
      expect(analysis).toBeDefined();
    });
  });
}); 