/**
 * Test Setup Helpers for Chatbot Widget Testing
 * 
 * Provides utilities for test environment setup, cleanup, and common assertions
 */

import { vi, beforeEach, afterEach } from 'vitest';
import { createMockEnvironment } from './MockServices';
import { ChatbotTestDataFactory } from './ChatbotTestDataFactory';

// Global test environment
export interface TestEnvironment {
  mocks: ReturnType<typeof createMockEnvironment>;
  factory: typeof ChatbotTestDataFactory;
  cleanup: () => void;
}

let testEnvironment: TestEnvironment | null = null;

export function setupTestEnvironment(): TestEnvironment {
  const mocks = createMockEnvironment();
  
  // Clear all mocks before each test
  Object.values(mocks).forEach(mock => {
    if ('clear' in mock && typeof mock.clear === 'function') {
      mock.clear();
    }
  });

  testEnvironment = {
    mocks,
    factory: ChatbotTestDataFactory,
    cleanup: () => {
      // Reset all mocks
      vi.clearAllMocks();
      
      // Clear repository data
      Object.values(mocks).forEach(mock => {
        if ('clear' in mock && typeof mock.clear === 'function') {
          mock.clear();
        }
        if ('setFailure' in mock && typeof mock.setFailure === 'function') {
          mock.setFailure(false);
        }
      });
    }
  };

  return testEnvironment;
}

export function getTestEnvironment(): TestEnvironment {
  if (!testEnvironment) {
    throw new Error('Test environment not initialized. Call setupTestEnvironment() first.');
  }
  return testEnvironment;
}

// Common test setup hooks
export function useTestEnvironment() {
  let env: TestEnvironment;

  beforeEach(() => {
    env = setupTestEnvironment();
  });

  afterEach(() => {
    env?.cleanup();
  });

  return () => env;
}

// Assertion helpers
export const TestAssertions = {
  /** Assert that a domain entity has valid structure and required properties */
  assertValidEntity<T extends { id: string; createdAt: Date; updatedAt: Date }>(
    entity: T,
    requiredFields: (keyof T)[] = []
  ): void {
    expect(entity).toBeDefined();
    expect(entity.id).toBeTruthy();
    expect(entity.createdAt).toBeInstanceOf(Date);
    expect(entity.updatedAt).toBeInstanceOf(Date);
    
    requiredFields.forEach(field => {
      expect(entity[field]).toBeDefined();
    });
  },

  /** Assert that a chat message follows the expected structure */
  assertValidChatMessage(message: any, expectedType?: 'user' | 'bot' | 'system'): void {
    this.assertValidEntity(message, ['sessionId', 'messageType', 'content']);
    expect(message.timestamp).toBeInstanceOf(Date);
    expect(message.isVisible).toBeDefined();
    expect(message.metadata).toBeDefined();
    
    if (expectedType) {
      expect(message.messageType).toBe(expectedType);
    }
    
    if (message.messageType === 'bot') {
      expect(message.metadata.aiModel).toBeDefined();
      expect(message.metadata.promptTokens).toBeGreaterThanOrEqual(0);
      expect(message.metadata.completionTokens).toBeGreaterThanOrEqual(0);
    }
  },

  /** Assert that a chat session has valid state */
  assertValidChatSession(session: any): void {
    this.assertValidEntity(session, ['chatbotConfigId', 'visitorId', 'status']);
    expect(['active', 'ended', 'expired']).toContain(session.status);
    expect(session.contextData).toBeDefined();
    expect(session.leadQualificationState).toBeDefined();
  },

  /** Assert that a lead has valid qualification data */
  assertValidLead(lead: any, expectedScore?: number): void {
    this.assertValidEntity(lead, ['organizationId', 'sessionId', 'source']);
    expect(lead.contactInfo).toBeDefined();
    expect(lead.leadScore).toBeGreaterThanOrEqual(0);
    expect(lead.leadScore).toBeLessThanOrEqual(100);
    expect(lead.qualificationStatus).toBeDefined();
    
    if (expectedScore !== undefined) {
      expect(lead.leadScore).toBe(expectedScore);
    }
  },

  /** Assert that AI response has expected structure */
  assertValidAIResponse(response: any): void {
    expect(response).toBeDefined();
    expect(response.content).toBeTruthy();
    expect(response.analysis).toBeDefined();
    expect(response.usage).toBeDefined();
    expect(response.usage.totalTokens).toBeGreaterThan(0);
  },

  /** Assert that conversation flow maintains consistency */
  assertValidConversationFlow(messages: any[]): void {
    expect(messages.length).toBeGreaterThan(0);
    
    // Check message ordering
    for (let i = 1; i < messages.length; i++) {
      expect(messages[i].timestamp.getTime()).toBeGreaterThanOrEqual(
        messages[i - 1].timestamp.getTime()
      );
    }
    
    // Check session consistency
    const sessionIds = new Set(messages.map(m => m.sessionId));
    expect(sessionIds.size).toBe(1);
    
    // Validate each message
    messages.forEach(msg => this.assertValidChatMessage(msg));
  },

  /** Assert that mock service calls match expectations */
  assertMockCalls(mockService: any, expectedCalls: number): void {
    if ('getCallCount' in mockService) {
      expect(mockService.getCallCount()).toBe(expectedCalls);
    } else {
      expect(mockService).toHaveBeenCalledTimes(expectedCalls);
    }
  },

  /**
   * Assert logging output contains expected entries
   */
  assertLoggingContains(logger: any, expectedType: string, expectedMessage?: string): void {
    if ('getLogs' in logger) {
      const logs = logger.getLogs();
      const matchingLogs = logs.filter((log: any) => 
        log.type === expectedType && 
        (!expectedMessage || log.message.includes(expectedMessage))
      );
      expect(matchingLogs.length).toBeGreaterThan(0);
    }
  },

  /** Assert that entity follows DDD patterns */
  assertDomainEntityInvariants<T>(entity: T, invariantChecks: ((entity: T) => boolean)[]): void {
    invariantChecks.forEach((check, _index) => {
      expect(check(entity)).toBe(true);
    });
  },

  /** Assert that repository operations maintain data consistency */
  async assertRepositoryConsistency<T extends { id: string }>(
    repository: any,
    entity: T,
    operation: 'save' | 'delete'
  ): Promise<void> {
    if (operation === 'save') {
      const savedEntity = await repository.save(entity);
      expect(savedEntity.id).toBe(entity.id);
      
      const retrievedEntity = await repository.findById(entity.id);
      expect(retrievedEntity).toBeDefined();
      expect(retrievedEntity.id).toBe(entity.id);
    }
    
    if (operation === 'delete') {
      await repository.delete(entity.id);
      const retrievedEntity = await repository.findById(entity.id);
      expect(retrievedEntity).toBeNull();
    }
  }
};

