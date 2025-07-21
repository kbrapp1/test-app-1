/**
 * Update Note Use Case - Application Layer
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Handle note update workflow
 * - Use dependency injection for domain services and repositories
 * - Contains no business logic - delegates to domain objects
 * - Follows CQRS command pattern
 * - Follow @golden-rule patterns exactly
 */

import { INotesRepository } from '../../domain/repositories/INotesRepository';
import { IPermissionService } from '../../domain/services/IPermissionService';
import { NoteAggregate } from '../../domain/aggregates/NoteAggregate';
import { NoteId } from '../../domain/value-objects/NoteId';
import { BusinessRuleViolationError, NoteNotFoundError } from '../../domain/errors/NotesDomainError';
import { Permission } from '@/lib/auth/domain/value-objects/Permission';

export interface UpdateNoteCommand {
  id: string;
  title?: string | null;
  content?: string | null;
  position?: number;
  colorClass?: string;
  userId: string;
  organizationId: string;
}

export class UpdateNoteUseCase {
  constructor(
    private readonly notesRepository: INotesRepository,
    private readonly permissionService: IPermissionService
  ) {}

  async execute(command: UpdateNoteCommand): Promise<NoteAggregate> {
    try {
      // Validate permissions using domain service
      await this.permissionService.validateNotePermissions(
        command.userId,
        command.organizationId,
        [Permission.UPDATE_NOTE]
      );

      const noteId = NoteId.create(command.id);

      // Find existing note
      const note = await this.notesRepository.findById(noteId, command.userId, command.organizationId);
      if (!note) {
        throw new NoteNotFoundError(command.id, { userId: command.userId, organizationId: command.organizationId });
      }

      // Update content if provided (business logic in domain)
      if (command.title !== undefined || command.content !== undefined) {
        const newTitle = command.title !== undefined ? command.title : note.title;
        const newContent = command.content !== undefined ? command.content : note.content;
        note.updateContent(newTitle, newContent);
      }

      // Update position if provided (business logic in domain)
      if (command.position !== undefined) {
        note.updatePosition(command.position);
      }

      // Update color class if provided (business logic in domain)
      if (command.colorClass !== undefined) {
        note.updateColorClass(command.colorClass);
      }

      // Save changes
      await this.notesRepository.update(note);

      return note;
    } catch (error) {
      if (error instanceof BusinessRuleViolationError || error instanceof NoteNotFoundError) {
        throw error;
      }
      throw new BusinessRuleViolationError(
        'Failed to update note',
        { 
          error: error instanceof Error ? error.message : 'Unknown error',
          command
        }
      );
    }
  }
}