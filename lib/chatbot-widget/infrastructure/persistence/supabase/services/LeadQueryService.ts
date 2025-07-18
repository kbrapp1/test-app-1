/**
 * Lead Query Service (Infrastructure)
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Lead database query operations only
 * - Handle complex database queries and filtering
 * - Use domain-specific errors with proper context
 * - Stay under 200-250 lines
 * - UPDATED: Removed LeadScoringService dependency - using API-only approach
 * - Lead scores are now stored as provided by external API
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { FollowUpStatus } from '../../../../domain/entities/LeadLifecycleManager';
import { RawLeadDbRecord } from '../mappers/LeadMapper';

// Define QualificationStatus locally since we removed LeadScoringService
export type QualificationStatus = 'not_qualified' | 'qualified' | 'highly_qualified' | 'disqualified';

export interface LeadFilters {
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

// Use proper Supabase types from main package

export class LeadQueryService {
  constructor(
    private supabase: SupabaseClient,
    private tableName: string = 'chat_leads'
  ) {}

  /** Build base query with organization filter */
  buildBaseQuery(organizationId: string) {
    return this.supabase
      .from(this.tableName)
      .select('*')
      .eq('organization_id', organizationId);
  }

  /** Apply filters to query */
  applyFilters(query: ReturnType<typeof this.buildBaseQuery>, filters: LeadFilters) {
    let filteredQuery = query;

    if (filters.qualificationStatus) {
      filteredQuery = filteredQuery.eq('qualification_status', filters.qualificationStatus);
    }
    if (filters.followUpStatus) {
      filteredQuery = filteredQuery.eq('follow_up_status', filters.followUpStatus);
    }
    if (filters.assignedTo) {
      filteredQuery = filteredQuery.eq('assigned_to', filters.assignedTo);
    }
    if (filters.dateFrom) {
      filteredQuery = filteredQuery.gte('captured_at', filters.dateFrom.toISOString());
    }
    if (filters.dateTo) {
      filteredQuery = filteredQuery.lte('captured_at', filters.dateTo.toISOString());
    }
    if (filters.minScore !== undefined) {
      filteredQuery = filteredQuery.gte('lead_score', filters.minScore);
    }
    if (filters.maxScore !== undefined) {
      filteredQuery = filteredQuery.lte('lead_score', filters.maxScore);
    }
    if (filters.tags && filters.tags.length > 0) {
      filteredQuery = filteredQuery.contains('tags', filters.tags);
    }
    if (filters.searchTerm) {
      filteredQuery = filteredQuery.or(`
        contact_info->>name.ilike.%${filters.searchTerm}%,
        contact_info->>email.ilike.%${filters.searchTerm}%,
        contact_info->>company.ilike.%${filters.searchTerm}%
      `);
    }

    return filteredQuery;
  }

  /** Build count query with filters */
  private async buildCountQuery(organizationId: string, filters?: LeadFilters) {
    let query = this.supabase
      .from(this.tableName)
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId);

    if (filters) {
      if (filters.qualificationStatus) {
        query = query.eq('qualification_status', filters.qualificationStatus);
      }
      if (filters.followUpStatus) {
        query = query.eq('follow_up_status', filters.followUpStatus);
      }
      if (filters.assignedTo) {
        query = query.eq('assigned_to', filters.assignedTo);
      }
      if (filters.dateFrom) {
        query = query.gte('captured_at', filters.dateFrom.toISOString());
      }
      if (filters.dateTo) {
        query = query.lte('captured_at', filters.dateTo.toISOString());
      }
      if (filters.minScore) {
        query = query.gte('lead_score', filters.minScore);
      }
      if (filters.maxScore) {
        query = query.lte('lead_score', filters.maxScore);
      }
      if (filters.tags && filters.tags.length > 0) {
        query = query.contains('tags', filters.tags);
      }
      if (filters.searchTerm) {
        query = query.or(`conversation_summary.ilike.%${filters.searchTerm}%,contact_info->>name.ilike.%${filters.searchTerm}%`);
      }
    }

    return query;
  }

  /** Execute paginated query */
  async executePaginatedQuery(
    organizationId: string,
    page: number,
    limit: number,
    filters?: LeadFilters
  ): Promise<{ data: RawLeadDbRecord[]; count: number; totalPages: number }> {
    // Build count query with filters
    const { count, error: countError } = await this.buildCountQuery(organizationId, filters);
    if (countError) {
      throw countError;
    }

    // Get paginated data
    let dataQuery = this.buildBaseQuery(organizationId);
    if (filters) {
      dataQuery = this.applyFilters(dataQuery, filters);
    }
    
    const { data, error } = await dataQuery
      .order('captured_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (error) {
      throw error;
    }

    return {
      data: data || [],
      count: count || 0,
      totalPages: Math.ceil((count || 0) / limit)
    };
  }

  /** Execute search query */
  async executeSearchQuery(
    organizationId: string,
    query: string,
    limit?: number
  ): Promise<RawLeadDbRecord[]> {
    let supabaseQuery = this.buildBaseQuery(organizationId)
      .or(`
        contact_info->>name.ilike.%${query}%,
        contact_info->>email.ilike.%${query}%,
        contact_info->>company.ilike.%${query}%,
        conversation_summary.ilike.%${query}%
      `)
      .order('captured_at', { ascending: false });

    if (limit) {
      supabaseQuery = supabaseQuery.limit(limit);
    }

    const { data, error } = await supabaseQuery;
    if (error) {
      throw error;
    }

    return data || [];
  }

  /** Find leads requiring follow-up */
  async findRequiringFollowUp(organizationId: string, daysSinceLastContact: number): Promise<RawLeadDbRecord[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysSinceLastContact);

    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('organization_id', organizationId)
      .in('follow_up_status', ['new', 'contacted', 'in_progress'])
      .or(`last_contacted_at.is.null,last_contacted_at.lt.${cutoffDate.toISOString()}`)
      .order('captured_at', { ascending: true });

    if (error) {
      throw error;
    }

    return data || [];
  }

  /** Find top leads by score */
  async findTopByScore(organizationId: string, limit: number): Promise<RawLeadDbRecord[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('organization_id', organizationId)
      .order('lead_score', { ascending: false })
      .limit(limit);

    if (error) {
      throw error;
    }

    return data || [];
  }

  /** Find recent leads */
  async findRecent(organizationId: string, limit: number): Promise<RawLeadDbRecord[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('organization_id', organizationId)
      .order('captured_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw error;
    }

    return data || [];
  }
} 