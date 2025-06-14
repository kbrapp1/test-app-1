/**
 * Lead Query Service
 * 
 * Infrastructure service for building and executing lead queries.
 * Single responsibility: Handle query construction and filtering logic.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { QualificationStatus } from '../../../../domain/services/LeadScoringService';
import { FollowUpStatus } from '../../../../domain/entities/LeadLifecycleManager';

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

export class LeadQueryService {
  constructor(
    private supabase: SupabaseClient,
    private tableName: string = 'chat_leads'
  ) {}

  /**
   * Build base query with organization filter
   */
  buildBaseQuery(organizationId: string) {
    return this.supabase
      .from(this.tableName)
      .select('*')
      .eq('organization_id', organizationId);
  }

  /**
   * Apply filters to query
   */
  applyFilters(query: any, filters: LeadFilters) {
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

  /**
   * Execute paginated query
   */
  async executePaginatedQuery(
    organizationId: string,
    page: number,
    limit: number,
    filters?: LeadFilters
  ) {
    // Get total count first
    let countQuery = this.buildBaseQuery(organizationId).select('*');
    if (filters) {
      countQuery = this.applyFilters(countQuery, filters);
    }
    const { count, error: countError } = await countQuery;
    if (countError) {
      throw countError;
    }

    // Get paginated data
    let dataQuery = this.buildBaseQuery(organizationId).select('*');
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

  /**
   * Execute search query
   */
  async executeSearchQuery(
    organizationId: string,
    query: string,
    limit?: number
  ) {
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

  /**
   * Find leads requiring follow-up
   */
  async findRequiringFollowUp(organizationId: string, daysSinceLastContact: number) {
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

  /**
   * Find top leads by score
   */
  async findTopByScore(organizationId: string, limit: number) {
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

  /**
   * Find recent leads
   */
  async findRecent(organizationId: string, limit: number) {
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