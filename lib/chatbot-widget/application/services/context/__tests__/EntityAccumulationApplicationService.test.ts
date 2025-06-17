/**
 * Entity Accumulation Application Service Tests
 * 
 * AI INSTRUCTIONS:
 * - Test all public methods with various scenarios
 * - Mock dependencies properly using vi.fn()
 * - Test error handling and fallback behavior
 * - Verify domain service integration
 * - Follow established testing patterns in the project
 * - Use UPDATE repository method for existing sessions (not SAVE)
 * - Test EntityPersistenceError for persistence failures
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EntityAccumulationApplicationService } from '../EntityAccumulationApplicationService';
import { IChatSessionRepository } from '../../../../domain/repositories/IChatSessionRepository';
import { IIntentClassificationService } from '../../../../domain/services/interfaces/IIntentClassificationService';
import { ChatSession } from '../../../../domain/entities/ChatSession';
import { ChatMessage } from '../../../../domain/entities/ChatMessage';
import { AccumulatedEntities } from '../../../../domain/value-objects/context/AccumulatedEntities';
import { EntityCorrections } from '../../../../domain/value-objects/context/EntityCorrections';
import { ChatSessionNotFoundError, EntityPersistenceError } from '../../../../domain/errors/LeadManagementErrors';
import { BusinessRuleViolationError } from '../../../../domain/errors/BusinessRuleViolationError';

// Mock implementations
const mockSessionRepository: IChatSessionRepository = {
  findById: vi.fn(),
  save: vi.fn(),
  findByVisitorId: vi.fn(),
  findBySessionToken: vi.fn(),
  findActiveByChatbotConfigId: vi.fn(),
  findByOrganizationIdWithPagination: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  findExpiredSessions: vi.fn(),
  markExpiredAsAbandoned: vi.fn(),
  getAnalytics: vi.fn(),
  findRecentByVisitorId: vi.fn(),
  countActiveByChatbotConfigId: vi.fn()
};

const mockIntentClassificationService: IIntentClassificationService = {
  classifyIntent: vi.fn(),
  classifyIntentQuick: vi.fn(),
  classifyIntentsBatch: vi.fn(),
  getConfidenceThreshold: vi.fn(),
  healthCheck: vi.fn()
};

describe('EntityAccumulationApplicationService', () => {
  let service: EntityAccumulationApplicationService;
  let mockSession: ChatSession;

  beforeEach(() => {
    vi.clearAllMocks();
    
    service = new EntityAccumulationApplicationService(
      mockSessionRepository,
      mockIntentClassificationService
    );

    // Create mock session
    mockSession = ChatSession.create('config-1', 'visitor-1');
  });

  describe('accumulateEntities', () => {
    it('should accumulate entities for new session without existing entities', async () => {
      // Arrange
      const request = {
        sessionId: 'session-1',
        userMessage: 'I am John Doe, the CEO of TechCorp',
        messageHistory: [],
        messageId: 'msg-1'
      };

      const mockIntentResult = {
        entities: {
          decisionMakers: ['John Doe'],
          company: 'TechCorp',
          role: 'CEO'
        }
      };

      vi.mocked(mockSessionRepository.findById).mockResolvedValue(mockSession);
      vi.mocked(mockIntentClassificationService.classifyIntent).mockResolvedValue(mockIntentResult as any);
      vi.mocked(mockSessionRepository.update).mockResolvedValue(mockSession);

      // Act
      const result = await service.accumulateEntities(request);

      // Assert
      expect(result.sessionId).toBe('session-1');
      expect(result.accumulatedEntities).toBeDefined();
      expect(result.extractedEntities).toEqual(mockIntentResult.entities);
      expect(result.contextPrompt).toContain('ACCUMULATED');
      expect(mockSessionRepository.findById).toHaveBeenCalledWith('session-1');
      expect(mockSessionRepository.update).toHaveBeenCalled();
    });

    it('should merge entities with existing accumulated entities', async () => {
      // Arrange
      const existingEntities = AccumulatedEntities.create({
        decisionMakers: [{
          value: 'Jane Smith',
          extractedAt: new Date(),
          confidence: 0.9,
          sourceMessageId: 'msg-0',
          extractionMethod: 'ai'
        }]
      });

      const sessionWithContext = ChatSession.fromPersistence({
        ...mockSession.toPlainObject(),
        contextData: {
          ...mockSession.contextData,
          accumulatedEntities: existingEntities.getAllEntitiesSummary()
        } as any
      });

      const request = {
        sessionId: 'session-1',
        userMessage: 'Also, our CTO Bob Johnson will be involved',
        messageHistory: [],
        messageId: 'msg-1'
      };

      const mockIntentResult = {
        entities: {
          decisionMakers: ['Bob Johnson'],
          role: 'CTO'
        }
      };

      vi.mocked(mockSessionRepository.findById).mockResolvedValue(sessionWithContext);
      vi.mocked(mockIntentClassificationService.classifyIntent).mockResolvedValue(mockIntentResult as any);
      vi.mocked(mockSessionRepository.update).mockResolvedValue(sessionWithContext);

      // Act
      const result = await service.accumulateEntities(request);

      // Assert
      expect(result.sessionId).toBe('session-1');
      expect(result.mergeMetadata).toBeDefined();
      expect(mockSessionRepository.update).toHaveBeenCalled();
    });

    it('should handle entity corrections when available', async () => {
      // Arrange
      const mockServiceWithCorrections = {
        ...mockIntentClassificationService,
        extractEntitiesWithCorrections: vi.fn()
      };

      const service = new EntityAccumulationApplicationService(
        mockSessionRepository,
        mockServiceWithCorrections as any
      );

      const request = {
        sessionId: 'session-1',
        userMessage: 'Actually, Jane is NOT a decision maker',
        messageHistory: [],
        messageId: 'msg-1'
      };

      const mockCorrectionResult = {
        entities: {},
        corrections: EntityCorrections.create('session-1', {
          removedDecisionMakers: [{
            entityValue: 'Jane',
            metadata: {
              timestamp: new Date(),
              sourceMessageId: 'msg-1',
              confidence: 0.9,
              correctionReason: 'Explicitly stated as not a decision maker',
              extractionMethod: 'ai'
            }
          }]
        })
      };

      vi.mocked(mockSessionRepository.findById).mockResolvedValue(mockSession);
      vi.mocked(mockServiceWithCorrections.extractEntitiesWithCorrections).mockResolvedValue(mockCorrectionResult);
      vi.mocked(mockSessionRepository.update).mockResolvedValue(mockSession);

      // Act
      const result = await service.accumulateEntities(request);

      // Assert
      expect(result.entityCorrections).toBeDefined();
      expect(result.mergeMetadata.correctionsApplied).toBeGreaterThan(0);
    });

    it('should throw ChatSessionNotFoundError for non-existent session', async () => {
      // Arrange
      const request = {
        sessionId: 'non-existent',
        userMessage: 'test message',
        messageHistory: [],
        messageId: 'msg-1'
      };

      vi.mocked(mockSessionRepository.findById).mockResolvedValue(null);

      // Act & Assert
      await expect(service.accumulateEntities(request))
        .rejects.toThrow(ChatSessionNotFoundError);
    });

    it('should handle persistence errors gracefully', async () => {
      // Arrange
      const request = {
        sessionId: 'session-1',
        userMessage: 'test message',
        messageHistory: [],
        messageId: 'msg-1'
      };

      vi.mocked(mockSessionRepository.findById).mockResolvedValue(mockSession);
      vi.mocked(mockIntentClassificationService.classifyIntent).mockResolvedValue({ entities: {} } as any);
      vi.mocked(mockSessionRepository.update).mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(service.accumulateEntities(request))
        .rejects.toThrow(EntityPersistenceError);
    });

    it('should handle business rule violations when rethrowing existing errors', async () => {
      // Arrange
      const request = {
        sessionId: 'session-1',
        userMessage: 'test message',
        messageHistory: [],
        messageId: 'msg-1'
      };

      const businessRuleError = new BusinessRuleViolationError('Test business rule violation');

      vi.mocked(mockSessionRepository.findById).mockResolvedValue(mockSession);
      vi.mocked(mockIntentClassificationService.classifyIntent).mockResolvedValue({ entities: {} } as any);
      vi.mocked(mockSessionRepository.update).mockRejectedValue(businessRuleError);

      // Act & Assert
      await expect(service.accumulateEntities(request))
        .rejects.toThrow(BusinessRuleViolationError);
    });

    it('should use custom configuration when provided', async () => {
      // Arrange
      const request = {
        sessionId: 'session-1',
        userMessage: 'test message',
        messageHistory: [],
        messageId: 'msg-1'
      };

      const customConfig = {
        defaultConfidence: 0.95,
        enableDeduplication: false,
        confidenceThreshold: 0.85
      };

      vi.mocked(mockSessionRepository.findById).mockResolvedValue(mockSession);
      vi.mocked(mockIntentClassificationService.classifyIntent).mockResolvedValue({ entities: {} } as any);
      vi.mocked(mockSessionRepository.update).mockResolvedValue(mockSession);

      // Act
      const result = await service.accumulateEntities(request, customConfig);

      // Assert
      expect(result).toBeDefined();
      expect(mockSessionRepository.update).toHaveBeenCalled();
    });
  });

  describe('getCurrentEntities', () => {
    it('should return accumulated entities from session', async () => {
      // Arrange
      const entities = AccumulatedEntities.create({
        decisionMakers: [{
          value: 'John Doe',
          extractedAt: new Date(),
          confidence: 0.9,
          sourceMessageId: 'msg-1',
          extractionMethod: 'ai'
        }]
      });

      const sessionWithEntities = ChatSession.fromPersistence({
        ...mockSession.toPlainObject(),
        contextData: {
          ...mockSession.contextData,
          accumulatedEntities: entities.toPlainObject()
        } as any
      });

      vi.mocked(mockSessionRepository.findById).mockResolvedValue(sessionWithEntities);

      // Act
      const result = await service.getCurrentEntities('session-1');

      // Assert
      expect(result).toBeDefined();
      expect(result?.decisionMakers.length).toBeGreaterThan(0);
    });

    it('should return null for session without entities', async () => {
      // Arrange
      vi.mocked(mockSessionRepository.findById).mockResolvedValue(mockSession);

      // Act
      const result = await service.getCurrentEntities('session-1');

      // Assert
      expect(result).toBeNull();
    });

    it('should throw error for non-existent session', async () => {
      // Arrange
      vi.mocked(mockSessionRepository.findById).mockResolvedValue(null);

      // Act & Assert
      await expect(service.getCurrentEntities('non-existent'))
        .rejects.toThrow(ChatSessionNotFoundError);
    });
  });

  describe('buildEntityContextPrompt', () => {
    it('should return empty string for session without entities', async () => {
      // Arrange
      vi.mocked(mockSessionRepository.findById).mockResolvedValue(mockSession);

      // Act
      const result = await service.buildEntityContextPrompt('session-1');

      // Assert
      expect(result).toBe('');
    });

    it('should return formatted prompt for session with entities', async () => {
      // Arrange
      const entities = AccumulatedEntities.create({
        decisionMakers: [{
          value: 'John Doe',
          extractedAt: new Date(),
          confidence: 0.9,
          sourceMessageId: 'msg-1',
          extractionMethod: 'ai'
        }],
        company: {
          value: 'TechCorp',
          extractedAt: new Date(),
          confidence: 0.9,
          sourceMessageId: 'msg-1',
          extractionMethod: 'ai'
        }
      });

      const sessionWithEntities = ChatSession.fromPersistence({
        ...mockSession.toPlainObject(),
        contextData: {
          ...mockSession.contextData,
          accumulatedEntities: entities.toPlainObject()
        } as any
      });

      vi.mocked(mockSessionRepository.findById).mockResolvedValue(sessionWithEntities);

      // Act
      const result = await service.buildEntityContextPrompt('session-1');

      // Assert
      expect(result).toContain('ACCUMULATED CONVERSATION CONTEXT');
      expect(result).toContain('Decision makers identified');
      expect(result).toContain('Company');
    });
  });

  describe('clearAccumulatedEntities', () => {
    it('should clear entities and persist empty state', async () => {
      // Arrange
      vi.mocked(mockSessionRepository.findById).mockResolvedValue(mockSession);
      vi.mocked(mockSessionRepository.update).mockResolvedValue(mockSession);

      // Act
      await service.clearAccumulatedEntities('session-1');

      // Assert
      expect(mockSessionRepository.findById).toHaveBeenCalledWith('session-1');
      expect(mockSessionRepository.update).toHaveBeenCalled();
    });

    it('should throw error for non-existent session', async () => {
      // Arrange
      vi.mocked(mockSessionRepository.findById).mockResolvedValue(null);

      // Act & Assert
      await expect(service.clearAccumulatedEntities('non-existent'))
        .rejects.toThrow(ChatSessionNotFoundError);
    });
  });

  describe('fallback behavior', () => {
    it('should fallback to basic entity extraction when enhanced method fails', async () => {
      // Arrange
      const mockServiceWithCorrections = {
        ...mockIntentClassificationService,
        extractEntitiesWithCorrections: vi.fn().mockRejectedValue(new Error('API error'))
      };

      const service = new EntityAccumulationApplicationService(
        mockSessionRepository,
        mockServiceWithCorrections as any
      );

      const request = {
        sessionId: 'session-1',
        userMessage: 'I work at TechCorp',
        messageHistory: [],
        messageId: 'msg-1'
      };

      const fallbackResult = {
        entities: { company: 'TechCorp' }
      };

      vi.mocked(mockSessionRepository.findById).mockResolvedValue(mockSession);
      vi.mocked(mockIntentClassificationService.classifyIntent).mockResolvedValue(fallbackResult as any);
      vi.mocked(mockSessionRepository.update).mockResolvedValue(mockSession);

      // Act
      const result = await service.accumulateEntities(request);

      // Assert
      expect(result.extractedEntities).toEqual(fallbackResult.entities);
      expect(result.entityCorrections).toBeNull();
    });

    it('should handle malformed session context gracefully', async () => {
      // Arrange
      const corruptedSession = ChatSession.fromPersistence({
        ...mockSession.toPlainObject(),
        contextData: {
          ...mockSession.contextData,
          accumulatedEntities: 'invalid-data'
        } as any
      });

      const request = {
        sessionId: 'session-1',
        userMessage: 'test message',
        messageHistory: [],
        messageId: 'msg-1'
      };

      vi.mocked(mockSessionRepository.findById).mockResolvedValue(corruptedSession);
      vi.mocked(mockIntentClassificationService.classifyIntent).mockResolvedValue({ entities: {} } as any);
      vi.mocked(mockSessionRepository.update).mockResolvedValue(corruptedSession);

      // Act
      const result = await service.accumulateEntities(request);

      // Assert
      expect(result).toBeDefined();
      expect(result.accumulatedEntities).toBeDefined();
    });
  });
}); 