/**
 * Lead Operations Service
 * 
 * Infrastructure service for basic lead CRUD operations.
 * Single responsibility: Handle create, read, update, delete operations.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { Lead } from '../../../../domain/entities/Lead';
import { FollowUpStatus } from '../../../../domain/entities/LeadLifecycleManager';
import { LeadMapper, RawLeadDbRecord } from '../mappers/LeadMapper';

export class LeadOperationsService {
  constructor(
    private supabase: SupabaseClient,
    private tableName: string = 'chat_leads'
  ) {}

  /** Find lead by ID */
  async findById(id: string): Promise<RawLeadDbRecord | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw error;
    }

    return data as RawLeadDbRecord;
  }

  /** Find lead by session ID */
  async findBySessionId(sessionId: string): Promise<RawLeadDbRecord | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('session_id', sessionId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw error;
    }

    return data as RawLeadDbRecord;
  }

  /** Find leads by email */
  async findByEmail(email: string, organizationId: string): Promise<RawLeadDbRecord[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('organization_id', organizationId)
      .eq('contact_info->>email', email)
      .order('captured_at', { ascending: false });

    if (error) {
      throw error;
    }

    return (data || []) as RawLeadDbRecord[];
  }

  /** Find leads by assigned user */
  async findByAssignedTo(userId: string, organizationId: string): Promise<RawLeadDbRecord[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('organization_id', organizationId)
      .eq('assigned_to', userId)
      .order('captured_at', { ascending: false });

    if (error) {
      throw error;
    }

    return (data || []) as RawLeadDbRecord[];
  }

  /** Save new lead */
  async save(lead: Lead): Promise<RawLeadDbRecord> {
    const insertData = LeadMapper.toInsert(lead);
    
    const { data, error } = await this.supabase
      .from(this.tableName)
      .insert(insertData)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data as RawLeadDbRecord;
  }

  /** Update existing lead */
  async update(lead: Lead): Promise<RawLeadDbRecord> {
    const updateData = LeadMapper.toUpdate(lead);
    
    const { data, error } = await this.supabase
      .from(this.tableName)
      .update(updateData)
      .eq('id', lead.id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data as RawLeadDbRecord;
  }

  /** Delete lead */
  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from(this.tableName)
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }
  }

  /** Bulk update leads */
  async updateBulk(leadIds: string[], updates: {
    followUpStatus?: FollowUpStatus;
    assignedTo?: string;
    tags?: { add?: string[]; remove?: string[] };
  }): Promise<number> {
    if (leadIds.length === 0) {
      return 0;
    }

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (updates.followUpStatus) {
      updateData.follow_up_status = updates.followUpStatus;
    }
    
    if (updates.assignedTo) {
      updateData.assigned_to = updates.assignedTo;
    }

    const { count, error } = await this.supabase
      .from(this.tableName)
      .update(updateData)
      .in('id', leadIds)
      .select('id');

    if (error) {
      throw error;
    }

    return count || 0;
  }

  /** Find leads for export */
  async findForExport(
    organizationId: string,
    filters?: {
      qualificationStatus?: string;
      followUpStatus?: string;
      dateFrom?: Date;
      dateTo?: Date;
    }
  ): Promise<RawLeadDbRecord[]> {
    let query = this.supabase
      .from(this.tableName)
      .select('*')
      .eq('organization_id', organizationId);

    // Apply filters
    if (filters?.qualificationStatus) {
      query = query.eq('qualification_status', filters.qualificationStatus);
    }
    if (filters?.followUpStatus) {
      query = query.eq('follow_up_status', filters.followUpStatus);
    }
    if (filters?.dateFrom) {
      query = query.gte('captured_at', filters.dateFrom.toISOString());
    }
    if (filters?.dateTo) {
      query = query.lte('captured_at', filters.dateTo.toISOString());
    }

    const { data, error } = await query
      .order('captured_at', { ascending: false });

    if (error) {
      throw error;
    }

    return (data || []) as RawLeadDbRecord[];
  }

  /** Find duplicate leads */
  async findDuplicates(organizationId: string): Promise<RawLeadDbRecord[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('organization_id', organizationId);

    if (error) {
      throw error;
    }

    return (data || []) as RawLeadDbRecord[];
  }
} 