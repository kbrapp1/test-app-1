/**
 * Lead Management Service - Coordinating Facade
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Coordinate focused lead services only
 * - Delegate all operations to specialized services
 * - No direct business logic, only coordination
 * - Stay under 200-250 lines through delegation
 * - Follow composition over inheritance principles
 * - Act as facade for complex lead operations
 */

import { LeadCaptureService, LeadCaptureRequest } from './LeadCaptureService';
import { LeadLifecycleService } from './LeadLifecycleService';
import { LeadQueryService, LeadSearchFilters, PaginatedLeadResult } from './LeadQueryService';

import { LeadDto, UpdateLeadDto, LeadAnalyticsDto } from '../dto/LeadDto';

export class LeadManagementService {
  constructor(
    private readonly leadCaptureService: LeadCaptureService,
    private readonly leadLifecycleService: LeadLifecycleService,
    private readonly leadQueryService: LeadQueryService
  ) {}

  // === LEAD CAPTURE OPERATIONS ===

  /**
   * Capture a new lead from chat session
   * Delegates to LeadCaptureService
   */
  async captureLead(request: LeadCaptureRequest): Promise<LeadDto> {
    return this.leadCaptureService.captureLead(request);
  }

  /**
   * Validate lead capture requirements
   * Delegates to LeadCaptureService
   */
  async validateCaptureRequirements(request: LeadCaptureRequest): Promise<boolean> {
    return this.leadCaptureService.validateCaptureRequirements(request);
  }

  /**
   * Get capture eligibility for session
   * Delegates to LeadCaptureService
   */
  async getCaptureEligibility(sessionId: string): Promise<{
    eligible: boolean;
    reason?: string;
    existingLeadId?: string;
  }> {
    return this.leadCaptureService.getCaptureEligibility(sessionId);
  }

  // === LEAD QUERY OPERATIONS ===

  /**
   * Get lead by ID
   * Delegates to LeadQueryService
   */
  async getLeadById(id: string, organizationId?: string): Promise<LeadDto | null> {
    return this.leadQueryService.getLeadById(id, organizationId);
  }

  /**
   * Get lead by session ID
   * Delegates to LeadQueryService
   */
  async getLeadBySessionId(sessionId: string): Promise<LeadDto | null> {
    return this.leadQueryService.getLeadBySessionId(sessionId);
  }

  /**
   * Get paginated leads for organization
   * Delegates to LeadQueryService
   */
  async getLeadsForOrganization(
    organizationId: string,
    page: number = 1,
    limit: number = 20,
    filters: LeadSearchFilters = {}
  ): Promise<PaginatedLeadResult> {
    return this.leadQueryService.getLeadsForOrganization(organizationId, page, limit, filters);
  }

  /**
   * Search leads by query
   * Delegates to LeadQueryService
   */
  async searchLeads(
    organizationId: string,
    query: string,
    limit: number = 20
  ): Promise<LeadDto[]> {
    return this.leadQueryService.searchLeads(organizationId, query, limit);
  }

  /**
   * Get leads requiring follow-up
   * Delegates to LeadQueryService
   */
  async getLeadsRequiringFollowUp(
    organizationId: string,
    daysSinceLastContact: number = 7
  ): Promise<LeadDto[]> {
    return this.leadQueryService.getLeadsRequiringFollowUp(organizationId, daysSinceLastContact);
  }

  /**
   * Get leads for export
   * Delegates to LeadQueryService
   */
  async getLeadsForExport(
    organizationId: string,
    filters: LeadSearchFilters = {}
  ): Promise<LeadDto[]> {
    return this.leadQueryService.getLeadsForExport(organizationId, filters);
  }

  /**
   * Get analytics for organization
   * Delegates to LeadQueryService
   */
  async getLeadAnalytics(
    organizationId: string,
    dateFrom: Date,
    dateTo: Date
  ): Promise<LeadAnalyticsDto> {
    return this.leadQueryService.getLeadAnalytics(organizationId, dateFrom, dateTo);
  }

  // === LEAD LIFECYCLE OPERATIONS ===

  /**
   * Update lead information
   * Delegates to LeadLifecycleService
   */
  async updateLead(id: string, updates: UpdateLeadDto): Promise<LeadDto> {
    return this.leadLifecycleService.updateLead(id, updates);
  }

  /**
   * Recalculate lead score
   * Delegates to LeadLifecycleService
   */
  async recalculateLeadScore(id: string): Promise<LeadDto> {
    return this.leadLifecycleService.recalculateLeadScore(id);
  }

  /**
   * Mark lead as contacted
   * Delegates to LeadLifecycleService
   */
  async markAsContacted(id: string): Promise<LeadDto> {
    return this.leadLifecycleService.markAsContacted(id);
  }

  /**
   * Mark lead as converted
   * Delegates to LeadLifecycleService
   */
  async markAsConverted(id: string): Promise<LeadDto> {
    return this.leadLifecycleService.markAsConverted(id);
  }

  /**
   * Mark lead as lost
   * Delegates to LeadLifecycleService
   */
  async markAsLost(id: string): Promise<LeadDto> {
    return this.leadLifecycleService.markAsLost(id);
  }

  /**
   * Assign lead to user
   * Delegates to LeadLifecycleService
   */
  async assignLead(id: string, userId: string): Promise<LeadDto> {
    return this.leadLifecycleService.assignLead(id, userId);
  }

  /**
   * Add tag to lead
   * Delegates to LeadLifecycleService
   */
  async addTag(id: string, tag: string): Promise<LeadDto> {
    return this.leadLifecycleService.addTag(id, tag);
  }

  /**
   * Remove tag from lead
   * Delegates to LeadLifecycleService
   */
  async removeTag(id: string, tag: string): Promise<LeadDto> {
    return this.leadLifecycleService.removeTag(id, tag);
  }
} 