import { describe, it, expect } from 'vitest';
import { 
  BotPersonality, 
  CommunicationTone, 
  ResponseLength, 
  CommunicationStyle,
  EscalationTrigger,
  ResponseBehavior,
  ConversationFlow
} from '../BotPersonality';

describe('BotPersonality Value Object', () => {
  describe('constructor validation', () => {
    it('should create valid BotPersonality', () => {
      const escalationTriggers: EscalationTrigger[] = [
        { type: 'keyword', value: 'help', description: 'User requests help' }
      ];

      const responseBehavior: ResponseBehavior = {
        useEmojis: false,
        askFollowUpQuestions: true,
        proactiveOffering: true,
        personalizeResponses: true,
        acknowledgePreviousInteractions: true
      };

      const conversationFlow: ConversationFlow = {
        maxMessagesBeforeLeadCapture: 5,
        leadCaptureStrategy: 'contextual',
        qualificationQuestionTiming: 'mid',
        escalationPreference: 'human'
      };

      const personality = new BotPersonality(
        CommunicationTone.PROFESSIONAL,
        ResponseLength.ADAPTIVE,
        CommunicationStyle.HELPFUL,
        escalationTriggers,
        responseBehavior,
        conversationFlow,
        'Custom instructions here'
      );

      expect(personality.tone).toBe(CommunicationTone.PROFESSIONAL);
      expect(personality.responseLength).toBe(ResponseLength.ADAPTIVE);
      expect(personality.communicationStyle).toBe(CommunicationStyle.HELPFUL);
      expect(personality.escalationTriggers).toEqual(escalationTriggers);
      expect(personality.responseBehavior).toEqual(responseBehavior);
      expect(personality.conversationFlow).toEqual(conversationFlow);
      expect(personality.customInstructions).toBe('Custom instructions here');
    });

    it('should throw error for invalid communication tone', () => {
      expect(() => {
        new BotPersonality(
          'invalid_tone' as any,
          ResponseLength.ADAPTIVE,
          CommunicationStyle.HELPFUL,
          [],
          BotPersonality.getDefaultResponseBehavior(),
          BotPersonality.getDefaultConversationFlow()
        );
      }).toThrow('Invalid communication tone: invalid_tone');
    });

    it('should throw error for invalid response length', () => {
      expect(() => {
        new BotPersonality(
          CommunicationTone.PROFESSIONAL,
          'invalid_length' as any,
          CommunicationStyle.HELPFUL,
          [],
          BotPersonality.getDefaultResponseBehavior(),
          BotPersonality.getDefaultConversationFlow()
        );
      }).toThrow('Invalid response length: invalid_length');
    });

    it('should throw error for invalid communication style', () => {
      expect(() => {
        new BotPersonality(
          CommunicationTone.PROFESSIONAL,
          ResponseLength.ADAPTIVE,
          'invalid_style' as any,
          [],
          BotPersonality.getDefaultResponseBehavior(),
          BotPersonality.getDefaultConversationFlow()
        );
      }).toThrow('Invalid communication style: invalid_style');
    });

    it('should throw error for non-array escalation triggers', () => {
      expect(() => {
        new BotPersonality(
          CommunicationTone.PROFESSIONAL,
          ResponseLength.ADAPTIVE,
          CommunicationStyle.HELPFUL,
          'invalid' as any,
          BotPersonality.getDefaultResponseBehavior(),
          BotPersonality.getDefaultConversationFlow()
        );
      }).toThrow('Escalation triggers must be an array');
    });

    it('should throw error for invalid escalation trigger type', () => {
      const invalidTriggers = [
        { type: 'invalid_type', value: 'test', description: 'Test' }
      ] as any;

      expect(() => {
        new BotPersonality(
          CommunicationTone.PROFESSIONAL,
          ResponseLength.ADAPTIVE,
          CommunicationStyle.HELPFUL,
          invalidTriggers,
          BotPersonality.getDefaultResponseBehavior(),
          BotPersonality.getDefaultConversationFlow()
        );
      }).toThrow('Invalid escalation trigger type at index 0: invalid_type');
    });

    it('should throw error for empty escalation trigger value', () => {
      const invalidTriggers = [
        { type: 'keyword', value: '', description: 'Test' }
      ] as any;

      expect(() => {
        new BotPersonality(
          CommunicationTone.PROFESSIONAL,
          ResponseLength.ADAPTIVE,
          CommunicationStyle.HELPFUL,
          invalidTriggers,
          BotPersonality.getDefaultResponseBehavior(),
          BotPersonality.getDefaultConversationFlow()
        );
      }).toThrow('Escalation trigger value is required at index 0');
    });

    it('should throw error for invalid threshold value', () => {
      const invalidTriggers = [
        { type: 'sentiment', value: 'low', threshold: 150, description: 'Test' }
      ] as any;

      expect(() => {
        new BotPersonality(
          CommunicationTone.PROFESSIONAL,
          ResponseLength.ADAPTIVE,
          CommunicationStyle.HELPFUL,
          invalidTriggers,
          BotPersonality.getDefaultResponseBehavior(),
          BotPersonality.getDefaultConversationFlow()
        );
      }).toThrow('Escalation trigger threshold must be a number between 0 and 100 at index 0');
    });

    it('should throw error for invalid response behavior', () => {
      const invalidBehavior = {
        useEmojis: 'yes', // Should be boolean
        askFollowUpQuestions: true,
        proactiveOffering: true,
        personalizeResponses: true,
        acknowledgePreviousInteractions: true
      } as any;

      expect(() => {
        new BotPersonality(
          CommunicationTone.PROFESSIONAL,
          ResponseLength.ADAPTIVE,
          CommunicationStyle.HELPFUL,
          [],
          invalidBehavior,
          BotPersonality.getDefaultConversationFlow()
        );
      }).toThrow('useEmojis must be a boolean');
    });

    it('should throw error for invalid conversation flow', () => {
      const invalidFlow = {
        maxMessagesBeforeLeadCapture: 0, // Should be positive
        leadCaptureStrategy: 'contextual',
        qualificationQuestionTiming: 'mid',
        escalationPreference: 'human'
      } as any;

      expect(() => {
        new BotPersonality(
          CommunicationTone.PROFESSIONAL,
          ResponseLength.ADAPTIVE,
          CommunicationStyle.HELPFUL,
          [],
          BotPersonality.getDefaultResponseBehavior(),
          invalidFlow
        );
      }).toThrow('maxMessagesBeforeLeadCapture must be a positive number');
    });
  });

  describe('system prompt generation', () => {
    it('should generate comprehensive system prompt', () => {
      const personality = BotPersonality.createDefault();
      const prompt = personality.generateSystemPrompt();

      expect(prompt).toContain('AI chatbot assistant');
      expect(prompt).toContain('Communication Style:');
      expect(prompt).toContain('Behavior Guidelines:');
      expect(prompt).toContain('Conversation Management:');
      expect(prompt).toContain('Professional and business-appropriate');
      expect(prompt).toContain('contextual');
    });

    it('should include custom instructions in prompt', () => {
      const personality = new BotPersonality(
        CommunicationTone.FRIENDLY,
        ResponseLength.CONCISE,
        CommunicationStyle.CONVERSATIONAL,
        [],
        BotPersonality.getDefaultResponseBehavior(),
        BotPersonality.getDefaultConversationFlow(),
        'Always mention our 24/7 support.'
      );

      const prompt = personality.generateSystemPrompt();
      expect(prompt).toContain('Additional Instructions:');
      expect(prompt).toContain('Always mention our 24/7 support.');
    });

    it('should include escalation triggers in prompt', () => {
      const triggers: EscalationTrigger[] = [
        { type: 'keyword', value: 'angry,frustrated', description: 'Customer is upset' },
        { type: 'complexity', value: 'complex', threshold: 80, description: 'Question too complex' }
      ];

      const personality = new BotPersonality(
        CommunicationTone.EMPATHETIC,
        ResponseLength.DETAILED,
        CommunicationStyle.HELPFUL,
        triggers,
        BotPersonality.getDefaultResponseBehavior(),
        BotPersonality.getDefaultConversationFlow()
      );

      const prompt = personality.generateSystemPrompt();
      expect(prompt).toContain('Escalation Triggers:');
      expect(prompt).toContain('Customer is upset');
      expect(prompt).toContain('Question too complex');
    });
  });

  describe('escalation detection', () => {
    let personality: BotPersonality;

    beforeEach(() => {
      const triggers: EscalationTrigger[] = [
        { type: 'keyword', value: 'human,agent,person', description: 'Request for human' },
        { type: 'sentiment', value: 'negative', threshold: 30, description: 'Negative sentiment' },
        { type: 'frustration', value: 'frustration', threshold: 70, description: 'High frustration' },
        { type: 'complexity', value: 'complex', threshold: 80, description: 'Too complex' },
        { type: 'request', value: 'call me,phone call,speak to manager', description: 'Phone request' }
      ];

      personality = new BotPersonality(
        CommunicationTone.PROFESSIONAL,
        ResponseLength.ADAPTIVE,
        CommunicationStyle.HELPFUL,
        triggers,
        BotPersonality.getDefaultResponseBehavior(),
        BotPersonality.getDefaultConversationFlow()
      );
    });

    it('should detect keyword escalation trigger', () => {
      const result = personality.shouldEscalate('I want to speak to a human please');

      expect(result.shouldEscalate).toBe(true);
      expect(result.trigger?.type).toBe('keyword');
      expect(result.reason).toContain('human');
    });

    it('should detect sentiment escalation trigger', () => {
      const result = personality.shouldEscalate('This is terrible', {
        sentimentScore: 25 // Below threshold of 30
      });

      expect(result.shouldEscalate).toBe(true);
      expect(result.trigger?.type).toBe('sentiment');
      expect(result.reason).toContain('Sentiment score 25 below threshold 30');
    });

    it('should detect frustration escalation trigger', () => {
      const result = personality.shouldEscalate('I am so frustrated!', {
        frustrationScore: 75 // Above threshold of 70
      });

      expect(result.shouldEscalate).toBe(true);
      expect(result.trigger?.type).toBe('frustration');
      expect(result.reason).toContain('Frustration score 75 above threshold 70');
    });

    it('should detect complexity escalation trigger', () => {
      const result = personality.shouldEscalate('Complex technical question', {
        complexityScore: 85 // Above threshold of 80
      });

      expect(result.shouldEscalate).toBe(true);
      expect(result.trigger?.type).toBe('complexity');
      expect(result.reason).toContain('Complexity score 85 above threshold 80');
    });

    it('should detect request pattern escalation trigger', () => {
      const result = personality.shouldEscalate('Can you call me back please?');

      expect(result.shouldEscalate).toBe(true);
      expect(result.trigger?.type).toBe('request');
      expect(result.reason).toContain('call me');
    });

    it('should not escalate for normal messages', () => {
      const result = personality.shouldEscalate('What are your business hours?', {
        sentimentScore: 70,
        complexityScore: 30,
        frustrationScore: 20
      });

      expect(result.shouldEscalate).toBe(false);
      expect(result.trigger).toBeUndefined();
      expect(result.reason).toBeUndefined();
    });
  });

  describe('response length guidelines', () => {
    it('should provide concise guidelines', () => {
      const personality = new BotPersonality(
        CommunicationTone.PROFESSIONAL,
        ResponseLength.CONCISE,
        CommunicationStyle.DIRECT,
        [],
        BotPersonality.getDefaultResponseBehavior(),
        BotPersonality.getDefaultConversationFlow()
      );

      const guidelines = personality.getResponseLengthGuidelines();
      expect(guidelines.minWords).toBe(5);
      expect(guidelines.maxWords).toBe(25);
      expect(guidelines.description).toContain('brief');
    });

    it('should provide detailed guidelines', () => {
      const personality = new BotPersonality(
        CommunicationTone.PROFESSIONAL,
        ResponseLength.DETAILED,
        CommunicationStyle.EDUCATIONAL,
        [],
        BotPersonality.getDefaultResponseBehavior(),
        BotPersonality.getDefaultConversationFlow()
      );

      const guidelines = personality.getResponseLengthGuidelines();
      expect(guidelines.minWords).toBe(30);
      expect(guidelines.maxWords).toBe(100);
      expect(guidelines.description).toContain('comprehensive');
    });

    it('should provide adaptive guidelines', () => {
      const personality = new BotPersonality(
        CommunicationTone.PROFESSIONAL,
        ResponseLength.ADAPTIVE,
        CommunicationStyle.HELPFUL,
        [],
        BotPersonality.getDefaultResponseBehavior(),
        BotPersonality.getDefaultConversationFlow()
      );

      const guidelines = personality.getResponseLengthGuidelines();
      expect(guidelines.minWords).toBe(5);
      expect(guidelines.maxWords).toBe(75);
      expect(guidelines.description).toContain('Adapt');
    });
  });

  describe('immutability methods', () => {
    let personality: BotPersonality;

    beforeEach(() => {
      personality = BotPersonality.createDefault();
    });

    it('should create new instance with updated tone', () => {
      const updated = personality.withTone(CommunicationTone.FRIENDLY);

      expect(updated.tone).toBe(CommunicationTone.FRIENDLY);
      expect(updated.responseLength).toBe(personality.responseLength);
      expect(updated).not.toBe(personality);
    });

    it('should create new instance with updated response length', () => {
      const updated = personality.withResponseLength(ResponseLength.CONCISE);

      expect(updated.responseLength).toBe(ResponseLength.CONCISE);
      expect(updated.tone).toBe(personality.tone);
      expect(updated).not.toBe(personality);
    });

    it('should create new instance with updated communication style', () => {
      const updated = personality.withCommunicationStyle(CommunicationStyle.CONSULTATIVE);

      expect(updated.communicationStyle).toBe(CommunicationStyle.CONSULTATIVE);
      expect(updated.tone).toBe(personality.tone);
      expect(updated).not.toBe(personality);
    });

    it('should create new instance with updated escalation triggers', () => {
      const newTriggers: EscalationTrigger[] = [
        { type: 'keyword', value: 'urgent', description: 'Urgent request' }
      ];
      const updated = personality.withEscalationTriggers(newTriggers);

      expect(updated.escalationTriggers).toEqual(newTriggers);
      expect(updated.tone).toBe(personality.tone);
      expect(updated).not.toBe(personality);
    });

    it('should create new instance with updated response behavior', () => {
      const newBehavior: ResponseBehavior = {
        useEmojis: true,
        askFollowUpQuestions: false,
        proactiveOffering: false,
        personalizeResponses: false,
        acknowledgePreviousInteractions: false
      };
      const updated = personality.withResponseBehavior(newBehavior);

      expect(updated.responseBehavior).toEqual(newBehavior);
      expect(updated.tone).toBe(personality.tone);
      expect(updated).not.toBe(personality);
    });

    it('should create new instance with updated conversation flow', () => {
      const newFlow: ConversationFlow = {
        maxMessagesBeforeLeadCapture: 10,
        leadCaptureStrategy: 'upfront',
        qualificationQuestionTiming: 'early',
        escalationPreference: 'email'
      };
      const updated = personality.withConversationFlow(newFlow);

      expect(updated.conversationFlow).toEqual(newFlow);
      expect(updated.tone).toBe(personality.tone);
      expect(updated).not.toBe(personality);
    });

    it('should create new instance with updated custom instructions', () => {
      const newInstructions = 'New custom instructions';
      const updated = personality.withCustomInstructions(newInstructions);

      expect(updated.customInstructions).toBe(newInstructions);
      expect(updated.tone).toBe(personality.tone);
      expect(updated).not.toBe(personality);
    });
  });

  describe('equality and comparison', () => {
    it('should return true for equal personalities', () => {
      const personality1 = BotPersonality.createDefault();
      const personality2 = BotPersonality.createDefault();

      expect(personality1.equals(personality2)).toBe(true);
    });

    it('should return false for different tones', () => {
      const personality1 = BotPersonality.createDefault();
      const personality2 = personality1.withTone(CommunicationTone.FRIENDLY);

      expect(personality1.equals(personality2)).toBe(false);
    });

    it('should return false for different custom instructions', () => {
      const personality1 = BotPersonality.createDefault();
      const personality2 = personality1.withCustomInstructions('Different instructions');

      expect(personality1.equals(personality2)).toBe(false);
    });
  });

  describe('JSON serialization', () => {
    it('should convert to JSON correctly', () => {
      const personality = BotPersonality.createDefault();
      const json = personality.toJSON();

      expect(json).toHaveProperty('tone', CommunicationTone.PROFESSIONAL);
      expect(json).toHaveProperty('responseLength', ResponseLength.ADAPTIVE);
      expect(json).toHaveProperty('communicationStyle', CommunicationStyle.HELPFUL);
      expect(json).toHaveProperty('escalationTriggers');
      expect(json).toHaveProperty('responseBehavior');
      expect(json).toHaveProperty('conversationFlow');
      expect(json).toHaveProperty('customInstructions');
    });

    it('should create from JSON correctly', () => {
      const jsonData = {
        tone: CommunicationTone.FRIENDLY,
        responseLength: ResponseLength.CONCISE,
        communicationStyle: CommunicationStyle.CONVERSATIONAL,
        escalationTriggers: [],
        responseBehavior: BotPersonality.getDefaultResponseBehavior(),
        conversationFlow: BotPersonality.getDefaultConversationFlow(),
        customInstructions: 'Test instructions'
      };

      const personality = BotPersonality.fromJSON(jsonData);

      expect(personality.tone).toBe(CommunicationTone.FRIENDLY);
      expect(personality.responseLength).toBe(ResponseLength.CONCISE);
      expect(personality.communicationStyle).toBe(CommunicationStyle.CONVERSATIONAL);
      expect(personality.customInstructions).toBe('Test instructions');
    });

    it('should create from JSON with defaults for missing data', () => {
      const incompleteData = { tone: CommunicationTone.CASUAL };
      const personality = BotPersonality.fromJSON(incompleteData);

      expect(personality.tone).toBe(CommunicationTone.CASUAL);
      expect(personality.responseLength).toBe(ResponseLength.ADAPTIVE);
      expect(personality.communicationStyle).toBe(CommunicationStyle.HELPFUL);
      expect(personality.escalationTriggers).toEqual([]);
      expect(personality.customInstructions).toBe('');
    });
  });

  describe('factory methods', () => {
    it('should create default personality with correct values', () => {
      const defaultPersonality = BotPersonality.createDefault();

      expect(defaultPersonality.tone).toBe(CommunicationTone.PROFESSIONAL);
      expect(defaultPersonality.responseLength).toBe(ResponseLength.ADAPTIVE);
      expect(defaultPersonality.communicationStyle).toBe(CommunicationStyle.HELPFUL);
      expect(defaultPersonality.escalationTriggers).toHaveLength(3);
      expect(defaultPersonality.customInstructions).toBe('');
    });

    it('should get default escalation triggers', () => {
      const triggers = BotPersonality.getDefaultEscalationTriggers();

      expect(triggers).toHaveLength(3);
      expect(triggers[0].type).toBe('keyword');
      expect(triggers[0].value).toContain('human');
      expect(triggers[1].type).toBe('frustration');
      expect(triggers[2].type).toBe('complexity');
    });

    it('should get default response behavior', () => {
      const behavior = BotPersonality.getDefaultResponseBehavior();

      expect(behavior.useEmojis).toBe(false);
      expect(behavior.askFollowUpQuestions).toBe(true);
      expect(behavior.proactiveOffering).toBe(true);
      expect(behavior.personalizeResponses).toBe(true);
      expect(behavior.acknowledgePreviousInteractions).toBe(true);
    });

    it('should get default conversation flow', () => {
      const flow = BotPersonality.getDefaultConversationFlow();

      expect(flow.maxMessagesBeforeLeadCapture).toBe(5);
      expect(flow.leadCaptureStrategy).toBe('contextual');
      expect(flow.qualificationQuestionTiming).toBe('mid');
      expect(flow.escalationPreference).toBe('human');
    });
  });
}); 