/**
 * Lead Query Application Service
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Lead query orchestration only
 * - Orchestrate domain objects, no business logic
 * - Handle workflow coordination, delegate all business logic
 * - Use domain-specific errors with proper context
 * - Stay under 200-250 lines
 * - UPDATED: Removed LeadScoringService dependency - using API-only approach
 * - Lead scores are now provided externally from OpenAI API
 */

import { ILeadRepository } from '../../../domain/repositories/ILeadRepository';
import { Lead } from '../../../domain/entities/Lead';
import { LeadDto, LeadAnalyticsDto } from '../../dto/LeadDto';
import { LeadMapper } from '../../mappers/LeadMapper';
import { FollowUpStatus } from '../../../domain/entities/LeadLifecycleManager';

import { 
  LeadNotFoundError,
  LeadAccessDeniedError 
} from '../../../domain/errors/LeadManagementErrors';

// Define QualificationStatus locally since we removed LeadScoringService
export type QualificationStatus = 'not_qualified' | 'qualified' | 'highly_qualified' | 'disqualified';

export interface LeadSearchFilters {
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

export interface PaginatedLeadResult {
  leads: LeadDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class LeadQueryService {
  constructor(
    private readonly leadRepository: ILeadRepository,
    private readonly leadMapper: LeadMapper
  ) {}

  /**
   * Get lead by ID with access validation
   */
  async getLeadById(id: string, organizationId?: string): Promise<LeadDto | null> {
    const lead = await this.leadRepository.findById(id);
    
    if (!lead) {
      return null;
    }

    // Validate access if organization context provided
    if (organizationId && lead.organizationId !== organizationId) {
      throw new LeadAccessDeniedError(id, organizationId, { 
        operation: 'getLeadById',
        leadOrganizationId: lead.organizationId 
      });
    }

    return this.leadMapper.toDto(lead);
  }

  /**
   * Get lead by session ID
   */
  async getLeadBySessionId(sessionId: string): Promise<LeadDto | null> {
    const lead = await this.leadRepository.findBySessionId(sessionId);
    return lead ? this.leadMapper.toDto(lead) : null;
  }

  /**
   * Get paginated leads for organization with filtering
   */
  async getLeadsForOrganization(
    organizationId: string,
    page: number = 1,
    limit: number = 20,
    filters: LeadSearchFilters = {}
  ): Promise<PaginatedLeadResult> {
    const result = await this.leadRepository.findByOrganizationIdWithPagination(
      organizationId,
      page,
      limit,
      {
        qualificationStatus: filters.qualificationStatus,
        followUpStatus: filters.followUpStatus,
        assignedTo: filters.assignedTo,
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
        minScore: filters.minScore,
        maxScore: filters.maxScore,
        tags: filters.tags,
        searchTerm: filters.searchTerm,
      }
    );

    return {
      leads: result.leads.map(lead => this.leadMapper.toDto(lead)),
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
  }

  /**
   * Search leads by query text
   */
  async searchLeads(
    organizationId: string,
    query: string,
    limit: number = 20
  ): Promise<LeadDto[]> {
    const leads = await this.leadRepository.searchByQuery(organizationId, query, limit);
    return leads.map(lead => this.leadMapper.toDto(lead));
  }

  /**
   * Get leads requiring follow-up
   */
  async getLeadsRequiringFollowUp(
    organizationId: string,
    daysSinceLastContact: number = 7
  ): Promise<LeadDto[]> {
    const leads = await this.leadRepository.findRequiringFollowUp(
      organizationId,
      daysSinceLastContact
    );

    return leads.map(lead => this.leadMapper.toDto(lead));
  }

  /**
   * Get leads for export with filtering
   */
  async getLeadsForExport(
    organizationId: string,
    filters: LeadSearchFilters = {}
  ): Promise<LeadDto[]> {
    const leads = await this.leadRepository.findForExport(organizationId, {
      qualificationStatus: filters.qualificationStatus,
      followUpStatus: filters.followUpStatus,
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
    });

    return leads.map(lead => this.leadMapper.toDto(lead));
  }

  /**
   * Get analytics for organization within date range
   */
  async getLeadAnalytics(
    organizationId: string,
    dateFrom: Date,
    dateTo: Date
  ): Promise<LeadAnalyticsDto> {
    const analytics = await this.leadRepository.getAnalytics(organizationId, dateFrom, dateTo);

    return {
      totalLeads: analytics.totalLeads,
      qualifiedLeads: analytics.qualifiedLeads + analytics.highlyQualifiedLeads,
      conversionRate: analytics.conversionRate,
      averageScore: analytics.avgLeadScore,
      leadsBySource: analytics.sourceBreakdown.reduce((acc: Record<string, number>, item: any) => {
        acc[item.source] = item.count;
        return acc;
      }, {} as Record<string, number>),
      leadsByStatus: {
        new: analytics.followUpDistribution.new,
        contacted: analytics.followUpDistribution.contacted,
        in_progress: analytics.followUpDistribution.in_progress,
        converted: analytics.followUpDistribution.converted,
        lost: analytics.followUpDistribution.lost,
        nurturing: analytics.followUpDistribution.nurturing,
      },
      topPerformingChatbots: [], // Would need additional repository method
    };
  }

  /**
   * Get lead count by filters for quick metrics
   */
  async getLeadCount(
    organizationId: string,
    filters: LeadSearchFilters = {}
  ): Promise<number> {
    // This would be a more efficient count-only query
    const result = await this.leadRepository.findByOrganizationIdWithPagination(
      organizationId,
      1,
      1,
      filters
    );
    
    return result.total;
  }

  /**
   * Get recent leads for organization
   */
  async getRecentLeads(
    organizationId: string,
    limit: number = 10
  ): Promise<LeadDto[]> {
    const result = await this.leadRepository.findByOrganizationIdWithPagination(
      organizationId,
      1,
      limit,
      { 
        dateFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
      }
    );

    return result.leads.map((lead: Lead) => this.leadMapper.toDto(lead));
  }
} 