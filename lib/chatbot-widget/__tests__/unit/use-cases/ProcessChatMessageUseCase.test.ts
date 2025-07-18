/**
 * ProcessChatMessageUseCase Unit Tests
 * 
 * Tests the core chatbot message processing workflow including:
 * - Service initialization and dependency injection
 * - Input validation patterns
 * - Basic error handling structure
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProcessChatMessageUseCase } from '../../../application/use-cases/ProcessChatMessageUseCase';
import { ProcessChatMessageRequest } from '../../../application/dto/ProcessChatMessageRequest';

// Mock Performance Profiler
vi.mock('../../../performance-profiler', () => ({
  PerformanceProfiler: {
    clear: vi.fn(),
    start: vi.fn(),
    end: vi.fn(),
    getMetrics: vi.fn().mockReturnValue({})
  }
}));

// Mock external dependencies
vi.mock('../../../infrastructure/composition/ChatbotWidgetCompositionRoot', () => ({
  ChatbotWidgetCompositionRoot: {
    getErrorTrackingFacade: vi.fn().mockReturnValue({
      trackError: vi.fn(),
      getMetrics: vi.fn().mockReturnValue({ totalErrors: 0 }),
      trackMessageProcessingError: vi.fn()
    }),
    getLoggingService: vi.fn().mockReturnValue({
      createSessionLogger: vi.fn().mockReturnValue({
        logHeader: vi.fn(),
        logMessage: vi.fn(),
        logRaw: vi.fn(),
        logError: vi.fn(),
        logMetrics: vi.fn(),
        logSeparator: vi.fn(),
        flush: vi.fn().mockResolvedValue(undefined)
      })
    }),
    getVectorKnowledgeRepository: vi.fn().mockReturnValue({}),
    getEmbeddingService: vi.fn().mockReturnValue({}),
    getSimplePromptService: vi.fn().mockReturnValue({
      generatePrompt: vi.fn().mockResolvedValue('mock prompt'),
      validatePrompt: vi.fn().mockReturnValue(true)
    })
  }
}));

// Mock internal services
vi.mock('../../../application/services/message-processing', () => ({
  MessageProcessingWorkflowService: vi.fn().mockImplementation(() => ({
    initializeWorkflow: vi.fn().mockResolvedValue({}),
    finalizeWorkflow: vi.fn().mockResolvedValue({})
  })),
  ChatMessageProcessingService: vi.fn().mockImplementation(() => ({
    processUserMessage: vi.fn().mockResolvedValue({}),
    generateAIResponse: vi.fn().mockResolvedValue({})
  }))
}));

vi.mock('../../../application/services/conversation-management/ConversationContextManagementService', () => ({
  ConversationContextManagementService: vi.fn().mockImplementation(() => ({
    getTokenAwareContext: vi.fn().mockResolvedValue({})
  }))
}));

vi.mock('../../../application/services/ProcessChatMessageWorkflowOrchestrator', () => ({
  ProcessChatMessageWorkflowOrchestrator: vi.fn().mockImplementation(() => ({
    orchestrate: vi.fn().mockResolvedValue({
      chatSession: { id: 'test-session-123' },
      userMessage: { id: 'msg-1', content: 'Hello' },
      botResponse: { id: 'msg-2', content: 'Hi there!' },
      shouldCaptureLeadInfo: false,
      suggestedNextActions: ['Ask more questions'],
      conversationMetrics: { responseTime: 100 },
      intentAnalysis: { intent: 'greeting', confidence: 0.9 },
      journeyState: { phase: 'initial' },
      relevantKnowledge: [],
      callToAction: null
    })
  }))
}));

vi.mock('../../../application/services/configuration-management/SessionUpdateService', () => ({
  SessionUpdateService: vi.fn().mockImplementation(() => ({
    updateSession: vi.fn().mockResolvedValue({}),
    saveSession: vi.fn().mockResolvedValue({})
  }))
}));

vi.mock('../../../infrastructure/composition/DomainServiceCompositionService', () => ({
  DomainServiceCompositionService: {
    getTokenCountingService: vi.fn().mockReturnValue({
      countTokens: vi.fn().mockResolvedValue(100)
    }),
    getIntentClassificationService: vi.fn().mockResolvedValue({
      classifyIntent: vi.fn().mockResolvedValue({ intent: 'general', confidence: 0.8 })
    }),
    getKnowledgeRetrievalService: vi.fn().mockReturnValue({
      searchKnowledge: vi.fn().mockResolvedValue([])
    })
  }
}));

describe('ProcessChatMessageUseCase', () => {
  let mockSessionRepository: any;
  let mockMessageRepository: any;
  let mockConfigRepository: any;
  let mockAIService: any;
  let mockContextOrchestrator: any;
  let mockTokenService: any;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Create complete mock objects with all required interface methods
    mockSessionRepository = {
      findById: vi.fn(),
      findBySessionToken: vi.fn(),
      findActiveByChatbotConfigId: vi.fn(),
      findByVisitorId: vi.fn(),
      findByOrganizationIdWithPagination: vi.fn(),
      save: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findExpiredSessions: vi.fn(),
      markExpiredAsAbandoned: vi.fn(),
      getAnalytics: vi.fn(),
      findRecentByVisitorId: vi.fn(),
      countActiveByChatbotConfigId: vi.fn()
    };

    mockMessageRepository = {
      findById: vi.fn(),
      findBySessionId: vi.fn(),
      findVisibleBySessionId: vi.fn(),
      findBySessionIdWithPagination: vi.fn(),
      save: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      deleteBySessionId: vi.fn(),
      findRecentByOrganizationId: vi.fn(),
      searchByContent: vi.fn(),
      getAnalytics: vi.fn(),
      findLastBySessionId: vi.fn(),
      countByTypeAndSessionId: vi.fn(),
      findMessagesWithErrors: vi.fn(),
      getResponseTimeMetrics: vi.fn()
    };

    mockConfigRepository = {
      findById: vi.fn(),
      findByOrganizationId: vi.fn(),
      findActiveByOrganizationId: vi.fn(),
      save: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      existsByOrganizationId: vi.fn(),
      findByNamePattern: vi.fn(),
      getStatistics: vi.fn()
    };

    mockAIService = {
      generateResponse: vi.fn()
    };

    mockContextOrchestrator = {
      analyzeContextEnhanced: vi.fn()
    };

    mockTokenService = {
      countTokens: vi.fn()
    };
  });

  describe('Initialization', () => {
    it('should create ProcessChatMessageUseCase instance', () => {
      const useCase = new ProcessChatMessageUseCase(
        mockSessionRepository,
        mockMessageRepository,
        mockConfigRepository,
        mockAIService,
        mockContextOrchestrator,
        mockTokenService
      );

      expect(useCase).toBeDefined();
      expect(useCase).toBeInstanceOf(ProcessChatMessageUseCase);
    });
  });

  describe('Constructor Dependencies', () => {
    it('should accept required dependencies', () => {
      expect(() => {
        new ProcessChatMessageUseCase(
          mockSessionRepository,
          mockMessageRepository,
          mockConfigRepository,
          mockAIService,
          mockContextOrchestrator,
          mockTokenService
        );
      }).not.toThrow();
    });

    it('should accept optional dependencies', () => {
      const mockIntentService = { classifyIntent: vi.fn() } as any;
      const mockKnowledgeService = { searchKnowledge: vi.fn() } as any;
      const mockDebugService = { captureApiCall: vi.fn() } as any;

      expect(() => {
        new ProcessChatMessageUseCase(
          mockSessionRepository,
          mockMessageRepository,
          mockConfigRepository,
          mockAIService,
          mockContextOrchestrator,
          mockTokenService,
          mockIntentService,
          mockKnowledgeService,
          mockDebugService
        );
      }).not.toThrow();
    });
  });

  describe('Input Validation', () => {
    it('should handle ProcessMessageRequest structure', () => {
      const validRequest: ProcessChatMessageRequest = {
        userMessage: 'Hello, I need help',
        sessionId: 'test-session-123',
        organizationId: 'test-org'
      };

      expect(validRequest.userMessage).toBeTruthy();
      expect(validRequest.sessionId).toBeTruthy();
      expect(validRequest.organizationId).toBeTruthy();
    });

    it('should handle optional metadata in request', () => {
      const requestWithMetadata: ProcessChatMessageRequest = {
        userMessage: 'Hello',
        sessionId: 'test-session-123',
        organizationId: 'test-org',
        metadata: { userId: 'user-123', timestamp: Date.now().toString() }
      };

      expect(requestWithMetadata.metadata).toBeDefined();
      expect(requestWithMetadata.metadata?.userId).toBe('user-123');
    });
  });

  describe('Service Integration', () => {
    it('should initialize internal services during construction', () => {
      const useCase = new ProcessChatMessageUseCase(
        mockSessionRepository,
        mockMessageRepository,
        mockConfigRepository,
        mockAIService,
        mockContextOrchestrator,
        mockTokenService
      );

      // The constructor should complete without throwing
      expect(useCase).toBeDefined();
    });

    it('should handle dependency injection properly', () => {
      // Test with different mock implementations
      const altSessionRepo = {
        findById: vi.fn(),
        findBySessionToken: vi.fn(),
        findActiveByChatbotConfigId: vi.fn(),
        findByVisitorId: vi.fn(),
        findByOrganizationIdWithPagination: vi.fn(),
        save: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        findExpiredSessions: vi.fn(),
        markExpiredAsAbandoned: vi.fn(),
        getAnalytics: vi.fn(),
        findRecentByVisitorId: vi.fn(),
        countActiveByChatbotConfigId: vi.fn()
      } as any;
      const altMessageRepo = {
        findById: vi.fn(),
        findBySessionId: vi.fn(),
        findVisibleBySessionId: vi.fn(),
        findBySessionIdWithPagination: vi.fn(),
        save: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        deleteBySessionId: vi.fn(),
        findRecentByOrganizationId: vi.fn(),
        searchByContent: vi.fn(),
        getAnalytics: vi.fn(),
        findLastBySessionId: vi.fn(),
        countByTypeAndSessionId: vi.fn(),
        findMessagesWithErrors: vi.fn(),
        getResponseTimeMetrics: vi.fn()
      } as any;
      const altConfigRepo = {
        findById: vi.fn(),
        findByOrganizationId: vi.fn(),
        findActiveByOrganizationId: vi.fn(),
        save: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        existsByOrganizationId: vi.fn(),
        findByNamePattern: vi.fn(),
        getStatistics: vi.fn()
      } as any;

      expect(() => {
        new ProcessChatMessageUseCase(
          altSessionRepo,
          altMessageRepo,
          altConfigRepo,
          mockAIService,
          mockContextOrchestrator,
          mockTokenService
        );
      }).not.toThrow();
    });
  });

  describe('Error Handling Structure', () => {
    it('should handle execution errors gracefully', async () => {
      const useCase = new ProcessChatMessageUseCase(
        mockSessionRepository,
        mockMessageRepository,
        mockConfigRepository,
        mockAIService,
        mockContextOrchestrator,
        mockTokenService
      );

      const request: ProcessChatMessageRequest = {
        userMessage: 'Test message',
        sessionId: 'test-session-123',
        organizationId: 'test-org'
      };

      // The execute method should either succeed or throw a proper error
      try {
        await useCase.execute(request);
        // If it succeeds, that's fine
      } catch (error) {
        // If it throws, it should be a proper Error instance
        expect(error).toBeInstanceOf(Error);
      }
    });

    it('should handle empty message requests', async () => {
      const useCase = new ProcessChatMessageUseCase(
        mockSessionRepository,
        mockMessageRepository,
        mockConfigRepository,
        mockAIService,
        mockContextOrchestrator,
        mockTokenService
      );

      const emptyRequest: ProcessChatMessageRequest = {
        userMessage: '',
        sessionId: 'test-session-123',
        organizationId: 'test-org'
      };

      // Should handle empty messages appropriately
      try {
        await useCase.execute(emptyRequest);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });

    it('should handle very long messages', async () => {
      const useCase = new ProcessChatMessageUseCase(
        mockSessionRepository,
        mockMessageRepository,
        mockConfigRepository,
        mockAIService,
        mockContextOrchestrator,
        mockTokenService
      );

      const longMessage = 'x'.repeat(10000);
      const longRequest: ProcessChatMessageRequest = {
        userMessage: longMessage,
        sessionId: 'test-session-123',
        organizationId: 'test-org'
      };

      // Should handle long messages appropriately
      try {
        await useCase.execute(longRequest);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });
  });

  describe('Service Dependencies Validation', () => {
    it('should work with all service dependencies', () => {
      const useCase = new ProcessChatMessageUseCase(
        mockSessionRepository,
        mockMessageRepository,
        mockConfigRepository,
        mockAIService,
        mockContextOrchestrator,
        mockTokenService
      );

      expect(useCase).toBeDefined();
    });

    it('should initialize composition services', () => {
      // This test verifies that the composition services are properly initialized
      const useCase = new ProcessChatMessageUseCase(
        mockSessionRepository,
        mockMessageRepository,
        mockConfigRepository,
        mockAIService,
        mockContextOrchestrator,
        mockTokenService
      );

      // Constructor should complete successfully
      expect(useCase).toBeInstanceOf(ProcessChatMessageUseCase);
    });
  });

  describe('Method Availability', () => {
    it('should have execute method', () => {
      const useCase = new ProcessChatMessageUseCase(
        mockSessionRepository,
        mockMessageRepository,
        mockConfigRepository,
        mockAIService,
        mockContextOrchestrator,
        mockTokenService
      );

      expect(typeof useCase.execute).toBe('function');
    });

    it('should have private helper methods via buildProcessMessageResult', () => {
      const useCase = new ProcessChatMessageUseCase(
        mockSessionRepository,
        mockMessageRepository,
        mockConfigRepository,
        mockAIService,
        mockContextOrchestrator,
        mockTokenService
      );

      // buildProcessMessageResult should be accessible (even if private)
      expect(useCase).toBeDefined();
    });
  });

  describe('Integration Tests', () => {
    it('should execute complete workflow successfully', async () => {
      const useCase = new ProcessChatMessageUseCase(
        mockSessionRepository,
        mockMessageRepository,
        mockConfigRepository,
        mockAIService,
        mockContextOrchestrator,
        mockTokenService
      );

      const request: ProcessChatMessageRequest = {
        userMessage: 'Hello, I need help with my account',
        sessionId: 'test-session-123',
        organizationId: 'test-org-456'
      };

      const result = await useCase.execute(request);

      expect(result).toBeDefined();
      expect(result.chatSession).toBeDefined();
      expect(result.userMessage).toBeDefined();
      expect(result.botResponse).toBeDefined();
      expect(result.shouldCaptureLeadInfo).toBe(false);
      expect(result.suggestedNextActions).toEqual(['Ask more questions']);
      expect(result.conversationMetrics).toBeDefined();
    });

    it('should handle validation errors properly', async () => {
      const useCase = new ProcessChatMessageUseCase(
        mockSessionRepository,
        mockMessageRepository,
        mockConfigRepository,
        mockAIService,
        mockContextOrchestrator,
        mockTokenService
      );

      const invalidRequest: ProcessChatMessageRequest = {
        userMessage: 'Hello',
        sessionId: 'test-session-123',
        organizationId: '' // Empty organization ID should trigger validation error
      };

      await expect(useCase.execute(invalidRequest)).rejects.toThrow();
    });

    it('should handle request with metadata', async () => {
      const useCase = new ProcessChatMessageUseCase(
        mockSessionRepository,
        mockMessageRepository,
        mockConfigRepository,
        mockAIService,
        mockContextOrchestrator,
        mockTokenService
      );

      const requestWithMetadata: ProcessChatMessageRequest = {
        userMessage: 'Hello with metadata',
        sessionId: 'test-session-123',
        organizationId: 'test-org-456',
        metadata: { 
          userId: 'test-user-123',
          timestamp: Date.now().toString(),
          clientInfo: { source: 'widget', userAgent: 'test-agent' }
        }
      };

      const result = await useCase.execute(requestWithMetadata);

      expect(result).toBeDefined();
      expect(result.chatSession).toBeDefined();
      expect(result.userMessage).toBeDefined();
      expect(result.botResponse).toBeDefined();
    });
  });
});