/**
 * ProcessChatMessageUseCase Tests
 * 
 * Tests the main use case for processing chat messages, including:
 * - End-to-end message processing workflow
 * - Error handling and transformation
 * - Integration with domain services
 * - Performance profiling
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProcessChatMessageUseCase } from '../ProcessChatMessageUseCase';
import { ProcessChatMessageRequest } from '../../dto/ProcessChatMessageRequest';
import { ProcessChatMessageResult } from '../../dto/ProcessChatMessageResult';
import { setupTestEnvironment, TestEnvironment } from '../../../__tests__/test-utils/TestSetupHelpers';
import { ChatbotTestDataFactory } from '../../../__tests__/test-utils/ChatbotTestDataFactory';
import { 
  OrganizationRequiredError, 
  MessageValidationError,
  DomainError 
} from '../../../domain/errors/ChatMessageProcessingErrors';
import { PerformanceProfiler } from '../../../../performance-profiler';

// Mock PerformanceProfiler
vi.mock('../../../../performance-profiler', () => ({
  PerformanceProfiler: {
    clear: vi.fn(),
    startTimer: vi.fn(),
    endTimer: vi.fn(),
    getMetrics: vi.fn(() => ({})),
    printReport: vi.fn()
  }
}));

// Mock ChatbotWidgetCompositionRoot
vi.mock('../../../infrastructure/composition/ChatbotWidgetCompositionRoot', () => ({
  ChatbotWidgetCompositionRoot: {
    getErrorTrackingFacade: vi.fn(() => ({
      trackError: vi.fn(),
      trackWarning: vi.fn(),
      trackInfo: vi.fn(),
      getErrorStats: vi.fn(() => ({})),
      clearStats: vi.fn()
    })),
    getSimplePromptService: vi.fn(() => ({
      buildPrompt: vi.fn(() => 'Mock prompt'),
      getPromptConfig: vi.fn(() => ({}))
    })),
    getLoggingService: vi.fn(() => ({
      log: vi.fn(),
      createSessionLogger: vi.fn(() => ({
        logMessage: vi.fn(),
        logError: vi.fn(),
        logApiCall: vi.fn(),
        flush: vi.fn()
      }))
    }))
  }
}));

describe('ProcessChatMessageUseCase', () => {
  let testEnv: TestEnvironment;
  let useCase: ProcessChatMessageUseCase;
  
  beforeEach(() => {
    testEnv = setupTestEnvironment();
    
    // Clear mock call history before each test
    vi.clearAllMocks();
    
    useCase = new ProcessChatMessageUseCase(
      testEnv.mocks.sessionRepository,
      testEnv.mocks.messageRepository,
      testEnv.mocks.configRepository,
      testEnv.mocks.aiService,
      testEnv.mocks.conversationContextOrchestrator as any,
      testEnv.mocks.tokenService,
      testEnv.mocks.intentService,
      testEnv.mocks.knowledgeService,
      testEnv.mocks.debugInformationService
    );
  });

  describe('Input Validation', () => {
    it('should throw OrganizationRequiredError when organizationId is empty', async () => {
      const request: ProcessChatMessageRequest = {
        userMessage: 'Hello',
        sessionId: 'session-123',
        organizationId: '',
        metadata: {}
      };

      await expect(useCase.execute(request)).rejects.toThrow(OrganizationRequiredError);
    });

    it('should throw OrganizationRequiredError when organizationId is whitespace', async () => {
      const request: ProcessChatMessageRequest = {
        userMessage: 'Hello',
        sessionId: 'session-123',
        organizationId: '   \n\t  ',
        metadata: {}
      };

      await expect(useCase.execute(request)).rejects.toThrow(OrganizationRequiredError);
    });

    it('should throw MessageValidationError when userMessage is empty', async () => {
      const request: ProcessChatMessageRequest = {
        userMessage: '',
        sessionId: 'session-123',
        organizationId: 'org-123',
        metadata: {}
      };

      await expect(useCase.execute(request)).rejects.toThrow(MessageValidationError);
    });

    it('should throw MessageValidationError when sessionId is empty', async () => {
      const request: ProcessChatMessageRequest = {
        userMessage: 'Hello',
        sessionId: '',
        organizationId: 'org-123',
        metadata: {}
      };

      await expect(useCase.execute(request)).rejects.toThrow(MessageValidationError);
    });

    it('should handle validation errors from ProcessChatMessageRequestValidator', async () => {
      const request = {
        userMessage: null,
        sessionId: 'session-123',
        organizationId: 'org-123'
      } as any;

      await expect(useCase.execute(request)).rejects.toThrow(MessageValidationError);
    });
  });

  describe('Successful Message Processing', () => {
    it('should process a valid message request successfully', async () => {
      const request: ProcessChatMessageRequest = {
        userMessage: 'Hello, I need help with your service',
        sessionId: 'session-123',
        organizationId: 'org-123',
        metadata: {
          userId: 'user-456',
          timestamp: '2024-01-01T12:00:00Z'
        }
      };

      // Create mock entities using test data factory
      const mockSession = testEnv.factory.createChatSession('config-123');
      const mockUserMessage = testEnv.factory.createChatMessage('session-123', { content: 'Hello, I need help with your service', messageType: 'user' });
      const mockBotMessage = testEnv.factory.createBotMessage('session-123', 'Hello! I\'d be happy to help you with our service.');

      const mockResult: ProcessChatMessageResult = {
        chatSession: mockSession,
        userMessage: mockUserMessage,
        botResponse: mockBotMessage,
        shouldCaptureLeadInfo: false,
        suggestedNextActions: ['Ask more questions'],
        conversationMetrics: {
          messageCount: 1,
          sessionDuration: 30000,
          engagementScore: 75,
          leadQualificationProgress: 20
        },
        intentAnalysis: {
          intent: 'help_request',
          confidence: 0.9,
          entities: {},
          category: 'support'
        },
        journeyState: {
          stage: 'engagement',
          confidence: 0.8,
          isSalesReady: false,
          recommendedActions: ['Provide detailed help']
        },
        relevantKnowledge: [{
          title: 'Service Help',
          content: 'We offer comprehensive support...',
          relevanceScore: 0.95
        }],
        callToAction: {
          type: 'help_offer',
          message: 'How can I help you today?',
          priority: 'medium'
        }
      };

      // Mock the workflow orchestrator to return success
      vi.spyOn(useCase['workflowOrchestrator'], 'orchestrate').mockResolvedValue(mockResult);

      const result = await useCase.execute(request);

      expect(result).toEqual(mockResult);
      expect(result.chatSession).toBeDefined();
      expect(result.userMessage).toBeDefined();
      expect(result.botResponse).toBeDefined();
      expect(result.shouldCaptureLeadInfo).toBe(false);
      expect(result.suggestedNextActions).toEqual(['Ask more questions']);
      expect(PerformanceProfiler.clear).toHaveBeenCalled();
    });

    it('should handle requests with minimal metadata', async () => {
      const request: ProcessChatMessageRequest = {
        userMessage: 'Hi there',
        sessionId: 'session-456',
        organizationId: 'org-789'
      };

      const mockSession = testEnv.factory.createChatSession('config-456');
      const mockUserMessage = testEnv.factory.createChatMessage('session-456', { content: 'Hi there', messageType: 'user' });
      const mockBotMessage = testEnv.factory.createBotMessage('session-456', 'Hello! How can I help you today?');

      const mockResult: ProcessChatMessageResult = {
        chatSession: mockSession,
        userMessage: mockUserMessage,
        botResponse: mockBotMessage,
        shouldCaptureLeadInfo: false,
        suggestedNextActions: ['Continue conversation'],
        conversationMetrics: {
          messageCount: 1,
          sessionDuration: 10000,
          engagementScore: 50,
          leadQualificationProgress: 0
        },
        intentAnalysis: {
          intent: 'greeting',
          confidence: 0.95,
          entities: {},
          category: 'general'
        }
      };

      vi.spyOn(useCase['workflowOrchestrator'], 'orchestrate').mockResolvedValue(mockResult);

      const result = await useCase.execute(request);

      expect(result).toEqual(mockResult);
      expect(result.chatSession.id).toBe(mockSession.id);
      expect(result.userMessage.content).toBe('Hi there');
      expect(result.botResponse.content).toBe('Hello! How can I help you today?');
    });

    it('should process complex messages with full metadata', async () => {
      const request: ProcessChatMessageRequest = {
        userMessage: 'I\'m interested in your premium package. Can you tell me about pricing and features?',
        sessionId: 'session-premium-123',
        organizationId: 'org-enterprise-456',
        metadata: {
          userId: 'user-vip-789',
          timestamp: '2024-01-01T15:30:00Z',
          clientInfo: {
            userAgent: 'Chrome/96.0.4664.45',
            referrer: 'https://google.com',
            page: '/pricing'
          }
        }
      };

      const mockSession = testEnv.factory.createChatSession('config-premium');
      const mockUserMessage = testEnv.factory.createChatMessage('session-premium-123', { content: request.userMessage, messageType: 'user' });
      const mockBotMessage = testEnv.factory.createBotMessage('session-premium-123', 'I\'d be happy to help you with information about our premium package! Our premium features include...');

      const mockResult: ProcessChatMessageResult = {
        chatSession: mockSession,
        userMessage: mockUserMessage,
        botResponse: mockBotMessage,
        shouldCaptureLeadInfo: true,
        suggestedNextActions: ['Qualify lead', 'Schedule demo'],
        conversationMetrics: {
          messageCount: 1,
          sessionDuration: 45000,
          engagementScore: 90,
          leadQualificationProgress: 65
        },
        intentAnalysis: {
          intent: 'sales_inquiry',
          confidence: 0.95,
          entities: {
            product: 'premium package',
            topics: ['pricing', 'features']
          },
          category: 'sales'
        },
        journeyState: {
          stage: 'qualification',
          confidence: 0.9,
          isSalesReady: true,
          recommendedActions: ['Gather contact info', 'Schedule demo']
        },
        relevantKnowledge: [{
          title: 'Premium Package Features',
          content: 'Our premium package includes advanced features...',
          relevanceScore: 0.98
        }],
        callToAction: {
          type: 'lead_capture',
          message: 'Would you like to schedule a demo?',
          priority: 'high'
        }
      };

      vi.spyOn(useCase['workflowOrchestrator'], 'orchestrate').mockResolvedValue(mockResult);

      const result = await useCase.execute(request);

      expect(result).toEqual(mockResult);
      expect(result.shouldCaptureLeadInfo).toBe(true);
      expect(result.intentAnalysis?.intent).toBe('sales_inquiry');
      expect(result.journeyState?.isSalesReady).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should preserve domain errors as-is', async () => {
      const request: ProcessChatMessageRequest = {
        userMessage: 'Hello',
        sessionId: 'session-123',
        organizationId: 'org-123'
      };

      const domainError = new OrganizationRequiredError({ request });
      vi.spyOn(useCase['workflowOrchestrator'], 'orchestrate').mockRejectedValue(domainError);

      await expect(useCase.execute(request)).rejects.toThrow(OrganizationRequiredError);
    });

    it('should wrap unexpected errors in generic Error', async () => {
      const request: ProcessChatMessageRequest = {
        userMessage: 'Hello',
        sessionId: 'session-123',
        organizationId: 'org-123'
      };

      const unexpectedError = new TypeError('Unexpected type error');
      vi.spyOn(useCase['workflowOrchestrator'], 'orchestrate').mockRejectedValue(unexpectedError);

      await expect(useCase.execute(request)).rejects.toThrow('Unexpected type error');
    });

    it('should handle null/undefined errors gracefully', async () => {
      const request: ProcessChatMessageRequest = {
        userMessage: 'Hello',
        sessionId: 'session-123',
        organizationId: 'org-123'
      };

      vi.spyOn(useCase['workflowOrchestrator'], 'orchestrate').mockRejectedValue(null);

      await expect(useCase.execute(request)).rejects.toThrow('An unexpected error occurred during message processing');
    });

    it('should handle string errors', async () => {
      const request: ProcessChatMessageRequest = {
        userMessage: 'Hello',
        sessionId: 'session-123',
        organizationId: 'org-123'
      };

      vi.spyOn(useCase['workflowOrchestrator'], 'orchestrate').mockRejectedValue('String error');

      await expect(useCase.execute(request)).rejects.toThrow('An unexpected error occurred during message processing');
    });
  });

  describe('Performance Profiling', () => {
    it('should clear performance profiler before execution', async () => {
      const request: ProcessChatMessageRequest = {
        userMessage: 'Hello',
        sessionId: 'session-123',
        organizationId: 'org-123'
      };

      const mockSession = testEnv.factory.createChatSession();
      const mockUserMessage = testEnv.factory.createChatMessage('session-123', { content: 'Hello', messageType: 'user' });
      const mockBotMessage = testEnv.factory.createBotMessage('session-123', 'Hello!');

      const mockResult: ProcessChatMessageResult = {
        chatSession: mockSession,
        userMessage: mockUserMessage,
        botResponse: mockBotMessage,
        shouldCaptureLeadInfo: false,
        suggestedNextActions: [],
        conversationMetrics: {
          messageCount: 1,
          sessionDuration: 10000,
          engagementScore: 50,
          leadQualificationProgress: 0
        }
      };

      vi.spyOn(useCase['workflowOrchestrator'], 'orchestrate').mockResolvedValue(mockResult);

      await useCase.execute(request);

      expect(PerformanceProfiler.clear).toHaveBeenCalledTimes(1);
    });

    it('should clear performance profiler even when errors occur', async () => {
      const request: ProcessChatMessageRequest = {
        userMessage: 'Hello',
        sessionId: 'session-123',
        organizationId: 'org-123'
      };

      vi.spyOn(useCase['workflowOrchestrator'], 'orchestrate').mockRejectedValue(new Error('Test error'));

      await expect(useCase.execute(request)).rejects.toThrow('Test error');
      expect(PerformanceProfiler.clear).toHaveBeenCalledTimes(1);
    });
  });

  describe('Integration with Workflow Orchestrator', () => {
    it('should pass validated request to workflow orchestrator', async () => {
      const request: ProcessChatMessageRequest = {
        userMessage: 'Hello world',
        sessionId: 'session-123',
        organizationId: 'org-123',
        metadata: {
          userId: 'user-456'
        }
      };

      const mockSession = testEnv.factory.createChatSession();
      const mockUserMessage = testEnv.factory.createChatMessage('session-123', { content: 'Hello world', messageType: 'user' });
      const mockBotMessage = testEnv.factory.createBotMessage('session-123', 'Hello!');

      const mockResult: ProcessChatMessageResult = {
        chatSession: mockSession,
        userMessage: mockUserMessage,
        botResponse: mockBotMessage,
        shouldCaptureLeadInfo: false,
        suggestedNextActions: [],
        conversationMetrics: {
          messageCount: 1,
          sessionDuration: 10000,
          engagementScore: 50,
          leadQualificationProgress: 0
        }
      };

      const orchestrateSpy = vi.spyOn(useCase['workflowOrchestrator'], 'orchestrate').mockResolvedValue(mockResult);

      await useCase.execute(request);

      expect(orchestrateSpy).toHaveBeenCalledWith(request);
      expect(orchestrateSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long messages', async () => {
      const longMessage = 'This is a very long message that should be handled properly by the system. '.repeat(20); // Creates a reasonably long message
      const request: ProcessChatMessageRequest = {
        userMessage: longMessage,
        sessionId: 'session-123',
        organizationId: 'org-123'
      };

      const mockSession = testEnv.factory.createChatSession();
      const mockUserMessage = testEnv.factory.createChatMessage('session-123', { content: longMessage, messageType: 'user' });
      const mockBotMessage = testEnv.factory.createBotMessage('session-123', 'I understand you have a detailed message. How can I help?');

      const mockResult: ProcessChatMessageResult = {
        chatSession: mockSession,
        userMessage: mockUserMessage,
        botResponse: mockBotMessage,
        shouldCaptureLeadInfo: false,
        suggestedNextActions: [],
        conversationMetrics: {
          messageCount: 1,
          sessionDuration: 20000,
          engagementScore: 60,
          leadQualificationProgress: 0
        }
      };

      vi.spyOn(useCase['workflowOrchestrator'], 'orchestrate').mockResolvedValue(mockResult);

      const result = await useCase.execute(request);

      expect(result.chatSession).toBeDefined();
      expect(result.userMessage.content).toBeDefined();
      expect(result.userMessage.content.length).toBeGreaterThan(0);
    });

    it('should handle messages with special characters', async () => {
      const specialMessage = 'Hello! @#$%^&*()_+{}|:"<>?[]\\;\',./'
      const request: ProcessChatMessageRequest = {
        userMessage: specialMessage,
        sessionId: 'session-123',
        organizationId: 'org-123'
      };

      const mockSession = testEnv.factory.createChatSession();
      const mockUserMessage = testEnv.factory.createChatMessage('session-123', { content: specialMessage, messageType: 'user' });
      const mockBotMessage = testEnv.factory.createBotMessage('session-123', 'Hello! I can help you with that.');

      const mockResult: ProcessChatMessageResult = {
        chatSession: mockSession,
        userMessage: mockUserMessage,
        botResponse: mockBotMessage,
        shouldCaptureLeadInfo: false,
        suggestedNextActions: [],
        conversationMetrics: {
          messageCount: 1,
          sessionDuration: 15000,
          engagementScore: 55,
          leadQualificationProgress: 0
        }
      };

      vi.spyOn(useCase['workflowOrchestrator'], 'orchestrate').mockResolvedValue(mockResult);

      const result = await useCase.execute(request);

      expect(result.chatSession).toBeDefined();
      expect(result.userMessage.content).toBe(specialMessage);
    });
  });
});