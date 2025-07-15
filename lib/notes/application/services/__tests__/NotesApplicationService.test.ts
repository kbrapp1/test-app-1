/**
 * NotesApplicationService Tests - Application Layer
 * 
 * Tests for the notes application service including:
 * - Create, read, update, delete operations
 * - Reorder note workflows
 * - Error handling and domain integration
 * - Repository interaction patterns
 * - Command validation and processing
 */

import { describe, it, expect, beforeEach, vi, type MockedFunction } from 'vitest';
import { NotesApplicationService, CreateNoteCommand, UpdateNoteCommand, ReorderNotesCommand } from '../NotesApplicationService';
import { INotesRepository } from '../../../domain/repositories/INotesRepository';
import { NoteAggregate } from '../../../domain/aggregates/NoteAggregate';
import { NoteId } from '../../../domain/value-objects/NoteId';
import { NotesOrderingService } from '../../../domain/services/NotesOrderingService';
import { 
  BusinessRuleViolationError, 
  NoteNotFoundError
} from '../../../domain/errors/NotesDomainError';

// Mock Supabase server client for permission validation
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn((table: string) => {
      if (table === 'organization_memberships') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => Promise.resolve({
                  data: { role_id: 'role-123', roles: { name: 'admin' } },
                  error: null
                }))
              }))
            }))
          }))
        };
      } else if (table === 'roles') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve({
                data: { name: 'ADMIN' },
                error: null
              }))
            }))
          }))
        };
      }
      return {};
    })
  }))
}));

// Vitest mock type for the repository
type MockedRepository = {
  [K in keyof INotesRepository]: MockedFunction<INotesRepository[K]>
};

