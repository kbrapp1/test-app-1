/**
 * Delete Note Use Case - Application Layer
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Handle note deletion workflow
 * - Use dependency injection for domain services and repositories
 * - Contains no business logic - delegates to domain objects
 * - Follows CQRS command pattern
 * - Follow @golden-rule patterns exactly
 */

import { INotesRepository } from '../../domain/repositories/INotesRepository';
import { IPermissionService } from '../../domain/services/IPermissionService';
import { NoteId } from '../../domain/value-objects/NoteId';
import { BusinessRuleViolationError, NoteNotFoundError } from '../../domain/errors/NotesDomainError';
import { Permission } from '@/lib/auth/domain/value-objects/Permission';

export interface DeleteNoteCommand {
  noteId: string;
  userId: string;
  organizationId: string;
}

export class DeleteNoteUseCase {
  constructor(
    private readonly notesRepository: INotesRepository,
    private readonly permissionService: IPermissionService
  ) {}

  async execute(command: DeleteNoteCommand): Promise<void> {
    try {
      // Validate permissions using domain service
      await this.permissionService.validateNotePermissions(
        command.userId,
        command.organizationId,
        [Permission.DELETE_NOTE]
      );

      const noteId = NoteId.create(command.noteId);

      // Verify note exists before deletion
      const note = await this.notesRepository.findById(noteId, command.userId, command.organizationId);
      if (!note) {
        throw new NoteNotFoundError(command.noteId, { userId: command.userId, organizationId: command.organizationId });
      }

      // Delete note
      await this.notesRepository.delete(noteId, command.userId, command.organizationId);
    } catch (error) {
      if (error instanceof BusinessRuleViolationError || error instanceof NoteNotFoundError) {
        throw error;
      }
      throw new BusinessRuleViolationError(
        'Failed to delete note',
        { 
          error: error instanceof Error ? error.message : 'Unknown error',
          command
        }
      );
    }
  }
}