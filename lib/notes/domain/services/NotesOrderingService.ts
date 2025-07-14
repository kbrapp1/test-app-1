/**
 * Notes Ordering Service - Domain Service
 * 
 * AI INSTRUCTIONS:
 * - Keep business logic pure, no external dependencies
 * - Maintain single responsibility principle  
 * - Never exceed 250 lines - refactor into smaller services
 * - Follow @golden-rule patterns exactly
 * - Check for existing similar logic before creating new
 * - Always validate inputs using value objects
 * - Delegate complex calculations to separate methods
 * - Handle domain errors with specific error types
 * - Publish domain events for cross-aggregate communication
 * - ADD: Permission validation for note operations
 */

import { NoteAggregate } from '../aggregates/NoteAggregate';
import { NoteId } from '../value-objects/NoteId';
import { NotePositionConflictError, BusinessRuleViolationError } from '../errors/NotesDomainError';
import { Permission } from '@/lib/auth/domain/value-objects/Permission';
import { UserRole } from '@/lib/auth/domain/value-objects/UserRole';
import { PermissionService } from '@/lib/auth/domain/services/PermissionService';
// UserId import removed - not used in current implementation
import { OrganizationId } from '@/lib/auth/domain/value-objects/OrganizationId';
import { UserAggregate } from '@/lib/auth/domain/aggregates/UserAggregate';

export interface PositionUpdate {
  id: NoteId;
  position: number;
}

/**
 * Domain service for note positioning and ordering logic
 * 
 * AI INSTRUCTIONS:
 * - Pure business logic only
 * - No infrastructure dependencies
 * - Validate all inputs with domain errors
 * - Keep methods focused and single-purpose
 * - ADD: Permission validation for all operations
 */
export class NotesOrderingService {
  /**
   * Validates user permissions for note operations
   * AI: Domain-level permission validation
   */
  static validateNotePermissions(
    user: UserAggregate,
    userRole: UserRole,
    organizationId: OrganizationId,
    requiredPermissions: Permission[]
  ): void {
    const permissionResult = PermissionService.checkPermissions({
      userId: user.getId(),
      userRole,
      organizationId,
      requiredPermissions,
      user // Include for super admin bypass
    });

    if (!permissionResult.granted) {
      throw new BusinessRuleViolationError(
        `Insufficient permissions for note operation: ${permissionResult.reason}`,
        {
          userId: user.getId().value,
          organizationId: organizationId.value,
          requiredPermissions: requiredPermissions.map(p => p.toString()),
          missingPermissions: permissionResult.missingPermissions.map(p => p.toString()),
          userRole
        }
      );
    }
  }

  /**
   * Calculate new positions for reordering notes
   * Ensures no position conflicts and maintains sequential order
   */
  public static calculateReorderPositions(
    orderedNoteIds: string[],
    existingNotes: NoteAggregate[]
  ): PositionUpdate[] {
    if (orderedNoteIds.length === 0) {
      return [];
    }

    // Validate that all provided IDs exist in the notes collection
    const existingNoteIds = new Set(existingNotes.map(note => note.id.value));
    const missingIds = orderedNoteIds.filter(id => !existingNoteIds.has(id));
    
    if (missingIds.length > 0) {
      throw new BusinessRuleViolationError(
        'Cannot reorder notes: some note IDs do not exist',
        { missingIds, providedIds: orderedNoteIds }
      );
    }

    // Create position updates with sequential positions starting from 0
    const updates: PositionUpdate[] = orderedNoteIds.map((noteId, index) => ({
      id: NoteId.create(noteId),
      position: index
    }));

    return updates;
  }

  /**
   * Find the next available position for a new note
   * Ensures proper ordering without conflicts
   */
  public static calculateNextPosition(existingNotes: NoteAggregate[]): number {
    if (existingNotes.length === 0) {
      return 0;
    }

    const maxPosition = Math.max(...existingNotes.map(note => note.position));
    return maxPosition + 1;
  }

  /**
   * Validate that positions are sequential and conflict-free
   */
  public static validatePositions(notes: NoteAggregate[]): void {
    if (notes.length === 0) {
      return;
    }

    const positions = notes.map(note => note.position).sort((a, b) => a - b);
    
    // Check for negative positions
    if (positions[0] < 0) {
      throw new BusinessRuleViolationError(
        'Note positions cannot be negative',
        { invalidPosition: positions[0] }
      );
    }

    // Check for duplicate positions
    const duplicates = positions.filter((pos, index) => positions.indexOf(pos) !== index);
    if (duplicates.length > 0) {
      throw new NotePositionConflictError(
        duplicates[0],
        { duplicatePositions: duplicates }
      );
    }
  }

  /**
   * Normalize positions to be sequential starting from 0
   * Useful for cleaning up position gaps
   */
  public static normalizePositions(notes: NoteAggregate[]): PositionUpdate[] {
    if (notes.length === 0) {
      return [];
    }

    // Sort notes by current position
    const sortedNotes = [...notes].sort((a, b) => a.position - b.position);
    
    // Create updates for sequential positions
    const updates: PositionUpdate[] = sortedNotes.map((note, index) => ({
      id: note.id,
      position: index
    }));

    return updates;
  }

  /**
   * Insert a note at a specific position, shifting other notes as needed
   */
  public static calculateInsertPosition(
    targetPosition: number,
    existingNotes: NoteAggregate[]
  ): PositionUpdate[] {
    if (targetPosition < 0) {
      throw new BusinessRuleViolationError(
        'Cannot insert note at negative position',
        { targetPosition }
      );
    }

    const updates: PositionUpdate[] = [];
    
    // Find notes that need to be shifted
    const notesToShift = existingNotes.filter(note => note.position >= targetPosition);
    
    // Create updates to shift existing notes
    notesToShift.forEach(note => {
      updates.push({
        id: note.id,
        position: note.position + 1
      });
    });

    return updates;
  }
} 