describe('NotesApplicationService', () => {
  let service: NotesApplicationService;
  let mockRepository: MockedRepository;
  
  const userId = '550e8400-e29b-41d4-a716-446655440000';
  const orgId = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';
  const noteId = '6ba7b811-9dad-11d1-80b4-00c04fd430c8';

  beforeEach(() => {
    // Mock crypto.randomUUID for consistent IDs
    vi.stubGlobal('crypto', {
      randomUUID: vi.fn(() => 'test-uuid-123')
    });

    // Create repository mock
    mockRepository = {
      findByUserAndOrganization: vi.fn(),
      findById: vi.fn(),
      save: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      updatePositions: vi.fn(),
      getNextPosition: vi.fn()
    } as MockedRepository;

    service = new NotesApplicationService(mockRepository);

    // Mock the private validatePermissions method to always pass
    vi.spyOn(service as any, 'validatePermissions').mockResolvedValue(undefined);
  });

  // Helper function to create test note
  const createTestNote = (id: string, position: number = 0): NoteAggregate => {
    return NoteAggregate.fromExisting(
      id,
      'Test Note',
      'Test content',
      'bg-yellow-200',
      position,
      userId,
      orgId,
      new Date(),
      null
    );
  };

  describe('createNote()', () => {
    const validCreateCommand: CreateNoteCommand = {
      title: 'New Note',
      content: 'New content',
      userId,
      organizationId: orgId,
      position: 0,
      colorClass: 'bg-blue-200'
    };

    it('creates note with provided position', async () => {
      mockRepository.save.mockResolvedValueOnce(undefined);

      const result = await service.createNote(validCreateCommand);

      expect(result).toBeInstanceOf(NoteAggregate);
      expect(result.title).toBe(validCreateCommand.title);
      expect(result.content).toBe(validCreateCommand.content);
      expect(result.position).toBe(validCreateCommand.position);
      expect(result.colorClass).toBe(validCreateCommand.colorClass);
      expect(result.userId).toBe(userId);
      expect(result.organizationId).toBe(orgId);

      expect(mockRepository.save).toHaveBeenCalledOnce();
      expect(mockRepository.save).toHaveBeenCalledWith(result);
    });

    it('creates note with next available position when not provided', async () => {
      const nextPosition = 5;
      mockRepository.getNextPosition.mockResolvedValueOnce(nextPosition);
      mockRepository.save.mockResolvedValueOnce(undefined);

      const commandWithoutPosition = { ...validCreateCommand };
      delete commandWithoutPosition.position;

      const result = await service.createNote(commandWithoutPosition);

      expect(result.position).toBe(nextPosition);
      expect(mockRepository.getNextPosition).toHaveBeenCalledWith(userId, orgId);
      expect(mockRepository.save).toHaveBeenCalledWith(result);
    });

    it('creates note with default color when not provided', async () => {
      mockRepository.getNextPosition.mockResolvedValueOnce(0);
      mockRepository.save.mockResolvedValueOnce(undefined);

      const commandWithoutColor = { ...validCreateCommand };
      delete commandWithoutColor.colorClass;
      delete commandWithoutColor.position;

      const result = await service.createNote(commandWithoutColor);

      expect(result.colorClass).toBe('bg-yellow-100'); // Default from aggregate
    });

    it('propagates domain validation errors', async () => {
      const invalidCommand: CreateNoteCommand = {
        title: 'Valid title',
        content: 'Valid content',
        userId,
        organizationId: orgId,
        position: -1 // Invalid negative position should trigger validation
      };

      await expect(service.createNote(invalidCommand)).rejects.toThrow();
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('wraps repository errors in domain errors', async () => {
      mockRepository.getNextPosition.mockResolvedValueOnce(0);
      mockRepository.save.mockRejectedValueOnce(new Error('Database connection failed'));

      await expect(service.createNote(validCreateCommand)).rejects.toThrow(BusinessRuleViolationError);
    });

    it('preserves domain errors without wrapping', async () => {
      const domainError = new BusinessRuleViolationError('Domain rule violated');
      mockRepository.save.mockRejectedValueOnce(domainError);

      await expect(service.createNote(validCreateCommand)).rejects.toThrow(domainError);
    });
  });

  describe('updateNote()', () => {
    const validUpdateCommand: UpdateNoteCommand = {
      id: noteId,
      title: 'Updated Title',
      content: 'Updated content',
      position: 5,
      colorClass: 'bg-red-200',
      userId,
      organizationId: orgId
    };

    let existingNote: NoteAggregate;

    beforeEach(() => {
      existingNote = createTestNote(noteId);
    });

    it('updates note with all provided fields', async () => {
      mockRepository.findById.mockResolvedValueOnce(existingNote);
      mockRepository.update.mockResolvedValueOnce(undefined);

      const result = await service.updateNote(validUpdateCommand);

      expect(result.title).toBe(validUpdateCommand.title);
      expect(result.content).toBe(validUpdateCommand.content);
      expect(result.position).toBe(validUpdateCommand.position);
      expect(result.colorClass).toBe(validUpdateCommand.colorClass);

      expect(mockRepository.findById).toHaveBeenCalledWith(
        NoteId.create(noteId),
        userId,
        orgId
      );
      expect(mockRepository.update).toHaveBeenCalledWith(result);
    });

    it('updates only title when only title provided', async () => {
      mockRepository.findById.mockResolvedValueOnce(existingNote);
      mockRepository.update.mockResolvedValueOnce(undefined);

      const partialCommand: UpdateNoteCommand = {
        id: noteId,
        title: 'Only Title Updated',
        userId,
        organizationId: orgId
      };

      const result = await service.updateNote(partialCommand);

      expect(result.title).toBe(partialCommand.title);
      expect(result.content).toBe(existingNote.content); // Unchanged
      expect(result.position).toBe(existingNote.position); // Unchanged
      expect(result.colorClass).toBe(existingNote.colorClass); // Unchanged
    });

    it('updates only content when only content provided', async () => {
      mockRepository.findById.mockResolvedValueOnce(existingNote);
      mockRepository.update.mockResolvedValueOnce(undefined);

      const partialCommand: UpdateNoteCommand = {
        id: noteId,
        content: 'Only Content Updated',
        userId,
        organizationId: orgId
      };

      const result = await service.updateNote(partialCommand);

      expect(result.content).toBe(partialCommand.content);
      expect(result.title).toBe(existingNote.title); // Unchanged
    });

    it('updates only position when only position provided', async () => {
      mockRepository.findById.mockResolvedValueOnce(existingNote);
      mockRepository.update.mockResolvedValueOnce(undefined);

      const partialCommand: UpdateNoteCommand = {
        id: noteId,
        position: 99,
        userId,
        organizationId: orgId
      };

      const result = await service.updateNote(partialCommand);

      expect(result.position).toBe(partialCommand.position);
      expect(result.title).toBe(existingNote.title); // Unchanged
      expect(result.content).toBe(existingNote.content); // Unchanged
    });

    it('updates only color when only color provided', async () => {
      mockRepository.findById.mockResolvedValueOnce(existingNote);
      mockRepository.update.mockResolvedValueOnce(undefined);

      const partialCommand: UpdateNoteCommand = {
        id: noteId,
        colorClass: 'bg-green-300',
        userId,
        organizationId: orgId
      };

      const result = await service.updateNote(partialCommand);

      expect(result.colorClass).toBe(partialCommand.colorClass);
      expect(result.title).toBe(existingNote.title); // Unchanged
      expect(result.content).toBe(existingNote.content); // Unchanged
    });

    it('throws error when note not found', async () => {
      mockRepository.findById.mockResolvedValueOnce(null);

      await expect(service.updateNote(validUpdateCommand)).rejects.toThrow(NoteNotFoundError);
      expect(mockRepository.update).not.toHaveBeenCalled();
    });

    it('propagates domain validation errors', async () => {
      mockRepository.findById.mockResolvedValueOnce(existingNote);

      const invalidCommand: UpdateNoteCommand = {
        id: noteId,
        title: '',
        content: '', // Both empty should trigger validation error
        userId,
        organizationId: orgId
      };

      await expect(service.updateNote(invalidCommand)).rejects.toThrow(BusinessRuleViolationError);
      expect(mockRepository.update).not.toHaveBeenCalled();
    });

    it('wraps repository errors in domain errors', async () => {
      mockRepository.findById.mockResolvedValueOnce(existingNote);
      mockRepository.update.mockRejectedValueOnce(new Error('Database error'));

      await expect(service.updateNote(validUpdateCommand)).rejects.toThrow(BusinessRuleViolationError);
    });

    it('preserves domain and not found errors without wrapping', async () => {
      const notFoundError = new NoteNotFoundError(noteId);
      mockRepository.findById.mockRejectedValueOnce(notFoundError);

      await expect(service.updateNote(validUpdateCommand)).rejects.toThrow(notFoundError);
    });
  });

  describe('deleteNote()', () => {
    let existingNote: NoteAggregate;

    beforeEach(() => {
      existingNote = createTestNote(noteId);
    });

    it('deletes existing note', async () => {
      mockRepository.findById.mockResolvedValueOnce(existingNote);
      mockRepository.delete.mockResolvedValueOnce(undefined);

      await service.deleteNote(noteId, userId, orgId);

      expect(mockRepository.findById).toHaveBeenCalledWith(
        NoteId.create(noteId),
        userId,
        orgId
      );
      expect(mockRepository.delete).toHaveBeenCalledWith(
        NoteId.create(noteId),
        userId,
        orgId
      );
    });

    it('throws error when note not found', async () => {
      mockRepository.findById.mockResolvedValueOnce(null);

      await expect(service.deleteNote(noteId, userId, orgId)).rejects.toThrow(NoteNotFoundError);
      expect(mockRepository.delete).not.toHaveBeenCalled();
    });

    it('wraps repository errors in domain errors', async () => {
      mockRepository.findById.mockResolvedValueOnce(existingNote);
      mockRepository.delete.mockRejectedValueOnce(new Error('Database error'));

      await expect(service.deleteNote(noteId, userId, orgId)).rejects.toThrow(BusinessRuleViolationError);
    });

    it('preserves domain errors without wrapping', async () => {
      const domainError = new BusinessRuleViolationError('Domain error');
      mockRepository.findById.mockRejectedValueOnce(domainError);

      await expect(service.deleteNote(noteId, userId, orgId)).rejects.toThrow(domainError);
    });
  });

  describe('getNotes()', () => {
    it('returns all notes for user and organization', async () => {
      const notes = [
        createTestNote('note-1', 0),
        createTestNote('note-2', 1),
        createTestNote('note-3', 2)
      ];
      mockRepository.findByUserAndOrganization.mockResolvedValueOnce(notes);

      const result = await service.getNotes(userId, orgId);

      expect(result).toEqual(notes);
      expect(mockRepository.findByUserAndOrganization).toHaveBeenCalledWith(userId, orgId);
    });

    it('returns empty array when no notes found', async () => {
      mockRepository.findByUserAndOrganization.mockResolvedValueOnce([]);

      const result = await service.getNotes(userId, orgId);

      expect(result).toEqual([]);
    });

    it('wraps repository errors in domain errors', async () => {
      mockRepository.findByUserAndOrganization.mockRejectedValueOnce(new Error('Database error'));

      await expect(service.getNotes(userId, orgId)).rejects.toThrow(BusinessRuleViolationError);
    });

    it('preserves domain errors without wrapping', async () => {
      const domainError = new BusinessRuleViolationError('Domain error');
      mockRepository.findByUserAndOrganization.mockRejectedValueOnce(domainError);

      await expect(service.getNotes(userId, orgId)).rejects.toThrow(domainError);
    });
  });

  describe('getNote()', () => {
    let existingNote: NoteAggregate;

    beforeEach(() => {
      existingNote = createTestNote(noteId);
    });

    it('returns specific note by ID', async () => {
      mockRepository.findById.mockResolvedValueOnce(existingNote);

      const result = await service.getNote(noteId, userId, orgId);

      expect(result).toEqual(existingNote);
      expect(mockRepository.findById).toHaveBeenCalledWith(
        NoteId.create(noteId),
        userId,
        orgId
      );
    });

    it('throws error when note not found', async () => {
      mockRepository.findById.mockResolvedValueOnce(null);

      await expect(service.getNote(noteId, userId, orgId)).rejects.toThrow(NoteNotFoundError);
    });

    it('wraps repository errors in domain errors', async () => {
      mockRepository.findById.mockRejectedValueOnce(new Error('Database error'));

      await expect(service.getNote(noteId, userId, orgId)).rejects.toThrow(BusinessRuleViolationError);
    });

    it('preserves domain errors without wrapping', async () => {
      const domainError = new BusinessRuleViolationError('Domain error');
      mockRepository.findById.mockRejectedValueOnce(domainError);

      await expect(service.getNote(noteId, userId, orgId)).rejects.toThrow(domainError);
    });
  });

  describe('reorderNotes()', () => {
    const validReorderCommand: ReorderNotesCommand = {
      orderedNoteIds: ['note-1', 'note-3', 'note-2'],
      userId,
      organizationId: orgId
    };

    let existingNotes: NoteAggregate[];

    beforeEach(() => {
      existingNotes = [
        createTestNote('note-1', 0),
        createTestNote('note-2', 1),
        createTestNote('note-3', 2)
      ];
    });

    it('reorders notes using domain service', async () => {
      mockRepository.findByUserAndOrganization.mockResolvedValueOnce(existingNotes);
      mockRepository.updatePositions.mockResolvedValueOnce(undefined);

      // Mock the domain service calculation
      const mockCalculateReorderPositions = vi.spyOn(NotesOrderingService, 'calculateReorderPositions');
      const expectedUpdates = [
        { id: NoteId.create('note-1'), position: 0 },
        { id: NoteId.create('note-3'), position: 1 },
        { id: NoteId.create('note-2'), position: 2 }
      ];
      mockCalculateReorderPositions.mockReturnValueOnce(expectedUpdates);

      await service.reorderNotes(validReorderCommand);

      expect(mockRepository.findByUserAndOrganization).toHaveBeenCalledWith(userId, orgId);
      expect(mockCalculateReorderPositions).toHaveBeenCalledWith(
        validReorderCommand.orderedNoteIds,
        existingNotes
      );
      expect(mockRepository.updatePositions).toHaveBeenCalledWith(
        expectedUpdates,
        userId,
        orgId
      );

      mockCalculateReorderPositions.mockRestore();
    });

    it('propagates domain service validation errors', async () => {
      mockRepository.findByUserAndOrganization.mockResolvedValueOnce(existingNotes);

      const mockCalculateReorderPositions = vi.spyOn(NotesOrderingService, 'calculateReorderPositions');
      const domainError = new BusinessRuleViolationError('Invalid reorder');
      mockCalculateReorderPositions.mockImplementationOnce(() => {
        throw domainError;
      });

      await expect(service.reorderNotes(validReorderCommand)).rejects.toThrow(domainError);
      expect(mockRepository.updatePositions).not.toHaveBeenCalled();

      mockCalculateReorderPositions.mockRestore();
    });

    it('wraps repository errors in domain errors', async () => {
      mockRepository.findByUserAndOrganization.mockResolvedValueOnce(existingNotes);
      mockRepository.updatePositions.mockRejectedValueOnce(new Error('Database error'));

      const mockCalculateReorderPositions = vi.spyOn(NotesOrderingService, 'calculateReorderPositions');
      mockCalculateReorderPositions.mockReturnValueOnce([]);

      await expect(service.reorderNotes(validReorderCommand)).rejects.toThrow(BusinessRuleViolationError);

      mockCalculateReorderPositions.mockRestore();
    });

    it('handles empty reorder list', async () => {
      const emptyCommand: ReorderNotesCommand = {
        orderedNoteIds: [],
        userId,
        organizationId: orgId
      };

      mockRepository.findByUserAndOrganization.mockResolvedValueOnce(existingNotes);
      mockRepository.updatePositions.mockResolvedValueOnce(undefined);

      const mockCalculateReorderPositions = vi.spyOn(NotesOrderingService, 'calculateReorderPositions');
      mockCalculateReorderPositions.mockReturnValueOnce([]);

      await service.reorderNotes(emptyCommand);

      expect(mockCalculateReorderPositions).toHaveBeenCalledWith([], existingNotes);
      expect(mockRepository.updatePositions).toHaveBeenCalledWith([], userId, orgId);

      mockCalculateReorderPositions.mockRestore();
    });
  });

  describe('Error Context and Logging', () => {
    it('includes command context in create errors', async () => {
      const command: CreateNoteCommand = {
        title: 'Test',
        content: 'Test',
        userId,
        organizationId: orgId
      };

      mockRepository.getNextPosition.mockResolvedValueOnce(0);
      mockRepository.save.mockRejectedValueOnce(new Error('Database error'));

      try {
        await service.createNote(command);
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeInstanceOf(BusinessRuleViolationError);
        expect((error as BusinessRuleViolationError).context).toEqual({
          error: 'Database error',
          command
        });
      }
    });

    it('includes command context in update errors', async () => {
      const command: UpdateNoteCommand = {
        id: noteId,
        title: 'Updated',
        userId,
        organizationId: orgId
      };

      mockRepository.findById.mockResolvedValueOnce(createTestNote(noteId));
      mockRepository.update.mockRejectedValueOnce(new Error('Update failed'));

      try {
        await service.updateNote(command);
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeInstanceOf(BusinessRuleViolationError);
        expect((error as BusinessRuleViolationError).context).toEqual({
          error: 'Update failed',
          command
        });
      }
    });

    it('includes context in delete errors', async () => {
      mockRepository.findById.mockResolvedValueOnce(createTestNote(noteId));
      mockRepository.delete.mockRejectedValueOnce(new Error('Delete failed'));

      try {
        await service.deleteNote(noteId, userId, orgId);
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeInstanceOf(BusinessRuleViolationError);
        expect((error as BusinessRuleViolationError).context).toEqual({
          error: 'Delete failed',
          noteId,
          userId,
          organizationId: orgId
        });
      }
    });

    it('includes context in fetch errors', async () => {
      mockRepository.findByUserAndOrganization.mockRejectedValueOnce(new Error('Fetch failed'));

      try {
        await service.getNotes(userId, orgId);
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeInstanceOf(BusinessRuleViolationError);
        expect((error as BusinessRuleViolationError).context).toEqual({
          error: 'Fetch failed',
          userId,
          organizationId: orgId
        });
      }
    });
  });

  describe('Integration Workflows', () => {
    it('handles complete CRUD workflow', async () => {
      // Create
      const createCommand: CreateNoteCommand = {
        title: 'Test Note',
        content: 'Test content',
        userId,
        organizationId: orgId
      };

      mockRepository.getNextPosition.mockResolvedValueOnce(0);
      mockRepository.save.mockResolvedValueOnce(undefined);

      const createdNote = await service.createNote(createCommand);
      expect(createdNote.title).toBe(createCommand.title);

      // Read
      mockRepository.findById.mockResolvedValueOnce(createdNote);
      const fetchedNote = await service.getNote(createdNote.id.value, userId, orgId);
      expect(fetchedNote).toEqual(createdNote);

      // Update
      const updateCommand: UpdateNoteCommand = {
        id: createdNote.id.value,
        title: 'Updated Title',
        userId,
        organizationId: orgId
      };

      mockRepository.findById.mockResolvedValueOnce(createdNote);
      mockRepository.update.mockResolvedValueOnce(undefined);

      const updatedNote = await service.updateNote(updateCommand);
      expect(updatedNote.title).toBe(updateCommand.title);

      // Delete
      mockRepository.findById.mockResolvedValueOnce(updatedNote);
      mockRepository.delete.mockResolvedValueOnce(undefined);

      await service.deleteNote(updatedNote.id.value, userId, orgId);
      expect(mockRepository.delete).toHaveBeenCalledWith(
        updatedNote.id,
        userId,
        orgId
      );
    });

    it('handles reorder workflow with domain validation', async () => {
      const notes = [
        createTestNote('note-1', 0),
        createTestNote('note-2', 1),
        createTestNote('note-3', 2)
      ];

      mockRepository.findByUserAndOrganization.mockResolvedValueOnce(notes);
      mockRepository.updatePositions.mockResolvedValueOnce(undefined);

      const reorderCommand: ReorderNotesCommand = {
        orderedNoteIds: ['note-3', 'note-1', 'note-2'],
        userId,
        organizationId: orgId
      };

      const mockCalculateReorderPositions = vi.spyOn(NotesOrderingService, 'calculateReorderPositions');
      const expectedUpdates = [
        { id: NoteId.create('note-3'), position: 0 },
        { id: NoteId.create('note-1'), position: 1 },
        { id: NoteId.create('note-2'), position: 2 }
      ];
      mockCalculateReorderPositions.mockReturnValueOnce(expectedUpdates);

      await service.reorderNotes(reorderCommand);

      expect(mockCalculateReorderPositions).toHaveBeenCalledWith(
        reorderCommand.orderedNoteIds,
        notes
      );
      expect(mockRepository.updatePositions).toHaveBeenCalledWith(
        expectedUpdates,
        userId,
        orgId
      );

      mockCalculateReorderPositions.mockRestore();
    });
  });
});