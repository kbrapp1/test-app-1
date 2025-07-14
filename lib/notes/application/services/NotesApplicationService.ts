/**
 * Notes Application Service - Application Layer
 * 
 * AI INSTRUCTIONS:
 * - Orchestrate domain objects without containing business logic
 * - Handle workflow coordination only
 * - Delegate all business logic to domain services and aggregates
 * - Use domain repository interfaces
 * - Follow @golden-rule application service patterns exactly
 * - ADD: Permission validation for all operations
 */

import { INotesRepository } from '../../domain/repositories/INotesRepository';
import { NoteAggregate } from '../../domain/aggregates/NoteAggregate';
import { NoteId } from '../../domain/value-objects/NoteId';
import { NotesOrderingService } from '../../domain/services/NotesOrderingService';
import { BusinessRuleViolationError, NoteNotFoundError } from '../../domain/errors/NotesDomainError';
import { Permission } from '@/lib/auth/domain/value-objects/Permission';
import { UserRole } from '@/lib/auth/domain/value-objects/UserRole';
import { ROLE_PERMISSIONS } from '@/lib/auth/domain/value-objects/Permission';
import { createClient } from '@/lib/supabase/server';
import { AppError } from '@/lib/errors/base';

/**
 * Interface for Supabase query result with joined roles table
 */
interface MembershipWithRole {
  role_id: string;
  roles: {
    name: string;
  }[];
}

export interface CreateNoteCommand {
  title: string | null;
  content: string | null;
  userId: string;
  organizationId: string;
  position?: number;
  colorClass?: string;
}

export interface UpdateNoteCommand {
  id: string;
  title?: string | null;
  content?: string | null;
  position?: number;
  colorClass?: string;
  userId: string;
  organizationId: string;
}

export interface ReorderNotesCommand {
  orderedNoteIds: string[];
  userId: string;
  organizationId: string;
}

export class NotesApplicationService {
  constructor(private readonly notesRepository: INotesRepository) {}

  /**
   * Validate user permissions for note operations
   * AI: Proper permission validation using PermissionService
   */
  private async validatePermissions(
    userId: string,
    organizationId: string,
    requiredPermissions: Permission[]
  ): Promise<void> {
    if (!userId || !organizationId) {
      throw new BusinessRuleViolationError(
        'User ID and Organization ID are required for permission validation',
        { userId, organizationId }
      );
    }

    try {
      // Get user role from organization_memberships table
      const supabase = createClient();
      const { data: membershipData, error } = await supabase
        .from('organization_memberships')
        .select(`
          role_id,
          roles!inner(name)
        `)
        .eq('user_id', userId)
        .eq('organization_id', organizationId)
        .single();

      if (error || !membershipData) {
        throw new BusinessRuleViolationError(
          'User membership not found for organization',
          { userId, organizationId, error: error?.message }
        );
      }

      // Get role name from the joined roles table
      const typedMembershipData = membershipData as MembershipWithRole;
      const roleName = typedMembershipData.roles?.[0]?.name;
      if (!roleName) {
        throw new BusinessRuleViolationError(
          'Role information not found',
          { userId, organizationId, roleId: membershipData.role_id }
        );
      }

      // Convert role name to Role enum
      const roleEnum = this.mapRoleNameToEnum(roleName);
      
      // Get permissions for this role
      const rolePermissions = ROLE_PERMISSIONS[roleEnum] || [];

      // Check if user has all required permissions
      const hasAllPermissions = requiredPermissions.every((permission: Permission) => 
        rolePermissions.includes(permission)
      );

      if (!hasAllPermissions) {
        throw new BusinessRuleViolationError(
          'Insufficient permissions for this operation',
          { 
            userId, 
            organizationId, 
            userRole: roleName,
            requiredPermissions: requiredPermissions.map((p: Permission) => p.toString()),
            userPermissions: rolePermissions.map((p: Permission) => p.toString())
          }
        );
      }
    } catch (error) {
      if (error instanceof BusinessRuleViolationError) {
        throw error;
      }
      throw new AppError(
        'Failed to validate user permissions',
        'PERMISSION_VALIDATION_ERROR',
        500,
        { userId, organizationId, originalError: error }
      );
    }
  }

