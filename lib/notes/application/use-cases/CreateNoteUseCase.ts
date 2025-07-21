/**
 * Create Note Use Case - Application Layer
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Handle note creation workflow
 * - Use dependency injection for domain services and repositories
 * - Contains no business logic - delegates to domain objects
 * - Follows CQRS command pattern
 * - Follow @golden-rule patterns exactly
 */

import { INotesRepository } from '../../domain/repositories/INotesRepository';
import { IPermissionService } from '../../domain/services/IPermissionService';
import { NoteAggregate } from '../../domain/aggregates/NoteAggregate';
import { BusinessRuleViolationError } from '../../domain/errors/NotesDomainError';
import { Permission } from '@/lib/auth/domain/value-objects/Permission';

export interface CreateNoteCommand {
  title: string | null;
  content: string | null;
  userId: string;
  organizationId: string;
  position?: number;
  colorClass?: string;
}

export class CreateNoteUseCase {
  constructor(
    private readonly notesRepository: INotesRepository,
    private readonly permissionService: IPermissionService
  ) {}

  async execute(command: CreateNoteCommand): Promise<NoteAggregate> {
    // Transaction boundary: This operation is atomic
    // - Permission validation
    // - Position calculation
    // - Domain object creation + validation
    // - Repository save (with domain events)
    try {
      // Validate permissions using domain service
      await this.permissionService.validateNotePermissions(
        command.userId,
        command.organizationId,
        [Permission.CREATE_NOTE]
      );

      // Get next position if not provided
      const position = command.position !== undefined 
        ? command.position 
        : await this.notesRepository.getNextPosition(command.userId, command.organizationId);

      // Create domain aggregate (contains business logic)
      const note = NoteAggregate.create(
        command.title,
        command.content,
        command.userId,
        command.organizationId,
        position,
        command.colorClass
      );

      // Save using repository
      await this.notesRepository.save(note);

      return note;
    } catch (error) {
      if (error instanceof BusinessRuleViolationError) {
        throw error;
      }
      throw new BusinessRuleViolationError(
        'Failed to create note',
        { 
          error: error instanceof Error ? error.message : 'Unknown error',
          command
        }
      );
    }
  }
}