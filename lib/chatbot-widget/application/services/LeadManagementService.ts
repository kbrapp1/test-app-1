/**
 * Lead Management Service
 * 
 * Application service that coordinates lead capture, scoring, and management operations.
 * Orchestrates domain services and repositories following DDD principles.
 * 
 * Responsibilities:
 * - Lead capture orchestration
 * - Lead scoring coordination
 * - Analytics preparation
 * - Lead lifecycle management
 */

import { ILeadRepository } from '../../domain/repositories/ILeadRepository';
import { IChatSessionRepository } from '../../domain/repositories/IChatSessionRepository';
import { IChatMessageRepository } from '../../domain/repositories/IChatMessageRepository';
import { LeadScoringService, QualificationStatus } from '../../domain/services/LeadScoringService';
import { FollowUpStatus } from '../../domain/entities/LeadLifecycleManager';
import { Lead } from '../../domain/entities/Lead';
import { QualificationData } from '../../domain/value-objects/QualificationData';
import { ContactInfo } from '../../domain/value-objects/ContactInfo';
import { LeadSource } from '../../domain/value-objects/LeadSource';
import { ChatSession } from '../../domain/entities/ChatSession';
import { ChatMessage } from '../../domain/entities/ChatMessage';

import { LeadDto, CreateLeadDto, UpdateLeadDto, LeadAnalyticsDto } from '../dto/LeadDto';
import { LeadMapper } from '../mappers/LeadMapper';

export interface LeadCaptureRequest {
  sessionId: string;
  organizationId: string;
  chatbotConfigId: string;
  contactInfo: ContactInfo;
  qualificationData: QualificationData;
  conversationSummary: string;
  source: LeadSource;
}

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

export class LeadManagementService {
  constructor(
    private readonly leadRepository: ILeadRepository,
    private readonly sessionRepository: IChatSessionRepository,
    private readonly messageRepository: IChatMessageRepository,
    private readonly leadScoringService: LeadScoringService,
    private readonly leadMapper: LeadMapper
  ) {}

  /**
   * Capture a new lead from chat session
   */
  async captureLead(request: LeadCaptureRequest): Promise<LeadDto> {
    // Validate session exists
    const session = await this.sessionRepository.findById(request.sessionId);
    if (!session) {
      throw new Error(`Chat session ${request.sessionId} not found`);
    }

    // Check for duplicate leads in this session
    const existingLead = await this.leadRepository.findBySessionId(request.sessionId);
    if (existingLead) {
      throw new Error(`Lead already captured for session ${request.sessionId}`);
    }

    // Create lead entity using domain factory
    const lead = Lead.create(
      request.sessionId,
      request.organizationId,
      request.chatbotConfigId,
      request.contactInfo,
      request.qualificationData,
      request.source,
      request.conversationSummary
    );

    // Save lead
    const savedLead = await this.leadRepository.save(lead);

    // Note: Lead captured status will be tracked through the lead repository
    // The session entity doesn't have markLeadCaptured method yet

    return this.leadMapper.toDto(savedLead);
  }

  /**
   * Get lead by ID
   */
  async getLeadById(id: string): Promise<LeadDto | null> {
    const lead = await this.leadRepository.findById(id);
    return lead ? this.leadMapper.toDto(lead) : null;
  }

  /**
   * Get lead by session ID
   */
  async getLeadBySessionId(sessionId: string): Promise<LeadDto | null> {
    const lead = await this.leadRepository.findBySessionId(sessionId);
    return lead ? this.leadMapper.toDto(lead) : null;
  }

