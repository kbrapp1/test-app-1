import { describe, it, expect, beforeEach } from 'vitest';
import { Generation } from '../../entities/Generation';
import { GenerationStatus } from '../../value-objects/GenerationStatus';
import { GenerationStatusDomainService } from '../GenerationStatusDomainService';

// Mock generation factory for testing
const createMockGeneration = (
  status: string,
  createdAt: Date = new Date()
): Generation => {
  // Create a minimal mock that satisfies our testing needs
  return {
    getId: () => 'test-id',
    getStatus: () => ({ value: status } as GenerationStatus),
    createdAt,
  } as Generation;
};

describe('GenerationStatusDomainService', () => {
  
  describe('requiresPolling', () => {
    it('should require polling for pending generations', () => {
      const generation = createMockGeneration('pending');
      
      const result = GenerationStatusDomainService.requiresPolling(generation);
      
      expect(result).toBe(true);
    });

    it('should require polling for processing generations', () => {
      const generation = createMockGeneration('processing');
      
      const result = GenerationStatusDomainService.requiresPolling(generation);
      
      expect(result).toBe(true);
    });

    it('should not require polling for completed generations', () => {
      const generation = createMockGeneration('completed');
      
      const result = GenerationStatusDomainService.requiresPolling(generation);
      
      expect(result).toBe(false);
    });

    it('should not require polling for failed generations', () => {
      const generation = createMockGeneration('failed');
      
      const result = GenerationStatusDomainService.requiresPolling(generation);
      
      expect(result).toBe(false);
    });

    it('should not require polling for cancelled generations', () => {
      const generation = createMockGeneration('cancelled');
      
      const result = GenerationStatusDomainService.requiresPolling(generation);
      
      expect(result).toBe(false);
    });

    it('should not require polling for very old generations', () => {
      const oldDate = new Date(Date.now() - 10 * 60 * 1000); // 10 minutes ago
      const generation = createMockGeneration('pending', oldDate);
      
      const result = GenerationStatusDomainService.requiresPolling(generation);
      
      expect(result).toBe(false);
    });
  });

  describe('calculatePollingInterval', () => {
    it('should return 0 for terminal statuses', () => {
      const completedGeneration = createMockGeneration('completed');
      
      const interval = GenerationStatusDomainService.calculatePollingInterval(completedGeneration);
      
      expect(interval).toBe(0);
    });

    it('should return rapid polling interval for new generations', () => {
      const newGeneration = createMockGeneration('pending', new Date());
      
      const interval = GenerationStatusDomainService.calculatePollingInterval(newGeneration);
      
      expect(interval).toBe(2000); // 2 seconds
    });

    it('should return standard polling interval for medium-age generations', () => {
      const mediumAgeDate = new Date(Date.now() - 45 * 1000); // 45 seconds ago
      const generation = createMockGeneration('processing', mediumAgeDate);
      
      const interval = GenerationStatusDomainService.calculatePollingInterval(generation);
      
      expect(interval).toBe(5000); // 5 seconds
    });

    it('should return slower polling interval for older generations', () => {
      const olderDate = new Date(Date.now() - 90 * 1000); // 90 seconds ago
      const generation = createMockGeneration('processing', olderDate);
      
      const interval = GenerationStatusDomainService.calculatePollingInterval(generation);
      
      expect(interval).toBe(10000); // 10 seconds
    });
  });

  describe('shouldTimeout', () => {
    it('should timeout active generations older than threshold', () => {
      const oldDate = new Date(Date.now() - 90 * 1000); // 90 seconds ago
      const generation = createMockGeneration('processing', oldDate);
      
      const shouldTimeout = GenerationStatusDomainService.shouldTimeout(generation);
      
      expect(shouldTimeout).toBe(true);
    });

    it('should not timeout recent active generations', () => {
      const recentDate = new Date(Date.now() - 30 * 1000); // 30 seconds ago
      const generation = createMockGeneration('processing', recentDate);
      
      const shouldTimeout = GenerationStatusDomainService.shouldTimeout(generation);
      
      expect(shouldTimeout).toBe(false);
    });

    it('should not timeout terminal status generations', () => {
      const oldDate = new Date(Date.now() - 90 * 1000); // 90 seconds ago
      const generation = createMockGeneration('completed', oldDate);
      
      const shouldTimeout = GenerationStatusDomainService.shouldTimeout(generation);
      
      expect(shouldTimeout).toBe(false);
    });
  });

  describe('shouldStopMonitoring', () => {
    it('should stop monitoring terminal status generations', () => {
      const generation = createMockGeneration('completed');
      
      const shouldStop = GenerationStatusDomainService.shouldStopMonitoring(generation);
      
      expect(shouldStop).toBe(true);
    });

    it('should stop monitoring very old active generations', () => {
      const veryOldDate = new Date(Date.now() - 10 * 60 * 1000); // 10 minutes ago
      const generation = createMockGeneration('processing', veryOldDate);
      
      const shouldStop = GenerationStatusDomainService.shouldStopMonitoring(generation);
      
      expect(shouldStop).toBe(true);
    });

    it('should not stop monitoring recent active generations', () => {
      const recentDate = new Date(Date.now() - 2 * 60 * 1000); // 2 minutes ago
      const generation = createMockGeneration('processing', recentDate);
      
      const shouldStop = GenerationStatusDomainService.shouldStopMonitoring(generation);
      
      expect(shouldStop).toBe(false);
    });
  });

  describe('getPollingPriority', () => {
    it('should return none for terminal statuses', () => {
      const generation = createMockGeneration('completed');
      
      const priority = GenerationStatusDomainService.getPollingPriority(generation);
      
      expect(priority).toBe('none');
    });

    it('should return high priority for new active generations', () => {
      const newGeneration = createMockGeneration('pending', new Date());
      
      const priority = GenerationStatusDomainService.getPollingPriority(newGeneration);
      
      expect(priority).toBe('high');
    });

    it('should return medium priority for active generations', () => {
      const mediumAgeDate = new Date(Date.now() - 45 * 1000); // 45 seconds ago
      const generation = createMockGeneration('processing', mediumAgeDate);
      
      const priority = GenerationStatusDomainService.getPollingPriority(generation);
      
      expect(priority).toBe('medium');
    });

    it('should return low priority for older active generations', () => {
      const olderDate = new Date(Date.now() - 90 * 1000); // 90 seconds ago
      const generation = createMockGeneration('processing', olderDate);
      
      const priority = GenerationStatusDomainService.getPollingPriority(generation);
      
      expect(priority).toBe('low');
    });
  });

  describe('canBatchTogether', () => {
    it('should not batch single generation', () => {
      const generation = createMockGeneration('pending');
      
      const canBatch = GenerationStatusDomainService.canBatchTogether([generation]);
      
      expect(canBatch).toBe(false);
    });

    it('should not batch if any generation is not active', () => {
      const activeGeneration = createMockGeneration('pending');
      const completedGeneration = createMockGeneration('completed');
      
      const canBatch = GenerationStatusDomainService.canBatchTogether([
        activeGeneration,
        completedGeneration
      ]);
      
      expect(canBatch).toBe(false);
    });

    it('should batch multiple active generations with similar priority', () => {
      const generation1 = createMockGeneration('pending', new Date());
      const generation2 = createMockGeneration('processing', new Date());
      
      const canBatch = GenerationStatusDomainService.canBatchTogether([
        generation1,
        generation2
      ]);
      
      expect(canBatch).toBe(true);
    });
  });

  describe('getOptimalBatchSize', () => {
    it('should return 1 for single generation', () => {
      const batchSize = GenerationStatusDomainService.getOptimalBatchSize(1);
      
      expect(batchSize).toBe(1);
    });

    it('should return actual count for small batches', () => {
      const batchSize = GenerationStatusDomainService.getOptimalBatchSize(3);
      
      expect(batchSize).toBe(3);
    });

    it('should limit medium batches to 10', () => {
      const batchSize = GenerationStatusDomainService.getOptimalBatchSize(15);
      
      expect(batchSize).toBe(10);
    });

    it('should limit large batches to 15', () => {
      const batchSize = GenerationStatusDomainService.getOptimalBatchSize(30);
      
      expect(batchSize).toBe(15);
    });
  });
}); 