/**
 * ChatbotConfigMapper Unit Tests
 * 
 * Tests the mapper responsible for transforming between domain entities and database records.
 * Covers bidirectional mapping, complex value object transformation, and edge cases.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ChatbotConfigMapper, RawChatbotConfigDbRecord } from '../ChatbotConfigMapper';
import { ChatbotConfig } from '../../../../../domain/entities/ChatbotConfig';
import { ChatbotTestDataFactory } from '../../../../../__tests__/test-utils/ChatbotTestDataFactory';

describe('ChatbotConfigMapper', () => {
  let validConfig: ChatbotConfig;
  let validDbRecord: RawChatbotConfigDbRecord;

  beforeEach(() => {
    // Create test data using factory
    validConfig = ChatbotTestDataFactory.createValidConfig();

    // Mock database record
    validDbRecord = {
      id: 'config-123',
      organization_id: 'org-test-123',
      name: 'Test Support Chatbot',
      avatar_url: 'https://example.com/avatar.png',
      description: 'A test chatbot for customer support',
      personality_settings: {
        tone: 'professional',
        communicationStyle: 'helpful',
        responseLength: 'adaptive',
        escalationTriggers: ['complex_technical', 'pricing_negotiation'],
        responseBehavior: {
          useEmojis: false,
          askFollowUpQuestions: true,
          proactiveOffering: true,
          personalizeResponses: true,
          acknowledgePreviousInteractions: true,
        },
        conversationFlow: {
          greetingMessage: 'Hello! How can I help you today?',
          fallbackMessage: 'I\'m not sure about that. Could you rephrase your question?',
          escalationMessage: 'Let me connect you with a team member.',
          endConversationMessage: 'Thank you for chatting with us!',
          leadCapturePrompt: 'Can I get your contact information to follow up?',
          maxConversationTurns: 20,
          inactivityTimeout: 300,
        },
        customInstructions: 'Always be helpful and focus on understanding customer needs',
      },
      knowledge_base: {
        companyInfo: 'Test Company - A leading provider of innovative solutions',
        productCatalog: 'Our products include Starter, Professional, and Enterprise plans',
        faqs: [
          {
            id: 'faq-1',
            question: 'What are your pricing plans?',
            answer: 'We offer Starter ($29/mo), Professional ($99/mo), and Enterprise (custom) plans.',
            category: 'pricing',
            isActive: true
          }
        ],
        supportDocs: 'Comprehensive support documentation available 24/7',
        complianceGuidelines: 'We follow industry-standard compliance requirements',
        websiteSources: [
          {
            id: 'source-1',
            url: 'https://example.com/pricing',
            name: 'Pricing Page',
            description: 'Main pricing information',
            isActive: true,
            crawlSettings: {
              maxPages: 50,
              maxDepth: 3,
              includePatterns: ['/docs/', '/help/'],
              excludePatterns: ['/admin/', '/login/'],
              respectRobotsTxt: true,
              crawlFrequency: 'weekly',
              includeImages: false,
              includePDFs: true,
            },
            lastCrawled: '2024-01-01T00:00:00Z',
            status: 'completed',
            pageCount: 15,
            errorMessage: null,
          }
        ],
      },
      operating_hours: {
        timezone: 'UTC',
        businessHours: [
          {
            dayOfWeek: 1,
            startTime: '09:00',
            endTime: '17:00',
            isActive: true,
          }
        ],
        holidaySchedule: [
          {
            date: '2024-12-25',
            name: 'Christmas Day',
            isRecurring: true,
          }
        ],
        outsideHoursMessage: 'We are currently closed. Please leave a message and we will get back to you.',
      },
      lead_qualification_questions: [
        {
          id: 'q1',
          question: 'What\'s your email address?',
          type: 'email',
          isRequired: true,
          order: 1,
          scoringWeight: 20
        },
        {
          id: 'q2',
          question: 'What\'s your company name?',
          type: 'text',
          isRequired: true,
          order: 2,
          scoringWeight: 15
        }
      ],
      ai_configuration: {
        openaiModel: 'gpt-4o-mini',
        openaiTemperature: 0.3,
        openaiMaxTokens: 1000,
        contextMaxTokens: 12000,
        contextSystemPromptTokens: 500,
        contextResponseReservedTokens: 3000,
        contextSummaryTokens: 200,
        intentConfidenceThreshold: 0.7,
        intentAmbiguityThreshold: 0.2,
        enableMultiIntentDetection: true,
        enablePersonaInference: true,
        enableAdvancedEntities: true,
        entityExtractionMode: 'comprehensive',
        customEntityTypes: [],
        maxConversationTurns: 20,
        inactivityTimeoutSeconds: 300,
        enableJourneyRegression: true,
        enableContextSwitchDetection: true,
        enableAdvancedScoring: true,
        entityCompletenessWeight: 0.3,
        personaConfidenceWeight: 0.2,
        journeyProgressionWeight: 0.25,
        enablePerformanceLogging: true,
        enableIntentAnalytics: true,
        enablePersonaAnalytics: true,
        responseTimeThresholdMs: 2000,
      },
      is_active: true,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };
  });

  describe('toDomainEntity', () => {
    it('should transform complete database record to domain entity', () => {
      const config = ChatbotConfigMapper.toDomainEntity(validDbRecord);

      expect(config).toBeInstanceOf(ChatbotConfig);
      expect(config.id).toBe('config-123');
      expect(config.organizationId).toBe('org-test-123');
      expect(config.name).toBe('Test Support Chatbot');
      expect(config.avatarUrl).toBe('https://example.com/avatar.png');
      expect(config.description).toBe('A test chatbot for customer support');
      expect(config.isActive).toBe(true);
      expect(config.createdAt).toBeInstanceOf(Date);
      expect(config.updatedAt).toBeInstanceOf(Date);
    });

    it('should handle null/undefined fields with proper defaults', () => {
      const minimalRecord = {
        ...validDbRecord,
        avatar_url: null,
        description: null,
        personality_settings: null,
        knowledge_base: null,
        operating_hours: null,
        lead_qualification_questions: null,
        ai_configuration: null,
      };

      const config = ChatbotConfigMapper.toDomainEntity(minimalRecord);

      // The mapper converts null to undefined - the entity expects undefined for optional fields
      expect(config.avatarUrl).toBe(undefined);
      expect(config.description).toBe(undefined);
      expect(config.personalitySettings).toBeDefined();
      expect(config.knowledgeBase).toBeDefined();
      expect(config.operatingHours).toBeDefined();
      expect(config.leadQualificationQuestions).toEqual([]);
      expect(config.aiConfiguration).toBeDefined();
    });

    it('should properly map personality settings with defaults', () => {
      const configWithPartialPersonality = {
        ...validDbRecord,
        personality_settings: {
          tone: 'casual',
          // Missing other fields
        },
      };

      const config = ChatbotConfigMapper.toDomainEntity(configWithPartialPersonality);

      expect(config.personalitySettings.tone).toBe('casual');
      expect(config.personalitySettings.communicationStyle).toBe('helpful'); // Default
      expect(config.personalitySettings.responseBehavior.useEmojis).toBe(false); // Default
    });

    it('should properly map knowledge base with complex nested data', () => {
      const config = ChatbotConfigMapper.toDomainEntity(validDbRecord);

      expect(config.knowledgeBase.faqs).toHaveLength(1);
      expect(config.knowledgeBase.faqs[0].id).toBe('faq-1');
      expect(config.knowledgeBase.faqs[0].question).toBe('What are your pricing plans?');
      expect(config.knowledgeBase.websiteSources).toHaveLength(1);
      expect(config.knowledgeBase.websiteSources[0].crawlSettings.maxPages).toBe(50);
    });

    it('should handle empty arrays for knowledge base components', () => {
      const recordWithEmptyKB = {
        ...validDbRecord,
        knowledge_base: {
          companyInfo: '',
          productCatalog: '',
          faqs: [],
          supportDocs: '',
          complianceGuidelines: '',
          websiteSources: [],
        },
      };

      const config = ChatbotConfigMapper.toDomainEntity(recordWithEmptyKB);

      expect(config.knowledgeBase.faqs).toEqual([]);
      expect(config.knowledgeBase.websiteSources).toEqual([]);
    });

    it('should properly map lead qualification questions', () => {
      const config = ChatbotConfigMapper.toDomainEntity(validDbRecord);

      expect(config.leadQualificationQuestions).toHaveLength(2);
      expect(config.leadQualificationQuestions[0].id).toBe('q1');
      expect(config.leadQualificationQuestions[0].type).toBe('email');
      expect(config.leadQualificationQuestions[0].isRequired).toBe(true);
      expect(config.leadQualificationQuestions[1].scoringWeight).toBe(15);
    });

    it('should map AI configuration with all settings', () => {
      const config = ChatbotConfigMapper.toDomainEntity(validDbRecord);

      // Access OpenAI configuration through the proper path
      expect(config.aiConfiguration.openAI.model).toBe('gpt-4o-mini');
      expect(config.aiConfiguration.openaiTemperature).toBe(0.3);
      expect(config.aiConfiguration.enableAdvancedScoring).toBe(true);
      expect(config.aiConfiguration.intent.confidenceThreshold).toBe(0.7);
    });
  });

  describe('toDbRecord', () => {
    it('should transform domain entity to database record', () => {
      const dbRecord = ChatbotConfigMapper.toDbRecord(validConfig);

      expect((dbRecord as any).id).toBe(validConfig.id);
      expect((dbRecord as any).organization_id).toBe(validConfig.organizationId);
      expect((dbRecord as any).name).toBe(validConfig.name);
      expect((dbRecord as any).is_active).toBe(validConfig.isActive);
      expect(typeof (dbRecord as any).created_at).toBe('string');
      expect(typeof (dbRecord as any).updated_at).toBe('string');
    });

    it('should handle optional fields correctly', () => {
      const configWithOptionals = ChatbotTestDataFactory.createValidConfig({
        avatarUrl: undefined,
        description: undefined,
      });

      const dbRecord = ChatbotConfigMapper.toDbRecord(configWithOptionals);

      expect((dbRecord as any).avatar_url).toBeUndefined();
      expect((dbRecord as any).description).toBeUndefined();
    });

    it('should serialize complex value objects', () => {
      const dbRecord = ChatbotConfigMapper.toDbRecord(validConfig);

      expect(typeof (dbRecord as any).personality_settings).toBe('object');
      expect(typeof (dbRecord as any).knowledge_base).toBe('object');
      expect(typeof (dbRecord as any).operating_hours).toBe('object');
      expect(typeof (dbRecord as any).ai_configuration).toBe('object');
      expect(Array.isArray((dbRecord as any).lead_qualification_questions)).toBe(true);
    });
  });

  describe('toInsert', () => {
    it('should create insert data with all required fields', () => {
      const insertData = ChatbotConfigMapper.toInsert(validConfig);

      expect(insertData.id).toBe(validConfig.id);
      expect(insertData.organization_id).toBe(validConfig.organizationId);
      expect(insertData.name).toBe(validConfig.name);
      expect(insertData.is_active).toBe(validConfig.isActive);
      expect(insertData).not.toHaveProperty('created_at');
      expect(insertData).not.toHaveProperty('updated_at');
    });

    it('should serialize value objects using toPlainObject', () => {
      const insertData = ChatbotConfigMapper.toInsert(validConfig);

      // These should be plain objects, not domain value objects
      expect((insertData as any).personality_settings).toBeDefined();
      expect((insertData as any).personality_settings.constructor.name).toBe('Object');
      expect((insertData as any).knowledge_base).toBeDefined();
      expect((insertData as any).knowledge_base.constructor.name).toBe('Object');
    });

    it('should handle optional fields in insert data', () => {
      const configWithOptionals = ChatbotTestDataFactory.createValidConfig({
        avatarUrl: 'https://example.com/avatar.png',
        description: 'Test description',
      });

      const insertData = ChatbotConfigMapper.toInsert(configWithOptionals);

      expect(insertData.avatar_url).toBe('https://example.com/avatar.png');
      expect(insertData.description).toBe('Test description');
    });
  });

  describe('toUpdate', () => {
    it('should create update data with current timestamp', () => {
      const updateData = ChatbotConfigMapper.toUpdate(validConfig);

      expect(updateData.name).toBe(validConfig.name);
      expect(updateData.is_active).toBe(validConfig.isActive);
      expect(updateData.updated_at).toBeDefined();
      expect(typeof updateData.updated_at).toBe('string');
      expect(updateData).not.toHaveProperty('id');
      expect(updateData).not.toHaveProperty('organization_id');
      expect(updateData).not.toHaveProperty('created_at');
    });

    it('should serialize all value objects for update', () => {
      const updateData = ChatbotConfigMapper.toUpdate(validConfig);

      expect(updateData.personality_settings).toBeDefined();
      expect(updateData.knowledge_base).toBeDefined();
      expect(updateData.operating_hours).toBeDefined();
      expect(updateData.ai_configuration).toBeDefined();
      expect(updateData.lead_qualification_questions).toBeDefined();
    });
  });

  describe('Bidirectional Mapping', () => {
    it('should maintain data integrity through round-trip transformation', () => {
      // Domain -> DB -> Domain
      const dbRecord = ChatbotConfigMapper.toDbRecord(validConfig);
      const reconstructedConfig = ChatbotConfigMapper.toDomainEntity(dbRecord);

      expect(reconstructedConfig.id).toBe(validConfig.id);
      expect(reconstructedConfig.organizationId).toBe(validConfig.organizationId);
      expect(reconstructedConfig.name).toBe(validConfig.name);
      expect(reconstructedConfig.isActive).toBe(validConfig.isActive);
    });

    it('should preserve complex nested data through transformations', () => {
      const dbRecord = ChatbotConfigMapper.toDbRecord(validConfig);
      const reconstructedConfig = ChatbotConfigMapper.toDomainEntity(dbRecord);

      // Check that complex objects are preserved
      expect(reconstructedConfig.personalitySettings.tone).toBe(validConfig.personalitySettings.tone);
      expect(reconstructedConfig.knowledgeBase.companyInfo).toBe(validConfig.knowledgeBase.companyInfo);
      expect(reconstructedConfig.aiConfiguration.openAI.model).toBe(validConfig.aiConfiguration.openAI.model);
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed database records gracefully', () => {
      const malformedRecord = {
        id: 'test-id',
        organization_id: 'org-123',
        name: 'Test Config',
        // Missing required fields
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      expect(() => {
        ChatbotConfigMapper.toDomainEntity(malformedRecord);
      }).not.toThrow();
    });

    it('should handle empty lead qualification questions array', () => {
      const recordWithEmptyQuestions = {
        ...validDbRecord,
        lead_qualification_questions: [],
      };

      const config = ChatbotConfigMapper.toDomainEntity(recordWithEmptyQuestions);
      expect(config.leadQualificationQuestions).toEqual([]);
    });

    it('should handle malformed lead qualification questions', () => {
      const recordWithMalformedQuestions = {
        ...validDbRecord,
        lead_qualification_questions: [
          { /* missing required fields */ },
          null,
          undefined,
          {
            id: 'q1',
            question: 'Valid question',
            type: 'text',
            isRequired: true,
            order: 1,
            scoringWeight: 10
          }
        ],
      };

      const config = ChatbotConfigMapper.toDomainEntity(recordWithMalformedQuestions);
      expect(config.leadQualificationQuestions).toHaveLength(4);
      // Should handle malformed entries gracefully with defaults
      expect(config.leadQualificationQuestions[3].question).toBe('Valid question');
    });

    it('should reject corrupted website sources in knowledge base', () => {
      const recordWithCorruptedSources = {
        ...validDbRecord,
        knowledge_base: {
          ...(validDbRecord.knowledge_base as any),
          websiteSources: [
            { /* missing required fields */ },
            null,
            {
              url: 'https://valid.com',
              name: 'Valid Source'
              // Other fields missing
            }
          ],
        },
      };

      // Domain validation should reject invalid website sources
      expect(() => {
        ChatbotConfigMapper.toDomainEntity(recordWithCorruptedSources);
      }).toThrow('Business rule violated: Item at index 0 must have a non-empty URL');
    });

    it('should handle website sources with missing optional fields', () => {
      const recordWithMissingOptionalFields = {
        ...validDbRecord,
        knowledge_base: {
          ...(validDbRecord.knowledge_base as any),
          websiteSources: [
            {
              id: 'source-1',
              url: 'https://example.com',
              name: 'Test Source',
              description: '', // Empty description should be handled
              isActive: true,
              // Missing crawlSettings and other optional fields
            }
          ],
        },
      };

      const config = ChatbotConfigMapper.toDomainEntity(recordWithMissingOptionalFields);
      expect(config.knowledgeBase.websiteSources).toHaveLength(1);
      expect(config.knowledgeBase.websiteSources[0].url).toBe('https://example.com');
      expect(config.knowledgeBase.websiteSources[0].name).toBe('Test Source');
      // Should provide defaults for missing optional fields
      expect(config.knowledgeBase.websiteSources[0].crawlSettings).toBeDefined();
    });
  });

  describe('Performance', () => {
    it('should transform large configurations efficiently', () => {
      const largeConfig = ChatbotTestDataFactory.createValidConfig({
        leadQualificationQuestions: Array.from({ length: 50 }, (_, i) => ({
          id: `q${i}`,
          question: `Question ${i}`,
          type: 'text' as const,
          isRequired: false,
          order: i,
          scoringWeight: 1
        }))
      });

      const startTime = performance.now();
      const dbRecord = ChatbotConfigMapper.toDbRecord(largeConfig);
      const reconstructed = ChatbotConfigMapper.toDomainEntity(dbRecord);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(50); // Should complete in under 50ms
      expect(reconstructed.leadQualificationQuestions).toHaveLength(50);
    });
  });
});