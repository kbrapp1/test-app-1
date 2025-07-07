import { describe, it, expect } from 'vitest';
import { ChatbotConfig } from '../ChatbotConfig';
import { PersonalitySettings } from '../../value-objects/ai-configuration/PersonalitySettings';
import { KnowledgeBase } from '../../value-objects/ai-configuration/KnowledgeBase';
import { OperatingHours } from '../../value-objects/session-management/OperatingHours';

describe('ChatbotConfig - Business Logic', () => {
  // Helper function to create minimal valid config props
  const createValidConfigProps = () => ({
    organizationId: 'org-123',
    name: 'Test Bot',
    personalitySettings: PersonalitySettings.createDefault(),
    knowledgeBase: KnowledgeBase.createEmpty(),
    operatingHours: OperatingHours.createDefault(),
    leadQualificationQuestions: [],
    isActive: true
  });

  describe('creation and validation', () => {
    it('should create config with valid properties', () => {
      const props = createValidConfigProps();
      const config = ChatbotConfig.create(props);

      expect(config.organizationId).toBe('org-123');
      expect(config.name).toBe('Test Bot');
      expect(config.isActive).toBe(true);
      expect(config.id).toBeDefined();
      expect(config.createdAt).toBeInstanceOf(Date);
      expect(config.updatedAt).toBeInstanceOf(Date);
    });

    it('should throw error for missing organization ID', () => {
      const props = createValidConfigProps();
      props.organizationId = '';

      expect(() => ChatbotConfig.create(props)).toThrow('Organization ID is required');
    });

    it('should throw error for whitespace-only organization ID', () => {
      const props = createValidConfigProps();
      props.organizationId = '   \n\t  ';

      expect(() => ChatbotConfig.create(props)).toThrow('Organization ID is required');
    });

    it('should throw error for missing name', () => {
      const props = createValidConfigProps();
      props.name = '';

      expect(() => ChatbotConfig.create(props)).toThrow('Chatbot name is required');
    });

    it('should throw error for name too long', () => {
      const props = createValidConfigProps();
      props.name = 'A'.repeat(101);

      expect(() => ChatbotConfig.create(props)).toThrow('Chatbot name must be 100 characters or less');
    });

    it('should throw error for missing timezone in operating hours', () => {
      const props = createValidConfigProps();
      props.operatingHours = { 
        timezone: '',
        businessHours: []
      } as any;

      expect(() => ChatbotConfig.create(props)).toThrow('Timezone is required for operating hours');
    });
  });

  describe('personality updates', () => {
    it('should update personality settings immutably', () => {
      const config = ChatbotConfig.create(createValidConfigProps());
      const newPersonality = PersonalitySettings.create({
        tone: 'professional',
        communicationStyle: 'direct',
        responseLength: 'brief',
        escalationTriggers: [],
        responseBehavior: {
          useEmojis: false,
          askFollowUpQuestions: true,
          proactiveOffering: false,
          personalizeResponses: true,
          acknowledgePreviousInteractions: true
        },
        conversationFlow: {
          greetingMessage: 'Hello',
          fallbackMessage: 'I apologize, I did not understand',
          escalationMessage: 'Let me connect you with a human',
          endConversationMessage: 'Thank you for chatting',
          leadCapturePrompt: 'May I have your contact information?',
          maxConversationTurns: 50,
          inactivityTimeout: 600
        },
        customInstructions: ''
      });

      const updatedConfig = config.updatePersonality(newPersonality);

      expect(updatedConfig).not.toBe(config);
      expect(updatedConfig.personalitySettings).toBe(newPersonality);
      expect(updatedConfig.updatedAt.getTime()).toBeGreaterThanOrEqual(config.updatedAt.getTime());
      expect(config.personalitySettings).not.toBe(newPersonality);
    });
  });

  describe('knowledge base updates', () => {
    it('should update knowledge base immutably', () => {
      const config = ChatbotConfig.create(createValidConfigProps());
      const newKnowledgeBase = KnowledgeBase.create({
        companyInfo: 'Updated company information',
        productCatalog: 'Updated product catalog',
        faqs: [],
        supportDocs: 'Updated support documentation',
        complianceGuidelines: 'Updated compliance',
        websiteSources: []
      });

      const updatedConfig = config.updateKnowledgeBase(newKnowledgeBase);

      expect(updatedConfig).not.toBe(config);
      expect(updatedConfig.knowledgeBase).toBe(newKnowledgeBase);
      expect(updatedConfig.updatedAt.getTime()).toBeGreaterThanOrEqual(config.updatedAt.getTime());
    });
  });

  describe('operating hours updates', () => {
    it('should update operating hours immutably', () => {
      const config = ChatbotConfig.create(createValidConfigProps());
      const newOperatingHours = OperatingHours.create({
        timezone: 'America/New_York',
        businessHours: [{
          dayOfWeek: 1,
          isActive: true,
          startTime: '09:00',
          endTime: '17:00'
        }],
        holidaySchedule: [],
        outsideHoursMessage: 'We are currently closed'
      });

      const updatedConfig = config.updateOperatingHours(newOperatingHours);

      expect(updatedConfig).not.toBe(config);
      expect(updatedConfig.operatingHours).toBe(newOperatingHours);
      expect(updatedConfig.updatedAt.getTime()).toBeGreaterThanOrEqual(config.updatedAt.getTime());
    });
  });

  describe('lead qualification questions', () => {
    it('should add lead qualification question', () => {
      const config = ChatbotConfig.create(createValidConfigProps());
      const question = {
        id: 'q1',
        question: 'What is your budget?',
        type: 'text' as const,
        isRequired: true,
        order: 1,
        scoringWeight: 0.8
      };

      const updatedConfig = config.addLeadQualificationQuestion(question);

      expect(updatedConfig).not.toBe(config);
      expect(updatedConfig.leadQualificationQuestions).toHaveLength(1);
      expect(updatedConfig.leadQualificationQuestions[0]).toEqual(question);
      expect(config.leadQualificationQuestions).toHaveLength(0);
    });

    it('should remove lead qualification question by ID', () => {
      const config = ChatbotConfig.create(createValidConfigProps());
      const question1 = {
        id: 'q1',
        question: 'What is your budget?',
        type: 'text' as const,
        isRequired: true,
        order: 1,
        scoringWeight: 0.8
      };
      const question2 = {
        id: 'q2',
        question: 'What is your company size?',
        type: 'select' as const,
        options: ['1-10', '11-50', '51-200', '200+'],
        isRequired: true,
        order: 2,
        scoringWeight: 0.6
      };

      const configWithQuestions = config
        .addLeadQualificationQuestion(question1)
        .addLeadQualificationQuestion(question2);

      const updatedConfig = configWithQuestions.removeLeadQualificationQuestion('q1');

      expect(updatedConfig.leadQualificationQuestions).toHaveLength(1);
      expect(updatedConfig.leadQualificationQuestions[0].id).toBe('q2');
      expect(configWithQuestions.leadQualificationQuestions).toHaveLength(2);
    });
  });

  describe('activation and deactivation', () => {
    it('should activate chatbot immutably', () => {
      const props = createValidConfigProps();
      props.isActive = false;
      const config = ChatbotConfig.create(props);

      const activatedConfig = config.activate();

      expect(activatedConfig).not.toBe(config);
      expect(activatedConfig.isActive).toBe(true);
      expect(config.isActive).toBe(false);
      expect(activatedConfig.updatedAt.getTime()).toBeGreaterThanOrEqual(config.updatedAt.getTime());
    });

    it('should deactivate chatbot immutably', () => {
      const config = ChatbotConfig.create(createValidConfigProps());

      const deactivatedConfig = config.deactivate();

      expect(deactivatedConfig).not.toBe(config);
      expect(deactivatedConfig.isActive).toBe(false);
      expect(config.isActive).toBe(true);
      expect(deactivatedConfig.updatedAt.getTime()).toBeGreaterThanOrEqual(config.updatedAt.getTime());
    });
  });

  describe('operating hours business logic', () => {
    it('should check if current time is within operating hours', () => {
      // Create operating hours for all days with 24-hour availability 
      const businessHours = Array.from({ length: 7 }, (_, day) => ({
        dayOfWeek: day,
        isActive: true,
        startTime: '00:00',
        endTime: '23:59'
      }));

      const operatingHours = OperatingHours.create({
        timezone: 'UTC',
        businessHours,
        holidaySchedule: [],
        outsideHoursMessage: 'We are currently closed'
      });

      const config = ChatbotConfig.create({
        ...createValidConfigProps(),
        operatingHours
      });

      // Should be within hours for any day with 24-hour availability
      expect(config.isWithinOperatingHours()).toBe(true);
    });

    it('should use custom timestamp for operating hours check', () => {
      const operatingHours = OperatingHours.create({
        timezone: 'UTC',
        businessHours: [],  // No business hours defined
        holidaySchedule: [],
        outsideHoursMessage: 'We are currently closed'
      });

      const config = ChatbotConfig.create({
        ...createValidConfigProps(),
        operatingHours
      });

      const customTimestamp = new Date('2024-01-01T12:00:00Z');
      expect(config.isWithinOperatingHours(customTimestamp)).toBe(false);
    });
  });

  describe('data serialization', () => {
    it('should convert to plain object', () => {
      const config = ChatbotConfig.create(createValidConfigProps());
      const plainObject = config.toPlainObject();

      expect(plainObject.id).toBe(config.id);
      expect(plainObject.organizationId).toBe(config.organizationId);
      expect(plainObject.name).toBe(config.name);
      expect(plainObject.isActive).toBe(config.isActive);
      expect(plainObject.createdAt).toBe(config.createdAt);
      expect(plainObject.updatedAt).toBe(config.updatedAt);
    });
  });

  describe('edge cases', () => {
    it('should handle name with exactly 100 characters', () => {
      const props = createValidConfigProps();
      props.name = 'A'.repeat(100);

      expect(() => ChatbotConfig.create(props)).not.toThrow();
    });

    it('should handle empty lead qualification questions array', () => {
      const config = ChatbotConfig.create(createValidConfigProps());

      expect(config.leadQualificationQuestions).toHaveLength(0);
      expect(() => config.removeLeadQualificationQuestion('non-existent')).not.toThrow();
    });

    it('should create default AI configuration when not provided', () => {
      const config = ChatbotConfig.create(createValidConfigProps());

      expect(config.aiConfiguration).toBeDefined();
    });
  });
});