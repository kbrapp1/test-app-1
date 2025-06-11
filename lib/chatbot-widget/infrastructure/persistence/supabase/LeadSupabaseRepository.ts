import { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { ILeadRepository } from '../../../domain/repositories/ILeadRepository';
import { Lead, QualificationStatus, FollowUpStatus } from '../../../domain/entities/Lead';
import { LeadMapper, RawLeadDbRecord } from './mappers/LeadMapper';
import { DatabaseError } from '@/lib/errors/base';

/**
 * Supabase Lead Repository Implementation
 * Follows DDD principles with clean separation of concerns
 */
export class LeadSupabaseRepository implements ILeadRepository {
  private supabase: SupabaseClient;
  private readonly tableName = 'chat_leads';

  constructor(supabaseClient?: SupabaseClient) {
    this.supabase = supabaseClient ?? createClient();
  }

  async findById(id: string): Promise<Lead | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new DatabaseError('Failed to find lead by ID', error.message);
    }

    return LeadMapper.toDomain(data as RawLeadDbRecord);
  }

  async findBySessionId(sessionId: string): Promise<Lead | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('session_id', sessionId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new DatabaseError('Failed to find lead by session ID', error.message);
    }

    return LeadMapper.toDomain(data as RawLeadDbRecord);
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
    let baseQuery = this.supabase
      .from(this.tableName)
      .select('*', { count: 'exact' })
      .eq('organization_id', organizationId);

    // Apply filters
    if (filters?.qualificationStatus) {
      baseQuery = baseQuery.eq('qualification_status', filters.qualificationStatus);
    }
    if (filters?.followUpStatus) {
      baseQuery = baseQuery.eq('follow_up_status', filters.followUpStatus);
    }
    if (filters?.assignedTo) {
      baseQuery = baseQuery.eq('assigned_to', filters.assignedTo);
    }
    if (filters?.dateFrom) {
      baseQuery = baseQuery.gte('captured_at', filters.dateFrom.toISOString());
    }
    if (filters?.dateTo) {
      baseQuery = baseQuery.lte('captured_at', filters.dateTo.toISOString());
    }
    if (filters?.minScore !== undefined) {
      baseQuery = baseQuery.gte('lead_score', filters.minScore);
    }
    if (filters?.maxScore !== undefined) {
      baseQuery = baseQuery.lte('lead_score', filters.maxScore);
    }
    if (filters?.tags && filters.tags.length > 0) {
      baseQuery = baseQuery.contains('tags', filters.tags);
    }
    if (filters?.searchTerm) {
      baseQuery = baseQuery.or(`
        contact_info->>name.ilike.%${filters.searchTerm}%,
        contact_info->>email.ilike.%${filters.searchTerm}%,
        contact_info->>company.ilike.%${filters.searchTerm}%
      `);
    }

    // Get total count first
    const { count, error: countError } = await baseQuery;
    if (countError) {
      throw new DatabaseError('Failed to count leads', countError.message);
    }

    // Get paginated data
    const { data, error } = await baseQuery
      .order('captured_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (error) {
      throw new DatabaseError('Failed to find leads with pagination', error.message);
    }

    const leads = (data || []).map(record => LeadMapper.toDomain(record as RawLeadDbRecord));
    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    return {
      leads,
      total,
      page,
      limit,
      totalPages,
    };
  }

  async findByEmail(email: string, organizationId: string): Promise<Lead[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('organization_id', organizationId)
      .eq('contact_info->>email', email)
      .order('captured_at', { ascending: false });

    if (error) {
      throw new DatabaseError('Failed to find leads by email', error.message);
    }

    return (data || []).map(record => LeadMapper.toDomain(record as RawLeadDbRecord));
  }

  async findByAssignedTo(userId: string, organizationId: string): Promise<Lead[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('organization_id', organizationId)
      .eq('assigned_to', userId)
      .order('captured_at', { ascending: false });

    if (error) {
      throw new DatabaseError('Failed to find leads by assigned user', error.message);
    }

    return (data || []).map(record => LeadMapper.toDomain(record as RawLeadDbRecord));
  }

  async save(lead: Lead): Promise<Lead> {
    const insertData = LeadMapper.toInsert(lead);
    
    const { data, error } = await this.supabase
      .from(this.tableName)
      .insert(insertData)
      .select()
      .single();

    if (error) {
      throw new DatabaseError('Failed to save lead', error.message);
    }

    return LeadMapper.toDomain(data as RawLeadDbRecord);
  }

  async update(lead: Lead): Promise<Lead> {
    const updateData = LeadMapper.toUpdate(lead);
    
    const { data, error } = await this.supabase
      .from(this.tableName)
      .update(updateData)
      .eq('id', lead.id)
      .select()
      .single();

    if (error) {
      throw new DatabaseError('Failed to update lead', error.message);
    }

    return LeadMapper.toDomain(data as RawLeadDbRecord);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from(this.tableName)
      .delete()
      .eq('id', id);

    if (error) {
      throw new DatabaseError('Failed to delete lead', error.message);
    }
  }

  async getAnalytics(
    organizationId: string,
    dateFrom: Date,
    dateTo: Date
  ): Promise<{
    totalLeads: number;
    qualifiedLeads: number;
    highlyQualifiedLeads: number;
    convertedLeads: number;
    avgLeadScore: number;
    conversionRate: number;
    qualificationDistribution: {
      not_qualified: number;
      qualified: number;
      highly_qualified: number;
      disqualified: number;
    };
    followUpDistribution: {
      new: number;
      contacted: number;
      in_progress: number;
      converted: number;
      lost: number;
      nurturing: number;
    };
    sourceBreakdown: Array<{ source: string; count: number }>;
    topCompanies: Array<{ company: string; count: number; avgScore: number }>;
    leadTrends: Array<{ date: string; count: number; avgScore: number }>;
  }> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('organization_id', organizationId)
      .gte('captured_at', dateFrom.toISOString())
      .lte('captured_at', dateTo.toISOString());

    if (error) {
      throw new DatabaseError('Failed to get lead analytics', error.message);
    }

    const leads = (data || []).map(record => LeadMapper.toDomain(record as RawLeadDbRecord));
    
    // Calculate basic metrics
    const totalLeads = leads.length;
    const qualifiedLeads = leads.filter(l => l.qualificationStatus === 'qualified').length;
    const highlyQualifiedLeads = leads.filter(l => l.qualificationStatus === 'highly_qualified').length;
    const convertedLeads = leads.filter(l => l.followUpStatus === 'converted').length;
    
    const avgLeadScore = leads.length > 0
      ? leads.reduce((sum, l) => sum + l.leadScore, 0) / leads.length
      : 0;
    
    const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;

    // Calculate distributions
    const qualificationDistribution = {
      not_qualified: leads.filter(l => l.qualificationStatus === 'not_qualified').length,
      qualified: leads.filter(l => l.qualificationStatus === 'qualified').length,
      highly_qualified: leads.filter(l => l.qualificationStatus === 'highly_qualified').length,
      disqualified: leads.filter(l => l.qualificationStatus === 'disqualified').length,
    };

    const followUpDistribution = {
      new: leads.filter(l => l.followUpStatus === 'new').length,
      contacted: leads.filter(l => l.followUpStatus === 'contacted').length,
      in_progress: leads.filter(l => l.followUpStatus === 'in_progress').length,
      converted: leads.filter(l => l.followUpStatus === 'converted').length,
      lost: leads.filter(l => l.followUpStatus === 'lost').length,
      nurturing: leads.filter(l => l.followUpStatus === 'nurturing').length,
    };

    // Calculate source breakdown
    const sourceMap = new Map<string, number>();
    leads.forEach(l => {
      const source = l.source.channel || 'unknown';
      sourceMap.set(source, (sourceMap.get(source) || 0) + 1);
    });
    const sourceBreakdown = Array.from(sourceMap.entries())
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count);

    // Calculate top companies
    const companyMap = new Map<string, { count: number; totalScore: number }>();
    leads.forEach(l => {
      const company = l.contactInfo.company || 'Unknown';
      const existing = companyMap.get(company) || { count: 0, totalScore: 0 };
      companyMap.set(company, {
        count: existing.count + 1,
        totalScore: existing.totalScore + l.leadScore,
      });
    });
    const topCompanies = Array.from(companyMap.entries())
      .map(([company, data]) => ({
        company,
        count: data.count,
        avgScore: Math.round((data.totalScore / data.count) * 100) / 100,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Calculate lead trends by day
    const trendsMap = new Map<string, { count: number; totalScore: number }>();
    leads.forEach(l => {
      const date = l.capturedAt.toISOString().split('T')[0];
      const existing = trendsMap.get(date) || { count: 0, totalScore: 0 };
      trendsMap.set(date, {
        count: existing.count + 1,
        totalScore: existing.totalScore + l.leadScore,
      });
    });
    const leadTrends = Array.from(trendsMap.entries())
      .map(([date, data]) => ({
        date,
        count: data.count,
        avgScore: Math.round((data.totalScore / data.count) * 100) / 100,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      totalLeads,
      qualifiedLeads,
      highlyQualifiedLeads,
      convertedLeads,
      avgLeadScore: Math.round(avgLeadScore * 100) / 100,
      conversionRate: Math.round(conversionRate * 100) / 100,
      qualificationDistribution,
      followUpDistribution,
      sourceBreakdown,
      topCompanies,
      leadTrends,
    };
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
      throw new DatabaseError('Failed to find leads for export', error.message);
    }

    return (data || []).map(record => LeadMapper.toDomain(record as RawLeadDbRecord));
  }

  async findRequiringFollowUp(
    organizationId: string,
    daysSinceLastContact: number
  ): Promise<Lead[]> {
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
      throw new DatabaseError('Failed to find leads requiring follow-up', error.message);
    }

    return (data || []).map(record => LeadMapper.toDomain(record as RawLeadDbRecord));
  }

  async findTopByScore(organizationId: string, limit: number): Promise<Lead[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('organization_id', organizationId)
      .order('lead_score', { ascending: false })
      .limit(limit);

    if (error) {
      throw new DatabaseError('Failed to find top leads by score', error.message);
    }

    return (data || []).map(record => LeadMapper.toDomain(record as RawLeadDbRecord));
  }

  async countByStatus(organizationId: string): Promise<{
    total: number;
    qualified: number;
    converted: number;
    new: number;
  }> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('qualification_status, follow_up_status')
      .eq('organization_id', organizationId);

    if (error) {
      throw new DatabaseError('Failed to count leads by status', error.message);
    }

    const records = data || [];
    return {
      total: records.length,
      qualified: records.filter(r => r.qualification_status === 'qualified' || r.qualification_status === 'highly_qualified').length,
      converted: records.filter(r => r.follow_up_status === 'converted').length,
      new: records.filter(r => r.follow_up_status === 'new').length,
    };
  }

  async findRecent(organizationId: string, limit: number): Promise<Lead[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('organization_id', organizationId)
      .order('captured_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new DatabaseError('Failed to find recent leads', error.message);
    }

    return (data || []).map(record => LeadMapper.toDomain(record as RawLeadDbRecord));
  }

  async searchByQuery(
    organizationId: string,
    query: string,
    limit?: number
  ): Promise<Lead[]> {
    let supabaseQuery = this.supabase
      .from(this.tableName)
      .select('*')
      .eq('organization_id', organizationId)
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
      throw new DatabaseError('Failed to search leads', error.message);
    }

    return (data || []).map(record => LeadMapper.toDomain(record as RawLeadDbRecord));
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
    // Note: This would require joining with chat_sessions table
    // For now, implementing a simplified version
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('qualification_status, follow_up_status')
      .eq('organization_id', organizationId)
      .gte('captured_at', dateFrom.toISOString())
      .lte('captured_at', dateTo.toISOString());

    if (error) {
      throw new DatabaseError('Failed to get leads for funnel metrics', error.message);
    }

    const leads = data || [];
    const sessions = 1000; // Placeholder - would need actual session count
    const leadsGenerated = leads.length;
    const qualified = leads.filter(l => l.qualification_status === 'qualified' || l.qualification_status === 'highly_qualified').length;
    const contacted = leads.filter(l => ['contacted', 'in_progress', 'converted', 'lost'].includes(l.follow_up_status)).length;
    const converted = leads.filter(l => l.follow_up_status === 'converted').length;

    return {
      sessions,
      leadsGenerated,
      qualified,
      contacted,
      converted,
      conversionRates: {
        sessionToLead: sessions > 0 ? Math.round((leadsGenerated / sessions) * 10000) / 100 : 0,
        leadToQualified: leadsGenerated > 0 ? Math.round((qualified / leadsGenerated) * 10000) / 100 : 0,
        qualifiedToContacted: qualified > 0 ? Math.round((contacted / qualified) * 10000) / 100 : 0,
        contactedToConverted: contacted > 0 ? Math.round((converted / contacted) * 10000) / 100 : 0,
      },
    };
  }

  async findDuplicates(organizationId: string): Promise<Array<{
    criteria: 'email' | 'phone';
    value: string;
    leads: Lead[];
  }>> {
    // This is a complex query - implementing a simplified version
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('organization_id', organizationId);

    if (error) {
      throw new DatabaseError('Failed to find duplicate leads', error.message);
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
  }

  async updateBulk(leadIds: string[], updates: {
    followUpStatus?: FollowUpStatus;
    assignedTo?: string;
    tags?: { add?: string[]; remove?: string[] };
  }): Promise<number> {
    if (leadIds.length === 0) {
      return 0;
    }

    // For simplified implementation, just update status and assignedTo
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
      .select('id', { count: 'exact', head: true });

    if (error) {
      throw new DatabaseError('Failed to bulk update leads', error.message);
    }

    return count || 0;
  }
} 