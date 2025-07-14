/**
 * ConfigureChatbotUseCase Unit Tests
 * 
 * Tests the application layer use case for configuring chatbot settings.
 * Covers orchestration logic, validation, error handling, and metrics calculation.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ConfigureChatbotUseCase, ConfigureChatbotRequest } from '../../../application/use-cases/ConfigureChatbotUseCase';
import { LeadQualificationQuestion } from '../../../domain/entities/ChatbotConfig';
import { PersonalitySettings } from '../../../domain/value-objects/ai-configuration/PersonalitySettings';
import { KnowledgeBase } from '../../../domain/value-objects/ai-configuration/KnowledgeBase';
import { OperatingHours } from '../../../domain/value-objects/session-management/OperatingHours';
import { MockChatbotConfigRepository } from '../../test-utils/MockServices';
import { ChatbotTestDataFactory } from '../../test-utils/ChatbotTestDataFactory';

describe('ConfigureChatbotUseCase', () => {
  let useCase: ConfigureChatbotUseCase;
  let mockConfigRepository: MockChatbotConfigRepository;
  let validPersonalitySettings: PersonalitySettings;
  let validKnowledgeBase: KnowledgeBase;
  let validOperatingHours: OperatingHours;
  let validLeadQuestions: LeadQualificationQuestion[];

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Create mock repository
    mockConfigRepository = new MockChatbotConfigRepository();

    // Create use case instance
    useCase = new ConfigureChatbotUseCase(mockConfigRepository);

    // Create valid test data
    validPersonalitySettings = PersonalitySettings.createDefault();
    validKnowledgeBase = KnowledgeBase.create({
      companyInfo: 'Test Company Inc. - Leading provider of test solutions',
      productCatalog: 'We offer comprehensive testing products and services',
      faqs: [
        {
          id: 'faq-1',
          question: 'What services do you offer?',
          answer: 'We provide comprehensive testing solutions',
          category: 'General',
          isActive: true
        },
        {
          id: 'faq-2',
          question: 'How can I contact support?',
          answer: 'You can reach us via email or phone',
          category: 'Support',
          isActive: true
        }
      ],
      supportDocs: 'Comprehensive support documentation available',
      complianceGuidelines: 'We follow industry standard compliance protocols',
      websiteSources: []
    });
    validOperatingHours = OperatingHours.create24x7('America/New_York');
    validLeadQuestions = [
      {
        id: 'q1',
        question: 'What is your name?',
        type: 'text',
        isRequired: true,
        order: 1,
        scoringWeight: 1.0
      },
      {
        id: 'q2',
        question: 'What is your email?',
        type: 'email',
        isRequired: true,
        order: 2,
        scoringWeight: 1.5
      }
    ];
  });

  describe('Successful Configuration Creation', () => {
    it('should create chatbot configuration with valid inputs', async () => {
      const request: ConfigureChatbotRequest = {
        organizationId: 'org-123',
        name: 'Test Chatbot',
        description: 'A test chatbot for customer support',
        avatarUrl: 'https://example.com/avatar.png',
        personalitySettings: validPersonalitySettings,
        knowledgeBase: validKnowledgeBase,
        operatingHours: validOperatingHours,
        leadQualificationQuestions: validLeadQuestions,
        isActive: true
      };

      const result = await useCase.execute(request);

      expect(result.chatbotConfig).toBeDefined();
      expect(result.chatbotConfig.name).toBe('Test Chatbot');
      expect(result.chatbotConfig.organizationId).toBe('org-123');
      expect(result.chatbotConfig.description).toBe('A test chatbot for customer support');
      expect(result.chatbotConfig.avatarUrl).toBe('https://example.com/avatar.png');
      expect(result.chatbotConfig.isActive).toBe(true);
      expect(result.chatbotConfig.leadQualificationQuestions).toHaveLength(2);

      // Verify repository save was called
      expect(mockConfigRepository.getAll()).toHaveLength(1);
      const savedConfig = mockConfigRepository.getAll()[0];
      expect(savedConfig.id).toBe(result.chatbotConfig.id);
    });

    it('should create configuration with minimal required fields', async () => {
      const request: ConfigureChatbotRequest = {
        organizationId: 'org-123',
        name: 'Minimal Chatbot',
        personalitySettings: validPersonalitySettings,
        knowledgeBase: validKnowledgeBase,
        operatingHours: validOperatingHours,
        leadQualificationQuestions: validLeadQuestions
      };

      const result = await useCase.execute(request);

      expect(result.chatbotConfig.name).toBe('Minimal Chatbot');
      expect(result.chatbotConfig.description).toBe('');
      expect(result.chatbotConfig.avatarUrl).toBeUndefined();
      expect(result.chatbotConfig.isActive).toBe(true); // Default value
    });

    it('should set isActive to false when explicitly specified', async () => {
      const request: ConfigureChatbotRequest = {
        organizationId: 'org-123',
        name: 'Inactive Chatbot',
        personalitySettings: validPersonalitySettings,
        knowledgeBase: validKnowledgeBase,
        operatingHours: validOperatingHours,
        leadQualificationQuestions: validLeadQuestions,
        isActive: false
      };

      const result = await useCase.execute(request);

      expect(result.chatbotConfig.isActive).toBe(false);
    });
  });

  describe('Configuration Validation', () => {
    it('should validate knowledge base and return proper scores', async () => {
      const wellConfiguredKnowledgeBase = KnowledgeBase.create({
        companyInfo: 'Complete company information with detailed description',
        productCatalog: 'Comprehensive product catalog with all details',
        faqs: [
          { id: 'faq-1', question: 'Q1', answer: 'A1', category: 'General', isActive: true },
          { id: 'faq-2', question: 'Q2', answer: 'A2', category: 'General', isActive: true },
          { id: 'faq-3', question: 'Q3', answer: 'A3', category: 'Support', isActive: true },
          { id: 'faq-4', question: 'Q4', answer: 'A4', category: 'Support', isActive: true },
          { id: 'faq-5', question: 'Q5', answer: 'A5', category: 'Billing', isActive: true }
        ],
        supportDocs: 'Detailed support documentation',
        complianceGuidelines: 'Complete compliance guidelines',
        websiteSources: []
      });

      const request: ConfigureChatbotRequest = {
        organizationId: 'org-123',
        name: 'Well Configured Bot',
        personalitySettings: validPersonalitySettings,
        knowledgeBase: wellConfiguredKnowledgeBase,
        operatingHours: validOperatingHours,
        leadQualificationQuestions: validLeadQuestions
      };

      const result = await useCase.execute(request);

      expect(result.validationResults.knowledgeBaseScore).toBe(100);
      expect(result.validationResults.configurationCompleteness).toBeGreaterThan(80);
      // May have avatar and lead question recommendations
      expect(result.validationResults.recommendations.length).toBeGreaterThanOrEqual(0);
      expect(result.validationResults.warnings).toHaveLength(0);
    });

    it('should identify incomplete knowledge base and provide recommendations', async () => {
      const incompleteKnowledgeBase = KnowledgeBase.create({
        companyInfo: '', // Missing
        productCatalog: '', // Missing
        faqs: [], // Empty
        supportDocs: '', // Missing
        complianceGuidelines: '', // Missing
        websiteSources: []
      });

      const request: ConfigureChatbotRequest = {
        organizationId: 'org-123',
        name: 'Incomplete Bot',
        personalitySettings: validPersonalitySettings,
        knowledgeBase: incompleteKnowledgeBase,
        operatingHours: validOperatingHours,
        leadQualificationQuestions: validLeadQuestions
      };

      const result = await useCase.execute(request);

      expect(result.validationResults.knowledgeBaseScore).toBe(0);
      expect(result.validationResults.configurationCompleteness).toBeLessThanOrEqual(50);
      expect(result.validationResults.recommendations.length).toBeGreaterThan(0);
      expect(result.validationResults.warnings.length).toBeGreaterThan(0);
      
      expect(result.validationResults.warnings).toContain('Company information is missing');
      expect(result.validationResults.warnings).toContain('No FAQs provided - this will limit chatbot effectiveness');
    });

    it('should provide appropriate recommendations based on configuration', async () => {
      const request: ConfigureChatbotRequest = {
        organizationId: 'org-123',
        name: 'Test Bot',
        // No description or avatar
        personalitySettings: validPersonalitySettings,
        knowledgeBase: validKnowledgeBase,
        operatingHours: validOperatingHours,
        leadQualificationQuestions: [validLeadQuestions[0]] // Only one question
      };

      const result = await useCase.execute(request);

      expect(result.validationResults.recommendations).toContain('Add an avatar to make the chatbot more engaging');
      expect(result.validationResults.recommendations).toContain('Add more qualification questions to improve lead quality');
    });
  });

  describe('Update Configuration', () => {
    it('should update existing configuration successfully', async () => {
      // First create a configuration
      const initialConfig = ChatbotTestDataFactory.createValidConfig({
        id: 'config-123',
        name: 'Original Bot',
        organizationId: 'org-123'
      });
      mockConfigRepository.addConfig(initialConfig);

      // Update it
      const updates: Partial<ConfigureChatbotRequest> = {
        personalitySettings: validPersonalitySettings.updateTone('professional'),
        knowledgeBase: validKnowledgeBase.updateCompanyInfo('Updated company info'),
        isActive: false
      };

      const result = await useCase.updateConfiguration('config-123', updates);

      expect(result.chatbotConfig.personalitySettings.tone).toBe('professional');
      expect(result.chatbotConfig.knowledgeBase.companyInfo).toBe('Updated company info');
      expect(result.chatbotConfig.isActive).toBe(false);
    });

    it('should update operating hours', async () => {
      const initialConfig = ChatbotTestDataFactory.createValidConfig({
        id: 'config-123',
        organizationId: 'org-123'
      });
      mockConfigRepository.addConfig(initialConfig);

      const newOperatingHours = OperatingHours.createDefault('UTC');
      const updates: Partial<ConfigureChatbotRequest> = {
        operatingHours: newOperatingHours
      };

      const result = await useCase.updateConfiguration('config-123', updates);

      expect(result.chatbotConfig.operatingHours.timezone).toBe('UTC');
    });

    it('should update lead qualification questions', async () => {
      const initialConfig = ChatbotTestDataFactory.createValidConfig({
        id: 'config-123',
        organizationId: 'org-123'
      });
      mockConfigRepository.addConfig(initialConfig);

      const newQuestions: LeadQualificationQuestion[] = [
        {
          id: 'new-q1',
          question: 'What is your company size?',
          type: 'select',
          options: ['1-10', '11-50', '51-200', '200+'],
          isRequired: true,
          order: 1,
          scoringWeight: 2.0
        }
      ];

      const updates: Partial<ConfigureChatbotRequest> = {
        leadQualificationQuestions: newQuestions
      };

      const result = await useCase.updateConfiguration('config-123', updates);

      expect(result.chatbotConfig.leadQualificationQuestions).toHaveLength(1);
      expect(result.chatbotConfig.leadQualificationQuestions[0].question).toBe('What is your company size?');
      expect(result.chatbotConfig.leadQualificationQuestions[0].type).toBe('select');
    });

    it('should throw error when updating non-existent configuration', async () => {
      const updates: Partial<ConfigureChatbotRequest> = {
        personalitySettings: validPersonalitySettings
      };

      await expect(useCase.updateConfiguration('non-existent', updates))
        .rejects.toThrow('Chatbot configuration non-existent not found');
    });

    it('should recalculate metrics after update', async () => {
      const initialConfig = ChatbotTestDataFactory.createValidConfig({
        id: 'config-123',
        organizationId: 'org-123'
      });
      mockConfigRepository.addConfig(initialConfig);

      // Update with better knowledge base
      const enhancedKnowledgeBase = KnowledgeBase.create({
        companyInfo: 'Enhanced company information',
        productCatalog: 'Complete product catalog',
        faqs: [
          { id: 'faq-1', question: 'Q1', answer: 'A1', category: 'General', isActive: true },
          { id: 'faq-2', question: 'Q2', answer: 'A2', category: 'General', isActive: true },
          { id: 'faq-3', question: 'Q3', answer: 'A3', category: 'Support', isActive: true },
          { id: 'faq-4', question: 'Q4', answer: 'A4', category: 'Support', isActive: true },
          { id: 'faq-5', question: 'Q5', answer: 'A5', category: 'Billing', isActive: true }
        ],
        supportDocs: 'Complete support docs',
        complianceGuidelines: 'Complete compliance',
        websiteSources: []
      });

      const updates: Partial<ConfigureChatbotRequest> = {
        knowledgeBase: enhancedKnowledgeBase
      };

      const result = await useCase.updateConfiguration('config-123', updates);

      expect(result.validationResults.knowledgeBaseScore).toBe(100);
      expect(result.validationResults.configurationCompleteness).toBeGreaterThan(90);
    });
  });

  describe('Input Validation and Error Handling', () => {
    it('should throw error for empty organization ID', async () => {
      const request: ConfigureChatbotRequest = {
        organizationId: '',
        name: 'Test Bot',
        personalitySettings: validPersonalitySettings,
        knowledgeBase: validKnowledgeBase,
        operatingHours: validOperatingHours,
        leadQualificationQuestions: validLeadQuestions
      };

      await expect(useCase.execute(request)).rejects.toThrow('Organization ID is required');
    });

    it('should throw error for whitespace-only organization ID', async () => {
      const request: ConfigureChatbotRequest = {
        organizationId: '   ',
        name: 'Test Bot',
        personalitySettings: validPersonalitySettings,
        knowledgeBase: validKnowledgeBase,
        operatingHours: validOperatingHours,
        leadQualificationQuestions: validLeadQuestions
      };

      await expect(useCase.execute(request)).rejects.toThrow('Organization ID is required');
    });

    it('should throw error for empty name', async () => {
      const request: ConfigureChatbotRequest = {
        organizationId: 'org-123',
        name: '',
        personalitySettings: validPersonalitySettings,
        knowledgeBase: validKnowledgeBase,
        operatingHours: validOperatingHours,
        leadQualificationQuestions: validLeadQuestions
      };

      await expect(useCase.execute(request)).rejects.toThrow('Chatbot name is required');
    });

    it('should throw error for name too long', async () => {
      const longName = 'a'.repeat(101);
      const request: ConfigureChatbotRequest = {
        organizationId: 'org-123',
        name: longName,
        personalitySettings: validPersonalitySettings,
        knowledgeBase: validKnowledgeBase,
        operatingHours: validOperatingHours,
        leadQualificationQuestions: validLeadQuestions
      };

      await expect(useCase.execute(request)).rejects.toThrow('Chatbot name must be 100 characters or less');
    });

    it('should throw error for missing personality settings', async () => {
      const request: ConfigureChatbotRequest = {
        organizationId: 'org-123',
        name: 'Test Bot',
        personalitySettings: null as any,
        knowledgeBase: validKnowledgeBase,
        operatingHours: validOperatingHours,
        leadQualificationQuestions: validLeadQuestions
      };

      await expect(useCase.execute(request)).rejects.toThrow('Personality settings are required');
    });

    it('should throw error for missing knowledge base', async () => {
      const request: ConfigureChatbotRequest = {
        organizationId: 'org-123',
        name: 'Test Bot',
        personalitySettings: validPersonalitySettings,
        knowledgeBase: null as any,
        operatingHours: validOperatingHours,
        leadQualificationQuestions: validLeadQuestions
      };

      await expect(useCase.execute(request)).rejects.toThrow('Knowledge base is required');
    });

    it('should throw error for missing operating hours', async () => {
      const request: ConfigureChatbotRequest = {
        organizationId: 'org-123',
        name: 'Test Bot',
        personalitySettings: validPersonalitySettings,
        knowledgeBase: validKnowledgeBase,
        operatingHours: null as any,
        leadQualificationQuestions: validLeadQuestions
      };

      await expect(useCase.execute(request)).rejects.toThrow('Operating hours configuration is required');
    });

    it('should throw error for empty lead qualification questions', async () => {
      const request: ConfigureChatbotRequest = {
        organizationId: 'org-123',
        name: 'Test Bot',
        personalitySettings: validPersonalitySettings,
        knowledgeBase: validKnowledgeBase,
        operatingHours: validOperatingHours,
        leadQualificationQuestions: []
      };

      await expect(useCase.execute(request)).rejects.toThrow('At least one lead qualification question is required');
    });

    it('should handle repository save errors', async () => {
      mockConfigRepository.setFailure(true);

      const request: ConfigureChatbotRequest = {
        organizationId: 'org-123',
        name: 'Test Bot',
        personalitySettings: validPersonalitySettings,
        knowledgeBase: validKnowledgeBase,
        operatingHours: validOperatingHours,
        leadQualificationQuestions: validLeadQuestions
      };

      await expect(useCase.execute(request)).rejects.toThrow('Mock repository failure');
    });

    it('should handle repository update errors', async () => {
      const initialConfig = ChatbotTestDataFactory.createValidConfig({
        id: 'config-123',
        organizationId: 'org-123'
      });
      mockConfigRepository.addConfig(initialConfig);
      mockConfigRepository.setFailure(true);

      const updates: Partial<ConfigureChatbotRequest> = {
        personalitySettings: validPersonalitySettings
      };

      await expect(useCase.updateConfiguration('config-123', updates))
        .rejects.toThrow('Mock repository failure');
    });
  });

  describe('Knowledge Base Scoring Algorithm', () => {
    it('should score company info as 25 points when present', async () => {
      const kbWithCompanyInfo = KnowledgeBase.create({
        companyInfo: 'Complete company information',
        productCatalog: '',
        faqs: [],
        supportDocs: '',
        complianceGuidelines: '',
        websiteSources: []
      });

      const request: ConfigureChatbotRequest = {
        organizationId: 'org-123',
        name: 'Test Bot',
        personalitySettings: validPersonalitySettings,
        knowledgeBase: kbWithCompanyInfo,
        operatingHours: validOperatingHours,
        leadQualificationQuestions: validLeadQuestions
      };

      const result = await useCase.execute(request);
      expect(result.validationResults.knowledgeBaseScore).toBe(25);
    });

    it('should score product catalog as 20 points when present', async () => {
      const kbWithProductCatalog = KnowledgeBase.create({
        companyInfo: '',
        productCatalog: 'Complete product catalog',
        faqs: [],
        supportDocs: '',
        complianceGuidelines: '',
        websiteSources: []
      });

      const request: ConfigureChatbotRequest = {
        organizationId: 'org-123',
        name: 'Test Bot',
        personalitySettings: validPersonalitySettings,
        knowledgeBase: kbWithProductCatalog,
        operatingHours: validOperatingHours,
        leadQualificationQuestions: validLeadQuestions
      };

      const result = await useCase.execute(request);
      expect(result.validationResults.knowledgeBaseScore).toBe(20);
    });

    it('should score FAQs as 25 points for 5+ questions', async () => {
      const kbWithManyFAQs = KnowledgeBase.create({
        companyInfo: '',
        productCatalog: '',
        faqs: [
          { id: 'faq-1', question: 'Q1', answer: 'A1', category: 'General', isActive: true },
          { id: 'faq-2', question: 'Q2', answer: 'A2', category: 'General', isActive: true },
          { id: 'faq-3', question: 'Q3', answer: 'A3', category: 'Support', isActive: true },
          { id: 'faq-4', question: 'Q4', answer: 'A4', category: 'Support', isActive: true },
          { id: 'faq-5', question: 'Q5', answer: 'A5', category: 'Billing', isActive: true }
        ],
        supportDocs: '',
        complianceGuidelines: '',
        websiteSources: []
      });

      const request: ConfigureChatbotRequest = {
        organizationId: 'org-123',
        name: 'Test Bot',
        personalitySettings: validPersonalitySettings,
        knowledgeBase: kbWithManyFAQs,
        operatingHours: validOperatingHours,
        leadQualificationQuestions: validLeadQuestions
      };

      const result = await useCase.execute(request);
      expect(result.validationResults.knowledgeBaseScore).toBe(25);
    });

    it('should score FAQs as 15 points for fewer than 5 questions', async () => {
      const kbWithFewFAQs = KnowledgeBase.create({
        companyInfo: '',
        productCatalog: '',
        faqs: [
          { id: 'faq-1', question: 'Q1', answer: 'A1', category: 'General', isActive: true },
          { id: 'faq-2', question: 'Q2', answer: 'A2', category: 'General', isActive: true }
        ],
        supportDocs: '',
        complianceGuidelines: '',
        websiteSources: []
      });

      const request: ConfigureChatbotRequest = {
        organizationId: 'org-123',
        name: 'Test Bot',
        personalitySettings: validPersonalitySettings,
        knowledgeBase: kbWithFewFAQs,
        operatingHours: validOperatingHours,
        leadQualificationQuestions: validLeadQuestions
      };

      const result = await useCase.execute(request);
      expect(result.validationResults.knowledgeBaseScore).toBe(15);
      expect(result.validationResults.recommendations).toContain('Add more FAQs (2/5+ recommended)');
    });

    it('should score support docs as 15 points when present', async () => {
      const kbWithSupportDocs = KnowledgeBase.create({
        companyInfo: '',
        productCatalog: '',
        faqs: [],
        supportDocs: 'Complete support documentation',
        complianceGuidelines: '',
        websiteSources: []
      });

      const request: ConfigureChatbotRequest = {
        organizationId: 'org-123',
        name: 'Test Bot',
        personalitySettings: validPersonalitySettings,
        knowledgeBase: kbWithSupportDocs,
        operatingHours: validOperatingHours,
        leadQualificationQuestions: validLeadQuestions
      };

      const result = await useCase.execute(request);
      expect(result.validationResults.knowledgeBaseScore).toBe(15);
    });

    it('should score compliance guidelines as 15 points when present', async () => {
      const kbWithCompliance = KnowledgeBase.create({
        companyInfo: '',
        productCatalog: '',
        faqs: [],
        supportDocs: '',
        complianceGuidelines: 'Complete compliance guidelines',
        websiteSources: []
      });

      const request: ConfigureChatbotRequest = {
        organizationId: 'org-123',
        name: 'Test Bot',
        personalitySettings: validPersonalitySettings,
        knowledgeBase: kbWithCompliance,
        operatingHours: validOperatingHours,
        leadQualificationQuestions: validLeadQuestions
      };

      const result = await useCase.execute(request);
      expect(result.validationResults.knowledgeBaseScore).toBe(15);
    });
  });

  describe('Configuration Completeness Calculation', () => {
    it('should calculate full completeness for well-configured bot', async () => {
      const perfectKnowledgeBase = KnowledgeBase.create({
        companyInfo: 'Complete company information',
        productCatalog: 'Complete product catalog',
        faqs: [
          { id: 'faq-1', question: 'Q1', answer: 'A1', category: 'General', isActive: true },
          { id: 'faq-2', question: 'Q2', answer: 'A2', category: 'General', isActive: true },
          { id: 'faq-3', question: 'Q3', answer: 'A3', category: 'Support', isActive: true },
          { id: 'faq-4', question: 'Q4', answer: 'A4', category: 'Support', isActive: true },
          { id: 'faq-5', question: 'Q5', answer: 'A5', category: 'Billing', isActive: true }
        ],
        supportDocs: 'Complete support docs',
        complianceGuidelines: 'Complete compliance',
        websiteSources: []
      });

      const request: ConfigureChatbotRequest = {
        organizationId: 'org-123',
        name: 'Perfect Bot',
        description: 'A perfectly configured bot',
        avatarUrl: 'https://example.com/avatar.png',
        personalitySettings: validPersonalitySettings,
        knowledgeBase: perfectKnowledgeBase,
        operatingHours: validOperatingHours,
        leadQualificationQuestions: [
          ...validLeadQuestions,
          {
            id: 'q3',
            question: 'What is your company?',
            type: 'text',
            isRequired: false,
            order: 3,
            scoringWeight: 1.0
          }
        ]
      };

      const result = await useCase.execute(request);

      expect(result.validationResults.configurationCompleteness).toBe(100);
      expect(result.validationResults.knowledgeBaseScore).toBe(100);
      expect(result.validationResults.recommendations).toHaveLength(0);
      expect(result.validationResults.warnings).toHaveLength(0);
    });

    it('should provide completion recommendations for low completeness', async () => {
      const incompleteKnowledgeBase = KnowledgeBase.createEmpty();

      const request: ConfigureChatbotRequest = {
        organizationId: 'org-123',
        name: 'Incomplete Bot',
        // No description
        personalitySettings: validPersonalitySettings,
        knowledgeBase: incompleteKnowledgeBase,
        operatingHours: validOperatingHours,
        leadQualificationQuestions: [validLeadQuestions[0]] // Only one question
      };

      const result = await useCase.execute(request);

      expect(result.validationResults.configurationCompleteness).toBeLessThan(80);
      expect(result.validationResults.recommendations).toContain('Complete configuration to improve chatbot effectiveness');
      expect(result.validationResults.recommendations).toContain('Add an avatar to make the chatbot more engaging');
      expect(result.validationResults.recommendations).toContain('Add more qualification questions to improve lead quality');
    });
  });

  describe('Edge Cases and Complex Scenarios', () => {
    it('should handle activation and deactivation correctly', async () => {
      const request: ConfigureChatbotRequest = {
        organizationId: 'org-123',
        name: 'Test Bot',
        personalitySettings: validPersonalitySettings,
        knowledgeBase: validKnowledgeBase,
        operatingHours: validOperatingHours,
        leadQualificationQuestions: validLeadQuestions,
        isActive: false
      };

      const result = await useCase.execute(request);
      expect(result.chatbotConfig.isActive).toBe(false);

      // Now activate it via update
      const updateResult = await useCase.updateConfiguration(result.chatbotConfig.id, {
        isActive: true
      });

      expect(updateResult.chatbotConfig.isActive).toBe(true);
    });

    it('should handle complex lead qualification questions', async () => {
      const complexQuestions: LeadQualificationQuestion[] = [
        {
          id: 'q1',
          question: 'What is your role?',
          type: 'select',
          options: ['Developer', 'Manager', 'C-Level', 'Other'],
          isRequired: true,
          order: 1,
          scoringWeight: 1.5
        },
        {
          id: 'q2',
          question: 'Company size?',
          type: 'multiselect',
          options: ['1-10', '11-50', '51-200', '200+'],
          isRequired: false,
          order: 2,
          scoringWeight: 2.0
        },
        {
          id: 'q3',
          question: 'Budget range?',
          type: 'select',
          options: ['<$10k', '$10k-$50k', '$50k-$100k', '>$100k'],
          isRequired: true,
          order: 3,
          scoringWeight: 3.0
        }
      ];

      const request: ConfigureChatbotRequest = {
        organizationId: 'org-123',
        name: 'Complex Bot',
        personalitySettings: validPersonalitySettings,
        knowledgeBase: validKnowledgeBase,
        operatingHours: validOperatingHours,
        leadQualificationQuestions: complexQuestions
      };

      const result = await useCase.execute(request);

      expect(result.chatbotConfig.leadQualificationQuestions).toHaveLength(3);
      expect(result.chatbotConfig.leadQualificationQuestions[0].type).toBe('select');
      expect(result.chatbotConfig.leadQualificationQuestions[1].type).toBe('multiselect');
      expect(result.chatbotConfig.leadQualificationQuestions[2].scoringWeight).toBe(3.0);
    });

    it('should preserve timestamps correctly during updates', async () => {
      const originalTime = new Date('2024-01-01T00:00:00Z');
      const initialConfig = ChatbotTestDataFactory.createValidConfig({
        id: 'config-123',
        organizationId: 'org-123',
        createdAt: originalTime,
        updatedAt: originalTime
      });
      mockConfigRepository.addConfig(initialConfig);

      // Wait a bit to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 1));

      const updates: Partial<ConfigureChatbotRequest> = {
        personalitySettings: validPersonalitySettings.updateTone('professional')
      };

      const result = await useCase.updateConfiguration('config-123', updates);

      expect(result.chatbotConfig.createdAt).toEqual(originalTime);
      expect(result.chatbotConfig.updatedAt.getTime()).toBeGreaterThan(originalTime.getTime());
    });
  });

  describe('Performance and Reliability', () => {
    it('should complete configuration creation within performance limits', async () => {
      const request: ConfigureChatbotRequest = {
        organizationId: 'org-123',
        name: 'Performance Test Bot',
        personalitySettings: validPersonalitySettings,
        knowledgeBase: validKnowledgeBase,
        operatingHours: validOperatingHours,
        leadQualificationQuestions: validLeadQuestions
      };

      const startTime = Date.now();
      const result = await useCase.execute(request);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(50); // Should complete in under 50ms for local operations
      expect(result.chatbotConfig).toBeDefined();
    });

    it('should handle large numbers of lead qualification questions', async () => {
      const manyQuestions: LeadQualificationQuestion[] = Array.from({ length: 20 }, (_, i) => ({
        id: `q${i + 1}`,
        question: `Question ${i + 1}?`,
        type: 'text' as const,
        isRequired: i % 2 === 0,
        order: i + 1,
        scoringWeight: 1.0
      }));

      const request: ConfigureChatbotRequest = {
        organizationId: 'org-123',
        name: 'Many Questions Bot',
        personalitySettings: validPersonalitySettings,
        knowledgeBase: validKnowledgeBase,
        operatingHours: validOperatingHours,
        leadQualificationQuestions: manyQuestions
      };

      const result = await useCase.execute(request);

      expect(result.chatbotConfig.leadQualificationQuestions).toHaveLength(20);
      expect(result.validationResults.configurationCompleteness).toBeGreaterThan(80);
    });
  });
});