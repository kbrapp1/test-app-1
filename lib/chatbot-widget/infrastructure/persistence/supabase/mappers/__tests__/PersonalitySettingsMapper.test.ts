/**
 * PersonalitySettingsMapper Tests
 * 
 * Tests for data integrity between database JSONB and domain value objects.
 * Critical for ensuring proper personality configuration persistence.
 */

import { describe, it, expect } from 'vitest';
import { PersonalitySettingsMapper } from '../PersonalitySettingsMapper';
import { PersonalitySettings } from '../../../../../domain/value-objects/ai-configuration/PersonalitySettings';

describe('PersonalitySettingsMapper', () => {
  describe('fromJsonb', () => {
    it('should create PersonalitySettings with default values for empty data', () => {
      const result = PersonalitySettingsMapper.fromJsonb(null);

      expect(result).toBeInstanceOf(PersonalitySettings);
      expect(result.tone).toBe('professional');
      expect(result.communicationStyle).toBe('helpful');
      expect(result.responseLength).toBe('adaptive');
      expect(result.escalationTriggers).toEqual([]);
      expect(result.customInstructions).toBe('');
    });

    it('should create PersonalitySettings with default values for undefined data', () => {
      const result = PersonalitySettingsMapper.fromJsonb(undefined);

      expect(result).toBeInstanceOf(PersonalitySettings);
      expect(result.tone).toBe('professional');
      expect(result.communicationStyle).toBe('helpful');
      expect(result.responseLength).toBe('adaptive');
    });

    it('should map complete JSONB data to PersonalitySettings', () => {
      const jsonbData = {
        tone: 'friendly',
        communicationStyle: 'conversational',
        responseLength: 'detailed',
        escalationTriggers: ['angry', 'confused', 'technical'],
        responseBehavior: {
          useEmojis: true,
          askFollowUpQuestions: false,
          proactiveOffering: true,
          personalizeResponses: false,
          acknowledgePreviousInteractions: true
        },
        conversationFlow: {
          greetingMessage: 'Welcome! How can I help?',
          fallbackMessage: 'Could you clarify that?',
          escalationMessage: 'Let me get someone to help.',
          endConversationMessage: 'Thanks for visiting!',
          leadCapturePrompt: 'May I have your email?',
          maxConversationTurns: 15,
          inactivityTimeout: 600
        },
        customInstructions: 'Always be helpful and polite'
      };

      const result = PersonalitySettingsMapper.fromJsonb(jsonbData);

      expect(result.tone).toBe('friendly');
      expect(result.communicationStyle).toBe('conversational');
      expect(result.responseLength).toBe('detailed');
      expect(result.escalationTriggers).toEqual(['angry', 'confused', 'technical']);
      expect(result.responseBehavior.useEmojis).toBe(true);
      expect(result.responseBehavior.askFollowUpQuestions).toBe(false);
      expect(result.conversationFlow.greetingMessage).toBe('Welcome! How can I help?');
      expect(result.conversationFlow.maxConversationTurns).toBe(15);
      expect(result.customInstructions).toBe('Always be helpful and polite');
    });

    it('should handle partial JSONB data with proper defaults', () => {
      const partialData = {
        tone: 'casual',
        escalationTriggers: ['help'],
        responseBehavior: {
          useEmojis: true
        }
      };

      const result = PersonalitySettingsMapper.fromJsonb(partialData);

      expect(result.tone).toBe('casual');
      expect(result.communicationStyle).toBe('helpful'); // Default
      expect(result.escalationTriggers).toEqual(['help']);
      expect(result.responseBehavior.useEmojis).toBe(true);
      expect(result.responseBehavior.askFollowUpQuestions).toBe(true); // Default true
      expect(result.conversationFlow.greetingMessage).toBe('Hello! How can I help you today?'); // Default
    });

    it('should handle invalid tone values by using the actual values (no fallback)', () => {
      const invalidData = {
        tone: 'invalid_tone',
        communicationStyle: 'invalid_style',
        responseLength: 'invalid_length'
      };

      const result = PersonalitySettingsMapper.fromJsonb(invalidData);

      // The mapper actually passes through values without validation - domain object validates
      expect(result.tone).toBe('invalid_tone');
      expect(result.communicationStyle).toBe('invalid_style');
      expect(result.responseLength).toBe('invalid_length');
    });

    it('should handle malformed JSONB structure and throw validation errors', () => {
      const malformedData = {
        tone: 123, // Wrong type
        escalationTriggers: 'not_an_array', // Will cause validation error
        responseBehavior: 'not_an_object',
        conversationFlow: null
      };

      // Should throw validation error due to escalationTriggers not being an array
      expect(() => PersonalitySettingsMapper.fromJsonb(malformedData)).toThrow('Escalation triggers must be an array');
    });

    it('should properly handle response behavior defaults', () => {
      const testCases = [
        {
          input: { responseBehavior: {} },
          expected: {
            useEmojis: false,
            askFollowUpQuestions: true,
            proactiveOffering: true,
            personalizeResponses: true,
            acknowledgePreviousInteractions: true
          }
        },
        {
          input: { 
            responseBehavior: { 
              useEmojis: false,
              askFollowUpQuestions: false,
              proactiveOffering: false 
            } 
          },
          expected: {
            useEmojis: false,
            askFollowUpQuestions: false,
            proactiveOffering: false,
            personalizeResponses: true, // Still defaults to true
            acknowledgePreviousInteractions: true // Still defaults to true
          }
        }
      ];

      testCases.forEach(({ input, expected }) => {
        const result = PersonalitySettingsMapper.fromJsonb(input);
        expect(result.responseBehavior).toEqual(expected);
      });
    });

    it('should properly handle conversation flow defaults', () => {
      const emptyFlowData = { conversationFlow: {} };
      const result = PersonalitySettingsMapper.fromJsonb(emptyFlowData);

      expect(result.conversationFlow.greetingMessage).toBe('Hello! How can I help you today?');
      expect(result.conversationFlow.fallbackMessage).toBe('I\'m not sure about that. Could you rephrase your question?');
      expect(result.conversationFlow.escalationMessage).toBe('Let me connect you with a team member.');
      expect(result.conversationFlow.endConversationMessage).toBe('Thank you for chatting with us!');
      expect(result.conversationFlow.leadCapturePrompt).toBe('Can I get your contact information to follow up?');
      expect(result.conversationFlow.maxConversationTurns).toBe(20);
      expect(result.conversationFlow.inactivityTimeout).toBe(300);
    });
  });

  describe('toJsonb', () => {
    it('should convert PersonalitySettings to JSONB format', () => {
      const personalitySettings = PersonalitySettings.create({
        tone: 'friendly',
        communicationStyle: 'sales-focused',
        responseLength: 'brief',
        escalationTriggers: ['pricing', 'technical'],
        responseBehavior: {
          useEmojis: true,
          askFollowUpQuestions: false,
          proactiveOffering: true,
          personalizeResponses: true,
          acknowledgePreviousInteractions: false
        },
        conversationFlow: {
          greetingMessage: 'Hi there!',
          fallbackMessage: 'Let me help clarify',
          escalationMessage: 'Connecting you now',
          endConversationMessage: 'Goodbye!',
          leadCapturePrompt: 'Your email please?',
          maxConversationTurns: 10,
          inactivityTimeout: 180
        },
        customInstructions: 'Be concise and direct'
      });

      const result = PersonalitySettingsMapper.toJsonb(personalitySettings);

      expect(result).toEqual({
        tone: 'friendly',
        communicationStyle: 'sales-focused',
        responseLength: 'brief',
        escalationTriggers: ['pricing', 'technical'],
        responseBehavior: {
          useEmojis: true,
          askFollowUpQuestions: false,
          proactiveOffering: true,
          personalizeResponses: true,
          acknowledgePreviousInteractions: false
        },
        conversationFlow: {
          greetingMessage: 'Hi there!',
          fallbackMessage: 'Let me help clarify',
          escalationMessage: 'Connecting you now',
          endConversationMessage: 'Goodbye!',
          leadCapturePrompt: 'Your email please?',
          maxConversationTurns: 10,
          inactivityTimeout: 180
        },
        customInstructions: 'Be concise and direct'
      });
    });

    it('should handle minimal PersonalitySettings with defaults', () => {
      const personalitySettings = PersonalitySettings.create({
        tone: 'professional',
        communicationStyle: 'helpful',
        responseLength: 'adaptive',
        escalationTriggers: [],
        responseBehavior: {
          useEmojis: false,
          askFollowUpQuestions: true,
          proactiveOffering: true,
          personalizeResponses: true,
          acknowledgePreviousInteractions: true
        },
        conversationFlow: {
          greetingMessage: 'Hello! How can I help you today?',
          fallbackMessage: 'I\'m not sure about that. Could you rephrase your question?',
          escalationMessage: 'Let me connect you with a team member.',
          endConversationMessage: 'Thank you for chatting with us!',
          leadCapturePrompt: 'Can I get your contact information to follow up?',
          maxConversationTurns: 20,
          inactivityTimeout: 300
        },
        customInstructions: ''
      });

      const result = PersonalitySettingsMapper.toJsonb(personalitySettings);

      expect(result).toHaveProperty('tone', 'professional');
      expect(result).toHaveProperty('communicationStyle', 'helpful');
      expect(result).toHaveProperty('responseLength', 'adaptive');
      expect(result).toHaveProperty('escalationTriggers', []);
      expect(result).toHaveProperty('customInstructions', '');
    });
  });

  describe('Round-trip Data Integrity', () => {
    it('should maintain data integrity through round-trip conversion', () => {
      const originalData = {
        tone: 'casual',
        communicationStyle: 'direct',
        responseLength: 'detailed',
        escalationTriggers: ['angry', 'frustrated'],
        responseBehavior: {
          useEmojis: true,
          askFollowUpQuestions: false,
          proactiveOffering: false,
          personalizeResponses: true,
          acknowledgePreviousInteractions: false
        },
        conversationFlow: {
          greetingMessage: 'Hey! What\'s up?',
          fallbackMessage: 'Hmm, not sure about that',
          escalationMessage: 'Let me get help',
          endConversationMessage: 'See ya!',
          leadCapturePrompt: 'Contact info?',
          maxConversationTurns: 25,
          inactivityTimeout: 450
        },
        customInstructions: 'Keep it casual but informative'
      };

      // JSONB -> Domain -> JSONB
      const domainObject = PersonalitySettingsMapper.fromJsonb(originalData);
      const backToJsonb = PersonalitySettingsMapper.toJsonb(domainObject);

      expect(backToJsonb).toEqual(originalData);
    });

    it('should handle edge cases in round-trip conversion', () => {
      const edgeCaseData = {
        tone: 'formal',
        escalationTriggers: [],
        responseBehavior: {
          useEmojis: false
          // Missing other properties - should get defaults
        },
        conversationFlow: {
          maxConversationTurns: 1,
          inactivityTimeout: 30
          // Missing other properties - should get defaults
        }
      };

      const domainObject = PersonalitySettingsMapper.fromJsonb(edgeCaseData);
      const backToJsonb = PersonalitySettingsMapper.toJsonb(domainObject);

      // Should include all properties with proper defaults
      expect(backToJsonb).toHaveProperty('tone', 'formal');
      expect(backToJsonb).toHaveProperty('communicationStyle', 'helpful');
      expect(backToJsonb).toHaveProperty('escalationTriggers', []);
      expect((backToJsonb as any).responseBehavior.askFollowUpQuestions).toBe(true);
      expect((backToJsonb as any).conversationFlow.maxConversationTurns).toBe(1);
      expect((backToJsonb as any).conversationFlow.greetingMessage).toBe('Hello! How can I help you today?');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle null and undefined gracefully', () => {
      expect(() => PersonalitySettingsMapper.fromJsonb(null)).not.toThrow();
      expect(() => PersonalitySettingsMapper.fromJsonb(undefined)).not.toThrow();
      
      const resultNull = PersonalitySettingsMapper.fromJsonb(null);
      const resultUndefined = PersonalitySettingsMapper.fromJsonb(undefined);
      
      expect(resultNull).toBeInstanceOf(PersonalitySettings);
      expect(resultUndefined).toBeInstanceOf(PersonalitySettings);
    });

    it('should handle primitive types as input gracefully', () => {
      const primitives = [
        'string',
        123,
        true,
        false
      ];

      primitives.forEach(primitive => {
        expect(() => PersonalitySettingsMapper.fromJsonb(primitive)).not.toThrow();
        const result = PersonalitySettingsMapper.fromJsonb(primitive);
        expect(result).toBeInstanceOf(PersonalitySettings);
        expect(result.tone).toBe('professional'); // Should use defaults
      });
    });

    it('should handle arrays as input gracefully', () => {
      const arrayInput = ['item1', 'item2'];
      
      expect(() => PersonalitySettingsMapper.fromJsonb(arrayInput)).not.toThrow();
      const result = PersonalitySettingsMapper.fromJsonb(arrayInput);
      expect(result).toBeInstanceOf(PersonalitySettings);
      expect(result.tone).toBe('professional'); // Should use defaults
    });

    it('should handle deeply nested invalid data', () => {
      const invalidNestedData = {
        responseBehavior: {
          nestedInvalid: {
            deeplyNested: {
              value: 'should not break mapping'
            }
          }
        },
        conversationFlow: {
          maxConversationTurns: 'not_a_number',
          inactivityTimeout: null
        }
      };

      expect(() => PersonalitySettingsMapper.fromJsonb(invalidNestedData)).not.toThrow();
      const result = PersonalitySettingsMapper.fromJsonb(invalidNestedData);
      
      expect(result.conversationFlow.maxConversationTurns).toBe('not_a_number'); // Actual value passed through
      expect(result.conversationFlow.inactivityTimeout).toBe(300); // Default fallback for null
    });
  });

  describe('Type Safety and Validation', () => {
    it('should preserve type safety for enum values', () => {
      const validEnums = {
        tone: 'friendly',
        communicationStyle: 'sales-focused',
        responseLength: 'brief'
      };

      const result = PersonalitySettingsMapper.fromJsonb(validEnums);
      
      expect(['professional', 'friendly', 'casual', 'formal']).toContain(result.tone);
      expect(['helpful', 'direct', 'conversational', 'sales-focused']).toContain(result.communicationStyle);
      expect(['adaptive', 'brief', 'detailed']).toContain(result.responseLength);
    });

    it('should maintain numeric constraints for conversation flow', () => {
      const numericData = {
        conversationFlow: {
          maxConversationTurns: 50,
          inactivityTimeout: 1800
        }
      };

      const result = PersonalitySettingsMapper.fromJsonb(numericData);
      
      expect(typeof result.conversationFlow.maxConversationTurns).toBe('number');
      expect(typeof result.conversationFlow.inactivityTimeout).toBe('number');
      expect(result.conversationFlow.maxConversationTurns).toBe(50);
      expect(result.conversationFlow.inactivityTimeout).toBe(1800);
    });

    it('should ensure boolean integrity for response behavior', () => {
      const booleanData = {
        responseBehavior: {
          useEmojis: true,
          askFollowUpQuestions: false,
          proactiveOffering: true,
          personalizeResponses: false,
          acknowledgePreviousInteractions: true
        }
      };

      const result = PersonalitySettingsMapper.fromJsonb(booleanData);
      
      Object.values(result.responseBehavior).forEach(value => {
        expect(typeof value).toBe('boolean');
      });
      
      expect(result.responseBehavior.useEmojis).toBe(true);
      expect(result.responseBehavior.askFollowUpQuestions).toBe(false);
    });
  });
});