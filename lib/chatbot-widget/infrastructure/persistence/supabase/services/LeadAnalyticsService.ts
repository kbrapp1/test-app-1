/**
 * Lead Analytics Service
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Lead analytics data processing only
 * - Handle complex analytics queries and calculations
 * - Use domain-specific errors with proper context
 * - Stay under 200-250 lines
 * - UPDATED: Removed LeadScoringService dependency - using API-only approach
 * - Lead scores are now stored as provided by external API
 */

import { SupabaseClient } from '@supabase/supabase-js';
// import { DatabaseError } from '../../../../domain/errors/ChatbotWidgetDomainErrors';
import { Lead } from '../../../../domain/entities/Lead';
import { LeadMapper, RawLeadDbRecord } from '../mappers/LeadMapper';
import { LeadAnalytics } from '../../../../domain/repositories/ILeadRepository';

// Define QualificationStatus locally since we removed LeadScoringService
export type QualificationStatus = 'not_qualified' | 'qualified' | 'highly_qualified' | 'disqualified';

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

  /** Calculate comprehensive lead analytics */
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

  /** Process analytics from lead data */
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
      convertedLeads,
      averageScore: Math.round(avgLeadScore * 100) / 100,
      avgLeadScore: Math.round(avgLeadScore * 100) / 100,
      conversionRate: Math.round(conversionRate * 100) / 100,
      topSources: this.calculateSourceBreakdown(leads),
      sourceBreakdown: this.calculateSourceBreakdown(leads),
      scoreDistribution: this.calculateScoreDistribution(leads),
      qualificationDistribution: this.calculateQualificationDistribution(leads),
      followUpDistribution: this.calculateFollowUpDistribution(leads),
      monthlyTrends: this.calculateMonthlyTrends(leads),
      highlyQualifiedLeads,
    };
  }

  /** Calculate qualification status distribution */
  private calculateQualificationDistribution(leads: Lead[]) {
    return {
      not_qualified: leads.filter(l => l.qualificationStatus === 'not_qualified').length,
      qualified: leads.filter(l => l.qualificationStatus === 'qualified').length,
      highly_qualified: leads.filter(l => l.qualificationStatus === 'highly_qualified').length,
      disqualified: leads.filter(l => l.qualificationStatus === 'disqualified').length,
    };
  }

  /** Calculate follow-up status distribution */
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

  /** Calculate source breakdown */
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

  /** Calculate top companies */
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

  /** Calculate lead trends by day */
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

  /** Calculate funnel metrics */
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

  /** Count leads by status */
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

  /** Calculate score distribution */
  private calculateScoreDistribution(leads: Lead[]) {
    const ranges = [
      { range: '0-20', min: 0, max: 20 },
      { range: '21-40', min: 21, max: 40 },
      { range: '41-60', min: 41, max: 60 },
      { range: '61-80', min: 61, max: 80 },
      { range: '81-100', min: 81, max: 100 },
    ];

    return ranges.map(({ range, min, max }) => ({
      range,
      count: leads.filter(l => l.leadScore >= min && l.leadScore <= max).length,
    }));
  }

  /** Calculate monthly trends */
  private calculateMonthlyTrends(leads: Lead[]) {
    const trendsMap = new Map<string, { leads: number; conversions: number }>();
    leads.forEach(l => {
      const month = l.capturedAt.toISOString().substring(0, 7); // YYYY-MM
      const existing = trendsMap.get(month) || { leads: 0, conversions: 0 };
      trendsMap.set(month, {
        leads: existing.leads + 1,
        conversions: existing.conversions + (l.followUpStatus === 'converted' ? 1 : 0),
      });
    });

    return Array.from(trendsMap.entries())
      .map(([month, data]) => ({
        month,
        leads: data.leads,
        conversions: data.conversions,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }
} 