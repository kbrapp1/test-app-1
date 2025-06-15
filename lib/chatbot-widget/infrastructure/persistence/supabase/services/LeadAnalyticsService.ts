/**
 * Lead Analytics Service
 * 
 * Infrastructure service for calculating lead analytics and metrics.
 * Single responsibility: Handle analytics calculations and data aggregation.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { Lead } from '../../../../domain/entities/Lead';
import { QualificationStatus } from '../../../../domain/services/lead-management/LeadScoringService';
import { FollowUpStatus } from '../../../../domain/entities/LeadLifecycleManager';
import { LeadMapper, RawLeadDbRecord } from '../mappers/LeadMapper';

export interface LeadAnalytics {
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
}

export interface FunnelMetrics {
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
}

export interface StatusCounts {
  total: number;
  qualified: number;
  converted: number;
  new: number;
}

export class LeadAnalyticsService {
  constructor(
    private supabase: SupabaseClient,
    private tableName: string = 'chat_leads'
  ) {}

  /**
   * Calculate comprehensive lead analytics
   */
  async calculateAnalytics(
    organizationId: string,
    dateFrom: Date,
    dateTo: Date
  ): Promise<LeadAnalytics> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('organization_id', organizationId)
      .gte('captured_at', dateFrom.toISOString())
      .lte('captured_at', dateTo.toISOString());

    if (error) {
      throw error;
    }

    const leads = (data || []).map(record => LeadMapper.toDomain(record as RawLeadDbRecord));
    
    return this.processAnalytics(leads);
  }

  /**
   * Process analytics from lead data
   */
  private processAnalytics(leads: Lead[]): LeadAnalytics {
    const totalLeads = leads.length;
    const qualifiedLeads = leads.filter(l => l.qualificationStatus === 'qualified').length;
    const highlyQualifiedLeads = leads.filter(l => l.qualificationStatus === 'highly_qualified').length;
    const convertedLeads = leads.filter(l => l.followUpStatus === 'converted').length;
    
    const avgLeadScore = leads.length > 0
      ? leads.reduce((sum, l) => sum + l.leadScore, 0) / leads.length
      : 0;
    
    const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;

    return {
      totalLeads,
      qualifiedLeads,
      highlyQualifiedLeads,
      convertedLeads,
      avgLeadScore: Math.round(avgLeadScore * 100) / 100,
      conversionRate: Math.round(conversionRate * 100) / 100,
      qualificationDistribution: this.calculateQualificationDistribution(leads),
      followUpDistribution: this.calculateFollowUpDistribution(leads),
      sourceBreakdown: this.calculateSourceBreakdown(leads),
      topCompanies: this.calculateTopCompanies(leads),
      leadTrends: this.calculateLeadTrends(leads),
    };
  }

  /**
   * Calculate qualification status distribution
   */
  private calculateQualificationDistribution(leads: Lead[]) {
    return {
      not_qualified: leads.filter(l => l.qualificationStatus === 'not_qualified').length,
      qualified: leads.filter(l => l.qualificationStatus === 'qualified').length,
      highly_qualified: leads.filter(l => l.qualificationStatus === 'highly_qualified').length,
      disqualified: leads.filter(l => l.qualificationStatus === 'disqualified').length,
    };
  }

  /**
   * Calculate follow-up status distribution
   */
  private calculateFollowUpDistribution(leads: Lead[]) {
    return {
      new: leads.filter(l => l.followUpStatus === 'new').length,
      contacted: leads.filter(l => l.followUpStatus === 'contacted').length,
      in_progress: leads.filter(l => l.followUpStatus === 'in_progress').length,
      converted: leads.filter(l => l.followUpStatus === 'converted').length,
      lost: leads.filter(l => l.followUpStatus === 'lost').length,
      nurturing: leads.filter(l => l.followUpStatus === 'nurturing').length,
    };
  }

  /**
   * Calculate source breakdown
   */
  private calculateSourceBreakdown(leads: Lead[]) {
    const sourceMap = new Map<string, number>();
    leads.forEach(l => {
      const source = l.source.channel || 'unknown';
      sourceMap.set(source, (sourceMap.get(source) || 0) + 1);
    });
    
    return Array.from(sourceMap.entries())
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Calculate top companies
   */
  private calculateTopCompanies(leads: Lead[]) {
    const companyMap = new Map<string, { count: number; totalScore: number }>();
    leads.forEach(l => {
      const company = l.contactInfo.company || 'Unknown';
      const existing = companyMap.get(company) || { count: 0, totalScore: 0 };
      companyMap.set(company, {
        count: existing.count + 1,
        totalScore: existing.totalScore + l.leadScore,
      });
    });
    
    return Array.from(companyMap.entries())
      .map(([company, data]) => ({
        company,
        count: data.count,
        avgScore: Math.round((data.totalScore / data.count) * 100) / 100,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  /**
   * Calculate lead trends by day
   */
  private calculateLeadTrends(leads: Lead[]) {
    const trendsMap = new Map<string, { count: number; totalScore: number }>();
    leads.forEach(l => {
      const date = l.capturedAt.toISOString().split('T')[0];
      const existing = trendsMap.get(date) || { count: 0, totalScore: 0 };
      trendsMap.set(date, {
        count: existing.count + 1,
        totalScore: existing.totalScore + l.leadScore,
      });
    });
    
    return Array.from(trendsMap.entries())
      .map(([date, data]) => ({
        date,
        count: data.count,
        avgScore: Math.round((data.totalScore / data.count) * 100) / 100,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Calculate funnel metrics
   */
  async calculateFunnelMetrics(
    organizationId: string,
    dateFrom: Date,
    dateTo: Date
  ): Promise<FunnelMetrics> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('qualification_status, follow_up_status')
      .eq('organization_id', organizationId)
      .gte('captured_at', dateFrom.toISOString())
      .lte('captured_at', dateTo.toISOString());

    if (error) {
      throw error;
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

  /**
   * Count leads by status
   */
  async countByStatus(organizationId: string): Promise<StatusCounts> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('qualification_status, follow_up_status')
      .eq('organization_id', organizationId);

    if (error) {
      throw error;
    }

    const records = data || [];
    return {
      total: records.length,
      qualified: records.filter(r => r.qualification_status === 'qualified' || r.qualification_status === 'highly_qualified').length,
      converted: records.filter(r => r.follow_up_status === 'converted').length,
      new: records.filter(r => r.follow_up_status === 'new').length,
    };
  }
} 