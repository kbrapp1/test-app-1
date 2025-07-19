/**
 * ErrorTrackingFacade Tests
 * 
 * Comprehensive tests for the error tracking facade that coordinates
 * error categorization, persistence, and analytics services.
 * Tests focus on business logic, error handling, and service coordination.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ErrorTrackingFacade, type ChatbotErrorContext } from '../ErrorTrackingFacade';
import { type ErrorPersistenceData } from '../../../infrastructure/persistence/supabase/ErrorPersistenceService';
import { type ErrorSummary } from '../ErrorAnalyticsService';
import { ErrorAnalyticsQueryService } from '../ErrorAnalyticsQueryService';

describe('ErrorTrackingFacade', () => {
  let facade: ErrorTrackingFacade;
  let mockCategorizationService: {
    categorizeError: ReturnType<typeof vi.fn>;
    shouldPersistError: ReturnType<typeof vi.fn>;
    sanitizeErrorContext: ReturnType<typeof vi.fn>;
  };
  let mockPersistenceService: {
    persistError: ReturnType<typeof vi.fn>;
  };
  let mockAnalyticsQueryService: ErrorAnalyticsQueryService;

  const mockContext: ChatbotErrorContext = {
    organizationId: 'org-123',
    sessionId: 'session-456',
    userId: 'user-789',
    conversationId: 'conv-abc',
    messageId: 'msg-def',
    modelName: 'gpt-4o',
    tokenUsage: {
      promptTokens: 100,
      completionTokens: 50,
      totalCostCents: 25
    },
    performanceMetrics: {
      responseTime: 1500,
      memoryUsage: 256,
      cpuUsage: 45
    },
    metadata: {
      userAgent: 'test-agent',
      ipAddress: '192.168.1.1'
    }
  };

  const mockCategorization = {
    severity: 'high' as const,
    category: 'ai_processing',
    shouldAlert: true,
    retryable: false
  };

  const mockSanitizedContext = {
    userAgent: 'test-agent',
    sanitized: true
  };

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Create mock instances
    mockCategorizationService = {
      categorizeError: vi.fn().mockReturnValue(mockCategorization),
      shouldPersistError: vi.fn().mockReturnValue(true),
      sanitizeErrorContext: vi.fn().mockReturnValue(mockSanitizedContext)
    };

    mockPersistenceService = {
      persistError: vi.fn().mockResolvedValue(undefined)
    };

    // Create mock analytics query service
    const mockAnalyticsService = {
      getErrorSummary: vi.fn().mockResolvedValue({
        totalErrors: 10,
        errorsByCode: { MESSAGE_PROCESSING_ERROR: 5, AI_ERROR: 5 },
        errorsByCategory: { ai_processing: 5, validation: 5 },
        errorsBySeverity: { high: 3, medium: 4, low: 3 },
        errorsByTable: { chatbot_errors: 8, system_errors: 2 },
        recentErrors: []
      } as ErrorSummary),
      getErrorsBySession: vi.fn().mockResolvedValue({
        totalErrors: 2,
        errorsByCode: {},
        errorsByCategory: {},
        errorsBySeverity: {},
        errorsByTable: {},
        recentErrors: []
      } as ErrorSummary),
      getErrorsByUser: vi.fn().mockResolvedValue({
        totalErrors: 1,
        errorsByCode: {},
        errorsByCategory: {},
        errorsBySeverity: {},
        errorsByTable: {},
        recentErrors: []
      } as ErrorSummary)
    };

    mockAnalyticsQueryService = new ErrorAnalyticsQueryService(mockAnalyticsService as never);

    // Create facade instance
    facade = new ErrorTrackingFacade(
      mockCategorizationService as never,
      mockPersistenceService as never,
      mockAnalyticsQueryService
    );

    // Mock console methods to avoid noise in tests
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'info').mockImplementation(() => {});
  });

  describe('Error Tracking Workflow', () => {
    it('should coordinate error categorization, persistence, and logging', async () => {
      const reason = 'Failed to process user message';
      
      await facade.trackMessageProcessingError(reason, mockContext);

      // Verify categorization service called
      expect(mockCategorizationService.categorizeError).toHaveBeenCalledWith(
        'MESSAGE_PROCESSING_FAILED'
      );

      // Verify persistence decision checked
      expect(mockCategorizationService.shouldPersistError).toHaveBeenCalledWith(
        'MESSAGE_PROCESSING_FAILED',
        mockContext.metadata
      );

      // Verify context sanitization
      expect(mockCategorizationService.sanitizeErrorContext).toHaveBeenCalledWith(
        mockContext.metadata
      );

      // Verify error persistence
      expect(mockPersistenceService.persistError).toHaveBeenCalledWith(
        expect.objectContaining({
          errorCode: 'MESSAGE_PROCESSING_FAILED',
          errorMessage: expect.stringContaining(reason),
          errorContext: expect.objectContaining(mockSanitizedContext),
          timestamp: expect.any(Date),
          stack: expect.any(String)
        }),
        mockCategorization,
        expect.objectContaining({
          sessionId: mockContext.sessionId,
          userId: mockContext.userId,
          organizationId: mockContext.organizationId,
          conversationId: mockContext.conversationId,
          messageId: mockContext.messageId,
          modelName: mockContext.modelName,
          tokenUsage: mockContext.tokenUsage,
          performanceMetrics: mockContext.performanceMetrics,
          metadata: mockSanitizedContext
        })
      );
    });

    it('should skip persistence when categorization service indicates not to persist', async () => {
      mockCategorizationService.shouldPersistError.mockReturnValue(false);

      await facade.trackMessageProcessingError('Test error', mockContext);

      expect(mockCategorizationService.shouldPersistError).toHaveBeenCalled();
      expect(mockPersistenceService.persistError).not.toHaveBeenCalled();
    });

    it('should handle missing context gracefully', async () => {
      const minimalContext: ChatbotErrorContext = {
        organizationId: 'org-123'
      };

      await facade.trackMessageProcessingError('Test error', minimalContext);

      expect(mockCategorizationService.sanitizeErrorContext).toHaveBeenCalledWith({});
      expect(mockPersistenceService.persistError).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(Object),
        expect.objectContaining({
          organizationId: 'org-123',
          sessionId: undefined,
          userId: undefined,
          metadata: mockSanitizedContext
        })
      );
    });

    it('should handle persistence service errors gracefully', async () => {
      const persistenceError = new Error('Database connection failed');
      mockPersistenceService.persistError.mockRejectedValue(persistenceError);

      await expect(
        facade.trackMessageProcessingError('Test error', mockContext)
      ).resolves.not.toThrow();

      expect(console.error).toHaveBeenCalledWith('Failed to track error:', persistenceError);
      expect(console.error).toHaveBeenCalledWith('Original error:', expect.objectContaining({
        code: 'MESSAGE_PROCESSING_FAILED',
        message: expect.stringContaining('Test error'),
        context: mockContext
      }));
    });
  });

  describe('Message Processing Errors', () => {
    it('should track message processing errors with correct error type', async () => {
      await facade.trackMessageProcessingError('Processing failed', mockContext);

      expect(mockCategorizationService.categorizeError).toHaveBeenCalledWith(
        'MESSAGE_PROCESSING_FAILED'
      );
    });

    it('should track conversation flow errors with flow step context', async () => {
      await facade.trackConversationFlowError('lead_qualification', mockContext);

      expect(mockCategorizationService.categorizeError).toHaveBeenCalledWith(
        'CONVERSATION_FLOW_ERROR'
      );
    });
  });

  describe('AI Processing Errors', () => {
    it('should track AI response generation errors', async () => {
      const modelError = 'OpenAI API timeout';
      
      await facade.trackAIResponseGenerationError(modelError, mockContext);

      expect(mockCategorizationService.categorizeError).toHaveBeenCalledWith(
        'AI_RESPONSE_GENERATION_FAILED'
      );
    });

    it('should track token limit exceeded errors with usage details', async () => {
      const limit = 4000;
      const attempted = 4500;
      
      await facade.trackTokenLimitExceededError(limit, attempted, mockContext);

      expect(mockCategorizationService.categorizeError).toHaveBeenCalledWith(
        'TOKEN_LIMIT_EXCEEDED'
      );
    });
  });

  describe('Knowledge Base Errors', () => {
    it('should track knowledge retrieval errors with query context', async () => {
      const query = 'user search query';
      
      await facade.trackKnowledgeRetrievalError(query, mockContext);

      expect(mockCategorizationService.categorizeError).toHaveBeenCalledWith(
        'KNOWLEDGE_RETRIEVAL_FAILED'
      );
    });
  });

  describe('Lead Management Errors', () => {
    it('should track lead capture errors with capture type', async () => {
      const captureType = 'email';
      
      await facade.trackLeadCaptureError(captureType, mockContext);

      expect(mockCategorizationService.categorizeError).toHaveBeenCalledWith(
        'LEAD_CAPTURE_FAILED'
      );
    });
  });

  describe('External Service Errors', () => {
    it('should track external service errors with service name and operation', async () => {
      const serviceName = 'openai';
      const operation = 'completion';
      
      await facade.trackExternalServiceError(serviceName, operation, mockContext);

      expect(mockCategorizationService.categorizeError).toHaveBeenCalledWith(
        'EXTERNAL_SERVICE_ERROR'
      );
    });

    it('should track API rate limit errors with provider', async () => {
      const apiProvider = 'openai';
      
      await facade.trackAPIRateLimitError(apiProvider, mockContext);

      expect(mockCategorizationService.categorizeError).toHaveBeenCalledWith(
        'API_RATE_LIMIT_EXCEEDED'
      );
    });
  });

  describe('Analytics Methods', () => {
    it('should get error summary with organization and time range', async () => {
      const organizationId = 'org-123';
      const timeRange = '24h' as const;

      const result = await facade.getErrorSummary(organizationId, timeRange);

      // The analytics service should have been called through the query service
      expect(result).toBeDefined();
      expect(result).toEqual(expect.objectContaining({
        totalErrors: 10,
        errorsByCategory: { ai_processing: 5, validation: 5 },
        errorsBySeverity: { high: 3, medium: 4, low: 3 }
      }));
    });

    it('should get errors by session', async () => {
      const sessionId = 'session-123';
      const organizationId = 'org-123';

      const result = await facade.getErrorsBySession(sessionId, organizationId);

      // The analytics service should have been called through the query service
      expect(result).toBeDefined();
      expect(result).toEqual(expect.objectContaining({
        totalErrors: 2
      }));
    });

    it('should get errors by user', async () => {
      const userId = 'user-123';
      const organizationId = 'org-123';

      const result = await facade.getErrorsByUser(userId, organizationId);

      // The analytics service should have been called through the query service  
      expect(result).toBeDefined();
      expect(result).toEqual(expect.objectContaining({
        totalErrors: 1
      }));
    });
  });

  describe('Context Sanitization', () => {
    it('should sanitize error context before persistence', async () => {
      const contextWithSensitiveData: ChatbotErrorContext = {
        organizationId: 'org-123',
        metadata: {
          password: 'secret123',
          apiKey: 'sk-123456',
          userAgent: 'browser'
        }
      };

      await facade.trackMessageProcessingError('Test error', contextWithSensitiveData);

      expect(mockCategorizationService.sanitizeErrorContext).toHaveBeenCalledWith(
        contextWithSensitiveData.metadata
      );
    });

    it('should handle undefined metadata gracefully', async () => {
      const contextWithoutMetadata: ChatbotErrorContext = {
        organizationId: 'org-123'
      };

      await facade.trackMessageProcessingError('Test error', contextWithoutMetadata);

      expect(mockCategorizationService.sanitizeErrorContext).toHaveBeenCalledWith({});
    });
  });

  describe('Error Persistence Data Structure', () => {
    it('should construct persistence data with correct structure', async () => {
      await facade.trackMessageProcessingError('Test error message', mockContext);

      expect(mockPersistenceService.persistError).toHaveBeenCalledWith(
        expect.objectContaining({
          errorCode: 'MESSAGE_PROCESSING_FAILED',
          errorMessage: 'Message processing failed: Test error message',
          errorContext: expect.objectContaining(mockSanitizedContext),
          timestamp: expect.any(Date),
          stack: expect.any(String)
        }),
        mockCategorization,
        expect.objectContaining({
          sessionId: 'session-456',
          userId: 'user-789',
          organizationId: 'org-123',
          conversationId: 'conv-abc',
          messageId: 'msg-def',
          modelName: 'gpt-4o',
          tokenUsage: mockContext.tokenUsage,
          performanceMetrics: mockContext.performanceMetrics,
          metadata: mockSanitizedContext
        })
      );
    });

    it('should merge error context with sanitized context', async () => {
      await facade.trackMessageProcessingError('Test error', mockContext);

      const persistenceCall = (mockPersistenceService.persistError as { mock: { calls: unknown[][] } }).mock.calls[0];
      const persistenceData = persistenceCall[0] as ErrorPersistenceData;

      expect(persistenceData.errorContext).toEqual(
        expect.objectContaining(mockSanitizedContext)
      );
    });

    it('should use current timestamp when error lacks timestamp', async () => {
      const beforeTest = new Date();
      
      await facade.trackMessageProcessingError('Test error', mockContext);
      
      const afterTest = new Date();
      const persistenceCall = (mockPersistenceService.persistError as { mock: { calls: unknown[][] } }).mock.calls[0];
      const persistenceData = persistenceCall[0] as ErrorPersistenceData;

      expect(persistenceData.timestamp.getTime()).toBeGreaterThanOrEqual(beforeTest.getTime());
      expect(persistenceData.timestamp.getTime()).toBeLessThanOrEqual(afterTest.getTime());
    });
  });

  describe('Error Logging Behavior', () => {
    it('should log high severity errors to console.error', async () => {
      mockCategorizationService.categorizeError.mockReturnValue({
        ...mockCategorization,
        severity: 'high'
      });

      await facade.trackMessageProcessingError('Critical error', mockContext);

      expect(console.error).toHaveBeenCalledWith(
        'HIGH CHATBOT ERROR:',
        expect.objectContaining({
          errorCode: 'MESSAGE_PROCESSING_FAILED',
          severity: 'high'
        })
      );
    });

    it('should log medium severity errors to console.warn', async () => {
      mockCategorizationService.categorizeError.mockReturnValue({
        ...mockCategorization,
        severity: 'medium'
      });

      await facade.trackMessageProcessingError('Warning error', mockContext);

      expect(console.warn).toHaveBeenCalledWith(
        'MEDIUM CHATBOT ERROR:',
        expect.objectContaining({
          errorCode: 'MESSAGE_PROCESSING_FAILED',
          severity: 'medium'
        })
      );
    });

    it('should log low severity errors to console.log', async () => {
      mockCategorizationService.categorizeError.mockReturnValue({
        ...mockCategorization,
        severity: 'low'
      });

      await facade.trackMessageProcessingError('Info error', mockContext);

      expect(console.info).toHaveBeenCalledWith(
        'LOW CHATBOT ERROR:',
        expect.objectContaining({
          errorCode: 'MESSAGE_PROCESSING_FAILED',
          severity: 'low'
        })
      );
    });
  });
});