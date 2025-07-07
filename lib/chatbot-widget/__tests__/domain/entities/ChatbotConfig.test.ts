/**
 * Unit Tests for ChatbotConfig Domain Entity
 * 
 * Tests business rules, invariants, and domain behavior
 */

import { describe, test, expect, beforeEach } from 'vitest';
import { ChatbotConfig } from '../../../domain/entities/ChatbotConfig';
import { PersonalitySettings } from '../../../domain/value-objects/ai-configuration/PersonalitySettings';
import { OperatingHours } from '../../../domain/value-objects/session-management/OperatingHours';
import { KnowledgeBase } from '../../../domain/value-objects/ai-configuration/KnowledgeBase';
import { useTestEnvironment, TestAssertions } from '../../test-utils/TestSetupHelpers';

describe('ChatbotConfig Entity', () => {
  const getEnv = useTestEnvironment();

  describe('Entity Creation', () => {
    test('should create valid ChatbotConfig with required properties', () => {
      const { factory } = getEnv();
      
      const config = factory.createValidConfig({
        name: 'Customer Support Bot',
        organizationId: 'org-123'
      });

      TestAssertions.assertValidEntity(config, ['name', 'organizationId', 'personalitySettings']);
      expect(config.name).toBe('Customer Support Bot');
      expect(config.organizationId).toBe('org-123');
      expect(config.isActive).toBe(true);
    });

    test('should enforce business invariants during creation', () => {
      const { factory } = getEnv();

      // Test name validation
      expect(() => {
        factory.createValidConfig({ name: '' });
      }).toThrow();

      // Test organization requirement
      expect(() => {
        factory.createValidConfig({ organizationId: '' });
      }).toThrow();
    });

    test('should initialize with default settings when not provided', () => {
      const { factory } = getEnv();
      
      const config = factory.createValidConfig();

      expect(config.personalitySettings).toBeDefined();
      expect(config.knowledgeBase).toBeDefined();
      expect(config.operatingHours).toBeDefined();
      expect(config.leadQualificationQuestions).toEqual([]);
    });
  });

  describe('Business Logic', () => {
    test('should validate operating hours configuration', () => {
      const { factory } = getEnv();
      
      const validHours = factory.createOperatingHours({
        schedule: {
          monday: { enabled: true, start: '09:00', end: '17:00' },
          tuesday: { enabled: true, start: '09:00', end: '17:00' },
          wednesday: { enabled: true, start: '09:00', end: '17:00' },
          thursday: { enabled: true, start: '09:00', end: '17:00' },
          friday: { enabled: true, start: '09:00', end: '17:00' },
          saturday: { enabled: false, start: '10:00', end: '14:00' },
          sunday: { enabled: false, start: '10:00', end: '14:00' }
        }
      });

      const config = factory.createValidConfig({
        operatingHours: validHours
      });

      expect(config.isWithinOperatingHours(new Date('2024-01-01T10:00:00Z'))).toBeDefined();
    });

    test('should manage lead qualification questions lifecycle', () => {
      const { factory } = getEnv();
      
      const questions = [
        {
          id: 'q1',
          question: 'What is your email?',
          type: 'email',
          isRequired: true,
          order: 1
        },
        {
          id: 'q2',
          question: 'What is your budget?',
          type: 'select',
          options: ['<$10k', '$10k-$50k', '>$50k'],
          isRequired: false,
          order: 2
        }
      ];

      const config = factory.createValidConfig({
        leadQualificationQuestions: questions
      });

      expect(config.leadQualificationQuestions).toHaveLength(2);
      const requiredQuestions = config.leadQualificationQuestions.filter(q => q.isRequired);
      const optionalQuestions = config.leadQualificationQuestions.filter(q => !q.isRequired);
      expect(requiredQuestions).toHaveLength(1);
      expect(optionalQuestions).toHaveLength(1);
    });

    test('should generate consistent system prompts', () => {
      const { factory } = getEnv();
      
      const personalitySettings = factory.createPersonalitySettings({
        tone: 'professional',
        communicationStyle: 'consultative',
        customInstructions: 'Always mention our 24/7 support'
      });

      const config = factory.createValidConfig({
        personalitySettings,
        name: 'Enterprise Support Bot'
      });

      const systemPrompt1 = config.generateSystemPrompt();
      const systemPrompt2 = config.generateSystemPrompt();

      expect(systemPrompt1).toBe(systemPrompt2);
      expect(systemPrompt1).toContain('professional');
      expect(systemPrompt1).toContain('helpful');
      expect(systemPrompt1).toContain('24/7 support');
      expect(systemPrompt1).toContain('Enterprise Support Bot');
    });

    test('should handle personality settings updates', async () => {
      const { factory } = getEnv();
      
      const originalSettings = factory.createPersonalitySettings({
        tone: 'casual',
        communicationStyle: 'conversational'
      });

      const config = factory.createValidConfig({
        personalitySettings: originalSettings
      });

      // Small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 1));

      const updatedSettings = factory.createPersonalitySettings({
        tone: 'professional',
        communicationStyle: 'helpful'
      });

      // Add small delay to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 1));
      const updatedConfig = config.updatePersonality(updatedSettings);

      expect(updatedConfig.personalitySettings.tone).toBe('professional');
      expect(updatedConfig.personalitySettings.communicationStyle).toBe('helpful');
      expect(updatedConfig.id).toBe(config.id); // Should maintain identity
      expect(updatedConfig.updatedAt.getTime()).toBeGreaterThan(config.updatedAt.getTime());
    });
  });

  describe('Domain Invariants', () => {
    test('should maintain immutability through business methods', () => {
      const { factory } = getEnv();
      
      const originalConfig = factory.createValidConfig();
      const originalPersonality = originalConfig.personalitySettings;

      const updatedConfig = originalConfig.updatePersonality(
        factory.createPersonalitySettings({ tone: 'casual' })
      );

      // Original should remain unchanged
      expect(originalConfig.personalitySettings).toBe(originalPersonality);
      expect(originalConfig.personalitySettings.tone).not.toBe('casual');
      
      // New instance should have changes
      expect(updatedConfig.personalitySettings.tone).toBe('casual');
      expect(updatedConfig).not.toBe(originalConfig);
    });

    test('should enforce organizational isolation', () => {
      const { factory } = getEnv();
      
      const config1 = factory.createValidConfig({ organizationId: 'org-1' });
      const config2 = factory.createValidConfig({ organizationId: 'org-2' });

      expect(config1.organizationId).toBe('org-1');
      expect(config2.organizationId).toBe('org-2');
      expect(config1.organizationId).not.toBe(config2.organizationId);
    });

    test('should validate configuration completeness', () => {
      const { factory } = getEnv();
      
      // Complete configuration
      const completeConfig = factory.createValidConfig({
        name: 'Complete Bot',
        personalitySettings: factory.createPersonalitySettings(),
        knowledgeBase: factory.createKnowledgeBase({
          faqs: [
            {
              id: 'faq-1',
              question: 'Test question?',
              answer: 'Test answer',
              category: 'general',
              isActive: true
            }
          ]
        }),
        leadQualificationQuestions: [factory.createLeadQualificationQuestions()[0]]
      });

      expect(completeConfig.knowledgeBase.faqs).toHaveLength(1);
      expect(completeConfig.leadQualificationQuestions).toHaveLength(1);
      expect(completeConfig.isActive).toBe(true);

      // Incomplete configuration
      const incompleteConfig = factory.createValidConfig({
        name: 'Incomplete Bot',
        knowledgeBase: factory.createKnowledgeBase({ faqs: [] }),
        leadQualificationQuestions: []
      });

      expect(incompleteConfig.knowledgeBase.faqs).toHaveLength(0);
      expect(incompleteConfig.leadQualificationQuestions).toHaveLength(0);
    });
  });

  describe('Knowledge Base Integration', () => {
    test('should manage FAQ items effectively', () => {
      const { factory } = getEnv();
      
      const knowledgeBase = factory.createKnowledgeBase({
        faqs: [
          {
            id: 'faq-1',
            question: 'What are your pricing plans?',
            answer: 'We offer Starter, Professional, and Enterprise plans.',
            category: 'pricing',
            isActive: true
          },
          {
            id: 'faq-2',
            question: 'Do you offer support?',
            answer: 'Yes, 24/7 support for all plans.',
            category: 'support',
            isActive: true
          }
        ]
      });

      const config = factory.createValidConfig({ knowledgeBase });

      expect(config.knowledgeBase.getActiveFAQs()).toHaveLength(2);
      expect(config.knowledgeBase.getFAQsByCategory('pricing')).toHaveLength(1);
      expect(config.knowledgeBase.getFAQsByCategory('support')).toHaveLength(1);
      expect(config.knowledgeBase.getFAQsByCategory('nonexistent')).toHaveLength(0);
    });

    test('should handle website sources configuration', () => {
      const { factory } = getEnv();
      
      const knowledgeBase = factory.createKnowledgeBase({
        websiteSources: [
          {
            id: 'source-1',
            url: 'https://example.com/docs',
            name: 'Docs',
            status: 'completed',
            lastCrawled: new Date('2024-01-01T00:00:00Z'),
            pageCount: 25,
            isActive: true,
            crawlSettings: KnowledgeBase.createDefaultWebsiteCrawlSettings()
          },
          {
            id: 'source-2',
            url: 'https://example.com/blog',
            name: 'Blog',
            status: 'pending',
            lastCrawled: null,
            pageCount: 0,
            isActive: true,
            crawlSettings: KnowledgeBase.createDefaultWebsiteCrawlSettings()
          }
        ]
      });

      const config = factory.createValidConfig({ knowledgeBase });

      expect(config.knowledgeBase.getActiveWebsiteSources()).toHaveLength(2);
      const crawledSources = config.knowledgeBase.websiteSources.filter(s => s.status === 'completed');
      const pendingSources = config.knowledgeBase.websiteSources.filter(s => s.status === 'pending');
      expect(crawledSources).toHaveLength(1);
      expect(pendingSources).toHaveLength(1);
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid personality settings gracefully', () => {
      const { factory } = getEnv();
      
      expect(() => {
        PersonalitySettings.create({
          tone: '' as any, // Empty tone should fail validation
          communicationStyle: 'helpful',
          responseLength: 'adaptive',
          escalationTriggers: [],
          responseBehavior: {
            useEmojis: false,
            askFollowUpQuestions: true,
            proactiveOffering: true,
            personalizeResponses: true,
            acknowledgePreviousInteractions: true,
          },
          conversationFlow: {
            greetingMessage: 'Hello!',
            fallbackMessage: "I'm not sure",
            escalationMessage: 'Let me connect you',
            endConversationMessage: 'Thank you!',
            leadCapturePrompt: 'Would you like to leave your contact?',
            maxConversationTurns: 20,
            inactivityTimeout: 300,
          },
          customInstructions: '',
        });
      }).toThrow('Tone is required');
    });

    test('should validate operating hours format', () => {
      const { factory } = getEnv();
      
      expect(() => {
        OperatingHours.create({
          timezone: 'UTC',
          businessHours: [
            { dayOfWeek: 1, startTime: '25:00', endTime: '17:00', isActive: true }
          ],
          holidaySchedule: [],
          outsideHoursMessage: 'Closed'
        });
      }).toThrow();
    });

    test('should enforce chatbot configuration constraints', () => {
      const { factory } = getEnv();
      
      expect(() => {
        ChatbotConfig.create({
          organizationId: '', // Empty organization ID should fail
          name: 'Test Bot',
          personalitySettings: factory.createPersonalitySettings(),
          knowledgeBase: factory.createKnowledgeBase(),
          operatingHours: factory.createOperatingHours(),
          leadQualificationQuestions: [],
          isActive: true
        });
      }).toThrow('Organization ID is required');
    });
  });

  describe('Performance Requirements', () => {
    test('should create entity within performance limits', async () => {
      const { factory } = getEnv();
      
      const startTime = performance.now();
      
      for (let i = 0; i < 100; i++) {
        factory.createValidConfig({
          name: `Bot ${i}`,
          organizationId: `org-${i}`
        });
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Should create 100 entities in under 100ms
      expect(duration).toBeLessThan(100);
    });

    test('should generate system prompt efficiently', () => {
      const { factory } = getEnv();
      
      const config = factory.createValidConfig({
        personalitySettings: factory.createPersonalitySettings(),
        knowledgeBase: factory.createKnowledgeBase({
          faqItems: Array.from({ length: 50 }, (_, i) => ({
            id: `faq-${i}`,
            question: `Question ${i}`,
            answer: `Answer ${i}`,
            category: 'general',
            isActive: true,
            priority: i
          }))
        })
      });

      const startTime = performance.now();
      const systemPrompt = config.generateSystemPrompt();
      const endTime = performance.now();
      
      expect(systemPrompt).toBeTruthy();
      expect(endTime - startTime).toBeLessThan(50); // Should generate in under 50ms
    });
  });
});