/**
 * Lead Bulk Operations Service
 * 
 * Single responsibility: Bulk operations on leads
 * Handles bulk updates, duplicate detection, and multi-lead operations
 * Optimized for handling large datasets efficiently
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { Lead } from '../../../../domain/entities/Lead';
import { FollowUpStatus } from '../../../../domain/entities/LeadLifecycleManager';
import { LeadMapper, RawLeadDbRecord } from '../mappers/LeadMapper';
import { DatabaseError } from '../../../../domain/errors/ChatbotWidgetDomainErrors';

export interface BulkUpdateOptions {
  followUpStatus?: FollowUpStatus;
  assignedTo?: string;
  tags?: { add?: string[]; remove?: string[] };
}

export interface DuplicateLeadGroup {
  criteria: 'email' | 'phone';
  value: string;
  leads: Lead[];
}

export class LeadBulkOperationsService {
  constructor(
    private supabase: SupabaseClient,
    private tableName: string = 'leads'
  ) {}

  async updateBulk(leadIds: string[], updates: BulkUpdateOptions): Promise<number> {
    try {
      const updateData: Record<string, unknown> = {};
      
      if (updates.followUpStatus) {
        updateData.follow_up_status = updates.followUpStatus;
      }
      if (updates.assignedTo) {
        updateData.assigned_to = updates.assignedTo;
      }
      
      const { data, error } = await this.supabase
        .from(this.tableName)
        .update(updateData)
        .in('id', leadIds)
        .select('id');

      if (error) {
        throw error;
      }

      return (data || []).length;
    } catch (error) {
      throw new DatabaseError(`Failed to bulk update leads: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async findDuplicates(organizationId: string): Promise<DuplicateLeadGroup[]> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('*')
        .eq('organization_id', organizationId);

      if (error) {
        throw error;
      }

      const leads = (data || []).map(record => LeadMapper.toDomain(record as RawLeadDbRecord));
      return this.detectDuplicates(leads);
    } catch (error) {
      throw new DatabaseError(`Failed to find duplicate leads: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async findByIds(ids: string[]): Promise<Lead[]> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('*')
        .in('id', ids);

      if (error) {
        throw error;
      }

      return (data || []).map(record => LeadMapper.toDomain(record as RawLeadDbRecord));
    } catch (error) {
      throw new DatabaseError(`Failed to find leads by IDs: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async countByOrganization(organizationId: string): Promise<number> {
    try {
      const { count, error } = await this.supabase
        .from(this.tableName)
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId);

      if (error) {
        throw error;
      }

      return count || 0;
    } catch (error) {
      throw new DatabaseError(`Failed to count leads: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private detectDuplicates(leads: Lead[]): DuplicateLeadGroup[] {
    const results: DuplicateLeadGroup[] = [];

    // Group by email
    const emailGroups = new Map<string, Lead[]>();
    leads.forEach(lead => {
      const email = lead.contactInfo.email;
      if (email) {
        const group = emailGroups.get(email) || [];
        group.push(lead);
        emailGroups.set(email, group);
      }
    });

    emailGroups.forEach((groupLeads, email) => {
      if (groupLeads.length > 1) {
        results.push({ criteria: 'email', value: email, leads: groupLeads });
      }
    });

    // Group by phone
    const phoneGroups = new Map<string, Lead[]>();
    leads.forEach(lead => {
      const phone = lead.contactInfo.phone;
      if (phone) {
        const group = phoneGroups.get(phone) || [];
        group.push(lead);
        phoneGroups.set(phone, group);
      }
    });

    phoneGroups.forEach((groupLeads, phone) => {
      if (groupLeads.length > 1) {
        results.push({ criteria: 'phone', value: phone, leads: groupLeads });
      }
    });

    return results;
  }
}