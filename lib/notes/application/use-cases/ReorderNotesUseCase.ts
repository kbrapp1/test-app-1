/**
 * Reorder Notes Use Case - Application Layer
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Handle note reordering workflow
 * - Use dependency injection for domain services and repositories
 * - Contains no business logic - delegates to domain objects
 * - Follows CQRS command pattern
 * - Follow @golden-rule patterns exactly
 */

import { INotesRepository } from '../../domain/repositories/INotesRepository';
import { IPermissionService } from '../../domain/services/IPermissionService';
import { NotesOrderingService } from '../../domain/services/NotesOrderingService';
import { BusinessRuleViolationError } from '../../domain/errors/NotesDomainError';
import { Permission } from '@/lib/auth/domain/value-objects/Permission';

export interface ReorderNotesCommand {
  orderedNoteIds: string[];
  userId: string;
  organizationId: string;
}

export class ReorderNotesUseCase {
  constructor(
    private readonly notesRepository: INotesRepository,
    private readonly permissionService: IPermissionService
  ) {}

  async execute(command: ReorderNotesCommand): Promise<void> {
    try {
      // Validate permissions using domain service
      await this.permissionService.validateNotePermissions(
        command.userId,
        command.organizationId,
        [Permission.UPDATE_NOTE]
      );

      // Get existing notes
      const notes = await this.notesRepository.findByUserAndOrganization(
        command.userId,
        command.organizationId
      );

      // Calculate new positions using domain service (business logic)
      const positionUpdates = NotesOrderingService.calculateReorderPositions(
        command.orderedNoteIds,
        notes
      );

      // Update positions in repository
      await this.notesRepository.updatePositions(
        positionUpdates,
        command.userId,
        command.organizationId
      );
    } catch (error) {
      if (error instanceof BusinessRuleViolationError) {
        throw error;
      }
      throw new BusinessRuleViolationError(
        'Failed to reorder notes',
        { 
          error: error instanceof Error ? error.message : 'Unknown error',
          command
        }
      );
    }
  }
}