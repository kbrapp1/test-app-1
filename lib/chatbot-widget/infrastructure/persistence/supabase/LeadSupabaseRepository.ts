/**
 * Lead Supabase Repository
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Lead data persistence only
 * - Implement domain repository interface exactly
 * - Handle database-specific logic and mappings
 * - Use domain-specific errors with proper context
 * - Stay under 200-250 lines
 * - UPDATED: Removed LeadScoringService dependency - using API-only approach
 * - Lead scores are now stored as provided by external API
 */

import { ILeadRepository } from '../../../domain/repositories/ILeadRepository';
import { Lead } from '../../../domain/entities/Lead';
import { createClient } from '../../../../supabase/server';
import { LeadMapper, RawLeadDbRecord } from './mappers/LeadMapper';
import { SupabaseClient } from '@supabase/supabase-js';
import { FollowUpStatus } from '../../../domain/entities/LeadLifecycleManager';
import { DatabaseError } from '../../../../errors/base';
import { LeadQueryService, LeadFilters } from './services/LeadQueryService';
import { LeadAnalyticsService } from './services/LeadAnalyticsService';

// Define QualificationStatus locally since we removed LeadScoringService
export type QualificationStatus = 'not_qualified' | 'qualified' | 'highly_qualified' | 'disqualified';

export class LeadSupabaseRepository implements ILeadRepository {
  private client: SupabaseClient;
  private queryService: LeadQueryService;
  private analyticsService: LeadAnalyticsService;

  constructor(client?: SupabaseClient) {
    this.client = client || createClient();
    this.queryService = new LeadQueryService(this.client);
    this.analyticsService = new LeadAnalyticsService(this.client);
  }

  async findById(id: string): Promise<Lead | null> {
    try {
      const { data, error } = await this.client
        .from('leads')
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
      const { data, error } = await this.client
        .from('leads')
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
      const { data, error } = await this.client
        .from('leads')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new DatabaseError(`Failed to find leads by organization: ${error.message}`);
      }

      const leads = data.map(record => LeadMapper.toDomain(record as RawLeadDbRecord));
      return leads;
    } catch (error) {
      throw new DatabaseError(`Failed to find leads by organization: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async findByOrganizationIdWithPagination(
    organizationId: string,
    page: number,
    limit: number,
    filters?: any
  ): Promise<{
    leads: Lead[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      const result = await this.queryService.executePaginatedQuery(organizationId, page, limit, filters);
      const leads = result.data.map(record => LeadMapper.toDomain(record as RawLeadDbRecord));
      
      return {
        leads,
        total: result.count,
        page,
        limit,
        totalPages: result.totalPages,
      };
    } catch (error) {
      throw new DatabaseError(`Failed to find leads with pagination: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async findByEmail(email: string, organizationId: string): Promise<Lead[]> {
    try {
      const { data, error } = await this.client
        .from('leads')
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
      const { data, error } = await this.client
        .from('leads')
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

  async searchByQuery(organizationId: string, query: string, limit: number): Promise<Lead[]> {
    try {
      const data = await this.queryService.executeSearchQuery(organizationId, query, limit);
      return data.map(record => LeadMapper.toDomain(record as RawLeadDbRecord));
    } catch (error) {
      throw new DatabaseError(`Failed to search leads: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async findRequiringFollowUp(organizationId: string, daysSinceLastContact: number): Promise<Lead[]> {
    try {
      const data = await this.queryService.findRequiringFollowUp(organizationId, daysSinceLastContact);
      return data.map(record => LeadMapper.toDomain(record as RawLeadDbRecord));
    } catch (error) {
      throw new DatabaseError(`Failed to find leads requiring follow-up: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async findForExport(organizationId: string, filters?: any): Promise<Lead[]> {
    try {
      // Use the existing base query method with filters
      let query = this.queryService.buildBaseQuery(organizationId);
      if (filters) {
        query = this.queryService.applyFilters(query, filters);
      }
      
      const { data, error } = await query.order('captured_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      return (data || []).map((record: any) => LeadMapper.toDomain(record as RawLeadDbRecord));
    } catch (error) {
      throw new DatabaseError(`Failed to find leads for export: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getAnalytics(organizationId: string, dateFrom: Date, dateTo: Date): Promise<any> {
    try {
      return await this.analyticsService.calculateAnalytics(organizationId, dateFrom, dateTo);
    } catch (error) {
      throw new DatabaseError(`Failed to get analytics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async create(lead: Lead): Promise<Lead> {
    try {
      const insertData = LeadMapper.toInsert(lead);
      const { data, error } = await this.client
        .from('leads')
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

  async save(lead: Lead): Promise<Lead> {
    return this.create(lead);
  }

  async update(lead: Lead): Promise<Lead> {
    try {
      const updateData = LeadMapper.toUpdate(lead);
      const { data, error } = await this.client
        .from('leads')
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
      const { error } = await this.client
        .from('leads')
        .delete()
        .eq('id', id);

      if (error) {
        throw new DatabaseError(`Failed to delete lead: ${error.message}`);
      }
    } catch (error) {
      throw new DatabaseError(`Failed to delete lead: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async findTopByScore(organizationId: string, limit: number): Promise<Lead[]> {
    try {
      const data = await this.queryService.findTopByScore(organizationId, limit);
      return (data || []).map((record: any) => LeadMapper.toDomain(record as RawLeadDbRecord));
    } catch (error) {
      throw new DatabaseError(`Failed to find top leads by score: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async countByStatus(organizationId: string): Promise<{
    total: number;
    qualified: number;
    converted: number;
    new: number;
  }> {
    return this.analyticsService.countByStatus(organizationId);
  }

  async findRecent(organizationId: string, limit: number): Promise<Lead[]> {
    try {
      const data = await this.queryService.findRecent(organizationId, limit);
      return (data || []).map((record: any) => LeadMapper.toDomain(record as RawLeadDbRecord));
    } catch (error) {
      throw new DatabaseError(`Failed to find recent leads: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getFunnelMetrics(
    organizationId: string,
    dateFrom: Date,
    dateTo: Date
  ): Promise<{
    sessions: number;
    leadsGenerated: number;
    qualified: number;
    contacted: number;
    converted: number;
    conversionRates: {
      sessionToLead: number;
      leadToQualified: number;
      qualifiedToContacted: number;
      contactedToConverted: number;
    };
  }> {
    return this.analyticsService.calculateFunnelMetrics(organizationId, dateFrom, dateTo);
  }

  async findDuplicates(organizationId: string): Promise<Array<{
    criteria: 'email' | 'phone';
    value: string;
    leads: Lead[];
  }>> {
    try {
      // Implement duplicate finding logic here
      const { data, error } = await this.client
        .from('leads')
        .select('*')
        .eq('organization_id', organizationId);

      if (error) {
        throw error;
      }

      const leads = (data || []).map(record => LeadMapper.toDomain(record as RawLeadDbRecord));
      const results: Array<{ criteria: 'email' | 'phone'; value: string; leads: Lead[] }> = [];

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

      return results;
    } catch (error) {
      throw new DatabaseError(`Failed to find duplicate leads: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updateBulk(leadIds: string[], updates: {
    followUpStatus?: FollowUpStatus;
    assignedTo?: string;
    tags?: { add?: string[]; remove?: string[] };
  }): Promise<number> {
    try {
      const updateData: any = {};
      
      if (updates.followUpStatus) {
        updateData.follow_up_status = updates.followUpStatus;
      }
      if (updates.assignedTo) {
        updateData.assigned_to = updates.assignedTo;
      }
      
      const { data, error } = await this.client
        .from('leads')
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
} 