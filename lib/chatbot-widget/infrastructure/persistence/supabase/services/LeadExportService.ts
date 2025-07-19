/**
 * Lead Export Service
 * 
 * Single responsibility: Lead data export operations
 * Handles filtering and preparation of lead data for export
 * Supports various export formats and filter combinations
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { Lead } from '../../../../domain/entities/Lead';
import { FollowUpStatus } from '../../../../domain/entities/LeadLifecycleManager';
import { LeadMapper, RawLeadDbRecord } from '../mappers/LeadMapper';
import { LeadQueryService, LeadFilters, QualificationStatus } from './LeadQueryService';
import { DatabaseError } from '../../../../domain/errors/ChatbotWidgetDomainErrors';

export interface ExportFilters {
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

export class LeadExportService {
  private queryService: LeadQueryService;

  constructor(
    private supabase: SupabaseClient,
    private tableName: string = 'leads'
  ) {
    this.queryService = new LeadQueryService(supabase, tableName);
  }

  async findForExport(organizationId: string, filters?: Record<string, unknown>): Promise<Lead[]> {
    try {
      let query = this.queryService.buildBaseQuery(organizationId);
      
      if (filters) {
        const typedFilters = this.convertToLeadFilters(filters);
        query = this.queryService.applyFilters(query, typedFilters);
      }
      
      const { data, error } = await query.order('captured_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      return (data || []).map((record: unknown) => LeadMapper.toDomain(record as RawLeadDbRecord));
    } catch (error) {
      throw new DatabaseError(`Failed to find leads for export: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async exportByDateRange(
    organizationId: string,
    startDate: Date,
    endDate: Date,
    additionalFilters?: ExportFilters
  ): Promise<Lead[]> {
    try {
      const filters: LeadFilters = {
        dateFrom: startDate,
        dateTo: endDate,
        ...additionalFilters
      };

      let query = this.queryService.buildBaseQuery(organizationId);
      query = this.queryService.applyFilters(query, filters);
      
      const { data, error } = await query.order('captured_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      return (data || []).map((record: unknown) => LeadMapper.toDomain(record as RawLeadDbRecord));
    } catch (error) {
      throw new DatabaseError(`Failed to export leads by date range: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async exportByStatus(
    organizationId: string,
    followUpStatus: FollowUpStatus,
    qualificationStatus?: QualificationStatus
  ): Promise<Lead[]> {
    try {
      const filters: LeadFilters = {
        followUpStatus,
        qualificationStatus
      };

      let query = this.queryService.buildBaseQuery(organizationId);
      query = this.queryService.applyFilters(query, filters);
      
      const { data, error } = await query.order('captured_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      return (data || []).map((record: unknown) => LeadMapper.toDomain(record as RawLeadDbRecord));
    } catch (error) {
      throw new DatabaseError(`Failed to export leads by status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async exportByAssignee(organizationId: string, assignedTo: string): Promise<Lead[]> {
    try {
      const filters: LeadFilters = { assignedTo };

      let query = this.queryService.buildBaseQuery(organizationId);
      query = this.queryService.applyFilters(query, filters);
      
      const { data, error } = await query.order('captured_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      return (data || []).map((record: unknown) => LeadMapper.toDomain(record as RawLeadDbRecord));
    } catch (error) {
      throw new DatabaseError(`Failed to export leads by assignee: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async exportHighValueLeads(organizationId: string, minScore: number = 80): Promise<Lead[]> {
    try {
      const filters: LeadFilters = { minScore };

      let query = this.queryService.buildBaseQuery(organizationId);
      query = this.queryService.applyFilters(query, filters);
      
      const { data, error } = await query
        .order('lead_score', { ascending: false })
        .order('captured_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      return (data || []).map((record: unknown) => LeadMapper.toDomain(record as RawLeadDbRecord));
    } catch (error) {
      throw new DatabaseError(`Failed to export high-value leads: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private convertToLeadFilters(filters: Record<string, unknown>): Partial<LeadFilters> {
    return {
      qualificationStatus: filters.qualificationStatus as QualificationStatus,
      followUpStatus: filters.followUpStatus as FollowUpStatus,
      assignedTo: filters.assignedTo as string,
      dateFrom: filters.dateFrom as Date,
      dateTo: filters.dateTo as Date,
      minScore: filters.minScore as number,
      maxScore: filters.maxScore as number,
      tags: filters.tags as string[],
      searchTerm: filters.searchTerm as string
    };
  }
}