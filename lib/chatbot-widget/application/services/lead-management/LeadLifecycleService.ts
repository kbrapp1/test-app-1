/**
 * Lead Lifecycle Management Service
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Lead status and lifecycle management only
 * - Orchestrate domain objects, no business logic
 * - Handle workflow coordination, delegate all business logic
 * - Use domain-specific errors with proper context
 * - Stay under 200-250 lines
 * - Publish domain events for cross-aggregate communication
 */

import { ILeadRepository } from '../../../domain/repositories/ILeadRepository';
import { LeadScoringService } from '../../../domain/services/lead-management/LeadScoringService';
import { FollowUpStatus } from '../../../domain/entities/LeadLifecycleManager';
import { Lead } from '../../../domain/entities/Lead';

import { LeadDto, UpdateLeadDto } from '../../dto/LeadDto';
import { LeadMapper } from '../../mappers/LeadMapper';

import { 
  LeadNotFoundError, 
  InvalidLeadUpdateError 
} from '../../../domain/errors/LeadManagementErrors';

export class LeadLifecycleService {
  constructor(
    private readonly leadRepository: ILeadRepository,
    private readonly leadScoringService: LeadScoringService,
    private readonly leadMapper: LeadMapper
  ) {}

  /**
   * Update lead information
   * Orchestrates lead updates through domain methods
   */
  async updateLead(id: string, updates: UpdateLeadDto): Promise<LeadDto> {
    const lead = await this.leadRepository.findById(id);
    if (!lead) {
      throw new LeadNotFoundError(id, { operation: 'updateLead' });
    }

    let updatedLead = lead;

    try {
      // Apply updates using domain methods
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
        // Handle tag updates
        updates.tags.forEach(tag => {
          if (!updatedLead.tags.includes(tag)) {
            updatedLead = updatedLead.addTag(tag);
          }
        });
      }

      // Save updated lead
      const savedLead = await this.leadRepository.update(updatedLead);
      return this.leadMapper.toDto(savedLead);

    } catch (error) {
      throw new InvalidLeadUpdateError(
        error instanceof Error ? error.message : 'Unknown update error',
        { leadId: id, updates, originalError: error }
      );
    }
  }

  /**
   * Recalculate lead score using current data
   */
  async recalculateLeadScore(id: string): Promise<LeadDto> {
    const lead = await this.leadRepository.findById(id);
    if (!lead) {
      throw new LeadNotFoundError(id, { operation: 'recalculateScore' });
    }

    // Calculate new score using domain service
    const scoringResult = LeadScoringService.calculateScore(lead.qualificationData);

    // Create updated lead with new score using fromPersistence pattern
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
      throw new LeadNotFoundError(id, { operation: 'markAsContacted' });
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
      throw new LeadNotFoundError(id, { operation: 'markAsConverted' });
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
      throw new LeadNotFoundError(id, { operation: 'markAsLost' });
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
      throw new LeadNotFoundError(id, { operation: 'assignLead' });
    }

    const updatedLead = lead.assignTo(userId);
    const savedLead = await this.leadRepository.update(updatedLead);
    return this.leadMapper.toDto(savedLead);
  }

  /**
   * Unassign lead from user
   */
  async unassignLead(id: string): Promise<LeadDto> {
    const lead = await this.leadRepository.findById(id);
    if (!lead) {
      throw new LeadNotFoundError(id, { operation: 'unassignLead' });
    }

    const updatedLead = lead.unassign();
    const savedLead = await this.leadRepository.update(updatedLead);
    return this.leadMapper.toDto(savedLead);
  }

  /**
   * Add tag to lead
   */
  async addTag(id: string, tag: string): Promise<LeadDto> {
    const lead = await this.leadRepository.findById(id);
    if (!lead) {
      throw new LeadNotFoundError(id, { operation: 'addTag' });
    }

    const updatedLead = lead.addTag(tag);
    const savedLead = await this.leadRepository.update(updatedLead);
    return this.leadMapper.toDto(savedLead);
  }

  /**
   * Remove tag from lead
   */
  async removeTag(id: string, tag: string): Promise<LeadDto> {
    const lead = await this.leadRepository.findById(id);
    if (!lead) {
      throw new LeadNotFoundError(id, { operation: 'removeTag' });
    }

    const updatedLead = lead.removeTag(tag);
    const savedLead = await this.leadRepository.update(updatedLead);
    return this.leadMapper.toDto(savedLead);
  }
} 