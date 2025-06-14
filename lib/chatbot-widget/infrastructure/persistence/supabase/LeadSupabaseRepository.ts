/**
 * Supabase Lead Repository Implementation
 * 
 * Refactored following DDD principles with focused service composition.
 * Single responsibility: Orchestrate lead data operations using specialized services.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { ILeadRepository } from '../../../domain/repositories/ILeadRepository';
import { Lead } from '../../../domain/entities/Lead';
import { QualificationStatus } from '../../../domain/services/LeadScoringService';
import { FollowUpStatus } from '../../../domain/entities/LeadLifecycleManager';
import { LeadMapper, RawLeadDbRecord } from './mappers/LeadMapper';
import { DatabaseError } from '@/lib/errors/base';
import { LeadQueryService, LeadFilters } from './services/LeadQueryService';
import { LeadAnalyticsService, LeadAnalytics, FunnelMetrics, StatusCounts } from './services/LeadAnalyticsService';
import { LeadOperationsService } from './services/LeadOperationsService';

export class LeadSupabaseRepository implements ILeadRepository {
  private queryService: LeadQueryService;
  private analyticsService: LeadAnalyticsService;
  private operationsService: LeadOperationsService;

  constructor(supabaseClient?: SupabaseClient) {
    const supabase = supabaseClient ?? createClient();
    this.queryService = new LeadQueryService(supabase);
    this.analyticsService = new LeadAnalyticsService(supabase);
    this.operationsService = new LeadOperationsService(supabase);
  }

  async findById(id: string): Promise<Lead | null> {
    try {
      const data = await this.operationsService.findById(id);
      return data ? LeadMapper.toDomain(data) : null;
    } catch (error: any) {
      throw new DatabaseError('Failed to find lead by ID', error.message);
    }
  }

  async findBySessionId(sessionId: string): Promise<Lead | null> {
    try {
      const data = await this.operationsService.findBySessionId(sessionId);
      return data ? LeadMapper.toDomain(data) : null;
    } catch (error: any) {
      throw new DatabaseError('Failed to find lead by session ID', error.message);
    }
  }

  async findByOrganizationIdWithPagination(
    organizationId: string,
    page: number,
    limit: number,
    filters?: {
      qualificationStatus?: QualificationStatus;
      followUpStatus?: FollowUpStatus;
      assignedTo?: string;
      dateFrom?: Date;
      dateTo?: Date;
      minScore?: number;
      maxScore?: number;
      tags?: string[];
      searchTerm?: string;
    }
  ): Promise<{
    leads: Lead[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      const result = await this.queryService.executePaginatedQuery(
        organizationId,
        page,
        limit,
        filters as LeadFilters
      );

      const leads = result.data.map(record => LeadMapper.toDomain(record as RawLeadDbRecord));

      return {
        leads,
        total: result.count,
        page,
        limit,
        totalPages: result.totalPages,
      };
    } catch (error: any) {
      throw new DatabaseError('Failed to find leads with pagination', error.message);
    }
  }

  async findByEmail(email: string, organizationId: string): Promise<Lead[]> {
    try {
      const data = await this.operationsService.findByEmail(email, organizationId);
      return data.map(record => LeadMapper.toDomain(record));
    } catch (error: any) {
      throw new DatabaseError('Failed to find leads by email', error.message);
    }
  }

  async findByAssignedTo(userId: string, organizationId: string): Promise<Lead[]> {
    try {
      const data = await this.operationsService.findByAssignedTo(userId, organizationId);
      return data.map(record => LeadMapper.toDomain(record));
    } catch (error: any) {
      throw new DatabaseError('Failed to find leads by assigned user', error.message);
    }
  }

  async save(lead: Lead): Promise<Lead> {
    try {
      const data = await this.operationsService.save(lead);
      return LeadMapper.toDomain(data);
    } catch (error: any) {
      throw new DatabaseError('Failed to save lead', error.message);
    }
  }

  async update(lead: Lead): Promise<Lead> {
    try {
      const data = await this.operationsService.update(lead);
      return LeadMapper.toDomain(data);
    } catch (error: any) {
      throw new DatabaseError('Failed to update lead', error.message);
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.operationsService.delete(id);
    } catch (error: any) {
      throw new DatabaseError('Failed to delete lead', error.message);
    }
  }

  async getAnalytics(
    organizationId: string,
    dateFrom: Date,
    dateTo: Date
  ): Promise<LeadAnalytics> {
    try {
      return await this.analyticsService.calculateAnalytics(organizationId, dateFrom, dateTo);
    } catch (error: any) {
      throw new DatabaseError('Failed to get lead analytics', error.message);
    }
  }

  async findForExport(
    organizationId: string,
    filters?: {
      qualificationStatus?: QualificationStatus;
      followUpStatus?: FollowUpStatus;
      dateFrom?: Date;
      dateTo?: Date;
    }
  ): Promise<Lead[]> {
    try {
      const data = await this.operationsService.findForExport(organizationId, filters);
      return data.map(record => LeadMapper.toDomain(record));
    } catch (error: any) {
      throw new DatabaseError('Failed to find leads for export', error.message);
    }
  }

  async findRequiringFollowUp(
    organizationId: string,
    daysSinceLastContact: number
  ): Promise<Lead[]> {
    try {
      const data = await this.queryService.findRequiringFollowUp(organizationId, daysSinceLastContact);
      return data.map(record => LeadMapper.toDomain(record as RawLeadDbRecord));
    } catch (error: any) {
      throw new DatabaseError('Failed to find leads requiring follow-up', error.message);
    }
  }

  async findTopByScore(organizationId: string, limit: number): Promise<Lead[]> {
    try {
      const data = await this.queryService.findTopByScore(organizationId, limit);
      return data.map(record => LeadMapper.toDomain(record as RawLeadDbRecord));
    } catch (error: any) {
      throw new DatabaseError('Failed to find top leads by score', error.message);
    }
  }

  async countByStatus(organizationId: string): Promise<StatusCounts> {
    try {
      return await this.analyticsService.countByStatus(organizationId);
    } catch (error: any) {
      throw new DatabaseError('Failed to count leads by status', error.message);
    }
  }

  async findRecent(organizationId: string, limit: number): Promise<Lead[]> {
    try {
      const data = await this.queryService.findRecent(organizationId, limit);
      return data.map(record => LeadMapper.toDomain(record as RawLeadDbRecord));
    } catch (error: any) {
      throw new DatabaseError('Failed to find recent leads', error.message);
    }
  }

  async searchByQuery(
    organizationId: string,
    query: string,
    limit?: number
  ): Promise<Lead[]> {
    try {
      const data = await this.queryService.executeSearchQuery(organizationId, query, limit);
      return data.map(record => LeadMapper.toDomain(record as RawLeadDbRecord));
    } catch (error: any) {
      throw new DatabaseError('Failed to search leads', error.message);
    }
  }

  async getFunnelMetrics(
    organizationId: string,
    dateFrom: Date,
    dateTo: Date
  ): Promise<FunnelMetrics> {
    try {
      return await this.analyticsService.calculateFunnelMetrics(organizationId, dateFrom, dateTo);
    } catch (error: any) {
      throw new DatabaseError('Failed to get funnel metrics', error.message);
    }
  }

  async findDuplicates(organizationId: string): Promise<Array<{
    criteria: 'email' | 'phone';
    value: string;
    leads: Lead[];
  }>> {
    try {
      const data = await this.operationsService.findDuplicates(organizationId);
      const leads = data.map(record => LeadMapper.toDomain(record));
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
    } catch (error: any) {
      throw new DatabaseError('Failed to find duplicate leads', error.message);
    }
  }

  async updateBulk(leadIds: string[], updates: {
    followUpStatus?: FollowUpStatus;
    assignedTo?: string;
    tags?: { add?: string[]; remove?: string[] };
  }): Promise<number> {
    try {
      return await this.operationsService.updateBulk(leadIds, updates);
    } catch (error: any) {
      throw new DatabaseError('Failed to bulk update leads', error.message);
    }
  }
} 