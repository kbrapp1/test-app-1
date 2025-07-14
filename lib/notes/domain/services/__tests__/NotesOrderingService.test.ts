/**
 * NotesOrderingService Tests - Domain Layer
 * 
 * Tests for the notes ordering domain service including:
 * - Reorder position calculations
 * - Position validation and conflict detection
 * - Position normalization
 * - Insert position calculations
 * - Edge cases and error scenarios
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotesOrderingService } from '../NotesOrderingService';
import { NoteAggregate } from '../../aggregates/NoteAggregate';
import { NoteId } from '../../value-objects/NoteId';
import { 
  BusinessRuleViolationError, 
  NotePositionConflictError 
} from '../../errors/NotesDomainError';

describe('NotesOrderingService', () => {
  const userId = 'user-123';
  const orgId = 'org-456';

  beforeEach(() => {
    // Mock crypto.randomUUID for consistent IDs
    vi.stubGlobal('crypto', {
      randomUUID: vi.fn(() => 'test-uuid-123')
    });
  });

  // Helper function to create test notes
  const createTestNote = (id: string, position: number, title: string = 'Test Note'): NoteAggregate => {
    return NoteAggregate.fromExisting(
      id,
      title,
      'Test content',
      'bg-yellow-200',
      position,
      userId,
      orgId,
      new Date(),
      null
    );
  };

  describe('calculateReorderPositions()', () => {
    it('calculates sequential positions for reordered notes', () => {
      const notes = [
        createTestNote('note-1', 0),
        createTestNote('note-2', 1),
        createTestNote('note-3', 2)
      ];

      const orderedIds = ['note-3', 'note-1', 'note-2'];
      const updates = NotesOrderingService.calculateReorderPositions(orderedIds, notes);

      expect(updates).toHaveLength(3);
      expect(updates[0]).toEqual({ id: NoteId.create('note-3'), position: 0 });
      expect(updates[1]).toEqual({ id: NoteId.create('note-1'), position: 1 });
      expect(updates[2]).toEqual({ id: NoteId.create('note-2'), position: 2 });
    });

    it('handles single note reorder', () => {
      const notes = [createTestNote('note-1', 0)];
      const orderedIds = ['note-1'];
      
      const updates = NotesOrderingService.calculateReorderPositions(orderedIds, notes);

      expect(updates).toHaveLength(1);
      expect(updates[0]).toEqual({ id: NoteId.create('note-1'), position: 0 });
    });

    it('returns empty array for empty input', () => {
      const notes: NoteAggregate[] = [];
      const orderedIds: string[] = [];
      
      const updates = NotesOrderingService.calculateReorderPositions(orderedIds, notes);

      expect(updates).toEqual([]);
    });

    it('handles partial reordering', () => {
      const notes = [
        createTestNote('note-1', 0),
        createTestNote('note-2', 1),
        createTestNote('note-3', 2),
        createTestNote('note-4', 3)
      ];

      // Only reorder first 3 notes
      const orderedIds = ['note-2', 'note-3', 'note-1'];
      const updates = NotesOrderingService.calculateReorderPositions(orderedIds, notes);

      expect(updates).toHaveLength(3);
      expect(updates[0]).toEqual({ id: NoteId.create('note-2'), position: 0 });
      expect(updates[1]).toEqual({ id: NoteId.create('note-3'), position: 1 });
      expect(updates[2]).toEqual({ id: NoteId.create('note-1'), position: 2 });
    });

    it('throws error when note IDs do not exist', () => {
      const notes = [
        createTestNote('note-1', 0),
        createTestNote('note-2', 1)
      ];

      const orderedIds = ['note-1', 'note-nonexistent', 'note-2'];

      expect(() => {
        NotesOrderingService.calculateReorderPositions(orderedIds, notes);
      }).toThrow(BusinessRuleViolationError);
    });

    it('throws error with context for missing IDs', () => {
      const notes = [createTestNote('note-1', 0)];
      const orderedIds = ['note-1', 'missing-1', 'missing-2'];

      try {
        NotesOrderingService.calculateReorderPositions(orderedIds, notes);
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeInstanceOf(BusinessRuleViolationError);
        expect((error as BusinessRuleViolationError).context).toEqual({
          missingIds: ['missing-1', 'missing-2'],
          providedIds: orderedIds
        });
      }
    });

    it('handles complex reordering scenarios', () => {
      const notes = [
        createTestNote('a', 0),
        createTestNote('b', 1),
        createTestNote('c', 2),
        createTestNote('d', 3),
        createTestNote('e', 4)
      ];

      // Reverse order
      const orderedIds = ['e', 'd', 'c', 'b', 'a'];
      const updates = NotesOrderingService.calculateReorderPositions(orderedIds, notes);

      expect(updates).toHaveLength(5);
      orderedIds.forEach((id, index) => {
        expect(updates[index]).toEqual({ id: NoteId.create(id), position: index });
      });
    });
  });

  describe('calculateNextPosition()', () => {
    it('returns 0 for empty notes collection', () => {
      const position = NotesOrderingService.calculateNextPosition([]);
      expect(position).toBe(0);
    });

    it('returns next position after highest existing position', () => {
      const notes = [
        createTestNote('note-1', 0),
        createTestNote('note-2', 1),
        createTestNote('note-3', 2)
      ];

      const position = NotesOrderingService.calculateNextPosition(notes);
      expect(position).toBe(3);
    });

    it('handles non-sequential positions correctly', () => {
      const notes = [
        createTestNote('note-1', 0),
        createTestNote('note-2', 5),
        createTestNote('note-3', 2)
      ];

      const position = NotesOrderingService.calculateNextPosition(notes);
      expect(position).toBe(6); // 5 + 1
    });

    it('handles single note', () => {
      const notes = [createTestNote('note-1', 7)];
      const position = NotesOrderingService.calculateNextPosition(notes);
      expect(position).toBe(8);
    });

    it('handles large position values', () => {
      const notes = [createTestNote('note-1', 999999)];
      const position = NotesOrderingService.calculateNextPosition(notes);
      expect(position).toBe(1000000);
    });
  });

  describe('validatePositions()', () => {
    it('does not throw for valid sequential positions', () => {
      const notes = [
        createTestNote('note-1', 0),
        createTestNote('note-2', 1),
        createTestNote('note-3', 2)
      ];

      expect(() => {
        NotesOrderingService.validatePositions(notes);
      }).not.toThrow();
    });

    it('does not throw for valid non-sequential positions', () => {
      const notes = [
        createTestNote('note-1', 0),
        createTestNote('note-2', 5),
        createTestNote('note-3', 10)
      ];

      expect(() => {
        NotesOrderingService.validatePositions(notes);
      }).not.toThrow();
    });

    it('does not throw for empty notes collection', () => {
      expect(() => {
        NotesOrderingService.validatePositions([]);
      }).not.toThrow();
    });

    it('does not throw for single note', () => {
      const notes = [createTestNote('note-1', 0)];

      expect(() => {
        NotesOrderingService.validatePositions(notes);
      }).not.toThrow();
    });

    it('throws error for negative positions', () => {
      // Create notes with valid positions first, then manually modify for testing
      const note1 = createTestNote('note-1', 0);
      const note2 = createTestNote('note-2', 1);
      
      // Manually create notes with invalid positions for testing validation
      const invalidNotes = [
        { ...note1, position: -1 } as NoteAggregate,
        note2
      ];

      expect(() => {
        NotesOrderingService.validatePositions(invalidNotes as NoteAggregate[]);
      }).toThrow(BusinessRuleViolationError);
    });

    it('throws error with context for negative positions', () => {
      // Create note with valid position first, then manually modify for testing
      const note = createTestNote('note-1', 0);
      const invalidNotes = [{ ...note, position: -5 } as NoteAggregate];

      try {
        NotesOrderingService.validatePositions(invalidNotes as NoteAggregate[]);
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeInstanceOf(BusinessRuleViolationError);
        expect((error as BusinessRuleViolationError).context).toEqual({
          invalidPosition: -5
        });
      }
    });

    it('throws error for duplicate positions', () => {
      const notes = [
        createTestNote('note-1', 0),
        createTestNote('note-2', 1),
        createTestNote('note-3', 1), // Duplicate
        createTestNote('note-4', 2)
      ];

      expect(() => {
        NotesOrderingService.validatePositions(notes);
      }).toThrow(NotePositionConflictError);
    });

    it('throws error with context for duplicate positions', () => {
      const notes = [
        createTestNote('note-1', 2),
        createTestNote('note-2', 2), // Duplicate
        createTestNote('note-3', 5),
        createTestNote('note-4', 5)  // Another duplicate
      ];

      try {
        NotesOrderingService.validatePositions(notes);
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeInstanceOf(NotePositionConflictError);
        expect((error as NotePositionConflictError).context).toEqual({
          duplicatePositions: [2, 5],
          position: 2 // First duplicate position is added by the error constructor
        });
      }
    });

    it('handles unordered input correctly', () => {
      const notes = [
        createTestNote('note-1', 2),
        createTestNote('note-2', 0),
        createTestNote('note-3', 1)
      ];

      expect(() => {
        NotesOrderingService.validatePositions(notes);
      }).not.toThrow();
    });
  });

  describe('normalizePositions()', () => {
    it('normalizes positions to sequential starting from 0', () => {
      const notes = [
        createTestNote('note-1', 5),
        createTestNote('note-2', 10),
        createTestNote('note-3', 2)
      ];

      const updates = NotesOrderingService.normalizePositions(notes);

      expect(updates).toHaveLength(3);
      // Should be sorted by original position, then assigned sequential positions
      expect(updates[0]).toEqual({ id: NoteId.create('note-3'), position: 0 }); // Was at 2
      expect(updates[1]).toEqual({ id: NoteId.create('note-1'), position: 1 }); // Was at 5
      expect(updates[2]).toEqual({ id: NoteId.create('note-2'), position: 2 }); // Was at 10
    });

    it('returns empty array for empty input', () => {
      const updates = NotesOrderingService.normalizePositions([]);
      expect(updates).toEqual([]);
    });

    it('handles single note', () => {
      const notes = [createTestNote('note-1', 100)];
      const updates = NotesOrderingService.normalizePositions(notes);

      expect(updates).toHaveLength(1);
      expect(updates[0]).toEqual({ id: NoteId.create('note-1'), position: 0 });
    });

    it('preserves relative order', () => {
      const notes = [
        createTestNote('first', 3),
        createTestNote('second', 7),
        createTestNote('third', 15),
        createTestNote('fourth', 20)
      ];

      const updates = NotesOrderingService.normalizePositions(notes);

      expect(updates).toHaveLength(4);
      expect(updates[0]).toEqual({ id: NoteId.create('first'), position: 0 });
      expect(updates[1]).toEqual({ id: NoteId.create('second'), position: 1 });
      expect(updates[2]).toEqual({ id: NoteId.create('third'), position: 2 });
      expect(updates[3]).toEqual({ id: NoteId.create('fourth'), position: 3 });
    });

    it('handles already normalized positions', () => {
      const notes = [
        createTestNote('note-1', 0),
        createTestNote('note-2', 1),
        createTestNote('note-3', 2)
      ];

      const updates = NotesOrderingService.normalizePositions(notes);

      expect(updates).toHaveLength(3);
      expect(updates[0]).toEqual({ id: NoteId.create('note-1'), position: 0 });
      expect(updates[1]).toEqual({ id: NoteId.create('note-2'), position: 1 });
      expect(updates[2]).toEqual({ id: NoteId.create('note-3'), position: 2 });
    });

    it('handles negative positions in sorting', () => {
      // Note: Individual notes with negative positions should be caught by validation,
      // but the sorting logic should handle them correctly if they exist
      const note1 = createTestNote('note-1', 5);
      const note2 = createTestNote('note-2', 0);
      const note3 = createTestNote('note-3', 1);
      
      // Create a mock note with negative position that bypasses the aggregate validation
      const mockNote2WithNegativePosition = {
        ...note2,
        position: -2,
        id: note2.id // Preserve the NoteId object
      } as NoteAggregate;
      
      // Manually create notes with negative positions for testing the sorting logic
      const notes = [
        note1,
        mockNote2WithNegativePosition, // Would be caught by validation, but test sorting
        note3
      ];

      const updates = NotesOrderingService.normalizePositions(notes);

      expect(updates).toHaveLength(3);
      expect(updates[0]).toEqual({ id: note2.id, position: 0 }); // Was at -2
      expect(updates[1]).toEqual({ id: note3.id, position: 1 }); // Was at 1
      expect(updates[2]).toEqual({ id: note1.id, position: 2 }); // Was at 5
    });
  });

  describe('calculateInsertPosition()', () => {
    it('returns empty array when inserting at end of empty collection', () => {
      const updates = NotesOrderingService.calculateInsertPosition(0, []);
      expect(updates).toEqual([]);
    });

    it('shifts existing notes when inserting at beginning', () => {
      const notes = [
        createTestNote('note-1', 0),
        createTestNote('note-2', 1),
        createTestNote('note-3', 2)
      ];

      const updates = NotesOrderingService.calculateInsertPosition(0, notes);

      expect(updates).toHaveLength(3);
      expect(updates[0]).toEqual({ id: NoteId.create('note-1'), position: 1 });
      expect(updates[1]).toEqual({ id: NoteId.create('note-2'), position: 2 });
      expect(updates[2]).toEqual({ id: NoteId.create('note-3'), position: 3 });
    });

    it('shifts only affected notes when inserting in middle', () => {
      const notes = [
        createTestNote('note-1', 0),
        createTestNote('note-2', 1),
        createTestNote('note-3', 2),
        createTestNote('note-4', 3)
      ];

      const updates = NotesOrderingService.calculateInsertPosition(2, notes);

      expect(updates).toHaveLength(2);
      expect(updates[0]).toEqual({ id: NoteId.create('note-3'), position: 3 });
      expect(updates[1]).toEqual({ id: NoteId.create('note-4'), position: 4 });
    });

    it('returns empty array when inserting at end', () => {
      const notes = [
        createTestNote('note-1', 0),
        createTestNote('note-2', 1),
        createTestNote('note-3', 2)
      ];

      const updates = NotesOrderingService.calculateInsertPosition(3, notes);
      expect(updates).toEqual([]);
    });

    it('handles non-sequential existing positions', () => {
      const notes = [
        createTestNote('note-1', 0),
        createTestNote('note-2', 5),  // Gap
        createTestNote('note-3', 10) // Another gap
      ];

      const updates = NotesOrderingService.calculateInsertPosition(5, notes);

      expect(updates).toHaveLength(2);
      expect(updates[0]).toEqual({ id: NoteId.create('note-2'), position: 6 });
      expect(updates[1]).toEqual({ id: NoteId.create('note-3'), position: 11 });
    });

    it('throws error for negative target position', () => {
      const notes = [createTestNote('note-1', 0)];

      expect(() => {
        NotesOrderingService.calculateInsertPosition(-1, notes);
      }).toThrow(BusinessRuleViolationError);
    });

    it('throws error with context for negative position', () => {
      const notes = [createTestNote('note-1', 0)];

      try {
        NotesOrderingService.calculateInsertPosition(-5, notes);
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeInstanceOf(BusinessRuleViolationError);
        expect((error as BusinessRuleViolationError).context).toEqual({
          targetPosition: -5
        });
      }
    });

    it('handles inserting at position beyond current range', () => {
      const notes = [
        createTestNote('note-1', 0),
        createTestNote('note-2', 1)
      ];

      const updates = NotesOrderingService.calculateInsertPosition(10, notes);
      expect(updates).toEqual([]);
    });

    it('handles single note collection', () => {
      const notes = [createTestNote('note-1', 0)];

      const updatesAtStart = NotesOrderingService.calculateInsertPosition(0, notes);
      expect(updatesAtStart).toHaveLength(1);
      expect(updatesAtStart[0]).toEqual({ id: NoteId.create('note-1'), position: 1 });

      const updatesAtEnd = NotesOrderingService.calculateInsertPosition(1, notes);
      expect(updatesAtEnd).toEqual([]);
    });
  });

  describe('Integration Scenarios', () => {
    it('handles complete reorder workflow', () => {
      // Start with some notes
      const notes = [
        createTestNote('a', 0),
        createTestNote('b', 1),
        createTestNote('c', 2),
        createTestNote('d', 3)
      ];

      // Validate initial positions
      expect(() => {
        NotesOrderingService.validatePositions(notes);
      }).not.toThrow();

      // Reorder them
      const newOrder = ['d', 'a', 'c', 'b'];
      const reorderUpdates = NotesOrderingService.calculateReorderPositions(newOrder, notes);

      // Verify reorder updates
      expect(reorderUpdates).toHaveLength(4);
      expect(reorderUpdates[0]).toEqual({ id: NoteId.create('d'), position: 0 });
      expect(reorderUpdates[1]).toEqual({ id: NoteId.create('a'), position: 1 });
      expect(reorderUpdates[2]).toEqual({ id: NoteId.create('c'), position: 2 });
      expect(reorderUpdates[3]).toEqual({ id: NoteId.create('b'), position: 3 });
    });

    it('handles normalization after gaps', () => {
      // Notes with gaps in positions
      const notes = [
        createTestNote('note-1', 1),
        createTestNote('note-2', 5),
        createTestNote('note-3', 20)
      ];

      // Normalize positions
      const normalizeUpdates = NotesOrderingService.normalizePositions(notes);

      expect(normalizeUpdates).toHaveLength(3);
      expect(normalizeUpdates[0]).toEqual({ id: NoteId.create('note-1'), position: 0 });
      expect(normalizeUpdates[1]).toEqual({ id: NoteId.create('note-2'), position: 1 });
      expect(normalizeUpdates[2]).toEqual({ id: NoteId.create('note-3'), position: 2 });

      // Calculate next position after normalization
      const nextPosition = NotesOrderingService.calculateNextPosition(notes);
      expect(nextPosition).toBe(21); // Based on original max position
    });

    it('handles insert and shift workflow', () => {
      const notes = [
        createTestNote('note-1', 0),
        createTestNote('note-2', 1),
        createTestNote('note-3', 2)
      ];

      // Insert at position 1
      const insertUpdates = NotesOrderingService.calculateInsertPosition(1, notes);

      expect(insertUpdates).toHaveLength(2);
      expect(insertUpdates[0]).toEqual({ id: NoteId.create('note-2'), position: 2 });
      expect(insertUpdates[1]).toEqual({ id: NoteId.create('note-3'), position: 3 });

      // Next position after insert
      const nextPosition = NotesOrderingService.calculateNextPosition(notes);
      expect(nextPosition).toBe(3); // Original max was 2
    });
  });
});