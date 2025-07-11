/**
 * GenerationStatusService Tests
 * 
 * Tests the generation status service that handles:
 * - Single and batch generation status checking
 * - Provider communication for status updates
 * - Timeout handling for stuck generations
 * - Auto-save trigger for completed generations
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GenerationStatusService } from '../GenerationStatusService';
import { GenerationRepository } from '../../../domain/repositories/GenerationRepository';
import { AutoSaveGenerationUseCase } from '../../use-cases/AutoSaveGenerationUseCase';
import { Generation } from '../../../domain/entities/Generation';
import { ProviderFactory } from '../../../infrastructure/providers/ProviderFactory';
import { GenerationMapper } from '../../mappers/GenerationMapper';
import { Result, success, error } from '../../../infrastructure/common/Result';

// Mock dependencies
vi.mock('../../../infrastructure/providers/ProviderFactory', () => ({
  ProviderFactory: {
    createProviderRegistry: vi.fn()
  }
}));

vi.mock('../../mappers/GenerationMapper', () => ({
  GenerationMapper: {
    toDto: vi.fn()
  }
}));

describe('GenerationStatusService', () => {
  let service: GenerationStatusService;
  let mockGenerationRepository: any;
  let mockAutoSaveUseCase: any;
  let mockGeneration: any;
  let mockProviderRegistry: any;
  let mockProvider: any;

  const authContext = {
    userId: 'user-123',
    organizationId: 'org-456'
  };

  beforeEach(() => {
    // Mock repository
    mockGenerationRepository = {
      findById: vi.fn(),
      update: vi.fn(),
      save: vi.fn()
    } as any;

    // Mock auto-save use case
    mockAutoSaveUseCase = {
      execute: vi.fn()
    } as any;

    // Mock generation entity with recent timestamp
    mockGeneration = {
      id: 'gen-123',
      createdAt: new Date(Date.now() - 30000), // 30 seconds ago (within timeout threshold)
      providerName: 'replicate',
      externalProviderId: 'ext-123',
      getStatus: vi.fn().mockReturnValue({ value: 'processing' }),
      markAsCompleted: vi.fn(),
      markAsFailed: vi.fn(),
      getId: vi.fn().mockReturnValue('gen-123')
    } as any;

    // Mock provider
    mockProvider = {
      checkStatus: vi.fn()
    };

    // Mock provider registry
    mockProviderRegistry = {
      getProvider: vi.fn().mockReturnValue(mockProvider)
    };

    // Mock ProviderFactory
    (ProviderFactory.createProviderRegistry as any).mockReturnValue(mockProviderRegistry);

    // Mock GenerationMapper
    (GenerationMapper.toDto as any).mockReturnValue({
      id: 'gen-123',
      status: 'processing',
      createdAt: new Date(Date.now() - 30000).toISOString()
    });

    service = new GenerationStatusService(
      mockGenerationRepository,
      mockAutoSaveUseCase
    );
  });

  describe('checkGenerationStatus', () => {
    it('should return error when generation is not found', async () => {
      mockGenerationRepository.findById.mockResolvedValue(
        error('Generation not found')
      );

      const result = await service.checkGenerationStatus('gen-123', authContext);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Generation not found');
    });

    it('should return error when generation result is null', async () => {
      mockGenerationRepository.findById.mockResolvedValue(
        success(null)
      );

      const result = await service.checkGenerationStatus('gen-123', authContext);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Generation not found');
    });

    it('should handle timeout for stuck generations', async () => {
      // Create a generation that's older than timeout threshold
      const oldGeneration = {
        ...mockGeneration,
        createdAt: new Date(Date.now() - 70000), // 70 seconds ago
        getStatus: vi.fn().mockReturnValue({ value: 'processing' })
      };

      mockGenerationRepository.findById.mockResolvedValue(
        success(oldGeneration)
      );

      const result = await service.checkGenerationStatus('gen-123', authContext);

      expect(oldGeneration.markAsFailed).toHaveBeenCalledWith('Generation timed out');
      expect(mockGenerationRepository.update).toHaveBeenCalledWith(oldGeneration);
      expect(result.success).toBe(true);
    });

    it('should return cached result for completed generations', async () => {
      const completedGeneration = {
        ...mockGeneration,
        getStatus: vi.fn().mockReturnValue({ value: 'completed' })
      };

      mockGenerationRepository.findById.mockResolvedValue(
        success(completedGeneration)
      );

      const result = await service.checkGenerationStatus('gen-123', authContext);

      expect(result.success).toBe(true);
      expect(mockProvider.checkStatus).not.toHaveBeenCalled();
      expect(GenerationMapper.toDto).toHaveBeenCalledWith(completedGeneration);
    });

    it('should return cached result for cancelled generations', async () => {
      const cancelledGeneration = {
        ...mockGeneration,
        getStatus: vi.fn().mockReturnValue({ value: 'cancelled' })
      };

      mockGenerationRepository.findById.mockResolvedValue(
        success(cancelledGeneration)
      );

      const result = await service.checkGenerationStatus('gen-123', authContext);

      expect(result.success).toBe(true);
      expect(mockProvider.checkStatus).not.toHaveBeenCalled();
    });

    it('should check with provider for active generations', async () => {
      mockGenerationRepository.findById.mockResolvedValue(
        success(mockGeneration)
      );

      mockProvider.checkStatus.mockResolvedValue({
        status: 'processing'
      });

      const result = await service.checkGenerationStatus('gen-123', authContext);

      expect(mockProvider.checkStatus).toHaveBeenCalledWith('ext-123');
      expect(result.success).toBe(true);
    });

    it('should handle completed generation from provider', async () => {
      mockGenerationRepository.findById.mockResolvedValue(
        success(mockGeneration)
      );

      mockProvider.checkStatus.mockResolvedValue({
        status: 'completed',
        imageUrl: 'https://example.com/image.png'
      });

      await service.checkGenerationStatus('gen-123', authContext);

      expect(mockGeneration.markAsCompleted).toHaveBeenCalledWith(
        'https://example.com/image.png',
        25
      );
      expect(mockGenerationRepository.update).toHaveBeenCalledWith(mockGeneration);
      expect(mockAutoSaveUseCase.execute).toHaveBeenCalledWith('gen-123');
    });

    it('should handle failed generation from provider', async () => {
      mockGenerationRepository.findById.mockResolvedValue(
        success(mockGeneration)
      );

      mockProvider.checkStatus.mockResolvedValue({
        status: 'failed',
        errorMessage: 'Provider error'
      });

      await service.checkGenerationStatus('gen-123', authContext);

      expect(mockGeneration.markAsFailed).toHaveBeenCalledWith('Provider error');
      expect(mockGenerationRepository.update).toHaveBeenCalledWith(mockGeneration);
    });

    it('should handle failed generation without error message', async () => {
      mockGenerationRepository.findById.mockResolvedValue(
        success(mockGeneration)
      );

      mockProvider.checkStatus.mockResolvedValue({
        status: 'failed'
      });

      await service.checkGenerationStatus('gen-123', authContext);

      expect(mockGeneration.markAsFailed).toHaveBeenCalledWith('Generation failed at provider');
    });

    it('should handle missing provider information', async () => {
      const generationWithoutProvider = {
        ...mockGeneration,
        providerName: null,
        externalProviderId: null
      };

      mockGenerationRepository.findById.mockResolvedValue(
        success(generationWithoutProvider)
      );

      await service.checkGenerationStatus('gen-123', authContext);

      expect(generationWithoutProvider.markAsFailed).toHaveBeenCalledWith('Missing provider information');
    });

    it('should handle unavailable provider', async () => {
      mockGenerationRepository.findById.mockResolvedValue(
        success(mockGeneration)
      );

      mockProviderRegistry.getProvider.mockReturnValue(null);

      await service.checkGenerationStatus('gen-123', authContext);

      expect(mockGeneration.markAsFailed).toHaveBeenCalledWith('Provider replicate not available');
    });

    it('should handle auto-save failure gracefully', async () => {
      mockGenerationRepository.findById.mockResolvedValue(
        success(mockGeneration)
      );

      mockProvider.checkStatus.mockResolvedValue({
        status: 'completed',
        imageUrl: 'https://example.com/image.png'
      });

      // Make auto-save fail
      mockAutoSaveUseCase.execute.mockRejectedValue(new Error('Auto-save failed'));

      const result = await service.checkGenerationStatus('gen-123', authContext);

      // Should still succeed even if auto-save fails
      expect(result.success).toBe(true);
    });

    it('should handle service errors gracefully', async () => {
      mockGenerationRepository.findById.mockRejectedValue(new Error('Database error'));

      const result = await service.checkGenerationStatus('gen-123', authContext);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database error');
    });

    it('should handle non-Error exceptions', async () => {
      mockGenerationRepository.findById.mockRejectedValue('String error');

      const result = await service.checkGenerationStatus('gen-123', authContext);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Status check failed');
    });
  });

  describe('checkMultipleGenerationStatus', () => {
    it('should check multiple generations successfully', async () => {
      const generationIds = ['gen-1', 'gen-2', 'gen-3'];
      
      // Mock successful results for all generations
      mockGenerationRepository.findById
        .mockResolvedValueOnce(success(mockGeneration))
        .mockResolvedValueOnce(success(mockGeneration))
        .mockResolvedValueOnce(success(mockGeneration));

      mockProvider.checkStatus.mockResolvedValue({
        status: 'processing'
      });

      const result = await service.checkMultipleGenerationStatus(generationIds, authContext);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(3);
      expect(result.errors).toBeUndefined();
    });

    it('should handle mixed success and failure results', async () => {
      const generationIds = ['gen-1', 'gen-2', 'gen-3'];
      
      // Mock mixed results
      mockGenerationRepository.findById
        .mockResolvedValueOnce(success(mockGeneration))
        .mockResolvedValueOnce(error('Not found'))
        .mockResolvedValueOnce(success(mockGeneration));

      mockProvider.checkStatus.mockResolvedValue({
        status: 'processing'
      });

      const result = await service.checkMultipleGenerationStatus(generationIds, authContext);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.errors).toEqual([
        { id: 'gen-2', error: 'Not found' }
      ]);
    });

    it('should handle complete failure', async () => {
      const generationIds = ['gen-1'];
      
      mockGenerationRepository.findById.mockRejectedValue(new Error('Database error'));

      const result = await service.checkMultipleGenerationStatus(generationIds, authContext);

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
      expect(result.errors).toEqual([
        { id: 'gen-1', error: 'Database error' }
      ]);
    });

    it('should handle empty generation IDs array', async () => {
      const result = await service.checkMultipleGenerationStatus([], authContext);

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
      expect(result.errors).toBeUndefined();
    });

    it('should handle non-Error exceptions in batch', async () => {
      const generationIds = ['gen-1'];
      
      mockGenerationRepository.findById.mockRejectedValue('String error');

      const result = await service.checkMultipleGenerationStatus(generationIds, authContext);

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
      expect(result.errors).toEqual([
        { id: 'gen-1', error: 'Status check failed' }
      ]);
    });
  });

  describe('Timeout Handling', () => {
    it('should not timeout recent generations', async () => {
      const recentGeneration = {
        ...mockGeneration,
        createdAt: new Date(Date.now() - 30000), // 30 seconds ago
        getStatus: vi.fn().mockReturnValue({ value: 'processing' })
      };

      mockGenerationRepository.findById.mockResolvedValue(
        success(recentGeneration)
      );

      mockProvider.checkStatus.mockResolvedValue({
        status: 'processing'
      });

      await service.checkGenerationStatus('gen-123', authContext);

      expect(recentGeneration.markAsFailed).not.toHaveBeenCalled();
    });

    it('should not timeout completed generations regardless of age', async () => {
      const oldCompletedGeneration = {
        ...mockGeneration,
        createdAt: new Date(Date.now() - 120000), // 2 minutes ago
        getStatus: vi.fn().mockReturnValue({ value: 'completed' })
      };

      mockGenerationRepository.findById.mockResolvedValue(
        success(oldCompletedGeneration)
      );

      await service.checkGenerationStatus('gen-123', authContext);

      expect(oldCompletedGeneration.markAsFailed).not.toHaveBeenCalled();
    });

    it('should timeout pending generations', async () => {
      const oldPendingGeneration = {
        ...mockGeneration,
        createdAt: new Date(Date.now() - 70000), // 70 seconds ago
        getStatus: vi.fn().mockReturnValue({ value: 'pending' })
      };

      mockGenerationRepository.findById.mockResolvedValue(
        success(oldPendingGeneration)
      );

      await service.checkGenerationStatus('gen-123', authContext);

      expect(oldPendingGeneration.markAsFailed).toHaveBeenCalledWith('Generation timed out');
    });
  });

  describe('Provider Communication', () => {
    it('should handle provider returning processing status', async () => {
      mockGenerationRepository.findById.mockResolvedValue(
        success(mockGeneration)
      );

      mockProvider.checkStatus.mockResolvedValue({
        status: 'processing'
      });

      await service.checkGenerationStatus('gen-123', authContext);

      // Should not update generation for processing status
      expect(mockGeneration.markAsCompleted).not.toHaveBeenCalled();
      expect(mockGeneration.markAsFailed).not.toHaveBeenCalled();
    });

    it('should handle provider communication errors', async () => {
      mockGenerationRepository.findById.mockResolvedValue(
        success(mockGeneration)
      );

      mockProvider.checkStatus.mockRejectedValue(new Error('Provider unavailable'));

      const result = await service.checkGenerationStatus('gen-123', authContext);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Provider unavailable');
    });

    it('should handle different provider types', async () => {
      const generationWithDifferentProvider = {
        ...mockGeneration,
        providerName: 'openai'
      };

      mockGenerationRepository.findById.mockResolvedValue(
        success(generationWithDifferentProvider)
      );

      mockProvider.checkStatus.mockResolvedValue({
        status: 'completed',
        imageUrl: 'https://example.com/image.png'
      });

      await service.checkGenerationStatus('gen-123', authContext);

      expect(mockProviderRegistry.getProvider).toHaveBeenCalledWith('openai');
    });
  });

  describe('Edge Cases', () => {
    it('should handle generation with undefined external provider ID', async () => {
      const generationWithoutExternalId = {
        ...mockGeneration,
        externalProviderId: undefined
      };

      mockGenerationRepository.findById.mockResolvedValue(
        success(generationWithoutExternalId)
      );

      await service.checkGenerationStatus('gen-123', authContext);

      expect(generationWithoutExternalId.markAsFailed).toHaveBeenCalledWith('Missing provider information');
    });

    it('should handle generation with empty string provider name', async () => {
      const generationWithEmptyProvider = {
        ...mockGeneration,
        providerName: ''
      };

      mockGenerationRepository.findById.mockResolvedValue(
        success(generationWithEmptyProvider)
      );

      await service.checkGenerationStatus('gen-123', authContext);

      expect(generationWithEmptyProvider.markAsFailed).toHaveBeenCalledWith('Missing provider information');
    });

    it('should handle provider returning unexpected status', async () => {
      mockGenerationRepository.findById.mockResolvedValue(
        success(mockGeneration)
      );

      mockProvider.checkStatus.mockResolvedValue({
        status: 'unknown_status'
      });

      await service.checkGenerationStatus('gen-123', authContext);

      // Should not update generation for unknown status
      expect(mockGeneration.markAsCompleted).not.toHaveBeenCalled();
      expect(mockGeneration.markAsFailed).not.toHaveBeenCalled();
    });
  });
});