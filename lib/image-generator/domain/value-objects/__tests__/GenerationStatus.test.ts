import { describe, it, expect } from 'vitest';
import { GenerationStatus } from '../GenerationStatus';

describe('GenerationStatus', () => {
  describe('create', () => {
    it('should create valid statuses', () => {
      const pending = GenerationStatus.create('pending');
      expect(pending.value).toBe('pending');

      const processing = GenerationStatus.create('processing');
      expect(processing.value).toBe('processing');

      const completed = GenerationStatus.create('completed');
      expect(completed.value).toBe('completed');

      const failed = GenerationStatus.create('failed');
      expect(failed.value).toBe('failed');

      const cancelled = GenerationStatus.create('cancelled');
      expect(cancelled.value).toBe('cancelled');
    });

    it('should throw error for invalid status', () => {
      expect(() => GenerationStatus.create('invalid')).toThrow('Invalid generation status: invalid');
      expect(() => GenerationStatus.create('')).toThrow('Invalid generation status');
      expect(() => GenerationStatus.create('PENDING')).toThrow('Invalid generation status: PENDING');
    });
  });

  describe('static factory methods', () => {
    it('should create pending status', () => {
      const status = GenerationStatus.pending();
      expect(status.value).toBe('pending');
    });

    it('should create processing status', () => {
      const status = GenerationStatus.processing();
      expect(status.value).toBe('processing');
    });

    it('should create completed status', () => {
      const status = GenerationStatus.completed();
      expect(status.value).toBe('completed');
    });

    it('should create failed status', () => {
      const status = GenerationStatus.failed();
      expect(status.value).toBe('failed');
    });

    it('should create cancelled status', () => {
      const status = GenerationStatus.cancelled();
      expect(status.value).toBe('cancelled');
    });
  });

  describe('status transitions', () => {
    it('should allow valid transitions from pending', () => {
      const pending = GenerationStatus.pending();
      
      expect(pending.canTransitionTo(GenerationStatus.processing())).toBe(true);
      expect(pending.canTransitionTo(GenerationStatus.failed())).toBe(true);
      expect(pending.canTransitionTo(GenerationStatus.cancelled())).toBe(true);
      expect(pending.canTransitionTo(GenerationStatus.completed())).toBe(false);
    });

    it('should allow valid transitions from processing', () => {
      const processing = GenerationStatus.processing();
      
      expect(processing.canTransitionTo(GenerationStatus.completed())).toBe(true);
      expect(processing.canTransitionTo(GenerationStatus.failed())).toBe(true);
      expect(processing.canTransitionTo(GenerationStatus.cancelled())).toBe(true);
      expect(processing.canTransitionTo(GenerationStatus.pending())).toBe(false);
    });

    it('should not allow transitions from terminal states', () => {
      const completed = GenerationStatus.completed();
      const failed = GenerationStatus.failed();
      const cancelled = GenerationStatus.cancelled();

      // Completed cannot transition anywhere
      expect(completed.canTransitionTo(GenerationStatus.pending())).toBe(false);
      expect(completed.canTransitionTo(GenerationStatus.processing())).toBe(false);
      expect(completed.canTransitionTo(GenerationStatus.failed())).toBe(false);
      expect(completed.canTransitionTo(GenerationStatus.cancelled())).toBe(false);

      // Failed cannot transition anywhere
      expect(failed.canTransitionTo(GenerationStatus.pending())).toBe(false);
      expect(failed.canTransitionTo(GenerationStatus.processing())).toBe(false);
      expect(failed.canTransitionTo(GenerationStatus.completed())).toBe(false);
      expect(failed.canTransitionTo(GenerationStatus.cancelled())).toBe(false);

      // Cancelled cannot transition anywhere
      expect(cancelled.canTransitionTo(GenerationStatus.pending())).toBe(false);
      expect(cancelled.canTransitionTo(GenerationStatus.processing())).toBe(false);
      expect(cancelled.canTransitionTo(GenerationStatus.completed())).toBe(false);
      expect(cancelled.canTransitionTo(GenerationStatus.failed())).toBe(false);
    });
  });

  describe('terminal state checking', () => {
    it('should identify terminal states', () => {
      expect(GenerationStatus.completed().isTerminal()).toBe(true);
      expect(GenerationStatus.failed().isTerminal()).toBe(true);
      expect(GenerationStatus.cancelled().isTerminal()).toBe(true);
    });

    it('should identify non-terminal states', () => {
      expect(GenerationStatus.pending().isTerminal()).toBe(false);
      expect(GenerationStatus.processing().isTerminal()).toBe(false);
    });
  });

  describe('display methods', () => {
    it('should return correct display text', () => {
      expect(GenerationStatus.pending().getDisplayText()).toBe('Pending');
      expect(GenerationStatus.processing().getDisplayText()).toBe('Processing');
      expect(GenerationStatus.completed().getDisplayText()).toBe('Completed');
      expect(GenerationStatus.failed().getDisplayText()).toBe('Failed');
      expect(GenerationStatus.cancelled().getDisplayText()).toBe('Cancelled');
    });

    it('should return correct progress percentages', () => {
      expect(GenerationStatus.pending().getProgressPercentage()).toBe(0);
      expect(GenerationStatus.processing().getProgressPercentage()).toBe(50);
      expect(GenerationStatus.completed().getProgressPercentage()).toBe(100);
      expect(GenerationStatus.failed().getProgressPercentage()).toBe(0);
      expect(GenerationStatus.cancelled().getProgressPercentage()).toBe(0);
    });

    it('should return correct color codes', () => {
      expect(GenerationStatus.pending().getColorCode()).toBe('#f59e0b');
      expect(GenerationStatus.processing().getColorCode()).toBe('#3b82f6');
      expect(GenerationStatus.completed().getColorCode()).toBe('#10b981');
      expect(GenerationStatus.failed().getColorCode()).toBe('#ef4444');
      expect(GenerationStatus.cancelled().getColorCode()).toBe('#6b7280');
    });

    it('should return correct icons', () => {
      expect(GenerationStatus.pending().getIcon()).toBe('⏳');
      expect(GenerationStatus.processing().getIcon()).toBe('🔄');
      expect(GenerationStatus.completed().getIcon()).toBe('✅');
      expect(GenerationStatus.failed().getIcon()).toBe('❌');
      expect(GenerationStatus.cancelled().getIcon()).toBe('⏹️');
    });

    it('should return meaningful descriptions', () => {
      expect(GenerationStatus.pending().getDescription()).toContain('queued');
      expect(GenerationStatus.processing().getDescription()).toContain('generating');
      expect(GenerationStatus.completed().getDescription()).toContain('completed successfully');
      expect(GenerationStatus.failed().getDescription()).toContain('failed');
      expect(GenerationStatus.cancelled().getDescription()).toContain('cancelled');
    });
  });

  describe('utility methods', () => {
    it('should identify success status', () => {
      expect(GenerationStatus.completed().isSuccess()).toBe(true);
      expect(GenerationStatus.pending().isSuccess()).toBe(false);
      expect(GenerationStatus.processing().isSuccess()).toBe(false);
      expect(GenerationStatus.failed().isSuccess()).toBe(false);
      expect(GenerationStatus.cancelled().isSuccess()).toBe(false);
    });

    it('should identify error status', () => {
      expect(GenerationStatus.failed().isError()).toBe(true);
      expect(GenerationStatus.pending().isError()).toBe(false);
      expect(GenerationStatus.processing().isError()).toBe(false);
      expect(GenerationStatus.completed().isError()).toBe(false);
      expect(GenerationStatus.cancelled().isError()).toBe(false);
    });

    it('should identify in-progress status', () => {
      expect(GenerationStatus.pending().isInProgress()).toBe(true);
      expect(GenerationStatus.processing().isInProgress()).toBe(true);
      expect(GenerationStatus.completed().isInProgress()).toBe(false);
      expect(GenerationStatus.failed().isInProgress()).toBe(false);
      expect(GenerationStatus.cancelled().isInProgress()).toBe(false);
    });
  });

  describe('equality', () => {
    it('should compare statuses correctly', () => {
      const pending1 = GenerationStatus.pending();
      const pending2 = GenerationStatus.pending();
      const processing = GenerationStatus.processing();

      expect(pending1.equals(pending2)).toBe(true);
      expect(pending1.equals(processing)).toBe(false);
    });
  });

  describe('toString', () => {
    it('should return status value as string', () => {
      expect(GenerationStatus.pending().toString()).toBe('pending');
      expect(GenerationStatus.processing().toString()).toBe('processing');
      expect(GenerationStatus.completed().toString()).toBe('completed');
      expect(GenerationStatus.failed().toString()).toBe('failed');
      expect(GenerationStatus.cancelled().toString()).toBe('cancelled');
    });
  });

  describe('toJSON', () => {
    it('should serialize to JSON correctly', () => {
      const status = GenerationStatus.processing();
      const json = status.toJSON();

      expect(json.value).toBe('processing');
      expect(json.display).toBe('Processing');
      expect(json.progress).toBe(50);
    });

    it('should handle all statuses', () => {
      const statuses = [
        GenerationStatus.pending(),
        GenerationStatus.processing(),
        GenerationStatus.completed(),
        GenerationStatus.failed(),
        GenerationStatus.cancelled()
      ];

      statuses.forEach(status => {
        const json = status.toJSON();
        expect(json.value).toBe(status.value);
        expect(json.display).toBe(status.getDisplayText());
        expect(json.progress).toBe(status.getProgressPercentage());
      });
    });
  });
}); 