/**
 * NoteAggregate Tests - Domain Layer
 * 
 * Tests for the core Note domain aggregate including:
 * - Factory methods and creation logic
 * - Business rules and invariants
 * - Content validation and updates
 * - Position and color management
 * - Data transformation methods
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NoteAggregate } from '../NoteAggregate';
import { NoteId } from '../../value-objects/NoteId';
import { 
  BusinessRuleViolationError, 
  InvalidNoteDataError 
} from '../../errors/NotesDomainError';

describe('NoteAggregate', () => {
  const validUserId = 'user-123';
  const validOrgId = 'org-456';
  const validTitle = 'Test Note Title';
  const validContent = 'Test note content here.';
  const validColorClass = 'bg-yellow-200';
  const validPosition = 5;

  beforeEach(() => {
    // Mock crypto.randomUUID for consistent IDs in tests
    vi.stubGlobal('crypto', {
      randomUUID: vi.fn(() => 'test-uuid-123')
    });
  });

  describe('Factory Methods', () => {
    describe('create()', () => {
      it('creates a new note aggregate with valid data', () => {
        const note = NoteAggregate.create(
          validTitle,
          validContent,
          validUserId,
          validOrgId,
          validPosition,
          validColorClass
        );

        expect(note.title).toBe(validTitle);
        expect(note.content).toBe(validContent);
        expect(note.userId).toBe(validUserId);
        expect(note.organizationId).toBe(validOrgId);
        expect(note.position).toBe(validPosition);
        expect(note.colorClass).toBe(validColorClass);
        expect(note.createdAt).toBeInstanceOf(Date);
        expect(note.updatedAt).toBeNull();
        expect(note.id).toBeInstanceOf(NoteId);
      });

      it('creates note with default position and color when not provided', () => {
        const note = NoteAggregate.create(
          validTitle,
          validContent,
          validUserId,
          validOrgId
        );

        expect(note.position).toBe(0);
        expect(note.colorClass).toBe('bg-yellow-100');
      });

      it('creates note with title only', () => {
        const note = NoteAggregate.create(
          validTitle,
          null,
          validUserId,
          validOrgId
        );

        expect(note.title).toBe(validTitle);
        expect(note.content).toBeNull();
        expect(note.hasContent()).toBe(true);
        expect(note.isEmpty()).toBe(false);
      });

      it('creates note with content only', () => {
        const note = NoteAggregate.create(
          null,
          validContent,
          validUserId,
          validOrgId
        );

        expect(note.title).toBeNull();
        expect(note.content).toBe(validContent);
        expect(note.hasContent()).toBe(true);
        expect(note.isEmpty()).toBe(false);
      });

      it('creates empty note when both title and content are null', () => {
        const note = NoteAggregate.create(
          null,
          null,
          validUserId,
          validOrgId
        );

        expect(note.title).toBeNull();
        expect(note.content).toBeNull();
        expect(note.hasContent()).toBe(false);
        expect(note.isEmpty()).toBe(true);
      });
    });

    describe('fromExisting()', () => {
      it('reconstructs note from existing data', () => {
        const existingId = 'existing-note-123';
        const createdAt = new Date('2023-01-01');
        const updatedAt = new Date('2023-01-02');

        const note = NoteAggregate.fromExisting(
          existingId,
          validTitle,
          validContent,
          validColorClass,
          validPosition,
          validUserId,
          validOrgId,
          createdAt,
          updatedAt
        );

        expect(note.id.value).toBe(existingId);
        expect(note.title).toBe(validTitle);
        expect(note.content).toBe(validContent);
        expect(note.colorClass).toBe(validColorClass);
        expect(note.position).toBe(validPosition);
        expect(note.userId).toBe(validUserId);
        expect(note.organizationId).toBe(validOrgId);
        expect(note.createdAt).toBe(createdAt);
        expect(note.updatedAt).toBe(updatedAt);
      });

      it('reconstructs note with null updatedAt', () => {
        const note = NoteAggregate.fromExisting(
          'existing-note-123',
          validTitle,
          validContent,
          validColorClass,
          validPosition,
          validUserId,
          validOrgId,
          new Date(),
          null
        );

        expect(note.updatedAt).toBeNull();
      });
    });
  });

  describe('Business Rules Validation', () => {
    describe('User and Organization validation', () => {
      it('throws error for invalid userId', () => {
        expect(() => {
          NoteAggregate.create(validTitle, validContent, '', validOrgId);
        }).toThrow(InvalidNoteDataError);

        expect(() => {
          NoteAggregate.create(validTitle, validContent, null as unknown as string, validOrgId);
        }).toThrow(InvalidNoteDataError);
      });

      it('throws error for invalid organizationId', () => {
        expect(() => {
          NoteAggregate.create(validTitle, validContent, validUserId, '');
        }).toThrow(InvalidNoteDataError);

        expect(() => {
          NoteAggregate.create(validTitle, validContent, validUserId, null as unknown as string);
        }).toThrow(InvalidNoteDataError);
      });
    });

    describe('Position validation', () => {
      it('throws error for negative position', () => {
        expect(() => {
          NoteAggregate.create(validTitle, validContent, validUserId, validOrgId, -1);
        }).toThrow(InvalidNoteDataError);
      });

      it('throws error for non-integer position', () => {
        expect(() => {
          NoteAggregate.create(validTitle, validContent, validUserId, validOrgId, 3.14);
        }).toThrow(InvalidNoteDataError);
      });

      it('accepts zero position', () => {
        const note = NoteAggregate.create(validTitle, validContent, validUserId, validOrgId, 0);
        expect(note.position).toBe(0);
      });

      it('accepts large position values', () => {
        const note = NoteAggregate.create(validTitle, validContent, validUserId, validOrgId, 999999);
        expect(note.position).toBe(999999);
      });
    });

    describe('Color class validation', () => {
      it('throws error for empty color class', () => {
        expect(() => {
          NoteAggregate.create(validTitle, validContent, validUserId, validOrgId, 0, '');
        }).toThrow(InvalidNoteDataError);

        expect(() => {
          NoteAggregate.create(validTitle, validContent, validUserId, validOrgId, 0, '   ');
        }).toThrow(InvalidNoteDataError);
      });

      it('throws error for null color class', () => {
        expect(() => {
          NoteAggregate.create(validTitle, validContent, validUserId, validOrgId, 0, null as unknown as string);
        }).toThrow(InvalidNoteDataError);
      });

      it('accepts valid color classes', () => {
        const colorClasses = ['bg-red-200', 'bg-blue-100', 'bg-green-300', 'bg-purple-50'];
        
        colorClasses.forEach(colorClass => {
          const note = NoteAggregate.create(validTitle, validContent, validUserId, validOrgId, 0, colorClass);
          expect(note.colorClass).toBe(colorClass);
        });
      });
    });
  });

  describe('Content Management', () => {
    let note: NoteAggregate;

    beforeEach(() => {
      note = NoteAggregate.create(validTitle, validContent, validUserId, validOrgId);
    });

    describe('updateContent()', () => {
      it('updates title and content successfully', () => {
        const newTitle = 'Updated Title';
        const newContent = 'Updated content here.';
        const originalUpdatedAt = note.updatedAt;

        note.updateContent(newTitle, newContent);

        expect(note.title).toBe(newTitle);
        expect(note.content).toBe(newContent);
        expect(note.updatedAt).not.toBe(originalUpdatedAt);
        expect(note.updatedAt).toBeInstanceOf(Date);
      });

      it('trims title whitespace', () => {
        note.updateContent('  Trimmed Title  ', validContent);
        expect(note.title).toBe('Trimmed Title');
      });

      it('converts empty trimmed title to null', () => {
        note.updateContent('   ', validContent);
        expect(note.title).toBeNull();
      });

      it('updates with title only', () => {
        note.updateContent('Title Only', null);
        expect(note.title).toBe('Title Only');
        expect(note.content).toBeNull();
        expect(note.hasContent()).toBe(true);
      });

      it('updates with content only', () => {
        note.updateContent(null, 'Content Only');
        expect(note.title).toBeNull();
        expect(note.content).toBe('Content Only');
        expect(note.hasContent()).toBe(true);
      });

      it('throws error when both title and content are empty', () => {
        expect(() => {
          note.updateContent(null, null);
        }).toThrow(BusinessRuleViolationError);

        expect(() => {
          note.updateContent('', '');
        }).toThrow(BusinessRuleViolationError);

        expect(() => {
          note.updateContent('   ', '   ');
        }).toThrow(BusinessRuleViolationError);
      });

      it('throws error for title exceeding 255 characters', () => {
        const longTitle = 'a'.repeat(256);
        
        expect(() => {
          note.updateContent(longTitle, validContent);
        }).toThrow(InvalidNoteDataError);
      });

      it('accepts title at 255 character limit', () => {
        const maxTitle = 'a'.repeat(255);
        note.updateContent(maxTitle, validContent);
        expect(note.title).toBe(maxTitle);
      });

      it('throws error for content exceeding 10000 characters', () => {
        const longContent = 'a'.repeat(10001);
        
        expect(() => {
          note.updateContent(validTitle, longContent);
        }).toThrow(InvalidNoteDataError);
      });

      it('accepts content at 10000 character limit', () => {
        const maxContent = 'a'.repeat(10000);
        note.updateContent(validTitle, maxContent);
        expect(note.content).toBe(maxContent);
      });
    });

    describe('Content state methods', () => {
      it('isEmpty() returns true for empty notes', () => {
        const emptyNote = NoteAggregate.create(null, null, validUserId, validOrgId);
        expect(emptyNote.isEmpty()).toBe(true);

        const whitespaceNote = NoteAggregate.create('   ', '   ', validUserId, validOrgId);
        expect(whitespaceNote.isEmpty()).toBe(true);
      });

      it('isEmpty() returns false for notes with content', () => {
        expect(note.isEmpty()).toBe(false);

        const titleOnlyNote = NoteAggregate.create('Title', null, validUserId, validOrgId);
        expect(titleOnlyNote.isEmpty()).toBe(false);

        const contentOnlyNote = NoteAggregate.create(null, 'Content', validUserId, validOrgId);
        expect(contentOnlyNote.isEmpty()).toBe(false);
      });

      it('hasContent() is inverse of isEmpty()', () => {
        expect(note.hasContent()).toBe(!note.isEmpty());

        const emptyNote = NoteAggregate.create(null, null, validUserId, validOrgId);
        expect(emptyNote.hasContent()).toBe(!emptyNote.isEmpty());
      });
    });
  });

  describe('Position Management', () => {
    let note: NoteAggregate;

    beforeEach(() => {
      note = NoteAggregate.create(validTitle, validContent, validUserId, validOrgId, 5);
    });

    describe('updatePosition()', () => {
      it('updates position successfully', () => {
        const newPosition = 10;
        const originalUpdatedAt = note.updatedAt;

        note.updatePosition(newPosition);

        expect(note.position).toBe(newPosition);
        expect(note.updatedAt).not.toBe(originalUpdatedAt);
        expect(note.updatedAt).toBeInstanceOf(Date);
      });

      it('throws error for negative position', () => {
        expect(() => {
          note.updatePosition(-1);
        }).toThrow(InvalidNoteDataError);
      });

      it('throws error for non-integer position', () => {
        expect(() => {
          note.updatePosition(5.5);
        }).toThrow(InvalidNoteDataError);
      });

      it('accepts position of zero', () => {
        note.updatePosition(0);
        expect(note.position).toBe(0);
      });
    });
  });

  describe('Color Management', () => {
    let note: NoteAggregate;

    beforeEach(() => {
      note = NoteAggregate.create(validTitle, validContent, validUserId, validOrgId);
    });

    describe('updateColorClass()', () => {
      it('updates color class successfully', () => {
        const newColorClass = 'bg-blue-300';
        const originalUpdatedAt = note.updatedAt;

        note.updateColorClass(newColorClass);

        expect(note.colorClass).toBe(newColorClass);
        expect(note.updatedAt).not.toBe(originalUpdatedAt);
        expect(note.updatedAt).toBeInstanceOf(Date);
      });

      it('throws error for empty color class', () => {
        expect(() => {
          note.updateColorClass('');
        }).toThrow(InvalidNoteDataError);

        expect(() => {
          note.updateColorClass('   ');
        }).toThrow(InvalidNoteDataError);
      });

      it('throws error for null color class', () => {
        expect(() => {
          note.updateColorClass(null as unknown as string);
        }).toThrow(InvalidNoteDataError);
      });
    });
  });

  describe('Data Transformation', () => {
    let note: NoteAggregate;
    const createdAt = new Date('2023-01-01T10:00:00Z');
    const updatedAt = new Date('2023-01-02T15:30:00Z');

    beforeEach(() => {
      note = NoteAggregate.fromExisting(
        'test-id-123',
        validTitle,
        validContent,
        validColorClass,
        validPosition,
        validUserId,
        validOrgId,
        createdAt,
        updatedAt
      );
    });

    describe('toData()', () => {
      it('converts to plain data object', () => {
        const data = note.toData();

        expect(data).toEqual({
          title: validTitle,
          content: validContent,
          colorClass: validColorClass,
          position: validPosition,
          userId: validUserId,
          organizationId: validOrgId,
          createdAt: createdAt,
          updatedAt: updatedAt
        });
      });

      it('handles null values correctly', () => {
        const nullNote = NoteAggregate.create(null, null, validUserId, validOrgId);
        const data = nullNote.toData();

        expect(data.title).toBeNull();
        expect(data.content).toBeNull();
        expect(data.updatedAt).toBeNull();
      });
    });

    describe('toDatabaseFormat()', () => {
      it('converts to database format with snake_case fields', () => {
        const dbFormat = note.toDatabaseFormat();

        expect(dbFormat).toEqual({
          id: 'test-id-123',
          title: validTitle,
          content: validContent,
          color_class: validColorClass,
          position: validPosition,
          user_id: validUserId,
          organization_id: validOrgId,
          created_at: createdAt.toISOString(),
          updated_at: updatedAt.toISOString()
        });
      });

      it('handles null updatedAt correctly', () => {
        const newNote = NoteAggregate.create(validTitle, validContent, validUserId, validOrgId);
        const dbFormat = newNote.toDatabaseFormat();

        expect(dbFormat.updated_at).toBeNull();
      });

      it('converts dates to ISO strings', () => {
        const dbFormat = note.toDatabaseFormat();

        expect(dbFormat.created_at).toBe('2023-01-01T10:00:00.000Z');
        expect(dbFormat.updated_at).toBe('2023-01-02T15:30:00.000Z');
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('maintains consistency after failed update attempts', () => {
      const note = NoteAggregate.create(validTitle, validContent, validUserId, validOrgId);
      const originalTitle = note.title;
      const originalUpdatedAt = note.updatedAt;

      // Attempt invalid update
      expect(() => {
        note.updateContent('', '');
      }).toThrow(BusinessRuleViolationError);

      // Note should remain unchanged
      expect(note.title).toBe(originalTitle);
      expect(note.updatedAt).toBe(originalUpdatedAt);
    });

    it('validates invariants after each update', () => {
      const note = NoteAggregate.create(validTitle, validContent, validUserId, validOrgId);

      // Each update should maintain all invariants
      note.updateContent('New Title', 'New Content');
      note.updatePosition(99);
      note.updateColorClass('bg-red-500');

      // Should not throw - all invariants maintained
      expect(note.title).toBe('New Title');
      expect(note.position).toBe(99);
      expect(note.colorClass).toBe('bg-red-500');
    });

    it('handles special characters in content', () => {
      const specialTitle = 'Note with émojis 🎉 and üñïçødé';
      const specialContent = 'Content with\nnewlines\tand\ttabs';

      const note = NoteAggregate.create(specialTitle, specialContent, validUserId, validOrgId);
      
      expect(note.title).toBe(specialTitle);
      expect(note.content).toBe(specialContent);

      const dbFormat = note.toDatabaseFormat();
      expect(dbFormat.title).toBe(specialTitle);
      expect(dbFormat.content).toBe(specialContent);
    });
  });
});