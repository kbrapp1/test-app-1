import { describe, it, expect } from 'vitest';
import { Generation } from '../../entities/Generation';
import { GenerationStatus } from '../../value-objects/GenerationStatus';
import { GenerationPollingSpecification } from '../GenerationPollingSpecification';

// Mock generation factory for testing
const createMockGeneration = (
  status: string,
  createdAt: Date = new Date()
): Generation => {
  return {
    getId: () => 'test-id',
    getStatus: () => ({ value: status } as GenerationStatus),
    createdAt,
  } as Generation;
};

describe('GenerationPollingSpecification', () => {

  describe('isSatisfiedBy', () => {
    it('should be satisfied by active generations', () => {
      const pendingGeneration = createMockGeneration('pending');
      const processingGeneration = createMockGeneration('processing');

      expect(GenerationPollingSpecification.isSatisfiedBy(pendingGeneration)).toBe(true);
      expect(GenerationPollingSpecification.isSatisfiedBy(processingGeneration)).toBe(true);
    });

    it('should not be satisfied by terminal generations', () => {
      const completedGeneration = createMockGeneration('completed');
      const failedGeneration = createMockGeneration('failed');
      const cancelledGeneration = createMockGeneration('cancelled');

      expect(GenerationPollingSpecification.isSatisfiedBy(completedGeneration)).toBe(false);
      expect(GenerationPollingSpecification.isSatisfiedBy(failedGeneration)).toBe(false);
      expect(GenerationPollingSpecification.isSatisfiedBy(cancelledGeneration)).toBe(false);
    });

    it('should not be satisfied by very old generations', () => {
      const oldDate = new Date(Date.now() - 10 * 60 * 1000); // 10 minutes ago
      const oldGeneration = createMockGeneration('pending', oldDate);

      expect(GenerationPollingSpecification.isSatisfiedBy(oldGeneration)).toBe(false);
    });
  });

  describe('canBeBatched', () => {
    it('should not allow batching single generation', () => {
      const generation = createMockGeneration('pending');

      const result = GenerationPollingSpecification.canBeBatched([generation]);

      expect(result).toBe(false);
    });

    it('should not allow batching if any generation does not satisfy polling criteria', () => {
      const activeGeneration = createMockGeneration('pending');
      const completedGeneration = createMockGeneration('completed');

      const result = GenerationPollingSpecification.canBeBatched([
        activeGeneration,
        completedGeneration
      ]);

      expect(result).toBe(false);
    });

    it('should allow batching multiple active generations', () => {
      const generation1 = createMockGeneration('pending', new Date());
      const generation2 = createMockGeneration('processing', new Date());

      const result = GenerationPollingSpecification.canBeBatched([
        generation1,
        generation2
      ]);

      expect(result).toBe(true);
    });

    it('should not allow batching mixed priority generations', () => {
      const highPriorityGeneration = createMockGeneration('pending', new Date());
      const lowPriorityGeneration = createMockGeneration('processing', 
        new Date(Date.now() - 2 * 60 * 1000) // 2 minutes ago
      );

      const result = GenerationPollingSpecification.canBeBatched([
        highPriorityGeneration,
        lowPriorityGeneration
      ]);

      expect(result).toBe(false);
    });
  });

  describe('filterHighPriority', () => {
    it('should filter only high priority generations', () => {
      const highPriority1 = createMockGeneration('pending', new Date());
      const highPriority2 = createMockGeneration('processing', new Date());
      const mediumPriority = createMockGeneration('processing', 
        new Date(Date.now() - 45 * 1000) // 45 seconds ago
      );
      const lowPriority = createMockGeneration('processing', 
        new Date(Date.now() - 2 * 60 * 1000) // 2 minutes ago
      );

      const generations = [highPriority1, mediumPriority, highPriority2, lowPriority];
      const result = GenerationPollingSpecification.filterHighPriority(generations);

      expect(result).toHaveLength(2);
      expect(result).toContain(highPriority1);
      expect(result).toContain(highPriority2);
    });

    it('should return empty array when no high priority generations exist', () => {
      const mediumPriority = createMockGeneration('processing', 
        new Date(Date.now() - 45 * 1000)
      );
      const completedGeneration = createMockGeneration('completed');

      const result = GenerationPollingSpecification.filterHighPriority([
        mediumPriority,
        completedGeneration
      ]);

      expect(result).toHaveLength(0);
    });
  });

  describe('filterMediumPriority', () => {
    it('should filter only medium priority generations', () => {
      const highPriority = createMockGeneration('pending', new Date());
      const mediumPriority1 = createMockGeneration('processing', 
        new Date(Date.now() - 45 * 1000) // 45 seconds ago
      );
      const mediumPriority2 = createMockGeneration('pending', 
        new Date(Date.now() - 50 * 1000) // 50 seconds ago
      );
      const lowPriority = createMockGeneration('processing', 
        new Date(Date.now() - 2 * 60 * 1000) // 2 minutes ago
      );

      const generations = [highPriority, mediumPriority1, mediumPriority2, lowPriority];
      const result = GenerationPollingSpecification.filterMediumPriority(generations);

      expect(result).toHaveLength(2);
      expect(result).toContain(mediumPriority1);
      expect(result).toContain(mediumPriority2);
    });
  });

  describe('filterLowPriority', () => {
    it('should filter only low priority generations', () => {
      const highPriority = createMockGeneration('pending', new Date());
      const mediumPriority = createMockGeneration('processing', 
        new Date(Date.now() - 45 * 1000)
      );
      const lowPriority1 = createMockGeneration('processing', 
        new Date(Date.now() - 2 * 60 * 1000) // 2 minutes ago
      );
      const lowPriority2 = createMockGeneration('pending', 
        new Date(Date.now() - 3 * 60 * 1000) // 3 minutes ago
      );

      const generations = [highPriority, mediumPriority, lowPriority1, lowPriority2];
      const result = GenerationPollingSpecification.filterLowPriority(generations);

      expect(result).toHaveLength(2);
      expect(result).toContain(lowPriority1);
      expect(result).toContain(lowPriority2);
    });
  });

  describe('shouldExcludeFromPolling', () => {
    it('should exclude generations that should timeout', () => {
      const oldGeneration = createMockGeneration('processing', 
        new Date(Date.now() - 2 * 60 * 1000) // 2 minutes ago
      );

      const result = GenerationPollingSpecification.shouldExcludeFromPolling(oldGeneration);

      expect(result).toBe(true);
    });

    it('should exclude generations that should stop monitoring', () => {
      const completedGeneration = createMockGeneration('completed');

      const result = GenerationPollingSpecification.shouldExcludeFromPolling(completedGeneration);

      expect(result).toBe(true);
    });

    it('should not exclude recent active generations', () => {
      const recentGeneration = createMockGeneration('processing', new Date());

      const result = GenerationPollingSpecification.shouldExcludeFromPolling(recentGeneration);

      expect(result).toBe(false);
    });
  });

  describe('groupByPollingStrategy', () => {
    it('should correctly group generations by priority', () => {
      const highPriority = createMockGeneration('pending', new Date()); // <30s = high
      const mediumPriority = createMockGeneration('processing', 
        new Date(Date.now() - 45 * 1000) // 45s = medium (30s < age < 60s)
      );
      const completed = createMockGeneration('completed');
      const veryOld = createMockGeneration('pending', 
        new Date(Date.now() - 10 * 60 * 1000)
      );

      const generations = [highPriority, mediumPriority, completed, veryOld];
      const result = GenerationPollingSpecification.groupByPollingStrategy(generations);

      expect(result.highPriority).toHaveLength(1);
      expect(result.highPriority).toContain(highPriority);

      expect(result.mediumPriority).toHaveLength(1);
      expect(result.mediumPriority).toContain(mediumPriority);

      expect(result.lowPriority).toHaveLength(0); // No low priority in this test

      expect(result.excluded).toHaveLength(2);
      expect(result.excluded).toContain(completed);
      expect(result.excluded).toContain(veryOld);
    });

    it('should handle empty input array', () => {
      const result = GenerationPollingSpecification.groupByPollingStrategy([]);

      expect(result.highPriority).toHaveLength(0);
      expect(result.mediumPriority).toHaveLength(0);
      expect(result.lowPriority).toHaveLength(0);
      expect(result.excluded).toHaveLength(0);
    });
  });

  describe('calculateGroupPollingInterval', () => {
    it('should return 0 for empty group', () => {
      const result = GenerationPollingSpecification.calculateGroupPollingInterval([]);

      expect(result).toBe(0);
    });

    it('should return individual interval for single generation', () => {
      const generation = createMockGeneration('pending', new Date());

      const result = GenerationPollingSpecification.calculateGroupPollingInterval([generation]);

      expect(result).toBe(2000); // High priority interval
    });

    it('should return shortest interval for multiple generations', () => {
      const highPriority = createMockGeneration('pending', new Date()); // 2 seconds
      const lowPriority = createMockGeneration('processing', 
        new Date(Date.now() - 2 * 60 * 1000) // 10 seconds
      );

      const result = GenerationPollingSpecification.calculateGroupPollingInterval([
        highPriority, 
        lowPriority
      ]);

      expect(result).toBe(2000); // Shortest interval
    });

    it('should return 0 if all generations are terminal', () => {
      const completed1 = createMockGeneration('completed');
      const completed2 = createMockGeneration('failed');

      const result = GenerationPollingSpecification.calculateGroupPollingInterval([
        completed1, 
        completed2
      ]);

      expect(result).toBe(0);
    });
  });

  describe('validatePollingConfiguration', () => {
    it('should validate reasonable polling configuration', () => {
      const result = GenerationPollingSpecification.validatePollingConfiguration(5, 3000);

      expect(result.isValid).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it('should reject overly aggressive polling intervals', () => {
      const result = GenerationPollingSpecification.validatePollingConfiguration(5, 500);

      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('too aggressive');
    });

    it('should reject excessive batch sizes', () => {
      const result = GenerationPollingSpecification.validatePollingConfiguration(30, 3000);

      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('exceeds maximum');
    });

    it('should warn about large but acceptable batch sizes', () => {
      const result = GenerationPollingSpecification.validatePollingConfiguration(20, 3000);

      expect(result.isValid).toBe(true);
      expect(result.reason).toContain('may impact performance');
    });

    it('should validate zero generations', () => {
      const result = GenerationPollingSpecification.validatePollingConfiguration(0, 0);

      expect(result.isValid).toBe(true);
    });
  });
}); 