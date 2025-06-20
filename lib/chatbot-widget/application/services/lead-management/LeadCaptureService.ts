/**
 * Lead Capture Service
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Lead capture orchestration only
 * - Orchestrate domain objects, no business logic
 * - Handle workflow coordination, delegate all business logic
 * - Use domain-specific errors with proper context
 * - Stay under 200-250 lines
 * - Publish domain events for cross-aggregate communication
 * - UPDATED: Removed LeadScoringService dependency - using API-only approach
 * - Lead scores are now provided externally from OpenAI API
 */

import { ILeadRepository } from '../../../domain/repositories/ILeadRepository';
import { IChatSessionRepository } from '../../../domain/repositories/IChatSessionRepository';
import { Lead } from '../../../domain/entities/Lead';
import { ContactInfo } from '../../../domain/value-objects/lead-management/ContactInfo';
import { QualificationData } from '../../../domain/value-objects/lead-management/QualificationData';
import { LeadSource } from '../../../domain/value-objects/lead-management/LeadSource';

import { LeadDto } from '../../dto/LeadDto';
import { LeadMapper } from '../../mappers/LeadMapper';

import { 
  LeadAlreadyExistsError, 
  ChatSessionNotFoundError 
} from '../../../domain/errors/LeadManagementErrors';

export interface LeadCaptureRequest {
  sessionId: string;
  organizationId: string;
  chatbotConfigId: string;
  contactInfo: ContactInfo;
  qualificationData: QualificationData;
  conversationSummary: string;
  source: LeadSource;
  leadScore?: number; // Optional - from OpenAI API
  qualificationStatus?: 'not_qualified' | 'qualified' | 'highly_qualified' | 'disqualified'; // Optional - from OpenAI API
}

export class LeadCaptureService {
  constructor(
    private readonly leadRepository: ILeadRepository,
    private readonly sessionRepository: IChatSessionRepository,
    private readonly leadMapper: LeadMapper
  ) {}

  /**
   * Capture a new lead from chat session
   * Orchestrates validation, creation, and persistence
   */
  async captureLead(request: LeadCaptureRequest): Promise<LeadDto> {
    // Validate session exists
    const session = await this.sessionRepository.findById(request.sessionId);
    if (!session) {
      throw new ChatSessionNotFoundError(request.sessionId, {
        operation: 'captureLead',
        organizationId: request.organizationId
      });
    }

    // Check for duplicate leads in this session
    const existingLead = await this.leadRepository.findBySessionId(request.sessionId);
    if (existingLead) {
      throw new LeadAlreadyExistsError(request.sessionId, {
        operation: 'captureLead',
        existingLeadId: existingLead.id,
        organizationId: request.organizationId
      });
    }

    // Create lead entity using domain factory with API-provided scores
    const lead = Lead.create(
      request.sessionId,
      request.organizationId,
      request.chatbotConfigId,
      request.contactInfo,
      request.qualificationData,
      request.source,
      request.conversationSummary,
      request.leadScore || 0, // Use API-provided score or default to 0
      request.qualificationStatus || 'not_qualified' // Use API-provided status or default
    );

    // Save lead through repository
    const savedLead = await this.leadRepository.save(lead);

    // Convert to DTO for application layer response
    return this.leadMapper.toDto(savedLead);
  }

  /**
   * Validate lead capture requirements
   * Business rules validation before capture
   */
  async validateCaptureRequirements(request: LeadCaptureRequest): Promise<boolean> {
    // Basic validation - more complex rules would be in domain service
    return request.qualificationData !== null && 
           request.contactInfo !== null &&
           request.conversationSummary.length > 0;
  }

  /**
   * Get capture eligibility for session
   * Checks if session is eligible for lead capture
   */
  async getCaptureEligibility(sessionId: string): Promise<{
    eligible: boolean;
    reason?: string;
    existingLeadId?: string;
  }> {
    // Check if session exists
    const session = await this.sessionRepository.findById(sessionId);
    if (!session) {
      return {
        eligible: false,
        reason: 'Session not found'
      };
    }

    // Check for existing lead
    const existingLead = await this.leadRepository.findBySessionId(sessionId);
    if (existingLead) {
      return {
        eligible: false,
        reason: 'Lead already captured for this session',
        existingLeadId: existingLead.id
      };
    }

    return { eligible: true };
  }
} 