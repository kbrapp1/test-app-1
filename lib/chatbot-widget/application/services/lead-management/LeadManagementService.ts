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

import { LeadDto, UpdateLeadDto, LeadAnalyticsDto } from '../../dto/LeadDto';

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
   * Delegates to appropriate services based on update type
   */
  async updateLead(id: string, updates: UpdateLeadDto): Promise<LeadDto> {
    // Use the updateFollowUpStatus method if status is being updated
    if (updates.followUpStatus) {
      const updatedLead = await this.leadLifecycleService.updateFollowUpStatus(id, updates.followUpStatus);
      // Convert Lead to LeadDto through query service
      return this.leadQueryService.getLeadById(updatedLead.id) as Promise<LeadDto>;
    }

    // Use assignLead if assignedTo is being updated
    if (updates.assignedTo) {
      const updatedLead = await this.leadLifecycleService.assignLead(id, updates.assignedTo);
      return this.leadQueryService.getLeadById(updatedLead.id) as Promise<LeadDto>;
    }

    // For other updates, delegate to query service (which should handle updates)
    // This is a simplified approach - in a real implementation, we'd need a proper update service
    throw new Error('Complex lead updates not yet implemented - please use specific methods');
  }

  /**
   * Mark lead as contacted
   * Delegates to LeadLifecycleService
   */
  async markAsContacted(id: string): Promise<LeadDto> {
    await this.leadLifecycleService.updateFollowUpStatus(id, 'contacted');
    const result = await this.leadQueryService.getLeadById(id);
    if (!result) {
      throw new Error(`Lead ${id} not found after update`);
    }
    return result;
  }

  /**
   * Mark lead as converted
   * Delegates to LeadLifecycleService
   */
  async markAsConverted(id: string): Promise<LeadDto> {
    await this.leadLifecycleService.convertLead(id);
    const result = await this.leadQueryService.getLeadById(id);
    if (!result) {
      throw new Error(`Lead ${id} not found after conversion`);
    }
    return result;
  }

  /**
   * Mark lead as lost
   * Delegates to LeadLifecycleService
   */
  async markAsLost(id: string): Promise<LeadDto> {
    await this.leadLifecycleService.markAsLost(id);
    const result = await this.leadQueryService.getLeadById(id);
    if (!result) {
      throw new Error(`Lead ${id} not found after marking as lost`);
    }
    return result;
  }

  /**
   * Assign lead to user
   * Delegates to LeadLifecycleService
   */
  async assignLead(id: string, userId: string): Promise<LeadDto> {
    await this.leadLifecycleService.assignLead(id, userId);
    const result = await this.leadQueryService.getLeadById(id);
    if (!result) {
      throw new Error(`Lead ${id} not found after assignment`);
    }
    return result;
  }

  /**
   * Add tag to lead
   * Note: This functionality should be implemented in LeadLifecycleService
   */
  async addTag(_id: string, _tag: string): Promise<LeadDto> {
    // For now, throw an error indicating this needs to be implemented
    throw new Error('Add tag functionality not yet implemented - needs to be added to LeadLifecycleService');
  }

  /**
   * Remove tag from lead
   * Note: This functionality should be implemented in LeadLifecycleService
   */
  async removeTag(_id: string, _tag: string): Promise<LeadDto> {
    // For now, throw an error indicating this needs to be implemented
    throw new Error('Remove tag functionality not yet implemented - needs to be added to LeadLifecycleService');
  }
} 