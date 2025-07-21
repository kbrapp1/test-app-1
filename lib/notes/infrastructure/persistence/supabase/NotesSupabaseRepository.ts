/**
 * Notes Supabase Repository - Infrastructure Layer
 * 
 * AI INSTRUCTIONS:
 * - Implement domain repository interface using Supabase
 * - Handle database-specific logic and transformations
 * - Convert between domain entities and database rows
 * - Follow @golden-rule repository implementation patterns exactly
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { INotesRepository } from '../../../domain/repositories/INotesRepository';
import { NoteAggregate } from '../../../domain/aggregates/NoteAggregate';
import { NoteId } from '../../../domain/value-objects/NoteId';
import { BusinessRuleViolationError } from '../../../domain/errors/NotesDomainError';

interface DatabaseNoteRow {
  id: string;
  title: string | null;
  content: string | null;
  color_class: string;
  position: number;
  user_id: string;
  organization_id: string;
  created_at: string;
  updated_at: string | null;
}

export class NotesSupabaseRepository implements INotesRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async findByUserAndOrganization(userId: string, organizationId: string): Promise<NoteAggregate[]> {
    try {
      const { data, error } = await this.supabase
        .from('notes')
        .select('*')
        .eq('user_id', userId)
        .eq('organization_id', organizationId)
        .order('position', { ascending: true });

      if (error) {
        throw new BusinessRuleViolationError(
          'Failed to fetch notes from database',
          { error: error.message, userId, organizationId }
        );
      }

      return (data || []).map(row => this.mapToAggregate(row));
    } catch (error) {
      if (error instanceof BusinessRuleViolationError) {
        throw error;
      }
      throw new BusinessRuleViolationError(
        'Unexpected error fetching notes',
        { error: error instanceof Error ? error.message : 'Unknown error', userId, organizationId }
      );
    }
  }

  async findById(id: NoteId, userId: string, organizationId: string): Promise<NoteAggregate | null> {
    try {
      const { data, error } = await this.supabase
        .from('notes')
        .select('*')
        .eq('id', id.value)
        .eq('user_id', userId)
        .eq('organization_id', organizationId)
        .maybeSingle();

      if (error) {
        throw new BusinessRuleViolationError(
          'Failed to fetch note from database',
          { error: error.message, noteId: id.value, userId, organizationId }
        );
      }

      return data ? this.mapToAggregate(data) : null;
    } catch (error) {
      if (error instanceof BusinessRuleViolationError) {
        throw error;
      }
      throw new BusinessRuleViolationError(
        'Unexpected error fetching note',
        { error: error instanceof Error ? error.message : 'Unknown error', noteId: id.value }
      );
    }
  }

  async save(note: NoteAggregate): Promise<void> {
    try {
      const dbFormat = note.toDatabaseFormat();
      
      // Exclude created_at and updated_at from insert - let database set defaults
      const { created_at, updated_at, ...insertData } = dbFormat;
      
      const { error } = await this.supabase
        .from('notes')
        .insert(insertData);

      if (error) {
        throw new BusinessRuleViolationError(
          'Failed to save note to database',
          { error: error.message, noteId: note.id.value }
        );
      }
    } catch (error) {
      if (error instanceof BusinessRuleViolationError) {
        throw error;
      }
      throw new BusinessRuleViolationError(
        'Unexpected error saving note',
        { error: error instanceof Error ? error.message : 'Unknown error', noteId: note.id.value }
      );
    }
  }

  async update(note: NoteAggregate): Promise<void> {
    try {
      const dbFormat = note.toDatabaseFormat();
      
      const { error } = await this.supabase
        .from('notes')
        .update({
          title: dbFormat.title,
          content: dbFormat.content,
          color_class: dbFormat.color_class,
          position: dbFormat.position,
          updated_at: dbFormat.updated_at
        })
        .eq('id', dbFormat.id)
        .eq('user_id', dbFormat.user_id)
        .eq('organization_id', dbFormat.organization_id);

      if (error) {
        throw new BusinessRuleViolationError(
          'Failed to update note in database',
          { error: error.message, noteId: note.id.value }
        );
      }
    } catch (error) {
      if (error instanceof BusinessRuleViolationError) {
        throw error;
      }
      throw new BusinessRuleViolationError(
        'Unexpected error updating note',
        { error: error instanceof Error ? error.message : 'Unknown error', noteId: note.id.value }
      );
    }
  }

  async delete(id: NoteId, userId: string, organizationId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('notes')
        .delete()
        .eq('id', id.value)
        .eq('user_id', userId)
        .eq('organization_id', organizationId);

      if (error) {
        throw new BusinessRuleViolationError(
          'Failed to delete note from database',
          { error: error.message, noteId: id.value, userId, organizationId }
        );
      }
    } catch (error) {
      if (error instanceof BusinessRuleViolationError) {
        throw error;
      }
      throw new BusinessRuleViolationError(
        'Unexpected error deleting note',
        { error: error instanceof Error ? error.message : 'Unknown error', noteId: id.value }
      );
    }
  }

  async updatePositions(
    notes: Array<{ id: NoteId; position: number }>, 
    userId: string, 
    organizationId: string
  ): Promise<void> {
    try {
      // Use a transaction-like approach with individual updates
      // Supabase doesn't support true transactions in the client library
      const updatePromises = notes.map(({ id, position }) =>
        this.supabase
          .from('notes')
          .update({ 
            position,
            updated_at: new Date().toISOString()
          })
          .eq('id', id.value)
          .eq('user_id', userId)
          .eq('organization_id', organizationId)
      );

      const results = await Promise.all(updatePromises);
      
      // Check for any errors
      const errors = results.filter(result => result.error);
      if (errors.length > 0) {
        throw new BusinessRuleViolationError(
          'Failed to update note positions in database',
          { 
            errors: errors.map(e => e.error?.message),
            noteIds: notes.map(n => n.id.value),
            userId,
            organizationId
          }
        );
      }
    } catch (error) {
      if (error instanceof BusinessRuleViolationError) {
        throw error;
      }
      throw new BusinessRuleViolationError(
        'Unexpected error updating note positions',
        { 
          error: error instanceof Error ? error.message : 'Unknown error',
          noteIds: notes.map(n => n.id.value)
        }
      );
    }
  }

  async getNextPosition(userId: string, organizationId: string): Promise<number> {
    try {
      const { data, error } = await this.supabase
        .from('notes')
        .select('position')
        .eq('user_id', userId)
        .eq('organization_id', organizationId)
        .order('position', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        throw new BusinessRuleViolationError(
          'Failed to get next position from database',
          { error: error.message, userId, organizationId }
        );
      }

      return data ? data.position + 1 : 0;
    } catch (error) {
      if (error instanceof BusinessRuleViolationError) {
        throw error;
      }
      throw new BusinessRuleViolationError(
        'Unexpected error getting next position',
        { error: error instanceof Error ? error.message : 'Unknown error', userId, organizationId }
      );
    }
  }

  private mapToAggregate(row: DatabaseNoteRow): NoteAggregate {
    return NoteAggregate.fromExisting(
      row.id,
      row.title,
      row.content,
      row.color_class,
      row.position,
      row.user_id,
      row.organization_id,
      new Date(row.created_at),
      row.updated_at ? new Date(row.updated_at) : null
    );
  }
} 