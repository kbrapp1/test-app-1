/**
 * Lead CRUD Service
 * 
 * Single responsibility: Basic CRUD operations for leads
 * Handles create, read, update, delete operations with error handling
 * No business logic - pure data persistence operations
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { Lead } from '../../../../domain/entities/Lead';
import { LeadMapper, RawLeadDbRecord } from '../mappers/LeadMapper';
import { DatabaseError } from '../../../../domain/errors/ChatbotWidgetDomainErrors';

export class LeadCrudService {
  constructor(
    private supabase: SupabaseClient,
    private tableName: string = 'leads'
  ) {}

  async findById(id: string): Promise<Lead | null> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw new DatabaseError(`Failed to find lead by ID: ${error.message}`);
      }

      return data ? LeadMapper.toDomain(data as RawLeadDbRecord) : null;
    } catch (error) {
      throw new DatabaseError(`Failed to find lead by ID: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async findBySessionId(sessionId: string): Promise<Lead | null> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('*')
        .eq('session_id', sessionId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw new DatabaseError(`Failed to find lead by session ID: ${error.message}`);
      }

      return data ? LeadMapper.toDomain(data as RawLeadDbRecord) : null;
    } catch (error) {
      throw new DatabaseError(`Failed to find lead by session ID: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async findByOrganizationId(organizationId: string): Promise<Lead[]> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new DatabaseError(`Failed to find leads by organization: ${error.message}`);
      }

      return data.map(record => LeadMapper.toDomain(record as RawLeadDbRecord));
    } catch (error) {
      throw new DatabaseError(`Failed to find leads by organization: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async findByEmail(email: string, organizationId: string): Promise<Lead[]> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('*')
        .eq('organization_id', organizationId)
        .ilike('email', email);

      if (error) {
        throw new DatabaseError(`Failed to find leads by email: ${error.message}`);
      }

      return data.map(record => LeadMapper.toDomain(record as RawLeadDbRecord));
    } catch (error) {
      throw new DatabaseError(`Failed to find leads by email: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async findByAssignedTo(userId: string, organizationId: string): Promise<Lead[]> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('*')
        .eq('organization_id', organizationId)
        .eq('assigned_to', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new DatabaseError(`Failed to find leads by assigned user: ${error.message}`);
      }

      return data.map(record => LeadMapper.toDomain(record as RawLeadDbRecord));
    } catch (error) {
      throw new DatabaseError(`Failed to find leads by assigned user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async create(lead: Lead): Promise<Lead> {
    try {
      const insertData = LeadMapper.toInsert(lead);
      const { data, error } = await this.supabase
        .from(this.tableName)
        .insert(insertData)
        .select()
        .single();

      if (error) {
        throw new DatabaseError(`Failed to create lead: ${error.message}`);
      }

      return LeadMapper.toDomain(data as RawLeadDbRecord);
    } catch (error) {
      throw new DatabaseError(`Failed to create lead: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async update(lead: Lead): Promise<Lead> {
    try {
      const updateData = LeadMapper.toUpdate(lead);
      const { data, error } = await this.supabase
        .from(this.tableName)
        .update(updateData)
        .eq('id', lead.id)
        .select()
        .single();

      if (error) {
        throw new DatabaseError(`Failed to update lead: ${error.message}`);
      }

      return LeadMapper.toDomain(data as RawLeadDbRecord);
    } catch (error) {
      throw new DatabaseError(`Failed to update lead: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from(this.tableName)
        .delete()
        .eq('id', id);

      if (error) {
        throw new DatabaseError(`Failed to delete lead: ${error.message}`);
      }
    } catch (error) {
      throw new DatabaseError(`Failed to delete lead: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}