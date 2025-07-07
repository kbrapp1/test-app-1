/**
 * InitializeChatSessionUseCase Unit Tests
 * 
 * Tests the application layer use case for initializing chat sessions.
 * Covers orchestration logic, validation, error handling, and domain event publishing.
 */

import { describe, it, expect, beforeEach, vi, MockedFunction } from 'vitest';
import { InitializeChatSessionUseCase, InitializeSessionRequest } from '../../../application/use-cases/InitializeChatSessionUseCase';
import { ChatSession } from '../../../domain/entities/ChatSession';
import { ChatbotConfig } from '../../../domain/entities/ChatbotConfig';
import { BusinessRuleViolationError, ResourceNotFoundError } from '../../../domain/errors/ChatbotWidgetDomainErrors';
import { SessionInitializedEvent } from '../../../domain/events/SessionInitializedEvent';
import { 
  MockChatSessionRepository, 
  MockChatbotConfigRepository, 
  MockKnowledgeRetrievalService 
} from '../../test-utils/MockServices';
import { ChatbotTestDataFactory } from '../../test-utils/ChatbotTestDataFactory';

describe('InitializeChatSessionUseCase', () => {
  let useCase: InitializeChatSessionUseCase;
  let mockSessionRepository: MockChatSessionRepository;
  let mockConfigRepository: MockChatbotConfigRepository;
  let mockKnowledgeService: MockKnowledgeRetrievalService;
  let validChatbotConfig: ChatbotConfig;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Create mock repositories and services
    mockSessionRepository = new MockChatSessionRepository();
    mockConfigRepository = new MockChatbotConfigRepository();
    mockKnowledgeService = new MockKnowledgeRetrievalService();

    // Create valid test data
    validChatbotConfig = ChatbotTestDataFactory.createValidConfig({
      id: 'config-123',
      name: 'Test Chatbot',
      organizationId: 'org-456',
      isActive: true
    });

    // Add config to mock repository
    mockConfigRepository.addConfig(validChatbotConfig);

    // Create use case instance
    useCase = new InitializeChatSessionUseCase(
      mockSessionRepository,
      mockConfigRepository,
      mockKnowledgeService
    );

    // Mock console.warn to avoid noise in tests
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  describe('Successful Session Initialization', () => {
    it('should initialize chat session with valid configuration', async () => {
      const request: InitializeSessionRequest = {
        chatbotConfigId: 'config-123',
        visitorId: 'visitor-789',
        initialContext: { pageUrl: 'https://example.com' },
        warmKnowledgeCache: true
      };

      const result = await useCase.execute(request);

      expect(result.session).toBeDefined();
      expect(result.session.chatbotConfigId).toBe('config-123');
      expect(result.session.visitorId).toBe('visitor-789');
      expect(result.chatbotConfig).toBe(validChatbotConfig);
      expect(result.cacheWarmed).toBe(true);
      expect(result.cacheWarmingTimeMs).toBeGreaterThanOrEqual(0);

      // Verify session was saved
      expect(mockSessionRepository.getAll()).toHaveLength(1);
      const savedSession = mockSessionRepository.getAll()[0];
      expect(savedSession.id).toBe(result.session.id);
    });

    it('should generate visitor ID when not provided', async () => {
      const request: InitializeSessionRequest = {
        chatbotConfigId: 'config-123',
        // visitorId not provided
        warmKnowledgeCache: false
      };

      const result = await useCase.execute(request);

      expect(result.session.visitorId).toMatch(/^visitor_\d+_[a-z0-9]+$/);
      expect(result.cacheWarmed).toBe(false);
      expect(result.cacheWarmingTimeMs).toBeUndefined();
    });

    it('should initialize with minimal required parameters', async () => {
      const request: InitializeSessionRequest = {
        chatbotConfigId: 'config-123'
      };

      const result = await useCase.execute(request);

      expect(result.session).toBeDefined();
      expect(result.session.chatbotConfigId).toBe('config-123');
      expect(result.session.visitorId).toMatch(/^visitor_\d+_[a-z0-9]+$/);
      expect(result.chatbotConfig).toBe(validChatbotConfig);
      expect(result.cacheWarmed).toBe(true); // Default is true
    });

    it('should handle cache warming disabled', async () => {
      const request: InitializeSessionRequest = {
        chatbotConfigId: 'config-123',
        visitorId: 'visitor-123',
        warmKnowledgeCache: false
      };

      const result = await useCase.execute(request);

      expect(result.cacheWarmed).toBe(false);
      expect(result.cacheWarmingTimeMs).toBeUndefined();
      expect(result.session).toBeDefined();
    });
  });

  describe('Cache Warming', () => {
    it('should successfully warm knowledge cache', async () => {
      // Mock successful cache warming
      const mockWarmCache = vi.fn().mockResolvedValue(undefined);
      (mockKnowledgeService as any).warmCache = mockWarmCache;
      (mockKnowledgeService as any).isVectorCacheReady = vi.fn().mockReturnValue(true);

      const request: InitializeSessionRequest = {
        chatbotConfigId: 'config-123',
        warmKnowledgeCache: true
      };

      const result = await useCase.execute(request);

      expect(result.cacheWarmed).toBe(true);
      expect(result.cacheWarmingTimeMs).toBeGreaterThanOrEqual(0);
      expect(mockWarmCache).toHaveBeenCalled();
    });

    it('should handle cache warming failure gracefully', async () => {
      // Mock cache warming failure
      const mockWarmCache = vi.fn().mockRejectedValue(new Error('Cache warming failed'));
      (mockKnowledgeService as any).warmCache = mockWarmCache;

      const request: InitializeSessionRequest = {
        chatbotConfigId: 'config-123',
        warmKnowledgeCache: true
      };

      const result = await useCase.execute(request);

      // Session should still be created successfully
      expect(result.session).toBeDefined();
      expect(result.cacheWarmed).toBe(false);
      expect(result.cacheWarmingTimeMs).toBeGreaterThanOrEqual(0);
      
      // Should have logged warning
      expect(console.warn).toHaveBeenCalledWith(
        'Knowledge cache warming failed:',
        expect.objectContaining({
          chatbotConfigId: 'config-123',
          error: 'Cache warming failed'
        })
      );
    });

    it('should trigger vector cache initialization on first search', async () => {
      // Mock vector cache not ready
      (mockKnowledgeService as any).isVectorCacheReady = vi.fn().mockReturnValue(false);
      
      const mockSearchKnowledge = vi.spyOn(mockKnowledgeService, 'searchKnowledge')
        .mockRejectedValue(new Error('Expected initialization error'));

      const request: InitializeSessionRequest = {
        chatbotConfigId: 'config-123',
        warmKnowledgeCache: true
      };

      const result = await useCase.execute(request);

      expect(mockSearchKnowledge).toHaveBeenCalledWith({
        userQuery: 'initialization dummy query',
        sharedLogFile: expect.stringMatching(/cache-warming-.*\.log/),
        maxResults: 1,
        minRelevanceScore: 0.1
      });
    });
  });

  describe('Validation and Error Handling', () => {
    it('should throw BusinessRuleViolationError for empty chatbot config ID', async () => {
      const request: InitializeSessionRequest = {
        chatbotConfigId: ''
      };

      await expect(useCase.execute(request)).rejects.toThrow(BusinessRuleViolationError);
      await expect(useCase.execute(request)).rejects.toThrow('Chatbot configuration ID is required');
    });

    it('should throw BusinessRuleViolationError for whitespace-only chatbot config ID', async () => {
      const request: InitializeSessionRequest = {
        chatbotConfigId: '   '
      };

      await expect(useCase.execute(request)).rejects.toThrow(BusinessRuleViolationError);
    });

    it('should throw ResourceNotFoundError for non-existent chatbot config', async () => {
      const request: InitializeSessionRequest = {
        chatbotConfigId: 'non-existent-config'
      };

      await expect(useCase.execute(request)).rejects.toThrow(ResourceNotFoundError);
      
      try {
        await useCase.execute(request);
      } catch (error) {
        expect(error).toBeInstanceOf(ResourceNotFoundError);
        const resourceError = error as ResourceNotFoundError;
        expect(resourceError.context.resourceType).toBe('ChatbotConfig');
        expect(resourceError.context.identifier).toBe('non-existent-config');
      }
    });

    it('should throw BusinessRuleViolationError for inactive chatbot config', async () => {
      // Create inactive config
      const inactiveConfig = ChatbotTestDataFactory.createValidConfig({
        id: 'inactive-config',
        name: 'Inactive Chatbot',
        organizationId: 'org-456',
        isActive: false
      });
      mockConfigRepository.addConfig(inactiveConfig);

      const request: InitializeSessionRequest = {
        chatbotConfigId: 'inactive-config'
      };

      await expect(useCase.execute(request)).rejects.toThrow(BusinessRuleViolationError);
      await expect(useCase.execute(request)).rejects.toThrow(
        'Cannot create session for inactive chatbot configuration'
      );
    });

    it('should handle repository errors gracefully', async () => {
      // Make repository throw error
      mockConfigRepository.setFailure(true);

      const request: InitializeSessionRequest = {
        chatbotConfigId: 'config-123'
      };

      await expect(useCase.execute(request)).rejects.toThrow('Mock repository failure');
    });

    it('should handle session save errors', async () => {
      // Make session repository fail during save
      mockSessionRepository.setFailure(true);

      const request: InitializeSessionRequest = {
        chatbotConfigId: 'config-123'
      };

      await expect(useCase.execute(request)).rejects.toThrow('Mock repository failure');
    });
  });

  describe('Domain Event Publishing', () => {
    it('should publish SessionInitializedEvent', async () => {
      // Spy on the private method to verify event handling
      const handleEventSpy = vi.spyOn(useCase as any, 'handleSessionInitializedEvent');

      const request: InitializeSessionRequest = {
        chatbotConfigId: 'config-123',
        visitorId: 'visitor-789'
      };

      const result = await useCase.execute(request);

      expect(handleEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          sessionId: result.session.id,
          chatbotConfigId: 'config-123',
          visitorId: 'visitor-789',
          context: expect.objectContaining({
            configName: 'Test Chatbot',
            cacheWarmed: true,
            timestamp: expect.any(Date)
          })
        })
      );
    });

    it('should include cache warming status in domain event', async () => {
      const handleEventSpy = vi.spyOn(useCase as any, 'handleSessionInitializedEvent');

      const request: InitializeSessionRequest = {
        chatbotConfigId: 'config-123',
        warmKnowledgeCache: false
      };

      await useCase.execute(request);

      expect(handleEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          context: expect.objectContaining({
            cacheWarmed: false
          })
        })
      );
    });
  });

  describe('Business Logic Invariants', () => {
    it('should maintain session-config relationship', async () => {
      const request: InitializeSessionRequest = {
        chatbotConfigId: 'config-123',
        visitorId: 'visitor-789'
      };

      const result = await useCase.execute(request);

      expect(result.session.chatbotConfigId).toBe(result.chatbotConfig.id);
      // ChatSession doesn't directly expose organizationId, but it's linked via chatbotConfig
    });

    it('should generate unique session IDs', async () => {
      const request: InitializeSessionRequest = {
        chatbotConfigId: 'config-123'
      };

      const result1 = await useCase.execute(request);
      const result2 = await useCase.execute(request);

      expect(result1.session.id).not.toBe(result2.session.id);
      expect(mockSessionRepository.getAll()).toHaveLength(2);
    });

    it('should preserve initial context in session', async () => {
      const initialContext = {
        pageUrl: 'https://example.com/pricing',
        referrer: 'https://google.com',
        userAgent: 'Mozilla/5.0...'
      };

      const request: InitializeSessionRequest = {
        chatbotConfigId: 'config-123',
        initialContext
      };

      const result = await useCase.execute(request);

      // Verify context is preserved in session (through contextData)
      expect(result.session.contextData).toBeDefined();
      // Note: The exact structure depends on how ChatSession.create handles initialContext
    });
  });

  describe('Performance Requirements', () => {
    it('should initialize session within performance limits', async () => {
      const request: InitializeSessionRequest = {
        chatbotConfigId: 'config-123',
        warmKnowledgeCache: false // Skip cache warming for pure session perf test
      };

      const startTime = Date.now();
      const result = await useCase.execute(request);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(100); // Should complete in under 100ms
      expect(result.session).toBeDefined();
    });

    it('should handle cache warming within reasonable time', async () => {
      // Mock slow but successful cache warming
      const mockWarmCache = vi.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 50))
      );
      (mockKnowledgeService as any).warmCache = mockWarmCache;
      (mockKnowledgeService as any).isVectorCacheReady = vi.fn().mockReturnValue(true);

      const request: InitializeSessionRequest = {
        chatbotConfigId: 'config-123',
        warmKnowledgeCache: true
      };

      const result = await useCase.execute(request);

      expect(result.cacheWarmed).toBe(true);
      expect(result.cacheWarmingTimeMs).toBeGreaterThanOrEqual(50);
      expect(result.cacheWarmingTimeMs).toBeLessThan(200); // Should complete reasonably quickly
    });
  });

  describe('Visitor ID Generation', () => {
    it('should generate unique visitor IDs', async () => {
      const request: InitializeSessionRequest = {
        chatbotConfigId: 'config-123'
      };

      const result1 = await useCase.execute(request);
      const result2 = await useCase.execute(request);

      expect(result1.session.visitorId).not.toBe(result2.session.visitorId);
      expect(result1.session.visitorId).toMatch(/^visitor_\d+_[a-z0-9]+$/);
      expect(result2.session.visitorId).toMatch(/^visitor_\d+_[a-z0-9]+$/);
    });

    it('should use provided visitor ID when given', async () => {
      const request: InitializeSessionRequest = {
        chatbotConfigId: 'config-123',
        visitorId: 'custom-visitor-id-123'
      };

      const result = await useCase.execute(request);

      expect(result.session.visitorId).toBe('custom-visitor-id-123');
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complete initialization workflow', async () => {
      const request: InitializeSessionRequest = {
        chatbotConfigId: 'config-123',
        visitorId: 'integration-test-visitor',
        initialContext: {
          pageUrl: 'https://example.com/contact',
          utm_source: 'google',
          utm_campaign: 'spring_2024'
        },
        warmKnowledgeCache: true
      };

      const result = await useCase.execute(request);

      // Verify all components work together
      expect(result.session.id).toBeDefined();
      expect(result.session.chatbotConfigId).toBe('config-123');
      expect(result.session.visitorId).toBe('integration-test-visitor');
      expect(result.chatbotConfig.name).toBe('Test Chatbot');
      expect(result.cacheWarmed).toBe(true);
      expect(result.cacheWarmingTimeMs).toBeGreaterThanOrEqual(0);

      // Verify persistence
      const savedSessions = mockSessionRepository.getAll();
      expect(savedSessions).toHaveLength(1);
      expect(savedSessions[0].id).toBe(result.session.id);
    });
  });
});