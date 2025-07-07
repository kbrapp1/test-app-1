/**
 * useKnowledgeBaseSettings Integration Tests
 * 
 * These tests focus on the stale closure bug that was causing FAQ data loss.
 * The main issue was that handleSave had a stale closure of formData,
 * so newly added FAQs weren't included in the save request.
 */

import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useKnowledgeBaseSettings } from '../useKnowledgeBaseSettings';
import { ChatbotConfigDto } from '../../../application/dto/ChatbotConfigDto';

// Mock the server action
vi.mock('../../actions/configActions', () => ({
  updateKnowledgeBase: vi.fn().mockResolvedValue({ 
    success: true, 
    data: {
      success: true,
      configId: 'config-1',
      processingResult: {
        success: true,
        processedChunks: [],
        statistics: {
          totalChunks: 0,
          chunksBySource: {},
          chunksByCategory: {},
          averageChunkSize: 0,
          totalContentLength: 0,
          processingTimeMs: 100,
          qualityMetrics: {
            averageQualityScore: 0.8,
            chunksAboveThreshold: 0,
            duplicateChunks: 0,
            emptyChunks: 0,
            lowQualityChunks: 0,
          },
        },
        validation: {
          isValid: true,
          errors: [],
          warnings: [],
          suggestions: [],
        },
      },
      vectorsGenerated: true,
      affectedItems: 0,
      errors: [],
      warnings: [],
    }
  }),
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

describe('useKnowledgeBaseSettings - Stale Closure Bug Prevention', () => {
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

  beforeEach(async () => {
    vi.clearAllMocks();
    const { updateKnowledgeBase } = await import('../../actions/configActions');
    vi.mocked(updateKnowledgeBase).mockResolvedValue({ 
      success: true, 
      data: {
        success: true,
        configId: 'config-1',
        processingResult: {
          success: true,
          processedChunks: [],
          statistics: {
            totalChunks: 0,
            chunksBySource: {},
            chunksByCategory: {},
            averageChunkSize: 0,
            totalContentLength: 0,
            processingTimeMs: 100,
            qualityMetrics: {
              averageQualityScore: 0.8,
              chunksAboveThreshold: 0,
              duplicateChunks: 0,
              emptyChunks: 0,
              lowQualityChunks: 0,
            },
          },
          validation: {
            isValid: true,
            errors: [],
            warnings: [],
            suggestions: [],
          },
        },
        vectorsGenerated: true,
        affectedItems: 0,
        errors: [],
        warnings: [],
      }
    });
  });

  it('should include newly added FAQ in save request (prevent stale closure)', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(
      () => useKnowledgeBaseSettings(mockConfig, 'org-1'),
      { wrapper }
    );

    // Verify initial state
    expect(result.current.formData.faqs).toHaveLength(1);
    expect(result.current.formData.faqs[0].question).toBe('Existing FAQ');

    // Add a new FAQ using the addFaq function
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

    // Call handleSave - this is where the stale closure bug occurred
    await act(async () => {
      await result.current.handleSave();
    });

    // Wait for the save to complete
    await waitFor(async () => {
      const { updateKnowledgeBase } = await import('../../actions/configActions');
      expect(vi.mocked(updateKnowledgeBase)).toHaveBeenCalled();
    });

    // Critical assertion: Verify that the new FAQ was included in the save request
    const { updateKnowledgeBase } = await import('../../actions/configActions');
    const saveRequest = vi.mocked(updateKnowledgeBase).mock.calls[0][0];
    expect(saveRequest.formData.faqs).toHaveLength(2);
    
    // Verify both FAQs are in the save request
    const savedFaqs = saveRequest.formData.faqs;
    expect(savedFaqs.find((faq: any) => faq.question === 'Existing FAQ')).toBeDefined();
    expect(savedFaqs.find((faq: any) => faq.question === 'New FAQ Question')).toBeDefined();
  });

  it('should handle multiple rapid FAQ additions without losing data', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(
      () => useKnowledgeBaseSettings(mockConfig, 'org-1'),
      { wrapper }
    );

    // Add multiple FAQs rapidly (simulating user adding multiple FAQs quickly)
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

    // Save immediately after additions
    await act(async () => {
      await result.current.handleSave();
    });

    await waitFor(async () => {
      const { updateKnowledgeBase } = await import('../../actions/configActions');
      expect(vi.mocked(updateKnowledgeBase)).toHaveBeenCalled();
    });

    // Verify all FAQs were included in save request
    const { updateKnowledgeBase } = await import('../../actions/configActions');
    const saveRequest = vi.mocked(updateKnowledgeBase).mock.calls[0][0];
    expect(saveRequest.formData.faqs).toHaveLength(4);
    
    const savedQuestions = saveRequest.formData.faqs.map((faq: any) => faq.question);
    expect(savedQuestions).toContain('Existing FAQ');
    expect(savedQuestions).toContain('FAQ 1');
    expect(savedQuestions).toContain('FAQ 2');
    expect(savedQuestions).toContain('FAQ 3');
  });

  it('should handle FAQ removal correctly in save request', async () => {
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

    // Save and verify only remaining FAQ is in request
    await act(async () => {
      await result.current.handleSave();
    });

    await waitFor(async () => {
      const { updateKnowledgeBase } = await import('../../actions/configActions');
      expect(vi.mocked(updateKnowledgeBase)).toHaveBeenCalled();
    });

    const { updateKnowledgeBase: updateKnowledgeBase2 } = await import('../../actions/configActions');
    const saveRequest = vi.mocked(updateKnowledgeBase2).mock.calls[0][0];
    expect(saveRequest.formData.faqs).toHaveLength(1);
    expect(saveRequest.formData.faqs[0].question).toBe('Existing FAQ');
  });

  it('should handle edge case: save with no FAQs', async () => {
    const configWithoutFaqs = { 
      ...mockConfig, 
      knowledgeBase: { 
        ...mockConfig.knowledgeBase, 
        faqs: [] 
      } 
    };

    const wrapper = createWrapper();
    const { result } = renderHook(
      () => useKnowledgeBaseSettings(configWithoutFaqs, 'org-1'),
      { wrapper }
    );

    // Verify empty state
    expect(result.current.formData.faqs).toHaveLength(0);

    // Try to save with no FAQs
    await act(async () => {
      await result.current.handleSave();
    });

    await waitFor(async () => {
      const { updateKnowledgeBase } = await import('../../actions/configActions');
      expect(vi.mocked(updateKnowledgeBase)).toHaveBeenCalled();
    });

    // Verify empty FAQ array is sent
    const { updateKnowledgeBase: updateKnowledgeBase3 } = await import('../../actions/configActions');
    const saveRequest = vi.mocked(updateKnowledgeBase3).mock.calls[0][0];
    expect(saveRequest.formData.faqs).toHaveLength(0);
  });

  it('should maintain form data integrity across multiple operations', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(
      () => useKnowledgeBaseSettings(mockConfig, 'org-1'),
      { wrapper }
    );

    // Perform multiple operations: add, update, remove, add again
    act(() => {
      // Add FAQ
      result.current.addFaq({
        question: 'Test FAQ',
        answer: 'Test Answer',
        category: 'general',
        keywords: [],
        priority: 1,
      });
    });

    expect(result.current.formData.faqs).toHaveLength(2);

    // Update an existing FAQ
    act(() => {
      const existingFaq = result.current.formData.faqs.find(
        faq => faq.question === 'Existing FAQ'
      );
      if (existingFaq) {
        result.current.updateFaq(existingFaq.id, {
          answer: 'Updated existing answer',
        });
      }
    });

    // Remove the newly added FAQ
    act(() => {
      const testFaq = result.current.formData.faqs.find(
        faq => faq.question === 'Test FAQ'
      );
      if (testFaq) {
        result.current.removeFaq(testFaq.id);
      }
    });

    expect(result.current.formData.faqs).toHaveLength(1);

    // Add another FAQ
    act(() => {
      result.current.addFaq({
        question: 'Final FAQ',
        answer: 'Final Answer',
        category: 'support',
        keywords: [],
        priority: 1,
      });
    });

    expect(result.current.formData.faqs).toHaveLength(2);

    // Save and verify final state
    await act(async () => {
      await result.current.handleSave();
    });

    await waitFor(async () => {
      const { updateKnowledgeBase } = await import('../../actions/configActions');
      expect(vi.mocked(updateKnowledgeBase)).toHaveBeenCalled();
    });

    const { updateKnowledgeBase: updateKnowledgeBase4 } = await import('../../actions/configActions');
    const saveRequest = vi.mocked(updateKnowledgeBase4).mock.calls[0][0];
    expect(saveRequest.formData.faqs).toHaveLength(2);
    
    const savedFaqs = saveRequest.formData.faqs;
    
    // Verify updated existing FAQ
    const existingFaq = savedFaqs.find((faq: any) => faq.question === 'Existing FAQ');
    expect(existingFaq).toBeDefined();
    expect(existingFaq?.answer).toBe('Updated existing answer');
    
    // Verify new FAQ
    const finalFaq = savedFaqs.find((faq: any) => faq.question === 'Final FAQ');
    expect(finalFaq).toBeDefined();
    expect(finalFaq?.answer).toBe('Final Answer');
  });
});