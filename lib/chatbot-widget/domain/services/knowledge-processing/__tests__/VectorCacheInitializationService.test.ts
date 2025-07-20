/**
 * Vector Cache Initialization Service Tests
 * 
 * Tests focus on preventing cache initialization regressions and edge cases
 * that could cause knowledge search failures.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BusinessRuleViolationError } from '../../../errors/ChatbotWidgetDomainErrors';
import { VectorCacheInitializationService } from '../VectorCacheInitializationService';

// Mock dependencies
const mockVectorRepository = {
  getAllKnowledgeVectors: vi.fn()
};

const mockVectorCache = {
  isReady: vi.fn(),
  initialize: vi.fn(),
  getCacheStats: vi.fn()
};

const mockLoggingService = {
  createSessionLogger: vi.fn()
};

const mockLogger = {
  logStep: vi.fn(),
  logMessage: vi.fn(),
  logError: vi.fn(),
  logMetrics: vi.fn()
};

describe('VectorCacheInitializationService', () => {
  let service: VectorCacheInitializationService;
  const organizationId = 'org-123';
  const chatbotConfigId = 'config-456';

  beforeEach(() => {
    vi.clearAllMocks();
    mockLoggingService.createSessionLogger.mockReturnValue(mockLogger);
    mockVectorCache.getCacheStats.mockReturnValue({
      vectorsLoaded: 0,
      memoryUsageKB: 0
    });
    
    service = new VectorCacheInitializationService(
      mockVectorRepository as any,
      mockVectorCache as any,
      mockLoggingService as any,
      organizationId,
      chatbotConfigId
    );
  });

  describe('Log File Parameter Validation', () => {
    it('should handle empty string log file parameter', async () => {
      // Arrange: Cache not ready, empty log file provided
      mockVectorCache.isReady.mockReturnValue(false);
      mockVectorRepository.getAllKnowledgeVectors.mockResolvedValue([]);
      mockVectorCache.initialize.mockResolvedValue({
        vectorsLoaded: 0,
        memoryUsageKB: 0
      });

      // Act: Call with empty string (this was causing the original issue)
      const result = await service.initializeForSession('');

      // Assert: Should still create logger and complete initialization
      expect(mockLoggingService.createSessionLogger).toHaveBeenCalledWith(
        'vector-cache-init',
        '', // Empty string should be handled gracefully
        expect.objectContaining({
          operation: 'initializeVectorCacheForSession',
          organizationId
        })
      );
      expect(result).toBeDefined();
      expect(result.vectorsLoaded).toBe(0);
    });

    it('should handle whitespace-only log file parameter', async () => {
      // Arrange: Cache not ready, whitespace log file provided
      mockVectorCache.isReady.mockReturnValue(false);
      mockVectorRepository.getAllKnowledgeVectors.mockResolvedValue([]);
      mockVectorCache.initialize.mockResolvedValue({
        vectorsLoaded: 0,
        memoryUsageKB: 0
      });

      // Act: Call with whitespace-only string
      const result = await service.initializeForSession('   ');

      // Assert: Should handle gracefully
      expect(mockLoggingService.createSessionLogger).toHaveBeenCalledWith(
        'vector-cache-init',
        '   ',
        expect.objectContaining({
          operation: 'initializeVectorCacheForSession'
        })
      );
      expect(result).toBeDefined();
    });

    it('should handle valid log file parameter', async () => {
      // Arrange: Cache not ready, valid log file provided
      mockVectorCache.isReady.mockReturnValue(false);
      mockVectorRepository.getAllKnowledgeVectors.mockResolvedValue([]);
      mockVectorCache.initialize.mockResolvedValue({
        vectorsLoaded: 0,
        memoryUsageKB: 0
      });

      // Act: Call with valid log file
      const result = await service.initializeForSession('valid-log-file.log');

      // Assert: Should use the provided log file
      expect(mockLoggingService.createSessionLogger).toHaveBeenCalledWith(
        'vector-cache-init',
        'valid-log-file.log',
        expect.objectContaining({
          operation: 'initializeVectorCacheForSession'
        })
      );
      expect(result).toBeDefined();
    });
  });

  describe('Cache Readiness Edge Cases', () => {
    it('should skip initialization when cache is already ready', async () => {
      // Arrange: Cache already ready
      mockVectorCache.isReady.mockReturnValue(true);

      // Act
      const result = await service.initializeForSession('test.log');

      // Assert: Should return immediately without initialization
      expect(mockVectorRepository.getAllKnowledgeVectors).not.toHaveBeenCalled();
      expect(mockVectorCache.initialize).not.toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should perform initialization when cache is not ready', async () => {
      // Arrange: Cache not ready
      mockVectorCache.isReady.mockReturnValue(false);
      mockVectorRepository.getAllKnowledgeVectors.mockResolvedValue([
        {
          item: {
            id: 'kb-1',
            title: 'Test Item',
            content: 'Test content',
            category: 'general' as const,
            tags: [],
            relevanceScore: 0.8,
            source: 'test',
            lastUpdated: new Date()
          },
          vector: [0.1, 0.2, 0.3]
        }
      ]);
      mockVectorCache.initialize.mockResolvedValue({
        vectorsLoaded: 1,
        memoryUsageKB: 10
      });

      // Act
      const result = await service.initializeForSession('test.log');

      // Assert: Should perform full initialization
      expect(mockVectorRepository.getAllKnowledgeVectors).toHaveBeenCalledWith(
        organizationId,
        chatbotConfigId
      );
      expect(mockVectorCache.initialize).toHaveBeenCalled();
      expect(result.vectorsLoaded).toBe(1);
      expect(result.memoryUsageKB).toBe(10);
    });
  });

  describe('Error Handling during Initialization', () => {
    beforeEach(() => {
      mockVectorCache.isReady.mockReturnValue(false);
    });

    it('should handle repository errors gracefully', async () => {
      // Arrange: Repository throws error
      mockVectorRepository.getAllKnowledgeVectors.mockRejectedValue(
        new Error('Database connection failed')
      );

      // Act & Assert: Should throw BusinessRuleViolationError
      await expect(service.initializeForSession('test.log')).rejects.toThrow(BusinessRuleViolationError);
      await expect(service.initializeForSession('test.log')).rejects.toThrow('Failed to initialize vector cache');
    });

    it('should handle cache initialization errors gracefully', async () => {
      // Arrange: Repository succeeds, cache initialization fails
      mockVectorRepository.getAllKnowledgeVectors.mockResolvedValue([]);
      mockVectorCache.initialize.mockRejectedValue(
        new Error('Out of memory')
      );

      // Act & Assert: Should throw BusinessRuleViolationError
      await expect(service.initializeForSession('test.log')).rejects.toThrow(BusinessRuleViolationError);
      await expect(service.initializeForSession('test.log')).rejects.toThrow('Failed to initialize vector cache');
    });

    it('should include error context in wrapped errors', async () => {
      // Arrange: Repository fails
      mockVectorRepository.getAllKnowledgeVectors.mockRejectedValue(
        new Error('Database timeout')
      );

      // Act & Assert: Should include context
      try {
        await service.initializeForSession('test.log');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(BusinessRuleViolationError);
        const businessError = error as BusinessRuleViolationError;
        // The error is wrapped twice: first by loadVectorsFromRepository, then by performInitialization
        expect(businessError.message).toBe('Business rule violated: Failed to initialize vector cache');
        expect(businessError.context).toMatchObject({
          organizationId,
          chatbotConfigId
        });
        // The original error message should be in the error context somewhere
        expect(businessError.context.error).toContain('Failed to load knowledge vectors from repository');
      }
    });
  });

  describe('Logger Integration', () => {
    it('should create logger with correct context when cache is not ready', async () => {
      // Arrange: Cache not ready to trigger logger creation
      mockVectorCache.isReady.mockReturnValue(false);
      mockVectorRepository.getAllKnowledgeVectors.mockResolvedValue([]);
      mockVectorCache.initialize.mockResolvedValue({
        vectorsLoaded: 0,
        memoryUsageKB: 0
      });

      // Act
      await service.initializeForSession('shared-log.log');

      // Assert: Should create logger with proper context
      expect(mockLoggingService.createSessionLogger).toHaveBeenCalledWith(
        'vector-cache-init',
        'shared-log.log',
        {
          operation: 'initializeVectorCacheForSession',
          organizationId
        }
      );
    });

    it('should use logger for error reporting', async () => {
      // Arrange: Force error during initialization
      mockVectorCache.isReady.mockReturnValue(false);
      const testError = new Error('Test error');
      mockVectorRepository.getAllKnowledgeVectors.mockRejectedValue(testError);

      // Act & Assert
      try {
        await service.initializeForSession('test.log');
        expect.fail('Should have thrown an error');
      } catch (error) {
        // Logger should be called with the wrapped BusinessRuleViolationError from loadVectorsFromRepository
        expect(mockLogger.logError).toHaveBeenCalledWith(
          expect.objectContaining({
            message: 'Business rule violated: Failed to load knowledge vectors from repository'
          })
        );
      }
    });
  });

  describe('isReady method', () => {
    it('should delegate to vector cache isReady method', () => {
      // Arrange
      mockVectorCache.isReady.mockReturnValue(true);

      // Act
      const result = service.isReady();

      // Assert
      expect(result).toBe(true);
      expect(mockVectorCache.isReady).toHaveBeenCalled();
    });

    it('should return false when cache is not ready', () => {
      // Arrange
      mockVectorCache.isReady.mockReturnValue(false);

      // Act
      const result = service.isReady();

      // Assert
      expect(result).toBe(false);
    });
  });
}); 