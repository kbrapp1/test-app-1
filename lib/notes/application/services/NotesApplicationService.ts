/**
 * Notes Application Service - Application Layer
 * 
 * AI INSTRUCTIONS:
 * - REFACTORED: Now uses dependency injection and use cases following DAM pattern
 * - Orchestrate use cases without containing business logic
 * - Handle workflow coordination only
 * - Delegate all operations to focused use cases
 * - Use domain repository interfaces only
 * - Follow @golden-rule application service patterns exactly
 */

import { INotesRepository } from '../../domain/repositories/INotesRepository';
import { IPermissionService } from '../../domain/services/IPermissionService';
import { NoteId } from '../../domain/value-objects/NoteId';
import { CreateNoteUseCase, CreateNoteCommand } from '../use-cases/CreateNoteUseCase';
import { UpdateNoteUseCase, UpdateNoteCommand } from '../use-cases/UpdateNoteUseCase';
import { DeleteNoteUseCase, DeleteNoteCommand } from '../use-cases/DeleteNoteUseCase';
import { ReorderNotesUseCase, ReorderNotesCommand } from '../use-cases/ReorderNotesUseCase';
import { Permission } from '@/lib/auth/domain/value-objects/Permission';

import { NoteMapper, NoteDto } from '../mappers/NoteMapper';

// Re-export command interfaces and DTOs for external use
export type { CreateNoteCommand, UpdateNoteCommand, DeleteNoteCommand, ReorderNotesCommand, NoteDto };
import { BusinessRuleViolationError } from '../../domain/errors/NotesDomainError';

export class NotesApplicationService {
  private readonly createNoteUseCase: CreateNoteUseCase;
  private readonly updateNoteUseCase: UpdateNoteUseCase;
  private readonly deleteNoteUseCase: DeleteNoteUseCase;
  private readonly reorderNotesUseCase: ReorderNotesUseCase;

  constructor(
    private readonly notesRepository: INotesRepository,
    private readonly permissionService: IPermissionService
  ) {
    // Initialize use cases with injected dependencies
    this.createNoteUseCase = new CreateNoteUseCase(notesRepository, permissionService);
    this.updateNoteUseCase = new UpdateNoteUseCase(notesRepository, permissionService);
    this.deleteNoteUseCase = new DeleteNoteUseCase(notesRepository, permissionService);
    this.reorderNotesUseCase = new ReorderNotesUseCase(notesRepository, permissionService);
  }

  /**
   * Create a new note - delegates to use case
   */
  async createNote(command: CreateNoteCommand): Promise<NoteDto> {
    const noteAggregate = await this.createNoteUseCase.execute(command);
    return NoteMapper.toDto(noteAggregate);
  }

  /**
   * Update an existing note - delegates to use case
   */
  async updateNote(command: UpdateNoteCommand): Promise<NoteDto> {
    const noteAggregate = await this.updateNoteUseCase.execute(command);
    return NoteMapper.toDto(noteAggregate);
  }

  /**
   * Delete a note - delegates to use case
   */
  async deleteNote(noteId: string, userId: string, organizationId: string): Promise<void> {
    const command: DeleteNoteCommand = { noteId, userId, organizationId };
    await this.deleteNoteUseCase.execute(command);
  }

  /**
   * Get all notes for a user in an organization
   */
  async getNotes(userId: string, organizationId: string): Promise<NoteDto[]> {
    try {
      // Validate permissions using injected service
      await this.permissionService.validateNotePermissions(
        userId,
        organizationId,
[Permission.VIEW_NOTE]
      );

      const noteAggregates = await this.notesRepository.findByUserAndOrganization(userId, organizationId);
      return NoteMapper.toDtos(noteAggregates);
    } catch (error) {
      if (error instanceof BusinessRuleViolationError) {
        throw error;
      }
      throw new BusinessRuleViolationError(
        'Failed to fetch notes',
        { 
          error: error instanceof Error ? error.message : 'Unknown error',
          userId,
          organizationId
        }
      );
    }
  }

  /**
   * Get a specific note
   */
  async getNote(noteId: string, userId: string, organizationId: string): Promise<NoteDto> {
    try {
      // Validate permissions using injected service
      await this.permissionService.validateNotePermissions(
        userId,
        organizationId,
[Permission.VIEW_NOTE]
      );

      const id = NoteId.create(noteId);
      const noteAggregate = await this.notesRepository.findById(id, userId, organizationId);
      
      if (!noteAggregate) {
        throw new BusinessRuleViolationError(
          'Note not found',
          { noteId, userId, organizationId }
        );
      }

      return NoteMapper.toDto(noteAggregate);
    } catch (error) {
      if (error instanceof BusinessRuleViolationError) {
        throw error;
      }
      throw new BusinessRuleViolationError(
        'Failed to fetch note',
        { 
          error: error instanceof Error ? error.message : 'Unknown error',
          noteId,
          userId,
          organizationId
        }
      );
    }
  }

  /**
   * Reorder notes - delegates to use case
   */
  async reorderNotes(command: ReorderNotesCommand): Promise<void> {
    await this.reorderNotesUseCase.execute(command);
  }
}