  /**
   * Get paginated leads for organization
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
   * Update lead information
   */
  async updateLead(id: string, updates: UpdateLeadDto): Promise<LeadDto> {
    const lead = await this.leadRepository.findById(id);
    if (!lead) {
      throw new Error(`Lead ${id} not found`);
    }

    let updatedLead = lead;

    // Apply updates using domain methods - simplified for now
    // TODO: Implement proper DTO to domain conversion
    if (updates.followUpStatus) {
      updatedLead = updatedLead.updateFollowUpStatus(updates.followUpStatus);
    }

    if (updates.assignedTo !== undefined) {
      updatedLead = updates.assignedTo 
        ? updatedLead.assignTo(updates.assignedTo)
        : updatedLead.unassign();
    }

    if (updates.conversationSummary) {
      updatedLead = updatedLead.updateConversationSummary(updates.conversationSummary);
    }

    if (updates.tags) {
      // Handle tag updates - this is simplified, could be more sophisticated
      updates.tags.forEach(tag => {
        if (!updatedLead.tags.includes(tag)) {
          updatedLead = updatedLead.addTag(tag);
        }
      });
    }

    // Save updated lead
    const savedLead = await this.leadRepository.update(updatedLead);
    return this.leadMapper.toDto(savedLead);
  }

  /**
   * Recalculate lead score using current data
   */
  async recalculateLeadScore(id: string): Promise<LeadDto> {
    const lead = await this.leadRepository.findById(id);
    if (!lead) {
      throw new Error(`Lead ${id} not found`);
    }

    // Get session for enhanced scoring (context method not available yet)
    const session = await this.sessionRepository.findById(lead.sessionId);
    const sessionContext = undefined; // TODO: Implement getContext method in ChatSession

    // Calculate new score using domain service
    const scoringResult = LeadScoringService.calculateScore(
      lead.qualificationData
    );

    // Update lead with new score - this would require adding a method to Lead entity
    // For now, we'll create a new lead with updated score
    const updatedLead = Lead.fromPersistence({
      ...lead.toPlainObject(),
      leadScore: scoringResult.score,
      qualificationStatus: scoringResult.qualificationStatus,
      updatedAt: new Date(),
    });

    const savedLead = await this.leadRepository.update(updatedLead);
    return this.leadMapper.toDto(savedLead);
  }

  /**
   * Mark lead as contacted
   */
  async markAsContacted(id: string): Promise<LeadDto> {
    const lead = await this.leadRepository.findById(id);
    if (!lead) {
      throw new Error(`Lead ${id} not found`);
    }

    const updatedLead = lead.markAsContacted();
    const savedLead = await this.leadRepository.update(updatedLead);
    return this.leadMapper.toDto(savedLead);
  }

  /**
   * Mark lead as converted
   */
  async markAsConverted(id: string): Promise<LeadDto> {
    const lead = await this.leadRepository.findById(id);
    if (!lead) {
      throw new Error(`Lead ${id} not found`);
    }

    const updatedLead = lead.markAsConverted();
    const savedLead = await this.leadRepository.update(updatedLead);
    return this.leadMapper.toDto(savedLead);
  }

  /**
   * Mark lead as lost
   */
  async markAsLost(id: string): Promise<LeadDto> {
    const lead = await this.leadRepository.findById(id);
    if (!lead) {
      throw new Error(`Lead ${id} not found`);
    }

    const updatedLead = lead.markAsLost();
    const savedLead = await this.leadRepository.update(updatedLead);
    return this.leadMapper.toDto(savedLead);
  }

  /**
   * Assign lead to user
   */
  async assignLead(id: string, userId: string): Promise<LeadDto> {
    const lead = await this.leadRepository.findById(id);
    if (!lead) {
      throw new Error(`Lead ${id} not found`);
    }

    const updatedLead = lead.assignTo(userId);
    const savedLead = await this.leadRepository.update(updatedLead);
    return this.leadMapper.toDto(savedLead);
  }

  /**
   * Get analytics for organization
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
      leadsBySource: analytics.sourceBreakdown.reduce((acc, item) => {
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
   * Get leads for export
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
   * Search leads by query
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
   * Helper method to determine qualification status from score
   */
  private determineQualificationStatus(score: number): QualificationStatus {
    if (score >= 80) return 'highly_qualified';
    if (score >= 60) return 'qualified';
    if (score < 20) return 'disqualified';
    return 'not_qualified';
  }
} 