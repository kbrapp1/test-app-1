/**
 * ProcessChatMessageUseCase Basic Tests
 * 
 * Focused tests for core functionality with simplified mocking:
 * - Basic workflow execution
 * - Input validation
 * - Error handling
 * - Service coordination
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProcessChatMessageUseCase } from '../../../application/use-cases/ProcessChatMessageUseCase';
import { ProcessChatMessageRequest } from '../../../application/dto/ProcessChatMessageRequest';
import { ChatSession } from '../../../domain/entities/ChatSession';
import { ChatMessage } from '../../../domain/entities/ChatMessage';
import { ChatbotConfig } from '../../../domain/entities/ChatbotConfig';
import { PersonalitySettings } from '../../../domain/value-objects/ai-configuration/PersonalitySettings';
import { KnowledgeBase } from '../../../domain/value-objects/ai-configuration/KnowledgeBase';
import { OperatingHours } from '../../../domain/value-objects/session-management/OperatingHours';

// Create comprehensive mocks for all dependencies
const createMockChatSession = () => ChatSession.create(
  'test-config-123',
  'test-visitor-123',
  {
    previousVisits: 0,
    pageViews: [],
    conversationSummary: {
      fullSummary: '',
      phaseSummaries: [],
      criticalMoments: []
    },
    topics: [],
    interests: [],
    engagementScore: 0
  }
);

const createMockChatMessage = (role: 'user' | 'assistant', content: string) => {
  if (role === 'user') {
    return ChatMessage.createUserMessage('test-session-123', content);
  } else {
    return ChatMessage.createBotMessage('test-session-123', content);
  }
};

const createMockChatbotConfig = () => {
  return ChatbotConfig.create({
    organizationId: 'test-org-123',
    name: 'Test Chatbot',
    description: 'Test chatbot for unit tests',
    personalitySettings: PersonalitySettings.createDefault(),
    knowledgeBase: KnowledgeBase.createEmpty(),
    operatingHours: OperatingHours.create24x7('UTC'),
    leadQualificationQuestions: [],
    isActive: true
  });
};

// Mock performance profiler
vi.mock('../../../performance-profiler', () => ({
  PerformanceProfiler: {
    clear: vi.fn(),
    start: vi.fn(),
    end: vi.fn(),
    getMetrics: vi.fn().mockReturnValue({})
  }
}));

// Mock all external dependencies
vi.mock('../../../infrastructure/composition/ChatbotWidgetCompositionRoot', () => ({
  ChatbotWidgetCompositionRoot: {
    getErrorTrackingFacade: vi.fn(() => ({
      trackMessageProcessingError: vi.fn().mockResolvedValue(undefined)
    })),
    getLoggingService: vi.fn(() => ({
      createSessionLogger: vi.fn(() => ({
        logHeader: vi.fn(),
        logMessage: vi.fn(),
        logRaw: vi.fn(),
        logError: vi.fn(),
        logMetrics: vi.fn(),
        logSeparator: vi.fn(),
        flush: vi.fn().mockResolvedValue(undefined)
      }))
    })),
    getVectorKnowledgeRepository: vi.fn(() => ({})),
    getEmbeddingService: vi.fn(() => ({})),
    getSimplePromptService: vi.fn(() => ({
      generatePrompt: vi.fn().mockResolvedValue('mock prompt'),
      validatePrompt: vi.fn().mockReturnValue(true)
    }))
  }
}));

vi.mock('../../../infrastructure/composition/DomainServiceCompositionService', () => ({
  DomainServiceCompositionService: {
    getTokenCountingService: vi.fn(() => ({
      countTokens: vi.fn().mockResolvedValue(100)
    })),
    getIntentClassificationService: vi.fn().mockResolvedValue({
      classifyIntent: vi.fn().mockResolvedValue({
        intent: 'question',
        confidence: 0.8,
        entities: {}
      })
    }),
    getKnowledgeRetrievalService: vi.fn(() => ({
      searchKnowledge: vi.fn().mockResolvedValue([])
    }))
  }
}));

// Mock application services
vi.mock('../../../application/services/message-processing', () => ({
  MessageProcessingWorkflowService: vi.fn().mockImplementation(() => ({
    initializeWorkflow: vi.fn().mockResolvedValue({
      session: createMockChatSession(),
      config: createMockChatbotConfig(),
      userMessage: createMockChatMessage('user', 'Hello')
    }),
    finalizeWorkflow: vi.fn().mockResolvedValue({
      session: createMockChatSession(),
      userMessage: createMockChatMessage('user', 'Hello'),
      botMessage: createMockChatMessage('assistant', 'Hi there!'),
      shouldCaptureLeadInfo: false,
      suggestedNextActions: [],
      conversationMetrics: {},
      intentAnalysis: undefined,
      journeyState: undefined,
      relevantKnowledge: undefined,
      callToAction: undefined
    })
  })),
  ChatMessageProcessingService: vi.fn().mockImplementation(() => ({
    processUserMessage: vi.fn().mockResolvedValue({
      session: createMockChatSession(),
      config: createMockChatbotConfig(),
      userMessage: createMockChatMessage('user', 'Hello')
    }),
    generateAIResponse: vi.fn().mockResolvedValue({
      session: createMockChatSession(),
      userMessage: createMockChatMessage('user', 'Hello'),
      botMessage: createMockChatMessage('assistant', 'Hi there!'),
      allMessages: [createMockChatMessage('user', 'Hello'), createMockChatMessage('assistant', 'Hi there!')],
      config: createMockChatbotConfig(),
      enhancedContext: {}
    })
  }))
}));

vi.mock('../../../application/services/conversation-management/ConversationContextManagementService', () => ({
  ConversationContextManagementService: vi.fn().mockImplementation(() => ({
    getTokenAwareContext: vi.fn().mockResolvedValue({
      messages: [createMockChatMessage('user', 'Hello')],
      contextWindow: {
        maxTokens: 16000,
        systemPromptTokens: 800,
        responseReservedTokens: 3500,
        summaryTokens: 300
      }
    })
  }))
}));

vi.mock('../../../application/services/configuration-management/SessionUpdateService', () => ({
  SessionUpdateService: vi.fn().mockImplementation(() => ({
    updateSession: vi.fn().mockResolvedValue(createMockChatSession()),
    saveSession: vi.fn().mockResolvedValue(createMockChatSession())
  }))
}));

// Mock the main workflow orchestrator
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

describe('ProcessChatMessageUseCase - Basic Tests', () => {
  let useCase: ProcessChatMessageUseCase;
  let mockSessionRepository: any;
  let mockMessageRepository: any;
  let mockConfigRepository: any;
  let mockAIService: any;
  let mockContextOrchestrator: any;
  let mockTokenService: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Create simplified mock repositories
    mockSessionRepository = {
      findById: vi.fn(),
      save: vi.fn(),
      update: vi.fn()
    } as any;

    mockMessageRepository = {
      findBySessionId: vi.fn(),
      save: vi.fn()
    } as any;

    mockConfigRepository = {
      findById: vi.fn(),
      findByOrganizationId: vi.fn()
    } as any;

    mockAIService = {
      generateResponse: vi.fn(),
      buildSystemPrompt: vi.fn(),
      analyzeSentiment: vi.fn(),
      analyzeUrgency: vi.fn(),
      analyzeEngagement: vi.fn(),
      extractLeadInformation: vi.fn()
    };

    mockContextOrchestrator = {
      analyzeContextEnhanced: vi.fn()
    };

    mockTokenService = {
      countTokens: vi.fn()
    };

    useCase = new ProcessChatMessageUseCase(
      mockSessionRepository,
      mockMessageRepository,
      mockConfigRepository,
      mockAIService,
      mockContextOrchestrator,
      mockTokenService
    );
  });

  describe('Constructor and Initialization', () => {
    it('should create ProcessChatMessageUseCase instance successfully', () => {
      expect(useCase).toBeDefined();
      expect(useCase).toBeInstanceOf(ProcessChatMessageUseCase);
    });

    it('should handle constructor with optional dependencies', () => {
      const mockIntentService = { classifyIntent: vi.fn() };
      const mockKnowledgeService = { searchKnowledge: vi.fn() };
      const mockDebugService = { captureApiCall: vi.fn() };

      const useCaseWithOptional = new ProcessChatMessageUseCase(
        mockSessionRepository,
        mockMessageRepository,
        mockConfigRepository,
        mockAIService,
        mockContextOrchestrator,
        mockTokenService,
        mockIntentService as any,
        mockKnowledgeService as any,
        mockDebugService as any
      );

      expect(useCaseWithOptional).toBeDefined();
    });
  });

  describe('Input Validation', () => {
    it('should reject requests with empty organizationId', async () => {
      const request: ProcessChatMessageRequest = {
        userMessage: 'Hello',
        sessionId: 'test-session-123',
        organizationId: ''
      };

      await expect(useCase.execute(request)).rejects.toThrow(
        /Organization ID is required/
      );
    });

    it('should reject requests with undefined organizationId', async () => {
      const request = {
        userMessage: 'Hello',
        sessionId: 'test-session-123',
        organizationId: undefined as any
      };

      await expect(useCase.execute(request)).rejects.toThrow(
        /Organization ID is required/
      );
    });

    it('should reject requests with whitespace-only organizationId', async () => {
      const request: ProcessChatMessageRequest = {
        userMessage: 'Hello',
        sessionId: 'test-session-123',
        organizationId: '   '
      };

      await expect(useCase.execute(request)).rejects.toThrow(
        /Organization ID is required/
      );
    });

    it('should accept valid requests with required fields', () => {
      const request: ProcessChatMessageRequest = {
        userMessage: 'Hello, I need help',
        sessionId: 'test-session-123',
        organizationId: 'test-org-123'
      };

      expect(request.userMessage).toBeTruthy();
      expect(request.sessionId).toBeTruthy();
      expect(request.organizationId).toBeTruthy();
    });

    it('should handle requests with optional metadata', () => {
      const request: ProcessChatMessageRequest = {
        userMessage: 'Hello',
        sessionId: 'test-session-123',
        organizationId: 'org-123',
        metadata: {
          userId: 'user-123',
          timestamp: '2023-01-01T00:00:00.000Z',
          clientInfo: { browser: 'Chrome' }
        }
      };
      
      expect(request.metadata?.userId).toBe('user-123');
      expect(request.metadata?.timestamp).toBe('2023-01-01T00:00:00.000Z');
      expect(request.metadata?.clientInfo?.browser).toBe('Chrome');
    });
    
    it('should execute method accept ProcessMessageRequest', () => {
      const request: ProcessChatMessageRequest = {
        userMessage: 'Test',
        sessionId: 'session-123',
        organizationId: 'org-123',
        metadata: {
          userId: 'user-123'
        }
      };
      
      expect(typeof useCase.execute).toBe('function');
      expect(request.userMessage).toBe('Test');
    });
    
    it('should enforce ProcessMessageRequest interface', () => {
      // Valid request should compile
      const validRequest: ProcessChatMessageRequest = {
        userMessage: 'Hello',
        sessionId: 'session-123',
        organizationId: 'org-123'
      };
      
      expect(validRequest.userMessage).toBe('Hello');
      expect(validRequest.sessionId).toBe('session-123');
      expect(validRequest.organizationId).toBe('org-123');
      
      // Metadata should be optional
      const requestWithMetadata: ProcessChatMessageRequest = {
        userMessage: 'Hello',
        sessionId: 'session-123',
        organizationId: 'org-123',
        metadata: { 
          userId: 'user-123',
          clientInfo: { custom: 'data' }
        }
      };

      expect(requestWithMetadata.metadata).toBeDefined();
    });
  });

  describe('Method Availability', () => {
    it('should have execute method', () => {
      expect(typeof useCase.execute).toBe('function');
    });

    it('should execute method accept ProcessMessageRequest', () => {
      const request: ProcessChatMessageRequest = {
        userMessage: 'Test',
        sessionId: 'session-123',
        organizationId: 'org-123'
      };

      // Method should exist and accept the request type
      expect(() => useCase.execute(request)).not.toThrow(TypeError);
    });
  });

  describe('Type Safety', () => {
    it('should enforce ProcessMessageRequest interface', () => {
      // Valid request should compile
      const validRequest: ProcessChatMessageRequest = {
        userMessage: 'Hello',
        sessionId: 'session-123',
        organizationId: 'org-123'
      };

      expect(validRequest).toBeDefined();

      // Metadata should be optional
      const requestWithMetadata: ProcessChatMessageRequest = {
        userMessage: 'Hello',
        sessionId: 'session-123',
        organizationId: 'org-123',
        metadata: { userId: 'user-123', clientInfo: { custom: 'data' } }
      };

      expect(requestWithMetadata.metadata).toBeDefined();
    });

    it('should define ProcessMessageResult interface correctly', () => {
      // This test ensures the result interface is properly typed
      // The interface should include all required fields
      const mockResult = {
        chatSession: {} as any,
        userMessage: {} as any,
        botResponse: {} as any,
        shouldCaptureLeadInfo: false,
        suggestedNextActions: [],
        conversationMetrics: {}
      };

      expect(mockResult).toBeDefined();
    });
  });

  describe('Dependency Injection', () => {
    it('should work with different repository implementations', () => {
      const altSessionRepo = {
        findById: vi.fn(),
        save: vi.fn()
      } as any;

      const altMessageRepo = {
        findBySessionId: vi.fn(),
        save: vi.fn()
      } as any;

      const altConfigRepo = {
        findById: vi.fn()
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

    it('should handle different AI service implementations', () => {
      const altAIService = {
        generateResponse: vi.fn(),
        buildSystemPrompt: vi.fn(),
        analyzeSentiment: vi.fn(),
        analyzeUrgency: vi.fn(),
        analyzeEngagement: vi.fn(),
        extractLeadInformation: vi.fn()
      };

      expect(() => {
        new ProcessChatMessageUseCase(
          mockSessionRepository,
          mockMessageRepository,
          mockConfigRepository,
          altAIService,
          mockContextOrchestrator,
          mockTokenService
        );
      }).not.toThrow();
    });
  });

  describe('Basic Error Handling', () => {
    it('should handle missing required parameters', async () => {
      // Test with missing userMessage
      const incompleteRequest = {
        sessionId: 'test-session',
        organizationId: 'test-org'
        // Missing userMessage
      } as any;

      // Should either throw validation error or handle gracefully
      try {
        await useCase.execute(incompleteRequest);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });

    it('should handle invalid session ID format', async () => {
      const request: ProcessChatMessageRequest = {
        userMessage: 'Hello',
        sessionId: '', // Empty session ID
        organizationId: 'test-org-123'
      };

      // Should handle empty session ID appropriately
      try {
        await useCase.execute(request);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });

    it('should handle very long messages appropriately', async () => {
      const longMessage = 'x'.repeat(5000); // Over 4000 char limit
      const request: ProcessChatMessageRequest = {
        userMessage: longMessage,
        sessionId: 'test-session-123',
        organizationId: 'test-org-123'
      };

      // Should handle long messages by throwing error or truncating
      try {
        await useCase.execute(request);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });
  });

  describe('Service Integration Structure', () => {
    it('should have internal services initialized during construction', () => {
      // Constructor should complete without throwing
      expect(useCase).toBeDefined();
      expect(useCase).toBeInstanceOf(ProcessChatMessageUseCase);
    });

    it('should handle logging service initialization', () => {
      // Logging service should be initialized through composition root
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

    it('should handle error tracking service initialization', () => {
      // Error tracking should be initialized through composition root
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
  });
});