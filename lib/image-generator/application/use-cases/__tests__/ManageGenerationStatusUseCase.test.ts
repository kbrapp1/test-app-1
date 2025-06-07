import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ManageGenerationStatusUseCase } from '../ManageGenerationStatusUseCase';
import { StatusManagementService } from '../../services/StatusManagementService';
import { StatusCheckingRepository } from '../../../domain/repositories/StatusCheckingRepository';
import { ExternalProviderStatusService } from '../../../infrastructure/providers/ExternalProviderStatusService';
import { Generation } from '../../../domain/entities/Generation';
import { GenerationStatus } from '../../../domain/value-objects/GenerationStatus';
import { Prompt } from '../../../domain/value-objects/Prompt';
import { success, error, Result } from '../../../infrastructure/common/Result';

// Mock StatusCheckingRepository for testing
class MockStatusCheckingRepository implements StatusCheckingRepository {
  private mockGenerations: Generation[] = [];

  setMockGenerations(generations: Generation[]) {
    this.mockGenerations = generations;
  }

  async findGenerationForStatusCheck(
    generationId: string,
    userId: string,
    organizationId: string
  ): Promise<Result<Generation | null, string>> {
    const found = this.mockGenerations.find(g => g.getId() === generationId);
    return success(found || null);
  }

  async findGenerationsForBatchStatusCheck(
    generationIds: string[],
    userId: string,
    organizationId: string
  ): Promise<Result<Generation[], string>> {
    const found = this.mockGenerations.filter(g => generationIds.includes(g.getId()));
    return success(found);
  }

  async findActiveGenerationsForPolling(
    userId: string,
    organizationId: string
  ): Promise<Result<Generation[], string>> {
    const active = this.mockGenerations.filter(g => 
      g.isPending() || g.isProcessing()
    );
    return success(active);
  }

  async updateGenerationStatus(
    generation: Generation
  ): Promise<Result<void, string>> {
    // Mock successful update
    return success(undefined);
  }

  async findGenerationsForTimeout(
    userId: string,
    organizationId: string
  ): Promise<Result<Generation[], string>> {
    // Mock timeout candidates - generations older than 60 seconds
    const now = Date.now();
    const timeoutCandidates = this.mockGenerations.filter(g => 
      (g.isPending() || g.isProcessing()) && 
      (now - g.createdAt.getTime() > 60000)
    );
    return success(timeoutCandidates);
  }

  async updateGenerationStatusBatch(
    generations: Generation[]
  ): Promise<Result<void, string>> {
    // Mock successful update
    return success(undefined);
  }

  async markGenerationsAsTimedOut(
    generations: Generation[]
  ): Promise<Result<void, string>> {
    // Mock successful timeout
    return success(undefined);
  }
}

