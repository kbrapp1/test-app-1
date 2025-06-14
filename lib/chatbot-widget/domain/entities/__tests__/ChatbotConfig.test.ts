import { describe, it, expect, beforeEach } from 'vitest';
import { ChatbotConfig, LeadQualificationQuestion } from '../ChatbotConfig';
import { PersonalitySettings, PersonalitySettingsProps } from '../../value-objects/PersonalitySettings';
import { KnowledgeBase, KnowledgeBaseProps } from '../../value-objects/KnowledgeBase';
import { OperatingHours, OperatingHoursProps } from '../../value-objects/OperatingHours';

describe('ChatbotConfig', () => {
  let defaultPersonality: PersonalitySettings;
  let defaultKnowledgeBase: KnowledgeBase;
  let defaultOperatingHours: OperatingHours;
  let defaultLeadQuestions: LeadQualificationQuestion[];

  beforeEach(() => {
    const personalityProps: PersonalitySettingsProps = {
      tone: 'professional',
      communicationStyle: 'helpful',
      responseLength: 'adaptive',
      escalationTriggers: ['angry', 'frustrated'],
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
      customInstructions: '',
    };
    defaultPersonality = PersonalitySettings.create(personalityProps);

    const knowledgeBaseProps: KnowledgeBaseProps = {
      companyInfo: 'Test Company provides innovative solutions.',
      productCatalog: 'Product A, Product B',
      faqs: [
        {
          id: '1',
          question: 'What do you do?',
          answer: 'We provide solutions.',
          category: 'general',
          isActive: true,
        },
      ],
      supportDocs: 'Support documentation',
      complianceGuidelines: 'Follow GDPR rules',
    };
    defaultKnowledgeBase = KnowledgeBase.create(knowledgeBaseProps);

    const operatingHoursProps: OperatingHoursProps = {
      timezone: 'America/New_York',
      businessHours: [
        {
          dayOfWeek: 1, // Monday
          startTime: '09:00',
          endTime: '17:00',
          isActive: true,
        },
      ],
      holidaySchedule: [],
      outsideHoursMessage: 'We are currently closed.',
    };
    defaultOperatingHours = OperatingHours.create(operatingHoursProps);

    defaultLeadQuestions = [
      {
        id: 'email',
        question: 'What is your email?',
        type: 'email',
        isRequired: true,
        order: 1,
        scoringWeight: 10,
      },
    ];
  });

  describe('create', () => {
    it('should create a new ChatbotConfig with valid properties', () => {
      const config = ChatbotConfig.create({
        organizationId: 'org-123',
        name: 'Test Bot',
        personalitySettings: defaultPersonality,
        knowledgeBase: defaultKnowledgeBase,
        operatingHours: defaultOperatingHours,
        leadQualificationQuestions: defaultLeadQuestions,
        isActive: true,
      });

      expect(config.organizationId).toBe('org-123');
      expect(config.name).toBe('Test Bot');
      expect(config.isActive).toBe(true);
      expect(config.id).toBeDefined();
      expect(config.createdAt).toBeInstanceOf(Date);
      expect(config.updatedAt).toBeInstanceOf(Date);
    });

    it('should create a new ChatbotConfig with empty lead questions (optional)', () => {
      const config = ChatbotConfig.create({
        organizationId: 'org-123',
        name: 'Test Bot',
        personalitySettings: defaultPersonality,
        knowledgeBase: defaultKnowledgeBase,
        operatingHours: defaultOperatingHours,
        leadQualificationQuestions: [], // Now allowed
        isActive: true,
      });

      expect(config.leadQualificationQuestions).toHaveLength(0);
      expect(config.organizationId).toBe('org-123');
    });

    it('should throw error for missing organization ID', () => {
      expect(() => {
        ChatbotConfig.create({
          organizationId: '',
          name: 'Test Bot',
          personalitySettings: defaultPersonality,
          knowledgeBase: defaultKnowledgeBase,
          operatingHours: defaultOperatingHours,
          leadQualificationQuestions: defaultLeadQuestions,
          isActive: true,
        });
      }).toThrow('Organization ID is required');
    });

    it('should throw error for missing name', () => {
      expect(() => {
        ChatbotConfig.create({
          organizationId: 'org-123',
          name: '',
          personalitySettings: defaultPersonality,
          knowledgeBase: defaultKnowledgeBase,
          operatingHours: defaultOperatingHours,
          leadQualificationQuestions: defaultLeadQuestions,
          isActive: true,
        });
      }).toThrow('Chatbot name is required');
    });

    it('should throw error for name too long', () => {
      expect(() => {
        ChatbotConfig.create({
          organizationId: 'org-123',
          name: 'A'.repeat(101),
          personalitySettings: defaultPersonality,
          knowledgeBase: defaultKnowledgeBase,
          operatingHours: defaultOperatingHours,
          leadQualificationQuestions: defaultLeadQuestions,
          isActive: true,
        });
      }).toThrow('Chatbot name must be 100 characters or less');
    });
  });

  describe('business methods', () => {
    let config: ChatbotConfig;

    beforeEach(() => {
      config = ChatbotConfig.create({
        organizationId: 'org-123',
        name: 'Test Bot',
        personalitySettings: defaultPersonality,
        knowledgeBase: defaultKnowledgeBase,
        operatingHours: defaultOperatingHours,
        leadQualificationQuestions: defaultLeadQuestions,
        isActive: true,
      });
    });

    it('should update personality settings', async () => {
      const newPersonalityProps: PersonalitySettingsProps = {
        tone: 'friendly',
        communicationStyle: 'conversational',
        responseLength: 'brief',
        escalationTriggers: ['help'],
        responseBehavior: {
          useEmojis: true,
          askFollowUpQuestions: false,
          proactiveOffering: false,
          personalizeResponses: false,
          acknowledgePreviousInteractions: false,
        },
        conversationFlow: {
          greetingMessage: 'Hi there!',
          fallbackMessage: 'Sorry, I don\'t understand.',
          escalationMessage: 'Let me get help.',
          endConversationMessage: 'Goodbye!',
          leadCapturePrompt: 'Your email please?',
          maxConversationTurns: 10,
          inactivityTimeout: 600,
        },
        customInstructions: 'Be very casual',
      };
      const newPersonality = PersonalitySettings.create(newPersonalityProps);

      // Add a small delay to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 1));
      const updatedConfig = config.updatePersonality(newPersonality);

      expect(updatedConfig.personalitySettings.tone).toBe('friendly');
      expect(updatedConfig.personalitySettings.communicationStyle).toBe('conversational');
      expect(updatedConfig.updatedAt.getTime()).toBeGreaterThanOrEqual(config.updatedAt.getTime());
    });

    it('should activate and deactivate', () => {
      const deactivatedConfig = config.deactivate();
      expect(deactivatedConfig.isActive).toBe(false);

      const reactivatedConfig = deactivatedConfig.activate();
      expect(reactivatedConfig.isActive).toBe(true);
    });

    it('should add lead qualification question', () => {
      const newQuestion: LeadQualificationQuestion = {
        id: 'phone',
        question: 'What is your phone number?',
        type: 'phone',
        isRequired: false,
        order: 2,
        scoringWeight: 8,
      };

      const updatedConfig = config.addLeadQualificationQuestion(newQuestion);

      expect(updatedConfig.leadQualificationQuestions).toHaveLength(2);
      expect(updatedConfig.leadQualificationQuestions[1]).toEqual(newQuestion);
    });

    it('should remove lead qualification question', () => {
      // Add another question first
      const newQuestion: LeadQualificationQuestion = {
        id: 'phone',
        question: 'What is your phone number?',
        type: 'phone',
        isRequired: false,
        order: 2,
        scoringWeight: 8,
      };

      const configWithTwoQuestions = config.addLeadQualificationQuestion(newQuestion);
      const configWithOneQuestion = configWithTwoQuestions.removeLeadQualificationQuestion('phone');

      expect(configWithOneQuestion.leadQualificationQuestions).toHaveLength(1);
      expect(configWithOneQuestion.leadQualificationQuestions[0].id).toBe('email');
    });

    it('should allow removing all lead qualification questions', () => {
      const configWithNoQuestions = config.removeLeadQualificationQuestion('email');
      
      expect(configWithNoQuestions.leadQualificationQuestions).toHaveLength(0);
    });
  });

  describe('isWithinOperatingHours', () => {
    it('should return true during business hours', () => {
      const operatingHours = OperatingHours.create({
        timezone: 'UTC',
        businessHours: [
          {
            dayOfWeek: 1, // Monday
            startTime: '09:00',
            endTime: '17:00',
            isActive: true,
          },
        ],
        holidaySchedule: [],
        outsideHoursMessage: 'Closed',
      });

      const config = ChatbotConfig.create({
        organizationId: 'org-123',
        name: 'Test Bot',
        personalitySettings: defaultPersonality,
        knowledgeBase: defaultKnowledgeBase,
        operatingHours,
        leadQualificationQuestions: defaultLeadQuestions,
        isActive: true,
      });

      // Create a Monday at 10:00 UTC
      const mondayMorning = new Date('2024-01-01T10:00:00Z'); // This is a Monday
      
      expect(config.isWithinOperatingHours(mondayMorning)).toBe(true);
    });

    it('should return false outside business hours', () => {
      const operatingHours = OperatingHours.create({
        timezone: 'UTC',
        businessHours: [
          {
            dayOfWeek: 1, // Monday
            startTime: '09:00',
            endTime: '17:00',
            isActive: true,
          },
        ],
        holidaySchedule: [],
        outsideHoursMessage: 'Closed',
      });

      const config = ChatbotConfig.create({
        organizationId: 'org-123',
        name: 'Test Bot',
        personalitySettings: defaultPersonality,
        knowledgeBase: defaultKnowledgeBase,
        operatingHours,
        leadQualificationQuestions: defaultLeadQuestions,
        isActive: true,
      });

      // Create a Monday at 18:00 UTC (after hours)
      const mondayEvening = new Date('2024-01-01T18:00:00Z');
      
      expect(config.isWithinOperatingHours(mondayEvening)).toBe(false);
    });
  });

  describe('generateSystemPrompt', () => {
    it('should generate system prompt with personality and knowledge', () => {
      const personalitySettings = PersonalitySettings.create({
        tone: 'friendly',
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
          greetingMessage: 'Hello! How can I help you today?',
          fallbackMessage: 'I\'m not sure about that. Could you rephrase your question?',
          escalationMessage: 'Let me connect you with a team member.',
          endConversationMessage: 'Thank you for chatting with us!',
          leadCapturePrompt: 'Can I get your contact information to follow up?',
          maxConversationTurns: 20,
          inactivityTimeout: 300,
        },
        customInstructions: '',
      });

      const knowledgeBase = KnowledgeBase.create({
        companyInfo: 'We sell widgets.',
        productCatalog: 'Widget A, Widget B',
        faqs: [
          {
            id: '1',
            question: 'What do you sell?',
            answer: 'We sell widgets.',
            category: 'products',
            isActive: true,
          },
        ],
        supportDocs: '',
        complianceGuidelines: 'Be honest.',
      });

      const config = ChatbotConfig.create({
        organizationId: 'org-123',
        name: 'Helper Bot',
        personalitySettings,
        knowledgeBase,
        operatingHours: defaultOperatingHours,
        leadQualificationQuestions: defaultLeadQuestions,
        isActive: true,
      });

      const prompt = config.generateSystemPrompt();

      expect(prompt).toContain('Helper Bot');
      expect(prompt).toContain('warm, friendly');
      expect(prompt).toContain('helpful');
      expect(prompt).toContain('We sell widgets.');
      expect(prompt).toContain('What do you sell?');
      expect(prompt).toContain('Be honest.');
      expect(prompt).toContain('Lead Qualification');
    });
  });
}); 