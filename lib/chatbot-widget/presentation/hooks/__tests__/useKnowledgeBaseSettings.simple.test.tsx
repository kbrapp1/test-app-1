/**
 * Simple useKnowledgeBaseSettings Tests
 * 
 * These tests focus on the stale closure bug prevention without complex mocking.
 * Testing the core state management logic that was causing FAQ data loss.
 */

import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useKnowledgeBaseSettings } from '../useKnowledgeBaseSettings';
import { ChatbotConfigDto } from '../../../application/dto/ChatbotConfigDto';

// Mock the server action to focus on state logic
vi.mock('../../actions/configActions', () => ({
  updateKnowledgeBase: vi.fn().mockResolvedValue({ success: true, data: {} }),
}));

// Mock React Query wrapper
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('useKnowledgeBaseSettings - State Management', () => {
  const mockConfig: ChatbotConfigDto = {
    id: 'config-1',
    organizationId: 'org-1',
    name: 'Test Chatbot',
    isActive: true,
    knowledgeBase: {
      companyInfo: 'Test Company',
      productCatalog: '',
      supportDocs: '',
      complianceGuidelines: '',
      websiteSources: [],
      faqs: [
        {
          id: 'faq-existing',
          question: 'Existing FAQ',
          answer: 'Existing answer',
          category: 'general',
          keywords: [],
          priority: 1,
        },
      ],
    },
    aiConfiguration: {
      openaiModel: 'gpt-4',
      openaiTemperature: 0.7,
      openaiMaxTokens: 100,
      contextMaxTokens: 4000,
      contextSystemPromptTokens: 500,
      contextResponseReservedTokens: 1000,
      contextSummaryTokens: 500,
      intentConfidenceThreshold: 0.8,
      intentAmbiguityThreshold: 0.3,
      enableMultiIntentDetection: true,
      enablePersonaInference: true,
      enableAdvancedEntities: true,
      entityExtractionMode: 'advanced',
      customEntityTypes: [],
      maxConversationTurns: 20,
      inactivityTimeoutSeconds: 1800,
      enableJourneyRegression: true,
      enableContextSwitchDetection: true,
      enableAdvancedScoring: true,
      entityCompletenessWeight: 0.3,
      personaConfidenceWeight: 0.2,
      journeyProgressionWeight: 0.3,
      enablePerformanceLogging: true,
      enableIntentAnalytics: true,
      enablePersonaAnalytics: true,
      responseTimeThresholdMs: 5000,
    },
    personalitySettings: {
      tone: 'professional',
      communicationStyle: 'helpful',
      responseLength: 'medium',
      escalationTriggers: [],
      responseBehavior: {
        useEmojis: false,
        askFollowUpQuestions: true,
        proactiveOffering: false,
        personalizeResponses: true,
        acknowledgePreviousInteractions: true,
      },
      conversationFlow: {
        greetingMessage: 'Hello! How can I help you today?',
        fallbackMessage: 'I apologize, but I don\'t understand. Could you please rephrase?',
        escalationMessage: 'Let me connect you with a human agent.',
        endConversationMessage: 'Thank you for chatting with us!',
        leadCapturePrompt: 'Could I get your contact information?',
        maxConversationTurns: 20,
        inactivityTimeout: 1800,
      },
      customInstructions: '',
    },
    operatingHours: {
      timezone: 'UTC',
      businessHours: [],
      holidaySchedule: [],
      outsideHoursMessage: 'We are currently closed.',
    },
    leadQualificationQuestions: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should properly initialize with existing config', () => {
    const wrapper = createWrapper();
    const { result } = renderHook(
      () => useKnowledgeBaseSettings(mockConfig, 'org-1'),
      { wrapper }
    );

    // Verify initial state
    expect(result.current.formData.faqs).toHaveLength(1);
    expect(result.current.formData.faqs[0].question).toBe('Existing FAQ');
    expect(result.current.formData.companyInfo).toBe('Test Company');
  });

  it('should add FAQ to local state correctly', () => {
    const wrapper = createWrapper();
    const { result } = renderHook(
      () => useKnowledgeBaseSettings(mockConfig, 'org-1'),
      { wrapper }
    );

    // Add a new FAQ
    act(() => {
      result.current.addFaq({
        question: 'New FAQ Question',
        answer: 'New FAQ Answer',
        category: 'support',
        keywords: ['test'],
        priority: 2,
      });
    });

    // Verify FAQ was added to local state
    expect(result.current.formData.faqs).toHaveLength(2);
    expect(result.current.formData.faqs[1].question).toBe('New FAQ Question');
    expect(result.current.formData.faqs[1].answer).toBe('New FAQ Answer');
    expect(result.current.formData.faqs[1].category).toBe('support');
  });

  it('should remove FAQ from local state correctly', () => {
    const wrapper = createWrapper();
    const { result } = renderHook(
      () => useKnowledgeBaseSettings(mockConfig, 'org-1'),
      { wrapper }
    );

    // Add a FAQ first
    act(() => {
      result.current.addFaq({
        question: 'FAQ to be removed',
        answer: 'This will be removed',
        category: 'general',
        keywords: [],
        priority: 1,
      });
    });

    expect(result.current.formData.faqs).toHaveLength(2);

    // Remove the newly added FAQ
    act(() => {
      const faqToRemove = result.current.formData.faqs.find(
        faq => faq.question === 'FAQ to be removed'
      );
      if (faqToRemove) {
        result.current.removeFaq(faqToRemove.id);
      }
    });

    // Verify FAQ was removed from local state
    expect(result.current.formData.faqs).toHaveLength(1);
    expect(result.current.formData.faqs[0].question).toBe('Existing FAQ');
  });

  it('should handle multiple rapid FAQ additions', () => {
    const wrapper = createWrapper();
    const { result } = renderHook(
      () => useKnowledgeBaseSettings(mockConfig, 'org-1'),
      { wrapper }
    );

    // Add multiple FAQs rapidly
    act(() => {
      result.current.addFaq({
        question: 'FAQ 1',
        answer: 'Answer 1',
        category: 'general',
        keywords: [],
        priority: 1,
      });
      
      result.current.addFaq({
        question: 'FAQ 2',
        answer: 'Answer 2', 
        category: 'support',
        keywords: [],
        priority: 1,
      });
      
      result.current.addFaq({
        question: 'FAQ 3',
        answer: 'Answer 3',
        category: 'billing',
        keywords: [],
        priority: 1,
      });
    });

    // Verify all FAQs are in local state
    expect(result.current.formData.faqs).toHaveLength(4); // 1 existing + 3 new
    
    const questions = result.current.formData.faqs.map(faq => faq.question);
    expect(questions).toContain('Existing FAQ');
    expect(questions).toContain('FAQ 1');
    expect(questions).toContain('FAQ 2');
    expect(questions).toContain('FAQ 3');
  });

  it('should update FAQ in local state correctly', () => {
    const wrapper = createWrapper();
    const { result } = renderHook(
      () => useKnowledgeBaseSettings(mockConfig, 'org-1'),
      { wrapper }
    );

    // Update an existing FAQ
    act(() => {
      const existingFaq = result.current.formData.faqs.find(
        faq => faq.question === 'Existing FAQ'
      );
      if (existingFaq) {
        result.current.updateFaq(existingFaq.id, {
          answer: 'Updated existing answer',
          category: 'updated',
        });
      }
    });

    // Verify FAQ was updated
    const updatedFaq = result.current.formData.faqs.find(
      faq => faq.question === 'Existing FAQ'
    );
    expect(updatedFaq?.answer).toBe('Updated existing answer');
    expect(updatedFaq?.category).toBe('updated');
  });

  it('should maintain other form data when manipulating FAQs', () => {
    const wrapper = createWrapper();
    const { result } = renderHook(
      () => useKnowledgeBaseSettings(mockConfig, 'org-1'),
      { wrapper }
    );

    // Update form data
    act(() => {
      result.current.updateFormData({
        companyInfo: 'Updated Company Info',
        productCatalog: 'Product Catalog Content',
      });
    });

    // Add FAQ
    act(() => {
      result.current.addFaq({
        question: 'New FAQ',
        answer: 'New Answer',
        category: 'general',
        keywords: [],
        priority: 1,
      });
    });

    // Verify form data integrity
    expect(result.current.formData.companyInfo).toBe('Updated Company Info');
    expect(result.current.formData.productCatalog).toBe('Product Catalog Content');
    expect(result.current.formData.faqs).toHaveLength(2);
  });

  it('should generate unique IDs for new FAQs', () => {
    const wrapper = createWrapper();
    const { result } = renderHook(
      () => useKnowledgeBaseSettings(mockConfig, 'org-1'),
      { wrapper }
    );

    // Add multiple FAQs
    act(() => {
      result.current.addFaq({
        question: 'FAQ 1',
        answer: 'Answer 1',
        category: 'general',
        keywords: [],
        priority: 1,
      });
      
      result.current.addFaq({
        question: 'FAQ 2',
        answer: 'Answer 2',
        category: 'general',
        keywords: [],
        priority: 1,
      });
    });

    // Verify all FAQs have unique IDs
    const ids = result.current.formData.faqs.map(faq => faq.id);
    const uniqueIds = new Set(ids);
    
    expect(ids).toHaveLength(3); // Should have 3 FAQs total
    expect(uniqueIds.size).toBe(ids.length); // All IDs should be unique
  });

  it('should handle empty config correctly', () => {
    const emptyConfig = { 
      ...mockConfig, 
      knowledgeBase: { 
        companyInfo: '',
        productCatalog: '',
        supportDocs: '',
        complianceGuidelines: '',
        websiteSources: [],
        faqs: [] 
      } 
    };

    const wrapper = createWrapper();
    const { result } = renderHook(
      () => useKnowledgeBaseSettings(emptyConfig, 'org-1'),
      { wrapper }
    );

    // Verify empty state
    expect(result.current.formData.faqs).toHaveLength(0);
    expect(result.current.formData.companyInfo).toBe('');
    
    // Should still be able to add FAQs
    act(() => {
      result.current.addFaq({
        question: 'First FAQ',
        answer: 'First Answer',
        category: 'general',
        keywords: [],
        priority: 1,
      });
    });

    expect(result.current.formData.faqs).toHaveLength(1);
  });
});