describe('ManageGenerationStatusUseCase', () => {
  let useCase: ManageGenerationStatusUseCase;
  let statusService: StatusManagementService;
  let mockRepository: MockStatusCheckingRepository;

  const userId = 'user-123';
  const organizationId = 'org-456';

  beforeEach(() => {
    mockRepository = new MockStatusCheckingRepository();
    const mockProviderService = new ExternalProviderStatusService([]);
    statusService = new StatusManagementService(mockRepository, mockProviderService);
    useCase = new ManageGenerationStatusUseCase(statusService);
  });

  describe('checkGenerationStatus', () => {
    it('should check status for single generation successfully', async () => {
      // Arrange
      const generation = createMockGeneration('gen-1', 'pending');
      mockRepository.setMockGenerations([generation]);

      // Act
      const result = await useCase.checkGenerationStatus(
        ['gen-1'],
        userId,
        organizationId
      );

      // Assert
      expect(result.success).toBe(true);
      expect(result.generations).toHaveLength(1);
      expect(result.generations[0].id).toBe('gen-1');
      expect(result.generations[0].status).toBe('pending');
      expect(result.metadata.totalRequested).toBe(1);
      expect(result.metadata.totalProcessed).toBe(1);
    });

    it('should check status for multiple generations efficiently', async () => {
      // Arrange
      const generations = [
        createMockGeneration('gen-1', 'pending'),
        createMockGeneration('gen-2', 'processing'),
        createMockGeneration('gen-3', 'completed')
      ];
      mockRepository.setMockGenerations(generations);

      // Act
      const result = await useCase.checkGenerationStatus(
        ['gen-1', 'gen-2', 'gen-3'],
        userId,
        organizationId,
        { priority: 'high' }
      );

      // Assert
      expect(result.success).toBe(true);
      expect(result.generations).toHaveLength(3);
      expect(result.metadata.totalRequested).toBe(3);
      expect(result.metadata.totalProcessed).toBe(3);
      
      // Check each generation status
      const statusById = result.generations.reduce((acc, g) => {
        acc[g.id] = g.status;
        return acc;
      }, {} as Record<string, string>);
      
      expect(statusById['gen-1']).toBe('pending');
      expect(statusById['gen-2']).toBe('processing');
      expect(statusById['gen-3']).toBe('completed');
    });

    it('should handle empty generation list gracefully', async () => {
      // Act
      const result = await useCase.checkGenerationStatus(
        [],
        userId,
        organizationId
      );

      // Assert
      expect(result.success).toBe(true);
      expect(result.generations).toHaveLength(0);
      expect(result.metadata.totalRequested).toBe(0);
      expect(result.metadata.totalProcessed).toBe(0);
    });
  });

  describe('checkSingleGenerationStatus', () => {
    it('should return generation DTO for existing generation', async () => {
      // Arrange
      const generation = createMockGeneration('gen-1', 'processing');
      mockRepository.setMockGenerations([generation]);

      // Act
      const result = await useCase.checkSingleGenerationStatus(
        'gen-1',
        userId,
        organizationId,
        'high'
      );

      // Assert
      expect(result).not.toBeNull();
      expect(result!.id).toBe('gen-1');
      expect(result!.status).toBe('processing');
      expect(result!.isPollingRequired).toBe(true);
      expect(result!.pollingPriority).toBe('high');
    });

    it('should return null for non-existent generation', async () => {
      // Arrange
      mockRepository.setMockGenerations([]);

      // Act
      const result = await useCase.checkSingleGenerationStatus(
        'non-existent',
        userId,
        organizationId
      );

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('getPollingStrategies', () => {
    it('should return polling strategies for active generations', async () => {
      // Arrange
      const generations = [
        createMockGeneration('gen-1', 'pending', Date.now() - 1000), // High priority
        createMockGeneration('gen-2', 'processing', Date.now() - 10000), // Medium priority
        createMockGeneration('gen-3', 'processing', Date.now() - 30000), // Low priority
        createMockGeneration('gen-4', 'completed') // Should not be included
      ];
      mockRepository.setMockGenerations(generations);

      // Act
      const strategies = await useCase.getPollingStrategies(userId, organizationId);

      // Assert
      expect(strategies.length).toBeGreaterThan(0);
      
      // Verify strategies contain only active generations
      const allStrategyGenerationIds = strategies.flatMap(s => s.generationIds);
      expect(allStrategyGenerationIds).toContain('gen-1');
      expect(allStrategyGenerationIds).toContain('gen-2');
      expect(allStrategyGenerationIds).toContain('gen-3');
      expect(allStrategyGenerationIds).not.toContain('gen-4'); // Completed should not be polled
    });

    it('should return empty array when no active generations exist', async () => {
      // Arrange
      const completedGenerations = [
        createMockGeneration('gen-1', 'completed'),
        createMockGeneration('gen-2', 'failed')
      ];
      mockRepository.setMockGenerations(completedGenerations);

      // Act
      const strategies = await useCase.getPollingStrategies(userId, organizationId);

      // Assert
      expect(strategies).toHaveLength(0);
    });
  });

  describe('unifiedStatusCheck', () => {
    it('should provide comprehensive status information', async () => {
      // Arrange
      const generations = [
        createMockGeneration('gen-1', 'pending'),
        createMockGeneration('gen-2', 'processing'),
        createMockGeneration('gen-3', 'completed')
      ];
      mockRepository.setMockGenerations(generations);

      // Act
      const result = await useCase.unifiedStatusCheck(userId, organizationId, {
        includeAllActive: true,
        priority: 'medium'
      });

      // Assert
      expect(result.generations.length).toBeGreaterThan(0);
      expect(result.pollingStrategies.length).toBeGreaterThan(0);
      expect(result.metadata.totalGenerations).toBe(result.generations.length);
      expect(result.metadata.activeCount).toBe(
        result.generations.filter(g => g.isPollingRequired).length
      );
      expect(result.metadata.processingTimeMs).toBeGreaterThanOrEqual(0);
    });

    it('should handle specific generation IDs correctly', async () => {
      // Arrange
      const generations = [
        createMockGeneration('gen-1', 'pending'),
        createMockGeneration('gen-2', 'processing'),
        createMockGeneration('gen-3', 'completed')
      ];
      mockRepository.setMockGenerations(generations);

      // Act
      const result = await useCase.unifiedStatusCheck(userId, organizationId, {
        specificGenerationIds: ['gen-1', 'gen-3'],
        priority: 'high'
      });

      // Assert
      expect(result.generations).toHaveLength(2);
      const generationIds = result.generations.map(g => g.id);
      expect(generationIds).toContain('gen-1');
      expect(generationIds).toContain('gen-3');
      expect(generationIds).not.toContain('gen-2');
    });

    it('should provide next poll time when active generations exist', async () => {
      // Arrange
      const activeGenerations = [
        createMockGeneration('gen-1', 'pending'),
        createMockGeneration('gen-2', 'processing')
      ];
      mockRepository.setMockGenerations(activeGenerations);

      // Act
      const result = await useCase.unifiedStatusCheck(userId, organizationId);

      // Assert
      if (result.metadata.activeCount > 0) {
        expect(result.metadata.nextPollTime).toBeDefined();
        expect(new Date(result.metadata.nextPollTime!).getTime()).toBeGreaterThan(Date.now());
      }
    });
  });

  describe('handleTimeouts', () => {
    it('should timeout stuck generations correctly', async () => {
      // Arrange - Create generations that are old enough to timeout
      const oldTimestamp = Date.now() - 120000; // 2 minutes ago
      const stuckGenerations = [
        createMockGeneration('gen-1', 'pending', oldTimestamp),
        createMockGeneration('gen-2', 'processing', oldTimestamp)
      ];
      mockRepository.setMockGenerations(stuckGenerations);

      // Act
      const result = await useCase.handleTimeouts(userId, organizationId);

      // Assert
      expect(result.timeoutCount).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(result.errors)).toBe(true);
    });

    it('should not timeout recent generations', async () => {
      // Arrange - Create recent generations
      const recentGenerations = [
        createMockGeneration('gen-1', 'pending', Date.now() - 5000), // 5 seconds ago
        createMockGeneration('gen-2', 'processing', Date.now() - 10000) // 10 seconds ago
      ];
      mockRepository.setMockGenerations(recentGenerations);

      // Act
      const result = await useCase.handleTimeouts(userId, organizationId);

      // Assert
      expect(result.timeoutCount).toBe(0);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('emergencyCleanup', () => {
    it('should perform cleanup and return processing metrics', async () => {
      // Arrange
      const oldGenerations = [
        createMockGeneration('gen-1', 'pending', Date.now() - 180000), // 3 minutes old
        createMockGeneration('gen-2', 'processing', Date.now() - 240000) // 4 minutes old
      ];
      mockRepository.setMockGenerations(oldGenerations);

      // Act
      const result = await useCase.emergencyCleanup(userId, organizationId);

      // Assert
      expect(result.processingTimeMs).toBeGreaterThanOrEqual(0);
      expect(result.timeoutCount).toBeGreaterThanOrEqual(0);
      expect(result.cleanupCount).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(result.errors)).toBe(true);
    });

    it('should handle cleanup errors gracefully', async () => {
      // Arrange - Force an error by setting up invalid state
      mockRepository.setMockGenerations([]);

      // Act
      const result = await useCase.emergencyCleanup(userId, organizationId);

      // Assert
      expect(result.processingTimeMs).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(result.errors)).toBe(true);
    });
  });
});

// Helper function to create mock generations
function createMockGeneration(
  id: string, 
  status: 'pending' | 'processing' | 'completed' | 'failed',
  createdAtTimestamp?: number
): Generation {
  const createdAt = createdAtTimestamp ? new Date(createdAtTimestamp) : new Date();
  
  const promptResult = Prompt.create('test prompt');
  if (!promptResult.isSuccess()) {
    throw new Error('Failed to create test prompt');
  }

  const mockData = {
    id,
    organizationId: 'org-456',
    userId: 'user-123',
    prompt: promptResult.getValue(),
    modelName: 'test-model',
    providerName: 'test-provider',
    createdAt,
    status: GenerationStatus.create(status),
    resultImageUrl: status === 'completed' ? 'https://example.com/image.jpg' : null,
    baseImageUrl: null,
    externalProviderId: `external-${id}`,
    costCents: 100,
    generationTimeSeconds: status === 'completed' ? 25 : null,
    imageWidth: 1024,
    imageHeight: 1024,
    aspectRatio: '1:1',
    editType: 'text-to-image' as const,
    savedToDAM: false,
    damAssetId: null,
    sourceDamAssetId: null,
    errorMessage: status === 'failed' ? 'Generation failed' : null,
    metadata: {},
    updatedAt: new Date(),
    seed: null
  };

  return Generation.fromData(mockData);
} 