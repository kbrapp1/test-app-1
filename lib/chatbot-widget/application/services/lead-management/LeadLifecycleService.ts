/**
 * Lead Lifecycle Service (Application)
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Lead lifecycle management only
 * - Orchestrate domain services without business logic
 * - Handle workflow coordination and state transitions
 * - Use domain-specific errors with proper context
 * - Stay under 200-250 lines
 * - UPDATED: Removed LeadScoringService dependency - using API-only approach
 */

import { Lead } from '../../../domain/entities/Lead';
import { LeadLifecycleManager, FollowUpStatus } from '../../../domain/entities/LeadLifecycleManager';
import { ILeadRepository } from '../../../domain/repositories/ILeadRepository';
import { BusinessRuleViolationError } from '../../../domain/errors/ChatbotWidgetDomainErrors';

export class LeadLifecycleService {
  constructor(
    private leadRepository: ILeadRepository
  ) {}

  /**
   * Update follow-up status for a lead
   */
  async updateFollowUpStatus(
    leadId: string,
    newStatus: FollowUpStatus,
    notes?: string,
    assignedTo?: string
  ): Promise<Lead> {
    const lead = await this.leadRepository.findById(leadId);
    if (!lead) {
      throw new BusinessRuleViolationError(`Lead not found: ${leadId}`);
    }

    // Use static methods from LeadLifecycleManager
    const currentState = {
      followUpStatus: lead.followUpStatus,
      assignedTo: lead.assignedTo,
      lastContactedAt: lead.lastContactedAt,
      updatedAt: lead.updatedAt
    };

    const newState = LeadLifecycleManager.updateFollowUpStatus(currentState, newStatus);
    
    // Update the lead with new state
    const updatedLead = lead.updateFollowUpStatus(newStatus);
    
    return await this.leadRepository.update(updatedLead);
  }

  /**
   * Assign lead to a team member
   */
  async assignLead(leadId: string, assignedTo: string): Promise<Lead> {
    const lead = await this.leadRepository.findById(leadId);
    if (!lead) {
      throw new BusinessRuleViolationError(`Lead not found: ${leadId}`);
    }

    const updatedLead = lead.assignTo(assignedTo);
    return await this.leadRepository.update(updatedLead);
  }

  /**
   * Add note to lead
   */
  async addNote(leadId: string, note: string, authorId: string, authorName?: string): Promise<Lead> {
    const lead = await this.leadRepository.findById(leadId);
    if (!lead) {
      throw new BusinessRuleViolationError(`Lead not found: ${leadId}`);
    }

    const updatedLead = lead.addNote(note, authorId, authorName || 'Unknown', true);
    return await this.leadRepository.update(updatedLead);
  }

  /**
   * Schedule follow-up for lead
   */
  async scheduleFollowUp(
    leadId: string,
    followUpDate: Date,
    followUpType: string,
    notes?: string
  ): Promise<Lead> {
    const lead = await this.leadRepository.findById(leadId);
    if (!lead) {
      throw new BusinessRuleViolationError(`Lead not found: ${leadId}`);
    }

    // This would need to be implemented on the Lead entity
    // For now, just update the lead
    return await this.leadRepository.update(lead);
  }

  /**
   * Mark lead as converted
   */
  async convertLead(leadId: string, conversionNotes?: string): Promise<Lead> {
    const lead = await this.leadRepository.findById(leadId);
    if (!lead) {
      throw new BusinessRuleViolationError(`Lead not found: ${leadId}`);
    }

    const updatedLead = lead.markAsConverted();
    return await this.leadRepository.update(updatedLead);
  }

  /**
   * Mark lead as lost
   */
  async markAsLost(leadId: string, reason?: string): Promise<Lead> {
    const lead = await this.leadRepository.findById(leadId);
    if (!lead) {
      throw new BusinessRuleViolationError(`Lead not found: ${leadId}`);
    }

    const updatedLead = lead.markAsLost();
    return await this.leadRepository.update(updatedLead);
  }

  /**
   * Get leads requiring follow-up
   */
  async getLeadsRequiringFollowUp(
    organizationId: string,
    daysSinceLastContact: number = 7
  ): Promise<Lead[]> {
    return await this.leadRepository.findRequiringFollowUp(organizationId, daysSinceLastContact);
  }

  /**
   * Bulk update lead statuses
   */
  async bulkUpdateStatus(
    leadIds: string[],
    newStatus: FollowUpStatus,
    assignedTo?: string
  ): Promise<number> {
    return await this.leadRepository.updateBulk(leadIds, {
      followUpStatus: newStatus,
      assignedTo
    });
  }

  /**
   * Get lead lifecycle analytics
   */
  async getLifecycleAnalytics(organizationId: string): Promise<{
    statusDistribution: Record<FollowUpStatus, number>;
    avgTimeToContact: number;
    avgTimeToConversion: number;
    conversionRate: number;
  }> {
    const leads = await this.leadRepository.findByOrganizationId(organizationId);
    
    const statusDistribution = leads.reduce((acc, lead) => {
      acc[lead.followUpStatus] = (acc[lead.followUpStatus] || 0) + 1;
      return acc;
    }, {} as Record<FollowUpStatus, number>);

    const convertedLeads = leads.filter(l => l.followUpStatus === 'converted');
    const totalLeads = leads.length;
    const conversionRate = totalLeads > 0 ? (convertedLeads.length / totalLeads) * 100 : 0;

    // Calculate average times (simplified - would need more detailed tracking in real implementation)
    const avgTimeToContact = 0; // Would calculate from actual contact timestamps
    const avgTimeToConversion = 0; // Would calculate from conversion timestamps

    return {
      statusDistribution,
      avgTimeToContact,
      avgTimeToConversion,
      conversionRate: Math.round(conversionRate * 100) / 100
    };
  }
} 