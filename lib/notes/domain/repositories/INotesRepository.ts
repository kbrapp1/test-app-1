/**
 * Notes Repository Interface - Domain Layer
 * 
 * AI INSTRUCTIONS:
 * - Define data access contracts only, no implementations
 * - Use domain entities and value objects
 * - Keep interface focused on essential operations
 * - Follow @golden-rule repository patterns exactly
 */

import { NoteAggregate } from '../aggregates/NoteAggregate';
import { NoteId } from '../value-objects/NoteId';

export interface INotesRepository {
  /**
   * Find all notes for a user in an organization
   */
  findByUserAndOrganization(userId: string, organizationId: string): Promise<NoteAggregate[]>;

  /**
   * Find a specific note by ID
   */
  findById(id: NoteId, userId: string, organizationId: string): Promise<NoteAggregate | null>;

  /**
   * Save a new note
   */
  save(note: NoteAggregate): Promise<void>;

  /**
   * Update an existing note
   */
  update(note: NoteAggregate): Promise<void>;

  /**
   * Delete a note
   */
  delete(id: NoteId, userId: string, organizationId: string): Promise<void>;

  /**
   * Update positions for multiple notes (for reordering)
   */
  updatePositions(notes: Array<{ id: NoteId; position: number }>, userId: string, organizationId: string): Promise<void>;

  /**
   * Get the next available position for a new note
   */
  getNextPosition(userId: string, organizationId: string): Promise<number>;
} 