  /**
   * Maps role name from database to UserRole enum
   */
  private mapRoleNameToEnum(roleName: string): UserRole {
    switch (roleName.toLowerCase()) {
      case 'admin':
        return UserRole.ADMIN;
      case 'editor':
        return UserRole.EDITOR;
      case 'member':
        return UserRole.MEMBER;
      case 'viewer':
        return UserRole.VIEWER;
      case 'visitor':
        return UserRole.VISITOR;
      default:
        throw new BusinessRuleViolationError(
          'Unknown role name',
          { roleName, validRoles: Object.values(UserRole) }
        );
    }
  }

  /**
   * Create a new note with permission validation
   */
  async createNote(command: CreateNoteCommand): Promise<NoteAggregate> {
    try {
      // Validate permissions
      await this.validatePermissions(
        command.userId,
        command.organizationId,
        [Permission.CREATE_NOTE]
      );

      // Get next position if not provided
      const position = command.position !== undefined 
        ? command.position 
        : await this.notesRepository.getNextPosition(command.userId, command.organizationId);

      // Create domain aggregate
      const note = NoteAggregate.create(
        command.title,
        command.content,
        command.userId,
        command.organizationId,
        position,
        command.colorClass
      );

      // Save to repository
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

  /**
   * Update an existing note with permission validation
   */
  async updateNote(command: UpdateNoteCommand): Promise<NoteAggregate> {
    try {
      // Validate permissions
      await this.validatePermissions(
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

      // Update content if provided
      if (command.title !== undefined || command.content !== undefined) {
        const newTitle = command.title !== undefined ? command.title : note.title;
        const newContent = command.content !== undefined ? command.content : note.content;
        note.updateContent(newTitle, newContent);
      }

      // Update position if provided
      if (command.position !== undefined) {
        note.updatePosition(command.position);
      }

      // Update color class if provided
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

  /**
   * Delete a note with permission validation
   */
  async deleteNote(noteId: string, userId: string, organizationId: string): Promise<void> {
    try {
      // Validate permissions
      await this.validatePermissions(
        userId,
        organizationId,
        [Permission.DELETE_NOTE]
      );

      const id = NoteId.create(noteId);

      // Verify note exists before deletion
      const note = await this.notesRepository.findById(id, userId, organizationId);
      if (!note) {
        throw new NoteNotFoundError(noteId, { userId, organizationId });
      }

      await this.notesRepository.delete(id, userId, organizationId);
    } catch (error) {
      if (error instanceof BusinessRuleViolationError || error instanceof NoteNotFoundError) {
        throw error;
      }
      throw new BusinessRuleViolationError(
        'Failed to delete note',
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
   * Get all notes for a user in an organization with permission validation
   */
  async getNotes(userId: string, organizationId: string): Promise<NoteAggregate[]> {
    try {
      // Validate permissions
      await this.validatePermissions(
        userId,
        organizationId,
        [Permission.VIEW_NOTE]
      );

      return await this.notesRepository.findByUserAndOrganization(userId, organizationId);
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
   * Get a specific note with permission validation
   */
  async getNote(noteId: string, userId: string, organizationId: string): Promise<NoteAggregate> {
    try {
      // Validate permissions
      await this.validatePermissions(
        userId,
        organizationId,
        [Permission.VIEW_NOTE]
      );

      const id = NoteId.create(noteId);
      const note = await this.notesRepository.findById(id, userId, organizationId);
      
      if (!note) {
        throw new NoteNotFoundError(noteId, { userId, organizationId });
      }

      return note;
    } catch (error) {
      if (error instanceof BusinessRuleViolationError || error instanceof NoteNotFoundError) {
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
   * Reorder notes with permission validation
   */
  async reorderNotes(command: ReorderNotesCommand): Promise<void> {
    try {
      // Validate permissions
      await this.validatePermissions(
        command.userId,
        command.organizationId,
        [Permission.UPDATE_NOTE]
      );

      // Get existing notes
      const notes = await this.notesRepository.findByUserAndOrganization(
        command.userId,
        command.organizationId
      );

      // Calculate new positions using domain service
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