// Performance testing helpers
export const PerformanceHelpers = {
  /** Measure execution time of async operation */
  async measureExecutionTime<T>(operation: () => Promise<T>): Promise<{ result: T; duration: number }> {
    const startTime = performance.now();
    const result = await operation();
    const endTime = performance.now();
    
    return {
      result,
      duration: endTime - startTime
    };
  },

  /** Assert operation completes within time limit */
  async assertPerformance<T>(
    operation: () => Promise<T>,
    maxDurationMs: number,
    _description?: string
  ): Promise<T> {
    const { result, duration } = await this.measureExecutionTime(operation);
    
    expect(duration).toBeLessThan(maxDurationMs);
    
    return result;
  },

  /** Run operation multiple times and get average performance */
  async benchmarkOperation<T>(
    operation: () => Promise<T>,
    iterations: number = 10
  ): Promise<{ averageDuration: number; results: T[] }> {
    const results: T[] = [];
    const durations: number[] = [];
    
    for (let i = 0; i < iterations; i++) {
      const { result, duration } = await this.measureExecutionTime(operation);
      results.push(result);
      durations.push(duration);
    }
    
    const averageDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
    
    return { averageDuration, results };
  }
};

// Error simulation helpers
export const ErrorSimulationHelpers = {
  /** Simulate network failure for mock services */
  simulateNetworkFailure(mockService: any, shouldFail: boolean = true): void {
    if ('setFailure' in mockService) {
      mockService.setFailure(shouldFail);
    }
  },

  /** Simulate AI service rate limiting */
  simulateRateLimit(mockAI: any, delay: number = 1000): void {
    const originalMethod = mockAI.generateResponse;
    mockAI.generateResponse = async (...args: any[]) => {
      await new Promise(resolve => setTimeout(resolve, delay));
      return originalMethod.apply(mockAI, args);
    };
  },

  /** Simulate partial system failure */
  simulatePartialFailure(mocks: any, failureRate: number = 0.3): void {
    Object.values(mocks).forEach((mock: any) => {
      if ('setFailure' in mock) {
        const shouldFail = Math.random() < failureRate;
        mock.setFailure(shouldFail);
      }
    });
  }
};

// Integration test helpers
export const IntegrationHelpers = {
  /** Create a complete conversation scenario */
  async createConversationScenario(
    env: TestEnvironment,
    scenario: 'pricing_inquiry' | 'support_request' | 'lead_capture'
  ) {
    const { mocks, factory } = env;
    
    // Setup base entities
    const config = factory.createValidConfig();
    const session = factory.createChatSession(config.id);
    
    await mocks.configRepository.save(config);
    await mocks.sessionRepository.save(session);
    
    // Create scenario-specific conversation
    let messages: any[] = [];
    
    switch (scenario) {
      case 'pricing_inquiry':
        messages = [
          factory.createChatMessage(session.id, {
            content: 'What are your pricing plans?',
            messageType: 'user'
          }),
          factory.createBotMessage(session.id, 'We offer three plans: Starter, Professional, and Enterprise.')
        ];
        break;
        
      case 'support_request':
        messages = [
          factory.createChatMessage(session.id, {
            content: 'I need help with my account',
            messageType: 'user'
          }),
          factory.createBotMessage(session.id, 'I\'d be happy to help with your account. What specific issue are you experiencing?')
        ];
        break;
        
      case 'lead_capture':
        messages = factory.createConversationFlow();
        break;
    }
    
    // Save messages
    for (const message of messages) {
      await mocks.messageRepository.save(message, 'test-log.log');
    }
    
    return { config, session, messages };
  },

  /** Verify complete workflow execution */
  async verifyWorkflowExecution(
    env: TestEnvironment,
    workflowType: 'message_processing' | 'lead_qualification' | 'knowledge_retrieval'
  ) {
    const { mocks } = env;
    
    // Verify expected service calls were made
    switch (workflowType) {
      case 'message_processing':
        expect(mocks.aiService.getCallCount()).toBeGreaterThan(0);
        expect(mocks.messageRepository.getAll?.()?.length || 0).toBeGreaterThan(0);
        break;
        
      case 'lead_qualification':
        expect(mocks.leadRepository.getAll?.()?.length || 0).toBeGreaterThan(0);
        break;
        
      case 'knowledge_retrieval':
        // Knowledge service should have been called
        expect(mocks.knowledgeService).toBeDefined();
        break;
    }
  }
};

// Export common test utilities
export * from './ChatbotTestDataFactory';
export * from './MockServices';